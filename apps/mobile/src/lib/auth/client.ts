import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const COOKIE_KEY = 'better-auth-session'

function getCookieFromResponse(headers: Headers): string | null {
  const setCookie = headers.get('set-cookie')
  if (!setCookie) return null
  const match = setCookie.match(/session_token=([^;]+)/)
  return match ? match[1] : null
}

async function persistCookie(cookie: string) {
  await SecureStore.setItemAsync(COOKIE_KEY, cookie)
}

async function getPersistedCookie(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(COOKIE_KEY)
  } catch {
    return null
  }
}

async function clearPersistedCookie() {
  await SecureStore.deleteItemAsync(COOKIE_KEY)
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const cookie = await getPersistedCookie()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (cookie) {
    headers['Cookie'] = `session_token=${cookie}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const newCookie = getCookieFromResponse(res.headers)
  if (newCookie) {
    await persistCookie(newCookie)
  }

  return res
}

export async function signIn(email: string, password: string) {
  const res = await apiFetch('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Credenciales inválidas')
  return res.json()
}

export async function signUp(name: string, email: string, password: string) {
  const res = await apiFetch('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Error al registrarse')
  }
  return res.json()
}

export async function signOut() {
  await apiFetch('/api/auth/sign-out', { method: 'POST' })
  await clearPersistedCookie()
}

export async function getSession() {
  const res = await apiFetch('/api/auth/get-session')
  if (!res.ok) {
    await clearPersistedCookie()
    return null
  }
  const data = await res.json()
  return data?.user ?? null
}

export async function getPersonByEmail(email: string) {
  const supabase = (await import('@supabase/supabase-js')).createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('people')
    .select('id')
    .eq('email', email)
    .single()
  return data?.id ?? null
}
