interface ToastState {
  message: string
  error: boolean
  visible: boolean
}

const state = reactive<ToastState>({ message: '', error: false, visible: false })
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function toast(message: string, error = false) {
    state.message = message
    state.error = error
    state.visible = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { state.visible = false }, 2800)
  }

  return { toastState: state, toast }
}
