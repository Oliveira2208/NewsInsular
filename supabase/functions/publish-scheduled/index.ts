import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from 'npm:resend@3'
import { createClient } from 'jsr:@supabase/supabase-js@^2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface NewsEmailData {
  title: string
  summary: string | null
  news_id: string
  category_name?: string
}

interface PushNotificationData {
  title: string
  body: string | null
  news_id: string
}

export async function sendNewsEmail(data: NewsEmailData) {
  const { title, summary, news_id, category_name } = data

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    ${category_name ? `<p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${category_name}</p>` : ''}
    <h1 style="color: #1a56db; margin-bottom: 20px; font-size: 24px;">${title}</h1>
    ${summary ? `<p style="color: #333; font-size: 16px; line-height: 1.6;">${summary}</p>` : ''}
    <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL')}/news/${news_id}" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">
      Leer más
    </a>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    <p style="color: #666; font-size: 12px; text-align: center;">
      © 2026 NewsInsular. Para dejar de recibir notificaciones, visita tu perfil.
    </p>
  </div>
</body>
</html>
  `

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: subscribers } = await supabase
    .from('people')
    .select('email, notifications_email')
    .eq('notifications_email', true)

  if (!subscribers || subscribers.length === 0) {
    return { sent: 0 }
  }

  const emails = subscribers.map(s => s.email).filter(Boolean)

  await resend.emails.send({
    from: 'NewsInsular <noreply@newsinsular.com>',
    to: emails,
    subject: title,
    html,
  })

  return { sent: emails.length }
}

export async function sendPushNotification(data: PushNotificationData) {
  const { title, body, news_id } = data

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: subscribers } = await supabase
    .from('people')
    .select('fcm_token')
    .not('fcm_token', 'is', null)
    .eq('notifications_email', true)

  if (!subscribers || subscribers.length === 0) {
    return { sent: 0 }
  }

  const fcmTokens = subscribers.map(s => s.fcm_token).filter(Boolean)

  const firebaseConfig = {
    apiKey: Deno.env.get('FIREBASE_API_KEY'),
    authDomain: Deno.env.get('FIREBASE_AUTH_DOMAIN'),
    projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
    storageBucket: Deno.env.get('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: Deno.env.get('FIREBASE_MESSAGING_SENDER_ID'),
    appId: Deno.env.get('FIREBASE_APP_ID'),
  }

  const message = {
    notification: { title, body },
    data: { newsId: news_id, url: `/news/${news_id}` },
    tokens: fcmTokens,
  }

  try {
    const response = await fetch(`https://fcm.googleapis.com/fcm/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
      },
      body: JSON.stringify({
        registration_ids: fcmTokens,
        notification: { title, body },
        data: { newsId: news_id, url: `/news/${news_id}` },
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('FCM push error:', error)
    return { error: error.message }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date().toISOString()

    const { data: scheduledNews, error } = await supabase
      .from('news')
      .select('*, category:categories(name)')
      .eq('published', false)
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now)

    if (error) {
      throw error
    }

    if (!scheduledNews || scheduledNews.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = []
    for (const news of scheduledNews) {
      await supabase
        .from('news')
        .update({
          published: true,
          published_at: now,
          scheduled_for: null,
        })
        .eq('id', news.id)

      try {
        const emailResult = await sendNewsEmail({
          title: news.title,
          summary: news.summary,
          news_id: news.id,
          category_name: news.category?.name,
        })
        const pushResult = await sendPushNotification({
          title: news.title,
          body: news.summary,
          news_id: news.id,
        })
        results.push({ id: news.id, email: emailResult, push: pushResult })
      } catch (err) {
        console.error(`Failed to send notifications for ${news.id}:`, err)
        results.push({ id: news.id, error: err.message })
      }
    }

    return new Response(JSON.stringify({
      published: scheduledNews.length,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})