<template>
  <div :class="theme === 'dark' ? 'text-white ' : 'text-text-primary'" ref="wrapperRef">
    <!-- Label + Tooltip -->
    <label v-if="label"
      :class="[' font-medium mb-1 flex items-center', theme === 'dark' ? 'text-white' : 'text-text-primary', size == 'md' ? 'text-sm' : size == 'sm' ? 'text-xs' : 'text-base']">
      {{ label }}
      <span v-if="tooltip" class="inline-block text-text-secondary -400 ml-1 cursor-help" :title="tooltip">
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Trigger -->
    <div ref="triggerRef"
      class="relative px-3 py-2 rounded-xl w-full border text-sm cursor-pointer flex justify-between items-center"
      :class="[
        size === 'md' ? 'h-10': size === 'sm' ? 'h-8 !rounded-md' : 'h-12',
        theme === 'dark' ? 'bg-bg-input border-border ' : 'bg-bg-input border-border ',
        error ? 'border-red-500 focus-within:ring-red-500' : 'focus-within:ring-black'
      ]" @click="toggleDropdown">
      <div class="flex items-center gap-2 max-w-full">
        <img v-if="selected?.icon" :src="selected.icon" class="w-4 h-4" />
        <span :class="selected ? ' line-clamp-1 overflow-ellipsis ' : 'text-text-secondary'">
          {{ selected?.title || placeholder }}
        </span>
      </div>
      <svg class="w-4 h-4 text-text-secondary " fill="none" viewBox="0 0 20 20" stroke="currentColor">
        <path d="M6 8L10 12L14 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <!-- Options Dropdown -->
    <Teleport to="body">
      <div v-if="isOpen" class="absolute z-50 mt-2 rounded-md max-h-64 overflow-auto shadow border w-full"
        :style="dropdownStyles"
        :class="theme === 'dark' ? 'bg-bg-input text-text-primary border-border ' : 'bg-bg-input text-text-primary border-border'">
        <div v-for="(option, index) in options" :key="option._id ?? index" @click="selectOption(option)"
          class="px-4 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-bg-dropdown-menu-hover transition-all duration-150"
          :class="{ 'bg-bg-dropdown ': option._id === selected?._id }">
          <img v-if="option.icon" :src="option.icon" class="w-4 h-4" />
          <span>{{ option.title }}</span>
        </div>
      </div>
    </Teleport>

    <!-- Message -->
    <p v-if="message" class="mt-2 text-xs"
      :class="error ? 'text-red-500' : theme === 'dark' ? 'text-text-secondary -400' : 'text-text-secondary -500'">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

interface Option {
  title: string
  _id: string | number
  icon?: string
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: Option[] | any
  label?: string
  defaultValue?: string | number
  placeholder?: string
  message?: string
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
  theme?: 'light' | 'dark'
}>(), {
  size: 'md',
  theme: 'light',
  placeholder: 'Select an option...',
  error: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void
}>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownStyles = ref({ top: '0px', left: '0px', width: '100%' })
const selected = ref<Option | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  // dropdown is teleported, so only clicks inside the trigger/wrapper should keep it open
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  initSelection() // initialize from modelValue/defaultValue once mounted
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) return
  nextTick(() => {
    if (triggerRef.value) {
      const rect = triggerRef.value.getBoundingClientRect()
      dropdownStyles.value = {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
      }
    }
  })
}

function selectOption(option: Option) {
  selected.value = option
  emit('update:modelValue', option._id)
  isOpen.value = false
}

/** Initialize/Sync selection */
function initSelection() {
  const initial = props.modelValue ?? props.defaultValue
  if (initial !== undefined && initial !== null) {
    const found = props.options.find((o:any) => o._id === initial)
    if (found) {
      selected.value = found
      // only emit if parent hasn't provided a modelValue
      if (props.modelValue == null && props.defaultValue != null) {
        emit('update:modelValue', found._id)
      }
    } else {
      selected.value = null
    }
  } else {
    selected.value = null
  }
}

// react when modelValue changes from parent
watch(() => props.modelValue, (val) => {
  if (val === null || val === undefined) {
    selected.value = null
  } else {
    const hit = props.options.find((o :any)=> o._id === val)
    selected.value = hit ?? null
  }
})

// if options arrive async, (re)try initialization
watch(() => props.options, () => {
  // re-evaluate selection when options update
  const byModel = props.options.find((o :any)=> o._id === props.modelValue)
  if (byModel) {
    selected.value = byModel
  } else {
    initSelection()
  }
}, { deep: true })
</script>
