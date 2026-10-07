<template>
  <div class="page-section">
    <div class="wrap">
      <div class="stats-row">
        <div class="stat"><div class="stat-num">{{ stats.subs }}</div><div class="stat-lbl">Bidrag</div></div>
        <div class="stat"><div class="stat-num">{{ stats.jury }}</div><div class="stat-lbl">Jury</div></div>
        <div class="stat"><div class="stat-num">{{ stats.scores }}</div><div class="stat-lbl">Poeng</div></div>
      </div>

      <!-- Judging status -->
      <div class="mb1 mt2">
        <div class="section-title">Juryeringsstatus</div>
        <div class="status-bar">
          <div class="status-ind">
            <div class="dot" :class="{ on: store.judgingActive }"></div>
            <span>{{ store.judgingActive ? 'Juryering er aktiv' : 'Juryering er ikke startet' }}</span>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <button class="btn btn-sm" :class="{ 'btn-danger': store.judgingActive }" @click="toggleJudging">
              {{ store.judgingActive ? 'Stopp juryering' : 'Start juryering' }}
            </button>
            <NuxtLink to="/app/resultater" class="btn btn-outline btn-sm">Se resultater</NuxtLink>
          </div>
        </div>
      </div>

      <!-- Results visibility -->
      <div class="mb1 mt2">
        <div class="section-title">Resultater synlige</div>
        <div class="status-bar">
          <div class="status-ind">
            <div class="dot" :style="{ background: store.resultsVisible ? '#3D9E6A' : 'var(--muted)' }"></div>
            <span>{{ store.resultsVisible ? 'Synlige' : 'Skjult' }}</span>
          </div>
          <button class="btn btn-sm" @click="toggleResults">{{ store.resultsVisible ? 'Skjul' : 'Vis' }}</button>
        </div>
      </div>

      <!-- Competition deadline -->
      <div class="mb1 mt2">
        <div class="section-title">Innsendingsfrist</div>
        <div class="status-bar">
          <div class="status-ind">
            <div class="dot" :style="{ background: deadline ? '#3D9E6A' : 'var(--muted)' }"></div>
            <span v-if="deadline">Frist: {{ deadlineLabel }} · Juryering starter {{ juryStartLabel }}</span>
            <span v-else style="color:var(--muted)">Ingen frist satt</span>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <input v-model="deadline" type="date" class="form-input" style="max-width:175px;margin:0" />
            <button class="btn btn-sm" @click="saveDeadline">Lagre</button>
          </div>
        </div>
      </div>

      <!-- Mail -->
      <div class="mb1 mt2">
        <div class="section-title">Mail</div>
        <div class="status-bar">
          <div class="status-ind">
            <div class="dot" :style="{ background: mailBlockedNow || mailPaused ? '#aaa' : '#3D9E6A' }"></div>
            <span v-if="mailBlockedNow">Blokkert av kalender ({{ mailBlockedNow.label || mailBlockedNow.start + ' – ' + mailBlockedNow.end }})</span>
            <span v-else-if="mailPaused">Manuelt pauset</span>
            <span v-else>Auto-mail er aktiv</span>
          </div>
          <button class="btn btn-sm" :class="{ 'btn-danger': !mailPaused }" @click="toggleMailPause">
            {{ mailPaused ? 'Gjenoppta' : 'Pause manuelt' }}
          </button>
        </div>

        <div class="groupbox" style="margin-top:14px">
          <span class="section-title">Kalenderblokker</span>
          <div class="add-row">
            <input v-model="newBlock.label" type="text" class="form-input" placeholder="Merkelapp (valgfri)" />
            <input v-model="newBlock.start" type="date" class="form-input" style="max-width:160px" />
            <input v-model="newBlock.end" type="date" class="form-input" style="max-width:160px" />
            <button class="btn btn-sm" @click="addMailBlock">Legg til</button>
          </div>
          <div v-if="mailBlocks.length" class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Merkelapp</th><th>Fra</th><th>Til</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(b, i) in mailBlocks" :key="i" :style="{ background: isBlockActive(b) ? 'rgba(237,85,92,0.06)' : '' }">
                  <td>{{ b.label || '–' }}</td>
                  <td style="font-size:0.78rem">{{ b.start }}</td>
                  <td style="font-size:0.78rem">{{ b.end }}</td>
                  <td><button class="btn btn-sm btn-danger" style="padding:0.3rem 0.65rem;font-size:0.65rem" @click="removeMailBlock(i)">Fjern</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else style="font-size:0.82rem;color:var(--muted)">Ingen blokker lagt til.</p>
        </div>
      </div>

      <!-- Informer deltakere -->
      <div class="mb1 mt2">
        <div class="section-title">Informer deltakere</div>
        <p style="font-size:0.83rem;color:var(--muted);margin-bottom:0.85rem">Sender intro-mailen «Sølvposten er i gang» til de avkryssede rådgiverne og prosjektlederne.</p>
        <div v-if="introCandidates.length" class="table-wrap" style="margin-bottom:0.85rem">
          <table class="data-table users-table">
            <tbody>
              <tr v-for="u in introCandidates" :key="u.email">
                <!-- 98.css tegner avkrysningsboksen via <label> rett etter inputen -->
                <td><input :id="`intro-${u.email}`" type="checkbox" :value="u.email" v-model="introSelected" /><label :for="`intro-${u.email}`">{{ u.full_name }}</label></td>
                <td class="email-col">{{ u.email }}</td>
                <td>{{ u.role }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else style="font-size:0.82rem;color:var(--muted)">Ingen rådgivere eller prosjektledere funnet.</p>
        <button class="btn btn-sm" :disabled="introSending || !introSelected.length" @click="sendIntro">
          {{ introSending ? 'Sender…' : `Send introduksjon (${introSelected.length})` }}
        </button>
      </div>

      <!-- Påminnelse om frist -->
      <div class="mb1 mt2">
        <div class="section-title">Påminnelse om frist</div>
        <p style="font-size:0.83rem;color:var(--muted);margin-bottom:0.85rem">Sender påminnelsen «N dager igjen av Sølvposten» til de avkryssede. Antall dager regnes ut fra fristen den dagen mailen sendes.</p>
        <div v-if="deadlineCandidates.length" class="table-wrap" style="margin-bottom:0.85rem">
          <table class="data-table users-table">
            <tbody>
              <tr v-for="u in deadlineCandidates" :key="u.email">
                <td><input :id="`frist-${u.email}`" type="checkbox" :value="u.email" v-model="deadlineSelected" /><label :for="`frist-${u.email}`">{{ u.full_name }}</label></td>
                <td class="email-col">{{ u.email }}</td>
                <td>{{ u.role }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="add-row">
          <button class="btn btn-sm" :disabled="deadlinePreviewing" @click="previewDeadlineReminder">
            {{ deadlinePreviewing ? 'Henter…' : deadlinePreview ? 'Oppdater forhåndsvisning' : 'Forhåndsvis…' }}
          </button>
          <button class="btn btn-sm" :disabled="deadlineSending || !deadlineSelected.length" @click="sendDeadlineReminder">
            {{ deadlineSending ? 'Sender…' : `Send påminnelse (${deadlineSelected.length})` }}
          </button>
        </div>
        <template v-if="deadlinePreview">
          <p style="margin:0.85rem 0 0.4rem">Emne: <b>{{ deadlinePreview.subject }}</b></p>
          <div class="sunken-panel" style="background:#c0c0c0">
            <iframe :srcdoc="deadlinePreview.html" title="Forhåndsvisning av påminnelsen" style="display:block;width:100%;height:440px;border:0"></iframe>
          </div>
        </template>
      </div>

      <!-- Jury members -->
      <div class="mb1 mt2">
        <div class="section-title">Jurymedlemmer</div>
        <div class="add-row">
          <input v-model="newJuryName" type="text" class="form-input" placeholder="Navn" />
          <input v-model="newJuryEmail" type="email" class="form-input" placeholder="E-post" />
          <input v-model="newJuryCode" type="text" class="form-input" placeholder="Kode (auto)" style="max-width:155px" />
          <button class="btn btn-sm" @click="addJuryCode">Legg til</button>
        </div>
        <div v-if="juryLoading" class="loading">Laster…</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Navn</th><th>E-post</th><th>Kode</th><th>Handling</th></tr></thead>
            <tbody>
              <tr v-for="j in juryCodes" :key="j.id">
                <td>{{ j.jury_name }}</td>
                <td style="color:var(--muted);font-size:0.78rem">{{ j.email || '–' }}</td>
                <td><code>{{ j.code }}</code></td>
                <td>
                  <button class="btn btn-sm btn-danger" style="padding:0.3rem 0.65rem;font-size:0.65rem" @click="removeJuryCode(j.id)">Fjern</button>
                </td>
              </tr>
              <tr v-if="!juryCodes.length"><td colspan="4" style="text-align:center;color:var(--muted)">Ingen jurymedlemmer ennå</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users / reminders -->
      <div class="mb1 mt2">
        <div class="section-title">Brukere</div>
        <div v-if="usersLoading" class="loading">Laster…</div>
        <div v-else class="table-wrap">
          <table class="data-table users-table">
            <thead><tr><th>Navn</th><th class="email-col">E-post</th><th>Team</th><th></th></tr></thead>
            <tbody>
              <template v-for="group in usersByRole" :key="group.role">
                <tr class="role-group-header" @click="toggleRoleGroup(group.role)">
                  <td>{{ collapsedRoles.has(group.role) ? '+' : '-' }} {{ group.role }} ({{ group.users.length }})</td>
                  <td class="email-col"></td>
                  <td></td>
                  <td></td>
                </tr>
                <template v-if="!collapsedRoles.has(group.role)">
                  <tr v-for="u in group.users" :key="u.email">
                    <td>{{ u.full_name }}</td>
                    <td class="email-col" style="color:var(--muted);font-size:0.78rem">{{ u.email }}</td>
                    <td>{{ u.teamName }}</td>
                    <td>
                      <button
                        class="btn btn-sm btn-outline"
                        style="padding:0.3rem 0.65rem;font-size:0.65rem"
                        :disabled="reminderSending === u.email"
                        @click="sendReminder(u.email)"
                      >{{ reminderSending === u.email ? '…' : 'Påminnelse' }}</button>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-if="!allUsers.length"><td colspan="4" style="text-align:center;color:var(--muted)">Ingen brukere</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- All submissions -->
      <div class="mb1 mt2">
        <div class="section-title">Alle bidrag</div>
        <div v-if="subsLoading" class="loading">Laster…</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Team</th><th>Produksjon</th><th>Kunde</th><th>Innsendt</th><th></th></tr></thead>
            <tbody>
              <tr v-for="s in allSubs" :key="s.id">
                <td>{{ s.teamName }}</td>
                <td>{{ s.produksjon }}</td>
                <td>{{ s.kunde }}</td>
                <td style="color:var(--muted);font-size:0.78rem">{{ new Date(s.submitted_at).toLocaleDateString('no') }}</td>
                <td>
                  <button class="btn btn-sm btn-danger" style="padding:0.3rem 0.65rem;font-size:0.65rem" @click="deleteSub(s.id)">Slett</button>
                </td>
              </tr>
              <tr v-if="!allSubs.length"><td colspan="5" style="text-align:center;color:var(--muted)">Ingen bidrag ennå</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

definePageMeta({ middleware: ['auth', 'admin'], layout: 'app' })

const store = useAppStore()
const sb = useSupabaseClient()
const { toast } = useToast()

const stats = reactive({ subs: 0, jury: 0, scores: 0 })
const mailPaused = ref(false)
type MailBlock = { start: string; end: string; label: string }
const mailBlocks = ref<MailBlock[]>([])
const newBlock = reactive({ start: '', end: '', label: '' })

function isBlockActive(b: MailBlock) {
  const today = new Date().toISOString().slice(0, 10)
  return today >= b.start && today <= b.end
}

const mailBlockedNow = computed(() => mailBlocks.value.find(isBlockActive) ?? null)
const juryCodes = ref<any[]>([])
const allSubs = ref<any[]>([])
const juryLoading = ref(true)
const subsLoading = ref(true)
const usersLoading = ref(true)
const allUsers = ref<any[]>([])
const reminderSending = ref<string | null>(null)

const ROLE_ORDER = ['kreatør', 'rådgiver', 'prosjektleder', 'designer', 'film', 'drift']
const collapsedRoles = ref<Set<string>>(new Set())

// Intro-mail til rådgivere/prosjektledere
const INTRO_ROLES = ['rådgiver', 'prosjektleder']
const INTRO_DEFAULT_EXCLUDE = ['per@mrgn.no', 'synne@mrgn.no']
const introSelected = ref<string[]>([])
const introSending = ref(false)
const introCandidates = computed(() =>
  allUsers.value
    .filter(u => INTRO_ROLES.includes(u.role))
    .sort((a, b) => INTRO_ROLES.indexOf(a.role) - INTRO_ROLES.indexOf(b.role) || a.full_name.localeCompare(b.full_name, 'no')),
)

// Påminnelse om frist: alle som kan sende inn bidrag, kreatørene er avkrysset som standard
const DEADLINE_ROLES = ['kreatør', 'rådgiver', 'prosjektleder']
const deadlineSelected = ref<string[]>([])
const deadlineSending = ref(false)
const deadlinePreviewing = ref(false)
const deadlinePreview = ref<{ subject: string; html: string } | null>(null)
const deadlineCandidates = computed(() =>
  allUsers.value
    .filter(u => DEADLINE_ROLES.includes(u.role))
    .sort((a, b) => DEADLINE_ROLES.indexOf(a.role) - DEADLINE_ROLES.indexOf(b.role) || a.full_name.localeCompare(b.full_name, 'no')),
)

function toggleRoleGroup(role: string) {
  const s = new Set(collapsedRoles.value)
  s.has(role) ? s.delete(role) : s.add(role)
  collapsedRoles.value = s
}

const usersByRole = computed(() => {
  const groups: { role: string; users: any[] }[] = []
  const seen = new Set<string>()
  const sorted = [...allUsers.value].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.role)
    const bi = ROLE_ORDER.indexOf(b.role)
    const roleSort = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    if (roleSort !== 0) return roleSort
    const teamSort = (a.teamName || '').localeCompare(b.teamName || '', 'no')
    if (teamSort !== 0) return teamSort
    return a.full_name.localeCompare(b.full_name, 'no')
  })
  for (const u of sorted) {
    if (!seen.has(u.role)) { seen.add(u.role); groups.push({ role: u.role, users: [] }) }
    groups[groups.length - 1].users.push(u)
  }
  return groups
})
const newJuryName = ref('')
const newJuryEmail = ref('')
const newJuryCode = ref('')
const deadline = ref(store.competitionDeadline || '')

const deadlineLabel = computed(() => {
  if (!deadline.value) return ''
  return new Date(deadline.value).toLocaleDateString('no', { day: 'numeric', month: 'long', year: 'numeric' })
})

const juryStartLabel = computed(() => {
  if (!deadline.value) return ''
  const d = new Date(deadline.value)
  d.setDate(d.getDate() - 3)
  return d.toLocaleDateString('no', { day: 'numeric', month: 'long', year: 'numeric' })
})

async function saveDeadline() {
  const val = deadline.value || null
  const { error } = await sb.from('settings').upsert(
    { key: 'competition_deadline', value: val },
    { onConflict: 'key' },
  )
  if (error) { toast('Feil: ' + error.message, true); return }
  store.competitionDeadline = val
  toast(val ? `Frist satt til ${deadlineLabel.value}` : 'Frist fjernet')
}

onMounted(loadAdminData)

async function loadAdminData() {
  const [
    { count: sc },
    { count: jc },
    { count: pc },
    { data: mailPauseSetting },
    { data: mailBlocksSetting },
  ] = await Promise.all([
    sb.from('submissions').select('*', { count: 'exact', head: true }),
    sb.from('jury_codes').select('*', { count: 'exact', head: true }),
    sb.from('scores').select('*', { count: 'exact', head: true }),
    sb.from('settings').select('value').eq('key', 'mail_paused').single(),
    sb.from('settings').select('value').eq('key', 'mail_blocks').single(),
  ])
  stats.subs = sc ?? 0
  stats.jury = jc ?? 0
  stats.scores = pc ?? 0
  mailPaused.value = mailPauseSetting?.value === 'true'
  try { mailBlocks.value = JSON.parse((mailBlocksSetting as any)?.value || '[]') } catch { mailBlocks.value = [] }
  await Promise.all([loadJuryTable(), loadSubTable(), loadUsersTable()])
}

async function toggleMailPause() {
  const nv = !mailPaused.value
  const { error } = await sb.from('settings').upsert({ key: 'mail_paused', value: nv ? 'true' : 'false' }, { onConflict: 'key' })
  if (error) { toast('Feil: ' + error.message, true); return }
  mailPaused.value = nv
  toast(nv ? 'Auto-mail pauset' : 'Auto-mail gjenopptatt')
}

async function saveMailBlocks() {
  const { error } = await sb.from('settings').upsert({ key: 'mail_blocks', value: JSON.stringify(mailBlocks.value) }, { onConflict: 'key' })
  if (error) toast('Feil: ' + error.message, true)
}

async function addMailBlock() {
  if (!newBlock.start || !newBlock.end) { toast('Fyll inn start- og sluttdato', true); return }
  if (newBlock.end < newBlock.start) { toast('Sluttdato må være etter startdato', true); return }
  mailBlocks.value = [...mailBlocks.value, { start: newBlock.start, end: newBlock.end, label: newBlock.label }]
  newBlock.start = ''; newBlock.end = ''; newBlock.label = ''
  await saveMailBlocks()
  toast('Blokk lagt til')
}

async function removeMailBlock(i: number) {
  mailBlocks.value = mailBlocks.value.filter((_, idx) => idx !== i)
  await saveMailBlocks()
  toast('Blokk fjernet')
}

async function loadJuryTable() {
  juryLoading.value = true
  const { data } = await sb.from('jury_codes').select('*').order('created_at')
  juryCodes.value = data || []
  juryLoading.value = false
}

async function loadUsersTable() {
  usersLoading.value = true
  const [{ data: users }, { data: teams }] = await Promise.all([
    sb.from('users').select('full_name, email, role, team_id').order('full_name'),
    sb.from('teams').select('id, name'),
  ])
  const teamsById: Record<string, string> = {}
  ;(teams || []).forEach((t: any) => { teamsById[t.id] = t.name })
  allUsers.value = (users || []).map((u: any) => ({
    ...u,
    teamName: u.team_id ? (teamsById[u.team_id] || '–') : '–',
  }))
  // Standard: kryss av alle rådgivere/prosjektledere unntatt de som er ekskludert
  introSelected.value = allUsers.value
    .filter(u => INTRO_ROLES.includes(u.role) && !INTRO_DEFAULT_EXCLUDE.includes(u.email))
    .map(u => u.email)
  deadlineSelected.value = allUsers.value.filter(u => u.role === 'kreatør').map(u => u.email)
  usersLoading.value = false
}

async function previewDeadlineReminder() {
  deadlinePreviewing.value = true
  try {
    deadlinePreview.value = await $fetch('/api/send-deadline-reminder', { method: 'POST', body: { preview: true } })
  } catch (e: any) {
    toast('Feil: ' + (e?.data?.message || e?.message || 'ukjent feil'), true)
  } finally {
    deadlinePreviewing.value = false
  }
}

async function sendDeadlineReminder() {
  const n = deadlineSelected.value.length
  if (!n) return
  if (!confirm(`Sende påminnelsen om fristen til ${n} ${n === 1 ? 'person' : 'personer'}?`)) return
  deadlineSending.value = true
  try {
    const res: any = await $fetch('/api/send-deadline-reminder', { method: 'POST', body: { emails: deadlineSelected.value } })
    toast(`Sendt til ${res.sent.length} ${res.sent.length === 1 ? 'person' : 'personer'} ✓`)
    if (res.failed?.length) toast(`Feilet: ${res.failed.join(', ')}`, true)
  } catch (e: any) {
    toast('Feil: ' + (e?.data?.message || e?.message || 'ukjent feil'), true)
  } finally {
    deadlineSending.value = false
  }
}

async function sendIntro() {
  if (!introSelected.value.length) return
  if (!confirm(`Sende intro-mailen til ${introSelected.value.length} ${introSelected.value.length === 1 ? 'person' : 'personer'}?`)) return
  introSending.value = true
  try {
    const res: any = await $fetch('/api/send-intro', { method: 'POST', body: { emails: introSelected.value } })
    toast(`Sendt til ${res.sent.length} ${res.sent.length === 1 ? 'person' : 'personer'} ✓`)
    if (res.failed?.length) toast(`Feilet: ${res.failed.join(', ')}`, true)
  } catch (e: any) {
    toast('Feil: ' + (e?.data?.message || e?.message || 'ukjent feil'), true)
  } finally {
    introSending.value = false
  }
}

async function loadSubTable() {
  subsLoading.value = true
  const [{ data: subs }, { data: teams }] = await Promise.all([
    sb.from('submissions').select('*').order('submitted_at', { ascending: false }),
    sb.from('teams').select('*'),
  ])
  const teamsById: Record<string, any> = {}
  ;(teams || []).forEach((t: any) => { teamsById[t.id] = t })
  allSubs.value = (subs || []).map((s: any) => ({
    ...s,
    teamName: teamsById[s.team_id]?.name || 'Ukjent',
  }))
  subsLoading.value = false
}

async function toggleJudging() {
  const nv = !store.judgingActive
  const { error } = await sb.from('settings').upsert({ key: 'judging_active', value: nv ? 'true' : 'false' }, { onConflict: 'key' })
  if (error) { toast('Feil: ' + error.message, true); return }
  store.judgingActive = nv
  toast(nv ? 'Juryering startet!' : 'Juryering stoppet')
}

async function toggleResults() {
  const nv = !store.resultsVisible
  const { error } = await sb.from('settings').upsert({ key: 'results_visible', value: nv ? 'true' : 'false' }, { onConflict: 'key' })
  if (error) { toast('Feil: ' + error.message, true); return }
  store.resultsVisible = nv
  toast(nv ? 'Resultater er nå synlige!' : 'Resultater er nå skjult')
}

function randomCode() {
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').substring(0, 6).toUpperCase()
}

async function addJuryCode() {
  if (!newJuryName.value.trim()) { toast('Legg inn et navn', true); return }
  const email = newJuryEmail.value.trim().toLowerCase()
  if (!email || !email.includes('@')) { toast('Legg inn en gyldig e-post', true); return }
  const code = (newJuryCode.value.trim().toUpperCase()) || randomCode()
  const { error } = await sb.from('jury_codes').insert({ jury_name: newJuryName.value.trim(), code, email })
  if (error) { toast('Feil: ' + error.message, true); return }
  newJuryName.value = ''
  newJuryEmail.value = ''
  newJuryCode.value = ''
  stats.jury++
  loadJuryTable()
  toast('Jurymedlem lagt til!')
}

async function removeJuryCode(id: string) {
  if (!confirm('Fjerne dette jurymedlemmet?')) return
  const { error } = await sb.from('jury_codes').delete().eq('id', id)
  if (error) { toast('Feil: ' + error.message, true); return }
  stats.jury--
  loadJuryTable()
  toast('Fjernet')
}

async function sendReminder(email: string) {
  reminderSending.value = email
  try {
    await $fetch('/api/send-reminder-user', { method: 'POST', body: { email } })
    toast('Påminnelse sendt!')
  } catch (e: any) {
    toast('Feil: ' + (e?.data?.message || e?.message || 'ukjent feil'), true)
  } finally {
    reminderSending.value = null
  }
}

async function deleteSub(id: string) {
  if (!confirm('Slette dette bidraget?')) return
  const sub = allSubs.value.find((s: any) => s.id === id)
  const { error } = await sb.from('submissions').delete().eq('id', id)
  if (error) { toast('Feil: ' + error.message, true); return }
  if (sub?.image_url) {
    const match = sub.image_url.match(/\/public\/uploads\/(.+)$/)
    if (match) sb.storage.from('uploads').remove([match[1]])
  }
  stats.subs--
  loadSubTable()
  toast('Bidrag slettet')
}
</script>
