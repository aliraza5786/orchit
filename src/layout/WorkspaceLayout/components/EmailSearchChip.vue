<template>
  <div :class="isDarkTheme ? 'text-white' : 'text-text-primary'" class="relative">
    <!-- Label + Tooltip -->
    <label v-if="label" :class="[
      'text-base font-medium mb-1 flex items-center',
      isDarkTheme ? 'text-white' : 'text-text-primary'
    ]">
      {{ label }}
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <div :class="[
        'flex items-center gap-2 border rounded-[6px] px-3 py-2 w-full text-sm focus-within:ring-2',
        size === 'md' ? 'min-h-10' : 'min-h-12',
        error ? 'border-red-500 focus-within:ring-red-500' : 'focus-within:ring-border',
        isDarkTheme ? 'bg-[#131318] border-border ' : ' border-border bg-bg-input',
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      ]" @click="focusInput">
        <!-- Chips -->
        <div class="flex flex-wrap gap-2 w-full items-center flex-1">
          <span
            v-for="(e, i) in internal"
            :key="e + i"
            class="inline-flex items-center w-max-content gap-2 rounded-full px-2 py-1 text-xs bg-bg-body text-text-secondary"
          >
            <span v-if="showName" class="font-medium">{{ extractNameFromEmail(e) }}</span>
            <span v-if="showName" class="opacity-70 truncate max-w-[120px]">&lt;{{ e }}&gt;</span>
            <span v-else class="truncate max-w-[150px]">{{ e }}</span>

            <button type="button" class="ml-1 rounded hover:bg-bg-surface px-1" title="Remove" @click.stop="removeAt(i)" :disabled="disabled">✕</button>
          </span>

          <!-- Input -->
          <input
            ref="inputRef"
            v-model="inputValue"
            :placeholder="atLimit ? '' : (internal.length === 0 ? placeholder : '')"
            class="flex-1 min-w-[160px] bg-transparent outline-none text-sm placeholder:text-text-secondary text-text-primary"
            :disabled="disabled || atLimit"
            @keydown="onKeydown"
            @blur="onBlur"
            @paste="onPaste"
            @focus="showDropdown = true"
            @click="showDropdown = true"
          />
        </div>
      </div>

      <!-- Search Dropdown -->
      <div 
        v-if="showDropdown && filteredSuggestions.length > 0" 
        class="absolute z-[100] left-0 right-0 mt-1 bg-bg-body border border-border rounded-lg shadow-lg overflow-hidden"
      >
        <div class="max-h-60 overflow-y-auto custom-scrollbar">
          <div 
            v-for="(user, idx) in filteredSuggestions" 
            :key="user._id"
            :class="[
              'px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors',
              highlightedIndex === idx ? 'bg-bg-hover' : 'hover:bg-bg-hover'
            ]"
            @mousedown.prevent="selectUser(user)"
          >
            <img 
              v-if="user.profile_image" 
              :src="user.profile_image" 
              class="w-8 h-8 rounded-full object-cover shrink-0" 
            />
            <div 
              v-else 
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              :style="{ backgroundColor: generateAvatarColor(user._id, user.name || user.email) }"
            >
              {{ getInitials(user.name || user.email) }}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-medium text-text-primary truncate">{{ user.name }}</span>
              <span class="text-xs text-text-secondary truncate">{{ user.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Help/Error Text -->
    <p v-if="message" class="mt-2 text-xs" :class="error ? 'text-red-500' : 'text-text-secondary'">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTheme } from '../../../composables/useTheme'
import { getInitials, generateAvatarColor } from '../../../utilities'

const { isDark } = useTheme()

interface UserSuggestion {
  _id: string
  name: string
  email: string
  profile_image?: string
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  suggestions?: UserSuggestion[]
  label?: string
  message?: string
  error?: boolean
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  showName?: boolean
  maxEmails?: number
}>(), {
  modelValue: () => [],
  suggestions: () => [],
  size: 'md',
  placeholder: 'Add people by email…',
  error: false,
  disabled: false,
  showName: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void
  (e: 'invalid', invalids: string[]): void
  (e: 'add', added: string[]): void
  (e: 'remove', removed: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const internal = ref<string[]>([...props.modelValue])
const showDropdown = ref(false)
const highlightedIndex = ref(0)

watch(() => props.modelValue, (v) => {
  if (JSON.stringify(v) !== JSON.stringify(internal.value)) {
    internal.value = [...v]
  }
})

const isDarkTheme = computed(() => isDark.value)
const cap = computed(() => (props.maxEmails && props.maxEmails > 0) ? props.maxEmails : Infinity)
const atLimit = computed(() => internal.value.length >= cap.value)

const filteredSuggestions = computed(() => {
  const existing = new Set(internal.value)
  const available = props.suggestions.filter(u => !existing.has(u.email))
  
  if (!inputValue.value) return available.slice(0, 10)
  const q = inputValue.value.toLowerCase()
  return available.filter(u => 
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  ).slice(0, 10)
})

watch(filteredSuggestions, () => {
  highlightedIndex.value = 0
})

function focusInput() {
  if (!props.disabled && !atLimit.value) inputRef.value?.focus()
}

function normalizeEmails(text: string) {
  return text.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean)
}

function addEmails(list: string[]) {
  if (atLimit.value) return
  const added: string[] = []
  const existing = new Set(internal.value)
  for (const raw of list) {
    if (internal.value.length >= cap.value) break
    if (existing.has(raw)) continue
    internal.value.push(raw)
    added.push(raw)
    existing.add(raw)
  }
  if (added.length) {
    emit('add', added)
    emit('update:modelValue', [...internal.value])
  }
}

function commit() {
  if (!inputValue.value || atLimit.value) return
  addEmails(normalizeEmails(inputValue.value))
  inputValue.value = ''
  showDropdown.value = false
}

function selectUser(user: UserSuggestion) {
  addEmails([user.email])
  inputValue.value = ''
  // Keep dropdown open for more selections if needed
  showDropdown.value = true
  inputRef.value?.focus()
}

function onBlur() {
  setTimeout(() => { showDropdown.value = false }, 200)
  commit()
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') || ''
  if (!text) return
  e.preventDefault()
  addEmails(normalizeEmails(text))
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  if (e.key === 'ArrowDown' && showDropdown.value) {
    e.preventDefault()
    highlightedIndex.value = (highlightedIndex.value + 1) % filteredSuggestions.value.length
  } else if (e.key === 'ArrowUp' && showDropdown.value) {
    e.preventDefault()
    highlightedIndex.value = (highlightedIndex.value - 1 + filteredSuggestions.value.length) % filteredSuggestions.value.length
  } else if (e.key === 'Enter') {
    if (showDropdown.value && filteredSuggestions.value[highlightedIndex.value]) {
      e.preventDefault()
      selectUser(filteredSuggestions.value[highlightedIndex.value])
    } else if (inputValue.value) {
      e.preventDefault()
      commit()
    }
  } else if (e.key === 'Tab' || e.key === ',' || e.key === ' ') {
    if (inputValue.value) {
      e.preventDefault()
      commit()
    }
  } else if (e.key === 'Backspace' && !inputValue.value && internal.value.length) {
    const removed = internal.value.pop()!
    emit('remove', removed)
    emit('update:modelValue', [...internal.value])
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

function removeAt(i: number) {
  if (props.disabled) return
  const [removed] = internal.value.splice(i, 1)
  emit('remove', removed)
  emit('update:modelValue', [...internal.value])
}

function extractNameFromEmail(email: string) {
  const local = (email.split('@')[0] || '').split('+')[0]
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
  return parts.length ? parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') : email
}
</script>
