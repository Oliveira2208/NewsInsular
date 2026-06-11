'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authClient } from './client'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  refresh: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = async () => {
    setLoading(true)
    const { data } = await authClient.getSession()
    setUser(data?.user ?? null)
    setLoading(false)
  }

  useEffect(() => {
    fetchSession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
