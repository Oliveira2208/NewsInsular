'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatIdentityDoc } from '@/lib/utils'
import { requestNotificationPermission } from '@/lib/firebase'
import { User, Check, ChevronRight, ChevronLeft, Leaf } from 'lucide-react'

const INTERESTS_OPTIONS = [
  { value: 'environmental_education', label: 'Educación ambiental y talleres' },
  { value: 'reforestation', label: 'Reforestación y huertos urbanos' },
  { value: 'recycling', label: 'Reciclaje y gestión de residuos' },
  { value: 'wildlife_protection', label: 'Protección de fauna y flora local' },
  { value: 'digital_activism', label: 'Activismo digital y comunicación' },
  { value: 'other', label: 'Otras' },
]

const PARTICIPATION_OPTIONS = [
  { value: 'digital_activist', label: 'Activista digital', description: 'Compartiendo campañas desde casa' },
  { value: 'field_volunteer', label: 'Voluntario en terreno', description: 'Asistiendo a eventos y jornadas físicas' },
  { value: 'coordinator', label: 'Coordinador', description: 'Ayudando a organizar actividades y equipos' },
  { value: 'expert_leader', label: 'Líder experto', description: 'Dictando talleres de formación o charlas especializadas' },
]

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  city: string
  country: string
  profession: string
  identity_prefix: string
  identity_number: string
  birth_date: string
  interests: string[]
  participation_type: string
  skills: string
  motivation: string
  experience_proposal: string
  state_id: number
  municipality_id: number
  parish_id: number
  commune_id: number
  address: string
}

interface LocationData {
  states: { id: number; name: string }[]
  municipalities: { id: number; name: string; state_id: number }[]
  parishes: { id: number; name: string; municipality_id: number }[]
  communes: { id: number; name: string; municipality_id: number }[]
}

export function MultiStepRegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<LocationData>({ states: [], municipalities: [], parishes: [], communes: [] })

  const [form, setForm] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    country: 'Venezuela',
    profession: '',
    identity_prefix: 'V',
    identity_number: '',
    birth_date: '',
    interests: [],
    participation_type: '',
    skills: '',
    motivation: '',
    experience_proposal: '',
    state_id: 0,
    municipality_id: 0,
    parish_id: 0,
    commune_id: 0,
    address: '',
  })

  const updateForm = (field: keyof FormData, value: string | string[] | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleInterest = (value: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter(i => i !== value)
        : [...prev.interests, value]
    }))
  }

  const filteredMunicipalities = form.state_id ? locations.municipalities.filter(m => m.state_id === form.state_id) : []
  const filteredParishes = form.municipality_id ? locations.parishes.filter(p => p.municipality_id === form.municipality_id) : []
  const filteredCommunes = form.municipality_id ? locations.communes.filter(c => c.municipality_id === form.municipality_id) : []

  useEffect(() => {
    const supabase = createClient()
    const fetchLocations = async () => {
      const [statesRes, municipalitiesRes, parishesRes, communesRes] = await Promise.all([
        supabase.from('states').select('id, name').order('name'),
        supabase.from('municipalities').select('id, name, state_id').order('name'),
        supabase.from('parishes').select('id, name, municipality_id').order('name'),
        supabase.from('communes').select('id, name, municipality_id').order('name'),
      ])
      setLocations({
        states: statesRes.data ?? [],
        municipalities: municipalitiesRes.data ?? [],
        parishes: parishesRes.data ?? [],
        communes: communesRes.data ?? [],
      })
    }
    fetchLocations()
  }, [])

  const handleStateChange = (stateId: number) => {
    setForm(prev => ({ ...prev, state_id: stateId, municipality_id: 0, parish_id: 0, commune_id: 0 }))
  }

  const handleMunicipalityChange = (munId: number) => {
    const mun = locations.municipalities.find(m => m.id === munId)
    setForm(prev => ({ ...prev, municipality_id: munId, city: mun?.name ?? '', parish_id: 0, commune_id: 0 }))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.first_name && form.last_name && form.email && form.state_id && form.municipality_id && form.address
      case 2:
        return form.interests.length > 0
      case 3:
        return form.participation_type
      case 4:
        return true
      default:
        return true
    }
  }

  const handleSubmit = async () => {
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
      city: form.city,
      country: form.country,
      profession: form.profession,
      interests: form.interests,
      participation_type: form.participation_type,
      skills: form.skills,
      motivation: form.motivation,
      experience_proposal: form.experience_proposal,
      state_id: form.state_id,
      municipality_id: form.municipality_id,
      parish_id: form.parish_id || null,
      commune_id: form.commune_id || null,
      address: form.address,
      notifications_email: true,
    }

    const { data, error } = await supabase
      .from('people')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      alert('Error al registrar. Por favor intenta de nuevo.')
      setLoading(false)
      return
    }

    if (data) {
      // TODO: Reactivar envío de emails cuando se configure RESEND_API_KEY
      // try {
      //   await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       email: form.email,
      //       fullName: `${form.first_name} ${form.last_name}`,
      //       unsubscribe_token: data.unsubscribe_token,
      //     }),
      //   })
      // } catch (err) {
      //   console.error('Welcome email error:', err)
      // }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const fcmToken = await requestNotificationPermission()
          if (fcmToken) {
            await supabase.from('people').update({ push_token: fcmToken }).eq('id', data.id)
          }
        } catch (err) {
          console.error('FCM token error:', err)
        }
      }
    }

    setLoading(false)
    router.push('/register/success')
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300
            ${s === step ? 'bg-primary text-white scale-110' : s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
          `}>
            {s < step ? <Check className="w-5 h-5" /> : s}
          </div>
          {s < 4 && (
            <div className={`w-12 h-1 mx-2 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const stepVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Leaf className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Únete a NewsInsular</h1>
        <p className="text-gray-600">Completa el formulario para registrarte</p>
      </div>

      <StepIndicator />

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <AnimatePresence mode="wait" custom={step}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Paso 1: Conozcámonos</h2>
                  <p className="text-sm text-gray-500">Cuéntanos sobre ti</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => updateForm('first_name', e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => updateForm('last_name', e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Teléfono (opcional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0412-1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    value={form.state_id}
                    onChange={(e) => handleStateChange(Number(e.target.value))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value={0}>Selecciona un estado</option>
                    {locations.states.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
                  <select
                    value={form.municipality_id}
                    onChange={(e) => handleMunicipalityChange(Number(e.target.value))}
                    disabled={!form.state_id}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value={0}>Selecciona un municipio</option>
                    {filteredMunicipalities.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parroquia</label>
                  <select
                    value={form.parish_id}
                    onChange={(e) => updateForm('parish_id', Number(e.target.value))}
                    disabled={!form.municipality_id}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value={0}>Selecciona una parroquia</option>
                    {filteredParishes.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                  <select
                    value={form.commune_id}
                    onChange={(e) => updateForm('commune_id', Number(e.target.value))}
                    disabled={!form.municipality_id}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value={0}>Selecciona una comuna</option>
                    {filteredCommunes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección exacta *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Calle, casa, edificio, sector..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesión *</label>
                  <input
                    type="text"
                    value={form.profession}
                    onChange={(e) => updateForm('profession', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ingeniero, Docente, Estudiante..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Paso 2: Tus Intereses Ambientales</h2>
                  <p className="text-sm text-gray-500">Selecciona todas las opciones que te apasionen</p>
                </div>
              </div>

              <div className="space-y-3">
                {INTERESTS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${form.interests.includes(option.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={form.interests.includes(option.value)}
                      onChange={() => toggleInterest(option.value)}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">🤝</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Paso 3: ¿Cómo te gustaría participar?</h2>
                  <p className="text-sm text-gray-500">Elige tu nivel de disponibilidad actual</p>
                </div>
              </div>

              <div className="space-y-3">
                {PARTICIPATION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${form.participation_type === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <input
                      type="radio"
                      name="participation"
                      value={option.value}
                      checked={form.participation_type === option.value}
                      onChange={() => updateForm('participation_type', option.value)}
                      className="w-5 h-5 mt-0.5 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Paso 4: Un toque personal</h2>
                  <p className="text-sm text-gray-500">Cuéntanos más sobre ti (todo es opcional)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Tienes alguna habilidad que quieras compartir?
                  </label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={(e) => updateForm('skills', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ej: Fotografía, diseño, leyes, manejo de herramientas..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Qué te motivó a unirte a nuestra red?
                  </label>
                  <textarea
                    value={form.motivation}
                    onChange={(e) => updateForm('motivation', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={3}
                    placeholder="Cuéntanos brevemente en un párrafo corto..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Tienes alguna experiencia o propuesta en el área?
                  </label>
                  <textarea
                    value={form.experience_proposal}
                    onChange={(e) => updateForm('experience_proposal', e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={3}
                    placeholder="Comparte tu experiencia o propuesta..."
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <p className="font-medium text-gray-700">Privacidad de datos</p>
                      <p className="text-sm text-gray-500">Cuidamos tus datos como cuidamos el planeta. Nunca los compartiremos con terceros.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8 pt-6 border-t">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Registrando...' : '🟢 ENVIAR Y SALVAR EL PLANETA'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}