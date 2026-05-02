<template>
  <div class="w-full space-y-6 flex-1">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-accent"></i>
          Role Management
        </h3>
        <p class="text-sm text-text-secondary mt-1">Define roles and manage permissions for your organization.</p>
      </div>
      <button
        @click="showCreateRoleModal = true"
        class="px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20 whitespace-nowrap self-start sm:self-auto"
      >
        <i class="fa-solid fa-plus mr-2"></i> Create role
      </button>
    </div>

    <!-- Predefined Roles Section -->
    <section class="space-y-3">
      <h4 class="text-sm font-semibold text-text-primary">Default Roles</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="role in defaultRoles"
          :key="role.id"
          class="p-4 rounded-lg border border-border/40 bg-bg-body/50 hover:border-border/60 transition-all"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h5 class="font-semibold text-text-primary capitalize">{{ role.name }}</h5>
              <p class="text-xs text-text-secondary mt-0.5">{{ role.members }} members</p>
            </div>
            <span
              v-if="role.isDefault"
              class="px-2 py-0.5 bg-blue-500/20 text-blue-600 text-xs font-medium rounded-full"
            >
              Default
            </span>
          </div>

          <p class="text-sm text-text-secondary mb-4">{{ role.description }}</p>

          <!-- Permissions Grid -->
          <div class="space-y-2 mb-4 pb-4 border-b border-border/40">
            <div
              v-for="permission in role.permissions"
              :key="permission"
              class="flex items-center gap-2 text-xs text-text-secondary"
            >
              <i class="fa-solid fa-check text-accent text-xs"></i>
              <span>{{ permission }}</span>
            </div>
          </div>

          <button
            @click="editRole(role)"
            class="w-full px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
          >
            <i class="fa-solid fa-pen-to-square mr-2"></i> Edit
          </button>
        </div>
      </div>
    </section>

    <!-- Custom Roles Section -->
    <section v-if="customRoles.length > 0" class="space-y-3 border-t border-border/40 pt-6">
      <h4 class="text-sm font-semibold text-text-primary">Custom Roles</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="role in customRoles"
          :key="role.id"
          class="p-4 rounded-lg border border-border/40 bg-bg-body/50 hover:border-border/60 transition-all group"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h5 class="font-semibold text-text-primary capitalize">{{ role.name }}</h5>
              <p class="text-xs text-text-secondary mt-0.5">{{ role.members }} members</p>
            </div>
            <button
              @click="deleteRole(role.id)"
              class="p-1 text-text-secondary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>

          <p class="text-sm text-text-secondary mb-4">{{ role.description }}</p>

          <!-- Permissions Grid -->
          <div class="space-y-2 mb-4 pb-4 border-b border-border/40 max-h-32 overflow-y-auto">
            <div
              v-for="permission in role.permissions"
              :key="permission"
              class="flex items-center gap-2 text-xs text-text-secondary"
            >
              <i class="fa-solid fa-check text-accent text-xs"></i>
              <span>{{ permission }}</span>
            </div>
          </div>

          <button
            @click="editRole(role)"
            class="w-full px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
          >
            <i class="fa-solid fa-pen-to-square mr-2"></i> Edit
          </button>
        </div>
      </div>
    </section>

    <!-- Empty Custom Roles State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-lg"
    >
      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mb-4">
        <i class="fa-regular fa-folder-open text-accent text-xl"></i>
      </div>
      <h3 class="text-base font-bold text-text-primary mb-1">No custom roles yet</h3>
      <p class="text-sm text-text-secondary mb-6 max-w-xs">
        Create custom roles to tailor permissions for different team members.
      </p>
      <button
        @click="showCreateRoleModal = true"
        class="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
      >
        <i class="fa-solid fa-plus mr-2"></i> Create first custom role
      </button>
    </div>

    <!-- Permissions Reference Card -->
    <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
      <h4 class="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
        <i class="fa-solid fa-circle-info text-xs"></i>
        Permission Levels
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-600">
        <div>
          <p class="font-semibold mb-1">Admin</p>
          <p>Full access to all settings and user management.</p>
        </div>
        <div>
          <p class="font-semibold mb-1">Editor</p>
          <p>Can create, edit, and delete projects and content.</p>
        </div>
        <div>
          <p class="font-semibold mb-1">Viewer</p>
          <p>Read-only access to projects and shared content.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Create/Edit Role Modal -->
  <div
    v-if="showCreateRoleModal"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click="closeRoleModal"
  >
    <div
      class="bg-bg-body rounded-2xl border border-border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-text-primary flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-accent"></i>
          {{ editingRole ? 'Edit role' : 'Create new role' }}
        </h3>
        <button
          @click="closeRoleModal"
          class="p-1 hover:bg-bg-card rounded-lg transition-all"
        >
          <i class="fa-solid fa-times"></i>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Role Name -->
        <div>
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
            Role Name
          </label>
          <input
            v-model="roleForm.name"
            type="text"
            placeholder="e.g., Project Manager"
            class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
            @blur="validateRoleName"
          />
          <p v-if="roleErrors.name" class="text-xs text-red-500 mt-1">{{ roleErrors.name }}</p>
        </div>

        <!-- Description -->
        <div>
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
            Description
          </label>
          <textarea
            v-model="roleForm.description"
            placeholder="Describe this role's purpose..."
            class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary resize-none h-20"
          />
          <p class="text-xs text-text-secondary mt-1">{{ roleForm.description.length }}/200 characters</p>
        </div>

        <!-- Permissions Checklist -->
        <div>
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-3">
            Permissions
          </label>
          <div class="space-y-2 border border-border/40 rounded-lg p-4 bg-bg-body/50 max-h-48 overflow-y-auto">
            <div
              v-for="permission in availablePermissions"
              :key="permission"
              class="flex items-center gap-3"
            >
              <input
                :id="`perm-${permission}`"
                type="checkbox"
                :checked="roleForm.permissions.includes(permission)"
                @change="togglePermission(permission)"
                class="w-4 h-4 accent-accent rounded border-border/60 cursor-pointer"
              />
              <label
                :for="`perm-${permission}`"
                class="flex-1 text-sm text-text-primary cursor-pointer"
              >
                {{ formatPermissionLabel(permission) }}
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t border-border/40">
          <button
            @click="closeRoleModal"
            class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
          >
            Cancel
          </button>
          <button
            @click="saveRole"
            :disabled="isSavingRole || !isRoleFormValid"
            class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSavingRole" class="flex items-center justify-center gap-2">
              <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
            </span>
            <span v-else>{{ editingRole ? 'Update role' : 'Create role' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  members: number
  isDefault?: boolean
}

// State
const defaultRoles = ref<Role[]>([
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to organization settings and all features.',
    permissions: [
      'Manage members',
      'Create roles',
      'Access billing',
      'Change organization settings',
      'Create projects',
      'Delete projects',
      'Manage permissions',
    ],
    members: 1,
    isDefault: true,
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create and manage projects and content.',
    permissions: [
      'Create projects',
      'Edit projects',
      'Invite members',
      'Comment and collaborate',
      'Export data',
    ],
    members: 2,
    isDefault: true,
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to projects and shared content.',
    permissions: [
      'View projects',
      'View reports',
      'Comment',
    ],
    members: 1,
    isDefault: true,
  },
])

const customRoles = ref<Role[]>([
  {
    id: 'custom-1',
    name: 'Project Manager',
    description: 'Manages projects and team assignments.',
    permissions: [
      'Create projects',
      'Manage team members',
      'View reports',
      'Comment and collaborate',
    ],
    members: 3,
  },
])

const showCreateRoleModal = ref(false)
const editingRole = ref<Role | null>(null)
const isSavingRole = ref(false)

const availablePermissions = [
  'manage_members',
  'create_roles',
  'access_billing',
  'change_settings',
  'create_projects',
  'edit_projects',
  'delete_projects',
  'manage_permissions',
  'view_reports',
  'invite_members',
  'comment',
  'export_data',
]

const roleForm = ref({
  name: '',
  description: '',
  permissions: [] as string[],
})

const roleErrors = ref({
  name: '',
})

const isRoleFormValid = computed(() => {
  return roleForm.value.name.trim().length > 0 &&
    roleForm.value.permissions.length > 0 &&
    !roleErrors.value.name
})

function formatPermissionLabel(permission: string): string {
  return permission
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function validateRoleName() {
  if (!roleForm.value.name.trim()) {
    roleErrors.value.name = 'Role name is required'
  } else if (roleForm.value.name.length < 2) {
    roleErrors.value.name = 'Role name must be at least 2 characters'
  } else if (roleForm.value.name.length > 50) {
    roleErrors.value.name = 'Role name must be less than 50 characters'
  } else {
    roleErrors.value.name = ''
  }
}

function togglePermission(permission: string) {
  const idx = roleForm.value.permissions.indexOf(permission)
  if (idx > -1) {
    roleForm.value.permissions.splice(idx, 1)
  } else {
    roleForm.value.permissions.push(permission)
  }
}

function editRole(role: Role) {
  editingRole.value = role
  roleForm.value = {
    name: role.name,
    description: role.description,
    permissions: [...role.permissions],
  }
  showCreateRoleModal.value = true
}

async function saveRole() {
  validateRoleName()
  if (!isRoleFormValid.value) return

  isSavingRole.value = true
  try {
    // await roleApi.save({
    //   id: editingRole.value?.id,
    //   ...roleForm.value,
    // })
    await new Promise(r => setTimeout(r, 800)) // mock

    if (editingRole.value) {
      editingRole.value.name = roleForm.value.name
      editingRole.value.description = roleForm.value.description
      editingRole.value.permissions = roleForm.value.permissions
      toast.success('Role updated successfully')
    } else {
      customRoles.value.push({
        id: `custom-${Date.now()}`,
        name: roleForm.value.name,
        description: roleForm.value.description,
        permissions: roleForm.value.permissions,
        members: 0,
      })
      toast.success('Role created successfully')
    }

    closeRoleModal()
  } catch (error) {
    toast.error('Failed to save role')
  } finally {
    isSavingRole.value = false
  }
}

function closeRoleModal() {
  showCreateRoleModal.value = false
  editingRole.value = null
  roleForm.value = { name: '', description: '', permissions: [] }
  roleErrors.value.name = ''
}

async function deleteRole(roleId: string) {
  if (!window.confirm('Are you sure you want to delete this role?')) return

  try {
    // await roleApi.delete(roleId)
    await new Promise(r => setTimeout(r, 600)) // mock

    customRoles.value = customRoles.value.filter(r => r.id !== roleId)
    toast.success('Role deleted successfully')
  } catch (error) {
    toast.error('Failed to delete role')
  }
}
</script>
