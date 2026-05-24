import { StatusBar } from 'expo-status-bar'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SupabaseProvider } from '@/providers/supabase'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SupabaseProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="news/[slug]" options={{ headerShown: true, title: 'Noticia' }} />
          <Stack.Screen name="register" options={{ headerShown: true, title: 'Registro' }} />
        </Stack>
      </SupabaseProvider>
    </SafeAreaProvider>
  )
}