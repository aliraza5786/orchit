<template>
  <div class="schedule-container">
    <div class="calendar-header bg-bg-card text-text-secondary lg:space-y-0 space-y-2">
      <div class="nav-group bg-bg-body text-text-secondary rounded-md px-2 py-1">
        <button class="nav-btn text-text-secondary" @click="goPrev">
          <i class="fa-regular fa-chevron-left text-sm"></i>
        </button>
        <button class="nav-btn text-text-secondary" @click="goNext">
          <i class="fa-regular fa-chevron-right text-sm"></i>
        </button>
        <button class="today-btn text-text-secondary border border-border" @click="goToday">Today</button>
        <span class="date-label">{{ dateLabel }}</span>
      </div>

      <div class="tabs bg-bg-body rounded-md">
        <button
          v-for="v in views"
          :key="v"
          :class="['tab-btn', { active: currentView === v }]"
          @click="changeView(v)"
        >
          {{ v }}
        </button>
      </div>
    </div>

    <div class="calendar-wrapper px-3">
      <div ref="calendarEl" class="calendar-host border border-border"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
// @ts-ignore — Toast UI calendar types don't resolve via package.json exports
import Calendar from "@toast-ui/calendar";
// @ts-ignore
import "@toast-ui/calendar/dist/toastui-calendar.css";
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useTheme } from "../../composables/useTheme";

interface RawCard {
  _id: string;
  "card-title": string;
  "start-date"?: string | null;
  "end-date"?: string | null;
  [key: string]: any;
}
interface CardList {
  _id: string;
  title: string;
  cards: RawCard[];
}
const props = defineProps<{ data: RawCard[] | CardList[] }>();
const flattenedCards = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  if ("cards" in props.data[0]) {
    return (props.data as CardList[]).flatMap(list => list.cards || []);
  } else {
    return props.data as RawCard[];
  }
});
const emit = defineEmits<{
  (e: "select:ticket", card: RawCard): void;
}>();

const scheduleEl = ref<HTMLDivElement | null>(null);
const calendarEl = ref<HTMLDivElement | null>(null);
let calendar: any = null;

const { isDark } = useTheme();
const currentView = ref<"month" | "week" | "day">("month");
const dateLabel = ref("");
const views: ("month" | "week" | "day")[] = ["month", "week", "day"];
function applyTheme(dark: boolean) {
  if (!scheduleEl.value) return;
  const bg = dark ? "#2b2c30" : "#ffffff";
  const text = dark ? "#e5e7eb" : "#374151";
  const border = dark ? "#3f4046" : "#e2e8f0";
  const hover = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  scheduleEl.value.style.setProperty("--cal-bg", bg);
  scheduleEl.value.style.setProperty("--cal-text", text);
  scheduleEl.value.style.setProperty("--cal-border", border);
  scheduleEl.value.style.setProperty("--cal-hover", hover);
}

watch(isDark, (val) => applyTheme(val));
function parsePlainDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (value.includes("T")) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 0, 0, 0);
}
function buildEvents(cards: RawCard[]) {
  return cards
    .map((card) => {
      const start = parsePlainDate(card["start-date"]);
      const end = parsePlainDate(card["end-date"]);
      if (!start || !end) return null;
      const endInclusive = new Date(end);
      endInclusive.setDate(endInclusive.getDate() + 1);
      return {
        id: card._id,
        calendarId: "default",
        title: card["card-title"] || "Untitled",
        start,
        end: endInclusive,
        isAllday: true,
        category: "allday",
        raw: card,
      };
    })
    .filter(Boolean);
}
function updateDateLabel() {
  if (!calendar) return;
  const date = new Date(calendar.getDate().getTime());

  if (currentView.value === "month") {
    dateLabel.value = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } else if (currentView.value === "day") {
    dateLabel.value = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } else {
    const start = new Date(calendar.getDateRangeStart().getTime());
    const end = new Date(calendar.getDateRangeEnd().getTime());
    dateLabel.value =
      start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " – " +
      end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  }
}
function goToday() { calendar?.today(); updateDateLabel(); }
function goPrev()  { calendar?.prev();  updateDateLabel(); }
function goNext()  { calendar?.next();  updateDateLabel(); }

function changeView(view: "month" | "week" | "day") {
  currentView.value = view;
  calendar?.changeView(view);
  updateDateLabel();
}

function loadEvents(data: RawCard[] | CardList[]) {
  console.log(data);
  
  if (!calendar) return;
  calendar.clear();

  const events = buildEvents(flattenedCards.value);
  if (events.length) calendar.createEvents(events);
}
watch(() => props.data, () => loadEvents(flattenedCards.value), { deep: true });
onMounted(async () => {
  await nextTick();
  if (!calendarEl.value) return;

  applyTheme(isDark.value);

  calendar = new Calendar(calendarEl.value, {
    defaultView: currentView.value,
    usageStatistics: false,
    isReadOnly: true,
    calendars: [
      {
        id: "default",
        name: "Tasks",
        backgroundColor: "#9356c5",
        borderColor: "#7c3aad",
      },
    ],
    template: {
      monthGridHeaderExceed(hiddenEventsCount: number) {
        return `<span class="text-text-primary">+${hiddenEventsCount} more</span>`;
      },
    },
  });

  calendar.on("clickEvent", ({ event }: any) => {
    if (event?.raw) emit("select:ticket", event.raw);
  });

  loadEvents(props.data);
  updateDateLabel();
});

watch(() => props.data, (val) => loadEvents(val ?? []), { deep: true });

onBeforeUnmount(() => {
  calendar?.destroy();
  calendar = null;
});
</script>
<style scoped>
.schedule-container {
  --cal-text: #374151;
  --cal-border: #e2e8f0;
  --cal-hover: rgba(0, 0, 0, 0.06);

  display: flex;
  flex-direction: column;
  height: 100%;
  transition: background 0.2s;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 13px;
  transition: background 0.2s;
}

.nav-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}
.nav-btn:hover { background: var(--cal-hover); }

.today-btn {
  padding: 5px 14px;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s, border-color 0.2s, color 0.2s;
}
.today-btn:hover { background: var(--cal-hover); }

.date-label {
  font-size: 14px;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.2s;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  transition: border-color 0.2s;
}

.tab-btn {
  padding: 4px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-transform: capitalize;
  transition: background 0.15s, color 0.15s;
}
.tab-btn:hover:not(.active) { background: var(--cal-hover); }
.tab-btn.active {
  background: #9356c5;
  color: #ffffff;
}
.calendar-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--cal-bg);
  transition: background 0.2s;
}

.calendar-host {
  width: 100%;
  height: 100%;
  background: var(--cal-bg);
}
:deep(.toastui-calendar-grid-cell-date .toastui-calendar-weekday-grid-date) {
    color: #7D68C8 !important;
}
:deep(.toastui-calendar-template-monthDayName){
  color: #7D68C8 !important;
}
:deep(.toastui-calendar-day-name-container .toastui-calendar-day-name__date, .toastui-calendar-day-name__name){
  color: #7D68C8 !important;
}
:deep(.toastui-calendar-day-name-container .toastui-calendar-day-name__name){
  color: #7D68C8 !important;
}
:deep(.toastui-calendar-panel-title){
  color: #7D68C8 !important;
  font-weight: 600 !important;
}
:deep(.toastui-calendar-grid-cell-more-events){
  color: #6e3b96 !important;
}
:deep(.toastui-calendar-layout),
:deep(.toastui-calendar-week-view),
:deep(.toastui-calendar-month),
:deep(.toastui-calendar-day-view),
:deep(.toastui-calendar-panel),
:deep(.toastui-calendar-timegrid),
:deep(.toastui-calendar-time-grid-scroll-area),
:deep(.toastui-calendar-column),
:deep(.toastui-calendar-day-names),
:deep(.toastui-calendar-day-name__date),
:deep(.toastui-calendar-month-week-item),
:deep(.toastui-calendar-grid-cell) {
  background: var(--cal-bg) !important;
  color: var(--cal-text) !important;
  border-color: var(--cal-border) !important;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

:deep(.toastui-calendar-weekday-grid-line),
:deep(.toastui-calendar-gridline),
:deep(.toastui-calendar-border) {
  border-color: var(--cal-border) !important;
}

:deep(.toastui-calendar-day-name),
:deep(.toastui-calendar-day-name__name),
:deep(.toastui-calendar-grid-cell-date) {
  color: var(--cal-text) !important;
}
:deep(.toastui-calendar-grid-cell-date .toastui-calendar-weekday-grid-date.toastui-calendar-weekday-grid-date-decorator){
  background-color: #9356c5 !important;
  color: white !important;
}
:deep(.toastui-calendar-template-allday){
  color: white !important;
}
:deep(.toastui-calendar-template-monthGridHeaderExceed, .toastui-calendar-template-monthDayName){
  color: #2b2c30 !important;
}
:deep(.toastui-calendar-weekday-grid-date .toastui-calendar-template-monthGridHeader){
  color: #2b2c30 !important;
}
</style>