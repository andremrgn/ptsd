import { useAppStore } from '~/stores/app'

export function useAuth() {
  const sb = useSupabase()
  const store = useAppStore()
  const router = useRouter()
  const { toast } = useToast()

  async function login(email: string): Promise<string | null> {
    if (!email || !email.endsWith('@mrgn.no')) {
      return 'Bruk din @mrgn.no-adresse.'
    }
    const { data, error } = await sb.from('users').select('*').eq('email', email).single()
    if (error || !data) {
      return 'Fant ikke denne e-postadressen. Ta kontakt med admin.'
    }
    store.setUser(data)
    await store.loadSettings()
    return null
  }

  function logout() {
    store.clearUser()
    router.push('/login')
  }

  return { login, logout }
}
