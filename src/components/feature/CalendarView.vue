<template>
  <div class="calendar-wrapper m-4 max-h-[calc(100vh-100px)] overflow-y-auto">
    <FullCalendar :options="calendarOptions" @select-card="" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
interface Card {
  _id: string;
  "card-title": string;
  "start-date": string;
  "card-status": string;
  "card-code": string;
  style?: {
    bg_color?: string;
    color?: string;
  };
}

const props = defineProps<{ data: Card[] }>();
const emit = defineEmits<{
  (e: "select:ticket", card: Card): void;
}>();
const lightColors = [
  '#DBEAFE',
  '#DCFCE7',
  '#FEF3C7', 
  '#FCE7F3',
  '#EDE9FE',
  '#ECFEFF', 
  '#FFE4E6',
]

const calendarEvents = computed(() =>
  props.data
    .filter(card => card['start-date'])
    .map((card, index) => {
      const color = lightColors[index % lightColors.length]

      return {
        id: card._id,
        title: card['card-title'],
        start: card['start-date'],
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: '#374151',
        extendedProps: { card },
      }
    })
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  events: calendarEvents.value,
  dayMaxEventRows: true,
  eventDisplay: "block",
  eventClick(info: any) {
    emit("select:ticket", info.event.extendedProps.card);
  },
}));
</script>

<style scoped>
::v-deep .fc-toolbar-chunk .fc-button {
  background-color: transparent;
  color: #7D68C8;
  border: 1.5px solid #7D68C8;
  border-radius: 6px;
  font-weight: 500;
  padding: 4px 12px;
  transition: all 0.2s;
}
::v-deep .fc-toolbar-chunk .fc-button:hover,
::v-deep .fc-prev-button:hover,
::v-deep .fc-next-button:hover,
::v-deep .fc-today-button:hover {
  background-color: #7D68C8;
  color: white;
}
::v-deep .fc-toolbar-chunk .fc-button.fc-button-active {
  background-color: #7D68C8;
  color: white;
  border: none;
}
::v-deep .fc-event {
  border-radius: 6px !important;
  padding: 4px 8px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  border: none !important;
  cursor: pointer;
}
</style>
