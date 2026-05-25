'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NewsOption {
  id: string
  title: string
  summary: string | null
}

interface NotificationTemplate {
  id: string
  name: string
  title_template: string
  body_template: string
  notification_type: string
}

export default function SendNotification() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [news, setNews] = useState<NewsOption[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [previewCount, setPreviewCount] = useState<number>(0)
  const [form, setForm] = useState({
    news_id: '',
    title: '',
    body: '',
    notification_type: 'email_only',
    template_id: '',
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('news')
        .select('id, title, summary')
        .eq('published', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('name'),
    ]).then(([{ data: newsData }, { data: templatesData }]) => {
      setNews(newsData as NewsOption[] ?? [])
      setTemplates(templatesData ?? [])
    })

    supabase
      .from('people')
      .select('id', { count: 'exact', head: true })
      .eq('notifications_email', true)
      .is('deleted_at', null)
      .then(({ count }) => setPreviewCount(count || 0))
  }, [])

  const handleNewsChange = async (newsId: string) => {
    const selected = news.find(n => n.id === newsId)
    setForm(prev => ({
      ...prev,
      news_id: newsId,
      title: selected?.title || prev.title,
      body: selected?.summary || prev.body,
    }))
  }

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
      setForm(prev => ({ ...prev, template_id: '', title: '', body: '', notification_type: 'email_only' }))
      return
    }
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setForm(prev => ({
        ...prev,
        template_id: templateId,
        title: template.title_template,
        body: template.body_template || '',
        notification_type: template.notification_type,
      }))
    }
  }

  const sendEmails = async (newsId: string | null, title: string, body: string) => {
    const supabase = createClient()
    
    const { data: people } = await supabase
      .from('people')
      .select('id, email, unsubscribe_token')
      .eq('notifications_email', true)
      .is('deleted_at', null)

    if (!people || people.length === 0) return { sent: 0 }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    const resendPromises = people.map(async (person: any) => {
      const unsubscribeLink = `${appUrl}/unsubscribe?token=${person.unsubscribe_token}`
      
      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #1a56db; margin-bottom: 16px; font-size: 24px;">${title}</h1>
    
    ${body ? `<p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${body}</p>` : ''}
    
    ${newsId ? `
    <a href="${appUrl}/news/${newsId}" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Ver noticia completa
    </a>` : ''}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
      <p style="color: #666; font-size: 12px; text-align: center; margin-bottom: 10px;">
        ¿No deseas recibir estas notificaciones?
      </p>
      <p style="color: #666; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #1a56db; text-decoration: underline;">
          Cancela tu suscripción
        </a>
      </p>
    </div>
    
    <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
      © 2026 NewsInsular. Todos los derechos reservados.
    </p>
  </div>
</body>
</html>
      `

      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-custom-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: person.email,
            subject: title,
            html,
          }),
        })
        return true
      } catch (err) {
        console.error('Failed to send to:', person.email, err)
        return false
      }
    })

    const results = await Promise.all(resendPromises)
    return { sent: results.filter(r => r).length }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    let emailSent = 0
    if (form.notification_type === 'email_only' || form.notification_type === 'email_push') {
      setSendingEmail(true)
      const result = await sendEmails(form.news_id || null, form.title, form.body)
      emailSent = result.sent
      setSendingEmail(false)
    }

    const { error } = await supabase.from('notification_history').insert({
      news_id: form.news_id || null,
      title: form.title,
      body: form.body,
      notification_type: form.notification_type,
      recipients_count: emailSent || previewCount,
    })

    setLoading(false)

    if (!error) {
      alert(`Notificación enviada correctamente a ${emailSent || previewCount} usuarios`)
      router.push('/admin/notifications')
    } else {
      alert('Error al registrar la notificación')
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Enviar notificación</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Destinatarios potenciales:</strong> {previewCount} usuarios con suscripciones de email activas
        </p>
      </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla</label>
          <select
            value={form.template_id}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Personalizado</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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
            <option value="email_only">Solo Email</option>
            <option value="email_push">Email + Push</option>
            <option value="push_only">Solo Push (no implementado)</option>
            <option value="custom">Solo registrar (sin envío)</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || sendingEmail}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 order-1 sm:order-none"
          >
            {loading ? (sendingEmail ? 'Enviando emails...' : 'Guardando...') : 'Enviar notificación'}
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