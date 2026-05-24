import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { News } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: news } = await supabase
    .from('news')
    .select('*, category:categories(name), images:news_images(*)')
    .eq('id', id)
    .eq('published', true)
    .single()

  if (!news) notFound()

  const sortedImages = news.images?.sort((a: { position: number }, b: { position: number }) => a.position - b.position) ?? []

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-6">
        <ChevronLeft className="w-4 h-4" />
        Volver
      </Link>

      <article>
        <header className="mb-8">
          {news.category && (
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mb-4">
              {news.category.name}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {news.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {formatDate(news.created_at)}
          </p>
        </header>

        {sortedImages.length > 0 && (
          <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
            <Image
              src={sortedImages[0].url}
              alt={news.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {news.summary && (
          <p className="text-xl text-gray-600 mb-8 font-medium">
            {news.summary}
          </p>
        )}

        <div className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap">{news.content}</p>
        </div>
      </article>
    </div>
  )
}