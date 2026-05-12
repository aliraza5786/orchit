<template>
  <div class="w-full space-y-6">

    <!-- Section label -->
    <div>
      <p class="text-[11px] font-medium tracking-widest uppercase text-text-secondary mb-4">
        Token Overview
      </p>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p class="text-xs text-text-secondary mb-1.5">Allocated to you</p>
          <p class="text-2xl font-medium text-accent">{{ fmt(stats.allocated) }}</p>
          <p class="text-[11px] text-text-secondary mt-1">tokens / month</p>
        </div>

        <div class="bg-bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p class="text-xs text-text-secondary mb-1.5">Used this month</p>
          <p class="text-2xl font-medium" :class="usedColor">{{ fmt(stats.used) }}</p>
          <p class="text-[11px] text-text-secondary mt-1">{{ usedPct }}% of allocation</p>
        </div>

        <div class="bg-bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p class="text-xs text-text-secondary mb-1.5">Remaining</p>
          <p class="text-2xl font-medium text-text-primary">
            {{ fmt(stats.allocated - stats.used) }}
          </p>
          <p class="text-[11px] text-text-secondary mt-1">{{ 100 - usedPct }}% remaining</p>
        </div>

        <div class="bg-bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p class="text-xs text-text-secondary mb-1.5">Reset in</p>
          <p class="text-2xl font-medium text-text-primary">{{ stats.daysUntilReset }}</p>
          <p class="text-[11px] text-text-secondary mt-1">days</p>
        </div>
      </div>
    </div>

    <!-- Usage bar -->
    <div class="bg-bg-card border border-border rounded-2xl p-5 transition-all hover:shadow-md">
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm font-medium text-text-primary">Monthly usage</p>
        <span
          class="text-[11px] font-medium px-2.5 py-1 rounded-full border transition hover:scale-105"
          :style="{ color: 'var(--accent)', borderColor: 'var(--accent)' }"
        >
          {{ usedPct }}% used
        </span>
      </div>
      <div class="h-2.5 bg-bg-body rounded-full overflow-hidden">
        <div
          class="h-full bg-accent rounded-full transition-all duration-700"
          :style="{ width: animatedBar + '%' }"
        />
      </div>
    </div>

    <!-- Breakdown -->
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="item in breakdown"
        :key="item.label"
        class="bg-bg-card border border-border rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-accent/40"
      >
        <p class="text-xs text-text-secondary mb-2">{{ item.label }}</p>
        <p class="text-lg font-medium text-text-primary">{{ item.value }}</p>
        <p class="text-[11px] text-text-secondary mt-0.5">{{ item.sub }}</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed,watch } from 'vue'
import { useMyPersonalTokenAllocation } from '../../../queries/useCommon'
import type { MyAllocationSummaryShared, MyAllocationSummaryEqualCustom } from '../../../queries/useCommon'

const { data: allocationData } = useMyPersonalTokenAllocation()

const summary = computed(() => allocationData.value?.data?.summary ?? null)

const stats = computed(() => {
  const s = summary.value
  if (!s) return { allocated: 0, used: 0, daysUntilReset: 0 }

  const allocated = s.mode === 'shared' ? s.company_total : s.user_allocated
  const used      = s.user_used

  const periodEnd      = allocationData.value?.data?.period_end
  const resetDate      = periodEnd ? new Date(periodEnd) : null
  const daysUntilReset = resetDate
    ? Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return { allocated, used, daysUntilReset }
})

const usedPct = computed(() =>
  stats.value.allocated > 0
    ? Math.min(100, Math.round((stats.value.used / stats.value.allocated) * 100))
    : 0
)

const usedColor = computed(() =>
  usedPct.value >= 90 ? 'text-red-500' :
  usedPct.value >= 70 ? 'text-amber-500' :
  'text-text-primary'
)

const fmt = (n: number) => (n ?? 0).toLocaleString()

const breakdown = computed(() => {
  const s         = summary.value
  const used      = stats.value.used
  const allocated = stats.value.allocated

  const remaining = !s
    ? 0
    : s.mode === 'shared'
      ? (s as MyAllocationSummaryShared).company_remaining
      : (s as MyAllocationSummaryEqualCustom).user_remaining

  const now       = new Date()
  const avgPerDay = now.getDate() > 0 ? Math.round(used / now.getDate()) : 0

  return [
    { label: 'Used',      value: fmt(used),      sub: 'tokens this month' },
    { label: 'Remaining', value: fmt(remaining),  sub: 'tokens left' },
    { label: 'Allocated', value: fmt(allocated),  sub: 'your monthly budget' },
    { label: 'Avg/day',   value: fmt(avgPerDay),  sub: 'tokens/day' },
  ]
})

const animatedBar = ref(0)

watch(usedPct, (val) => {
  requestAnimationFrame(() => {
    animatedBar.value = val
  })
}, { immediate: true })
</script>