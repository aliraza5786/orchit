import { ref, watch } from 'vue'

/**
 * Debounces a value to prevent excessive updates
 * @param value - The reactive value to debounce
 * @param delay - Delay in milliseconds (default: 100ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: () => T, delay = 100) {
  const debouncedValue = ref<T>(value())
  let timeout: number | null = null

  watch(value, (newValue) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = window.setTimeout(() => {
      debouncedValue.value = newValue
      timeout = null
    }, delay)
  })

  return debouncedValue
}
