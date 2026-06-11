import { createAuthClient } from 'better-auth/next-js'
import { cookies } from 'next/headers'

export const authServer = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
})

export async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('better-auth.session_token')?.value
  if (!sessionToken) return null
  
  const { data: session } = await authServer.getSession(sessionToken)
  return session
}