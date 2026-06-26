import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'Service key not configured' })
  }

  const caller = await serverSupabaseUser(event)
  if (!caller) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { submission_id, jury_code, score } = await readBody(event)
  if (!submission_id || !jury_code || typeof score !== 'number' || score < 1 || score > 9) {
    throw createError({ statusCode: 400, message: 'Ugyldig forespørsel' })
  }

  const sb = createClient(config.public.supabase.url, config.supabaseServiceKey)

  // Validate the jury code exists and belongs to the caller
  const { data: juryMember, error: juryErr } = await sb
    .from('jury_codes')
    .select('id, email')
    .eq('code', jury_code.trim().toUpperCase())
    .single()

  if (juryErr || !juryMember) {
    throw createError({ statusCode: 403, message: 'Ugyldig jurykode' })
  }

  if (!juryMember.email || juryMember.email.toLowerCase() !== caller.email?.toLowerCase()) {
    throw createError({ statusCode: 403, message: 'Denne jurykoden tilhører ikke din konto' })
  }

  // Verify judging is active
  const { data: setting } = await sb
    .from('settings')
    .select('value')
    .eq('key', 'judging_active')
    .single()

  if (setting?.value !== 'true') {
    throw createError({ statusCode: 403, message: 'Juryering er ikke aktiv' })
  }

  // Write the score
  const { error } = await sb.from('scores').upsert(
    { submission_id, jury_code_id: juryMember.id, score },
    { onConflict: 'submission_id,jury_code_id' },
  )

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
