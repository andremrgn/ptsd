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

      <!-- Jury members -->
      <div class="mb1 mt2">
        <div class="section-title">Jurymedlemmer</div>
        <div class="add-row">
          <input v-model="newJuryName" type="text" class="form-input" placeholder="Navn" />
          <input v-model="newJuryCode" type="text" class="form-input" placeholder="Kode (auto)" style="max-width:155px" />
          <button class="btn btn-sm" @click="addJuryCode">+ Legg til</button>
        </div>
        <div v-if="juryLoading" class="loading">Laster…</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Navn</th><th>Kode</th><th>Handling</th></tr></thead>
            <tbody>
              <tr v-for="j in juryCodes" :key="j.id">
                <td>{{ j.jury_name }}</td>
                <td><code>{{ j.code }}</code></td>
                <td>
                  <button class="btn btn-sm btn-danger" style="padding:0.3rem 0.65rem;font-size:0.65rem" @click="removeJuryCode(j.id)">Fjern</button>
                </td>
              </tr>
              <tr v-if="!juryCodes.length"><td colspan="3" style="text-align:center;color:var(--muted)">Ingen jurymedlemmer ennå</td></tr>
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
const juryCodes = ref<any[]>([])
const allSubs = ref<any[]>([])
const juryLoading = ref(true)
const subsLoading = ref(true)
const newJuryName = ref('')
const newJuryCode = ref('')

onMounted(loadAdminData)

async function loadAdminData() {
  const [
    { count: sc },
    { count: jc },
    { count: pc },
  ] = await Promise.all([
    sb.from('submissions').select('*', { count: 'exact', head: true }),
    sb.from('jury_codes').select('*', { count: 'exact', head: true }),
    sb.from('scores').select('*', { count: 'exact', head: true }),
  ])
  stats.subs = sc ?? 0
  stats.jury = jc ?? 0
  stats.scores = pc ?? 0
  await Promise.all([loadJuryTable(), loadSubTable()])
}

async function loadJuryTable() {
  juryLoading.value = true
  const { data } = await sb.from('jury_codes').select('*').order('created_at')
  juryCodes.value = data || []
  juryLoading.value = false
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
  const { error } = await sb.from('settings').update({ value: nv ? 'true' : 'false' }).eq('key', 'judging_active')
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
  const code = (newJuryCode.value.trim().toUpperCase()) || randomCode()
  const { error } = await sb.from('jury_codes').insert({ jury_name: newJuryName.value.trim(), code })
  if (error) { toast('Feil: ' + error.message, true); return }
  newJuryName.value = ''
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

async function deleteSub(id: string) {
  if (!confirm('Slette dette bidraget?')) return
  const { error } = await sb.from('submissions').delete().eq('id', id)
  if (error) { toast('Feil: ' + error.message, true); return }
  stats.subs--
  loadSubTable()
  toast('Bidrag slettet')
}
</script>
