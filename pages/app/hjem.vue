<template>
  <div class="page-section">
    <!-- Submission detail overlay -->
    <div v-if="selectedSub" class="wrap-narrow">
      <button class="sub-detail-back" @click="closeSubmission()">← Tilbake</button>
      <div v-if="subLoading" class="loading">Laster…</div>
      <template v-else-if="subDetail">
        <div class="sub-detail-header">
          <img :src="subDetail.teamPhoto" alt="" />
          <div>
            <div class="sub-detail-team">{{ subDetail.teamName }}</div>
            <div class="sub-detail-meta">{{ subDetail.sub.produksjon }} · {{ subDetail.sub.kunde }}</div>
          </div>
        </div>
        <img
          :src="subDetail.sub.image_url"
          class="sub-detail-screenshot"
          :class="{ expanded: imgExpanded }"
          alt=""
          @click="imgExpanded = !imgExpanded"
        />
        <a v-if="safeUrl(subDetail.sub.link)" :href="safeUrl(subDetail.sub.link)!" target="_blank" rel="noopener noreferrer" class="sub-detail-some-link" style="margin-bottom:1.5rem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Se innleggene på sosiale medier
        </a>

        <div class="sub-detail-tekster">
          <div v-for="(pt, i) in subDetail.postetekster" :key="pt.id" class="sub-detail-tekst">
            <div class="sub-detail-tekst-num">Innlegg {{ i + 1 }}</div>
            <div class="sub-detail-tekst-content">{{ pt.content }}</div>
            <a v-if="safeUrl(pt.link)" :href="safeUrl(pt.link)!" target="_blank" rel="noopener noreferrer" class="sub-detail-some-link" style="margin-top:0.75rem">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Se dette innlegget
            </a>
          </div>
        </div>
      </template>
    </div>

    <!-- Main home view -->
    <div v-else class="wrap-narrow">
      <div class="hjem-top">
        <div class="hjem-greeting">
          <p class="eyebrow">{{ roleLabel }}</p>
          <h1 class="display">Hei, {{ firstName }}!</h1>
          <p v-if="quote" class="lead" style="font-style:italic;color:var(--coral)">{{ quote }}</p>
        </div>
        <div v-if="deadlineCountdown !== null" class="deadline-card">
          <span class="deadline-num">{{ deadlineCountdown }}</span>
          <div class="deadline-label">
            <span class="deadline-unit">{{ deadlineCountdown === 1 ? 'dag' : 'dager' }} igjen</span>
            <span class="deadline-sub">til innleveringsfrist</span>
          </div>
        </div>
      </div>

      <div class="hjem-section">
        <div class="hjem-section-heading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          Stillingsoversikt
        </div>
        <div v-if="lbLoading" class="loading">Laster oversikt…</div>
        <table v-else class="leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Antall innsendelser</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in leaderboard"
              :key="row.team.id"
              :class="{ 'my-team': row.team.id === store.user?.team_id }"
            >
              <td>
                <span class="lb-rank" :class="['gold','silver','bronze'][i]">{{ i + 1 }}</span>
              </td>
              <td>
                <div class="lb-team">
                  <img class="lb-avatar" :src="row.teamPhoto" alt="" />
                  <span>
                    {{ row.team.name }}
                    <span v-if="row.team.id === store.user?.team_id" style="font-size:.7rem;background:var(--coral);color:white;padding:1px 6px;border-radius:10px;margin-left:4px">Ditt team</span>
                  </span>
                  <span v-if="row.kudos > 0" class="lb-kudos-badge" :title="`${row.kudos} kudos`">
                    👏<span class="lb-kudos-num">{{ row.kudos }}</span>
                  </span>
                </div>
              </td>
              <td>{{ row.subCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hjem-section feed-section">
        <div class="hjem-section-heading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Siste innleveringer
        </div>
        <div v-if="feedLoading" class="loading">Laster…</div>
        <p v-else-if="!feed.length" style="opacity:.4;font-size:.9rem">Ingen innleveringer ennå.</p>
        <div v-for="item in feed" :key="item.sub.id" class="feed-card" :id="`feed-${item.sub.id}`">
          <div class="feed-card-top" @click="openSubmission(item.sub.id)">
            <img class="feed-team-avatar" :src="item.teamPhoto" alt="" />
            <div>
              <div class="feed-team-name">{{ item.teamName }}</div>
              <div class="feed-prod-name">{{ item.sub.produksjon }} · {{ item.sub.kunde }}</div>
            </div>
            <div class="feed-time">{{ timeAgo(item.sub.submitted_at) }}</div>
          </div>
          <img
            class="feed-screenshot"
            :class="{ expanded: expandedImages.has(item.sub.id) }"
            :src="item.sub.image_url"
            alt=""
            @click="toggleImg(item.sub.id)"
          />
          <div class="feed-card-footer">
            <span class="feed-pt-count">{{ item.ptCount }} postetekst{{ item.ptCount !== 1 ? 'er' : '' }}</span>
            <button
              class="kudos-btn"
              :class="{ given: item.myKudos }"
              :disabled="item.isMyTeam || item.busy"
              :title="item.isMyTeam ? 'Ikke til eget team' : ''"
              @click="toggleKudos(item)"
            >
              👏 <span class="kudos-count">{{ item.kudosCount }}</span>
            </button>
            <button
              class="kudos-btn dislike-btn"
              :class="{ given: item.myDislike }"
              :disabled="item.isMyTeam || item.busy"
              :title="item.isMyTeam ? 'Ikke til eget team' : ''"
              @click="toggleDislike(item)"
            >
              👎 <span class="kudos-count">{{ item.dislikeCount }}</span>
            </button>
            <button class="feed-link" @click="openSubmission(item.sub.id)">Se innlegg →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { avatarUrl, timeAgo, safeUrl, ROLE_LABELS, PARTICIPANT_ROLES } from '~/utils/avatar'

definePageMeta({ middleware: 'auth', layout: 'app' })

const store = useAppStore()
const sb = useSupabase()
const { toast } = useToast()

const lbLoading = ref(true)
const feedLoading = ref(true)
const leaderboard = ref<any[]>([])
const feed = ref<any[]>([])
const expandedImages = ref(new Set<string>())
const selectedSub = ref<string | null>(null)
const subLoading = ref(false)
const subDetail = ref<any>(null)
const imgExpanded = ref(false)

const user = computed(() => store.user)
const firstName = computed(() => user.value?.full_name.split(' ')[0] || '')
const roleLabel = computed(() => user.value ? (ROLE_LABELS[user.value.role] || user.value.role) : '–')

const deadlineCountdown = computed(() => {
  if (!store.competitionDeadline || store.judgingActive) return null
  const deadline = new Date(store.competitionDeadline)
  deadline.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
  return days >= 0 ? days : null
})


const MOTIVATING = [
  '«Det er ikke om du blir slått ned. Det handler om om du reiser deg igjen.» — Vince Lombardi',
  '«Faller du syv ganger, reis deg åtte.» — japansk ordtak',
  '«Suksess er å gå fra fiasko til fiasko uten å miste entusiasmen.» — Winston Churchill',
]
const BOASTING = [
  '«Med stor makt følger stort ansvar.» — Voltaire / Spider-Man',
  '«Den beste måten å forutsi fremtiden på er å skape den.» — Peter Drucker',
]

const quote = ref('')

function processRaw(raw: NonNullable<typeof store.hjemRaw.value>) {
  const { teams, subs, allSubs, pts, allKudos, allDislikes } = raw
  if (!teams?.length) return

  const teamsById: Record<string, any> = {}
  teams.forEach((t: any) => { teamsById[t.id] = t })

  const subsByTeam: Record<string, number> = {}
  const subIdToTeam: Record<string, string> = {}
  ;(allSubs || []).forEach((s: any) => {
    subsByTeam[s.team_id] = (subsByTeam[s.team_id] || 0) + 1
    subIdToTeam[s.id] = s.team_id
  })

  const kudosByTeam: Record<string, number> = {}
  const kudosBySubmission: Record<string, string[]> = {}
  ;(allKudos || []).forEach((k: any) => {
    const tid = subIdToTeam[k.submission_id]
    if (tid) kudosByTeam[tid] = (kudosByTeam[tid] || 0) + 1
    if (!kudosBySubmission[k.submission_id]) kudosBySubmission[k.submission_id] = []
    kudosBySubmission[k.submission_id].push(k.from_email)
  })

  const dislikesBySubmission: Record<string, string[]> = {}
  ;(allDislikes || []).forEach((d: any) => {
    if (!dislikesBySubmission[d.submission_id]) dislikesBySubmission[d.submission_id] = []
    dislikesBySubmission[d.submission_id].push(d.from_email)
  })

  const sorted = [...teams].sort((a: any, b: any) => (subsByTeam[b.id] || 0) - (subsByTeam[a.id] || 0))
  const myTeamId = user.value?.team_id
  const myRank = sorted.findIndex((t: any) => t.id === myTeamId)
  const isLeading = myRank === 0 && (subsByTeam[myTeamId!] || 0) > 0

  quote.value = isLeading
    ? BOASTING[Math.floor(Math.random() * BOASTING.length)]
    : myRank > 0
      ? MOTIVATING[Math.floor(Math.random() * MOTIVATING.length)]
      : ''

  leaderboard.value = sorted.map((t: any) => ({
    team: t,
    teamPhoto: t.image_url || avatarUrl(t.name, 30),
    subCount: subsByTeam[t.id] || 0,
    kudos: kudosByTeam[t.id] || 0,
  }))
  lbLoading.value = false

  const ptCount: Record<string, number> = {}
  ;(pts || []).forEach((p: any) => { ptCount[p.submission_id] = (ptCount[p.submission_id] || 0) + 1 })

  feed.value = (subs || []).map((s: any) => {
    const team = teamsById[s.team_id] || { name: 'Ukjent' }
    const givers = kudosBySubmission[s.id] || []
    const dislikers = dislikesBySubmission[s.id] || []
    return {
      sub: s,
      teamName: team.name,
      teamPhoto: team.image_url || avatarUrl(team.name, 38),
      ptCount: ptCount[s.id] || 0,
      myKudos: givers.includes(user.value?.email || ''),
      myDislike: dislikers.includes(user.value?.email || ''),
      isMyTeam: team.id === user.value?.team_id,
      kudosCount: givers.length,
      dislikeCount: dislikers.length,
    }
  })
  feedLoading.value = false
}

async function fetchFresh() {
  const [{ data: teams }, { data: subs }, { data: allSubs }, { data: pts }, { data: allKudos }, { data: allDislikes }] =
    await Promise.all([
      sb.from('teams').select('*').order('name'),
      sb.from('submissions').select('*').order('submitted_at', { ascending: false }).limit(15),
      sb.from('submissions').select('id,team_id'),
      sb.from('postetekster').select('id,submission_id'),
      sb.from('kudos').select('submission_id,from_email').limit(500),
      sb.from('dislikes').select('submission_id,from_email').limit(500),
    ])
  if (!teams) return
  const raw = { teams, subs: subs || [], allSubs: allSubs || [], pts: pts || [], allKudos: allKudos || [], allDislikes: allDislikes || [], fetchedAt: Date.now() }
  store.setHjemRaw(raw)
  processRaw(raw)
}

async function loadData() {
  if (store.hjemCacheFresh()) {
    processRaw(store.hjemRaw!)
    fetchFresh()
    return
  }
  lbLoading.value = true
  feedLoading.value = true
  await fetchFresh()
}

async function toggleKudos(item: any) {
  if (item.isMyTeam || item.busy) return
  const email = user.value?.email
  if (!email) return
  item.busy = true
  const hadKudos = item.myKudos
  const hadDislike = item.myDislike
  // Optimistisk oppdatering
  item.myKudos = !hadKudos
  item.kudosCount += hadKudos ? -1 : 1
  if (!hadKudos && hadDislike) { item.myDislike = false; item.dislikeCount -= 1 }
  try {
    if (hadKudos) {
      const { error } = await sb.from('kudos').delete().eq('submission_id', item.sub.id).eq('from_email', email)
      if (error) throw error
    } else {
      const { error } = await sb.from('kudos').insert({ submission_id: item.sub.id, from_email: email })
      if (error) throw error
      // Fjern evt. tidligere dislike (best effort)
      if (hadDislike) await sb.from('dislikes').delete().eq('submission_id', item.sub.id).eq('from_email', email)
    }
  } catch {
    // Rull tilbake ved feil
    item.myKudos = hadKudos
    item.kudosCount += hadKudos ? 1 : -1
    if (!hadKudos && hadDislike) { item.myDislike = true; item.dislikeCount += 1 }
    toast('Kunne ikke lagre. Prøv igjen.', true)
  } finally {
    item.busy = false
  }
}

async function toggleDislike(item: any) {
  if (item.isMyTeam || item.busy) return
  const email = user.value?.email
  if (!email) return
  item.busy = true
  const hadDislike = item.myDislike
  const hadKudos = item.myKudos
  // Optimistisk oppdatering
  item.myDislike = !hadDislike
  item.dislikeCount += hadDislike ? -1 : 1
  if (!hadDislike && hadKudos) { item.myKudos = false; item.kudosCount -= 1 }
  try {
    if (hadDislike) {
      const { error } = await sb.from('dislikes').delete().eq('submission_id', item.sub.id).eq('from_email', email)
      if (error) throw error
    } else {
      const { error } = await sb.from('dislikes').insert({ submission_id: item.sub.id, from_email: email })
      if (error) throw error
      // Fjern evt. tidligere kudos (best effort)
      if (hadKudos) await sb.from('kudos').delete().eq('submission_id', item.sub.id).eq('from_email', email)
    }
  } catch {
    // Rull tilbake ved feil
    item.myDislike = hadDislike
    item.dislikeCount += hadDislike ? 1 : -1
    if (!hadDislike && hadKudos) { item.myKudos = true; item.kudosCount += 1 }
    toast('Kunne ikke lagre. Prøv igjen.', true)
  } finally {
    item.busy = false
  }
}

function closeSubmission() {
  selectedSub.value = null
  subDetail.value = null
}

async function openSubmission(id: string) {
  selectedSub.value = id
  imgExpanded.value = false
  history.pushState({ sub: id }, '')
  subLoading.value = true
  subDetail.value = null
  try {
    const [{ data: sub }, { data: postetekster }] = await Promise.all([
      sb.from('submissions').select('*').eq('id', id).single(),
      sb.from('postetekster').select('*').eq('submission_id', id).order('sort_order'),
    ])
    if (!sub) return
    const { data: team } = await sb.from('teams').select('*').eq('id', sub.team_id).single()
    subDetail.value = {
      sub,
      postetekster: postetekster || [],
      teamName: team?.name || 'Ukjent',
      teamPhoto: team?.image_url || avatarUrl(team?.name || '?', 52),
    }
  } finally {
    subLoading.value = false
  }
}

function toggleImg(id: string) {
  if (expandedImages.value.has(id)) expandedImages.value.delete(id)
  else expandedImages.value.add(id)
}

function onPopState() {
  if (selectedSub.value) closeSubmission()
}

onMounted(() => {
  loadData()
  window.addEventListener('popstate', onPopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState)
})
</script>

<style scoped>
.hjem-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 3rem;
  padding-bottom: 2rem;
}

.hjem-greeting {
  min-width: 0;
}

.deadline-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 0.25rem;
}

.deadline-num {
  font-size: 4rem;
  font-weight: 900;
  color: var(--coral);
  line-height: 1;
  letter-spacing: -0.04em;
}

.deadline-label {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.deadline-unit {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: -0.01em;
}

.deadline-sub {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--muted);
}

@media (max-width: 600px) {
  .hjem-top {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .deadline-card {
    align-items: flex-start;
  }
  .deadline-label {
    align-items: flex-start;
  }
}
</style>

