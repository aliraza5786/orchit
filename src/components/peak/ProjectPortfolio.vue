<template>
  <div class="border border-slate-200 dark:border-slate-700 rounded-lg bg-bg-card">
    <div class="border-b border-slate-200 dark:border-slate-700 p-6">
      <h3 class="font-semibold text-lg text-slate-900 dark:text-slate-50">Project Portfolio</h3>
      <p class="text-slate-600 dark:text-slate-400 text-sm mt-1">Overview of all active projects in your workspace</p>
    </div>
    <div class="p-6 space-y-6">
      <div class="flex justify-between lg:flex-row flex-col items-center mb-4">
        <!-- Pie Chart -->
        <div class="flex-1 w-full max-w-full lg:max-w-xl h-64 sm:h-80 md:h-96">
          <canvas ref="chartCanvas"></canvas>
        </div>
        <div class="flex-1 ml-4 space-y-3">
          <div v-for="item in chartData" :key="item.name" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.fill }"></div>
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ item.name }}</span>
            </div>
            <span class="font-semibold text-slate-900 dark:text-slate-50">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

interface ChartItem {
  name: string
  value: number
  fill: string
}

const chartData: ChartItem[] = [
  { name: 'Completed', value: 87, fill: '#10b981' },
  { name: 'In Progress', value: 34, fill: '#3b82f6' },
  { name: 'To Do', value: 29, fill: '#e5e7eb' },
]

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

onMounted(() => {
  if (!chartCanvas.value) return

  chartInstance = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: chartData.map(item => item.name),
      datasets: [
        {
          data: chartData.map(item => item.value),
          backgroundColor: chartData.map(item => item.fill),
          borderWidth: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              return `${context.label}: ${context.parsed}`
            }
          }
        }
      }
    }
  })
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>