<template>
  <div class="page-welcome">
    <div class="welcome-card" style="max-width:400px">
      <div class="welcome-logo">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="white">
          <circle cx="20" cy="20" r="18.5" fill="none" stroke="white" stroke-width="2.5"/>
          <text x="20" y="27.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="17" letter-spacing="-0.5">M</text>
        </svg>
        <span class="welcome-logo-text">Morgenstern</span>
      </div>
      <h1 class="welcome-title" style="font-size:1.6rem;margin-bottom:0.4rem">Sett passord</h1>
      <p class="welcome-subtitle" style="margin-bottom:1.5rem">Velg et passord for kontoen din.</p>

      <div class="form-group">
        <label class="form-label">Nytt passord</label>
        <input
          v-model="password"
          type="password"
          class="form-input"
          placeholder="Minst 8 tegn"
          autocomplete="new-password"
          @keydown.enter="submit"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Bekreft passord</label>
        <input
          v-model="confirm"
          type="password"
          class="form-input"
          placeholder="Gjenta passordet"
          autocomplete="new-password"
          @keydown.enter="submit"
        />
      </div>

      <p v-if="error" style="color:var(--coral);font-size:0.82rem;margin-bottom:0.75rem">{{ error }}</p>

      <button class="btn" :disabled="loading" style="width:100%" @click="submit">
        {{ loading ? 'Lagrer…' : 'Lagre passord og fortsett →' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sb = useSupabaseClient()
const session = useSupabaseSession()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  if (!session.value) router.push('/login')
})

watch(session, (s, prev) => {
  if (prev !== undefined && s === null) router.push('/login')
})

async function submit() {
  error.value = ''
  if (!session.value) {
    router.push('/login')
    return
  }
  if (password.value.length < 8) {
    error.value = 'Passordet må være minst 8 tegn.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passordene er ikke like.'
    return
  }
  loading.value = true
  const { error: err } = await sb.auth.updateUser({ password: password.value, data: { password_set: true } })
  if (err) {
    loading.value = false
    if (err.message.toLowerCase().includes('different from the old password')) {
      error.value = 'Nytt passord må være forskjellig fra det gamle passordet.'
    } else {
      error.value = err.message
    }
    return
  }
  await sb.auth.refreshSession()
  window.location.href = '/app/hjem'
}
</script>
