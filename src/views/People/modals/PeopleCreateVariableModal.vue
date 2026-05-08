<template>
    <BaseModal v-model="isOpen" size="sm" title="Create Field">
      <p class="text-sm text-text-secondary px-6 pt-6 pb-2">Provide required data for your field.</p>
      <div class="px-6 py-6 flex flex-col gap-4">
        <BaseTextField
          v-model="dropdownTitle"
          label="Field Title"
          placeholder="Enter field title (max 30 chars)"
          :error="titleError=='' ? false : true"
          maxlength="30"
          @input="validateDropdownTitle"
        />

        <BaseSelectField
         v-model="selectedVariableType"
         label="Field Type"
         :placeholder="'Select field type'"
         :options="variableTypeOptions"
         :disabled="isVariableTypesLoading"
        />
  
        <BaseTextField
          v-model="description"
          label="Field Description"
          placeholder="Optional description"
        />

        <div v-if="needsRange" class="flex gap-4">
          <div class="flex-1">
            <BaseTextField
              v-model.number="rangeMin"
              type="number"
              label="Min Value"
              placeholder="0"
            />
          </div>
          <div class="flex-1">
            <BaseTextField
              v-model.number="rangeMax"
              type="number"
              label="Max Value"
              placeholder="100"
            />
          </div>
        </div>
  
        <div v-if="needsOptions" class="flex gap-2 items-start">
          <div class="flex-1 flex flex-col gap-1">
            <BaseTextField
              v-model="optionTitle"
              :label="selectedTypeTitle + ' Option'"
              :placeholder="selectedTypeTitle + ' option title (max 30 chars)'"
              :error="optionTitleError ? true : false"
              maxlength="30"
              @input="validateOptionTitle"
            />
          </div>
          <Button class="mt-6" size="md" variant="primary" :disabled="!canAddOption" @click="addOption">
            Add
          </Button>
        </div>
  
        <label class="flex items-center gap-2 select-none"  v-if="['Radio','Select'].includes(selectedTypeTitle)">
          <Checkbox
            :checked="isFilterable"
            label="Show this in filters"
            @change="handleFilterChange"
          />
        </label>
  
        <ul
          v-if="needsOptions && options.length"
          class="mt-2 border border-border rounded-md p-2 bg-bg-input max-h-48 overflow-auto"
        >
          <li
            v-for="(opt, idx) in options"
            :key="idx"
            class="flex justify-between items-center px-2 py-1 border-b border-border last:border-b-0"
          >
            <div>
              <span class="font-medium">{{ opt }}</span>
            </div>
            <button class="text-red-500" @click="removeOption(idx)">✕</button>
          </li>
        </ul>
      </div>
  
      <div class="flex justify-end gap-2 px-6 py-4 border-t border-border sticky bottom-0 bg-bg-body">
        <Button variant="secondary" @click="cancel">Cancel</Button>
        <Button variant="primary" :loading="isCreatingVariable" :disabled="!isValid || isCreatingVariable" @click="submit">
          {{ isCreatingVariable ? 'Creating' : " Create Field" }}
        </Button>
      </div>
    </BaseModal>
</template>
  
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import Button from '../../../components/ui/Button.vue'
import { useRouteIds } from '../../../composables/useQueryParams';
import { useCreatePeopleVar } from '../../../queries/usePeople';
// import { useQueryClient } from '@tanstack/vue-query';
import { usePermissions } from '../../../composables/usePermissions';
import { useVariableTypes } from '../../../queries/useSheets'
import Checkbox from '../../../components/ui/Checkbox.vue'
import { toast } from 'vue-sonner'

const { data: variableTypes, isLoading: isVariableTypesLoading } = useVariableTypes();
const { workspaceId } = useRouteIds()
const { canEditUser } = usePermissions()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'refetchCardDetails'): Promise<void>
}>()

function handleFilterChange(event: Event) {
  const target = event.target as HTMLInputElement
  isFilterable.value = target.checked
}

const props = withDefaults(defineProps<{ modelValue: boolean }>(), { modelValue: false })

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const dropdownTitle = ref('')
const optionTitle = ref('')
const description = ref('')
const options = ref<string[]>([])
const selectedVariableType = ref('') 

const variableTypeOptions = computed(() => {
  return (variableTypes.value ?? []).map((t: any) => ({
    title: t.title,
    _id: t._id,
  }))
})

const selectedTypeTitle = computed(() => {
  return variableTypes.value?.find((t: any) => t._id === selectedVariableType.value)?.title
})

const needsOptions = computed(() => {
  return ["Select", "Multi Select", "Radio", "Checkbox"].includes(selectedTypeTitle.value)
})

const rangeMin = ref(0)
const rangeMax = ref(100)
const needsRange = computed(() => {
  return ["Range/Slider"].includes(selectedTypeTitle.value)
})

const isFilterable = ref(false)

watch(selectedVariableType, () => {
  const typeTitle = selectedTypeTitle.value
  if (["Checkbox", "Radio", "Select", "Multi Select"].includes(typeTitle)) {
    isFilterable.value = false
  } else {
    isFilterable.value = false
  }
})

const titleError = ref('')
const optionTitleError = ref('')

function validateDropdownTitle() {
  titleError.value = !dropdownTitle.value.trim()
    ? 'Field title is required'
    : dropdownTitle.value.length > 30
      ? 'Maximum 30 characters allowed'
      : ''
}

function validateOptionTitle() {
  optionTitleError.value = !optionTitle.value.trim()
    ? 'Option title is required'
    : optionTitle.value.length > 30
      ? 'Maximum 30 characters allowed'
      : ''
}

const canAddOption = computed(() => !optionTitleError.value && optionTitle.value.trim() !== '')

function addOption() {
  if (!canAddOption.value) return
  options.value.push(optionTitle.value.trim())
  optionTitle.value = ''
  optionTitleError.value = ''
}

function removeOption(idx: number) {
  options.value.splice(idx, 1)
}

const isValid = computed(() => {
  const title = dropdownTitle.value.trim()
  const titleOk = title.length > 0 && title.length <= 30
  
  if (needsOptions.value) {
    return titleOk && options.value.length > 0 && selectedVariableType.value
  }
  
  if (needsRange.value) {
    return titleOk && rangeMax.value > rangeMin.value && selectedVariableType.value
  }
  
  return titleOk && selectedVariableType.value
})

// const queryClient = useQueryClient();
const { mutate: createVariable, isPending: isCreatingVariable } = useCreatePeopleVar({
  onSuccess: async () => {
   toast.success('Field created successfully')
   reset();
   isOpen.value = false
   emit('refetchCardDetails')
  },
  onError: (err: any) => {
    console.error('Mutation failed:', err?.response ?? err)
    toast.error('Failed to create field')
  }
})

function submit() {
  if (!isValid.value) return
  if (!canEditUser.value) return
  const payload = {
    module: 'people',
    description: description.value,
    title: dropdownTitle.value.trim(),
    data: needsOptions.value ? options.value : (needsRange.value ? [rangeMin.value, rangeMax.value] : []),
    workspace_id: workspaceId.value,
    is_filterable: isFilterable.value,
    variable_type_id: selectedVariableType.value,
  } 

  createVariable({ payload })
}

function cancel() {
  reset()
  isOpen.value = false
}

function reset() {
  dropdownTitle.value = ''
  optionTitle.value = ''
  description.value = ''
  options.value = []
  rangeMin.value = 0
  rangeMax.value = 100
  titleError.value = ''
  optionTitleError.value = ''
  isFilterable.value = false
}
</script>
