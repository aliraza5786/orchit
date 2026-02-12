<template>
    <BaseModal v-model="isOpen" size="sm" title="Edit Field">
      <!-- Header --> 
      
      <p class="text-sm text-text-secondary px-6 pt-6 pb-2">Edit the title and options for your field.</p>
      <!-- Body -->
      <div class="px-6 py-4 flex flex-col gap-4">
        <!-- Field Title -->
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
          <Button class="mt-6" size="md" variant="primary" :disabled="!canAddOption" @click="addOption">
            Add
          </Button>
        </div>
  
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

        <!-- Field Value (Dynamic based on type) -->
        <div class="pt-4 border-t border-border">
          <label class="block text-sm font-medium text-text-primary mb-2">Current Value</label>
          
          <!-- Selection Types -->
          <BaseSelectField
            v-if="selectedTypeTitle === 'Select'"
            size="sm"
            :options="options.map((e: any) => ({ _id: e, title: e }))"
            placeholder="Select option"
            :allowCustom="false"
            v-model="localValue"
          />

          <BaseMultiSelect
            v-else-if="selectedTypeTitle === 'Multi Select'"
            size="md"
            :options="options.map((e: any) => ({ _id: e, title: e }))"
            placeholder="Select options"
            :model-value="Array.isArray(localValue) ? localValue : []"
            @update:modelValue="(val: any) => localValue = val"
          />

          <!-- Radio Type -->
          <BaseRadioGroup
            v-else-if="selectedTypeTitle === 'Radio'"
            :options="options.map((e: any) => ({ _id: e, title: e }))"
            v-model="localValue"
            :name="'modal-' + variable.slug"
          />

          <!-- Checkbox Type -->
          <BaseCheckboxGroup
            v-else-if="selectedTypeTitle === 'Checkbox'"
            :options="options.map((e: any) => ({ _id: e, title: e }))"
            v-model="localValue"
          />

          <!-- Textarea Type -->
          <BaseTextAreaField
            v-else-if="selectedTypeTitle === 'Textarea'"
            placeholder="Enter text..."
            v-model="localValue"
          />

          <!-- Date & Time Types -->
          <div
            v-else-if="['Date', 'Date & Time'].includes(selectedTypeTitle)"
            class="h-10 px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-border"
          >
            <i class="fa-regular fa-calendar text-xs"></i>
            <DatePicker
              placeholder="Set date"
              class="w-full"
              v-model="localValue"
              emit-as="ymd"
            />
          </div>

          <!-- Time Type -->
          <div
            v-else-if="selectedTypeTitle === 'Time'"
            class="h-10 px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-border"
          >
            <i class="fa-regular fa-clock text-sm"></i>
            <TimePicker
              placeholder="Set time"
              class="w-full"
              v-model="localValue"
            />
          </div>

          <!-- File Upload -->
          <FileUploader
            v-else-if="selectedTypeTitle === 'File Upload'"
            label=""
            v-model="localValue"
          />

          <!-- Switch/Toggle -->
          <div v-else-if="selectedTypeTitle === 'Switch/Toggle'" class="flex items-center gap-2 py-1">
            <Checkbox
              :checked="!!localValue"
              @change="(e: any) => localValue = e.target.checked"
              label="Enabled"
            />
          </div>

          <!-- Person Type -->
          <AssigmentDropdown
            v-else-if="selectedTypeTitle === 'Person'"
            :seat="localValue"
            @assign="(users) => localValue = users"
          />

          <!-- Range/Slider Type -->
          <div v-else-if="selectedTypeTitle === 'Range/Slider'" class="space-y-1 py-1">
            <div class="flex justify-between text-[10px] text-text-secondary px-1">
              <span>Min: {{ rangeMin }}</span>
              <span class="font-bold text-accent">{{ localValue ?? rangeMin }}</span>
              <span>Max: {{ rangeMax }}</span>
            </div>
            <input
              type="range"
              :min="Number(rangeMin)"
              :max="Number(rangeMax)"
              class="w-full h-1.5 bg-orchit-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              :value="localValue ?? rangeMin"
              @input="(e: any) => localValue = Number((e.target as any).value)"
            />
          </div>

          <!-- Default: TextField -->
          <BaseTextField
            v-else
            :type="selectedTypeTitle === 'Number' ? 'number' : (selectedTypeTitle === 'Color Picker' ? 'color' : (selectedTypeTitle === 'Email' ? 'email' : (selectedTypeTitle === 'Password' ? 'password' : 'text')))"
            placeholder="Enter value..."
            v-model="localValue"
          />
        </div>

        
      </div>
  
      <!-- Footer -->
      <div class="flex justify-end gap-2 px-6 py-4 border-t border-border sticky bottom-0 bg-bg-body">
        <Button variant="secondary" @click="cancel">Cancel</Button>
        <Button variant="primary" :loading="isUpdatingVariable || isMovingCard" :disabled="!isValid || isUpdatingVariable || isMovingCard" @click="submit">
          {{ (isUpdatingVariable || isMovingCard) ? 'Saving' : "Save Changes" }}
        </Button>
      </div>
    </BaseModal>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
  import BaseModal from '../../../components/ui/BaseModal.vue'
  import BaseTextField from '../../../components/ui/BaseTextField.vue'
  import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
  import Button from '../../../components/ui/Button.vue'
  import { useRouteIds } from '../../../composables/useQueryParams';
  import { useUpdateVar, useVariableTypes, useMoveCard } from '../../../queries/useSheets';
  import { useQueryClient } from '@tanstack/vue-query';
  import { toast } from 'vue-sonner';

  const DatePicker = defineAsyncComponent(() => import('../components/DatePicker.vue'));
  const TimePicker = defineAsyncComponent(() => import('../components/TimePicker.vue'));
  const AssigmentDropdown = defineAsyncComponent(() => import('../components/AssigmentDropdown.vue'));
  const BaseTextAreaField = defineAsyncComponent(() => import('../../../components/ui/BaseTextAreaField.vue'));
  const FileUploader = defineAsyncComponent(() => import('../../../components/ui/FileUploader.vue'));
  const Checkbox = defineAsyncComponent(() => import('../../../components/ui/Checkbox.vue'));
  const BaseRadioGroup = defineAsyncComponent(() => import('../../../components/ui/BaseRadioGroup.vue'));
  const BaseCheckboxGroup = defineAsyncComponent(() => import('../../../components/ui/BaseCheckboxGroup.vue'));
  const BaseMultiSelect = defineAsyncComponent(() => import('../../../components/ui/BaseMultiSelect.vue'));

  /** Props & Emits */
  const props = withDefaults(defineProps<{ 
    modelValue: boolean, 
    variable: any,
    cardId: string,
    sheetID: string 
  }>(), { 
    modelValue: false 
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'refetchCardDetails'): Promise<void>
  }>()
  
  /** Fetch variable types */
  const { data: variableTypes } = useVariableTypes();
  const { moduleId, workspaceId } = useRouteIds()
  
  /** Modal open proxy */
  const isOpen = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  })
  
  /** Form state */
  const dropdownTitle = ref('')
  const optionTitle = ref('') 
  const options = ref<string[]>([])
  const selectedVariableType = ref('')  
  const rangeMin = ref(0)
  const rangeMax = ref(100)
  const localValue = ref<any>(null)
 

  /** Pre-populate form */
  const initForm = () => {
    if (!props.variable) return
    dropdownTitle.value = props.variable.title || '' 
    localValue.value = props.variable.value
    
    // Find type_id from variable.type string
    if (variableTypes.value) {
        const typeObj = (variableTypes.value as any[]).find((t: any) => t.title === props.variable.type)
        if (typeObj) {
            selectedVariableType.value = typeObj._id
        }
    }

    if (["Select", "Multi Select", "Radio", "Checkbox"].includes(props.variable.type)) {
      options.value = Array.isArray(props.variable.data) ? [...props.variable.data] : []
    } else if (props.variable.type === "Range/Slider") {
      rangeMin.value = props.variable.data?.[0] ?? 0
      rangeMax.value = props.variable.data?.[1] ?? 100
    }
     
  }

  onMounted(initForm)
  watch(() => props.variable, initForm)
  watch(() => variableTypes.value, initForm)

  /** Transform fetched types for BaseSelect */
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
  
  /** Validation */
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

  const queryClient = useQueryClient();
  const { mutate: updateVariable, isPending: isUpdatingVariable } = useUpdateVar({
    onSuccess: async () => {
      await emit('refetchCardDetails') 
      await queryClient.invalidateQueries({ queryKey: ['all-module-variables'] })
      await queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
      await queryClient.invalidateQueries({ queryKey: ['product-card'] })
      maybeClose()
    },
    onError: (err: any) => {
      console.error('Mutation failed:', err?.response ?? err)
      toast.error('Failed to update field definition')
    },
  })

  const { mutate: moveCard, isPending: isMovingCard } = useMoveCard({
    onSuccess: async () => {
      await emit('refetchCardDetails')
      await queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
      await queryClient.invalidateQueries({ queryKey: ['product-card'] })
      maybeClose()
    },
    onError: (err: any) => {
      console.error('Mutation failed:', err?.response ?? err)
      toast.error('Failed to update field value')
    }
  })

  let updateVarDone = false
  let moveCardDone = false
  let updateVarInitiated = false
  let moveCardInitiated = false

  const maybeClose = () => {
    if ((!updateVarInitiated || updateVarDone) && (!moveCardInitiated || moveCardDone)) {
        toast.success('Field updated successfully')
        isOpen.value = false
    }
  }
  
  /** Actions */
  function submit() {
    if (!isValid.value || !props.variable) return
    
    const definitionChanged = 
        dropdownTitle.value.trim() !== props.variable.title || 
        (needsOptions.value && JSON.stringify(options.value) !== JSON.stringify(props.variable.data)) || 
        (needsRange.value && (rangeMin.value !== props.variable.data?.[0] || rangeMax.value !== props.variable.data?.[1]))

    const valueChanged = JSON.stringify(localValue.value) !== JSON.stringify(props.variable.value)

    if (!definitionChanged && !valueChanged) {
        isOpen.value = false
        return
    }

    if (definitionChanged) {
        updateVarInitiated = true
        const payload = { 
            title: dropdownTitle.value.trim(),
            data: needsOptions.value ? options.value : (needsRange.value ? [rangeMin.value, rangeMax.value] : []),
            workspace_module_id: moduleId.value,
            workspace_id: workspaceId.value, 
            type_id: selectedVariableType.value,
            sheet_id: props.sheetID,
        }
        updateVariable({ id: props.variable.variable_id, payload }, {
            onSettled: () => { updateVarDone = true; maybeClose() }
        })
    }

    if (valueChanged) {
        moveCardInitiated = true
        moveCard({
            card_id: props.cardId,
            variables: { [props.variable.slug]: localValue.value }
        }, {
            onSettled: () => { moveCardDone = true; maybeClose() }
        })
    }
  }
  
  function cancel() {
    isOpen.value = false
  }
  </script>
