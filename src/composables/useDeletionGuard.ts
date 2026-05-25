import { computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import { toast } from 'vue-sonner'

export function useDeletionGuard(profileRef: any) {
  const router      = useRouter()
  const authStore   = useAuthStore()
  const queryClient = useQueryClient()

  let pollInterval: ReturnType<typeof setInterval> | null = null

  const isPendingDeletion = computed(() =>
    !!profileRef.value?.active_company?.is_pending_deletion
  )

  const deletionScheduledDate = computed(() =>
    profileRef.value?.active_company?.deletion_scheduled_date
      ? new Date(profileRef.value.active_company.deletion_scheduled_date)
      : null
  )

  const isDeletionExpired = computed(() => {
    if (!deletionScheduledDate.value) return false
    return Date.now() >= deletionScheduledDate.value.getTime()
  })

  async function forceLogout() {
    toast.error('Your organization has been deleted. You have been signed out.', {
      duration: 6000,
    })
    stopPolling()

    // clear auth + queries
    authStore.logout?.()
    authStore.clearCompany?.()
    localStorage.removeItem('company_id')
    localStorage.removeItem('company_name')
    queryClient.clear()

    await router.push('/login')
  }

  function checkDeletion() {
    if (isPendingDeletion.value && isDeletionExpired.value) {
      forceLogout()
    }
  }

  function startPolling() {
    if (pollInterval) return
    // check every 60 seconds
    pollInterval = setInterval(() => {
      // re-fetch profile so we get fresh server state
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      checkDeletion()
    }, 60_000)
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // start/stop polling based on pending state
  watch(isPendingDeletion, (pending) => {
    if (pending) {
      checkDeletion() // immediate check on mount
      startPolling()
    } else {
      stopPolling()
    }
  }, { immediate: true })

  // also watch profile changes directly (e.g. after a refetch)
  watch(() => profileRef.value?.active_company, () => {
    checkDeletion()
  }, { deep: false })

  onUnmounted(() => stopPolling())

  return { isPendingDeletion, isDeletionExpired }
}