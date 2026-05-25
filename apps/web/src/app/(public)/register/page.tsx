'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatIdentityDoc } from '@/lib/utils'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { requestNotificationPermission } from '@/lib/firebase'

const registerSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  identity_prefix: z.enum(['V', 'E', 'P']),
  identity_number: z.string().regex(/^\d{7,8}$/, 'La cédula debe tener 7-8 dígitos'),
  birth_date: z.string().min(1, 'La fecha de nacimiento es requerida'),
  phone: z.string().regex(/^04(12|14|16|22|24|26)-\d{7}$/, 'Formato inválido. Use: 0412-1234567'),
  email: z.string().email('Email inválido'),
  notifications_email: z.boolean(),
})

type RegisterFormData = z.infer<typeof registerSchema>

type FieldName = keyof RegisterFormData

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [form, setForm] = useState<RegisterFormData>({
    full_name: '',
    identity_prefix: 'V',
    identity_number: '',
    birth_date: '',
    phone: '',
    email: '',
    notifications_email: true,
  })

  const validateField = useCallback((field: FieldName, value: string): string | null => {
    const fieldSchema = registerSchema.shape[field]
    if (!fieldSchema) return null

    const result = fieldSchema.safeParse(value)
    if (!result.success) {
      return result.error.errors[0]?.message || 'Valor inválido'
    }
    return null
  }, [])

  const handleBlur = (field: FieldName, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error || undefined }))
  }

  const handleChange = (field: FieldName, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error || undefined }))
    }
  }

  const validate = (): boolean => {
    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<FieldName, string>> = {}
      result.error.errors.forEach((e) => {
        const field = e.path[0] as FieldName
        fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      
      const allTouched: Partial<Record<FieldName, boolean>> = {}
      const allFields: FieldName[] = ['full_name', 'identity_prefix', 'identity_number', 'birth_date', 'phone', 'email']
      allFields.forEach(f => { allTouched[f] = true })
      setTouched(allTouched)
      
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
        setTouched(prev => ({ ...prev, email: true }))
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

  const getFieldClass = (field: FieldName): string => {
    if (!touched[field]) return 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'
    return errors[field] 
      ? 'w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500' 
      : 'w-full px-4 py-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
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
            onBlur={(e) => handleBlur('full_name', e.target.value)}
            className={getFieldClass('full_name')}
            placeholder="Juan Pérez"
          />
          {touched.full_name && errors.full_name && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
              {errors.full_name}
            </p>
          )}
          {touched.full_name && !errors.full_name && form.full_name.length >= 2 && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-green-500 rounded-full" />
              Válido
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula de identidad
          </label>
          <div className="flex gap-2">
            <select
              value={form.identity_prefix}
              onChange={(e) => handleChange('identity_prefix', e.target.value)}
              onBlur={(e) => handleBlur('identity_prefix', e.target.value)}
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
              onBlur={(e) => handleBlur('identity_number', e.target.value)}
              className={getFieldClass('identity_number')}
              placeholder="12345678"
            />
          </div>
          {touched.identity_number && errors.identity_number && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
              {errors.identity_number}
            </p>
          )}
          {touched.identity_number && !errors.identity_number && form.identity_number.length >= 7 && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-green-500 rounded-full" />
              Válido
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => handleChange('birth_date', e.target.value)}
            onBlur={(e) => handleBlur('birth_date', e.target.value)}
            className={getFieldClass('birth_date')}
          />
          {touched.birth_date && errors.birth_date && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
              {errors.birth_date}
            </p>
          )}
          {touched.birth_date && !errors.birth_date && form.birth_date && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-green-500 rounded-full" />
              Válido
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono (formato: 0412-1234567)
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={(e) => handleBlur('phone', e.target.value)}
            className={getFieldClass('phone')}
            placeholder="0412-1234567"
          />
          {touched.phone && errors.phone && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
              {errors.phone}
            </p>
          )}
          {touched.phone && !errors.phone && form.phone && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-green-500 rounded-full" />
              Válido
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Códigos válidos: 0412, 0414, 0416, 0422, 0424, 0426</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={(e) => handleBlur('email', e.target.value)}
            className={getFieldClass('email')}
            placeholder="correo@ejemplo.com"
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
              {errors.email}
            </p>
          )}
          {touched.email && !errors.email && form.email.includes('@') && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-green-500 rounded-full" />
              Válido
            </p>
          )}
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