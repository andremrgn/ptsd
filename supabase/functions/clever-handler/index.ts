// Supabase Edge Function «clever-handler» (Supabase valgte navnet; det er hurtiginnloggingen)
// Hurtiginnlogging uten passord og lenke for brukere merket users.passwordless = true
// (aldri admin). Bevisst valg fra admin — se pages/hurtiginnlogging.vue.
// Kjører i Supabase, der SUPABASE_SERVICE_ROLE_KEY er tilgjengelig automatisk.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ message: 'Method not allowed' }, 405)

  let email = ''
  try { email = String((await req.json())?.email ?? '').trim().toLowerCase() } catch { /* tom body */ }
  const denied = () => json({ message: 'Denne e-posten kan ikke logge inn uten passord.' }, 403)
  if (!email.endsWith('@mrgn.no')) return denied()

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Bare brukere som er merket passordløse i databasen — og aldri admin
  const { data: profile } = await admin
    .from('users')
    .select('passwordless, is_admin')
    .eq('email', email)
    .maybeSingle()
  if (!profile?.passwordless || profile.is_admin) return denied()

  // Lag en engangs-innlogging på serveren (sender ingen e-post)
  let { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) {
    // Har aldri logget inn før: opprett innloggingskontoen og prøv igjen
    await admin.auth.admin.createUser({ email, email_confirm: true })
    ;({ data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email }))
  }
  const tokenHash = link?.properties?.hashed_token
  if (error || !tokenHash) return json({ message: 'Kunne ikke logge inn. Prøv igjen.' }, 500)

  const verifier = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: verified, error: verifyErr } = await verifier.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (verifyErr || !verified.session) return json({ message: 'Kunne ikke logge inn. Prøv igjen.' }, 500)

  return json({
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
  })
})
