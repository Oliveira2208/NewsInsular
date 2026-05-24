import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = await createClient()
  
  const { data: news, error, status } = await supabase
    .from('news')
    .select('id, title, published')
    .eq('published', true)
    .limit(5)
  
  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Debug Page</h1>
      <pre>
        {JSON.stringify({
          error: error ? { message: error.message, details: error.details } : null,
          status,
          count: news?.length ?? 0,
          news: news ?? []
        }, null, 2)}
      </pre>
    </div>
  )
}