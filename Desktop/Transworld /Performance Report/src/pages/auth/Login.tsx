import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-slate-800 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
              <LayoutDashboard size={24} />
            </span>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white">Transworld MI</h1>
              <p className="mt-1 text-sm text-slate-400">Management Intelligence Platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transworld.com"
                required
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
              {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          {/* Demo logins */}
          <div className="mt-6">
            <p className="mb-3 text-center text-xs font-medium text-slate-500">— Demo accounts —</p>
            <div className="space-y-1.5">
              {Object.entries(DEMO_CREDENTIALS).map(([e, label]) => (
                <button
                  key={e}
                  onClick={() => quickLogin(e)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/10"
                >
                  <span className="text-xs font-medium text-white">{label}</span>
                  <span className="text-[10px] text-slate-500 truncate ml-2">{e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
