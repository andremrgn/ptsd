<template>
  <div id="app-shell">
    <AppHeader />
    <TabBar />
    <main class="app-content">
      <slot />
    </main>
    <ProfileDrawer />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const store = useAppStore()
onMounted(async () => {
  // store.user fylles av auth-middleware før layouten mountes
  if (store.user) {
    await Promise.all([store.loadSettings(), store.loadTeam()])
  }
})
</script>
