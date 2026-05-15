<template>
  <div class="w-full space-y-6 flex-1">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-accent"></i>
          Role Management
        </h3>
        <p class="text-sm text-text-secondary mt-1">Define roles and manage permissions for your organization.</p>
      </div>
      <button
      v-if="canCreateRole"
        @click="openCreateModal"
        :disabled="!hasVerifiedDomain"
        :title="!hasVerifiedDomain ? 'Please verify your domain first' : ''"
        class="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 whitespace-nowrap self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i class="fa-solid fa-plus mr-2"></i> Create role
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isRolesLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 4" :key="i" class="p-4 rounded-xl border border-border/40 bg-bg-body/50 space-y-3 animate-pulse">
        <div class="flex justify-between">
          <div class="space-y-1.5">
            <div class="h-4 w-28 bg-border/30 rounded" />
            <div class="h-3 w-16 bg-border/20 rounded" />
          </div>
          <div class="h-5 w-14 bg-border/20 rounded-full" />
        </div>
        <div class="h-3 w-full bg-border/20 rounded" />
        <div class="h-3 w-4/5 bg-border/20 rounded" />
        <div class="pt-2 space-y-1.5 border-t border-border/30">
          <div v-for="j in 3" :key="j" class="h-3 bg-border/20 rounded" :style="`width: ${70 + j * 5}%`" />
        </div>
      </div>
    </div>

    <template v-else>
      <!-- System Roles -->
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <h4 class="text-sm font-semibold text-text-primary">System Roles</h4>
          <span class="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
            {{ systemRoles.length }}
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="role in systemRoles"
            :key="role._id"
            class="flex flex-col p-4 rounded-xl border border-border/40 bg-bg-body/50 hover:border-border/70 hover:shadow-sm transition-all"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h5 class="font-semibold text-text-primary">{{ role.title }}</h5>
                  <span v-if="role.is_admin" class="px-2 py-0.5 bg-purple-500/10 text-purple-600 text-xs font-medium rounded-full">Admin</span>
                  <span v-else-if="role.is_editor" class="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">Editor</span>
                  <span v-else-if="role.is_viewer" class="px-2 py-0.5 bg-gray-500/10 text-gray-600 text-xs font-medium rounded-full">Viewer</span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5 capitalize">{{ role.slug }}</p>
              </div>
              <span class="ml-2 flex-shrink-0 px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
                System
              </span>
            </div>

            <p class="text-sm text-text-secondary mb-3">{{ role.description }}</p>

            <div class="flex-1 mb-4 pb-4 border-b border-border/40 space-y-3 max-h-44 overflow-y-auto pr-1">
              <div v-for="(perms, category) in groupedPermissions(role.permissions)" :key="category">
                <p class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  {{ formatCategory(String(category)) }}
                </p>
                <div class="space-y-1">
                  <div v-for="perm in perms" :key="perm._id" class="flex items-start gap-2 text-xs text-text-secondary">
                    <i class="fa-solid fa-check text-accent mt-0.5 flex-shrink-0 text-[10px]"></i>
                    <span>{{ perm.title }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-text-secondary">
                <i class="fa-solid fa-lock text-[10px] mr-1"></i>
                {{ role.permissions.length }} permission{{ role.permissions.length !== 1 ? 's' : '' }}
              </span>
              <span class="text-xs text-text-secondary italic">Read-only</span>
            </div>

            <!-- ✅ Two-button row for system roles -->
            <div class="flex gap-2">
              <button
              v-if="canViewRole"
                @click="openViewModal(role)"
                class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
              >
                <i class="fa-solid fa-eye mr-2 text-xs"></i> View role
              </button>
              <button
                disabled
                class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border/40 text-text-secondary cursor-not-allowed opacity-50"
              >
                <i class="fa-solid fa-lock mr-2 text-xs"></i> Protected
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Custom Roles -->
      <section class="space-y-3 border-t border-border/40 pt-6">
        <div class="flex items-center gap-2">
          <h4 class="text-sm font-semibold text-text-primary">Custom Roles</h4>
          <span class="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
            {{ customRoles.length }}
          </span>
        </div>

        <!-- Empty state -->
        <div
          v-if="customRoles.length === 0"
          class="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-xl"
        >
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mb-3">
            <i class="fa-regular fa-folder-open text-accent"></i>
          </div>
          <h3 class="text-sm font-bold text-text-primary mb-1">No custom roles yet</h3>
          <p class="text-xs text-text-secondary mb-4 max-w-xs">
            Create custom roles to tailor permissions for different team members.
          </p>
          <button
            @click="openCreateModal"
            :disabled="!hasVerifiedDomain"
            class="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="fa-solid fa-plus mr-2"></i> Create first custom role
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="role in customRoles"
            :key="role._id"
            class="flex flex-col p-4 rounded-xl border border-border/40 bg-bg-body/50 hover:border-border/70 hover:shadow-sm transition-all group"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <h5 class="font-semibold text-text-primary">{{ role.title }}</h5>
                <p class="text-xs text-text-secondary mt-0.5 capitalize">{{ role.slug }}</p>
              </div>
              <button
                v-if="canDeleteRole"
                @click="deleteRole(role._id)"
                class="p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Delete role"
              >
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>

            <p class="text-sm text-text-secondary mb-3">{{ role.description }}</p>

            <div class="flex-1 mb-4 pb-4 border-b border-border/40 space-y-3 max-h-44 overflow-y-auto pr-1">
              <div v-for="(perms, category) in groupedPermissions(role.permissions)" :key="category">
                <p class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  {{ formatCategory(String(category)) }}
                </p>
                <div class="space-y-1">
                  <div v-for="perm in perms" :key="perm._id" class="flex items-start gap-2 text-xs text-text-secondary">
                    <i class="fa-solid fa-check text-accent mt-0.5 flex-shrink-0 text-[10px]"></i>
                    <span>{{ perm.title }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-text-secondary">
                <i class="fa-solid fa-lock text-[10px] mr-1"></i>
                {{ role.permissions.length }} permission{{ role.permissions.length !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- ✅ Two-button row for custom roles -->
            <div class="flex gap-2">
              <button
                @click="openViewModal(role)"
                class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
              >
                <i class="fa-solid fa-eye mr-2 text-xs"></i> View
              </button>
              <button
                v-if="canUpdateRole"
                @click="openEditModal(role)"
                class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
              >
                <i class="fa-solid fa-pen-to-square mr-2 text-xs"></i> Edit
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Permission level info card -->
    <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
      <h4 class="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
        <i class="fa-solid fa-circle-info text-xs"></i>
        Permission Categories
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-blue-600">
        <div>
          <p class="font-semibold mb-1">Workspace</p>
          <p class="text-blue-500">Create, view, edit and delete workspaces.</p>
        </div>
        <div>
          <p class="font-semibold mb-1">User Management</p>
          <p class="text-blue-500">Invite, view, update and remove members.</p>
        </div>
        <div>
          <p class="font-semibold mb-1">Package</p>
          <p class="text-blue-500">View and manage subscription plans.</p>
        </div>
        <div>
          <p class="font-semibold mb-1">Company Settings</p>
          <p class="text-blue-500">Manage domains and company config.</p>
        </div>
      </div>
    </div>
  </div>

 <!-- In template — replace both modal usages with this single modal -->
<EditCompanyRole
  v-model="showModal"
  :mode="modalMode"
  :role="modalRole"
  :available-permissions="allAvailablePermissions"
  @saved="refetchRoles"
/>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useCompanyRolesWithoutPermission, useListDomains } from '../../../queries/useCommon'
import EditCompanyRole from './EditCompanyRole.vue'

// ── Types ─────────────────────────────────────────────────────────────────────
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
const canCreateRole = computed(() =>
  isOwner.value || can('role.create')
)

const canUpdateRole = computed(() =>
  isOwner.value || can('role.update')
)

const canDeleteRole = computed(() =>
  isOwner.value || can('role.delete')
)

const canViewRole = computed(() =>
  isOwner.value || can('role.read')
)

const { data: domainsData } = useListDomains()
const domains = computed(() => domainsData.value?.domains ?? [])
const hasVerifiedDomain = computed(() => domains.value.some((d: any) => d.status === 'verified'))
// ── Fetch all roles ───────────────────────────────────────────────────────────
const { data: rolesData, isLoading: isRolesLoading, refetch: refetchRoles } = useCompanyRolesWithoutPermission()

const allRoles = computed<CompanyRole[]>(() => {
  const raw = rolesData.value?.data ?? rolesData.value ?? []
  return Array.isArray(raw) ? raw : []
})

const systemRoles = computed(() => allRoles.value.filter(r => r.is_system))
const customRoles  = computed(() => allRoles.value.filter(r => !r.is_system))

const allAvailablePermissions = computed<Permission[]>(() => {
  const seen = new Set<string>()
  const result: Permission[] = []
  for (const role of allRoles.value) {
    for (const perm of role.permissions) {
      if (!seen.has(perm._id)) {
        seen.add(perm._id)
        result.push(perm)
      }
    }
  }
  return result
})

// ── Edit / Create modal ───────────────────────────────────────────────────────
const showModal     = ref(false)
const modalMode  = ref<'view' | 'edit' | 'create'>('create')
const modalRole  = ref<CompanyRole | null>(null)
function openCreateModal() {
  if (!hasVerifiedDomain.value) {
    toast.error('Please verify your domain first before creating new roles.')
    return
  }
  modalMode.value = 'create'
  modalRole.value = null
  showModal.value = true
}

function openEditModal(role: CompanyRole) {
  modalMode.value = 'edit'
  modalRole.value = role
  showModal.value = true
}

function openViewModal(role: CompanyRole) {
  modalMode.value = 'view'
  modalRole.value = role
  showModal.value = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupedPermissions(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    const key = perm.category ?? 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteRole(roleId: string) {
  console.log(roleId);
  
  if (!window.confirm('Are you sure you want to delete this role?')) return
  try {
    await new Promise(r => setTimeout(r, 600))
    toast.success('Role deleted')
    refetchRoles()
  } catch {
    toast.error('Failed to delete role')
  }
}
</script>