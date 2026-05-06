<template>
  <div class="w-full space-y-6 flex-1">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent border border-accent/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </span>
          Domain Setup
        </h3>
        <p class="text-sm text-text-secondary mt-1">Connect and manage custom domains for your organization.</p>
      </div>

      <!-- Add domain button -->
      <button
      v-if="canAddDomain"
        @click="openAddModal"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 self-start sm:self-auto whitespace-nowrap"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add domain
      </button>
    </div>

    <!-- ── Add domain modal ─────────────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showAddModal" class="bg-bg-card border border-border/50 rounded-xl p-5 space-y-4">
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

        <!-- Domain input -->
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
              <svg v-if="isAdding" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
          Enter your root domain (e.g. <span class="font-mono text-text-primary bg-border/20 px-1.5 py-0.5 rounded">acme.com</span>).
          We'll guide you through adding the required DNS records after connecting.
        </p>
      </div>
    </Transition>

    <!-- ── Domain list ──────────────────────────────────────────────────────── -->

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="bg-bg-card border border-border/40 rounded-xl p-4 space-y-3 animate-pulse">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-border/20"></div>
            <div class="space-y-1.5">
              <div class="h-3.5 w-36 bg-border/20 rounded"></div>
              <div class="h-2.5 w-20 bg-border/15 rounded"></div>
            </div>
          </div>
          <div class="h-5 w-16 bg-border/20 rounded-full"></div>
        </div>
        <div class="h-px bg-border/20"></div>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="j in 3" :key="j" class="h-3 bg-border/15 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Fetch error -->
    <div
      v-else-if="fetchError"
      class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5"
    >
      <svg class="shrink-0 text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="text-xs text-red-400">Failed to load domains. Please try again.</p>
      <button @click="() => refetch()" class="ml-auto text-xs font-semibold text-red-400 hover:underline">Retry</button>
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
          @click="openAddModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
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
              <!-- Globe icon chip -->
              <div class="w-8 h-8 rounded-lg bg-border/15 border border-border/30 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-text-secondary">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-text-primary truncate">{{ domain.domain }}</p>
                  <span
                    v-if="domain.is_primary"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent border border-accent/20"
                  >
                    Primary
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">Added {{ formatDate(domain.created_at) }}</p>
              </div>
            </div>

            <!-- Status badge + actions -->
            <div class="flex items-center gap-2 shrink-0 ml-3">
              <!-- Status badge -->
              <span :class="statusBadgeClass(domain.status)">
                <span :class="statusDotClass(domain.status)"></span>
                {{ statusLabel(domain.status) }}
              </span>

              <!-- Set primary button (only for verified, non-primary domains) -->
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

              <!-- Delete button -->
              <button
              v-if="canDeleteDomain"
                @click="deleteDomain(domain._id)"
                :disabled="isRemoving"
                class="p-1.5 rounded-lg border border-transparent text-text-secondary hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove domain"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- DNS records section (shown when not verified) -->
          <div v-if="domain.status !== 'verified'" class="border-t border-border/30 px-4 py-3.5 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Required DNS Records</p>
              <button
              v-if="canVerifyDomain"
                @click="verifyDomain(domain.domain, domain.verification_method)"
                :disabled="verifyingDomains.has(domain._id)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-accent/30 text-accent rounded-lg hover:bg-accent/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="verifyingDomains.has(domain._id)" class="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {{ verifyingDomains.has(domain._id) ? 'Checking…' : 'Verify now' }}
              </button>
            </div>

            <!-- DNS records table (from instructions) -->
            <div v-if="domain.instructions" class="rounded-lg border border-border/30 overflow-hidden">
              <!-- Table header -->
              <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-border/10 border-b border-border/20">
                <p class="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Type</p>
                <p class="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Name</p>
                <p class="col-span-5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Value</p>
                <p class="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary text-right">Status</p>
              </div>
              <!-- Single DNS record from instructions -->
              <div class="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                <div class="col-span-2">
                  <span class="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-border/20 text-text-secondary font-mono">
                    {{ domain.instructions.record_type }}
                  </span>
                </div>
                <div class="col-span-4 flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-mono text-text-primary truncate">{{ domain.instructions.record_host }}</p>
                  <button @click="copy(domain.instructions!.record_host)" class="copy-btn shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
                <div class="col-span-5 flex items-center gap-1.5 min-w-0">
                  <p class="text-xs font-mono text-text-secondary truncate">{{ domain.instructions.record_value }}</p>
                  <button @click="copy(domain.instructions!.record_value)" class="copy-btn shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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

            <!-- Last check error -->
            <p v-if="domain.last_check_result && !domain.last_check_result.ok" class="text-xs text-amber-400 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ domain.last_check_result.error }}
            </p>

            <!-- Propagation note -->
            <p class="text-xs text-text-secondary leading-relaxed">
              <svg class="inline mr-1 mb-0.5 text-amber-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              DNS changes can take up to <span class="font-semibold text-text-primary">48 hours</span> to propagate. You can check verification status at any time.
            </p>
          </div>

          <!-- Active / verified domain footer -->
          <div v-else class="border-t border-border/30 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div class="flex items-center gap-1.5 text-xs text-text-secondary">
              <svg :class="domain.ssl_status === 'active' ? 'text-emerald-400' : 'text-text-secondary/40'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Info banner ───────────────────────────────────────────────────────── -->
    <div class="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3.5">
      <svg class="shrink-0 mt-0.5 text-blue-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p class="text-xs text-blue-400 leading-relaxed">
        Only verified domains can serve your workspace. Make sure all required DNS records are added at your
        domain registrar (e.g. GoDaddy, Namecheap, Cloudflare) before clicking <span class="font-semibold">Verify now</span>.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useListDomains,
  useVerifyDomain,
  useRemoveDomain,
  useSetPrimaryDomain,
  type CompanyDomain,
} from '../../../queries/useCommon'

// ── Queries & Mutations ───────────────────────────────────────────────────────
 const props = defineProps<{
  profile?: any
}>()
const activeCompany = computed(() => props.profile?.active_company)
const membershipRole = computed(() =>
  activeCompany.value?.membership_role || null
)

const permissions = computed<string[]>(() =>
  activeCompany.value?.permissions || []
)

function can(permission: string) {
  return permissions.value.includes(permission)
}

const isOwner = computed(() => membershipRole.value === 'owner')

/**
 * Centralized domain access control
 * Owner always allowed + permission-based access
 */
const canManageDomain = computed(() => {
  return (
    isOwner.value ||
    can('domain.manage') ||
    can('company_domain.manage') // fallback if backend still uses old naming
  )
})

const canAddDomain = computed(() =>
  canManageDomain.value || can('company_domain.create')
)

const canDeleteDomain = computed(() =>
  canManageDomain.value || can('company_domain.delete')
)

const canVerifyDomain = computed(() =>
  canManageDomain.value || can('company_domain.verify')
)

const canSetPrimaryDomain = computed(() =>
  canManageDomain.value || can('company_domain.set_primary')
)
const {
  data: domainsData,
  isLoading,
  isError: fetchError,
  refetch,
} = useListDomains()

const { mutateAsync: verifyDomainMutation } = useVerifyDomain()
const { mutateAsync: removeDomainMutation, isPending: isRemoving } = useRemoveDomain()
const { mutateAsync: setPrimaryMutation, isPending: isSettingPrimary } = useSetPrimaryDomain()

// ── Derived state ─────────────────────────────────────────────────────────────

const domains = computed<CompanyDomain[]>(
  () => domainsData.value?.data?.domains ?? []
)

// ── Local UI state ────────────────────────────────────────────────────────────

const showAddModal = ref(false)
const newDomain    = ref('')
const addError     = ref('')
const isAdding     = ref(false)

/** Tracks which domain _ids are currently being re-verified */
const verifyingDomains = ref<Set<string>>(new Set())

// ── Modal helpers ─────────────────────────────────────────────────────────────

function openAddModal() {
  showAddModal.value = true
  addError.value = ''
  newDomain.value = ''
}

function closeAddModal() {
  showAddModal.value = false
  addError.value = ''
  newDomain.value = ''
}

// ── Add domain (calls POST /verify for first-time setup) ──────────────────────

async function addDomain() {
   if (!canAddDomain.value) return
  const raw = newDomain.value.trim().toLowerCase()
  if (!raw) return

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
  if (!domainRegex.test(raw)) {
    addError.value = 'Please enter a valid domain (e.g. yourdomain.com)'
    return
  }

  if (domains.value.some(d => d.domain === raw)) {
    addError.value = 'This domain is already connected.'
    return
  }

  try {
    isAdding.value = true
    addError.value = ''
    await verifyDomainMutation({ domain: raw, verification_method: 'cname' })
    closeAddModal()
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    addError.value = error?.response?.data?.message ?? 'Failed to connect domain. Please try again.'
  } finally {
    isAdding.value = false
  }
}

// ── Re-verify domain ──────────────────────────────────────────────────────────

async function verifyDomain(domainName: string, method: CompanyDomain['verification_method']) {
   if (!canVerifyDomain.value) return
  // Find the domain object to get its _id for tracking
  const target = domains.value.find(d => d.domain === domainName)
  if (!target) return

  verifyingDomains.value = new Set([...verifyingDomains.value, target._id])
  try {
    await verifyDomainMutation({ domain: domainName, verification_method: method })
  } catch {
    // errors handled by the query layer / global handler
  } finally {
    const next = new Set(verifyingDomains.value)
    next.delete(target._id)
    verifyingDomains.value = next
  }
}

// ── Set primary domain ────────────────────────────────────────────────────────

async function setPrimary(id: string) {
  if (!canSetPrimaryDomain.value) return
  try {
    await setPrimaryMutation(id)
  } catch {
    // errors handled by the query layer / global handler
  }
}

// ── Delete domain ─────────────────────────────────────────────────────────────

async function deleteDomain(id: string) {
  if (!canDeleteDomain.value) return
  if (!window.confirm('Remove this domain? This cannot be undone.')) return
  try {
    await removeDomainMutation(id)
  } catch {
    // errors handled by the query layer / global handler
  }
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // silently fail — in prod show a toast here
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function sslStatusLabel(ssl: CompanyDomain['ssl_status']): string {
  return {
    none:         'not provisioned',
    provisioning: 'provisioning…',
    active:       'certificate active',
    error:        'error',
  }[ssl]
}

// ── Status badge helpers ──────────────────────────────────────────────────────

function statusLabel(status: CompanyDomain['status']): string {
  return {
    pending:    'Pending',
    verifying:  'Verifying',
    verified:   'Verified',
    failed:     'Failed',
    disabled:   'Disabled',
  }[status]
}

function statusBadgeClass(status: CompanyDomain['status']): string {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold'
  const map: Record<CompanyDomain['status'], string> = {
    verified:   `${base} bg-emerald-500/10 text-emerald-400`,
    pending:    `${base} bg-amber-500/10 text-amber-400`,
    verifying:  `${base} bg-blue-500/10 text-blue-400`,
    failed:     `${base} bg-red-500/10 text-red-400`,
    disabled:   `${base} bg-border/20 text-text-secondary`,
  }
  return map[status]
}

function statusDotClass(status: CompanyDomain['status']): string {
  const base = 'w-1.5 h-1.5 rounded-full'
  const map: Record<CompanyDomain['status'], string> = {
    verified:   `${base} bg-emerald-400`,
    pending:    `${base} bg-amber-400 animate-pulse`,
    verifying:  `${base} bg-blue-400 animate-pulse`,
    failed:     `${base} bg-red-400`,
    disabled:   `${base} bg-text-secondary/40`,
  }
  return map[status]
}
</script>