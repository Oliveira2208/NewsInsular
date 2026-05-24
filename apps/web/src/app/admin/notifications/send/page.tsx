'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { News } from '@/lib/types'

interface NewsOption {
  id: string
  title: string
}

export default function SendNotification() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState<NewsOption[]>([])
  const [form, setForm] = useState({
    news_id: '',
    title: '',
    body: '',
    notification_type: 'email_push',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('news')
      .select('id, title')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNews(data as NewsOption[] ?? []))
  }, [])

  const handleNewsChange = (newsId: string) => {
    const selected = news.find(n => n.id === newsId)
    setForm(prev => ({
      ...prev,
      news_id: newsId,
      title: selected?.title || '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    
    const { data: recipients } = await supabase
      .from('people')
      .select('email, fcm_token')
      .or('notifications_email.eq.true,fcm_token.not.is.null')

    const recipientCount = recipients?.length || 0

    // Log notification
    const { error } = await supabase.from('notification_history').insert({
      news_id: form.news_id || null,
      title: form.title,
      body: form.body,
      notification_type: form.notification_type,
      recipients_count: recipientCount,
    })

    if (!error) {
      alert('Notificación enviada correctamente')
      router.push('/admin/notifications')
    } else {
      alert('Error al enviar notificación')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Enviar notificación</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a noticia</label>
          <select
            value={form.news_id}
            onChange={(e) => handleNewsChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Sin vincular a noticia</option>
            {news.map((n) => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Opcional: vincula la notificación a una noticia existente</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Nueva noticia publicada"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            placeholder="Escribe el mensaje que recibirán los usuarios..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de notificación</label>
          <select
            value={form.notification_type}
            onChange={(e) => setForm(prev => ({ ...prev, notification_type: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="email_push">Email + Push</option>
            <option value="email_only">Solo Email</option>
            <option value="push_only">Solo Push</option>
            <option value="custom">Personalizada (sin envío automático)</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar notificación'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}