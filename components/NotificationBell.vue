<template>
  <div class="nb-wrap" ref="wrapRef">
    <button ref="btnRef" class="tab-btn nb-btn" :class="{ active: open }" @click="handleToggle" :title="hasNew ? 'Nye varslinger' : 'Varslinger'">
      Varsler
      <span v-if="hasNew" class="nb-dot" />
    </button>

    <!-- Nedtrekksmeny: position:fixed så den ikke klippes av verktøylinja -->
    <div v-if="open" class="nb-panel" :style="panelPos">
        <div class="nb-head">Varslinger</div>

        <!-- Deadline / juryering info -->
        <div v-if="store.judgingActive" class="nb-item nb-system">
          <span class="nb-icon">⚖️</span>
          <div>
            <div class="nb-text">Juryering pågår nå</div>
          </div>
        </div>
        <div v-else-if="store.competitionDeadline" class="nb-item nb-system">
          <span class="nb-icon">📅</span>
          <div>
            <div class="nb-text">Juryering starter {{ juryStartLabel }}</div>
            <div class="nb-sub">Innsendingsfrist: {{ deadlineLabel }}</div>
          </div>
        </div>

        <!-- Notifications -->
        <div v-if="loading" class="nb-loading">Laster…</div>
        <template v-else-if="items.length">
          <div v-for="item in items" :key="item.key" class="nb-item" :class="{ 'nb-unread': item.isUnread }">
            <span class="nb-icon"><PixelIcon :name="item.icon" /></span>
            <div>
              <div class="nb-text">{{ item.text }}</div>
              <div v-if="item.ago" class="nb-sub">{{ item.ago }}</div>
            </div>
          </div>
        </template>
        <div v-else-if="!loading" class="nb-empty">Ingen aktivitet ennå</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { timeAgo } from '~/utils/avatar'

const store = useAppStore()
const sb = useSupabaseClient()
const wrapRef = ref<HTMLElement | null>(null)
const btnRef = ref<HTMLElement | null>(null)
const panelPos = ref<Record<string, string>>({})
const open = ref(false)
const loading = ref(false)
const hasNew = ref(false)
const items = ref<any[]>([])

const LAST_CHECK_KEY = 'notif_last_check'

const deadlineLabel = computed(() => {
  if (!store.competitionDeadline) return ''
  return new Date(store.competitionDeadline).toLocaleDateString('no', { day: 'numeric', month: 'long' })
})

const juryStartLabel = computed(() => {
  if (!store.competitionDeadline) return ''
  const d = new Date(store.competitionDeadline)
  d.setDate(d.getDate() - 3)
  return d.toLocaleDateString('no', { day: 'numeric', month: 'long' })
})

onMounted(async () => {
  await checkForNew()
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

function handleClickOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

async function handleToggle() {
  open.value = !open.value
  if (open.value) {
    // Plasser menyen rett under knappen, høyrejustert mot den
    const r = btnRef.value?.getBoundingClientRect()
    if (r) panelPos.value = { top: `${Math.round(r.bottom)}px`, right: `${Math.max(4, Math.round(window.innerWidth - r.right))}px` }
    await loadItems()
    markRead()
  }
}

function markRead() {
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
  hasNew.value = false
}

async function checkForNew() {
  if (!store.user?.team_id) return
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY) || new Date(0).toISOString()
  const { data: subs } = await sb.from('submissions').select('id').eq('team_id', store.user.team_id)
  if (!subs?.length) return
  const subIds = subs.map((s: any) => s.id)
  const [{ count: kc }, { count: dc }] = await Promise.all([
    sb.from('kudos').select('*', { count: 'exact', head: true }).in('submission_id', subIds).neq('from_email', store.user.email).gt('created_at', lastCheck),
    sb.from('dislikes').select('*', { count: 'exact', head: true }).in('submission_id', subIds).neq('from_email', store.user.email).gt('created_at', lastCheck),
  ])
  hasNew.value = ((kc || 0) + (dc || 0)) > 0
}

async function loadItems() {
  if (!store.user?.team_id) return
  loading.value = true
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY) || new Date(0).toISOString()

  const { data: subs } = await sb.from('submissions').select('id, produksjon').eq('team_id', store.user.team_id)
  if (!subs?.length) { loading.value = false; return }

  const subIds = subs.map((s: any) => s.id)
  const subName: Record<string, string> = Object.fromEntries(subs.map((s: any) => [s.id, s.produksjon]))

  const [{ data: kudos }, { data: dislikes }] = await Promise.all([
    sb.from('kudos').select('submission_id, from_email, created_at').in('submission_id', subIds).neq('from_email', store.user.email).order('created_at', { ascending: false }).limit(30),
    sb.from('dislikes').select('submission_id, from_email, created_at').in('submission_id', subIds).neq('from_email', store.user.email).order('created_at', { ascending: false }).limit(30),
  ])

  const all = [
    ...(kudos || []).map((k: any) => ({
      key: `k-${k.submission_id}-${k.from_email}`,
      icon: 'thumbsUp',
      text: `${k.from_email.split('@')[0]} ga kudos for ${subName[k.submission_id] || 'en innlevering'}`,
      ago: k.created_at ? timeAgo(k.created_at) : null,
      created_at: k.created_at,
      isUnread: k.created_at > lastCheck,
    })),
    ...(dislikes || []).map((d: any) => ({
      key: `d-${d.submission_id}-${d.from_email}`,
      icon: 'thumbsDown',
      text: `${d.from_email.split('@')[0]} likte ikke ${subName[d.submission_id] || 'en innlevering'}`,
      ago: d.created_at ? timeAgo(d.created_at) : null,
      created_at: d.created_at,
      isUnread: d.created_at > lastCheck,
    })),
  ].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  items.value = all
  loading.value = false
}
</script>

<style scoped>
.nb-wrap { position: relative; flex-shrink: 0; }

/* Liten rød firkant = nye varsler */
.nb-dot { display: inline-block; width: 6px; height: 6px; margin-left: 3px; background: #f00; box-shadow: inset -1px -1px #800000; }

/* Win98-meny: hevet panel, menypunkter markeres navy */
.nb-panel {
  position: fixed;
  width: 300px;
  max-width: calc(100vw - 8px);
  max-height: 60vh;
  overflow-y: auto;
  z-index: 400;
  background: #c0c0c0;
  box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #fff;
  padding: 3px;
}
.nb-head { font-weight: 700; padding: 3px 6px 4px; border-bottom: 1px solid #808080; box-shadow: 0 1px 0 #fff; margin-bottom: 2px; }
.nb-item { display: flex; align-items: flex-start; gap: 6px; padding: 3px 6px; }
.nb-item:hover { background: #000080; color: #fff; }
.nb-item:hover .nb-sub { color: #fff; }
.nb-item.nb-unread .nb-text { font-weight: 700; }
.nb-icon { flex-shrink: 0; width: 16px; }
.nb-text { line-height: 13px; }
.nb-sub { color: #404040; line-height: 13px; }
.nb-loading, .nb-empty { padding: 6px; color: #404040; }
</style>
