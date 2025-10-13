<template>
    <div class="relative w-full">
        <!-- Dropdown Header -->
        <div class="w-full border p-3 max-h-[44px] rounded-sm border-border 2B2C3029] bg-white flex justify-between items-center cursor-pointer"
            @click="toggleDropdown">
            <div class="flex items-center gap-2">
                <span v-if="formattedDate">{{ formattedDate }}</span>
                <span v-else class="text-text-primary text-sm">Posted on</span>
                <button v-if="formattedDate" @click.stop="reset"
                    class="text-text-secondary -500 hover:text-text-primary focus:outline-none">
                    ✕
                </button>
            </div>
            <img src="../../../assets/icons/dropdown-arrow.svg" alt="">
        </div>

        <!-- Date Picker Popup -->
        <div v-if="isOpen" class="absolute mt-1 w-full z-10 bg-white border rounded shadow border-border 2B2C3033]">
            <VueDatePicker v-model="selectedDate" :teleport="false" inline @update:model-value="onDateSelected"
                class="w-full border-none" />
            <div class="flex justify-end gap-2 mt-4">
                <button @click="reset" class="text-sm border px-3 py-1 rounded">Cancel</button>
                <button @click="confirm" class="text-sm bg-black text-white px-3 py-1 rounded">OK</button>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const isOpen = ref(false)
const selectedDate = ref<Date | null>(null)
const emit = defineEmits(['update:modelValue'])

const formattedDate = computed(() =>
    selectedDate.value ? selectedDate.value.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
)

function onDateSelected(date: Date) {
    selectedDate.value = date
}

function confirm() {
    isOpen.value = false
    emit('update:modelValue', selectedDate.value)
}

function reset() {
    selectedDate.value = null
    isOpen.value = false
    emit('update:modelValue', null)
}

function toggleDropdown() {
    isOpen.value = !isOpen.value
}
</script>

<style scoped>
.dp__menu {
    border: none !important;
    width: 100%
}
</style>