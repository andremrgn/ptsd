import { defineStore } from 'pinia'
import { PARTICIPANT_ROLES } from '~/utils/avatar'

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: string
  is_admin: boolean
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

export const useAppStore = defineStore('app', () => {
  const user = ref<AppUser | null>(null)
  const team = ref<AppTeam | null>(null)
  const judgingActive = ref(false)
  const resultsVisible = ref(false)
  const adminVerified = ref(false)

  const isParticipant = computed(() =>
    user.value ? PARTICIPANT_ROLES.has(user.value.role) : false,
  )

  function setUser(u: AppUser) {
    user.value = u
    if (import.meta.client) {
      localStorage.setItem('mg_user', JSON.stringify(u))
    }
  }

  function clearUser() {
    user.value = null
    team.value = null
    adminVerified.value = false
    if (import.meta.client) {
      localStorage.removeItem('mg_user')
    }
  }

  function loadUserFromStorage() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('mg_user')
    if (saved) {
      try { user.value = JSON.parse(saved) }
      catch { localStorage.removeItem('mg_user') }
    }
  }

  async function loadSettings() {
    const sb = useSupabase()
    const { data } = await sb.from('settings').select('*')
    if (!data) return
    judgingActive.value = data.find((s: any) => s.key === 'judging_active')?.value === 'true'
    resultsVisible.value = data.find((s: any) => s.key === 'results_visible')?.value === 'true'
  }

  async function loadTeam() {
    if (!user.value?.team_id) return
    const sb = useSupabase()
    const { data } = await sb.from('teams').select('*').eq('id', user.value.team_id).single()
    if (data) team.value = data
  }

  return {
    user,
    team,
    judgingActive,
    resultsVisible,
    adminVerified,
    isParticipant,
    setUser,
    clearUser,
    loadUserFromStorage,
    loadSettings,
    loadTeam,
  }
})
