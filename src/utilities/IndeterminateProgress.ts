// composables/useIndeterminateProgress.ts
import { ref, watch, onUnmounted } from 'vue'

export function useIndeterminateProgress(loading: () => boolean, {
  start = 0,
  maxWhileLoading = 90,
  step = 0.8,        // % per tick
  intervalMs = 120,  // tick rate
} = {}) {
  const value = ref(start)
  let timer: number | null = null

  const startTimer = () => {
    if (timer != null) return
    timer = window.setInterval(() => {
      if (!loading()) return
      value.value = Math.min(value.value + step, maxWhileLoading)
    }, intervalMs) as unknown as number
  }

  const stopTimer = () => {
    if (timer != null) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(loading, (isLoading) => {
    if (isLoading) {
      value.value = start
      startTimer()
    } else {
      // finish cleanly
      value.value = 100
      setTimeout(() => {
        value.value = start
        stopTimer()
      }, 300)
    }
  }, { immediate: true })

  onUnmounted(stopTimer)
  return value
}
