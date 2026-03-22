import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'
import {
  TrendingUp, CheckCircle2, AlertTriangle,
  BarChart3, Target, Layers, Cpu, Trash2,
} from 'lucide-react'
import Card from '../components/common/Card'

const LANG_COLORS = { Python: '#6366f1', JavaScript: '#f59e0b' }
const TYPE_COLORS = { unit: '#6366f1', integration: '#8b5cf6', edge: '#10b981', parametrized: '#f59e0b' }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="font-medium text-slate-300 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color || '#94a3b8' }}>
            {p.name}: {p.value}{p.name === 'Coverage %' || p.name === 'Bug Detection %' ? '%' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <BarChart3 size={48} className="text-slate-700" />
      <h3 className="text-slate-400 font-semibold text-lg">No data yet</h3>
      <p className="text-slate-600 text-sm max-w-xs">
        Generate test cases first — each run is tracked here with real coverage and quality metrics.
      </p>
    </div>
  )
}

export default function Analytics() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('testgen_history') || '[]')
      setHistory(stored)
    } catch (_) {
      setHistory([])
    }
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('testgen_history')
    setHistory([])
  }

  if (history.length === 0) return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
      </div>
      <EmptyState />
    </div>
  )

  // ── Derived metrics ──────────────────────────────────────────────────────
  const totalTests   = history.reduce((s, r) => s + (r.stats?.total || 0), 0)
  const totalTokens  = history.reduce((s, r) => s + (r.tokens || 0), 0)
  const avgCoverage  = history.length
    ? Math.round(history.reduce((s, r) => s + (r.stats?.coverage_pct || 0), 0) / history.length)
    : 0
  const avgBugDetect = history.length
    ? Math.round(history.reduce((s, r) => s + (r.stats?.bug_detection_pct || 0), 0) / history.length)
    : 0

  // Language distribution
  const langMap = {}
  history.forEach(({ language }) => { langMap[language] = (langMap[language] || 0) + 1 })
  const langData = Object.entries(langMap).map(([name, value]) => ({
    name, value, color: LANG_COLORS[name] || '#94a3b8',
  }))

  // Test type totals
  const typeMap = { unit: 0, integration: 0, edge: 0, parametrized: 0 }
  history.forEach(({ stats }) => {
    if (!stats) return
    typeMap.unit          += stats.unit || 0
    typeMap.integration   += stats.integration || 0
    typeMap.edge          += stats.edge || 0
    typeMap.parametrized  += stats.parametrized || 0
  })
  const typeData = Object.entries(typeMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: TYPE_COLORS[name] }))

  // Trend: last 10 runs newest-last
  const trendData = [...history].reverse().slice(-10).map((r, i) => ({
    run: `#${i + 1}`,
    'Coverage %': r.stats?.coverage_pct || 0,
    'Bug Detection %': r.stats?.bug_detection_pct || 0,
    Tests: r.stats?.total || 0,
  }))

  // Per-session table (last 10, newest first)
  const tableRows = history.slice(0, 10)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} /> Clear history
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tests Generated', value: totalTests, icon: Layers,       color: 'from-primary-500 to-violet-500' },
          { label: 'Total Runs',            value: history.length, icon: Cpu,      color: 'from-slate-600 to-slate-500' },
          { label: 'Avg Coverage',          value: `${avgCoverage}%`, icon: Target, color: 'from-emerald-500 to-teal-500' },
          { label: 'Avg Bug Detection',     value: `${avgBugDetect}%`, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={17} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Coverage & Bug Detection Trend */}
      <Card className="p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-amber-400" />
          Coverage &amp; Bug Detection Trend (last {trendData.length} runs)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="run" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Coverage %" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            <Line type="monotone" dataKey="Bug Detection %" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Language dist + Test Types */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary-400" />
            Language Distribution
          </h3>
          <div className="flex items-center gap-6">
            <PieChart width={160} height={160}>
              <Pie data={langData} cx={75} cy={75} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {langData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'runs']} />
            </PieChart>
            <div className="space-y-2">
              {langData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-slate-400">{name}</span>
                  <span className="text-slate-300 font-medium ml-auto">{value} runs</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Test Types Generated
          </h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                  {typeData.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 text-sm">No type data yet.</p>
          )}
        </Card>
      </div>

      {/* Recent sessions table */}
      <Card className="p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          Recent Generation Sessions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Time', 'Language', 'Tests', 'Unit', 'Edge', 'Asserts', 'Coverage', 'Bug Detection'].map((h) => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => {
                const s = row.stats || {}
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                    <td className="py-2.5 pr-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs font-medium" style={{ color: LANG_COLORS[row.language] || '#94a3b8' }}>
                        {row.language}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-white font-semibold">{s.total ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{s.unit ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{s.edge ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{s.assert_count ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-emerald-400 font-medium">{s.coverage ?? '—'}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-amber-400 font-medium">
                        {s.bug_detection_pct != null ? `~${s.bug_detection_pct}%` : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}