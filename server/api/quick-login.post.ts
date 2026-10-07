import { createClient } from '@supabase/supabase-js'

// Hurtiginnlogging uten passord og uten e-postlenke, for brukere som eksplisitt
// er merket users.passwordless = true i Supabase. Bevisst valg fra admin:
// e-posten alene logger inn, så tilgangen er strupet til flaggede, ikke-admin-brukere.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'Service key not configured' })
  }

  const { email } = await readBody(event)
  const clean = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const denied = () => createError({ statusCode: 403, message: 'Denne e-posten kan ikke logge inn uten passord.' })
  if (!clean.endsWith('@mrgn.no')) throw denied()

  const admin = createClient(config.public.supabase.url, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Bare brukere som er merket passordløse i databasen — og aldri admin
  const { data: profile } = await admin
    .from('users')
    .select('email, passwordless, is_admin')
    .eq('email', clean)
    .maybeSingle()
  if (!profile?.passwordless || profile.is_admin) throw denied()

  // Lag en engangs-innlogging på serveren (sender ingen e-post)
  let { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: clean })
  if (error) {
    // Har aldri logget inn før: opprett innloggingskontoen og prøv igjen
    await admin.auth.admin.createUser({ email: clean, email_confirm: true })
    ;({ data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: clean }))
  }
  const tokenHash = link?.properties?.hashed_token
  if (error || !tokenHash) throw createError({ statusCode: 500, message: 'Kunne ikke logge inn. Prøv igjen.' })

  const verifier = createClient(config.public.supabase.url, config.public.supabase.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: verified, error: verifyErr } = await verifier.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (verifyErr || !verified.session) throw createError({ statusCode: 500, message: 'Kunne ikke logge inn. Prøv igjen.' })

  return {
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
  }
})
