<template>
  <div class="w-full space-y-6 flex-1">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent border border-accent/20 transition-all duration-200 hover:bg-accent/20 hover:scale-110">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          Ownership Transfer
        </h3>
        <p class="text-sm text-text-secondary mt-1">Transfer workspace ownership to another member of your team.</p>
      </div>

      <!-- Status badge -->
      <div class="self-start sm:self-auto">
        <span v-if="isPendingLoading" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-border/10 border-border/40 text-text-secondary">
          <svg class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Checking…
        </span>
        <span v-else-if="transferState === 'idle'" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-border/10 border-border/40 text-text-secondary">
          <span class="w-1.5 h-1.5 rounded-full bg-text-secondary/40"></span>
          No pending transfer
        </span>
        <span v-else-if="transferState === 'pending'" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-amber-400/10 border-amber-400/30 text-amber-400">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Awaiting Acceptance
        </span>
        <span v-else-if="transferState === 'success'" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-400/10 border-emerald-400/30 text-emerald-400">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Transfer Complete
        </span>
      </div>
    </div>

    <!-- ── Loading skeleton ────────────────────────────────────────────────── -->
    <div v-if="isPendingLoading" class="flex items-center justify-center py-16">
      <div class="flex flex-col items-center gap-3">
        <svg class="animate-spin text-text-secondary/40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <p class="text-xs text-text-secondary/50">Loading transfer status…</p>
      </div>
    </div>

    <template v-else>

      <!-- ── Current Owner Card ────────────────────────────────────────────── -->
      <div class="bg-bg-card border border-border/40 rounded-xl p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-4">Current Owner</p>
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2"
            :style="{ background: currentOwner.color + '22', color: currentOwner.color, borderColor: currentOwner.color + '55' }"
          >{{ currentOwner.initials }}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-bold text-text-primary">{{ currentOwner.name }}</p>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-accent/10 border border-accent/20 text-accent">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Owner
              </span>
              <span v-if="currentOwner.isYou" class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-border/20 border border-border/40 text-text-secondary">
                You
              </span>
            </div>
            <p class="text-xs text-text-secondary mt-0.5">{{ currentOwner.email }}</p>
          </div>
          <div class="text-right hidden sm:block shrink-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Owner since</p>
            <p class="text-xs font-semibold text-text-primary mt-0.5">{{ currentOwner.since || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- ── Member Search & Select (only in idle state) ───────────────────── -->
      <div
        v-if="transferState === 'idle'"
        class="bg-bg-card border border-border/40 rounded-xl overflow-hidden transition-all duration-200 hover:border-border/70 hover:shadow-md hover:shadow-black/10"
      >
        <div class="px-5 pt-5 pb-3">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-3">Select New Owner</p>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/40 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search members by name or email…"
              class="w-full pl-8 pr-4 py-2.5 text-xs text-text-primary bg-border/10 border border-border/40 rounded-lg outline-none focus:border-accent/50 hover:border-border/70 transition-colors duration-150 placeholder:text-text-secondary/40"
            />
          </div>
        </div>

        <div class="divide-y divide-border/20 max-h-72 overflow-y-auto">
          <div v-if="filteredMembers.length === 0" class="flex flex-col items-center justify-center py-10 px-4">
            <svg class="w-10 h-10 text-text-secondary/30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p class="text-sm font-medium text-text-secondary">No members found</p>
            <p class="text-xs text-text-secondary/50 mt-1">Try a different name or email</p>
          </div>

          <div
            v-for="member in filteredMembers"
            :key="member.id"
            @click="openConfirmModal(member)"
            class="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-150 hover:bg-border/5 group/row"
          >
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200 group-hover/row:scale-105"
              :style="{ background: member.color + '22', color: member.color, border: `1.5px solid ${member.color}44` }"
            >{{ member.initials }}</div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-text-primary truncate">{{ member.name }}</p>
                <span
                  class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border"
                  :class="member.role === 'Admin'
                    ? 'bg-purple-400/10 border-purple-400/20 text-purple-400'
                    : 'bg-border/20 border-border/30 text-text-secondary'"
                >{{ member.role }}</span>
              </div>
              <p class="text-xs text-text-secondary truncate mt-0.5">{{ member.email }}</p>
            </div>
            <div title="Transfer Ownership" class="shrink-0 ml-1 w-7 h-7 rounded-lg border border-border/40 flex items-center justify-center text-text-secondary/40 group-hover/row:border-accent/40 group-hover/row:text-accent group-hover/row:bg-accent/5 transition-all duration-150">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
                
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Pending Transfer Card ─────────────────────────────────────────── -->
      <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0">
        <div
          v-if="transferState === 'pending' && pendingTransferTarget"
          class="bg-amber-400/5 border border-amber-400/25 rounded-xl overflow-hidden"
        >
          <!-- Top bar -->
          <div class="flex items-center gap-2 px-5 py-3 border-b border-amber-400/15 bg-amber-400/5">
            <svg class="text-amber-400 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="text-xs font-bold text-amber-400">Ownership transfer awaiting acceptance</p>
            <div class="ml-auto flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span class="text-[10px] text-amber-400/70 font-medium">Expires in 72 hours</span>
            </div>
          </div>

          <div class="p-5 space-y-4">
            <!-- Transfer visual from → to -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
                  :style="{ background: currentOwner.color + '22', color: currentOwner.color, borderColor: currentOwner.color + '44' }"
                >{{ currentOwner.initials }}</div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-text-primary truncate">{{ currentOwner.name }}</p>
                  <p class="text-[10px] text-text-secondary">Current owner (you)</p>
                </div>
              </div>
              <div class="flex-1 flex items-center gap-1.5 min-w-0 max-w-[80px]">
                <div class="flex-1 h-px bg-amber-400/30"></div>
                <svg class="text-amber-400 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <div class="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
                <div class="min-w-0 text-right">
                  <p class="text-xs font-semibold text-text-primary truncate">{{ pendingTransferTarget.name }}</p>
                  <p class="text-[10px] text-text-secondary">Invited as owner</p>
                </div>
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
                  :style="{ background: pendingTransferTarget.color + '22', color: pendingTransferTarget.color, borderColor: pendingTransferTarget.color + '44' }"
                >{{ pendingTransferTarget.initials }}</div>
              </div>
            </div>

            <!-- Email sent notice -->
            <div class="flex items-start gap-2.5 bg-border/10 border border-border/30 rounded-lg px-3.5 py-3">
              <svg class="text-text-secondary/60 shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <p class="text-[11px] text-text-secondary leading-relaxed">
                An invitation email was sent to
                <span class="font-semibold text-text-primary">{{ pendingTransferTarget.email }}</span>.
                Once they accept, they become the new Owner and may remove you from the workspace if they choose.
              </p>
            </div>

            <!-- Expiry info from API -->
            <div v-if="pendingExpiresAt" class="flex items-center gap-2 text-[11px] text-amber-400/70">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Invite expires {{ pendingExpiresAt }}
            </div>

            <div class="flex justify-end">
              <button
                @click="handleCancelTransfer"
                :disabled="isCancelling"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10 hover:border-amber-400/50 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="isCancelling" class="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                {{ isCancelling ? 'Cancelling…' : 'Cancel Transfer' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ── Success State ─────────────────────────────────────────────────── -->
      <Transition enter-active-class="transition-all duration-500 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
        <div
          v-if="transferState === 'success'"
          class="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-6 text-center"
        >
          <div class="w-12 h-12 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
            <svg class="text-emerald-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p class="text-sm font-bold text-emerald-400">Ownership transferred successfully</p>
          <p class="text-xs text-emerald-400/60 mt-1.5 max-w-sm mx-auto leading-relaxed">
            You are now an <span class="font-semibold">Admin</span>. The new owner has full control over billing,
            members, and workspace settings — and may remove you at any time.
          </p>
        </div>
      </Transition>

      <!-- ── Impact cards ──────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="item in transferImpacts"
          :key="item.label"
          class="flex items-start gap-3 bg-bg-card border border-border/40 rounded-xl px-4 py-3.5 transition-all duration-200 hover:border-border/60 hover:shadow-sm hover:shadow-black/10 group/impact"
        >
          <span
            class="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/impact:scale-110"
            :style="{ background: item.color + '15', color: item.color, border: `1px solid ${item.color}25` }"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" v-html="item.icon"></svg>
          </span>
          <div>
            <p class="text-xs font-semibold text-text-primary">{{ item.label }}</p>
            <p class="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- ── Info Banner ───────────────────────────────────────────────────── -->
      <div class="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3.5 transition-all duration-200 hover:bg-blue-500/8 hover:border-blue-500/25">
        <svg class="shrink-0 mt-0.5 text-blue-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p class="text-xs text-blue-400 leading-relaxed">
          Only <span class="font-semibold">Admins</span> and <span class="font-semibold">Members</span> with verified emails are eligible.
          After accepting, the new owner can remove any member — including you. You will retain
          <span class="font-semibold">Admin</span> access unless explicitly removed by the new owner.
        </p>
      </div>

    </template>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- Confirmation Modal                                                      -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
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
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Panel -->
        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-3"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-3"
        >
          <div
            v-if="showModal && modalMember"
            class="relative z-10 w-full max-w-lg bg-bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            <!-- Modal header -->
            <div class="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-border/30">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <svg class="text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-text-primary">Confirm Ownership Transfer</h4>
                  <p class="text-xs text-text-secondary mt-0.5">Irreversible without the new owner's consent</p>
                </div>
              </div>
              <button
                @click="closeModal"
                class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-border/40 text-text-secondary hover:border-border/70 hover:text-text-primary hover:bg-border/10 transition-all duration-150 active:scale-90"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              <!-- From → To visual -->
              <div class="flex items-center gap-3 p-4 bg-border/8 border border-border/30 rounded-xl">
                <!-- From -->
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2"
                    :style="{ background: currentOwner.color + '22', color: currentOwner.color, borderColor: currentOwner.color + '55' }"
                  >{{ currentOwner.initials }}</div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-text-primary truncate">{{ currentOwner.name }}</p>
                    <p class="text-[10px] text-text-secondary truncate mt-0.5">{{ currentOwner.email }}</p>
                    <span class="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-400/10 border border-amber-400/20 text-amber-400">
                      Owner → Admin
                    </span>
                  </div>
                </div>
                <!-- Arrow -->
                <div class="shrink-0">
                  <div class="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
                <!-- To -->
                <div class="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
                  <div class="min-w-0 text-right">
                    <p class="text-xs font-bold text-text-primary truncate">{{ modalMember.name }}</p>
                    <p class="text-[10px] text-text-secondary truncate mt-0.5">{{ modalMember.email }}</p>
                    <span class="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                      {{ modalMember.role }} → Owner
                    </span>
                  </div>
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2"
                    :style="{ background: modalMember.color + '22', color: modalMember.color, borderColor: modalMember.color + '55' }"
                  >{{ modalMember.initials }}</div>
                </div>
              </div>

              <!-- What happens steps -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">What happens next</p>
                <div class="space-y-2">
                  <div
                    v-for="(step, i) in whatHappensSteps"
                    :key="i"
                    class="flex items-start gap-2.5"
                  >
                    <span
                      class="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold mt-0.5"
                      :class="step.type === 'warning'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-border/20 border-border/40 text-text-secondary'"
                    >{{ i + 1 }}</span>
                    <p
                      class="text-[11px] leading-relaxed"
                      :class="step.type === 'warning' ? 'text-red-400/80' : 'text-text-secondary'"
                    >{{ step.text }}</p>
                  </div>
                </div>
              </div>

              <!-- Email notification note -->
              <div class="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3.5 py-3">
                <svg class="text-blue-400 shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <p class="text-[11px] text-blue-400/80 leading-relaxed">
                  An invitation email will be sent to
                  <span class="font-semibold text-blue-400">{{ modalMember.email }}</span>.
                  They must click the link to accept. The invite expires in
                  <span class="font-semibold text-blue-400">72 hours</span> if not accepted.
                </p>
              </div>

              <!-- Confirm input -->
              <div class="space-y-2">
                <label class="text-[11px] font-semibold text-text-secondary block">
                  Type
                  <span class="font-bold text-text-primary font-mono bg-border/20 px-1.5 py-0.5 rounded mx-1">TRANSFER</span>
                  to confirm
                </label>
                <input
                  v-model="confirmText"
                  type="text"
                  placeholder="TRANSFER"
                  autocomplete="off"
                  spellcheck="false"
                  class="w-full px-4 py-2.5 text-sm font-mono font-semibold text-text-primary bg-border/10 border rounded-lg outline-none transition-colors duration-150 placeholder:text-text-secondary/30"
                  :class="confirmText === 'TRANSFER'
                    ? 'border-emerald-400/40 focus:border-emerald-400/60'
                    : 'border-border/40 focus:border-border/70'"
                />
              </div>
            </div>

            <!-- Modal footer -->
            <div class="flex items-center gap-3 px-6 py-4 border-t border-border/30 bg-border/5">
              <button
                @click="closeModal"
                class="flex-1 px-4 py-2.5 text-xs font-semibold text-text-secondary border border-border/50 rounded-lg hover:bg-border/10 hover:border-border/70 transition-all duration-150 active:scale-95"
              >
                Cancel
              </button>
              <button
                @click="handleInitiateTransfer"
                :disabled="confirmText !== 'TRANSFER' || isTransferring"
                :class="[
                  'flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg border transition-all duration-150',
                  confirmText === 'TRANSFER' && !isTransferring
                    ? 'bg-red-500 border-red-600 text-white hover:bg-red-600 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-500/25'
                    : 'bg-border/20 border-border/30 text-text-secondary cursor-not-allowed opacity-50'
                ]"
              >
                <svg v-if="isTransferring" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
                {{ isTransferring ? 'Sending invite…' : 'Send Ownership Invite' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import { useUsers } from '../../../queries/useWorkspace'
import {
  usePendingTransfer,
  useInitiateTransfer,
  useCancelTransfer,
} from '../../../queries/useCommon'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member {
  id: string
  name: string
  initials: string
  email: string
  role: string
  color: string
  lastActive: string
  isYou?: boolean
  since?: string
}

interface RawUser {
  _id?: string
  u_full_name?: string
  u_email?: string
  u_profile_image?: string
  seat_title?: string
  role_title?: string
  seat_status?: string
  invitation_status?: string
  last_active_at?: string
  updated_at?: string
  created_at?: string
}

type TransferState = 'idle' | 'pending' | 'success'

// ── Fetch users ────────────────────────────────────────────────────────────────
const companyId = localStorage.getItem('company_id')
const { data: usersData } = useUsers(companyId)

// ── Ownership transfer queries ─────────────────────────────────────────────────
const { data: pendingData, isLoading: isPendingLoading } = usePendingTransfer()
const { mutateAsync: initiateTransfer, isPending: isInitiating } = useInitiateTransfer()
const { mutateAsync: cancelTransfer, isPending: isCancelling } = useCancelTransfer()

// ── Helpers ────────────────────────────────────────────────────────────────────
const colorPalette: string[] = [
  '#6ee7b7', '#818cf8', '#fb923c', '#38bdf8', '#f472b6', '#facc15', '#a78bfa',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColor(index: number): string {
  return colorPalette[index % colorPalette.length]
}

function formatLastActive(dateStr?: string): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHrs / 24)
  if (diffHrs < 1) return 'Just now'
  if (diffHrs < 24) return `${diffHrs} hrs ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  return `${diffDays} weeks ago`
}

function formatExpiry(isoString?: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Current owner ──────────────────────────────────────────────────────────────
const currentOwner = computed<Member>(() => {
  const raw: RawUser[] = usersData.value?.data?.users ?? usersData.value?.users ?? []
  const users = Array.isArray(raw) ? raw : []

  const ownerRaw: RawUser | undefined =
    users.find(
      (u) =>
        u.seat_title?.toLowerCase() === 'owner' ||
        u.role_title?.toLowerCase() === 'owner'
    ) ?? users[0]

  if (!ownerRaw) {
    return {
      id: '',
      name: 'You',
      initials: 'YO',
      email: '',
      role: 'Owner',
      color: colorPalette[0],
      lastActive: 'Now',
      isYou: true,
      since: '',
    }
  }

  const name = ownerRaw.u_full_name ?? ownerRaw.u_email ?? 'You'
  return {
    id: ownerRaw._id ?? ownerRaw.u_email ?? '',
    name,
    initials: getInitials(name),
    email: ownerRaw.u_email ?? '',
    role: 'Owner',
    color: colorPalette[0],
    lastActive: 'Now',
    isYou: true,
    since: ownerRaw.created_at
      ? new Date(ownerRaw.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '',
  }
})

// ── Eligible members (no owner, no current user, accepted only) ───────────────
const allMembers = computed<Member[]>(() => {
  const raw: RawUser[] = usersData.value?.data?.users ?? usersData.value?.users ?? []
  const users = Array.isArray(raw) ? raw : []

  return users
    .filter((u) => {
      const role = u.seat_title?.toLowerCase() ?? u.role_title?.toLowerCase() ?? ''
      const isOwner = role === 'owner'
      const isCurrentUser = (u.u_email ?? '') === currentOwner.value.email
      const isAccepted = u.seat_status === 'accepted'
      return !isOwner && !isCurrentUser && isAccepted
    })
    .map((u, index) => {
        console.log("user data is", u);
        
      const name = u.u_full_name ?? u.u_email ?? 'Unknown'
      const role = u.seat_title ?? u.role_title ?? 'Member'
      return {
        id: u._id ?? '', 
        name,
        initials: getInitials(name),
        email: u.u_email ?? '',
        role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
        color: getColor(index + 1),
        lastActive: formatLastActive(u.last_active_at ?? u.updated_at ?? u.created_at),
      }
    })
})

// ── UI state ───────────────────────────────────────────────────────────────────
const searchQuery: Ref<string>         = ref('')
const confirmText: Ref<string>         = ref('')
const transferState: Ref<TransferState> = ref('idle')
const showModal: Ref<boolean>          = ref(false)
const modalMember: Ref<Member | null>  = ref(null)
const pendingTransferId: Ref<string | null> = ref(null)

// ── Derived pending target from API ───────────────────────────────────────────
const pendingTransferTarget = computed<Member | null>(() => {
  const transfer = pendingData.value?.data?.transfer
  if (!transfer || transfer.status !== 'pending') return null

  const toUser = transfer.to_user ?? transfer.to_user_id
  if (!toUser) return null

  const name = ('name' in toUser ? toUser.name : toUser.u_full_name) ?? ''
  const email = ('email' in toUser ? toUser.email : toUser.u_email) ?? ''

  return {
    id: toUser._id,
    name,
    initials: getInitials(name),
    email,
    role: '',
    color: colorPalette[2],
    lastActive: '',
  }
})

// Expiry timestamp shown in pending card
const pendingExpiresAt = computed<string>(() => {
  const transfer = pendingData.value?.data?.transfer
  return formatExpiry(transfer?.expires_at)
})

// ── Sync transferState from API ────────────────────────────────────────────────
onMounted(() => {
  const transfer = pendingData.value?.data?.transfer
  if (transfer?.status === 'pending') {
    transferState.value = 'pending'
    pendingTransferId.value = transfer._id
  }
})

watch(
  pendingData,
  (val) => {
    const transfer = val?.data?.transfer
    if (transfer?.status === 'pending') {
      transferState.value = 'pending'
      pendingTransferId.value = transfer._id
    } else if (transferState.value === 'pending' && !transfer) {
      transferState.value = 'idle'
      pendingTransferId.value = null
    }
  },
  { immediate: true }
)

// ── Filtered members ───────────────────────────────────────────────────────────
const filteredMembers = computed<Member[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return allMembers.value
  return allMembers.value.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
  )
})

// ── isTransferring ─────────────────────────────────────────────────────────────
const isTransferring = computed<boolean>(() => isInitiating.value)

// ── Modal helpers ──────────────────────────────────────────────────────────────
function openConfirmModal(member: Member): void {
  if (transferState.value !== 'idle') return
  modalMember.value = member
  confirmText.value = ''
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

function closeModal(): void {
  if (isTransferring.value) return
  showModal.value = false
  confirmText.value = ''
  setTimeout(() => {
    modalMember.value = null
  }, 200)
  document.body.style.overflow = ''
}

// ── Initiate transfer ──────────────────────────────────────────────────────────
async function handleInitiateTransfer(): Promise<void> {
  if (confirmText.value !== 'TRANSFER' || !modalMember.value) return
  try {
    const res = await initiateTransfer({ target_user_id: modalMember.value.id })
    pendingTransferId.value = res?.data?.transfer?._id ?? null
    transferState.value = 'pending'
    toast.success('Ownership invite sent successfully')
    closeModal()
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to initiate transfer'
    toast.error(message)
  }
}

// ── Cancel transfer ────────────────────────────────────────────────────────────
async function handleCancelTransfer(): Promise<void> {
  if (!pendingTransferId.value) return
  try {
    await cancelTransfer(pendingTransferId.value)
    pendingTransferId.value = null
    transferState.value = 'idle'
    toast.success('Transfer cancelled')
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Failed to cancel transfer'
    toast.error(message)
  }
}

// ── Static display data ────────────────────────────────────────────────────────
const roleComparisonRows: { permission: string; adminHas: boolean }[] = [
  { permission: 'Transfer or delete workspace',         adminHas: false },
  { permission: 'Manage billing & subscription',        adminHas: false },
  { permission: 'Remove any member (incl. old owner)',  adminHas: false },
  { permission: 'Invite & manage members',              adminHas: true  },
  { permission: 'Manage roles & permissions',           adminHas: true  },
  { permission: 'Access all workspace content',         adminHas: true  },
  { permission: 'Create & manage AI token allocations', adminHas: true  },
  { permission: 'View analytics & reports',             adminHas: true  },
]

const whatHappensSteps = computed<{ text: string; type: 'info' | 'warning' }[]>(() => [
  {
    text: `An ownership invitation email is sent to ${modalMember.value?.name ?? 'the selected member'} at ${modalMember.value?.email ?? ''}.`,
    type: 'info',
  },
  {
    text: 'They must accept within 72 hours. The invite expires automatically if ignored.',
    type: 'info',
  },
  {
    text: 'Upon acceptance, they immediately become the workspace Owner with full privileges.',
    type: 'info',
  },
  {
    text: 'The new owner can remove you from the workspace at any time after accepting — without your approval.',
    type: 'warning',
  },
])

const transferImpacts: { label: string; desc: string; color: string; icon: string }[] = [
  {
    label: 'Your role: Owner → Admin',
    desc: 'Billing, workspace deletion, and ownership controls are immediately revoked from you.',
    color: '#f472b6',
    icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    label: 'Invite sent by email',
    desc: 'The selected member receives an email invitation and must accept within 72 hours.',
    color: '#38bdf8',
    icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  },
  {
    label: 'New owner can remove you',
    desc: 'After accepting, they gain full authority including the ability to remove any member.',
    color: '#fb923c',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="18" x2="17" y2="18"/><line x1="20" y1="15" x2="20" y2="21"/>',
  },
]
</script>