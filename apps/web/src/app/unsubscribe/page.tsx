'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>
}

export default function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleUnsubscribe = async () => {
      const params = await searchParams
      const token = params.token

      if (!token) {
        setStatus('invalid')
        setMessage('Enlace inválido. No se proporcionó token de cancelación.')
        return
      }

      const supabase = createClient()

      const { data: person, error } = await supabase
        .from('people')
        .select('id, full_name, email')
        .eq('unsubscribe_token', token)
        .single()

      if (error || !person) {
        setStatus('invalid')
        setMessage('Este enlace ya no es válido o ha expirado.')
        return
      }

      const { error: updateError } = await supabase
        .from('people')
        .update({ notifications_email: false })
        .eq('unsubscribe_token', token)

      if (updateError) {
        setStatus('error')
        setMessage('Ocurrió un error al procesar tu solicitud. Intenta nuevamente.')
        return
      }

      setStatus('success')
      setMessage(`Se ha cancelado la suscripción para ${person.email}. Ya no recibirás notificaciones por correo electrónico.`)
    }

    handleUnsubscribe()
  }, [searchParams])

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {status === 'loading' && (
        <>
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Procesando solicitud...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Suscripción cancelada</h1>
          <p className="text-gray-600">{message}</p>
        </>
      )}

      {(status === 'error' || status === 'invalid') && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{message}</p>
        </>
      )}
    </div>
  )
}