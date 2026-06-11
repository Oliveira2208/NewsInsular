'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

const POPUP_KEY = 'newsinsular_popup_dismissed'

export function FirstVisitPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(POPUP_KEY)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    sessionStorage.setItem(POPUP_KEY, 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9 9 0 10.799-3.813l-4.455-6.492a3 3 0 00-4.682-1.103z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19.128a9.38 9.38 0 002.625.372 9 9 0 01-.372-2.625l-2.253-.72a3 3 0 00-4.682 1.103z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido a NewsInsular!</h2>
        </div>

        <Link
          href="/register"
          onClick={handleClose}
          className="inline-block w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-500 transition-all shadow-lg"
        >
          Registrarse ahora
        </Link>

        <p className="mt-4 text-xs text-gray-400">
          Solo los administradores pueden iniciar sesión
        </p>
      </div>
    </div>
  )
}