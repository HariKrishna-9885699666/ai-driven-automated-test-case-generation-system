import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Zap, Cpu, Github, BarChart3, Menu, X, ChevronRight } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/generate',  label: 'Generate Tests', icon: Zap },
  { to: '/analytics', label: 'Analytics',       icon: BarChart3 },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const currentPage = NAV_ITEMS.find((n) => n.to === location.pathname)

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[220px] flex-col py-6 px-4 z-50 bg-[rgba(15,23,42,0.95)] backdrop-blur-[20px] border-r border-white/8">
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
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
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link group ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5">
          <div className="glass-card p-3">
            <p className="text-slate-400 text-xs leading-relaxed">LLM + RAG automated test generation</p>
            <div className="flex items-center gap-2 mt-2">
              <Github size={13} className="text-slate-500" />
              <span className="text-slate-500 text-xs">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[rgba(15,23,42,0.97)] backdrop-blur-[20px] border-b border-white/8">
        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-2 text-sm min-w-0 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Cpu size={14} className="text-white" />
          </div>
          <span className="text-slate-500 font-medium flex-shrink-0">AI TestGen</span>
          {currentPage && (
            <>
              <ChevronRight size={13} className="text-slate-600 flex-shrink-0" />
              <span className="text-white font-semibold truncate">{currentPage.label}</span>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer panel */}
          <div
            className="absolute top-[52px] left-0 right-0 bg-[rgba(15,23,42,0.98)] border-b border-white/8 px-4 py-4 space-y-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
