'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from './client'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refresh: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refresh: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchSession = async () => {
    setLoading(true)
    const { data } = await authClient.getSession()
    setUser(data?.user ?? null)
    setLoading(false)
  }

  const signOut = useCallback(async () => {
    await authClient.signOut()
    setUser(null)
    router.push('/admin/login')
  }, [router])

  useEffect(() => {
    fetchSession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
