'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MarkdownEditor from '@/components/markdown-editor'

interface NewsTemplate {
  id: string
  name: string
  summary_template: string | null
  content_template: string | null
  is_active: boolean
  created_at: string
  categories?: { id: string, name: string }[]
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
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '',
    summary_template: '',
    content_template: '',
    category_ids: [] as string[],
    is_active: true,
  })

  const fetchTemplates = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('news_templates')
      .select('*, news_templates_categories:categories(id, name)')
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
    const { data: newTemplate } = await supabase
      .from('news_templates')
      .insert({
        name: form.name,
        summary_template: form.summary_template || null,
        content_template: form.content_template || null,
        is_active: form.is_active,
      })
      .select()
      .single()
    
    if (newTemplate && form.category_ids.length > 0) {
      const categoryLinks = form.category_ids.map((catId, idx) => ({
        template_id: newTemplate.id,
        category_id: catId,
        position: idx
      }))
      await supabase.from('news_templates_categories').insert(categoryLinks)
    }
    
    setForm({ name: '', summary_template: '', content_template: '', category_ids: [], is_active: true })
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
      is_active: form.is_active,
    }).eq('id', editingId)
    
    await supabase.from('news_templates_categories').delete().eq('template_id', editingId)
    
    if (form.category_ids.length > 0) {
      const categoryLinks = form.category_ids.map((catId, idx) => ({
        template_id: editingId,
        category_id: catId,
        position: idx
      }))
      await supabase.from('news_templates_categories').insert(categoryLinks)
    }
    
    setForm({ name: '', summary_template: '', content_template: '', category_ids: [], is_active: true })
    setEditingId(null)
    setShowForm(false)
    fetchTemplates()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    const supabase = createClient()
    await supabase.from('news_templates_categories').delete().eq('template_id', id)
    await supabase.from('news_templates').delete().eq('id', id)
    fetchTemplates()
  }

  const handleEdit = (template: NewsTemplate) => {
    const catIds = template.categories?.map(c => c.id) || []
    setForm({
      name: template.name,
      summary_template: template.summary_template || '',
      content_template: template.content_template || '',
      category_ids: catIds,
      is_active: template.is_active,
    })
    setEditingId(template.id)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setForm({ name: '', summary_template: '', content_template: '', category_ids: [], is_active: true })
    setEditingId(null)
    setShowForm(false)
  }

  const filteredTemplates = templates.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.summary_template?.toLowerCase().includes(search.toLowerCase()) ||
    t.categories?.some((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleCategory = (catId: string) => {
    setForm(p => ({
      ...p,
      category_ids: p.category_ids.includes(catId)
        ? p.category_ids.filter(id => id !== catId)
        : [...p.category_ids, catId]
    }))
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Plantillas de Noticias</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', summary_template: '', content_template: '', category_ids: [], is_active: true }) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nueva plantilla
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, resumen o categoría..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorías</label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[50px]">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      form.category_ids.includes(c.id)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resumen por defecto</label>
            <input
              type="text"
              value={form.summary_template}
              onChange={(e) => setForm(p => ({ ...p, summary_template: e.target.value }))}
              placeholder="Resumen predeterminado para la noticia..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div data-color-mode="light">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
            <MarkdownEditor
              value={form.content_template}
              onChange={(value) => setForm(p => ({ ...p, content_template: value }))}
              height={300}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categorías</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTemplates.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-4 text-gray-500">{t.categories?.map(c => c.name).filter(Boolean).join(', ') || '-'}</td>
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
        {filteredTemplates.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.categories?.map(c => c.name).filter(Boolean).join(', ') || 'Sin categorías'}</p>
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