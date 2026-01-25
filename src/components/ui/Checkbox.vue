<template>
    <label :class="[
        'relative inline-flex items-start gap-2 cursor-pointer',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        className
    ]">
        <!-- Hidden Checkbox -->
        <input ref="checkboxRef" type="checkbox" :id="id" :name="name" :checked="checked"
            @change="$emit('change', $event)" :disabled="disabled" class="sr-only" />

        <!-- Styled Box -->
        <div :class="[
            'flex items-center justify-center border transition-colors duration-200',
            'md:w-5 md:min-w-5 md:h-5 md:min-h-5 w-3.5 h-3.5',
            'md:rounded-[6px] rounded-[3px] border-border D5D7DA] ',
            checked ? 'bg-black border-transparent' : 'bg-white'
        ]">
            <img v-if="checked" :src="tick" alt="check" class="w-3 transition-opacity duration-150" />
        </div>

        <!-- Label Text -->
        <span v-if="label" class="md:text-sm text-xs text-[var(--sub-text)]">
            {{ label }}
        </span>
    </label>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import tick from '../../assets/icons/check.svg'

defineProps<{
    checked: boolean
    name?: string
    label?: string
    id?: string
    disabled?: boolean
    className?: string
}>()

defineEmits<{
    (e: 'change', event: Event): void
}>()

const checkboxRef = ref<HTMLInputElement | null>(null)
</script>