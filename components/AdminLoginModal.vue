<template>
  <Teleport to="body">
    <div v-if="adminModal.open" class="admin-login-overlay" @click.self="adminModal.open = false">
      <div class="admin-login-card">
        <p class="eyebrow" style="color:var(--coral)">Admin</p>
        <h2>Admin-tilgang</h2>
        <p>Skriv inn admin-passordet.</p>
        <div class="form-group">
          <label class="form-label">Passord</label>
          <input
            ref="pwInput"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            @keydown.enter="submit"
          />
        </div>
        <div style="display:flex;gap:0.6rem;margin-top:0.25rem">
          <button class="btn btn-sm btn-outline" style="flex:0" @click="adminModal.open = false">Avbryt</button>
          <button class="btn btn-sm" style="flex:1" @click="submit">Logg inn →</button>
        </div>
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
const { toast } = useToast()
const password = ref('')
const pwInput = ref<HTMLInputElement>()

const ADMIN_PW = 'mrgn2026'

watch(() => adminModal.open, (v) => {
  if (v) {
    password.value = ''
    nextTick(() => pwInput.value?.focus())
  }
})

function submit() {
  if (password.value !== ADMIN_PW) {
    toast('Feil passord', true)
    return
  }
  store.adminVerified = true
  adminModal.open = false
  if (adminModal.redirectAfter) {
    router.push(adminModal.redirectAfter)
    adminModal.redirectAfter = ''
  }
}
</script>
