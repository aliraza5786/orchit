<template>
    <div class="flex items-center">
        <div :class="['flex', displayData.overlap]">
            <!-- Visible Avatars -->
            <template v-for="(collaborator, index) in displayData.visible" :key="index">
                <img v-if="image && getCollaboratorImage(collaborator)"
                    :src="getCollaboratorImage(collaborator)"
                    :alt="getAvatarLabel(collaborator)" loading="lazy" decoding="async" @click="collaborator.onclick?.()"
                    :class="`w-${size} h-${size} rounded-full border-2 border-white shadow-md object-cover cursor-pointer`" />

                <div v-else @click="collaborator.onclick?.()"
                    :style="{ backgroundColor: avatarColor({ email: getAvatarColorKey(collaborator) }) }"
                    :class="`w-${size} h-${size} rounded-full text-text-primary flex justify-center items-center bg-amber-600 border-2 border-border shadow-md object-cover cursor-pointer text-[10px] font-bold`">
                    {{ getCachedInitials(collaborator) }}
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
import { avatarColor } from '../../utilities/avatarColor';

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

const getCollaboratorImage = (collaborator) =>
    collaborator?.logo ??
    collaborator?.image ??
    collaborator?.avatar ??
    collaborator?.src ??
    collaborator?.profile_image ??
    null;

const getAvatarLabel = (collaborator) => {
    return collaborator?.name || collaborator?.title || collaborator?.full_name || collaborator?.email || '?';
};

const getAvatarColorKey = (collaborator) =>
    collaborator?.email || collaborator?.title || collaborator?.name || collaborator?.full_name || '?';

const getCachedInitials = (collaborator) => {
    const label = getAvatarLabel(collaborator);
    if (!initialsCache.has(label)) {
        initialsCache.set(label, getInitials(label));
    }
    return initialsCache.get(label);
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