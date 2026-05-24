'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@newsinsular/utils'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@newsinsular/types'

export default function CreateNews() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category_id: '',
    published: false,
  })
  const [images, setImages] = useState<File[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('*').then(({ data }) => setCategories(data ?? []))
  }, [])

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({ ...prev, title, slug: generateSlug(title) }))
  }

  const uploadImages = useCallback(async (newsId: string, files: File[], existingCount: number) => {
    const supabase = createClient()
    const uploads = files.map((file, i) => {
      const ext = file.name.split('.').pop()
      const path = `news/${newsId}/${Date.now()}-${i}.${ext}`
      return supabase.storage.from('news-images').upload(path, file).then(async ({ error }) => {
        if (error) return
        const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(path)
        await supabase.from('news_images').insert({
          news_id: newsId,
          url: publicUrl,
          position: existingCount + i,
        })
      })
    })
    await Promise.all(uploads)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: news, error } = await supabase
      .from('news')
      .insert({ ...form, author_id: user?.id })
      .select()
      .single()

    if (error || !news) {
      setLoading(false)
      return
    }

    if (images.length > 0) {
      await uploadImages(news.id, images, 0)
    }

    if (form.published) {
      const firstImage = images.length > 0 ? null : (news as any).images?.[0]?.url
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-new-news`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newsId: news.id,
            title: news.title,
            summary: news.summary,
            imageUrl: firstImage,
          }),
        })
      } catch (err) {
        console.error('Failed to send notifications:', err)
      }
    }

    setLoading(false)
    router.push('/admin/news')
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nueva noticia</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            rows={10}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages([...e.target.files!])}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
          />
          <label htmlFor="published" className="text-sm text-gray-700">Publicar inmediatamente</label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}