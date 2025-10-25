<template>
    <BaseModal v-model="isOpen" modalClass="!py-0" size="md">
        <!-- Header -->
        <div class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-body pb-4 mb-4">
            <h2 class="text-xl font-semibold">Start Sprint</h2>
            <p class="text-sm text-text-secondary mt-1">
                Update sprint name, goal, and dates, then click <span class="font-medium">Start</span>.
            </p>
        </div>

        <!-- Body -->
        <div class="px-6 grid grid-cols-2 gap-4">


            <!-- Start date -->
            <div class="flex gap-1 flex-col">
                <label class="text-sm">Start date</label>
                <div class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
                    :class="startError ? 'border-red-500' : ''">
                    <DatePicker placeholder="Set start date" class="w-full" :model-value="form.start" emit-as="ymd"
                        @update:modelValue="setStartDate" />
                </div>
                <p v-if="startError" class="text-xs text-red-500">{{ startError }}</p>
            </div>

            <!-- End date -->
            <div class="flex gap-1 flex-col">
                <label class="text-sm">End date</label>
                <div class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
                    :class="endError ? 'border-red-500' : ''">
                    <DatePicker placeholder="Set end date" class="w-full" :model-value="form.end" emit-as="ymd"
                        @update:modelValue="setEndDate" />
                </div>
                <p v-if="endError" class="text-xs text-red-500">{{ endError }}</p>
            </div>

            <!-- Goal (optional) -->
            <div class="flex flex-col col-span-2">
                <label class="text-sm">Goal (optional)</label>
                <textarea v-model="form.goal" class="w-full rounded-lg border border-border px-3 py-2 bg-bg-input"
                    rows="2" placeholder="Ship onboarding flow" />
            </div>


        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 p-6 mt-8 sticky bottom-0 bg-bg-body border-t border-border">
            <Button variant="secondary" @click="cancel">Cancel</Button>
            <Button variant="primary" :disabled="!isValid" @click="save">Start</Button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import type { Sprint } from '../composables/useBacklogStore'
import DatePicker from '../../Product/components/DatePicker.vue'

/** Emits */
const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'save', v: Partial<Sprint>): void
    (e: 'close'): void
}>()

/** Props */
const props = withDefaults(
    defineProps<{ modelValue: boolean; sprint: Sprint }>(),
    { modelValue: false }
)

/** v-model proxy for BaseModal */
const isOpen = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
})

/** Local form */
const form = reactive<Partial<Sprint>>({
    goal: '',
    start: '',
    end: '',
})

/** Hydrate form when sprint changes or when opened */
watch(
    () => props.sprint,
    (s) => {
        if (!s) return
        form.goal = s.goal ?? ''
        form.start = s.start ?? ''
        form.end = s.end ?? ''
        resetTouched()
    },
    { immediate: true }
)

/** Touched + validation */
const touched = reactive({ start: false, end: false })



// Start is optional here; add a rule if you want it required
const startError = computed(() => '')

const endError = computed(() => {
    if (!touched.end) return ''
    if (form.start && form.end) {
        const s = toDayStartMs(form.start)
        const e = toDayStartMs(form.end)
        if (Number.isFinite(s) && Number.isFinite(e) && e < s) return 'End date cannot be before start date'
    }
    return ''
})

const isValid = computed(() =>
    !endError.value
)

/** Handlers */
function setStartDate(v: string | null) {
    form.start = v || ''
    touched.start = true
}
function setEndDate(v: string | null) {
    form.end = v || ''
    touched.end = true
}

function cancel() {
    isOpen.value = false
    emit('close')
}

function save() {
    touched.start = true
    touched.end = true
    if (!isValid.value) return
    emit('save', {

        goal: form.goal ?? '',
        start: form.start || '',
        end: form.end || '',
    })

}

/** Utils */
function resetTouched() {
    touched.start = false
    touched.end = false
}
function toDayStartMs(val?: string | null) {
    if (!val) return NaN
    return new Date(`${val}T00:00:00`).getTime()
}
</script>