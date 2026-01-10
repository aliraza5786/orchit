<template>
  <div
    :class="isDarkTheme ? 'text-white ' : 'text-text-primary'"
    ref="wrapperRef"
  >
    <!-- Label + Tooltip -->
    <label
      v-if="label" 
      :class="[
        ' font-medium mb-1 flex items-center',
        isDarkTheme ? 'text-white' : 'text-text-primary',
        size == 'md' ? 'text-sm' : size == 'sm' ? 'text-xs' : 'text-base',
      ]"
    >
      {{ label }}
      <span
        v-if="tooltip"
        class="inline-block text-text-secondary -400 ml-1 cursor-help"
        v-tooltip="tooltip"
      >
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Trigger -->
    <div
      ref="triggerRef"
      class="relative px-3 py-2 rounded-md w-full border text-sm  flex justify-between items-center"
      :class="[
        size === 'md' ? 'h-10' : size === 'sm' ? 'h-8 !rounded-md' : 'h-12',
        isDarkTheme
          ? 'bg-bg-input border-border '
          : 'bg-bg-input border-border ',
        error
          ? 'border-red-500 focus-within:ring-red-500'
          : 'focus-within:ring-black',
        disabled ? ' cursor-not-allowed' : 'cursor-pointer'  
      ]"
      @click="toggleDropdown"
      :disabled="disabled"
    >
      <div class="flex items-center gap-2 max-w-full overflow-hidden">
        <img v-if="selected?.icon" :src="selected.icon" class="w-4 h-4" />
        <span
          :class="
            selected
              ? ' line-clamp-1 overflow-ellipsis '
              : 'text-text-secondary line-clamp-1 overflow-ellipsis'
          "
        >
          {{ selected?.title || placeholder }}
        </span>
      </div>
      <svg
        class="w-4 h-4 text-text-secondary"
        fill="none"
        viewBox="0 0 20 20"
        stroke="currentColor"
      >
        <path
          d="M6 8L10 12L14 8"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <!-- Options Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute z-[9999] mt-2 rounded-md max-h-64 overflow-auto shadow border w-full"
        :style="dropdownStyles"
        :class="
          isDarkTheme
            ? 'bg-bg-input text-text-primary border-border'
            : 'bg-bg-input text-text-primary border-border'
        "
      >
        <div v-if="loading" class="flex justify-center items-center py-4">
           <svg class="animate-spin h-5 w-5 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
        <div v-else-if="!options || options.length === 0" class="px-4 py-2 text-sm text-text-secondary text-center">
            No options found
        </div>
        <template v-else>
          <div
            v-for="(option, index) in options"
            :key="option._id ?? index"
            @click="selectOption(option)"
            class="px-4 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-bg-dropdown-menu-hover transition-all duration-150"
            :class="[{ 'bg-bg-dropdown': option._id === selected?._id }, option.customClass]"
          >
            <img v-if="option.icon" :src="option.icon" class="w-4 h-4" />
            <span>{{ option.title }}</span>
          </div>
        </template>
      </div>
    </Teleport>

    <!-- Message -->
    <p
      v-if="message"
      class="mt-2 text-xs"
      :class="
        error
          ? 'text-red-500'
          : isDarkTheme
          ? 'text-text-secondary -400'
          : 'text-text-secondary -500'
      "
    >
      {{ message }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue"; 
import { useTheme } from '../../composables/useTheme';
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';

const { isDark } = useTheme();

interface Option {
  title: string;
  _id: string | number;
  icon?: string;
  customClass?: string;
  isAction?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    options: Option[] | any;
    label?: string;
    defaultValue?: string | number;
    placeholder?: string;
    message?: string;
    error?: boolean;
    size?: "sm" | "md" | "lg";
    tooltip?: string;
    theme?: string;
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    size: "md",
    theme: 'system',
    placeholder: "Select an option...",
    error: false,
    loading: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string | number | null): void;
  (e: "update", v: string | number | null): void;
}>();

import type { CSSProperties } from 'vue';

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref<CSSProperties>({ top: "-9999px", left: "-9999px", width: "100%", position: 'fixed' });
const selected = ref<Option | null>(null);

const isDarkTheme = computed(() => {
  return props.theme === 'dark' || (props.theme === 'system' && isDark.value);
});

// Floating UI cleanup function
let cleanupFloating: (() => void) | null = null;

/** Handle click outside **/
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (
    !wrapperRef.value?.contains(target) &&
    !dropdownRef.value?.contains(target)
  ) {
    closeDropdown();
  }
}

function addOutsideListener() {
  document.addEventListener("mousedown", handleClickOutside);
}

function removeOutsideListener() {
  document.removeEventListener("mousedown", handleClickOutside);
}

onBeforeUnmount(() => {
  removeOutsideListener();
  if (cleanupFloating) cleanupFloating();
});

function closeDropdown() {
  isOpen.value = false;
  removeOutsideListener();
  if (cleanupFloating) {
    cleanupFloating();
    cleanupFloating = null;
  }
}

function updatePosition() {
  if (!triggerRef.value || !dropdownRef.value) return;

  computePosition(triggerRef.value, dropdownRef.value, {
    placement: 'bottom-start',
    strategy: 'fixed', // Fixed because we are teleporting to body
    middleware: [
      offset(({ placement }) => placement.startsWith('top') ? 17 : 5),
      flip(),
      shift({ padding: 5 })
    ],
  }).then(({ x, y, strategy }) => {
    // Also sync width
    const width = triggerRef.value?.getBoundingClientRect().width;
    dropdownStyles.value = {
      top: `${y}px`,
      left: `${x}px`,
      width: `${width}px`,
      position: strategy as 'fixed' | 'absolute', // Cast to valid CSS position
    };
  });
}

function toggleDropdown() {
   if (props.disabled) return;
  
  if (isOpen.value) {
    closeDropdown();
  } else {
    isOpen.value = true;
    
    // Start floating-ui autoUpdate
    // We use a small timeout or nextTick to ensure the dropdown element is rendered
    // before we try to position it.
    setTimeout(() => {
        if (triggerRef.value && dropdownRef.value) {
            cleanupFloating = autoUpdate(
                triggerRef.value, 
                dropdownRef.value, 
                updatePosition
            );
            addOutsideListener();
        }
    }, 0);
  }
}

function selectOption(option: Option) {
  if (option.isAction) {
    emit("update:modelValue", option._id);
    emit("update", option._id);
    closeDropdown();
    return;
  }
 
  selected.value = option;
  emit("update:modelValue", option._id);
  emit("update", option._id);
  closeDropdown();
}

/** Sync logic **/
function initSelection() {
  const initial = props.modelValue ?? props.defaultValue;

  if (initial !== undefined && initial !== null) {
    const found = props.options.find(
      (o: any) => o._id === initial || o.title == initial
    );

    if (found) {
      selected.value = found;
      if (props.modelValue == null && props.defaultValue != null) {
        emit("update:modelValue", found._id);
      }
    } else selected.value = null;
  } else selected.value = null;
}

onMounted(() => initSelection());

watch([() => props.modelValue, () => props.options], ([newVal, newOpts]) => {
    if (newVal === null || newVal === undefined) {
        selected.value = null;
        return;
    }
    const found = (newOpts || []).find((opt: Option) => String(opt._id) === String(newVal));
    if (found) {
        selected.value = found;
    } else {
        selected.value = null;
    }
}, { immediate: true, deep: true });
</script>