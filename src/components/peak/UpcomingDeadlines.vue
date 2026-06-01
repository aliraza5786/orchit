<template>
  <div class="border border-border rounded-[6px] bg-bg-card overflow-hidden">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 py-4 border-b border-border">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-lavender)">
        <i class="fa-regular fa-calendar-clock text-[13px] text-primary-color"></i>
      </div>
      <div>
        <h3 class="text-[14px] font-semibold text-text-primary leading-tight m-0">Upcoming Deadlines</h3>
        <p class="text-[11px] text-text-secondary mt-0.5 m-0">Next milestones and due dates</p>
      </div>
    </div>

    <div class="p-4 flex flex-col gap-2">

      <!-- Loading Skeleton -->
      <template v-if="isLoading">
        <div v-for="n in 5" :key="n" class="p-3 border border-border rounded-xl animate-pulse flex flex-col gap-2.5 bg-bg-surface">
          <div class="flex justify-between items-start gap-3">
            <div class="flex gap-2.5 flex-1">
              <div class="w-7 h-7 bg-border/40 rounded-lg flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5 pt-0.5">
                <div class="h-3 bg-border/40 rounded w-4/5"></div>
                <div class="h-2.5 bg-border/30 rounded w-2/5"></div>
              </div>
            </div>
            <div class="h-5 w-14 bg-border/30 rounded-full"></div>
          </div>
          <div class="flex justify-between items-center pt-1">
            <div class="h-2.5 w-16 bg-border/30 rounded"></div>
            <div class="h-5 w-10 bg-border/30 rounded-full"></div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <template v-else-if="deadlines.length === 0">
        <div class="flex flex-col items-center justify-center py-12 text-center gap-3" style="min-height: 280px">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background: var(--bg-lavender)">
            <i class="fa-regular fa-calendar-xmark text-[20px] text-primary-color"></i>
          </div>
          <div>
            <p class="text-[14px] font-semibold text-text-primary m-0">No upcoming deadlines</p>
            <p class="text-[12px] text-text-secondary mt-1 m-0 max-w-[200px] leading-relaxed">
              No milestones or due dates at the moment.
            </p>
          </div>
        </div>
      </template>

      <!-- Deadline Cards -->
      <template v-else>
        <div
          v-for="deadline in deadlines"
          :key="deadline.id"
          class="group flex flex-col gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-150 active:scale-[0.99]"
          :class="[
            isPast(deadline.daysUntil)
              ? 'border-border bg-bg-surface opacity-60'
              : isUrgent(deadline.daysUntil)
                ? 'border-border bg-bg-card'
                : 'border-border bg-bg-card'
          ]"
          @mouseenter="($event.currentTarget as HTMLElement)?.style && (($event.currentTarget as HTMLElement).style.borderColor = 'rgba(125,104,200,0.35)')"
          @mouseleave="($event.currentTarget as HTMLElement)?.style && (($event.currentTarget as HTMLElement).style.borderColor = '')"
        >
          <!-- Top row -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2.5 flex-1 min-w-0">

              <!-- Icon -->
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105"
                :style="{
                  background: isPast(deadline.daysUntil)
                    ? 'var(--border)'
                    : isUrgent(deadline.daysUntil)
                      ? 'rgba(239,68,68,0.1)'
                      : 'var(--bg-lavender)',
                  color: isPast(deadline.daysUntil)
                    ? 'var(--text-secondary)'
                    : isUrgent(deadline.daysUntil)
                      ? '#ef4444'
                      : 'var(--accent)'
                }"
              >
                <i
                  class="text-[11px]"
                  :class="isUrgent(deadline.daysUntil) ? 'fa-solid fa-triangle-exclamation' : 'fa-regular fa-calendar'"
                ></i>
              </div>

              <!-- Title + module -->
              <div class="flex-1 min-w-0">
                <p
                  class="text-[13px] font-medium leading-snug m-0 truncate"
                  :class="isPast(deadline.daysUntil) ? 'line-through text-text-secondary' : 'text-text-primary'"
                >{{ deadline.title }}</p>
                <p class="text-[11px] text-text-secondary m-0 mt-0.5 truncate">{{ deadline.module }}</p>
              </div>
            </div>

            <!-- Priority badge -->
            <span
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              :style="getPriorityStyle(deadline.priority)"
            >{{ getPriorityLabel(deadline.priority) }}</span>
          </div>

          <!-- Bottom row -->
          <div class="flex items-center justify-between pl-[36px]">
            <span class="text-[11px] text-text-secondary flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i>
              {{ formatDate(deadline.dueDate) }}
            </span>
            <span
              class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              :style="getDaysStyle(deadline.daysUntil)"
            >{{ formatDaysUntil(deadline.daysUntil) }}</span>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: any[]
  isLoading?: boolean
  isDarkMode?: boolean
}>()

interface Deadline {
  id: number
  title: string
  dueDate: string
  module: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  daysUntil: number
}

// Calculate days until due date
const calculateDaysUntil = (dueDate: string): number => {
  const now = new Date()
  const due = new Date(dueDate)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// Map props.data to Deadline[]
const deadlines = computed<Deadline[]>(() => {
  if (!props.data || !props.data.length) return []

  return props.data.map((item, index) => ({
    id: index + 1,
    title: item.variables['card-title'] || 'Untitled',
    dueDate: item.variables['end-date'] || item.variables['start-date'],
    module: item.variables['card-type'] || 'General',
    priority: (() => {
      const p = item.variables['priority']?.toLowerCase()
      if (p === 'high') return 'high'
      if (p === 'medium') return 'medium'
      if (p === 'low') return 'low'
      return 'critical'
    })(),
    daysUntil: calculateDaysUntil(item.variables['end-date'] || item.variables['start-date']),
  }))
})

// Template functions
const isUrgent = (daysUntil: number) => daysUntil <= 3
const isPast = (daysUntil: number) => daysUntil < 0
const getPriorityStyle = (priority: string): Record<string, string> => {
  switch (priority) {
    case 'critical': return { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    case 'high':     return { background: 'rgba(249,115,22,0.1)', color: '#f97316' }
    case 'medium':   return { background: 'rgba(125,104,200,0.12)', color: 'var(--accent)' }
    default:         return { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }
  }
}

const getDaysStyle = (daysUntil: number): Record<string, string> => {
  if (daysUntil < 0)  return { background: 'rgba(239,68,68,0.08)', color: '#ef4444' }
  if (daysUntil === 0) return { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
  if (daysUntil <= 3) return { background: 'rgba(249,115,22,0.1)', color: '#f97316' }
  if (daysUntil <= 7) return { background: 'rgba(125,104,200,0.12)', color: 'var(--accent)' }
  return { background: 'var(--bg-surface)', color: 'var(--text-secondary)' }
}
const getPriorityLabel = (priority: string) => priority.charAt(0).toUpperCase() + priority.slice(1)

const formatDaysUntil = (daysUntil: number) => {
  if (daysUntil === 0) return 'Today'
  if (daysUntil < 0) return 'Overdue'
  return `${daysUntil}d`
}
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const isLoading = computed(() => props.isLoading ?? false)
</script>