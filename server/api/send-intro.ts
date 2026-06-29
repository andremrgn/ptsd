import { Resend } from 'resend'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const caller = await serverSupabaseUser(event)
  if (!caller?.email) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sb = await serverSupabaseClient(event)

  const { data: callerProfile } = await sb.from('users').select('is_admin').eq('email', caller.email).single()
  if (!callerProfile?.is_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const { emails } = await readBody(event)
  if (!Array.isArray(emails) || !emails.length) throw createError({ statusCode: 400, message: 'Ingen mottakere valgt' })

  // Hent navn for mottakerne (og verifiser at de faktisk finnes)
  const clean = [...new Set(emails.filter((e: any) => typeof e === 'string' && e.endsWith('@mrgn.no')))]
  const { data: people } = await sb.from('users').select('email, full_name').in('email', clean)
  if (!people?.length) throw createError({ statusCode: 404, message: 'Fant ingen brukere for mottakerne' })

  const resend = new Resend(config.resendApiKey)
  const sent: string[] = []
  const failed: string[] = []

  for (const person of people) {
    const firstName = person.full_name.split(' ')[0]
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

    const { error } = await resend.emails.send({
      from: 'Sølvposten <solvposten@mrgn.no>',
      to: person.email,
      subject: 'Sølvposten er i gang',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;color:#2B2D42">
          <p style="font-size:1.4rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:1.5rem">
            Hei ${firstName} 👋
          </p>
          <p style="font-size:1rem;line-height:1.6;margin-bottom:1rem">
            Sølvposten er nå oppe og går! Nå er det bare å sende inn postetekster :)
          </p>
          <p style="font-size:1rem;line-height:1.6;margin-bottom:2rem">
            Du kan følge med, gi kudos, og sende inn bidrag.
          </p>
          <a href="${config.public.appUrl}/app/send-inn"
            style="display:inline-block;background:#ED555C;color:#ffffff;font-family:system-ui,sans-serif;font-size:0.85rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:0.85rem 1.75rem;border-radius:2px">
            Gå til Sølvposten →
          </a>
          <p style="font-size:0.85rem;line-height:1.6;color:#666;margin-top:1.75rem">
            Første gang du logger inn: bruk «Send meg en lenke» på innloggingssiden, så får du en lenke på e-post.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:2rem 0 1rem">
          <p style="font-size:0.8rem;color:#999">
            Hilsen Sølvposten, et initiativ for faglig stolthet
          </p>
        </div>
      `,
    })

    if (error) failed.push(person.email)
    else sent.push(person.email)
  }

  return { sent, failed }
})
