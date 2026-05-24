'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Bell, User } from 'lucide-react'

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
            <Link href="/register" className="text-gray-600 hover:text-primary">
              Registrarse
            </Link>
            <button className="relative p-2 text-gray-600 hover:text-primary">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <User className="w-4 h-4" />
              Admin
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
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
              href="/register"
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Registrarse
            </Link>
            <Link
              href="/admin"
              className="block px-4 py-2 text-primary font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Panel Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}