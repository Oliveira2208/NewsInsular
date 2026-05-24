'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { AuthLoading } from './auth-loading'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login-admin')
    }
  }, [loading, user, router])

  if (loading) {
    return <AuthLoading />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}