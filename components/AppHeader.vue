<template>
  <header id="app-header" class="title-bar">
    <div class="title-bar-text">
      <img src="/logo-mark-white.png" alt="" class="title-bar-icon" />
      <span class="title-bar-caption">{{ title }}</span>
    </div>
    <div class="title-bar-controls">
      <button aria-label="Minimize" title="Minimer"></button>
      <button
        v-if="canFullscreen"
        :aria-label="isFullscreen ? 'Restore' : 'Maximize'"
        :title="isFullscreen ? 'Gjenopprett' : 'Maksimer (fullskjerm)'"
        @click="toggleFullscreen"
      ></button>
      <button v-else aria-label="Maximize" disabled></button>
      <button aria-label="Close" title="Lukk (logg ut)" @click="close"></button>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()

// Tittellinja følger Win98-mønsteret «Dokument - Program»
const PAGE_TITLES: Record<string, string> = {
  '/app/hjem': 'Hjem',
  '/app/send-inn': 'Send inn',
  '/app/resultater': 'Resultater',
  '/app/jury': 'Jury',
  '/app/admin': 'Kontrollpanel',
}
const title = computed(() => {
  const page = PAGE_TITLES[route.path]
  return page ? `${page} - Sølvposten` : 'Sølvposten'
})

// Maksimer = nettleserens fullskjerm (der det støttes)
const canFullscreen = ref(false)
const isFullscreen = ref(false)
function onFullscreenChange() { isFullscreen.value = !!document.fullscreenElement }

onMounted(() => {
  canFullscreen.value = !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => document.removeEventListener('fullscreenchange', onFullscreenChange))

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {}
}

// Lukk = avslutt programmet, dvs. logg ut
function close() {
  if (confirm('Vil du avslutte Sølvposten og logge ut?')) logout()
}
</script>
