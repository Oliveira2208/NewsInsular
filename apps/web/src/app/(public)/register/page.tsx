'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatIdentityDoc } from '@/lib/utils'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { requestNotificationPermission } from '@/lib/firebase'

const registerSchema = z.object({
  full_name: z.string().min(2, 'El nombre es requerido'),
  identity_prefix: z.enum(['V', 'E', 'P']),
  identity_number: z.string().regex(/^\d{7,8}$/, 'La cédula debe tener 7-8 dígitos'),
  birth_date: z.string().min(1, 'La fecha de nacimiento es requerida'),
  phone: z.string().regex(/^04(12|14|16|22|24|26)-\d{7}$/, 'Formato inválido. Use: 0412-1234567'),
  email: z.string().email('Email inválido'),
  notifications_email: z.boolean(),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [form, setForm] = useState<RegisterFormData>({
    full_name: '',
    identity_prefix: 'V',
    identity_number: '',
    birth_date: '',
    phone: '',
    email: '',
    notifications_email: true,
  })

  const validate = () => {
    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {}
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof RegisterFormData
        fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const supabase = createClient()
    const identity_doc = formatIdentityDoc(form.identity_prefix, form.identity_number)

    const { data, error } = await supabase
      .from('people')
      .insert({
        identity_doc,
        first_name: form.full_name.split(' ')[0] || form.full_name,
        last_name: form.full_name.split(' ').slice(1).join(' ') || form.full_name,
        phone: form.phone,
        email: form.email,
        notifications_email: form.notifications_email,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) {
        setErrors({ email: 'Este email ya está registrado' })
      }
      setLoading(false)
      return
    }

    if (data && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const fcmToken = await requestNotificationPermission()
        if (fcmToken) {
          await supabase
            .from('people')
            .update({ fcm_token: fcmToken })
            .eq('id', data.id)
        }
      } catch (err) {
        console.error('FCM token error:', err)
      }
    }

    setLoading(false)
    router.push('/register/success')
  }

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro</h1>
      <p className="text-gray-600 mb-8">Completa el formulario para registrarte</p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Juan Pérez"
          />
          {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula de identidad
          </label>
          <div className="flex gap-2">
            <select
              value={form.identity_prefix}
              onChange={(e) => handleChange('identity_prefix', e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="P">P</option>
            </select>
            <input
              type="text"
              value={form.identity_number}
              onChange={(e) => handleChange('identity_number', e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="12345678"
            />
          </div>
          {errors.identity_number && <p className="text-red-500 text-sm mt-1">{errors.identity_number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => handleChange('birth_date', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {errors.birth_date && <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0412-1234567"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="correo@ejemplo.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="notifications_email"
            checked={form.notifications_email}
            onChange={(e) => setForm((p) => ({ ...p, notifications_email: e.target.checked }))}
            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="notifications_email" className="text-sm text-gray-700">
            Deseo recibir notificaciones de nuevas noticias por correo electrónico
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  )
}