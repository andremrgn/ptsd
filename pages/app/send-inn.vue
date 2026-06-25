<template>
  <div class="page-section">
    <div class="wrap-narrow">
      <p class="eyebrow">Send inn</p>
      <h1 class="display">Ny produksjon</h1>

      <!-- Team card -->
      <div v-if="store.team" class="team-card">
        <div class="team-card-photo">
          <img :src="teamPhoto" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />
          <button class="team-photo-edit" title="Bytt lagbilde" @click="teamPhotoInput?.click()">✎</button>
        </div>
        <div class="team-card-info">
          <div class="team-card-name">{{ store.team.name }}</div>
          <div class="team-card-members">{{ teamMembers }}</div>
        </div>
        <input ref="teamPhotoInput" type="file" accept="image/*" style="display:none" @change="handleTeamPhoto" />
      </div>

      <!-- Previous submissions -->
      <div v-if="prevSubs.length" style="margin-bottom:1.5rem">
        <div style="font-weight:700;font-size:0.85rem;letter-spacing:.05em;text-transform:uppercase;margin-bottom:0.75rem;opacity:.6">Sendte produksjoner</div>
        <div v-for="s in prevSubs" :key="s.id" class="prod-card">
          <img class="prod-thumb" :src="s.image_url" alt="" />
          <div class="prod-info">
            <div class="prod-title">{{ s.produksjon }}</div>
            <div class="prod-meta">{{ s.kunde }} · <a :href="s.link" target="_blank" style="color:var(--coral)">Se innlegg →</a></div>
          </div>
        </div>
      </div>

      <!-- Submit form -->
      <div v-if="!submitted">
        <div class="form-card">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Kunde</label>
              <input v-model="form.kunde" type="text" class="form-input" placeholder="Kundenavn" />
            </div>
            <div class="form-group">
              <label class="form-label">Produksjonsnavn</label>
              <input v-model="form.produksjon" type="text" class="form-input" placeholder="Navn på produksjonen" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Skjermbilde <span style="color:var(--coral)">*</span></label>
            <div
              class="dropzone"
              :class="{ 'drag-over': dragging, 'has-image': previewUrl }"
              @click="imageInput?.click()"
              @dragover.prevent="dragging = true"
              @dragleave="dragging = false"
              @drop="handleDrop"
            >
              <div v-if="!previewUrl" style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;color:#888;cursor:pointer">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Dra hit eller klikk for å laste opp</span>
              </div>
              <img v-else :src="previewUrl" style="max-height:200px;border-radius:6px;object-fit:contain;margin:0 auto" alt="" />
            </div>
            <input ref="imageInput" type="file" accept="image/*" style="display:none" @change="handleImageSelect" />
          </div>

          <div class="form-group">
            <label class="form-label">Link til innleggene <span style="color:var(--coral)">*</span></label>
            <input v-model="form.link" type="url" class="form-input" placeholder="https://…" />
          </div>

          <div class="form-group">
            <label class="form-label">Postetekster <span style="color:var(--coral)">*</span></label>
            <div v-for="(pt, i) in postetekster" :key="i" class="postetekst-item">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem">
                <span style="font-size:0.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.6">Tekst {{ i + 1 }}</span>
                <button v-if="i > 0" class="postetekst-remove" @click="postetekster.splice(i, 1)">✕</button>
              </div>
              <textarea v-model="pt.content" class="form-input form-textarea" placeholder="Skriv postetekst her…" rows="4" />
              <input v-model="pt.link" type="url" class="form-input" placeholder="Link til dette innlegget (valgfritt)" style="margin-top:0.4rem" />
            </div>
            <button class="btn btn-outline btn-sm" style="margin-top:0.75rem" @click="postetekster.push({ content: '', link: '' })">+ Legg til tekst</button>
          </div>

          <button class="btn" :disabled="submitting" @click="submitEntry">
            {{ submitting ? 'Sender…' : 'Send inn produksjon →' }}
          </button>
        </div>
      </div>

      <!-- Success state -->
      <div v-else class="success-block">
        <h2>Sendt inn! 🎉</h2>
        <p>{{ successMsg }}</p>
        <button class="btn btn-outline" style="margin-top:1rem;border-color:rgba(255,225,198,0.3);color:var(--cream)" @click="resetForm">
          Send inn ny produksjon
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { avatarUrl } from '~/utils/avatar'

definePageMeta({ middleware: 'auth', layout: 'app' })

const store = useAppStore()
const sb = useSupabase()
const { toast } = useToast()

const imageInput = ref<HTMLInputElement>()
const teamPhotoInput = ref<HTMLInputElement>()
const dragging = ref(false)
const previewUrl = ref('')
const selectedFile = ref<File | null>(null)
const submitted = ref(false)
const submitting = ref(false)
const successMsg = ref('')
const prevSubs = ref<any[]>([])
const teamMembers = ref('')

const form = reactive({ kunde: '', produksjon: '', link: '' })
const postetekster = reactive([{ content: '', link: '' }])

const teamPhoto = computed(() => {
  const t = store.team
  if (!t) return ''
  return t.image_url || avatarUrl(t.name, 72)
})

onMounted(async () => {
  await loadPrevSubs()
  if (store.user?.team_id) {
    const { data } = await sb.from('users').select('full_name').eq('team_id', store.user.team_id)
    if (data) teamMembers.value = data.map((m: any) => m.full_name).join(' & ')
  }
})

async function loadPrevSubs() {
  if (!store.user?.team_id) return
  const { data } = await sb.from('submissions').select('*').eq('team_id', store.user.team_id).order('submitted_at', { ascending: false })
  prevSubs.value = data || []
}

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return }
  if (file.size > 10 * 1024 * 1024) { toast('Bildet er for stort (maks 10 MB)', true); return }
  previewFile(file)
}

function handleDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (!file) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return }
  if (file.size > 10 * 1024 * 1024) { toast('Bildet er for stort (maks 10 MB)', true); return }
  previewFile(file)
}

function previewFile(file: File) {
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { previewUrl.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}

async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await sb.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = sb.storage.from('uploads').getPublicUrl(path)
  return publicUrl
}

async function submitEntry() {
  if (!form.kunde || !form.produksjon) { toast('Fyll inn kunde og produksjonsnavn', true); return }
  if (!selectedFile.value) { toast('Last opp et skjermbilde', true); return }
  if (!form.link) { toast('Legg inn link til innleggene', true); return }
  const pts = postetekster.filter(p => p.content.trim())
  if (!pts.length) { toast('Skriv minst én postetekst', true); return }
  if (!store.user?.team_id) { toast('Ingen team funnet for brukeren din', true); return }

  submitting.value = true
  try {
    const ext = (selectedFile.value.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '')
    const fname = `${Date.now()}.${ext}`
    const imageUrl = await uploadImage(selectedFile.value, `submissions/${fname}`)
    const { data: sub, error: subErr } = await sb.from('submissions').insert({
      team_id: store.user.team_id,
      submitted_by: store.user.email,
      kunde: form.kunde,
      produksjon: form.produksjon,
      image_url: imageUrl,
      link: form.link,
    }).select().single()
    if (subErr) throw subErr
    const ptRows = pts.map((p, i) => ({ submission_id: sub.id, content: p.content, link: p.link || null, sort_order: i }))
    const { error: ptErr } = await sb.from('postetekster').insert(ptRows)
    if (ptErr) throw ptErr
    successMsg.value = `${form.produksjon} for ${form.kunde} er registrert.`
    submitted.value = true
    toast('Produksjon sendt! 🎉')
    loadPrevSubs()
  } catch (e: any) {
    toast('Feil: ' + e.message, true)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  submitted.value = false
  form.kunde = ''
  form.produksjon = ''
  form.link = ''
  selectedFile.value = null
  previewUrl.value = ''
  postetekster.splice(0, postetekster.length, { content: '', link: '' })
  if (imageInput.value) imageInput.value.value = ''
}

async function handleTeamPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !store.team) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    toast('Kun bilder er tillatt (jpg, png, webp)', true)
    return
  }
  toast('Laster opp…')
  try {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const url = await uploadImage(file, `teams/${store.user?.team_id}.${ext}`)
    await sb.from('teams').update({ image_url: url }).eq('id', store.team.id)
    store.team.image_url = url
    toast('Lagbilde oppdatert!')
  } catch (err: any) {
    toast('Feil: ' + err.message, true)
  }
}
</script>
