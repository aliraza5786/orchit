<template>
  <div class="w-full flex-1 space-y-5">

    <!-- ── Header ── -->
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
        <!-- Invite via link -->
        <button
          v-if="isSuperAdminActive && hasOrgDomain && hasSuperAdmin && canAct"
          @click="handleCopyInviteLink"
          class="flex items-center gap-2 px-3.5 py-2 border border-border/60 text-text-secondary text-sm font-medium rounded-lg hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
        >
          <i class="fa-solid fa-link text-xs"></i>
          Invite via link
        </button>

        <!-- Add member -->
        <div class="relative group/add">
          <button
            v-if="canCreateUsers"
            @click="hasOrgDomain && profile?.active_company?.has_domain_verified
              ? handleAddMember()
              : !profile?.active_company?.has_domain_verified
                ? toast.warning('Please verify your domain first before adding members.')
                : undefined"
            :disabled="!hasOrgDomain || !isUserVerified"
            class="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all shadow-sm whitespace-nowrap cursor-pointer"
            :class="hasOrgDomain
              ? 'bg-accent hover:bg-accent/90 active:scale-95 shadow-accent/20'
              : 'bg-accent/40 cursor-not-allowed shadow-none'"
          >
            <i class="fa-solid fa-user-plus text-xs"></i>
            Add member
          </button>
          <div
            v-if="!hasOrgDomain"
            class="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border/60 bg-bg-dropdown shadow-xl p-3 hidden group-hover/add:block pointer-events-none"
          >
            <div class="flex items-start gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <i class="fa-solid fa-triangle-exclamation text-amber-500 text-xs"></i>
              </div>
              <div>
                <p class="text-[12px] font-bold text-text-primary leading-tight">Custom domain required</p>
                <p class="text-[11px] text-text-secondary mt-1 leading-relaxed">
                  Set one up in <span class="text-accent font-semibold">Organization Settings</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Search + Filters ── -->
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
          <option v-for="role in allRoles" :key="role._id" :value="role._id">
            {{ role.title }}
          </option>
        </select>
        <i class="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60 text-[10px] pointer-events-none"></i>
      </div>
    </div>

    <!-- ── Bulk action bar ── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="bulkSelectedIds.length > 0 && canUpdateUsers"
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-accent/30 bg-accent/5"
      >
        <div class="flex items-center gap-3">
          <button
            @click="toggleBulkSelectAll"
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
            :class="isBulkAllSelected ? 'bg-accent border-accent' : 'border-accent/70 bg-bg-secondary'"
          >
            <i class="text-white text-[9px]" :class="isBulkAllSelected ? 'fa-solid fa-check' : 'fa-solid fa-minus'"></i>
          </button>
          <span class="text-sm font-semibold text-accent">{{ bulkSelectedIds.length }} selected</span>
          <span class="text-xs text-text-secondary hidden sm:inline">— bulk actions</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="clearBulkSelection"
            class="px-3 py-1.5 text-xs font-medium border border-border/60 rounded-lg text-text-secondary hover:text-text-primary hover:border-border transition-all"
          >
            Clear
          </button>

          <button
            v-if="bulkHasActivatable"
            @click="handleBulkActivate"
            :disabled="bulkActionLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
          >
            <i v-if="bulkActionLoading && selectedBulkAction === 'activate'" class="fa-solid fa-spinner animate-spin text-[10px]"></i>
            <i v-else class="fa-solid fa-circle-check text-[10px]"></i>
            Activate
          </button>

          <button
            v-if="bulkHasDeactivatable"
            @click="handleBulkDeactivate"
            :disabled="bulkActionLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
          >
            <i v-if="bulkActionLoading && selectedBulkAction === 'deactivate'" class="fa-solid fa-spinner animate-spin text-[10px]"></i>
            <i v-else class="fa-solid fa-ban text-[10px]"></i>
            Deactivate
          </button>

          <span
            v-if="bulkHasActivatable && bulkHasDeactivatable"
            class="text-[10px] text-text-secondary bg-bg-card border border-border/40 px-2 py-1 rounded-lg hidden sm:inline"
            title="Your selection contains both active and inactive members"
          >
            Mixed statuses
          </span>
        </div>
      </div>
    </Transition>

    <!-- ── Loading ── -->
    <div v-if="isLoading" class="space-y-2.5">
      <div v-for="i in 5" :key="i" class="h-[72px] rounded-xl border border-border/30 bg-bg-body/30 animate-pulse"></div>
    </div>

    <!-- ── Empty state ── -->
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
        {{ searchQuery || statusFilter || roleFilter ? 'Try adjusting your search or filters.' : 'Add workspace accounts for your team members.' }}
      </p>
      <button
        v-if="canCreateUsers && !searchQuery && !statusFilter && !roleFilter && hasOrgDomain"
        @click="openCreateModal"
        class="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
      >
        <i class="fa-solid fa-user-plus mr-2 text-xs"></i> Add first member
      </button>
    </div>

    <!-- ── Members list ── -->
    <div v-else class="space-y-1.5">

      <!-- Select-all header -->
      <div class="flex items-center gap-3 px-4 py-1.5" v-if="canUpdateUsers">
        <button
          @click="toggleBulkSelectAll"
          class="w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0"
          :class="isBulkAllSelected
            ? 'bg-accent border-accent'
            : isPartiallySelected
              ? 'bg-accent/20 border-accent/60'
              : 'border-border/60 bg-transparent hover:border-accent/40'"
        >
          <i v-if="isBulkAllSelected || isPartiallySelected" class="text-white text-[8px]" :class="isBulkAllSelected ? 'fa-solid fa-check' : 'fa-solid fa-minus'"></i>
        </button>
        <span class="text-[11px] text-text-secondary font-medium select-none">Select all on this page</span>
      </div>

      <!-- Member row -->
      <div
        v-for="member in paginatedMembers"
        :key="member._id"
        class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group"
        :class="[
          !member.is_owner && bulkSelectedIds.includes(member._id)
            ? 'border-accent/40 bg-accent/[0.04]'
            : 'border-border/40 bg-bg-body/50 hover:border-border/70 hover:bg-bg-body'
        ]"
      >
        <!-- Checkbox -->
        <button
          v-if="isBulkSelectable(member)"
          @click="toggleBulkMember(member._id)"
          class="w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0"
          :class="bulkSelectedIds.includes(member._id) ? 'bg-accent border-accent' : 'border-border/60 hover:border-accent/50'"
        >
          <i v-if="bulkSelectedIds.includes(member._id)" class="fa-solid fa-check text-white text-[8px]"></i>
        </button>
        <div v-else class="w-4 shrink-0"></div>

        <!-- Avatar -->
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ring-2 ring-border/20"
          :class="member.is_owner ? 'bg-gradient-to-br from-accent to-accent/60 text-white' : 'bg-gradient-to-br from-accent/30 to-accent/10 text-accent'"
        >
          <img v-if="member.u_profile_image" :src="member.u_profile_image" class="w-full h-full object-cover" :alt="member.u_full_name" />
          <span v-else>{{ getInitials(member.u_full_name) }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-semibold text-text-primary truncate leading-tight">{{ member.u_full_name }}</span>

            <span v-if="member.is_owner" class="inline-flex items-center gap-1 text-[10px] bg-accent/15 text-accent font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide">
              <i class="fa-solid fa-crown text-[8px]"></i> Owner
            </span>

            <span
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              :class="getStatusBadgeClass(member.membership_status)"
            >
              {{ member.membership_status }}
            </span>
          </div>
          <p class="text-xs text-text-secondary truncate mt-0.5 leading-tight">{{ member.u_email }}</p>
        </div>

        <!-- Action buttons -->
        <div
          class="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          v-if="!isSuperAdminMember(member) && (canUpdateUsers || canDeleteUsers)"
        >
          <button
            v-if="canUpdateUsers && (member.membership_status === 'active' || member.membership_status === 'deactivated' || member.membership_status === 'suspended')"
            @click.stop="openStatusModal(member)"
            :disabled="togglingUserId === member._id || !isUserVerified"
            :title="member.membership_status === 'active' ? 'Deactivate member' : 'Activate member'"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all disabled:opacity-40"
            :class="member.membership_status === 'active'
              ? 'border-yellow-500/25 bg-yellow-500/8 text-yellow-600 hover:bg-yellow-500/15 hover:border-yellow-500/40'
              : 'border-green-500/25 bg-green-500/8 text-green-600 hover:bg-green-500/15 hover:border-green-500/40'"
          >
            <i v-if="togglingUserId === member._id" class="fa-solid fa-spinner animate-spin text-[10px]"></i>
            <i v-else-if="member.membership_status === 'active'" class="fa-solid fa-ban text-[10px]"></i>
            <i v-else class="fa-solid fa-circle-check text-[10px]"></i>
            <span class="hidden sm:inline">{{ member.membership_status === 'active' ? 'Deactivate' : 'Activate' }}</span>
          </button>

          <button
            v-if="canUpdateUsers"
            @click.stop="openEditModal(member)"
            :disabled="!isUserVerified"
            title="Edit member"
            class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border hover:bg-bg-card transition-all disabled:opacity-40"
          >
            <i class="fa-regular fa-pen-to-square text-xs"></i>
          </button>

          <button
            v-if="canDeleteUsers && member.membership_status !== 'deactivated'"
            @click.stop="confirmDeactivate(member)"
            :disabled="!isUserVerified"
            title="Remove member"
            class="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all disabled:opacity-40"
          >
            <i class="fa-regular fa-trash-can text-xs"></i>
          </button>
        </div>

        <!-- Role select -->
        <div
          v-if="canUpdateUsers && !isSuperAdminMember(member)"
          class="relative shrink-0"
          @click.stop
        >
          <select
            :value="member.company_role_id"
            @change.stop="handleInlineRoleUpdate(member, ($event.target as HTMLSelectElement).value)"
            :disabled="roleUpdatingUserId === member._id || !canUpdateUsers"
            class="appearance-none cursor-pointer text-[11px] font-semibold uppercase tracking-wide pl-2.5 pr-6 py-1.5 rounded-lg border border-border bg-card text-accent hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 transition-all"
          >
            <option v-for="role in allRoles" :key="role._id" :value="role._id">{{ role.title }}</option>
          </select>
          <i v-if="roleUpdatingUserId === member._id" class="fa-solid fa-spinner animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-accent pointer-events-none"></i>
          <i v-else class="fa-solid fa-chevron-down absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-accent pointer-events-none"></i>
        </div>
      </div>
    </div>

   <!-- ── Pagination ── -->
<div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
  <p class="text-xs text-text-secondary">
    Showing
    <span class="font-medium text-text-primary">{{ rangeStart }}</span>–<span
      class="font-medium text-text-primary">{{ rangeEnd }}</span>
    of
    <span class="font-medium text-text-primary">{{ totalMembers }}</span>
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
          :class="p === page ? 'bg-accent text-white border border-accent' : 'border border-border/50 text-text-secondary hover:text-text-primary hover:border-border'"
        >{{ p }}</button>
      </template>
      <span v-else-if="p === page - 2 || p === page + 2" class="w-8 h-8 flex items-center justify-center text-xs text-text-secondary">…</span>
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
    <!-- ── Info card ── -->
    <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
      <p class="text-xs text-blue-500 flex items-start gap-2">
        <i class="fa-solid fa-circle-info mt-0.5 shrink-0"></i>
        <span>
          Members get a workspace account under <strong>{{ orgDomainSuffix }}</strong>.
          Manage roles in <strong>Role Management</strong>.
        </span>
      </p>
    </div>
  </div>

  <!-- ══ STATUS CONFIRM MODAL ══ -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div
        v-if="showStatusModal && statusModalMember"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="showStatusModal = false"
      >
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95 translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0" appear>
          <div class="w-full max-w-sm bg-bg-body rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div
              class="px-6 pt-6 pb-5"
              :class="statusModalMember.membership_status === 'active' ? 'bg-gradient-to-br from-yellow-500/8 to-bg-body' : 'bg-gradient-to-br from-green-500/8 to-bg-body'"
            >
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border"
                :class="statusModalMember.membership_status === 'active' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'"
              >
                <i class="text-xl" :class="statusModalMember.membership_status === 'active' ? 'fa-solid fa-ban text-yellow-500' : 'fa-solid fa-circle-check text-green-500'"></i>
              </div>
              <h3 class="text-base font-bold text-text-primary">
                {{ statusModalMember.membership_status === 'active' ? 'Deactivate member?' : 'Activate member?' }}
              </h3>
              <p class="text-sm text-text-secondary mt-1 leading-relaxed">
                <template v-if="statusModalMember.membership_status === 'active'">
                  <strong class="text-text-primary">{{ statusModalMember.u_full_name }}</strong> will lose access to all organization resources. You can re-activate them anytime.
                </template>
                <template v-else>
                  <strong class="text-text-primary">{{ statusModalMember.u_full_name }}</strong> will regain access to the organization and all assigned resources.
                </template>
              </p>
            </div>
            <div class="px-6 pb-5">
              <div class="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-bg-card/50">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 overflow-hidden">
                  <img v-if="statusModalMember.u_profile_image" :src="statusModalMember.u_profile_image" class="w-full h-full object-cover" />
                  <span v-else>{{ getInitials(statusModalMember.u_full_name) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-text-primary truncate">{{ statusModalMember.u_full_name }}</p>
                  <p class="text-xs text-text-secondary truncate">{{ statusModalMember.u_email }}</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" :class="getStatusBadgeClass(statusModalMember.membership_status)">
                  {{ statusModalMember.membership_status }}
                </span>
              </div>
            </div>
            <div class="px-6 pb-5 flex gap-3">
              <button @click="showStatusModal = false" class="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-bg-card transition-all">Cancel</button>
              <button
                @click="handleStatusConfirm"
                :disabled="togglingUserId === statusModalMember._id"
                class="flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                :class="statusModalMember.membership_status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'"
              >
                <i v-if="togglingUserId === statusModalMember._id" class="fa-solid fa-spinner animate-spin text-xs"></i>
                <i v-else-if="statusModalMember.membership_status === 'active'" class="fa-solid fa-ban text-xs"></i>
                <i v-else class="fa-solid fa-circle-check text-xs"></i>
                {{ togglingUserId === statusModalMember._id ? 'Processing…' : statusModalMember.membership_status === 'active' ? 'Yes, deactivate' : 'Yes, activate' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ INVITE LINK MODAL ══ -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showInviteLinkModal" class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4" @click.self="showInviteLinkModal = false">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95 translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0" appear>
          <div class="w-full max-w-lg rounded-2xl border border-border/50 bg-bg-dropdown shadow-2xl overflow-hidden">
            <div class="px-6 pt-6">
              <div class="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <i class="fa-solid fa-link text-accent text-xl"></i>
              </div>
              <h3 class="text-xl font-bold text-text-primary">Invite teammates</h3>
              <p class="text-sm text-text-secondary mt-2 leading-relaxed">Share this secure invite link with your team.</p>
            </div>
            <div class="px-6 py-5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block mb-2">Invite link</label>
              <div class="flex items-stretch rounded-xl border border-border/60 bg-bg-body/60 overflow-hidden">
                <input :value="inviteLink" readonly class="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-text-primary outline-none" />
                <button @click="copyInviteLink" class="px-4 border-l border-border/60 bg-bg-card hover:bg-accent/5 transition-all flex items-center gap-2 text-sm font-semibold text-text-primary cursor-pointer">
                  <i :class="inviteLinkCopied ? 'fa-solid fa-check text-green-500' : 'fa-regular fa-copy'" class="text-xs"></i>
                  {{ inviteLinkCopied ? 'Copied' : 'Copy' }}
                </button>
              </div>
              <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0">
                <div v-if="inviteLinkCopied" class="mt-3 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
                  <i class="fa-solid fa-circle-check text-green-500 text-xs"></i>
                  <p class="text-xs font-medium text-green-600">Invite link copied to clipboard.</p>
                </div>
              </Transition>
            </div>
            <div class="px-6 py-4 border-t border-border/40 flex items-center justify-end gap-3">
              <button @click="showInviteLinkModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-border/60 hover:bg-bg-card transition-all cursor-pointer">Close</button>
              <button @click="copyInviteLink" class="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all cursor-pointer flex items-center gap-2">
                <i class="fa-regular fa-copy text-xs"></i> Copy link
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ CREATE MEMBER MODAL ══ -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95 translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0">
          <div v-if="showCreateModal" class="w-full max-w-md bg-bg-body rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div class="px-6 py-5 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-text-primary">Add team member</h2>
                <p class="text-xs text-text-secondary mt-0.5">Create a workspace account on your domain</p>
              </div>
              <button @click="closeCreateModal" class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <div class="px-6 py-5 space-y-4">
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Full name <span class="text-red-500">*</span></label>
                <input v-model="createForm.u_full_name" placeholder="Jane Doe" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" :class="{ 'border-red-500/60': createErrors.u_full_name }" @input="onNameInput" @blur="validateCreateForm" />
                <p v-if="createErrors.u_full_name" class="text-[11px] text-red-500 mt-1">{{ createErrors.u_full_name }}</p>
              </div>
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Workspace email <span class="text-red-500">*</span></label>
                <div v-if="hasOrgDomain" class="flex items-center border rounded-lg overflow-hidden transition-all" :class="createErrors.emailPrefix ? 'border-red-500/60' : 'border-border/60 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10'">
                  <input
                    :value="createForm.emailPrefix"
                    placeholder="jane.doe"
                    class="flex-1 px-3.5 py-2.5 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
                    @blur="validateCreateForm"
                    @input="createForm.emailPrefix = ($event.target as HTMLInputElement).value"
                  />
                  <span class="px-3 py-2.5 text-sm text-text-secondary bg-bg-card/60 border-l border-border/40 shrink-0 font-mono whitespace-nowrap">@{{ orgDomainSuffix }}</span>
                </div>
                <input
                  v-else
                  :value="createForm.emailPrefix"
                  placeholder="jane.doe"
                  class="flex-1 px-3.5 py-2.5 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
                  @blur="validateCreateForm"
                  @input="createForm.emailPrefix = ($event.target as HTMLInputElement).value"
                />
                <p v-if="createErrors.emailPrefix" class="text-[11px] text-red-500 mt-1">{{ createErrors.emailPrefix }}</p>
                <p v-else class="text-[11px] text-text-secondary mt-1">Full email: <span class="font-mono text-accent">{{ fullEmail }}</span></p>
              </div>
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Temporary password <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="createForm.u_password" :type="showPassword ? 'text' : 'password'" placeholder="Min 6 characters" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" :class="{ 'border-red-500/60': createErrors.u_password }" @blur="validateCreateForm" />
                  <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-xs"></i>
                  </button>
                </div>
                <p v-if="createErrors.u_password" class="text-[11px] text-red-500 mt-1">{{ createErrors.u_password }}</p>
                <div v-if="createForm.u_password" class="flex items-center gap-2 mt-1.5">
                  <div class="flex gap-1 flex-1">
                    <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-all" :class="passwordStrength >= i ? passwordStrengthColor : 'bg-border/40'"></div>
                  </div>
                  <span class="text-[10px] font-medium" :class="passwordStrengthTextColor">{{ passwordStrengthLabel }}</span>
                </div>
              </div>
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Job title <span class="text-text-secondary font-normal normal-case">(optional)</span></label>
                <input v-model="createForm.u_job_title" placeholder="e.g. Software Engineer" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" />
              </div>
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                  Role <span class="text-text-secondary font-normal normal-case">(default: {{ defaultRoleName }})</span>
                </label>
                <div class="relative">
                  <select
                    v-model="createForm.company_role_id"
                    class="w-full appearance-none border border-border/60 bg-bg-body/80 rounded-lg pl-3.5 pr-8 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer text-text-primary"
                  >
                    <option v-for="role in allRoles" :key="role._id" :value="role._id">
                      {{ role.title }}
                    </option>
                  </select>
                  <i class="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60 text-[10px] pointer-events-none"></i>
                </div>
                <p class="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1.5">
                  <i class="fa-solid fa-shield-halved text-accent text-[10px]"></i>
                  Manage role permissions in <strong class="text-text-primary">Role Management</strong>.
                </p>
              </div>
              <div v-if="createServerError" class="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-xs mt-0.5 shrink-0"></i>
                <p class="text-xs text-red-500">{{ createServerError }}</p>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-border/50 flex gap-3">
              <button @click="closeCreateModal" class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all">Cancel</button>
              <button @click="handleCreate" :disabled="isCreating || !isCreateFormValid" class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <i v-if="isCreating" class="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>{{ isCreating ? 'Creating…' : 'Create account' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ EDIT MEMBER MODAL ══ -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100">
      <div v-if="showEditModal && editingMember" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeEditModal">
        <div class="w-full max-w-md bg-bg-body rounded-2xl border border-border shadow-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-border/50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-xs font-bold text-accent overflow-hidden flex-shrink-0">
                <img v-if="editingMember.u_profile_image" :src="editingMember.u_profile_image" class="w-full h-full object-cover" />
                <span v-else>{{ getInitials(editingMember.u_full_name) }}</span>
              </div>
              <div>
                <h2 class="text-sm font-bold text-text-primary">Edit member</h2>
                <p class="text-[11px] text-text-secondary">{{ editingMember.u_email }}</p>
              </div>
            </div>
            <button @click="closeEditModal" class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Full name</label>
              <input v-model="editForm.u_full_name" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Job title</label>
              <input v-model="editForm.u_job_title" placeholder="e.g. Designer" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Department</label>
              <input v-model="editForm.u_department" placeholder="e.g. Engineering" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" />
            </div>
            <div class="pt-1">
              <button type="button" @click="showResetPassword = !showResetPassword" class="text-xs text-accent hover:underline flex items-center gap-1.5">
                <i class="fa-solid fa-key text-[10px]"></i>
                {{ showResetPassword ? 'Cancel password reset' : 'Reset password' }}
              </button>
              <div v-if="showResetPassword" class="mt-2.5">
                <div class="relative">
                  <input v-model="editForm.u_password" :type="showEditPassword ? 'text' : 'password'" placeholder="New password (min 6 chars)" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" :class="{ 'border-red-500/60': editErrors.u_password }" />
                  <button type="button" @click="showEditPassword = !showEditPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
                    <i :class="showEditPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </button>
                </div>
                <p v-if="editErrors.u_password" class="text-[11px] text-red-500 mt-1">{{ editErrors.u_password }}</p>
              </div>
            </div>
            <div v-if="editServerError" class="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <i class="fa-solid fa-circle-exclamation text-red-500 text-xs mt-0.5 shrink-0"></i>
              <p class="text-xs text-red-500">{{ editServerError }}</p>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-border/50 flex gap-3">
            <button @click="closeEditModal" class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all">Cancel</button>
            <button @click="handleEdit" :disabled="isEditing" class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <i v-if="isEditing" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <span>{{ isEditing ? 'Saving…' : 'Save changes' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ REMOVE CONFIRM MODAL ══ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeactivateConfirm && deactivatingMember"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showDeactivateConfirm = false"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          appear
        >
          <div class="w-full max-w-sm bg-bg-body rounded-2xl border border-border shadow-2xl overflow-hidden">
            <!-- Top section with gradient -->
            <div class="px-6 pt-6 pb-5 bg-gradient-to-br from-red-500/8 to-bg-body">
              <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <i class="fa-solid fa-trash-can text-red-500 text-xl"></i>
              </div>
              <h3 class="text-base font-bold text-text-primary">Remove member?</h3>
              <p class="text-sm text-text-secondary mt-1 leading-relaxed">
                <strong class="text-text-primary">{{ deactivatingMember.u_full_name }}</strong>
                will be removed from the organization and lose access to all resources.
              </p>
            </div>
            <!-- Member preview card -->
            <div class="px-6 pb-5">
              <div class="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-bg-card/50">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 overflow-hidden">
                  <img v-if="deactivatingMember.u_profile_image" :src="deactivatingMember.u_profile_image" class="w-full h-full object-cover" />
                  <span v-else>{{ getInitials(deactivatingMember.u_full_name) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-text-primary truncate">{{ deactivatingMember.u_full_name }}</p>
                  <p class="text-xs text-text-secondary truncate">{{ deactivatingMember.u_email }}</p>
                </div>
                <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" :class="getStatusBadgeClass(deactivatingMember.membership_status)">
                  {{ deactivatingMember.membership_status }}
                </span>
              </div>
            </div>
            <!-- Actions -->
            <div class="px-6 pb-5 flex gap-3">
              <button
                @click="showDeactivateConfirm = false"
                class="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-bg-card transition-all"
              >
                Cancel
              </button>
              <button
                @click="handleDeactivate"
                :disabled="isDeactivating"
                class="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <i v-if="isDeactivating" class="fa-solid fa-spinner animate-spin text-xs"></i>
                <i v-else class="fa-solid fa-trash-can text-xs"></i>
                {{ isDeactivating ? 'Removing…' : 'Yes, remove' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  useCompanyUsers,
  useCreateCompanyUser,
  useUpdateCompanyUser,
  useDeactivateCompanyUser,
  useToggleCompanyUserActive,
  type CompanyUser,
} from '../../../queries/useCompanyUsers'
import { useCompanyRolesWithoutPermission } from '../../../queries/useCommon'

type MembershipStatus =
  | 'active'
  | 'deactivated'
  | 'suspended'
  | 'invited'
  | 'pending'
  | 'pending_super_admin_otp'

interface Permission {
  _id: string; slug: string; title: string; description: string; action: string; category: string; scope: string;
}

interface CompanyRole {
  _id: string; title: string; slug: string; description: string; company_id: string | null;
  is_admin: boolean; is_editor: boolean; is_viewer: boolean; is_system: boolean; is_trash: boolean;
  permissions: Permission[]; created_at: string;
}

// ─── Props ────────────────────────────────────────────────────
const props = defineProps<{ profile?: any }>()

// ─── Roles ────────────────────────────────────────────────────
const { data: rolesData } = useCompanyRolesWithoutPermission()
const allRoles = computed<CompanyRole[]>(() => {
  const raw = rolesData.value?.data ?? rolesData.value ?? []
  return Array.isArray(raw) ? raw : []
})

const defaultRole = computed(() =>
  allRoles.value.find(r => r.slug?.toLowerCase().includes('viewer') || r.title?.toLowerCase().includes('viewer'))
  ?? allRoles.value.find(r => !r.is_admin)
  ?? allRoles.value[0]
  ?? null
)
const defaultRoleName = computed(() => defaultRole.value?.title ?? 'Viewer')

// ─── Company context ──────────────────────────────────────────
const companyId = computed<string>(() => {
  const profileVal = props.profile
  if (profileVal?.data?.active_company_id) return profileVal.data.active_company_id
  if (profileVal?.active_company_id) return profileVal.active_company_id
  if (profileVal?.data?.active_company?._id) return profileVal.data.active_company._id
  if (profileVal?.active_company?._id) return profileVal.active_company._id
  return localStorage.getItem('company_id') || ''
})

const activeCompany = computed(() =>
  props.profile?.data?.active_company
  ?? props.profile?.active_company
  ?? props.profile?.data?.companies
  ?? props.profile?.companies
  ?? null
)

const hasSuperAdmin = computed(() => activeCompany.value?.has_super_admin ?? false)

const orgDomainSuffix = computed<string>(() => {
  const domainLink = activeCompany.value?.custom_domain ?? ''
  if (!domainLink) return ''
  try { return new URL(domainLink).hostname } catch { return domainLink.replace(/^https?:\/\//, '') }
})

const inviteLink = computed<string>(() => activeCompany.value?.join_link ?? '')
const hasOrgDomain = computed(() => !!activeCompany.value?.custom_domain)

const membershipRole = computed<string>(() => {
  const role =
    activeCompany.value?.membership_role
    ?? props.profile?.data?.membership_role
    ?? props.profile?.membership_role
    ?? ''
  return role.toString().toLowerCase().replace(/-/g, '_').trim()
})

const permissions = computed<string[]>(() => activeCompany.value?.permissions ?? [])

function hasPerm(p: string): boolean {
  return permissions.value.includes(p)
}

const isSuperAdminOrOwner = computed(() => {
  const role = membershipRole.value
  return (
    role === 'owner' ||
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'editor' ||
    activeCompany.value?.role?.is_admin === true ||
    activeCompany.value?.user_role?.is_admin === true
  )
})

const canCreateUsers = computed(() =>
  isSuperAdminOrOwner.value || hasPerm('company_user.create')
)
const canUpdateUsers = computed(() =>
  isUserVerified.value && (isSuperAdminOrOwner.value || hasPerm('company_user.update'))
)
const canDeleteUsers = computed(() =>
  isUserVerified.value && (isSuperAdminOrOwner.value || hasPerm('company_user.delete'))
)

const owner = computed(() => members.value.find((m) => m.is_owner))
const isSuperAdminActive = computed(() => owner.value?.membership_status === 'active')

const isUserVerified = computed(() => {
  const profileVal = props.profile
  const raw = profileVal?.data ?? profileVal

  if (
    owner.value?.membership_status === 'active' &&
    activeCompany.value?.membership_status !== 'pending_super_admin_otp'
  ) return true

  const checks = [
    raw?.isUserVerified, raw?.is_verified, raw?.u_verified, raw?.u_is_verfied,
    profileVal?.isUserVerified, profileVal?.is_verified, profileVal?.u_verified, profileVal?.u_is_verfied,
    activeCompany.value?.isUserVerified,
  ]
  if (checks.some(v => v === true || v === 'true')) return true

  if (isSuperAdminOrOwner.value) return true

  return false
})

function isSuperAdminMember(member: CompanyUser): boolean {
  if (member.is_owner) return true
  const role = allRoles.value.find((r: CompanyRole) => r._id === member.company_role_id)
  if (!role) return false
  const slug  = role.slug?.toLowerCase()  || ''
  const title = role.title?.toLowerCase() || ''
  return slug.includes('super') || title === 'super admin'
}

const BULK_SELECTABLE_STATUSES: MembershipStatus[] = ['active', 'deactivated', 'suspended']

function isBulkSelectable(member: CompanyUser): boolean {
  return (
    !isSuperAdminMember(member) &&
    BULK_SELECTABLE_STATUSES.includes(member.membership_status as MembershipStatus)
  )
}

// ─── Members data (unchanged) ─────────────────────────────────
const companyUsersParams = computed(() => ({
  company_id:      companyId.value,
  membership_role: '',
  per_page:        1000, // fetch all — API doesn't support search
}))

const { data: usersData, isLoading } = useCompanyUsers(companyUsersParams)

const members = computed<CompanyUser[]>(() => {
  const raw = usersData.value?.data?.users ?? usersData.value?.users ?? []
  return Array.isArray(raw) ? raw : []
})

const isViewer = computed(() => membershipRole.value === 'viewer')
const canAct   = computed(() => !isViewer.value)

// ─── Filters ──────────────────────────────────────────────────
const searchQuery  = ref('')
const statusFilter = ref('')
const roleFilter   = ref('')

// Runs over ALL members (full dataset), not just current page
const filteredMembers = computed(() =>
  members.value.filter((m) => {
    const q           = searchQuery.value.toLowerCase()
    const matchSearch = !q || m.u_full_name.toLowerCase().includes(q) || m.u_email.toLowerCase().includes(q)
    const matchStatus = !statusFilter.value || m.membership_status === statusFilter.value
    const matchRole   = !roleFilter.value   || m.company_role_id   === roleFilter.value
    return matchSearch && matchStatus && matchRole
  })
)

// ─── Pagination (API-meta aware) ──────────────────────────────
const page     = ref(1)
const pageSize = ref(20) // must match your API's per_page default
watch([searchQuery, statusFilter, roleFilter], () => { page.value = 1 })

// Read total from API response meta; fall back to filtered count
// for when the API doesn't return pagination meta
// const apiTotal   = computed<number>(() =>
//   usersData.value?.data?.total   ??
//   usersData.value?.total         ??
//   filteredMembers.value.length
// )
// const apiPerPage = computed<number>(() =>
//   usersData.value?.data?.per_page ??
//   usersData.value?.per_page       ??
//   pageSize.value
// )
const totalMembers = computed<number>(() => filteredMembers.value.length)
const totalPages   = computed(() => Math.max(1, Math.ceil(totalMembers.value / pageSize.value)))

// Slice filtered results for current page
const paginatedMembers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredMembers.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() => totalMembers.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1)
const rangeEnd   = computed(() => Math.min(page.value * pageSize.value, totalMembers.value))

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
}

// ─── Bulk select ──────────────────────────────────────────────
const bulkSelectedIds    = ref<string[]>([])
const bulkActionLoading  = ref(false)
const selectedBulkAction = ref<'activate' | 'deactivate' | null>(null)

const currentPageIds = computed(() =>
  paginatedMembers.value.filter(isBulkSelectable).map((m) => m._id)
)
const isBulkAllSelected = computed(() =>
  currentPageIds.value.length > 0 &&
  currentPageIds.value.every((id) => bulkSelectedIds.value.includes(id))
)
const isPartiallySelected = computed(() =>
  currentPageIds.value.some((id) => bulkSelectedIds.value.includes(id)) && !isBulkAllSelected.value
)

function toggleBulkMember(id: string) {
  const member = paginatedMembers.value.find(m => m._id === id)
  if (!member || !isBulkSelectable(member)) return
  const idx = bulkSelectedIds.value.indexOf(id)
  bulkSelectedIds.value = idx === -1
    ? [...bulkSelectedIds.value, id]
    : bulkSelectedIds.value.filter((i) => i !== id)
}

function toggleBulkSelectAll() {
  if (isBulkAllSelected.value) {
    bulkSelectedIds.value = bulkSelectedIds.value.filter((id) => !currentPageIds.value.includes(id))
  } else {
    bulkSelectedIds.value = Array.from(new Set([...bulkSelectedIds.value, ...currentPageIds.value]))
  }
}

function clearBulkSelection() { bulkSelectedIds.value = [] }

watch([page, searchQuery, statusFilter, roleFilter], () => { bulkSelectedIds.value = [] })

// ─── Mutations ────────────────────────────────────────────────
const togglingUserId = ref<string | null>(null)

const { mutate: toggleActive } = useToggleCompanyUserActive(companyId.value, {
  onSuccess: (data: any) => { toast.success((data?.data ?? data)?.message || 'Status updated'); togglingUserId.value = null },
  onError:   (error: any) => { toast.error(error?.response?.data?.message || 'Failed to update status'); togglingUserId.value = null },
})

const { mutate: deactivateUser } = useDeactivateCompanyUser(companyId.value, {
  onSuccess: (data: any) => {
    toast.success((data?.data ?? data)?.message || 'Member removed')
    showDeactivateConfirm.value = false
    deactivatingMember.value    = null
    isDeactivating.value        = false
    // Step back if we just emptied the last page
    if (paginatedMembers.value.length === 1 && page.value > 1) {
      page.value--
    }
  },
  onError: (error: any) => {
    toast.error(error?.response?.data?.message || 'Failed to remove member')
    isDeactivating.value = false
  },
})

// ─── Bulk activate ────────────────────────────────────────────
async function handleBulkActivate() {
  if (!isUserVerified.value) { toast.error('Verify user first'); return }
  const eligibleIds = bulkSelectedIds.value.filter(id => {
    const m = members.value.find(m => m._id === id)
    return m && (['deactivated', 'suspended'] as MembershipStatus[]).includes(m.membership_status as MembershipStatus)
  })
  if (!eligibleIds.length) { toast.error('No eligible members to activate'); return }
  selectedBulkAction.value = 'activate'
  bulkActionLoading.value  = true
  try {
    await Promise.all(eligibleIds.map(id => new Promise<void>((res, rej) => toggleActive(id, { onSuccess: () => res(), onError: rej }))))
    toast.success(`${eligibleIds.length} member(s) activated.`)
    clearBulkSelection()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to activate members.')
  } finally {
    bulkActionLoading.value  = false
    selectedBulkAction.value = null
  }
}

// ─── Bulk deactivate ──────────────────────────────────────────
async function handleBulkDeactivate() {
  if (!isUserVerified.value) { toast.error('Verify user first'); return }
  const eligibleIds = bulkSelectedIds.value.filter(id => {
    const m = members.value.find(m => m._id === id)
    return m && (m.membership_status as MembershipStatus) === 'active'
  })
  if (!eligibleIds.length) { toast.error('No eligible members to deactivate'); return }
  selectedBulkAction.value = 'deactivate'
  bulkActionLoading.value  = true
  try {
    await Promise.all(eligibleIds.map(id => new Promise<void>((res, rej) => deactivateUser(id, { onSuccess: () => res(), onError: rej }))))
    toast.success(`${eligibleIds.length} member(s) deactivated.`)
    clearBulkSelection()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to deactivate members.')
  } finally {
    bulkActionLoading.value  = false
    selectedBulkAction.value = null
  }
}

// ─── Inline role update ───────────────────────────────────────
const roleUpdatingUserId = ref<string | null>(null)

const { mutate: updateUser } = useUpdateCompanyUser(companyId.value, {
  onSuccess: (data: any) => { toast.success((data?.data ?? data)?.message || 'Role updated'); roleUpdatingUserId.value = null },
  onError:   (error: any) => { toast.error(error?.response?.data?.message || 'Failed to update role'); roleUpdatingUserId.value = null },
})

function handleInlineRoleUpdate(member: CompanyUser, roleId: string) {
  if (!canUpdateUsers.value) { toast.error('No permission to update roles'); return }
  if (!roleId || member.company_role_id === roleId) return
  roleUpdatingUserId.value = member._id
  updateUser({ userId: member._id, payload: { company_role_id: roleId } })
}

// ─── Status modal ─────────────────────────────────────────────
const showStatusModal   = ref(false)
const statusModalMember = ref<CompanyUser | null>(null)

function openStatusModal(member: CompanyUser) {
  if (!canUpdateUsers.value) { toast.error('No permission to update members'); return }
  statusModalMember.value = member
  showStatusModal.value   = true
}

function handleStatusConfirm() {
  if (!statusModalMember.value) return
  togglingUserId.value = statusModalMember.value._id
  toggleActive(statusModalMember.value._id, {
    onSuccess: (data: any) => {
      toast.success((data?.data ?? data)?.message || 'Status updated')
      togglingUserId.value    = null
      showStatusModal.value   = false
      statusModalMember.value = null
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status')
      togglingUserId.value = null
    },
  })
}

// ─── Helpers ──────────────────────────────────────────────────
function getInitials(name: string): string {
  return (name || '').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getStatusBadgeClass(status: string): string {
  switch (status as MembershipStatus) {
    case 'active':      return 'bg-green-500/10 text-green-600'
    case 'suspended':   return 'bg-yellow-500/10 text-yellow-600'
    case 'deactivated': return 'bg-red-500/10 text-red-500'
    case 'invited':     return 'bg-blue-500/10 text-blue-500'
    case 'pending':     return 'bg-orange-500/10 text-orange-500'
    default:            return 'bg-border/30 text-text-secondary'
  }
}

// ─── Invite link modal ────────────────────────────────────────
const showInviteLinkModal = ref(false)
const inviteLinkCopied    = ref(false)

async function handleCopyInviteLink() { showInviteLinkModal.value = true }
async function copyInviteLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    inviteLinkCopied.value = true
    setTimeout(() => { inviteLinkCopied.value = false }, 2500)
  } catch { toast.error('Could not copy link. Please copy it manually.') }
}

function handleAddMember() {
  if (!canCreateUsers.value) { toast.error('No permission to add members'); return }
  openCreateModal()
}

// ─── Create modal ─────────────────────────────────────────────
const showCreateModal   = ref(false)
const showPassword      = ref(false)
const createServerError = ref('')
const isCreating        = ref(false)

const createForm = ref({
  u_full_name:     '',
  emailPrefix:     '',
  u_password:      '',
  u_job_title:     '',
  company_role_id: '',
})

const createErrors = ref({
  u_full_name: '',
  emailPrefix: '',
  u_password:  '',
})

const fullEmail = computed(() =>
  createForm.value.emailPrefix ? `${createForm.value.emailPrefix}@${orgDomainSuffix.value}` : ''
)

function nameToEmailPrefix(name: string): string {
  return name.trim().toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[@+]/g, '')
    .replace(/[^a-z0-9._-]/g, '')
}

function onNameInput() {
  const currentPrefix   = createForm.value.emailPrefix
  const expectedPrefix  = nameToEmailPrefix(createForm.value.u_full_name.slice(0, -1))
  if (!currentPrefix || currentPrefix === expectedPrefix) {
    createForm.value.emailPrefix = nameToEmailPrefix(createForm.value.u_full_name)
  }
  createErrors.value.u_full_name = ''
}

const passwordStrength = computed(() => {
  const p = createForm.value.u_password
  if (!p) return 0
  let score = 0
  if (p.length >= 6)  score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const passwordStrengthColor     = computed(() => ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][passwordStrength.value - 1] ?? 'bg-red-500')
const passwordStrengthTextColor = computed(() => ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500'][passwordStrength.value - 1] ?? 'text-red-500')
const passwordStrengthLabel     = computed(() => ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength.value - 1] ?? 'Weak')

function validateCreateForm(): boolean {
  let valid = true
  createErrors.value = { u_full_name: '', emailPrefix: '', u_password: '' }
  if (!createForm.value.u_full_name.trim()) { createErrors.value.u_full_name = 'Full name is required'; valid = false }
  if (!createForm.value.emailPrefix.trim()) { createErrors.value.emailPrefix  = 'Email is required';     valid = false }
  if (!createForm.value.u_password)         { createErrors.value.u_password   = 'Password is required';  valid = false }
  else if (createForm.value.u_password.length < 6) { createErrors.value.u_password = 'Minimum 6 characters'; valid = false }
  return valid
}

const isCreateFormValid = computed(() =>
  !!createForm.value.u_full_name.trim() &&
  !!createForm.value.emailPrefix.trim() &&
  createForm.value.u_password.length >= 6 &&
  !createErrors.value.u_full_name &&
  !createErrors.value.emailPrefix &&
  !createErrors.value.u_password
)

function openCreateModal() {
  createForm.value = {
    u_full_name:     '',
    emailPrefix:     '',
    u_password:      '',
    u_job_title:     '',
    company_role_id: defaultRole.value?._id ?? '',
  }
  createErrors.value      = { u_full_name: '', emailPrefix: '', u_password: '' }
  createServerError.value = ''
  showPassword.value      = false
  showCreateModal.value   = true
}

function closeCreateModal() { showCreateModal.value = false }

const { mutate: createUser } = useCreateCompanyUser({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      createServerError.value = payload?.message || 'Something went wrong.'
      isCreating.value = false
      return
    }
    toast.success(payload?.message || 'Member created successfully')
    closeCreateModal()
    isCreating.value = false
  },
  onError: (error: any) => {
    createServerError.value = error?.response?.data?.message || error?.message || 'Failed to create member'
    isCreating.value = false
  },
})

function handleCreate() {
  if (!validateCreateForm()) return
  createServerError.value = ''
  isCreating.value = true
  createUser({
    company_id:      companyId.value,
    u_full_name:     createForm.value.u_full_name.trim(),
    u_email:         fullEmail.value,
    u_password:      createForm.value.u_password,
    company_role_id: createForm.value.company_role_id || defaultRole.value?._id,
    ...(createForm.value.u_job_title ? { u_job_title: createForm.value.u_job_title } : {}),
  })
}

// ─── Edit modal ───────────────────────────────────────────────
const showEditModal     = ref(false)
const showResetPassword = ref(false)
const showEditPassword  = ref(false)
const editingMember     = ref<CompanyUser | null>(null)
const editServerError   = ref('')
const isEditing         = ref(false)
const editForm   = ref({ u_full_name: '', u_job_title: '', u_department: '', u_password: '' })
const editErrors = ref({ u_password: '' })

function openEditModal(member: CompanyUser) {
  editingMember.value = member
  editForm.value = {
    u_full_name:  member.u_full_name,
    u_job_title:  member.u_job_title  ?? '',
    u_department: member.u_department ?? '',
    u_password:   '',
  }
  editErrors.value        = { u_password: '' }
  editServerError.value   = ''
  showResetPassword.value = false
  showEditPassword.value  = false
  showEditModal.value     = true
}

function closeEditModal() { showEditModal.value = false; editingMember.value = null }

const { mutate: updateMember } = useUpdateCompanyUser(companyId.value, {
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      editServerError.value = payload?.message || 'Something went wrong.'
      isEditing.value = false
      return
    }
    toast.success('Member updated successfully')
    closeEditModal()
    isEditing.value = false
  },
  onError: (error: any) => {
    editServerError.value = error?.response?.data?.message || error?.message || 'Failed to update member'
    isEditing.value = false
  },
})

function handleEdit() {
  if (!editingMember.value) return
  if (showResetPassword.value && editForm.value.u_password && editForm.value.u_password.length < 6) {
    editErrors.value.u_password = 'Minimum 6 characters'
    return
  }
  editServerError.value = ''
  isEditing.value = true
  const payload: any = {
    u_full_name:  editForm.value.u_full_name,
    u_job_title:  editForm.value.u_job_title  || undefined,
    u_department: editForm.value.u_department || undefined,
  }
  if (showResetPassword.value && editForm.value.u_password) payload.u_password = editForm.value.u_password
  updateMember({ userId: editingMember.value._id, payload })
}

// ─── Remove modal ─────────────────────────────────────────────
const showDeactivateConfirm = ref(false)
const deactivatingMember    = ref<CompanyUser | null>(null)
const isDeactivating        = ref(false)

function confirmDeactivate(member: CompanyUser) {
  if (!canDeleteUsers.value) { toast.error('No permission to remove members'); return }
  deactivatingMember.value    = member
  showDeactivateConfirm.value = true
}

function handleDeactivate() {
  if (!deactivatingMember.value) return
  isDeactivating.value = true
  deactivateUser(deactivatingMember.value._id)
}

// ─── Bulk action helpers ──────────────────────────────────────
const bulkHasActivatable = computed(() =>
  bulkSelectedIds.value.some(id => {
    const m = members.value.find(m => m._id === id)
    return m && (['deactivated', 'suspended'] as MembershipStatus[]).includes(m.membership_status as MembershipStatus)
  })
)

const bulkHasDeactivatable = computed(() =>
  bulkSelectedIds.value.some(id => {
    const m = members.value.find(m => m._id === id)
    return m && (m.membership_status as MembershipStatus) === 'active'
  })
)
</script>