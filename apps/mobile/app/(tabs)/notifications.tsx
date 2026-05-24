import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useSupabase } from '@/providers/supabase'
import type { Notification } from '@newsinsular/types'

export default function NotificationsScreen() {
  const supabase = useSupabase()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*, news:news(*)')
        .eq('person_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (isMounted) {
        setNotifications(data ?? [])
        setLoading(false)
      }
    }

    fetchNotifications()

    const subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          if (isMounted) {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(subscription)
    }
  }, [])

  const markAsRead = useCallback(async (id: string, newsId: string | null) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    if (newsId) router.push(`/news/${newsId}`)
  }, [supabase, router])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Notificaciones</Text>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`p-4 border-b border-gray-100 ${!item.read ? 'bg-blue-50' : 'bg-white'}`}
            onPress={() => markAsRead(item.id, item.news_id)}
          >
            <View className="flex-row items-start">
              {!item.read && (
                <View className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3" />
              )}
              <View className="flex-1">
                <Text className="font-medium text-gray-900">{item.title}</Text>
                {item.body && (
                  <Text className="text-sm text-gray-600 mt-1">{item.body}</Text>
                )}
                <Text className="text-xs text-gray-400 mt-2">
                  {new Date(item.created_at).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerClassName="flex-1"
        refreshing={loading}
        onRefresh={async () => {
          setLoading(true)
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data } = await supabase
            .from('notifications')
            .select('*, news:news(*)')
            .eq('person_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

          setNotifications(data ?? [])
          setLoading(false)
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500 text-center">
              No tienes notificaciones{'\n'}📬
            </Text>
          </View>
        }
      />
    </View>
  )
}