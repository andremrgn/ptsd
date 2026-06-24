import { defineStore } from 'pinia'

export const useAdminModalStore = defineStore('adminModal', () => {
  const open = ref(false)
  const redirectAfter = ref('')
  return { open, redirectAfter }
})
