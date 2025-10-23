<template>
    <div
        class="rounded-lg min-w-sm border border-border overflow-hidden flex flex-col justify-between  bg-bg-card w-full ">
        <!-- Header -->
        <div class="px-3 pt-3">
            <div class="flex justify-between items-start pb-2">
                <div>
                    <h3 class="text-lg font-semibold text-text-primary  text-left">
                        <!-- <div class="w-6 h-6 rounded-full " :style="`background:${color} ;`">
    
                        </div> -->

                        {{ title }}
                    </h3>
                    <p class="text-xs text-text-secondary ">{{ subtitle }}</p>
                </div>
                <span v-if="status != 'completed'" class="text-xs border rounded-full px-2 py-0.5"
                    :class="getColor(status)">
                    {{ status }}
                </span>
                <span v-if="status == 'completed'" class="text-xs">
                    Total Cards: {{ totalCard }}
                </span>
            </div>
            <!-- Progress -->
            <div v-if="status != 'completed'" class="mb-2 pb-3">
                <div class="flex justify-between text-sm text-text-secondary mb-1">
                    <span> {{ status == 'in_progress' ? 'Generating lane with AI...' : 'Progress' }} </span>
                    <span>{{ Math.round(liveProgress) }}%</span>
                </div>

                <ProgressBar class='mt-2' :progress="liveProgress" fillColor="bg-accent " :indeterminate="!!loading" />

                <!-- always render ProgressBar; feed liveProgress -->
            </div>
        </div>


        <!-- Footer -->
        <div class="flex justify-between items-center  bg-bg-body p-3  ">
            <!-- Avatars -->
            <div class="flex -space-x-2">
                <img v-for="(avatar, index) in visibleAvatars" :key="index" :src="avatar"
                    class="w-6 h-6 rounded-full border-2 border-border object-cover shadow" />
                <div v-if="extraCount > 0"
                    class="w-6 h-6 rounded-full border-2 border-border bg-bg-card text-[11px] font-semibold flex items-center justify-center text-text-secondary  shadow">
                    +{{ extraCount }}
                </div>
            </div>

            <!-- Date -->
            <div class="flex items-center gap-1 text-sm text-text-secondary ">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 7V3M16 7V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ date }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '../ui/ProgressBar.vue';
import { useIndeterminateProgress } from '../../utilities/IndeterminateProgress';

const props = withDefaults(defineProps<{
    title: string
    subtitle: string
    status: 'completed' | 'failed' | 'in_progress' | 'pending' | string
    progress?: number
    avatars: string[]
    maxVisible?: number
    date: string
    loading?: boolean
    color?: string
    totalCard?: any
}>(), {
    progress: 0,
    maxVisible: 2,
    loading: false,
    color: '#9CA3AF' // neutral fallback
})

// live progress: indeterminate when loading=true
const indeterminate = useIndeterminateProgress(() => !!props.loading)
const liveProgress = computed(() => props.loading ? indeterminate.value : props.progress)

const visibleAvatars = computed(() => props.avatars.slice(0, props.maxVisible))
const extraCount = computed(() =>
    props.avatars.length > props.maxVisible ? props.avatars.length - props.maxVisible : 0
)

const getColor = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-400/40 border-green-400 text-green-400'
        case 'failed': return 'bg-red-400/40 border-red-400 text-red-400'
        case 'in_progress': return 'bg-blue-400/20 border-blue-400 text-blue-400'
        case 'pending': return 'bg-amber-400/20 border-amber-400 text-amber-400'
        default: return 'progress-default'
    }
}
</script>
