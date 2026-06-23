import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { DEMO_CREDENTIALS } from '@/lib/mockData'
import { LayoutDashboard } from 'lucide-react'

export function Login() {
  const { signIn, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) return <Navigate to="/my-work" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(email.trim().toLowerCase())
    if (err) setError(err)
    setLoading(false)
  }

  function quickLogin(e: string) {
    setEmail(e)
    signIn(e)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-700">
      <div className="w-full max-w-sm animate-slide-in">
        {/* Card Container */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl">
          {/* Logo Section */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <LayoutDashboard size={24} />
            </span>
            <div className="text-center">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">Transworld</h1>
              <p className="mt-1 text-xs text-slate-400 font-medium">Management Intelligence Platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transworld.com"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
              {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
            </div>
            <Button type="submit" loading={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" size="lg">
              Sign in
            </Button>
          </form>

          {/* Quick Logins for Demo */}
          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">— Demo accounts —</p>
            <div className="space-y-1.5">
              {Object.entries(DEMO_CREDENTIALS).map(([e, label]) => (
                <button
                  key={e}
                  onClick={() => quickLogin(e)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">{label}</span>
                  <span className="text-[10px] text-slate-400 truncate ml-2">{e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
