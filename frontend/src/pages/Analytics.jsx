import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import {
  TrendingUp, CheckCircle2, XCircle, AlertTriangle,
  BarChart3, Target, Clock, Layers,
} from 'lucide-react'
import Card from '../components/common/Card'

const moduleData = [
  { module: 'auth.py', coverage: 94, tests: 42, passed: 40, failed: 2 },
  { module: 'payments.py', coverage: 88, tests: 38, passed: 34, failed: 4 },
  { module: 'users.py', coverage: 96, tests: 55, passed: 54, failed: 1 },
  { module: 'api.py', coverage: 72, tests: 29, passed: 23, failed: 6 },
  { module: 'db.py', coverage: 81, tests: 31, passed: 28, failed: 3 },
  { module: 'utils.py', coverage: 91, tests: 24, passed: 22, failed: 2 },
]

const typeDistribution = [
  { name: 'Unit', value: 58, color: '#6366f1' },
  { name: 'Integration', value: 24, color: '#8b5cf6' },
  { name: 'Edge Case', value: 14, color: '#10b981' },
  { name: 'Parametrized', value: 4, color: '#f59e0b' },
]

const qualityData = [
  { metric: 'Readability', value: 88 },
  { metric: 'Coverage', value: 84 },
  { metric: 'Assertion Quality', value: 91 },
  { metric: 'Isolation', value: 79 },
  { metric: 'Mocking', value: 86 },
  { metric: 'Edge Cases', value: 74 },
]

const trendData = [
  { week: 'W1', coverage: 64, bugs: 18 },
  { week: 'W2', coverage: 70, bugs: 14 },
  { week: 'W3', coverage: 75, bugs: 11 },
  { week: 'W4', coverage: 81, bugs: 8 },
  { week: 'W5', coverage: 84, bugs: 6 },
  { week: 'W6', coverage: 87, bugs: 4 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="font-medium text-slate-300 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{typeof p.value === 'number' && p.name !== 'bugs' ? '%' : ''}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const totalTests = moduleData.reduce((s, m) => s + m.tests, 0)
  const totalPassed = moduleData.reduce((s, m) => s + m.passed, 0)
  const totalFailed = moduleData.reduce((s, m) => s + m.failed, 0)
  const avgCoverage = (moduleData.reduce((s, m) => s + m.coverage, 0) / moduleData.length).toFixed(1)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tests', value: totalTests, icon: Layers, color: 'from-primary-500 to-violet-500' },
          { label: 'Passed', value: totalPassed, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
          { label: 'Failed', value: totalFailed, icon: XCircle, color: 'from-red-500 to-pink-500' },
          { label: 'Avg Coverage', value: `${avgCoverage}%`, icon: Target, color: 'from-amber-500 to-orange-500' },
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

      {/* Coverage Per Module + Type Distribution */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary-400" />
            Coverage by Module
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={moduleData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="module" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="passed" name="Passed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 flex flex-col">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Layers size={16} className="text-violet-400" />
            Test Type Distribution
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie
                data={typeDistribution}
                cx={90} cy={90}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {typeDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`]} />
            </PieChart>
          </div>
          <div className="space-y-1.5">
            {typeDistribution.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-slate-400">{name}</span>
                </div>
                <span className="text-slate-300 font-medium">{value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quality Radar + Trend */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Target size={16} className="text-emerald-400" />
            Test Quality Metrics
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={qualityData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Radar
                name="Quality"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip formatter={(v) => [`${v}%`]} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-amber-400" />
            Coverage & Bug Trends (6 Weeks)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="coverage" name="Coverage %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bugs" name="bugs" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-slate-600 text-xs mt-2">
            Coverage increased by 23% while bug count dropped 78% over 6 weeks.
          </p>
        </Card>
      </div>

      {/* Module Table */}
      <Card className="p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          Detailed Module Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Module', 'Coverage', 'Total Tests', 'Passed', 'Failed', 'Pass Rate', 'Status'].map((h) => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {moduleData.map((m) => (
                <tr key={m.module} className="hover:bg-white/3 transition-colors">
                  <td className="py-3 pr-4">
                    <code className="text-slate-300 font-mono text-xs">{m.module}</code>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.coverage}%`,
                            background: m.coverage >= 90 ? '#10b981' : m.coverage >= 75 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-slate-300 text-xs">{m.coverage}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{m.tests}</td>
                  <td className="py-3 pr-4 text-emerald-400 text-xs">{m.passed}</td>
                  <td className="py-3 pr-4 text-red-400 text-xs">{m.failed}</td>
                  <td className="py-3 pr-4 text-slate-300 text-xs">{((m.passed / m.tests) * 100).toFixed(1)}%</td>
                  <td className="py-3">
                    {m.coverage >= 90 ? (
                      <span className="tag-success">Excellent</span>
                    ) : m.coverage >= 75 ? (
                      <span className="tag-warning">Good</span>
                    ) : (
                      <span className="tag-error">Needs Work</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
