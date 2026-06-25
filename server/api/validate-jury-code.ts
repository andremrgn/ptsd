import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const caller = await serverSupabaseUser(event)
  if (!caller?.email) throw createError({ statusCode: 401, message: 'Unauthorized' })

  if (!config.supabaseServiceKey) throw createError({ statusCode: 500, message: 'Service key not configured' })

  const { code } = await readBody(event)
  if (!code) throw createError({ statusCode: 400, message: 'Missing code' })

  const sb = createClient(config.public.supabase.url, config.supabaseServiceKey)
  const { data } = await sb
    .from('jury_codes')
    .select('id, jury_name, code, email')
    .eq('code', (code as string).trim().toUpperCase())
    .single()

  if (!data) throw createError({ statusCode: 403, message: 'Ugyldig jurykode' })

  if (data.email && data.email.toLowerCase() !== caller.email.toLowerCase()) {
    throw createError({ statusCode: 403, message: 'Denne jurykoden tilhører ikke din konto' })
  }

  return { id: data.id, jury_name: data.jury_name, code: data.code }
})
