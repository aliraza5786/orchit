<template>
  <div ref="root" class="relative inline-block text-left h-full w-full group">
    <!-- Trigger -->
    <button
      type="button"
      class="inline-flex h-full text-xs w-full items-center transition px-2 rounded-sm"
      :class="[
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-surface-hover',
        isDarkTheme ? 'text-text-secondary' : 'text-text-primary'
      ]"
      @click="toggle"
      :disabled="disabled"
    >
      <span class="truncate text-[14px]" v-if="modelValue">
          {{ modelValue }}
      </span>
      <span v-else class="opacity-70 text-[14px] truncate">{{ placeholder }}</span>
    </button>

    <!-- Popover -->
    <Teleport to="body">
      <transition name="dp-scale">
        <div
          v-if="open"
          ref="popover"
          class="z-[9999] rounded-md shadow-lg border p-3 select-none flex gap-4 h-64 w-44"
          :style="{
            position: 'fixed',
            top: coords.top + 'px',
            left: coords.left + 'px',
          }"
          :class="isDarkTheme
            ? 'bg-bg-dropdown border-border text-text-primary'
            : 'bg-bg-dropdown border-border text-text-primary'"
          @keydown.esc.prevent.stop="close"
        >
          <!-- Hours Column -->
          <div class="flex-1 flex flex-col items-center">
            <span class="text-[10px] uppercase text-text-secondary mb-2">Hour</span>
            <div class="flex-1 w-full overflow-y-auto custom-scrollbar pr-1">
              <button
                v-for="h in 24"
                :key="h-1"
                class="w-full py-1 text-sm rounded hover:bg-bg-dropdown-menu-hover transition"
                :class="{ 'bg-accent text-white hover:bg-accent': selectedHour === (h-1) }"
                @click="setHour(h-1)"
              >
                {{ pad(h-1) }}
              </button>
            </div>
          </div>

          <!-- Minutes Column -->
          <div class="flex-1 flex flex-col items-center border-l border-border pl-4">
            <span class="text-[10px] uppercase text-text-secondary mb-2">Min</span>
            <div class="flex-1 w-full overflow-y-auto custom-scrollbar pr-1">
              <button
                v-for="m in 60"
                :key="m-1"
                class="w-full py-1 text-sm rounded hover:bg-bg-dropdown-menu-hover transition"
                :class="{ 'bg-accent text-white hover:bg-accent': selectedMinute === (m-1) }"
                @click="setMinute(m-1)"
              >
                {{ pad(m-1) }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useTheme } from '../../../composables/useTheme';

const { isDark } = useTheme();

const props = withDefaults(defineProps<{
  modelValue: string | null;
  disabled?: boolean;
  theme?: string;
  placeholder: string;
}>(), {
  disabled: false,
  theme: 'system',
});

const emit = defineEmits(['update:modelValue']);

const root = ref<HTMLElement | null>(null);
const popover = ref<HTMLElement | null>(null);
const open = ref(false);
const coords = ref({ top: 0, left: 0 });

const isDarkTheme = computed(() => {
  return props.theme === 'dark' || (props.theme === 'system' && isDark.value);
});

const GAP = 8;
const POPOVER_W = 176; // Match w-44
const ASSUMED_H = 256; // Match h-64

const selectedHour = ref<number>(0);
const selectedMinute = ref<number>(0);

// Parse modelValue (HH:mm)
watch(() => props.modelValue, (val) => {
  if (val && typeof val === 'string' && val.includes(':')) {
    const [h, m] = val.split(':').map(Number);
    selectedHour.value = isNaN(h) ? 0 : h;
    selectedMinute.value = isNaN(m) ? 0 : m;
  }
}, { immediate: true });

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    nextTick(() => {
      position();
      bind();
    });
  } else {
    unbind();
  }
}

function close() {
  open.value = false;
  unbind();
}

function setHour(h: number) {
  selectedHour.value = h;
  updateValue();
}

function setMinute(m: number) {
  selectedMinute.value = m;
  updateValue();
}

function updateValue() {
  const time = `${pad(selectedHour.value)}:${pad(selectedMinute.value)}`;
  emit('update:modelValue', time);
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Positioning logic
function position() {
  const btn = root.value?.querySelector('button');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const mh = (popover.value?.offsetHeight || ASSUMED_H);

  const canShowRight = vw - rect.left >= POPOVER_W + GAP;
  let left = canShowRight ? rect.left : rect.right - POPOVER_W;
  left = Math.min(Math.max(left, GAP), vw - POPOVER_W - GAP);

  const canShowBelow = vh - rect.bottom >= mh + GAP;
  let top = canShowBelow ? rect.bottom + GAP : rect.top - mh - GAP;
  top = Math.min(Math.max(top, GAP), vh - mh - GAP);

  coords.value = { top, left };
}

function bind() {
  document.addEventListener('pointerdown', onOutside, true);
  window.addEventListener('scroll', onViewportChange, true);
  window.addEventListener('resize', onViewportChange, true);
}

function unbind() {
  document.removeEventListener('pointerdown', onOutside, true);
  window.removeEventListener('scroll', onViewportChange, true);
  window.removeEventListener('resize', onViewportChange, true);
}

function onViewportChange() {
  if (open.value) position();
}

function onOutside(e: PointerEvent) {
  const t = e.target as Node;
  if (!root.value?.contains(t) && !popover.value?.contains(t)) close();
}

onBeforeUnmount(unbind);
</script>

<style scoped>
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

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>
