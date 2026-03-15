import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Generate from './pages/Generate'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/generate" replace />} />
        <Route path="generate" element={<Generate />} />
        <Route path="*" element={<Navigate to="/generate" replace />} />
      </Route>
    </Routes>
  )
}
