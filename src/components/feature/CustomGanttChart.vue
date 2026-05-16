<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select:ticket", "update:ticket", "create:ticket"]);

// --- State ---
const zoomLevel = ref("week");
const containerRef = ref<HTMLElement | null>(null);
const sidebarRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const hoveredTaskId = ref<string | null>(null);
const scrollLeft = ref(0);
const containerWidth = ref(0);
const selectedTaskId = ref<string | null>(null);

// --- Scroll Syncing ---
let isSyncingSidebar = false;
let isSyncingGrid = false;

const handleSidebarScroll = (e: Event) => {
  if (isSyncingSidebar) {
    isSyncingSidebar = false;
    return;
  }
  isSyncingGrid = true;
  if (gridRef.value)
    gridRef.value.scrollTop = (e.target as HTMLElement).scrollTop;
};

const handleGridScroll = (e: Event) => {
  if (isSyncingGrid) {
    isSyncingGrid = false;
    return;
  }
  isSyncingSidebar = true;
  if (sidebarRef.value)
    sidebarRef.value.scrollTop = (e.target as HTMLElement).scrollTop;
};

// --- Date Utils ---
const normalizeDate = (d: any) => {
  if (!d) return new Date();
  const date = new Date(d);
  if (isNaN(date.getTime())) return new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const diffDays = (d1: Date, d2: Date) => {
  const t1 = normalizeDate(d1).getTime();
  const t2 = normalizeDate(d2).getTime();
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("default", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

// --- Data Normalization ---
const allTasks = computed(() => {
  const tasks: any[] = [];
  if (!props.data) return tasks;

  props.data.forEach((item: any) => {
    if (item.cards && Array.isArray(item.cards)) {
      tasks.push(...item.cards);
    } else if (item._id || item.id || item["card-title"]) {
      tasks.push(item);
    }
  });

  return Array.from(new Map(tasks.map((t) => [t._id || t.id, t])).values()).map(
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
      let finalEnd = end;
      if (finalEnd <= start) finalEnd = addDays(start, 1);

      return {
        ...task,
        _start: start,
        _end: finalEnd,
        _progress:
          task.variables?.find((v: any) => v.slug === "progress")?.value || 0,
        _code: task["card-code"] || task.code || "KAN-" + task._id?.slice(-3),
        _title: task["card-title"] || task.title || "Untitled",
      };
    },
  );
});

// --- Timeline Calculation ---
const timelineRange = computed(() => {
  if (allTasks.value.length === 0) {
    const start = addDays(new Date(), -15);
    const end = addDays(new Date(), 45);
    return { start: normalizeDate(start), end: normalizeDate(end) };
  }
  let start = new Date(
    Math.min(...allTasks.value.map((t) => t._start.getTime())),
  );
  let end = new Date(Math.max(...allTasks.value.map((t) => t._end.getTime())));
  start = addDays(start, -20);
  end = addDays(end, 60);
  return { start: normalizeDate(start), end: normalizeDate(end) };
});

const columnWidth = computed(() => {
  switch (zoomLevel.value) {
    case "day":
      return 120;
    case "week":
      return 50;
    case "month":
      return 20;
    default:
      return 50;
  }
});

const timelineDays = computed(() => {
  const days = [];
  const { start, end } = timelineRange.value;
  const totalDays = diffDays(end, start);
  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(start, i);
    days.push({
      date: d,
      isToday: diffDays(d, new Date()) === 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      label: d.getDate(),
      month: d.toLocaleString("default", { month: "short" }),
      year: d.getFullYear(),
      isFirstOfMonth: d.getDate() === 1,
    });
  }
  return days;
});

const headerGroups = computed(() => {
  const groups: any[] = [];
  if (zoomLevel.value === "week") {
    // Group by 7-day weeks for clearer separation
    for (let i = 0; i < timelineDays.value.length; i += 7) {
      const slice = timelineDays.value.slice(i, i + 7);
      if (slice.length === 0) break;
      const months = Array.from(new Set(slice.map((d) => d.month)));
      const year = slice[0].year;
      groups.push({
        label:
          months.length > 1
            ? `${months[0]} / ${months[1]} ${year}`
            : `${months[0]} ${year}`,
        startIndex: i,
        count: slice.length,
      });
    }
  } else {
    // Standard Month grouping
    timelineDays.value.forEach((day, idx) => {
      if (idx === 0 || day.isFirstOfMonth) {
        groups.push({
          label: `${day.month} ${day.year}`,
          startIndex: idx,
          count: 1,
        });
      } else {
        groups[groups.length - 1].count++;
      }
    });
  }
  return groups;
});

const totalWidth = computed(
  () => timelineDays.value.length * columnWidth.value,
);

// --- Positioning ---
const getTaskPosition = (task: any) => {
  const left =
    diffDays(task._start, timelineRange.value.start) * columnWidth.value;
  const duration = diffDays(task._end, task._start);
  const width = Math.max(duration * columnWidth.value, 30);
  return {
    left: `${left}px`,
    width: `${width}px`,
    _leftVal: left,
    _widthVal: width,
  };
};

const todayOffset = computed(() => {
  const offset =
    diffDays(new Date(), timelineRange.value.start) * columnWidth.value;
  return `${offset}px`;
});

// --- Scroll & Visibility ---
const handleScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  scrollLeft.value = el.scrollLeft;
  containerWidth.value = el.clientWidth;
};

const getTaskNavigation = (task: any) => {
  if (containerWidth.value === 0) return null;
  const pos = getTaskPosition(task);
  const taskLeft = pos._leftVal;
  const taskRight = pos._leftVal + pos._widthVal;

  if (taskRight < scrollLeft.value + 10) return "left";
  if (taskLeft > scrollLeft.value + containerWidth.value - 10) return "right";
  return null;
};

const scrollToTask = (task: any) => {
  if (containerRef.value) {
    const pos = getTaskPosition(task);
    containerRef.value.scrollTo({
      left: pos._leftVal - containerWidth.value / 2 + pos._widthVal / 2,
      behavior: "smooth",
    });
  }
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    scrollLeft.value = containerRef.value.scrollLeft;
    containerWidth.value = containerRef.value.clientWidth;
    containerRef.value.addEventListener("scroll", handleScroll);

    resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (containerRef.value)
    containerRef.value.removeEventListener("scroll", handleScroll);
  if (resizeObserver) resizeObserver.disconnect();
});

// --- Interactions ---
const isDragging = ref(false);
const isResizing = ref<"left" | "right" | null>(null);
const activeTask = ref<any>(null);
const startX = ref(0);
const originalStart = ref<Date | null>(null);
const originalEnd = ref<Date | null>(null);

const handleInteractionStart = (
  e: MouseEvent,
  task: any,
  type: "drag" | "left" | "right",
) => {
  e.preventDefault();
  activeTask.value = task;
  startX.value = e.clientX;
  originalStart.value = new Date(task._start);
  originalEnd.value = new Date(task._end);
  if (type === "drag") isDragging.value = true;
  else isResizing.value = type;
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleInteractionEnd);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!activeTask.value) return;
  const deltaX = e.clientX - startX.value;
  const daysDiff = Math.round(deltaX / columnWidth.value);
  if (isDragging.value) {
    activeTask.value._start = addDays(originalStart.value!, daysDiff);
    activeTask.value._end = addDays(originalEnd.value!, daysDiff);
  } else if (isResizing.value === "left") {
    const newStart = addDays(originalStart.value!, daysDiff);
    if (newStart < activeTask.value._end) activeTask.value._start = newStart;
  } else if (isResizing.value === "right") {
    const newEnd = addDays(originalEnd.value!, daysDiff);
    if (newEnd > activeTask.value._start) activeTask.value._end = newEnd;
  }
};

const handleInteractionEnd = () => {
  if (activeTask.value) emit("update:ticket", activeTask.value);
  isDragging.value = false;
  isResizing.value = null;
  activeTask.value = null;
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleInteractionEnd);
};

// --- Creation ---
const isCreating = ref(false);
const newTicketTitle = ref("");
const createInput = ref<HTMLInputElement | null>(null);

const startCreating = () => {
  isCreating.value = true;
  setTimeout(() => createInput.value?.focus(), 100);
};

const handleCreate = () => {
  if (newTicketTitle.value.trim() && !props.loading) {
    emit("create:ticket", { "card-title": newTicketTitle.value.trim() });
    newTicketTitle.value = "";
    // We don't set isCreating to false here, so the user can see the loading state in the input
  }
};

// Reset creation state when loading finishes
watch(
  () => props.loading,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      isCreating.value = false;
    }
  },
);

const handleBlur = () => {
  if (!newTicketTitle.value.trim()) isCreating.value = false;
};

const goToToday = () => {
  if (containerRef.value) {
    const offset =
      diffDays(new Date(), timelineRange.value.start) * columnWidth.value;
    containerRef.value.scrollTo({
      left: offset - containerRef.value.clientWidth / 2,
      behavior: "smooth",
    });
  }
};

const handleTaskClick = (task: any) => {
  selectedTaskId.value = task._id || task.id;
  emit("select:ticket", task);
};
</script>

<template>
  <div
    class="custom-gantt rounded-[6px] flex m-2 flex-col h-full bg-bg-body overflow-hidden relative"
  >
    <!-- Premium Header (Matching CustomTimelineView) -->
    <div class="flex items-center justify-between pb-2 bg-bg-surface shrink-0 overflow-x-auto"> 
      <div class="flex items-center gap-3 min-w-max">
        <!-- Navigation Capsule -->
        <div
          class="flex items-center bg-bg-surface border border-border rounded-[6px] overflow-hidden h-9"
        >
          <button
            @click="goToToday"
            class="px-4 text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors h-full"
          >
            Today
          </button>
        </div>

        <!-- Stats Info -->
        <div
          class="flex items-center min-w-max text-nowrap gap-1.5 px-3 text-[11px] text-text-secondary font-semibold border-l border-border h-4"
        >
          <i class="fa-regular fa-layer-group text-[10px]"></i>
          <span>{{ allTasks.length }} tasks · {{ allTasks.length }} rows</span>
        </div>
      </div> 
      <!-- Right Side Controls -->
      <div class="flex items-center gap-2">
        <div
          class="flex shrink-0 bg-bg-surface border border-border p-[5px] rounded-[6px] h-10"
        >
          <!-- Zoom Level Switcher (Segmented) -->
          <button
            v-for="mode in ['day', 'week', 'month']"
            :key="mode"
            @click="zoomLevel = mode"
            class="segment-btn p-[1.25rem] whitespace-nowrap"
            :class="{ active: zoomLevel === mode }"
          >
            {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}s
          </button>
        </div>
      </div>
    </div>
    <div class="flex-1 flex flex-col overflow-x-auto scrollbar-visible min-w-0">
      <div class="min-w-[600px] flex-1 flex overflow-hidden">
    <!-- Sidebar -->
      <div
        class="w-80 border-r rounded-tl-[6px] rounded-bl-[6px] border-border bg-bg-body flex flex-col z-30 shadow-sm shrink-0"
      >
        <div
          class="h-[76px] border-b border-border flex items-center px-4 bg-bg-body font-bold text-[11px] text-text-secondary uppercase tracking-wider"
        >
          Work
        </div>
        <div
          class="flex-1 overflow-y-auto scrollbar-hide"
          ref="sidebarRef"
          @scroll="handleSidebarScroll"
        >
          <div
            v-for="task in allTasks"
            :key="task._id"
            @click="handleTaskClick(task)"
            class="h-10 border-b border-border flex items-center px-4 bg-bg-body hover:bg-bg-surface cursor-pointer group transition-colors relative"
            :class="{
              'bg-bg-surface !border-l-2 !border-l-primary-color':
                selectedTaskId === (task._id || task.id),
            }"
          >
            <!-- <input
              type="checkbox"
              class="mr-3 accent-primary-color opacity-30 group-hover:opacity-100"
            /> -->
            <div class="flex items-center gap-2 overflow-hidden">
              <i class="fa-solid fa-bolt text-primary-color text-[10px]"></i>
              <span
                class="text-[11px] font-medium text-text-secondary whitespace-nowrap opacity-70"
                >{{ task._code }}</span
              >
              <span
                class="text-[11px] font-semibold text-text-primary truncate"
                >{{ task._title }}</span
              >
            </div>
          </div>
          <!-- Inline Creation -->
          <div
            v-if="!isCreating"
            @click="startCreating"
            class="h-10 px-4 flex items-center gap-2 text-primary-color text-[11px] font-bold cursor-pointer hover:bg-primary-color/5 transition-colors border-b border-border"
          >
            <i class="fa-solid fa-plus"></i> Create Epic
          </div>
          <div
            v-else
            class="h-10 px-2 border-b border-border bg-bg-surface flex items-center"
          >
            <div
              class="relative flex-1 flex items-center border border-primary-color rounded overflow-hidden bg-bg-card shadow-sm h-7"
            >
              <div class="pl-2 text-primary-color">
                <i class="fa-solid fa-bolt text-[9px]"></i>
              </div>
              <input
                v-model="newTicketTitle"
                ref="createInput"
                @keyup.enter="handleCreate"
                @blur="handleBlur"
                placeholder="What needs to be done?"
                class="flex-1 bg-transparent border-none outline-none px-2 text-[10px] font-medium text-text-primary placeholder:text-text-secondary/50"
              />
              <button
                @click="handleCreate"
                :disabled="props.loading"
                class="px-2 h-full bg-primary-color text-white text-[9px] font-bold hover:brightness-110 transition-all rounded-l-sm shadow-sm flex items-center gap-1"
              >
                <i v-if="props.loading" class="fa-solid fa-spinner fa-spin"></i>
                <span v-else>Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Viewport -->
      <div
        class="flex-1 rounded-tr-[6px] rounded-br-[6px] overflow-x-auto overflow-y-hidden relative bg-bg-body scrollbar-visible"
        ref="containerRef"
      >
        <div
          :style="{ width: `${totalWidth}px` }"
          class="h-full relative flex flex-col"
        >
          <!-- Today vertical line (Moved to top level for correct z-index) -->
          <div
            class="absolute top-[76px] bottom-0 w-px bg-primary-color z-[60] pointer-events-none"
            :style="{ left: todayOffset }"
          >
            <!-- Indicator Dot -->
            <div
              class="absolute -top-[5px] -left-[5px] w-2.5 h-2.5 rounded-full bg-primary-color shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.5)]"
            ></div>
          </div>

          <!-- Header -->
          <div
            class="sticky top-0 z-40 bg-bg-body border-b border-border shadow-sm h-[76px] w-full"
          >
            <div class="flex h-[38px] border-b border-border bg-bg-body">
              <div
                v-for="header in headerGroups"
                :key="header.startIndex"
                class="flex-shrink-0 border-r-2 border-border flex items-center px-4 text-[11px] font-bold text-text-secondary bg-bg-body"
                :style="{ width: `${header.count * columnWidth}px` }"
              >
                {{ header.label }}
              </div>
            </div>
            <div class="flex h-[38px] bg-bg-body">
              <div
                v-for="day in timelineDays"
                :key="day.date.getTime()"
                class="flex-shrink-0 flex flex-col items-center justify-center border-r border-border/20 text-[10px] font-semibold text-text-secondary transition-all"
                :style="{ width: `${columnWidth}px` }"
                :class="{
                  'bg-primary-color/10 !text-primary-color border-b-2 !border-b-primary-color':
                    day.isToday,
                  'border-l-2 border-l-border/60':
                    day.date.getDay() === 1 && zoomLevel === 'week',
                }"
              >
                {{ day.label }}
              </div>
            </div>
          </div>

          <!-- Grid Content -->
          <div
            class="relative overflow-y-auto scrollbar-hide flex-1 bg-bg-surface"
            ref="gridRef"
            @scroll="handleGridScroll"
          >
            <div class="absolute inset-0 z-0 pointer-events-none w-full">
              <div
                v-for="day in timelineDays"
                :key="day.date.getTime()"
                class="absolute top-0 bottom-0 border-r border-border"
                :style="{
                  left: `${diffDays(day.date, timelineRange.start) * columnWidth}px`,
                  width: `${columnWidth}px`,
                }"
                :class="{
                  'bg-bg-surface/30': day.isWeekend,
                  'border-l-2 border-l-border/40':
                    day.date.getDay() === 1 && zoomLevel === 'week',
                }"
              ></div>
            </div>

            <!-- Task Bars Row Container -->
            <div class="relative z-10 bg-bg-surface">
              <div
                v-for="(task, idx) in allTasks"
                :key="task._id"
                @mouseenter="hoveredTaskId = task._id"
                @mouseleave="hoveredTaskId = null"
                class="h-10 border-b border-border relative group/row hover:bg-bg-body"
              >
                <!-- Navigation Arrows (Go to task) -->
                <div
                  v-if="getTaskNavigation(task)"
                  class="absolute z-50 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer group/nav"
                  :style="{
                    left:
                      getTaskNavigation(task) === 'left'
                        ? `${scrollLeft + 8}px`
                        : `${scrollLeft + containerWidth - 32}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }"
                  @click.stop="scrollToTask(task)"
                >
                  <div
                    class="bg-primary-color text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ring-2 ring-bg-surface"
                  >
                    <i
                      class="fa-solid text-[9px]"
                      :class="
                        getTaskNavigation(task) === 'left'
                          ? 'fa-chevron-left'
                          : 'fa-chevron-right'
                      "
                    ></i>
                  </div>

                  <!-- Navigation Tooltip -->
                  <div
                    class="absolute bg-[#1e1e1e] text-white text-[9px] font-bold px-2 py-1 rounded shadow-2xl whitespace-nowrap opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-all border border-white/10 z-[70]"
                    :class="[
                      getTaskNavigation(task) === 'left' ? 'left-0' : 'right-0',
                      idx === 0 ? 'top-full mt-2' : 'bottom-full mb-2',
                    ]"
                  >
                    Go to: {{ formatDate(task._start) }}
                  </div>
                </div>

                <!-- Task Bar -->
                <div
                  class="absolute h-[24px] rounded-sm flex items-center cursor-pointer transition-all top-[8px]"
                  :style="getTaskPosition(task)"
                  @click="handleTaskClick(task)"
                >
                  <div
                    class="relative w-full h-full rounded-sm bg-primary-color hover:brightness-110 group/bar transition-all"
                    @mousedown="handleInteractionStart($event, task, 'drag')"
                  >
                    <!-- Consolidated Floating Date Tooltip -->
                    <div
                      v-if="
                        hoveredTaskId === task._id ||
                        activeTask?._id === task._id
                      "
                      class="absolute left-1/2 -translate-x-1/2 flex items-center z-[110] pointer-events-none whitespace-nowrap"
                      :class="idx === 0 ? 'top-full mt-4' : 'bottom-full mb-2'"
                    >
                      <div
                        class="bg-[#1e1e1e] border border-white/10 text-white text-[10px] px-2.5 py-1.5 rounded-md shadow-2xl flex items-center gap-2 ring-1 ring-black"
                      >
                        <div class="flex flex-col leading-tight">
                          <span
                            class="text-[8px] uppercase opacity-50 font-bold tracking-tighter"
                            >Start</span
                          >
                          <span class="font-medium">{{
                            formatDate(task._start)
                          }}</span>
                        </div>
                        <div class="w-px h-4 bg-white/10 mx-1"></div>
                        <div class="flex flex-col leading-tight">
                          <span
                            class="text-[8px] uppercase opacity-50 font-bold tracking-tighter"
                            >End</span
                          >
                          <span class="font-medium">{{
                            formatDate(task._end)
                          }}</span>
                        </div>
                        <div
                          class="ml-1 px-1.5 py-0.5 bg-primary-color/20 text-primary-color rounded text-[9px] font-black border border-primary-color/30"
                        >
                          {{ diffDays(task._end, task._start) }}d
                        </div>
                      </div>
                    </div>

                    <div
                      class="handle left"
                      @mousedown.stop="
                        handleInteractionStart($event, task, 'left')
                      "
                    ></div>
                    <div
                      class="handle right"
                      @mousedown.stop="
                        handleInteractionStart($event, task, 'right')
                      "
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Alignment Spacer for Creation Area -->
              <div
                class="h-10 border-b border-border relative bg-bg-surface/5"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped> 
.segment-btn {
  padding: 0 0.75rem;
  height: 100%;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  border-radius: 4px;
  transition: all 0.2s;
}
.segment-btn:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
}
.segment-btn.active {
  background-color: var(--primary-color);
  color: white;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-visible::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.scrollbar-visible::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
.scrollbar-visible::-webkit-scrollbar-track {
  background: transparent;
}
.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background: rgba(255, 255, 255, 0.2);
  cursor: ew-resize;
  opacity: 0;
}
.group\/bar:hover .handle {
  opacity: 1;
}
.handle.left {
  left: 0;
}
.handle.right {
  right: 0;
}
input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}
</style>
