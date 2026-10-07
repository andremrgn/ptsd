import { Resend } from 'resend'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

// Påminnelse om innleveringsfristen («N dager igjen av Sølvposten») til valgte deltakere.
// Bare admin. Med { preview: true } returneres mailen (med adminens navn) uten å sende noe.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const caller = await serverSupabaseUser(event)
  if (!caller?.email) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sb = await serverSupabaseClient(event)

  const { data: callerProfile } = await sb.from('users').select('is_admin, full_name').eq('email', caller.email).single()
  if (!callerProfile?.is_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const { data: deadlineRow } = await sb.from('settings').select('value').eq('key', 'competition_deadline').maybeSingle()
  const deadline = deadlineRow?.value as string | undefined
  if (!deadline) throw createError({ statusCode: 400, message: 'Ingen innleveringsfrist er satt' })
  if (daysUntil(deadline) < 0) throw createError({ statusCode: 400, message: 'Innleveringsfristen har gått ut' })

  const { emails, preview } = await readBody(event)
  const appUrl = config.public.appUrl

  if (preview) {
    const { subject, html } = deadlineReminderMail({ appUrl, fullName: callerProfile.full_name, deadline })
    return { subject, html }
  }

  if (!Array.isArray(emails) || !emails.length) throw createError({ statusCode: 400, message: 'Ingen mottakere valgt' })

  // Hent navn for mottakerne (og verifiser at de faktisk finnes)
  const clean = [...new Set(emails.filter((e: any) => typeof e === 'string' && e.endsWith('@mrgn.no')))]
  const { data: people } = await sb.from('users').select('email, full_name').in('email', clean)
  if (!people?.length) throw createError({ statusCode: 404, message: 'Fant ingen brukere for mottakerne' })

  const resend = new Resend(config.resendApiKey)
  const sent: string[] = []
  const failed: string[] = []

  for (const person of people) {
    const { subject, html } = deadlineReminderMail({ appUrl, fullName: person.full_name, deadline })
    const { error } = await resend.emails.send({
      from: 'Sølvposten <solvposten@mrgn.no>',
      to: person.email,
      subject,
      html,
    })
    if (error) failed.push(person.email)
    else sent.push(person.email)
  }

  return { sent, failed }
})
