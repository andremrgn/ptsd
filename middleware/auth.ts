import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware(async () => {
  const authUser = useSupabaseUser()
  const store = useAppStore()

  if (authUser.value && !store.user) {
    if (!authUser.value.email) return navigateTo('/login')
    await store.loadProfile(authUser.value.email)
    await store.loadSettings()
    await store.loadTeam()
  }
})
