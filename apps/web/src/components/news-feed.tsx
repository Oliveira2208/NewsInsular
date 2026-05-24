'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
import { formatDate } from '@newsinsular/utils'
import type { News } from '@newsinsular/types'

interface NewsFeedProps {
  initialNews: News[]
}

export default function NewsFeed({ initialNews }: NewsFeedProps) {
  if (initialNews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay noticias disponibles
      </div>
    )
  }

  return (
    <div className="grid gap-8 mt-8 md:grid-cols-2">
      {initialNews.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </div>
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

  const handleShare = async () => {
    const url = `${window.location.origin}/news/${news.slug}`
    if (navigator.share) {
      await navigator.share({ title: news.title, text: news.summary ?? '', url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <Link href={`/news/${news.slug}`}>
      <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-video bg-gray-100">
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImage].url}
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

        <div className="p-4">
          {news.category && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2">
              {news.category.name}
            </span>
          )}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {news.title}
          </h2>
          {news.summary && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {news.summary}
            </p>
          )}
          <div className="flex items-center justify-between">
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