<template>
  <div class="page-section">
    <div class="wrap">
      <p class="eyebrow">Administrator</p>
      <h1 style="font-weight:900;font-size:2rem;letter-spacing:-0.025em;margin-bottom:1.75rem">Kontrollpanel</h1>

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
            <div class="dot" :style="{ background: mailPaused ? '#aaa' : '#3D9E6A' }"></div>
            <span>{{ mailPaused ? 'Auto-mail er pauset' : 'Auto-mail er aktiv' }}</span>
          </div>
          <button class="btn btn-sm" :class="{ 'btn-danger': !mailPaused }" @click="toggleMailPause">
            {{ mailPaused ? 'Gjenoppta' : 'Pause' }}
          </button>
        </div>
      </div>

      <!-- Jury members -->
      <div class="mb1 mt2">
        <div class="section-title">Jurymedlemmer</div>
        <div class="add-row">
          <input v-model="newJuryName" type="text" class="form-input" placeholder="Navn" />
          <input v-model="newJuryEmail" type="email" class="form-input" placeholder="E-post" />
          <input v-model="newJuryCode" type="text" class="form-input" placeholder="Kode (auto)" style="max-width:155px" />
          <button class="btn btn-sm" @click="addJuryCode">+ Legg til</button>
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
          <table class="data-table">
            <thead><tr><th>Navn</th><th>E-post</th><th>Team</th><th></th></tr></thead>
            <tbody>
              <template v-for="group in usersByRole" :key="group.role">
                <tr class="role-group-header">
                  <td colspan="4">{{ group.role }}</td>
                </tr>
                <tr v-for="u in group.users" :key="u.email">
                  <td>{{ u.full_name }}</td>
                  <td style="color:var(--muted);font-size:0.78rem">{{ u.email }}</td>
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
const sb = useSupabase()
const { toast } = useToast()

const stats = reactive({ subs: 0, jury: 0, scores: 0 })
const mailPaused = ref(false)
const juryCodes = ref<any[]>([])
const allSubs = ref<any[]>([])
const juryLoading = ref(true)
const subsLoading = ref(true)
const usersLoading = ref(true)
const allUsers = ref<any[]>([])
const reminderSending = ref<string | null>(null)

const ROLE_ORDER = ['kreatør', 'rådgiver', 'prosjektleder', 'designer', 'film', 'drift']
const usersByRole = computed(() => {
  const groups: { role: string; users: any[] }[] = []
  const seen = new Set<string>()
  const sorted = [...allUsers.value].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.role)
    const bi = ROLE_ORDER.indexOf(b.role)
    const roleSort = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    if (roleSort !== 0) return roleSort
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
  ] = await Promise.all([
    sb.from('submissions').select('*', { count: 'exact', head: true }),
    sb.from('jury_codes').select('*', { count: 'exact', head: true }),
    sb.from('scores').select('*', { count: 'exact', head: true }),
    sb.from('settings').select('value').eq('key', 'mail_paused').single(),
  ])
  stats.subs = sc ?? 0
  stats.jury = jc ?? 0
  stats.scores = pc ?? 0
  mailPaused.value = mailPauseSetting?.value === 'true'
  await Promise.all([loadJuryTable(), loadSubTable(), loadUsersTable()])
}

async function toggleMailPause() {
  const nv = !mailPaused.value
  const { error } = await sb.from('settings').upsert({ key: 'mail_paused', value: nv ? 'true' : 'false' }, { onConflict: 'key' })
  if (error) { toast('Feil: ' + error.message, true); return }
  mailPaused.value = nv
  toast(nv ? 'Auto-mail pauset' : 'Auto-mail gjenopptatt')
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
  usersLoading.value = false
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
