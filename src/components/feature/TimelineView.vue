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
import { provide, computed, ref } from "vue";
import {
  ScheduleComponent as EjsSchedule,
  ResourcesDirective as EResources,
  ResourceDirective as EResource,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda
} from "@syncfusion/ej2-vue-schedule";

import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-vue-schedule/styles/material.css';

// Provide required modules - this is crucial
provide('schedule', [Day, Week, WorkWeek, Month, Agenda]);

// Schedule reference
const scheduleObj = ref(null);

// Define views array
const views = ['Day', 'Week', 'WorkWeek', 'Month', 'Agenda'];

// Props
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

// Selected date - use current date initially
const selectedDate = new Date();

// Generate unique colors for seats
const generateColor = (id) => {
  const colors = [
    "#ffaa00", "#f8a398", "#7499e1", "#a4d65e", "#f57f7f", 
    "#6ec6ff", "#ff80ab", "#ffd54f", "#b39ddb", "#81c784"
  ];
  // Use a simple hash of the ID to pick a consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Map unique owners for resources
const ownerDataSource = computed(() => {
  if (!props.data || props.data.length === 0) {
    return [{ Id: "unassigned", OwnerText: "Unassigned", OwnerColor: "#9e9e9e" }];
  }

  const seatsMap = new Map();
  
  // Add an unassigned option
  seatsMap.set("unassigned", {
    Id: "unassigned",
    OwnerText: "Unassigned",
    OwnerColor: "#9e9e9e"
  });

  // Extract unique seats from cards
  props.data.forEach(card => {
    if (card.seat && card.seat._id) {
      if (!seatsMap.has(card.seat._id)) {
        seatsMap.set(card.seat._id, {
          Id: card.seat._id,
          OwnerText: card.seat.title || card.seat.name || "Unnamed Seat",
          OwnerColor: generateColor(card.seat._id)
        });
      }
    }
  });

  return Array.from(seatsMap.values());
});

// Map props.data → Scheduler events
const eventSettings = computed(() => {
  if (!props.data || props.data.length === 0) {
    return { dataSource: [] };
  }

  const events = props.data
    .filter(card => {
      // Only include cards with valid dates
      return card["start-date"] && card["end-date"];
    })
    .map(card => {
      // Parse dates properly
      const startDate = new Date(card["start-date"]);
      const endDate = new Date(card["end-date"]);
      
      // If end date doesn't have time, set it to end of day
      if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
        endDate.setHours(23, 59, 59);
      }
      
      // If start date doesn't have time, set it to start of business day
      if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
        startDate.setHours(9, 0, 0);
      }

      return {
        Id: card._id,
        Subject: card["card-title"] || "Untitled Card",
        StartTime: startDate,
        EndTime: endDate,
        OwnerId: card.seat?._id || "unassigned",
        // Additional fields that might be useful
        Description: card["card-description"] || "",
        Status: card["card-status"] || "",
        Type: card["card-type"] || ""
      };
    });

  return { dataSource: events };
});
</script>

<style scoped>
.schedule-container {
  padding: 20px;
}

/* Ensure the schedule component has proper styling */
:deep(.e-schedule) {
  border: 1px solid #e0e0e0;
}
</style>