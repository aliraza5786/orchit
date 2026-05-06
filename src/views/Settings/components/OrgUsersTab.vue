<template>
  <div class="w-full space-y-6 flex-1"  v-if="canManageUsers">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <i class="fa-solid fa-users text-accent"></i>
          Team Members
        </h3>
        <p class="text-sm text-text-secondary mt-1">Manage team members and their permissions.</p>
      </div>
      <button
      v-if="canInviteUsers"
        @click="showInviteModal = true"
        class="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 whitespace-nowrap self-start sm:self-auto"
      >
        <i class="fa-solid fa-user-plus mr-2"></i> Invite member
      </button>
    </div>

    <!-- Search and Filter -->
    <!-- Search and Filter -->
<div class="flex flex-col sm:flex-row gap-3">
  <div class="flex-1 relative">
    <input
      v-model="searchQuery"
      placeholder="Search by name or email..."
      class="w-full pl-10 pr-4 py-2.5 border border-border/60 bg-bg-body/80 rounded-lg text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
    />
    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm"></i>
  </div>

  <div class="relative">
    <select
      v-model="roleFilter"
      class="px-4 py-2.5 pr-10 border border-border/60 bg-bg-body/80 rounded-lg text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all appearance-none cursor-pointer"
    >
      <option value="">All roles</option>
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>
    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
  </div>

  <div class="relative">
    <select
      v-model="statusFilter"
      class="px-4 py-2.5 pr-10 border border-border/60 bg-bg-body/80 rounded-lg text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all appearance-none cursor-pointer"
    >
      <option value="">All status</option>
      <option value="active">Active</option>
      <option value="pending">Pending</option>
      <option value="inactive">Inactive</option>
    </select>
    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
  </div>
</div>
    <!-- Empty state -->
    <div
      v-if="filteredMembers.length === 0"
      class="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mb-4">
        <i class="fa-regular fa-users text-accent text-2xl"></i>
      </div>
      <h3 class="text-lg font-bold text-text-primary mb-1">No team members yet</h3>
      <p class="text-sm text-text-secondary mb-6 max-w-xs">
        Invite your team members to collaborate and manage projects together.
      </p>
      <button
       v-if="canInviteUsers"
        @click="showInviteModal = true"
        class="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
      >
        <i class="fa-solid fa-user-plus mr-2"></i> Invite your first member
      </button>
    </div>

    <!-- Members List -->
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        class="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-bg-body/50 hover:border-border/60 transition-all group"
      >
        <!-- Member Info -->
        <div class="flex items-center gap-4 min-w-0 flex-1">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0 overflow-hidden"
          >
            <img
              v-if="member.avatar"
              :src="member.avatar"
              class="w-full h-full object-cover"
              :alt="member.name"
            />
            <span v-else>{{ getInitials(member.name) }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-semibold text-text-primary truncate">{{ member.name }}</h4>
              <span
                v-if="member.status === 'pending'"
                class="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs font-medium rounded-full"
              >
                Pending
              </span>
              <span
                v-else-if="member.status === 'inactive'"
                class="px-2 py-0.5 bg-gray-500/20 text-gray-600 text-xs font-medium rounded-full"
              >
                Inactive
              </span>
            </div>
            <p class="text-sm text-text-secondary truncate">{{ member.email }}</p>
          </div>
        </div>

       <div class="relative">
  <select
   v-if="canUpdateUserRole"
    :value="member.role"
    @change="(e) => updateMemberRole(member.id, (e.target as HTMLSelectElement).value)"
    :disabled="isUpdatingRole"
    class="px-3 py-1.5 pr-8 text-xs font-medium rounded-lg border border-border/60 bg-bg-body/80 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
  >
    <option value="admin">Admin</option>
    <option value="editor">Editor</option>
    <option value="viewer">Viewer</option>
  </select>
  <i class="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
</div>
      </div>
    </div>

    <!-- Invite Modal -->
      <InviteUsers  v-if="canInviteUsers" v-model="showInviteModal" defaultWorkspaceId="abc123" @invited="handleInvited" />
<div v-if="!canViewUsers">
  <p class="text-sm text-text-secondary">You don’t have access to view team members.</p>
</div>
    <!-- Role Info Card -->
    <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 mt-6">
      <p class="text-sm text-blue-600 font-medium flex items-start gap-2">
        <i class="fa-solid fa-shield-halved mt-0.5 text-xs"></i>
        <span>
          <strong>Role Management:</strong> You can customize roles and permissions in the 
          <strong>Roles Management</strong> section.
        </span>
      </p>
    </div>
  </div>
  <div v-else>
  You don’t have access to user management
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useUsers } from '../../../queries/useWorkspace'
import InviteUsers from '../../Workspaces/Modals/InviteUsers.vue'

const companyId = localStorage.getItem('company_id')
const { data: usersData, refetch } = useUsers(companyId)
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
 * Central user management capability
 * Owner always allowed + explicit permission fallback
 */
const canManageUsers = computed(() => {
  return (
    isOwner.value ||
    can('company_user.create') ||
    can('company_user.update') ||
    can('company_user.delete') ||
    can('company_user.read')
  )
})
const canInviteUsers = computed(() =>
  can('company_user.create') || isOwner.value
)
const canUpdateUserRole = computed(() =>
  can('company_user.update') || isOwner.value
)
const canViewUsers = computed(() =>
  can('company_user.read') || isOwner.value
)
// const canDeleteUsers = computed(() =>
//   can('company_user.delete') || isOwner.value
// )
interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  avatar?: string
  joinedDate?: string
}

const members = computed<TeamMember[]>(() => {
  const raw = usersData.value?.data?.users ?? usersData.value?.users ?? []
  return (Array.isArray(raw) ? raw : []).map((u: any) => ({
    id: u._id ?? u.u_email, // some users have null _id, fall back to email
    name: u.u_full_name ?? u.u_email ?? 'Unknown',
    email: u.u_email ?? '',
    role: u.seat_title?.toLowerCase() ?? u.role_title?.toLowerCase() ?? 'viewer',
    status: u.seat_status === 'accepted' ? 'active' : u.invitation_status === 'pending' ? 'pending' : 'inactive',
    avatar: u.u_profile_image ?? '',
    joinedDate: u.created_at ?? '',
  }))
})

// State
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const showInviteModal = ref(false)
const isUpdatingRole = ref(false)

const filteredMembers = computed(() => {
  return members.value.filter(member => {
    const matchesSearch = !searchQuery.value ||
      member.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesRole = !roleFilter.value || member.role === roleFilter.value
    const matchesStatus = !statusFilter.value || member.status === statusFilter.value
    return matchesSearch && matchesRole && matchesStatus
  })
})

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

async function updateMemberRole(_memberId: string, _newRole: string) {
  isUpdatingRole.value = true
  try {
    await new Promise(r => setTimeout(r, 400)) // replace with real API call
    toast.success('Member role updated')
    refetch()
  } catch {
    toast.error('Failed to update member role')
  } finally {
    isUpdatingRole.value = false
  }
}

function handleInvited(_payload: any) {
  refetch() // refresh list after invite
}
</script>