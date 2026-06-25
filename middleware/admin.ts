import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware(() => {
  const authUser = useSupabaseUser()
  const store = useAppStore()
  // Vent på at auth-middleware laster profilen hvis bruker er innlogget men profil ikke er klar
  if (authUser.value && !store.user) return
  if (!store.user?.is_admin) {
    return navigateTo('/app/hjem')
  }
})
