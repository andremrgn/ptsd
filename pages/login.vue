<template>
  <div class="page-welcome">
    <div class="welcome-card">
      <div class="welcome-logo">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="white">
          <circle cx="20" cy="20" r="18.5" fill="none" stroke="white" stroke-width="2.5"/>
          <text x="20" y="27.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="17" letter-spacing="-0.5">M</text>
        </svg>
        <span class="welcome-logo-text">Morgenstern</span>
      </div>
      <h1 class="welcome-title">Sølv<span class="coral">posten</span></h1>
      <p class="welcome-subtitle">Logg inn med din @mrgn.no-adresse for å delta.</p>
      <div class="welcome-form">
        <label>E-post</label>
        <input
          v-model="email"
          type="email"
          placeholder="deg@mrgn.no"
          @keydown.enter="doLogin"
        />
        <p v-if="errorMsg" class="welcome-error">{{ errorMsg }}</p>
        <button class="btn-welcome" :disabled="loading" @click="doLogin">
          {{ loading ? 'Logger inn…' : 'Logg inn →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const email = ref('')
const errorMsg = ref('')
const loading = ref(false)
const { login } = useAuth()
const router = useRouter()

async function doLogin() {
  errorMsg.value = ''
  loading.value = true
  const err = await login(email.value.trim().toLowerCase())
  loading.value = false
  if (err) {
    errorMsg.value = err
  } else {
    router.push('/app/hjem')
  }
}
</script>
