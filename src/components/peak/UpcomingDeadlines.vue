<template>
  <div class="border border-border rounded-lg bg-bg-card">
    <div class="border-b border-border p-6">
      <h3 class="font-semibold text-lg text-text-primary">Upcoming Deadlines</h3>
      <p class="text-text-secondary text-sm mt-1">Next milestones and due dates</p>
    </div>

   <div class="p-6">
  <!-- Loading Skeleton -->
  <template v-if="isLoading">
    <div class="space-y-3">
      <div
        v-for="n in 5"
        :key="n"
        class="p-3 border border-border rounded-lg animate-pulse flex flex-col gap-2"
      >
        <div class="flex justify-between items-start">
          <div class="flex gap-2 flex-1">
            <div class="h-4 w-4 bg-bg-body rounded-full flex-shrink-0"></div>
            <div class="flex-1 space-y-1">
              <div class="h-3 bg-bg-body rounded w-3/4"></div>
              <div class="h-2 bg-bg-body rounded w-1/2"></div>
            </div>
          </div>
          <div class="h-4 w-12 bg-bg-body rounded"></div>
        </div>
        <div class="flex justify-between items-center">
          <div class="h-3 w-16 bg-bg-body rounded"></div>
          <div class="h-3 w-10 bg-bg-body rounded"></div>
        </div>
      </div>
    </div>
  </template>

  <!-- Empty State -->
  <template v-else-if="deadlines.length === 0">
    <div class="flex flex-col items-center justify-center py-10 text-text-secondary">
      <i class="fa-regular fa-calendar-xmark text-4xl mb-3"></i>
      <h4 class="text-lg font-semibold mb-1">No Upcoming Deadlines</h4>
      <p class="text-sm text-text-secondary/80">
        There are no upcoming milestones or due dates at the moment.
      </p>
    </div>
  </template>

  <!-- Actual Content -->
  <template v-else>
    <div class="space-y-3">
      <div
        v-for="deadline in deadlines"
        :key="deadline.id"
        :class="[
          'p-3 border border-border rounded-lg cursor-pointer group',
          'transition-all duration-200 ease-out',
          'hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]',
          'active:scale-[0.98]',
          getDeadlineClass(deadline.daysUntil)
        ]"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-start gap-2 flex-1">
            <component
              :is="isUrgent(deadline.daysUntil) ? 'i' : 'i'"
              :class="[
              'fa-regular',
              isUrgent(deadline.daysUntil) ? 'fa-newspaper' : 'fa-calendar',
              'h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
              isUrgent(deadline.daysUntil)
                ? 'text-red-600 dark:text-red-400'
                : 'text-text-secondary'
            ]"
            />
            <div class="flex-1 min-w-0">
              <p :class="['font-medium text-sm', isPast(deadline.daysUntil) ? 'line-through text-text-secondary' : 'text-text-primary']">
                {{ deadline.title }}
              </p>
              <p class="text-xs text-text-secondary">{{ deadline.module }}</p>
            </div>
          </div>
          <span :class="['px-2 py-1 rounded text-xs font-semibold text-white', getPriorityColor(deadline.priority)]">
            {{ getPriorityLabel(deadline.priority) }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-text-secondary">
            {{ formatDate(deadline.dueDate) }}
          </span>
          <span :class="['text-xs font-semibold px-2 py-1 rounded', getDaysUntilColor(deadline.daysUntil)]">
            {{ formatDaysUntil(deadline.daysUntil) }}
          </span>
        </div>
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
const getDeadlineClass = (daysUntil: number) => {
  if (daysUntil < 0) return 'border border-border bg-slate-50 dark:bg-slate-800'
  if (isUrgent(daysUntil)) return 'border-red-200 dark:border-red-800 bg-bg-card'
  return 'border border-border'
}
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-600'
    case 'high': return 'bg-orange-600'
    case 'medium': return 'bg-yellow-600'
    default: return 'bg-green-600'
  }
}
const getPriorityLabel = (priority: string) => priority.charAt(0).toUpperCase() + priority.slice(1)
const getDaysUntilColor = (daysUntil: number) => {
  if (daysUntil <= 3) return 'text-text-primary bg-bg-card'
  if (daysUntil <= 7) return 'text-text-primary bg-bg-card'
  if (daysUntil <= 14) return 'text-text-primary bg-bg-card'
  return 'text-text-primary bg-bg-card'
}
const formatDaysUntil = (daysUntil: number) => {
  if (daysUntil === 0) return 'Today'
  if (daysUntil < 0) return 'Overdue'
  return `${daysUntil}d`
}
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const isLoading = computed(() => props.isLoading ?? false)
</script>