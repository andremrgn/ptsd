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
      <p class="welcome-subtitle">{{ statusMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const statusMessage = ref('Logger inn…')
const sb = useSupabaseClient()
const session = useSupabaseSession()
const store = useAppStore()
const router = useRouter()
let handled = false

watch(session, async (s) => {
  if (!s) return
  handled = true
  try {
    const err = await store.loadProfile(s.user.email!)
    if (err) {
      statusMessage.value = 'Fant ikke brukerprofilen din. Ta kontakt med admin.'
      await sb.auth.signOut()
      setTimeout(() => router.push('/login'), 3000)
      return
    }
    await store.loadSettings()
    await store.loadTeam()
    router.push('/app/hjem')
  } catch {
    statusMessage.value = 'Noe gikk galt. Prøv igjen.'
    setTimeout(() => router.push('/login'), 3000)
  }
}, { immediate: true })

onMounted(() => {
  setTimeout(() => {
    if (!handled) {
      statusMessage.value = 'Noe gikk galt. Prøv igjen.'
      setTimeout(() => router.push('/login'), 2000)
    }
  }, 6000)
})
</script>
