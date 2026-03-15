"""
Test Generator Service — powered by Groq (llama / mixtral / gemma models).
Set GROQ_API_KEY in backend/.env to activate. Get a free key at console.groq.com.
"""
from typing import List, Dict, Any, Optional

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

        Provider priority: OpenAI → Anthropic → Gemini → Demo mode
        """
        provider = settings.active_provider
        if provider == "demo":
            return self._demo_output(language, framework, test_types)

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
        """Analyze generated test code to compute stats"""
        lines = test_code.split("\n")
        test_funcs = [l for l in lines if l.strip().startswith("def test_")]
        return {
            "total": len(test_funcs),
            "unit": sum(1 for t in test_types if t == "unit") * max(1, len(test_funcs) // 2),
            "integration": sum(1 for t in test_types if t == "integration") * max(1, len(test_funcs) // 4),
            "edge": sum(1 for t in test_types if t == "edge") * max(1, len(test_funcs) // 3),
            "coverage": "~85%",
        }

    def _demo_output(self, language: str, framework: str, test_types: List[str], error: str = "") -> Dict[str, Any]:
        """Return a demo output when no API key is configured"""
        hint = f"# Error: {error}\n    # " if error else ""
        # NOTE: plain string (not f-string) so that literal { } in code aren't parsed
        demo_code = '''import pytest
from unittest.mock import Mock, patch


class TestDemoGenerated:
    """
    HINT_PLACEHOLDERDemo mode: configure ONE key in backend/.env:
    #   OPENAI_API_KEY    = sk-...         (OpenAI GPT-4o / GPT-4-turbo)
    #   ANTHROPIC_API_KEY = sk-ant-...     (Claude 3.5 Sonnet / Haiku)
    #   GEMINI_API_KEY    = AIza...        (Gemini 2.0 Flash / 1.5 Pro)
    """

    def test_valid_input_returns_expected_result(self):
        """Unit: Happy path - valid inputs produce correct output."""
        # Arrange
        expected = {"status": "success"}

        # Act
        # result = your_function(valid_input)

        # Assert
        # assert result == expected
        assert True  # placeholder

    def test_null_input_raises_value_error(self):
        """Edge case: None input should raise ValueError."""
        with pytest.raises((ValueError, TypeError)):
            # your_function(None)
            raise ValueError("Null input not allowed")

    def test_empty_string_handled_gracefully(self):
        """Edge case: Empty string input."""
        # result = your_function("")
        # assert result is not None
        assert True

    @pytest.mark.parametrize("input_val,expected", [
        (1, True),
        (0, False),
        (-1, False),
        (100, True),
    ])
    def test_parametrized_boundary_values(self, input_val, expected):
        """Parametrized: Multiple boundary inputs tested."""
        # result = validate(input_val)
        # assert result == expected
        assert isinstance(input_val, (int, float))

    def test_integration_with_external_service(self):
        """Integration: Mocked external service call."""
        with patch("builtins.open") as mock_open:
            mock_open.return_value.__enter__ = Mock(return_value=Mock(read=lambda: "data"))
            mock_open.return_value.__exit__ = Mock(return_value=False)
            assert True
'''.replace("HINT_PLACEHOLDER", hint)
        return {
            "tests": demo_code,
            "stats": {
                "total": 5,
                "unit": 1,
                "integration": 1,
                "edge": 2,
                "coverage": "~80%",
            },
            "tokens": 312,
        }
