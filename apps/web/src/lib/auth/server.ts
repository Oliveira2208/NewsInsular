import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}