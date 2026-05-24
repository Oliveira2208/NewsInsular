'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import type { Category } from '@/lib/types'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const fetchCategories = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.from('categories').insert({ name, slug: generateSlug(name) })
    setName('')
    setShowForm(false)
    fetchCategories()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const supabase = createClient()
    await supabase.from('categories').update({ name, slug: generateSlug(name) }).eq('id', editingId)
    setName('')
    setEditingId(null)
    setShowForm(false)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  const startEdit = (cat: Category) => {
    setName(cat.name)
    setEditingId(cat.id)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setName('')
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setName('') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="flex-1 px-4 py-2 border rounded-lg"
            required
          />
          <div className="flex gap-2">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 text-gray-500">{c.slug}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-2 text-gray-500 hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500">{c.slug}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(c)}
                  className="p-2 text-gray-500 hover:text-primary"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}