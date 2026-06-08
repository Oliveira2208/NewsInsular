'use server'

import { authClient } from '@/lib/auth/client'
import { redirect } from 'next/navigation'

export async function signOut() {
  await authClient.signOut()
  redirect('/admin/login')
}