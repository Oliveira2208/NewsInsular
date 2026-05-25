import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  try {
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await resend.emails.send({
      from: 'NewsInsular <noreply@newsinsular.com>',
      to,
      subject,
      html,
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})