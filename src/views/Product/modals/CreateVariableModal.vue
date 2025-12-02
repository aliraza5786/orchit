<template>
    <BaseModal v-model="isOpen" size="sm">
      <!-- Header -->
      <div class="flex flex-col gap-1 px-6 pb-6 border-b border-border sticky top-0 bg-bg-body z-10">
        <h2 class="text-lg font-semibold">Create Dropdown</h2>
        <p class="text-sm text-text-secondary">Provide a title and add options for your dropdown.</p>
      </div>
  
      <!-- Body -->
      <div class="px-6 py-4 flex flex-col gap-4">
        <!-- Dropdown Title -->
        <BaseTextField
          v-model="dropdownTitle"
          label="Dropdown Title"
          placeholder="Enter dropdown title (max 30 chars)"
          :error="titleError=='' ? false : true"
          maxlength="30"
          @input="validateDropdownTitle"
        />
  
        <BaseTextField
          v-model="description"
          label="Option Description"
          placeholder="Optional description"
        />
  
        <!-- Option Input -->
        <div class="flex gap-2 items-start">
          <div class="flex-1 flex flex-col gap-1">
            <BaseTextField
              v-model="optionTitle"
              label="Option Title"
              placeholder="Option title (max 30 chars)"
              :error="optionTitleError ? true : false"
              maxlength="30"
              @input="validateOptionTitle"
            />
          </div>
          <Button class="mt-6" size="md" variant="primary" :disabled="!canAddOption" @click="addOption">
            Add
          </Button>
        </div>
  
        <!-- Filterable toggle -->
        <label class="flex items-center gap-2 select-none">
          <input
            id="filterable-toggle"
            type="checkbox"
            v-model="isFilterable"
            class="h-4 w-4 accent-primary"
          />
          <span class="text-sm" for="filterable-toggle">Show this dropdown in filters</span>
        </label>
  
        <!-- List of Added Options -->
        <ul
          v-if="options.length"
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
        <Button variant="secondary" @click="cancel">Cancel</Button>
        <Button variant="primary" :disabled="!isValid || isCreatingVariable" @click="submit">
          {{ isCreatingVariable ? 'Creating...' : " Create Dropdown" }}
        </Button>
      </div>
    </BaseModal>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import BaseModal from '../../../components/ui/BaseModal.vue'
  import BaseTextField from '../../../components/ui/BaseTextField.vue'
  import Button from '../../../components/ui/Button.vue'
  import { useRouteIds } from '../../../composables/useQueryParams';
  import { useCreateVar } from '../../../queries/useSheets';
  import { useQueryClient } from '@tanstack/vue-query';
  import { usePermissions } from '../../../composables/usePermissions';
  
  const { moduleId, workspaceId } = useRouteIds()
  const { canCreateVariable } = usePermissions()
  
  /** Props & Emits */
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
  }>()
  
  const props = withDefaults(defineProps<{ modelValue: boolean, sheetID: string }>(), { modelValue: false })
  
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
  
  /** NEW: Filterable toggle state */
  const isFilterable = ref(true)
  
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
  return titleOk && options.value.length > 0
})

  
  const queryClient = useQueryClient();
  const { mutate: createVariable, isPending: isCreatingVariable } = useCreateVar({
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ['all-module-variables'] })
      isOpen.value = false
    },
    onError: (err: any) => {
      console.error('Mutation failed:', err?.response ?? err)
    },
  })
  
  /** Actions */
  function submit() {
    if (!isValid.value) return
    if (!canCreateVariable.value) return
    const payload = {
      description: description.value,
      title: dropdownTitle.value.trim(),
      data: options.value,
      workspace_module_id: moduleId.value,
      workspace_id: workspaceId.value,
      /** Use the checkbox value in the payload */
      filterable: isFilterable.value,
      visible_on_card: false,
      type_id: "",
      sheet_id: props.sheetID,
    }
    console.log('>>> helo', payload)
  
    if (typeof createVariable !== 'function') {
      console.error('createVariable is not a function. Got:', createVariable)
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
    titleError.value = ''
    optionTitleError.value = ''
    isFilterable.value = true // reset to default
  }
  </script>
  