import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useIsNativeApp } from '@/hooks/useIsNativeApp'
import { Button } from '@/components/ui/Button'

export function Login() {
  const { signIn, isAuthenticated } = useAuth()
  const isNativeApp = useIsNativeApp()
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()
    // A whitespace-only value passes the native `required` check but trims to empty,
    // which would otherwise silently fall back to a shared default password.
    if (!trimmedEmail || !trimmedPhone) {
      setError('Please enter both your work email and mobile number.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(trimmedEmail, trimmedPhone)
    if (err) setError(err)
    setLoading(false)
  }

  // Native app: full-bleed, edge-to-edge sheet — no floating card, larger touch
  // targets, 16px inputs (anything smaller triggers iOS auto-zoom on focus).
  if (isNativeApp) {
    return (
      <div
        className="flex min-h-screen flex-col bg-background px-6 text-foreground"
        style={{
          paddingTop: 'max(4rem, calc(3rem + env(safe-area-inset-top)))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex flex-col items-center gap-4 pb-12">
          <div className="rounded-full bg-white p-4 w-28 h-28 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/ti-logo.png" alt="Transworld International" className="h-20 w-20 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Task Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Work Email
              </label>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transworldintl.com"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Mobile Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          </div>

          <div className="flex-1" />

          <Button
            type="submit"
            loading={loading}
            className="w-full h-14 rounded-xl text-base font-semibold"
          >
            Sign in
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm animate-slide-in">
        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="rounded-full bg-white p-4 w-24 h-24 flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/ti-logo.png" alt="Transworld International" className="h-16 w-16 object-contain" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Task Tracker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transworld.com"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <Button
              type="submit"
              loading={loading}
              className="w-full font-semibold"
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
