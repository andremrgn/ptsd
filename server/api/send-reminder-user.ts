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

  const { error } = await resend.emails.send({
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

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { sent: true }
})
