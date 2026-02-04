<template>
  <div class="border border-slate-200 dark:border-slate-700 rounded-lg bg-bg-card">
    <div class="border-b border-slate-200 dark:border-slate-700 p-6">
      <h3 class="font-semibold text-lg text-slate-900 dark:text-slate-50">Upcoming Deadlines</h3>
      <p class="text-slate-600 dark:text-slate-400 text-sm mt-1">Next milestones and due dates</p>
    </div>
    <div class="p-6">
      <div class="space-y-3">
        <div
          v-for="deadline in deadlines"
          :key="deadline.id"
          :class="['p-3 border rounded-lg transition-colors', getDeadlineClass(deadline.daysUntil, deadline.priority)]"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-start gap-2 flex-1">
              <component
                :is="isUrgent(deadline.daysUntil) ? 'i' : 'i'"
                :class="[
    'fa-regular',
    isUrgent(deadline.daysUntil) ? 'fa-newspaper' : 'fa-calendar',
    'h-4 w-4 mt-0.5 flex-shrink-0',
    isUrgent(deadline.daysUntil)
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-600 dark:text-slate-400'
  ]"
                
              />
              <div class="flex-1 min-w-0">
                <p :class="['font-medium text-sm', isPast(deadline.daysUntil) ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-50']">
                  {{ deadline.title }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-500">{{ deadline.module }}</p>
              </div>
            </div>
            <span :class="['px-2 py-1 rounded text-xs font-semibold text-white', getPriorityColor(deadline.priority)]">
              {{ getPriorityLabel(deadline.priority) }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 dark:text-slate-500">
              {{ formatDate(deadline.dueDate) }}
            </span>
            <span :class="['text-xs font-semibold px-2 py-1 rounded', getDaysUntilColor(deadline.daysUntil)]">
              {{ formatDaysUntil(deadline.daysUntil) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

defineProps<{
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

const deadlines: Deadline[] = [
  {
    id: 1,
    title: 'Design Review',
    dueDate: '2025-02-10',
    module: 'Marketing',
    priority: 'high',
    daysUntil: 5,
  },
  {
    id: 2,
    title: 'Sprint 1 End',
    dueDate: '2025-02-14',
    module: 'All',
    priority: 'critical',
    daysUntil: 9,
  },
  {
    id: 3,
    title: 'Recruitment Drive Complete',
    dueDate: '2025-04-30',
    module: 'Recruitment',
    priority: 'medium',
    daysUntil: 87,
  },
  {
    id: 4,
    title: 'Product Launch',
    dueDate: '2025-02-28',
    module: 'Product',
    priority: 'critical',
    daysUntil: 23,
  },
  {
    id: 5,
    title: 'Client Presentation',
    dueDate: '2025-02-12',
    module: 'Marketing',
    priority: 'high',
    daysUntil: 7,
  },
]

const isUrgent = (daysUntil: number): boolean => daysUntil <= 3
const isPast = (daysUntil: number): boolean => daysUntil < 0

const getDeadlineClass = (daysUntil: number, priority: string): string => {
    console.log(priority);
    
  if (daysUntil < 0) return 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
  if (isUrgent(daysUntil)) return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900'
  return 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
}

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'bg-red-600'
    case 'high':
      return 'bg-orange-600'
    case 'medium':
      return 'bg-yellow-600'
    default:
      return 'bg-green-600'
  }
}

const getPriorityLabel = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const getDaysUntilColor = (daysUntil: number): string => {
  if (daysUntil <= 3) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900'
  if (daysUntil <= 7) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900'
  if (daysUntil <= 14) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900'
  return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900'
}

const formatDaysUntil = (daysUntil: number): string => {
  if (daysUntil === 0) return 'Today'
  if (daysUntil < 0) return 'Overdue'
  return `${daysUntil}d`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>
