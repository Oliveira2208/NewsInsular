import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: newsCount }, { count: peopleCount }, { data: recentNews }] = await Promise.all([
    supabase.from('news').select('id', { count: 'exact' }).eq('published', true),
    supabase.from('people').select('id', { count: 'exact' }),
    supabase
      .from('news')
      .select('*, category:categories(name)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Published Articles" value={newsCount ?? 0} />
        <StatCard label="Registered People" value={peopleCount ?? 0} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent News</h2>
        {recentNews && recentNews.length > 0 ? (
          <div className="space-y-3">
            {recentNews.map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500">{n.category?.name}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No published news</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}