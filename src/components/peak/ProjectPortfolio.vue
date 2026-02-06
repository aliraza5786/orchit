<template>
  <div class="border border-border rounded-lg bg-bg-card">
    <div class="border-b border-border p-6">
      <h3 class="font-semibold text-lg text-primary dark:text-slate-50">Project Portfolio</h3>
      <p class="text-text-secondary text-sm mt-1">Overview of all active projects in your workspace</p>
    </div>
    <div class="p-6 space-y-6">
      <div class="flex justify-between flex-col items-center mb-4">
        <!-- Pie Chart -->
        <div class="flex-1 w-full max-w-full lg:max-w-xl h-64 sm:h-80 md:h-96">
          <canvas ref="chartCanvas"></canvas>
        </div>
        <div class="flex gap-4 flex-wrap ml-4 mt-3">
          <div v-for="item in chartData" :key="item.name" class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.fill }"></div>
              <span class="text-sm text-text-secondary ">{{ item.name }}</span>
            </div>
            <span class="font-semibold text-primary ms-2">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'
import type { ChartConfiguration } from 'chart.js'

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

type PortfolioItem = {
  name: string
  value: any
}

const props = defineProps<{
  data?: PortfolioItem[];
  isLoading?: boolean;
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const defaultColors = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#f43f5e", // Pink
  "#6366f1", // Indigo
  "#22c55e", // Lime
  "#a855f7", // Violet
  "#facc15", // Yellow
  "#0ea5e9", // Sky Blue
  "#f87171", // Light Red
];

const chartData = computed(() => {
  if (!props.data) return [];

  return Object.entries(props.data).map(([name, value], index) => ({
    name,
    value,
    fill: defaultColors[index % defaultColors.length],
  }));
});

const buildChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const config: ChartConfiguration<'doughnut'> = {
    type: "doughnut",
    data: {
      labels: chartData.value.map((i) => i.name),
      datasets: [
        {
          data: chartData.value?.map((i) => i.value) as any, // Type assertion
          backgroundColor: chartData.value.map((i) => i.fill),
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
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}`,
          },
        },
      },
    },
  };

  chartInstance = new Chart(chartCanvas.value, config);
};

onMounted(() => {
  buildChart();
});

watch(
  () => props.data,
  () => {
    buildChart(); // rebuild when parent updates
  },
  { deep: true }
);

</script>