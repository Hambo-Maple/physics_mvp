<script setup>
import { computed } from 'vue'
import { cn } from './utils.js'

const props = defineProps({
  class: {
    type: String,
    default: ''
  }
})

const classes = computed(() => {
  return cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    props.class
  )
})
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
