import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function Login() {
  const { signIn, isAuthenticated } = useAuth()
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(email.trim().toLowerCase(), phone.trim())
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-700">
      <div className="w-full max-w-sm animate-slide-in">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl">

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src="/ti-logo.png" alt="Transworld International" className="h-14 w-auto" />
            <p className="text-xs text-slate-400 font-medium">Management Intelligence Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transworld.com"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              size="lg"
            >
              Sign in
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
