<template>
  <div id="app-shell">
    <AppHeader />
    <TabBar />
    <main class="app-content">
      <slot />
    </main>
    <ProfileDrawer />
    <AdminLoginModal />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const store = useAppStore()
onMounted(async () => {
  if (!store.user) {
    store.loadUserFromStorage()
  }
  if (store.user) {
    await Promise.all([store.loadSettings(), store.loadTeam()])
  }
})
</script>
