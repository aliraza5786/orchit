<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="$emit('update:modelValue', false)"
    >
      <div
        class="bg-bg-body rounded-2xl border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-accent"></i>
            <span v-if="currentMode === 'view'">View role</span>
            <span v-else-if="currentMode === 'edit'">Edit role</span>
            <span v-else>Create new role</span>
          </h3>
          <button @click="$emit('update:modelValue', false)" class="p-1.5 hover:bg-bg-card rounded-lg transition-all">
            <i class="fa-solid fa-times text-text-secondary"></i>
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="isRoleLoading" class="space-y-5">
          <div class="space-y-2">
            <div class="h-3 w-20 bg-border/30 rounded animate-pulse" />
            <div class="h-10 bg-border/20 rounded-lg animate-pulse" />
          </div>
          <div class="space-y-2">
            <div class="h-3 w-24 bg-border/30 rounded animate-pulse" />
            <div class="h-20 bg-border/20 rounded-lg animate-pulse" />
          </div>
          <div class="space-y-2">
            <div class="h-3 w-20 bg-border/30 rounded animate-pulse" />
            <div v-for="i in 5" :key="i" class="h-4 bg-border/20 rounded animate-pulse" :style="`width: ${55 + i * 7}%`" />
          </div>
        </div>

        <div v-else class="space-y-5">

          <!-- ── VIEW MODE ───────────────────────────────────────────────── -->
          <template v-if="currentMode === 'view'">

            <!-- Role identity card -->
            <div class="flex items-start justify-between gap-3 p-4 rounded-xl bg-bg-card/50 border border-border/40">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h4 class="font-semibold text-text-primary text-base">{{ role?.title }}</h4>
                  <span v-if="role?.is_system" class="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">System</span>
                  <span v-if="role?.is_admin" class="px-2 py-0.5 bg-purple-500/10 text-purple-600 text-xs font-medium rounded-full">Admin</span>
                  <span v-else-if="role?.is_editor" class="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">Editor</span>
                  <span v-else-if="role?.is_viewer" class="px-2 py-0.5 bg-gray-500/10 text-gray-600 text-xs font-medium rounded-full">Viewer</span>
                </div>
                <p class="text-xs text-text-secondary font-mono capitalize">{{ role?.slug }}</p>
              </div>
              <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <i class="fa-solid fa-shield-halved text-accent text-sm"></i>
              </div>
            </div>

            <!-- Description -->
            <div>
              <p class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Description</p>
              <p class="text-sm text-text-primary leading-relaxed">{{ role?.description || 'No description provided.' }}</p>
            </div>

            <!-- Meta -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-lg bg-bg-card/50 border border-border/30">
                <p class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Permissions</p>
                <p class="text-lg font-bold text-text-primary">{{ role?.permissions.length ?? 0 }}</p>
              </div>
              <div class="p-3 rounded-lg bg-bg-card/50 border border-border/30">
                <p class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Type</p>
                <p class="text-sm font-semibold text-text-primary mt-1">{{ role?.is_system ? 'System' : 'Custom' }}</p>
              </div>
            </div>

            <!-- Permissions accordion — VIEW -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <p class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Permissions</p>
                <div class="flex items-center gap-2">
                  <button @click="expandAll('view')" class="text-[11px] text-accent hover:underline">Expand all</button>
                  <span class="text-[11px] text-text-secondary">·</span>
                  <button @click="collapseAll" class="text-[11px] text-accent hover:underline">Collapse all</button>
                </div>
              </div>

              <div
                v-if="!role?.permissions.length"
                class="flex items-center justify-center py-8 text-sm text-text-secondary border border-dashed border-border/40 rounded-xl"
              >
                <i class="fa-regular fa-circle-xmark mr-2 opacity-60"></i>
                No permissions assigned
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(perms, category) in viewGroupedPermissions"
                  :key="category"
                  class="border border-border/40 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    @click="toggleOpenCategory(String(category))"
                    class="w-full flex items-center justify-between px-4 py-3 bg-bg-card/60 hover:bg-bg-card transition-colors text-left"
                  >
                    <div class="flex items-center gap-2.5">
                      <i
                        class="fa-solid fa-chevron-right text-text-secondary text-[10px] transition-transform duration-200"
                        :class="{ 'rotate-90': openCategories.has(String(category)) }"
                      ></i>
                      <span class="text-xs font-semibold text-text-primary uppercase tracking-wider">
                        {{ formatCategory(String(category)) }}
                      </span>
                    </div>
                    <span class="text-[10px] font-medium text-text-secondary bg-border/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      {{ perms.length }}
                    </span>
                  </button>

                  <div v-show="openCategories.has(String(category))" class="divide-y divide-border/30">
                    <div
                      v-for="perm in perms"
                      :key="perm._id"
                      class="flex items-start gap-3 px-4 py-3 bg-bg-body/50"
                    >
                      <div class="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-accent bg-accent/10 flex items-center justify-center">
                        <i class="fa-solid fa-check text-accent text-[9px]"></i>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm text-text-primary font-medium leading-snug">{{ perm.title }}</p>
                        <p v-if="perm.description" class="text-xs text-text-secondary mt-0.5">{{ perm.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Created at -->
            <p v-if="role?.created_at" class="text-xs text-text-secondary">
              <i class="fa-regular fa-calendar mr-1.5"></i>
              Created {{ formattedDate }}
            </p>

            <!-- Footer -->
            <div class="flex gap-3 pt-2 border-t border-border/40">
              <button
                @click="$emit('update:modelValue', false)"
                class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
              >
                Close
              </button>
              <button
                v-if="!role?.is_system"
                @click="switchToEdit"
                class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
              >
                <i class="fa-solid fa-pen-to-square mr-2"></i> Edit role
              </button>
            </div>
          </template>

          <!-- ── CREATE / EDIT MODE ─────────────────────────────────────── -->
          <template v-else>

            <!-- Role name -->
            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
                Role name
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Project Manager"
                class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                @blur="validateName"
              />
              <p v-if="errors.name" class="text-xs text-red-500 mt-1">{{ errors.name }}</p>
            </div>
             <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
                Slug
              </label>
              <input
                v-model="form.slug"
                type="text"
                placeholder="e.g., project-manager"
                class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
                @blur="validateName"
              />
            </div>
            <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
              Role Type
            </label>

            <select
              v-model="form.type"
              class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
            <!-- Description -->
            <div>
              <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
                Description
              </label>
              <textarea
                v-model="form.description"
                placeholder="Describe this role's purpose..."
                maxlength="200"
                class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary resize-none h-20"
              />
              <p class="text-xs text-text-secondary mt-1">{{ form.description.length }}/200</p>
            </div>

            <!-- Permissions accordion — CREATE / EDIT -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
                  Permissions
                </label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="expandAll('edit')"
                    class="text-[11px] text-accent hover:underline"
                  >
                    Expand all
                  </button>
                  <span class="text-[11px] text-text-secondary">·</span>
                  <button
                    type="button"
                    @click="collapseAll"
                    class="text-[11px] text-accent hover:underline"
                  >
                    Collapse all
                  </button>
                </div>
              </div>

              <div class="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/40">
                <div
                  v-for="(perms, category) in editGroupedPermissions"
                  :key="category"
                  class="bg-bg-body/50"
                >
                  <!-- Accordion trigger -->
                  <button
                    type="button"
                    @click="toggleOpenCategory(String(category))"
                    class="w-full flex items-center justify-between px-4 py-3 bg-bg-card/50 hover:bg-bg-card transition-colors text-left"
                  >
                    <div class="flex items-center gap-2.5">
                      <i
                        class="fa-solid fa-chevron-right text-text-secondary text-[10px] transition-transform duration-200"
                        :class="{ 'rotate-90': openCategories.has(String(category)) }"
                      ></i>
                      <span class="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
                        {{ formatCategory(String(category)) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2" @click.stop>
                      <button
                        type="button"
                        @click="toggleCategory(perms)"
                        class="text-[11px] text-accent hover:underline"
                      >
                        {{ isCategoryFullySelected(perms) ? 'Deselect all' : 'Select all' }}
                      </button>
                      <span class="text-[10px] font-medium text-text-secondary bg-border/20 px-2 py-0.5 rounded-full">
                        {{ selectedInCategory(perms) }}/{{ perms.length }}
                      </span>
                    </div>
                  </button>

                  <!-- Accordion body with checkboxes -->
                  <div v-show="openCategories.has(String(category))" class="px-4 py-2 divide-y divide-border/20">
                    <div
                      v-for="perm in perms"
                      :key="perm._id"
                      class="flex items-start gap-3 py-2.5 cursor-pointer"
                      @click="togglePermission(perm._id)"
                    >
                      <div
                        class="mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-all flex items-center justify-center"
                        :class="form.permissionIds.includes(perm._id)
                          ? 'border-accent bg-accent/10'
                          : 'border border-accent/70'"
                      >
                        <i
                          v-if="form.permissionIds.includes(perm._id)"
                          class="fa-solid fa-check text-accent text-[9px]"
                        ></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm text-text-primary font-medium leading-snug select-none">{{ perm.title }}</p>
                        <p v-if="perm.description" class="text-xs text-text-secondary mt-0.5 select-none">{{ perm.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="errors.permissions" class="text-xs text-red-500 mt-1">{{ errors.permissions }}</p>
              <p class="text-xs text-text-secondary mt-2">
                {{ form.permissionIds.length }} permission{{ form.permissionIds.length !== 1 ? 's' : '' }} selected
              </p>
            </div>

            <!-- Footer -->
            <div class="flex gap-3 pt-2 border-t border-border/40">
              <button
                @click="handleCancel"
                class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
              >
                <!-- ✅ Goes back to view if switched from view, otherwise closes -->
                {{ mode === 'view' ? 'Back to view' : 'Cancel' }}
              </button>
              <button
                @click="handleSave"
                :disabled="isSaving || !isFormValid"
                class="flex-1 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSaving" class="flex items-center justify-center gap-2">
                  <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
                </span>
                <span v-else>{{ currentMode === 'edit' ? 'Update role' : 'Create role' }}</span>
              </button>
            </div>
          </template>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useCompanyRoleById } from '../../../queries/useCommon'
import { useCreateCompanyRole } from '../../../queries/useWorkspace'
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

// ── Props & emits ─────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue: boolean
  mode: 'view' | 'edit' | 'create'
  role?: CompanyRole | null
  availablePermissions?: Permission[]
}>()
const mapRoleType = (type: 'admin' | 'editor' | 'viewer') => {
  return {
    is_admin: type === 'admin',
    is_editor: type === 'editor',
    is_viewer: type === 'viewer',
  }
}
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

// ── Internal mode — allows view→edit switch without closing modal ──────────────
// ✅ This is the key fix: currentMode is internal state that starts from props.mode
// but can be changed inline (view → edit) without the parent needing to do anything
const currentMode = ref<'view' | 'edit' | 'create'>(props.mode)

// Sync when parent changes mode (e.g. opening fresh)
watch(() => props.mode, (val) => {
  currentMode.value = val
}, { immediate: true })

// Reset internal mode when modal closes
watch(() => props.modelValue, (open) => {
  if (!open) currentMode.value = props.mode
})

// ── Fetch role by ID for edit mode ────────────────────────────────────────────
const { data: roleData, isLoading: isRoleLoading } = useCompanyRoleById(
  computed(() => props.role?._id ?? ''),
  { enabled: computed(() => currentMode.value === 'edit' && !!props.role?._id) }
)
const { mutate: createRole } = useCreateCompanyRole({
  onSuccess: () => {
    toast.success('Role created')
    emit('saved')
    emit('update:modelValue', false)
  }
})
const resolvedRole = computed<CompanyRole | null>(() => {
  if (currentMode.value === 'view') return props.role ?? null
  if (currentMode.value === 'edit') return (roleData.value?.data ?? roleData.value ?? props.role) as CompanyRole | null
  return null
})

// ── Accordion state ───────────────────────────────────────────────────────────
const openCategories = ref<Set<string>>(new Set())

function getPermissionSource(): Permission[] {
  if (currentMode.value === 'create') return props.availablePermissions ?? []
  if (currentMode.value === 'edit')   return props.availablePermissions ?? []
  return resolvedRole.value?.permissions ?? []
}

// Auto-open all categories on modal open or mode switch
watch(
  [() => props.modelValue, currentMode, resolvedRole],
  () => {
    if (!props.modelValue) {
      openCategories.value = new Set()
      return
    }
    openCategories.value = new Set(getPermissionSource().map(p => p.category ?? 'other'))
  },
  { immediate: true }
)

function toggleOpenCategory(category: string) {
  const next = new Set(openCategories.value)
  if (next.has(category)) next.delete(category)
  else next.add(category)
  openCategories.value = next
}

// ✅ expandAll / collapseAll now work for both view and edit mode
function expandAll(scope: 'view' | 'edit') {
  const source = scope === 'view'
    ? (resolvedRole.value?.permissions ?? [])
    : (props.availablePermissions ?? [])
  openCategories.value = new Set(source.map(p => p.category ?? 'other'))
}

function collapseAll() {
  openCategories.value = new Set()
}
function switchToEdit() {
  if (props.role) {
    let type: 'admin' | 'editor' | 'viewer' = 'viewer'

    if (props.role.is_admin) type = 'admin'
    else if (props.role.is_editor) type = 'editor'
    else if (props.role.is_viewer) type = 'viewer'

    form.value = {
      name: props.role.title || '',
      slug: props.role.slug || '',
      description: props.role.description || '',
      type,
      permissionIds: props.role.permissions.map(p => p._id),
    }
  }

  openCategories.value = new Set(
    (props.availablePermissions || []).map(p => p.category || 'other')
  )

  currentMode.value = 'edit'
}
// ✅ Cancel in edit-from-view goes back to view; in standalone edit/create closes
function handleCancel() {
  if (props.mode === 'view') {
    currentMode.value = 'view'
    openCategories.value = new Set(
      (resolvedRole.value?.permissions ?? []).map(p => p.category ?? 'other')
    )
  } else {
    emit('update:modelValue', false)
  }
}

// ── Grouped permissions ───────────────────────────────────────────────────────
function groupByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    const key = perm.category ?? 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)
}

const viewGroupedPermissions = computed(() =>
  groupByCategory(resolvedRole.value?.permissions ?? [])
)

const editGroupedPermissions = computed(() =>
  groupByCategory(props.availablePermissions ?? [])
)
const form = ref({
  name: '',
  slug: '',
  description: '',
  type: 'viewer' as 'admin' | 'editor' | 'viewer',
  permissionIds: [] as string[],
})
watch(
  () => form.value.name,
  (val) => {
    form.value.slug = val
      ?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
  }
)
const errors = ref({ name: '', permissions: '' })
const isSaving = ref(false)
watch(resolvedRole, (role) => {
  if (currentMode.value !== 'edit' || !role) return

  form.value = {
    name: role.title ?? '',
    slug: role.slug ?? '',
    description: role.description ?? '',
    type: role.is_admin
      ? 'admin'
      : role.is_editor
      ? 'editor'
      : 'viewer',
    permissionIds: role.permissions.map(p => p._id),
  }
}, { immediate: true })
watch(() => props.modelValue, (open) => {
  if (!open) {
    form.value.name = ''
    form.value.slug = ''
    form.value.description = ''
    form.value.type = 'viewer'
    form.value.permissionIds = []

    errors.value.name = ''
    errors.value.permissions = ''
  }
})

// ── Permission helpers ────────────────────────────────────────────────────────
function isCategoryFullySelected(perms: Permission[]): boolean {
  return perms.every(p => form.value.permissionIds.includes(p._id))
}

function selectedInCategory(perms: Permission[]): number {
  return perms.filter(p => form.value.permissionIds.includes(p._id)).length
}

function toggleCategory(perms: Permission[]) {
  if (isCategoryFullySelected(perms)) {
    form.value.permissionIds = form.value.permissionIds.filter(
      id => !perms.some(p => p._id === id)
    )
  } else {
    const toAdd = perms.map(p => p._id).filter(id => !form.value.permissionIds.includes(id))
    form.value.permissionIds.push(...toAdd)
  }
}

function togglePermission(permId: string) {
  const idx = form.value.permissionIds.indexOf(permId)
  if (idx > -1) form.value.permissionIds.splice(idx, 1)
  else form.value.permissionIds.push(permId)
  if (form.value.permissionIds.length > 0) errors.value.permissions = ''
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateName() {
  const name = form.value.name.trim()
  if (!name) errors.value.name = 'Role name is required'
  if (!form.value.slug.trim()) {
  errors.value.name = 'Slug is required'
}
  else if (name.length < 2) errors.value.name = 'At least 2 characters required'
  else if (name.length > 50) errors.value.name = 'Max 50 characters'
  else errors.value.name = ''
}

const isFormValid = computed(() =>
  form.value.name.trim().length >= 2 &&
  form.value.permissionIds.length > 0 &&
  !errors.value.name
)
async function handleSave() {
  validateName()

  if (!form.value.slug) {
    errors.value.name = 'Slug is required'
    return
  }

  if (form.value.permissionIds.length === 0) {
    errors.value.permissions = 'Select at least one permission'
  }

  if (!isFormValid.value) return

  isSaving.value = true

  try {
    const roleFlags = mapRoleType(form.value.type)

    const payload = {
      title: form.value.name,
      slug: form.value.slug,
      description: form.value.description,
      permission_ids: form.value.permissionIds,
      company_id: localStorage.getItem('company_id') || undefined,
      ...roleFlags,
    }

    if (currentMode.value === 'edit') {
      // TODO: call update mutation
    } else {
      createRole(payload)
    }

  } catch {
    toast.error('Failed to save role')
  } finally {
    isSaving.value = false
  }
}
// ── Formatted date ────────────────────────────────────────────────────────────
const formattedDate = computed(() => {
  if (!resolvedRole.value?.created_at) return ''
  return new Date(resolvedRole.value.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>