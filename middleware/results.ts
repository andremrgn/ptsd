import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware(() => {
  const store = useAppStore()
  if (!store.resultsVisible && !store.user?.is_admin) {
    return navigateTo('/app/hjem')
  }
})
