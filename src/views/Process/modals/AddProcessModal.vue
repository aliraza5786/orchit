<template>
  <BaseModal :modelValue="modelValue" @update:modelValue="close" size="md">
    <div class="px-6 relative">
      <h2 class="text-xl font-semibold text-text-primary mb-6">Add New Process</h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Process Name -->
        <BaseTextField 
          v-model="form.name" 
          label="Process Name" 
          placeholder="Enter process name" 
          required 
          :autofocus="true"
        />

        <!-- Process Description -->
        <BaseTextAreaField 
          v-model="form.description" 
          label="Process Description" 
          placeholder="Enter process description" 
          rows="3"
        />

        <!-- Select Module -->
        <BaseSelectField
          v-model="form.module_id"
          :options="modulesOptions"
          label="Select Module"
          placeholder="Select a module"
          required
          :loading="loadingWorkspace"
        />

        <!-- Select Sheet -->
        <BaseSelectField
          v-model="form.sheet_id"
          :options="sheetsOptions"
          label="Select Sheet"
          placeholder="Select a sheet"
          required
          :disabled="!form.module_id"
          :loading="loadingSheets"
        />

        <!-- Select Process Type -->
        <BaseSelectField
          v-model="form.process_type_id"
          :options="processTypeOptions"
          label="Select Process Type"
          placeholder="Select process type"
          required
          :disabled="!form.sheet_id"
          :loading="loadingProcessTypes"
        />

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4 pb-2">
          <Button 
            type="submit" 
            variant="primary" 
            size="md" 
            :disabled="!isFormValid || isCreating"
            class="flex-1"
          >
            {{ isCreating ? 'Creating...' : 'Create Process' }}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            size="md" 
            @click="close"
            class="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import Button from '../../../components/ui/Button.vue'
import { useSingleWorkspace } from '../../../queries/useWorkspace'
import { useSheets } from '../../../queries/useSheets'
import { useProductVarsData } from '../../../queries/useProductCard'
import { useCreateProcess } from '../../../queries/useProcess'
import { useRouteIds } from '../../../composables/useQueryParams'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', data: any): void
}>()

const { workspaceId } = useRouteIds()

// Form state
const form = ref({
  name: '',
  description: '',
  module_id: null as string | null,
  sheet_id: null as string | null,
  process_type_id: null as string | null
})

// Data fetching
const { data: workspaceData, isLoading: loadingWorkspace } = useSingleWorkspace(workspaceId)
const modulesOptions = computed(() => {
  return (workspaceData.value?.modules || []).map((m: any) => ({
    _id: m._id,
    title: m.variables?.["module-title"]
 || m.module_id
  }))
  
})


const { data: sheetsData, isLoading: loadingSheets } = useSheets({
  workspace_id: workspaceId,
  workspace_module_id: computed(() => form.value.module_id)
}, { enabled: computed(() => !!form.value.module_id) })

watchEffect(()=>{
  console.log(sheetsData.value
, "these are all workspace data")
})

const sheetsOptions = computed(() => {
  return (sheetsData.value || []).map((s: any) => ({
    _id: s._id,
    title: s.variables?.["sheet-title"]
  }))
})

const { data: processTypeData, isLoading: loadingProcessTypes } = useProductVarsData(
  workspaceId,
  computed(() => form.value.module_id),
  ref('card-type'),
  { enabled: computed(() => !!form.value.module_id && !!form.value.sheet_id) }
)

const processTypeOptions = computed(() => {
  return (processTypeData.value?.values || []).map((v: any) => ({
    _id: v._id,
    title: v.value || v.title
  }))
})

// Watchers to reset dependent fields
watch(() => form.value.module_id, () => {
  form.value.sheet_id = null
  form.value.process_type_id = null
})

watch(() => form.value.sheet_id, () => {
  form.value.process_type_id = null
})

// Form validation
const isFormValid = computed(() => {
  return (
    form.value.name.trim().length > 0 &&
    form.value.module_id &&
    form.value.sheet_id &&
    form.value.process_type_id
  )
})

// Submission
const { mutate: createProcess, isPending: isCreating } = useCreateProcess({
  onSuccess: (data: any) => {
    emit('created', data)
    close()
  }
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  const payload = {
    workspace_id: workspaceId.value,
    title: form.value.name,
    description: form.value.description,
    workspace_module_id: form.value.module_id,
    sheet_id: form.value.sheet_id,
    process_type_id: form.value.process_type_id
  }

  createProcess({ payload })
}

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    module_id: null,
    sheet_id: null,
    process_type_id: null
  }
}
</script>
