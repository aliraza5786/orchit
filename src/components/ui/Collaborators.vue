<template>
    <div class="flex items-center">
        <div :class="['flex', overlapClass]">
            <!-- Visible Avatars -->
            <img v-if="image" v-for="(collaborator, index) in visibleAvatars" :key="index" :src="collaborator.image"
                @click="() => {
                    if (collaborator.onclick) {


                        collaborator.onclick()
                    }
                }" :alt="collaborator.name"
                :class="`w-${size} h-${size} rounded-full border-2 border-white shadow-md object-cover cursor-pointer`" />

            <div v-else v-for="(collaborator, index) in visibleAvatars" :key="`IMG-${index}`" @click="() => {
                if (collaborator.onclick) {


                    collaborator.onclick()
                }
            }" :alt="collaborator.name"
                :class="`w-${size} h-${size} rounded-full text-text-primary flex justify-center items-center  bg-amber-600 border-2 border-border shadow-md object-cover cursor-pointer`">
                {{ getInitials(collaborator?.name) }}
            </div>

            <!-- +X more indicator -->
            <div v-if="extraCount > 0"
                class="flex items-center justify-center text-xs font-medium bg-gray-300 text-text-secondary -700 border-2 border-white shadow-md rounded-full"
                :class="`w-${size} h-${size}`">
                +{{ extraCount }}
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
        default: '8', // e.g. 8 = 2rem in Tailwind (32px)
    },
    image: {
        type: Boolean,
        default: true

    }
})

const extraCount = computed(() =>
    props.avatars.length > props.maxVisible
        ? props.avatars.length - props.maxVisible
        : 0
)

const visibleAvatars = computed(() =>
    props.avatars.slice(0, props.maxVisible)
)

// Dynamic overlap spacing
const overlapClass = computed(() => {
    const count = visibleAvatars.value.length
    if (count <= 2) return '-space-x-2'
    if (count === 3) return '-space-x-3'
    if (count === 4) return '-space-x-4'
    if (count === 5) return '-space-x-2.5'
    return '-space-x-5'
})
</script>