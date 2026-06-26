<template>
  <div class="nb-wrap" ref="wrapRef">
    <button class="nb-btn" @click="handleToggle" :title="hasNew ? 'Nye varslinger' : 'Varslinger'">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="hasNew" class="nb-dot" />
    </button>

    <Transition name="nb-fade">
      <div v-if="open" class="nb-panel">
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
            <span class="nb-icon">{{ item.icon }}</span>
            <div>
              <div class="nb-text">{{ item.text }}</div>
              <div v-if="item.ago" class="nb-sub">{{ item.ago }}</div>
            </div>
          </div>
        </template>
        <div v-else-if="!loading" class="nb-empty">Ingen aktivitet ennå</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { timeAgo } from '~/utils/avatar'

const store = useAppStore()
const sb = useSupabaseClient()
const wrapRef = ref<HTMLElement | null>(null)
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
      icon: '👏',
      text: `${k.from_email.split('@')[0]} ga kudos for ${subName[k.submission_id] || 'en innlevering'}`,
      ago: k.created_at ? timeAgo(k.created_at) : null,
      created_at: k.created_at,
      isUnread: k.created_at > lastCheck,
    })),
    ...(dislikes || []).map((d: any) => ({
      key: `d-${d.submission_id}-${d.from_email}`,
      icon: '👎',
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
.nb-wrap { position: relative; }

.nb-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: transparent;
  border: 1.5px solid rgba(255,255,255,0.18);
  border-radius: 2px;
  color: rgba(255,255,255,0.55);
  cursor: pointer;
  transition: all 0.15s;
}
.nb-btn:hover { color: white; border-color: rgba(255,255,255,0.4); }

.nb-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ED555C;
  border: 1.5px solid #2B2D42;
}

.nb-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 310px;
  background: white;
  border: 1.5px solid rgba(43,45,66,0.13);
  border-radius: 2px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 400;
  max-height: 460px;
  overflow-y: auto;
}

.nb-head {
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(43,45,66,0.45);
  padding: 0.85rem 1rem 0.6rem;
  border-bottom: 1px solid rgba(43,45,66,0.08);
}

.nb-item {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(43,45,66,0.06);
  transition: background 0.1s;
}
.nb-item:last-child { border-bottom: none; }
.nb-item:hover { background: #fafafa; }
.nb-item.nb-unread { background: #fff8f7; }
.nb-item.nb-system { background: #f7f9ff; }

.nb-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

.nb-text { font-size: 0.85rem; font-weight: 500; color: #2B2D42; line-height: 1.4; }
.nb-sub { font-size: 0.75rem; color: rgba(43,45,66,0.45); margin-top: 0.15rem; }

.nb-loading { padding: 1.5rem; text-align: center; font-size: 0.85rem; color: rgba(43,45,66,0.4); }
.nb-empty { padding: 1.5rem; text-align: center; font-size: 0.85rem; color: rgba(43,45,66,0.4); }

.nb-fade-enter-active, .nb-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.nb-fade-enter-from, .nb-fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
