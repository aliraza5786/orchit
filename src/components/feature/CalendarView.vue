<template>
  <div class="mobile-scroll-visible overflow-x-auto h-full m-2">
    <div class="calendar-wrapper  max-h-[calc(100vh-100px)]">
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
  eventDisplay: "block",
  eventClick(info: any) {
    emit("select:ticket", info.event.extendedProps.card);
  },
}));
</script>

<style scoped>
.calendar-wrapper{
  width: 100%;
  min-width: 1000px;
  height:  calc(100% - 16px) !important;
}
::v-deep .fc-toolbar-chunk .fc-button {
  background-color: transparent;
  color: #7d68c8;
  border: 1.5px solid #7d68c8;
  border-radius: 6px;
  font-weight: 500;
  padding: 4px 12px;
  transition: all 0.2s;
}

::v-deep .fc-toolbar-chunk .fc-button:hover,
::v-deep .fc-prev-button:hover,
::v-deep .fc-next-button:hover,
::v-deep .fc-today-button:hover {
  background-color: #7d68c8;
  color: white;
}

::v-deep .fc-toolbar-chunk .fc-button.fc-button-active {
  background-color: #7d68c8;
  color: white;
  border: none;
}
::v-deep .fc-timegrid-all-day {
  border-bottom: none !important;
}

::v-deep .fc-timegrid-all-day-cushion {
  display: none !important;
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

/* Responsive toolbar: wrap buttons on small devices */
::v-deep .fc-toolbar {
  flex-wrap: wrap;
  margin-bottom: 10px !important;
}
::v-deep table {
  border-color: var(--color-border) !important;
}
::v-deep td,
::v-deep th {
  border-color: var(--color-border) !important;
}
::v-deep .fc-toolbar-title {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  line-height: normal !important;
}
/* ::v-deep table{
  background-color: var(--color-bg-body) !important;
} */

@media (max-width: 640px) {
  ::v-deep .fc-toolbar-chunk {
    flex: 1 1 100%;
    justify-content: center;
    margin-bottom: 6px;
  }

  ::v-deep .fc-toolbar-chunk .fc-button {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>
