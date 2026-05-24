import { Suspense } from 'react'
import NewsFeed from '@/components/news-feed'
import CategoryFilter from '@/components/category-filter'
import { createClient } from '@/lib/supabase/client'

async function getCategories() {
  const supabase = createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return data ?? []
}

async function getNews(categorySlug?: string) {
  const supabase = createClient()

  const [categoryResult, newsResult] = await Promise.all([
    categorySlug
      ? supabase.from('categories').select('id').eq('slug', categorySlug).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('news')
      .select('*, category:categories(*), images:news_images(*)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const categoryId = categoryResult.data?.id
  let news = newsResult.data ?? []

  if (categoryId) {
    news = news.filter((n) => n.category_id === categoryId)
  }

  return news
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams

  const [categories, news] = await Promise.all([
    getCategories(),
    getNews(params.category),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Noticias</h1>

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