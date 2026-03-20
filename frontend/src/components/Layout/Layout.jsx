import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      {/* pt-[52px] offsets the fixed mobile top bar; md overrides it */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[220px] pt-[52px] md:pt-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
