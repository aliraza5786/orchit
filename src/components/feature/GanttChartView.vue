<template>
  <div class="max-h-[calc(100vh-100px)]">
    <ejs-gantt
      ref="ganttRef"
      :dataSource="ganttItems"
      :treeColumnIndex="1"
      :taskFields="taskFields"
      :height="'100%'"
      @rowSelected="onRowSelected"
    >
      <e-columns>
        <e-column
          field="TaskID"
          headerText="Task ID"
          textAlign="Right"
          width="70"
        ></e-column>
        <e-column
          field="TaskName"
          headerText="Task Name"
          textAlign="Left"
          width="200"
        ></e-column>
        <e-column
          field="StartDate"
          headerText="Start Date"
          textAlign="Right"
          format="yMd"
          width="90"
        ></e-column>
        <e-column
          field="Duration"
          headerText="Duration"
          textAlign="Right"
          width="80"
        ></e-column>
      </e-columns>
    </ejs-gantt>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { GanttComponent } from "@syncfusion/ej2-vue-gantt";
import { useTheme } from "../../composables/useTheme";
interface Card {
  _id: string;
  "card-title": string;
  "start-date": string;
  "end-date"?: string;
  "card-status": string;
  "card-code": string;
}

const props = defineProps<{ data: Card[] }>();
const { isDark } = useTheme();
const ganttRef = ref<InstanceType<typeof GanttComponent> | null>(null);
const lightColors = [
  "#DBEAFE",
  "#DCFCE7",
  "#FEF3C7",
  "#FCE7F3",
  "#EDE9FE",
  "#ECFEFF",
  "#FFE4E6",
];

const taskFields = {
  id: "TaskID",
  name: "TaskName",
  startDate: "StartDate",
  endDate: "EndDate",
  duration: "Duration",
  progress: "Progress",
  child: "subtasks",
};
const ganttItems = computed(() =>
  props.data.map((card, index) => {
    const start = new Date(card["start-date"]);
    const end = card["end-date"] ? new Date(card["end-date"]) : start;
    const duration =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const color = lightColors[index % lightColors.length];

    return {
      TaskID: card._id,
      TaskName: card["card-title"],
      StartDate: start,
      EndDate: end,
      Duration: duration,
      Progress: 0,
      barColor: color,
      foreground: "#374151",
      extendedProps: { card },
    };
  })
);
const emit = defineEmits<{
  (e: "select:ticket", card: Card): void;
}>();
const onRowSelected = (args: any) => {
  const card = args.data.extendedProps.card as Card;
  emit("select:ticket", card);
};
watch(
  isDark,
  () => {
    const ejGantt = ganttRef.value?.ej2Instances;
    if (ejGantt) {
      console.log("ejgantt chart", ejGantt);

      ejGantt.theme = isDark.value ? "Material3Dark" : "Material3";
      ejGantt.refresh();
    }
  },
  { immediate: true }
);
watch(
  isDark,
  () => {
    const lightTheme = document.getElementById(
      "light-theme"
    ) as HTMLLinkElement;
    const darkTheme = document.getElementById("dark-theme") as HTMLLinkElement;

    if (lightTheme && darkTheme) {
      lightTheme.disabled = isDark.value;
      darkTheme.disabled = !isDark.value;
    }
    const ejGantt = ganttRef.value?.ej2Instances;
    if (ejGantt) ejGantt.refresh();
  },
  { immediate: true }
);
</script>
