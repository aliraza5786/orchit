<template>
    <BaseModal
      v-model="open"
      :size="size"
      :modalClass="computedModalClass"
    >
      <div class="p-5">
        <div class="flex items-start gap-3">
          <!-- Danger icon -->
          <div class="h-10 w-10 rounded-full bg-red-100 text-red-600 grid place-items-center dark:bg-red-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.077l-1.27 12.03A3 3 0 0 1 14.67 22H9.33a3 3 0 0 1-2.982-2.97L5.077 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm2 0v1h2V3h-2ZM7.08 7l1.2 11.37A1 1 0 0 0 9.33 20h5.34a1 1 0 0 0 1.05-.88L16.92 7H7.08ZM10 9a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Z"/>
            </svg>
          </div>
  
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-text-primary ">
              {{ title }}
            </h3>
            <p class="mt-1 text-sm text-muted">
              <slot name="message">
                {{ resolvedMessage }}
              </slot>
            </p>
  
            <!-- Optional “type to confirm” -->
            <div v-if="requireMatchText" class="mt-4">
              <label class="text-xs text-muted">
                Type <span class="font-medium text-body">{{ requireMatchText }}</span> to confirm
              </label>
              <input
                v-model="typed"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm border-ui bg-card text-body outline-none"
                :placeholder="requireMatchText"
                @keyup.enter="tryConfirm"
              />
            </div>
  
            <!-- Optional extra content slot (checkboxes, warnings, etc.) -->
            <div v-if="$slots.extra" class="mt-4">
              <slot name="extra" />
            </div>
          </div>
        </div>
  
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm rounded-md border border-ui bg-card text-body hover:bg-surface-2 disabled:opacity-50"
            :disabled="loading"
            @click.stop="close"
          >
            {{ cancelText }}
          </button>
  
          <button
            type="button"
            class="px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            :disabled="!canConfirm || loading"
            @click="confirm"
          >
            <svg v-if="loading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="4" class="opacity-25"></circle>
              <path d="M4 12a8 8 0 0 1 8-8" stroke-width="4" class="opacity-75"></path>
            </svg>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </BaseModal>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue';
 
  const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    itemLabel?: string            // e.g. "workspace"
    itemName?: string             // e.g. "Design System"
    message?: string              // custom message; otherwise auto-generated
    confirmText?: string
    cancelText?: string
    requireMatchText?: string     // when provided, user must type this string to enable Delete
    loading?: boolean
    size?: 'sm'|'md'|'lg'|'xl'    // forwarded to BaseModal
    modalClass?: string           // appended to BaseModal modalClass
  }>(), {
    title: 'Delete item',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    size: 'md',
    loading: false,
    modalClass: ''
  })
  
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
  }>()
  
  const open = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  })
  
  const typed = ref('')
  
  const resolvedMessage = computed(() => {
    if (props.message) return props.message
    const what = [props.itemLabel, props.itemName].filter(Boolean).join(' ')
    const label = what || 'this item'
    return `This action cannot be undone. This will permanently delete ${label}.`
  })
  
  const normalize = (s: unknown) =>
  String(s ?? '')
    .normalize('NFKC')                         // Unicode normalize
    .toLowerCase()                             // ignore case (remove if you want case-sensitive)
    .replace(/[\u200B-\u200D\u2060\u00AD\uFEFF]/g, '') // zero-width & soft hyphen
    .replace(/\s+/g, ' ')                      // collapse runs of whitespace to one space
    .trim();

const canConfirm = computed(() => {
  if (!props.requireMatchText) return true
  const a = normalize(typed.value)
  const b = normalize(props.requireMatchText)
  // helpful, consistent log:
  console.log({ a, b, equal: a === b })
  return a === b
})

  
  const computedModalClass = computed(() => {
    // Tight vertical rhythm + theme-friendly surfaces
    return `!py-0 bg-card text-body ${props.modalClass}`.trim()
  })
  
  function close() {
    emit('cancel')
    open.value = false
  }
  
  function confirm() {
    if (!canConfirm.value || props.loading) return
    emit('confirm')
  }
  
  function tryConfirm() {
    if (canConfirm.value) confirm()
  }
  </script>
  