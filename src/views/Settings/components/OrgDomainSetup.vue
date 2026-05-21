<template>
  <div class="space-y-6">

    <!-- ── Skeleton ─────────────────────────────────────────────────────────── -->
    <template v-if="isLoading">
      <div class="space-y-5 animate-pulse">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-5 w-44 bg-border/40 rounded-lg"></div>
            <div class="h-3.5 w-64 bg-border/20 rounded-md"></div>
          </div>
          <div class="h-9 w-32 bg-border/30 rounded-lg"></div>
        </div>
        <div class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-28 w-full bg-border/15 rounded-2xl"></div>
        </div>
      </div>
    </template>

    <!-- ── Error ─────────────────────────────────────────────────────────────── -->
    <template v-else-if="fetchError">
      <div class="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-border/50 bg-border/[0.03]">
        <div class="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <i class="fa-solid fa-triangle-exclamation text-red-500"></i>
        </div>
        <h3 class="text-sm font-bold text-text-primary mb-1">Failed to load domains</h3>
        <p class="text-xs text-text-secondary mb-5 max-w-xs">There was a problem fetching your domain settings.</p>
        <button @click="refetch()" class="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 transition-all">
          Try again
        </button>
      </div>
    </template>

    <!-- ── Main ──────────────────────────────────────────────────────────────── -->
    <template v-else>

      <!-- ════════════════════════════════════════════
           DASHBOARD (list view)
      ═════════════════════════════════════════════ -->
      <div v-if="wizardStep === 'list'" class="space-y-5">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3" v-if="isViewer">
          <div>
            <h2 class="text-base font-bold text-text-primary flex items-center gap-2">
              <i class="fa-solid fa-globe text-accent text-sm"></i>
              Domain Management
            </h2>
            <p class="text-xs text-text-secondary mt-0.5">Configure and verify custom domains for your workspace.</p>
          </div>
          <button
            v-if="canAddDomain && 
            !domains.length"
            @click="startWizard(null)"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 shrink-0"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            Add Domain
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-if="!domains.length"
          class="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/50 bg-border/[0.02]"
        >
          <div class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
            <i class="fa-regular fa-globe text-accent text-xl"></i>
          </div>
          <h3 class="text-sm font-bold text-text-primary mb-1">No domains connected yet</h3>
          <p class="text-xs text-text-secondary max-w-xs mb-6 leading-relaxed">
            Connect a custom domain to give your workspace a branded home. You'll need access to your DNS provider.
          </p>
          <button
            v-if="canAddDomain"
            @click="startWizard(null)"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            Add Custom Domain
          </button>
        </div>

        <!-- Domain list -->
        <div v-else class="space-y-3">
          <div
            v-for="domain in domains"
            :key="domain._id"
            class="rounded-2xl border border-border/50 bg-bg-body/40 hover:border-border/80 transition-all overflow-hidden"
          >
            <!-- Domain row -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
              <!-- Icon + info -->
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-bg-surface border border-border/50 flex items-center justify-center shrink-0">
                  <i class="fa-regular fa-globe text-text-secondary text-sm"></i>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-bold text-text-primary truncate">{{ domain.domain }}</span>
                    <span v-if="domain.is_primary" class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">Primary</span>
                  </div>
                  <div class="flex items-center gap-2.5 mt-0.5">
                    <span :class="statusBadgeClass(domain.status)" class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      <span :class="statusDotClass(domain.status)" class="w-1.5 h-1.5 rounded-full"></span>
                      {{ statusLabel(domain.status) }}
                    </span>
                    <span class="text-[11px] text-text-secondary">Added {{ formatDate(domain.created_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <button
                  v-if="domain.status === 'verified' && !domain.is_primary && canSetPrimaryDomain"
                  @click="setPrimary(domain._id)"
                  :disabled="isSettingPrimary"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-amber-500 hover:bg-amber-500/10 border border-border/50 transition-all disabled:opacity-40"
                  title="Set as primary"
                >
                  <i class="fa-regular fa-star text-xs"></i>
                </button>

                <button
                  v-if="domain.status !== 'verified' && canVerifyDomain"
                  @click="startWizard(domain)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:bg-accent/90 transition-all shadow-sm shadow-accent/20"
                >
                  <i class="fa-solid fa-circle-check text-[11px]"></i>
                  Verify
                </button>
              </div>
            </div>

            <!-- Domain users accordion -->
            <div class="border-t border-border/30">
              <button
                :disabled="domain.status !== 'verified'"
                @click="loadDomainUsers(domain._id)"
                class="w-full flex items-center justify-between px-5 py-2.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary transition-all bg-bg-surface/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div class="flex items-center gap-2">
                  <i class="fa-regular fa-users text-[11px]"></i>
                  Domain Users
                  <span v-if="domainUsersMap[domain._id]" class="px-1.5 py-0.5 rounded-full bg-border/50 text-[10px] font-bold">
                    {{ domainUsersMap[domain._id].length }}
                  </span>
                </div>
                <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" :class="domainUsersLoaded.has(domain._id) ? 'rotate-180' : ''"></i>
              </button>

              <Transition
                enter-active-class="transition-all duration-250 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-[600px]"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-[600px]"
                leave-to-class="opacity-0 max-h-0"
              >
                <div v-if="domainUsersLoaded.has(domain._id)" class="overflow-hidden">
                  <div class="px-5 py-4 space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <template v-if="!isViewer">
                          <label class="flex items-center gap-2 cursor-pointer">
                          <div
                            class="w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all"
                            :class="isDomainAllSelected(domain._id) ? 'bg-accent border-accent' : 'border-border/60 hover:border-accent/50'"
                            @click.stop="toggleDomainSelectAll(domain._id)"
                          >
                            <i v-if="isDomainAllSelected(domain._id)" class="fa-solid fa-check text-white text-[8px]"></i>
                            <div v-else-if="isDomainPartiallySelected(domain._id)" class="w-2 h-0.5 bg-accent rounded-full"></div>
                          </div>
                          <span class="text-[11px] font-semibold text-text-secondary">Select all</span>
                        </label>

                        <button
                          v-if="(domainSelectedIds[domain._id] ?? []).length"
                          @click="openTransferModal(domain._id, domain.domain)"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-bold transition-all hover:bg-accent/90"
                        >
                          <i class="fa-solid fa-arrow-right-to-bracket text-[10px]"></i>
                          Enrol ({{ domainSelectedIds[domain._id].length }})
                        </button>
                        </template>
                        
                      </div>

                      <button
                      v-if="!isViewer"
                        @click="openCreateUserModal(domain._id)"
                        class="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        <i class="fa-solid fa-plus text-[10px]"></i>
                        Create user
                      </button>
                    </div>

                    <div class="space-y-1.5">
                      <div
                        v-for="user in domainUsersMap[domain._id]"
                        :key="user._id"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/30 bg-bg-surface/30 hover:bg-bg-surface/60 transition-all"
                      >
                        <div
                        v-if="!isViewer"
                          class="w-4 h-4 rounded border-[1.5px] flex items-center justify-center cursor-pointer transition-all shrink-0"
                          :class="(domainSelectedIds[domain._id] ?? []).includes(user._id) ? 'bg-accent border-accent' : 'border-border/60'"
                          @click="toggleDomainUser(domain._id, user._id)"
                        >
                          <i v-if="(domainSelectedIds[domain._id] ?? []).includes(user._id)" class="fa-solid fa-check text-white text-[8px]"></i>
                        </div>

                        <div class="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent shrink-0 overflow-hidden">
                          <img v-if="user.u_profile_image" :src="user.u_profile_image" class="w-full h-full object-cover" />
                          <span v-else>{{ getInitials(user.u_full_name) }}</span>
                        </div>

                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold text-text-primary truncate">{{ user.u_full_name }}</p>
                          <p class="text-[10px] text-text-secondary truncate">{{ user.u_email }}</p>
                        </div>

                        <span
                          class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          :class="user.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'"
                        >
                          {{ user.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </div>

                      <div v-if="!domainUsersMap[domain._id]?.length" class="py-8 text-center">
                        <i class="fa-regular fa-users text-text-secondary/40 text-2xl mb-2 block"></i>
                        <p class="text-xs text-text-secondary">No users found for this domain.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Info banner -->
        <div class="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] px-4 py-3">
          <i class="fa-solid fa-circle-info text-blue-400 text-xs mt-0.5 shrink-0"></i>
          <p class="text-xs text-blue-400 leading-relaxed">
            Only verified domains can serve your workspace. Add required DNS records at your domain registrar before clicking
            <span class="font-semibold">Verify</span>.
          </p>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           WIZARD
      ═════════════════════════════════════════════ -->
      <div v-else class="space-y-6">

        <!-- Wizard top bar -->
        <div class="flex items-center justify-between">
          <button
            @click="exitWizard"
            class="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors group"
          >
            <i class="fa-solid fa-arrow-left text-[11px] group-hover:-translate-x-0.5 transition-transform"></i>
            Back to domains
          </button>

          <!-- Step pills -->
          <div class="flex items-center gap-1.5">
            <div
              v-for="s in wizardSteps"
              :key="s.key"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="[
                wizardStep === s.key ? 'w-6 bg-accent' :
                wizardStepIndex > wizardSteps.findIndex(x => x.key === s.key) ? 'w-4 bg-green-500' :
                'w-4 bg-border/50'
              ]"
            ></div>
          </div>
        </div>

        <!-- ── Step: Add domain ──────────────────────────────────────── -->
        <div v-if="wizardStep === 'add'" class="max-w-lg mx-auto space-y-5">
          <div class="text-center space-y-1.5">
            <div class="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-regular fa-globe text-accent text-lg"></i>
            </div>
            <h2 class="text-lg font-bold text-text-primary">Connect your domain</h2>
            <p class="text-sm text-text-secondary">Enter the domain name you want to connect to your workspace.</p>
          </div>

          <div class="rounded-2xl border border-border/50 bg-bg-body/50 p-6 space-y-4">
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Domain name</label>
              <input
                v-model="newDomainInput"
                type="text"
                placeholder="e.g. mycompany.com"
                class="w-full px-4 py-2.5 border border-border/60 bg-bg-body/80 rounded-xl text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary font-medium"
                @keyup.enter="addDomain"
              />
              <p v-if="addError" class="text-[11px] text-red-500 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
                {{ addError }}
              </p>
            </div>

            <button
              @click="addDomain"
              :disabled="isAddingDomain || !newDomainInput.trim()"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <i v-if="isAddingDomain" class="fa-solid fa-spinner animate-spin text-xs"></i>
              {{ isAddingDomain ? 'Processing…' : 'Continue to DNS setup' }}
            </button>
          </div>
        </div>

        <!-- ── Step: DNS Setup ───────────────────────────────────────── -->
        <div v-else-if="wizardStep === 'dns'" class="max-w-lg mx-auto space-y-5">
          <div class="text-center space-y-1.5">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-server text-amber-500 text-base"></i>
            </div>
            <h2 class="text-lg font-bold text-text-primary">Configure DNS settings</h2>
            <p class="text-sm text-text-secondary">Add these records to your DNS provider (GoDaddy, Cloudflare, Namecheap, etc.)</p>
          </div>

          <div v-if="wizardInstructions" class="rounded-2xl border border-border/50 bg-bg-body/50 p-6 space-y-5">

            <!-- Record type + TTL -->
            <div class="grid grid-cols-2 gap-3">
              <div class="px-4 py-3 rounded-xl bg-bg-surface border border-border/40">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Record type</p>
                <p class="text-sm font-bold text-text-primary">{{ getRecordType(wizardInstructions) }}</p>
              </div>
              <div class="px-4 py-3 rounded-xl bg-bg-surface border border-border/40">
                <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">TTL</p>
                <p class="text-sm font-bold text-text-primary">{{ wizardInstructions.ttl_recommended ? wizardInstructions.ttl_recommended + 's' : 'Auto' }}</p>
              </div>
            </div>

            <!-- Host -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Host / Name</label>
                <button @click="copy(getRecordHost(wizardInstructions))" class="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1">
                  <i class="fa-regular fa-copy text-[10px]"></i> Copy
                </button>
              </div>
              <div class="px-4 py-3 rounded-xl bg-bg-surface border border-border/40 font-mono text-sm text-text-primary break-all select-all">
                {{ getRecordHost(wizardInstructions) }}
              </div>
            </div>

            <!-- Value -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Value / Points to</label>
                <button @click="copy(getRecordValue(wizardInstructions))" class="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1">
                  <i class="fa-regular fa-copy text-[10px]"></i> Copy
                </button>
              </div>
              <div class="px-4 py-3 rounded-xl bg-bg-surface border border-border/40 font-mono text-sm text-text-primary break-all select-all">
                {{ getRecordValue(wizardInstructions) }}
              </div>
            </div>

            <div class="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <i class="fa-solid fa-triangle-exclamation text-amber-500 text-xs mt-0.5 shrink-0"></i>
              <p class="text-xs text-amber-600 leading-relaxed">DNS changes can take up to 24–48 hours to propagate, though usually ready in minutes.</p>
            </div>

            <button
              @click="wizardStep = 'verify'"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Verify connection
            </button>
          </div>
        </div>

        <!-- ── Step: Verify ──────────────────────────────────────────── -->
        <div v-else-if="wizardStep === 'verify'" class="max-w-lg mx-auto space-y-5">
          <!-- Domain pill -->
          <div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-bg-surface/40">
            <i class="fa-regular fa-globe text-accent text-sm shrink-0"></i>
            <span class="text-sm font-semibold text-text-primary flex-1">{{ wizardDomain?.domain }}</span>
            <span :class="statusBadgeClass(wizardDomain?.status || 'pending')" class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              <span :class="statusDotClass(wizardDomain?.status || 'pending')" class="w-1.5 h-1.5 rounded-full"></span>
              {{ statusLabel(wizardDomain?.status || 'pending') }}
            </span>
          </div>

          <!-- Verified success -->
          <div v-if="wizardDomain?.status === 'verified'" class="rounded-2xl border border-green-500/25 bg-green-500/5 p-6 text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto">
              <i class="fa-solid fa-circle-check text-green-500 text-2xl"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">Domain verified!</h3>
              <p class="text-xs text-text-secondary mt-1">Your domain is active and ready to serve your workspace.</p>
            </div>

            <!-- Set primary -->
            <button
              v-if="!wizardDomain.is_primary"
              @click="setPrimary(wizardDomain._id)"
              :disabled="isSettingPrimary"
              class="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-bg-surface hover:bg-bg-card hover:border-amber-500/30 transition-all text-sm font-semibold text-text-primary"
            >
              <i class="fa-regular fa-star text-amber-500 text-sm"></i>
              Set as primary domain
              <i v-if="isSettingPrimary" class="fa-solid fa-spinner animate-spin text-xs ml-auto"></i>
            </button>
            <div v-else class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <i class="fa-solid fa-star text-amber-500 text-sm"></i>
              <span class="text-sm font-semibold text-amber-600">Primary domain</span>
            </div>

            <!-- Go to super admin -->
            <button
              @click="wizardStep = 'superadmin'"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Continue — set up super admin
              <i class="fa-solid fa-arrow-right text-xs ml-1"></i>
            </button>
          </div>

          <!-- Verification method tabs + DNS instructions -->
          <div v-else class="rounded-2xl border border-border/50 bg-bg-body/50 p-6 space-y-5">

            <!-- Method switcher -->
            <div class="space-y-2">
              <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Verification method</p>
              <div class="flex gap-1 p-1 rounded-xl bg-bg-surface border border-border/40">
                <button
                  v-for="m in verificationMethods"
                  :key="m.value"
                  @click="switchVerificationMethod(m.value as VerificationMethod)"
                  :disabled="isSwitchingMethod"
                  class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
                  :class="selectedMethod === m.value
                    ? 'bg-bg-dropdown text-text-primary shadow-sm border border-border/50'
                    : 'text-text-secondary hover:text-text-primary'"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>

            <!-- Method switched notice -->
            <div v-if="methodSwitched" class="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <i class="fa-solid fa-circle-info text-amber-500 text-xs mt-0.5 shrink-0"></i>
              <p class="text-xs text-amber-600 leading-relaxed">Apex domain detected — CNAME is not supported on root domains. Switched to TXT verification.</p>
            </div>

            <!-- DNS records -->
            <div v-if="wizardInstructions">
              <template v-if="wizardInstructions.method === 'cname' || wizardInstructions.method === 'txt'">
                <div class="space-y-3">
                  <div class="rounded-xl overflow-hidden border border-border/50">
                    <div class="grid grid-cols-2 bg-bg-surface border-b border-border/40">
                      <div class="px-4 py-2.5">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Type</p>
                        <p class="text-sm font-bold text-text-primary">{{ wizardInstructions.record_type }}</p>
                      </div>
                      <div class="px-4 py-2.5 border-l border-border/40">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">TTL</p>
                        <p class="text-sm font-bold text-text-primary">{{ wizardInstructions.ttl_recommended }}s</p>
                      </div>
                    </div>
                    <div class="divide-y divide-border/30">
                      <div class="flex items-center gap-3 px-4 py-3">
                        <div class="flex-1 min-w-0">
                          <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Host / Name</p>
                          <p class="text-sm font-mono text-text-primary break-all">{{ wizardInstructions.record_host }}</p>
                        </div>
                        <button @click="copyField(wizardInstructions.record_host, 'host')" class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-surface transition-all">
                          <i :class="copiedField === 'host' ? 'fa-solid fa-check text-green-500' : 'fa-regular fa-copy text-text-secondary'" class="text-xs"></i>
                        </button>
                      </div>
                      <div class="flex items-center gap-3 px-4 py-3">
                        <div class="flex-1 min-w-0">
                          <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Value / Points to</p>
                          <p class="text-sm font-mono text-text-primary break-all">{{ wizardInstructions.record_value }}</p>
                        </div>
                        <button @click="copyField(wizardInstructions.record_value, 'value')" class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-surface transition-all">
                          <i :class="copiedField === 'value' ? 'fa-solid fa-check text-green-500' : 'fa-regular fa-copy text-text-secondary'" class="text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="wizardInstructions.method === 'http'">
                <div class="space-y-3">
                  <p class="text-xs text-text-secondary leading-relaxed">Upload a verification file to your server so it's reachable at:</p>
                  <div class="rounded-xl overflow-hidden border border-border/50 divide-y divide-border/30">
                    <div class="flex items-center gap-3 px-4 py-3">
                      <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">File URL</p>
                        <p class="text-xs font-mono text-text-primary break-all">{{ wizardInstructions.file_url }}</p>
                      </div>
                      <button @click="copyField(wizardInstructions.file_url, 'url')" class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-surface transition-all">
                        <i :class="copiedField === 'url' ? 'fa-solid fa-check text-green-500' : 'fa-regular fa-copy text-text-secondary'" class="text-xs"></i>
                      </button>
                    </div>
                    <div class="flex items-center gap-3 px-4 py-3">
                      <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">File content</p>
                        <p class="text-xs font-mono text-text-primary break-all">{{ wizardInstructions.file_content }}</p>
                      </div>
                      <button @click="copyField(wizardInstructions.file_content, 'content')" class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-surface transition-all">
                        <i :class="copiedField === 'content' ? 'fa-solid fa-check text-green-500' : 'fa-regular fa-copy text-text-secondary'" class="text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <!-- Download verification file button (mirrors onboarding step 8) -->
                  <button
                    @click="downloadVerificationFile"
                    :disabled="isDownloadingFile"
                    class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border/60 hover:bg-bg-surface transition-all disabled:opacity-50"
                  >
                    <i v-if="isDownloadingFile" class="fa-solid fa-spinner animate-spin text-xs text-accent"></i>
                    <i v-else class="fa-solid fa-download text-xs text-accent"></i>
                    Download streamed-verify.txt
                  </button>
                </div>
              </template>
            </div>

            <!-- Last check error -->
            <div v-if="wizardDomain?.last_check_result?.error" class="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <i class="fa-solid fa-circle-exclamation text-red-400 text-xs mt-0.5 shrink-0"></i>
              <div>
                <p class="text-xs font-semibold text-red-500 mb-0.5">Last check failed</p>
                <p class="text-xs text-text-secondary">{{ wizardDomain.last_check_result.error }}</p>
              </div>
            </div>

            <!-- Retry countdown -->
            <div v-if="retryCountdown > 0" class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-surface border border-border/40">
              <i class="fa-regular fa-clock text-text-secondary text-xs shrink-0"></i>
              <p class="text-xs text-text-secondary">Wait <span class="font-bold text-text-primary tabular-nums">{{ retryCountdown }}s</span> before checking again</p>
              <div class="flex-1 max-w-20 h-1 rounded-full bg-border/40 overflow-hidden ml-auto">
                <div class="h-full bg-accent rounded-full transition-all duration-1000" :style="{ width: `${(retryCountdown / retryTotal) * 100}%` }"></div>
              </div>
            </div>

            <!-- Recheck error -->
            <p v-if="recheckError" class="text-xs text-red-500 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
              {{ recheckError }}
            </p>

            <button
              @click="runVerification"
              :disabled="isVerifying || retryCountdown > 0 || isSwitchingMethod"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <i v-if="isVerifying" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <i v-else class="fa-solid fa-rotate-right text-xs"></i>
              {{ isVerifying ? 'Checking…' : "I've added the record — verify now" }}
            </button>

            <button @click="wizardStep = 'dns'" class="w-full py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
              ← Back to DNS instructions
            </button>
          </div>
        </div>

        <!-- ── Step: Super Admin ─────────────────────────────────────── -->
        <div v-else-if="wizardStep === 'superadmin'" class="max-w-lg mx-auto space-y-5">
          <div class="text-center space-y-1.5">
            <div class="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-user-shield text-accent text-base"></i>
            </div>
            <h2 class="text-lg font-bold text-text-primary">Create super admin</h2>
            <p class="text-sm text-text-secondary">Every verified domain needs a designated super admin account.</p>
          </div>

          <div class="rounded-2xl border border-border/50 bg-bg-body/50 p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Full name <span class="text-red-500">*</span></label>
                <input
                  v-model="adminName"
                  placeholder="Jane Doe"
                  class="w-full px-3.5 py-2.5 border border-border/60 bg-bg-body/80 rounded-xl text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Job title</label>
                <input
                  v-model="adminJobTitle"
                  placeholder="e.g. CTO"
                  class="w-full px-3.5 py-2.5 border border-border/60 bg-bg-body/80 rounded-xl text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Super admin email <span class="text-red-500">*</span></label>
              <div class="flex items-stretch border border-border/60 rounded-xl overflow-hidden focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
                <input
                  v-model="emailPrefix"
                  placeholder="admin"
                  class="flex-1 px-3.5 py-2.5 bg-bg-body/80 text-sm outline-none placeholder:text-text-tertiary"
                />
                <div class="px-3.5 py-2.5 bg-bg-surface border-l border-border/40 text-xs font-semibold text-text-secondary flex items-center shrink-0">
                  @{{ wizardDomain?.domain }}
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Password <span class="text-red-500">*</span></label>
              <div class="relative">
                <input
                  v-model="adminPassword"
                  :type="showAdminPassword ? 'text' : 'password'"
                  placeholder="Min 6 characters"
                  class="w-full px-3.5 py-2.5 pr-10 border border-border/60 bg-bg-body/80 rounded-xl text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                />
                <button
                  type="button"
                  @click="showAdminPassword = !showAdminPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <i :class="showAdminPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-xs"></i>
                </button>
              </div>
            </div>

            <p v-if="adminError" class="text-xs text-red-500 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
              {{ adminError }}
            </p>

            <button
              @click="submitAdmin"
              :disabled="isCreatingAdmin || !adminName.trim() || !emailPrefix.trim() || adminPassword.length < 6"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <i v-if="isCreatingAdmin" class="fa-solid fa-spinner animate-spin text-xs"></i>
              {{ isCreatingAdmin ? 'Creating account…' : 'Send verification code' }}
            </button>
          </div>
        </div>

        <!-- ── Step: OTP ─────────────────────────────────────────────── -->
        <div v-else-if="wizardStep === 'otp'" class="max-w-lg mx-auto space-y-5">
          <div class="text-center space-y-1.5">
            <div class="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-envelope-open-text text-accent text-base"></i>
            </div>
            <h2 class="text-lg font-bold text-text-primary">Verify your account</h2>
            <p class="text-sm text-text-secondary">
              We sent a 5-digit code to
              <strong class="text-text-primary">{{ emailPrefix }}@{{ wizardDomain?.domain }}</strong>
            </p>
          </div>

          <div class="rounded-2xl border border-border/50 bg-bg-body/50 p-6 space-y-6">
            <!-- OTP inputs -->
            <div class="flex justify-center gap-2.5">
              <input
                v-for="(_, idx) in 5"
                :key="idx"
                :ref="el => otpInputs[idx] = el"
                v-model="otpDigits[idx]"
                type="text"
                maxlength="1"
                inputmode="numeric"
                class="w-12 h-14 border-2 rounded-xl text-center text-xl font-bold outline-none transition-all bg-bg-body/80 text-text-primary"
                :class="otpDigits[idx] ? 'border-accent bg-accent/5' : 'border-border/60 focus:border-accent'"
                @input="handleOtpInput($event, idx)"
                @keydown.delete="handleOtpDelete($event, idx)"
                @paste="handleOtpPaste($event)"
              />
            </div>

            <p v-if="otpError" class="text-xs text-red-500 text-center flex items-center justify-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
              {{ otpError }}
            </p>

            <button
              @click="verifyOtp"
              :disabled="isVerifyingOtp || otpDigits.join('').length < 5"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <i v-if="isVerifyingOtp" class="fa-solid fa-spinner animate-spin text-xs"></i>
              {{ isVerifyingOtp ? 'Verifying…' : 'Complete setup' }}
            </button>

            <p class="text-xs text-text-secondary text-center">
              Didn't receive it?
              <button
                @click="resendOtp"
                :disabled="isSendingOtp"
                class="text-accent font-semibold hover:underline ml-1 disabled:opacity-50"
              >
                {{ isSendingOtp ? 'Sending…' : 'Resend code' }}
              </button>
            </p>
          </div>
        </div>

      </div>

    </template>

    <!-- ════════════════════════════════════════════
         TRANSFER MODAL
    ═════════════════════════════════════════════ -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" @click.self="showTransferModal = false">
        <div class="w-full max-w-md rounded-2xl border border-border/50 bg-bg-dropdown shadow-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-border/40 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-text-primary">Enrol domain users</h3>
              <p class="text-xs text-text-secondary mt-0.5">Add {{ transferSelectedUsers.length }} users from <span class="font-semibold text-text-primary">{{ transferDomainName }}</span></p>
            </div>
            <button @click="showTransferModal = false" class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <!-- User avatars -->
            <div class="flex flex-wrap gap-1.5">
              <div
                v-for="user in transferSelectedUsers.slice(0, 12)"
                :key="user._id"
                :title="user.u_full_name"
                class="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent border-2 border-bg-dropdown hover:border-accent/40 transition-all"
              >
                {{ getInitials(user.u_full_name) }}
              </div>
              <div v-if="transferSelectedUsers.length > 12" class="w-9 h-9 rounded-full bg-bg-surface border-2 border-border/40 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                +{{ transferSelectedUsers.length - 12 }}
              </div>
            </div>

            <div class="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <i class="fa-solid fa-circle-info text-blue-400 text-xs mt-0.5 shrink-0"></i>
              <p class="text-xs text-blue-400 leading-relaxed">Changes are effective immediately. Review permissions in the Team tab after enrolment.</p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-border/40 flex gap-3">
            <button @click="showTransferModal = false" class="flex-1 py-2.5 text-sm font-medium border border-border/60 rounded-xl hover:bg-bg-surface transition-all text-text-secondary">Cancel</button>
            <button
              @click="handleConfirmTransfer"
              :disabled="isTransferring"
              class="flex-1 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <i v-if="isTransferring" class="fa-solid fa-spinner animate-spin text-xs"></i>
              Confirm enrolment
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ════════════════════════════════════════════
         CREATE USER MODAL
    ═════════════════════════════════════════════ -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showCreateUserModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" @click.self="closeCreateUserModal">
        <div class="w-full max-w-md rounded-2xl border border-border/50 bg-bg-dropdown shadow-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-border/40 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-text-primary">Create user</h3>
              <p class="text-xs text-text-secondary mt-0.5">Add a new user to @{{ domainForCreateUser }}</p>
            </div>
            <button @click="closeCreateUserModal" class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Full name <span class="text-red-500">*</span></label>
              <input v-model="createUserForm.u_full_name" placeholder="Jane Doe" class="w-full px-3.5 py-2.5 border border-border/60 bg-bg-body/80 rounded-xl text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Email prefix <span class="text-red-500">*</span></label>
              <div class="flex items-stretch border border-border/60 rounded-xl overflow-hidden focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
                <input v-model="createUserForm.emailPrefix" placeholder="jane.doe" class="flex-1 px-3.5 py-2.5 bg-bg-body/80 text-sm outline-none placeholder:text-text-tertiary" />
                <div class="px-3.5 py-2.5 bg-bg-surface border-l border-border/40 text-xs font-semibold text-text-secondary flex items-center">@{{ domainForCreateUser }}</div>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Password <span class="text-red-500">*</span></label>
              <input v-model="createUserForm.u_password" type="password" placeholder="Min 6 characters" class="w-full px-3.5 py-2.5 border border-border/60 bg-bg-body/80 rounded-xl text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" />
            </div>
            <p v-if="createUserError" class="text-xs text-red-500 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
              {{ createUserError }}
            </p>
          </div>

          <div class="px-6 py-4 border-t border-border/40 flex gap-3">
            <button @click="closeCreateUserModal" class="flex-1 py-2.5 text-sm font-medium border border-border/60 rounded-xl hover:bg-bg-surface transition-all text-text-secondary">Cancel</button>
            <button
              @click="submitCreateUser"
              :disabled="isCreatingDomainUser || !createUserForm.u_full_name.trim() || !createUserForm.emailPrefix.trim() || createUserForm.u_password.length < 6"
              class="flex-1 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <i v-if="isCreatingDomainUser" class="fa-solid fa-spinner animate-spin text-xs"></i>
              {{ isCreatingDomainUser ? 'Creating…' : 'Create user' }}
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
  useSetPrimaryDomain,
  type CompanyDomain,
  type DnsInstructions,
} from '../../../queries/useCommon'
import { useWorkspaceStore } from '../../../stores/workspace'
import {
  useCreateCompanyUser,
  useSendSuperAdminOtp,
  useVerifySuperAdminOtp,
} from '../../../queries/useCompanyUsers'
import type { VerificationMethod } from '../../../stores/workspace'
// ── Props & permissions ───────────────────────────────────────────────────────
const props = defineProps<{ profile?: any }>()

const activeCompany   = computed(() => props.profile?.active_company)
const membershipRole  = computed(() => activeCompany.value?.membership_role || null)
const permissions     = computed<string[]>(() => activeCompany.value?.permissions || [])
const isOwner         = computed(() => membershipRole.value === 'owner')
function can(p: string) { return permissions.value.includes(p) }

const canManageDomain     = computed(() => !isViewer.value && (isOwner.value || can('domain.manage') || can('company_domain.manage')))
const canAddDomain        = computed(() => !isViewer.value && (canManageDomain.value || can('company_domain.create')))
const canVerifyDomain     = computed(() => !isViewer.value && (canManageDomain.value || can('company_domain.verify')))
const canSetPrimaryDomain = computed(() => !isViewer.value && (canManageDomain.value || can('company_domain.set_primary')))

// ── Queries ───────────────────────────────────────────────────────────────────
const workspaceStore = useWorkspaceStore()
const { data: domainsData, isLoading, isError: fetchError, refetch } = useListDomains()
const { mutateAsync: setPrimaryMutation, isPending: isSettingPrimary } = useSetPrimaryDomain()
const { mutateAsync: createUserMutation } = useCreateCompanyUser()
const { mutateAsync: sendOtpMutation } = useSendSuperAdminOtp()
const { mutateAsync: verifyOtpMutation } = useVerifySuperAdminOtp()

const domains = computed<CompanyDomain[]>(() => domainsData.value?.domains ?? [])

// ── Wizard state ──────────────────────────────────────────────────────────────
type WizardStep = 'list' | 'add' | 'dns' | 'verify' | 'superadmin' | 'otp'

const wizardStep         = ref<WizardStep>('list')
const wizardDomain       = ref<CompanyDomain | null>(null)
const wizardInstructions = ref<DnsInstructions | null>(null)

const wizardSteps = [
  { key: 'add',        label: 'Add' },
  { key: 'dns',        label: 'DNS' },
  { key: 'verify',     label: 'Verify' },
  { key: 'superadmin', label: 'Admin' },
  { key: 'otp',        label: 'OTP' },
]
const wizardStepIndex = computed(() => wizardSteps.findIndex(s => s.key === wizardStep.value))

// ── Step 1: Add ───────────────────────────────────────────────────────────────
const newDomainInput = ref('')
const isAddingDomain = ref(false)
const addError       = ref('')

// ── Step 3: Verify ────────────────────────────────────────────────────────────
const selectedMethod    = ref('cname')
const methodSwitched    = ref(false)
const isVerifying       = ref(false)
const isSwitchingMethod = ref(false)
const recheckError      = ref('')
const copiedField       = ref<string | null>(null)
// Download state for HTTP verification method
const isDownloadingFile = ref(false)

const retryCountdown = ref(0)
const retryTotal     = ref(60)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// ── Step 4: Super admin ───────────────────────────────────────────────────────
const adminName         = ref('')
const adminJobTitle     = ref('')
const emailPrefix       = ref('')
const adminPassword     = ref('')
const showAdminPassword = ref(false)
const isCreatingAdmin   = ref(false)
const adminError        = ref('')
const adminUserId       = ref('')

// ── Step 5: OTP ───────────────────────────────────────────────────────────────
const otpDigits      = ref(['', '', '', '', ''])
const otpInputs      = ref<any[]>([])
const isVerifyingOtp = ref(false)
const isSendingOtp   = ref(false)
const otpError       = ref('')

// ── Domain users ──────────────────────────────────────────────────────────────
const domainUsersMap    = ref<Record<string, any[]>>({})
const domainUsersLoaded = ref<Set<string>>(new Set())
const domainSelectedIds = ref<Record<string, string[]>>({})

// ── Transfer modal ────────────────────────────────────────────────────────────
const showTransferModal  = ref(false)
const isTransferring     = ref(false)
const transferDomainId   = ref<string | null>(null)
const transferDomainName = ref('')

const transferSelectedUsers = computed(() => {
  if (!transferDomainId.value) return []
  const ids   = domainSelectedIds.value[transferDomainId.value] ?? []
  const users = domainUsersMap.value[transferDomainId.value] ?? []
  return users.filter((u: any) => ids.includes(u._id))
})

// ── Create user modal ─────────────────────────────────────────────────────────
const showCreateUserModal  = ref(false)
const createUserDomainId   = ref<string | null>(null)
const domainForCreateUser  = ref('')
const isCreatingDomainUser = ref(false)
const createUserError      = ref('')
const createUserForm       = ref({ u_full_name: '', emailPrefix: '', u_password: '' })

// ── Verification methods ──────────────────────────────────────────────────────
const verificationMethods = [
  { value: 'cname', label: 'CNAME' },
  { value: 'txt',   label: 'TXT' },
  { value: 'http',  label: 'HTTP File' },
]

// ── Wizard navigation ─────────────────────────────────────────────────────────
function startWizard(domain: CompanyDomain | null) {
  addError.value     = ''
  adminError.value   = ''
  otpError.value     = ''
  recheckError.value = ''

  if (!domain) {
    newDomainInput.value = ''
    wizardDomain.value   = null
    wizardStep.value     = 'add'
    return
  }

  wizardDomain.value       = domain
  wizardInstructions.value = domain.instructions || null
  selectedMethod.value     = domain.verification_method || 'cname'

  if (domain.status === 'verified') {
    wizardStep.value = 'superadmin'
  } else {
    wizardStep.value = wizardInstructions.value ? 'dns' : 'add'
  }
}

function exitWizard() {
  wizardStep.value         = 'list'
  wizardDomain.value       = null
  wizardInstructions.value = null
  stopCountdown()
}

// ── Add domain ────────────────────────────────────────────────────────────────
// Uses workspaceStore.verifyDomain — same call the onboarding flow uses in
// startDomainVerificationPhase (step 8). This both registers the domain AND
// returns the DNS instructions in one shot.
async function addDomain() {
  const raw = newDomainInput.value.trim().toLowerCase()
  if (!raw) return
  const domainRe = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  if (!domainRe.test(raw)) {
    addError.value = 'Please enter a valid domain (e.g. company.com)'
    return
  }
  isAddingDomain.value = true
  addError.value = ''
  try {
    // workspaceStore.verifyDomain(domain, method) registers the domain and
    // returns { domain, instructions, methodSwitched? } — identical to how
    // startDomainVerificationPhase works in the onboarding component.
    const result = await workspaceStore.verifyDomain(raw, 'cname')
    wizardDomain.value       = result.domain
    wizardInstructions.value = result.instructions
    selectedMethod.value     = result.domain.verification_method || 'cname'
    // Auto-detect method switch (e.g. apex domain forced to TXT)
    methodSwitched.value     = !!(result.methodSwitched) ||
                               (result.domain.verification_method !== 'cname')
    wizardStep.value = 'dns'
    await refetch()
  } catch (err: any) {
    addError.value = err?.response?.data?.message ?? 'Failed to add domain.'
  } finally {
    isAddingDomain.value = false
  }
}

// ── Verify domain (recheck) ───────────────────────────────────────────────────
// Uses workspaceStore.recheckDomain(id) — same call as recheckVerification in
// the onboarding component. Handles the retryAfter rate-limit response.
async function runVerification() {
  if (!wizardDomain.value || isVerifying.value || retryCountdown.value > 0) return
  isVerifying.value  = true
  recheckError.value = ''
  try {
    const { data, retryAfter } = await workspaceStore.recheckDomain(wizardDomain.value._id)

    if (retryAfter !== null) {
      // Server told us to wait — start the countdown and stop
      startCountdown(retryAfter ?? retryTotal.value)
      return
    }

    if (data) {
      wizardDomain.value       = data.domain
      wizardInstructions.value = data.instructions

      if (data.domain.status === 'verified') {
        toast.success('Domain verified successfully!')
      } else {
        toast.error('DNS not detected yet. Please wait a few minutes and try again.')
        recheckError.value = 'DNS records not yet detected. Verify your settings and wait for propagation.'
      }
    }
  } catch (err: any) {
    recheckError.value = err?.response?.data?.message ?? 'Verification failed.'
  } finally {
    isVerifying.value = false
  }
}

async function switchVerificationMethod(method: VerificationMethod) {
  if (!wizardDomain.value || isSwitchingMethod.value || method === selectedMethod.value) return
  isSwitchingMethod.value = true
  recheckError.value      = ''
  try {
    const result = await workspaceStore.verifyDomain(wizardDomain.value.domain, method)
    wizardDomain.value       = result.domain
    wizardInstructions.value = result.instructions
    selectedMethod.value     = result.domain.verification_method
    // If the server overrode the requested method (e.g. apex domain) show the notice
    methodSwitched.value = result.domain.verification_method !== method
  } catch (err: any) {
    recheckError.value = err?.response?.data?.message ?? 'Failed to switch method.'
  } finally {
    isSwitchingMethod.value = false
  }
}

// ── Download HTTP verification file ──────────────────────────────────────────
// Uses workspaceStore.downloadVerificationFile(id) — same call used in step 8.
async function downloadVerificationFile() {
  if (!wizardDomain.value || isDownloadingFile.value) return
  isDownloadingFile.value = true
  try {
    await workspaceStore.downloadVerificationFile(wizardDomain.value._id)
  } catch (err: any) {
    recheckError.value = err?.response?.data?.message ?? 'Failed to download verification file.'
  } finally {
    isDownloadingFile.value = false
  }
}

// ── Set primary ───────────────────────────────────────────────────────────────
async function setPrimary(id: string) {
  try {
    await setPrimaryMutation(id)
    toast.success('Primary domain updated')
    await refetch()
  } catch {}
}

// ── Submit super admin ────────────────────────────────────────────────────────
async function submitAdmin() {
  if (isCreatingAdmin.value) return
  isCreatingAdmin.value = true
  adminError.value = ''
  try {
    const companyId = localStorage.getItem('company_id') || ''
    const res = await createUserMutation({
      u_full_name: adminName.value.trim(),
      u_email:     `${emailPrefix.value.trim()}@${wizardDomain.value?.domain}`,
      u_password:  adminPassword.value,
      u_job_title: adminJobTitle.value.trim(),
      company_id:  companyId,
      role:        'super admin',
    })
    adminUserId.value = res?.user?._id || res?._id || ''

    // Send OTP via workspaceStore sendOtp (same pattern as onboarding resendSuperAdminOtp)
    await sendOtpMutation({ user_id: adminUserId.value, company_id: companyId })
    otpDigits.value  = ['', '', '', '', '']
    otpError.value   = ''
    wizardStep.value = 'otp'
    toast.success('Verification code sent to your email.')
    await nextTick()
    otpInputs.value[0]?.focus()
  } catch (err: any) {
    adminError.value = err?.response?.data?.message ?? 'Failed to create admin account.'
  } finally {
    isCreatingAdmin.value = false
  }
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
async function verifyOtp() {
  const code = otpDigits.value.join('')
  if (code.length < 5 || isVerifyingOtp.value) return
  isVerifyingOtp.value = true
  otpError.value = ''
  try {
    const companyId = localStorage.getItem('company_id') || ''
    await verifyOtpMutation({ user_id: adminUserId.value, otp: code, company_id: companyId })
    toast.success('Domain setup completed successfully!')
    exitWizard()
    await refetch()
  } catch (err: any) {
    otpError.value = err?.response?.data?.message ?? 'Invalid verification code.'
  } finally {
    isVerifyingOtp.value = false
  }
}

// ── Resend OTP ────────────────────────────────────────────────────────────────
async function resendOtp() {
  if (isSendingOtp.value) return
  isSendingOtp.value = true
  try {
    const companyId = localStorage.getItem('company_id') || ''
    await sendOtpMutation({ user_id: adminUserId.value, company_id: companyId })
    otpDigits.value = ['', '', '', '', '']
    toast.success('New code sent.')
    await nextTick()
    otpInputs.value[0]?.focus()
  } catch (err: any) {
    otpError.value = err?.response?.data?.message ?? 'Failed to resend code.'
  } finally {
    isSendingOtp.value = false
  }
}

// ── OTP input helpers ─────────────────────────────────────────────────────────
function handleOtpInput(event: Event, index: number) {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  otpDigits.value[index] = val.slice(-1)
  otpError.value = ''
  if (val && index < 4) nextTick(() => otpInputs.value[index + 1]?.focus())
}

function handleOtpDelete(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    nextTick(() => otpInputs.value[index - 1]?.focus())
  }
}

function handleOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 5) ?? ''
  text.split('').forEach((char, i) => { otpDigits.value[i] = char })
  nextTick(() => { const last = Math.min(text.length, 4); otpInputs.value[last]?.focus() })
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function startCountdown(seconds: number) {
  stopCountdown()
  retryTotal.value     = seconds
  retryCountdown.value = seconds
  countdownTimer = setInterval(() => {
    retryCountdown.value--
    if (retryCountdown.value <= 0) stopCountdown()
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  retryCountdown.value = 0
}

onUnmounted(() => stopCountdown())

// ── Domain users ──────────────────────────────────────────────────────────────
// Uses workspaceStore.listDomainUsers(companyId) — same call as loadDomainUsers
// in the onboarding component (step 9). Handles 404/not-found gracefully.
async function loadDomainUsers(domainId: string) {
  // Toggle collapse if already loaded
  if (domainUsersLoaded.value.has(domainId)) {
    const next = new Set(domainUsersLoaded.value)
    next.delete(domainId)
    domainUsersLoaded.value = next
    return
  }
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
  }
}

function toggleDomainUser(domainId: string, userId: string) {
  const current = domainSelectedIds.value[domainId] ?? []
  const idx = current.indexOf(userId)
  domainSelectedIds.value = {
    ...domainSelectedIds.value,
    [domainId]: idx === -1 ? [...current, userId] : current.filter(i => i !== userId),
  }
}

function toggleDomainSelectAll(domainId: string) {
  const allIds  = (domainUsersMap.value[domainId] ?? []).map((u: any) => u._id)
  const current = domainSelectedIds.value[domainId] ?? []
  const allSel  = allIds.every(id => current.includes(id))
  domainSelectedIds.value = { ...domainSelectedIds.value, [domainId]: allSel ? [] : allIds }
}

function isDomainAllSelected(domainId: string): boolean {
  const allIds  = (domainUsersMap.value[domainId] ?? []).map((u: any) => u._id)
  const current = domainSelectedIds.value[domainId] ?? []
  return allIds.length > 0 && allIds.every(id => current.includes(id))
}

function isDomainPartiallySelected(domainId: string): boolean {
  const allIds  = (domainUsersMap.value[domainId] ?? []).map((u: any) => u._id)
  const current = domainSelectedIds.value[domainId] ?? []
  return current.some(id => allIds.includes(id)) && !isDomainAllSelected(domainId)
}

// ── Transfer / Enrol ──────────────────────────────────────────────────────────
// Uses workspaceStore.enrolDomainUsers(companyId, ids) — same call as
// enrolSelectedUsers in the onboarding component (step 9).
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
    toast.success(`${ids.length} user${ids.length !== 1 ? 's' : ''} enrolled successfully.`)
    domainSelectedIds.value = { ...domainSelectedIds.value, [transferDomainId.value]: [] }
    showTransferModal.value = false
    await refetch()
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Enrolment failed.')
  } finally {
    isTransferring.value = false
  }
}

// ── Create domain user ────────────────────────────────────────────────────────
function openCreateUserModal(domainId: string) {
  createUserDomainId.value  = domainId
  const domain = domains.value.find(d => d._id === domainId)
  domainForCreateUser.value = domain?.domain ?? ''
  createUserForm.value      = { u_full_name: '', emailPrefix: '', u_password: '' }
  createUserError.value     = ''
  showCreateUserModal.value = true
}

function closeCreateUserModal() {
  showCreateUserModal.value = false
  createUserDomainId.value  = null
}

async function submitCreateUser() {
  isCreatingDomainUser.value = true
  createUserError.value      = ''
  try {
    const companyId = localStorage.getItem('company_id') ?? ''
    await createUserMutation({
      u_full_name: createUserForm.value.u_full_name.trim(),
      u_email:     `${createUserForm.value.emailPrefix.trim()}@${domainForCreateUser.value}`,
      u_password:  createUserForm.value.u_password,
      company_id:  companyId,
      role:        'viewer',
    })
    toast.success('User created successfully.')
    closeCreateUserModal()
    if (createUserDomainId.value) await loadDomainUsers(createUserDomainId.value)
  } catch (err: any) {
    createUserError.value = err?.response?.data?.message ?? 'Failed to create user.'
  } finally {
    isCreatingDomainUser.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success('Copied!') } catch {}
}

function copyField(text: string, field: string) {
  navigator.clipboard.writeText(text).then(() => {
    copiedField.value = field
    setTimeout(() => { copiedField.value = null }, 2000)
  })
}

function getRecordHost(ins: DnsInstructions): string {
  return ins.method === 'http' ? ins.file_url : ins.record_host
}
function getRecordValue(ins: DnsInstructions): string {
  return ins.method === 'http' ? ins.file_content : ins.record_value
}
function getRecordType(ins: DnsInstructions): string {
  return ins.method === 'http' ? 'HTTP' : ins.record_type
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusLabel(status: string): string {
  return { pending: 'Pending', verifying: 'Verifying', verified: 'Verified', failed: 'Failed', disabled: 'Disabled' }[status] ?? status
}

function statusBadgeClass(status: string): string {
  return {
    verified:  'bg-green-500/10 text-green-500',
    pending:   'bg-amber-500/10 text-amber-500',
    verifying: 'bg-blue-500/10 text-blue-400',
    failed:    'bg-red-500/10 text-red-400',
    disabled:  'bg-border/20 text-text-secondary',
  }[status] ?? 'bg-border/20 text-text-secondary'
}

function statusDotClass(status: string): string {
  return {
    verified:  'bg-green-500',
    pending:   'bg-amber-500 animate-pulse',
    verifying: 'bg-blue-400 animate-pulse',
    failed:    'bg-red-400',
    disabled:  'bg-text-secondary/40',
  }[status] ?? 'bg-text-secondary/40'
}
// ─── Viewer lock ──────────────────────────────────────────────
const isViewer = computed(() => {
  if (membershipRole.value === 'owner') return false
  const roleSlug = activeCompany.value?.role?.slug?.toLowerCase() ?? ''
  if (roleSlug.includes('super') || roleSlug === 'admin') return false
  return membershipRole.value === 'viewer' || membershipRole.value === 'member'
})

</script>