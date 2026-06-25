<template>
  <div>
    <div class="drawer-overlay" :class="{ open: drawerStore.open }" @click="drawerStore.open = false" />
    <div class="drawer" :class="{ open: drawerStore.open }">
      <div class="drawer-head">
        <h2>Din profil</h2>
        <button class="drawer-x" @click="drawerStore.open = false">✕</button>
      </div>
      <div class="drawer-body">
        <div v-if="!user" class="loading">Laster…</div>
        <template v-else>
          <div class="drawer-profile">
            <div class="drawer-photo-wrap" @click="profileInput?.click()" title="Endre profilbilde">
              <img :src="profileSrc" alt="" />
              <div class="drawer-photo-overlay">✎</div>
            </div>
            <div>
              <div class="drawer-profile-name">{{ user.nickname || user.full_name }}</div>
              <div class="drawer-profile-role">{{ roleLabel }}</div>
            </div>
          </div>
          <input ref="profileInput" type="file" accept="image/*" style="display:none" @change="handleProfilePhoto" />

          <div class="drawer-section">
            <div class="drawer-section-title">Din profil</div>
            <label class="drawer-edit-label">Kallenavn</label>
            <input v-model="nickname" class="drawer-edit-input" type="text" maxlength="30" :placeholder="user.full_name" />
            <label class="drawer-edit-label">Favorittsitat</label>
            <textarea v-model="quote" class="drawer-edit-input" rows="2" placeholder="Et godt sitat…" />
            <button class="drawer-save-btn" @click="saveProfile">Lagre profil</button>
          </div>

          <div v-if="store.isParticipant && store.team" class="drawer-section">
            <div class="drawer-section-title">Teamets bilde</div>
            <div class="drawer-team-photo-row">
              <div class="drawer-photo-wrap" @click="teamInput?.click()" title="Endre teamets bilde">
                <img :src="teamSrc" alt="" />
                <div class="drawer-photo-overlay">✎</div>
              </div>
              <span class="drawer-team-photo-hint">Begge på teamet kan endre dette bildet.</span>
            </div>
            <input ref="teamInput" type="file" accept="image/*" style="display:none" @change="handleTeamPhoto" />
          </div>

          <div class="drawer-section">
            <div class="drawer-section-title">Kampanje</div>
            <div class="drawer-row">
              <span class="drawer-row-lbl">Juryering</span>
              <span class="drawer-row-val" :style="{ color: store.judgingActive ? '#22c55e' : 'var(--muted)' }">
                {{ store.judgingActive ? 'Aktiv' : 'Ikke startet' }}
              </span>
            </div>
          </div>

          <button v-if="user.is_admin" class="drawer-admin-btn" @click="openAdmin">Admin-panel →</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useDrawerStore } from '~/stores/drawer'
import { useAdminModalStore } from '~/stores/adminModal'
import { avatarUrl, ROLE_LABELS } from '~/utils/avatar'

const store = useAppStore()
const drawerStore = useDrawerStore()
const adminModal = useAdminModalStore()
const sb = useSupabase()
const { toast } = useToast()
const router = useRouter()

const user = computed(() => store.user)
const profileInput = ref<HTMLInputElement>()
const teamInput = ref<HTMLInputElement>()
const nickname = ref('')
const quote = ref('')

watch(user, (u) => {
  if (u) {
    nickname.value = u.nickname || ''
    quote.value = u.favorite_quote || ''
  }
}, { immediate: true })

const roleLabel = computed(() => user.value ? (ROLE_LABELS[user.value.role] || user.value.role) : '')
const profileSrc = computed(() => {
  const u = user.value
  if (!u) return ''
  return u.image_url || avatarUrl(u.full_name, 54, u.email)
})
const teamSrc = computed(() => {
  const t = store.team
  if (!t) return ''
  return t.image_url || avatarUrl(t.name, 54)
})

async function saveProfile() {
  if (!user.value) return
  const { error } = await sb.from('users').update({
    nickname: nickname.value || null,
    favorite_quote: quote.value || null,
  }).eq('email', user.value.email)
  if (error) { toast('Kunne ikke lagre', true); return }
  store.setUser({ ...user.value, nickname: nickname.value || null, favorite_quote: quote.value || null })
  toast('Profil lagret ✓')
}

async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await sb.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = sb.storage.from('uploads').getPublicUrl(path)
  return publicUrl
}

async function handleProfilePhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !user.value) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return }
  if (file.size > 5 * 1024 * 1024) { toast('Bildet er for stort (maks 5 MB)', true); return }
  toast('Laster opp…')
  try {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const url = await uploadImage(file, `profiles/${user.value.email.replace(/[@.]/g, '_')}.${ext}`)
    await sb.from('users').update({ image_url: url }).eq('email', user.value.email)
    store.setUser({ ...user.value, image_url: url })
    toast('Profilbilde oppdatert ✓')
  } catch (err: any) {
    toast('Feil: ' + err.message, true)
  }
}

async function handleTeamPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !store.team) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return }
  if (file.size > 5 * 1024 * 1024) { toast('Bildet er for stort (maks 5 MB)', true); return }
  toast('Laster opp…')
  try {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const url = await uploadImage(file, `teams/${store.team.id}.${ext}`)
    await sb.from('teams').update({ image_url: url }).eq('id', store.team.id)
    store.team.image_url = url
    toast('Teamets bilde oppdatert ✓')
  } catch (err: any) {
    toast('Feil: ' + err.message, true)
  }
}

function openAdmin() {
  drawerStore.open = false
  if (store.adminVerified) {
    router.push('/app/admin')
  } else {
    adminModal.open = true
    adminModal.redirectAfter = '/app/admin'
  }
}
</script>
