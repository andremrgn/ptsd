<template>
  <div>
    <div class="drawer-overlay" :class="{ open: drawerStore.open }" @click="drawerStore.open = false" />
    <!-- «Egenskaper»-dialog, som i Win98 -->
    <div class="drawer window" :class="{ open: drawerStore.open }" role="dialog" aria-label="Din profil">
      <div class="title-bar">
        <div class="title-bar-text">
          <span class="title-bar-caption">Egenskaper for {{ user?.nickname || user?.full_name || 'profil' }}</span>
        </div>
        <div class="title-bar-controls">
          <button aria-label="Close" title="Lukk" @click="drawerStore.open = false"></button>
        </div>
      </div>
      <div class="drawer-body">
        <div v-if="!user" class="loading">Laster…</div>
        <template v-else>
          <!-- Profilbilde + navn -->
          <div class="drawer-profile">
            <div class="drawer-photo-wrap" @click="profileInput?.click()" title="Endre profilbilde">
              <img :src="profileSrc" alt="" />
            </div>
            <div style="flex:1;min-width:0">
              <div class="drawer-profile-name">{{ user.full_name }}</div>
              <div>{{ roleLabel }}</div>
            </div>
            <button @click="profileInput?.click()">Endre bilde…</button>
          </div>
          <input ref="profileInput" type="file" accept="image/*" style="display:none" @change="handleProfilePhoto" />

          <!-- Kallenavn og sitat -->
          <div class="drawer-section">
            <span class="drawer-section-title">Profil</span>
            <label class="drawer-edit-label" for="pd-nick">Kallenavn:</label>
            <input id="pd-nick" v-model="nickname" class="drawer-edit-input" type="text" maxlength="30" :placeholder="user.full_name" />
            <label class="drawer-edit-label" for="pd-quote">Favorittsitat:</label>
            <textarea id="pd-quote" v-model="quote" class="drawer-edit-input" rows="2" placeholder="Et godt sitat…" />
            <div class="drawer-buttons" style="margin-top:6px">
              <button @click="saveProfile">Lagre</button>
            </div>
          </div>

          <!-- Passord -->
          <div class="drawer-section">
            <span class="drawer-section-title">Passord</span>
            <template v-if="showPwForm">
              <label class="drawer-edit-label" for="pd-pw1">Nytt passord:</label>
              <input id="pd-pw1" v-model="newPw" class="drawer-edit-input" type="password" placeholder="Minst 8 tegn" autocomplete="new-password" />
              <label class="drawer-edit-label" for="pd-pw2">Bekreft passord:</label>
              <input id="pd-pw2" v-model="confirmPw" class="drawer-edit-input" type="password" placeholder="Gjenta passordet" autocomplete="new-password" />
              <p v-if="pwError" style="color:var(--coral);margin-top:4px">{{ pwError }}</p>
              <div class="drawer-buttons" style="margin-top:6px">
                <button :disabled="pwLoading" @click="changePassword">{{ pwLoading ? 'Lagrer…' : 'OK' }}</button>
                <button @click="showPwForm = false">Avbryt</button>
              </div>
            </template>
            <div v-else class="drawer-buttons" style="justify-content:flex-start">
              <button @click="showPwForm = true">Endre passord…</button>
            </div>
          </div>

          <!-- Teamets bilde -->
          <div v-if="store.isParticipant && store.team" class="drawer-section">
            <span class="drawer-section-title">Teamets bilde</span>
            <div class="drawer-team-photo-row">
              <div class="drawer-photo-wrap" @click="teamInput?.click()" title="Endre teamets bilde">
                <img :src="teamSrc" alt="" />
              </div>
              <span style="flex:1">Begge på teamet kan endre dette bildet.</span>
              <button @click="teamInput?.click()">Endre…</button>
            </div>
            <input ref="teamInput" type="file" accept="image/*" style="display:none" @change="handleTeamPhoto" />
          </div>

          <!-- Juryering — vises bare når aktiv -->
          <div v-if="store.judgingActive" class="drawer-section">
            <span class="drawer-section-title">Kampanje</span>
            <div class="drawer-row">
              <span>Juryering:</span>
              <strong>Aktiv</strong>
            </div>
          </div>
        </template>
      </div>
      <div class="drawer-footer">
        <button @click="logout">Logg ut</button>
        <div class="drawer-buttons">
          <button v-if="user?.is_admin" @click="openAdmin">Kontrollpanel…</button>
          <button class="default" @click="drawerStore.open = false">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useDrawerStore } from '~/stores/drawer'
import { avatarUrl, ROLE_LABELS } from '~/utils/avatar'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

const store = useAppStore()
const drawerStore = useDrawerStore()
const sb = useSupabaseClient()
const { toast } = useToast()
const { logout } = useAuth()
const router = useRouter()

const user = computed(() => store.user)
const profileInput = ref<HTMLInputElement>()
const teamInput = ref<HTMLInputElement>()
const nickname = ref('')
const quote = ref('')
const showPwForm = ref(false)
const newPw = ref('')
const confirmPw = ref('')
const pwError = ref('')
const pwLoading = ref(false)

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
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return }
  if (file.size > 5 * 1024 * 1024) { toast('Bildet er for stort (maks 5 MB)', true); return }
  toast('Laster opp…')
  try {
    const ext = MIME_EXT[file.type] || 'jpg'
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
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return }
  if (file.size > 5 * 1024 * 1024) { toast('Bildet er for stort (maks 5 MB)', true); return }
  toast('Laster opp…')
  try {
    const ext = MIME_EXT[file.type] || 'jpg'
    const url = await uploadImage(file, `teams/${store.team.id}.${ext}`)
    await sb.from('teams').update({ image_url: url }).eq('id', store.team.id)
    store.team.image_url = url
    toast('Teamets bilde oppdatert ✓')
  } catch (err: any) {
    toast('Feil: ' + err.message, true)
  }
}

async function changePassword() {
  pwError.value = ''
  if (newPw.value.length < 8) { pwError.value = 'Passordet må være minst 8 tegn.'; return }
  if (newPw.value !== confirmPw.value) { pwError.value = 'Passordene er ikke like.'; return }
  pwLoading.value = true
  const { error } = await sb.auth.updateUser({ password: newPw.value })
  pwLoading.value = false
  if (error) {
    if (error.message.toLowerCase().includes('different from the old password')) {
      pwError.value = 'Det nye passordet må være forskjellig fra det gamle.'
    } else {
      pwError.value = 'Noe gikk galt. Prøv igjen.'
    }
    return
  }
  showPwForm.value = false
  newPw.value = ''
  confirmPw.value = ''
  toast('Passord endret ✓')
}

function openAdmin() {
  drawerStore.open = false
  router.push('/app/admin')
}
</script>
