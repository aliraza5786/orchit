<template>
  <div class="overflow-auto flex-auto border border-border-gray rounded bg-white  text-sm">
    <!-- Timeline Header -->
    <div class="flex font-medium border-border-gray border-b sticky top-0 z-3">
      <div class="min-w-62.5 px-4 py-2 border-r sticky left-0  border-dark-base-gray bg-[#F3F4F6]">Projects</div>
      <div class="flex-1 grid " :style="`grid-template-columns: repeat(${timeline.length}, 80px)`">
        <div v-for="date in timeline" :key="date"
          class="px-2 py-2 text-center border-r border-dark-base-gray bg-[#F3F4F6]">
          {{ formatDate(date) }}
        </div>
      </div>
    </div>

    <!-- Project Rows -->
    <div v-for="(project, i) in parsedProjects" :key="i" class="flex border-b border-border-gray  relative h-[68px]">
      <!-- Project Info -->
      <div
        class="min-w-62.5 px-4.5 py-6 flex items-center gap-3 sticky left-0 bg-[#F3F4F6] z-[2] border-border-gray border-r">
        <img :src="project.icon" class="w-5 h-5" />
        <span class="text-sm font-medium text-text-primary">{{ project.name }}</span>
      </div>

      <!-- Bars -->
      <div class="relative flex-1 h-full grid items-center p-2"
        :style="`grid-template-columns: repeat(${timeline.length}, 80px)`">
        <template v-for="(bar) in project.bars" :key="b">
          <div class="absolute h-12 rounded-xl flex items-center gap-2 px-3 text-xs font-medium" :style="{
            left: bar.offset,
            width: bar.width,
            backgroundColor: bar.bg,
            color: '#000'
          }">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" :style="{ backgroundColor: bar.pill }"></div>
            <img src="../../assets/icons/Emote.png" class="w-8 h-8" />
            <span class="text-sm font-bold text-text-primary ">{{ project.name }}</span>
            <span class=" text-text-primary badge mx-4.5" :class="{
              'bg-light-blue ': bar.status === 'In progress',
              'bg-light-red ': bar.status === 'Live',
              'bg-light-green ': bar.status === 'Done'
            }">
              {{ bar.status }}
            </span>
            <span>{{ bar.progress }}%</span>
            <div class="w-full max-w-60 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-success-green" :style="{ width: bar.progress + '%' }"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Bar {
  label: string
  startDate: string
  endDate: string
  progress: number
  pill: string
  bg: string
  status: string
}

interface Project {
  name: string
  icon: string
  bars: Bar[]
}

const props = defineProps<{
  timeline: string[]
  projects: Project[]
}>()

const getDateIndex = (dateStr: string) => {
  const normalized = new Date(dateStr).toISOString().split('T')[0]
  return props.timeline.findIndex(d => d === normalized)
}

const parsedProjects = computed(() =>
  props.projects.map(project => {
    const bars = project.bars.map(bar => {
      const startIdx = getDateIndex(bar.startDate)
      const endIdx = getDateIndex(bar.endDate)
      const cellWidth = 80
      const offset = `${startIdx * cellWidth < 0 ? startIdx * cellWidth + 88 : startIdx * cellWidth}px`
      const width = ` ${startIdx * cellWidth < 0 ? (endIdx - startIdx + 1) * cellWidth - 88 : (endIdx - startIdx + 1) * cellWidth}px`
      return { ...bar, offset, width }
    })
    return { ...project, bars }
  })
)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
</script>
