<template>
  <nav class="tab-bar">
    <span class="toolbar-grip" aria-hidden="true"></span>
    <NuxtLink to="/app/hjem" class="tab-btn" :class="{ active: route.path === '/app/hjem' }">Hjem</NuxtLink>
    <NuxtLink
      v-if="store.isParticipant"
      to="/app/send-inn"
      class="tab-btn"
      :class="{ active: route.path === '/app/send-inn' }"
    >Send inn</NuxtLink>
    <NuxtLink
      v-if="store.resultsVisible"
      to="/app/resultater"
      class="tab-btn"
      :class="{ active: route.path === '/app/resultater' }"
    >Resultater</NuxtLink>
    <NuxtLink to="/app/jury" class="tab-btn" :class="{ active: route.path === '/app/jury' }">Jury</NuxtLink>
    <NuxtLink
      v-if="store.user?.is_admin"
      to="/app/admin"
      class="tab-btn"
      :class="{ active: route.path === '/app/admin' }"
    >Admin</NuxtLink>
    <span class="toolbar-spacer"></span>
    <span class="toolbar-sep" aria-hidden="true"></span>
    <NotificationBell />
    <button class="tab-btn profile-btn" title="Din profil" @click="drawerStore.open = true">
      <img :src="profileImg" alt="" />
      {{ firstName }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useDrawerStore } from '~/stores/drawer'
import { avatarUrl } from '~/utils/avatar'

const store = useAppStore()
const drawerStore = useDrawerStore()
const route = useRoute()

const firstName = computed(() => store.user?.nickname || store.user?.full_name.split(' ')[0] || 'Profil')
const profileImg = computed(() => {
  const u = store.user
  if (!u) return ''
  if (store.team?.image_url && store.isParticipant) return store.team.image_url
  if (u.image_url) return u.image_url
  return avatarUrl(u.full_name, 16, u.email)
})
</script>
