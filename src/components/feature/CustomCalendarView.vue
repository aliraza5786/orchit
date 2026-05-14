<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import AssigmentDropdown from "../../views/Product/components/AssigmentDropdown.vue";

const scrollContainerRef = ref<HTMLElement | null>(null);

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["select:ticket", "update:ticket"]);

const activeDayPopup = ref<{
  day: any;
  tasks: any[];
  weekIdx: number;
  placeAbove: boolean;
  placeLeft: boolean;
} | null>(null);

const currentDate = ref(new Date());
const activeView = ref("month"); // month, week
const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// --- Date Utilities ---
const normalizeDate = (d: any) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const getDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- Calendar State ---
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  if (activeView.value === "month") {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: any[] = [];

    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year,
        isCurrentMonth: false,
        date: d,
        key: getDateKey(d),
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        isToday: isSameDay(new Date(), d),
        date: d,
        key: getDateKey(d),
      });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        day: i,
        month: month + 1,
        year,
        isCurrentMonth: false,
        date: d,
        key: getDateKey(d),
      });
    }
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  } else {
    const day = currentDate.value.getDay();
    const diff = currentDate.value.getDate() - day;
    const startOfWeek = new Date(currentDate.value);
    startOfWeek.setDate(diff);
    const days: any[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: true,
        isToday: isSameDay(new Date(), d),
        date: d,
        key: getDateKey(d),
      });
    }
    return [days];
  }
});

const dateTitle = computed(() => {
  if (activeView.value === "month") {
    return currentDate.value.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  } else {
    const week = calendarDays.value[0];
    const first = week[0].date;
    const last = week[6].date;
    const firstMonth = first.toLocaleString("default", { month: "short" });
    const lastMonth = last.toLocaleString("default", { month: "short" });
    const year = last.getFullYear();
    return `${first.getDate()} ${firstMonth} - ${last.getDate()} ${lastMonth} ${year}`;
  }
});

// --- Data Normalization ---
const normalizedTasks = computed(() => {
  const cards: any[] = [];
  if (!props.data) return cards;
  props.data.forEach((item: any) => {
    if (item.cards && Array.isArray(item.cards)) cards.push(...item.cards);
    else if (item._id || item.id || item["card-title"]) cards.push(item);
  });
  return Array.from(new Map(cards.map((c) => [c._id || c.id, c])).values()).map(
    (task: any) => {
      const startStr =
        task["start-date"] ||
        task.variables?.find((v: any) => v.slug === "start-date")?.value ||
        task.created_at;
      const endStr =
        task["end-date"] ||
        task.variables?.find((v: any) => v.slug === "end-date")?.value ||
        startStr;
      const start = normalizeDate(startStr);
      const end = normalizeDate(endStr);
      return {
        ...task,
        _start: start,
        _end: end || start,
        _title: task["card-title"] || task.title || "Untitled",
        _code: task["card-code"] || task.code || "KAN-" + task._id?.slice(-3),
        _color: task.lane?.variables?.["lane-color"] || "var(--primary-color)",
      };
    },
  );
});

const getWeekTasks = (week: any[]) => {
  const weekStart = week[0].date;
  const weekEnd = week[6].date;
  const tasksInWeek = normalizedTasks.value.filter(
    (task) =>
      task._start &&
      task._end &&
      task._start <= weekEnd &&
      task._end >= weekStart,
  );
  const tracks: any[][] = [];
  tasksInWeek.sort(
    (a, b) =>
      a._start.getTime() - b._start.getTime() ||
      b._end.getTime() - a._end.getTime(),
  );

  return tasksInWeek.map((task) => {
    let trackIndex = tracks.findIndex(
      (track) => track[track.length - 1]._end < task._start,
    );
    if (trackIndex === -1) {
      tracks.push([task]);
      trackIndex = tracks.length - 1;
    } else {
      tracks[trackIndex].push(task);
    }
    const startIdx = Math.max(
      0,
      Math.floor(
        (task._start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const endIdx = Math.min(
      6,
      Math.floor(
        (task._end.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    return {
      ...task,
      _weekPos: {
        track: trackIndex,
        start: startIdx,
        span: endIdx - startIdx + 1,
        isStart: task._start >= weekStart,
        isEnd: task._end <= weekEnd,
      },
    };
  });
};

const handleTaskClick = (task: any) => emit("select:ticket", task);
const next = () => {
  if (activeView.value === "month")
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1,
      1,
    );
  else {
    const d = new Date(currentDate.value);
    d.setDate(d.getDate() + 7);
    currentDate.value = d;
  }
};
const prev = () => {
  if (activeView.value === "month")
    currentDate.value = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() - 1,
      1,
    );
  else {
    const d = new Date(currentDate.value);
    d.setDate(d.getDate() - 7);
    currentDate.value = d;
  }
};
const goToToday = () => (currentDate.value = new Date());
// const getAvatar = (task: any) =>
//   task.seat || (task.seats && task.seats[0]) || null;

const getDayTasks = (day: any) => {
  const d = day.date.getTime();
  return normalizedTasks.value
    .filter((task) => {
      const start = new Date(task._start).setHours(0, 0, 0, 0);
      const end = new Date(task._end).setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    })
    .sort((a, b) => a._start.getTime() - b._start.getTime());
};

const handleShowMore = (e: MouseEvent, day: any, wIdx: number) => {
  const tasks = getDayTasks(day);

  // Toggle off if clicking the same badge
  if (activeDayPopup.value?.day.key === day.key) {
    activeDayPopup.value = null;
    return;
  }

  const target =
    (e.target as HTMLElement).closest(".more-badge") ||
    (e.target as HTMLElement);
  const rect = target.getBoundingClientRect();
  const estimatedHeight = Math.min(380, tasks.length * 45 + 80);

  let spaceBelow = window.innerHeight - rect.bottom;
  let spaceAbove = rect.top;

  const scrollWrapper = scrollContainerRef.value;
  if (scrollWrapper) {
    const wrapperRect = scrollWrapper.getBoundingClientRect();
    spaceBelow = wrapperRect.bottom - rect.bottom;
    spaceAbove = rect.top - wrapperRect.top;
  }

  // Place above if there isn't enough space below AND there is more space above
  const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

  // Place left if it's Thu, Fri, or Sat
  const placeLeft = day.date.getDay() >= 4;

  activeDayPopup.value = {
    day,
    tasks,
    weekIdx: wIdx,
    placeAbove,
    placeLeft,
  };
};

const closePopup = () => {
  activeDayPopup.value = null;
};

// Close popup on view change
watch(activeView, () => closePopup());

onMounted(() => {
  const handleGlobalClick = (e: MouseEvent) => {
    if (!activeDayPopup.value) return;
    const target = e.target as HTMLElement;
    if (
      !target.closest(".day-popup-container") &&
      !target.closest(".more-badge")
    ) {
      closePopup();
    }
  };
  window.addEventListener("click", handleGlobalClick);
  onUnmounted(() => window.removeEventListener("click", handleGlobalClick));
});
</script>

<template>
  <div
    class="custom-calendar m-2 rounded-[6px] flex flex-col h-full overflow-hidden"
  >
    <!-- Premium Improved Header -->
    <div
      class="flex items-center justify-between pb-2 shadow-sm rounded-t-[6px]"
    >
      <div class="flex items-center gap-3">
        <!-- Navigation Capsule -->
        <div
          class="flex items-center bg-bg-surface border border-border rounded-[6px] overflow-hidden h-9"
        >
          <button @click="prev" class="nav-btn-sm">
            <i class="fa-solid fa-chevron-left text-[13px]"></i>
          </button>
          <button
            @click="goToToday"
            class="px-4 text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors border-x border-border h-full"
          >
            Today
          </button>
          <button @click="next" class="nav-btn-sm">
            <i class="fa-solid fa-chevron-right text-[13px]"></i>
          </button>
        </div>
        <h2
          class="text-[16px] font-bold text-text-primary tracking-tight leading-none"
        >
          {{ dateTitle }}
        </h2>
      </div>

      <!-- View Segmented Switcher -->
      <div class="flex items-center gap-2">
        <div
          class="flex bg-bg-surface border border-border p-[5px] rounded-[6px] h-10"
        >
          <button
            @click="activeView = 'month'"
            class="segment-btn"
            :class="{ active: activeView === 'month' }"
          >
            Month
          </button>
          <button
            @click="activeView = 'week'"
            class="segment-btn"
            :class="{ active: activeView === 'week' }"
          >
            Week
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Content -->
    <div
      class="flex-1 overflow-y-auto scrollbar-hide bg-bg-surface  relative"
      ref="scrollContainerRef"
    >
      <!-- Days of Week -->
      <div
        class="grid grid-cols-7 border-x border-b border-border rounded-t-[6px] bg-bg-body sticky top-0 z-20"
      >
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="py-2.5 text-center text-[10px] font-bold text-text-secondary tracking-widest opacity-60"
        >
          {{ day }}
        </div>
      </div>

      <!-- Weeks Grid -->
      <div
        v-for="(week, wIdx) in calendarDays"
        :key="wIdx"
        class="relative border-b border-border flex flex-col transition-all"
        :class="[
          activeView === 'week' ? 'h-full min-h-[500px]' : 'min-h-[160px]',
          activeDayPopup?.weekIdx === wIdx ? 'z-50' : 'z-10',
        ]"
      >
        <!-- Background Grid -->
        <div
          class="absolute inset-0 grid grid-cols-7 border-l border-border pointer-events-none"
        >
          <div
            v-for="day in week"
            :key="day.key"
            class="border-r border-border h-full"
            :class="{ 'bg-bg-surface/30': !day.isCurrentMonth }"
          ></div>
        </div>

        <!-- Date Numbers -->
        <div class="grid grid-cols-7 relative z-20">
          <div
            v-for="day in week"
            :key="day.key"
            class="p-2 flex justify-between items-start"
          >
            <div
              v-if="activeView === 'month' && getDayTasks(day).length > 2"
              class="relative z-[100]"
            >
              <div
                @click.stop="handleShowMore($event, day, wIdx)"
                class="more-badge px-1.5 py-0.5 bg-bg-surface border border-border rounded text-[9px] font-bold text-text-secondary hover:text-primary-color hover:border-primary-color transition-all cursor-pointer shadow-sm"
              >
                +{{ getDayTasks(day).length - 2 }} more
              </div>

              <!-- Inline Popover -->
              <Transition name="fade">
                <div
                  v-if="activeDayPopup?.day.key === day.key"
                  class="day-popup-container absolute z-[9999] bg-bg-card border border-border shadow-2xl rounded-xl p-5 w-[280px]"
                  :class="[
                    activeDayPopup?.placeLeft
                      ? 'right-full mr-2'
                      : 'left-full ml-2',
                    activeDayPopup?.placeAbove
                      ? 'bottom-0 mb-[-6px]'
                      : 'top-0 mt-[-6px]',
                  ]"
                  @click.stop
                >
                  <!-- Header -->
                  <div class="flex items-start justify-between mb-5">
                    <div class="flex items-baseline gap-1.5">
                      <span
                        class="text-[28px] leading-none font-bold text-text-primary"
                        >{{ day.day }}</span
                      >
                      <span
                        class="text-[13px] font-medium text-text-secondary"
                        >{{
                          day.date.toLocaleString("default", {
                            weekday: "short",
                          })
                        }}</span
                      >
                    </div>
                    <button
                      @click="closePopup"
                      class="text-text-secondary hover:text-text-primary mt-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Tasks List -->
                  <div
                    class="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar"
                  >
                    <div
                      v-for="task in activeDayPopup?.tasks"
                      :key="task._id"
                      @click="
                        handleTaskClick(task);
                        closePopup();
                      "
                      class="flex items-start gap-3 cursor-pointer group"
                    >
                      <!-- Color Indicator -->
                      <div
                        class="w-[5px] h-5 rounded-full shrink-0 mt-0.5"
                        :style="{ backgroundColor: task._color }"
                      ></div>

                      <!-- Content -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span
                            class="text-[10px] font-bold text-text-secondary opacity-60"
                            >{{ task._code }}</span
                          >
                          <!-- Assignees -->
                          <div
                            v-if="task.seats?.length || task.seat"
                            @click.stop
                          >
                            <AssigmentDropdown
                              :seat="task.seats || task.seat"
                              :disabled="true"
                            />
                          </div>
                        </div>
                        <div
                          class="text-[12px] font-medium text-text-primary truncate group-hover:text-primary-color transition-colors"
                        >
                          {{ task._title }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
            <span
              class="day-num ml-auto"
              :class="{
                'is-today': day.isToday,
                'other-month': !day.isCurrentMonth,
              }"
            >
              {{ day.day }}
            </span>
          </div>
        </div>

        <!-- Multi-Day Task Bars -->
        <div class="flex-1 relative z-10 px-0.5 pb-3">
          <div
            v-for="task in getWeekTasks(week).filter((t) =>
              activeView === 'month' ? t._weekPos.track < 2 : true,
            )"
            :key="task._id"
            @click="handleTaskClick(task)"
            class="absolute h-[28px] flex items-center transition-all cursor-pointer group/task"
            :style="{
              left: `calc(${task._weekPos.start * (100 / 7)}%)`,
              width: `calc(${task._weekPos.span * (100 / 7)}%)`,
              top: `${task._weekPos.track * 32 + 36}px`,
            }"
          >
            <div
              class="w-full h-[24px] mx-0.5 rounded-sm flex items-center px-2 text-white text-[10px] font-bold relative overflow-hidden shadow-sm"
              :style="{ backgroundColor: task._color }"
            >
              <div
                v-if="!task._weekPos.isStart"
                class="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 flex items-center justify-center"
              >
                <i class="fa-solid fa-chevron-left text-[7px]"></i>
              </div>

              <div class="flex items-center gap-2 w-full overflow-hidden">
                <!-- <input
                  type="checkbox"
                  class="w-3.5 h-3.5 accent-white opacity-60 group-hover/task:opacity-100"
                /> -->
                <span class="whitespace-nowrap font-black">{{
                  task._code
                }}</span>
                <span class="truncate opacity-90">{{ task._title }}</span>
              </div>

              <div
                v-if="task.seats?.length || task.seat"
                class="flex-shrink-0 ml-1.5"
                @click.stop
              >
                <AssigmentDropdown
                  :seat="task.seats || task.seat"
                  :disabled="true"
                />
              </div>

              <div
                v-if="!task._weekPos.isEnd"
                class="absolute right-0 top-0 bottom-0 w-2.5 bg-black/10 flex items-center justify-center"
              >
                <i class="fa-solid fa-chevron-right text-[7px]"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-calendar {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.nav-btn-sm {
  width: 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.nav-btn-sm:hover {
  background-color: var(--bg-card);
  color: var(--primary-color);
}

.segment-btn {
  padding: 0 1.25rem;
  height: 100%;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  border-radius: 6px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.segment-btn:hover {
  color: var(--text-primary);
}
.segment-btn.active {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.day-num {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  border-radius: 50%;
  transition: all 0.2s;
}
.day-num.is-today {
  background-color: #0052cc;
  color: white;
  box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.15);
}
.day-num.other-month {
  opacity: 0.3;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
</style>
