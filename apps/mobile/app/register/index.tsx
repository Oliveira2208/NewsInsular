import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSupabase } from '@/providers/supabase'
import { formatIdentityDoc, VENEZUELA_STATES } from '../src/utils'

export default function RegisterScreen() {
  const router = useRouter()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    identity_prefix: 'V',
    identity_number: '',
    birth_date: '',
    phone: '',
    email: '',
    state_id: '',
    municipality_id: '',
    parish_id: '',
    commune_id: '',
    address: '',
  })

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.identity_number || !form.birth_date || !form.phone || !form.email) {
      Alert.alert('Error', 'Todos los campos son requeridos')
      return
    }

    const identity_doc = formatIdentityDoc(form.identity_prefix, form.identity_number)
    setLoading(true)

    const { error } = await supabase.from('people').insert({
      first_name: form.first_name,
      last_name: form.last_name,
      identity_doc,
      birth_date: form.birth_date,
      phone: form.phone,
      email: form.email,
      address: form.address,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Error', 'No se pudo completar el registro')
      return
    }

    router.replace('/(tabs)/index')
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Registro</Text>
      <Text className="text-gray-600 mb-6">Completa el formulario para registrarte</Text>

      <View className="space-y-4">
        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Nombres</Text>
          <TextInput
            value={form.first_name}
            onChangeText={(v) => updateField('first_name', v)}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="María"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Apellidos</Text>
          <TextInput
            value={form.last_name}
            onChangeText={(v) => updateField('last_name', v)}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="García"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Documento de identidad</Text>
          <View className="flex-row gap-2">
            <View className="w-20">
              <TextInput
                value={form.identity_prefix}
                onChangeText={(v) => updateField('identity_prefix', v)}
                className="w-full border rounded-lg px-4 py-2 text-center"
                maxLength={1}
              />
            </View>
            <TextInput
              value={form.identity_number}
              onChangeText={(v) => updateField('identity_number', v)}
              className="flex-1 border rounded-lg px-4 py-2"
              placeholder="123456789"
              keyboardType="numeric"
              maxLength={9}
            />
          </View>
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</Text>
          <TextInput
            value={form.birth_date}
            onChangeText={(v) => updateField('birth_date', v)}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Teléfono</Text>
          <TextInput
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="0412-1234567"
            keyboardType="phone-pad"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Estado</Text>
          <View className="border rounded-lg">
            {VENEZUELA_STATES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => updateField('state_id', s)}
                className={`px-4 py-2 ${form.state_id === s ? 'bg-blue-50' : ''}`}
              >
                <Text>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Municipio</Text>
          <TextInput
            value={form.municipality_id}
            onChangeText={(v) => updateField('municipality_id', v)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Parroquia</Text>
          <TextInput
            value={form.parish_id}
            onChangeText={(v) => updateField('parish_id', v)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Comuna</Text>
          <TextInput
            value={form.commune_id}
            onChangeText={(v) => updateField('commune_id', v)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Dirección exacta</Text>
          <TextInput
            value={form.address}
            onChangeText={(v) => updateField('address', v)}
            className="w-full border rounded-lg px-4 py-2"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="py-4 bg-blue-600 rounded-xl items-center mb-8"
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Registrando...' : 'Registrarse'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}