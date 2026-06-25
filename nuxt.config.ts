export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  imports: {
    dirs: ['stores'],
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm'],
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
    public: {},
  },
  app: {
    head: {
      title: 'Morgenstern — Sølvposten',
      charset: 'utf-8',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
