import { Tabs } from 'expo-router'
import { Bell, Home } from 'lucide-react-native'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: () => <Home size={24} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
          tabBarIcon: () => <Bell size={24} />,
        }}
      />
    </Tabs>
  )
}