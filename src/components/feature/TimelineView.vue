<template>
  <div class="schedule-container">
    <ejs-schedule
      ref="scheduleObj"
      height="550px"
      width="100%"
      :selectedDate="selectedDate"
      :eventSettings="eventSettings"
      :views="views"
    >
      <e-resources>
        <e-resource
          field="OwnerId"
          title="Owner"
          name="Owners"
          :dataSource="ownerDataSource"
          textField="OwnerText"
          idField="Id"
          colorField="OwnerColor"
        >
        </e-resource>
      </e-resources>
    </ejs-schedule>
  </div>
</template>

<script setup>
import { provide, computed, ref, watch } from "vue";
import {
  ScheduleComponent as EjsSchedule,
  ResourcesDirective as EResources,
  ResourceDirective as EResource,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
} from "@syncfusion/ej2-vue-schedule";
import { useTheme } from "../../composables/useTheme";
provide("schedule", [Day, Week, WorkWeek, Month, Agenda]);
const { isDark } = useTheme();
const views = ["Day", "Week", "WorkWeek", "Month", "Agenda"];

// Props
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});
const selectedDate = new Date();

const generateColor = (id) => {
  const colors = [
    "#ffaa00",
    "#f8a398",
    "#7499e1",
    "#a4d65e",
    "#f57f7f",
    "#6ec6ff",
    "#ff80ab",
    "#ffd54f",
    "#b39ddb",
    "#81c784",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Map unique owners for resources
const ownerDataSource = computed(() => {
  if (!props.data || props.data.length === 0) {
    return [
      { Id: "unassigned", OwnerText: "Unassigned", OwnerColor: "#9e9e9e" },
    ];
  }

  const seatsMap = new Map();
  seatsMap.set("unassigned", {
    Id: "unassigned",
    OwnerText: "Unassigned",
    OwnerColor: "#9e9e9e",
  });

  // Extract unique seats from cards
  props.data.forEach((card) => {
    if (card.seat && card.seat._id) {
      if (!seatsMap.has(card.seat._id)) {
        seatsMap.set(card.seat._id, {
          Id: card.seat._id,
          OwnerText: card.seat.title || card.seat.name || "Unnamed Seat",
          OwnerColor: generateColor(card.seat._id),
        });
      }
    }
  });

  return Array.from(seatsMap.values());
});

const eventSettings = computed(() => {
  if (!props.data || props.data.length === 0) {
    return { dataSource: [] };
  }
  const events = props.data
    .filter((card) => {
      return card["start-date"] && card["end-date"];
    })
    .map((card) => {
      const startDate = new Date(card["start-date"]);
      const endDate = new Date(card["end-date"]);
      if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
        endDate.setHours(23, 59, 59);
      }
      if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
        startDate.setHours(9, 0, 0);
      }

      return {
        Id: card._id,
        Subject: card["card-title"] || "Untitled Card",
        StartTime: startDate,
        EndTime: endDate,
        OwnerId: card.seat?._id || "unassigned",
        Description: card["card-description"] || "",
        Status: card["card-status"] || "",
        Type: card["card-type"] || "",
      };
    });

  return { dataSource: events };
});
const scheduleObj = ref(null);
watch(
  isDark,
  () => {
    const ejGantt = scheduleObj.value?.ej2Instances;
    if (ejGantt) {
      ejGantt.theme = isDark.value ? "Material3Dark" : "Material3";
      ejGantt.refresh();
    }
  },
  { immediate: true }
);
watch(
  isDark,
  () => {
    const lightTheme = document.getElementById("light-theme");
    const darkTheme = document.getElementById("dark-theme");

    if (lightTheme && darkTheme) {
      lightTheme.disabled = isDark.value;
      darkTheme.disabled = !isDark.value;
    }

    // refresh Gantt so it repaints
    const ejGantt = scheduleObj.value?.ej2Instances;
    if (ejGantt) ejGantt.refresh();
  },
  { immediate: true }
);
</script>
