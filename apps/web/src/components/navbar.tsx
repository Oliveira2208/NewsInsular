'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, UserPlus } from 'lucide-react'
import { NotificationsDropdown } from './notifications-dropdown'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-primary">
              NewsInsular
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-primary">
                Inicio
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-primary">
                Nosotros
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-primary">
                Contacto
              </Link>
              <Link
                href="/register"
                className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-green-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-pulse hover:animate-none"
              >
                <UserPlus className="w-4 h-4" />
                Registrarse
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </Link>
              <NotificationsDropdown />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <NotificationsDropdown />
              <button
                className="p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link
                href="/"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/about"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                Nosotros
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                Contacto
              </Link>
              <Link
                href="/register"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="md:hidden bg-gradient-to-r from-primary to-green-600 text-white">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold hover:from-green-600 hover:to-primary transition-all"
        >
          <UserPlus className="w-4 h-4 animate-bounce" />
          <span>¡Regístrate y recibe noticias personalizadas!</span>
          <span className="ml-2 text-lg">→</span>
        </Link>
      </div>
    </header>
  )
}