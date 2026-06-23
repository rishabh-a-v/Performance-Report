import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Profile, UserRole } from '@/types/database'
import { PROFILES } from '@/lib/mockData'

interface AuthState {
  user: Profile | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string) => Promise<{ error: string | null }>
  signOut: () => void
  can: (minRole: UserRole) => boolean
}

const ROLE_ORDER: UserRole[] = ['employee', 'manager', 'department_head', 'executive']

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem('emi_user_id')
    if (stored) {
      const profile = PROFILES.find((p) => p.id === stored) ?? null
      return { user: profile, role: profile?.role ?? null, isLoading: false, isAuthenticated: !!profile }
    }
    return { user: null, role: null, isLoading: false, isAuthenticated: false }
  })

  const signIn = useCallback(async (email: string): Promise<{ error: string | null }> => {
    const profile = PROFILES.find((p) => p.email === email)
    if (!profile) return { error: 'No account found for this email.' }
    localStorage.setItem('emi_user_id', profile.id)
    setState({ user: profile, role: profile.role, isLoading: false, isAuthenticated: true })
    return { error: null }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('emi_user_id')
    setState({ user: null, role: null, isLoading: false, isAuthenticated: false })
  }, [])

  const can = useCallback(
    (minRole: UserRole) => {
      if (!state.role) return false
      return ROLE_ORDER.indexOf(state.role) >= ROLE_ORDER.indexOf(minRole)
    },
    [state.role],
  )

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
