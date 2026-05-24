'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { News, Category } from '@/lib/types'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

type PublishMode = 'draft' | 'now' | 'scheduled'

export default function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [news, setNews] = useState<News | null>(null)
  const [publishMode, setPublishMode] = useState<PublishMode>('draft')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    category_ids: [] as string[],
    published: false,
  })
  const [images, setImages] = useState<File[]>([])
  const [deletingImages, setDeletingImages] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('news').select('*, images:news_images(*)').eq('id', id).single(),
      supabase.from('news_categories').select('category_id').eq('news_id', id),
    ]).then(([{ data: cats }, { data: n }, { data: newsCats }]) => {
      setCategories(cats ?? [])
      setNews(n)
      if (n) {
        setForm({
          title: n.title,
          summary: n.summary ?? '',
          content: n.content,
          category_ids: newsCats?.map((nc: { category_id: string }) => nc.category_id) ?? [],
          published: n.published,
        })
        if (n.scheduled_for) {
          setPublishMode('scheduled')
          const sched = new Date(n.scheduled_for)
          setScheduledDate(sched.toISOString().split('T')[0])
          setScheduledTime(sched.toTimeString().slice(0, 5))
        } else if (n.published) {
          setPublishMode('now')
        } else {
          setPublishMode('draft')
        }
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

    await supabase.from('news').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    router.push('/admin/news')
  }, [id, router])

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 60)
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    let scheduledFor: string | null = null
    let published = false
    let publishedAt: string | null = null

    if (publishMode === 'now') {
      published = true
      publishedAt = news?.published_at ?? new Date().toISOString()
    } else if (publishMode === 'scheduled' && scheduledDate && scheduledTime) {
      scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    }

    const updateData = {
      ...form,
      published,
      published_at: publishedAt,
      scheduled_for: scheduledFor,
    }

    await supabase.from('news').update(updateData).eq('id', id)

    await supabase.from('news_categories').delete().eq('news_id', id)
    if (form.category_ids.length > 0) {
      const categoryInserts = form.category_ids.map((catId, index) => ({
        news_id: id,
        category_id: catId,
        position: index,
      }))
      await supabase.from('news_categories').insert(categoryInserts)
    }

    if (images.length > 0) {
      await uploadImages(id, images, news?.images?.length ?? 0)
    }

    if (publishMode === 'now' && !news?.published) {
      const categoryNames = categories
        .filter(c => form.category_ids.includes(c.id))
        .map(c => c.name)
        .join(', ')
      try {
        await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-news-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: form.title,
              summary: form.summary,
              news_id: id,
              category_name: categoryNames,
            }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: form.title,
              body: form.summary,
              news_id: id,
            }),
          }),
        ])
      } catch (err) {
        console.error('Failed to send notifications:', err)
      }
    }

    setLoading(false)
    router.push('/admin/news')
  }

  if (!news) return <div>Cargando...</div>

  const existingImages = news.images?.sort((a, b) => a.position - b.position) ?? []

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar Noticia</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.category_ids.includes(c.id)}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setForm((p) => ({
                      ...p,
                      category_ids: checked
                        ? [...p.category_ids, c.id]
                        : p.category_ids.filter(id => id !== c.id),
                    }))
                  }}
                  className="rounded border-gray-300 text-primary"
                />
                <span className="text-sm text-gray-700">{c.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Selecciona una o más categorías</p>
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

        <div data-color-mode="light">
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <MDEditor
            value={form.content}
            onChange={(value) => setForm((p) => ({ ...p, content: value || '' }))}
            height={300}
            preview="edit"
          />
        </div>

        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes de Portada Actuales</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Nuevas Imágenes de Portada</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages([...e.target.files!])}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">La primera imagen se usará como portada principal</p>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Publicación</label>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="publishMode"
                value="draft"
                checked={publishMode === 'draft'}
                onChange={() => setPublishMode('draft')}
                className="text-primary"
              />
              <span className="text-sm text-gray-700">Guardar como borrador</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="publishMode"
                value="now"
                checked={publishMode === 'now'}
                onChange={() => setPublishMode('now')}
                className="text-primary"
              />
              <span className="text-sm text-gray-700">Publicar inmediatamente</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="publishMode"
                value="scheduled"
                checked={publishMode === 'scheduled'}
                onChange={() => setPublishMode('scheduled')}
                className="text-primary"
              />
              <span className="text-sm text-gray-700">Programar para más tarde</span>
            </label>

            {publishMode === 'scheduled' && (
              <div className="ml-6 mt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border rounded-lg text-sm w-full sm:w-auto"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hora</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm w-full sm:w-auto"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 order-1 sm:order-none"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={deleteNews}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 order-3 sm:order-none"
          >
            Eliminar Noticia
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 order-2 sm:order-none"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}