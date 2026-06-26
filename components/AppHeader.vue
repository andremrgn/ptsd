<template>
  <header id="app-header">
    <NuxtLink to="/app/hjem" class="app-logo">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="white">
        <circle cx="20" cy="20" r="18.5" fill="none" stroke="white" stroke-width="2.5"/>
        <text x="20" y="27.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="17" letter-spacing="-0.5">M</text>
      </svg>
      <span class="app-logo-text">Morgenstern</span>
    </NuxtLink>
    <div v-if="deadlineCountdown !== null" class="header-deadline">
      <span class="hd-num">{{ deadlineCountdown }}</span>
      <span class="hd-lbl">{{ deadlineCountdown === 1 ? 'dag' : 'dager' }} igjen</span>
    </div>
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

const deadlineCountdown = computed(() => {
  if (!store.competitionDeadline || store.judgingActive) return null
  const deadline = new Date(store.competitionDeadline)
  deadline.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
  return days >= 0 ? days : null
})
const profileImg = computed(() => {
  const u = store.user
  if (!u) return ''
  if (store.team?.image_url && store.isParticipant) return store.team.image_url
  if (u.image_url) return u.image_url
  return avatarUrl(u.full_name, 32, u.email)
})
</script>

<style scoped>
.header-deadline {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 2px;
  padding: 0.2rem 0.6rem;
}

.hd-num {
  font-size: 0.8rem;
  font-weight: 900;
  color: white;
  letter-spacing: -0.01em;
}

.hd-lbl {
  font-size: 0.72rem;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
}
</style>
