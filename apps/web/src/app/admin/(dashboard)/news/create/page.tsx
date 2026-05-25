'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'
import MarkdownEditor from '@/components/markdown-editor'

type PublishMode = 'draft' | 'now' | 'scheduled'

interface NewsTemplate {
  id: string
  name: string
  summary_template: string | null
  content_template: string | null
  default_category_id: string | null
}

function CreateNewsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [template, setTemplate] = useState<NewsTemplate | null>(null)
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

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      const { data: cats } = await supabase.from('categories').select('*')
      setCategories(cats ?? [])

      if (templateId) {
        const { data: tpl } = await supabase
          .from('news_templates')
          .select('*')
          .eq('id', templateId)
          .single()
        if (tpl) {
          setTemplate(tpl)
          setForm(prev => ({
            ...prev,
            summary: tpl.summary_template || prev.summary,
            content: tpl.content_template || prev.content,
            category_ids: tpl.default_category_id ? [tpl.default_category_id] : prev.category_ids,
          }))
        }
      }
    }

    loadData()
  }, [templateId])

  const handleTitleChange = (title: string) => {
    setForm((prev) => {
      let content = prev.content
      if (template?.content_template && prev.content === template.content_template) {
        content = template.content_template.replace(/{title}/g, title)
      }
      return { ...prev, title, content }
    })
  }

  const loadTemplateContent = (tpl: typeof template) => {
    if (tpl) {
      setForm(prev => ({
        ...prev,
        summary: tpl.summary_template || prev.summary,
        content: tpl.content_template || prev.content,
        category_ids: tpl.default_category_id ? [tpl.default_category_id] : prev.category_ids,
      }))
    }
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

    let scheduledFor: string | null = null
    let published = false
    let publishedAt: string | null = null

    if (publishMode === 'now') {
      published = true
      publishedAt = new Date().toISOString()
    } else if (publishMode === 'scheduled' && scheduledDate && scheduledTime) {
      scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    }

    const insertData = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      published,
      published_at: publishedAt,
      scheduled_for: scheduledFor,
      author_id: user?.id,
    }

    const { data: news, error } = await supabase
      .from('news')
      .insert(insertData)
      .select()
      .single()

    if (error || !news) {
      setLoading(false)
      return
    }

    if (form.category_ids.length > 0) {
      const categoryInserts = form.category_ids.map((catId, index) => ({
        news_id: news.id,
        category_id: catId,
        position: index,
      }))
      await supabase.from('news_categories').insert(categoryInserts)
    }

    if (images.length > 0) {
      await uploadImages(news.id, images, 0)
    }

    if (publishMode === 'now') {
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
              title: news.title,
              summary: news.summary,
              news_id: news.id,
              category_name: categoryNames,
            }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: news.title,
              body: news.summary,
              news_id: news.id,
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

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/news/select" className="hover:text-primary">Crear Noticia</Link>
        {template && (
          <>
            <span>/</span>
            <span>{template.name}</span>
          </>
        )}
      </div>

      {template && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-6">
          <p className="text-sm text-primary font-medium">Usando plantilla: {template.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Escribe el título de la noticia..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {form.category_ids.map((catId) => {
              const cat = categories.find(c => c.id === catId)
              return cat ? (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({
                      ...p,
                      category_ids: p.category_ids.filter(id => id !== catId),
                    }))}
                    className="hover:text-primary-dark"
                  >
                    ×
                  </button>
                </span>
              ) : null
            })}
          </div>
          <input
            type="text"
            placeholder="Buscar categorías..."
            className="w-full px-4 py-2 border rounded-lg mb-2"
            onChange={(e) => {
              const search = e.target.value.toLowerCase()
              const filtered = categories.filter(c =>
                c.name.toLowerCase().includes(search) &&
                !form.category_ids.includes(c.id)
              )
            }}
          />
          <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto">
            {categories.filter(c => !form.category_ids.includes(c.id)).length === 0 ? (
              <p className="text-sm text-gray-500 p-2">Todas las categorías seleccionadas</p>
            ) : (
              categories
                .filter(c => !form.category_ids.includes(c.id))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm((p) => ({
                      ...p,
                      category_ids: [...p.category_ids, c.id],
                    }))}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {c.name}
                  </button>
                ))
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            rows={2}
            placeholder="Resumen breve de la noticia..."
          />
        </div>

        <div data-color-mode="light">
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <MarkdownEditor
            value={form.content}
            onChange={(value) => setForm((p) => ({ ...p, content: value }))}
            height={300}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes de portada</label>
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
            {loading ? 'Guardando...' : 'Guardar'}
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

export default function CreateNews() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CreateNewsContent />
    </Suspense>
  )
}