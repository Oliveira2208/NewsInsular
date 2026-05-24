import { createClient } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

const SupabaseContext = createContext(supabase)

export function useSupabase() {
  return useContext(SupabaseContext)
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}