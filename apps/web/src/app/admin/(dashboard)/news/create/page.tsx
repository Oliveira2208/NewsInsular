'use client'

import { useState, useEffect, useCallback, Suspense, DragEvent, ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { authClient } from '@/lib/auth/client'
import type { Category } from '@/lib/types'
import MarkdownEditor from '@/components/markdown-editor'
import { Eye, X, Upload, Image as ImageIcon } from 'lucide-react'

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
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFromUrl, setUploadingFromUrl] = useState(false)

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

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    const urlFiles: File[] = []
    
    const uriList = e.dataTransfer.getData('text/uri-list')
    if (uriList) {
      const urls = uriList.split('\n').filter(url => 
        url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)
      )
      for (const url of urls) {
        const trimmedUrl = url.trim()
        if (trimmedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
          setUploadingFromUrl(true)
          try {
            const response = await fetch(trimmedUrl)
            const blob = await response.blob()
            const ext = trimmedUrl.split('.').pop()?.split('?')[0] || 'jpg'
            const filename = `image_${Date.now()}.${ext}`
            const file = new File([blob], filename, { type: `image/${ext}` })
            urlFiles.push(file)
          } catch (err) {
            console.error('Error uploading image from URL:', err)
          }
          setUploadingFromUrl(false)
        }
      }
    }
    
    if (files.length > 0 || urlFiles.length > 0) {
      const allNewImages = [...images, ...files, ...urlFiles]
      setImages(allNewImages)
      const newPreviews = allNewImages.map(f => URL.createObjectURL(f))
      setImagePreviews(newPreviews)
    }
  }, [images])

  const handleImageRemove = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }, [images, imagePreviews])

  const handleImageSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      const newImages = [...images, ...files]
      setImages(newImages)
      const newPreviews = newImages.map(f => URL.createObjectURL(f))
      setImagePreviews(newPreviews)
    }
  }, [images])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: session } = await authClient.getSession()
    const user = session?.user

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
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              {uploadingFromUrl ? (
                <>
                  <svg className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-blue-600">Subiendo imagen desde URL...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Arrastra imágenes aquí o <span className="text-primary font-medium">haz clic para seleccionar</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 10MB o arrastra desde internet</p>
                </>
              )}
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                      Portada
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 order-1 sm:order-none"
          >
            <Eye className="w-4 h-4" />
            Vista previa
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 order-2 sm:order-none"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 order-3 sm:order-none"
          >
            Cancelar
          </button>
        </div>

        {showPreview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold">Vista previa de la noticia</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {imagePreviews[0] && (
                  <div className="relative aspect-[21/9] bg-gray-100 rounded-xl mb-6 overflow-hidden">
                    <img
                      src={imagePreviews[0]}
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {form.category_ids.map((catId) => {
                    const cat = categories.find(c => c.id === catId)
                    return cat ? (
                      <span key={catId} className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {cat.name}
                      </span>
                    ) : null
                  })}
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {form.title || 'Sin título'}
                </h1>
                {form.summary && (
                  <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed font-medium border-l-4 border-blue-500 pl-4">
                    {form.summary}
                  </p>
                )}
                <div className="news-content text-gray-700 leading-relaxed md:text-lg">
                  <div dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              </div>
            </div>
          </div>
        )}
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