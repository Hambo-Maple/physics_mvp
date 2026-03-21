<script setup>
import { ScrollAreaRoot, ScrollAreaViewport, ScrollAreaScrollbar, ScrollAreaThumb } from 'radix-vue'
import { cn } from './utils.js'

defineProps({
  class: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <ScrollAreaRoot :class="cn('relative overflow-hidden', $props.class)">
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      class="flex touch-none select-none transition-colors h-full w-2.5 border-l border-l-transparent p-[1px]"
      orientation="vertical"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      class="flex touch-none select-none transition-colors h-2.5 flex-col border-t border-t-transparent p-[1px]"
      orientation="horizontal"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
