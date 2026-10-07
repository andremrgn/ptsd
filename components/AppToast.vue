<template>
  <!-- Liten Win98-meldingsdialog nede til høyre -->
  <div class="toast window" :class="{ show: state.visible, error: state.error }" role="status" aria-live="polite">
    <div class="title-bar">
      <div class="title-bar-text">
        <span class="title-bar-caption">{{ state.error ? 'Feil' : 'Sølvposten' }}</span>
      </div>
    </div>
    <div class="toast-body">{{ state.message }}</div>
  </div>
</template>

<script setup lang="ts">
const { toastState: state } = useToast()
</script>
