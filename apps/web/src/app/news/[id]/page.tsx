import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import { ChevronLeft, Share2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: news } = await supabase
    .from('news')
    .select('*, categories:news_categories(categories(name)), images:news_images(*)')
    .eq('id', id)
    .eq('published', true)
    .is('deleted_at', null)
    .single()

  const sortedImages = news?.images?.sort((a: { position: number }, b: { position: number }) => a.position - b.position) ?? []
  const newsCategories = news?.categories?.map((nc: { categories: { name: string } }) => nc.categories) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 md:hidden">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-primary">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
          <button className="p-2 text-gray-500 hover:text-primary">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="hidden md:block mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>

        <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {sortedImages.length > 0 && (
            <div className="relative aspect-[16/9] md:aspect-[21/9] bg-gray-100">
              <Image
                src={sortedImages[0].url}
                alt={news.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )}

          <div className="p-5 md:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {newsCategories.length > 0 && newsCategories.map((cat: { name: string }, index: number) => (
                <span key={index} className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {cat.name}
                </span>
              ))}
              <span className="text-gray-400 text-sm">
                {formatDate(news.created_at)}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {news.title}
            </h1>

            {news.summary && (
              <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed font-medium border-l-4 border-blue-500 pl-4">
                {news.summary}
              </p>
            )}

            <div className="prose prose-gray max-w-none">
              <div 
                className="news-content text-gray-700 leading-relaxed md:text-lg"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">NewsInsular</span>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: news.title,
                        text: news.summary || news.title,
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Enlace copiado al portapapeles')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors">
            Ver más noticias
          </Link>
        </div>
      </main>
    </div>
  )
}