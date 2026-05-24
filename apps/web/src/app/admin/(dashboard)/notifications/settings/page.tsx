'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NotificationSetting {
  id: string
  key: string
  value: string
  description: string | null
}

export default function NotificationSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notification_settings')
      .select('*')
      .order('key')
      .then(({ data }) => {
        setSettings(data ?? [])
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    for (const setting of settings) {
      await supabase
        .from('notification_settings')
        .update({ value: setting.value })
        .eq('key', setting.key)
    }

    setSaving(false)
    alert('Configuración guardada correctamente')
    router.push('/admin/notifications')
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const placeholders: Record<string, string> = {
    'email_subject_template': '📰 {title}',
    'email_body_template': 'Se ha publicado una nueva noticia:\n\n{title}\n\n{summary}\n\nLeer más: {url}',
    'push_title_template': '{title}',
    'push_body_template': '{summary}',
    'app_name': 'NewsInsular',
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configuración de notificaciones</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {settings.map((setting) => (
          <div key={setting.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
            {setting.key === 'app_name' ? (
              <input
                type="text"
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={placeholders[setting.key]}
              />
            ) : (
              <textarea
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                rows={3}
                placeholder={placeholders[setting.key]}
              />
            )}
            {setting.description && (
              <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
            )}
          </div>
        ))}

        <div className="border-t pt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h2 className="font-medium text-blue-900 mb-2">Variables disponibles</h2>
        <p className="text-sm text-blue-700 mb-3">Usa estas variables en las plantillas:</p>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
          <code className="bg-blue-100 px-2 py-1 rounded">{'{title}'}</code>
          <span className="text-blue-800">Título de la noticia</span>
          <code className="bg-blue-100 px-2 py-1 rounded">{'{summary}'}</code>
          <span className="text-blue-800">Resumen de la noticia</span>
          <code className="bg-blue-100 px-2 py-1 rounded">{'{url}'}</code>
          <span className="text-blue-800">URL de la noticia</span>
        </div>
      </div>
    </div>
  )
}