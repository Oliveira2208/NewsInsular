'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/provider'

interface Notification {
  id: string
  title: string
  body: string | null
  read: boolean
  created_at: string
}

export function NotificationsDropdown() {
  const supabase = useSupabase()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
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

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-primary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 flex flex-col items-center gap-2">
              <BellOff className="w-8 h-8 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b last:border-0 ${!n.read ? 'bg-blue-50' : ''}`}
                >
                  <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}