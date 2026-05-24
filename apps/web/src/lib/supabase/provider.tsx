'use client'

import { createContext, useContext } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function useSupabase() {
  const client = useContext(SupabaseContext)
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider')
  return client
}

export function SupabaseProvider({
  children,
  client,
}: {
  children: React.ReactNode
  client: SupabaseClient
}) {
  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  )
}