import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    hasUrl: !!url,
    hasKey: !!key,
    url: url ? 'SET' : 'MISSING',
    keyLength: key ? key.length : 0
  })
}