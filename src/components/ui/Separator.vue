<script setup>
import { SeparatorRoot } from 'radix-vue'
import { cn } from './utils.js'

defineProps({
  orientation: {
    type: String,
    default: 'horizontal'
  },
  decorative: {
    type: Boolean,
    default: true
  },
  class: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <SeparatorRoot
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      $props.class
    )"
    :orientation="orientation"
    :decorative="decorative"
  />
</template>
