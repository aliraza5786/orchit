<template>
    <BaseModal
      v-model="workspaceStore.showLimitExccedModal"
      size="lg"
      :modalClass="'!max-w-[720px]'"
    >
      <div class="px-6 py-6">
        <!-- Header -->
        <div class="flex items-center gap-4">
          <div class="relative h-12 w-12 shrink-0">
            <span class="absolute inset-0 rounded-full bg-amber-500/15"></span>
            <svg viewBox="0 0 24 24" class="relative h-12 w-12 text-amber-500">
              <path fill="currentColor" d="M10.4 2.5a2 2 0 0 1 3.2 0l8.35 12.54A2 2 0 0 1 20.35 18H3.65a2 2 0 0 1-1.6-2.96L10.4 2.5Zm1.6 4.5a.9.9 0 0 0-.9.9v5.2a.9.9 0 0 0 1.8 0V7.9a.9.9 0 0 0-.9-.9Zm0 9.6a1.2 1.2 0 1 0 0 2.4a1.2 1.2 0 0 0 0-2.4Z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="text-2xl font-semibold text-text-primary leading-tight">
              You’ve reached your workspace limit
            </h2>
            <p class="text-text-secondary mt-1">
              You’ve used {{ used }} of {{ limit }} workspaces on your current plan.
              Upgrade to create more workspaces and keep your team moving.
            </p>
          </div>
        </div>
  
        <!-- Usage -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Circular progress -->
          <div class="flex items-center justify-center">
            <div class="relative h-28 w-28">
              <!-- track -->
              <svg class="h-28 w-28 rotate-[-90deg]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" class="stroke-border" stroke-width="12" fill="none"/>
                <circle
                  cx="50" cy="50" r="42"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffset"
                  class="stroke-amber-500 transition-[stroke-dashoffset] duration-500 ease-out"
                  stroke-linecap="round" stroke-width="12" fill="none"
                />
              </svg>
              <div class="absolute inset-0 grid place-items-center">
                <div class="text-center">
                  <div class="text-xl font-semibold text-text-primary">{{ percent }}%</div>
                  <div class="text-[11px] text-text-secondary">used</div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Bar + counts -->
          <div class="md:col-span-2">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-text-secondary">Usage</span>
              <span class="text-text-primary font-medium">{{ used }} / {{ limit }}</span>
            </div>
            <div class="h-3 w-full rounded-full bg-bg-input overflow-hidden">
              <div
                class="h-full bg-amber-500 transition-all duration-500"
                :style="{ width: percent + '%' }"
              ></div>
            </div>
  
            <ul class="mt-4 grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <li class="flex items-center gap-2">
                <span class="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                Used workspaces: <span class="text-text-primary font-medium">{{ used }}</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="inline-block h-2 w-2 rounded-full bg-border"></span>
                Remaining: <span class="text-text-primary font-medium">{{ remaining }}</span>
              </li>
            </ul>
          </div>
        </div>
  
        <!-- Benefits -->
        <div class="mt-6 grid gap-3 text-sm">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"><path fill="currentColor" d="M9 16.2 4.8 12l1.4-1.4L9 13.4l8.8-8.8L19.2 6z"/></svg>
            </span>
            <p class="text-text-secondary"><span class="text-text-primary font-medium">Create more workspaces</span> for teams and projects without hitting caps.</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"><path fill="currentColor" d="M9 16.2 4.8 12l1.4-1.4L9 13.4l8.8-8.8L19.2 6z"/></svg>
            </span>
            <p class="text-text-secondary"><span class="text-text-primary font-medium">Priority support</span> and faster responses as you scale.</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"><path fill="currentColor" d="M9 16.2 4.8 12l1.4-1.4L9 13.4l8.8-8.8L19.2 6z"/></svg>
            </span>
            <p class="text-text-secondary"><span class="text-text-primary font-medium">Advanced admin controls</span> for roles, approvals, and security.</p>
          </div>
        </div>
  
        <!-- Actions -->
        <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" @click="close">
            Not now
          </Button>
          <Button :loading="isUpgrading" variant="primary" class="sm:ml-2" @click="onUpgrade">
            Upgrade plan
          </Button>
        </div>
      </div>
    </BaseModal>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import BaseModal from '../../../components/ui/BaseModal.vue'
  import Button from '../../../components/ui/Button.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useWorkspaceStore } from '../../../stores/workspace'
  import { confirmPayment, useCurrentPackage, useUpgradePackage } from '../../../queries/usePackages'
  
  const workspaceStore = useWorkspaceStore()
  const route = useRoute()
  const router = useRouter()
  
  /** Usage numbers for the ring/bar.
   *  If you already have these in a store, replace with your own sources. */
  const used = computed(() => workspaceStore?.limits?.features[1]?.usage.current ?? 0)
  const limit = computed(() => workspaceStore?.limits?.features[1]?.usage.limit ?? 0)
  const remaining = computed(() => Math.max(0, (limit.value || 0) - (used.value || 0)))
  const percent = computed(() => {
    if (!limit.value) return 0
    const p = (used.value / limit.value) * 100
    return Math.max(0, Math.min(100, Math.round(p)))
  })
  
  /** Circular progress math */
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = computed(() => circumference * (1 - percent.value / 100))
  
  /** Keep your existing upgrade flow intact */
  const { data: currentPackage, refetch: reftechCurrentPackage } = useCurrentPackage()
  const sessionId = route.query.session_id as string | undefined
  
  const { mutate: confirm } = confirmPayment(
    { sessionId: sessionId, interval: 'month' },
    {
      onSuccess: () => {
        reftechCurrentPackage()
        router.push('/')
      }
    }
  )
  
  if (sessionId) {
    confirm({ packageId: currentPackage?.value?.nextPackage?.id })
  }
  
  const { mutate: upgradePackage, isPending: isUpgrading } = useUpgradePackage({
    onSuccess: (data: any) => {
      window.open(data?.checkoutUrl)
    }
  })
  
  function onUpgrade() {
    // Prefer letting parent handle it (you already emit 'upgrade' in your old file)
    // If you want this component to trigger checkout directly, uncomment below:
    // upgradePackage({ packageId: currentPackage?.value?.nextPackage?.id, interval: 'month' })
  
    // Emit so parent can decide which package to open
    emit('upgrade')
  }
  
  function close() {
    workspaceStore.showLimitExccedModal = false
  }
  
  const emit = defineEmits<{
    (e: 'upgrade'): void
  }>()
  </script>
  