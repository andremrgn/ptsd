import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware(async () => {
  const authUser = useSupabaseUser()
  const store = useAppStore()

  if (authUser.value && !store.user) {
    await store.loadProfile(authUser.value.email!)
    await store.loadSettings()
  }
})
