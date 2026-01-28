<template>
  <div class="schedule-container ms-4">
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

<script setup lang="ts">
import { provide, computed, watch, onMounted } from "vue";
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

// Types
interface Seat {
  _id: string;
  title?: string;
  name?: string;
}

interface Card {
  _id: string;
  "card-title"?: string;
  "start-date"?: string;
  "end-date"?: string;
  seat?: Seat;
  "card-description"?: string;
  "card-status"?: string;
  "card-type"?: string;
}

interface Owner {
  Id: string;
  OwnerText: string;
  OwnerColor: string;
}

interface Event {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  OwnerId: string;
  Description: string;
  Status: string;
  Type: string;
}

provide("schedule", [Day, Week, WorkWeek, Month, Agenda]);
const props = defineProps<{
  data?: Card[];
}>();
const { isDark } = useTheme();
const views = ["Day", "Week", "WorkWeek", "Month", "Agenda"];
const selectedDate = new Date();
const generateColor = (id: string): string => {
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
const ownerDataSource = computed<Owner[]>(() => {
  if (!props.data || props.data.length === 0) {
    return [
      { Id: "unassigned", OwnerText: "Unassigned", OwnerColor: "#9e9e9e" },
    ];
  }

  const seatsMap = new Map<string, Owner>();
  seatsMap.set("unassigned", {
    Id: "unassigned",
    OwnerText: "Unassigned",
    OwnerColor: "#9e9e9e",
  });
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

  const events: Event[] = props.data
    .filter((card) => {
      return card["start-date"] && card["end-date"];
    })
    .map((card) => {
      const startDate = new Date(card["start-date"]!);
      const endDate = new Date(card["end-date"]!);

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
onMounted(() => {
  let themeLink = document.getElementById(
    "syncfusion-theme",
  ) as HTMLLinkElement | null;
  if (!themeLink) {
    themeLink = document.createElement("link");
    themeLink.id = "syncfusion-theme";
    themeLink.rel = "stylesheet";
    document.head.appendChild(themeLink);
  }

  // Set initial theme
  themeLink.href = isDark.value
    ? "https://cdn.syncfusion.com/ej2/material3-dark.css"
    : "https://cdn.syncfusion.com/ej2/material3.css";

  if (isDark.value) {
    document.body.classList.add("e-dark-mode");
  } else {
    document.body.classList.remove("e-dark-mode");
  }
});

watch(
  isDark,
  (newValue) => {
    const themeLink = document.getElementById(
      "syncfusion-theme",
    ) as HTMLLinkElement | null;
    if (themeLink) {
      themeLink.href = newValue
        ? "https://cdn.syncfusion.com/ej2/material3-dark.css"
        : "https://cdn.syncfusion.com/ej2/material3.css";
    }

    if (newValue) {
      document.body.classList.add("e-dark-mode");
    } else {
      document.body.classList.remove("e-dark-mode");
    }
  },
  { immediate: false },
);
</script>

<style scoped>
.schedule-container {
  width: 100%;
  height: 100%;
}

:deep(.e-schedule) {
  background-color: var(--bg-body) !important;
}
:deep(.e-schedule-toolbar-container){
  border-bottom: 1px solid var(--color-border) !important;
}
:deep(.e-schedule .e-schedule-toolbar),
:deep(.e-schedule .e-schedule-toolbar .e-toolbar-items),
:deep(.e-schedule .e-schedule-toolbar .e-toolbar-item) {
  background: var(--bg-body) !important;
  background-color: var(--bg-body) !important;
  color: var(--text-primary) !important;
}

:deep(.e-schedule .e-schedule-toolbar .e-tbar-btn) {
  background: transparent !important;
  color: var(--text-primary) !important;
}

:deep(.e-schedule .e-schedule-toolbar .e-icons),
:deep(.e-schedule .e-schedule-toolbar .e-tbar-btn-text) {
  color: var(--text-primary) !important;
}
:deep(.e-schedule .e-vertical-view .e-date-header-wrap table tbody td) {
  background-color: var(--bg-body) !important;
  color: var(--text-primary) !important;
}
:deep(.e-schedule .e-vertical-view .e-left-indent-wrap table tbody td) {
  background-color: var(--bg-body) !important;
}
:deep(.e-schedule .e-vertical-view .e-time-cells-wrap table td) {
  background-color: var(--bg-body) !important;
   color: var(--text-primary) !important;
}
:deep(.e-schedule .e-vertical-view .e-work-cells) {
  background-color: var(--bg-body) !important;
}

:deep(.e-schedule .e-month-view .e-date-header-wrap table tbody td) {
   background-color: var(--bg-body) !important;
   color: var(--text-primary) !important;
}

:deep(.e-schedule .e-month-view .e-work-cells) {
  background-color: var(--bg-body) !important;
  color: var(--text-primary) !important;
  border-color: var(--border) !important;
}

:deep(.e-schedule .e-work-cells),
:deep(.e-schedule .e-header-cells),
:deep(.e-schedule .e-resource-cells),
:deep(.e-schedule .e-date-header-wrap table tbody td),
:deep(.e-schedule .e-content-wrap table tbody td),
:deep(.e-schedule .e-time-cells-wrap table td),
:deep(.e-schedule .e-left-indent-wrap table tbody td) {
  border-color: var(--border) !important;
}
</style>
