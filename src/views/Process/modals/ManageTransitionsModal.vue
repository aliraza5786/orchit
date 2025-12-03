<template>
  <BaseModal v-model="open" size="md">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-text-primary mb-4">Manage Transitions</h3>

      <div v-if="transitions.length === 0" class="text-sm text-text-secondary">
        No transitions available for this process.
      </div>

      <div v-else class="space-y-4">
        <div v-for="(t, index) in transitions" :key="index" class="p-3 border border-border rounded-md flex flex-col gap-2 bg-bg-surface">
          <div class="flex items-center gap-2">
            <!-- From Status -->
            <select v-model="t.from_status_id"
              class="px-2 py-1 rounded border border-border text-sm bg-bg-body flex-1">
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.status_name }}
              </option>
            </select>

            <!-- To Status -->
            <select v-model="t.to_status_id"
              class="px-2 py-1 rounded border border-border text-sm bg-bg-body flex-1">
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.status_name }}
              </option>
            </select>

            <!-- Delete Button -->
            <Button size="sm" variant="danger" @click="deleteTransition(t)">Delete</Button>
          </div>

          <!-- Label Input -->
          <BaseTextField v-model="t.transition_label" placeholder="Transition Label (optional)" />

          <!-- Rules Input -->
          <BaseTextAreaField v-model="t.rulesText" placeholder="Rules (optional)" rows="2" />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button variant="secondary" @click="close">Cancel</Button>
        <Button variant="primary" @click="saveChanges" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import Button from '../../../components/ui/Button.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  modelValue: boolean;
  processId: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Inject workflow state
const workflowState = inject<any>('workflowState')!

const transitions = ref<any[]>([])
const statuses = ref<any[]>([])
const saving = ref(false)

// Initialize transitions and statuses when modal opens
watch(open, (isOpen) => {
  if (isOpen) {
    transitions.value = workflowState.localTransitions.value.map(t => ({
      ...t,
      rulesText: t.rules?.map((r: any) => r.description).join('\n') || ''
    }))
    statuses.value = workflowState.localStatuses.value
  }
})

// Delete a transition
function deleteTransition(t: any) {
  const confirmed = window.confirm('Are you sure you want to delete this transition?')
  if (!confirmed) return
  transitions.value = transitions.value.filter(tr => tr !== t)
}

// Save changes (update start/end, label, rules)
function saveChanges() {
  saving.value = true
  try {
    workflowState.localTransitions.value = transitions.value.map(t => ({
      ...t,
      rules: t.rulesText ? t.rulesText.split('\n').map((desc: string) => ({ description: desc })) : []
    }))
    toast.success('Transitions updated successfully')
    close()
  } catch (error) {
    toast.error('Failed to update transitions')
  } finally {
    saving.value = false
  }
}

function close() {
  open.value = false
}
</script>
