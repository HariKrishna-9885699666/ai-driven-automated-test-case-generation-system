import { useLocation } from 'react-router-dom'

const pageInfo = {
  '/generate': { title: 'Generate Tests', desc: 'Generate unit tests using AI from your code' },
}

export default function Header() {
  const { pathname } = useLocation()
  const info = pageInfo[pathname] || { title: 'AI TestGen', desc: '' }

  return (
    <header
      className="sticky top-0 z-40 px-4 md:px-6 py-3 md:py-4 bg-[rgba(15,23,42,0.8)] backdrop-blur-[12px] border-b border-white/5"
    >
      <h2 className="text-xl font-bold text-white">{info.title}</h2>
      <p className="text-slate-500 text-sm mt-0.5">{info.desc}</p>
    </header>
  )
}
