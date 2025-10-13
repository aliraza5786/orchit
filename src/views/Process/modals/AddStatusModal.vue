<template>
  <BaseModal v-model="open" size="md">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-text-primary mb-4">Add Status</h3>

      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">Status Name</label>
          <BaseTextField v-model="statusName" placeholder="e.g., To Do, In Progress, Done" :autofocus="true" />
        </div>

        <div>
          <label class="text-sm font-medium text-text-primary mb-1.5 block">Status Color</label>
          <div class="flex items-center gap-3">
            <input type="color" v-model="statusColor" class="h-10 w-20 rounded border border-border cursor-pointer">
            <BaseTextField v-model="statusColor" placeholder="#3b82f6" class="flex-1" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="isInitial" id="isInitial" class="rounded">
          <label for="isInitial" class="text-sm text-text-secondary cursor-pointer">
            This is the initial status
          </label>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="isFinal" id="isFinal" class="rounded">
          <label for="isFinal" class="text-sm text-text-secondary cursor-pointer">
            This is a final status
          </label>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button @click="close" variant="secondary">Cancel</Button>
        <Button @click="handleSubmit" :disabled="!statusName.trim() || isSubmitting">
          {{ isSubmitting ? 'Adding...' : 'Add Status' }}
        </Button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import { useCreateStatus } from '../../../queries/useProcess'

const props = defineProps<{
  modelValue: boolean
  processId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'status:added'): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const statusName = ref('')
const statusColor = ref('#3b82f6')
const isInitial = ref(false)
const isFinal = ref(false)

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    statusName.value = ''
    statusColor.value = '#3b82f6'
    isInitial.value = false
    isFinal.value = false
  }
})

const { mutate: createStatus, isPending: isSubmitting } = useCreateStatus({
  onSuccess: () => {
    emit('status:added')
    close()
  }
})

function close() {
  open.value = false
}

function handleSubmit() {
  if (!statusName.value.trim()) return

  const payload = {
    process_id: props.processId,
    status_name: statusName.value.trim(),
    status_color: statusColor.value,
    is_initial: isInitial.value,
    is_final: isFinal.value,
    position_x: Math.random() * 400 + 100,
    position_y: Math.random() * 300 + 100,
    order: 0
  }

  createStatus({ payload })
}
</script>
