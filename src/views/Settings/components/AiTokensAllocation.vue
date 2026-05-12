<template>
  <div class="w-full space-y-6 flex-1">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent border border-accent/20 transition-all duration-200 hover:bg-accent/20 hover:scale-110">
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
          @click="allocationMode = 'percentage'"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95',
            allocationMode === 'percentage'
              ? 'bg-accent/10 border-accent/30 text-accent shadow-sm shadow-accent/10'
              : 'bg-transparent border-border text-text-secondary hover:border-accent/30 hover:text-accent hover:bg-accent/5'
          ]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><line x1="5" y1="5" x2="19" y2="19"/>
          </svg>
          Percentage
        </button>
        <button
          @click="allocationMode = 'custom'"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95',
            allocationMode === 'custom'
              ? 'bg-accent/10 border-accent/30 text-accent shadow-sm shadow-accent/10'
              : 'bg-transparent border-border text-text-secondary hover:border-accent/30 hover:text-accent hover:bg-accent/5'
          ]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M4 7h16M4 12h10M4 17h6"/>
          </svg>
          Custom
        </button>
      </div>
    </div>

    <!-- ── Stats strip ──────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-stretch bg-bg-card border border-border/40 rounded-xl overflow-hidden">
      <div class="flex-1 min-w-[130px] px-5 py-4 transition-all duration-200 hover:bg-border/5 group cursor-default">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Total Budget</p>
        <p class="text-2xl font-bold text-text-primary mt-1 mb-0.5 transition-transform duration-200 group-hover:scale-105 origin-left">{{ totalBudget?.toLocaleString() }}</p>
        <p class="text-[11px] text-text-secondary">tokens / mo</p>
      </div>
      <div class="w-px self-stretch bg-border/40 hidden sm:block"></div>
      <div class="flex-1 min-w-[130px] px-5 py-4 transition-all duration-200 hover:bg-border/5 group cursor-default">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Allocated</p>
        <p class="text-2xl font-bold text-amber-400 mt-1 mb-0.5 transition-transform duration-200 group-hover:scale-105 origin-left">{{ allocatedTokens?.toLocaleString() }}</p>
        <p class="text-[11px] text-text-secondary">{{ allocatedPercentage }}% used</p>
      </div>
      <div class="w-px self-stretch bg-border/40 hidden sm:block"></div>
      <div class="flex-1 min-w-[130px] px-5 py-4 transition-all duration-200 hover:bg-border/5 group cursor-default">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Remaining</p>
        <p class="text-2xl font-bold text-emerald-400 mt-1 mb-0.5 transition-transform duration-200 group-hover:scale-105 origin-left">{{ remainingTokens?.toLocaleString() || 0 }}</p>
        <p class="text-[11px] text-text-secondary">{{ remainingPercentage }}% free</p>
      </div>
      <div class="w-px self-stretch bg-border/40 hidden sm:block"></div>
      <div class="flex-1 min-w-[130px] px-5 py-4 transition-all duration-200 hover:bg-border/5 group cursor-default">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Members</p>
        <p class="text-2xl font-bold text-text-primary mt-1 mb-0.5 transition-transform duration-200 group-hover:scale-105 origin-left">{{ memberCount }}</p>
        <p class="text-[11px] text-text-secondary">active users</p>
      </div>
    </div>

    <!-- ── Master usage bar ─────────────────────────────────────────────────── -->
    <div class="bg-bg-card border border-border/40 rounded-xl p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10">
      <div class="flex items-center justify-between mb-3">
        <span class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Budget Usage</span>
        <span class="text-xs font-bold text-amber-400">{{ allocatedPercentage }}% allocated</span>
      </div>
      <div class="h-2.5 rounded-full bg-border/20 overflow-hidden flex group cursor-pointer">
        <div
          v-for="user in users"
          :key="user.id"
          class="h-full transition-all duration-500 hover:brightness-125 hover:opacity-90"
          :style="{ width: user.percentage + '%', background: user.color }"
          :title="`${user.name}: ${user.percentage}%`"
        ></div>
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        <div
          v-for="user in users"
          :key="user.id"
          class="flex items-center gap-1.5 text-xs text-text-secondary transition-all duration-150 hover:text-text-primary cursor-default group/legend"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0 transition-transform duration-150 group-hover/legend:scale-125"
            :style="{ background: user.color }"
          ></span>
          {{ user.name }}
        </div>
        <div class="flex items-center gap-1.5 text-xs text-text-secondary cursor-default">
          <span class="w-2 h-2 rounded-full shrink-0 bg-border/40"></span>
          Unallocated
        </div>
      </div>
    </div>

    <!-- ── Donut + Member rows ───────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

      <!-- Donut card -->
      <div class="lg:col-span-2 bg-bg-card border border-border/40 rounded-xl p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-4">Distribution</p>

        <div v-if="users.length === 0" class="flex flex-col items-center justify-center py-12">
          <svg class="w-12 h-12 text-text-secondary/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/>
          </svg>
          <p class="text-sm font-medium text-text-secondary text-center">No distribution data</p>
          <p class="text-xs text-text-secondary/60 mt-1 text-center">Allocations will appear here</p>
        </div>

        <template v-else>
          <div class="relative flex justify-center group/donut">
            <svg
              viewBox="0 0 200 200"
              class="w-40 h-40 transition-transform duration-300 group-hover/donut:scale-105"
            >
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
                class="transition-all duration-300 hover:opacity-80"
                style="transform-origin:center;transform:rotate(-90deg)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-2xl font-bold text-text-primary leading-none">{{ allocatedPercentage }}%</p>
              <p class="text-[10px] uppercase tracking-widest text-text-secondary mt-1">used</p>
            </div>
          </div>

          <div class="space-y-2 mt-5">
            <div
              v-for="user in users"
              :key="user.id"
              class="flex items-center justify-between text-xs transition-all duration-150 hover:bg-border/10 rounded-lg px-2 py-1 -mx-2 cursor-default group/dist"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150 group-hover/dist:scale-125"
                  :style="{ background: user.color }"
                ></span>
                <span class="text-text-secondary group-hover/dist:text-text-primary transition-colors duration-150">{{ user.name }}</span>
              </div>
              <span class="font-semibold text-text-primary">{{ user.percentage }}%</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Member rows -->
      <div class="lg:col-span-3 space-y-2.5">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Member Allocations</p>

        <div v-if="users.length === 0" class="flex flex-col items-center justify-center py-8 px-4 bg-bg-card border border-border/40 rounded-xl">
          <svg class="w-12 h-12 text-text-secondary/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <p class="text-sm font-medium text-text-secondary">No member allocations</p>
          <p class="text-xs text-text-secondary/60 mt-1">Members will appear here when allocations are configured</p>
        </div>

        <div
          v-for="user in users"
          :key="user.id"
          class="flex items-center gap-3 bg-bg-card border border-border/40 rounded-xl px-4 py-3 transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5 group/member"
        >
          <!-- Avatar -->
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200 group-hover/member:scale-110"
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
                class="h-full rounded-full transition-all duration-500 group-hover/member:brightness-125"
                :style="{ width: user.percentage + '%', background: user.color }"
              ></div>
            </div>
          </div>

          <!-- Controls -->
          <div class="text-right shrink-0 w-28">
            <template v-if="allocationMode === 'percentage'">
              <div class="flex items-center justify-end gap-1">
                <button
                  @click="user.percentage = Math.max(1, user.percentage - 1)"
                  class="w-5 h-5 rounded flex items-center justify-center border border-border/50 text-text-secondary hover:border-red-400/50 hover:text-red-400 hover:bg-red-400/5 text-base leading-none transition-all duration-150 active:scale-90"
                >−</button>
                <span class="text-sm font-bold w-9 text-center transition-all duration-150" :style="{ color: user.color }">{{ user.percentage }}%</span>
                <button
                  @click="user.percentage = Math.min(100, user.percentage + 1)"
                  class="w-5 h-5 rounded flex items-center justify-center border border-border/50 text-text-secondary hover:border-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-400/5 text-base leading-none transition-all duration-150 active:scale-90"
                >+</button>
              </div>
              <p class="text-[10px] text-text-secondary mt-1">{{ ((user.percentage / 100) * totalBudget).toLocaleString() }} tkns</p>
            </template>
            <template v-else>
              <input
                v-model.number="user.tokens"
                type="number"
                min="0"
                :max="totalBudget"
                class="w-full text-right text-xs font-semibold text-text-primary bg-border/10 border border-border/40 rounded-md px-2 py-1 outline-none focus:border-accent/50 hover:border-border/70 transition-colors duration-150 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <p class="text-[10px] text-text-secondary mt-1">{{ ((user.tokens / totalBudget) * 100).toFixed(1) }}% of budget</p>
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
              'px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border transition-all duration-150 hover:scale-105 active:scale-95',
              range === r
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'border-border/40 text-text-secondary hover:border-accent/30 hover:text-accent hover:bg-accent/5'
            ]"
          >{{ r }}</button>
        </div>
      </div>

      <div v-if="users.length === 0" class="flex flex-col items-center justify-center py-12 px-4 bg-bg-card border border-border/40 rounded-xl">
        <svg class="w-12 h-12 text-text-secondary/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 12h18M3 6h18M3 18h18"/><path d="M3 3v18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3"/>
        </svg>
        <p class="text-sm font-medium text-text-secondary">No usage data</p>
        <p class="text-xs text-text-secondary/60 mt-1">Usage history will appear once members start using tokens</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="user in users"
          :key="user.id"
          class="bg-bg-card border border-border/40 rounded-xl p-4 transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5 group/spark"
        >
          <div class="flex items-center gap-2 mb-3">
            <span
              class="w-2 h-2 rounded-full shrink-0 transition-transform duration-150 group-hover/spark:scale-125"
              :style="{ background: user.color }"
            ></span>
            <span class="text-xs font-semibold text-text-primary truncate">{{ user.name }}</span>
            <span class="ml-auto text-[10px] text-text-secondary shrink-0">{{ user.usedThisMonth.toLocaleString() }} used</span>
          </div>

          <svg
            viewBox="0 0 120 40"
            class="w-full h-10 transition-opacity duration-200 group-hover/spark:opacity-80"
            preserveAspectRatio="none"
          >
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
              Limit: {{ ((user.percentage / 100) * totalBudget).toLocaleString() }}
            </span>
            <span
              :class="[
                'text-[10px] font-semibold transition-all duration-150',
                user.usedThisMonth > (user.percentage / 100) * totalBudget ? 'text-red-400' : 'text-emerald-400'
              ]"
            >
              {{ user.usedThisMonth > (user.percentage / 100) * totalBudget ? '⚠ Over limit' : '✓ Within limit' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Over-budget warning ──────────────────────────────────────────────── -->
    <div
      v-if="isOverBudget"
      class="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5 transition-all duration-200 hover:bg-red-500/8 hover:border-red-500/30"
    >
      <svg class="shrink-0 mt-0.5 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <p class="text-xs text-red-400 leading-relaxed">
        Total allocation is <span class="font-bold">{{ totalAllocated }}%</span>, which exceeds 100%. Please reduce allocations before saving.
      </p>
    </div>

    <!-- ── Info banner ───────────────────────────────────────────────────────── -->
    <div class="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3.5 transition-all duration-200 hover:bg-blue-500/8 hover:border-blue-500/25">
      <svg class="shrink-0 mt-0.5 text-blue-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p class="text-xs text-blue-400 leading-relaxed">
        Allocations reset on the 1st of each month. Users exceeding their allocation will be rate-limited unless
        <span class="font-semibold">overflow</span> is enabled. Unallocated tokens remain in the shared pool.
      </p>
    </div>

    <!-- ── Sticky save bar ───────────────────────────────────────────────────── -->
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
        class="sticky bottom-4 z-10 flex items-center justify-between gap-4 bg-bg-card border border-border/60 rounded-xl px-5 py-3.5 shadow-xl shadow-black/30 transition-all duration-200 hover:shadow-2xl hover:shadow-black/40"
      >
        <div class="flex items-center gap-2.5">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
          <p class="text-sm font-medium text-text-primary">You have unsaved changes</p>
          <span class="hidden sm:inline text-xs text-text-secondary">— review allocations before saving</span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="discardChanges"
            class="px-3.5 py-2 text-xs font-semibold text-text-secondary border border-border/50 rounded-lg hover:bg-red-500/5 hover:border-red-400/30 hover:text-red-400 transition-all duration-150 active:scale-95"
          >
            Discard
          </button>
          <button
            @click="saveAllocations"
            :disabled="isSaving || isOverBudget"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150',
              isOverBudget
                ? 'bg-border/20 border-border/30 text-text-secondary cursor-not-allowed opacity-60'
                : 'bg-accent text-white border-accent/80 hover:bg-accent/90 hover:scale-105 active:scale-95 shadow-lg shadow-accent/20 hover:shadow-accent/30'
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCompanyTokenAllocation, useSetUserAllocation, useSetAllocationMode } from '../../../queries/useCommon'

const allocationMode = ref<'percentage' | 'custom'>('percentage')
const range = ref('30d')
const saveSuccess = ref(false)
const saveError = ref<string | null>(null)

const { data: allocationData } = useCompanyTokenAllocation()
const { mutateAsync: setUserAllocation, isPending: isSaving } = useSetUserAllocation()
const { mutateAsync: setAllocationMode } = useSetAllocationMode()

interface UserAllocation {
  id: string
  name: string
  initials: string
  role: string
  color: string
  percentage: number
  tokens: number
  usedThisMonth: number
  sparkLine: string
  sparkPath: string
}

function buildSpark(values: number[]) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const W = 120, H = 40
  const step = W / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = i * step
    const y = H - ((v - min) / (max - min || 1)) * (H - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = 'M' + pts.join(' L')
  return { sparkLine: line, sparkPath: line + ` L${W},${H} L0,${H} Z` }
}

const colorPalette = [
  '#6ee7b7', '#818cf8', '#fb923c', '#38bdf8', '#f472b6', '#facc15',
  '#a78bfa', '#34d399', '#f97316', '#ec4899', '#3b82f6', '#10b981'
]

const rawSparks = [
  [12, 18, 14, 22, 30, 28, 35, 32, 40, 38, 44, 42, 50, 47, 55],
  [5,   8, 10,  9, 12, 15, 13, 17, 20, 18, 22, 25, 23, 27, 30],
  [20, 22, 19, 25, 28, 30, 27, 32, 35, 33, 38, 40, 37, 42, 44],
  [3,   5,  4,  6,  8,  7, 10,  9, 12, 14, 13, 16, 15, 18, 20],
  [8,  10, 12, 11, 14, 16, 15, 18, 21, 20, 23, 25, 24, 27, 28],
  [15, 17, 16, 19, 21, 23, 22, 26, 28, 27, 30, 32, 31, 34, 36],
]

// ── Derive apiUsers directly from allocationData as a computed ────────────────
// No watch, no seeded flag — always in sync with the query
const apiUsers = computed<UserAllocation[]>(() => {
  const perUser = allocationData.value?.allocation?.per_user
  if (!Array.isArray(perUser) || perUser.length === 0) return []

  const totalTokens = allocationData.value?.allocation?.total_tokens || 1

  return perUser.map((u: any, idx: number) => {
    const apiUser = u.user ?? {}
    const allocatedTokens = u.allocated_tokens ?? 0
    const usedTokens = u.used_tokens ?? 0
    const percentage = Math.round((allocatedTokens / totalTokens) * 100)
    const spark = buildSpark(rawSparks[idx % rawSparks.length])
    const fullName: string = apiUser?.u_full_name || 'Unknown User'
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    return {
      id: u.user_id || apiUser?._id || `user-${idx}`,
      name: fullName,
      initials,
      role: u.membership_role
        ? u.membership_role.charAt(0).toUpperCase() + u.membership_role.slice(1)
        : 'Member',
      color: colorPalette[idx % colorPalette.length],
      percentage,
      tokens: allocatedTokens,
      usedThisMonth: usedTokens,
      sparkLine: spark.sparkLine,
      sparkPath: spark.sparkPath,
    }
  })
})

// ── users is a mutable ref seeded from apiUsers once, then user-editable ──────
const users = ref<UserAllocation[]>([])
const savedSnapshot = ref<Array<{ percentage: number; tokens: number }>>([])

// Seed once when apiUsers first has data, then leave editable
watch(apiUsers, (incoming) => {
  if (incoming.length === 0 || users.value.length > 0) return
  users.value = incoming.map(u => ({ ...u }))
  savedSnapshot.value = users.value.map(u => ({ percentage: u.percentage, tokens: u.tokens }))
}, { immediate: true })

// ── Budget totals ─────────────────────────────────────────────────────────────
const totalBudget = computed(() => allocationData.value?.allocation?.total_tokens || 0)
const allocatedTokens = computed(() => allocationData.value?.allocation?.used_tokens ?? 0)
const remainingTokens = computed(() => totalBudget.value - allocatedTokens.value || 0)
const allocatedPercentage = computed(() =>
  totalBudget.value > 0 ? Math.round((allocatedTokens.value / totalBudget.value) * 100) : 0
)
const remainingPercentage = computed(() => 100 - allocatedPercentage.value)
const memberCount = computed(() => users.value.length)

// ── Dirty detection ───────────────────────────────────────────────────────────
const hasChanges = computed(() =>
  users.value.some((u, i) =>
    i < savedSnapshot.value.length && (
      u.percentage !== savedSnapshot.value[i].percentage ||
      u.tokens     !== savedSnapshot.value[i].tokens
    )
  )
)
watch(allocationMode, (mode) => {
  users.value.forEach(u => {
    if (mode === 'custom') {
      u.tokens = Math.round((u.percentage / 100) * totalBudget.value)
    } else {
      u.percentage = totalBudget.value > 0
        ? Math.round((u.tokens / totalBudget.value) * 100)
        : 0
    }
  })
  const apiMode = mode === 'custom' ? 'custom' : 'custom'
  setAllocationMode({ mode: apiMode }).catch((err: any) => {
    console.error('Failed to set allocation mode:', err?.message)
  })
})
// ── Save ──────────────────────────────────────────────────────────────────────
async function saveAllocations() {
  saveError.value = null

  const changed = users.value.filter((u, i) => {
    if (i >= savedSnapshot.value.length) return false
    return allocationMode.value === 'custom'
      ? u.tokens !== savedSnapshot.value[i].tokens
      : u.percentage !== savedSnapshot.value[i].percentage
  })

  try {
    await Promise.all(
      changed.map(u => {
        const allocated_tokens = allocationMode.value === 'custom'
          ? u.tokens
          : Math.round((u.percentage / 100) * totalBudget.value)
        return setUserAllocation({ userId: u.id, allocated_tokens })
      })
    )
    savedSnapshot.value = users.value.map(u => ({ percentage: u.percentage, tokens: u.tokens }))
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2500)
  } catch (err: any) {
    saveError.value = err?.message ?? 'Failed to save allocations. Please try again.'
  }
}

// ── Discard ───────────────────────────────────────────────────────────────────
function discardChanges() {
  saveError.value = null
  users.value.forEach((u, i) => {
    if (i < savedSnapshot.value.length) {
      u.percentage = savedSnapshot.value[i].percentage
      u.tokens     = savedSnapshot.value[i].tokens
    }
  })
}

// ── Donut segments ────────────────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 80
const donutSegments = computed(() => {
  let cumulative = 0
  return users.value.map(u => {
    const dash   = (u.percentage / 100) * CIRC
    const gap    = CIRC - dash
    const offset = -(cumulative / 100) * CIRC
    cumulative  += u.percentage
    return { id: u.id, color: u.color, dash, gap, offset }
  })
})

// ── Over-budget check ─────────────────────────────────────────────────────────
const totalAllocated = computed(() => users.value.reduce((s, u) => s + u.percentage, 0))
const isOverBudget   = computed(() => totalAllocated.value > 100)
</script>