interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })
    return response.ok
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function generateWelcomeEmailHtml(fullName: string, unsubscribeLink: string | null, appUrl: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a NewsInsular</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #1a56db; margin-bottom: 20px; font-size: 24px;">¡Bienvenido a NewsInsular!</h1>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Hola <strong>${fullName}</strong>,
    </p>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Tu registro se ha completado exitosamente. Ahora puedes estar al día con las últimas noticias de tu comunidad.
    </p>
    
    <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #1e40af; font-size: 18px; margin-top: 0;">¿Qué puedes hacer ahora?</h2>
      <ul style="color: #333; line-height: 2;">
        <li>Ver noticias publicadas</li>
        <li>Recibir notificaciones de nuevas noticias</li>
        <li>Compartir noticias con amigos</li>
      </ul>
    </div>
    
    <a href="${appUrl}" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">
      Ver noticias
    </a>
    
    ${unsubscribeLink ? `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
      <p style="color: #666; font-size: 12px; text-align: center; margin-bottom: 10px;">
        ¿No deseas recibir estas notificaciones?
      </p>
      <p style="color: #666; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #1a56db; text-decoration: underline;">
          Cancela tu suscripción
        </a>
      </p>
    </div>
    ` : ''}
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    
    <p style="color: #666; font-size: 12px; text-align: center;">
      © 2026 NewsInsular. Todos los derechos reservados.
    </p>
  </div>
</body>
</html>
  `
}