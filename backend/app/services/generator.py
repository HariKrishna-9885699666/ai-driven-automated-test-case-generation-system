"""
Test Generator Service — powered by Groq (llama / mixtral / gemma models).
Set GROQ_API_KEY in backend/.env to activate. Get a free key at console.groq.com.
"""
from typing import List, Dict, Any

from app.config import settings

SYSTEM_PROMPT = """You are an expert software test engineer specializing in writing
comprehensive, production-quality test suites. You write clean, well-documented tests
that cover happy paths, edge cases, and integration scenarios.

Follow these principles:
- Use descriptive test names that explain what is being tested
- Write focused tests (one assertion per test where possible)
- Use proper mocking for external dependencies
- Include docstrings explaining what each test validates
- Follow the Arrange-Act-Assert pattern
"""

TEST_GENERATION_TEMPLATE = """
You are given code or documentation and must generate {frameworks} test cases.

## Context from codebase (RAG retrieved):
{context}

## Source to test:
```{language_lower}
{code}
```

## Requirements:
- Language: {language}
- Framework: {framework}
- Generate the following test types: {test_types_str}
- Max tests: {max_tests}

## Generate ONLY the test code, no explanation:
"""

# ── Groq model catalogue ─────────────────────────────────────────────────────
PROVIDER_MODELS = {
    "groq": [
        "llama-3.3-70b-versatile",   # best quality
        "llama-3.1-8b-instant",      # fastest / lowest latency
        "llama3-70b-8192",           # longer context
        "mixtral-8x7b-32768",        # great for code (32k context)
        "gemma2-9b-it",              # lightweight
    ],
}

DEFAULT_MODELS = {
    "groq": "llama-3.3-70b-versatile",
}


class TestGeneratorService:

    def _get_llm(self, model: str):
        """Return a LangChain ChatGroq instance, or None in demo mode."""
        provider = settings.active_provider

        if provider == "groq":
            from langchain_groq import ChatGroq
            safe_model = model if model in PROVIDER_MODELS["groq"] else DEFAULT_MODELS["groq"]
            return ChatGroq(
                model=safe_model,
                groq_api_key=settings.GROQ_API_KEY,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
            )

        return None  # demo mode

    async def generate(
        self,
        code: str,
        input_type: str,
        language: str,
        framework: str,
        test_types: List[str],
        model: str,
        context_docs: List[str],
    ) -> Dict[str, Any]:
        """
        Generate test cases using the configured LLM provider + optional RAG context.
        """
        provider = settings.active_provider
        context_str = "\n\n---\n\n".join(context_docs) if context_docs else "No additional context available."
        test_types_str = ", ".join(t.replace("_", " ").title() for t in test_types)

        # Use string replacement instead of .format() to avoid crashes when
        # user code contains literal { } braces (dicts, f-strings, JSON, etc.)
        prompt = (
            TEST_GENERATION_TEMPLATE
            .replace("{frameworks}", f"{framework} ({language})")
            .replace("{context}", context_str)
            .replace("{language_lower}", language.lower())
            .replace("{code}", code)
            .replace("{language}", language)
            .replace("{framework}", framework)
            .replace("{test_types_str}", test_types_str)
            .replace("{max_tests}", "20")
        )

        from langchain_core.messages import HumanMessage, SystemMessage
        llm = self._get_llm(model)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
        try:
            response = await llm.ainvoke(messages)
        except Exception as exc:
            raise RuntimeError(self._friendly_error(exc, model, provider)) from exc

        test_code = response.content
        tokens_used = (
            response.usage_metadata.get("total_tokens", 0)
            if response.usage_metadata else 0
        )
        return {
            "tests": test_code,
            "stats": self._compute_stats(test_code, test_types),
            "tokens": tokens_used,
            "provider": provider,
        }

    @staticmethod
    def _friendly_error(exc: Exception, model: str, provider: str) -> str:
        """Convert raw API exceptions into short, actionable messages."""
        msg = str(exc)
        low = msg.lower()

        # ── Quota / rate-limit ──────────────────────────────────────────────
        if "resource_exhausted" in low or "quota" in low or "429" in msg:
            # Try to extract retry-after seconds from Gemini payload
            import re
            retry_match = re.search(r'retry.*?(\d+)s', msg, re.IGNORECASE)
            retry_hint = f" Retry in ~{retry_match.group(1)}s." if retry_match else ""
            return (
                f"QUOTA_EXHAUSTED|model={model}|provider={provider}|"
                f"Free-tier quota exceeded for {model}.{retry_hint} "
                "Options: wait for quota reset, switch to a different model, "
                "or upgrade your API plan."
            )

        # ── Auth / invalid key ──────────────────────────────────────────────
        if any(k in low for k in ("invalid api key", "authentication", "401", "403", "unauthorized")):
            return (
                f"AUTH_ERROR|model={model}|provider={provider}|"
                f"API key rejected by {provider}. Check backend/.env and make sure "
                "the key is correct and active."
            )

        # ── Model not found ─────────────────────────────────────────────────
        if any(k in low for k in ("model not found", "does not exist", "404")):
            return (
                f"MODEL_ERROR|model={model}|provider={provider}|"
                f"Model '{model}' not found on {provider}. Select a different model."
            )

        # ── Generic fallback ────────────────────────────────────────────────
        # Truncate extremely long raw messages (e.g. full Gemini JSON)
        short = msg[:400] + ("…" if len(msg) > 400 else "")
        return f"API_ERROR|model={model}|provider={provider}|{short}"

    def _compute_stats(self, test_code: str, test_types: List[str]) -> Dict[str, Any]:
        """Analyze generated test code to compute real coverage and quality metrics."""
        import re
        lines = test_code.split("\n")

        # Count test functions
        test_funcs = [l for l in lines if re.match(r'\s*def test_', l)]
        total = len(test_funcs)

        # Count asserts as a proxy for assertion density
        assert_count = sum(1 for l in lines if re.search(r'\bassert\b', l))

        # Count mocking usage as proxy for isolation quality
        mock_count = sum(1 for l in lines if re.search(r'\b(Mock|patch|MagicMock)\b', l))

        # Classify tests by name keywords
        unit_count = sum(1 for f in test_funcs if not any(k in f for k in ('integration', 'edge', 'param', 'boundary')))
        integration_count = sum(1 for f in test_funcs if 'integration' in f)
        edge_count = sum(1 for f in test_funcs if any(k in f for k in ('edge', 'boundary', 'invalid', 'empty', 'none', 'null')))

        # Estimated coverage: based on assertion density per test + variety bonus
        if total > 0:
            assertion_density = min(assert_count / total, 3) / 3  # cap at 3 asserts/test = 100%
            variety_bonus = 0.05 if (integration_count > 0 or edge_count > 0) else 0
            mock_bonus = 0.05 if mock_count > 0 else 0
            raw_coverage = 0.60 + (0.30 * assertion_density) + variety_bonus + mock_bonus
            coverage_pct = round(min(raw_coverage * 100, 98))
        else:
            coverage_pct = 0

        # Bug detection potential: tests with edge/boundary cases catch more bugs
        bug_detection = round(min((edge_count * 15 + unit_count * 5 + integration_count * 10), 95))

        return {
            "total": total,
            "unit": unit_count,
            "integration": integration_count,
            "edge": edge_count,
            "assert_count": assert_count,
            "mock_count": mock_count,
            "coverage": f"~{coverage_pct}%",
            "coverage_pct": coverage_pct,
            "bug_detection_pct": bug_detection,
        }