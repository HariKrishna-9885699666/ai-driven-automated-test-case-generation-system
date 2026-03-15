// ── Supported languages (Python + JavaScript only) ────────────────────────────
export const LANGUAGES = ['Python', 'JavaScript']

// Map each language to its test framework
export const FRAMEWORK_FOR = {
  Python:     'pytest',
  JavaScript: 'Jest',
}

// Map each language to the file extension used when saving generated tests
export const EXT_FOR = {
  Python:     'py',
  JavaScript: 'test.js',
}

// Map each language to the syntax-highlighter language token
export const HIGHLIGHT_FOR = {
  Python:     'python',
  JavaScript: 'javascript',
}

// Default Groq model used before the providers API responds
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

// Backend API base (proxied via Vite)
export const API_BASE = '/api'

// Max tests to request per generation
export const MAX_TESTS = 15
