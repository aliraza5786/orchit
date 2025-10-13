<template>
    <div class="flex justify-between items-center px-6 py-4 border-t border-border-gray text-sm text-text-secondary -700 w-full sticky bottom-0 bg-white">
        <!-- Previous Button -->
        <Button variant="secondary" class="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-40"
            :disabled="currentPage === 1" @click="$emit('update:page', currentPage - 1)">
            ← Previous
        </Button>

        <!-- Page Numbers -->
        <div class="flex items-center gap-0.5">
            <button v-for="page in visiblePages" :key="page" @click="$emit('update:page', page)"
                class="px-4 py-2.5 rounded-lg hover:bg-[#FAFAFA] text-sm cursor-pointer" :class="{
                    'bg-[#FAFAFA] font-semibold': currentPage === page
                }">
                {{ page }}
            </button>
            <span v-if="hasEllipsis">...</span>
            <button v-if="lastPage > maxVisible && currentPage < lastPage" @click="$emit('update:page', lastPage)"
                class="px-3 py-1.5 rounded-md hover:bg-gray-100"
                :class="{ 'bg-gray-100 font-semibold': currentPage === lastPage }">
                {{ lastPage }}
            </button>
        </div>

        <!-- Next Button -->
        <Button variant="secondary" class="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-40"
            :disabled="currentPage === lastPage" @click="$emit('update:page', currentPage + 1)">
            Next →
        </Button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from './Button.vue';
const props = defineProps<{
    currentPage: number
    lastPage: number
    maxVisible?: number
}>()

defineEmits(['update:page'])

const maxVisible = props.maxVisible ?? 5

const visiblePages = computed(() => {
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, props.currentPage - half)
    let end = Math.min(props.lastPage, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const hasEllipsis = computed(() => {
    return visiblePages.value[visiblePages.value.length - 1] < props.lastPage - 1
})
</script>