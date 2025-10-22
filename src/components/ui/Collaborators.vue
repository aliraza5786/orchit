<template>
    <div class="flex items-center">
        <div :class="['flex', displayData.overlap]">
            <!-- Visible Avatars -->
            <template v-if="image">
                <img v-for="(collaborator, index) in displayData.visible"
                    :key="index"
                    :src="collaborator.image"
                    :alt="collaborator.name"
                    loading="lazy"
                    decoding="async"
                    @click="collaborator.onclick?.()"
                    :class="`w-${size} h-${size} rounded-full border-2 border-white shadow-md object-cover cursor-pointer`" />
            </template>

            <template v-else>
                <div v-for="(collaborator, index) in displayData.visible"
                    :key="`IMG-${index}`"
                    @click="collaborator.onclick?.()"
                    :alt="collaborator.name"
                    :class="`w-${size} h-${size} rounded-full text-text-primary flex justify-center items-center bg-amber-600 border-2 border-border shadow-md object-cover cursor-pointer`">
                    {{ getCachedInitials(collaborator?.name) }}
                </div>
            </template>

            <!-- +X more indicator -->
            <div v-if="displayData.extra > 0"
                class="flex items-center justify-center text-xs font-medium bg-gray-300 text-text-secondary border-2 border-white shadow-md rounded-full"
                :class="`w-${size} h-${size}`">
                +{{ displayData.extra }}
            </div>
        </div>
    </div>
</template>


<script setup>
import { computed } from 'vue'
import { getInitials } from '../../utilities'

const props = defineProps({
    avatars: {
        type: Array,
        default: () => [],
    },
    maxVisible: {
        type: Number,
        default: 4,
    },
    size: {
        type: String,
        default: '8',
    },
    image: {
        type: Boolean,
        default: true
    }
})

// Cache initials to avoid recomputation
const initialsCache = new Map();
const getCachedInitials = (name) => {
    if (!initialsCache.has(name)) {
        initialsCache.set(name, getInitials(name));
    }
    return initialsCache.get(name);
};

// Combine computed properties for better performance
const displayData = computed(() => {
    const total = props.avatars.length;
    const max = props.maxVisible;
    const visible = props.avatars.slice(0, max);
    const extra = total > max ? total - max : 0;

    // Calculate overlap class based on visible count
    let overlap = '-space-x-2';
    const count = visible.length;
    if (count === 3) overlap = '-space-x-3';
    else if (count === 4) overlap = '-space-x-4';
    else if (count === 5) overlap = '-space-x-2.5';
    else if (count > 5) overlap = '-space-x-5';

    return { visible, extra, overlap };
});
</script>