<template>
    <div
        class="flex   items-center border border-border rounded-md overflow-hidden h-8.5 bg-bg-input py-2 px-3 gap-3 flex-1 min-w-59">
        <!-- Search Icon -->
      <i class="text-text-secondary fa-solid fa-magnifying-glass" ></i>
        <!-- Input -->
        <input v-model="search" :placeholder="placeholder"
            class="flex-1 py-2  pr-3 text-sm outline-none text-text-primary  placeholder-text-secondary" type="text" />

        <!-- Optional Right Icon Slot -->
        <div v-if="$slots.rightIcon" class="px-3 flex items-center border-l border-border cursor-pointer">
            <slot name="rightIcon" />
        </div>
    </div>
</template>

<script setup lang="ts">
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref } from 'vue'

defineProps<{
    placeholder?: string
}>()

const search = ref('')
</script>