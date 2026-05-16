<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  defineAsyncComponent,
  nextTick,
} from "vue";

const Collaborators = defineAsyncComponent(
  () => import("../../components/ui/Collaborators.vue"),
);

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
const gridRef = ref<HTMLElement | null>(null);       // horizontal scroll container (timeline canvas)
const sidebarRef = ref<HTMLElement | null>(null);    // vertical scroll container (sidebar rows)
const hoveredTaskId = ref<string | null>(null);
const scrollLeft = ref(0);
const containerWidth = ref(0);
const selectedTask = ref<any>(null);
const selectedTaskId = ref<string | null>(null);
const sidebarWidth = 280;

// --- Scroll Syncing (same pattern as Gantt) ---
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
  const el = e.target as HTMLElement;
  // Sync horizontal scroll state
  scrollLeft.value = el.scrollLeft;
  containerWidth.value = el.clientWidth;

  // Sync vertical scroll to sidebar
  if (isSyncingGrid) {
    isSyncingGrid = false;
    return;
  }
  isSyncingSidebar = true;
  if (sidebarRef.value)
    sidebarRef.value.scrollTop = el.scrollTop;
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
  });
};

// --- Data Normalization ---
const allTasks = computed(() => {
  const tasks: any[] = [];
  if (!props.data) return tasks;

  props.data.forEach((item: any) => {
    if (item.cards && Array.isArray(item.cards)) tasks.push(...item.cards);
    else if (item._id || item.id || item["card-title"]) tasks.push(item);
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
        _color: task.style?.bg_color || "#6366F1",
        _assignees: task.users || task.assignees || [],
      };
    },
  );
});

// --- Smart Packing (kept for row count stat in header) ---
const packedTracks = computed(() => {
  const tasks = [...allTasks.value].sort(
    (a, b) => a._start.getTime() - b._start.getTime(),
  );
  const tracks: any[][] = [];
  for (const task of tasks) {
    let placed = false;
    for (const track of tracks) {
      const maxEnd = Math.max(...track.map((t) => t._end.getTime()));
      if (task._start.getTime() >= maxEnd + 1000 * 60 * 60 * 24) {
        track.push(task);
        placed = true;
        break;
      }
    }
    if (!placed) tracks.push([task]);
  }
  return tracks;
});

// --- Timeline Calculation ---
const timelineRange = computed(() => {
  const now = new Date();
  const taskDates = allTasks.value.flatMap((t) => [
    t._start.getTime(),
    t._end.getTime(),
  ]);

  let minDate = now.getTime();
  let maxDate = now.getTime();

  if (taskDates.length > 0) {
    minDate = Math.min(minDate, ...taskDates);
    maxDate = Math.max(maxDate, ...taskDates);
  }

  const start = new Date(minDate);
  const end = new Date(maxDate);

  return {
    start: normalizeDate(addDays(start, -30)),
    end: normalizeDate(addDays(end, 90)),
  };
});

const columnWidth = computed(
  () => ({ day: 140, week: 60, month: 24 })[zoomLevel.value] || 60,
);

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
      isSunday: d.getDay() === 0,
      isMonday: d.getDay() === 1,
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
    for (let i = 0; i < timelineDays.value.length; i += 7) {
      const slice = timelineDays.value.slice(i, i + 7);
      if (!slice.length) break;
      const months = [...new Set(slice.map((d) => d.month))];
      groups.push({
        label:
          months.length > 1
            ? `${months[0]} / ${months[1]} ${slice[0].year}`
            : `${months[0]} ${slice[0].year}`,
        startIndex: i,
        count: slice.length,
      });
    }
  } else {
    timelineDays.value.forEach((day, idx) => {
      if (idx === 0 || day.isFirstOfMonth)
        groups.push({
          label: `${day.month} ${day.year}`,
          startIndex: idx,
          count: 1,
        });
      else groups[groups.length - 1].count++;
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
  const width = Math.max(duration * columnWidth.value, 40);
  return {
    left: `${left}px`,
    width: `${width}px`,
    _leftVal: left,
    _widthVal: width,
  };
};

const todayOffset = computed(() => {
  return `${diffDays(new Date(), timelineRange.value.start) * columnWidth.value}px`;
});

// --- Visibility helpers ---
const getTaskNavigation = (task: any) => {
  if (containerWidth.value === 0) return null;
  const pos = getTaskPosition(task);
  if (pos._leftVal + pos._widthVal < scrollLeft.value + 10) return "left";
  if (pos._leftVal > scrollLeft.value + containerWidth.value - 10)
    return "right";
  return null;
};

const scrollToTask = (task: any) => {
  if (gridRef.value) {
    const pos = getTaskPosition(task);
    gridRef.value.scrollTo({
      left: pos._leftVal - containerWidth.value / 2 + pos._widthVal / 2,
      behavior: "smooth",
    });
  }
};

// --- Lifecycle ---
let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  if (gridRef.value) {
    scrollLeft.value = gridRef.value.scrollLeft;
    containerWidth.value = gridRef.value.clientWidth;
    resizeObserver = new ResizeObserver((entries) => {
      for (let e of entries) containerWidth.value = e.contentRect.width;
    });
    resizeObserver.observe(gridRef.value);
  }
  setTimeout(goToToday, 100);
});

watch([timelineRange, zoomLevel], () => {
  nextTick(() => goToToday());
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
});

// --- Drag & Resize ---
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
  const daysDiff = Math.round((e.clientX - startX.value) / columnWidth.value);
  if (isDragging.value) {
    activeTask.value._start = addDays(originalStart.value!, daysDiff);
    activeTask.value._end = addDays(originalEnd.value!, daysDiff);
  } else if (isResizing.value === "left") {
    const ns = addDays(originalStart.value!, daysDiff);
    if (ns < activeTask.value._end) activeTask.value._start = ns;
  } else if (isResizing.value === "right") {
    const ne = addDays(originalEnd.value!, daysDiff);
    if (ne > activeTask.value._start) activeTask.value._end = ne;
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

const goToToday = () => {
  if (gridRef.value) {
    const offset =
      diffDays(new Date(), timelineRange.value.start) * columnWidth.value;
    gridRef.value.scrollTo({
      left: offset - gridRef.value.clientWidth / 2,
      behavior: "smooth",
    });
  }
};

// --- Create Epic ---
const isCreating = ref(false);
const newEpicTitle = ref("");
const createInput = ref<HTMLInputElement | null>(null);

const startCreating = () => {
  isCreating.value = true;
  setTimeout(() => createInput.value?.focus(), 100);
};

const handleCreate = () => {
  if (newEpicTitle.value.trim() && !props.loading) {
    emit("create:ticket", { "card-title": newEpicTitle.value.trim() });
    newEpicTitle.value = "";
  }
};

const handleCreateBlur = () => {
  if (!newEpicTitle.value.trim()) isCreating.value = false;
};

watch(
  () => props.loading,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) isCreating.value = false;
  },
);

const handleTaskClick = (task: any) => {
  selectedTaskId.value = task._id || task.id;
  selectedTask.value = task;
  emit("select:ticket", task);
};
</script>

<template>
  <div
    class="flex flex-col m-2 rounded-[6px] h-full bg-bg-body overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 bg-bg-surface shrink-0 overflow-x-auto">
      <div class="flex items-center gap-3 min-w-max">
        <!-- Navigation Capsule -->
        <div
          class="flex items-center bg-bg-surface border border-border rounded-[6px] overflow-hidden h-9"
        >
          <button
            @click="goToToday"
            class="px-4 text-[11px] font-bold text-text-secondary hover:text-text-primary transition-colors h-full border-border"
          >
            Today
          </button>
        </div>

        <!-- Stats Info -->
        <div
          class="flex items-center min-w-max text-nowrap gap-1.5 px-3 text-[11px] text-text-secondary font-semibold border-l border-border h-4"
        >
          <i class="fa-regular fa-layer-group text-[10px]"></i>
          <span>{{ allTasks.length }} tasks · {{ packedTracks.length }} rows</span>
        </div>
      </div>

      <!-- Right Side Controls -->
      <div class="flex items-center gap-2">
        <div
          class="flex shrink-0 bg-bg-surface border border-border p-[5px] rounded-[6px] h-10"
        >
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

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex-1 flex flex-col items-center justify-center gap-3"
    >
      <div
        class="w-8 h-8 border-3 border-border border-t-primary-color rounded-full animate-spin"
      ></div>
      <span class="text-sm text-text-secondary font-medium">Loading timeline…</span>
    </div>

    <template v-else>
      <!-- Layout: sidebar + timeline — same structure as Gantt -->
      <div class="flex-1 flex overflow-x-auto scrollbar-visible min-w-0">
        <div class="min-w-[600px] flex-1 flex overflow-hidden">

          <!-- ═══ LEFT SIDEBAR ═══ -->
          <aside
            class="flex flex-col border-r border-border bg-bg-body z-30 shrink-0 shadow-sm"
            :style="{ width: sidebarWidth + 'px' }"
          >
            <!-- Sidebar header — height matches timeline header (81px) -->
            <div
              class="h-[81px] border-b border-border flex items-center px-4 bg-bg-body shrink-0"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Work</span>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-bg-surface text-text-secondary border border-border">
                  {{ allTasks.length }}
                </span>
              </div>
            </div>

            <!-- Sidebar rows — vertical scroll only, synced to gridRef -->
            <div
              class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
              ref="sidebarRef"
              @scroll="handleSidebarScroll"
            >
              <div
                v-for="task in allTasks"
                :key="task._id"
                class="group border-b border-border hover:bg-bg-surface transition-all duration-150 cursor-pointer relative"
                :class="{
                  'bg-bg-surface !border-l-[3px] !border-l-primary-color':
                    selectedTaskId === (task._id || task.id),
                  'bg-bg-surface/50': hoveredTaskId === task._id,
                }"
                @click="handleTaskClick(task)"
                @mouseenter="hoveredTaskId = task._id"
                @mouseleave="hoveredTaskId = null"
              >
                <div class="flex items-center h-10 px-4 gap-2.5">
                  <div
                    class="w-1 h-1 rounded-full shrink-0"
                    :style="{ backgroundColor: task._color }"
                  ></div>
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <i class="fa-solid fa-bolt text-primary-color text-[10px] shrink-0"></i>
                    <span class="text-[11px] font-medium text-text-secondary whitespace-nowrap opacity-70 shrink-0">
                      {{ task._code }}
                    </span>
                    <span class="text-[11px] font-semibold text-text-primary truncate flex-1">
                      {{ task._title }}
                    </span>
                  </div>
                  <Collaborators
                    v-if="task._assignees?.length"
                    :avatars="task._assignees"
                    size="5"
                    class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </div>

                <!-- Hover details -->
                <div
                  v-if="hoveredTaskId === task._id || task._id === selectedTask?._id"
                  class="px-4 pb-2 flex items-center gap-2 text-[10px] text-text-secondary border-t border-border/30 pt-1.5 bg-bg-body/50"
                >
                  <div class="flex items-center gap-1.5">
                    <i class="fa-regular fa-calendar text-[9px]"></i>
                    <span class="font-medium">{{ formatDate(task._start) }}</span>
                  </div>
                  <i class="fa-solid fa-arrow-right text-[8px] opacity-40"></i>
                  <div class="flex items-center gap-1.5">
                    <i class="fa-regular fa-calendar-check text-[9px]"></i>
                    <span class="font-medium">{{ formatDate(task._end) }}</span>
                  </div>
                  <div class="ml-auto flex items-center gap-2">
                    <span class="font-bold text-primary-color">
                      {{ diffDays(task._end, task._start) }}d
                    </span>
                    <div
                      v-if="task._progress > 0"
                      class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      :class="
                        task._progress === 100
                          ? 'text-green-500 bg-green-500/10 border border-green-500/30'
                          : 'text-text-secondary bg-bg-surface border border-border'
                      "
                    >
                      {{ task._progress }}%
                    </div>
                  </div>
                </div>
              </div>

              <!-- Create Epic row -->
              <div
                v-if="!isCreating"
                class="h-10 px-4 flex items-center gap-2 text-primary-color text-[11px] font-bold cursor-pointer hover:bg-primary-color/5 transition-colors border-b border-border"
                @click="startCreating"
              >
                <i class="fa-solid fa-plus"></i>
                <span>Create Epic</span>
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
                    v-model="newEpicTitle"
                    ref="createInput"
                    @keyup.enter="handleCreate"
                    @blur="handleCreateBlur"
                    placeholder="What needs to be done?"
                    class="flex-1 bg-transparent border-none outline-none px-2 text-[10px] font-medium text-text-primary placeholder:text-text-secondary/50"
                  />
                  <button
                    @click.stop="handleCreate"
                    :disabled="props.loading"
                    class="px-2 h-full bg-primary-color text-white text-[9px] font-bold hover:brightness-110 transition-all rounded-l-sm shadow-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <i v-if="props.loading" class="fa-solid fa-spinner fa-spin"></i>
                    <span v-else>Create</span>
                  </button>
                </div>
              </div>

              <!-- Bottom spacer -->
              <div class="h-20"></div>
            </div>
          </aside>

          <!-- ═══ TIMELINE CANVAS ═══ -->
          <!-- gridRef: horizontal scroll (timeline) + vertical scroll (synced to sidebar) -->
          <div
            class="flex-1 overflow-x-auto overflow-y-auto scrollbar-visible relative bg-bg-body"
            ref="gridRef"
            @scroll="handleGridScroll"
          >
            <div
              class="relative flex flex-col"
              :style="{ width: totalWidth + 'px' }"
            >
              <!-- Today vertical line -->
              <div
                class="absolute top-[81px] bottom-0 w-px bg-primary-color z-[60] pointer-events-none"
                :style="{ left: todayOffset }"
              >
                <div
                  class="absolute -top-[5px] -left-[5px] w-2.5 h-2.5 rounded-full bg-primary-color shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.5)]"
                ></div>
              </div>

              <!-- ─── HEADER (sticky top) ─── -->
              <div class="sticky top-0 z-40 bg-bg-body border-b border-border shadow-sm">
                <!-- Month / Week groups row -->
                <div class="flex h-10 border-b border-border">
                  <div
                    v-for="(group, idx) in headerGroups"
                    :key="idx"
                    class="flex items-center px-4 border-r-2 border-border bg-bg-body shrink-0"
                    :style="{ width: group.count * columnWidth + 'px' }"
                  >
                    <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                      {{ group.label }}
                    </span>
                  </div>
                </div>

                <!-- Days row -->
                <div class="flex h-10">
                  <div
                    v-for="day in timelineDays"
                    :key="day.date.getTime()"
                    class="flex flex-col items-center justify-center border-r border-border/30 shrink-0 relative transition-colors"
                    :style="{ width: columnWidth + 'px' }"
                    :class="{
                      'bg-primary-color/10 !text-primary-color border-b-2 !border-b-primary-color': day.isToday,
                      'bg-border/20': day.isWeekend && !day.isToday,
                      'border-l-2 border-l-border': day.isMonday && zoomLevel === 'week',
                    }"
                  >
                    <span
                      class="text-xs font-bold transition-colors"
                      :class="day.isToday ? 'text-primary-color' : 'text-text-secondary'"
                    >
                      {{ day.label }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- ─── GRID BODY ─── -->
              <div class="relative min-h-[400px]">
                <!-- Background column stripes -->
                <div class="absolute inset-0 pointer-events-none z-0">
                  <div
                    v-for="day in timelineDays"
                    :key="day.date.getTime()"
                    class="absolute top-0 bottom-0 border-r border-dashed border-border/40"
                    :style="{
                      left: diffDays(day.date, timelineRange.start) * columnWidth + 'px',
                      width: columnWidth + 'px',
                    }"
                    :class="{
                      'bg-border/10': day.isWeekend,
                      'border-l-2 border-l-border/60 border-solid': day.isMonday && zoomLevel === 'week',
                    }"
                  ></div>
                </div>

                <!-- Track rows — one row per task, aligned 1:1 with sidebar -->
                <div class="relative z-10">
                  <div
                    v-for="(task, taskIdx) in allTasks"
                    :key="'track-' + task._id"
                    class="border-b border-border relative h-[41px] transition-colors hover:bg-bg-body bg-bg-surface group/row"
                  >
                    <!-- Task bar wrapper -->
                    <div
                      class="absolute top-0 h-full flex items-center"
                      :style="{
                        left: getTaskPosition(task).left,
                        width: getTaskPosition(task).width,
                      }"
                      @mouseenter="hoveredTaskId = task._id"
                      @mouseleave="hoveredTaskId = null"
                    >
                      <!-- Off-screen navigation arrow -->
                      <div
                        v-if="getTaskNavigation(task)"
                        class="absolute z-50 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer group/nav"
                        :style="{
                          left:
                            getTaskNavigation(task) === 'left'
                              ? `calc(-${getTaskPosition(task).left} + ${scrollLeft + 8}px)`
                              : `calc(-${getTaskPosition(task).left} + ${scrollLeft + containerWidth - 32}px)`,
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
                            taskIdx === 0 ? 'top-full mt-2' : 'bottom-full mb-2',
                          ]"
                        >
                          Go to: {{ formatDate(task._start) }}
                        </div>
                      </div>

                      <!-- Task Bar -->
                      <div
                        class="absolute h-[24px] rounded-sm flex items-center cursor-pointer transition-all top-1/2 -translate-y-1/2 w-full"
                        @click="handleTaskClick(task)"
                      >
                        <div
                          class="relative w-full h-full rounded-sm bg-primary-color hover:brightness-110 group/bar transition-all"
                          :style="{ backgroundColor: task._color }"
                          @mousedown="handleInteractionStart($event, task, 'drag')"
                        >
                          <div
                            class="handle left"
                            @mousedown.stop="handleInteractionStart($event, task, 'left')"
                          ></div>
                          <div
                            class="handle right"
                            @mousedown.stop="handleInteractionStart($event, task, 'right')"
                          ></div>
                        </div>
                      </div>

                      <!-- Hover tooltip -->
                      <Transition name="fade-scale">
                        <div
                          v-if="hoveredTaskId === task._id || activeTask?._id === task._id"
                          class="absolute left-1/2 -translate-x-1/2 z-[110] pointer-events-none whitespace-nowrap"
                          :class="taskIdx === 0 ? 'top-full mt-2' : 'bottom-full mb-2'"
                        >
                          <div
                            class="bg-[#1e1e1e] border border-white/10 text-white text-[10px] px-2.5 py-1.5 rounded-md shadow-2xl flex items-center gap-2 ring-1 ring-black"
                          >
                            <div class="flex flex-col leading-tight">
                              <span class="text-[8px] uppercase opacity-50 font-bold tracking-tighter">Start</span>
                              <span class="font-medium">{{ formatDate(task._start) }}</span>
                            </div>
                            <div class="w-px h-4 bg-white/10 mx-1"></div>
                            <div class="flex flex-col leading-tight">
                              <span class="text-[8px] uppercase opacity-50 font-bold tracking-tighter">End</span>
                              <span class="font-medium">{{ formatDate(task._end) }}</span>
                            </div>
                            <div
                              class="ml-1 px-1.5 py-0.5 bg-primary-color/20 text-primary-color rounded text-[9px] font-black border border-primary-color/30"
                            >
                              {{ diffDays(task._end, task._start) }}d
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>

                  <!-- Breathing space -->
                  <div class="h-20"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
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

/* Scrollbar — sidebar hides it, grid shows it (matching Gantt) */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-visible::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.scrollbar-visible::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
.scrollbar-visible::-webkit-scrollbar-track {
  background: transparent;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px) scale(0.95);
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
</style>