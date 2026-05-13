<template>
    <BaseModal :inSpace="true" v-model="isOpen" size="sm" title="Create Field">
      <!-- Header --> 
      
      <p class="text-sm text-text-secondary px-6 pt-6 pb-2">Provide required data for your field.</p>
      <!-- Body -->
      <div class="px-6 py-6 flex flex-col gap-4">
        <!-- Dropdown Title -->
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

        <!-- Range Config (For Range/Slider) -->
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
  
        <!-- Option Input (Only for types that need options) -->
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
          <Button :inSpace="true" class="mt-6" size="md" variant="primary" :disabled="!canAddOption" @click="addOption">
            Add
          </Button>
        </div>
  
        <!-- Group Filterable toggle -->
        <label class="flex items-center gap-2 select-none"  v-if="['Radio','Select'].includes(selectedTypeTitle)">
          <Checkbox
            :inSpace="true"
            :checked="isFilterable"
            label="Show this in Group filters"
            @change="handleFilterChange"
          />
        </label>  
  
        <!-- List of Added Options (Only for types that need options) -->
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
  
      <!-- Footer -->
      <div class="flex justify-end gap-2 px-6 py-4 border-t border-border sticky bottom-0 bg-bg-body">
        <Button :inSpace="true" variant="secondary" @click="cancel">Cancel</Button>
        <Button :inSpace="true" variant="primary" :loading="isCreatingVariable" :disabled="!isValid || isCreatingVariable" @click="submit">
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
  import { useCreateVar } from '../../../queries/useSheets';
  import { useQueryClient } from '@tanstack/vue-query';
  import { usePermissions } from '../../../composables/usePermissions';
  import { useVariableTypes } from '../../../queries/useSheets'
  import Checkbox from '../../../components/ui/Checkbox.vue'
  import { toast } from 'vue-sonner'
  /** Fetch variable types */
  const { data: variableTypes, isLoading: isVariableTypesLoading } = useVariableTypes();

  const { moduleId, workspaceId } = useRouteIds()
  const { canCreateVariable } = usePermissions()
  
  /** Props & Emits */
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'refetchCardDetails'): Promise<void>
  }>()
  function handleFilterChange(event: Event) {
  const target = event.target as HTMLInputElement
  isFilterable.value = target.checked
}
  const props = withDefaults(defineProps<{ modelValue: boolean, sheetID: string, tableView?: boolean }>(), { modelValue: false, tableView: false })
  
  /** Modal open proxy */
  const isOpen = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  })
  
  /** Form state */
  const dropdownTitle = ref('')
  const optionTitle = ref('')
  const description = ref('')
  const options = ref<string[]>([])
  const selectedVariableType = ref('') 
  /** Transform fetched types for BaseSelect */

  const variableTypeOptions = computed(() => {
    return (variableTypes.value ?? []).map((t: any) => ({
      title: t.title,   // text shown in select
      _id: t._id,     // value bound to v-model
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
  
  /** NEW: Filterable toggle state */
  const isFilterable = ref(false)

watch(selectedVariableType, () => {
  const typeTitle = selectedTypeTitle.value
  // Only allow filterable for specific types
  if (["Checkbox", "Radio", "Select", "Multi Select"].includes(typeTitle)) {
    isFilterable.value = false // reset to unchecked on type change
  } else {
    isFilterable.value = false // hide anyway
  }
})

  /** Validation */
  const titleError = ref('')
  const optionTitleError = ref('')
  
  function validateDropdownTitle() {
    titleError.value = !dropdownTitle.value.trim()
      ? 'Dropdown title is required'
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
  
  /** Add / Remove options */
  function addOption() {
    if (!canAddOption.value) return
    options.value.push(optionTitle.value.trim())
    optionTitle.value = ''
    optionTitleError.value = ''
  }
  
  function removeOption(idx: number) {
    options.value.splice(idx, 1)
  }
  
  /** Validation for final submission */
  // remove validateDropdownTitle() call from isValid
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

  
  const queryClient = useQueryClient();
  const { mutate: createVariable, isPending: isCreatingVariable } = useCreateVar({
    onMutate: async (newVar: any) => {
        // Broadly update ALL 'all-module-variables' (Board Headers)
        // We use a temp ID so it shows up instantly
        const tempId = `temp-${Date.now()}`;
        const tempVar = {
            ...newVar.payload,
            _id: tempId,
            variable_id: tempId,
            slug: `temp-slug-${tempId}`, // Temporary slug for board rendering
            type: { title: selectedTypeTitle.value }
        };

        await queryClient.cancelQueries({ queryKey: ['all-module-variables'] });
        
        queryClient.setQueriesData({ queryKey: ['all-module-variables'] }, (old: any) => {
            if (!Array.isArray(old)) return old;
            return [...old, tempVar];
        });

        return { tempId };
    },
    onSuccess: async () => {
     toast.success('Field created successfully')
     reset();
     isOpen.value = false
    },
    onError: (err: any) => {
      console.error('Mutation failed:', err?.response ?? err)
      toast.error('Failed to create field')
    },
    onSettled: () => {
      // Refresh all related views regardless of success/fail to maintain consistency
      queryClient.invalidateQueries({ queryKey: ['all-module-variables'] })
      queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
      queryClient.invalidateQueries({ queryKey: ['table-cards-flat'] })
      queryClient.invalidateQueries({ queryKey: ['sprint-kanban'] })
      queryClient.invalidateQueries({ queryKey: ['sprint-table-flat'] })
      queryClient.invalidateQueries({ queryKey: ['product-card'] })
      queryClient.invalidateQueries({ queryKey: ['cardDetail'] })
    }
  })
  
  
  /** Actions */
  function submit() {
    if (!isValid.value) return
    if (!canCreateVariable.value) return
    const payload = {
      description: description.value,
      title: dropdownTitle.value.trim(),
      data: needsOptions.value ? options.value : (needsRange.value ? [rangeMin.value, rangeMax.value] : []),
      workspace_module_id: moduleId.value,
      workspace_id: workspaceId.value,
      /** Use the checkbox value in the payload */
      filterable: isFilterable.value,
      visible_on_card: false,
      type_id: selectedVariableType.value,
      sheet_id: props.sheetID,
      is_checkbox_table : !!props.tableView
    } 
  
    if (typeof createVariable !== 'function') { 
      return
    }
    createVariable({ payload }) // promise
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
    isFilterable.value = false // reset to default
  }
  </script>