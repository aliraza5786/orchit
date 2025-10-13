
<template>
  <div class="group relative rounded-2xl border border-border bg-bg-body p-4 shadow-sm transition-shadow hover:shadow">
    <div class="flex items-start gap-3">
      <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-primary', app.color]">
        <span class="text-base font-semibold">{{ app.tag }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <h3 class="truncate text-sm font-semibold">{{ app.name }}</h3>
          <button class="rounded-xl border border-border bg-bg-surface/30 px-3 py-1 text-xs font-medium text-text-secondary transition hover:bg-bg-surface">
            {{ actionLabel }}
          </button>
        </div>
        <p class="mt-1 line-clamp-2 text-xs text-text-secondary">{{ app.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type AppItem = {
  id: string
  name: string
  tag: string
  description: string
  categories: string[]
  status: 'current' | 'soon'
  color: string // tailwind bg-* class
}

const props = defineProps<{ app: AppItem; actionLabel?: string }>()
// const  app  = toRef<any>(props)
const actionLabel = computed(() => props.actionLabel ?? 'Open')
</script>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>


