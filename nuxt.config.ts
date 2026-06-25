export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  imports: {
    dirs: ['stores'],
  },
  runtimeConfig: {
    resendApiKey: '',
    cronSecret: '',
    public: {
      supabaseUrl: '',
      supabaseKey: '',
    },
  },
  app: {
    head: {
      title: 'Morgenstern — Sølvposten',
      charset: 'utf-8',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
