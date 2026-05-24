'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NotificationTemplate {
  id: string
  name: string
  title_template: string
  body_template: string
  notification_type: string
  is_active: boolean
  created_at: string
}

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    title_template: '',
    body_template: '',
    notification_type: 'email_push',
    is_active: true,
  })

  const fetchTemplates = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('notification_templates')
      .select('*')
      .order('name')
    setTemplates(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('notification_templates').insert(form)
    setForm({ name: '', title_template: '', body_template: '', notification_type: 'email_push', is_active: true })
    setShowForm(false)
    fetchTemplates()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const supabase = createClient()
    await supabase.from('notification_templates').update(form).eq('id', editingId)
    setForm({ name: '', title_template: '', body_template: '', notification_type: 'email_push', is_active: true })
    setEditingId(null)
    setShowForm(false)
    fetchTemplates()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    const supabase = createClient()
    await supabase.from('notification_templates').delete().eq('id', id)
    fetchTemplates()
  }

  const handleEdit = (template: NotificationTemplate) => {
    setForm({
      name: template.name,
      title_template: template.title_template,
      body_template: template.body_template || '',
      notification_type: template.notification_type,
      is_active: template.is_active,
    })
    setEditingId(template.id)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setForm({ name: '', title_template: '', body_template: '', notification_type: 'email_push', is_active: true })
    setEditingId(null)
    setShowForm(false)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'email_push': 'Email + Push',
      'email_only': 'Solo Email',
      'push_only': 'Solo Push',
      'custom': 'Personalizada',
    }
    return labels[type] || type
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Plantillas de Notificaciones</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', title_template: '', body_template: '', notification_type: 'email_push', is_active: true }) }}
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
                placeholder="ej: Nueva Noticia"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.notification_type}
                onChange={(e) => setForm(p => ({ ...p, notification_type: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="email_push">Email + Push</option>
                <option value="email_only">Solo Email</option>
                <option value="push_only">Solo Push</option>
                <option value="custom">Personalizada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla de Título</label>
            <input
              type="text"
              value={form.title_template}
              onChange={(e) => setForm(p => ({ ...p, title_template: e.target.value }))}
              placeholder="📰 {title}"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla de Mensaje</label>
            <textarea
              value={form.body_template}
              onChange={(e) => setForm(p => ({ ...p, body_template: e.target.value }))}
              placeholder="Se ha publicado: {title}"
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
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
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">{'{body}'}</code>
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">{'{url}'}</code>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{t.title_template}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    {getTypeLabel(t.notification_type)}
                  </span>
                </td>
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
                <p className="text-sm text-gray-500 truncate mt-1">{t.title_template}</p>
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                {getTypeLabel(t.notification_type)}
              </span>
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