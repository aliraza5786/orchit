<template>
  <BaseModal :modelValue="modelValue" @update:modelValue="close" size="md">
    <div class="px-6">
      <h2 class="text-xl font-semibold text-text-primary mb-4">Create Process Sheet</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <BaseTextField v-model="sheetTitle" label="Sheet Title" placeholder="e.g., General Process" required
          :autofocus="true" />

        <BaseTextAreaField v-model="sheetDescription" label="Description" placeholder="Describe this process sheet..."
          rows="3" />

        <div class="flex items-center gap-3 pt-4">
          <Button type="submit" variant="primary" size="md" :disabled="!sheetTitle.trim() || isCreating">
            {{ isCreating ? 'Creating...' : 'Create Sheet' }}
          </Button>
          <Button type="button" variant="secondary" size="md" @click="close">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import Button from '../../../components/ui/Button.vue'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', data: any): void
}>()

const sheetTitle = ref('')
const sheetDescription = ref('')
const isCreating = ref(false)

const handleSubmit = async () => {
  if (!sheetTitle.value.trim()) return

  isCreating.value = true

  setTimeout(() => {
    const newSheet = {
      _id: `sheet-${Date.now()}`,
      title: sheetTitle.value,
      description: sheetDescription.value,
      icon: {
        prefix: 'fa-solid',
        iconName: 'fa-diagram-project'
      },
      workspace_id: 'workspace-1',
      created_at: new Date().toISOString()
    }

    emit('created', newSheet)
    sheetTitle.value = ''
    sheetDescription.value = ''
    isCreating.value = false
    close()
  }, 500)
}

const close = () => {
  emit('update:modelValue', false)
  sheetTitle.value = ''
  sheetDescription.value = ''
}
</script>
