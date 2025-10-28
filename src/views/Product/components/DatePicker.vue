<template>
  <div ref="root" class="relative inline-block text-left">
    <!-- Trigger -->
    <button
      type="button"
      class="inline-flex text-xs w-full items-center transition"
      :class="[
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        theme === 'dark' ? 'text-text-secondary' : 'text-text-primary'
      ]"
      @click="toggle"
      :disabled="disabled"
    >
      <span v-if="selectedDate">{{ formattedLabel }}</span>
      <span v-else class="opacity-70">{{ placeholder }}</span>
    </button>

    <!-- Popover -->
    <Teleport to="body">
      <transition name="dp-scale">
        <div
          v-if="open"
          ref="popover"
          class="z-[9999] rounded-xl shadow-lg border p-3 select-none"
          :style="{
            position: 'fixed',
            top: coords.top + 'px',
            left: coords.left + 'px',
            width: POPOVER_W + 'px',
          }"
          :class="theme === 'dark'
            ? 'bg-bg-dropdown border-border text-text-primary'
            : 'bg-bg-dropdown border-border text-text-primary'"
          @keydown.esc.prevent.stop="close"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-2">
            <button class="px-2 py-1 rounded hover:bg-bg-dropdown-menu-hover" @click="prevMonth">‹</button>
            <div class="text-sm font-semibold">{{ monthFormatter.format(viewMonth) }}</div>
            <button class="px-2 py-1 rounded hover:bg-bg-dropdown-menu-hover" @click="nextMonth">›</button>
          </div>

          <!-- Weekdays -->
          <div class="grid grid-cols-7 text-[11px] opacity-60 mb-1">
            <div v-for="d in weekdays" :key="d" class="text-center py-1">{{ d }}</div>
          </div>

          <!-- Days -->
          <div class="grid grid-cols-7 gap-1 max-h-[320px] overflow-auto">
            <div v-for="(box, i) in boxes" :key="i">
              <button
                v-if="box.date"
                class="w-9 h-9 rounded-full text-sm flex items-center justify-center hover:bg-bg-dropdown-menu-hover transition"
                :class="[
                  isSameDay(box.date, today) ? 'ring-1 ring-gray-400' : '',
                  isSameDay(box.date, selectedDate) ? 'bg-bg-card text-text-primary' : '',
                  box.disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''
                ]"
                :disabled="box.disabled"
                @click="pickDate(box.date!)"
              >{{ box.date.getDate() }}</button>
              <div v-else class="w-9 h-9" />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between mt-3">
            <button
              v-if="clearable && selectedDate"
              class="text-xs px-2 py-1 rounded border hover:bg-bg-dropdown-hover"
              :class="theme === 'dark' ? 'border-border' : 'border-border'"
              @click="clear"
            >Clear</button>
            <div class="flex-1"></div>
            <button
              class="text-xs px-3 py-1 rounded border hover:bg-bg-dropdown-menu-hover"
              :class="theme === 'dark' ? 'border-border' : 'border-border'"
              @click="close"
            >Done</button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, nextTick, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string | number | Date | null
  disabled?: boolean
  clearable?: boolean
  minDate?: string | number | Date | null
  maxDate?: string | number | Date | null
  theme?: 'light' | 'dark'
  emitAs?: 'ymd' | 'iso' | 'date'
  placeholder: string
}>(), {
  disabled: false,
  clearable: true,
  theme: 'light',
  emitAs: 'ymd',
})

const emit = defineEmits<{ (e: 'update:modelValue', v: any): void }>()

/** Refs & state **/
const root = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const open = ref(false)
const coords = ref({ top: 0, left: 0 })

/** Sizing / constants **/
const GAP = 8
const POPOVER_W = 280
const ASSUMED_H = 320 // used before measurement

/** Dates **/
const selectedDate = ref<Date | null>(coerceDate(props.modelValue))
const viewMonth = ref<Date>(selectedDate.value ? startOfMonth(selectedDate.value) : startOfMonth(new Date()))
const today = startOfDay(new Date())

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFormatter.format(new Date(2021, 7, i + 1)).slice(0, 2))

watch(() => props.modelValue, (v) => {
  const d = coerceDate(v)
  selectedDate.value = d
  if (d) viewMonth.value = startOfMonth(d)
})

/** Open / close **/
function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      position()
      bind()
    })
  } else {
    unbind()
  }
}
function close() {
  open.value = false
  unbind()
}

/** Positioning: fixed + flip (left/right, above/below) + clamp **/
function position() {
  const btn = root.value?.querySelector('button')
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight

  const mh = (popover.value?.offsetHeight || ASSUMED_H)

  // Horizontal: default align left edge, flip if overflowing
  const canShowRight = vw - rect.left >= POPOVER_W + GAP
  let left = canShowRight ? rect.left : rect.right - POPOVER_W
  // Clamp within viewport
  left = Math.min(Math.max(left, GAP), vw - POPOVER_W - GAP)

  // Vertical: default below, flip above if not enough space
  const canShowBelow = vh - rect.bottom >= mh + GAP
  let top = canShowBelow ? rect.bottom + GAP : rect.top - mh - GAP
  // Clamp vertically (if extremely small viewports)
  top = Math.min(Math.max(top, GAP), vh - mh - GAP)

  coords.value = { top, left }
}

/** Rebind / listeners **/
function bind() {
  // close on outside (capture for reliability)
  document.addEventListener('pointerdown', onOutside, true)
  // reposition on scroll/resize to keep it attached to trigger
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange, true)
}
function unbind() {
  document.removeEventListener('pointerdown', onOutside, true)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange, true)
}
function onViewportChange() {
  if (!open.value) return
  position()
}
function onOutside(e: PointerEvent) {
  const t = e.target as Node
  if (!root.value?.contains(t) && !popover.value?.contains(t)) close()
}
onMounted(() => {
  // In case fonts/images load and change sizes, keep it accurate
  if (open.value) nextTick(position)
})
onBeforeUnmount(unbind)

/** Month nav **/
function prevMonth() { viewMonth.value = addMonths(viewMonth.value, -1) }
function nextMonth() { viewMonth.value = addMonths(viewMonth.value, 1) }

/** Grid **/
const boxes = computed(() => {
  const start = startOfMonth(viewMonth.value)
  const firstWeekday = start.getDay()
  const days = daysInMonth(viewMonth.value)
  const out: Array<{ date: Date | null; disabled?: boolean }> = []

  for (let i = 0; i < firstWeekday; i++) out.push({ date: null })

  const min = coerceDate(props.minDate)
  const max = coerceDate(props.maxDate)
  for (let d = 1; d <= days; d++) {
    const date = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth(), d)
    const disabled = (min && date < startOfDay(min)) || (max && date > startOfDay(max)) || false
    out.push({ date, disabled })
  }

  const remainder = out.length % 7
  if (remainder) for (let i = 0; i < 7 - remainder; i++) out.push({ date: null })
  return out
})

/** Actions **/
function pickDate(d: Date) {
  selectedDate.value = d
  let payload: any
  if (props.emitAs === 'date') payload = d
  else if (props.emitAs === 'iso') payload = d.toISOString()
  else payload = formatYMD(d)
  emit('update:modelValue', payload)
}

function clear() {
  selectedDate.value = null
  emit('update:modelValue', null)
}

/** Label **/
const formattedLabel = computed(() =>
  selectedDate.value
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate.value)
    : ''
)

/** Utils **/
function coerceDate(v: any): Date | null {
  if (!v && v !== 0) return null
  const d = v instanceof Date ? v : new Date(v)
  return isNaN(d.getTime()) ? null : d
}
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function startOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth(), 1); x.setHours(0, 0, 0, 0); return x }
function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() }
function addMonths(d: Date, m: number) { return new Date(d.getFullYear(), d.getMonth() + m, 1) }
function isSameDay(a: Date | null, b: Date | null) {
  return !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }
function formatYMD(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
</script>

<style scoped>
/* Fade + scale popover */
.dp-scale-enter-active,
.dp-scale-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
  transform-origin: top left;
}
.dp-scale-enter-from,
.dp-scale-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>
