import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, ArrowRight, FileText, Brain, BarChart3,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Code2, Database, Cpu,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Card from '../components/common/Card'

const activityData = [
  { day: 'Mon', tests: 24, passed: 20, failed: 4 },
  { day: 'Tue', tests: 38, passed: 35, failed: 3 },
  { day: 'Wed', tests: 55, passed: 48, failed: 7 },
  { day: 'Thu', tests: 40, passed: 38, failed: 2 },
  { day: 'Fri', tests: 72, passed: 65, failed: 7 },
  { day: 'Sat', tests: 30, passed: 28, failed: 2 },
  { day: 'Sun', tests: 62, passed: 58, failed: 4 },
]

const recentTests = [
  { name: 'test_user_authentication', type: 'Unit', status: 'passed', time: '2 min ago', module: 'auth.py' },
  { name: 'test_payment_integration', type: 'Integration', status: 'passed', time: '15 min ago', module: 'payments.py' },
  { name: 'test_edge_case_null_input', type: 'Edge Case', status: 'failed', time: '1h ago', module: 'validators.py' },
  { name: 'test_api_rate_limiting', type: 'Integration', status: 'passed', time: '2h ago', module: 'api.py' },
  { name: 'test_database_overflow', type: 'Edge Case', status: 'pending', time: '3h ago', module: 'db.py' },
]

const statCards = [
  { label: 'Tests Generated', value: '3,284', change: '+18.2%', trend: 'up', icon: Zap, color: 'from-primary-500 to-violet-500' },
  { label: 'Pass Rate', value: '91.4%', change: '+2.1%', trend: 'up', icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
  { label: 'Docs Indexed', value: '47', change: '+5', trend: 'up', icon: Database, color: 'from-blue-500 to-cyan-500' },
  { label: 'Coverage', value: '84.7%', change: '+6.3%', trend: 'up', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
]

function StatusBadge({ status }) {
  const styles = {
    passed: 'tag-success',
    failed: 'tag-error',
    pending: 'tag-warning',
  }
  return <span className={`tag ${styles[status]}`}>{status}</span>
}

function TypeBadge({ type }) {
  const styles = {
    'Unit': 'tag-info',
    'Integration': 'tag-purple',
    'Edge Case': 'tag-warning',
  }
  return <span className={`tag ${styles[type] || 'tag-info'}`}>{type}</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="font-medium text-slate-300 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 50%, rgba(6,182,212,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-8 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-2 right-32 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="tag-success">AI Powered</span>
              <span className="tag-info">RAG Enabled</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              AI-Driven Test Case Generation
            </h2>
            <p className="text-slate-400 text-sm max-w-lg">
              Automatically generate comprehensive unit, integration, and edge case tests
              using fine-tuned LLMs and Retrieval-Augmented Generation.
            </p>
          </div>
          <Link to="/generate" className="btn-primary gap-2 hidden md:flex">
            <Zap size={16} />
            Generate Now
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Pipeline preview */}
        <div className="relative flex items-center gap-2 mt-5 flex-wrap">
          {[
            { icon: FileText, label: 'Docs/Code', color: 'text-blue-400' },
            null,
            { icon: Database, label: 'RAG Index', color: 'text-violet-400' },
            null,
            { icon: Brain, label: 'LLM', color: 'text-pink-400' },
            null,
            { icon: Zap, label: 'Test Cases', color: 'text-emerald-400' },
            null,
            { icon: BarChart3, label: 'Coverage', color: 'text-amber-400' },
          ].map((item, i) =>
            item === null ? (
              <ArrowRight key={i} size={14} className="text-slate-600" />
            ) : (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
              >
                <item.icon size={13} className={item.color} />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, change, icon: Icon, color }, i) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon size={18} className="text-white" />
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </Card>
        ))}
      </div>

      {/* Chart + Recent Tests */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Test Activity</h3>
              <p className="text-slate-500 text-xs mt-0.5">This week's generation history</p>
            </div>
            <select className="bg-white/5 border border-white/10 text-slate-400 text-xs rounded-lg px-3 py-1.5 focus:outline-none">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="testsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="passedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="tests" stroke="#6366f1" fill="url(#testsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="passed" stroke="#10b981" fill="url(#passedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: Zap,      label: 'Generate Tests',           to: '/generate',  color: 'text-primary-400' },
              { icon: Code2,    label: 'Paste code & generate',    to: '/generate',  color: 'text-blue-400' },
              { icon: Database, label: 'Generate from docs',       to: '/generate',  color: 'text-violet-400' },
            ].map(({ icon: Icon, label, to, color }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 hover:border-white/15 transition-all group"
              >
                <Icon size={16} className={color} />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{label}</span>
                <ArrowRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Tests Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">Recently Generated Tests</h3>
          <Link to="/generate" className="text-primary-400 text-xs hover:text-primary-300 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Test Name', 'Type', 'Module', 'Status', 'Generated'].map((h) => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentTests.map((t) => (
                <tr key={t.name} className="hover:bg-white/3 transition-colors">
                  <td className="py-3 pr-4">
                    <code className="text-slate-300 font-mono text-xs">{t.name}</code>
                  </td>
                  <td className="py-3 pr-4"><TypeBadge type={t.type} /></td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-500 font-mono text-xs">{t.module}</span>
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={t.status} /></td>
                  <td className="py-3">
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Clock size={11} />{t.time}
                    </span>
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
