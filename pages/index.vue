<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const store = useAppStore()
await navigateTo(store.user ? '/app/hjem' : '/login')
</script>
