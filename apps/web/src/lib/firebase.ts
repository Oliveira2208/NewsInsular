'use client'

import { createClient } from '@/lib/supabase/client'

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!('Notification' in window) || Notification.permission === 'denied') {
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return null
    }

    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')
    const { getToken } = await import('firebase/messaging')
    
    const firebaseConfig = {
      apiKey: "AIzaSyALxkjaT3fUSS9fmnDoZGDiDRfAv_ZmRA8",
      authDomain: "news-insular-web.firebaseapp.com",
      projectId: "news-insular-web",
      storageBucket: "news-insular-web.firebasestorage.app",
      messagingSenderId: "850697700174",
      appId: "1:850697700174:web:1851bcd2574ec88fffd41f",
      measurementId: "G-SQRD3CGM0M"
    }
    
    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)
    
    const token = await getToken(messaging, {
      vapidKey: 'BChIEN1TX6oW135pMV9IcbPb0tCdAL8bHKz5Z3p1vOmVjSBf1DV-9O8CZ7ccUFgCMCalZECNATUJKb5vTSirfMY'
    })

    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

export async function saveFCMToken(token: string, email: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('people')
    .update({ fcm_token: token })
    .eq('email', email)

  if (error) {
    console.error('Error saving FCM token:', error)
    return false
  }
  return true
}

export async function onFCMMessage(callback: (payload: any) => void) {
  try {
    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')
    const { onMessage } = await import('firebase/messaging')
    
    const firebaseConfig = {
      apiKey: "AIzaSyALxkjaT3fUSS9fmnDoZGDiDRfAv_ZmRA8",
      authDomain: "news-insular-web.firebaseapp.com",
      projectId: "news-insular-web",
      storageBucket: "news-insular-web.firebasestorage.app",
      messagingSenderId: "850697700174",
      appId: "1:850697700174:web:1851bcd2574ec88fffd41f",
      measurementId: "G-SQRD3CGM0M"
    }
    
    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)
    
    onMessage(messaging, (payload: any) => {
      callback(payload)
    })
  } catch (error) {
    console.error('Error setting up FCM listener:', error)
  }
}