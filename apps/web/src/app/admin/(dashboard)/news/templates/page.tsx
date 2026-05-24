'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

interface NewsTemplate {
  id: string
  name: string
  summary_template: string | null
  content_template: string | null
  default_category_id: string | null
  is_active: boolean
  created_at: string
  category?: Category
}

interface CategoryOption {
  id: string
  name: string
}

export default function NewsTemplates() {
  const [templates, setTemplates] = useState<NewsTemplate[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    summary_template: '',
    content_template: '',
    default_category_id: '',
    is_active: true,
  })

  const fetchTemplates = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('news_templates')
      .select('*, category:categories(name)')
      .order('name')
    setTemplates(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      fetchTemplates(),
      supabase.from('categories').select('id, name').order('name').then(({ data }) => data ?? [])
    ]).then(([, cats]) => {
      setCategories(cats)
    })
  }, [fetchTemplates])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('news_templates').insert({
      name: form.name,
      summary_template: form.summary_template || null,
      content_template: form.content_template || null,
      default_category_id: form.default_category_id || null,
      is_active: form.is_active,
    })
    setForm({ name: '', summary_template: '', content_template: '', default_category_id: '', is_active: true })
    setShowForm(false)
    fetchTemplates()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const supabase = createClient()
    await supabase.from('news_templates').update({
      name: form.name,
      summary_template: form.summary_template || null,
      content_template: form.content_template || null,
      default_category_id: form.default_category_id || null,
      is_active: form.is_active,
    }).eq('id', editingId)
    setForm({ name: '', summary_template: '', content_template: '', default_category_id: '', is_active: true })
    setEditingId(null)
    setShowForm(false)
    fetchTemplates()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    const supabase = createClient()
    await supabase.from('news_templates').delete().eq('id', id)
    fetchTemplates()
  }

  const handleEdit = (template: NewsTemplate) => {
    setForm({
      name: template.name,
      summary_template: template.summary_template || '',
      content_template: template.content_template || '',
      default_category_id: template.default_category_id || '',
      is_active: template.is_active,
    })
    setEditingId(template.id)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setForm({ name: '', summary_template: '', content_template: '', default_category_id: '', is_active: true })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Plantillas de Noticias</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', summary_template: '', content_template: '', default_category_id: '', is_active: true }) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nueva plantilla
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="ej: Noticia Standard"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría por defecto</label>
              <select
                value={form.default_category_id}
                onChange={(e) => setForm(p => ({ ...p, default_category_id: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla de Resumen</label>
            <input
              type="text"
              value={form.summary_template}
              onChange={(e) => setForm(p => ({ ...p, summary_template: e.target.value }))}
              placeholder="{summary}"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla de Contenido (Markdown)</label>
            <textarea
              value={form.content_template}
              onChange={(e) => setForm(p => ({ ...p, content_template: e.target.value }))}
              placeholder="# Título&#10;&#10;Contenido..."
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
              rows={8}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Activa</label>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-2">Variables disponibles:</p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">{'{title}'}</code>
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">{'{summary}'}</code>
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">{'{date}'}</code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={cancelEdit} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-4 text-gray-500">{t.category?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {t.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button onClick={() => handleEdit(t)} className="p-2 text-gray-500 hover:text-primary">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-500 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.category?.name || 'Sin categoría'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(t)} className="p-2 text-gray-500 hover:text-primary">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <span className={`px-2 py-1 text-xs rounded-full ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                {t.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}