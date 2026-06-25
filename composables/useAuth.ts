import { useAppStore } from '~/stores/app'

export function useAuth() {
  const sb = useSupabaseClient()
  const store = useAppStore()
  const router = useRouter()
  const { toast } = useToast()

  async function login(email: string, password: string): Promise<string | null> {
    if (!email || !email.endsWith('@mrgn.no')) {
      return 'Bruk din @mrgn.no-adresse.'
    }

    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return 'Feil e-post eller passord.'
      }
      return error.message
    }

    const err = await store.loadProfile(email)
    if (err) {
      await sb.auth.signOut()
      return err
    }

    await store.loadSettings()
    return null
  }

  async function sendMagicLink(email: string): Promise<string | null> {
    if (!email || !email.endsWith('@mrgn.no')) {
      return 'Bruk din @mrgn.no-adresse.'
    }

    const { data: profile } = await sb.from('users').select('email').eq('email', email).single()
    if (!profile) {
      return 'Fant ikke denne e-postadressen. Ta kontakt med admin.'
    }

    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/confirm` },
    })

    if (error) return error.message
    return null
  }

  async function logout() {
    await sb.auth.signOut()
    store.clearUser()
    router.push('/login')
  }

  return { login, sendMagicLink, logout }
}
