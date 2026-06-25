import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware(async () => {
  const authUser = useSupabaseUser()
  const store = useAppStore()

  if (!authUser.value) return navigateTo('/login')

  if (!authUser.value.email) return navigateTo('/login')
  if (!authUser.value.user_metadata?.password_set) return navigateTo('/set-password')

  if (!store.user) {
    await store.loadProfile(authUser.value.email)
    await store.loadSettings()
    await store.loadTeam()
  }
})
