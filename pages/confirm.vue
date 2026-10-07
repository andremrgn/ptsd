<template>
  <div class="page-welcome">
    <!-- Win98-dialog mens innloggingslenken sjekkes -->
    <div class="window login-window">
      <div class="title-bar">
        <div class="title-bar-text"><span class="title-bar-caption">Sølvposten</span></div>
      </div>
      <div class="login-body">
        <img src="/favicon.png" alt="" class="login-icon" />
        <div class="login-main">
          <p class="login-intro">{{ statusMessage }}</p>
        </div>
        <div v-if="showLoginBtn" class="login-buttons">
          <button class="default" @click="router.push('/login')">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const statusMessage = ref('Logger inn…')
const showLoginBtn = ref(false)
const sb = useSupabaseClient()
const session = useSupabaseSession()
const store = useAppStore()
const router = useRouter()
let handled = false
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

function fail(msg: string) {
  handled = true
  if (fallbackTimer) clearTimeout(fallbackTimer)
  statusMessage.value = msg
  showLoginBtn.value = true
}

watch(session, async (s) => {
  if (!s) return
  try {
    const err = await store.loadProfile(s.user.email!)
    if (err) {
      // Innlogget, men ingen profilrad — kontoen er ikke ferdig satt opp
      await sb.auth.signOut()
      fail('Kontoen din er ikke satt opp ennå. Be admin om å legge deg til, og prøv lenken på nytt.')
      return
    }
    await store.loadSettings()
    await store.loadTeam()
    handled = true
    if (fallbackTimer) clearTimeout(fallbackTimer)
    // Bruk DB-verdiene (kilde til sannhet), ikke JWT-metadata som henger etter updateUser
    router.push(store.needsPassword ? '/set-password' : '/app/hjem')
  } catch {
    fail('Noe gikk galt under innlogging. Be om en ny lenke og prøv igjen.')
  }
}, { immediate: true })

onMounted(() => {
  // Hvis lenken ble åpnet på en annen enhet/nettleser enn den ble bedt om fra, feiler
  // PKCE-utvekslingen, og Supabase legger en feil i URL-en (query eller hash).
  const url = new URL(window.location.href)
  if (url.searchParams.get('error') || url.hash.includes('error')) {
    fail('Innloggingslenken kunne ikke brukes. Åpne den i samme nettleser som du ba om den fra — eller be om en ny lenke.')
    return
  }
  // Hvis ingen sesjon dukker opp innen rimelig tid (typisk samme årsak: feil enhet)
  fallbackTimer = setTimeout(() => {
    if (!handled) {
      fail('Innloggingen tok for lang tid. Åpnet du lenken på en annen enhet enn du ba om den fra? Be om en ny lenke og åpne den på samme enhet.')
    }
  }, 6000)
})
</script>
