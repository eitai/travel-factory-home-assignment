<script setup lang="ts">
defineProps<{ lead: string }>();
</script>

<template>
  <h1
    class="font-display text-[2.5rem] leading-[1.05] font-medium tracking-tight sm:text-[3.375rem] [&_em]:text-accent [&_em]:italic"
  >
    <slot />
  </h1>
  <p class="mt-3 max-w-[46ch] text-lg text-ink-muted">{{ lead }}</p>
</template>
