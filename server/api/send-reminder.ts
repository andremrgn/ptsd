import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const MESSAGES = [
  'Har\'u noen postetekster for en kompis eller?',
  'Nå erre vel noen postetekster som ligger og roper etter noe oppmerksomhet?',
  'Kan vel ikke bare være meg som er sulten på noe postetekster?',
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Enkel sikring — kun Vercel cron eller intern kall
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!config.supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'Service key not configured' })
  }
  const sb = createClient(config.public.supabase.url, config.supabaseServiceKey)
  const resend = new Resend(config.resendApiKey)

  // Hent alle team
  const { data: teams } = await sb.from('teams').select('id, name')
  if (!teams?.length) return { sent: 0 }

  // Hent sist brukt meldings-indeks fra settings
  const { data: lastSetting } = await sb
    .from('settings')
    .select('value')
    .eq('key', 'last_reminder_index')
    .single()
  const lastIndex = lastSetting ? parseInt(lastSetting.value) : -1

  // Velg en melding som ikke er den samme som sist
  const available = MESSAGES.map((_, i) => i).filter(i => i !== lastIndex)
  const nextIndex = available[Math.floor(Math.random() * available.length)]
  const message = MESSAGES[nextIndex]

  // Lagre valgt indeks
  await sb.from('settings').upsert(
    { key: 'last_reminder_index', value: String(nextIndex) },
    { onConflict: 'key' },
  )

  // For hvert team: hent én tilfeldig kreatør og send mail
  let sent = 0
  for (const team of teams) {
    const { data: kreatorer } = await sb
      .from('users')
      .select('email, full_name')
      .eq('team_id', team.id)
      .eq('role', 'kreatør')

    if (!kreatorer?.length) continue

    const person = kreatorer[Math.floor(Math.random() * kreatorer.length)]
    const firstName = person.full_name.split(' ')[0]
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    await resend.emails.send({
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

    sent++
  }

  return { sent }
})
