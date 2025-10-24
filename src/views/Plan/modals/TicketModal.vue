<template>
    <dialog ref="dlg" class="modal" @close="$emit('close')">
      <form method="dialog" class="modal-box max-w-lg space-y-4" @submit.prevent>
        <h3 class="text-lg font-semibold">{{ editing ? 'Edit' : 'Create' }} Ticket</h3>
        <div class="grid grid-cols-1 gap-3">
          <label class="space-y-1">
            <span class="text-sm">Summary</span>
            <input v-model="form.summary" class="w-full rounded-md border px-3 py-2" placeholder="As a user, I want…" />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1">
              <span class="text-sm">Type</span>
              <select v-model="form.type" class="w-full rounded-md border px-3 py-2">
                <option>Story</option><option>Bug</option><option>Task</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-sm">Priority</span>
              <select v-model="form.priority" class="w-full rounded-md border px-3 py-2">
                <option>Highest</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1">
              <span class="text-sm">Story Points</span>
              <input type="number" min="0" v-model.number="form.storyPoints" class="w-full rounded-md border px-3 py-2" />
            </label>
            <label class="space-y-1">
              <span class="text-sm">Assignee</span>
              <input v-model="form.assignee" class="w-full rounded-md border px-3 py-2" placeholder="Unassigned" />
            </label>
          </div>
          <label class="space-y-1">
            <span class="text-sm">Description</span>
            <textarea v-model="form.description" class="w-full rounded-md border px-3 py-2" rows="3" />
          </label>
        </div>
  
        <div class="modal-action">
          <button type="button" class="rounded-md border px-3 py-1.5" @click="close">Cancel</button>
          <button type="button" class="rounded-md bg-blue-600 px-3 py-1.5 text-white" @click="save">Save</button>
        </div>
      </form>
    </dialog>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
  import type { Ticket } from '../composables/useBacklogStore.ts'
  
  const props = defineProps<{
    modelValue: boolean
    editing?: boolean
    ticket?: Ticket | null
  }>()
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'save', v: Partial<Ticket>): void
    (e: 'close'): void
  }>()
  
  const dlg = ref<HTMLDialogElement>()
  const form = reactive<Partial<Ticket>>({ type: 'Story', priority: 'Medium', storyPoints: 1, status: 'Todo' })
  
  function open() { dlg.value?.showModal() }
  function close() { dlg.value?.close(); emit('update:modelValue', false) }
  
  watch(() => props.modelValue, (v) => { v ? open() : close() })
  watch(() => props.ticket, (t) => {
    Object.assign(form, { summary: '', type: 'Story', priority: 'Medium', storyPoints: 1, status: 'Todo', assignee: '', description: '' })
    if (t) Object.assign(form, t)
  })
  
  function save() {
    if (!form.summary?.trim()) return
    emit('save', { ...form })
    close()
  }
  
  onMounted(() => { if (props.modelValue) open() })
  onBeforeUnmount(close)
  </script>
  
  <style scoped>
  .modal { display: none; }
  .modal[open] { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 50; }
  .modal-box { margin: 10vh auto; background: white; border-radius: .75rem; padding: 1rem; }
  .modal-action { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
  </style>
  