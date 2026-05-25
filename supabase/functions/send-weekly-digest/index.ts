import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from 'npm:resend@3'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

export async function sendReminderEmail() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: recentNews } = await supabase
    .from('news')
    .select('id, title, summary, images:news_images(url)')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!recentNews || recentNews.length === 0) {
    return { success: true, message: 'No news to send' }
  }

  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL')

  const newsListHtml = recentNews.map((n: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <h3 style="margin: 0 0 8px 0; color: #1a56db; font-size: 16px;">${n.title}</h3>
        ${n.summary ? `<p style="margin: 0; color: #666; font-size: 14px;">${n.summary.slice(0, 80)}...</p>` : ''}
        <a href="${appUrl}/news/${n.id}" style="display: inline-block; margin-top: 8px; color: #1a56db; font-size: 14px;">Leer más →</a>
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Noticias de la semana</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #1a56db; margin-bottom: 20px; font-size: 24px; text-align: center;">
      📰 Noticias de la semana
    </h1>
    
    <table style="width: 100%; border-collapse: collapse;">
      ${newsListHtml}
    </table>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${appUrl}" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ver todas las noticias
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    
    <p style="color: #666; font-size: 12px; text-align: center;">
      © 2026 NewsInsular. Este correo fue enviado porque te registraste en nuestra plataforma.
    </p>
  </div>
</body>
</html>
  `

  const { data: people } = await supabase
    .from('people')
    .select('email')

  const emailAddresses = people?.map((p: any) => p.email).filter(Boolean) || []

  if (emailAddresses.length > 0) {
    await resend.emails.send({
      from: 'NewsInsular <noreply@newsinsular.com>',
      to: emailAddresses,
      subject: '📰 Noticias de la semana - NewsInsular',
      html,
    })
  }

  return { success: true, recipients: emailAddresses.length }
}