'use client'

import { useState, type ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { SupabaseContext } from '@/lib/supabase/provider'
import { AuthProvider } from '@/lib/auth/auth-context'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  return (
    <SupabaseContext.Provider value={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SupabaseContext.Provider>
  )
}