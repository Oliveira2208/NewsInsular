'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, History } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/provider'

interface NotificationHistory {
  id: string
  title: string
  body: string | null
  notification_type: string
  recipients_count: number
  created_at: string
}

export function NotificationsDropdown() {
  const supabase = useSupabase()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationHistory[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      const { data } = await supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data) {
        setNotifications(data)
      }
      setLoading(false)
    }

    if (open) {
      fetchNotifications()
    }
  }, [open, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-primary"
      >
        <Bell className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 flex flex-col items-center gap-2">
              <BellOff className="w-8 h-8 text-gray-300" />
              <p>Sin notificaciones</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 border-b last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <History className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.body}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {n.recipients_count > 0 && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              {n.recipients_count} destinatario{n.recipients_count > 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}