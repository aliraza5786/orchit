<template>
  <div class="w-full flex-1 space-y-5">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 class="text-base font-bold text-text-primary flex items-center gap-2">
          <i class="fa-solid fa-users text-accent text-sm"></i>
          Team Members
          <span class="text-[11px] font-medium text-text-secondary bg-bg-card border border-border/50 px-2 py-0.5 rounded-full">
            {{ totalMembers }}
          </span>
        </h3>
        <p class="text-xs text-text-secondary mt-0.5">Manage your organization's workspace accounts.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap self-start sm:self-auto">
        <button
          v-if="hasVerifiedDomain && isSuperAdminActive"
          @click="handleCopyInviteLink"
          class="flex items-center gap-2 px-3.5 py-2.5 border border-border/60 text-text-secondary text-sm font-medium rounded-lg hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
        >
          <i class="fa-solid fa-link text-xs"></i>
          Invite via link
        </button>

        <button
          v-if="canCreateUsers"
          @click="handleAddMember"
          class="flex items-center gap-2 px-4 cursor-pointer py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 whitespace-nowrap"
        >
          <i class="fa-solid fa-user-plus text-xs"></i>
          Add member
        </button>
      </div>
    </div>

    <!-- Domain Not Verified Warning -->
    <div v-if="!hasVerifiedDomain" class="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-4">
      <div class="flex gap-3">
        <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-triangle-exclamation text-yellow-600 text-lg"></i>
        </div>
        <div>
          <h4 class="text-sm font-bold text-yellow-700">Domain Verification Required</h4>
          <p class="text-xs text-yellow-600/80 mt-1 leading-relaxed">
            You must verify your organization's domain before you can manage team members, invite new users via link, or activate your super admin account.
            Please go to <strong>Domain Setup</strong> to complete verification.
          </p>
        </div>
      </div>
    </div>

    <!-- Search + Filters -->
    <div class="flex flex-col sm:flex-row gap-2.5">
      <div class="flex-1 relative">
        <input
          v-model="searchQuery"
          placeholder="Search by name or email…"
          class="w-full pl-9 pr-4 py-2.5 border border-border/60 bg-bg-body/80 rounded-lg text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
        />
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60 text-xs"></i>
      </div>

      <div class="relative">
        <select
          v-model="statusFilter"
          class="pl-3 pr-8 py-2.5 border border-border/60 bg-bg-body/80 rounded-lg text-sm focus:border-accent/50 outline-none transition-all appearance-none cursor-pointer text-text-primary"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <i class="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60 text-[10px] pointer-events-none"></i>
      </div>

     <div class="relative">
  <select
    v-model="roleFilter"
    class="pl-3 pr-8 py-2.5 border border-border/60 bg-bg-body/80 rounded-lg text-sm focus:border-accent/50 outline-none transition-all appearance-none cursor-pointer text-text-primary"
  >
    <option value="">All roles</option>

    <option
      v-for="role in allRoles"
      :key="role._id"
      :value="role._id"
    >
      {{ role.title }}
    </option>
  </select>

  <i
    class="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60 text-[10px] pointer-events-none"
  ></i>
</div>
    </div>

    <!-- ── Bulk action bar ─────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="bulkSelectedIds.length > 0"
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-accent/30 bg-accent/5"
      >
        <div class="flex items-center gap-3">
          <!-- indeterminate / check-all -->
          <button
            @click="toggleBulkSelectAll"
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
            :class="isBulkAllSelected
              ? 'bg-accent border-accent'
              : 'border-accent/70 bg-bg-secondary'"
            :title="isBulkAllSelected ? 'Deselect all' : 'Select all on this page'"
          >
            <i
              class="text-secondary text-[9px]"
              :class="isBulkAllSelected ? 'fa-solid fa-check' : 'fa-solid fa-minus'"
            ></i>
          </button>

          <span class="text-sm font-semibold text-accent">
            {{ bulkSelectedIds.length }} selected
          </span>
          <span class="text-xs text-text-secondary hidden sm:inline">
            — bulk actions for selected members
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="clearBulkSelection"
            class="px-3 py-1.5 text-xs font-medium border border-border/60 rounded-lg text-text-secondary hover:text-text-primary hover:border-border transition-all"
          >
            Clear
          </button>
          <div class="flex items-center gap-2 flex-wrap">
  <!-- Activate -->
  <button
    @click="handleBulkActivate"
    :disabled="bulkActionLoading"
    class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
  >
    <i
      v-if="bulkActionLoading && selectedBulkAction === 'activate'"
      class="fa-solid fa-spinner animate-spin text-[10px]"
    ></i>
    <i
      v-else
      class="fa-solid fa-circle-check text-[10px]"
    ></i>

    Activate
  </button>

  <!-- Deactivate -->
  <button
    @click="handleBulkDeactivate"
    :disabled="bulkActionLoading"
    class="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
  >
    <i
      v-if="bulkActionLoading && selectedBulkAction === 'deactivate'"
      class="fa-solid fa-spinner animate-spin text-[10px]"
    ></i>
    <i
      v-else
      class="fa-solid fa-ban text-[10px]"
    ></i>

    Deactivate
  </button>

</div>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-[68px] rounded-lg border border-border/30 bg-bg-body/30 animate-pulse"></div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredMembers.length === 0"
      class="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mb-4">
        <i class="fa-regular fa-users text-accent text-2xl"></i>
      </div>
      <h3 class="text-base font-bold text-text-primary mb-1">
        {{ searchQuery || statusFilter || roleFilter ? 'No results found' : 'No team members yet' }}
      </h3>
      <p class="text-xs text-text-secondary mb-5 max-w-xs">
        {{ searchQuery || statusFilter || roleFilter
          ? 'Try adjusting your search or filters.'
          : 'Add workspace accounts for your team members.' }}
      </p>
      <button
        v-if="canCreateUsers && !searchQuery && !statusFilter && !roleFilter"
        @click="openCreateModal"
        class="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
      >
        <i class="fa-solid fa-user-plus mr-2 text-xs"></i> Add first member
      </button>
    </div>

    <!-- Members list -->
    <div v-else class="space-y-2">

      <!-- Select-all row header (only visible when list is not empty) -->
      <div class="flex items-center gap-3 px-4 py-2">
        <button
          @click="toggleBulkSelectAll"
          class="w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0"
          :class="isBulkAllSelected
            ? 'bg-accent border-accent'
            : isPartiallySelected
              ? 'bg-accent/20 border-accent/60'
              : 'border-border/60 bg-transparent hover:border-accent/40'"
          title="Select / deselect all visible members"
        >
          <i
            v-if="isBulkAllSelected || isPartiallySelected"
            class="text-white text-[8px]"
            :class="isBulkAllSelected ? 'fa-solid fa-check' : 'fa-solid fa-minus'"
          ></i>
        </button>
        <span class="text-[11px] text-text-secondary font-medium select-none">
          Select all on this page
        </span>
      </div>
        <div
  v-for="member in paginatedMembers"
  :key="member._id"
  class="flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all group"
  :class="[
    !member.is_owner && bulkSelectedIds.includes(member._id)
      ? 'border-accent/40 bg-accent/5'
      : 'border-border/40 bg-bg-body/50 hover:border-border/70 hover:bg-bg-body/80',
    !hasVerifiedDomain ? 'opacity-50 grayscale pointer-events-none' : ''
  ]"
>
  <!-- Checkbox -->
  <button
  v-if="!member.is_owner"
    @click="toggleBulkMember(member._id)"
    class="w-4 h-4 rounded border border-border flex items-center justify-center transition-all shrink-0 mt-0.5"
    :class="
      bulkSelectedIds.includes(member._id)
        ? 'bg-accent border-accent'
        : 'border-border/60 bg-transparent hover:border-accent/50'
    "
    :title="
      bulkSelectedIds.includes(member._id)
        ? 'Deselect member'
        : 'Select member'
    "
  >
    <i
      v-if="bulkSelectedIds.includes(member._id)"
      class="fa-solid fa-check text-white text-[8px]"
    ></i>
  </button>

  <!-- Avatar -->
  <div
    class="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0 overflow-hidden cursor-pointer"
    @click="!member.is_owner && toggleBulkMember(member._id)"
  >
    <img
      v-if="member.u_profile_image"
      :src="member.u_profile_image"
      class="w-full h-full object-cover"
      :alt="member.u_full_name"
    />

    <span v-else>
      {{ getInitials(member.u_full_name) }}
    </span>
  </div>

  <!-- Info -->
  <div
  class="flex-1 min-w-0"
  :class="!member.is_owner ? 'cursor-pointer' : 'cursor-default'"
  @click="!member.is_owner && toggleBulkMember(member._id)"
>
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Name -->
      <span class="text-sm font-semibold text-text-primary truncate">
        {{ member.u_full_name }}
      </span>

      <!-- Owner badge -->
      <span
        v-if="member.is_owner"
        class="text-[10px] bg-accent/30 text-accent font-semibold uppercase px-1.5 py-0.5 rounded-full tracking-wide"
      >
        Owner
      </span>

      <!-- Readonly role badge -->
      <span
        v-else-if="!canUpdateUsers"
        class="text-[10px] bg-accent/10 text-accent font-semibold uppercase px-1.5 py-0.5 rounded-full tracking-wide"
      >
        {{ member.membership_role }}
      </span>

      <!-- Status -->
      <span
        class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
        :class="getStatusBadgeClass(member.is_owner && !hasVerifiedDomain ? 'inactive' : member.membership_status)"
      >
        {{ member.is_owner && !hasVerifiedDomain ? 'inactive' : member.membership_status }}
      </span>
    </div>

    <!-- Email -->
    <p class="text-xs text-text-secondary truncate mt-0.5">
      {{ member.u_email }}
    </p>
  </div>

  <!-- Right Actions -->
  <div
    class="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
  >
    <!-- Inline role select -->
    <div
      v-if="canUpdateUsers && !member.is_owner"
      class="relative"
      @click.stop
    >
      <select
        :value="member.company_role_id"
        @change.stop="
          handleInlineRoleUpdate(
            member,
            ($event.target as HTMLSelectElement).value
          )
        "
        :disabled="roleUpdatingUserId === member._id"
        class="appearance-none cursor-pointer min-w-[110px]
               text-[10px] font-bold uppercase tracking-wide
               pl-3 pr-7 py-2 rounded-lg
               border border-accent/20
               bg-accent/10 text-accent
               hover:border-accent/40
               focus:outline-none focus:ring-2 focus:ring-accent/20
               disabled:opacity-50"
      >
        <option
          v-for="role in allRoles"
          :key="role._id"
          :value="role._id"
        >
          {{ role.title }}
        </option>
      </select>

      <!-- Loading -->
      <i
        v-if="roleUpdatingUserId === member._id"
        class="fa-solid fa-spinner animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-accent"
      ></i>

      <!-- Chevron -->
      <i
        v-else
        class="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-accent pointer-events-none"
      ></i>
    </div>

    <!-- Activate / Deactivate -->
    <button
      v-if="canUpdateUsers && !member.is_owner"
      @click.stop="handleToggleActive(member)"
      :disabled="togglingUserId === member._id"
      :title="member.is_active ? 'Deactivate' : 'Activate'"
      class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-all disabled:opacity-40"
    >
      <i
        v-if="togglingUserId === member._id"
        class="fa-solid fa-spinner animate-spin text-xs"
      ></i>

      <i
        v-else
        class="text-xs"
        :class="
          member.is_active
            ? 'fa-solid fa-ban'
            : 'fa-solid fa-circle-check'
        "
      ></i>
    </button>

  </div>
</div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
      <p class="text-xs text-text-secondary">
        Showing
        <span class="font-medium text-text-primary">{{ (page - 1) * pageSize + 1 }}</span>
        –
        <span class="font-medium text-text-primary">{{ Math.min(page * pageSize, filteredMembers.length) }}</span>
        of
        <span class="font-medium text-text-primary">{{ filteredMembers.length }}</span>
        members
      </p>

      <div class="flex items-center gap-1">
        <button
          @click="goToPage(page - 1)"
          :disabled="page === 1"
          class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <i class="fa-solid fa-chevron-left text-[10px]"></i>
        </button>

        <template v-for="p in totalPages" :key="p">
          <template v-if="p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)">
            <button
              @click="goToPage(p)"
              class="w-8 h-8 rounded-lg text-xs font-medium transition-all"
              :class="p === page
                ? 'bg-accent text-white border border-accent'
                : 'border border-border/50 text-text-secondary hover:text-text-primary hover:border-border'"
            >
              {{ p }}
            </button>
          </template>
          <span
            v-else-if="p === page - 2 || p === page + 2"
            class="w-8 h-8 flex items-center justify-center text-xs text-text-secondary"
          >…</span>
        </template>

        <button
          @click="goToPage(page + 1)"
          :disabled="page === totalPages"
          class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>

    <!-- Info card -->
    <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
      <p class="text-xs text-blue-500 flex items-start gap-2">
        <i class="fa-solid fa-circle-info mt-0.5 shrink-0"></i>
        <span>
          Members added here get a workspace account under your organization's domain
          (<strong>{{ orgDomainSuffix }}</strong>).
          Manage custom roles and permissions in <strong>Role Management</strong>.
        </span>
      </p>
    </div>
  </div>
<Transition
  enter-active-class="transition duration-200 ease-out"
  enter-from-class="opacity-0"
  enter-to-class="opacity-100"
  leave-active-class="transition duration-150 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div
    v-if="showInviteLinkModal"
    class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
    @click.self="showInviteLinkModal = false"
  >
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      appear
    >
      <div
        class="w-full max-w-lg rounded-2xl border border-border/50 bg-bg-dropdown shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 pt-6">
          <div
            class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4"
          >
            <i class="fa-solid fa-link text-accent text-xl"></i>
          </div>

          <h3 class="text-xl font-bold text-text-primary">
            Invite teammates
          </h3>

          <p class="text-sm text-text-secondary mt-2 leading-relaxed">
            Share this secure invite link with your team members so they can
            join your organization instantly.
          </p>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <label
            class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block mb-2"
          >
            Invite link
          </label>

          <div
            class="flex items-stretch rounded-xl border border-border/60 bg-bg-body/60 overflow-hidden"
          >
            <input
              :value="inviteLink"
              readonly
              class="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-text-primary outline-none"
            />

            <button
              @click="copyInviteLink"
              class="px-4 border-l border-border/60 bg-bg-card hover:bg-accent/5 transition-all flex items-center gap-2 text-sm font-semibold text-text-primary cursor-pointer"
            >
              <i
                :class="
                  inviteLinkCopied
                    ? 'fa-solid fa-check text-green-500'
                    : 'fa-regular fa-copy'
                "
                class="text-xs"
              ></i>

              <span>
                {{ inviteLinkCopied ? 'Copied' : 'Copy' }}
              </span>
            </button>
          </div>

          <!-- Success State -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="inviteLinkCopied"
              class="mt-3 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2"
            >
              <i class="fa-solid fa-circle-check text-green-500 text-xs"></i>

              <p class="text-xs font-medium text-green-600">
                Invite link copied to clipboard successfully.
              </p>
            </div>
          </Transition>

          <!-- Tips -->
          <div
            class="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3"
          >
            <div class="flex items-start gap-2">
              <i
                class="fa-solid fa-shield-halved text-blue-500 text-xs mt-0.5"
              ></i>

              <div>
                <p class="text-xs font-semibold text-blue-600">
                  Secure invitation
                </p>

                <p class="text-[11px] text-text-secondary mt-1 leading-relaxed">
                  Anyone with this link can request access to your organization.
                  You can revoke this link anytime from organization settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-border/40 flex items-center justify-end gap-3"
        >
          <button
            @click="showInviteLinkModal = false"
            class="px-4 py-2 text-sm font-medium rounded-lg border border-border/60 hover:bg-bg-card transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            @click="copyInviteLink"
            class="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all cursor-pointer flex items-center gap-2"
          >
            <i class="fa-regular fa-copy text-xs"></i>
            Copy link
          </button>
        </div>
      </div>
    </Transition>
  </div>
</Transition>
  <!-- ─── all your existing Teleport modals unchanged below ─── -->
  <!-- (invite link, domain required, enrol, enrol confirm, create, edit, deactivate) -->
  <!-- ... keep them exactly as they were ... -->
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  useCompanyUsers,
  useDeactivateCompanyUser,
  useToggleCompanyUserActive,
  type CompanyUser,
} from '../../../queries/useCompanyUsers'
import { useListDomains } from '../../../queries/useCommon'
import { useCompanyRolesWithoutPermission } from '../../../queries/useCommon'
import { useUpdateCompanyUser } from "../../../queries/useCompanyUsers"
interface Permission {
  _id: string
  slug: string
  title: string
  description: string
  action: string
  category: string
  scope: string
}

interface CompanyRole {
  _id: string
  title: string
  slug: string
  description: string
  company_id: string | null
  is_admin: boolean
  is_editor: boolean
  is_viewer: boolean
  is_system: boolean
  is_trash: boolean
  permissions: Permission[]
  created_at: string
}
// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{ profile?: any }>()

const { data: domainsData } = useListDomains()

const domains = computed(() => domainsData.value?.domains ?? [])
const hasVerifiedDomain = computed(() => domains.value.some((d: any) => d.status === 'verified'))

const owner = computed(() => members.value.find((m) => m.is_owner))
const isSuperAdminActive = computed(() => {
  if (!hasVerifiedDomain.value) return false
  return owner.value?.membership_status === 'active'
})
// ── Fetch all roles ───────────────────────────────────────────────────────────
const { data: rolesData } = useCompanyRolesWithoutPermission()

const allRoles = computed<CompanyRole[]>(() => {
  const raw = rolesData.value?.data ?? rolesData.value ?? []
  return Array.isArray(raw) ? raw : []
})
// ─── Company context ──────────────────────────────────────────────────────────
const companyId = computed<string>(() => localStorage.getItem('company_id') || '')
const activeCompany = computed(() => props.profile?.active_company)

const orgDomainSuffix = computed<string>(() => {
  const domainLink: string = activeCompany.value?.custom_domain ?? ''
  if (!domainLink) return 'yourcompany.orchit.ai'
  try { return new URL(domainLink).hostname }
  catch { return domainLink.replace(/^https?:\/\//, '') }
})

const inviteLink = computed<string>(() => activeCompany.value?.join_link)

// ─── Permissions ──────────────────────────────────────────────────────────────
const membershipRole = computed(() => activeCompany.value?.membership_role ?? '')
const permissions = computed<string[]>(() => activeCompany.value?.permissions ?? [])
const isOwner = computed(() => membershipRole.value === 'owner')
function can(p: string) { return permissions.value.includes(p) }
const canCreateUsers = computed(() => isOwner.value || can('company_user.create'))
const canUpdateUsers = computed(() => isOwner.value || can('company_user.update'))

// ─── Members data ─────────────────────────────────────────────────────────────
const { data: usersData, isLoading } = useCompanyUsers(
  computed(() => ({ company_id: companyId.value })).value
)

const members = computed<CompanyUser[]>(() => {
  const raw = usersData.value?.data?.users ?? usersData.value?.users ?? []
  return Array.isArray(raw) ? raw : []
})

// ─── Filters ──────────────────────────────────────────────────────────────────
const searchQuery  = ref('')
const statusFilter = ref('')
const roleFilter   = ref('')

const filteredMembers = computed(() =>
  members.value.filter((m) => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch = !q || m.u_full_name.toLowerCase().includes(q) || m.u_email.toLowerCase().includes(q)
    const matchStatus = !statusFilter.value || m.membership_status === statusFilter.value
    const matchRole =
  !roleFilter.value ||
  m.company_role_id === roleFilter.value
    return matchSearch && matchStatus && matchRole
  })
)

// ─── Pagination ───────────────────────────────────────────────────────────────
const page     = ref(1)
const pageSize = ref(10)

watch([searchQuery, statusFilter, roleFilter], () => { page.value = 1 })

const totalMembers = computed<number>(() => filteredMembers.value.length)
const totalPages   = computed(() => Math.max(1, Math.ceil(totalMembers.value / pageSize.value)))

const paginatedMembers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredMembers.value.slice(start, start + pageSize.value)
})

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
}

const bulkSelectedIds = ref<string[]>([])

const bulkActionLoading = ref(false)
const selectedBulkAction = ref<'deactivate' | 'activate' | 'delete' | null>(null)
const currentPageIds = computed(() =>
  paginatedMembers.value
    .filter((m) => !m.is_owner)   // ← add this filter
    .map((m) => m._id)
)

const isBulkAllSelected = computed(() =>
  currentPageIds.value.length > 0 &&
  currentPageIds.value.every((id) => bulkSelectedIds.value.includes(id))
)

const isPartiallySelected = computed(() =>
  currentPageIds.value.some((id) => bulkSelectedIds.value.includes(id)) &&
  !isBulkAllSelected.value
)

function toggleBulkMember(id: string) {
  const idx = bulkSelectedIds.value.indexOf(id)
  if (idx === -1) {
    bulkSelectedIds.value = [...bulkSelectedIds.value, id]
  } else {
    bulkSelectedIds.value = bulkSelectedIds.value.filter((i) => i !== id)
  }
}

function toggleBulkSelectAll() {
  if (isBulkAllSelected.value) {
    // deselect only the current page
    bulkSelectedIds.value = bulkSelectedIds.value.filter(
      (id) => !currentPageIds.value.includes(id)
    )
  } else {
    // add current page IDs (avoid duplicates)
    const merged = new Set([...bulkSelectedIds.value, ...currentPageIds.value])
    bulkSelectedIds.value = Array.from(merged)
  }
}

function clearBulkSelection() {
  bulkSelectedIds.value = []
}
async function handleBulkActivate() {
  if (!bulkSelectedIds.value.length) return

  selectedBulkAction.value = 'activate'
  bulkActionLoading.value = true

  try {
    await Promise.all(
      bulkSelectedIds.value.map((id) =>
        new Promise((resolve, reject) => {
          toggleActive(id, {
            onSuccess: resolve,
            onError: reject,
          })
        })
      )
    )

    toast.success(
      `${bulkSelectedIds.value.length} member${bulkSelectedIds.value.length !== 1 ? 's' : ''} activated successfully.`
    )

    clearBulkSelection()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to activate members.')
  } finally {
    bulkActionLoading.value = false
    selectedBulkAction.value = null
  }
}

async function handleBulkDeactivate() {
  if (!bulkSelectedIds.value.length) return

  selectedBulkAction.value = 'deactivate'
  bulkActionLoading.value = true

  try {
    await Promise.all(
      bulkSelectedIds.value.map((id) =>
        new Promise((resolve, reject) => {
          deactivateUser(id, {
            onSuccess: resolve,
            onError: reject,
          })
        })
      )
    )

    toast.success(
      `${bulkSelectedIds.value.length} member${bulkSelectedIds.value.length !== 1 ? 's' : ''} deactivated successfully.`
    )

    clearBulkSelection()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to deactivate members.')
  } finally {
    bulkActionLoading.value = false
    selectedBulkAction.value = null
  }
}
const roleUpdatingUserId = ref<string | null>(null)

const { mutate: updateUser } = useUpdateCompanyUser(companyId.value, {
  onSuccess: (data: any) => {
    toast.success(
      (data?.data ?? data)?.message || 'User role updated successfully'
    )

    roleUpdatingUserId.value = null
  },

  onError: (error: any) => {
    toast.error(
      error?.response?.data?.message || 'Failed to update role'
    )

    roleUpdatingUserId.value = null
  },
})

function handleInlineRoleUpdate(
  member: CompanyUser,
  roleSlug: string
) {
  if (!roleSlug) return

  if (member.membership_role === roleSlug) return

  roleUpdatingUserId.value = member._id

  updateUser({
    userId: member._id,

    payload: {
      company_role_id: roleSlug,
    },
  })
}

// Clear selection whenever the page or filters change so stale IDs don't linger
watch([page, searchQuery, statusFilter, roleFilter], () => {
  bulkSelectedIds.value = []
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':      return 'bg-green-500/10 text-green-500'
    case 'suspended':   return 'bg-yellow-500/10 text-yellow-500'
    case 'deactivated': return 'bg-red-500/10 text-red-400'
    default:            return 'bg-border/30 text-text-secondary'
  }
}

const showInviteLinkModal = ref(false)
const inviteLinkCopied = ref(false)

async function handleCopyInviteLink() {
  showInviteLinkModal.value = true
}

async function copyInviteLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)

    inviteLinkCopied.value = true

    setTimeout(() => {
      inviteLinkCopied.value = false
    }, 2500)
  } catch {
    toast.error('Could not copy link. Please copy it manually.')
  }
}


// ─── Domain required modal ────────────────────────────────────────────────────
const showDomainRequiredModal = ref(false)

function handleAddMember() {
  if (!hasVerifiedDomain.value) {
    showDomainRequiredModal.value = true
    return
  }
  openCreateModal()
}

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────
const showCreateModal   = ref(false)
const showPassword      = ref(false)
const createServerError = ref('')

const createForm = ref({
  u_full_name:  '',
  emailPrefix:  '',
  u_password:   '',
  u_job_title:  '',
  role:         '',
})

const createErrors = ref({
  u_full_name: '',
  emailPrefix: '',
  u_password:  '',
  role:        '',
})


const isCreateFormValid = computed(() =>
  !!createForm.value.u_full_name.trim() &&
  !!createForm.value.emailPrefix.trim() &&
  createForm.value.u_password.length >= 6 &&
  !!createForm.value.role &&
  !createErrors.value.u_full_name &&
  !createErrors.value.emailPrefix &&
  !createErrors.value.u_password &&
  !createErrors.value.role
)
console.log(isCreateFormValid);

function openCreateModal() {
  createForm.value = { u_full_name: '', emailPrefix: '', u_password: '', u_job_title: '', role: 'Viewer' }
  createErrors.value = { u_full_name: '', emailPrefix: '', u_password: '', role: '' }
  createServerError.value = ''
  showPassword.value = false
  showCreateModal.value = true
}

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────
const togglingUserId = ref<string | null>(null)

const { mutate: toggleActive } = useToggleCompanyUserActive(companyId.value, {
  onSuccess: (data: any) => { toast.success((data?.data ?? data)?.message || 'Status updated'); togglingUserId.value = null },
  onError: (error: any) => { toast.error(error?.response?.data?.message || 'Failed to update status'); togglingUserId.value = null },
})

function handleToggleActive(member: CompanyUser) {
  togglingUserId.value = member._id
  toggleActive(member._id)
}

// ─── DEACTIVATE ───────────────────────────────────────────────────────────────
const showDeactivateConfirm = ref(false)
const deactivatingMember    = ref<CompanyUser | null>(null)
const isDeactivating        = ref(false)

const { mutate: deactivateUser } = useDeactivateCompanyUser(companyId.value, {
  onSuccess: (data: any) => {
    toast.success((data?.data ?? data)?.message || 'Member deactivated')
    showDeactivateConfirm.value = false
    deactivatingMember.value = null
    isDeactivating.value = false
  },
  onError: (error: any) => { toast.error(error?.response?.data?.message || 'Failed to deactivate member'); isDeactivating.value = false },
})


</script>