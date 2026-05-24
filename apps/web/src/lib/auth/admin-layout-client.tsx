'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { AuthLoading } from './auth-loading'

interface AdminLayoutClientProps {
  children: React.ReactNode
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (!user) {
    return null
  }

  return (
    <div data-user-email={user.email}>
      {children}
    </div>
  )
}