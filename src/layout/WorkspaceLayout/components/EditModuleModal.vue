<template>
  <BaseModal :inSpace="true" v-model="model" size="md" title="Update Module">
    <div class="px-6 py-6 space-y-4">

      <!-- Icon Picker -->
      <IconPicker :inSpace="true" v-model="form.icon" />

      <!-- Module Name -->
      <BaseTextField
        v-model="form.title"
        label="Module name"
        size="lg"
        placeholder="Enter module name"
        :error="!!errors.title"
        :message="errors.title"
      />

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-2">
        <button
          class="px-4 py-2 rounded-md text-sm text-text-secondary border"
          @click="close"
        >
          Cancel
        </button>
        <Button :inSpace="true" class="px-4" @click="submit" :disabled="isPending">
          {{ isPending ? 'Saving...' : 'Save' }}
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
import IconPicker from '../../../views/Product/components/IconPicker.vue'
import { useUpdateModule } from '../../../queries/useMore'
import { useSingleWorkspace } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'
import { toast } from 'vue-sonner'

const props = defineProps<{
  modelValue: boolean
  module: {
    _id: string
    title: string
    icon: any
  } | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const { workspaceId } = useRouteIds()
const { refetch } = useSingleWorkspace(workspaceId)

const form = ref({ title: '', icon: null as any })
const errors = ref<{ title?: string }>({})

// Sync form whenever the module prop changes (new module opened)
watch(
  () => props.module,
  (mod) => {
    form.value = {
      title: mod?.title ?? '',
      icon: mod?.icon ?? null,
    }
    errors.value = {}
  },
  { immediate: true }
)

const { mutate: updateModule, isPending } = useUpdateModule({
  onSuccess: async () => {
    await refetch()
    toast.success('Module updated successfully!')
    emit('success')
    close()
  },
  onError: () => {
    toast.error('Failed to update module.')
  },
})

function validate() {
  const next: any = {}
  if (!form.value.title?.trim()) next.title = 'Please enter a module name.'
  errors.value = next
  return Object.keys(next).length === 0
}

function submit() {
  if (!validate()) return
  if (!props.module?._id) return

  updateModule({
    payload: {
      module_id: props.module._id,
      variables: { 'module-title': form.value.title, 'module-icon': form.value.icon },
      icon: form.value.icon,
    },
  })
}

function close() {
  form.value = { title: '', icon: null }
  errors.value = {}
  model.value = false
}

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
