import { Suspense } from 'react'
import NewsFeed from '@/components/news-feed'
import CategoryFilter from '@/components/category-filter'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getCategories() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Categories error:', error.message, error.details)
      return []
    }
    
    return data ?? []
  } catch (e) {
    console.error('Categories exception:', e)
    return []
  }
}

async function getNews() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*, category:categories(*), images:news_images(*)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('News error:', error.message, error.details)
      return []
    }

    return data ?? []
  } catch (e) {
    console.error('News exception:', e)
    return []
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams

  const categories = await getCategories()
  const news = await getNews()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Noticias</h1>
      
      <div className="mb-4 p-4 bg-yellow-100 rounded text-sm font-mono">
        Debug: {categories.length} categorías, {news.length} noticias
      </div>

      <Suspense fallback={<div className="h-12 bg-gray-200 rounded-lg animate-pulse" />}>
        <CategoryFilter categories={categories} activeSlug={params.category} />
      </Suspense>

      <Suspense fallback={<NewsSkeleton />}>
        <NewsFeed initialNews={news} />
      </Suspense>
    </div>
  )
}

function NewsSkeleton() {
  return (
    <div className="grid gap-8 mt-8 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="h-64 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}