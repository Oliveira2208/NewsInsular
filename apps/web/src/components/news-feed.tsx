'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Share2, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { News } from '@/lib/types'

function sanitizeImageUrl(url: string | undefined): string {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('blob:')) return '/placeholder.svg'
  return url
}

interface NewsFeedProps {
  initialNews: News[]
  categorySlug?: string
}

export default function NewsFeed({ initialNews, categorySlug }: NewsFeedProps) {
  const [news, setNews] = useState<News[]>(initialNews)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const CategorySlug = categorySlug || undefined

  const PAGE_SIZE = 10

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    const nextPage = page + 1
    
    const supabase = createClient()
    
    let query = supabase
      .from('news')
      .select('*, categories:news_categories(categories(*)), images:news_images(*)')
      .eq('published', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1)

    if (CategorySlug) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', CategorySlug)
        .single()

      if (catData) {
        const { data: newsIds } = await supabase
          .from('news_categories')
          .select('news_id')
          .eq('category_id', catData.id)

        if (newsIds && newsIds.length > 0) {
          query = query.in('id', newsIds.map((n: { news_id: string }) => n.news_id))
        } else {
          setHasMore(false)
          setLoading(false)
          return
        }
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Load more error:', error)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      setNews(prev => [...prev, ...data])
      setPage(nextPage)
      if (data.length < PAGE_SIZE) {
        setHasMore(false)
      }
    } else {
      setHasMore(false)
    }
    
    setLoading(false)
  }, [loading, hasMore, page, CategorySlug])

  useEffect(() => {
    setNews(initialNews)
    setPage(0)
    setHasMore(true)
  }, [initialNews])

  useEffect(() => {
    if (!hasMore || loading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadMore])

  if (news.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay noticias disponibles
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-8 mt-8 md:grid-cols-2">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
      
      <div ref={loadingRef} className="py-8 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando más noticias...</span>
          </div>
        )}
        {!loading && !hasMore && news.length > 0 && (
          <p className="text-gray-400 text-sm">No hay más noticias</p>
        )}
      </div>
    </>
  )
}

function NewsCard({ news }: { news: News }) {
  const images = news.images?.sort((a, b) => a.position - b.position) ?? []
  const [currentImage, setCurrentImage] = useState(0)

  const prevImage = useCallback(() => {
    setCurrentImage((p) => (p > 0 ? p - 1 : images.length - 1))
  }, [images.length])

  const nextImage = useCallback(() => {
    setCurrentImage((p) => (p < images.length - 1 ? p + 1 : 0))
  }, [images.length])

  const goToImage = useCallback((i: number) => {
    setCurrentImage(i)
  }, [])

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/news/${news.id}`
    if (navigator.share) {
      await navigator.share({ title: news.title, text: news.summary ?? '', url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const showReadMore = news.summary && news.summary.length > 150

  return (
    <Link href={`/news/${news.id}`}>
      <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="relative aspect-video bg-gray-100 flex-shrink-0">
          {images.length > 0 ? (
            <>
              <Image
                src={sanitizeImageUrl(images[currentImage].url)}
                alt={news.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToImage(i)}
                        className={`w-2 h-2 rounded-full ${
                          i === currentImage ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          {news.categories && news.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {news.categories.map((cat, idx) => {
                const catName = cat.categories?.name
                return catName ? (
                  <span key={idx} className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {catName}
                  </span>
                ) : null
              })}
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {news.title}
          </h2>
          {news.summary && (
            <p className="text-sm text-gray-600 mb-3 flex-grow">
              {showReadMore ? (
                <>
                  {news.summary.slice(0, 150)}...
                  <span className="text-primary font-medium ml-1">Leer más</span>
                </>
              ) : (
                news.summary
              )}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <span className="text-xs text-gray-500">
              {formatDate(news.created_at)}
            </span>
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-primary"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}