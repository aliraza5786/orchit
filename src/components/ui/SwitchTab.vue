<template>
  <div class="relative w-full select-none overflow-x-auto" role="tablist" @keydown="onKeydown">
    <!-- Track with bottom border only -->
    <div ref="trackRef" class="flex w-full gap-2 border-b border-border "
      :class="disabled ? 'opacity-60 pointer-events-none' : ''">
      <button v-for="(option, i) in options" :key="option.value" :ref="(el: any) => setBtnRef(el, i)" role="tab"
        :aria-selected="modelValue === option.value" :tabindex="modelValue === option.value ? 0 : -1"
        @click="choose(option.value)" @mouseenter="hovered = i" @mouseleave="hovered = null" class="relative px-3 py-2 rounded-md text-sm font-medium transition-colors
               text-text-secondary hover:text-text-primary
               focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        :class="modelValue === option.value ? 'text-text-primary' : ''">
        {{ option.label }}
      </button>
    </div>

    <!-- Bottom indicator -->
    <div class="absolute bottom-0 h-[2px] bg-accent rounded-full
             transition-[transform,width] duration-300" :style="indicatorStyle" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'

type Opt = { label: string; value: string }

const props = withDefaults(defineProps<{
  modelValue: string
  options: Opt[]
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>(), {
  size: 'md',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

/* ---------- refs & measurements ---------- */
const trackRef = ref<HTMLElement | null>(null)
const btnRefs = ref<HTMLElement[]>([])
function setBtnRef(el: HTMLElement | null, i: number) {
  if (!el) return
  btnRefs.value[i] = el
}

const hovered = ref<number | null>(null)
const indicatorLeft = ref(0)
const indicatorWidth = ref(0)

function recalc() {
  const track = trackRef.value
  if (!track) return
  const idx = Math.max(0, props.options.findIndex(o => o.value === props.modelValue))
  const btn = btnRefs.value[idx]
  if (!btn) return
  const tr = track.getBoundingClientRect()
  const br = btn.getBoundingClientRect()
  indicatorLeft.value = br.left - tr.left
  indicatorWidth.value = br.width
}

const indicatorStyle = computed(() => ({
  width: `${indicatorWidth.value}px`,
  transform: `translateX(${indicatorLeft.value}px)`
}))

/* ---------- events ---------- */
function choose(v: string) {
  if (props.disabled) return
  if (v !== props.modelValue) emit('update:modelValue', v)
}
function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  const count = props.options.length
  const curr = Math.max(0, props.options.findIndex(o => o.value === props.modelValue))
  const next = (curr + (e.key === 'ArrowRight' ? 1 : -1) + count) % count
  emit('update:modelValue', props.options[next].value)
}

/* ---------- lifecycle ---------- */
let ro: ResizeObserver | null = null
function attachObservers() {
  if (trackRef.value) {
    ro = new ResizeObserver(() => recalc())
    ro.observe(trackRef.value)
  }
  window.addEventListener('resize', recalc)
}
function detachObservers() {
  ro?.disconnect()
  ro = null
  window.removeEventListener('resize', recalc)
}

onMounted(async () => {
  await nextTick()
  attachObservers()
  recalc()
})
onBeforeUnmount(detachObservers)

watch(() => [props.modelValue, props.options], async () => {
  await nextTick()
  recalc()
}, { deep: true })
</script>

<style scoped>
/* Smooth, slightly springy indicator motion */
:where(.transition-\[transform, width\]) {
  transition-timing-function: cubic-bezier(.2, .7, .2, 1.1);
}
</style>
