<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
</template>

<script setup lang="ts">
// Ytelse: koble til Supabase tidlig (data + bilder), og preload de to mest
// synlige fontvektene så hovedteksten vises raskt i riktig font.
const supabaseUrl = useRuntimeConfig().public.supabase.url

useHead({
  link: [
    { rel: 'preconnect', href: supabaseUrl, crossorigin: '' },
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/sohne-400.woff2', crossorigin: '' },
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/sohne-900.woff2', crossorigin: '' },
  ],
})
</script>
