<template>
  <!-- No access -->
  <div
    v-if="!canManageUsers"
    class="flex flex-col items-center justify-center py-20 text-center"
  >
    <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
      <i class="fa-solid fa-lock text-red-500 text-xl"></i>
    </div>
    <p class="text-sm font-semibold text-text-primary mb-1">Access restricted</p>
    <p class="text-xs text-text-secondary">You don't have permission to manage team members.</p>
  </div>

  <!-- Main -->
  <div v-else class="w-full flex-1 space-y-5">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 class="text-base font-bold text-text-primary flex items-center gap-2">
          <i class="fa-solid fa-users text-accent text-sm"></i>
          Team Members
          <span class="text-[11px] font-medium text-text-secondary bg-bg-card border border-border/50 px-2 py-0.5 rounded-full">
            {{ members.length }}
          </span>
        </h3>
        <p class="text-xs text-text-secondary mt-0.5">
          Manage your organization's workspace accounts.
        </p>
      </div>
      <button
        v-if="canCreateUsers"
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 whitespace-nowrap self-start sm:self-auto"
      >
        <i class="fa-solid fa-user-plus text-xs"></i>
        Add member
      </button>
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
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <i class="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60 text-[10px] pointer-events-none"></i>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="h-[68px] rounded-lg border border-border/30 bg-bg-body/30 animate-pulse"
      ></div>
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
      <div
        v-for="member in filteredMembers"
        :key="member._id"
        class="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/40 bg-bg-body/50 hover:border-border/70 hover:bg-bg-body/80 transition-all group"
      >
        <!-- Avatar -->
        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0 overflow-hidden">
          <img
            v-if="member.u_profile_image"
            :src="member.u_profile_image"
            class="w-full h-full object-cover"
            :alt="member.u_full_name"
          />
          <span v-else>{{ getInitials(member.u_full_name) }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold text-text-primary truncate">{{ member.u_full_name }}</span>
            <span
            class="text-[10px] bg-accent/30 text-accent font-semibold uppercase px-1.5 py-0.5 rounded-full tracking-wide"
            
          >
            {{ member.is_owner ? 'Owner' : member.membership_role }}
          </span>
            <span
              class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              :class="getStatusBadgeClass(member.membership_status)"
            >
              {{ member.membership_status }}
            </span>
          </div>
          <p class="text-xs text-text-secondary truncate mt-0.5">{{ member.u_email }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <!-- Toggle active -->
          <button
            v-if="canUpdateUsers && !member.is_owner"
            @click="handleToggleActive(member)"
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
              :class="member.is_active ? 'fa-solid fa-ban' : 'fa-solid fa-circle-check'"
            ></i>
          </button>

          <!-- Edit -->
          <button
            v-if="canUpdateUsers"
            @click="openEditModal(member)"
            title="Edit member"
            class="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 text-text-secondary hover:text-text-primary hover:border-border transition-all"
          >
            <i class="fa-regular fa-pen text-xs"></i>
          </button>

          <!-- Deactivate / Remove -->
          <button
            v-if="canDeleteUsers && !member.is_owner"
            @click="confirmDeactivate(member)"
            title="Deactivate member"
            class="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all"
          >
            <i class="fa-regular fa-trash text-xs"></i>
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
    <span class="font-medium text-text-primary">{{ Math.min(page * pageSize, totalMembers) }}</span>
    of
    <span class="font-medium text-text-primary">{{ totalMembers }}</span>
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

  <!-- ═══════════════════════════════════════════════════════════════
       CREATE MEMBER MODAL
  ════════════════════════════════════════════════════════════════ -->
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
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeCreateModal"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div
            v-if="showCreateModal"
            class="w-full max-w-xl bg-bg-body rounded-xl border border-border shadow-2xl overflow-hidden"
          >
            <!-- Modal header -->
            <div class="px-6 py-5 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-text-primary">Add team member</h2>
                <p class="text-xs text-text-secondary mt-0.5">
                  Create a workspace account on your domain
                </p>
              </div>
              <button
                @click="closeCreateModal"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <!-- Modal body -->
            <div class="px-6 py-5 space-y-4">

              <!-- Full name -->
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                  Full name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="createForm.u_full_name"
                  placeholder="Jane Doe"
                  class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                  :class="{ 'border-red-500/60': createErrors.u_full_name }"
                  @input="onNameInput"
                  @blur="validateCreateForm"
                />
                <p v-if="createErrors.u_full_name" class="text-[11px] text-red-500 mt-1">
                  {{ createErrors.u_full_name }}
                </p>
              </div>

              <!-- Email — built from name + org domain -->
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                  Workspace email <span class="text-red-500">*</span>
                </label>
                <div
                  class="flex items-center border rounded-lg overflow-hidden transition-all"
                  :class="createErrors.emailPrefix
                    ? 'border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10'
                    : 'border-border/60 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10'"
                >
                  <input
                    v-model="createForm.emailPrefix"
                    placeholder="jane.doe"
                    class="flex-1 px-3.5 py-2.5 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
                    @blur="validateCreateForm"
                  />
                  <span class="px-3 py-2.5 text-sm text-text-secondary bg-bg-card/60 border-l border-border/40 shrink-0 font-mono whitespace-nowrap">
                    @{{ orgDomainSuffix }}
                  </span>
                </div>
                <p v-if="createErrors.emailPrefix" class="text-[11px] text-red-500 mt-1">
                  {{ createErrors.emailPrefix }}
                </p>
                <p v-else class="text-[11px] text-text-secondary mt-1">
                  Full email: <span class="font-mono text-accent">{{ fullEmail }}</span>
                </p>
              </div>

              <!-- Password -->
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                  Temporary password <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="createForm.u_password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Min 6 characters"
                    class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                    :class="{ 'border-red-500/60': createErrors.u_password }"
                    @blur="validateCreateForm"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-xs"></i>
                  </button>
                </div>
                <p v-if="createErrors.u_password" class="text-[11px] text-red-500 mt-1">
                  {{ createErrors.u_password }}
                </p>
                <!-- Password strength -->
                <div v-if="createForm.u_password" class="flex items-center gap-2 mt-1.5">
                  <div class="flex gap-1 flex-1">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="h-1 flex-1 rounded-full transition-all"
                      :class="passwordStrength >= i ? passwordStrengthColor : 'bg-border/40'"
                    ></div>
                  </div>
                  <span class="text-[10px] font-medium" :class="passwordStrengthTextColor">
                    {{ passwordStrengthLabel }}
                  </span>
                </div>
              </div>

              <!-- Job title (optional) -->
              <div>
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">
                  Job title <span class="text-text-secondary font-normal normal-case">(optional)</span>
                </label>
                <input
                  v-model="createForm.u_job_title"
                  placeholder="e.g. Software Engineer"
                  class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                />
              </div>

              <!-- Error banner -->
              <div
                v-if="createServerError"
                class="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <i class="fa-solid fa-circle-exclamation text-red-500 text-xs mt-0.5 shrink-0"></i>
                <p class="text-xs text-red-500">{{ createServerError }}</p>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="px-6 py-4 border-t border-border/50 flex gap-3">
              <button
                @click="closeCreateModal"
                class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
              >
                Cancel
              </button>
              <button
                @click="handleCreate"
                :disabled="isCreating || !isCreateFormValid"
                class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <i v-if="isCreating" class="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>{{ isCreating ? 'Creating…' : 'Create account' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- ═══════════════════════════════════════════════════════════════
       EDIT MEMBER MODAL
  ════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
    >
      <div
        v-if="showEditModal && editingMember"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeEditModal"
      >
        <div class="w-full max-w-lg bg-bg-body rounded-2xl border border-border shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-border/50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center text-xs font-bold text-accent overflow-hidden flex-shrink-0">
                <img
                  v-if="editingMember.u_profile_image"
                  :src="editingMember.u_profile_image"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ getInitials(editingMember.u_full_name) }}</span>
              </div>
              <div>
                <h2 class="text-sm font-bold text-text-primary">Edit member</h2>
                <p class="text-[11px] text-text-secondary">{{ editingMember.u_email }}</p>
              </div>
            </div>
            <button
              @click="closeEditModal"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all"
            >
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Full name</label>
              <input
                v-model="editForm.u_full_name"
                class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>

            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Job title</label>
              <input
                v-model="editForm.u_job_title"
                placeholder="e.g. Designer"
                class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
              />
            </div>

            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-1.5">Department</label>
              <input
                v-model="editForm.u_department"
                placeholder="e.g. Engineering"
                class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
              />
            </div>

            <!-- Reset password section -->
            <div class="pt-1">
              <button
                type="button"
                @click="showResetPassword = !showResetPassword"
                class="text-xs text-accent hover:underline flex items-center gap-1.5"
              >
                <i class="fa-solid fa-key text-[10px]"></i>
                {{ showResetPassword ? 'Cancel password reset' : 'Reset password' }}
              </button>

              <div v-if="showResetPassword" class="mt-2.5">
                <div class="relative">
                  <input
                    v-model="editForm.u_password"
                    :type="showEditPassword ? 'text' : 'password'"
                    placeholder="New password (min 6 chars)"
                    class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:border-accent/60 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                    :class="{ 'border-red-500/60': editErrors.u_password }"
                  />
                  <button
                    type="button"
                    @click="showEditPassword = !showEditPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs"
                  >
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

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-border/50 flex gap-3">
            <button @click="closeEditModal" class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all">
              Cancel
            </button>
            <button
              @click="handleEdit"
              :disabled="isEditing"
              class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i v-if="isEditing" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <span>{{ isEditing ? 'Saving…' : 'Save changes' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ═══════════════════════════════════════════════════════════════
       DEACTIVATE CONFIRM MODAL
  ════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100">
      <div
        v-if="showDeactivateConfirm && deactivatingMember"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showDeactivateConfirm = false"
      >
        <div class="w-full max-w-lg bg-bg-body rounded-2xl border border-border shadow-2xl p-6">
          <div class="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-triangle-exclamation text-red-500"></i>
          </div>
          <h3 class="text-base font-bold text-text-primary text-center mb-1">Deactivate member?</h3>
          <p class="text-xs text-text-secondary text-center mb-5">
            <strong>{{ deactivatingMember.u_full_name }}</strong> will lose access to the organization. This can be reversed.
          </p>
          <div class="flex gap-3">
            <button
              @click="showDeactivateConfirm = false"
              class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
            >
              Cancel
            </button>
            <button
              @click="handleDeactivate"
              :disabled="isDeactivating"
              class="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i v-if="isDeactivating" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <span>{{ isDeactivating ? 'Deactivating…' : 'Deactivate' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import {
  useCompanyUsers,
  useCreateCompanyUser,
  useUpdateCompanyUser,
  useDeactivateCompanyUser,
  useToggleCompanyUserActive,
  type CompanyUser,
} from '../../../queries/useCompanyUsers'

// ─── Props & company context ──────────────────────────────────────────────────

const props = defineProps<{ profile?: any }>()

const companyId = computed<string>(() =>
  localStorage.getItem('company_id') ||  ''
)
const page     = ref(1)
const pageSize = ref(10)

const totalMembers = computed<number>(() =>
  usersData.value?.data?.total ?? usersData.value?.total ?? 0
)

const totalPages = computed(() => Math.ceil(totalMembers.value / pageSize.value))

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
}
const activeCompany = computed(() => props.profile?.active_company)

// ─── Org domain suffix (e.g. "abc.orchit.ai") ─────────────────────────────────

const orgDomainSuffix = computed<string>(() => {
  const domainLink: string = activeCompany.value?.domain_link ?? ''
  if (!domainLink) return 'yourcompany.orchit.ai'
  try {
    return new URL(domainLink).hostname
  } catch {
    return domainLink.replace(/^https?:\/\//, '')
  }
})

// ─── Permissions ──────────────────────────────────────────────────────────────

const membershipRole = computed(() => activeCompany.value?.membership_role ?? '')
const permissions = computed<string[]>(() => activeCompany.value?.permissions ?? [])

const isOwner = computed(() => membershipRole.value === 'owner')
function can(p: string) { return permissions.value.includes(p) }

const canManageUsers = computed(() =>
  isOwner.value || can('company_user.create') || can('company_user.update') ||
  can('company_user.delete') || can('company_user.read')
)
const canCreateUsers  = computed(() => isOwner.value || can('company_user.create'))
const canUpdateUsers  = computed(() => isOwner.value || can('company_user.update'))
const canDeleteUsers  = computed(() => isOwner.value || can('company_user.delete'))

// ─── Data ─────────────────────────────────────────────────────────────────────

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
    const matchSearch = !q ||
      m.u_full_name.toLowerCase().includes(q) ||
      m.u_email.toLowerCase().includes(q)
    const matchStatus = !statusFilter.value || m.membership_status === statusFilter.value
    const matchRole   = !roleFilter.value   || m.membership_role   === roleFilter.value
    return matchSearch && matchStatus && matchRole
  })
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active':      return 'bg-green-500/10 text-green-500'
    case 'suspended':   return 'bg-yellow-500/10 text-yellow-500'
    case 'deactivated': return 'bg-red-500/10 text-red-400'
    default:            return 'bg-border/30 text-text-secondary'
  }
}

// ─── Email helpers ────────────────────────────────────────────────────────────

function nameToEmailPrefix(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
}

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────

const showCreateModal  = ref(false)
const showPassword     = ref(false)
const createServerError = ref('')
const isCreating       = ref(false)

const createForm = ref({
  u_full_name:  '',
  emailPrefix:  '',
  u_password:   '',
  u_job_title:  '',
})

const createErrors = ref({
  u_full_name:  '',
  emailPrefix:  '',
  u_password:   '',
})

const fullEmail = computed(() =>
  createForm.value.emailPrefix
    ? `${createForm.value.emailPrefix}@${orgDomainSuffix.value}`
    : ''
)

// Auto-fill email prefix when user types name
function onNameInput() {
  if (!createForm.value.emailPrefix || createForm.value.emailPrefix === nameToEmailPrefix(createForm.value.u_full_name.slice(0, -1))) {
    createForm.value.emailPrefix = nameToEmailPrefix(createForm.value.u_full_name)
  }
  createErrors.value.u_full_name = ''
}

// Password strength
const passwordStrength = computed(() => {
  const p = createForm.value.u_password
  if (!p) return 0
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const passwordStrengthColor = computed(() => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  return colors[passwordStrength.value - 1] ?? 'bg-red-500'
})

const passwordStrengthTextColor = computed(() => {
  const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500']
  return colors[passwordStrength.value - 1] ?? 'text-red-500'
})

const passwordStrengthLabel = computed(() => {
  return ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength.value - 1] ?? 'Weak'
})

function validateCreateForm() {
  let valid = true
  createErrors.value = { u_full_name: '', emailPrefix: '', u_password: '' }

  if (!createForm.value.u_full_name.trim()) {
    createErrors.value.u_full_name = 'Full name is required'
    valid = false
  }

  if (!createForm.value.emailPrefix.trim()) {
    createErrors.value.emailPrefix = 'Email prefix is required'
    valid = false
  } else if (!/^[a-z0-9._-]+$/.test(createForm.value.emailPrefix)) {
    createErrors.value.emailPrefix = 'Only lowercase letters, numbers, dots, and hyphens'
    valid = false
  }

  if (!createForm.value.u_password) {
    createErrors.value.u_password = 'Password is required'
    valid = false
  } else if (createForm.value.u_password.length < 6) {
    createErrors.value.u_password = 'Minimum 6 characters'
    valid = false
  }

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
  createForm.value = { u_full_name: '', emailPrefix: '', u_password: '', u_job_title: '' }
  createErrors.value = { u_full_name: '', emailPrefix: '', u_password: '' }
  createServerError.value = ''
  showPassword.value = false
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

const { mutate: createUser } = useCreateCompanyUser({
  onSuccess: (data) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      createServerError.value = payload?.message || 'Something went wrong.'
      isCreating.value = false
      return
    }
    toast.success(payload?.message || 'Member account created successfully')
    closeCreateModal()
    isCreating.value = false
  },
  onError: (error: any) => {
    createServerError.value =
      error?.response?.data?.message || error?.message || 'Failed to create member'
    isCreating.value = false
  },
})

function handleCreate() {
  if (!validateCreateForm()) return
  createServerError.value = ''
  isCreating.value = true

  createUser({
    company_id:  companyId.value,
    u_full_name: createForm.value.u_full_name.trim(),
    u_email:     fullEmail.value,
    u_password:  createForm.value.u_password,
    ...(createForm.value.u_job_title ? { u_job_title: createForm.value.u_job_title } : {}),
  })
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

const showEditModal    = ref(false)
const showResetPassword = ref(false)
const showEditPassword = ref(false)
const editingMember    = ref<CompanyUser | null>(null)
const editServerError  = ref('')
const isEditing        = ref(false)

const editForm = ref({
  u_full_name:  '',
  u_job_title:  '',
  u_department: '',
  u_password:   '',
})

const editErrors = ref({ u_password: '' })

function openEditModal(member: CompanyUser) {
  editingMember.value = member
  editForm.value = {
    u_full_name:  member.u_full_name,
    u_job_title:  member.u_job_title ?? '',
    u_department: member.u_department ?? '',
    u_password:   '',
  }
  editErrors.value = { u_password: '' }
  editServerError.value = ''
  showResetPassword.value = false
  showEditPassword.value = false
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingMember.value = null
}

const { mutate: updateUser } = useUpdateCompanyUser(companyId.value, {
  onSuccess: (data) => {
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
    editServerError.value =
      error?.response?.data?.message || error?.message || 'Failed to update member'
    isEditing.value = false
  },
})

function handleEdit() {
  if (!editingMember.value) return

  if (showResetPassword.value && editForm.value.u_password.length > 0 && editForm.value.u_password.length < 6) {
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

  if (showResetPassword.value && editForm.value.u_password) {
    payload.u_password = editForm.value.u_password
  }

  updateUser({ userId: editingMember.value._id, payload })
}

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────

const togglingUserId = ref<string | null>(null)

const { mutate: toggleActive } = useToggleCompanyUserActive(companyId.value, {
  onSuccess: (data) => {
    const payload = data?.data ?? data
    toast.success(payload?.message || 'Status updated')
    togglingUserId.value = null
  },
  onError: (error: any) => {
    toast.error(error?.response?.data?.message || 'Failed to update status')
    togglingUserId.value = null
  },
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
  onSuccess: (data) => {
    const payload = data?.data ?? data
    toast.success(payload?.message || 'Member deactivated')
    showDeactivateConfirm.value = false
    deactivatingMember.value = null
    isDeactivating.value = false
  },
  onError: (error: any) => {
    toast.error(error?.response?.data?.message || 'Failed to deactivate member')
    isDeactivating.value = false
  },
})

function confirmDeactivate(member: CompanyUser) {
  deactivatingMember.value = member
  showDeactivateConfirm.value = true
}

function handleDeactivate() {
  if (!deactivatingMember.value) return
  isDeactivating.value = true
  deactivateUser(deactivatingMember.value._id)
}
</script>