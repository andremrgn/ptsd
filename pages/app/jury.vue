<template>
  <div class="page-section">
    <div class="wrap">
      <!-- Jury login -->
      <div v-if="!juryMember" style="max-width:400px;background:var(--white);border:1.5px solid var(--border);border-radius:var(--radius);padding:1.75rem">
        <p class="eyebrow">Jury</p>
        <h2 style="font-weight:900;font-size:1.5rem;letter-spacing:-0.02em;margin-bottom:0.35rem">Logg inn</h2>
        <p style="font-size:0.85rem;color:var(--muted);margin-bottom:1.25rem">Skriv inn jurykoden din.</p>
        <div class="form-group">
          <label class="form-label">Jurykode</label>
          <input
            v-model="juryCode"
            type="text"
            class="form-input"
            placeholder="XXXXXX"
            style="letter-spacing:0.14em;text-transform:uppercase;font-weight:600;font-size:1rem"
            @keydown.enter="juryLogin"
          />
        </div>
        <p v-if="juryError" style="color:var(--coral);font-size:0.82rem;margin-bottom:0.75rem">{{ juryError }}</p>
        <button class="btn" :disabled="juryLoading" @click="juryLogin">Gå til bedømmingen →</button>
      </div>

      <!-- Jury panel -->
      <div v-else>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.75rem;flex-wrap:wrap;gap:1rem">
          <div>
            <p class="eyebrow">Juryering</p>
            <h1 style="font-weight:900;font-size:1.8rem;letter-spacing:-0.02em">Bedøm bidragene</h1>
            <p style="color:var(--muted);margin-top:0.3rem;font-size:0.85rem">Gi hvert bidrag 1–9 poeng.</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.67rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">Innlogget som</div>
            <div style="font-weight:800;font-size:0.92rem;margin-top:0.1rem">{{ juryMember.jury_name }}</div>
            <button class="btn btn-outline btn-sm" style="margin-top:0.4rem" @click="juryLogout">Logg ut</button>
          </div>
        </div>

        <div v-if="!store.judgingActive" class="judging-closed">
          <div class="big">⏸</div>
          <h3>Juryeringen er ikke åpnet ennå</h3>
          <p>Vent til admin åpner runden.</p>
        </div>

        <div v-else>
          <div v-if="jurySubsLoading" class="loading">Laster bidrag…</div>
          <div v-else style="display:flex;flex-direction:column;gap:1rem">
            <div
              v-for="item in jurySubs"
              :key="item.sub.id"
              class="jury-card"
              :class="{ scored: scores[item.sub.id] }"
            >
              <div class="jury-card-head">
                <div class="jury-card-title">{{ item.sub.produksjon }}</div>
                <span class="badge" :class="scores[item.sub.id] ? 'badge-done' : 'badge-pending'">
                  {{ scores[item.sub.id] ? `${scores[item.sub.id]} / 9` : 'Ikke vurdert' }}
                </span>
              </div>
              <div class="jury-card-meta">{{ item.sub.kunde }} · {{ item.teamName }}</div>
              <div
                class="jury-screenshot"
                :class="{ expanded: expandedImages.has(item.sub.id) }"
                @click="toggleImg(item.sub.id)"
              >
                <img :src="item.sub.image_url" alt="" :class="{ expanded: expandedImages.has(item.sub.id) }" />
              </div>
              <div class="jury-texts">
                <div v-for="pt in item.postetekster" :key="pt.id" class="jury-card-content">{{ pt.content }}</div>
              </div>
              <div class="score-row">
                <span class="score-label">Poeng</span>
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
            </div>
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
const sb = useSupabase()
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
    const data = await $fetch('/api/validate-jury-code', { method: 'POST', body: { code: juryCode.value.trim() } })
    juryMember.value = data
    if (store.judgingActive) loadJurySubs()
  } catch (err: any) {
    juryError.value = err.data?.message || 'Ugyldig jurykode. Prøv igjen.'
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
  const session = await sb.auth.getSession()
  const token = session.data.session?.access_token
  try {
    await $fetch('/api/set-score', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { submission_id: submissionId, jury_code: juryMember.value.code, score },
    })
    toast('Poeng lagret ✓')
  } catch (err: any) {
    toast('Feil: ' + (err.data?.message || err.message), true)
  }
}

function toggleImg(id: string) {
  if (expandedImages.value.has(id)) expandedImages.value.delete(id)
  else expandedImages.value.add(id)
}
</script>
