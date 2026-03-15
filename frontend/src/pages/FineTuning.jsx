import { useState } from 'react'
import {
  Brain, Play, Pause, RotateCcw, CheckCircle2,
  Loader2, TrendingDown, BarChart2, Layers,
  Settings2, ChevronRight, Download, GitBranch,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import toast from 'react-hot-toast'

const trainingData = [
  { epoch: 1, loss: 2.41, val_loss: 2.58, accuracy: 0.34 },
  { epoch: 2, loss: 1.92, val_loss: 2.10, accuracy: 0.48 },
  { epoch: 3, loss: 1.54, val_loss: 1.72, accuracy: 0.58 },
  { epoch: 4, loss: 1.21, val_loss: 1.42, accuracy: 0.67 },
  { epoch: 5, loss: 0.98, val_loss: 1.18, accuracy: 0.74 },
  { epoch: 6, loss: 0.78, val_loss: 0.95, accuracy: 0.79 },
  { epoch: 7, loss: 0.61, val_loss: 0.78, accuracy: 0.83 },
  { epoch: 8, loss: 0.49, val_loss: 0.64, accuracy: 0.87 },
  { epoch: 9, loss: 0.38, val_loss: 0.54, accuracy: 0.90 },
  { epoch: 10, loss: 0.31, val_loss: 0.46, accuracy: 0.92 },
]

const models = [
  { id: 1, name: 'fine-tuned-v1', base: 'CodeLlama-7B', status: 'ready', accuracy: '91.4%', trained: '2d ago', tests: 1847 },
  { id: 2, name: 'fine-tuned-v2', base: 'GPT-3.5-Turbo', status: 'ready', accuracy: '88.9%', trained: '5d ago', tests: 1204 },
  { id: 3, name: 'fine-tuned-v3', base: 'Mistral-7B', status: 'training', accuracy: '—', trained: 'Now', tests: 0 },
]

const steps = [
  {
    title: 'Data Collection',
    desc: 'Gather code files, documentation, and existing test cases from your repositories.',
    detail: 'Supports .py, .js, .ts, .java, .go, markdown, and PDF documents.',
  },
  {
    title: 'Preprocessing',
    desc: 'Tokenize code and normalize whitespace, docstrings, and inline comments.',
    detail: 'Code is split into function-level chunks with context preservation.',
  },
  {
    title: 'Dataset Creation',
    desc: 'Create instruction-response pairs: code → test case.',
    detail: 'Format: {"instruction": "...", "input": "<code>", "output": "<tests>"}',
  },
  {
    title: 'Fine-Tuning',
    desc: 'Fine-tune a base LLM using LoRA/QLoRA on your supervised dataset.',
    detail: 'Training uses gradient checkpointing and mixed precision (fp16).',
  },
  {
    title: 'Evaluation',
    desc: 'Evaluate on a held-out test split using BLEU, coverage, and pass@k metrics.',
    detail: 'Overfitting is monitored via validation loss throughout training.',
  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="font-medium text-slate-300 mb-1">Epoch {label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value < 1 ? (p.value * 100).toFixed(1) + '%' : p.value.toFixed(3)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function FineTuning() {
  const [config, setConfig] = useState({
    baseModel: 'codellama/CodeLlama-7b-hf',
    epochs: 10,
    batchSize: 4,
    lr: 2e-4,
    loraR: 16,
    loraAlpha: 32,
    maxSeqLen: 2048,
    warmupSteps: 100,
  })
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [completed, setCompleted] = useState(false)

  const handleStart = async () => {
    setIsTraining(true)
    setProgress(0)
    setCurrentEpoch(0)
    setCompleted(false)
    toast.success('Fine-tuning job started!')

    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 600))
      setCurrentEpoch(i)
      setProgress(i * 10)
    }

    setIsTraining(false)
    setCompleted(true)
    toast.success('Fine-tuning completed! Model saved.')
  }

  const handleStop = () => {
    setIsTraining(false)
    toast('Training paused', { icon: '⏸️' })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Config Panel */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-5">
            <Settings2 size={16} className="text-primary-400" />
            Training Configuration
          </h3>

          <div className="space-y-4">
            {/* Base Model */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Base Model</label>
              <select
                className="input-field text-sm"
                value={config.baseModel}
                onChange={(e) => setConfig({ ...config, baseModel: e.target.value })}
              >
                {[
                  'codellama/CodeLlama-7b-hf',
                  'codellama/CodeLlama-13b-hf',
                  'mistralai/Mistral-7B-v0.1',
                  'deepseek-coder-6.7b-base',
                  'gpt-3.5-turbo',
                ].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Hyperparams Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'epochs', label: 'Epochs', type: 'number', min: 1, max: 50 },
                { key: 'batchSize', label: 'Batch Size', type: 'number', min: 1, max: 32 },
                { key: 'maxSeqLen', label: 'Max Seq Len', type: 'number', min: 512, max: 8192 },
                { key: 'warmupSteps', label: 'Warmup Steps', type: 'number', min: 0, max: 1000 },
              ].map(({ key, label, ...rest }) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 block mb-1">{label}</label>
                  <input
                    {...rest}
                    className="input-field text-sm py-2"
                    value={config[key]}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* LoRA Config */}
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs font-medium text-violet-400 mb-2 flex items-center gap-1">
                <Layers size={12} /> LoRA Configuration
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'loraR', label: 'LoRA r' },
                  { key: 'loraAlpha', label: 'LoRA alpha' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-slate-500 block mb-1">{label}</label>
                    <input
                      type="number"
                      className="input-field text-sm py-1.5"
                      value={config[key]}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              {isTraining ? (
                <Button variant="danger" className="w-full justify-center" onClick={handleStop}>
                  <Pause size={14} /> Pause Training
                </Button>
              ) : (
                <Button variant="primary" className="w-full justify-center" onClick={handleStart} disabled={completed}>
                  <Play size={14} />
                  {completed ? 'Training Complete' : 'Start Fine-Tuning'}
                </Button>
              )}
              {completed && (
                <Button variant="secondary" className="w-full justify-center" onClick={() => setCompleted(false)}>
                  <RotateCcw size={13} /> Reset
                </Button>
              )}
            </div>

            {/* Progress */}
            {(isTraining || completed) && (
              <div className="animate-slide-up">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Epoch {currentEpoch}/{config.epochs}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {isTraining && (
                  <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" />
                    Training... Loss: {(2.41 - currentEpoch * 0.21).toFixed(3)}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Training Chart + Steps */}
        <div className="lg:col-span-2 space-y-5">
          {/* Loss Chart */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingDown size={16} className="text-emerald-400" />
                Training & Validation Loss
              </h3>
              <span className="tag-success">Converged</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trainingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Epoch', position: 'insideBottom', fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="loss" stroke="#6366f1" strokeWidth={2} dot={false} name="Train Loss" />
                <Line type="monotone" dataKey="val_loss" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Val Loss" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} name="Accuracy" yAxisId="acc" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Process Steps */}
          <Card className="p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <GitBranch size={16} className="text-primary-400" />
              Fine-Tuning Pipeline Steps
            </h3>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="step-badge bg-gradient-to-br from-primary-600 to-violet-600 text-white">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-primary-500/30 to-transparent mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="font-medium text-white text-sm">{s.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{s.desc}</p>
                    <p className="text-slate-600 text-xs mt-1 font-mono">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Available Models */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            Fine-Tuned Models
          </h3>
          <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            <Download size={12} /> Export All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Model Name', 'Base Model', 'Status', 'Accuracy', 'Tests Generated', 'Trained'].map((h) => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-3 pr-4">
                    <code className="text-primary-400 font-mono text-xs">{m.name}</code>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{m.base}</td>
                  <td className="py-3 pr-4">
                    {m.status === 'ready' ? (
                      <span className="tag-success">Ready</span>
                    ) : (
                      <span className="tag-warning flex items-center gap-1 w-fit">
                        <Loader2 size={10} className="animate-spin" /> Training
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-300 text-sm font-medium">{m.accuracy}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{m.tests.toLocaleString()}</td>
                  <td className="py-3 text-slate-500 text-xs">{m.trained}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
