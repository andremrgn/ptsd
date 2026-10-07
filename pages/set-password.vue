<template>
  <div class="page-welcome">
    <!-- Win98-dialog: «Sett passord» -->
    <div class="window login-window">
      <div class="title-bar">
        <div class="title-bar-text"><span class="title-bar-caption">Sett passord</span></div>
      </div>
      <div class="login-body">
        <img src="/favicon.png" alt="" class="login-icon" />
        <div class="login-main">
          <p class="login-intro">Velg et passord for kontoen din. Det må være minst 8 tegn.</p>
          <div class="login-field">
            <label for="sp-pw1">Nytt passord:</label>
            <input id="sp-pw1" v-model="password" type="password" autocomplete="new-password" @keydown.enter="submit" />
          </div>
          <div class="login-field">
            <label for="sp-pw2">Bekreft:</label>
            <input id="sp-pw2" v-model="confirmPw" type="password" autocomplete="new-password" @keydown.enter="submit" />
          </div>
          <p v-if="error" class="login-error">{{ error }}</p>
        </div>
        <div class="login-buttons">
          <button class="default" :disabled="loading" @click="submit">{{ loading ? 'Lagrer…' : 'OK' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

definePageMeta({ layout: 'default' })

const sb = useSupabaseClient()
const session = useSupabaseSession()
const router = useRouter()
const store = useAppStore()

const password = ref('')
const confirmPw = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  if (!session.value) {
    router.push('/login')
    return
  }
  // Already set password — go straight in
  if (store.user?.password_set) {
    router.push('/app/hjem')
  }
})

watch(session, (s, prev) => {
  if (prev !== undefined && s === null) router.push('/login')
})

async function markPasswordSet(email: string) {
  const { error: dbErr } = await sb.from('users').update({ password_set: true }).eq('email', email)
  if (dbErr) throw dbErr
  if (store.user) store.user.password_set = true
}

async function finishAndRedirect() {
  const email = session.value?.user?.email
  if (!email) { router.push('/login'); return }
  try {
    await markPasswordSet(email)
  } catch {
    loading.value = false
    error.value = 'Kunne ikke fullføre. Prøv igjen, eller ta kontakt med admin.'
    return
  }
  router.push('/app/hjem')
}

async function submit() {
  error.value = ''
  if (!session.value) { router.push('/login'); return }
  if (password.value.length < 8) { error.value = 'Passordet må være minst 8 tegn.'; return }
  if (password.value !== confirmPw.value) { error.value = 'Passordene er ikke like.'; return }

  loading.value = true

  const { error: err } = await sb.auth.updateUser({ password: password.value, data: { password_set: true } })

  if (err) {
    if (err.message.toLowerCase().includes('different from the old password')) {
      // Passordet ble satt i et tidligere forsøk — marker DB og fortsett
      await finishAndRedirect()
    } else {
      loading.value = false
      error.value = err.message
    }
    return
  }

  await finishAndRedirect()
}
</script>
