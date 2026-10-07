<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
</template>

<script setup lang="ts">
// Ytelse: koble til Supabase tidlig (data + bilder).
// (Win98-temaet bruker systemfonten Tahoma, så ingen fonter å preloade.)
const supabaseUrl = useRuntimeConfig().public.supabase.url

useHead({
  link: [
    { rel: 'preconnect', href: supabaseUrl, crossorigin: '' },
  ],
})
</script>
