'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { News, Category } from '@/lib/types'

export default function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [news, setNews] = useState<News | null>(null)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category_id: '',
    published: false,
  })
  const [images, setImages] = useState<File[]>([])
  const [deletingImages, setDeletingImages] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('news').select('*, images:news_images(*)').eq('id', id).single(),
    ]).then(([{ data: cats }, { data: n }]) => {
      setCategories(cats ?? [])
      setNews(n)
      if (n) {
        setForm({
          title: n.title,
          slug: n.slug,
          summary: n.summary ?? '',
          content: n.content,
          category_id: n.category_id ?? '',
          published: n.published,
        })
      }
    })
  }, [id])

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

  const deleteImage = useCallback(async (imageId: string, imageUrl: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    setDeletingImages((prev) => [...prev, imageId])

    const supabase = createClient()

    const pathMatch = imageUrl.match(/\/news-images\/(.+)$/)
    if (pathMatch) {
      await supabase.storage.from('news-images').remove([pathMatch[1]])
    }

    await supabase.from('news_images').delete().eq('id', imageId)

    setNews((prev) =>
      prev ? { ...prev, images: prev.images?.filter((img) => img.id !== imageId) } : null
    )
    setDeletingImages((prev) => prev.filter((imgId) => imgId !== imageId))
  }, [])

  const deleteNews = useCallback(async () => {
    if (!confirm('¿Eliminar esta noticia? Esta acción no se puede deshacer.')) return
    const supabase = createClient()

    if (news?.images) {
      const paths = news.images
        .map((img) => img.url.match(/\/news-images\/(.+)$/)?.[1])
        .filter(Boolean)
      if (paths.length > 0) {
        await supabase.storage.from('news-images').remove(paths as string[])
      }
    }

    await supabase.from('news').delete().eq('id', id)
    router.push('/admin/news')
  }, [id, news, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    await supabase.from('news').update(form).eq('id', id)

    if (images.length > 0) {
      await uploadImages(id, images, news?.images?.length ?? 0)
    }

    setLoading(false)
    router.push('/admin/news')
  }

  if (!news) return <div>Cargando...</div>

  const existingImages = news.images?.sort((a, b) => a.position - b.position) ?? []

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar noticia</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value, slug: generateSlug(e.target.value) }))}
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

        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes actuales</label>
            <div className="grid grid-cols-3 gap-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id, img.url)}
                    disabled={deletingImages.includes(img.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  {deletingImages.includes(img.id) && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">Eliminando...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agregar nuevas imágenes</label>
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
          <label htmlFor="published" className="text-sm text-gray-700">Publicada</label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={deleteNews}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Eliminar noticia
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