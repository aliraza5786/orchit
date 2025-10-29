<template>
  <!-- remove the confetti overlay div -->

  <!-- Header -->
  <div
    class="relative p-3 rounded-lg min-w-sm border border-border overflow-hidden flex flex-col justify-between bg-bg-card w-full">
    <div class="flex justify-between items-start pb-2">
      <div>
        <h3 class="text-lg font-semibold text-text-primary text-left">
          {{ title }}
        </h3>
        <p class="text-xs text-text-secondary text-left ">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="!totalCard && status" class="text-xs border rounded-full px-2 py-0.5" :class="getColor(status)">
          {{ status }}
        </span>


      </div>
    </div>

    <!-- Progress -->
    <div class=" ">
      <div class="flex justify-between text-sm text-text-secondary mb-1">
        <div> <span>{{ status == 'in_progress' ? 'Generating lane with AI...' : 'Progress' }}</span> <i
            v-if="status == 'in_progress'" class="fa-regular text-left fa-arrows-spin animate-spin duration-250"></i>
        </div>
        <span v-if="ai">{{ Math.round(liveProgress) }}% <!-- 🎉 shows only at 100%, re-animates on each completion -->
          <span v-if="atHundred" :key="confettiIconKey" class="confetti-icon select-none" aria-label="Completed">
            🎉
          </span></span>
        <span v-else>
       {{ doneCard }}  / {{ totalCard }}
        </span>
      </div>
      <ProgressBar class="mt-2" :progress="liveProgress" fillColor="bg-accent" :indeterminate="!!loading" />
    </div>
  </div>

</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProgressBar from '../ui/ProgressBar.vue'
import { useIndeterminateProgress } from '../../utilities/IndeterminateProgress'

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
  ai?: boolean,
  doneCard?:any
}>(), {
  totalCard: 0,
  progress: 0,
  maxVisible: 2,
  loading: false,
  color: '#9CA3AF'
})

const indeterminate = useIndeterminateProgress(() => !!props.loading)
const liveProgress = computed(() => (props.loading ? indeterminate.value : props.progress))

// const visibleAvatars = computed(() => props.avatars.slice(0, props.maxVisible))
// const extraCount = computed(() => (props.avatars.length > props.maxVisible ? props.avatars.length - props.maxVisible : 0))

// === confetti icon state ===
const atHundred = computed(() => Math.round(liveProgress.value) >= 100)
const confettiIconKey = ref(0) // changing key re-triggers CSS animation

watch(atHundred, (is100, was100) => {
  if (is100 && !was100) confettiIconKey.value++ // reanimate each time we newly hit 100
})

// function startConfetti() {
  // no-op: keeping the click handler harmless if you still have it on the root
// }

function getColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-400/40 border-green-400 text-green-400'
    case 'failed': return 'bg-red-400/40 border-red-400 text-red-400'
    case 'in_progress': return 'bg-blue-400/20 border-blue-400 text-blue-400'
    case 'pending': return 'bg-amber-400/20 border-amber-400 text-amber-400'
    default: return 'progress-default'
  }
}
</script>
<style scoped>
.confetti-icon {
  font-size: 1.1rem;
  /* tweak as you like */
  line-height: 1;
  animation: confetti-pop 600ms ease-out forwards;
  transform-origin: center;
  filter: drop-shadow(0 1px 0.5px rgba(0, 0, 0, .2));
}

@keyframes confetti-pop {
  0% {
    transform: scale(.2) rotate(-18deg);
    opacity: 0;
  }

  55% {
    transform: scale(1.25) rotate(10deg);
    opacity: 1;
  }

  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
