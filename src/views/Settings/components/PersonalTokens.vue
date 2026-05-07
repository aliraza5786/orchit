<template>
  <div class="w-full space-y-6">

    <!-- Section label -->
    <div>
      <p class="text-[11px] font-medium tracking-widest uppercase text-text-secondary mb-4">
        Token Overview
      </p>

      <!-- Stat cards -->
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
        <p class="text-xs text-text-secondary mb-2 flex items-center gap-1.5">
          <component :is="item.icon" class="w-3.5 h-3.5" />
          {{ item.label }}
        </p>

        <p class="text-lg font-medium text-text-primary">{{ item.value }}</p>
        <p class="text-[11px] text-text-secondary mt-0.5">{{ item.sub }}</p>
      </div>
    </div>

    <!-- REQUEST SECTION -->
    <div>
      <p class="text-[11px] font-medium tracking-widest uppercase text-text-secondary mb-4">
        Request More Tokens
      </p>

      <div class="bg-bg-card border border-border rounded-2xl p-5 transition hover:shadow-md">

        <!-- HEADER -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-text-primary">Token requests</p>
            <p class="text-xs text-text-secondary mt-0.5">
              Request additional tokens from admin
            </p>
          </div>

          <button
            @click="showModal = true"
            class="px-3 py-1.5 text-xs cursor-pointer rounded-lg border border-border text-accent
                   hover:bg-accent/10 hover:border-accent transition-all duration-200
                   hover:scale-105 active:scale-95"
          >
            Request tokens
          </button>
        </div>

        <!-- HISTORY -->
        <div class="border-t border-border pt-4">
          <p class="text-xs text-text-secondary mb-3">Recent requests</p>

          <div class="divide-y divide-border">
            <div
              v-for="req in requestHistory"
              :key="req.id"
              class="flex items-center justify-between py-2 px-2 rounded-lg transition-all duration-200 hover:bg-bg-body"
            >
              <div>
                <p class="text-sm text-text-primary font-medium">
                  +{{ fmt(req.amount) }} tokens
                </p>
                <p class="text-[11px] text-text-secondary">
                  {{ req.date }} · {{ req.reason }}
                </p>
              </div>

              <span
                class="text-[10px] px-2 py-1 rounded-full border transition"
                :class="{
                  'text-emerald-600 border-emerald-500/30 bg-emerald-500/10': req.status === 'Approved',
                  'text-amber-600 border-amber-500/30 bg-amber-500/10': req.status === 'Pending',
                  'text-red-600 border-red-500/30 bg-red-500/10': req.status === 'Denied',
                }"
              >
                {{ req.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        @click.self="showModal = false"
      >
        <!-- BACKDROP -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-md"></div>

        <!-- MODAL CARD -->
        <div
          class="relative w-full max-w-xl bg-bg-card border border-border rounded-2xl p-5
                 shadow-xl transition-all duration-300 hover:scale-[1.01]"
        >

          <!-- HEADER -->
          <div class="flex justify-between mb-4">
            <div>
              <p class="text-sm font-semibold text-text-primary">Request Tokens</p>
              <p class="text-xs text-text-secondary">Send request to admin</p>
            </div>

            <button
              class="hover:text-accent transition"
              @click="showModal = false"
            >
              ✕
            </button>
          </div>

          <!-- FORM -->
          <div class="space-y-3">

            <input
              v-model="form.customAmount"
              type="number"
              placeholder="Token amount"
              class="w-full px-3 py-2 rounded-lg border border-border bg-bg-card
                     text-text-primary focus:ring-2 focus:ring-accent/30
                     transition"
            />

            <select
              v-model="form.priority"
              class="w-full px-3 py-2 rounded-lg border border-border bg-bg-card
                     text-text-primary focus:ring-2 focus:ring-accent/30 transition"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <textarea
              v-model="form.reason"
              rows="3"
              placeholder="Reason"
              class="w-full px-3 py-2 rounded-lg border border-border bg-bg-card
                     text-text-primary focus:ring-2 focus:ring-accent/30 transition"
            />

            <button
              @click="submitRequestFromModal"
              class="w-full py-2 rounded-lg bg-accent text-white
                     hover:bg-accent-hover hover:shadow-md
                     active:scale-95 transition-all duration-200"
            >
              Submit Request
            </button>

          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
interface Props {
  userId?: string
  allocatedTokens?: number
  usedTokens?: number
  daysUntilReset?: number
  dailyUsage?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  userId: 'user-1',
  allocatedTokens: 50000,
  usedTokens: 31400,
  daysUntilReset: 14,
  dailyUsage: () => [2100, 3400, 1800, 4200, 5100, 2900, 3600],
})
// ── Modal state ──
const showModal = ref(false)

// ── Stats ──
const stats = computed(() => ({
  allocated: props.allocatedTokens,
  used: props.usedTokens,
  daysUntilReset: props.daysUntilReset,
  daily: props.dailyUsage,
}))

const usedPct = computed(() =>
  Math.round((stats.value.used / stats.value.allocated) * 100)
)

const usedColor = computed(() =>
  usedPct.value >= 90 ? 'text-red-500' :
  usedPct.value >= 70 ? 'text-amber-500' :
  'text-text-primary'
)

const fmt = (n: number) => n.toLocaleString()

const animatedBar = ref(0)
onMounted(() => {
  requestAnimationFrame(() => {
    animatedBar.value = usedPct.value
  })
})

// ── Form ──
const form = ref({
  customAmount: '',
  priority: 'low',
  reason: '',
})

const isSaving = ref(false)

// ── Submit ──
async function submitRequestFromModal() {
  if (!form.value.customAmount || !form.value.reason) return

  isSaving.value = true
  await new Promise(r => setTimeout(r, 900))

  showModal.value = false
  isSaving.value = false

  form.value = {
    customAmount: '',
    priority: 'low',
    reason: '',
  }
}

// ── History ──
const requestHistory = ref([
  { id: 1, amount: 25000, date: 'Apr 28, 2026', reason: 'Q2 sprint', status: 'Approved' },
  { id: 2, amount: 50000, date: 'Apr 10, 2026', reason: 'ML tasks', status: 'Pending' },
  { id: 3, amount: 10000, date: 'Mar 15, 2026', reason: 'Overflow usage', status: 'Denied' },
])

// ── Breakdown (unchanged conceptually) ──
const breakdown = computed(() => [
  { label: 'Input', value: '19,800', sub: 'prompt tokens', icon: {} },
  { label: 'Output', value: '11,600', sub: 'generated tokens', icon: {} },
  { label: 'Requests', value: '47', sub: 'this month', icon: {} },
  { label: 'Avg/day', value: '2,900', sub: 'tokens/day', icon: {} },
])
</script>