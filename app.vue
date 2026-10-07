<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
</template>

<script setup lang="ts">
// Ytelse: koble til Supabase tidlig (data + bilder), og preload W98-pikselfonten
// (7 KB per vekt) så teksten ikke blinker fra en vanlig font til pikselfonten.
const supabaseUrl = useRuntimeConfig().public.supabase.url

useHead({
  link: [
    { rel: 'preconnect', href: supabaseUrl, crossorigin: '' },
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/w98-sans.woff2', crossorigin: '' },
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/w98-sans-bold.woff2', crossorigin: '' },
  ],
})
</script>
