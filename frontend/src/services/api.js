import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

// ── Test Generation ──────────────────────────────────────────
export const generateTests = (payload) =>
  api.post('/generate/tests', payload).then((r) => r.data)

export const getProviders = () =>
  api.get('/generate/providers').then((r) => r.data)

export default api
