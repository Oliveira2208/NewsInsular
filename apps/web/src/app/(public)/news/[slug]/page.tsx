import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NewsDetail from '@/components/news-detail'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return getMetadata(slug)
}

async function getMetadata(slug: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('news')
    .select('title, summary, content, images:news_images(url)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) return { title: 'Noticia no encontrada' }

  return {
    title: data.title,
    description: data.summary ?? data.content?.slice(0, 160) ?? '',
    openGraph: {
      title: data.title,
      description: data.summary ?? '',
      images: data.images?.[0]?.url ? [data.images[0].url] : [],
    },
  }
}

async function getNewsBySlug(slug: string) {
  const supabase = createClient()
  return supabase
    .from('news')
    .select('*, images:news_images(*), category:categories(*)')
    .eq('slug', slug)
    .eq('published', true)
    .single()
}

export default async function NewsPage({ params }: Props) {
  const { slug } = await params
  const { data } = await getNewsBySlug(slug)

  if (!data) notFound()

  return <NewsDetail news={data} />
}