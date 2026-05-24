'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Mail, Settings, Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NotificationHistory {
  id: string
  news_id: string | null
  title: string
  body: string | null
  notification_type: string
  recipients_count: number
  created_at: string
  news?: { title: string }
}

export default function AdminNotifications() {
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notification_history')
      .select('*, news:news(title)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setHistory(data ?? [])
        setLoading(false)
      })
  }, [])

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'email_push': 'Email + Push',
      'email_only': 'Solo Email',
      'push_only': 'Solo Push',
      'custom': 'Personalizada',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'email_push': 'bg-purple-100 text-purple-800',
      'email_only': 'bg-blue-100 text-blue-800',
      'push_only': 'bg-green-100 text-green-800',
      'custom': 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/notifications/send"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            Nueva notificación
          </Link>
          <Link
            href="/admin/notifications/settings"
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">Cargando...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Sin notificaciones enviadas</h2>
          <p className="text-gray-500">Las notificaciones aparecerán aquí cuando se envíen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatarios</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Noticia</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(h.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{h.title}</p>
                    {h.body && <p className="text-sm text-gray-500 truncate max-w-xs">{h.body}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(h.notification_type)}`}>
                      {getTypeLabel(h.notification_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {h.recipients_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {h.news ? (
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {h.news.title}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}