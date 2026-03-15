import { NavLink } from 'react-router-dom'
import { Zap, Cpu, Github } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col py-6 px-4 z-50"
      style={{
        width: '220px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">AI TestGen</h1>
            <p className="text-slate-500 text-xs">Auto Test Case Generator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1">
        <NavLink
          to="/generate"
          className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
        >
          <Zap size={18} className="flex-shrink-0" />
          <span className="flex-1">Generate Tests</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/5">
        <div className="glass-card p-3">
          <p className="text-slate-400 text-xs leading-relaxed">
            LLM + RAG automated test generation
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Github size={13} className="text-slate-500" />
            <span className="text-slate-500 text-xs">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
