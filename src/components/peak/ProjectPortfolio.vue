<template>
  <div class="border border-border rounded-lg bg-bg-card">

    <!-- ✅ FULL CARD LOADING STATE -->
    <div v-if="isLoading" class="p-6 animate-pulse space-y-6">

      <!-- Header Skeleton -->
      <div class="space-y-2">
        <div class="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700"></div>
        <div class="h-3 w-72 rounded bg-slate-200 dark:bg-slate-700"></div>
      </div>

      <!-- Chart Skeleton -->
      <div class="flex flex-col items-center">
        <div class="w-full max-w-xl h-64 sm:h-80 md:h-96 rounded-full bg-slate-200 dark:bg-slate-700"></div>

        <!-- Legend Skeleton -->
        <div class="flex flex-wrap gap-4 mt-6 justify-center w-full">
          <div v-for="n in 4" :key="n" class="flex items-center gap-2">
            <div class="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            <div class="h-3 w-16 rounded bg-slate-300 dark:bg-slate-600"></div>
            <div class="h-3 w-6 rounded bg-slate-300 dark:bg-slate-600"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- ✅ NORMAL CONTENT -->
    <template v-else>

      <!-- Header -->
      <div class="border-b border-border p-6">
        <h3 class="font-semibold text-lg text-primary dark:text-slate-50">
          Project Portfolio
        </h3>
        <p class="text-text-secondary text-sm mt-1">
          Overview of all active projects in your workspace
        </p>
      </div>

      <div class="p-6 space-y-6">

        <!-- Chart -->
        <div v-if="chartData.length" class="flex flex-col items-center mb-4">
          <div class="flex-1 w-full max-w-full lg:max-w-xl h-64 sm:h-80 md:h-96">
            <canvas ref="chartCanvas"></canvas>
          </div>

          <div class="flex gap-4 flex-wrap ml-4 mt-3">
            <div v-for="(item, index) in chartData" :key="index" class="flex items-center">
              <div class="flex items-center gap-1">
                <div
                class="h-3 w-3 rounded-full"
                :style="{ backgroundColor: chartColors[index] }"
              ></div>
                <span class="text-sm text-text-secondary">{{ item.name }}</span>
              </div>
              <span class="font-semibold text-primary ms-2">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="py-16 text-center text-text-secondary">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <i class="fa-solid fa-chart-pie text-slate-400 dark:text-slate-500 text-2xl"></i>
          </div>
          <h3 class="text-base font-semibold text-text-primary dark:text-white mb-1">
            No Project Data
          </h3>
          <p class="text-sm text-text-secondary">
            You currently have no active projects to display.
          </p>
        </div>

      </div>

    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Colors } from 'chart.js'
Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Colors)
const props = defineProps<{
  data?: Record<string, number>;
  isLoading?: boolean;
}>();

const chartColors = ref<string[]>([])
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
const chartData = computed(() => {
  if (!props.data || !Object.keys(props.data).length) return []

  return Object.entries(props.data).map(([name, value]) => ({
    name,
    value: Number(value) || 0
  }))
})

const buildChart = () => {
  if (!chartCanvas.value) return;
  if (!chartData.value.length) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: "doughnut",
    data: {
      labels: chartData.value.map(i => i.name),
      datasets: [
         {
        data: chartData.value.map(i => i.value),
        borderWidth: 0,
      },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "80%",
      plugins: {
        legend: { display: false },
        colors: {
      forceOverride: true
    }
      },
    },
  });
  nextTick(() => {
  const dataset = chartInstance?.data.datasets[0]

  if (!dataset) {
    chartColors.value = []
    return
  }

  const colors = dataset.backgroundColor

  chartColors.value = Array.isArray(colors)
    ? colors as string[]
    : colors
      ? [colors as string]
      : []
})
};


onMounted(() => {
  buildChart();
});
watch(chartData, async (val) => {
  if (!val.length) {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }
  await nextTick();

  buildChart();
});

</script>