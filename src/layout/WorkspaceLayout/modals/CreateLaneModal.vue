<template>
  <BaseModal v-model="workspaceStore.showCreateLaneModal" modalClass="!py-0" size="lg">
    <!-- Header -->
    <div class="sticky flex-col top-0 flex justify-between bg-bg-body/90 z-1 items-start pt-6 px-6 border-b border-border  pb-4 mb-4">
      <h2 class="text-xl font-semibold">Create a New Lane</h2>
      <Stepper :steps="steps" :currentStep="currentStep" />
    </div>

    <!-- Step 1: Basics -->
    <div v-if="currentStep === 0" class="space-y-8 px-6">
      <div class="space-y-2.5">
        <h3 class="text-2xl font-semibold text-text-primary ">Project Basics</h3>
        <p class="text-sm text-text-secondary  mt-1 ">
          Let's start by setting up the foundational details of your project lane.
        </p>
      </div>

      <div class="space-y-2">
        <BaseTextField  v-model="form.title" placeholder="Lane name " label="Lane Name" :error="!!titleError"
          :message="titleError" @blur="touched.title = true" />

        <BaseTextAreaField v-model="form.description" label="Lane Description" placeholder="Describe your lane here.. "
          :error="!!descriptionError" :message="descriptionError" @blur="touched.description = true" />

        <BaseMultiSelect v-model="form.user_types" :options="userTypes" label="User Base Type"
          placeholder="Select a user base" :error="!!userTypeError" :message="userTypeError"
          @blur="touched.user_type = true" />

      </div>
    </div>

    <!-- Step 2: Color -->
    <div v-else-if="currentStep === 1" class="space-y-8 px-6">
      <div>
        <h3 class="text-2xl font-semibold text-text-primary ">Choose Color</h3>
        <p class="text-sm text-text-secondary mt-1">
          Select a color for your project lane or set a custom color.
        </p>
      </div>

      <!-- Custom Color Picker -->
      <div class="flex items-center gap-4 mt-4">
        <div class="w-10 h-10 rounded-full border cursor-pointer relative"
          :style="{ backgroundColor: form.color_code }">
          <input type="color" v-model="form.color_code"
            class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
        <div class="text-sm text-text-primary  font-medium">
          Set Color
          <div class="text-xs text-text-secondary  ">{{ form.color_code }}</div>
        </div>
      </div>

      <!-- Predefined Colors -->
      <div class="mt-6">
        <label class="block text-base font-medium text-text-primary  mb-4">Or Choose Predefined Color</label>
        <div class="grid grid-cols-6 gap-3 p-4.5 border border-border  rounded-md">
          <div v-for="color in predefinedColors" :key="color.label" @click="selectColor(color.value)" :class="[
            'rounded-lg cursor-pointer border-2 transition py-5 px-3 flex justify-center items-center flex-col gap-2',
            form.color_code === color.value ? 'border-border scale-105 bg-bg-surface' : 'border-transparent'
          ]">
            <div class="w-10 h-10 rounded-full" :style="{ backgroundColor: color.value }"></div>
            <span class="text-xs text-text-primary  text-center">{{ color.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: Platforms -->
    <div v-else-if="currentStep === 2" class="space-y-8 px-6">
      <h3 class="text-2xl font-semibold text-text-primary ">Platform Targeting</h3>
      <p class="text-sm text-text-secondary  text-secondary mt-1">
        Select which operating systems this project lane will support.
      </p>

      <BaseMultiSelect class="col-span-full mt-4" :allowCustom="true"  label="Technologies"
        placeholder="Select Technologies" size="lg" v-model="form.technologies" :options="technologies"
        :error="!!technologiesError" :message="technologiesError" @blur="touched.technologies = true" />

      <!-- Preferred Platforms -->
      <div class="mb-6 mt-6">
        <div class="mb-4 flex items-center gap-3">
          <label class="block text-base font-medium text-text-primary ">Preferred Platforms</label>
          <p v-if="platformsError" class="text-red-500 text-sm mt-1">({{ platformsError }})</p>
        </div>
        <div class="flex gap-3 flex-wrap">
          <button v-for="platform in platforms" :key="platform._id" @click="togglePlatform(platform._id)" :class="[
            'px-4 py-1 rounded-full cursor-pointer transition text-sm flex items-center gap-2',
            form.platforms.includes(platform._id) ? 'bg-accent text-white' : 'bg-bg-surface text-text-primary'
          ]">
            <i class="text-white fa-solid fa-check" v-if="form.platforms.includes(platform._id)"></i>

            {{ platform.title }}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-end mt-8 sticky bottom-0 bg-bg-body/90  gap-2 p-6 border-t border-border">
      <Button variant="secondary" @click="prev">
        {{ currentStep === 0 ? 'Cancel' : 'Back' }}
      </Button>
      <Button variant="primary" @click="next">
        {{ isPending ? 'Creating...' : currentStep === steps.length - 1 ? 'Create' : 'Next' }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import BaseModal from '../../../components/ui/BaseModal.vue'
import Stepper from '../../../components/ui/Stepper.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import BaseMultiSelect from '../../../components/ui/BaseMultiSelect.vue'
import Button from '../../../components/ui/Button.vue'
import { useWorkspaceStore } from '../../../stores/workspace'
import { usePlatforms, useTechnologies, useUserType } from '../../../queries/useWorkspace'
import { useCreateWorkspaceLane } from '../../../queries/useLane'
import { reactive, computed } from 'vue'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useWorkspaceId } from '../../../composables/useQueryParams'
const {workspaceId} = useWorkspaceId();


// validations
const touched = reactive({
  title: false,
  description: false,
  user_type: false,
  technologies: false,
  platforms: false,
})

// Computed validations
const titleError = computed(() => {
  if (!touched.title) return ''
  if (!form.value.title.trim()) return 'Lane Name is required'
  return ''
})

const descriptionError = computed(() => {
  if (!touched.description) return ''
  if (!form.value.description.trim()) return 'Description is required'
  return ''
})

const userTypeError = computed(() => {
  if (!touched.user_type) return ''
  if (form.value.user_types.length === 0) return 'Select at least one user type'
  return ''
})

const technologiesError = computed(() => {
  if (!touched.technologies) return ''
  if (form.value.technologies.length === 0) return 'Select at least one technology'
  return ''
})

const platformsError = computed(() => {
  if (!touched.platforms) return ''
  if (form.value.platforms.length === 0) return 'Select at least one platform'
  return ''
})

/* ----- State ----- */
const workspaceStore = useWorkspaceStore()

const queryClient = useQueryClient()

const steps = ['Basics', 'Color', 'Platform']
const currentStep = ref(0)

const platforms = usePlatforms().data
const technologies = useTechnologies().data
const userTypes = useUserType().data

/* ----- Form State ----- */
const createEmptyForm = () => ({
  title: '',
  description: '',
  user_types: [] as string[],
  color_code: '#4169E1',
  technologies: [] as string[],
  platforms: [] as string[],
})
const form = ref(createEmptyForm())

/* ----- Predefined Colors ----- */
const predefinedColors = [
  { label: 'Royal Blue', value: '#4169E1' },
  { label: 'Forest Green', value: '#228B22' },
  { label: 'Ruby Red', value: '#E82368' },
  { label: 'Amethyst Purple', value: '#9966CC' },
  { label: 'Tangerine Orange', value: '#FFA500' },
  { label: 'Turquoise', value: '#40E0D0' },
  { label: 'Coral Pink', value: '#FF6F61' },
  { label: 'Sunflower Yellow', value: '#FFDA03' },
  { label: 'Lavender', value: '#B57EDC' },
  { label: 'Mint Green', value: '#98FB98' },
  { label: 'Navy Blue', value: '#1E3A8A' },
  { label: 'Slate Gray', value: '#64748B' },
]

/* ----- Actions ----- */
const { mutate: createLane, isPending } = useCreateWorkspaceLane({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    workspaceStore.toggleCreateLaneModal()
    form.value = createEmptyForm()
    currentStep.value = 0
  },
})

function next() {
  if (currentStep.value === 0) {
    touched.title = true
    touched.description = true
    touched.user_type = true
    if (titleError.value || descriptionError.value || userTypeError.value) return
  }

  if (currentStep.value === 1) {
    // You could also validate color if needed
  }

  if (currentStep.value === 2) {
    touched.technologies = true
    touched.platforms = true
    if (technologiesError.value || platformsError.value) return
  }

  // Move next or submit
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    createLane({
      workspace_id: workspaceId.value,
      variables: {
        'lane-title': form.value.title,
        'lane-description': form.value.description,
        'lane-color': form.value.color_code,
        platforms: form.value.platforms,
        'user-types': form.value.user_types,
        technologies: form.value.technologies,
      },

    })
  }
}

function prev() {
  if (currentStep.value > 0) {
    currentStep.value--
  } else {
    workspaceStore.toggleCreateLaneModal()
    form.value = createEmptyForm()
    currentStep.value = 0
  }
}

function selectColor(hex: string) {
  form.value.color_code = hex
}

function togglePlatform(platformId: string) {
  const idx = form.value.platforms.indexOf(platformId)
  if (idx > -1) form.value.platforms.splice(idx, 1)
  else form.value.platforms.push(platformId)
}



</script>
