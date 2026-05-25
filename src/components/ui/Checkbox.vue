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
            'flex mt-0.5 items-center justify-center border transition-colors duration-200',
            'w-4 min-w-4 h-4 min-h-4',
            ' rounded-[3px] border-orchit-white/10 D5D7DA] ',
            checked ? (inSpace? 'bg-primary-color border-primary-color': 'bg-accent border-accent' ) : 'bg-bg-card'
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
    inSpace?: boolean
}>()

defineEmits<{
    (e: 'change', event: Event): void
}>()

const checkboxRef = ref<HTMLInputElement | null>(null)
</script>