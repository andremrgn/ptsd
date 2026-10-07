<template>
  <div class="page-section">
    <div class="wrap-narrow">
      <!-- Ditt team -->
      <div v-if="store.team" class="team-card">
        <span class="section-title">Ditt team</span>
        <div class="team-card-photo">
          <img :src="teamPhoto" alt="" />
        </div>
        <div class="team-card-info">
          <div class="team-card-name">{{ store.team.name }}</div>
          <div>{{ teamMembers }}</div>
        </div>
        <button @click="teamPhotoInput?.click()">Endre bilde…</button>
        <input ref="teamPhotoInput" type="file" accept="image/*" style="display:none" @change="handleTeamPhoto" />
      </div>

      <!-- Sendte produksjoner -->
      <div v-if="prevSubs.length" class="groupbox" style="margin-bottom:12px">
        <span class="section-title">Sendte produksjoner</span>
        <div class="prod-list">
          <div v-for="s in prevSubs" :key="s.id" class="prod-card">
            <img class="prod-thumb" :src="s.image_url" alt="" loading="lazy" decoding="async" />
            <div class="prod-info">
              <div class="prod-title">{{ s.produksjon }}</div>
              <div v-if="s.teamName">Team: {{ s.teamName }}</div>
              <div>{{ s.kunde }} · <a v-if="safeUrl(s.link)" :href="safeUrl(s.link)!" target="_blank" rel="noopener noreferrer">Se innlegg</a><span v-else>ugyldig lenke</span></div>
              <div v-if="s.postetekster && s.postetekster.length" class="prod-uttak-links">
                <a v-for="(pt, i) in s.postetekster" :key="i" :href="metaAdLibraryUrl(pt.content)" target="_blank" rel="noopener noreferrer" class="meta-lib-link">
                  {{ pt.title ? 'Finn: ' + pt.title : (s.postetekster.length > 1 ? 'Finn uttak ' + (i + 1) : 'Finn uttaket på Meta') }}…
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit form -->
      <div v-if="!submitted" class="groupbox">
        <span class="section-title">Ny produksjon</span>

        <!-- Team-velger for rådgivere/prosjektledere uten fast team -->
        <div v-if="!hasFixedTeam" class="form-group">
          <label class="form-label" for="si-team">Team som skrev postetekstene: <span style="color:var(--coral)">*</span></label>
          <select id="si-team" v-model="selectedTeamId" class="form-input">
            <option value="" disabled>Velg team…</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="si-kunde">Kunde:</label>
            <input id="si-kunde" v-model="form.kunde" type="text" class="form-input" placeholder="Kundenavn" />
          </div>
          <div class="form-group">
            <label class="form-label" for="si-prod">Produksjonsnavn:</label>
            <input id="si-prod" v-model="form.produksjon" type="text" class="form-input" placeholder="Navn på produksjonen" />
          </div>
        </div>

        <div class="form-group">
          <span class="form-label">Skjermbilde: <span style="color:var(--coral)">*</span></span>
          <div
            class="dropzone"
            :class="{ 'drag-over': dragging, 'has-image': previewUrl }"
            @click="imageInput?.click()"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop="handleDrop"
          >
            <template v-if="!previewUrl">
              <span>Dra et skjermbilde hit, eller</span>
              <button type="button" @click.stop="imageInput?.click()">Bla gjennom…</button>
            </template>
            <img v-else :src="previewUrl" alt="" />
          </div>
          <input ref="imageInput" type="file" accept="image/*" style="display:none" @change="handleImageSelect" />
        </div>

        <div class="form-group">
          <label class="form-label" for="si-link">Link til innleggene: <span style="color:var(--coral)">*</span></label>
          <input id="si-link" v-model="form.link" type="url" class="form-input" placeholder="https://…" />
        </div>

        <div class="form-group">
          <span class="form-label">Postetekster: <span style="color:var(--coral)">*</span></span>
          <div v-for="(pt, i) in postetekster" :key="i" class="postetekst-item">
            <span class="postetekst-head">Innlegg {{ i + 1 }}</span>
            <label class="form-label" :for="`si-pt-title-${i}`">Navn på uttaket (valgfritt):</label>
            <input :id="`si-pt-title-${i}`" v-model="pt.title" type="text" class="form-input" />
            <label class="form-label" :for="`si-pt-${i}`" style="margin-top:6px">Postetekst (ordrett, slik den står i annonsen):</label>
            <textarea :id="`si-pt-${i}`" v-model="pt.content" class="form-input form-textarea" rows="4" />
            <div class="postetekst-actions">
              <a v-if="pt.content.trim()" :href="metaAdLibraryUrl(pt.content)" target="_blank" rel="noopener noreferrer" class="meta-lib-link">Finn på Meta…</a>
              <button v-if="i > 0" class="postetekst-remove" @click="postetekster.splice(i, 1)">Fjern</button>
            </div>
          </div>
          <button @click="postetekster.push({ title: '', content: '' })">Legg til innlegg</button>
        </div>

        <div class="form-actions">
          <button class="default" :disabled="submitting" @click="submitEntry">
            {{ submitting ? 'Sender…' : 'Send inn' }}
          </button>
        </div>
      </div>

      <!-- Bekreftelse: Win98-meldingsboks -->
      <div v-else class="window msgbox">
        <div class="title-bar">
          <div class="title-bar-text"><span class="title-bar-caption">Sølvposten</span></div>
          <div class="title-bar-controls">
            <button aria-label="Close" @click="resetForm"></button>
          </div>
        </div>
        <div class="msgbox-body">
          <svg class="msgbox-icon" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
            <path d="M7 2h18v1h2v1h1v1h1v2h1v12h-1v2h-1v1h-1v1h-2v1H15l-7 6v-6H7v-1H5v-1H4v-1H3v-2H2V7h1V5h1V4h1V3h2z" fill="#fff" stroke="#000" />
            <rect x="15" y="6" width="3" height="3" fill="#00f" />
            <rect x="14" y="11" width="4" height="2" fill="#00f" />
            <rect x="15" y="11" width="3" height="9" fill="#00f" />
            <rect x="13" y="19" width="7" height="2" fill="#00f" />
          </svg>
          <p class="msgbox-text"><strong>Sendt inn!</strong><br>{{ successMsg }}</p>
        </div>
        <div class="msgbox-buttons">
          <button class="default" @click="resetForm">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { avatarUrl, safeUrl, metaAdLibraryUrl } from '~/utils/avatar'

definePageMeta({ middleware: 'auth', layout: 'app' })

const store = useAppStore()
const sb = useSupabaseClient()
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
const teams = ref<any[]>([])
const selectedTeamId = ref(store.user?.team_id || '')

// Kreatører har fast team_id; rådgivere/prosjektledere må velge team ved innsending
const hasFixedTeam = computed(() => !!store.user?.team_id)

const form = reactive({ kunde: '', produksjon: '', link: '' })
const postetekster = reactive<{ title: string; content: string }[]>([{ title: '', content: '' }])

const teamPhoto = computed(() => {
  const t = store.team
  if (!t) return ''
  return t.image_url || avatarUrl(t.name, 72)
})

onMounted(async () => {
  if (store.user?.team_id) {
    await loadPrevSubs()
    const { data } = await sb.from('users').select('full_name').eq('team_id', store.user.team_id)
    if (data) teamMembers.value = data.map((m: any) => m.full_name).join(' & ')
  } else {
    // Uten fast team: hent alle team så brukeren kan velge hvem teksten tilhører,
    // og så innsendingene kan merkes med team de gjelder
    const { data } = await sb.from('teams').select('id, name').order('name')
    teams.value = data || []
    await loadPrevSubs()
  }
})

async function loadPrevSubs() {
  // Kreatører ser teamets innsendinger; rådgivere/prosjektledere ser sine egne
  const query = sb.from('submissions').select('*').order('submitted_at', { ascending: false })
  if (store.user?.team_id) query.eq('team_id', store.user.team_id)
  else if (store.user?.email) query.eq('submitted_by', store.user.email)
  else return
  const { data } = await query
  let subs = data || []

  // Hent postetekstene så vi kan lage en presis «Finn uttaket»-lenke per innlegg
  if (subs.length) {
    const ids = subs.map((s: any) => s.id)
    const { data: pts } = await sb
      .from('postetekster')
      .select('submission_id, title, content, sort_order')
      .in('submission_id', ids)
      .order('sort_order')
    const bySub: Record<string, { title: string | null; content: string }[]> = {}
    ;(pts || []).forEach((p: any) => {
      if (!p.content) return
      if (!bySub[p.submission_id]) bySub[p.submission_id] = []
      bySub[p.submission_id].push({ title: p.title, content: p.content })
    })
    subs = subs.map((s: any) => ({ ...s, postetekster: bySub[s.id] || [] }))
  }

  // Uten fast team kan innsendingene spenne over flere team — merk hver med teamnavn
  if (!store.user?.team_id) {
    const teamName: Record<string, string> = Object.fromEntries(teams.value.map((t: any) => [t.id, t.name]))
    prevSubs.value = subs.map((s: any) => ({ ...s, teamName: teamName[s.team_id] || 'Ukjent team' }))
  } else {
    prevSubs.value = subs
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

function validateImageFile(file: File): boolean {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast('Kun bilder er tillatt (jpg, png, webp)', true); return false }
  if (file.size > 10 * 1024 * 1024) { toast('Bildet er for stort (maks 10 MB)', true); return false }
  return true
}

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (validateImageFile(file)) previewFile(file)
}

function handleDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (!file) return
  if (validateImageFile(file)) previewFile(file)
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
  // Kreatører bruker eget team_id; andre må ha valgt et team i nedtrekkslisten
  const teamId = store.user?.team_id || selectedTeamId.value
  if (!teamId) { toast('Velg hvilket team postetekstene tilhører', true); return }

  submitting.value = true
  try {
    const ext = MIME_EXT[selectedFile.value.type] || 'jpg'
    const fname = `${Date.now()}.${ext}`
    const imageUrl = await uploadImage(selectedFile.value, `submissions/${fname}`)
    const { data: sub, error: subErr } = await sb.from('submissions').insert({
      team_id: teamId,
      submitted_by: store.user!.email,
      kunde: form.kunde,
      produksjon: form.produksjon,
      image_url: imageUrl,
      link: form.link,
    }).select().single()
    if (subErr) throw subErr
    const ptRows = pts.map((p, i) => ({ submission_id: sub.id, title: p.title || null, content: p.content, sort_order: i }))
    const { error: ptErr } = await sb.from('postetekster').insert(ptRows)
    if (ptErr) {
      // Rydd opp foreldreløs submission så den ikke vises som tom produksjon
      await sb.from('submissions').delete().eq('id', sub.id)
      throw ptErr
    }
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
  postetekster.splice(0, postetekster.length, { title: '', content: '' })
  if (imageInput.value) imageInput.value.value = ''
  // Nullstill team-valg så neste innsending bevisst knyttes til riktig team
  // (kreatører beholder sitt faste team, andre må velge på nytt)
  selectedTeamId.value = store.user?.team_id || ''
}

async function handleTeamPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !store.team) return
  if (!validateImageFile(file)) return
  toast('Laster opp…')
  try {
    const ext = MIME_EXT[file.type] || 'jpg'
    const url = await uploadImage(file, `teams/${store.user?.team_id}.${ext}`)
    await sb.from('teams').update({ image_url: url }).eq('id', store.team.id)
    store.team.image_url = url
    toast('Lagbilde oppdatert!')
  } catch (err: any) {
    toast('Feil: ' + err.message, true)
  }
}
</script>
