'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NotificationsDropdown } from './notifications-dropdown'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
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
            <Link href="/register" className="text-gray-600 hover:text-primary">
              Registrarse
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
  )
}