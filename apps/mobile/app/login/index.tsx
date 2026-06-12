import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/providers/auth'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Todos los campos son requeridos')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      router.replace('/(tabs)/index')
    } catch {
      Alert.alert('Error', 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-gray-50 items-center justify-center p-4">
      <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión</Text>
        <Text className="text-gray-500 mb-6">Ingresa tus credenciales</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="••••••••"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="py-4 bg-blue-600 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
