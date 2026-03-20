import { useState } from 'react'
import { X, Github, Linkedin, Globe, BookOpen, Phone, Mail, MapPin, GraduationCap, User } from 'lucide-react'

const LINKS = [
  { icon: Github,   label: 'GitHub',    href: 'https://github.com/HariKrishna-9885699666',        color: '#94a3b8' },
  { icon: Linkedin, label: 'LinkedIn',  href: 'https://linkedin.com/in/anemharikrishna',           color: '#0ea5e9' },
  { icon: BookOpen, label: 'Blog',      href: 'https://hashnode.com/@HariKrishna-9885699666',      color: '#10b981' },
  { icon: Globe,    label: 'Portfolio', href: 'https://harikrishna.is-a-good.dev',                 color: '#a78bfa' },
]

export default function DevCard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="About the developer"
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-lg shadow-primary-500/40 bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm hover:scale-110 active:scale-95 transition-transform"
      >
        HK
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: 'rgba(15,23,42,0.97)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient band */}
            <div className="h-20 bg-gradient-to-br from-primary-600 to-violet-700 relative">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={15} />
              </button>
              {/* Avatar */}
              <div className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 border-2 border-[rgba(15,23,42,0.97)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                HK
              </div>
            </div>

            <div className="pt-10 px-5 pb-5 space-y-4">
              {/* Name + title */}
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Hari Krishna Anem</h2>
                <p className="text-primary-400 text-xs font-medium mt-0.5">Full Stack Developer</p>
              </div>

              {/* Info rows */}
              <div className="space-y-2">
                {[
                  { icon: GraduationCap, label: 'B.Tech (CSIT)' },
                  { icon: MapPin,        label: 'Hyderabad, India' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-xs text-slate-400">
                    <Icon size={13} className="text-slate-500 flex-shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <a
                  href="tel:+919885699666"
                  className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Phone size={13} className="text-slate-500 flex-shrink-0" />
                  +91 9885699666
                </a>
                <a
                  href="mailto:anemharikrishna@gmail.com"
                  className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white transition-colors break-all"
                >
                  <Mail size={13} className="text-slate-500 flex-shrink-0" />
                  anemharikrishna@gmail.com
                </a>
              </div>

              {/* Social links */}
              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                {LINKS.map(({ icon: Icon, label, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-all"
                  >
                    <Icon size={13} style={{ color }} className="flex-shrink-0" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
