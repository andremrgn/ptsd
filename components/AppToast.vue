<template>
  <div class="toast" :class="{ show: state.visible, error: state.error }">
    {{ state.message }}
  </div>
</template>

<script setup lang="ts">
const { toastState: state } = useToast()
</script>
