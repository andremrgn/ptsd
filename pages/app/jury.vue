<template>
  <div class="page-section">
    <div class="wrap">
      <!-- Jury-innlogging: dialogboks -->
      <div v-if="!juryMember" class="window jury-login">
        <div class="title-bar">
          <div class="title-bar-text"><span class="title-bar-caption">Jury - Logg inn</span></div>
        </div>
        <div class="window-body">
          <p style="margin-bottom:8px">Skriv inn jurykoden din.</p>
          <div class="form-group">
            <label class="form-label" for="jury-code">Jurykode:</label>
            <input
              id="jury-code"
              v-model="juryCode"
              type="text"
              class="form-input"
              placeholder="XXXXXX"
              @keydown.enter="juryLogin"
            />
          </div>
          <p v-if="juryError" style="color:var(--coral);margin-bottom:8px">{{ juryError }}</p>
          <div class="form-actions">
            <button class="default" :disabled="juryLoading" @click="juryLogin">OK</button>
          </div>
        </div>
      </div>

      <!-- Jury panel -->
      <div v-else>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div>
            <h1>Bedøm bidragene</h1>
            <p style="margin-top:2px">Gi hvert bidrag 1–9 poeng.</p>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span>Innlogget som <strong>{{ juryMember.jury_name }}</strong></span>
            <button @click="juryLogout">Logg ut</button>
          </div>
        </div>

        <div v-if="!store.judgingActive" class="judging-closed">
          <h3>Juryeringen er ikke åpnet ennå</h3>
          <p>Vent til admin åpner runden.</p>
        </div>

        <div v-else>
          <div v-if="jurySubsLoading" class="loading">Laster bidrag…</div>
          <div v-else style="display:flex;flex-direction:column;gap:12px">
            <fieldset
              v-for="item in jurySubs"
              :key="item.sub.id"
              class="jury-card"
              :class="{ scored: scores[item.sub.id] }"
            >
              <legend>{{ item.sub.produksjon }}</legend>
              <div class="jury-card-head">
                <div class="jury-card-meta" style="margin:0">{{ item.sub.kunde }} · {{ item.teamName }}</div>
                <span class="badge" :class="scores[item.sub.id] ? 'badge-done' : 'badge-pending'">
                  {{ scores[item.sub.id] ? `${scores[item.sub.id]} / 9` : 'Ikke vurdert' }}
                </span>
              </div>
              <div
                class="jury-screenshot"
                :class="{ expanded: expandedImages.has(item.sub.id) }"
                @click="toggleImg(item.sub.id)"
              >
                <img :src="item.sub.image_url" alt="" loading="lazy" decoding="async" :class="{ expanded: expandedImages.has(item.sub.id) }" />
              </div>
              <div class="jury-texts">
                <div v-for="pt in item.postetekster" :key="pt.id" class="jury-card-content">{{ pt.content }}</div>
              </div>
              <div class="score-row">
                <span class="score-label">Poeng:</span>
                <div class="score-btns">
                  <button
                    v-for="n in 9"
                    :key="n"
                    class="score-btn"
                    :class="{ selected: scores[item.sub.id] === n }"
                    @click="setScore(item.sub.id, n)"
                  >{{ n }}</button>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'

definePageMeta({ middleware: 'auth', layout: 'app' })

const store = useAppStore()
const sb = useSupabaseClient()
const { toast } = useToast()

const juryCode = ref('')
const juryError = ref('')
const juryLoading = ref(false)
const juryMember = ref<any>(null)
const jurySubsLoading = ref(false)
const jurySubs = ref<any[]>([])
const scores = reactive<Record<string, number>>({})
const expandedImages = ref(new Set<string>())

async function juryLogin() {
  juryError.value = ''
  juryLoading.value = true
  try {
    // Databasefunksjon: gir bare treff hvis koden tilhører innlogget bruker
    const { data, error } = await sb.rpc('validate_jury_code', { p_code: juryCode.value.trim() })
    if (error) throw error
    const member = (data as any[] | null)?.[0]
    if (!member) { juryError.value = 'Ugyldig jurykode, eller koden tilhører ikke din konto.'; return }
    juryMember.value = member
    if (store.judgingActive) loadJurySubs()
  } catch {
    juryError.value = 'Kunne ikke sjekke jurykoden. Prøv igjen.'
  } finally {
    juryLoading.value = false
  }
}

function juryLogout() {
  juryMember.value = null
  juryCode.value = ''
  jurySubs.value = []
  Object.keys(scores).forEach(k => delete scores[k])
}

async function loadJurySubs() {
  jurySubsLoading.value = true
  const [{ data: subs }, { data: pts }, { data: existingScores }, { data: teams }] = await Promise.all([
    sb.from('submissions').select('*').order('submitted_at'),
    sb.from('postetekster').select('*').order('sort_order'),
    sb.from('scores').select('*').eq('jury_code_id', juryMember.value.id),
    sb.from('teams').select('*'),
  ])

  const teamsById: Record<string, any> = {}
  ;(teams || []).forEach((t: any) => { teamsById[t.id] = t })

  const ptsBySubmission: Record<string, any[]> = {}
  ;(pts || []).forEach((p: any) => {
    if (!ptsBySubmission[p.submission_id]) ptsBySubmission[p.submission_id] = []
    ptsBySubmission[p.submission_id].push(p)
  })

  ;(existingScores || []).forEach((s: any) => { scores[s.submission_id] = s.score })

  jurySubs.value = (subs || []).map((s: any) => ({
    sub: s,
    teamName: teamsById[s.team_id]?.name || 'Ukjent',
    postetekster: ptsBySubmission[s.id] || [],
  }))
  jurySubsLoading.value = false
}

async function setScore(submissionId: string, score: number) {
  scores[submissionId] = score
  // Databasefunksjonen sjekker kode, konto, at juryering er aktiv og 1–9
  const { error } = await sb.rpc('set_jury_score', {
    p_submission_id: submissionId,
    p_code: juryMember.value.code,
    p_score: score,
  })
  if (error) toast('Feil: ' + error.message, true)
  else toast('Poeng lagret ✓')
}

function toggleImg(id: string) {
  if (expandedImages.value.has(id)) expandedImages.value.delete(id)
  else expandedImages.value.add(id)
}
</script>
