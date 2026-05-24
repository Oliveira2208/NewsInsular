'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NewsTemplate {
  id: string
  name: string
  summary_template: string | null
  content_template: string | null
  default_category_id: string | null
  is_active: boolean
  category?: { name: string }
}

export default function SelectNewsTemplate() {
  const router = useRouter()
  const [templates, setTemplates] = useState<NewsTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('news_templates')
      .select('*, category:categories(name)')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setTemplates(data ?? [])
        setLoading(false)
      })
  }, [])

  const selectTemplate = (templateId: string) => {
    router.push(`/admin/news/create?template=${templateId}`)
  }

  const startFromScratch = () => {
    router.push('/admin/news/create')
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Crear Nueva Noticia</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={startFromScratch}
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center gap-3 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Empezar de cero</p>
            <p className="text-sm text-gray-500 mt-1">Crear noticia desde cero</p>
          </div>
        </button>

        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTemplate(t.id)}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="font-medium text-gray-900">{t.name}</p>
            {t.category?.name && (
              <p className="text-xs text-gray-500 mt-1">{t.category.name}</p>
            )}
            <div className="mt-3 flex items-center gap-1 text-sm text-primary">
              <span>Usar plantilla</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <a
          href="/admin/news/templates"
          className="text-sm text-gray-500 hover:text-primary"
        >
          Gestionar plantillas →
        </a>
      </div>
    </div>
  )
}