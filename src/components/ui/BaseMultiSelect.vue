<template>
  <div :class="theme === 'dark' ? 'text-white' : 'text-text-primary'" class="relative" ref="wrapperRef">
    <!-- Label + Tooltip -->
    <label
      v-if="label"
      :class="[
        'text-base font-medium mb-1 flex items-center',
        theme === 'dark' ? 'text-white' : 'text-text-primary'
      ]"
    >
      {{ label }}
      <span v-if="tooltip" class="inline-block text-text-secondary  ml-1 cursor-help" :title="tooltip">
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Field (anchor) -->
    <div
      ref="anchorRef"
      class="relative px-3 py-2 rounded-xl overflow-x-auto w-full border text-sm"
      :class="[
        size === 'md' ? 'h-10' : 'h-12',
        theme === 'dark' ? 'bg-bg-input border-border' : 'bg-bg-input border-border ',
        error ? 'border-red-500 focus-within:ring-red-500' : 'focus-within:ring-black'
      ]"
      @mousedown.self="openDropdown"   
    >
      <div class="flex flex-nowrap gap-1 h-full">
        <!-- Selected Tags -->
        <span
          v-for="item in selectedOptions"
          :key="item._id"
          class="bg-bg-body text-text-primary px-2 text-nowrap py-1 rounded text-xs flex items-center gap-1"
        >
          {{ item.title }}
          <span @click.stop="remove(item._id)" class="cursor-pointer">✕</span>
        </span>

        <!-- Input Field -->
        <input
          ref="inputRef"
          class="outline-none flex-1 bg-transparent text-sm h-full"
          :placeholder="selectedOptions.length ? '' : placeholder"
          v-model="search"
          @focus="openDropdown"
          @input="onInput"
          @keydown.enter.prevent="handleEnter"
          :class="theme == 'dark' ? '!text-white placeholder-white/60' : 'text-text-primary placeholder-gray-400'"
        />
      </div>
    </div>

    <!-- Dropdown -->
    <ul
      v-show="open && filteredOptions.length > 0"
      ref="menuRef"
      class="absolute left-0 z-10 text-sm p-2 border rounded-md shadow max-h-40 overflow-auto w-full"
      :class="[
        theme === 'dark' ? 'bg-[#131318] text-white border-border' : 'bg-bg-dropdown text-text-primary border-border',
        dropUp ? 'bottom-[76%] ' : 'top-full '
      ]"
    >
      <li
        v-for="item in filteredOptions"
        :key="item._id"
        class="px-3 py-2 rounded-lg cursor-pointer"
        :class="theme === 'dark' ? 'hover:bg-[#000000de]' : 'hover:bg-bg-dropdown-menu-hover'"
        @mousedown.prevent
        @click.stop="select(item)"
      >
        <span v-html="item.title"></span>
      </li>
    </ul>

    <!-- No Options Found -->
    <ul
      v-show="open && filteredOptions.length === 0"
      class="absolute left-0 z-10 p-2 border rounded shadow w-full"
      :class="[
        theme === 'dark' ? 'bg-bg-dropdown text-text-primary border-border' : 'bg-bg-dropdown border-border',
        dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
      ]"
    >
      <li class="px-3 py-2 text-sm text-text-secondary ">No options found</li>
    </ul>

    <!-- Help/Error Text -->
    <p
      v-if="message"
      class="mt-2 text-xs flex items-center gap-1"
      :class="error ? 'text-red-500' : theme === 'dark' ? 'text-text-secondary ' : 'text-text-secondary '"
    >
      <slot v-if="$slots.msgIcon" name="msgIcon" /> {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

interface Option {
  title: string
  _id: string | number
}

const props = withDefaults(
  defineProps<{
    modelValue: (string | number)[]
    options: Option[]
    label?: string
    tooltip?: string
    message?: string
    error?: boolean
    placeholder?: string
    size?: 'md' | 'lg'
    theme?: 'light' | 'dark'
    allowCustom?: boolean
  }>(),
  {
    size: 'md',
    theme: 'light',
    allowCustom: false,
    placeholder: 'Select...'
  }
)

const emit = defineEmits(['update:modelValue'])

const wrapperRef = ref<HTMLElement | null>(null)
const anchorRef  = ref<HTMLElement | null>(null)
const menuRef    = ref<HTMLElement | null>(null)
const inputRef   = ref<HTMLInputElement | null>(null)

const search = ref('')
const open = ref(false)
const dropUp = ref(false)

const MENU_MAX_PX = 160   // matches max-h-40 (10rem)
const MARGIN_PX   = 8

const selectedOptions = computed(() => {
  return props.modelValue.map((value) => {
    const option = props.options.find((o) => o._id === value)
    return option || { title: String(value), _id: value }
  })
})

const filteredOptions = computed(() =>
  props.options.filter(
    (o) =>
      o.title.toLowerCase().includes(search.value.toLowerCase()) &&
      !props.modelValue.includes(o._id)
  )
)

/* ----- Open helpers (no toggle) ----- */
function openDropdown() {
  if (!open.value) open.value = true
  nextTick(() => {
    computePlacement()
    inputRef.value?.focus()
  })
}

function onInput() {
  open.value = true
  nextTick(computePlacement)
}

/* ----- Selection & tags ----- */
function select(option: Option) {
  emit('update:modelValue', [...props.modelValue, option._id])
  search.value = ''
  open.value = false
}

function remove(value: string | number) {
  emit('update:modelValue', props.modelValue.filter((v) => v !== value))
}

function handleEnter() {
  if (!props.allowCustom || !search.value.trim()) return
  const label = search.value.trim()

  const isDuplicate = props.options.some(
    (o) => o.title.toLowerCase() === label.toLowerCase()
  )

  if (!isDuplicate) {
    const newValue = label.toLowerCase().replace(/\s+/g, '-')
    emit('update:modelValue', [...props.modelValue, newValue])
    // If mutating props.options is undesirable, emit an event instead.
    props.options.push({ title: label, _id: newValue })
  } else {
    const matched = props.options.find(
      (o) => o.title.toLowerCase() === label.toLowerCase()
    )
    if (matched) select(matched)
  }

  search.value = ''
  open.value = false
}

/* ----- Outside click ----- */
function handleClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

/* ----- Placement logic (flip up when bottom space is tight) ----- */
function computePlacement() {
  const anchor = anchorRef.value
  if (!anchor) return

  const rect = anchor.getBoundingClientRect()
  const viewportH = window.innerHeight

  const bottomSpace = viewportH - rect.bottom
  const topSpace = rect.top

  // Use actual menu height if available, else cap by MENU_MAX_PX
  const menuHeight = Math.min(menuRef.value?.scrollHeight ?? MENU_MAX_PX, MENU_MAX_PX)

  // Decide if the dropdown should open upwards or downwards
  if (bottomSpace < (menuHeight + MARGIN_PX)) {
    // If there is less space below, and more space above, flip it upwards
    dropUp.value = topSpace > bottomSpace
  } else {
    dropUp.value = false  // Otherwise, open it downwards
  }
}


function onViewportChange() {
  if (open.value) computePlacement()
}

/* ----- Mount / unmount ----- */
const CAPTURE = true
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, CAPTURE)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, CAPTURE)
})

// Recompute when menu opens or filtered count changes (height may change)
watch([open, () => filteredOptions.value.length], () => {
  if (open.value) nextTick(computePlacement)
})
</script>
