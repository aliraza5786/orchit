<template>
  <div class="space-y-6">
    <!-- ── Skeleton Loading ────────────────────────────────────────────────── -->
    <template v-if="isLoading">
      <div class="space-y-6 animate-pulse">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-6 w-40 bg-border/40 rounded-lg"></div>
            <div class="h-4 w-64 bg-border/20 rounded-md"></div>
          </div>
          <div class="h-10 w-32 bg-border/40 rounded-lg"></div>
        </div>
        <div class="grid gap-4">
          <div v-for="i in 2" :key="i" class="h-24 w-full bg-border/20 rounded-xl"></div>
        </div>
      </div>
    </template>

    <!-- ── Error State ─────────────────────────────────────────────────────── -->
    <template v-else-if="fetchError">
      <div class="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-border/60 bg-border/5">
        <div class="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Failed to load domains</h3>
        <p class="text-sm text-text-secondary max-w-xs mb-6">There was an issue fetching your connection settings. Please try again.</p>
        <button
          @click="() => refetch()"
          class="px-6 py-2.5 rounded-xl bg-accent text-white font-bold transition-all hover:scale-105 active:scale-95"
        >Try again</button>
      </div>
    </template>

    <!-- ── Main Content ────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- ════════════════════════════════════════════════════════
           STEP 0: DOMAIN DASHBOARD (LIST)
      ═══════════════════════════════════════════════════════════ -->
      <div v-if="setupStep === 0" class="space-y-6">
        <!-- AFTER -->
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h2 class="text-xl font-black tracking-tight text-text-primary">Domain Management</h2>
    <p class="text-sm text-text-secondary">Configure and verify custom domains for your workspace.</p>
  </div>
  <button
    v-if="canAddDomain && domains.length"
    @click="initWizard(null)"
    class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 shrink-0"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Add Domain
  </button>
</div>

        <!-- AFTER -->
<div v-if="!domains.length" class="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-border/60 bg-border/5">
  <div class="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 rotate-3">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  </div>
  <h3 class="text-lg font-bold text-text-primary mb-2">No domains connected yet</h3>
  <p class="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
    Connect a custom domain to professionalize your workspace. You'll need access to your DNS provider.
  </p>
  <button
    v-if="canAddDomain"
    @click="initWizard(null)"
    class="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Add Custom Domain
  </button>
</div>

        <div v-else class="grid gap-4">
          <div
            v-for="domain in domains"
            :key="domain._id"
            class="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-accent/5"
            :style="{ background: 'var(--bg-card)', borderColor: 'var(--border)' }"
          >
            <!-- Domain Header -->
            <div class="p-5 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center gap-5">
                <!-- Icon & Info -->
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                    :style="{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.8">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <h4 class="text-base font-bold text-text-primary truncate">{{ domain.domain }}</h4>
                      <span v-if="domain.is_primary" class="shrink-0 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-black uppercase tracking-wider">Primary</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span :class="statusBadgeClass(domain.status)">
                        <span :class="statusDotClass(domain.status)"></span>
                        {{ statusLabel(domain.status) }}
                      </span>
                      <span class="text-[11px] font-medium text-text-secondary">Added {{ formatDate(domain.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    v-if="domain.status === 'verified' && !domain.is_primary && canSetPrimaryDomain"
                    @click="setPrimary(domain._id)"
                    :disabled="isSettingPrimary"
                    class="p-2.5 rounded-xl text-text-secondary hover:bg-accent/5 hover:text-accent transition-all disabled:opacity-30"
                    title="Set as primary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>

                  <button
                    v-if="canManageDomain"
                    @click="initWizard(domain)"
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-surface text-text-primary hover:border-accent/30 hover:bg-accent/5 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>

                  <button
                    v-if="domain.status !== 'verified' && canVerifyDomain"
                    @click="initWizard(domain)"
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-accent text-accent-text transition-all hover:brightness-110 shadow-lg shadow-accent/20"
                  >
                    Verify Setup
                  </button>
                </div>
              </div>

            </div>

            <!-- Domain Users Expansion -->
            <div class="border-t border-border/40">
              <button
                :disabled="domain.status !== 'verified'"
                @click="loadDomainUsers(domain._id)"
                class="w-full flex items-center justify-between px-6 py-3 text-xs font-bold text-text-secondary hover:text-text-primary transition-all bg-border/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-text-secondary"
              >
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>Domain Users</span>
                  <span v-if="domainUsersMap[domain._id]" class="ml-1 px-1.5 py-0.5 rounded-full bg-border text-[10px]">{{ domainUsersMap[domain._id].length }}</span>
                </div>
                <svg
                  class="transition-transform duration-300"
                  :class="{ 'rotate-180': domainUsersLoaded.has(domain._id) }"
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                ><path d="M6 9l6 6 6-6"/></svg>
              </button>

              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[1000px] opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="max-h-[1000px] opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div v-if="domainUsersLoaded.has(domain._id)" class="overflow-hidden">
                  <div class="p-4 sm:p-6 space-y-4">
                    <!-- User List Header -->
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <label class="flex items-center gap-2 cursor-pointer group/cb">
                          <div
                            class="w-4 h-4 rounded border flex items-center justify-center transition-all"
                            :class="[
                              isDomainAllSelected(domain._id) ? 'bg-accent border-accent' : 'border-border group-hover/cb:border-accent/50'
                            ]"
                            @click.stop="toggleDomainSelectAll(domain._id)"
                          >
                            <svg v-if="isDomainAllSelected(domain._id)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2 2 4-4" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div v-else-if="isDomainPartiallySelected(domain._id)" class="w-2 h-0.5 bg-accent rounded-full"></div>
                          </div>
                          <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Select All</span>
                        </label>
                        <button
                          v-if="(domainSelectedIds[domain._id] ?? []).length"
                          @click="openTransferModal(domain._id, domain.domain)"
                          class="px-3 py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110 shadow-lg shadow-green-500/20"
                        >
                          Enrol Selected ({{ domainSelectedIds[domain._id].length }})
                        </button>
                      </div>
                      <button
                        @click="openCreateUserModal(domain._id)"
                        class="text-[11px] font-black text-accent uppercase tracking-widest hover:underline"
                      >+ Create User</button>
                    </div>

                    <!-- User Items -->
                    <div class="grid gap-2">
                      <div
                        v-for="user in domainUsersMap[domain._id]"
                        :key="user._id"
                        class="flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-border/5 transition-all hover:bg-border/10 hover:border-border"
                      >
                        <div
                          class="w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all shrink-0"
                          :class="[
                            (domainSelectedIds[domain._id] ?? []).includes(user._id) ? 'bg-accent border-accent' : 'border-border'
                          ]"
                          @click="toggleDomainUser(domain._id, user._id)"
                        >
                          <svg v-if="(domainSelectedIds[domain._id] ?? []).includes(user._id)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>

                        <div class="w-8 h-8 rounded-full bg-border/20 flex items-center justify-center text-[10px] font-bold text-text-secondary uppercase">
                          {{ getInitials(user.u_full_name) }}
                        </div>

                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-bold text-text-primary truncate">{{ user.u_full_name }}</p>
                          <p class="text-[10px] text-text-secondary truncate">{{ user.u_email }}</p>
                        </div>

                        <span
                          class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                          :class="user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'"
                        >
                          {{ user.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </div>

                      <div v-if="!domainUsersMap[domain._id]?.length" class="py-10 text-center">
                        <p class="text-xs text-text-secondary italic">No users found for this domain.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Info banner -->
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
      </div>

      <!-- ════════════════════════════════════════════════════════
           DOMAIN WIZARD (STEPS 1-5)
      ═══════════════════════════════════════════════════════════ -->
      <div v-else class="max-w-2xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Wizard Header -->
        <div class="mb-8 flex items-center justify-between">
          <button
            @click="setupStep = 0"
            class="flex items-center gap-2 text-xs font-black text-text-secondary uppercase tracking-widest hover:text-text-primary transition-all group"
          >
            <svg class="transition-transform group-hover:-translate-x-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Dashboard
          </button>
          <div class="flex items-center gap-2">
            <div
              v-for="s in 5"
              :key="s"
              class="h-1.5 rounded-full transition-all duration-500"
              :class="[
                setupStep === s ? 'w-8 bg-accent' : setupStep > s ? 'w-4 bg-emerald-500' : 'w-4 bg-border'
              ]"
            ></div>
          </div>
        </div>

        <!-- ── Step 1: Domain Entry ─────────────────────────────────────────── -->
        <div v-if="setupStep === 1" class="space-y-6">
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-text-primary">Connect your domain</h2>
            <p class="text-sm text-text-secondary">Enter the domain name you want to connect to your workspace.</p>
          </div>
          <div class="bg-card border border-border p-8 rounded-3xl space-y-6 shadow-xl shadow-border/20">
            <div class="space-y-2">
              <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Domain Name</label>
              <div class="relative group">
                <input
                  v-model="newDomainInput"
                  type="text"
                  placeholder="domain.com"
                  class="w-full pl-5 pr-5 py-4 bg-surface border-2 border-border/40 rounded-2xl outline-none text-base font-bold text-text-primary transition-all focus:border-accent group-hover:border-border"
                />
              </div>
              <p v-if="addError" class="text-[11px] font-bold text-red-500 px-1">{{ addError }}</p>
            </div>
            <button
              @click="addDomain"
              :disabled="isAddingDomain || !newDomainInput.trim()"
              class="w-full py-4 rounded-2xl bg-accent text-white font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-accent/25"
            >
              <span v-if="isAddingDomain" class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ isAddingDomain ? 'Processing...' : 'Continue to DNS Setup' }}
            </button>
          </div>
        </div>

        <!-- ── Step 2: DNS Setup ────────────────────────────────────────────── -->
        <div v-else-if="setupStep === 2" class="space-y-6">
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-text-primary">Configure DNS Settings</h2>
            <p class="text-sm text-text-secondary">Add these records to your domain's DNS settings at your registrar.</p>
          </div>

          <div v-if="wizardInstructions" class="bg-card border border-border p-8 rounded-3xl space-y-6 shadow-xl shadow-border/20">
            <!-- Record Info -->
            <div class="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-surface border border-border">
              <div class="space-y-1">
                <p class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Record Type</p>
                <p class="text-sm font-black text-text-primary">{{ getRecordType(wizardInstructions) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Recommended TTL</p>
                <p class="text-sm font-black text-text-primary">{{ wizardInstructions.ttl_recommended ? wizardInstructions.ttl_recommended + 's' : 'N/A' }}</p>
              </div>
            </div>

            <!-- Host Field -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-1">
                <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest">Host / Name</label>
                <button @click="copy(getRecordHost(wizardInstructions))" class="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Copy</button>
              </div>
              <div class="p-4 bg-surface border border-border rounded-2xl font-mono text-sm break-all text-text-primary">
                {{ getRecordHost(wizardInstructions) }}
              </div>
            </div>

            <!-- Value Field -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-1">
                <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest">Value / Points to</label>
                <button @click="copy(getRecordValue(wizardInstructions))" class="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Copy</button>
              </div>
              <div class="p-4 bg-surface border border-border rounded-2xl font-mono text-sm break-all text-text-primary">
                {{ getRecordValue(wizardInstructions) }}
              </div>
            </div>

            <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <p class="text-[11px] text-amber-500 leading-relaxed font-medium">
                <strong>Note:</strong> DNS changes can take up to 24-48 hours to propagate globally, though they are usually ready in minutes.
              </p>
            </div>

            <button
              @click="setupStep = 3"
              class="w-full py-4 rounded-2xl bg-accent text-white font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-accent/25"
            >
              Verify Connection
            </button>
          </div>
        </div>

        <!-- ── Step 3: Verification ─────────────────────────────────────────── -->
        <div v-else-if="setupStep === 3" class="space-y-6">
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-text-primary">Verifying DNS...</h2>
            <p class="text-sm text-text-secondary">We're checking if your DNS records are correctly configured.</p>
          </div>

          <div class="bg-card border border-border p-12 rounded-3xl flex flex-col items-center text-center space-y-6 shadow-xl shadow-border/20">
            <div class="relative">
              <div class="w-24 h-24 rounded-full border-4 border-accent/10 border-t-accent animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>

            <div class="space-y-1">
              <h3 class="text-lg font-bold text-text-primary">{{ wizardDomain?.domain }}</h3>
              <p class="text-sm text-text-secondary">This usually takes about 30-60 seconds.</p>
            </div>

            <div v-if="wizardError" class="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl w-full max-w-xs">
              <p class="text-xs font-bold text-red-500">{{ wizardError }}</p>
            </div>

            <div v-if="modalRetryCountdown > 0" class="w-full max-w-xs space-y-2">
              <div class="flex items-center justify-between px-1">
                <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Rate limiting</span>
                <span class="text-[10px] font-black text-text-primary tabular-nums">{{ modalRetryCountdown }}s</span>
              </div>
              <div class="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  class="h-full bg-accent transition-all duration-1000"
                  :style="{ width: `${(modalRetryCountdown / modalRetryTotal) * 100}%` }"
                ></div>
              </div>
            </div>

            <button
              @click="runWizardVerification"
              :disabled="isModalVerifying || modalRetryCountdown > 0"
              class="px-8 py-3 rounded-xl border-2 border-border font-black text-sm text-text-primary hover:bg-border/40 transition-all disabled:opacity-50"
            >
              {{ isModalVerifying ? 'Checking...' : 'Check Again' }}
            </button>
          </div>
        </div>

        <!-- ── Step 4: Super Admin ─────────────────────────────────────────── -->
        <div v-else-if="setupStep === 4" class="space-y-6">
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-text-primary">Create Super Admin</h2>
            <p class="text-sm text-text-secondary">Every verified domain needs a designated Super Admin account.</p>
          </div>

          <div class="bg-card border border-border p-8 rounded-3xl space-y-6 shadow-xl shadow-border/20">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Full Name</label>
                <input
                  v-model="adminName"
                  type="text"
                  placeholder="John Doe"
                  class="w-full px-5 py-4 bg-surface border-2 border-border/40 rounded-2xl outline-none text-base font-bold text-text-primary transition-all focus:border-accent"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Job Title</label>
                <input
                  v-model="adminJobTitle"
                  type="text"
                  placeholder="e.g. CTO"
                  class="w-full px-5 py-4 bg-surface border-2 border-border/40 rounded-2xl outline-none text-base font-bold text-text-primary transition-all focus:border-accent"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Super Admin Email</label>
              <div class="flex items-center gap-0 border-2 border-border/40 rounded-2xl bg-surface focus-within:border-accent transition-all overflow-hidden">
                <input
                  v-model="emailPrefix"
                  type="text"
                  placeholder="admin"
                  class="flex-1 px-5 py-4 bg-transparent outline-none text-base font-bold text-text-primary"
                />
                <div class="px-5 py-4 bg-border/20 border-l border-border/40 text-text-secondary font-bold">
                  @{{ wizardDomain?.domain }}
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Password</label>
              <div class="relative">
                <input
                  v-model="adminPassword"
                  :type="showCreatePassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full px-5 py-4 bg-surface border-2 border-border/40 rounded-2xl outline-none text-base font-bold text-text-primary transition-all focus:border-accent"
                />
                <button @click="showCreatePassword = !showCreatePassword" class="absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                  <svg v-if="showCreatePassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <p v-if="createUserServerError" class="text-[11px] font-bold text-red-500 px-1">{{ createUserServerError }}</p>

            <button
              @click="submitWizardAdmin"
              :disabled="isCreatingUser || !isAdminFormValid"
              class="w-full py-4 rounded-2xl bg-accent text-white font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-accent/25"
            >
              {{ isCreatingUser ? 'Creating Account...' : 'Continue to Verification' }}
            </button>
          </div>
        </div>

        <!-- ── Step 5: OTP ─────────────────────────────────────────────────── -->
        <div v-else-if="setupStep === 5" class="space-y-6">
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-text-primary">Verify your account</h2>
            <p class="text-sm text-text-secondary">We've sent a 5-digit code to <strong>{{ emailPrefix }}@{{ wizardDomain?.domain }}</strong></p>
          </div>

          <div class="bg-card border border-border p-8 rounded-3xl space-y-8 shadow-xl shadow-border/20 text-center">
            <div class="flex justify-center gap-3">
              <input
                v-for="(idx) in 5"
                :key="idx"
                :ref="el => otpInputs[idx] = el"
                v-model="otpDigits[idx]"
                type="text"
                maxlength="1"
                class="w-14 h-16 bg-surface border-2 border-border/40 rounded-2xl text-center text-2xl font-black text-text-primary focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                @input="handleOtpInput($event, idx)"
                @keydown.delete="handleOtpDelete($event, idx)"
              />
            </div>

            <div class="space-y-4">
              <p v-if="otpError" class="text-sm font-bold text-red-500">{{ otpError }}</p>
              <button
                @click="verifyWizardOtp"
                :disabled="isVerifyingOtp || !isOtpComplete"
                class="w-full py-4 rounded-2xl bg-accent text-white font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-accent/25"
              >
                {{ isVerifyingOtp ? 'Verifying...' : 'Complete Setup' }}
              </button>
              <button
                @click="sendWizardOtp"
                :disabled="isSendingOtp"
                class="text-xs font-black text-accent uppercase tracking-widest hover:underline disabled:opacity-50"
              >
                {{ isSendingOtp ? 'Resending...' : 'Resend Code' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════
         TRANSFER CONFIRMATION MODAL
    ═══════════════════════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showTransferModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="showTransferModal = false"
      >
        <div
          class="w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300"
        >
          <!-- Header -->
          <div class="px-8 py-6 border-b border-border flex items-center justify-between bg-border/5">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-black text-text-primary">Enrol Domain Users</h3>
                <p class="text-sm text-text-secondary">Add {{ transferSelectedUsers.length }} users from <span class="font-bold text-text-primary">{{ transferDomainName }}</span></p>
              </div>
            </div>
            <button @click="showTransferModal = false" class="p-2 rounded-xl hover:bg-border/20 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="p-8 max-h-[60vh] overflow-y-auto custom-scroll space-y-8">
            <!-- User Avatars -->
            <div class="flex flex-wrap justify-center gap-2">
              <div
                v-for="user in transferSelectedUsers"
                :key="user._id"
                class="group relative"
                :title="user.u_full_name"
              >
                <div class="w-10 h-10 rounded-full border-2 border-border bg-border/10 flex items-center justify-center text-[10px] font-black uppercase text-text-secondary group-hover:border-accent group-hover:text-accent transition-all">
                  {{ getInitials(user.u_full_name) }}
                </div>
              </div>
            </div>

            <!-- Impact Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="impact in transferImpacts"
                :key="impact.label"
                class="p-4 rounded-2xl border"
                :style="{ background: impact.bg, borderColor: impact.border }"
              >
                <div class="flex items-center gap-3 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{ color: impact.color }">
                    <path v-for="p in impact.paths" :key="p" :d="p" />
                  </svg>
                  <p class="text-xs font-black uppercase tracking-wider" :style="{ color: impact.color }">{{ impact.label }}</p>
                </div>
                <p class="text-[11px] leading-relaxed text-text-secondary opacity-80">{{ impact.description }}</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
              <svg class="shrink-0 mt-0.5 text-blue-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p class="text-[11px] text-blue-500 leading-relaxed">
                Changes will be effective immediately. You can review and adjust user permissions in the <span class="font-bold">Team</span> tab after enrolment.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-8 py-6 border-t border-border flex flex-col sm:flex-row items-center gap-3 sm:justify-end bg-border/5">
            <button
              @click="showTransferModal = false"
              class="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-text-secondary hover:text-text-primary transition-all"
            >Cancel</button>
            <button
              @click="handleConfirmTransfer"
              :disabled="isTransferring"
              class="w-full sm:w-auto px-8 py-3 rounded-xl bg-green-500 text-white font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-green-500/20"
            >
              <span v-if="isTransferring" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Confirm Enrolment
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Create User Modal (Keep existing) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCreateUserModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="closeCreateUserModal"
      >
        <div class="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300">
          <div class="px-8 py-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 class="text-xl font-black text-text-primary">Create User</h3>
              <p class="text-sm text-text-secondary">Add a new user to @{{ domainForCreateUser }}</p>
            </div>
          </div>
          <div class="p-8 space-y-6">
            <div class="space-y-2">
              <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Full Name</label>
              <input v-model="createUserForm.u_full_name" type="text" placeholder="John Doe" class="w-full px-5 py-4 bg-surface border-2 border-border/40 rounded-2xl outline-none text-base font-bold text-text-primary transition-all focus:border-accent" />
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Email Prefix</label>
              <div class="flex items-center gap-0 border-2 border-border/40 rounded-2xl bg-surface focus-within:border-accent transition-all overflow-hidden">
                <input v-model="createUserForm.emailPrefix" type="text" placeholder="username" class="flex-1 px-5 py-4 bg-transparent outline-none text-base font-bold text-text-primary" />
                <div class="px-5 py-4 bg-border/20 border-l border-border/40 text-text-secondary font-bold">@{{ domainForCreateUser }}</div>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-black text-text-secondary uppercase tracking-widest px-1">Password</label>
              <input v-model="createUserForm.u_password" type="password" placeholder="••••••••" class="w-full px-5 py-4 bg-surface border-2 border-border/40 rounded-2xl outline-none text-base font-bold text-text-primary transition-all focus:border-accent" />
            </div>
            <p v-if="createUserServerError" class="text-xs font-bold text-red-500">{{ createUserServerError }}</p>
            <button
              @click="submitCreateUser"
              :disabled="isCreatingUser || !isCreateUserFormValid"
              class="w-full py-4 rounded-2xl bg-accent text-white font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {{ isCreatingUser ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { toast } from 'vue-sonner'
import {
  useListDomains,
  useVerifyDomain,
  useSetPrimaryDomain,
  type CompanyDomain,
  type DnsInstructions,
} from '../../../queries/useCommon'
import { useWorkspaceStore } from '../../../stores/workspace'
import { 
  useCreateCompanyUser, 
  useSendSuperAdminOtp, 
  useVerifySuperAdminOtp 
} from '../../../queries/useCompanyUsers'

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
const { mutateAsync: sendOtpMutation } = useSendSuperAdminOtp()
const { mutateAsync: verifyOtpMutation } = useVerifySuperAdminOtp()

const domains  = computed<CompanyDomain[]>(() => domainsData.value?.domains ?? [])

// ── Wizard State (0: Dashboard, 1: Add, 2: DNS, 3: Verify, 4: Admin, 5: OTP) ──
const setupStep          = ref(0)
const wizardDomain       = ref<CompanyDomain | null>(null)
const wizardInstructions = ref<DnsInstructions | null>(null)
const isModalVerifying    = ref(false)
const wizardError        = ref<string | null>(null)

// Step 1: Add Domain
const newDomainInput     = ref('')
const isAddingDomain     = ref(false)
const addError           = ref('')

// Step 4: Admin Registration
const adminName          = ref('')
const adminJobTitle      = ref('')
const emailPrefix        = ref('')
const adminPassword      = ref('')
const isCreatingUser     = ref(false)
const adminUserId        = ref('')
const showCreatePassword = ref(false)
const createUserServerError = ref('')

const isAdminFormValid = computed(() => 
  adminName.value.trim() && 
  emailPrefix.value.trim() && 
  adminPassword.value.length >= 6
)

// Step 5: OTP
const otpDigits      = ref(['', '', '', '', ''])
const otpInputs      = ref<any[]>([])
const isSendingOtp   = ref(false)
const isVerifyingOtp = ref(false)
const otpError       = ref('')

const isOtpComplete = computed(() => otpDigits.value.every(d => d !== ''))

// Timer state for Step 3
const modalRetryCountdown = ref(0)
const modalRetryTotal     = ref(60)
let modalCountdownTimer: ReturnType<typeof setInterval> | null = null

// ── Wizard Logic ─────────────────────────────────────────────────────────────
async function initWizard(domain: CompanyDomain | null = null) {
  wizardError.value = null
  addError.value = ''
  createUserServerError.value = ''
  otpError.value = ''
  
  if (!domain) {
    setupStep.value = 1
    newDomainInput.value = ''
    return
  }
  
  wizardDomain.value = domain
  if (domain.status === 'verified') {
    setupStep.value = 4
  } else {
    wizardInstructions.value = domain.instructions || null
    setupStep.value = 2
  }
}

function cancelWizard() {
  setupStep.value = 0
  wizardDomain.value = null
  wizardInstructions.value = null
  wizardError.value = null
  stopModalCountdown()
}

async function addDomain() {
  const raw = newDomainInput.value.trim().toLowerCase()
  if (!raw) return
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  if (!domainRegex.test(raw)) {
    addError.value = 'Please enter a valid domain (e.g. company.com)'
    return
  }

  try {
    isAddingDomain.value = true
    addError.value = ''
    const result = await verifyDomainMutation({ domain: raw, verification_method: 'cname' })
    wizardDomain.value = result.domain
    wizardInstructions.value = result.instructions || null
    setupStep.value = 2
    await refetch()
  } catch (err: any) {
    addError.value = err?.response?.data?.message ?? 'Failed to add domain.'
  } finally {
    isAddingDomain.value = false
  }
}

async function runWizardVerification() {
  if (!wizardDomain.value || isModalVerifying.value || modalRetryCountdown.value > 0) return
  isModalVerifying.value = true
  wizardError.value = null
  try {
    const { data, retryAfter } = await workspaceStore.recheckDomain(wizardDomain.value._id)
    if (retryAfter !== null) {
      startModalCountdown(retryAfter)
      isModalVerifying.value = false
      return
    }
    if (data) {
      wizardDomain.value = data.domain
      wizardInstructions.value = data.instructions
      if (data.domain.status === 'verified') {
        setupStep.value = 4
      } else {
        toast.error('DNS records not yet detected. Please wait a few minutes.')
        wizardError.value = 'DNS records not yet detected. Please verify your settings and wait a few minutes for propagation.'
      }
    }
  } catch (err: any) {
    wizardError.value = err?.response?.data?.message ?? 'Verification failed.'
  } finally {
    isModalVerifying.value = false
  }
}

async function submitWizardAdmin() {
  if (isCreatingUser.value) return
  isCreatingUser.value = true
  createUserServerError.value = ''
  try {
    const companyId = localStorage.getItem('company_id') || ''
    const payload = {
      u_full_name: adminName.value.trim(),
      u_email: `${emailPrefix.value.trim()}@${wizardDomain.value?.domain}`,
      u_password: adminPassword.value,
      u_job_title: adminJobTitle.value.trim(),
      company_id: companyId,
      role: 'super admin',
    }
    const res = await createUserMutation(payload)
    adminUserId.value = res.user?._id || res._id
    await sendWizardOtp()
    setupStep.value = 5
  } catch (err: any) {
    createUserServerError.value = err?.response?.data?.message ?? 'Failed to create admin account.'
  } finally {
    isCreatingUser.value = false
  }
}

async function sendWizardOtp() {
  if (isSendingOtp.value) return
  isSendingOtp.value = true
  try {
    const companyId = localStorage.getItem('company_id') || ''
    await sendOtpMutation({ user_id: adminUserId.value, company_id: companyId })
    toast.success('Verification code sent to your email.')
  } catch (err: any) {
    toast.error('Failed to send verification code.')
  } finally {
    isSendingOtp.value = false
  }
}

async function verifyWizardOtp() {
  const otp = otpDigits.value.join('')
  if (otp.length < 5 || isVerifyingOtp.value) return
  isVerifyingOtp.value = true
  otpError.value = ''
  try {
    const companyId = localStorage.getItem('company_id') || ''
    await verifyOtpMutation({
      user_id: adminUserId.value,
      otp,
      company_id: companyId,
    })
    toast.success('Domain setup completed successfully!')
    cancelWizard()
    await refetch()
  } catch (err: any) {
    otpError.value = err?.response?.data?.message ?? 'Invalid verification code.'
  } finally {
    isVerifyingOtp.value = false
  }
}

// ── OTP Helpers ──────────────────────────────────────────────────────────────
function handleOtpInput(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const value = input.value
  if (value && index < 4) {
    nextTick(() => {
      otpInputs.value[index + 1]?.focus()
    })
  }
}

function handleOtpDelete(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    nextTick(() => {
      otpInputs.value[index - 1]?.focus()
    })
  }
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

// ── Dashboard / Existing Logic ───────────────────────────────────────────────
async function setPrimary(id: string) {
  if (!canSetPrimaryDomain.value) return
  try { await setPrimaryMutation(id) } catch {}
}

async function copy(text: string) {
  try { 
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {}
}

function getRecordHost(ins: DnsInstructions): string {
  if (ins.method === 'http') return ins.file_url
  return ins.record_host
}

function getRecordValue(ins: DnsInstructions): string {
  if (ins.method === 'http') return ins.file_content
  return ins.record_value
}

function getRecordType(ins: DnsInstructions): string {
  if (ins.method === 'http') return 'HTTP'
  return ins.record_type
}

// Domain Users
const domainUsersMap     = ref<Record<string, any[]>>({})
const domainUsersLoaded  = ref<Set<string>>(new Set())
const loadingDomainUsers = ref<string | null>(null)

async function loadDomainUsers(domainId: string) {
  loadingDomainUsers.value = domainId
  try {
    const companyId = localStorage.getItem('company_id') ?? ''
    const users = await workspaceStore.listDomainUsers(companyId)
    domainUsersMap.value = { ...domainUsersMap.value, [domainId]: users }
    domainUsersLoaded.value = new Set([...domainUsersLoaded.value, domainId])
  } catch (err: any) {
    const status = err?.response?.status || err?.status
    const msg = (err?.response?.data?.message || err?.message || '').toLowerCase()
    if (status === 404 || msg.includes('no users') || msg.includes('not found')) {
      domainUsersMap.value = { ...domainUsersMap.value, [domainId]: [] }
      domainUsersLoaded.value = new Set([...domainUsersLoaded.value, domainId])
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to load domain users.')
    }
  } finally {
    loadingDomainUsers.value = null
  }
}

// Create User (Legacy)
const showCreateUserModal   = ref(false)
const createUserDomainId    = ref<string | null>(null)
const domainForCreateUser   = ref('')
const createUserForm        = ref({ u_full_name: '', emailPrefix: '', u_password: '', u_job_title: '' })

const isCreateUserFormValid = computed(() =>
  !!createUserForm.value.u_full_name.trim() &&
  !!createUserForm.value.emailPrefix.trim() &&
  createUserForm.value.u_password.length >= 6
)

function openCreateUserModal(domainId: string) {
  createUserDomainId.value = domainId
  const domain = domains.value.find((d) => d._id === domainId)
  domainForCreateUser.value = domain?.domain ?? ''
  createUserForm.value   = { u_full_name: '', emailPrefix: '', u_password: '', u_job_title: '' }
  createUserServerError.value = ''
  showCreateUserModal.value   = true
}

function closeCreateUserModal() {
  showCreateUserModal.value = false
  createUserDomainId.value  = null
}

async function submitCreateUser() {
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

// Transfer Logic
const domainSelectedIds = ref<Record<string, string[]>>({})
const showTransferModal   = ref(false)
const isTransferring      = ref(false)
const transferDomainId    = ref<string | null>(null)
const transferDomainName  = ref('')

const transferSelectedUsers = computed(() => {
  if (!transferDomainId.value) return []
  const ids   = domainSelectedIds.value[transferDomainId.value] ?? []
  const users = domainUsersMap.value[transferDomainId.value] ?? []
  return users.filter((u: any) => ids.includes(u._id))
})

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
    toast.success(`${ids.length} user${ids.length !== 1 ? 's' : ''} successfully added.`)
    clearDomainSelection(transferDomainId.value)
    showTransferModal.value = false
    await refetch()
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Transfer failed.')
  } finally {
    isTransferring.value = false
  }
}

// Formatting helpers
function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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