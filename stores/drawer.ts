import { defineStore } from 'pinia'

export const useDrawerStore = defineStore('drawer', () => {
  const open = ref(false)
  return { open }
})
