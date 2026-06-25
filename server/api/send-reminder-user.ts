import { Resend } from 'resend'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

const MESSAGES = [
  'Har\'u noen postetekster for en kompis eller?',
  'Nå erre vel noen postetekster som ligger og roper etter noe oppmerksomhet?',
  'Kan vel ikke bare være meg som er sulten på noe postetekster?',
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const caller = await serverSupabaseUser(event)
  if (!caller?.email) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sb = await serverSupabaseClient(event)

  const { data: callerProfile } = await sb.from('users').select('is_admin').eq('email', caller.email).single()
  if (!callerProfile?.is_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const { email } = await readBody(event)
  if (!email) throw createError({ statusCode: 400, message: 'Missing email' })

  const { data: person } = await sb.from('users').select('email, full_name').eq('email', email).single()
  if (!person) throw createError({ statusCode: 404, message: 'User not found' })

  const resend = new Resend(config.resendApiKey)
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const firstName = person.full_name.split(' ')[0]
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

  const { error } = await resend.emails.send({
    from: 'Sølvposten <solvposten@mrgn.no>',
    to: person.email,
    subject: message,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;color:#2B2D42">
        <p style="font-size:1.4rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:1.5rem">
          Hei ${firstName} 👋
        </p>
        <p style="font-size:1rem;line-height:1.6;margin-bottom:2rem">
          ${message}
        </p>
        <a href="https://solvposten.vercel.app/app/send-inn"
          style="display:inline-block;background:#ED555C;color:#ffffff;font-family:system-ui,sans-serif;font-size:0.85rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:0.85rem 1.75rem;border-radius:2px">
          Send inn postetekster →
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:2rem 0 1rem">
        <p style="font-size:0.8rem;color:#999">
          Hilsen Sølvposten, et initiativ for faglig stolthet
        </p>
      </div>
    `,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { sent: true }
})
