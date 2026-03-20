import { useState, useEffect } from 'react'
import {
  Zap, Code2, Copy, Download,
  CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Terminal,
  Database, Bot, FlaskConical,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { generateTests, getProviders } from '../services/api'
import {
  LANGUAGES, FRAMEWORK_FOR, EXT_FOR, HIGHLIGHT_FOR, DEFAULT_MODEL, MAX_TESTS,
} from '../utils/constants'
import { parseError, copyToClipboard, downloadFile, stripCodeFences } from '../utils/funcUtils'

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Generate() {
  const [inputCode, setInputCode]     = useState('')
  const [language, setLanguage]       = useState('Python')
  const [loading, setLoading]         = useState(false)
  const [generated, setGenerated]     = useState(null)
  const [error, setError]             = useState(null)
  const [activeModel, setActiveModel] = useState(DEFAULT_MODEL)

  const framework = FRAMEWORK_FOR[language]

  useEffect(() => {
    getProviders()
      .then((d) => setActiveModel(d.active_model || 'llama-3.3-70b-versatile'))
      .catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!inputCode.trim()) { toast.error('Paste your code first'); return }

    setLoading(true)
    setGenerated(null)
    setError(null)

    try {
      const data = await generateTests({
        code: inputCode,
        input_type: 'code',
        language,
        framework,
        test_types: ['unit'],
        model: activeModel,
        use_rag: true,
        max_tests: MAX_TESTS,
      })

      if (data.status === 'failed' || data.error) {
        throw new Error(data.error || 'Generation failed')
      }

      const stats = data.stats || { total: 0, unit: 0, coverage: '—' }
      setGenerated({
        code: stripCodeFences(data.code || ''),
        stats,
        tokens: data.tokens_used || 0,
      })

      // Save to generation history for Analytics
      try {
        const history = JSON.parse(localStorage.getItem('testgen_history') || '[]')
        history.unshift({
          id: data.job_id || Date.now().toString(),
          timestamp: new Date().toISOString(),
          language,
          framework,
          stats,
          tokens: data.tokens_used || 0,
        })
        localStorage.setItem('testgen_history', JSON.stringify(history.slice(0, 100)))
      } catch (_) {}

      toast.success('Tests generated!')
    } catch (err) {
      setError(err.message || 'Backend error is port 8000 running?')
      toast.error('Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const copyOutput    = () => copyToClipboard(generated?.code || '')
  const downloadOutput = () => downloadFile(generated?.code || '', `generated_tests.${EXT_FOR[language]}`)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-4">
          <Card className="p-5">
            {/* Language pills */}
            <div className="flex gap-2 mb-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setGenerated(null); setError(null) }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    language === lang
                      ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Code textarea tall */}
            <textarea
              className="input-field resize-none font-mono text-xs leading-relaxed"
              style={{ height: '460px' }}
              placeholder={`Paste your ${language} code here`}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              spellCheck={false}
            />

            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-600 text-xs">
                {inputCode.length.toLocaleString()} chars
              </span>
            </div>
          </Card>

          {/* Fixed config read-only */}
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-600 text-xs font-medium flex items-center gap-1">
                  <FlaskConical size={11} /> Framework
                </span>
                <span className="text-xs font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-2.5 py-1.5 rounded-lg w-fit">
                  {framework}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-600 text-xs font-medium flex items-center gap-1">
                  <Bot size={11} /> Model
                </span>
                <span className="text-xs font-semibold text-blue-300 bg-blue-500/15 border border-blue-500/25 px-2.5 py-1.5 rounded-lg w-fit truncate max-w-full" title={activeModel}>
                  {activeModel}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-600 text-xs font-medium flex items-center gap-1">
                  <Database size={11} /> RAG Context
                </span>
                <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1.5 rounded-lg w-fit flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                  Enabled
                </span>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleGenerate}
            className="w-full justify-center font-semibold"
          >
            {!loading && <Zap size={16} />}
            {loading ? 'Generating' : 'Generate Unit Tests'}
          </Button>
        </div>

        <div className="space-y-4">

          {/* Loading */}
          {loading && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                    <Loader2 size={28} className="text-primary-400 animate-spin" />
                  </div>
                  <div className="absolute -inset-2 rounded-2xl border-2 border-primary-500/20 animate-ping" />
                </div>
                <h4 className="text-white font-semibold mb-1.5">
                  Generating {framework} Unit Tests
                </h4>
                <p className="text-slate-500 text-sm max-w-xs">
                  Analyzing {language} code with {activeModel}
                </p>
                <div className="flex flex-col gap-2.5 mt-5 w-full max-w-xs text-left">
                  {[
                    'Parsing source code',
                    'Fetching RAG context',
                    `Calling ${activeModel}`,
                    'Formatting output',
                  ].map((label, i) => (
                    <div key={label} className="flex items-center gap-2.5 text-xs">
                      {i < 2
                        ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                        : <Loader2 size={14} className="text-primary-400 animate-spin flex-shrink-0" />
                      }
                      <span className={i < 2 ? 'text-slate-400' : 'text-slate-300'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Error */}
          {!loading && error && (() => {
            const { type, message, meta } = parseError(error)
            const isQuota = type === 'QUOTA_EXHAUSTED'
            const isAuth  = type === 'AUTH_ERROR'
            return (
              <Card className={`p-5 border ${isQuota ? 'border-amber-500/40 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="flex gap-3">
                  <AlertCircle size={20} className={`flex-shrink-0 mt-0.5 ${isQuota ? 'text-amber-400' : 'text-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm mb-2 ${isQuota ? 'text-amber-400' : 'text-red-400'}`}>
                      {isQuota ? 'âš  Quota Exhausted' : isAuth ? 'ðŸ”‘ API Key Rejected' : 'Generation Failed'}
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed font-mono break-all bg-black/20 rounded-lg p-3 border border-white/8 mb-3">
                      {message}
                    </p>
                    <div className={`p-3 rounded-lg border mb-3 ${isQuota ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/8'}`}>
                      <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                        <Terminal size={12} /> Fix
                      </p>
                      {isQuota ? (
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                          <li>Wait ~1 min or check limits at <a href="https://console.groq.com/settings/limits" target="_blank" rel="noreferrer" className="text-amber-400 underline underline-offset-2">console.groq.com</a></li>
                          <li>Shorten your code to reduce token usage</li>
                        </ul>
                      ) : isAuth ? (
                        <p className="text-xs text-slate-500">
                          Open <code className="text-slate-300">backend/.env</code> â†’ set <code className="text-slate-300">GROQ_API_KEY=gsk_...</code> â†’ restart backend.
                        </p>
                      ) : (
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                          <li>Add <code className="text-slate-300">GROQ_API_KEY</code> to <code className="text-slate-300">backend/.env</code></li>
                          <li>Restart backend: <code className="text-slate-300">uvicorn main:app --port 8000</code></li>
                        </ul>
                      )}
                    </div>
                    <button onClick={handleGenerate} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1.5 font-medium">
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                </div>
              </Card>
            )
          })()}

          {/* Empty */}
          {!loading && !error && !generated && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Zap size={28} className="text-slate-600" />
                </div>
                <h4 className="text-slate-400 font-medium mb-2">Ready to Generate</h4>
                <p className="text-slate-600 text-sm max-w-xs">
                  Paste your <strong className="text-slate-400">{language}</strong> code on the left, then click <strong className="text-slate-400">Generate Unit Tests</strong>.
                </p>
              </div>
            </Card>
          )}

          {/* Success */}
          {!loading && !error && generated && (
            <div className="space-y-3 animate-slide-up">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Tests',    value: generated.stats.total,    color: 'text-white' },
                  { label: 'Unit',     value: generated.stats.unit,     color: 'text-blue-400' },
                  { label: 'Coverage', value: generated.stats.coverage, color: 'text-emerald-400' },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="p-3 text-center">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </Card>
                ))}
              </div>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Code2 size={13} className="text-primary-400" />
                    <span className="text-sm font-medium text-slate-300">Generated Tests</span>
                    <span className="tag-info text-xs">{framework}</span>
                    <span className="text-slate-600 text-xs">{generated.tokens} tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={copyOutput} className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                      <Copy size={11} /> Copy
                    </button>
                    <button onClick={downloadOutput} className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                      <Download size={11} /> Save
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: '520px', overflow: 'auto' }}>
                  <SyntaxHighlighter
                    language={HIGHLIGHT_FOR[language] || 'python'}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, background: 'transparent', fontSize: '12px', padding: '16px' }}
                    showLineNumbers
                    lineNumberStyle={{ color: '#374151', minWidth: '2.5em' }}
                  >
                    {generated.code}
                  </SyntaxHighlighter>
                </div>
              </Card>

              <button
                onClick={handleGenerate}
                className="btn-secondary w-full justify-center flex items-center gap-2 text-xs py-2.5"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

