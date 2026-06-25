<template>
  <div class="page-section">
    <!-- Submission detail overlay -->
    <div v-if="selectedSub" class="wrap-narrow">
      <button class="sub-detail-back" @click="selectedSub = null">← Tilbake</button>
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
        <div class="sub-detail-tekster">
          <div v-for="(pt, i) in subDetail.postetekster" :key="pt.id" class="sub-detail-tekst">
            <div class="sub-detail-tekst-num">Tekst {{ i + 1 }}</div>
            <div class="sub-detail-tekst-content">{{ pt.content }}</div>
            <a v-if="pt.link" :href="pt.link" target="_blank" class="sub-detail-tekst-link">Se innlegg →</a>
          </div>
        </div>
      </template>
    </div>

    <!-- Main home view -->
    <div v-else class="wrap-narrow">
      <p class="eyebrow">{{ roleLabel }}</p>
      <h1 class="display">Hei, {{ firstName }}!</h1>
      <p v-if="quote" class="lead" style="font-style:italic;color:var(--coral)">{{ quote }}</p>

      <div v-if="deadlineCountdown" class="deadline-block">
        <template v-if="deadlineCountdown.days === 0">
          <span class="deadline-today">I dag er siste frist!</span>
        </template>
        <template v-else>
          <span class="deadline-num">{{ deadlineCountdown.days }}</span>
          <div class="deadline-labels">
            <span class="deadline-unit">{{ deadlineCountdown.days === 1 ? 'dag' : 'dager' }}</span>
            <span class="deadline-lbl">til innsendingsfristen</span>
          </div>
        </template>
      </div>

      <div style="margin-top:2rem">
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

      <div class="feed-section">
        <div class="feed-heading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
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
              :disabled="item.isMyTeam"
              :title="item.isMyTeam ? 'Ikke til eget team' : ''"
              @click="toggleKudos(item)"
            >
              👏 <span class="kudos-count">{{ item.kudosCount }}</span>
            </button>
            <button
              class="kudos-btn dislike-btn"
              :class="{ given: item.myDislike }"
              :disabled="item.isMyTeam"
              :title="item.isMyTeam ? 'Ikke til eget team' : ''"
              @click="toggleDislike(item)"
            >
              👎 <span class="kudos-count">{{ item.dislikeCount }}</span>
            </button>
            <a :href="item.sub.link" target="_blank" class="feed-link">Se innlegg →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { avatarUrl, timeAgo, ROLE_LABELS, PARTICIPANT_ROLES } from '~/utils/avatar'

definePageMeta({ middleware: 'auth', layout: 'app' })

const store = useAppStore()
const sb = useSupabase()

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
  if (days < 0) return null
  return { days }
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

async function loadData() {
  lbLoading.value = true
  feedLoading.value = true
  const [{ data: teams }, { data: subs }, { data: allSubs }, { data: pts }, { data: allKudos }, { data: allDislikes }] =
    await Promise.all([
      sb.from('teams').select('*').order('name'),
      sb.from('submissions').select('*').order('submitted_at', { ascending: false }).limit(15),
      sb.from('submissions').select('id,team_id'),
      sb.from('postetekster').select('id,submission_id'),
      sb.from('kudos').select('submission_id,from_email'),
      sb.from('dislikes').select('submission_id,from_email'),
    ])

  if (!teams) { lbLoading.value = false; feedLoading.value = false; return }

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

async function toggleKudos(item: any) {
  if (item.isMyTeam) return
  const hasGiven = item.myKudos
  item.myKudos = !hasGiven
  item.kudosCount += hasGiven ? -1 : 1
  if (hasGiven) {
    await sb.from('kudos').delete().eq('submission_id', item.sub.id).eq('from_email', user.value?.email)
  } else {
    await sb.from('kudos').insert({ submission_id: item.sub.id, from_email: user.value?.email })
    if (item.myDislike) {
      item.myDislike = false
      item.dislikeCount -= 1
      await sb.from('dislikes').delete().eq('submission_id', item.sub.id).eq('from_email', user.value?.email)
    }
  }
}

async function toggleDislike(item: any) {
  if (item.isMyTeam) return
  const hasGiven = item.myDislike
  item.myDislike = !hasGiven
  item.dislikeCount += hasGiven ? -1 : 1
  if (hasGiven) {
    await sb.from('dislikes').delete().eq('submission_id', item.sub.id).eq('from_email', user.value?.email)
  } else {
    await sb.from('dislikes').insert({ submission_id: item.sub.id, from_email: user.value?.email })
    if (item.myKudos) {
      item.myKudos = false
      item.kudosCount -= 1
      await sb.from('kudos').delete().eq('submission_id', item.sub.id).eq('from_email', user.value?.email)
    }
  }
}

async function openSubmission(id: string) {
  selectedSub.value = id
  imgExpanded.value = false
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

onMounted(loadData)
</script>

<style scoped>
.deadline-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.deadline-num {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--coral);
}

.deadline-labels {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.deadline-unit {
  font-size: 1rem;
  font-weight: 700;
  color: var(--coral);
  line-height: 1.2;
}

.deadline-lbl {
  font-size: 0.78rem;
  color: var(--muted);
  letter-spacing: 0.01em;
}

.deadline-today {
  font-size: 1rem;
  font-weight: 700;
  color: var(--coral);
}
</style>
