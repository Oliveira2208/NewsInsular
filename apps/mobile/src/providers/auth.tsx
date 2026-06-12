import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import * as authClient from '@/lib/auth/client'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  personId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  personId: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [personId, setPersonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    setLoading(true)
    const u = await authClient.getSession()
    setUser(u)
    if (u?.email) {
      const pid = await authClient.getPersonByEmail(u.email)
      setPersonId(pid)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const signIn = useCallback(async (email: string, password: string) => {
    await authClient.signIn(email, password)
    await fetchSession()
  }, [fetchSession])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await authClient.signUp(name, email, password)
    await fetchSession()
  }, [fetchSession])

  const signOut = useCallback(async () => {
    await authClient.signOut()
    setUser(null)
    setPersonId(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, personId, loading, signIn, signUp, signOut, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
