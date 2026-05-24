'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, FileText, Folder, Users, Bell, LogOut, LayoutTemplate, FileTextIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/news', label: 'Noticias', icon: FileText },
  { href: '/admin/news/templates', label: 'Plantillas', icon: LayoutTemplate },
  { href: '/admin/categories', label: 'Categorías', icon: Folder },
  { href: '/admin/people', label: 'Personas', icon: Users },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/admin/notifications/templates', label: 'Plantillas Notif.', icon: FileTextIcon },
]

export default function AdminNavbar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/admin" className="text-lg font-bold">
          NewsInsular
        </Link>
        <div className="w-10" />
      </nav>

      <aside
        className={`
          md:hidden fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white z-50
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between p-4">
          <Link href="/admin" className="text-xl font-bold text-white">
            NewsInsular
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}