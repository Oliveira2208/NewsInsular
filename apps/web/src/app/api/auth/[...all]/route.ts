import { auth } from '@/lib/auth/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'exp://',
  process.env.NEXT_PUBLIC_APP_URL || 'https://newsinsular.vercel.app',
  ...(process.env.CORS_ORIGINS?.split(',') || []),
].filter(Boolean) as string[]

function getOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  if (ALLOWED_ORIGINS.some((a) => origin.startsWith(a))) return origin
  return null
}

function setCorsHeaders(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers)
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

const { GET: baseGET, POST: basePOST } = toNextJsHandler(auth)

export async function GET(request: Request) {
  const origin = getOrigin(request)
  if (!origin) return baseGET(request)
  return setCorsHeaders(await baseGET(request), origin)
}

export async function POST(request: Request) {
  const origin = getOrigin(request)
  if (!origin) return basePOST(request)
  return setCorsHeaders(await basePOST(request), origin)
}

export async function OPTIONS(request: Request) {
  const origin = getOrigin(request)
  if (!origin)
    return new Response(null, { status: 204 })

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
}
