<template>
  <div id="app-shell">
    <AppHeader />
    <TabBar />
    <main class="app-content">
      <slot />
    </main>
    <footer class="status-bar app-status">
      <p class="status-bar-field">{{ store.judgingActive ? 'Juryering pågår' : 'Klar' }}</p>
      <p v-if="deadlineText" class="status-bar-field">{{ deadlineText }}</p>
      <p v-if="store.user" class="status-bar-field">{{ store.user.full_name }}</p>
    </footer>
    <ProfileDrawer />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const store = useAppStore()

// Nedtelling til fristen i statuslinja (samme regel som på forsiden)
const deadlineText = computed(() => {
  if (!store.competitionDeadline || store.judgingActive) return ''
  const deadline = new Date(store.competitionDeadline)
  deadline.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
  if (days < 0) return ''
  if (days === 0) return 'Innleveringsfrist i dag'
  return `${days} ${days === 1 ? 'dag' : 'dager'} til innleveringsfrist`
})
</script>
