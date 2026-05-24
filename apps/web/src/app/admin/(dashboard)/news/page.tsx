'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { News } from '@/lib/types'

function getStatusBadge(news: News) {
  if (news.deleted_at) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
        Eliminada
      </span>
    )
  }
  if (news.scheduled_for) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Programada
      </span>
    )
  }
  if (news.published) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        Publicada
      </span>
    )
  }
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
      Borrador
    </span>
  )
}

export default function AdminNews() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('news')
      .select('*, category:categories(name), images:news_images(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNews(data ?? [])
        setLoading(false)
      })
  }, [])

  const fetchNews = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('news')
      .select('*, category:categories(name), images:news_images(*)')
      .order('created_at', { ascending: false })
    setNews(data ?? [])
    setLoading(false)
  }, [])

  const deleteNews = useCallback(async (id: string, isPublished: boolean) => {
    if (isPublished) {
      alert('No se pueden eliminar noticias publicadas. Puedes despublicarlas primero.')
      return
    }
    if (!confirm('¿Eliminar esta noticia? Esta acción no se puede deshacer.')) return
    const supabase = createClient()
    await supabase.from('news').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    fetchNews()
  }, [fetchNews])

  if (loading) return <div className="animate-pulse">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Noticias</h1>
        <Link
          href="/admin/news/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" />
          Nueva noticia
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {news.map((n) => (
              <tr key={n.id}>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{n.title}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{n.category?.name}</td>
                <td className="px-6 py-4">
                  {getStatusBadge(n)}
                  {n.scheduled_for && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.scheduled_for).toLocaleString()}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(n.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <Link
                    href={`/admin/news/${n.id}/edit`}
                    className="p-2 text-gray-500 hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => deleteNews(n.id, n.published)}
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
    </div>
  )
}