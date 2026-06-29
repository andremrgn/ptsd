<template>
  <div class="page-section">
    <div class="wrap">
      <p class="eyebrow">Resultater</p>
      <h1 class="display" style="margin-bottom:0.5rem">Poengliste</h1>
      <p class="lead">Snittpoeng fra juryen (1–9)</p>
      <div v-if="loading" class="loading">Laster…</div>
      <div v-else-if="!results.length" class="empty">Ingen resultater ennå.</div>
      <div v-else class="results-list">
        <div
          v-for="(r, i) in results"
          :key="r.id"
          class="result-row"
          :class="{ podium: i < 3 }"
        >
          <div class="result-rank" :class="{ podium: i < 3 }">{{ i + 1 }}</div>
          <img class="result-avatar" :src="r.teamPhoto" alt="" />
          <div class="result-info">
            <div class="result-title">{{ r.produksjon }}</div>
            <div class="result-author">{{ r.teamName }} · {{ r.kunde }}</div>
          </div>
          <div class="result-score">
            <div class="score-big">{{ r.avg.toFixed(2) }}</div>
            <div class="score-sub">Snitt · {{ r.count }} stemme{{ r.count !== 1 ? 'r' : '' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { avatarUrl } from '~/utils/avatar'

definePageMeta({ middleware: ['auth', 'results'], layout: 'app' })

const store = useAppStore()
const sb = useSupabaseClient()
const loading = ref(true)
const results = ref<any[]>([])

onMounted(async () => {
  const [{ data: subs }, { data: scores }, { data: teams }] = await Promise.all([
    sb.from('submissions').select('*'),
    sb.from('scores').select('submission_id,score'),
    sb.from('teams').select('*'),
  ])
  if (!subs || !scores) { loading.value = false; return }

  const teamsById: Record<string, any> = {}
  ;(teams || []).forEach((t: any) => { teamsById[t.id] = t })

  const scoreMap: Record<string, number[]> = {}
  scores.forEach((s: any) => {
    if (!scoreMap[s.submission_id]) scoreMap[s.submission_id] = []
    scoreMap[s.submission_id].push(Number(s.score))
  })

  results.value = subs
    .filter((s: any) => scoreMap[s.id]?.length)
    .map((s: any) => {
      const arr = scoreMap[s.id]
      const avg = arr.reduce((a: number, b: number) => a + b, 0) / arr.length
      const team = teamsById[s.team_id] || {}
      return {
        id: s.id,
        produksjon: s.produksjon,
        kunde: s.kunde,
        teamName: team.name || 'Ukjent',
        teamPhoto: team.image_url || avatarUrl(team.name || '?', 40),
        avg,
        count: arr.length,
      }
    })
    .sort((a: any, b: any) => b.avg - a.avg)

  loading.value = false
})
</script>
