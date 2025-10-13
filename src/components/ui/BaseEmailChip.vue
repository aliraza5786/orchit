<template>
    <div :class="theme === 'dark' ? 'text-white' : 'text-text-primary'">
      <!-- Label + Tooltip -->
      <label v-if="label" :class="[
        'text-base font-medium mb-1 flex items-center',
        theme === 'dark' ? 'text-white' : 'text-text-primary'
      ]">
        {{ label }}
        <span v-if="tooltip" class="inline-block text-text-secondary -400 ml-1 cursor-help" :title="tooltip">
          <img src="../../assets/icons/info.svg" alt="info" />
        </span>
      </label>
  
      <!-- Input wrapper (same shell as BaseTextField) -->
      <div class="relative">
        <div :class="[
          'flex items-center gap-2 border rounded-xl px-3 py-2 w-full text-sm focus-within:ring-2',
          size === 'md' ? 'min-h-10' : 'min-h-12',
          error ? 'border-red-500 focus-within:ring-red-500' : 'focus-within:ring-border',
          theme === 'dark' ? 'bg-[#131318] border-border ' : ' border-border bg-bg-input',
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        ]" @click="focusInput">
          <!-- Prefix slot -->
          <span v-if="$slots.prefix" class="mr-1 text-text-secondary -500">
            <slot name="prefix" />
          </span>
  
          <!-- Chips -->
          <div class="flex flex-wrap gap-2 items-center flex-1">
            <span
              v-for="(e, i) in internal"
              :key="e + i"
              class="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs
                     bg-bg-body text-text-secondary"
            >
              <span v-if="showName" class="font-medium">{{ extractNameFromEmail(e) }}</span>
              <span v-if="showName" class="opacity-70">&lt;{{ e }}&gt;</span>
              <span v-else>{{ e }}</span>
  
              <button
                type="button"
                class="ml-1 rounded hover:bg-bg-surface  px-1"
                title="Remove"
                @click.stop="removeAt(i)"
                :disabled="disabled"
              >✕</button>
            </span>
  
            <!-- Input -->
            <input
              ref="inputRef"
              v-model="inputValue"
              :placeholder="internal.length === 0 ? placeholder : ''"
              class="flex-1 min-w-[160px] bg-transparent outline-none text-sm
                     placeholder:text-text-secondary 
                     text-text-primary"
              :disabled="disabled"
              @keydown="onKeydown"
              @blur="commit"
              @paste="onPaste"
            />
          </div>
  
          <!-- Suffix slot -->
          <span v-if="$slots.suffix" class="ml-1 text-text-secondary">
            <slot name="suffix" />
          </span>
        </div>
      </div>
  
      <!-- Help/Error Text -->
      <p v-if="message" class="mt-2 text-xs flex items-center gap-1"
         :class="error ? 'text-red-500' : theme === 'dark' ? 'text-text-secondary ' : 'text-text-secondary '">
        <slot v-if="$slots.msgIcon" name="msgIcon" /> {{ message }}
      </p>
    </div>
  </template>
  
  <script setup lang="ts">
  import {  ref, watch } from 'vue'
  
  const props = withDefaults(defineProps<{
    modelValue: string[]
    label?: string
    tooltip?: string
    message?: string
    error?: boolean
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    theme?: 'dark' | 'light'
    disabled?: boolean
    allowDuplicates?: boolean
    showName?: boolean
    /** Optional custom validator; return true if valid */
    validator?: (email: string) => boolean
  }>(), {
    modelValue: () => [],
    size: 'md',
    theme: 'light',
    placeholder: 'Add people by email… (Enter, comma, space)',
    error: false,
    disabled: false,
    allowDuplicates: false,
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
  
  /** internal mirror so we can mutate comfortably, synced with v-model */
  const internal = ref<string[]>([...props.modelValue])
  
  watch(() => props.modelValue, (v) => {
    // sync if parent overwrote
    if (JSON.stringify(v) !== JSON.stringify(internal.value)) {
      internal.value = [...v]
    }
  })
  
  function focusInput() {
    if (!props.disabled) inputRef.value?.focus()
  }
  
  const defaultEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
  function isValid(email: string) {
    return (props.validator ?? ((e: string) => defaultEmailRegex.test(e)))(email)
  }
  
  function normalizeEmails(text: string) {
    return text
      .split(/[\s,;]+/)     // split by space/comma/semicolon/newlines
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  }
  
  function addEmails(list: string[]) {
  const added: string[] = []
  const invalids: string[] = []
  const set = props.allowDuplicates ? null : new Set(internal.value)

  for (const raw of list) {
    if (!isValid(raw)) { invalids.push(raw); continue }
    if (set && set.has(raw)) continue
    if (set) set.add(raw)
    internal.value.push(raw)
    added.push(raw)
  }

  if (added.length) emit('add', added)
  if (invalids.length) emit('invalid', invalids)

  // ⬇️ clear error if user entered at least one valid email and no new invalids
  if (added.length && invalids.length === 0) {
    emit('invalid', [])   // parent can interpret [] as "no error"
  }

  if (added.length || invalids.length) {
    emit('update:modelValue', [...internal.value])
  }
}

  
  function commit() {
    if (!inputValue.value) return
    addEmails(normalizeEmails(inputValue.value))
    inputValue.value = ''
  }
  
  function onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') || ''
    if (!text) return
    e.preventDefault()
    addEmails(normalizeEmails(text))
  }
  
  function onKeydown(e: KeyboardEvent) {
    if (props.disabled) return
  
    // commit on separators
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      commit()
      return
    }
  
    // backspace to remove last when empty
    if (e.key === 'Backspace' && !inputValue.value && internal.value.length) {
      const removed = internal.value.pop()!
      emit('remove', removed)
      emit('update:modelValue', [...internal.value])
    }
  }
  
  function removeAt(i: number) {
    if (props.disabled) return
    const [removed] = internal.value.splice(i, 1)
    emit('remove', removed)
    emit('update:modelValue', [...internal.value])
  }
  
  /** Optional: Name extraction for chip display */
  function extractNameFromEmail(email: string) {
    const local = (email.split('@')[0] || '').split('+')[0]
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
    if (!parts.length) return email
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  </script>
  