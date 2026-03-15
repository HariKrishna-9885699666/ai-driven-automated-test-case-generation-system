import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  FileText, Upload, Trash2, Search, Database,
  FileCode2, FileJson, BookOpen, CheckCircle2,
  Loader2, ChevronRight, Layers, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'

const mockDocs = [
  { id: 1, name: 'payment_service.py', type: 'code', size: '12.4 KB', chunks: 34, status: 'indexed', added: '2h ago' },
  { id: 2, name: 'api_documentation.md', type: 'docs', size: '8.1 KB', chunks: 22, status: 'indexed', added: '1d ago' },
  { id: 3, name: 'auth_module.py', type: 'code', size: '5.8 KB', chunks: 18, status: 'indexed', added: '2d ago' },
  { id: 4, name: 'user_requirements.pdf', type: 'docs', size: '45.2 KB', chunks: 67, status: 'indexed', added: '3d ago' },
  { id: 5, name: 'database_schema.json', type: 'json', size: '2.3 KB', chunks: 8, status: 'processing', added: 'Just now' },
]

const mockSearchResults = [
  {
    id: 1,
    source: 'payment_service.py',
    score: 0.94,
    chunk: 'def charge_card(token, amount, currency):\n    """Charges a card via payment gateway."""\n    if not token:\n        raise ValueError("Invalid card token")',
  },
  {
    id: 2,
    source: 'api_documentation.md',
    score: 0.87,
    chunk: '## Payment API\nThe payment endpoint accepts POST requests with amount, currency, and tokenized card data. Error codes: 400 for invalid input, 402 for declined cards.',
  },
  {
    id: 3,
    source: 'auth_module.py',
    score: 0.72,
    chunk: 'def get_user(user_id):\n    """Fetches user from database. Returns None if not found."""\n    return db.query(User).filter(User.id == user_id).first()',
  },
]

function FileIcon({ type }) {
  const icons = {
    code: FileCode2,
    docs: BookOpen,
    json: FileJson,
  }
  const colors = {
    code: 'text-blue-400',
    docs: 'text-violet-400',
    json: 'text-amber-400',
  }
  const Icon = icons[type] || FileText
  return <Icon size={16} className={colors[type] || 'text-slate-400'} />
}

export default function Documents() {
  const [docs, setDocs] = useState(mockDocs)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    setUploading(true)
    await new Promise((r) => setTimeout(r, 1800))

    const newDocs = acceptedFiles.map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: f.name.endsWith('.py') || f.name.endsWith('.js') ? 'code' : 'docs',
      size: `${(f.size / 1024).toFixed(1)} KB`,
      chunks: Math.floor(Math.random() * 40 + 10),
      status: 'indexed',
      added: 'Just now',
    }))

    setDocs((prev) => [...newDocs, ...prev])
    setUploading(false)
    toast.success(`${acceptedFiles.length} file(s) indexed successfully!`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.md'],
      'text/x-python': ['.py'],
      'application/javascript': ['.js', '.ts'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  })

  const handleDelete = (id) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast.success('Document removed from index')
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSearchResults(mockSearchResults)
    setSearching(false)
  }

  const totalChunks = docs.reduce((sum, d) => sum + d.chunks, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Indexed Documents', value: docs.filter((d) => d.status === 'indexed').length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
          { label: 'Total Chunks', value: totalChunks, icon: Layers, color: 'from-violet-500 to-purple-500' },
          { label: 'Vector DB Size', value: `${(totalChunks * 1.5).toFixed(0)} KB`, icon: Database, color: 'from-emerald-500 to-teal-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upload Zone */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Upload size={16} className="text-primary-400" />
              Upload Documents
            </h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/3'
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-primary-400 animate-spin" />
                  <p className="text-slate-400 text-sm">Indexing documents...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Upload size={22} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium text-sm">
                      {isDragActive ? 'Drop files here!' : 'Drag & drop files'}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      .py, .js, .ts, .md, .txt, .pdf, .json
                    </p>
                  </div>
                  <span className="btn-secondary text-xs">Browse Files</span>
                </div>
              )}
            </div>

            {/* Processing Steps */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
                Indexing Pipeline
              </p>
              {[
                { step: '1', label: 'Parse & extract text', color: 'bg-blue-500' },
                { step: '2', label: 'Chunk into segments', color: 'bg-violet-500' },
                { step: '3', label: 'Generate embeddings', color: 'bg-pink-500' },
                { step: '4', label: 'Store in vector DB', color: 'bg-emerald-500' },
              ].map(({ step, label, color }) => (
                <div key={step} className="flex items-center gap-2.5 text-xs">
                  <div className={`w-5 h-5 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {step}
                  </div>
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* RAG Search Test */}
          <Card className="p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Search size={16} className="text-violet-400" />
              Test RAG Retrieval
            </h3>
            <div className="flex gap-2">
              <input
                className="input-field flex-1 text-sm"
                placeholder="Enter a query to test retrieval..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="primary" loading={searching} onClick={handleSearch}>
                <Search size={14} />
              </Button>
            </div>

            {searchResults && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {searchResults.length} relevant chunks retrieved:
                </p>
                {searchResults.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-white/3 border border-white/8"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-primary-400">{r.source}</span>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {(r.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                      {r.chunk}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Document List */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Database size={16} className="text-emerald-400" />
              Indexed Documents
            </h3>
            <span className="tag-info">{docs.length} files</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 group transition-all"
              >
                <FileIcon type={doc.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-600 text-xs">{doc.size}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-slate-600 text-xs">{doc.chunks} chunks</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-slate-600 text-xs">{doc.added}</span>
                  </div>
                </div>
                {doc.status === 'indexed' ? (
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Loader2 size={14} className="text-amber-400 animate-spin flex-shrink-0" />
                )}
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
