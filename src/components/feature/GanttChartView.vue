<template>
  <div class="scrollbar-visible overflow-x-auto h-full mx-2 snap-x snap-mandatory">
      <div ref="ganttContainer" class="gantt-container max-h-[calc(100vh-100px)] my-2"></div>
  </div>
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
  "created_at": string;
  color?: string;
}

const props = defineProps<{ data: Card[] | CardList[] }>();
interface CardList {
  _id: string;
  title: string;
  cards: Card[];
}

const isCardListArray = (data: Card[] | CardList[]): data is CardList[] => {
  return data.length > 0 && "cards" in data[0];
};

const flattenedCards = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  if (isCardListArray(props.data)) {
    return props.data.flatMap(list => list.cards || []);
  } else {
    return props.data as Card[];
  }
});
const { isDark } = useTheme();

const emit = defineEmits<{
  (e: "select:ticket", card: Card): void;
}>();

const ganttContainer = ref<HTMLElement | null>(null);
let ganttInstance: any = null;
let isInitialized = false;
const currentTheme = computed(() => isDark.value ? "dark" : "terrace");
const defaultColors = [
  "#7D68C8",
  "#4F46E5",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

const transformedData = computed(() => {
  const tasks = flattenedCards.value.map((card, index) => {
    const startDate = card["start-date"]
      ? new Date(card["start-date"])
      : new Date(card.created_at);
    const endDate = card["end-date"]
      ? new Date(card["end-date"])
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    const duration =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) ||
      1;
    const taskColor = card.color || defaultColors[index % defaultColors.length];
    return {
      id: card["card-code"] || `task-${index}`,
      text: card["card-title"] || card["card-code"] || "Untitled",
      start_date: startDate,
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
function setGanttTheme(theme: string) {
  document.documentElement.removeAttribute('data-gantt-theme');
  document.documentElement.setAttribute('data-gantt-theme', theme);
  gantt.skin = theme;
}

function initGantt() {
  if (!ganttContainer.value) return;
  setGanttTheme(currentTheme.value);
  gantt.config.date_format = "%d-%m-%Y";
  gantt.config.readonly = false;
  gantt.config.columns = [
    { name: "text", label: "Task Name", tree: true, width: 200 },
    { name: "start_date", label: "Start Date", align: "center", width: 90 },
    { name: "duration", label: "Duration", align: "center", width: 60 },
  ];
  gantt.config.grid_width = 360;
  gantt.config.row_height = 30;
  gantt.config.scale_height = 50;
  gantt.templates.task_style = function(task:any) {
    if (task.color) {
      return `background-color: ${task.color}; border-color: ${task.color};`;
    }
    return "";
  };
  gantt?.init(ganttContainer.value);
  isInitialized = true;
  gantt.parse(transformedData.value);
  gantt.attachEvent("onTaskClick", function (id: string) {
    const task = gantt.getTask(id);
    if (task && task._card) {
      emit("select:ticket", task._card);
    }
    return true;
  });

  ganttInstance = gantt;
}

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
watch(currentTheme, (newTheme) => {
  setGanttTheme(newTheme);
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
  height:  calc(100% - 16px) !important;
  min-height: 500px;
  overflow: hidden;
  min-width: 1000px ;
}

:deep(.gantt_container) {
  font-family: inherit;
}

</style>