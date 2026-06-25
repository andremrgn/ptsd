import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware(async () => {
  const authUser = useSupabaseUser()
  const store = useAppStore()

  if (!authUser.value) return navigateTo('/login')
  if (!authUser.value.email) return navigateTo('/login')

  if (!store.user) {
    const err = await store.loadProfile(authUser.value.email)
    if (err) return navigateTo('/login')
    await store.loadSettings()
    await store.loadTeam()
  }

  if (!store.user?.password_set) return navigateTo('/set-password')
})
