<template>
  <div class="page-welcome">
    <!-- Win98-dialog: innlogging med bare e-post (for passordløse brukere) -->
    <div class="window login-window">
      <div class="title-bar">
        <div class="title-bar-text"><span class="title-bar-caption">Logg inn uten passord</span></div>
      </div>
      <div class="login-body">
        <img src="/favicon.png" alt="" class="login-icon" />
        <div class="login-main">
          <p class="login-intro">Skriv inn e-postadressen din, så kommer du rett inn.</p>
          <div class="login-field">
            <label for="ql-email">E-post:</label>
            <input id="ql-email" v-model="email" type="email" placeholder="deg@mrgn.no" autocomplete="username" @keydown.enter="submit" />
          </div>
          <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
        </div>
        <div class="login-buttons">
          <button class="default" :disabled="loading" @click="submit">{{ loading ? 'Vent…' : 'OK' }}</button>
          <button :disabled="loading" @click="router.push('/login')">Avbryt</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

definePageMeta({ layout: 'default' })

const email = ref('')
const errorMsg = ref('')
const loading = ref(false)

const sb = useSupabaseClient()
const store = useAppStore()
const router = useRouter()

async function submit() {
  errorMsg.value = ''
  const clean = email.value.trim().toLowerCase()
  if (!clean.endsWith('@mrgn.no')) { errorMsg.value = 'Bruk din @mrgn.no-adresse.'; return }

  loading.value = true
  try {
    // Supabase Edge Function (supabase/functions/quick-login) lager økten
    const { data: tokens, error: fnErr } = await sb.functions.invoke<{ access_token: string; refresh_token: string }>(
      'quick-login',
      { body: { email: clean } },
    )
    if (fnErr) {
      const body = await fnErr.context?.json?.().catch(() => null)
      throw new Error(body?.message || 'Kunne ikke logge inn. Prøv igjen.')
    }
    if (!tokens) throw new Error('Kunne ikke logge inn. Prøv igjen.')
    const { error } = await sb.auth.setSession(tokens)
    if (error) throw error
    // Som vanlig passordinnlogging: last profil og innstillinger, så rett inn
    const profileErr = await store.loadProfile(clean)
    if (profileErr) throw new Error(profileErr)
    await store.loadSettings()
    await router.push('/app/hjem')
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err?.message || 'Kunne ikke logge inn. Prøv igjen.'
    loading.value = false
  }
}
</script>
