<template>
  <div class="page-section">
    <!-- Bidragsvisning: et eget vindu med lukkeknapp -->
    <div v-if="selectedSub" class="wrap-narrow">
      <div class="window sub-window">
        <div class="title-bar">
          <div class="title-bar-text">
            <img v-if="subDetail" :src="subDetail.teamPhoto" alt="" class="title-bar-icon" />
            <span class="title-bar-caption">{{ subDetail ? `${subDetail.sub.produksjon} - ${subDetail.teamName}` : 'Åpner…' }}</span>
          </div>
          <div class="title-bar-controls">
            <button aria-label="Close" title="Lukk" @click="closeSubmission()"></button>
          </div>
        </div>
        <div class="window-body">
          <button class="sub-detail-back" @click="closeSubmission()">&lt; Tilbake</button>
          <div v-if="subLoading" class="loading">Laster…</div>
          <template v-else-if="subDetail">
            <div class="sub-detail-header">
              <img :src="subDetail.teamPhoto" alt="" />
              <div>
                <div class="sub-detail-team">{{ subDetail.teamName }}</div>
                <div>{{ subDetail.sub.produksjon }} · {{ subDetail.sub.kunde }}</div>
              </div>
            </div>
            <img
              :src="subDetail.sub.image_url"
              class="sub-detail-screenshot"
              :class="{ expanded: imgExpanded }"
              alt=""
              decoding="async"
              @click="imgExpanded = !imgExpanded"
            />
            <div v-if="safeUrl(subDetail.sub.link)" class="sub-detail-links">
              <a :href="safeUrl(subDetail.sub.link)!" target="_blank" rel="noopener noreferrer" class="sub-detail-some-link">Se innleggene på sosiale medier…</a>
            </div>

            <div class="sub-detail-tekster">
              <fieldset v-for="(pt, i) in subDetail.postetekster" :key="pt.id" class="sub-detail-tekst">
                <legend>{{ pt.title || 'Innlegg ' + (i + 1) }}</legend>
                <div class="sub-detail-tekst-content">{{ pt.content }}</div>
                <div class="sub-detail-tekst-links">
                  <a v-if="safeUrl(pt.link)" :href="safeUrl(pt.link)!" target="_blank" rel="noopener noreferrer" class="sub-detail-some-link">Se dette innlegget…</a>
                  <a v-if="pt.content" :href="metaAdLibraryUrl(pt.content)" target="_blank" rel="noopener noreferrer" class="meta-lib-link">Finn uttaket på Meta…</a>
                </div>
              </fieldset>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Main home view -->
    <div v-else class="wrap-narrow">
      <div class="hjem-top">
        <div class="hjem-greeting">
          <p class="eyebrow">{{ roleLabel }}</p>
          <h1 class="display">Hei, {{ firstName }}!</h1>
          <p v-if="quote" class="hjem-tip">{{ quote }}</p>
          <NuxtLink v-if="store.isParticipant" to="/app/send-inn" class="hjem-cta">Send inn ny produksjon…</NuxtLink>
        </div>
        <fieldset v-if="deadlineCountdown !== null" class="deadline-card">
          <legend>Innleveringsfrist</legend>
          <span class="deadline-num">{{ deadlineCountdown }}</span>
          <span class="deadline-unit">{{ deadlineCountdown === 1 ? 'dag' : 'dager' }} igjen</span>
        </fieldset>
      </div>

      <fieldset class="hjem-section">
        <legend>Stillingsoversikt</legend>
        <div v-if="lbLoading" class="loading">Laster oversikt…</div>
        <div v-else class="sunken-panel lb-panel">
          <table class="leaderboard">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th>Team</th>
                <th class="col-num">Innsendelser</th>
                <th class="col-num">Kudos</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in leaderboard"
                :key="row.team.id"
                :class="{ 'my-team': row.team.id === store.user?.team_id }"
              >
                <td class="col-num">{{ i + 1 }}</td>
                <td>
                  <div class="lb-team">
                    <img class="lb-avatar" :src="row.teamPhoto" alt="" />
                    <span>{{ row.team.name }}</span>
                    <span v-if="row.team.id === store.user?.team_id" class="lb-myteam-badge">ditt team</span>
                  </div>
                </td>
                <td class="col-num">{{ row.subCount }}</td>
                <td class="col-num">{{ row.kudos || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </fieldset>

      <fieldset class="hjem-section feed-section">
        <legend>Siste innleveringer</legend>
        <div v-if="feedLoading" class="loading">Laster…</div>
        <p v-else-if="!feed.length" class="loading">Ingen innleveringer ennå.</p>
        <!-- Hver innlevering er et lite vindu: grå tittellinje, blir blå når du er over -->
        <div v-for="item in feed" :key="item.sub.id" class="window feed-card" :id="`feed-${item.sub.id}`">
          <div class="title-bar inactive" @click="openSubmission(item.sub.id)">
            <div class="title-bar-text">
              <img class="title-bar-icon" :src="item.teamPhoto" alt="" />
              <span class="title-bar-caption">{{ item.sub.produksjon }} - {{ item.teamName }}</span>
            </div>
            <div class="title-bar-controls">
              <button aria-label="Maximize" title="Åpne" @click.stop="openSubmission(item.sub.id)"></button>
            </div>
          </div>
          <div class="feed-body">
            <div class="feed-meta">
              <span>Kunde: {{ item.sub.kunde }}</span>
              <span class="feed-time">{{ timeAgo(item.sub.submitted_at) }}</span>
            </div>
            <img
              class="feed-screenshot"
              :class="{ expanded: expandedImages.has(item.sub.id) }"
              :src="item.sub.image_url"
              alt=""
              loading="lazy"
              decoding="async"
              @click="toggleImg(item.sub.id)"
            />
            <div class="feed-card-footer">
              <span class="feed-pt-count">{{ item.ptCount }} postetekst{{ item.ptCount !== 1 ? 'er' : '' }}</span>
              <button
                class="kudos-btn"
                :class="{ given: item.myKudos }"
                :disabled="item.isMyTeam || isBusy(item.sub.id)"
                :title="item.isMyTeam ? 'Ikke til eget team' : 'Gi kudos'"
                @click="toggleKudos(item)"
              >
                👏 <span class="kudos-count">{{ item.kudosCount }}</span>
              </button>
              <button
                class="kudos-btn dislike-btn"
                :class="{ given: item.myDislike }"
                :disabled="item.isMyTeam || isBusy(item.sub.id)"
                :title="item.isMyTeam ? 'Ikke til eget team' : 'Tommel ned'"
                @click="toggleDislike(item)"
              >
                👎 <span class="kudos-count">{{ item.dislikeCount }}</span>
              </button>
              <button class="feed-link" @click="openSubmission(item.sub.id)">Se innlegg…</button>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { avatarUrl, timeAgo, safeUrl, metaAdLibraryUrl, ROLE_LABELS } from '~/utils/avatar'

const MOTIVATING = [
  '«Det er ikke om du blir slått ned. Det handler om om du reiser deg igjen.» — Vince Lombardi',
  '«Faller du syv ganger, reis deg åtte.» — japansk ordtak',
  '«Suksess er å gå fra fiasko til fiasko uten å miste entusiasmen.» — Winston Churchill',
]
const BOASTING = [
  '«Med stor makt følger stort ansvar.» — Voltaire / Spider-Man',
  '«Den beste måten å forutsi fremtiden på er å skape den.» — Peter Drucker',
]

definePageMeta({ middleware: 'auth', layout: 'app' })

const store = useAppStore()
const sb = useSupabaseClient()
const { toast } = useToast()

const lbLoading = ref(!store.hjemRaw)
const feedLoading = ref(!store.hjemRaw)
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


const quote = ref('')

// Stillingsoversikten trenger bare team + innsendingstall + kudos
function processLeaderboard(raw: NonNullable<typeof store.hjemRaw>) {
  const { teams, allSubs, allKudos } = raw
  if (!teams?.length) return

  const subsByTeam: Record<string, number> = {}
  const subIdToTeam: Record<string, string> = {}
  ;(allSubs || []).forEach((s: any) => {
    subsByTeam[s.team_id] = (subsByTeam[s.team_id] || 0) + 1
    subIdToTeam[s.id] = s.team_id
  })

  const kudosByTeam: Record<string, number> = {}
  ;(allKudos || []).forEach((k: any) => {
    const tid = subIdToTeam[k.submission_id]
    if (tid) kudosByTeam[tid] = (kudosByTeam[tid] || 0) + 1
  })

  const sorted = [...teams].sort((a: any, b: any) => (subsByTeam[b.id] || 0) - (subsByTeam[a.id] || 0))
  const myTeamId = user.value?.team_id
  const myRank = sorted.findIndex((t: any) => t.id === myTeamId)
  const isLeading = myRank === 0 && (subsByTeam[myTeamId!] || 0) > 0

  if (!quote.value) {
    quote.value = isLeading
      ? BOASTING[Math.floor(Math.random() * BOASTING.length)]
      : myRank > 0
        ? MOTIVATING[Math.floor(Math.random() * MOTIVATING.length)]
        : ''
  }

  leaderboard.value = sorted.map((t: any) => ({
    team: t,
    teamPhoto: t.image_url || avatarUrl(t.name, 30),
    subCount: subsByTeam[t.id] || 0,
    kudos: kudosByTeam[t.id] || 0,
  }))
  lbLoading.value = false
}

// Feeden trenger de tyngre dataene (siste innsendinger, postetekster, dislikes)
function processFeed(raw: NonNullable<typeof store.hjemRaw>) {
  const { teams, subs, pts, allKudos, allDislikes } = raw

  const teamsById: Record<string, any> = {}
  ;(teams || []).forEach((t: any) => { teamsById[t.id] = t })

  const kudosBySubmission: Record<string, string[]> = {}
  ;(allKudos || []).forEach((k: any) => {
    if (!kudosBySubmission[k.submission_id]) kudosBySubmission[k.submission_id] = []
    kudosBySubmission[k.submission_id].push(k.from_email)
  })

  const dislikesBySubmission: Record<string, string[]> = {}
  ;(allDislikes || []).forEach((d: any) => {
    if (!dislikesBySubmission[d.submission_id]) dislikesBySubmission[d.submission_id] = []
    dislikesBySubmission[d.submission_id].push(d.from_email)
  })

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

function processRaw(raw: NonNullable<typeof store.hjemRaw>) {
  processLeaderboard(raw)
  processFeed(raw)
}

async function fetchFresh() {
  // To samtidige grupper: stillingsoversikten (lett) tegnes så snart den er klar,
  // uten å vente på feedens tyngre spørringer
  const leaderboardQ = Promise.all([
    sb.from('teams').select('*').order('name'),
    sb.from('submissions').select('id,team_id'),
    sb.from('kudos').select('submission_id,from_email').limit(500),
  ])
  const feedQ = Promise.all([
    sb.from('submissions').select('*').order('submitted_at', { ascending: false }).limit(15),
    sb.from('postetekster').select('id,submission_id'),
    sb.from('dislikes').select('submission_id,from_email').limit(500),
  ])

  const [{ data: teams }, { data: allSubs }, { data: allKudos }] = await leaderboardQ
  if (!teams) return
  processLeaderboard({ teams, allSubs: allSubs || [], allKudos: allKudos || [] } as any)

  const [{ data: subs }, { data: pts }, { data: allDislikes }] = await feedQ
  const raw = { teams, subs: subs || [], allSubs: allSubs || [], pts: pts || [], allKudos: allKudos || [], allDislikes: allDislikes || [], fetchedAt: Date.now() }
  processFeed(raw)
  store.setHjemRaw(raw)
}

async function loadData() {
  if (store.hjemRaw) {
    processRaw(store.hjemRaw)
    if (!store.hjemCacheFresh()) fetchFresh()
    return
  }
  lbLoading.value = true
  feedLoading.value = true
  await fetchFresh()
}

const busySubmissions = ref(new Set<string>())

function isBusy(id: string) { return busySubmissions.value.has(id) }
function setBusy(id: string) { busySubmissions.value = new Set([...busySubmissions.value, id]) }
function clearBusy(id: string) { const s = new Set(busySubmissions.value); s.delete(id); busySubmissions.value = s }

async function toggleKudos(item: any) {
  if (item.isMyTeam || isBusy(item.sub.id)) return
  const email = user.value?.email
  if (!email) return
  setBusy(item.sub.id)
  const hadKudos = item.myKudos
  const hadDislike = item.myDislike
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
      if (hadDislike) await sb.from('dislikes').delete().eq('submission_id', item.sub.id).eq('from_email', email)
    }
  } catch {
    item.myKudos = hadKudos
    item.kudosCount += hadKudos ? 1 : -1
    if (!hadKudos && hadDislike) { item.myDislike = true; item.dislikeCount += 1 }
    toast('Kunne ikke lagre. Prøv igjen.', true)
  } finally {
    clearBusy(item.sub.id)
  }
}

async function toggleDislike(item: any) {
  if (item.isMyTeam || isBusy(item.sub.id)) return
  const email = user.value?.email
  if (!email) return
  setBusy(item.sub.id)
  const hadDislike = item.myDislike
  const hadKudos = item.myKudos
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
      if (hadKudos) await sb.from('kudos').delete().eq('submission_id', item.sub.id).eq('from_email', email)
    }
  } catch {
    item.myDislike = hadDislike
    item.dislikeCount += hadDislike ? 1 : -1
    if (!hadDislike && hadKudos) { item.myKudos = true; item.kudosCount += 1 }
    toast('Kunne ikke lagre. Prøv igjen.', true)
  } finally {
    clearBusy(item.sub.id)
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

