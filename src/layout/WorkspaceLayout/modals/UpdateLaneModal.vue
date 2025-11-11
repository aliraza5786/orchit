<template>
    <BaseModal v-model="workspaceStore.showUpdateLaneModal" modalClass="!py-0" size="lg">
        <div v-if="isFetching || isLanePending" class="flex justify-center min-h-[400px] items-center h-full w-full">

            <div role="status" aria-label="Loading"
                class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"></div>
        </div>

        <div v-else>
            <div
                class="sticky flex-col top-0 backdrop-blur-3xl z-1 flex justify-between pt-6 items-start bg-light-black px-6 border-b border-border pb-4 mb-4">
                <h2 class="text-xl font-semibold">Update Lane</h2>
                <!-- <Stepper :steps="steps" :currentStep="currentStep" /> -->
            </div>

            <!-- Step 1: Basics -->
            <div class="space-y-8 px-6">
                <div class="space-y-2.5">
                    <h3 class="text-2xl font-semibold text-text-primary ">Project Basics</h3>
                    <p class="text-sm text-text-secondary  mt-1">
                        Let's start by setting up the foundational details of your project lane.
                    </p>
                </div>

                <div class="space-y-6">
                    <BaseTextField v-model="form.title" label="Lane Name" placeholder="e.g., Product Development"
                        :error="!!titleError" :message="titleError" @blur="touched.title = true" />
                    <BaseTextAreaField v-model="form.description" label="Lane Description"
                        placeholder="Describe your lane here" :error="!!descriptionError" :message="descriptionError"
                        @blur="touched.description = true" />
                    <!-- <BaseMultiSelect v-model="form.user_type" :options="userTypes" label="User Base Type"
                    placeholder="Select a user base" :error="!!userTypeError" :message="userTypeError"
                    @blur="touched.user_type = true" /> -->
                </div>
            </div>

            <!-- Step 2: Color -->
            <div class="space-y-8 px-6">


                <div class="flex items-center gap-4 mt-4">
                    <div class="w-10 h-10 rounded-full border border-border cursor-pointer relative"
                        :style="{ backgroundColor: form.color_code }">
                        <input type="color" v-model="form.color_code"
                            class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    <div class="text-sm text-text-primary  font-medium">
                        Set Color
                        <div class="text-xs text-text-secondary  ">{{ form.color_code }}</div>
                    </div>
                </div>

                <div class="mt-6">
                    <label class="block text-base font-medium text-text-primary  mb-4">Or Choose Predefined
                        Color</label>
                    <div class="grid grid-cols-6 gap-3 p-4.5 border border-border rounded-md">
                        <div v-for="color in predefinedColors" :key="color.label" @click="selectColor(color.value)"
                            :class="[
                                'rounded-lg cursor-pointer border-2 transition py-5 px-3 flex justify-center items-center flex-col gap-2',
                                form.color_code === color.value ? 'border-border scale-105 bg-bg-dropdown ' : 'border-transparent'
                            ]">
                            <div class="w-10 h-10 rounded-full" :style="{ backgroundColor: color.value }"></div>
                            <span class="text-xs text-text-primary  text-center">{{ color.label }}</span>
                        </div>
                    </div>
                </div>
            </div>



            <!-- Footer -->
            <div
                class="flex backdrop-blur-3xl justify-end mt-8 sticky bottom-0 dark:bg-light-black gap-2 p-6 border-t border-border">
                <Button variant="secondary" @click="prevStep">
                    {{ currentStep === 0 ? 'Cancel' : 'Back' }}
                </Button>
                <Button variant="primary" @click="nextStep">
                    {{ isLaneUpdateing ? 'Updating...' : 'Update' }}
                </Button>
            </div>
        </div> <!-- Header -->


    </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import BaseModal from '../../../components/ui/BaseModal.vue'
// import Stepper from '../../../components/ui/Stepper.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
// import BaseMultiSelect from '../../../components/ui/BaseMultiSelect.vue'
import Button from '../../../components/ui/Button.vue'
import { useWorkspaceStore } from '../../../stores/workspace'
// import { usePlatforms, useTechnologies, useUserType } from '../../../queries/useWorkspace'
import { useUpdateWorkspaceLane, useWorkspaceLane } from '../../../queries/useLane'
import { watch } from 'vue'

const props = defineProps<{ id: string }>()
const workspaceStore = useWorkspaceStore()
const queryClient = useQueryClient()

// const steps = ['Basics', 'Color', 'Platform']
const currentStep = ref(0)
const isPending = ref(false)

// const platforms = usePlatforms().data ?? []
// const technologies = useTechnologies().data ?? []
// const userTypes = useUserType().data ?? []


// Form state
const form = ref({
    title: '',
    description: '',
    user_type: [] as string[],
    color_code: '#4169E1',
    technologies: [] as string[],
    platforms: [] as string[],
})

// Touched fields for validation
const touched = reactive({
    title: false,
    description: false,

})

// Validation
const titleError = computed(() => touched.title && !form.value.title.trim() ? 'Lane Name is required' : '')
const descriptionError = computed(() => touched.description && !form.value.description.trim() ? 'Description is required' : '')

// Predefined colors
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

const { data: lane, isFetching, isPending: isLanePending } = useWorkspaceLane(props.id, {
    enabled: !!props.id // only fetch when id is truthy
})

const { mutate: updateLane, isPending: isLaneUpdateing } = useUpdateWorkspaceLane({
    onSuccess: () => {
        workspaceStore.toggleUpdateLaneModal()
        queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onSettled: () => {
        isPending.value = false
    },
    onError: (err: any) => {
        console.error('Update failed', err)
    }
})
// Watch for changes in the ID prop
watch(
    lane,
    (newLane) => {
        if (!newLane) return;
        const newValue = newLane?.variables
        form.value = {
            title: newValue['lane-title'] || '',
            description: newValue['lane-description'] || '',
            user_type: newValue['user-types']?.map((u: any) => u._id) || [],
            color_code: newValue['lane-color'] || '#4169E1',
            technologies: newValue.technologies?.map((t: any) => t._id) || [],
            platforms: newValue.platforms?.map((t: any) => t._id) || [],
        }

        console.log('Lane data loaded into form:', form.value)
    },
    { immediate: true }
)


const nextStep = () => {
    // Mark all fields in current step as touched
    touched.title = true
    touched.description = true



    if (!form.value.color_code) {
        alert('Please select a color')
        return
    }




    updateLane({
        payload:

            { 
                
                'variables': { 'lane-title': form.value.title, 'lane-description': form.value.description, 'lane-color': form.value.color_code, },  lane_id: props.id }
    })

}


const prevStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--
    } else {
        workspaceStore.toggleUpdateLaneModal()
    }
}

const selectColor = (hex: string) => {
    form.value.color_code = hex
}

// const togglePlatform = (platformId: string) => {
//     const idx = form.value.platforms.indexOf(platformId)
//     if (idx > -1) form.value.platforms.splice(idx, 1)
//     else form.value.platforms.push(platformId)
// }
</script>