<template>
  <header id="app-header">
    <NuxtLink to="/app/hjem" class="app-logo">
      <img src="/logo-mark-white.png" alt="" class="app-logo-mark" />
      <img src="/logo-wordmark-white.webp" alt="Morgenstern" class="app-logo-word" />
    </NuxtLink>
    <div class="app-header-right">
      <button class="logout-btn" @click="logout">Logg ut</button>
      <NotificationBell />
      <button class="profile-btn" @click="drawerStore.open = true">
        <img
          :src="profileImg"
          alt=""
          style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block"
        />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useDrawerStore } from '~/stores/drawer'
import { avatarUrl } from '~/utils/avatar'

const store = useAppStore()
const drawerStore = useDrawerStore()
const { logout } = useAuth()

const profileImg = computed(() => {
  const u = store.user
  if (!u) return ''
  if (store.team?.image_url && store.isParticipant) return store.team.image_url
  if (u.image_url) return u.image_url
  return avatarUrl(u.full_name, 32, u.email)
})
</script>
