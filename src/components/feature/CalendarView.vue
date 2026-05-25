<template>
  <div class="scrollbar-visible overflow-x-auto h-full m-2">
    <div class="calendar-wrapper max-h-[calc(100vh-100px)]">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
interface Card {
  _id: string;
  "card-title": string;
  "start-date": string;
  "end-date": string;
  "card-status": string;
  "card-code": string;
  style?: {
    bg_color?: string;
    color?: string;
  };
}
interface CardList {
  _id: string;
  title: string;
  cards: Card[];
}
const props = defineProps<{ data: Card[] | CardList[] }>();

const emit = defineEmits<{
  (e: "select:ticket", card: Card): void;
}>();

const isMobile = ref(false);

const lightColors = [
  "#DBEAFE",
  "#DCFCE7",
  "#FEF3C7",
  "#FCE7F3",
  "#EDE9FE",
  "#ECFEFF",
  "#FFE4E6",
];

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 640;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
});

const isCardListArray = (data: any[]): data is CardList[] => {
  return data.length > 0 && "cards" in data[0];
};
const calendarEvents = computed(() => {
  let allCards: any[] = [];

  if (!props.data || props.data.length === 0) return [];

  if (isCardListArray(props.data)) {
    allCards = props.data.flatMap((list) => list.cards || []);
  } else {
    allCards = props.data as any[];
  }

  return allCards
    .map((card, index) => {
      let start = card["start-date"]
        ? new Date(card["start-date"])
        : card.created_at
          ? new Date(card.created_at)
          : null;

      if (!start || isNaN(start.getTime())) return null;

      let end = card["end-date"] ? new Date(card["end-date"]) : null;

      if (!end || isNaN(end.getTime())) {
        end = new Date(start);
        end.setDate(end.getDate() + 1);
      }

      const endExclusive = new Date(end);
      endExclusive.setDate(endExclusive.getDate() + 1);

      const color = lightColors[index % lightColors.length];

      return {
        id: card._id,
        title: card["card-title"] || card["card-code"] || "Untitled",
        start,
        end: endExclusive,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: "#374151",
        extendedProps: { card },
      };
    })
    .filter((event): event is any => event !== null); // ✅ FIX
});
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
  },
  events: calendarEvents.value,
  dayMaxEventRows: true,
  height: "auto",
  eventDisplay: "block",
  eventClick(info: any) {
    emit("select:ticket", info.event.extendedProps.card);
  },
}));
</script>

<style scoped>
.calendar-wrapper {
  width: 100%;
  min-width: 1000px;
  height: calc(100% - 16px) !important;
  background-color: var(--bg-body);
}

/* --- Toolbar & Header --- */
:deep(.fc-header-toolbar) {
  padding: 0.75rem 0.5rem !important;
  margin-bottom: 0.5rem !important;
  border-bottom: 1px solid var(--border);
}

:deep(.fc-toolbar-title) {
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* --- Buttons --- */
:deep(.fc-button) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  color: var(--text-primary) !important;
  font-weight: 500 !important;
  font-size: 0.8rem !important;
  padding: 0.35rem 0.75rem !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
  text-transform: capitalize !important;
  height: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.fc-button:hover) {
  background-color: var(--bg-surface) !important;
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
  z-index: 2;
}

:deep(.fc-button-active) {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: white !important;
  z-index: 2;
}

:deep(.fc-today-button) {
  font-weight: 600 !important;
  opacity: 1 !important;
  padding: 0.35rem 1rem !important;
}

:deep(.fc-today-button:disabled) {
  background-color: var(--bg-surface) !important;
  border-color: var(--border) !important;
  color: var(--text-secondary) !important;
  opacity: 0.5 !important;
}

/* --- Segmented Control Look for View Switcher --- */
:deep(.fc-button-group) {
  background-color: var(--bg-card);
  border-radius: 6px;
  padding: 2px;
  border: 1px solid var(--border);
}

:deep(.fc-button-group .fc-button) {
  border: none !important;
  margin: 0 !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  min-width: 60px;
}

:deep(.fc-button-group .fc-button-active) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

/* --- Grid & Cells --- */
:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th),
:deep(.fc-theme-standard .fc-scrollgrid) {
  border-color: var(--border) !important;
}

:deep(.fc-col-header-cell) {
  background-color: var(--bg-surface) !important;
  padding: 8px 0 !important;
}

:deep(.fc-col-header-cell-cushion) {
  color: var(--text-secondary) !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  font-size: 0.7rem !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

:deep(.fc-daygrid-day) {
  background-color: var(--bg-surface) !important;
}

:deep(.fc-day-other) {
  opacity: 0.6;
}

:deep(.fc-daygrid-day-number) {
  color: var(--text-primary);
  font-weight: 500;
  padding: 6px 10px !important;
  font-size: 0.8rem;
  text-decoration: none !important;
}

:deep(.fc-daygrid-day-top) {
  flex-direction: row !important;
}

/* --- Today Highlight --- */
:deep(.fc-day-today) {
  background-color: color-mix(
    in srgb,
    var(--primary-color),
    transparent 85%
  ) !important;
}

:deep(.fc-day-today .fc-daygrid-day-number) {
  background-color: var(--primary-color);
  color: white !important;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px;
  padding: 0 !important;
  font-size: 0.75rem;
}

/* --- Events --- */
:deep(.fc-event) {
  border-radius: 4px !important;
  padding: 2px 6px !important;
  margin: 1px 4px !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  cursor: pointer;
  transition: all 0.2s ease !important;
  color: #1f2937 !important;
}

:deep(.fc-event:hover) {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1) !important;
  filter: brightness(0.95);
}

[data-theme="dark"] :deep(.fc-event) {
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
  color: #f3f4f6 !important;
}

[data-theme="dark"] :deep(.fc-event:not(.fc-event-draggable)) {
  background-image: linear-gradient(
    rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.3)
  ) !important;
}

:deep(.fc-daygrid-block-event .fc-event-main) {
  padding: 1px 0;
}

:deep(.fc-event-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- TimeGrid (Week/Day) Specifics --- */
:deep(.fc-timegrid-slot) {
  height: 2.5rem !important; /* More compact slots */
  background-color: var(--bg-surface);
}

:deep(.fc-timegrid-slot-label-cushion) {
  font-size: 0.7rem !important;
  color: var(--text-secondary) !important;
  text-transform: uppercase;
}

:deep(.fc-timegrid-axis-cushion),
:deep(.fc-timegrid-slot-label-cushion) {
  padding: 4px 8px !important;
  font-size: 0.65rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  color: var(--text-secondary) !important;
}

:deep(.fc-timegrid-col) {
  background-color: var(--bg-surface);
}

:deep(.fc-timegrid-axis-frame) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.fc-timegrid-now-indicator-line) {
  border-color: var(--primary-color) !important;
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-top-color: var(--primary-color) !important;
  border-bottom-color: var(--primary-color) !important;
}

/* --- List View Styling --- */
:deep(.fc-list) {
  border: none !important;
  background: var(--bg-surface) !important;
}

:deep(.fc-list-day-cushion) {
  background-color: var(--bg-card) !important;
  padding: 10px 16px !important;
}

:deep(.fc-list-day-text),
:deep(.fc-list-day-side-text) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

:deep(.fc-list-event) {
  background-color: var(--bg-surface) !important;
}

:deep(.fc-list-event:hover td) {
  background-color: color-mix(
    in srgb,
    var(--primary-color),
    transparent 95%
  ) !important;
}

:deep(.fc-list-event-title a) {
  color: var(--text-primary) !important;
  text-decoration: none !important;
  font-weight: 500 !important;
  font-size: 0.8rem !important;
}

:deep(.fc-list-event-time) {
  color: var(--text-secondary) !important;
  font-size: 0.75rem !important;
}

:deep(.fc-list-event-dot) {
  border-color: var(--primary-color) !important;
}

/* --- Scrollbar visibility improvement --- */
:deep(.fc-scroller) {
  scrollbar-width: thin !important;
  scrollbar-color: var(--border) transparent !important;
}

:deep(.fc-scroller::-webkit-scrollbar) {
  width: 5px;
  height: 5px;
}

:deep(.fc-scroller::-webkit-scrollbar-thumb) {
  background: var(--border);
  border-radius: 10px;
}

/* --- Responsive --- */
@media (max-width: 768px) {
  :deep(.fc-header-toolbar) {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem !important;
  }

  :deep(.fc-toolbar-chunk) {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .calendar-wrapper {
    min-width: unset;
    margin: 0 !important;
  }

  :deep(.fc-toolbar-title) {
    font-size: 1rem !important;
  }
}
</style>
