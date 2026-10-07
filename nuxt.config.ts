export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
  // 98.css gir pikselriktige Win98-kontroller; main.css legger Sølvposten-oppsettet oppå
  css: ['98.css/dist/98.css', '~/assets/css/main.css'],
  imports: {
    dirs: ['stores'],
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm', '/set-password', '/hurtiginnlogging'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 30, // 30 dager
      sameSite: 'lax',
      secure: true,
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  },
  runtimeConfig: {
    resendApiKey: '',
    cronSecret: '',
    supabaseServiceKey: '',
    public: {
      appUrl: 'https://solvposten.vercel.app',
    },
  },
  app: {
    head: {
      title: 'Sølvposten — Morgenstern',
      charset: 'utf-8',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    },
  },
})
