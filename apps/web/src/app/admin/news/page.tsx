'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { News } from '@/lib/types'

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

  const deleteNews = useCallback(async (id: string) => {
    if (!confirm('¿Eliminar esta noticia?')) return
    const supabase = createClient()
    await supabase.from('news').delete().eq('id', id)
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
                  <span className={`px-2 py-1 text-xs rounded-full ${n.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {n.published ? 'Publicada' : 'Borrador'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(n.created_at).toLocaleDateString('es')}
                </td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <Link
                    href={`/admin/news/${n.id}/edit`}
                    className="p-2 text-gray-500 hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => deleteNews(n.id)}
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