<template>
  <BaseModal v-model="workspaceStore.showCreateLaneModal" modalClass="!py-0" size="lg">
    <!-- Header -->
    <div
      class="sticky flex-col top-0 flex justify-between bg-bg-body/90 z-1 items-start pt-6 px-6 border-b border-border  pb-4 mb-4">
      <h2 class="text-xl font-semibold">Create a New Tab</h2>
    </div>

    <!-- Step 1: Basics -->
    <div class="space-y-8 px-6">
      <div class="space-y-2.5">
        <h3 class="text-2xl font-semibold text-text-primary ">Project Basics</h3>
        <p class="text-sm text-text-secondary  mt-1 ">
          Let's start by setting up the foundational details of your project Tabs.
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex gap-4">
          <BaseTextField v-model="form.title" placeholder="Tab name " label="Tab Name" :error="!!titleError"
            :message="titleError" @blur="touched.title = true" class="flex-auto" />

          <!-- Custom Color Picker -->
          <div class="flex items-center gap-4 mt-4 flex-auto">
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

        </div>

        <BaseTextAreaField v-model="form.description" label="Tab Description" placeholder="Describe your Tab here.. "
          :error="!!descriptionError" :message="descriptionError" @blur="touched.description = true" />



      </div>
    </div>


    <!-- Footer -->
    <div class="flex justify-end mt-8 sticky bottom-0 bg-bg-body/90  gap-2 p-6 border-t border-border">
      <Button variant="secondary" @click="prev">
        Cancel
      </Button>
      <Button variant="primary" @click="next">
        {{ isPending ? 'Creating...' : 'Create' }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import Button from '../../../components/ui/Button.vue'
import { useWorkspaceStore } from '../../../stores/workspace'
// import { usePlatforms, useTechnologies, useUserType } from '../../../queries/useWorkspace'
import { useCreateWorkspaceLane } from '../../../queries/useLane'
import { reactive, computed } from 'vue'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useWorkspaceId } from '../../../composables/useQueryParams'
import { usePermissions } from '../../../composables/usePermissions'
const { workspaceId } = useWorkspaceId();
const { canCreateLane } = usePermissions()


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
  if (!form.value.title.trim()) return 'Tab Name is required'
  return ''
})

const descriptionError = computed(() => {
  if (!touched.description) return ''
  if (!form.value.description.trim()) return 'Description is required'
  return ''
})

// const userTypeError = computed(() => {
//   if (!touched.user_type) return ''
//   if (form.value.user_types.length === 0) return 'Select at least one user type'
//   return ''
// })

// const technologiesError = computed(() => {
//   if (!touched.technologies) return ''
//   if (form.value.technologies.length === 0) return 'Select at least one technology'
//   return ''
// })

// const platformsError = computed(() => {
//   if (!touched.platforms) return ''
//   if (form.value.platforms.length === 0) return 'Select at least one platform'
//   return ''
// })

/* ----- State ----- */
const workspaceStore = useWorkspaceStore()

const queryClient = useQueryClient()

// const steps = ['Basics', 'Color', 'Platform']
const currentStep = ref(0)


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

  touched.title = true;
  touched.description = true
  if (titleError.value || descriptionError.value) return
  if (!canCreateLane.value) return




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

function prev() {
  if (currentStep.value > 0) {
    currentStep.value--
  } else {
    workspaceStore.toggleCreateLaneModal()
    form.value = createEmptyForm()
    currentStep.value = 0
  }
}


</script>
