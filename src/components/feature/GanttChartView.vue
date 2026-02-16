<template>
  <div ref="ganttContainer" class="gantt-container max-h-[calc(100vh-100px)] ms-4"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from "vue";
import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import { useTheme } from "../../composables/useTheme";

interface Card {
  _id: string;
  "card-title": string;
  "start-date": string;
  "end-date"?: string;
  "card-status": string;
  "card-code": string;
  color?: string; // Optional custom color for the task
}

const props = defineProps<{ data: Card[] }>();
const { isDark } = useTheme();

const emit = defineEmits<{
  (e: "select:ticket", card: Card): void;
}>();

const ganttContainer = ref<HTMLElement | null>(null);
let ganttInstance: any = null;
let isInitialized = false;

// Computed theme name
const currentTheme = computed(() => isDark.value ? "dark" : "terrace");

// Default colors for tasks (cycle through these)
const defaultColors = [
  "#7D68C8",
  "#4F46E5",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

// Transform data to DHTMLX Gantt format
const transformedData = computed(() => {
  const tasks = props.data.map((card, index) => {
    const startDate = new Date(card["start-date"]);
    const endDate = card["end-date"] 
      ? new Date(card["end-date"]) 
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    // Calculate duration in days
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    // Use custom color if provided, otherwise cycle through default colors
    const taskColor = card.color || defaultColors[index % defaultColors.length];

    return {
      id: card["card-code"] || `task-${index}`,
      text: card["card-title"],
      start_date: formatDate(startDate),
      duration: duration,
      progress: 0,
      color: taskColor,
      _card: card,
    };
  });

  return {
    data: tasks,
    links: [],
  };
});

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// CRITICAL: Set theme on document root element (this is how v9.0+ works!)
function setGanttTheme(theme: string) {
  // Remove any existing gantt theme attribute
  document.documentElement.removeAttribute('data-gantt-theme');
  
  // Set new theme on :root (document.documentElement)
  document.documentElement.setAttribute('data-gantt-theme', theme);
  
  // Also set gantt.skin for API compatibility
  gantt.skin = theme;
  
  console.log('Theme set on :root:', theme);
  console.log('documentElement has attribute:', document.documentElement.getAttribute('data-gantt-theme'));
}

function initGantt() {
  if (!ganttContainer.value) return;

  // CRITICAL: Set theme on :root BEFORE initialization
  setGanttTheme(currentTheme.value);

  // Configure Gantt
  gantt.config.date_format = "%d-%m-%Y";
  gantt.config.readonly = false;
  gantt.config.columns = [
    { name: "text", label: "Task Name", tree: true, width: 200 },
    { name: "start_date", label: "Start Date", align: "center", width: 90 },
    { name: "duration", label: "Duration", align: "center", width: 60 },
  ];

  // Configure grid and row heights
  gantt.config.grid_width = 360;
  gantt.config.row_height = 30;
  gantt.config.scale_height = 50;

  // Apply custom colors to task bars
  gantt.templates.task_style = function(start:any, end:any, task:any) {
    console.log(start, end);
    
    if (task.color) {
      return `background-color: ${task.color}; border-color: ${task.color};`;
    }
    return "";
  };

  // Initialize Gantt
  gantt?.init(ganttContainer.value);
  isInitialized = true;

  // Load data
  gantt.parse(transformedData.value);

  // Add click event handler
  gantt.attachEvent("onTaskClick", function (id: string) {
    const task = gantt.getTask(id);
    if (task && task._card) {
      emit("select:ticket", task._card);
    }
    return true;
  });

  ganttInstance = gantt;
}

// Watch for data changes
watch(
  () => props.data,
  () => {
    if (ganttInstance && isInitialized) {
      gantt.clearAll();
      gantt.parse(transformedData.value);
    }
  },
  { deep: true }
);

// Watch for theme changes
watch(currentTheme, (newTheme) => {
  console.log('Theme changing to:', newTheme);
  
  // Update theme on :root element
  setGanttTheme(newTheme);
  
  // Re-render gantt if already initialized
  if (ganttInstance && isInitialized) {
    gantt.render();
  }
});

onMounted(() => {
  nextTick(() => {
    initGantt();
  });
});

onBeforeUnmount(() => {
  if (isInitialized) {
    gantt.clearAll();
  }
});

</script>

<style scoped>
.gantt-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
}

:deep(.gantt_container) {
  font-family: inherit;
}
</style>