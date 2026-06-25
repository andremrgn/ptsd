<template>
  <Teleport to="body">
    <div v-if="adminModal.open" class="admin-login-overlay" @click.self="adminModal.open = false">
      <div class="admin-login-card">
        <p class="eyebrow" style="color:var(--coral)">Admin</p>
        <h2>Admin-tilgang</h2>
        <p>Du har ikke admin-tilgang.</p>
        <button class="btn btn-sm btn-outline" @click="adminModal.open = false">Lukk</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAdminModalStore } from '~/stores/adminModal'
import { useAppStore } from '~/stores/app'

const adminModal = useAdminModalStore()
const store = useAppStore()
const router = useRouter()

watch(() => adminModal.open, (v) => {
  if (v && store.user?.is_admin) {
    adminModal.open = false
    if (adminModal.redirectAfter) {
      router.push(adminModal.redirectAfter)
      adminModal.redirectAfter = ''
    }
  }
})
</script>
