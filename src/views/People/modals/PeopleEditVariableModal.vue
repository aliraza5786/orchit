<template>
    <BaseModal v-model="isOpen" size="md" title="Edit Field">
      <p class="text-sm text-text-secondary px-6 pt-6 pb-2">Edit the title and options for your field.</p>
      <div class="px-6 py-4 flex flex-col gap-4">
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
         :disabled="true" 
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
        <Button variant="primary" :disabled="!isValid " @click="submit">
          Save
        </Button>
      </div>
    </BaseModal>
</template>
  
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import Button from '../../../components/ui/Button.vue'
import { useVariableTypes } from '../../../queries/useSheets'; 
// import { toast } from 'vue-sonner';

const props = withDefaults(defineProps<{ 
    modelValue: boolean, 
    variable: any,
    cardId: string
}>(), { 
    modelValue: false 
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'refetchCardDetails'): Promise<void>
  (e: 'update-variable', data: any): void
}>()

const { data: variableTypes } = useVariableTypes();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const dropdownTitle = ref('')
const optionTitle = ref('') 
const options = ref<string[]>([])
const selectedVariableType = ref('')  
const rangeMin = ref(0)
const rangeMax = ref(100)

const initForm = () => {
  if (!props.variable) return
  dropdownTitle.value = props.variable.title || '' 
  
  if (variableTypes.value) {
      const typeObj = (variableTypes.value as any[]).find((t: any) => t.title === props.variable.variable_type_id?.title)
      if (typeObj) {
          selectedVariableType.value = typeObj._id
      }
  }

  if (["Select", "Multi Select", "Radio", "Checkbox"].includes(props.variable.variable_type_id?.title)) {
    options.value = Array.isArray(props.variable.data) ? [...props.variable.data] : []
  } else if (props.variable.variable_type_id?.title === "Range/Slider") {
    rangeMin.value = props.variable.data?.[0] ?? 0
    rangeMax.value = props.variable.data?.[1] ?? 100
  }
}

onMounted(initForm)
watch(() => props.variable, initForm)
watch(() => variableTypes.value, initForm)

const variableTypeOptions = computed(() => {
  return (variableTypes.value ?? []).map((t: any) => ({
    title: t.title,
    _id: t._id,
  }))
})

const selectedTypeTitle = computed(() => {
  return (variableTypes.value as any[])?.find((t: any) => t._id === selectedVariableType.value)?.title
})

const needsOptions = computed(() => {
  return ["Select", "Multi Select", "Radio", "Checkbox"].includes(selectedTypeTitle.value)
})

const needsRange = computed(() => {
  return ["Range/Slider"].includes(selectedTypeTitle.value)
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
    return titleOk && options.value.length > 0
  }
  
  if (needsRange.value) {
    return titleOk && rangeMax.value > rangeMin.value
  }
  
  return titleOk
})

function submit() {
  if (!isValid.value || !props.variable) return
  
  const payload = { 
      title: dropdownTitle.value.trim(),
      data: needsOptions.value ? options.value : (needsRange.value ? [rangeMin.value, rangeMax.value] : []),
  }

  const currentVarId = props.variable.variable_id ?? props.variable._id;

  emit('update-variable', {
       id: currentVarId, 
       payload
  })

  isOpen.value = false
}

function cancel() {
  isOpen.value = false
}
</script>
