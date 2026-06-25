import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const MESSAGES = [
  'Har\'u noen postetekster for en kompis eller?',
  'Nå erre vel noen postetekster som ligger og roper etter litt oppmerksomhet?',
  'Kan vel ikke bare være meg som er sulten på noen postetekster?',
  'Husk at Sølvposten ikke dømmer — men juryen gjør det.',
  'Finnes det en postetekst gjemt i skrivebordsskuffen din, mon tro?',
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Enkel sikring — kun Vercel cron eller intern kall
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const sb = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  const resend = new Resend(config.resendApiKey)

  // Hent alle team
  const { data: teams } = await sb.from('teams').select('id, name')
  if (!teams?.length) return { sent: 0 }

  // For hvert team: hent én tilfeldig kreatør
  let sent = 0
  for (const team of teams) {
    const { data: kreatorer } = await sb
      .from('users')
      .select('email, full_name')
      .eq('team_id', team.id)
      .eq('role', 'kreatør')

    if (!kreatorer?.length) continue

    // Velg tilfeldig person fra teamet
    const person = kreatorer[Math.floor(Math.random() * kreatorer.length)]
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    const firstName = person.full_name.split(' ')[0]

    await resend.emails.send({
      from: 'Sølvposten <onboarding@resend.dev>',
      to: person.email,
      subject: message,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;color:#2B2D42">
          <p style="font-size:1.4rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:1rem">
            Hei ${firstName} 👋
          </p>
          <p style="font-size:1rem;line-height:1.6;margin-bottom:1.5rem">
            ${message}
          </p>
          <p style="font-size:0.9rem;line-height:1.6;margin-bottom:2rem;color:#666">
            Send inn bidraget ditt på
            <a href="https://solvposten.vercel.app" style="color:#ED555C;font-weight:600">solvposten.vercel.app</a>
            — det tar ikke mange minuttene.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin-bottom:1.5rem">
          <p style="font-size:0.8rem;color:#999">
            Hilsen Sølvposten, et initiativ for faglig stolthet
          </p>
        </div>
      `,
    })

    sent++
  }

  return { sent }
})
