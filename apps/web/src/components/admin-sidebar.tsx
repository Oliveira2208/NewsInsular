'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Folder, Users, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/news', label: 'Noticias', icon: FileText },
  { href: '/admin/categories', label: 'Categorías', icon: Folder },
  { href: '/admin/people', label: 'Personas', icon: Users },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <Link href="/admin" className="text-xl font-bold text-white">
          NewsInsular Admin
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
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
  )
}