import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface NotifyNewNewsData {
  newsId: string
  title: string
  summary: string | null
  imageUrl: string | null
}

export async function notifyNewNews(data: NotifyNewNewsData) {
  const { newsId, title, summary, imageUrl } = data

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: people } = await supabase
    .from('people')
    .select('id, email, push_token')

  if (!people || people.length === 0) {
    return { success: true, message: 'No recipients' }
  }

  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL')

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
    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">` : ''}
    
    <h1 style="color: #1a56db; margin-bottom: 16px; font-size: 24px;">${title}</h1>
    
    ${summary ? `<p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${summary}</p>` : ''}
    
    <a href="${appUrl}/news/${newsId}" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Leer noticia completa
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    
    <p style="color: #666; font-size: 12px; text-align: center;">
      © 2026 NewsInsular. Si no deseas recibir estas notificaciones, responde a este correo.
    </p>
  </div>
</body>
</html>
  `

  const emailAddresses = people.map((p: any) => p.email).filter(Boolean)

  if (emailAddresses.length > 0) {
    await resend.emails.send({
      from: 'NewsInsular <noreply@newsinsular.com>',
      to: emailAddresses,
      subject: title,
      html,
    })
  }

  for (const person of people) {
    if (person.push_token) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: person.push_token,
            title,
            body: summary?.slice(0, 100) || '',
            data: { newsId },
          }),
        })
      } catch (err) {
        console.error('Push notification failed:', err)
      }
    }

    await supabase.from('notifications').insert({
      person_id: person.id,
      news_id: newsId,
      title,
      body: summary,
    })
  }

  return { success: true, recipients: people.length }
}