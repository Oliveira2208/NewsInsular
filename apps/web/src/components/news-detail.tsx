'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
import { formatDate } from '@newsinsular/utils'
import type { News } from '@newsinsular/types'

interface NewsDetailProps {
  news: News
}

export default function NewsDetail({ news }: NewsDetailProps) {
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
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: news.title, text: news.summary ?? '', url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {news.category && (
        <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mb-4">
          {news.category.name}
        </span>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {news.title}
      </h1>

      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <span className="text-gray-500">{formatDate(news.created_at)}</span>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary border rounded-lg"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>

      {images.length > 0 && (
        <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
          <Image
            src={images[currentImage].url}
            alt={news.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i === currentImage ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {news.summary && (
        <p className="text-xl text-gray-600 mb-6 font-medium">{news.summary}</p>
      )}

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: news.content }}
      />
    </article>
  )
}