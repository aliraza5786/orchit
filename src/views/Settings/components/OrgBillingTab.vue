<template>
  <div class="w-full space-y-6 flex-1">

    <!-- ── Header ── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent border border-accent/20 transition-all duration-200 hover:bg-accent/20 hover:scale-110">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </span>
          Organization Billing & Invoices
        </h3>
        <p class="text-sm text-text-secondary mt-1">Manage your subscription, payment method, and billing history.</p>
      </div>

      <!-- Status badge -->
      <div class="self-start sm:self-auto">
        <span
          v-if="isLoading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-border/10 border-border/40 text-text-secondary"
        >
          <svg class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Loading…
        </span>
        <span
          v-else-if="subscriptionStatus === 'active'"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Active
        </span>
        <span
          v-else-if="subscriptionStatus === 'past_due'"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-red-400/10 border-red-400/30 text-red-400"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
          Payment due
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-border/10 border-border/40 text-text-secondary"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-text-secondary/40"></span>
          Free plan
        </span>
      </div>
    </div>

    <!-- ── Skeleton ── -->
    <div v-if="isLoading" class="space-y-5 animate-pulse">
      <div class="bg-bg-card border border-border/40 rounded-xl p-5 space-y-4">
        <div class="flex items-start justify-between">
          <div class="space-y-2">
            <div class="h-2.5 w-20 rounded bg-border/30"></div>
            <div class="h-6 w-36 rounded-lg bg-border/30"></div>
            <div class="h-2.5 w-28 rounded bg-border/20"></div>
          </div>
          <div class="h-9 w-28 rounded-lg bg-border/25"></div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div v-for="i in 4" :key="i" class="h-16 rounded-xl bg-border/20"></div>
        </div>
      </div>
      <div class="bg-bg-card border border-border/40 rounded-xl p-5 space-y-3">
        <div class="h-3 w-32 rounded bg-border/30"></div>
        <div v-for="i in 3" :key="i" class="flex items-center justify-between py-3 border-b border-border/20">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-border/30"></div>
            <div class="space-y-1.5">
              <div class="h-3 w-24 rounded bg-border/30"></div>
              <div class="h-2.5 w-16 rounded bg-border/20"></div>
            </div>
          </div>
          <div class="h-6 w-16 rounded-full bg-border/25"></div>
        </div>
      </div>
    </div>

    <template v-else>

      <!-- ── Past due warning ── -->
      <div
        v-if="subscriptionStatus === 'past_due'"
        class="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5"
      >
        <svg class="shrink-0 mt-0.5 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="text-xs text-red-400 leading-relaxed">
          Your last payment failed. Please <span class="font-semibold">update your payment method</span> to avoid service interruption.
        </p>
      </div>

      <!-- ── Current Plan Card ── -->
      <div class="bg-bg-card border border-border/40 rounded-xl overflow-hidden transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10">

        <!-- Top bar: plan name + upgrade button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-border/20">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              :class="isFree ? 'bg-border/10 border-border/30' : 'bg-accent/10 border-accent/20'"
            >
              <svg :stroke="isFree ? 'var(--color-text-secondary)' : 'var(--accent)'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Current Plan</p>
              <p class="text-base font-bold text-text-primary mt-0.5">{{ planName }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <button
              v-if="isFree"
              @click="emit('go-to-packages')"
              class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all active:scale-95 cursor-pointer"
              style="background: linear-gradient(90deg, #7c3aed, #6c63ff)"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Upgrade Plan
            </button>
            <button
              v-else
              @click="emit('go-to-packages')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-border/50 text-text-secondary rounded-lg hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all cursor-pointer"
            >
              Manage Plan
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/20">
          <div class="px-5 py-4 hover:bg-border/5 transition-all duration-150 cursor-default group">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Amount</p>
            <p class="text-xl font-bold text-text-primary mt-1 group-hover:scale-105 origin-left transition-transform duration-200">
              {{ isFree ? 'Free' : planPrice }}
            </p>
            <p class="text-[11px] text-text-secondary mt-0.5">{{ isFree ? 'forever' : ('per ' + planInterval) }}</p>
          </div>
          <div class="px-5 py-4 hover:bg-border/5 transition-all duration-150 cursor-default group">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Renews</p>
            <p class="text-xl font-bold text-text-primary mt-1 group-hover:scale-105 origin-left transition-transform duration-200">
              {{ isFree ? '—' : renewDate }}
            </p>
            <p class="text-[11px] text-text-secondary mt-0.5">{{ isFree ? 'no renewal' : renewCountdown }}</p>
          </div>
          <div class="px-5 py-4 hover:bg-border/5 transition-all duration-150 cursor-default group">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Billing</p>
            <p class="text-xl font-bold text-text-primary mt-1 group-hover:scale-105 origin-left transition-transform duration-200 capitalize">
              {{ isFree ? '—' : planInterval }}
            </p>
            <p class="text-[11px] text-text-secondary mt-0.5">{{ isFree ? 'no cycle' : 'billing cycle' }}</p>
          </div>
          <div class="px-5 py-4 hover:bg-border/5 transition-all duration-150 cursor-default group">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Started</p>
            <p class="text-xl font-bold text-text-primary mt-1 group-hover:scale-105 origin-left transition-transform duration-200">
              {{ startDate || '—' }}
            </p>
            <p class="text-[11px] text-text-secondary mt-0.5">subscription start</p>
          </div>
        </div>
      </div>

      <!-- ── Payment Method ── -->
      <div class="bg-bg-card border border-border/40 rounded-xl overflow-hidden transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border/20">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Payment Method</p>
          <button
            v-if="!isFree"
            @click="handleUpdatePayment"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Update
          </button>
        </div>

        <!-- No payment method (free plan) -->
        <div v-if="isFree" class="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div class="w-10 h-10 rounded-xl bg-border/10 border border-border/30 flex items-center justify-center mb-3">
            <svg class="text-text-secondary/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-text-secondary">No payment method</p>
          <p class="text-xs text-text-secondary/60 mt-1 max-w-xs">Add a payment method when you upgrade to a paid plan.</p>
        </div>

        <!-- Card on file -->
        <div v-else class="flex items-center gap-4 px-5 py-4">
          <!-- Card brand icon -->
          <div class="w-12 h-8 rounded-md border border-border/40 bg-bg-body flex items-center justify-center shrink-0">
            <svg v-if="cardBrand === 'visa'" width="28" height="10" viewBox="0 0 48 16" fill="none">
              <text x="0" y="13" font-family="Arial" font-weight="bold" font-size="14" fill="#1A1F71">VISA</text>
            </svg>
            <svg v-else-if="cardBrand === 'mastercard'" width="28" height="18" viewBox="0 0 30 20">
              <circle cx="10" cy="10" r="10" fill="#EB001B"/>
              <circle cx="20" cy="10" r="10" fill="#F79E1B"/>
              <path d="M15 4.27A9.97 9.97 0 0 1 18.73 10 9.97 9.97 0 0 1 15 15.73 9.97 9.97 0 0 1 11.27 10 9.97 9.97 0 0 1 15 4.27z" fill="#FF5F00"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-text-secondary/50">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-text-primary capitalize">{{ cardBrand }} ending in {{ cardLast4 }}</p>
            <p class="text-xs text-text-secondary mt-0.5">Expires {{ cardExpiry }}</p>
          </div>
          <span class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <span class="w-1 h-1 rounded-full bg-emerald-400"></span>
            Default
          </span>
        </div>
      </div>

      <!-- ── Invoice History ── -->
      <div class="bg-bg-card border border-border/40 rounded-xl overflow-hidden transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border/20">
          <div class="flex items-center gap-2">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Invoice History</p>
            <span
              v-if="invoices.length > 0"
              class="text-[10px] font-semibold bg-border/20 border border-border/30 text-text-secondary px-2 py-0.5 rounded-full"
            >{{ invoices.length }}</span>
          </div>
          <button
            v-if="invoices.length > 0"
            @click="downloadAllInvoices"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export all
          </button>
        </div>

        <!-- Empty invoices -->
        <div v-if="invoices.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div class="w-10 h-10 rounded-xl bg-border/10 border border-border/30 flex items-center justify-center mb-3">
            <svg class="text-text-secondary/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-text-secondary">No invoices yet</p>
          <p class="text-xs text-text-secondary/60 mt-1">Your billing history will appear here after your first payment.</p>
        </div>

        <!-- Invoice list -->
        <div v-else class="divide-y divide-border/15">
          <div
            v-for="invoice in paginatedInvoices"
            :key="invoice.id"
            class="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-border/5 transition-all duration-150 group/row"
          >
            <!-- Invoice icon -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-150 group-hover/row:scale-105"
              :class="invoice.status === 'paid'
                ? 'bg-emerald-400/10 border-emerald-400/20'
                : invoice.status === 'failed'
                  ? 'bg-red-400/10 border-red-400/20'
                  : 'bg-amber-400/10 border-amber-400/20'"
            >
              <svg
                :stroke="invoice.status === 'paid' ? '#34d399' : invoice.status === 'failed' ? '#f87171' : '#fbbf24'"
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke-width="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>

            <!-- Invoice info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-text-primary truncate">{{ invoice.description }}</p>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">{{ invoice.date }}</p>
            </div>

            <!-- Amount -->
            <p class="text-sm font-bold text-text-primary shrink-0">{{ invoice.amount }}</p>

            <!-- Status badge -->
            <span
              class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0"
              :class="invoice.status === 'paid'
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : invoice.status === 'failed'
                  ? 'bg-red-400/10 border-red-400/20 text-red-400'
                  : 'bg-amber-400/10 border-amber-400/20 text-amber-400'"
            >
              <span
                class="w-1 h-1 rounded-full"
                :class="invoice.status === 'paid' ? 'bg-emerald-400' : invoice.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'"
              ></span>
              {{ invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) }}
            </span>

            <!-- Download -->
            <button
              v-if="invoice.downloadUrl"
              @click="downloadInvoice(invoice)"
              class="shrink-0 w-7 h-7 rounded-lg border border-border/40 flex items-center justify-center text-text-secondary/40 hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all duration-150 cursor-pointer"
              title="Download invoice"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalInvoicePages > 1"
          class="flex items-center justify-between px-5 py-3 border-t border-border/20 bg-border/5"
        >
          <p class="text-xs text-text-secondary">
            Showing
            <span class="font-medium text-text-primary">{{ (invoicePage - 1) * INVOICE_PAGE_SIZE + 1 }}</span>–<span
              class="font-medium text-text-primary">{{ Math.min(invoicePage * INVOICE_PAGE_SIZE, invoices.length) }}</span>
            of
            <span class="font-medium text-text-primary">{{ invoices.length }}</span>
          </p>
          <div class="flex items-center gap-1">
            <button
              @click="invoicePage--"
              :disabled="invoicePage === 1"
              class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i class="fa-solid fa-chevron-left text-[10px]"></i>
            </button>
            <template v-for="p in totalInvoicePages" :key="p">
              <template v-if="p === 1 || p === totalInvoicePages || (p >= invoicePage - 1 && p <= invoicePage + 1)">
                <button
                  @click="invoicePage = p"
                  class="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                  :class="p === invoicePage ? 'bg-accent text-white border border-accent' : 'border border-border/50 text-text-secondary hover:text-text-primary hover:border-border'"
                >{{ p }}</button>
              </template>
              <span v-else-if="p === invoicePage - 2 || p === invoicePage + 2" class="w-8 h-8 flex items-center justify-center text-xs text-text-secondary">…</span>
            </template>
            <button
              @click="invoicePage++"
              :disabled="invoicePage === totalInvoicePages"
              class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Danger Zone: Cancel Subscription ── -->
      <div
        v-if="!isFree"
        class="bg-bg-card border border-border/40 rounded-xl overflow-hidden transition-all duration-200 hover:border-red-500/20"
      >
        <div class="px-5 py-4 border-b border-border/20">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Danger Zone</p>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="text-red-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-text-primary">Cancel Subscription</p>
              <p class="text-xs text-text-secondary mt-0.5 leading-relaxed">
                Your plan stays active until <span class="font-semibold text-text-primary">{{ renewDate }}</span>. After that, you'll be downgraded to the free plan.
              </p>
            </div>
          </div>
          <button
            @click="showCancelModal = true"
            class="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 hover:border-red-400/50 transition-all active:scale-95 cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Cancel Subscription
          </button>
        </div>
      </div>

    </template>
  </div>

  <!-- ── Cancel Subscription Modal ── -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCancelModal = false"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-3"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div
            v-if="showCancelModal"
            class="relative z-10 w-full max-w-md bg-bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            <!-- Modal header -->
            <div class="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-border/30">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <svg class="text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-text-primary">Cancel Subscription?</h4>
                  <p class="text-xs text-text-secondary mt-0.5">This action takes effect at period end</p>
                </div>
              </div>
              <button
                @click="showCancelModal = false"
                class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-border/40 text-text-secondary hover:border-border/70 hover:text-text-primary hover:bg-border/10 transition-all active:scale-90 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="px-6 py-5 space-y-4">
              <!-- What you lose -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">What you'll lose</p>
                <div class="space-y-2">
                  <div v-for="item in cancelConsequences" :key="item" class="flex items-start gap-2.5">
                    <svg class="text-red-400 shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <p class="text-[11px] text-text-secondary leading-relaxed">{{ item }}</p>
                  </div>
                </div>
              </div>

              <!-- Active until notice -->
              <div class="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3.5 py-3">
                <svg class="text-blue-400 shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p class="text-[11px] text-blue-400/80 leading-relaxed">
                  Your plan stays active until <span class="font-semibold text-blue-400">{{ renewDate }}</span>. No charges after that.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 px-6 py-4 border-t border-border/30 bg-border/5">
              <button
                @click="showCancelModal = false"
                class="flex-1 px-4 py-2.5 text-xs font-semibold text-text-secondary border border-border/50 rounded-lg hover:bg-border/10 hover:border-border/70 transition-all active:scale-95 cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                @click="handleCancelSubscription"
                :disabled="isCancelling"
                class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg border transition-all bg-red-500 border-red-600 text-white hover:bg-red-600 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg v-if="isCancelling" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {{ isCancelling ? 'Cancelling…' : 'Yes, Cancel' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps<{ profile?: any }>()
const emit = defineEmits(['go-to-packages'])

// ── Company subscription data ──────────────────────────────────────────────────
const activeCompany   = computed(() => props.profile?.active_company ?? null)
const subscription    = computed(() => activeCompany.value?.company_subscription ?? null)
const isLoading       = ref(false)

// ── Plan info ──────────────────────────────────────────────────────────────────
const planName = computed(() =>
  subscription.value?.package?.name || 'Free Organization'
)
const isFree = computed(() =>
  !subscription.value?.package?.packageType ||
  subscription.value?.package?.packageType === 'free'
)
const subscriptionStatus = computed(() =>
  isFree.value ? 'free' : (subscription.value?.status ?? 'active')
)
const planInterval = computed(() => subscription.value?.interval || 'month')
const planPrice = computed(() => {
  const amount = subscription.value?.package?.amount
  const symbol = subscription.value?.package?.currencySymbol || '$'
  if (!amount) return '—'
  return `${symbol}${(amount / 100).toFixed(2)}`
})

function formatShortDate(isoString?: string): string {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysFromNow(isoString?: string): string {
  if (!isoString) return ''
  const diff = Math.ceil((new Date(isoString).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return `in ${diff} days`
}

const renewDate      = computed(() => formatShortDate(subscription.value?.currentPeriodEnd))
const renewCountdown = computed(() => daysFromNow(subscription.value?.currentPeriodEnd))
const startDate      = computed(() => formatShortDate(subscription.value?.currentPeriodStart))

// ── Payment method (mocked — wire to Stripe portal API when available) ─────────
const cardBrand  = ref<string>('visa')
const cardLast4  = ref<string>('4242')
const cardExpiry = ref<string>('08 / 27')

function handleUpdatePayment() {
  toast.info('Redirecting to payment portal…')
  // wire to: window.location.href = await getStripePortalUrl()
}

// ── Invoices (mocked — wire to useOrgInvoices() query) ────────────────────────
interface Invoice {
  id: string
  description: string
  date: string
  amount: string
  status: 'paid' | 'failed' | 'pending'
  downloadUrl?: string
}

const INVOICE_PAGE_SIZE = 5
const invoicePage = ref(1)

const invoices = computed<Invoice[]>(() => {
  // Replace this with real API data: useOrgInvoices({ company_id: ... })
  if (isFree.value) return []
  return [
    { id: 'inv_001', description: 'Organization Pro — Monthly', date: 'Jun 1, 2026',  amount: '$49.99', status: 'paid',    downloadUrl: '#' },
    { id: 'inv_002', description: 'Organization Pro — Monthly', date: 'May 1, 2026',  amount: '$49.99', status: 'paid',    downloadUrl: '#' },
    { id: 'inv_003', description: 'Organization Pro — Monthly', date: 'Apr 1, 2026',  amount: '$49.99', status: 'paid',    downloadUrl: '#' },
    { id: 'inv_004', description: 'Organization Pro — Monthly', date: 'Mar 1, 2026',  amount: '$49.99', status: 'failed',  downloadUrl: '#' },
    { id: 'inv_005', description: 'Organization Pro — Monthly', date: 'Feb 1, 2026',  amount: '$49.99', status: 'paid',    downloadUrl: '#' },
    { id: 'inv_006', description: 'Organization Pro — Monthly', date: 'Jan 1, 2026',  amount: '$49.99', status: 'paid',    downloadUrl: '#' },
  ]
})

const totalInvoicePages = computed(() => Math.ceil(invoices.value.length / INVOICE_PAGE_SIZE))
const paginatedInvoices = computed<Invoice[]>(() => {
  const start = (invoicePage.value - 1) * INVOICE_PAGE_SIZE
  return invoices.value.slice(start, start + INVOICE_PAGE_SIZE)
})

function downloadInvoice(invoice: Invoice) {
  if (!invoice.downloadUrl || invoice.downloadUrl === '#') {
    toast.info('Invoice download coming soon.')
    return
  }
  window.open(invoice.downloadUrl, '_blank')
}

function downloadAllInvoices() {
  toast.info('Preparing invoice export…')
  // wire to: bulk download / zip endpoint
}

// ── Cancel subscription ────────────────────────────────────────────────────────
const showCancelModal = ref(false)
const isCancelling    = ref(false)

const cancelConsequences = [
  'Access to premium AI token pool will be removed',
  'Organization member limit reverts to free tier',
  'Advanced roles, integrations, and controls disabled',
  'Billing and plan management features restricted',
]

async function handleCancelSubscription() {
  isCancelling.value = true
  try {
    // wire to: await cancelOrgSubscription(activeCompany.value?._id)
    await new Promise(r => setTimeout(r, 1200)) // mock delay
    showCancelModal.value = false
    toast.success('Subscription cancelled. Your plan stays active until ' + renewDate.value)
  } catch {
    toast.error('Failed to cancel subscription. Please try again.')
  } finally {
    isCancelling.value = false
  }
}
</script>