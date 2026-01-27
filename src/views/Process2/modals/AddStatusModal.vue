<template>
  <BaseModal v-model="open" size="md">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-text-primary mb-4">{{ isEditing ? 'Edit Step' : 'Add Step' }}</h3>

      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">Step Name</label>
          <BaseTextField v-model="statusName" placeholder="e.g., To Do, In Progress, Done" :autofocus="true" />
        </div>

        <div>
           <BaseSelectField
            v-model="category"
            :options="categoryOptions"
            label="Category"
            @update="handleCategoryChange"
            message="Category cannot be changed after creation"
          />
        </div>

        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">Step Color</label>
          <div class="flex items-center gap-3">
            <input type="color" v-model="statusColor" @input="updateColorInput"
              class="h-10 w-10 rounded border border-border cursor-pointer">
            <BaseTextField v-model="statusColor" placeholder="#3b82f6" class="flex-1" />
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button @click="close" variant="secondary">Cancel</Button>
        <Button @click="handleSubmit" :disabled="!statusName.trim() || isSubmitting">
          {{ isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Step' : 'Add Step') }}
        </Button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import Button from '../../../components/ui/Button.vue'
import type { useLocalWorkflowState } from '../../../composables/useLocalWorkflowState'
import { toast } from 'vue-sonner'

const props = defineProps<{
  modelValue: boolean
  processId: string
  editingStatus?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'status:added', v: any): void
  (e: 'edit:node', v: string, data: any): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const workflowState = inject<ReturnType<typeof useLocalWorkflowState>>('workflowState')!

const statusName = ref('')
const category = ref('todo')
const statusColor = ref('#6b7280')
const isInitial = ref(false)
const isFinal = ref(false)
const isSubmitting = ref(false)

const categoryColors: Record<string, string> = {
  todo: '#6b7280',
  inprogress: '#3b82f6',
  done: '#10b981'
}

const categoryOptions = [
  { _id: 'todo', title: 'To Do' },
  { _id: 'inprogress', title: 'In Progress' },
  { _id: 'done', title: 'Done' }
]

const isEditing = computed(() => !!props.editingStatus)

watch(props, () => {
  statusName.value = props.editingStatus?.label || ''
  category.value = props.editingStatus?.status || 'todo'
  statusColor.value = props.editingStatus?.status_color || props.editingStatus?.status || '#6b7280'
  isInitial.value = props.editingStatus?.is_initial || false
  isFinal.value = props.editingStatus?.is_final || false
})

function handleCategoryChange() {
  statusColor.value = categoryColors[category.value]
}

function updateColorInput() {
  // Allow manual color changes
}

function close() {
  statusName.value=''
  open.value = false
}

function handleSubmit() {
  if (!statusName.value.trim()) return
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      console.log("editing mode on ");

      const updates = {
        ...props.editingStatus,
        name: statusName.value.trim(),
        category: category.value,
        status_color: statusColor.value,
        is_initial: isInitial.value,
        is_final: isFinal.value,
        status_name: statusName.value.trim(),
      }
      workflowState.updateStatus(props.editingStatus.id, updates)
      // toast.success(`Status "${statusName.value}" updated`)
      emit('edit:node', props.editingStatus.id, updates)
    } else {

      console.log("editing mode close ");

      const statusData = {
        process_id: props.processId,
        name: statusName.value.trim(),
        category: category.value,
        status_color: statusColor.value,
        is_initial: isInitial.value,
        is_final: isFinal.value,
        status_name: category.value.trim(),
        position_x: Math.random() * 400 + 100,
        position_y: Math.random() * 300 + 100,
        order: workflowState.localStatuses.value.length
      }
      workflowState.addStatus(statusData)
      // toast.success(`Status "${statusName.value}" added`)
      emit('status:added', statusData)
    }
    close()
  } catch (error) {
    toast.error(isEditing.value ? 'Failed to update step' : 'Failed to add step')
  } finally {
    isSubmitting.value = false
  }
}
</script>
