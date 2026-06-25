<template>
  <header id="app-header">
    <NuxtLink to="/app/hjem" class="app-logo">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="white">
        <circle cx="20" cy="20" r="18.5" fill="none" stroke="white" stroke-width="2.5"/>
        <text x="20" y="27.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="17" letter-spacing="-0.5">M</text>
      </svg>
      <span class="app-logo-text">Morgenstern</span>
    </NuxtLink>
    <div class="app-role-tag">{{ roleLabel }}</div>
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
import { avatarUrl, ROLE_LABELS } from '~/utils/avatar'

const store = useAppStore()
const drawerStore = useDrawerStore()
const { logout } = useAuth()

const roleLabel = computed(() => store.user ? (ROLE_LABELS[store.user.role] || store.user.role) : '–')
const profileImg = computed(() => {
  const u = store.user
  if (!u) return ''
  if (store.team?.image_url && store.isParticipant) return store.team.image_url
  if (u.image_url) return u.image_url
  return avatarUrl(u.full_name, 32, u.email)
})
</script>
