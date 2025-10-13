<template>
  <BaseModal v-model="open" size="md">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-text-primary mb-4">Add Transition</h3>

      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">From Status</label>
          <select v-model="fromStatusId"
            class="w-full px-3 py-2 text-sm bg-bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="">Select source status</option>
            <option v-for="status in statuses" :key="status.id" :value="status.id">
              {{ status.status_name }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">To Status</label>
          <select v-model="toStatusId"
            class="w-full px-3 py-2 text-sm bg-bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="">Select destination status</option>
            <option v-for="status in statuses" :key="status.id" :value="status.id">
              {{ status.status_name }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">Transition Label (Optional)</label>
          <BaseTextField v-model="transitionLabel" placeholder="e.g., Start work, Complete, Approve" />
        </div>

        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">Rules (Optional)</label>
          <BaseTextAreaField v-model="rules" placeholder="Add any rules or conditions for this transition" />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button @click="close" variant="secondary">Cancel</Button>
        <Button @click="handleSubmit" :disabled="!canSubmit || isSubmitting">
          {{ isSubmitting ? 'Adding...' : 'Add Transition' }}
        </Button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import Button from '../../../components/ui/Button.vue'
import type { useLocalWorkflowState } from '../../../composables/useLocalWorkflowState'
import { toast } from 'vue-sonner'

const props = defineProps<{
  modelValue: boolean
  processId: string
  statuses: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'transition:added'): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const workflowState = inject<ReturnType<typeof useLocalWorkflowState>>('workflowState')!

const fromStatusId = ref('')
const toStatusId = ref('')
const transitionLabel = ref('')
const rules = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return fromStatusId.value && toStatusId.value && fromStatusId.value !== toStatusId.value
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    fromStatusId.value = ''
    toStatusId.value = ''
    transitionLabel.value = ''
    rules.value = ''
  }
})

function close() {
  open.value = false
}

function handleSubmit() {
  if (!canSubmit.value) return

  if (workflowState.hasTransition(fromStatusId.value, toStatusId.value)) {
    toast.error('A transition already exists between these statuses')
    return
  }

  isSubmitting.value = true

  try {
    const transitionData = {
      process_id: props.processId,
      from_status_id: fromStatusId.value,
      to_status_id: toStatusId.value,
      transition_label: transitionLabel.value.trim(),
      rules: rules.value ? [{ description: rules.value }] : []
    }

    workflowState.addTransition(transitionData)
    toast.success('Transition added successfully')
    emit('transition:added')
    close()
  } catch (error) {
    toast.error('Failed to add transition')
  } finally {
    isSubmitting.value = false
  }
}
</script>
