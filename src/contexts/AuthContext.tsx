import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Profile, UserRole } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: Profile | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, phone: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  can: (minRole: UserRole) => boolean
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'phone_no' | 'branch'>>) => Promise<void>
}

const ROLE_LEVEL: Record<UserRole, number> = {
  executive: 0,
  manager: 1,
  director: 2,
  managing_director: 3,
  executive_assistant: 3,
  hr: 3,
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Helper to fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      return data as Profile
    } catch (e) {
      console.error('Exception fetching profile:', e)
      return null
    }
  }, [])

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setState(prev => ({ ...prev, isLoading: true }))
        const profile = await fetchProfile(session.user.id)
        if (profile) {
          setState({
            user: profile,
            role: profile.role,
            isAuthenticated: true,
            isLoading: false,
          })
          localStorage.setItem('emi_user_id', profile.id)
        } else {
          setState({
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
          })
          localStorage.removeItem('emi_user_id')
        }
      } else {
        setState({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        })
        localStorage.removeItem('emi_user_id')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, phone: string): Promise<{ error: string | null }> => {
    try {
      // Phone number IS the password — no pre-lookup needed (avoids RLS block)
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: phone.trim() || 'ChangeMe123!',
      })
      if (error) {
        return { error: 'Incorrect email or mobile number.' }
      }
      return { error: null }
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred during sign in.' }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const can = useCallback(
    (minRole: UserRole) => {
      if (!state.role) return false
      return ROLE_LEVEL[state.role] >= ROLE_LEVEL[minRole]
    },
    [state.role],
  )

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, 'full_name' | 'phone_no' | 'branch'>>) => {
      if (!state.user) return
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', state.user.id)
        if (error) {
          console.error('Error updating profile:', error)
          return
        }
        setState((prev) => {
          if (!prev.user) return prev
          return {
            ...prev,
            user: { ...prev.user, ...updates },
          }
        })
      } catch (e) {
        console.error('Exception updating profile:', e)
      }
    },
    [state.user],
  )

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, can, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
