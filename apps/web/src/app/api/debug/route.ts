import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = await createClient()
  
  const { data: news, error, count } = await supabase
    .from('news')
    .select('id, title, published', { count: 'exact' })
    .eq('published', true)
    .limit(10)

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Debug News Feed</h1>
      <pre style={{ background: '#f0f0f0', padding: 10, borderRadius: 5 }}>
        {JSON.stringify({
          count,
          error: error ? { message: error.message } : null,
          newsCount: news?.length ?? 0,
          items: news
        }, null, 2)}
      </pre>
    </div>
  )
}