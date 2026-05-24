'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatIdentityDoc, VENEZUELA_STATES } from '@newsinsular/utils'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const identitySchema = z.string().regex(/^\d{6,9}$/)

const registerSchema = z.object({
  full_name: z.string().min(2, 'Nombre requerido'),
  identity_prefix: z.enum(['V', 'E', 'P']),
  identity_number: z.string().regex(/^\d{6,9}$/, 'Documento inválido (6-9 dígitos)'),
  birth_date: z.string().min(1, 'Fecha requerida'),
  phone: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  state: z.string().min(1, 'Estado requerido'),
  municipality: z.string().min(1, 'Municipio requerido'),
  parish: z.string().min(1, 'Parroquia requerida'),
  commune: z.string().min(1, 'Comuna requerida'),
  address: z.string().min(5, 'Dirección requerida'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [form, setForm] = useState<RegisterFormData>({
    full_name: '',
    identity_prefix: 'V',
    identity_number: '',
    birth_date: '',
    phone: '',
    email: '',
    state: '',
    municipality: '',
    parish: '',
    commune: '',
    address: '',
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

    const { error } = await supabase.from('people').insert({
      full_name: form.full_name,
      identity_doc,
      birth_date: form.birth_date,
      phone: form.phone,
      email: form.email,
      state: form.state,
      municipality: form.municipality,
      parish: form.parish,
      commune: form.commune,
      address: form.address,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('unique')) {
        setErrors({ email: 'Este email ya está registrado' })
      }
      return
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullName: form.full_name }),
      })
    } catch (err) {
      console.error('Failed to send welcome email:', err)
    }

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
            Nombre y apellidos
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="María García"
          />
          {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documento de identidad
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
              placeholder="123456789"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="correo@ejemplo.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Seleccionar...</option>
              {VENEZUELA_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
            <input
              type="text"
              value={form.municipality}
              onChange={(e) => handleChange('municipality', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.municipality && <p className="text-red-500 text-sm mt-1">{errors.municipality}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parroquia</label>
            <input
              type="text"
              value={form.parish}
              onChange={(e) => handleChange('parish', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.parish && <p className="text-red-500 text-sm mt-1">{errors.parish}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
            <input
              type="text"
              value={form.commune}
              onChange={(e) => handleChange('commune', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.commune && <p className="text-red-500 text-sm mt-1">{errors.commune}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección exacta</label>
          <textarea
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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