'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, History, X, ExternalLink } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/provider'
import Link from 'next/link'

interface NotificationHistory {
  id: string
  title: string
  body: string | null
  notification_type: string
  recipients_count: number
  created_at: string
  news_id: string | null
}

interface NewsItem {
  id: string
  title: string
  summary: string | null
  created_at: string
}

export function NotificationsDropdown() {
  const supabase = useSupabase()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationHistory | null>(null)
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null)
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

  const handleNotificationClick = async (notification: NotificationHistory) => {
    setSelectedNotification(notification)
    
    if (notification.news_id) {
      const { data } = await supabase
        .from('news')
        .select('id, title, summary, created_at')
        .eq('id', notification.news_id)
        .single()
      setNewsItem(data)
    } else {
      setNewsItem(null)
    }
  }

  const closeDialog = () => {
    setSelectedNotification(null)
    setNewsItem(null)
  }

  return (
    <>
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
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className="w-full p-4 border-b last:border-0 text-left hover:bg-gray-50 transition-colors"
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
                              year: 'numeric',
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
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <button
              onClick={closeDialog}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Notificación
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(selectedNotification.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {selectedNotification.title}
            </h2>

            {selectedNotification.body && (
              <p className="text-gray-600 mb-4">
                {selectedNotification.body.replace(/<[^>]*>/g, '')}
              </p>
            )}

            {newsItem && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Noticia relacionada
                </p>
                <p className="font-medium text-gray-900">{newsItem.title}</p>
                {newsItem.summary && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {newsItem.summary}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(newsItem.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {newsItem && (
                <Link
                  href={`/news/${newsItem.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex-1 justify-center"
                  onClick={closeDialog}
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver noticia
                </Link>
              )}
              <button
                onClick={closeDialog}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}