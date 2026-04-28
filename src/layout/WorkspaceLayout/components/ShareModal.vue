<template>
  <BaseModal v-model="isOpen" size="md" modalClass="!py-0" :title="title">
    <p class="text-sm text-text-secondary p-6">Share this {{ resourceLabel }} with other users.</p>

    <!-- Body -->
    <div class="px-6 flex flex-col gap-4">

      <!-- Modules & Users — workspace only -->
      <div v-if="resourceType === 'workspace'">
        <div v-if="isModulesAndUsersPending" class="flex justify-center items-center py-4">
          <i class="fa-solid fa-spinner animate-spin text-xl text-accent"></i>
        </div>
        <template v-else-if="modules.length || companyUsers.length">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-text-primary">Modules & Users</h3>
            <label class="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                :checked="selectAllState.checked === selectAllState.total && selectAllState.total > 0"
                :indeterminate="selectAllState.indeterminate"
                class="w-3.5 h-3.5 cursor-pointer"
                @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
              />
              Select all
            </label>
          </div>

          <div class="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            <!-- Modules -->
            <div v-for="mod in modules" :key="mod._id" class="border border-border rounded-md">
              <div
                class="flex items-center gap-2 px-3 py-2 bg-bg-card cursor-pointer"
                @click="toggleModuleExpand(String(mod._id))"
              >
                <input
                  type="checkbox"
                  :checked="moduleCheckState(String(mod._id)).checked"
                  :indeterminate="moduleCheckState(String(mod._id)).indeterminate"
                  class="w-3.5 h-3.5 cursor-pointer shrink-0"
                  @click.stop
                  @change="toggleModule(String(mod._id), ($event.target as HTMLInputElement).checked)"
                />
                <i class="fa-regular fa-folder text-text-secondary text-xs shrink-0"></i>
                <span class="text-sm font-medium text-text-primary flex-1">
                  {{ mod.title || mod.name || 'Untitled Module' }}
                </span>
                <span class="text-xs text-text-secondary mr-1">
                  {{ mod.sheets?.length ?? 0 }} {{ mod.sheets?.length === 1 ? 'sheet' : 'sheets' }}
                </span>
                <i
                  class="fa-solid fa-chevron-down text-xs text-text-secondary transition-transform duration-150"
                  :class="{ 'rotate-180': expandedModules.has(String(mod._id)) }"
                ></i>
              </div>

              <div v-show="expandedModules.has(String(mod._id))" class="flex flex-col border-t border-border">
                <label
                  v-for="(sheet, idx) in mod.sheets"
                  :key="sheet._id"
                  class="flex items-center gap-2 px-3 py-2 pl-8 cursor-pointer text-xs text-text-primary hover:bg-bg-card select-none"
                  :class="{ 'border-t border-border': (idx as number) > 0 }"
                >
                  <input
                    type="checkbox"
                    :checked="selectedSheets.has(String(sheet._id))"
                    class="w-3 h-3 cursor-pointer shrink-0"
                    @change="toggleSheet(String(mod._id), String(sheet._id), ($event.target as HTMLInputElement).checked)"
                  />
                  <i class="fa-regular fa-file-lines text-text-secondary shrink-0"></i>
                  {{ sheet.title || sheet.name || `Sheet ${(idx as number) + 1}` }}
                </label>
              </div>
            </div>

            <!-- Company users -->
            <div
              v-for="user in shareableUsers"
              :key="user.user_id"
              class="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-bg-card"
            >
              <input
                type="checkbox"
                :checked="selectedUsers.has(String(user.user_id))"
                class="w-3.5 h-3.5 cursor-pointer shrink-0"
                @change="toggleUser(String(user.user_id), ($event.target as HTMLInputElement).checked)"
              />
              <img
                v-if="user.profile_image"
                :src="user.profile_image"
                class="w-6 h-6 rounded-full object-cover shrink-0"
              />
              <div
                v-else
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                :style="{ backgroundColor: generateAvatarColor(user.user_id, user.full_name) }"
              >
                {{ getInitials(user.full_name) }}
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <span class="text-sm text-text-primary truncate">{{ user.full_name }}</span>
                <span class="text-xs text-text-secondary truncate">{{ user.email }}</span>
              </div>
              <BaseSelectField
                v-if="selectedUsers.has(String(user.user_id))"
                size="sm"
                variant="ghost"
                class="!w-35 border-none shadow-none !px-0"
                :options="accessRoles"
                placeholder="Role"
                v-model="selectedUserRoles[user.user_id]"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- ✅ Email invite section -->
      <div class="space-y-3">
        <label class="text-sm font-medium text-text-primary">Invite by email</label>

        <!-- Input row -->
        <div class="flex gap-2">
          <div class="flex-1">
            <input
              v-model="emailInput"
              type="email"
              placeholder="Enter email address and press Enter or Add..."
              class="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg-input text-text-primary outline-none focus:border-accent transition-all"
              @keydown.enter.prevent="addEmail"
            />
            <p v-if="emailInputError" class="text-xs text-red-500 mt-1">{{ emailInputError }}</p>
          </div>
          <button
            type="button"
            class="h-9 px-4 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style="background: var(--accent);"
            @click="addEmail"
          >
            Add
          </button>
        </div>

        <!-- Per-email rows -->
        <template v-if="emailEntries.length > 0">
          <div class="text-xs text-text-secondary">
            {{ emailEntries.length }} {{ emailEntries.length === 1 ? 'person' : 'people' }} to invite
          </div>

          <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            <div
              v-for="(entry, index) in emailEntries"
              :key="entry.email"
              class="flex items-center gap-3 px-3 py-2 rounded-lg border border-border"
              style="background: var(--bg-surface);"
            >
              <!-- Avatar -->
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 text-white"
                :style="{ background: avatarColorFromEmail(entry.email) }"
              >
                {{ entry.email.slice(0, 2).toUpperCase() }}
              </div>

              <!-- Email -->
              <span class="flex-1 text-sm text-text-primary truncate" :title="entry.email">
                {{ entry.email }}
              </span>

              <!-- Role badge -->
              <span
                v-if="entry.roleId"
                class="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
                :class="roleBadgeClass(entry.roleId)"
              >
                {{ roleLabelById(entry.roleId) }}
              </span>

              <!-- Role selector -->
              <BaseSelectField
                size="sm"
                variant="ghost"
                class="!w-28 shrink-0 border-none shadow-none !px-0"
                :options="accessRoles"
                placeholder="Set role"
                :model-value="entry.roleId"
                :error="!entry.roleId"
                @update:modelValue="(val: string | number | null) => val !== null && setEntryRole(index, val)"
              />

              <!-- Remove -->
              <button
                type="button"
                class="w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors shrink-0"
                @click="removeEmailEntry(index)"
                title="Remove"
              >
                <i class="fa-solid fa-times text-xs" />
              </button>
            </div>
          </div>

          <!-- Warning: roles not all set -->
          <p
            v-if="emailEntries.some(e => !e.roleId)"
            class="text-xs text-amber-500 flex items-center gap-1"
          >
            <i class="fa-solid fa-triangle-exclamation text-[10px]" />
            Please set a role for each person before sharing.
          </p>
        </template>
      </div>

      <!-- Job Role — module only -->
      <BaseSelectField
        v-if="emailEntries.length > 0 && resourceType === 'module'"
        label="Job Role"
        :options="jobRoles"
        placeholder="Choose Job Role"
        v-model="form.workspace_role_id"
      />

      <!-- Note -->
      <BaseTextAreaField
        v-if="emailEntries.length > 0"
        label="Note"
        placeholder="Add a note (optional)..."
        :model-value="form.note"
        @update:modelValue="(v: string) => form.note = v"
      />

      <!-- People with access -->
      <div v-if="isLoadingSharedUsers" class="flex justify-center items-center py-6">
        <i class="fa-solid fa-spinner animate-spin text-2xl text-accent"></i>
      </div>
      <div v-else-if="sharedUsers?.length && emailEntries.length < 1" class="mt-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-text-primary">People with access</h3>
        </div>
        <div class="space-y-4 max-h-[320px] overflow-auto pr-1 custom-scrollbar">
          <div
            v-for="item in sharedUsers"
            :key="item.user._id"
            class="flex items-center justify-between group min-w-[400px]"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="item.user.u_profile_image"
                :src="item.user.u_profile_image"
                class="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                :style="{ backgroundColor: generateAvatarColor(item.user._id, item.user.u_full_name || item.user.u_email) }"
              >
                {{ getInitials(item.user.u_full_name || item.user.u_email) }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium text-text-primary truncate">
                  {{ item.user.u_full_name }}
                  {{ item.user._id === currentUserId ? '(you)' : '' }}
                </span>
                <span class="text-xs text-text-secondary truncate">{{ item.user.u_email }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="item.is_owner" class="text-xs text-text-secondary px-2">Owner</span>
              <div v-else>
                <BaseSelectField
                  size="sm"
                  variant="ghost"
                  class="!w-35 border-none shadow-none !px-0"
                  :options="[
                    ...accessRoles,
                    { _id: 'REMOVE_ACCESS', title: 'Remove access', isAction: true, customClass: '!text-red-500 hover:!bg-red-50' }
                  ]"
                  :model-value="item.workspace_access_role?._id || item.role"
                  @update:modelValue="(val: string | number | null) => val && (val === 'REMOVE_ACCESS' ? handleRemoveAccess(item) : handleUpdateUserRole(item, val))"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 mt-6 sticky bottom-0 bg-bg-body border-t border-border">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!canSubmit || isSharing" @click="submit">
        <i v-if="isSharing" class="fa-solid fa-spinner animate-spin mr-2"></i>
        {{ isSharing ? 'Sharing…' : `Share ${resourceLabel}` }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
// import EmailSearchChip from './EmailSearchChip.vue'
import Button from '../../../components/ui/Button.vue'
import {
  useShareResource,
  useSharedUsers,
  useUpdateShareRole,
  useRemoveShareAccess,
  useUsers,
  useWorkspaceModulesAndUsers,
} from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'
import { getInitials, generateAvatarColor } from '../../../utilities'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useAgentStore } from '../../../stores/agentStore'
import { useWorkspaceRoles } from '../../../queries/usePeople'

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailEntry {
  email: string
  roleId: string | number | null
}

// ─── Props / Emits ────────────────────────────────────────────────────────────
const currentUserId = localStorage.getItem('user_id')

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'shared'): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    resourceId?: string
    resourceType?: 'module' | 'workspace'
  }>(),
  {
    modelValue: false,
    resourceType: 'module',
  }
)

// ─── Modal open state ─────────────────────────────────────────────────────────
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// ─── Labels ───────────────────────────────────────────────────────────────────
const resourceLabel = computed(() =>
  props.resourceType === 'workspace' ? 'workspace' : 'module'
)
const title = computed(() =>
  props.resourceType === 'workspace' ? 'Share Workspace' : 'Share Module'
)

// ─── Queries setup ────────────────────────────────────────────────────────────
const { workspaceId } = useRouteIds()
const queryClient = useQueryClient()
const workspaceStore = useWorkspaceStore()
const agentStore = useAgentStore()

const workspaceResourceId = computed(() =>
  props.resourceType === 'workspace' ? (props.resourceId ?? '') : ''
)

// ─── Modules & Users (workspace only) ────────────────────────────────────────
const { data: modulesAndUsersData, isPending: isModulesAndUsersPending } =
  useWorkspaceModulesAndUsers(workspaceResourceId)

const modules = computed(() => modulesAndUsersData.value?.modules ?? [])
const companyUsers = computed(() => modulesAndUsersData.value?.company_users ?? [])

const expandedModules = ref<Set<string>>(new Set())
const selectedModulesList = ref<Set<string>>(new Set())
const selectedSheets = ref<Set<string>>(new Set())
const selectedUsers = ref<Set<string>>(new Set())
const selectedUserRoles = ref<Record<string, string | number>>({})

function toggleModuleExpand(id: string) {
  const next = new Set(expandedModules.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedModules.value = next
}

function toggleModule(moduleId: string, checked: boolean) {
  const mod = modules.value.find((m: any) => String(m._id) === moduleId)
  const nextMods = new Set(selectedModulesList.value)
  const nextSheets = new Set(selectedSheets.value)
  if (checked) {
    nextMods.add(moduleId)
    mod?.sheets?.forEach((s: any) => nextSheets.add(String(s._id)))
  } else {
    nextMods.delete(moduleId)
    mod?.sheets?.forEach((s: any) => nextSheets.delete(String(s._id)))
  }
  selectedModulesList.value = nextMods
  selectedSheets.value = nextSheets
}

function toggleSheet(moduleId: string, sheetId: string, checked: boolean) {
  const nextSheets = new Set(selectedSheets.value)
  checked ? nextSheets.add(sheetId) : nextSheets.delete(sheetId)
  selectedSheets.value = nextSheets

  const mod = modules.value.find((m: any) => String(m._id) === moduleId)
  const allChecked = mod?.sheets?.every((s: any) => nextSheets.has(String(s._id)))
  const nextMods = new Set(selectedModulesList.value)
  allChecked ? nextMods.add(moduleId) : nextMods.delete(moduleId)
  selectedModulesList.value = nextMods
}

function toggleUser(userId: string, checked: boolean) {
  const next = new Set(selectedUsers.value)
  if (checked) {
    next.add(userId)
    selectedUserRoles.value[userId] = ''
  } else {
    next.delete(userId)
    delete selectedUserRoles.value[userId]
  }
  selectedUsers.value = next
}

function moduleCheckState(moduleId: string) {
  const mod = modules.value.find((m: any) => String(m._id) === moduleId)
  const sheets: any[] = mod?.sheets ?? []
  const checkedCount = sheets.filter((s: any) => selectedSheets.value.has(String(s._id))).length
  return {
    checked: selectedModulesList.value.has(moduleId),
    indeterminate: checkedCount > 0 && checkedCount < sheets.length,
  }
}

const allCheckables = computed(() => {
  const modIds = modules.value.map((m: any) => String(m._id))
  const sheetIds = modules.value.flatMap((m: any) => m.sheets?.map((s: any) => String(s._id)) ?? [])
  const userIds = companyUsers.value.map((u: any) => String(u.user_id))
  return { modIds, sheetIds, userIds }
})

const selectAllState = computed(() => {
  const { modIds, sheetIds, userIds } = allCheckables.value
  const total = modIds.length + sheetIds.length + userIds.length
  const checked =
    modIds.filter((id :any) => selectedModulesList.value.has(id)).length +
    sheetIds.filter((id:any) => selectedSheets.value.has(id)).length +
    userIds.filter((id:any) => selectedUsers.value.has(id)).length
  return { checked, total, indeterminate: checked > 0 && checked < total }
})

function toggleSelectAll(checked: boolean) {
  const { modIds, sheetIds, userIds } = allCheckables.value
  if (checked) {
    selectedModulesList.value = new Set(modIds)
    selectedSheets.value = new Set(sheetIds)
    selectedUsers.value = new Set(userIds)
  } else {
    selectedModulesList.value = new Set()
    selectedSheets.value = new Set()
    selectedUsers.value = new Set()
  }
}

// ─── Email entries (per-email role) ──────────────────────────────────────────
const emailEntries = ref<EmailEntry[]>([])
const emailInput = ref('')
const emailInputError = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function addEmail() {
  const val = emailInput.value.trim()
  if (!val) return
  if (!EMAIL_RE.test(val)) {
    emailInputError.value = 'Please enter a valid email address.'
    return
  }
  if (emailEntries.value.some((e) => e.email === val)) {
    emailInputError.value = 'This email has already been added.'
    return
  }
  emailEntries.value.push({ email: val, roleId: null })
  emailInput.value = ''
  emailInputError.value = ''
}

function removeEmailEntry(index: number) {
  emailEntries.value.splice(index, 1)
}

function setEntryRole(index: number, roleId: string | number) {
  emailEntries.value[index].roleId = roleId
}

// ─── Avatar & role helpers ────────────────────────────────────────────────────
function avatarColorFromEmail(email: string): string {
  const colors = ['#534AB7', '#1D9E75', '#D85A30', '#D4537E', '#BA7517']
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0
  return colors[Math.abs(hash) % colors.length]
}

function roleLabelById(id: string | number | null): string {
  if (!id) return ''
  return accessRoles.value.find((r:any) => r._id === id)?.title ?? ''
}

function roleBadgeClass(id: string | number | null): string {
  const label = roleLabelById(id).toLowerCase()
  if (label.includes('viewer')) return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  if (label.includes('editor')) return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
  if (label.includes('admin')) return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
  return 'bg-bg-surface text-text-secondary'
}

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  workspace_role_id: null as string | number | null,
  note: '',
})

// ─── Validation ───────────────────────────────────────────────────────────────
const hasSelections = computed(
  () =>
    selectedModulesList.value.size > 0 ||
    selectedSheets.value.size > 0 ||
    selectedUsers.value.size > 0
)

const canSubmit = computed(() => {
  const hasEmails = emailEntries.value.length > 0
  const allHaveRoles = emailEntries.value.every((e) => !!e.roleId)
  const hasAnyTarget = hasEmails || hasSelections.value
  if (!hasAnyTarget) return false
  if (hasEmails && !allHaveRoles) return false
  if (props.resourceType === 'module' && hasEmails && !form.workspace_role_id) return false
  return true
})

// ─── Users for autocomplete ───────────────────────────────────────────────────
const companyId = computed(() => workspaceStore.singleWorkspace?.company_id)
const { data: allUsersData } = useUsers(companyId)
console.log(allUsersData);

// const allUsers = computed(() => {
//   if (!allUsersData.value?.data?.users) return []
//   return allUsersData.value.data.users.map((u: any) => ({
//     _id: u._id,
//     name: u.u_full_name,
//     email: u.u_email,
//     profile_image: u.u_profile_image,
//   }))
// })

// ─── Roles ────────────────────────────────────────────────────────────────────
onMounted(() => {
  const id = workspaceId.value || workspaceResourceId.value
  if (id) agentStore.fetchAgentsRolesPermissions(id)
})

const companyIdFromLS = localStorage.getItem('company_id')

const { data: workspaceRolesData } = useWorkspaceRoles(
  { company_id: companyIdFromLS, workspace_id: workspaceResourceId },
  { enabled: computed(() => !!companyIdFromLS && !!workspaceResourceId.value) }
)

const accessRoles = computed(() => {
  const fromAgent = agentStore.agentsRolesPermissions?.access_roles
  if (fromAgent?.length) {
    return fromAgent.map((r: any) => ({ _id: r._id, title: r.title }))
  }
  return (workspaceRolesData.value || []).map((r: any) => ({ _id: r._id, title: r.title }))
})

const jobRoles = computed(() =>
  (agentStore.agentsRolesPermissions.job_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }))
)

// ─── Shared users ─────────────────────────────────────────────────────────────
const { data: sharedUsersData, isLoading: isLoadingSharedUsers } = useSharedUsers({
  resource_type: props.resourceType,
  resource_id: props.resourceId || '',
  workspace_id: workspaceId.value,
})
const sharedUsers = computed(() => sharedUsersData.value || [])

const { mutate: updateRole } = useUpdateShareRole({
  type: props.resourceType,
  id: props.resourceId || '',
})

const { mutate: removeAccess } = useRemoveShareAccess({
  resource_type: props.resourceType,
  resource_id: props.resourceId || '',
})

function handleUpdateUserRole(item: any, newRole: string | number) {
  updateRole(
    {
      workspace_id: workspaceId.value,
      email: item.user.u_email,
      user_id: item.user._id,
      seat_id: item.seat_id || item._id,
      workspace_access_role_id: newRole,
    },
    {
      onSuccess: async () => {
        toast.success('Role updated successfully')
        await queryClient.invalidateQueries({ queryKey: ['shared-users'] })
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to update role.')
      },
    }
  )
}

function handleRemoveAccess(item: any) {
  removeAccess(
    {
      workspace_id: workspaceId.value,
      email: item.user.u_email,
      user_id: item.user._id,
      invitation_id: item.invitation_id || item._id,
    },
    {
      onSuccess: async () => {
        toast.success('Access removed successfully')
        await queryClient.invalidateQueries({ queryKey: ['shared-users'] })
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to remove access.')
      },
    }
  )
}

// ─── Selection payload ────────────────────────────────────────────────────────
const selectionPayload = computed(() => {
  const allModuleIds = modules.value.map((m: any) => String(m._id))
  const allSheetIds = modules.value.flatMap((m: any) =>
    m.sheets?.map((s: any) => String(s._id)) ?? []
  )
  const selectedModuleIds = [...selectedModulesList.value]
  const selectedSheetIds = [...selectedSheets.value]
  const isAllModules = allModuleIds.length > 0 && selectedModuleIds.length === allModuleIds.length
  const isAllSheets = allSheetIds.length > 0 && selectedSheetIds.length === allSheetIds.length
  return {
    hasModules: selectedModuleIds.length > 0,
    hasSheets: selectedSheetIds.length > 0,
    modules: isAllModules ? 'all' : selectedModuleIds,
    sheets: isAllSheets ? 'all' : selectedSheetIds,
  }
})

// ─── Submit ───────────────────────────────────────────────────────────────────
const { mutate: shareResource, isPending: isSharing } = useShareResource()

function submit() {
  if (!canSubmit.value || isSharing.value) return

  const usersPayload =
    selectedUsers.value.size > 0
      ? Array.from(selectedUsers.value).map((userId) => ({
          user_id: userId,
          workspace_access_role_id: selectedUserRoles.value[userId] || null,
        }))
      : undefined

  shareResource(
    {
      workspace_id: workspaceId.value || workspaceResourceId.value,
      resource_type: props.resourceType,
      resource_id: props.resourceId,

      // ✅ Per-email role invites
      ...(emailEntries.value.length > 0 && {
        invites: emailEntries.value.map((e) => ({
          email: e.email,
          workspace_access_role_id: e.roleId,
        })),
      }),

      ...(props.resourceType === 'module' && {
        workspace_role_id: form.workspace_role_id,
      }),

      ...(props.resourceType === 'workspace' && {
        ...(selectionPayload.value.hasModules && { modules: selectionPayload.value.modules }),
        ...(selectionPayload.value.hasSheets && { sheets: selectionPayload.value.sheets }),
        ...(usersPayload && { users: usersPayload }),
        note: form.note || '',
      }),
    },
    {
      onSuccess: async () => {
        toast.success(`${title.value} shared successfully`)
        await queryClient.invalidateQueries({ queryKey: ['shared-users'] })
        emit('shared')
        reset()
        isOpen.value = false
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to share ${resourceLabel.value}.`)
      },
    }
  )
}

// ─── Cancel / Reset ───────────────────────────────────────────────────────────
function cancel() {
  reset()
  isOpen.value = false
}

function reset() {
  form.workspace_role_id = null
  form.note = ''
  emailEntries.value = []
  emailInput.value = ''
  emailInputError.value = ''
  selectedModulesList.value = new Set()
  selectedSheets.value = new Set()
  selectedUsers.value = new Set()
  expandedModules.value = new Set()
  selectedUserRoles.value = {}
}
// const shareableUsers = computed(() =>
const shareableUsers = computed(() =>
  companyUsers.value.filter((u: any) => u.membership_role !== 'owner')
)
</script>