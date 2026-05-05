<template>
  <div class="w-full space-y-6 flex-1">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent border border-accent/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </span>
          AI Token Allocation
        </h3>
        <p class="text-sm text-text-secondary mt-1">Distribute and track token budgets across your team.</p>
      </div>

      <!-- Mode toggle -->
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          @click="switchMode('equal')"
          :disabled="isSwitchingMode"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            apiAllocationMode === 'equal'
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-transparent border-border text-text-secondary hover:border-border/70 hover:text-text-primary'
          ]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><line x1="5" y1="5" x2="19" y2="19"/>
          </svg>
          Equal
        </button>
        <button
          @click="switchMode('shared')"
          :disabled="isSwitchingMode"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            apiAllocationMode === 'shared'
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-transparent border-border text-text-secondary hover:border-border/70 hover:text-text-primary'
          ]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Shared
        </button>
        <button
          @click="switchMode('custom')"
          :disabled="isSwitchingMode"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            apiAllocationMode === 'custom'
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-transparent border-border text-text-secondary hover:border-border/70 hover:text-text-primary'
          ]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M4 7h16M4 12h10M4 17h6"/>
          </svg>
          Custom
        </button>
      </div>
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────────── -->
    <div v-if="isLoadingAllocation" class="space-y-4 animate-pulse">
      <div class="flex flex-wrap bg-bg-card border border-border/40 rounded-xl overflow-hidden">
        <div v-for="i in 4" :key="i" class="flex-1 min-w-[130px] px-5 py-4 space-y-2">
          <div class="h-2.5 w-20 bg-border/20 rounded"></div>
          <div class="h-7 w-24 bg-border/20 rounded"></div>
          <div class="h-2 w-16 bg-border/15 rounded"></div>
        </div>
      </div>
      <div class="bg-bg-card border border-border/40 rounded-xl p-5 space-y-3">
        <div class="h-2.5 w-28 bg-border/20 rounded"></div>
        <div class="h-2.5 w-full bg-border/20 rounded-full"></div>
      </div>
    </div>

    <!-- ── Fetch error ──────────────────────────────────────────────────────── -->
    <div
      v-else-if="fetchError"
      class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5"
    >
      <svg class="flex-shrink-0 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="text-xs text-red-400">Failed to load token allocation data. Please try again.</p>
      <button @click="() => refetchAllocation()" class="ml-auto text-xs font-semibold text-red-400 hover:underline">Retry</button>
    </div>

    <!-- ── No active allocation ─────────────────────────────────────────────── -->
    <div
      v-else-if="!trackingEnabled"
      class="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/40 rounded-xl"
    >
      <div class="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-accent">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <h3 class="text-sm font-bold text-text-primary mb-1">No active token allocation</h3>
      <p class="text-xs text-text-secondary max-w-xs leading-relaxed">
        Token tracking is not enabled for your current subscription package.
      </p>
    </div>

    <template v-else>

      <!-- ── Stats strip ──────────────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-stretch bg-bg-card border border-border/40 rounded-xl overflow-hidden">
        <div class="flex-1 min-w-[130px] px-5 py-4">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Total Budget</p>
          <p class="text-2xl font-bold text-text-primary mt-1 mb-0.5">{{ formatNumber(totalTokens) }}</p>
          <p class="text-[11px] text-text-secondary">tokens / mo</p>
        </div>
        <div class="w-px self-stretch bg-border/40 hidden sm:block"></div>
        <div class="flex-1 min-w-[130px] px-5 py-4">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Used</p>
          <p class="text-2xl font-bold text-amber-400 mt-1 mb-0.5">{{ formatNumber(usedTokens) }}</p>
          <p class="text-[11px] text-text-secondary">{{ usedPercent }}% consumed</p>
        </div>
        <div class="w-px self-stretch bg-border/40 hidden sm:block"></div>
        <div class="flex-1 min-w-[130px] px-5 py-4">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Remaining</p>
          <p class="text-2xl font-bold text-emerald-400 mt-1 mb-0.5">{{ formatNumber(remainingTokens) }}</p>
          <p class="text-[11px] text-text-secondary">{{ remainingPercent }}% free</p>
        </div>
        <div class="w-px self-stretch bg-border/40 hidden sm:block"></div>
        <div class="flex-1 min-w-[130px] px-5 py-4">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Members</p>
          <p class="text-2xl font-bold text-text-primary mt-1 mb-0.5">{{ perUserRows.length }}</p>
          <p class="text-[11px] text-text-secondary">active users</p>
        </div>
      </div>

      <!-- ── Master usage bar ─────────────────────────────────────────────────── -->
      <div class="bg-bg-card border border-border/40 rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Budget Usage</span>
          <span class="text-xs font-bold text-amber-400">{{ usedPercent }}% consumed</span>
        </div>
        <div class="h-2.5 rounded-full bg-border/20 overflow-hidden flex">
          <div
            v-for="user in users"
            :key="user.id"
            class="h-full transition-all duration-500"
            :style="{ width: userBarWidth(user) + '%', background: user.color }"
            :title="`${user.name}: ${formatNumber(user.editTokens)} tokens`"
          ></div>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          <div v-for="user in users" :key="user.id" class="flex items-center gap-1.5 text-xs text-text-secondary">
            <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: user.color }"></span>
            {{ user.name }}
          </div>
          <div class="flex items-center gap-1.5 text-xs text-text-secondary">
            <span class="w-2 h-2 rounded-full flex-shrink-0 bg-border/40"></span>
            Unallocated
          </div>
        </div>
      </div>

      <!-- ── Donut + Member rows ───────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

        <!-- Donut card -->
        <div class="lg:col-span-2 bg-bg-card border border-border/40 rounded-xl p-5">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-4">Distribution</p>

          <div class="relative flex justify-center">
            <svg viewBox="0 0 200 200" class="w-40 h-40">
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="24"/>
              <circle
                v-for="seg in donutSegments"
                :key="seg.id"
                cx="100" cy="100" r="80"
                fill="none"
                :stroke="seg.color"
                stroke-width="24"
                stroke-linecap="butt"
                :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                :stroke-dashoffset="seg.offset"
                style="transform-origin:center;transform:rotate(-90deg)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-2xl font-bold text-text-primary leading-none">{{ usedPercent }}%</p>
              <p class="text-[10px] uppercase tracking-widest text-text-secondary mt-1">used</p>
            </div>
          </div>

          <div class="space-y-2 mt-5">
            <div v-for="user in users" :key="user.id" class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: user.color }"></span>
                <span class="text-text-secondary">{{ user.name }}</span>
              </div>
              <span class="font-semibold text-text-primary">{{ userAllocPercent(user) }}%</span>
            </div>
          </div>
        </div>

        <!-- Member rows -->
        <div class="lg:col-span-3 space-y-2.5">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Member Allocations</p>

          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center gap-3 bg-bg-card border border-border/40 rounded-xl px-4 py-3 hover:border-border/70 hover:shadow-sm transition-all"
          >
            <!-- Avatar -->
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              :style="{ background: user.color + '22', color: user.color, border: `1.5px solid ${user.color}44` }"
            >
              {{ user.initials }}
            </div>

            <!-- Name + role -->
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-text-primary truncate">{{ user.name }}</p>
              <p class="text-xs text-text-secondary mt-0.5">{{ user.role }}</p>
            </div>

            <!-- Mini progress bar -->
            <div class="flex-1 hidden sm:block">
              <div class="h-1 rounded-full bg-border/20 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: userBarWidth(user) + '%', background: user.color }"
                ></div>
              </div>
            </div>

            <!-- Controls -->
            <div class="text-right flex-shrink-0 w-28">
              <!-- equal mode: show allocated tokens read-only, no stepper needed -->
              <template v-if="apiAllocationMode === 'equal'">
                <p class="text-sm font-bold" :style="{ color: user.color }">
                  {{ formatNumber(user.editTokens) }}
                </p>
                <p class="text-[10px] text-text-secondary mt-1">{{ userAllocPercent(user) }}% of budget</p>
              </template>

              <!-- shared mode -->
              <template v-else-if="apiAllocationMode === 'shared'">
                <p class="text-sm font-bold text-text-secondary">Shared pool</p>
                <p class="text-[10px] text-text-secondary mt-1">{{ formatNumber(user.usedTokens) }} used</p>
              </template>

              <!-- custom mode: editable input -->
              <template v-else>
                <input
                  v-model.number="user.editTokens"
                  type="number"
                  min="0"
                  :max="totalTokens"
                  class="w-full text-right text-xs font-semibold text-text-primary bg-border/10 border border-border/40 rounded-md px-2 py-1 outline-none focus:border-accent/50 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <p class="text-[10px] text-text-secondary mt-1">{{ userAllocPercent(user) }}% of budget</p>
              </template>
            </div>

          </div>
        </div>
      </div>

      <!-- ── 30-day sparklines ─────────────────────────────────────────────────── -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Token Usage History</p>
          <div class="flex gap-1">
            <button
              v-for="r in ['7d', '14d', '30d']"
              :key="r"
              @click="range = r"
              :class="[
                'px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border transition-all',
                range === r
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'border-border/40 text-text-secondary hover:border-border/70 hover:text-text-primary'
              ]"
            >{{ r }}</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="user in users"
            :key="user.id"
            class="bg-bg-card border border-border/40 rounded-xl p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: user.color }"></span>
              <span class="text-xs font-semibold text-text-primary truncate">{{ user.name }}</span>
              <span class="ml-auto text-[10px] text-text-secondary flex-shrink-0">{{ formatNumber(user.usedTokens) }} used</span>
            </div>

            <svg viewBox="0 0 120 40" class="w-full h-10" preserveAspectRatio="none">
              <defs>
                <linearGradient :id="`grad-${user.id}`" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="user.color" stop-opacity="0.25"/>
                  <stop offset="100%" :stop-color="user.color" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path :d="user.sparkPath" :fill="`url(#grad-${user.id})`"/>
              <path :d="user.sparkLine" fill="none" :stroke="user.color" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>

            <div class="flex items-center justify-between mt-2">
              <span class="text-[10px] text-text-secondary">
                Limit: {{ formatNumber(user.editTokens) }}
              </span>
              <span
                :class="[
                  'text-[10px] font-semibold',
                  user.usedTokens > user.editTokens ? 'text-red-400' : 'text-emerald-400'
                ]"
              >
                {{ user.usedTokens > user.editTokens ? '⚠ Over limit' : '✓ Within limit' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Over-budget warning ──────────────────────────────────────────────── -->
      <div
        v-if="isOverBudget"
        class="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5"
      >
        <svg class="flex-shrink-0 mt-0.5 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p class="text-xs text-red-400 leading-relaxed">
          Total allocation <span class="font-bold">{{ formatNumber(totalEditTokens) }}</span> exceeds the budget of <span class="font-bold">{{ formatNumber(totalTokens) }}</span>. Please reduce allocations before saving.
        </p>
      </div>

      <!-- ── Info banner ───────────────────────────────────────────────────────── -->
      <div class="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3.5">
        <svg class="flex-shrink-0 mt-0.5 text-blue-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p class="text-xs text-blue-400 leading-relaxed">
          Allocations reset on the 1st of each month. Users exceeding their allocation will be rate-limited unless
          <span class="font-semibold">overflow</span> is enabled. Unallocated tokens remain in the shared pool.
        </p>
      </div>

      <!-- ── Sticky save bar ────────────────────────────────────────────────────── -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-3"
      >
        <div
          v-if="hasChanges"
          class="sticky bottom-4 z-10 flex items-center justify-between gap-4 bg-bg-card border border-border/60 rounded-xl px-5 py-3.5 shadow-xl shadow-black/30"
        >
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
            <p class="text-sm font-medium text-text-primary">You have unsaved changes</p>
            <span class="hidden sm:inline text-xs text-text-secondary">— review allocations before saving</span>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="discardChanges"
              class="px-3.5 py-2 text-xs font-semibold text-text-secondary border border-border/50 rounded-lg hover:bg-border/20 hover:text-text-primary transition-all"
            >
              Discard
            </button>
            <button
              @click="saveAllocations"
              :disabled="isSaving || isOverBudget"
              :class="[
                'inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all',
                isOverBudget
                  ? 'bg-border/20 border-border/30 text-text-secondary cursor-not-allowed opacity-60'
                  : 'bg-accent text-white border-accent/80 hover:bg-accent/90 active:scale-95 shadow-lg shadow-accent/20'
              ]"
            >
              <svg v-if="isSaving" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <svg v-else-if="saveSuccess" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {{ isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save changes' }}
            </button>
          </div>
        </div>
      </Transition>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useCompanyTokenAllocation,
  useSetAllocationMode,
  useDistributeEqual,
  useSetUserAllocation,
  type AllocationMode,
  type PerUserAllocation,
} from '../../../queries/useCommon'

// ── Sparkline path builder ────────────────────────────────────────────────────
function buildSpark(values: number[]) {
  const max  = Math.max(...values)
  const min  = Math.min(...values)
  const W = 120, H = 40
  const step = W / (values.length - 1)
  const pts  = values.map((v, i) => {
    const x = i * step
    const y = H - ((v - min) / (max - min || 1)) * (H - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = 'M' + pts.join(' L')
  return { sparkLine: line, sparkPath: line + ` L${W},${H} L0,${H} Z` }
}

// Static spark data per user slot (visual only — no usage history endpoint)
const SPARK_DATA = [
  [12, 18, 14, 22, 30, 28, 35, 32, 40, 38, 44, 42, 50, 47, 55],
  [5,   8, 10,  9, 12, 15, 13, 17, 20, 18, 22, 25, 23, 27, 30],
  [20, 22, 19, 25, 28, 30, 27, 32, 35, 33, 38, 40, 37, 42, 44],
  [3,   5,  4,  6,  8,  7, 10,  9, 12, 14, 13, 16, 15, 18, 20],
  [8,  10, 12, 11, 14, 16, 15, 18, 21, 20, 23, 25, 24, 27, 28],
  [15, 17, 16, 19, 21, 23, 22, 26, 28, 27, 30, 32, 31, 34, 36],
]

// Visual color palette assigned by user slot index
const USER_COLORS  = ['#6ee7b7', '#818cf8', '#fb923c', '#38bdf8', '#f472b6', '#facc15']

// ── API queries ───────────────────────────────────────────────────────────────

const {
  data: allocationData,
  isLoading: isLoadingAllocation,
  isError: fetchError,
  refetch: refetchAllocation,
} = useCompanyTokenAllocation()

const { mutateAsync: setModeMutation,     isPending: isSwitchingMode } = useSetAllocationMode()
const { mutateAsync: distributeEqualMutation }                         = useDistributeEqual()
const { mutateAsync: setUserAllocationMutation }                       = useSetUserAllocation()

// ── Derived API values ────────────────────────────────────────────────────────

const trackingEnabled = computed<boolean>(
  () => allocationData.value?.data?.tracking_enabled ?? false
)

const allocation = computed(() => allocationData.value?.data?.allocation ?? null)

const apiAllocationMode = computed<AllocationMode>(
  () => allocation.value?.allocation_mode ?? 'shared'
)

const totalTokens = computed<number>(() => allocation.value?.total_tokens     ?? 0)
const usedTokens  = computed<number>(() => allocation.value?.used_tokens      ?? 0)
const perUserRows = computed<PerUserAllocation[]>(() => allocation.value?.per_user ?? [])

const remainingTokens  = computed(() => Math.max(0, totalTokens.value - usedTokens.value))
const usedPercent      = computed(() => totalTokens.value
  ? +((usedTokens.value / totalTokens.value) * 100).toFixed(1)
  : 0
)
const remainingPercent = computed(() => +(100 - usedPercent.value).toFixed(1))

// ── User view-models (merge API per_user with display metadata) ───────────────

interface UserVM {
  id: string          // user_id from API
  name: string        // placeholder — replace with real profile lookup
  initials: string
  role: string
  color: string
  usedTokens: number
  editTokens: number  // local editable copy
  sparkLine: string
  sparkPath: string
}

/**
 * Build an initial UserVM array from the API per_user array.
 * Name / initials / role are placeholders — wire to a members query when available.
 */
function buildUserVMs(rows: PerUserAllocation[]): UserVM[] {
  return rows.map((row, idx) => {
    const color = USER_COLORS[idx % USER_COLORS.length]
    const spark = buildSpark(SPARK_DATA[idx % SPARK_DATA.length])
    return {
      id:          row.user_id,
      name:        `User ${idx + 1}`,   // replace with real display name
      initials:    `U${idx + 1}`,        // replace with real initials
      role:        'Member',             // replace with real role
      color,
      usedTokens:  row.used_tokens,
      editTokens:  row.allocated_tokens,
      ...spark,
    }
  })
}

// Working copy (what the user edits in the UI)
const users = ref<UserVM[]>([])
// Snapshot of the last committed state for dirty detection
const savedSnapshot = ref<{ editTokens: number }[]>([])

// Hydrate / re-hydrate users when API data arrives
watch(
  perUserRows,
  (rows) => {
    if (!rows.length) return
    const vms = buildUserVMs(rows)
    users.value        = vms
    savedSnapshot.value = vms.map(u => ({ editTokens: u.editTokens }))
  },
  { immediate: true }
)

// ── Local UI state ────────────────────────────────────────────────────────────

const range       = ref('30d')
const isSaving    = ref(false)
const saveSuccess = ref(false)

// ── Dirty detection ───────────────────────────────────────────────────────────

const hasChanges = computed(() =>
  apiAllocationMode.value === 'custom' &&
  users.value.some((u, i) => u.editTokens !== (savedSnapshot.value[i]?.editTokens ?? u.editTokens))
)

// ── Computed display helpers ──────────────────────────────────────────────────

const totalEditTokens = computed(() =>
  users.value.reduce((s, u) => s + (u.editTokens || 0), 0)
)

const isOverBudget = computed(() =>
  apiAllocationMode.value === 'custom' && totalEditTokens.value > totalTokens.value
)

function userAllocPercent(user: UserVM): string {
  if (!totalTokens.value) return '0'
  return ((user.editTokens / totalTokens.value) * 100).toFixed(1)
}

function userBarWidth(user: UserVM): number {
  if (!totalTokens.value) return 0
  return Math.min(100, (user.editTokens / totalTokens.value) * 100)
}

// ── Donut segments ────────────────────────────────────────────────────────────

const CIRC = 2 * Math.PI * 80

const donutSegments = computed(() => {
  let cumulative = 0
  return users.value.map(u => {
    const pct    = totalTokens.value ? (u.editTokens / totalTokens.value) * 100 : 0
    const dash   = (pct / 100) * CIRC
    const gap    = CIRC - dash
    const offset = -(cumulative / 100) * CIRC
    cumulative  += pct
    return { id: u.id, color: u.color, dash, gap, offset }
  })
})

// ── Mode switch ───────────────────────────────────────────────────────────────

async function switchMode(mode: AllocationMode) {
  if (mode === apiAllocationMode.value) return
  try {
    await setModeMutation({ mode })
    // After switching to equal, immediately trigger redistribution
    if (mode === 'equal') {
      await distributeEqualMutation({
        reserved_tokens: allocation.value?.reserved_tokens ?? 0,
      })
    }
  } catch {
    // errors handled by global handler / toast layer
  }
}

// ── Save (custom mode only — calls set-user-allocation per changed user) ──────

async function saveAllocations() {
  if (isSaving.value || isOverBudget.value) return
  isSaving.value = true
  try {
    // Fire mutations only for users whose allocation actually changed
    const mutations = users.value
      .filter((u, i) => u.editTokens !== (savedSnapshot.value[i]?.editTokens ?? u.editTokens))
      .map(u =>
        setUserAllocationMutation({
          userId:           u.id,
          allocated_tokens: u.editTokens,
        })
      )
    await Promise.all(mutations)
    // Update snapshot to the committed values
    savedSnapshot.value = users.value.map(u => ({ editTokens: u.editTokens }))
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2500)
  } catch {
    // errors handled by global handler / toast layer
  } finally {
    isSaving.value = false
  }
}

// ── Discard ───────────────────────────────────────────────────────────────────

function discardChanges() {
  users.value.forEach((u, i) => {
    u.editTokens = savedSnapshot.value[i]?.editTokens ?? u.editTokens
  })
}

// ── Formatting ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString()
}
</script>