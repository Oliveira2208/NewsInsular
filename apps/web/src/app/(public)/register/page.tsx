'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatIdentityDoc } from '@/lib/utils'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { requestNotificationPermission } from '@/lib/firebase'

const registerSchema = z.object({
  first_name: z.string().min(2, 'El nombre no puede estar vacío'),
  last_name: z.string().min(2, 'El apellido no puede estar vacío'),
  identity_prefix: z.enum(['V', 'E', 'P']),
  identity_number: z.string().regex(/^\d{7,8}$/, 'La cédula debe tener 7-8 dígitos'),
  birth_date: z.string().min(1, 'La fecha de nacimiento es requerida'),
  phone: z.string().regex(/^04(12|14|16|22|24|26)-\d{7}$/, 'Formato inválido. Use: 0412-1234567'),
  email: z.string().email('Email inválido'),
  state_id: z.number().min(1, 'El estado es requerido'),
  municipality_id: z.number().min(1, 'El municipio es requerido'),
  parish_id: z.number().min(1, 'La parroquia es requerida'),
  commune_id: z.number().min(1, 'La comuna es requerida'),
  address: z.string().min(5, 'La dirección es requerida'),
  notifications_email: z.boolean(),
})

type RegisterFormData = z.infer<typeof registerSchema>
type FieldName = keyof RegisterFormData

interface State {
  id: number
  name: string
}

interface Municipality {
  id: number
  name: string
  state_id: number
}

interface Parish {
  id: number
  name: string
  municipality_id: number
}

interface Commune {
  id: number
  name: string
  municipality_id: number
}

function formatPhoneNumber(value: string, previousValue: string): string {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 4) {
    return numbers
  }
  
  const prefix = numbers.substring(0, 4)
  const suffix = numbers.substring(4, 11)
  
  if (numbers.length <= 11) {
    return `${prefix}-${suffix}`
  }
  
  return previousValue
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [form, setForm] = useState<RegisterFormData>({
    first_name: '',
    last_name: '',
    identity_prefix: 'V',
    identity_number: '',
    birth_date: '',
    phone: '',
    email: '',
    state_id: 0,
    municipality_id: 0,
    parish_id: 0,
    commune_id: 0,
    address: '',
    notifications_email: true,
  })
  const [states, setStates] = useState<State[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [parishes, setParishes] = useState<Parish[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])

  useEffect(() => {
    const fetchLocations = async () => {
      const supabase = createClient()
      
      const [statesRes, municipalitiesRes, parishesRes, communesRes] = await Promise.all([
        supabase.from('states').select('*').order('name'),
        supabase.from('municipalities').select('*').order('name'),
        supabase.from('parishes').select('*').order('name'),
        supabase.from('communes').select('*').order('name'),
      ])
      
      setStates(statesRes.data || [])
      setMunicipalities(municipalitiesRes.data || [])
      setParishes(parishesRes.data || [])
      setCommunes(communesRes.data || [])
    }
    
    fetchLocations()
  }, [])

  const validateField = useCallback((field: FieldName, value: string | number): string | null => {
    const fieldSchema = registerSchema.shape[field]
    if (!fieldSchema) return null

    const result = fieldSchema.safeParse(value)
    if (!result.success) {
      return result.error.errors[0]?.message || 'Valor inválido'
    }
    return null
  }, [])

  const handleBlur = (field: FieldName, value: string | number) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error || undefined }))
  }

  const handleChange = (field: FieldName, value: string | number) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value }
      
      if (field === 'state_id') {
        newForm.municipality_id = 0
        newForm.parish_id = 0
        newForm.commune_id = 0
      } else if (field === 'municipality_id') {
        newForm.parish_id = 0
        newForm.commune_id = 0
      }
      
      return newForm
    })
    
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error || undefined }))
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value, form.phone)
    setForm(prev => ({ ...prev, phone: formatted }))
    
    if (touched.phone) {
      const error = validateField('phone', formatted)
      setErrors(prev => ({ ...prev, phone: error || undefined }))
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
      const allFields: FieldName[] = ['first_name', 'last_name', 'identity_prefix', 'identity_number', 'birth_date', 'phone', 'email', 'state_id', 'municipality_id', 'parish_id', 'commune_id', 'address']
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

    const insertData = {
      identity_doc,
      first_name: form.first_name,
      last_name: form.last_name,
      birth_date: form.birth_date,
      phone: form.phone,
      email: form.email,
      state_id: form.state_id,
      municipality_id: form.municipality_id,
      parish_id: form.parish_id,
      commune_id: form.commune_id,
      address: form.address,
      notifications_email: form.notifications_email,
    }
    
    console.log('Inserting data:', insertData)
    console.log('State IDs - state:', form.state_id, 'muni:', form.municipality_id, 'parish:', form.parish_id, 'commune:', form.commune_id)

    const { data, error } = await supabase
      .from('people')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      
      if (error.code === '23505') {
        if (error.message.includes('identity_doc')) {
          setErrors({ identity_number: 'Esta cédula ya está registrada' })
          setTouched(prev => ({ ...prev, identity_number: true }))
        } else if (error.message.includes('email')) {
          setErrors({ email: 'Este email ya está registrado' })
          setTouched(prev => ({ ...prev, email: true }))
        } else {
          alert('Este registro ya existe en el sistema')
        }
      } else if (error.code === '23503') {
        alert('Error: Datos de ubicación inválidos. Por favor selecciona nuevamente tu ubicación.')
      } else if (error.code === '22P02') {
        alert('Error: Formato de datos inválido. Verifica todos los campos.')
      } else {
        alert(`Error al registrar: ${error.message}`)
      }
      setLoading(false)
      return
    }

    if (data) {
      if (form.notifications_email) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: form.email,
              fullName: `${form.first_name} ${form.last_name}`,
              unsubscribe_token: data.unsubscribe_token,
            }),
          })
        } catch (err) {
          console.error('Welcome email error:', err)
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const fcmToken = await requestNotificationPermission()
          if (fcmToken) {
            await supabase
              .from('people')
              .update({ push_token: fcmToken })
              .eq('id', data.id)
          }
        } catch (err) {
          console.error('FCM token error:', err)
        }
      }
    }

    setLoading(false)
    router.push('/register/success')
  }

  const getFieldClass = (field: FieldName): string => {
    if (!touched[field]) return 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'
    if (errors[field]) return 'w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
    return 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'
  }

  const filteredMunicipalities = form.state_id ? municipalities.filter(m => m.state_id === form.state_id) : []
  const filteredParishes = form.municipality_id ? parishes.filter(p => p.municipality_id === form.municipality_id) : []
  const filteredCommunes = form.municipality_id ? communes.filter(c => c.municipality_id === form.municipality_id) : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro</h1>
      <p className="text-gray-600 mb-8">Completa el formulario para registrarte</p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            onBlur={(e) => handleBlur('first_name', e.target.value)}
            className={getFieldClass('first_name')}
            placeholder="Juan"
          />
          {touched.first_name && errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido
          </label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            onBlur={(e) => handleBlur('last_name', e.target.value)}
            className={getFieldClass('last_name')}
            placeholder="Pérez"
          />
          {touched.last_name && errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
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
            <p className="text-red-500 text-sm mt-1">{errors.identity_number}</p>
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
            <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={(e) => handleBlur('phone', form.phone)}
            className={getFieldClass('phone')}
            placeholder="0412-1234567"
          />
          {touched.phone && errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
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
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={form.state_id || ''}
            onChange={(e) => handleChange('state_id', Number(e.target.value))}
            onBlur={(e) => handleBlur('state_id', Number(e.target.value))}
            className={getFieldClass('state_id')}
          >
            <option value="">Seleccionar estado</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
          {touched.state_id && errors.state_id && (
            <p className="text-red-500 text-sm mt-1">{errors.state_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Municipio
          </label>
          <select
            value={form.municipality_id || ''}
            onChange={(e) => handleChange('municipality_id', Number(e.target.value))}
            onBlur={(e) => handleBlur('municipality_id', Number(e.target.value))}
            className={getFieldClass('municipality_id')}
            disabled={!form.state_id}
          >
            <option value="">Seleccionar municipio</option>
            {filteredMunicipalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {touched.municipality_id && errors.municipality_id && (
            <p className="text-red-500 text-sm mt-1">{errors.municipality_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parroquia
          </label>
          <select
            value={form.parish_id || ''}
            onChange={(e) => handleChange('parish_id', Number(e.target.value))}
            onBlur={(e) => handleBlur('parish_id', Number(e.target.value))}
            className={getFieldClass('parish_id')}
            disabled={!form.municipality_id}
          >
            <option value="">Seleccionar parroquia</option>
            {filteredParishes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {touched.parish_id && errors.parish_id && (
            <p className="text-red-500 text-sm mt-1">{errors.parish_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comuna
          </label>
          <select
            value={form.commune_id || ''}
            onChange={(e) => handleChange('commune_id', Number(e.target.value))}
            onBlur={(e) => handleBlur('commune_id', Number(e.target.value))}
            className={getFieldClass('commune_id')}
            disabled={!form.municipality_id}
          >
            <option value="">Seleccionar comuna</option>
            {filteredCommunes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {touched.commune_id && errors.commune_id && (
            <p className="text-red-500 text-sm mt-1">{errors.commune_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <textarea
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            onBlur={(e) => handleBlur('address', e.target.value)}
            className={getFieldClass('address')}
            placeholder="Dirección completa"
            rows={2}
          />
          {touched.address && errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
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