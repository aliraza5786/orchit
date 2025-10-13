<template>
    <div class="w-full relative" ref="dropdownRef">
        <div @click="toggleDropdown"
            class="w-full border border-border DFE3E8] max-h-[44px]  p-3 rounded-sm  bg-white flex items-center justify-between cursor-pointer">
            <span class="text-sm text-text-primary">
                <template v-if="isMulti">
                    <template v-if="selectedOptions.length > 0" v-for="option in selectedOptions" :key="option.value">
                        <div class="inline-flex items-center gap-1 mr-2 bg-gray-100 px-2 py-1 rounded">
                            <div v-if="avatar"
                                class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                                :style="{ backgroundColor: option.color || '#ccc' }">
                                {{ getInitials(option.label) }}
                            </div>
                            <span class="text-sm">{{ option.label || label }}</span>
                            <button @click.stop="removeOption(option)"
                                class="ml-1 text-text-secondary -400 hover:text-text-primary">✕</button>
                        </div>
                    </template>
                    <span v-else>{{ label }}</span>
                </template>

                <template v-else>
                    <div v-if="selectedOption" class="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <div v-if="avatar"
                            class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                            :style="{ backgroundColor: selectedOption.color || '#ccc' }">
                            {{ getInitials(selectedOption.label) }}
                        </div>
                        <span class="text-sm">{{ selectedOption.label }}</span>
                        <button @click.stop="clearSelection" class="ml-1 text-text-secondary -400 hover:text-text-primary">✕</button>
                    </div>
                    <span v-else>{{ label }}</span>
                </template>

            </span>
            <img src="../../../assets/icons/dropdown-arrow.svg" alt="">
        </div>

        <!-- Dropdown -->
        <div v-if="open"
            class="absolute top-full left-0 z-10 mt-1 w-full border border-border 2B2C3029] rounded-lg p-2 bg-white shadow">
            <input v-model="search" placeholder="Search & Select"
                class="w-full px-3 py-2 border rounded-sm  h-[40px] border-border 2B2C3029] outline-none text-sm"
                @click.stop />

            <ul class="max-h-48 overflow-y-auto">
                <li v-for="option in filteredOptions" :key="option.value"
                    class="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    @click="toggleSelection(option)">

                    <input :type="isMulti ? 'checkbox' : 'radio'" :checked="isSelected(option)"
                        class="form-checkbox h-4 w-4 text-indigo-600" @change.stop />

                    <div v-if="avatar" class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                        :style="{ backgroundColor: option.color || '#999' }">
                        {{ getInitials(option.label) }}
                    </div>
                    <span class="text-sm">{{ option.label }}</span>
                </li>
                <li v-if="filteredOptions.length === 0" class="px-3 py-2 text-text-secondary -400 text-sm">No Result Found</li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

interface Option {
    label: string
    value: string | number
    color?: string
}

const props = defineProps<{
    modelValue: string | number | Array<string | number> | null
    options: Option[]
    label?: string
    placeholder?: string
    isMulti?: boolean
    avatar?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => (open.value = !open.value)

const filteredOptions = computed(() =>
    props.options.filter(opt => opt.label.toLowerCase().includes(search.value.toLowerCase()))
)

function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        open.value = false
    }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

const selectedOption = computed(() =>
    props.isMulti ? null : props.options.find(opt => opt.value === props.modelValue)
)

const selectedOptions = computed(() =>
    props.isMulti && Array.isArray(props.modelValue)
        ? props.options.filter(opt => (props.modelValue as any[]).includes(opt.value))
        : []
)

function isSelected(option: Option) {
    if (props.isMulti && Array.isArray(props.modelValue)) {
        return props.modelValue.includes(option.value)
    }
    return props.modelValue === option.value
}

function toggleSelection(option: Option) {
    if (props.isMulti) {
        let values = Array.isArray(props.modelValue) ? [...props.modelValue] : []
        const index = values.indexOf(option.value)
        if (index >= 0) {
            values.splice(index, 1)
        } else {
            values.push(option.value)
        }
        emit('update:modelValue', values)
    } else {
        emit('update:modelValue', option.value)
        open.value = false
    }
    search.value = ''
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function removeOption(option: Option) {
    if (props.isMulti && Array.isArray(props.modelValue)) {
        const values = props.modelValue.filter(v => v !== option.value)
        emit('update:modelValue', values)
    }
}

function clearSelection() {
    emit('update:modelValue', null)
}

</script>