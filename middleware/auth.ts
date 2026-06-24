import { useAppStore } from '~/stores/app'

export default defineNuxtRouteMiddleware((to) => {
  const store = useAppStore()
  if (!store.user) {
    store.loadUserFromStorage()
  }
  if (!store.user && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (store.user && to.path === '/login') {
    return navigateTo('/app/hjem')
  }
})
