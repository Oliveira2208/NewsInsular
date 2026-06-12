import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/providers/auth'
import { User } from 'lucide-react-native'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente')
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Cargando...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-8">
        <User size={48} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">Perfil</Text>
        <Text className="text-gray-500 text-center mb-6">
          Inicia sesión para acceder a tu perfil
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/login')}
          className="py-3 px-8 bg-blue-600 rounded-xl"
        >
          <Text className="text-white font-semibold">Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/register')}
          className="py-3 px-8 mt-3 border border-blue-600 rounded-xl"
        >
          <Text className="text-blue-600 font-semibold">Registrarse</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-xl p-6 shadow-sm">
        <Text className="text-xl font-bold text-gray-900">{user.name}</Text>
        <Text className="text-gray-500 mt-1">{user.email}</Text>
      </View>

      <View className="mt-6">
        <TouchableOpacity
          onPress={handleLogout}
          className="py-4 bg-red-500 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
