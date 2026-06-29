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

  // Sjekk om auto-mail er pauset (manuelt eller kalenderblokk)
  const [{ data: pauseSetting }, { data: blocksSetting }] = await Promise.all([
    sb.from('settings').select('value').eq('key', 'mail_paused').single(),
    sb.from('settings').select('value').eq('key', 'mail_blocks').single(),
  ])
  if (pauseSetting?.value === 'true') return { sent: 0, paused: true }
  const today = new Date().toISOString().slice(0, 10)
  const blocks: { start: string; end: string }[] = JSON.parse(blocksSetting?.value || '[]')
  if (blocks.some(b => today >= b.start && today <= b.end)) return { sent: 0, paused: true }

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

    await resend.emails.send({
      from: 'Sølvposten <solvposten@mrgn.no>',
      to: person.email,
      subject: message,
      html: renderMail({
        firstName: person.full_name.split(' ')[0],
        bodyHtml: `<p style="font-size:1rem;line-height:1.6;margin-bottom:2rem">${message}</p>`,
        ctaUrl: `${config.public.appUrl}/app/send-inn`,
        ctaText: 'Send inn postetekster →',
      }),
    })

    sent++
  }

  return { sent }
})
