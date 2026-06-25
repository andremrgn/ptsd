import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!config.supabaseServiceKey) {
    throw createError({ statusCode: 500, message: 'Service key not configured' })
  }

  const sb = createClient(config.public.supabase.url, config.supabaseServiceKey)

  const { data: settings } = await sb.from('settings').select('key, value')
  if (!settings) return { skipped: true }

  const deadline = settings.find(s => s.key === 'competition_deadline')?.value
  const alreadyActive = settings.find(s => s.key === 'judging_active')?.value === 'true'

  if (!deadline || alreadyActive) return { skipped: true, reason: alreadyActive ? 'already_active' : 'no_deadline' }

  const juryStart = new Date(deadline)
  juryStart.setDate(juryStart.getDate() - 3)
  juryStart.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (today < juryStart) return { skipped: true, reason: 'too_early', startsOn: juryStart.toISOString() }

  const { error } = await sb.from('settings').upsert(
    { key: 'judging_active', value: 'true' },
    { onConflict: 'key' },
  )

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { activated: true, deadline, juryStartedOn: today.toISOString() }
})
