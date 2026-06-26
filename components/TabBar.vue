<template>
  <nav class="tab-bar">
    <NuxtLink to="/app/hjem" class="tab-btn" :class="{ active: route.path === '/app/hjem' }">
      Hjem
    </NuxtLink>
    <NuxtLink
      v-if="store.isParticipant"
      to="/app/send-inn"
      class="tab-btn"
      :class="{ active: route.path === '/app/send-inn' }"
    >
      Send inn
    </NuxtLink>
    <NuxtLink
      v-if="store.resultsVisible"
      to="/app/resultater"
      class="tab-btn"
      :class="{ active: route.path === '/app/resultater' }"
    >
      Resultater
    </NuxtLink>
    <NuxtLink
      to="/app/jury"
      class="tab-btn"
      :class="{ active: route.path === '/app/jury' }"
    >
      Jury
    </NuxtLink>
    <button
      v-if="store.user?.is_admin"
      class="tab-btn"
      :class="{ active: route.path === '/app/admin' }"
      @click="handleAdminClick"
    >
      Admin
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

function handleAdminClick() {
  router.push('/app/admin')
}
</script>
