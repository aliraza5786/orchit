<template>
  <div class="w-full space-y-6 flex-1">

    <!-- ── Skeleton loader ──────────────────────────────────────────────────── -->
    <template v-if="isLoading">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div class="space-y-2">
          <div class="h-5 w-40 bg-border/20 rounded-lg"></div>
          <div class="h-3.5 w-64 bg-border/15 rounded-lg"></div>
        </div>
        <div class="h-9 w-32 bg-border/20 rounded-lg self-start sm:self-auto"></div>
      </div>

      <div class="space-y-3">
        <div
          v-for="i in 2"
          :key="i"
          class="bg-bg-card border border-border/40 rounded-xl overflow-hidden animate-pulse"
        >
          <!-- Card header skeleton -->
          <div class="flex items-center justify-between px-4 py-3.5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-border/20 shrink-0"></div>
              <div class="space-y-1.5">
                <div class="h-3.5 w-36 bg-border/20 rounded"></div>
                <div class="h-2.5 w-24 bg-border/15 rounded"></div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-16 bg-border/20 rounded-full"></div>
              <div class="w-7 h-7 bg-border/15 rounded-lg"></div>
              <div class="w-7 h-7 bg-border/15 rounded-lg"></div>
            </div>
          </div>
          <!-- Card footer skeleton -->
          <div class="border-t border-border/20 px-4 py-3 flex gap-5">
            <div class="h-3 w-20 bg-border/15 rounded"></div>
            <div class="h-3 w-20 bg-border/15 rounded"></div>
            <div class="h-3 w-24 bg-border/15 rounded"></div>
            <div class="ml-auto h-3 w-16 bg-border/15 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Info banner skeleton -->
      <div class="h-12 bg-border/10 border border-border/20 rounded-xl animate-pulse"></div>
    </template>

    <template v-else>
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <span
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent border border-accent/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            Domain Setup
          </h3>
          <p class="text-sm text-text-secondary mt-1">
            Connect and manage custom domains for your organization.
          </p>
        </div>

        <button
          v-if="canAddDomain"
          :disabled="hasDomain"
          @click="openAddModal"
          class="inline-flex items-center disabled:opacity-40 disabled:cursor-not-allowed gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 self-start sm:self-auto whitespace-nowrap"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add domain
        </button>
      </div>

      <!-- ── Add domain inline form ───────────────────────────────────────── -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showAddModal"
          class="bg-bg-card border border-border/50 rounded-xl p-5 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-text-primary">Connect a domain</h4>
            <button
              @click="closeAddModal"
              class="p-1.5 rounded-lg text-text-secondary hover:bg-border/20 hover:text-text-primary transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Domain name</label>
            <div class="flex gap-2">
              <input
                v-model="newDomain"
                type="text"
                placeholder="yourdomain.com"
                class="flex-1 px-3.5 py-2.5 text-sm text-text-primary bg-border/10 border border-border/40 rounded-lg outline-none focus:border-accent/50 focus:bg-accent/5 transition-all placeholder:text-text-secondary/40"
                :disabled="isAdding || !canAddDomain"
                @keyup.enter="addDomain"
              />
              <button
                @click="addDomain"
                :disabled="!newDomain.trim() || isAdding || !canAddDomain"
                class="px-4 py-2.5 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <svg
                  v-if="isAdding"
                  class="animate-spin"
                  width="12" height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {{ isAdding ? 'Connecting…' : 'Connect' }}
              </button>
            </div>
            <p v-if="addError" class="text-xs text-red-400 flex items-center gap-1.5 mt-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ addError }}
            </p>
          </div>
          <p class="text-xs text-text-secondary leading-relaxed">
            Enter your root domain (e.g.
            <span class="font-mono text-text-primary bg-border/20 px-1.5 py-0.5 rounded">acme.com</span>).
            We'll guide you through adding the required DNS records after connecting.
          </p>
        </div>
      </Transition>

      <!-- ── Domain list ──────────────────────────────────────────────────── -->
      <div
        v-if="fetchError"
        class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5"
      >
        <svg class="shrink-0 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="text-xs text-red-400">Failed to load domains. Please try again.</p>
        <button @click="refetch()" class="ml-auto text-xs font-semibold text-red-400 hover:underline">
          Retry
        </button>
      </div>

      <template v-else>
        <!-- Empty state -->
        <div
          v-if="domains.length === 0"
          class="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/40 rounded-xl"
        >
          <div class="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-accent">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h3 class="text-sm font-bold text-text-primary mb-1">No domains connected</h3>
          <p class="text-xs text-text-secondary mb-5 max-w-xs leading-relaxed">
            Connect a custom domain to give your workspace a professional, branded URL.
          </p>
          <button
            v-if="canAddDomain"
            :disabled="hasDomain"
            @click="openAddModal"
            class="inline-flex items-center disabled:opacity-40 disabled:cursor-not-allowed gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Connect your first domain
          </button>
        </div>

        <!-- Domain cards -->
        <div v-else class="space-y-3">
          <div
            v-for="domain in domains"
            :key="domain._id"
            class="bg-bg-card border border-border/40 rounded-xl overflow-hidden hover:border-border/70 transition-all"
          >
            <!-- Card header -->
            <div class="flex items-center justify-between px-4 py-3.5">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-border/15 border border-border/30 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-text-secondary">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-semibold text-text-primary truncate">{{ domain.domain }}</p>
                    <span
                      v-if="domain.is_primary"
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent border border-accent/20"
                    >Primary</span>
                  </div>
                  <p class="text-xs text-text-secondary mt-0.5">Added {{ formatDate(domain.created_at) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 ml-3">
                <span :class="statusBadgeClass(domain.status)">
                  <span :class="statusDotClass(domain.status)"></span>
                  {{ statusLabel(domain.status) }}
                </span>

                <!-- Edit domain button -->
                <button
                  v-if="canManageDomain"
                  @click="openEditModal(domain)"
                  class="p-1.5 rounded-lg border cursor-pointer border-transparent text-text-secondary hover:bg-accent/10 hover:border-accent/20 hover:text-accent transition-all"
                  title="Edit domain"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>

                <!-- Set primary button -->
                <button
                  v-if="canSetPrimaryDomain && domain.status === 'verified' && !domain.is_primary"
                  @click="setPrimary(domain._id)"
                  :disabled="isSettingPrimary"
                  class="p-1.5 rounded-lg border border-transparent text-text-secondary hover:bg-accent/10 hover:border-accent/20 hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Set as primary domain"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Pending / Verifying / Failed banner -->
            <div
              v-if="domain.status === 'pending' || domain.status === 'verifying' || domain.status === 'failed'"
              class="border-t border-border/30 px-4 py-3.5 space-y-3"
            >
              <div
                class="flex items-start gap-3 rounded-lg px-3.5 py-3 border"
                :style="pendingBannerStyle(domain.status)"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" :style="pendingIconStyle(domain.status)">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold mb-0.5" :style="pendingIconStyle(domain.status)">
                    {{ domain.status === 'failed' ? 'Verification failed' : 'Domain verification required' }}
                  </p>
                  <p class="text-xs leading-relaxed text-text-secondary">
                    <template v-if="domain.status === 'failed'">
                      The last DNS check failed. Please ensure your DNS records are correct and try again.
                    </template>
                    <template v-else>
                      Your domain <strong class="text-text-primary">{{ domain.domain }}</strong> is not yet verified.
                      Add the required DNS record at your registrar and verify to activate it.
                    </template>
                  </p>
                </div>
                <button
                  v-if="canVerifyDomain"
                  @click="openVerifyModal(domain)"
                  class="shrink-0 inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95"
                  style="background: var(--accent); color: white;"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Verify domain
                </button>
              </div>

              <!-- DNS records table -->
              <div v-if="domain.instructions" class="rounded-lg border border-border/30 overflow-hidden">
                <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-border/10 border-b border-border/20">
                  <p class="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Type</p>
                  <p class="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Name</p>
                  <p class="col-span-5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Value</p>
                  <p class="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary text-right">Status</p>
                </div>
                <div class="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                  <div class="col-span-2">
                    <span class="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-border/20 text-text-secondary font-mono">
                      {{ domain.instructions.record_type }}
                    </span>
                  </div>
                  <div class="col-span-4 flex items-center gap-1.5 min-w-0">
                    <p class="text-xs font-mono text-text-primary truncate">{{ getRecordHost(domain.instructions) }}</p>
                    <button @click="copy(getRecordHost(domain.instructions))" class="copy-btn shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>
                  <div class="col-span-5 flex items-center gap-1.5 min-w-0">
                    <p class="text-xs font-mono text-text-secondary truncate">{{ getRecordValue(domain.instructions) }}</p>
                    <button @click="copy(getRecordValue(domain.instructions))" class="copy-btn shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>
                  <div class="col-span-1 flex justify-end">
                    <span v-if="domain.last_check_result?.ok" class="text-emerald-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <span v-else class="text-amber-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <p v-if="domain.last_check_result && !domain.last_check_result.ok" class="text-xs text-amber-400 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ domain.last_check_result.error }}
              </p>
              <p class="text-xs text-text-secondary leading-relaxed">
                <svg class="inline mr-1 mb-0.5 text-amber-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                DNS changes can take up to <span class="font-semibold text-text-primary">24 hours</span> to propagate.
              </p>
            </div>

            <!-- ── Verified domain footer + Users section ─────────────────── -->
            <template v-else-if="domain.status === 'verified'">
              <div class="border-t border-border/30 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <div class="flex items-center gap-1.5 text-xs text-text-secondary">
                  <svg
                    :class="domain.ssl_status === 'active' ? 'text-emerald-400' : 'text-text-secondary/40'"
                    width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  SSL {{ sslStatusLabel(domain.ssl_status) }}
                </div>
                <div class="flex items-center gap-1.5 text-xs text-text-secondary">
                  <svg class="text-emerald-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  DNS verified
                </div>
                <div v-if="domain.verified_at" class="flex items-center gap-1.5 text-xs text-text-secondary">
                  <svg class="text-emerald-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Verified {{ formatDate(domain.verified_at) }}
                </div>
                <a
                  :href="`https://${domain.domain}`"
                  target="_blank"
                  rel="noopener"
                  class="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  Visit site
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>

              <!-- ── Domain Users Section ──────────────────────────────────── -->
              <!-- ── Domain Users Section (replace the old one inside verified block) ──────── -->
<div class="border-t border-border/30 px-4 py-4 space-y-4">

  <!-- Section header -->
  <div class="flex items-center justify-between gap-3">
    <div>
      <h4 class="text-sm font-bold text-text-primary flex items-center gap-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-accent">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Domain Users
        <span class="text-[10px] font-medium text-text-secondary bg-bg-body border border-border/50 px-1.5 py-0.5 rounded-full">
          {{ domainUsersForDomain(domain._id).length }}
        </span>
      </h4>
      <p class="text-xs text-text-secondary mt-0.5">
        Select users to add them to your organization.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <!-- Confirm transfer button — only when users selected -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <button
          v-if="(domainSelectedIds[domain._id] ?? []).length > 0"
          @click="openTransferModal(domain._id, domain.domain)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 active:scale-95 transition-all shadow-md shadow-green-500/20"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <polyline points="16 11 18 13 22 9"/>
          </svg>
          Confirm
          <span class="bg-white/25 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {{ (domainSelectedIds[domain._id] ?? []).length }}
          </span>
        </button>
      </Transition>

      <!-- Refresh button -->
      <button
        @click="loadDomainUsers(domain._id)"
        :disabled="loadingDomainUsers === domain._id"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border/50 text-text-secondary rounded-lg hover:border-accent/40 hover:text-accent transition-all disabled:opacity-50"
      >
        <svg
          v-if="loadingDomainUsers === domain._id"
          class="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
        ><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
        </svg>
        Refresh
      </button>
    </div>
  </div>

  <!-- Loading skeleton -->
  <div v-if="loadingDomainUsers === domain._id" class="space-y-2">
    <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border/30 animate-pulse">
      <div class="w-4 h-4 rounded bg-border/20 shrink-0"></div>
      <div class="w-8 h-8 rounded-full bg-border/20 shrink-0"></div>
      <div class="flex-1 space-y-1.5">
        <div class="h-3 w-32 bg-border/20 rounded"></div>
        <div class="h-2.5 w-40 bg-border/15 rounded"></div>
      </div>
    </div>
  </div>

  <!-- No users found -->
  <template v-else-if="domainUsersLoaded.has(domain._id) && domainUsersForDomain(domain._id).length === 0">
    <div class="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border/40 rounded-xl">
      <div class="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-accent">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <h4 class="text-sm font-bold text-text-primary mb-1">No domain users found</h4>
      <p class="text-xs text-text-secondary mb-4 max-w-xs leading-relaxed">
        No users are associated with this domain yet. Create the first user to get started.
      </p>
      <button
        @click="openCreateUserModal(domain._id)"
        class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-all"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create first user
      </button>
    </div>
  </template>

  <!-- Users list with checkboxes -->
  <template v-else-if="domainUsersForDomain(domain._id).length > 0">

    <!-- Select all row -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2.5">
        <button
          @click="toggleDomainSelectAll(domain._id)"
          class="w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0"
          :class="isDomainAllSelected(domain._id)
            ? 'bg-accent border-accent'
            : isDomainPartiallySelected(domain._id)
              ? 'bg-accent/20 border-accent/60'
              : 'border-border/60 bg-transparent hover:border-accent/40'"
        >
          <i
            v-if="isDomainAllSelected(domain._id) || isDomainPartiallySelected(domain._id)"
            class="text-white text-[8px]"
            :class="isDomainAllSelected(domain._id) ? 'fa-solid fa-check' : 'fa-solid fa-minus'"
          ></i>
        </button>
        <span class="text-[11px] text-text-secondary font-medium select-none">
          Select all
          <span v-if="(domainSelectedIds[domain._id] ?? []).length > 0" class="text-accent font-semibold ml-0.5">
            ({{ (domainSelectedIds[domain._id] ?? []).length }} selected)
          </span>
        </span>
      </div>

      <button
        v-if="(domainSelectedIds[domain._id] ?? []).length > 0"
        @click="clearDomainSelection(domain._id)"
        class="text-[11px] text-text-secondary hover:text-text-primary transition-all"
      >
        Clear
      </button>
    </div>

    <!-- User rows -->
    <div class="space-y-2">
      <div
        v-for="user in domainUsersForDomain(domain._id)"
        :key="user._id"
        @click="toggleDomainUser(domain._id, user._id)"
        class="flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all cursor-pointer select-none group"
        :class="(domainSelectedIds[domain._id] ?? []).includes(user._id)
          ? 'border-green-500/40 bg-green-500/5'
          : 'border-border/40 bg-bg-body/40 hover:border-border/70 hover:bg-bg-body/60'"
      >
        <!-- Checkbox -->
        <div
          class="w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0"
          :class="(domainSelectedIds[domain._id] ?? []).includes(user._id)
            ? 'bg-green-500 border-green-500'
            : 'border-border/60 group-hover:border-green-500/50'"
        >
          <svg
            v-if="(domainSelectedIds[domain._id] ?? []).includes(user._id)"
            width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"
          ><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <!-- Avatar -->
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden transition-all"
          :class="(domainSelectedIds[domain._id] ?? []).includes(user._id)
            ? 'bg-green-500/20 text-green-600'
            : 'bg-gradient-to-br from-accent/30 to-accent/10 text-accent'"
        >
          <img v-if="user.u_profile_picture" :src="user.u_profile_picture" class="w-full h-full object-cover" :alt="user.u_full_name" />
          <span v-else>{{ getInitials(user.u_full_name) }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold text-text-primary truncate">{{ user.u_full_name }}</span>
          </div>
          <p class="text-xs text-text-secondary truncate">{{ user.u_email }}</p>
        </div>

        <!-- Right indicator -->
        <svg
          class="shrink-0 transition-all"
          :class="(domainSelectedIds[domain._id] ?? []).includes(user._id)
            ? 'text-green-500 opacity-100'
            : 'text-border/60 opacity-0 group-hover:opacity-100'"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
    </div>

    <!-- Bottom actions row -->
    <div class="flex items-center justify-between gap-3 pt-1">
      <button
        @click="openCreateUserModal(domain._id)"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-accent transition-all"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add another user
      </button>

      <button
        @click="openTransferModal(domain._id, domain.domain)"
        :disabled="!(domainSelectedIds[domain._id] ?? []).length"
        class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-green-500/20"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <polyline points="16 11 18 13 22 9"/>
        </svg>
        Confirm
        <span v-if="(domainSelectedIds[domain._id] ?? []).length > 0">
          {{ (domainSelectedIds[domain._id] ?? []).length }} user{{ (domainSelectedIds[domain._id] ?? []).length !== 1 ? 's' : '' }}
        </span>
      </button>
    </div>
  </template>

  <!-- Prompt to load (initial state) -->
  <template v-else>
    <button
      @click="loadDomainUsers(domain._id)"
      class="w-full py-3 rounded-xl border border-dashed border-border/40 text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-accent transition-all flex items-center justify-center gap-2"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      Load domain users
    </button>
  </template>
</div>


<!-- ════════════════════════════════════════════════════════
     TRANSFER CONFIRMATION MODAL
     Place this just before the closing </div> of the main template,
     alongside your other modals (verify, edit, create user)
═══════════════════════════════════════════════════════════ -->
<Transition
  enter-active-class="transition duration-200 ease-out"
  enter-from-class="opacity-0"
  enter-to-class="opacity-100"
  leave-active-class="transition duration-150 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div
    v-if="showTransferModal"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4"
    @click.self="showTransferModal = false"
  >
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-3"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      appear
    >
      <div
        v-if="showTransferModal"
        class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style="background: var(--bg-card); border: 1px solid var(--border);"
      >
        <!-- Modal header -->
        <div class="px-6 pt-6 pb-5 border-b" style="border-color: var(--border);">
          <div class="flex items-start gap-4">
            <!-- Warning icon -->
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style="background: color-mix(in srgb, #f59e0b 12%, transparent); border: 1.5px solid color-mix(in srgb, #f59e0b 30%, transparent);"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-text-primary">Confirm User Transfer</h3>
              <p class="text-xs text-text-secondary mt-1 leading-relaxed">
                You are about to add
                <span class="font-semibold text-text-primary">
                  {{ transferSelectedUsers.length }} user{{ transferSelectedUsers.length !== 1 ? 's' : '' }}
                </span>
                with the
                <code
                  class="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold"
                  style="background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent);"
                >@{{ transferDomainName }}</code>
                email domain to your organization.
              </p>
            </div>
            <button
              @click="showTransferModal = false"
              class="p-1.5 rounded-lg text-text-secondary hover:bg-border/20 hover:text-text-primary transition-all shrink-0 -mt-1 -mr-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal body -->
        <div class="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scroll">

          <!-- Selected users preview -->
          <div class="rounded-xl overflow-hidden border" style="border-color: var(--border);">
            <div
              class="flex items-center gap-2 px-3 py-2 border-b"
              style="background: var(--bg-surface); border-color: var(--border);"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-secondary">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Users to transfer ({{ transferSelectedUsers.length }})
              </span>
            </div>

            <div class="divide-y" style="divide-color: var(--border);">
              <div
                v-for="user in transferSelectedUsers.slice(0, 4)"
                :key="user._id"
                class="flex items-center gap-3 px-3 py-2.5"
              >
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden"
                  style="background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent);"
                >
                  <img v-if="user.u_profile_picture" :src="user.u_profile_picture" class="w-full h-full object-cover" :alt="user.u_full_name" />
                  <span v-else>{{ getInitials(user.u_full_name) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-text-primary truncate">{{ user.u_full_name }}</p>
                  <p class="text-[11px] text-text-secondary truncate">{{ user.u_email }}</p>
                </div>
                <svg class="shrink-0 text-green-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <!-- Overflow -->
              <div
                v-if="transferSelectedUsers.length > 4"
                class="flex items-center gap-3 px-3 py-2.5"
              >
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style="background: var(--bg-surface); border: 1px solid var(--border);"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-secondary">
                    <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
                  </svg>
                </div>
                <p class="text-xs text-text-secondary">
                  +{{ transferSelectedUsers.length - 4 }} more user{{ transferSelectedUsers.length - 4 !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Impact heading -->
          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Once confirmed, this action may impact:
          </p>

          <!-- Impact items -->
          <div class="space-y-2">
            <div
              v-for="impact in transferImpacts"
              :key="impact.label"
              class="flex items-start gap-3 rounded-xl px-3.5 py-3 border transition-all"
              style="border-color: var(--border); background: var(--bg-surface);"
            >
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                :style="{ background: impact.bg, border: `1px solid ${impact.border}` }"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="impact.color" stroke-width="2">
                  <component :is="'path'" v-for="(d, i) in impact.paths" :key="i" :d="d"/>
                </svg>
              </div>
              <div>
                <p class="text-xs font-semibold text-text-primary">{{ impact.label }}</p>
                <p class="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{{ impact.description }}</p>
              </div>
            </div>
          </div>

          <!-- 48h notice -->
          <div
            class="flex items-start gap-3 rounded-xl px-4 py-3 border"
            style="background: color-mix(in srgb, #3b82f6 6%, transparent); border-color: color-mix(in srgb, #3b82f6 20%, transparent);"
          >
            <svg class="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <p class="text-xs leading-relaxed" style="color: #3b82f6;">
              Please review carefully. You have up to
              <strong style="color: #2563eb;">48 hours</strong>
              to confirm, or you can confirm immediately to apply the changes now.
            </p>
          </div>
        </div>

        <!-- Modal footer -->
        <div class="px-6 py-4 border-t flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:justify-end" style="border-color: var(--border);">
          <button
            @click="showTransferModal = false"
            :disabled="isTransferring"
            class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg border transition-all text-text-secondary hover:text-text-primary hover:border-border disabled:opacity-50"
            style="border-color: var(--border);"
          >
            Cancel
          </button>

          <button
            @click="handleConfirmTransfer"
            :disabled="isTransferring"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            style="background: #22c55e; color: white; box-shadow: 0 4px 14px color-mix(in srgb, #22c55e 30%, transparent);"
          >
            <svg
              v-if="isTransferring"
              class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"
            ><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
            {{ isTransferring ? 'Confirming…' : 'Confirm Users' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</Transition>
            </template>
          </div>
        </div>
      </template>

      <!-- ── Info banner ───────────────────────────────────────────────────── -->
      <div class="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3.5">
        <svg class="shrink-0 mt-0.5 text-blue-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p class="text-xs text-blue-400 leading-relaxed">
          Only verified domains can serve your workspace. Make sure all required DNS records are added at your
          domain registrar (e.g. GoDaddy, Namecheap, Cloudflare) before clicking
          <span class="font-semibold">Verify domain</span>.
        </p>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════
         DOMAIN VERIFICATION MODAL
    ═══════════════════════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showVerifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="closeVerifyModal"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="showVerifyModal"
            class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style="background: var(--bg-card); border: 1px solid var(--border);"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--border);">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style="background: color-mix(in srgb, var(--accent) 14%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 25%, transparent);"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Verify domain ownership</h3>
                  <p class="text-xs text-text-secondary">{{ verifyingDomain?.domain }}</p>
                </div>
              </div>
              <button
                @click="closeVerifyModal"
                class="p-1.5 rounded-lg text-text-secondary hover:bg-border/20 hover:text-text-primary transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Modal body -->
            <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
              <!-- Domain pill -->
              <div
                class="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                style="background: var(--bg-surface); border-color: var(--border);"
              >
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="text-sm font-semibold text-text-primary">{{ verifyingDomain?.domain }}</span>
                <span
                  class="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  :style="modalDomainStatusStyle"
                >{{ modalDomainStatusLabel }}</span>
              </div>

              <!-- Verified banner -->
              <div
                v-if="modalCurrentDomain?.status === 'verified'"
                class="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style="background: color-mix(in srgb, #1d9e75 8%, transparent); border-color: color-mix(in srgb, #1d9e75 25%, transparent);"
              >
                <span
                  class="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                  style="background: #1d9e75;"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div>
                  <p class="text-sm font-semibold" style="color: #1d9e75;">Domain verified successfully!</p>
                  <p class="text-xs text-text-secondary">Your domain ownership has been confirmed.</p>
                </div>
              </div>

              <!-- Method switched notice -->
              <div
                v-if="modalMethodSwitched"
                class="flex items-start gap-3 rounded-lg px-4 py-3 border"
                style="background: color-mix(in srgb, #f59e0b 8%, transparent); border-color: color-mix(in srgb, #f59e0b 30%, transparent);"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #f59e0b;">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <p class="text-xs leading-relaxed" style="color: #f59e0b;">
                  Apex domain detected — CNAME is not supported on root domains. We've automatically switched to
                  <strong>TXT verification</strong>.
                </p>
              </div>

              <!-- Verification method tabs -->
              <div v-if="modalCurrentDomain?.status !== 'verified'" class="space-y-2">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Verification method</p>
                <div
                  class="grid grid-cols-3 gap-2 p-1 rounded-xl"
                  style="background: var(--bg-surface); border: 1px solid var(--border);"
                >
                  <button
                    v-for="m in verificationMethods"
                    :key="m.value"
                    type="button"
                    class="py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 text-center"
                    :style="{
                      background: modalSelectedMethod === m.value ? 'var(--bg-card)' : 'transparent',
                      color: modalSelectedMethod === m.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: modalSelectedMethod === m.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }"
                    @click="switchModalMethod(m.value)"
                    :disabled="modalIsSwitchingMethod || isModalVerifying"
                  >{{ m.label }}</button>
                </div>
              </div>

              <!-- Instructions panel -->
              <div v-if="modalInstructions && modalCurrentDomain?.status !== 'verified'" class="space-y-3">
                <template v-if="modalInstructions.method === 'cname' || modalInstructions.method === 'txt'">
                  <p class="text-xs leading-relaxed text-text-secondary">
                    Add the following DNS record at your DNS host (GoDaddy, Cloudflare, Namecheap, etc.)
                  </p>
                  <div class="rounded-xl overflow-hidden border" style="border-color: var(--border);">
                    <div
                      class="grid grid-cols-2 divide-x"
                      style="background: var(--bg-surface); border-bottom: 1px solid var(--border); divide-color: var(--border);"
                    >
                      <div class="px-4 py-2.5">
                        <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-text-secondary">Type</p>
                        <p class="text-sm font-bold text-text-primary">{{ modalInstructions.record_type }}</p>
                      </div>
                      <div class="px-4 py-2.5">
                        <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-text-secondary">TTL</p>
                        <p class="text-sm font-bold text-text-primary">{{ modalInstructions.ttl_recommended }}s</p>
                      </div>
                    </div>
                    <div class="divide-y" style="divide-color: var(--border);">
                      <div class="px-4 py-3 flex items-center justify-between gap-3">
                        <div class="min-w-0 flex-1">
                          <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-text-secondary">Host / Name</p>
                          <p class="text-sm font-mono break-all text-text-primary">{{ modalInstructions.record_host }}</p>
                        </div>
                        <button type="button" @click="modalCopy(modalInstructions.record_host, 'host')" class="shrink-0 p-1.5 rounded-lg transition-all hover:scale-110 text-text-secondary">
                          <svg v-if="modalCopiedField !== 'host'" class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                            <path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                          </svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;">
                            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      <div class="px-4 py-3 flex items-center justify-between gap-3">
                        <div class="min-w-0 flex-1">
                          <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-text-secondary">Value / Points to</p>
                          <p class="text-sm font-mono break-all text-text-primary">{{ modalInstructions.record_value }}</p>
                        </div>
                        <button type="button" @click="modalCopy(modalInstructions.record_value, 'value')" class="shrink-0 p-1.5 rounded-lg transition-all hover:scale-110 text-text-secondary">
                          <svg v-if="modalCopiedField !== 'value'" class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                            <path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                          </svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;">
                            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs leading-relaxed px-1 text-text-secondary">{{ modalInstructions.note }}</p>
                </template>

                <template v-else-if="modalInstructions.method === 'http'">
                  <p class="text-xs leading-relaxed text-text-secondary">
                    Upload a verification file to your web server so it's reachable at the URL below.
                  </p>
                  <div class="rounded-xl overflow-hidden border divide-y" style="border-color: var(--border); divide-color: var(--border);">
                    <div class="px-4 py-3 flex items-center justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-text-secondary">File URL</p>
                        <p class="text-sm font-mono break-all text-text-primary">{{ modalInstructions.file_url }}</p>
                      </div>
                      <button type="button" @click="modalCopy(modalInstructions.file_url, 'file_url')" class="shrink-0 p-1.5 rounded-lg transition-all hover:scale-110 text-text-secondary">
                        <svg v-if="modalCopiedField !== 'file_url'" class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                          <path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                        </svg>
                        <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;">
                          <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <div class="px-4 py-3 flex items-center justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-text-secondary">File content</p>
                        <p class="text-sm font-mono break-all text-text-primary">{{ modalInstructions.file_content }}</p>
                      </div>
                      <button type="button" @click="modalCopy(modalInstructions.file_content, 'file_content')" class="shrink-0 p-1.5 rounded-lg transition-all hover:scale-110 text-text-secondary">
                        <svg v-if="modalCopiedField !== 'file_content'" class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                          <path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                        </svg>
                        <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;">
                          <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    :disabled="isDownloadingFile"
                    class="w-full flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-sm font-semibold border transition-all duration-200 hover:shadow-sm"
                    style="border-color: var(--border); background: var(--bg-surface); color: var(--text-primary);"
                    @click="downloadVerificationFile"
                  >
                    <span v-if="isDownloadingFile" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                    <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: var(--accent);">
                      <path d="M8 2v8M5 7l3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Download streamed-verify.txt</span>
                  </button>
                  <p class="text-xs leading-relaxed px-1 text-text-secondary">{{ modalInstructions.note }}</p>
                </template>
              </div>

              <!-- Last check error -->
              <div
                v-if="modalCurrentDomain?.last_check_result?.error && modalCurrentDomain?.status !== 'verified'"
                class="flex items-start gap-3 rounded-lg px-4 py-3 border"
                style="background: color-mix(in srgb, #e55050 6%, transparent); border-color: color-mix(in srgb, #e55050 25%, transparent);"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #e55050;">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <div>
                  <p class="text-xs font-semibold mb-0.5" style="color: #e55050;">Verification check failed</p>
                  <p class="text-xs text-text-secondary">{{ modalCurrentDomain.last_check_result.error }}</p>
                  <p v-if="modalCurrentDomain.last_check_result.observed?.length" class="text-xs mt-1 text-text-secondary">
                    Observed:
                    <span class="font-mono font-medium text-text-primary">
                      {{ Array.isArray(modalCurrentDomain.last_check_result.observed)
                        ? modalCurrentDomain.last_check_result.observed.join(', ')
                        : modalCurrentDomain.last_check_result.observed }}
                    </span>
                  </p>
                </div>
              </div>

              <!-- Rate limit countdown -->
              <div
                v-if="modalRetryCountdown > 0 && modalCurrentDomain?.status !== 'verified'"
                class="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style="background: var(--bg-surface); border-color: var(--border);"
              >
                <svg class="w-4 h-4 shrink-0 text-text-secondary" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                <p class="text-xs text-text-secondary">
                  Please wait <span class="font-bold tabular-nums text-text-primary">{{ modalRetryCountdown }}s</span> before checking again.
                </p>
                <div class="ml-auto flex-1 max-w-20 h-1 rounded-full overflow-hidden" style="background: var(--border);">
                  <div
                    class="h-full rounded-full transition-all duration-1000"
                    style="background: var(--accent);"
                    :style="{ width: `${(modalRetryCountdown / modalRetryTotal) * 100}%` }"
                  />
                </div>
              </div>

              <p v-if="modalError" class="text-xs text-center" style="color: #e55050;">{{ modalError }}</p>
            </div>

            <!-- Modal footer -->
            <div class="px-6 py-4 border-t space-y-2.5" style="border-color: var(--border);">
              <template v-if="modalCurrentDomain?.status !== 'verified'">
                <button
                  type="button"
                  :disabled="isModalVerifying || modalRetryCountdown > 0 || modalIsSwitchingMethod"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-[9px] text-sm font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                  style="background: var(--accent); color: var(--accent-text); box-shadow: 0 2px 0 rgba(0,0,0,0.12);"
                  @click="modalRecheck"
                >
                  <span v-if="isModalVerifying || modalIsSwitchingMethod" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 8A5.5 5.5 0 112.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    <path d="M2.5 2v3.5H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{{ isModalVerifying ? 'Checking…' : modalIsSwitchingMethod ? 'Switching method…' : "I've added the record — verify now" }}</span>
                </button>
                <button
                  type="button"
                  class="w-full py-2.5 rounded-[9px] text-sm font-medium border transition-all duration-200 text-text-secondary hover:text-text-primary hover:border-border"
                  style="border-color: var(--border); background: transparent;"
                  @click="closeVerifyModal"
                >Close</button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="w-full py-3 rounded-[9px] text-sm font-bold tracking-wide transition-all duration-200"
                  style="background: var(--accent); color: var(--accent-text);"
                  @click="closeVerifyModal"
                >Done</button>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ════════════════════════════════════════════════════════
         EDIT DOMAIN MODAL
    ═══════════════════════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="closeEditModal"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="showEditModal"
            class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style="background: var(--bg-card); border: 1px solid var(--border);"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--border);">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style="background: color-mix(in srgb, var(--accent) 14%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 25%, transparent);"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color: var(--accent);">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Edit domain</h3>
                  <p class="text-xs text-text-secondary">Update the domain name for this connection.</p>
                </div>
              </div>
              <button
                @click="closeEditModal"
                class="p-1.5 rounded-lg text-text-secondary hover:bg-border/20 hover:text-text-primary transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 space-y-4">
              <!-- Current domain pill -->
              <div
                class="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                style="background: var(--bg-surface); border-color: var(--border);"
              >
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color: var(--text-secondary);">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-text-secondary mb-0.5">Current domain</p>
                  <p class="text-sm font-mono font-semibold text-text-primary truncate">{{ editingDomain?.domain }}</p>
                </div>
                <span
                  class="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  :class="statusBadgeClass(editingDomain?.status ?? 'pending')"
                >
                  <span :class="statusDotClass(editingDomain?.status ?? 'pending')"></span>
                  {{ statusLabel(editingDomain?.status ?? 'pending') }}
                </span>
              </div>

              <!-- New domain input -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  New domain name <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="editDomainValue"
                  type="text"
                  placeholder="yournewdomain.com"
                  :disabled="isEditSaving"
                  @keyup.enter="saveEditDomain"
                  class="w-full px-3.5 py-2.5 text-sm text-text-primary bg-border/10 border border-border/40 rounded-lg outline-none focus:border-accent/50 focus:bg-accent/5 transition-all placeholder:text-text-secondary/40 disabled:opacity-50"
                />
                <p v-if="editDomainError" class="text-xs text-red-400 flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {{ editDomainError }}
                </p>
              </div>

              <!-- Warning notice -->
              <div
                class="flex items-start gap-3 rounded-lg px-3.5 py-3 border"
                style="background: color-mix(in srgb, #f59e0b 6%, transparent); border-color: color-mix(in srgb, #f59e0b 25%, transparent);"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #d97706;">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <p class="text-xs leading-relaxed" style="color: #d97706;">
                  Changing your domain will reset its verification status. You'll need to re-verify DNS ownership after saving.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t flex items-center gap-3" style="border-color: var(--border);">
              <button
                type="button"
                @click="closeEditModal"
                class="flex-1 py-2.5 rounded-[9px] text-sm font-medium border transition-all text-text-secondary hover:text-text-primary"
                style="border-color: var(--border);"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="saveEditDomain"
                :disabled="isEditSaving || !editDomainValue.trim() || editDomainValue.trim() === editingDomain?.domain"
                class="flex-1 py-2.5 rounded-[9px] text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style="background: var(--accent); color: white;"
              >
                <svg
                  v-if="isEditSaving"
                  class="animate-spin"
                  width="12" height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {{ isEditSaving ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ════════════════════════════════════════════════════════
         CREATE USER MODAL (for domain users)
    ═══════════════════════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCreateUserModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="closeCreateUserModal"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="showCreateUserModal"
            class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style="background: var(--bg-card); border: 1px solid var(--border);"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--border);">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style="background: color-mix(in srgb, var(--accent) 14%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 25%, transparent);"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color: var(--accent);">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Create domain user</h3>
                  <p class="text-xs text-text-secondary">This user will be associated with your verified domain.</p>
                </div>
              </div>
              <button
                @click="closeCreateUserModal"
                class="p-1.5 rounded-lg text-text-secondary hover:bg-border/20 hover:text-text-primary transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Full name <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="createUserForm.u_full_name"
                  type="text"
                  placeholder="John Doe"
                  class="w-full px-3.5 py-2.5 text-sm bg-border/10 border border-border/40 rounded-lg outline-none focus:border-accent/50 focus:bg-accent/5 transition-all text-text-primary placeholder:text-text-secondary/40"
                />
                <p v-if="createUserErrors.u_full_name" class="text-xs text-red-400">{{ createUserErrors.u_full_name }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Email <span class="text-red-400">*</span>
                </label>
                <div class="flex items-center border border-border/40 rounded-lg overflow-hidden focus-within:border-accent/50 focus-within:bg-accent/5 transition-all bg-border/10">
                  <input
                    v-model="createUserForm.emailPrefix"
                    type="text"
                    placeholder="username"
                    class="flex-1 px-3.5 py-2.5 text-sm bg-transparent outline-none text-text-primary placeholder:text-text-secondary/40"
                  />
                  <span class="px-3 py-2.5 text-sm text-text-secondary bg-border/20 border-l border-border/30 shrink-0">
                    @{{ domainForCreateUser }}
                  </span>
                </div>
                <p v-if="createUserErrors.emailPrefix" class="text-xs text-red-400">{{ createUserErrors.emailPrefix }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Password <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="createUserForm.u_password"
                    :type="showCreatePassword ? 'text' : 'password'"
                    placeholder="Min. 6 characters"
                    class="w-full pl-3.5 pr-10 py-2.5 text-sm bg-border/10 border border-border/40 rounded-lg outline-none focus:border-accent/50 focus:bg-accent/5 transition-all text-text-primary placeholder:text-text-secondary/40"
                  />
                  <button
                    type="button"
                    @click="showCreatePassword = !showCreatePassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-all"
                  >
                    <svg v-if="showCreatePassword" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
                <p v-if="createUserErrors.u_password" class="text-xs text-red-400">{{ createUserErrors.u_password }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Job title <span class="text-text-secondary/40 font-normal normal-case">(optional)</span>
                </label>
                <input
                  v-model="createUserForm.u_job_title"
                  type="text"
                  placeholder="e.g. Product Manager"
                  class="w-full px-3.5 py-2.5 text-sm bg-border/10 border border-border/40 rounded-lg outline-none focus:border-accent/50 focus:bg-accent/5 transition-all text-text-primary placeholder:text-text-secondary/40"
                />
              </div>

              <p v-if="createUserServerError" class="text-xs text-red-400 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ createUserServerError }}
              </p>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t flex items-center gap-3" style="border-color: var(--border);">
              <button
                type="button"
                @click="closeCreateUserModal"
                class="flex-1 py-2.5 rounded-[9px] text-sm font-medium border transition-all text-text-secondary hover:text-text-primary"
                style="border-color: var(--border);"
              >Cancel</button>
              <button
                type="button"
                @click="submitCreateUser"
                :disabled="isCreatingUser || !isCreateUserFormValid"
                class="flex-1 py-2.5 rounded-[9px] text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style="background: var(--accent); color: white;"
              >
                <svg v-if="isCreatingUser" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {{ isCreatingUser ? 'Creating…' : 'Create user' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import {
  useListDomains,
  useVerifyDomain,
  useSetPrimaryDomain,
  type CompanyDomain,
  type DnsInstructions,
} from '../../../queries/useCommon'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useCreateCompanyUser } from '../../../queries/useCompanyUsers'

// ── Props & Permissions ───────────────────────────────────────────────────────
const props = defineProps<{ profile?: any }>()

const activeCompany   = computed(() => props.profile?.active_company)
const membershipRole  = computed(() => activeCompany.value?.membership_role || null)
const permissions     = computed<string[]>(() => activeCompany.value?.permissions || [])

function can(permission: string): boolean { return permissions.value.includes(permission) }

const isOwner             = computed(() => membershipRole.value === 'owner')
const canManageDomain     = computed(() => isOwner.value || can('domain.manage') || can('company_domain.manage'))
const canAddDomain        = computed(() => canManageDomain.value || can('company_domain.create'))
const canVerifyDomain     = computed(() => canManageDomain.value || can('company_domain.verify'))
const canSetPrimaryDomain = computed(() => canManageDomain.value || can('company_domain.set_primary'))

// ── Queries ───────────────────────────────────────────────────────────────────
const workspaceStore = useWorkspaceStore()

const { data: domainsData, isLoading, isError: fetchError, refetch } = useListDomains()
const { mutateAsync: verifyDomainMutation } = useVerifyDomain()
const { mutateAsync: setPrimaryMutation, isPending: isSettingPrimary } = useSetPrimaryDomain()
const { mutateAsync: createUserMutation } = useCreateCompanyUser()

const domains  = computed<CompanyDomain[]>(() => domainsData.value?.domains ?? [])
const hasDomain = computed(() => domains.value.length > 0)

// ── Add domain modal ──────────────────────────────────────────────────────────
const showAddModal = ref(false)
const newDomain    = ref('')
const addError     = ref('')
const isAdding     = ref(false)

function openAddModal() { showAddModal.value = true; addError.value = ''; newDomain.value = '' }
function closeAddModal() { showAddModal.value = false; addError.value = ''; newDomain.value = '' }

async function addDomain() {
  if (!canAddDomain.value) return
  const raw = newDomain.value.trim().toLowerCase()
  if (!raw) return
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  if (!domainRegex.test(raw)) { addError.value = 'Please enter a valid domain (e.g. yourdomain.com)'; return }
  if (domains.value.some((d) => d.domain === raw)) { addError.value = 'This domain is already connected.'; return }
  try {
    isAdding.value = true
    addError.value = ''
    const result = await verifyDomainMutation({ domain: raw, verification_method: 'cname' })
    closeAddModal()
    if (result?.domain) openVerifyModalDirect(result.domain, result.instructions ?? null)
  } catch (err: any) {
    addError.value = err?.response?.data?.message ?? 'Failed to connect domain. Please try again.'
  } finally {
    isAdding.value = false
  }
}

// ── Set primary ───────────────────────────────────────────────────────────────
async function setPrimary(id: string) {
  if (!canSetPrimaryDomain.value) return
  try { await setPrimaryMutation(id) } catch {}
}

// ── DNS helpers ───────────────────────────────────────────────────────────────
function getRecordHost(instructions: DnsInstructions): string {
  return instructions.method === 'http' ? instructions.file_url : instructions.record_host
}
function getRecordValue(instructions: DnsInstructions): string {
  return instructions.method === 'http' ? instructions.file_content : instructions.record_value
}
async function copy(text: string) {
  try { await navigator.clipboard.writeText(text) } catch {}
}

// ── Edit domain modal ─────────────────────────────────────────────────────────
const showEditModal   = ref(false)
const editingDomain   = ref<CompanyDomain | null>(null)
const editDomainValue = ref('')
const editDomainError = ref('')
const isEditSaving    = ref(false)

function openEditModal(domain: CompanyDomain) {
  editingDomain.value   = domain
  editDomainValue.value = domain.domain
  editDomainError.value = ''
  showEditModal.value   = true
}

function closeEditModal() {
  showEditModal.value   = false
  editDomainError.value = ''
  setTimeout(() => { editingDomain.value = null }, 200)
}

async function saveEditDomain() {
  if (!editingDomain.value) return
  const raw = editDomainValue.value.trim().toLowerCase()
  if (!raw) return
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  if (!domainRegex.test(raw)) {
    editDomainError.value = 'Please enter a valid domain (e.g. yourdomain.com)'
    return
  }
  if (raw === editingDomain.value.domain) {
    editDomainError.value = 'This is already the current domain.'
    return
  }
  try {
    isEditSaving.value    = true
    editDomainError.value = ''
    // Replace with your actual update mutation/API call (e.g. useUpdateDomain)
    await verifyDomainMutation({ domain: raw, verification_method: 'cname' })
    toast.success('Domain updated. Please re-verify DNS ownership.')
    closeEditModal()
    await refetch()
  } catch (err: any) {
    editDomainError.value = err?.response?.data?.message ?? 'Failed to update domain. Please try again.'
  } finally {
    isEditSaving.value = false
  }
}

// ── Domain users state ────────────────────────────────────────────────────────
const domainUsersMap     = ref<Record<string, any[]>>({})
const domainUsersLoaded  = ref<Set<string>>(new Set())
const loadingDomainUsers = ref<string | null>(null)

function domainUsersForDomain(domainId: string): any[] {
  return domainUsersMap.value[domainId] ?? []
}


async function loadDomainUsers(domainId: string) {
  loadingDomainUsers.value = domainId
  try {
    const companyId = localStorage.getItem('company_id') ?? ''
    const users = await workspaceStore.listDomainUsers(companyId)
    domainUsersMap.value = { ...domainUsersMap.value, [domainId]: users }
    domainUsersLoaded.value = new Set([...domainUsersLoaded.value, domainId])
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load domain users.')
  } finally {
    loadingDomainUsers.value = null
  }
}

// ── Create user modal ─────────────────────────────────────────────────────────
const showCreateUserModal   = ref(false)
const createUserDomainId    = ref<string | null>(null)
const domainForCreateUser   = ref('')
const showCreatePassword    = ref(false)
const isCreatingUser        = ref(false)
const createUserServerError = ref('')

const createUserForm   = ref({ u_full_name: '', emailPrefix: '', u_password: '', u_job_title: '' })
const createUserErrors = ref({ u_full_name: '', emailPrefix: '', u_password: '' })

const isCreateUserFormValid = computed(() =>
  !!createUserForm.value.u_full_name.trim() &&
  !!createUserForm.value.emailPrefix.trim() &&
  createUserForm.value.u_password.length >= 6 &&
  !createUserErrors.value.u_full_name &&
  !createUserErrors.value.emailPrefix &&
  !createUserErrors.value.u_password
)

function openCreateUserModal(domainId: string) {
  createUserDomainId.value = domainId
  const domain = domains.value.find((d) => d._id === domainId)
  domainForCreateUser.value = domain?.domain ?? ''
  createUserForm.value   = { u_full_name: '', emailPrefix: '', u_password: '', u_job_title: '' }
  createUserErrors.value = { u_full_name: '', emailPrefix: '', u_password: '' }
  createUserServerError.value = ''
  showCreatePassword.value    = false
  showCreateUserModal.value   = true
}

function closeCreateUserModal() {
  showCreateUserModal.value = false
  createUserDomainId.value  = null
}

async function submitCreateUser() {
  createUserErrors.value = { u_full_name: '', emailPrefix: '', u_password: '' }
  let valid = true
  if (!createUserForm.value.u_full_name.trim()) { createUserErrors.value.u_full_name = 'Full name is required'; valid = false }
  if (!createUserForm.value.emailPrefix.trim()) { createUserErrors.value.emailPrefix  = 'Email prefix is required'; valid = false }
  if (createUserForm.value.u_password.length < 6) { createUserErrors.value.u_password = 'Password must be at least 6 characters'; valid = false }
  if (!valid) return
  isCreatingUser.value        = true
  createUserServerError.value = ''
  try {
    const companyId = localStorage.getItem('company_id') ?? ''
    const payload = {
      u_full_name: createUserForm.value.u_full_name.trim(),
      u_email:     `${createUserForm.value.emailPrefix.trim()}@${domainForCreateUser.value}`,
      u_password:  createUserForm.value.u_password,
      u_job_title: createUserForm.value.u_job_title,
      company_id:  companyId,
      role: 'viewer',
    }
    await createUserMutation(payload)
    toast.success('User created successfully.')
    closeCreateUserModal()
    if (createUserDomainId.value) await loadDomainUsers(createUserDomainId.value)
  } catch (err: any) {
    createUserServerError.value = err?.response?.data?.message ?? 'Failed to create user.'
  } finally {
    isCreatingUser.value = false
  }
}

// ── Verification modal state ──────────────────────────────────────────────────
const showVerifyModal        = ref(false)
const verifyingDomain        = ref<CompanyDomain | null>(null)
const modalCurrentDomain     = ref<CompanyDomain | null>(null)
const modalInstructions      = ref<DnsInstructions | null>(null)
const modalSelectedMethod    = ref<'cname' | 'txt' | 'http'>('cname')
const modalMethodSwitched    = ref(false)
const isModalVerifying       = ref(false)
const modalIsSwitchingMethod = ref(false)
const isDownloadingFile      = ref(false)
const modalError             = ref<string | null>(null)
const modalCopiedField       = ref<string | null>(null)
const modalRetryCountdown    = ref(0)
const modalRetryTotal        = ref(30)
let modalCountdownTimer: ReturnType<typeof setInterval> | null = null

const verificationMethods: { value: 'cname' | 'txt' | 'http'; label: string }[] = [
  { value: 'cname', label: 'CNAME' },
  { value: 'txt',   label: 'TXT'   },
  { value: 'http',  label: 'HTTP File' },
]

const modalDomainStatusLabel = computed((): string => {
  const s = modalCurrentDomain.value?.status ?? verifyingDomain.value?.status
  const labels: Record<string, string> = { verified: 'Verified', verifying: 'Verifying', pending: 'Pending', failed: 'Failed', disabled: 'Disabled' }
  return s ? (labels[s] ?? 'Pending') : 'Pending'
})

const modalDomainStatusStyle = computed((): Record<string, string> => {
  const s = modalCurrentDomain.value?.status ?? verifyingDomain.value?.status
  if (s === 'verified') return { background: 'color-mix(in srgb, #1d9e75 12%, transparent)', color: '#1d9e75' }
  if (s === 'failed')   return { background: 'color-mix(in srgb, #e55050 12%, transparent)', color: '#e55050' }
  if (s === 'disabled') return { background: 'color-mix(in srgb, #6b7280 12%, transparent)', color: '#6b7280' }
  return { background: 'color-mix(in srgb, #f59e0b 12%, transparent)', color: '#f59e0b' }
})

async function openVerifyModal(domain: CompanyDomain) {
  if (!canVerifyDomain.value) return
  verifyingDomain.value     = domain
  modalCurrentDomain.value  = domain
  modalInstructions.value   = domain.instructions ?? null
  modalSelectedMethod.value = domain.verification_method ?? 'cname'
  modalMethodSwitched.value = false
  modalError.value          = null
  showVerifyModal.value     = true
  if (!modalInstructions.value || domain.status !== 'verified') {
    await callVerifyApi(domain.domain, modalSelectedMethod.value)
  }
}

function openVerifyModalDirect(domain: CompanyDomain, instructions: DnsInstructions | null) {
  verifyingDomain.value     = domain
  modalCurrentDomain.value  = domain
  modalInstructions.value   = instructions
  modalSelectedMethod.value = domain.verification_method ?? 'cname'
  modalMethodSwitched.value = false
  modalError.value          = null
  showVerifyModal.value     = true
}

function closeVerifyModal() {
  showVerifyModal.value = false
  stopModalCountdown()
  refetch()
  setTimeout(() => {
    verifyingDomain.value     = null
    modalCurrentDomain.value  = null
    modalInstructions.value   = null
    modalError.value          = null
    modalMethodSwitched.value = false
    modalCopiedField.value    = null
  }, 200)
}

async function callVerifyApi(domain: string, method: 'cname' | 'txt' | 'http') {
  isModalVerifying.value = true
  modalError.value       = null
  try {
    const result = await workspaceStore.verifyDomain(domain, method)
    modalCurrentDomain.value  = result.domain
    modalInstructions.value   = result.instructions
    modalSelectedMethod.value = result.domain.verification_method ?? method
    modalMethodSwitched.value = !!result.methodSwitched || result.domain.verification_method !== method
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to start verification.'
    modalError.value = err?.response?.status === 409
      ? 'This domain is already claimed by another workspace.'
      : msg
  } finally {
    isModalVerifying.value = false
  }
}

async function modalRecheck() {
  if (!modalCurrentDomain.value || isModalVerifying.value || modalRetryCountdown.value > 0) return
  isModalVerifying.value = true
  modalError.value       = null
  try {
    const { data, retryAfter } = await workspaceStore.recheckDomain(modalCurrentDomain.value._id)
    if (retryAfter !== null) { startModalCountdown(retryAfter); return }
    if (data) { modalCurrentDomain.value = data.domain; modalInstructions.value = data.instructions }
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Verification check failed.'
    modalError.value = err?.response?.status === 400 && msg.toLowerCase().includes('disabled')
      ? 'This domain has been disabled. Please contact support.'
      : msg
  } finally {
    isModalVerifying.value = false
  }
}

async function switchModalMethod(method: 'cname' | 'txt' | 'http') {
  if (!verifyingDomain.value || modalIsSwitchingMethod.value || method === modalSelectedMethod.value) return
  modalSelectedMethod.value    = method
  modalIsSwitchingMethod.value = true
  modalError.value             = null
  try {
    await callVerifyApi(verifyingDomain.value.domain, method)
    modalMethodSwitched.value = false
  } finally {
    modalIsSwitchingMethod.value = false
  }
}

async function downloadVerificationFile() {
  if (!modalCurrentDomain.value || isDownloadingFile.value) return
  isDownloadingFile.value = true
  try {
    await workspaceStore.downloadVerificationFile(modalCurrentDomain.value._id)
  } catch (err: any) {
    modalError.value = err?.response?.data?.message ?? 'Failed to download verification file.'
  } finally {
    isDownloadingFile.value = false
  }
}

function modalCopy(text: string, field: string) {
  navigator.clipboard.writeText(text).then(() => {
    modalCopiedField.value = field
    setTimeout(() => { modalCopiedField.value = null }, 2000)
  })
}

function startModalCountdown(seconds: number) {
  stopModalCountdown()
  modalRetryTotal.value     = seconds
  modalRetryCountdown.value = seconds
  modalCountdownTimer = setInterval(() => {
    modalRetryCountdown.value--
    if (modalRetryCountdown.value <= 0) stopModalCountdown()
  }, 1000)
}

function stopModalCountdown() {
  if (modalCountdownTimer) { clearInterval(modalCountdownTimer); modalCountdownTimer = null }
  modalRetryCountdown.value = 0
}

onUnmounted(() => { stopModalCountdown() })

// ── Formatting helpers ────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function sslStatusLabel(ssl: CompanyDomain['ssl_status']): string {
  const labels: Record<CompanyDomain['ssl_status'], string> = {
    none: 'not provisioned', provisioning: 'provisioning…', active: 'certificate active', error: 'error',
  }
  return labels[ssl]
}

function statusLabel(status: CompanyDomain['status']): string {
  return { pending: 'Pending', verifying: 'Verifying', verified: 'Verified', failed: 'Failed', disabled: 'Disabled' }[status] ?? status
}

function statusBadgeClass(status: CompanyDomain['status']): string {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold'
  return {
    verified:  `${base} bg-emerald-500/10 text-emerald-400`,
    pending:   `${base} bg-amber-500/10 text-amber-400`,
    verifying: `${base} bg-blue-500/10 text-blue-400`,
    failed:    `${base} bg-red-500/10 text-red-400`,
    disabled:  `${base} bg-border/20 text-text-secondary`,
  }[status] ?? `${base} bg-border/20 text-text-secondary`
}

function statusDotClass(status: CompanyDomain['status']): string {
  const base = 'w-1.5 h-1.5 rounded-full'
  return {
    verified:  `${base} bg-emerald-400`,
    pending:   `${base} bg-amber-400 animate-pulse`,
    verifying: `${base} bg-blue-400 animate-pulse`,
    failed:    `${base} bg-red-400`,
    disabled:  `${base} bg-text-secondary/40`,
  }[status] ?? `${base} bg-text-secondary/40`
}

function pendingBannerStyle(status: CompanyDomain['status']): Record<string, string> {
  if (status === 'failed') return {
    background:   'color-mix(in srgb, #e55050 6%, transparent)',
    borderColor:  'color-mix(in srgb, #e55050 25%, transparent)',
  }
  return {
    background:  'color-mix(in srgb, #f59e0b 6%, transparent)',
    borderColor: 'color-mix(in srgb, #f59e0b 25%, transparent)',
  }
}

function pendingIconStyle(status: CompanyDomain['status']): Record<string, string> {
  if (status === 'failed') return { color: '#e55050' }
  return { color: '#f59e0b' }
}
// domain users
// ─── ADD THESE to your existing <script setup> ───────────────────────────────
// Place after the existing domainUsersMap / domainUsersLoaded / loadingDomainUsers refs

// Per-domain checkbox selection: { [domainId]: string[] }
const domainSelectedIds = ref<Record<string, string[]>>({})

// Transfer modal state
const showTransferModal   = ref(false)
const isTransferring      = ref(false)
const transferDomainId    = ref<string | null>(null)
const transferDomainName  = ref('')

// Derived list of full user objects for the currently open transfer modal
const transferSelectedUsers = computed(() => {
  if (!transferDomainId.value) return []
  const ids   = domainSelectedIds.value[transferDomainId.value] ?? []
  const users = domainUsersMap.value[transferDomainId.value] ?? []
  return users.filter((u: any) => ids.includes(u._id))
})

// Impact cards data (static)
const transferImpacts = [
  {
    label:       'Billing & Subscription',
    description: 'Adding users may increase your seat count and affect your current billing cycle.',
    color:  '#f59e0b',
    bg:     'color-mix(in srgb, #f59e0b 10%, transparent)',
    border: 'color-mix(in srgb, #f59e0b 25%, transparent)',
    paths:  ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
  },
  {
    label:       'User Counts & Seat Allocation',
    description: 'These users will occupy seats in your organisation\'s subscription plan.',
    color:  '#3b82f6',
    bg:     'color-mix(in srgb, #3b82f6 10%, transparent)',
    border: 'color-mix(in srgb, #3b82f6 25%, transparent)',
    paths:  ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  },
  {
    label:       'Roles, Permissions & Access',
    description: 'Transferred users receive default roles. Review and adjust permissions after confirming.',
    color:  '#a855f7',
    bg:     'color-mix(in srgb, #a855f7 10%, transparent)',
    border: 'color-mix(in srgb, #a855f7 25%, transparent)',
    paths:  ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  },
  {
    label:       'Organisation Settings & Controls',
    description: 'Admins will gain visibility and control over these users\' accounts and activity.',
    color:  '#6b7280',
    bg:     'color-mix(in srgb, #6b7280 10%, transparent)',
    border: 'color-mix(in srgb, #6b7280 25%, transparent)',
    paths:  [
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    ],
  },
]

// ── Checkbox helpers ──────────────────────────────────────────────────────────
function toggleDomainUser(domainId: string, userId: string) {
  const current = domainSelectedIds.value[domainId] ?? []
  const idx = current.indexOf(userId)
  domainSelectedIds.value = {
    ...domainSelectedIds.value,
    [domainId]: idx === -1 ? [...current, userId] : current.filter((i) => i !== userId),
  }
}

function toggleDomainSelectAll(domainId: string) {
  const allIds  = (domainUsersMap.value[domainId] ?? []).map((u: any) => u._id)
  const current = domainSelectedIds.value[domainId] ?? []
  const allSel  = allIds.every((id) => current.includes(id))
  domainSelectedIds.value = {
    ...domainSelectedIds.value,
    [domainId]: allSel ? [] : allIds,
  }
}

function clearDomainSelection(domainId: string) {
  domainSelectedIds.value = { ...domainSelectedIds.value, [domainId]: [] }
}

function isDomainAllSelected(domainId: string): boolean {
  const allIds  = (domainUsersMap.value[domainId] ?? []).map((u: any) => u._id)
  const current = domainSelectedIds.value[domainId] ?? []
  return allIds.length > 0 && allIds.every((id) => current.includes(id))
}

function isDomainPartiallySelected(domainId: string): boolean {
  const allIds  = (domainUsersMap.value[domainId] ?? []).map((u: any) => u._id)
  const current = domainSelectedIds.value[domainId] ?? []
  return current.some((id) => allIds.includes(id)) && !isDomainAllSelected(domainId)
}

// ── Transfer modal ────────────────────────────────────────────────────────────
function openTransferModal(domainId: string, domainName: string) {
  if (!(domainSelectedIds.value[domainId] ?? []).length) return
  transferDomainId.value   = domainId
  transferDomainName.value = domainName
  showTransferModal.value  = true
}

async function handleConfirmTransfer() {
  if (!transferDomainId.value) return
  isTransferring.value = true
  try {
    const companyId = localStorage.getItem('company_id') ?? ''
    const ids = domainSelectedIds.value[transferDomainId.value] ?? []
    await workspaceStore.enrolDomainUsers(companyId, ids)
    toast.success(
      `${ids.length} user${ids.length !== 1 ? 's' : ''} successfully added to your organisation.`
    )
    clearDomainSelection(transferDomainId.value)
    showTransferModal.value = false
    await refetch()
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Transfer failed. Please try again.')
  } finally {
    isTransferring.value = false
  }
}
</script>

<style scoped>
.custom-scroll { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9999px; }

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-secondary);
  transition: all 0.15s;
}
.copy-btn:hover {
  background: var(--border);
  color: var(--text-primary);
}
</style>