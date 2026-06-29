import { defineStore } from 'pinia'
import { PARTICIPANT_ROLES } from '~/utils/avatar'

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: string
  is_admin: boolean
  password_set: boolean
  team_id: string | null
  nickname: string | null
  favorite_quote: string | null
  image_url: string | null
}

export interface AppTeam {
  id: string
  name: string
  image_url: string | null
  updated_at: string
}

const HJEM_CACHE_KEY = 'sp_hjem_raw'
const HJEM_TTL = 5 * 60 * 1000

export const useAppStore = defineStore('app', () => {
  const user = ref<AppUser | null>(null)
  const team = ref<AppTeam | null>(null)
  const judgingActive = ref(false)
  const resultsVisible = ref(false)
  const competitionDeadline = ref<string | null>(null)

  const isParticipant = computed(() =>
    user.value ? PARTICIPANT_ROLES.has(user.value.role) : false,
  )

  function setUser(u: AppUser) {
    user.value = u
  }

  function clearUser() {
    user.value = null
    team.value = null
  }

  async function loadProfile(email: string): Promise<string | null> {
    const sb = useSupabaseClient()
    const { data, error } = await sb.from('users').select('*').eq('email', email).single()
    if (error || !data) {
      return 'Fant ikke brukerprofilen. Ta kontakt med admin.'
    }
    user.value = data
    return null
  }

  async function loadSettings() {
    const sb = useSupabaseClient()
    const { data } = await sb.from('settings').select('*')
    if (!data) return
    judgingActive.value = data.find((s: any) => s.key === 'judging_active')?.value === 'true'
    resultsVisible.value = data.find((s: any) => s.key === 'results_visible')?.value === 'true'
    competitionDeadline.value = data.find((s: any) => s.key === 'competition_deadline')?.value || null
  }

  async function loadTeam() {
    if (!user.value?.team_id) return
    const sb = useSupabaseClient()
    const { data } = await sb.from('teams').select('*').eq('id', user.value.team_id).single()
    if (data) team.value = data
  }

  type HjemRaw = {
    teams: any[]
    subs: any[]
    allSubs: any[]
    pts: any[]
    allKudos: any[]
    allDislikes: any[]
    fetchedAt: number
  }

  function loadHjemFromStorage(): HjemRaw | null {
    if (import.meta.server) return null
    try {
      const raw = localStorage.getItem(HJEM_CACHE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  const hjemRaw = ref<HjemRaw | null>(loadHjemFromStorage())

  function hjemCacheFresh() {
    return hjemRaw.value !== null && Date.now() - hjemRaw.value.fetchedAt < HJEM_TTL
  }

  function setHjemRaw(data: HjemRaw) {
    hjemRaw.value = data
    if (import.meta.client) {
      try { localStorage.setItem(HJEM_CACHE_KEY, JSON.stringify(data)) } catch {}
    }
  }

  return {
    user,
    team,
    judgingActive,
    resultsVisible,
    competitionDeadline,
    isParticipant,
    hjemRaw,
    hjemCacheFresh,
    setHjemRaw,
    setUser,
    clearUser,
    loadProfile,
    loadSettings,
    loadTeam,
  }
})
