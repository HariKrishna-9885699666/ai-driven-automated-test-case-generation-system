import {
  FileText, Database, Brain, Zap, BarChart3,
  Code2, ArrowRight, CheckCircle2, BookOpen,
  Server, Layers, ChevronRight, GitBranch, Cpu,
} from 'lucide-react'
import Card from '../components/common/Card'
import { Link } from 'react-router-dom'

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Collect Software Documentation & Code',
    color: 'from-blue-500 to-cyan-500',
    description:
      'Gather all available source code files, API documentation, requirement specifications, and existing test cases from your software repository.',
    details: [
      'Support for Python, JavaScript, TypeScript, Java, Go, Rust, C#',
      'Parse docstrings, inline comments, and README files',
      'Extract function signatures, class definitions, and type hints',
      'Import existing test cases as few-shot examples for the LLM',
    ],
    code: `# Supported file types collected:
# .py  .js  .ts  .java  .go  .rs  .cs
# .md  .rst  .txt  .pdf  .json  .yaml

from code_collector import RepositoryScanner

scanner = RepositoryScanner(repo_path="./my_project")
corpus = scanner.collect(
    include_tests=True,
    include_docs=True,
    file_extensions=[".py", ".md", ".json"]
)
print(f"Collected {len(corpus)} files")`,
  },
  {
    number: '02',
    icon: Database,
    title: 'Preprocess & Build RAG Index',
    color: 'from-violet-500 to-purple-500',
    description:
      'Preprocess the collected data by chunking code at function-level, normalizing formatting, and generating semantic embeddings stored in a vector database.',
    details: [
      'Chunk code into function/class-level segments with surrounding context',
      'Generate embeddings using code-specialized models (CodeBERT, text-embedding-ada)',
      'Store in ChromaDB / FAISS / Pinecone vector store',
      'Build inverted index for keyword-augmented retrieval',
    ],
    code: `from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512, chunk_overlap=128
)
chunks = splitter.split_documents(corpus)

# Create vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
print(f"Indexed {len(chunks)} chunks")`,
  },
  {
    number: '03',
    icon: Brain,
    title: 'Fine-Tune an LLM on Your Codebase',
    color: 'from-pink-500 to-rose-500',
    description:
      'Fine-tune a code-capable language model (CodeLlama, GPT-3.5, Mistral) using LoRA/QLoRA on instruction-tuning pairs of code → test cases.',
    details: [
      'Create instruction-response pairs: {"input": code, "output": tests}',
      'Apply LoRA (Low-Rank Adaptation) for efficient fine-tuning',
      'Train with gradient checkpointing and bf16/fp16 mixed precision',
      'Monitor training/validation loss and early stopping',
    ],
    code: `from transformers import AutoModelForCausalLM, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

# LoRA configuration
lora_config = LoraConfig(
    r=16, lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05, bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(base_model, lora_config)

trainer = SFTTrainer(
    model=model,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    args=TrainingArguments(
        num_train_epochs=10,
        per_device_train_batch_size=4,
        learning_rate=2e-4,
    ),
    dataset_text_field="text"
)
trainer.train()`,
  },
  {
    number: '04',
    icon: Layers,
    title: 'RAG-Augmented Test Generation',
    color: 'from-emerald-500 to-teal-500',
    description:
      'When generating tests for new code, the RAG system retrieves the most relevant existing test cases and code snippets to provide rich, contextual examples to the LLM.',
    details: [
      'Query vector DB with the new code function as embedding',
      'Retrieve top-k most similar existing tests (k=3–5)',
      'Construct few-shot prompt with retrieved context',
      'LLM generates tests guided by concrete examples',
    ],
    code: `# RAG retrieval + generation pipeline
def generate_tests_with_rag(code_snippet: str) -> str:
    # Step 1: Retrieve relevant context
    retriever = vectorstore.as_retriever(
        search_type="mmr", search_kwargs={"k": 4}
    )
    context_docs = retriever.invoke(code_snippet)

    # Step 2: Build augmented prompt
    context = "\\n---\\n".join(d.page_content for d in context_docs)
    
    prompt = f"""You are an expert test engineer.
Context from codebase:
{context}

Generate comprehensive pytest tests for:
{code_snippet}

Tests (include unit, integration, edge cases):"""
    
    # Step 3: Generate with fine-tuned LLM
    response = llm.invoke(prompt)
    return response.content`,
  },
  {
    number: '05',
    icon: Zap,
    title: 'Generate Diverse Test Cases',
    color: 'from-amber-500 to-orange-500',
    description:
      'Automatically produce comprehensive test suites covering unit tests, integration tests, edge cases (null, overflow, empty inputs), and parametrized scenarios.',
    details: [
      'Unit tests: Isolated tests for individual functions with mocking',
      'Integration tests: Multi-component interaction flows',
      'Edge cases: Boundary values, null inputs, overflow, type errors',
      'Parametrized: Multiple inputs tested in a single test function',
    ],
    code: `# Generated test types breakdown
generated_tests = {
    "unit": [
        "test_valid_input_returns_correct_output",
        "test_function_calls_dependency_once",
    ],
    "integration": [
        "test_full_payment_pipeline_with_database",
        "test_api_to_service_to_db_flow",
    ],
    "edge_cases": [
        "test_zero_amount_raises_value_error",
        "test_null_input_handled_gracefully",
        "test_max_integer_overflow_behavior",
        "test_unicode_string_in_name_field",
    ],
    "parametrized": [
        "@pytest.mark.parametrize('currency', ['USD','EUR','GBP'])",
    ]
}`,
  },
  {
    number: '06',
    icon: BarChart3,
    title: 'Evaluate with Coverage & Bug Detection',
    color: 'from-cyan-500 to-blue-500',
    description:
      'Run the generated test suite, measure code coverage (line, branch, path), analyze quality metrics, and use mutation testing to verify test effectiveness.',
    details: [
      'Run tests with pytest + pytest-cov for line/branch coverage',
      'Mutation testing with mutmut to verify test strength',
      'Compute BLEU / CodeBLEU for generation quality',
      'Track pass@k metric: probability any of k tests pass',
    ],
    code: `# evaluation/coverage_runner.py
import subprocess, json

def run_coverage(test_file: str, source_dir: str) -> dict:
    result = subprocess.run([
        "pytest", test_file,
        f"--cov={source_dir}",
        "--cov-report=json:coverage.json",
        "--cov-branch", "-q"
    ], capture_output=True, text=True)
    
    with open("coverage.json") as f:
        cov = json.load(f)
    
    return {
        "line_coverage": cov["totals"]["percent_covered"],
        "branch_coverage": cov["totals"]["covered_branches"],
        "pass_rate": parse_pass_rate(result.stdout),
        "bugs_detected": count_failures(result.stdout)
    }`,
  },
]

const architecture = [
  { layer: 'Frontend', items: ['React 19', 'TailwindCSS', 'React Query', 'Recharts'], color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
  { layer: 'API Layer', items: ['FastAPI', 'WebSocket', 'Pydantic', 'REST'], color: 'bg-violet-500/20 border-violet-500/30 text-violet-300' },
  { layer: 'LLM Engine', items: ['CodeLlama', 'GPT-4', 'LoRA Fine-Tuning', 'HuggingFace'], color: 'bg-pink-500/20 border-pink-500/30 text-pink-300' },
  { layer: 'RAG System', items: ['LangChain', 'ChromaDB', 'Embeddings', 'MMR Retrieval'], color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
  { layer: 'Evaluation', items: ['pytest-cov', 'mutmut', 'CodeBLEU', 'pass@k'], color: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
]

export default function HowItWorks() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-4">
          <Cpu size={15} />
          Complete System Architecture
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          How AI Test Generation{' '}
          <span className="gradient-text">Works</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
          A step-by-step walkthrough of the AI-driven pipeline — from raw code and documentation
          to comprehensive, high-quality test suites using LLMs and Retrieval-Augmented Generation.
        </p>
      </div>

      {/* Pipeline Flow */}
      <Card className="p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <GitBranch size={16} className="text-primary-400" />
          Full Pipeline Overview
        </h3>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { icon: FileText, label: 'Docs & Code', color: 'text-blue-400' },
            { icon: Database, label: 'RAG Index', color: 'text-violet-400' },
            { icon: Brain, label: 'Fine-Tune LLM', color: 'text-pink-400' },
            { icon: Layers, label: 'RAG Retrieval', color: 'text-emerald-400' },
            { icon: Zap, label: 'Generate Tests', color: 'text-amber-400' },
            { icon: BarChart3, label: 'Evaluate', color: 'text-cyan-400' },
          ].map(({ icon: Icon, label, color }, i, arr) => (
            <div key={label} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/3 border border-white/8 min-w-[80px] text-center">
                <Icon size={18} className={color} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} className="text-slate-700 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Steps */}
      {steps.map((step) => {
        const Icon = step.icon
        return (
          <div key={step.number} className="grid lg:grid-cols-2 gap-5">
            {/* Step Info */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-600 font-mono mb-1">STEP {step.number}</div>
                  <h3 className="text-white font-bold text-lg leading-tight">{step.title}</h3>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.description}</p>

              <div className="space-y-2">
                {step.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400">{d}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Code Example */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Code2 size={13} className="text-slate-500" />
                <span className="text-xs text-slate-500 font-mono">example.py</span>
                <div className="ml-auto flex gap-1.5">
                  {['bg-red-500', 'bg-yellow-500', 'bg-green-500'].map((c) => (
                    <div key={c} className={`w-2.5 h-2.5 rounded-full ${c} opacity-60`} />
                  ))}
                </div>
              </div>
              <pre className="p-4 text-xs text-slate-300 font-mono leading-relaxed overflow-auto max-h-72">
                <code>{step.code}</code>
              </pre>
            </Card>
          </div>
        )
      })}

      {/* Tech Stack */}
      <Card className="p-6">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-5">
          <Server size={16} className="text-primary-400" />
          Technology Stack
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {architecture.map(({ layer, items, color }) => (
            <div
              key={layer}
              className={`p-4 rounded-xl border ${color}`}
            >
              <p className="font-semibold text-sm mb-2">{layer}</p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item} className="text-xs opacity-80 flex items-center gap-1.5">
                    <ChevronRight size={10} className="opacity-60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-6 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))' }}
      >
        <h3 className="text-white font-bold text-xl mb-2">Ready to Generate Tests?</h3>
        <p className="text-slate-400 text-sm mb-5">
          Start with your code or documentation and let AI create comprehensive test suites.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/generate" className="btn-primary flex items-center gap-2">
            <Zap size={15} /> Generate Tests Now
          </Link>
          <Link to="/documents" className="btn-secondary flex items-center gap-2">
            <BookOpen size={15} /> Upload Documents
          </Link>
        </div>
      </Card>
    </div>
  )
}
