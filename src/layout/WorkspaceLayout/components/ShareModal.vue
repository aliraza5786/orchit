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
            <div
              v-for="mod in modules"
              :key="mod._id"
              class="border border-border rounded-md"
            >
              <!-- Module header row -->
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

              <!-- Sheets -->
              <div v-show="expandedModules.has(String(mod._id))" class="flex flex-col border-t border-border">
                <label
                  v-for="(sheet, idx) in mod.sheets"
                  :key="sheet._id"
                  class="flex items-center gap-2 px-3 py-2 pl-8 cursor-pointer text-xs text-text-primary hover:bg-bg-card select-none overflow-y-auto"
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
              v-for="user in companyUsers"
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
              <div class="flex items-center gap-2">
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

          </div>
        </template>
      </div>
      <div class="flex items-start gap-3">
        <EmailSearchChip
          class="flex-1"
          :label="`User emails`"
          v-model="form.emails"
          :error="!!emailError"
          :message="emailError || 'Press Enter after each email'"
          showName
          @invalid="onEmailsInvalid"
          @add="onEmailsAdd"
          :suggestions="allUsers"
        />

        <BaseSelectField
          v-if="form.emails.length > 0"
          size="md"
          class="w-32 shrink-0 mt-7"
          :options="accessRoles"
          placeholder="Role"
          v-model="form.workspace_access_role_id"
          :message="roleError"
          :error="!!roleError"
        />
      </div>

      <!-- People with access -->
      <div v-if="isLoadingSharedUsers" class="flex justify-center items-center py-6">
        <i class="fa-solid fa-spinner animate-spin text-2xl text-accent"></i>
      </div>
      <div v-else-if="sharedUsers?.length && form.emails.length < 1" class="mt-2">
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
              <div v-else class="flex items-center gap-2">
                <BaseSelectField
                  size="sm"
                  variant="ghost"
                  class="!w-35 border-none shadow-none !px-0"
                  :options="[
                    ...accessRoles,
                    { _id: 'REMOVE_ACCESS', title: 'Remove access', isAction: true, customClass: '!text-red-500 hover:!bg-red-50' }
                  ]"
                  :model-value="item.workspace_access_role?._id || item.role"
                  @update:modelValue="(val) => val && (val === 'REMOVE_ACCESS' ? handleRemoveAccess(item) : handleUpdateUserRole(item, val))"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Job Role — only for module sharing -->
      <BaseSelectField
        v-if="form.emails.length > 0 && resourceType === 'module'"
        label="Job Role"
        :options="jobRoles"
        placeholder="Choose Job Role"
        v-model="form.workspace_role_id"
      />

      <!-- Note -->
      <BaseTextAreaField
        v-if="form.emails.length > 0"
        label="Note"
        placeholder="Add a note (optional)..."
        :model-value="form.note"
        @update:modelValue="v => form.note = v"
      />
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 mt-6 sticky bottom-0 bg-bg-body border-t border-border">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!canSubmit || isSharing" @click="submit">
        <i v-if="isSharing" class="fa-solid fa-spinner animate-spin mr-2"></i>
        {{ isSharing ? `Sharing…` : `Share ${resourceLabel}` }}
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
import EmailSearchChip from './EmailSearchChip.vue'
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

// ─── Modules & Users (workspace only) ────────────────────────────────────────
const selectedUserRoles = ref<Record<string, string | number>>({})
const workspaceResourceId = computed(() =>
  props.resourceType === 'workspace' ? (props.resourceId ?? '') : ''
)

const { data: modulesAndUsersData, isPending: isModulesAndUsersPending } =
  useWorkspaceModulesAndUsers(workspaceResourceId)

const modules = computed(() => modulesAndUsersData.value?.modules ?? [])
const companyUsers = computed(() => modulesAndUsersData.value?.company_users ?? [])

// Expand / collapse per module
const expandedModules = ref<Set<string>>(new Set())

function toggleModuleExpand(id: string) {
  const next = new Set(expandedModules.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedModules.value = next
}

// Selection state
const selectedModules = ref<Set<string>>(new Set())
const selectedSheets = ref<Set<string>>(new Set())
const selectedUsers = ref<Set<string>>(new Set())

function toggleModule(moduleId: string, checked: boolean) {
  const mod = modules.value.find((m: any) => String(m._id) === moduleId)
  const nextMods = new Set(selectedModules.value)
  const nextSheets = new Set(selectedSheets.value)
  if (checked) {
    nextMods.add(moduleId)
    mod?.sheets?.forEach((s: any) => nextSheets.add(String(s._id)))
  } else {
    nextMods.delete(moduleId)
    mod?.sheets?.forEach((s: any) => nextSheets.delete(String(s._id)))
  }
  selectedModules.value = nextMods
  selectedSheets.value = nextSheets
}

function toggleSheet(moduleId: string, sheetId: string, checked: boolean) {
  const nextSheets = new Set(selectedSheets.value)
  checked ? nextSheets.add(sheetId) : nextSheets.delete(sheetId)
  selectedSheets.value = nextSheets

  const mod = modules.value.find((m: any) => String(m._id) === moduleId)
  const allChecked = mod?.sheets?.every((s: any) => nextSheets.has(String(s._id)))
  const nextMods = new Set(selectedModules.value)
  allChecked ? nextMods.add(moduleId) : nextMods.delete(moduleId)
  selectedModules.value = nextMods
}

function toggleUser(userId: string, checked: boolean) {
  const next = new Set(selectedUsers.value)

  if (checked) {
    next.add(userId)
    selectedUserRoles.value[userId] = form.workspace_access_role_id || ''
  } else {
    next.delete(userId)
    delete selectedUserRoles.value[userId]
  }

  selectedUsers.value = next
}

// Derived helpers for checkboxes
function moduleCheckState(moduleId: string) {
  const mod = modules.value.find((m: any) => String(m._id) === moduleId)
  const sheets: any[] = mod?.sheets ?? []
  const checkedCount: number = sheets.filter((s: any) => selectedSheets.value.has(String(s._id))).length
  return {
    checked: selectedModules.value.has(moduleId),
    indeterminate: checkedCount > 0 && checkedCount < sheets.length,
  }
}

const allCheckables = computed(() => {
  const modIds: string[] = modules.value.map((m: any) => String(m._id))
  const sheetIds: string[] = modules.value.flatMap((m: any) => m.sheets?.map((s: any) => String(s._id)) ?? [])
  const userIds: string[] = companyUsers.value.map((u: any) => String(u.user_id))
  return { modIds, sheetIds, userIds }
})

const selectAllState = computed(() => {
  const { modIds, sheetIds, userIds } = allCheckables.value
  const total: number = modIds.length + sheetIds.length + userIds.length
  const checkedMods: number = modIds.filter((id) => selectedModules.value.has(id)).length
  const checkedSheets: number = sheetIds.filter((id) => selectedSheets.value.has(id)).length
  const checkedUsers: number = userIds.filter((id) => selectedUsers.value.has(id)).length
  const checked: number = checkedMods + checkedSheets + checkedUsers
  return { checked, total, indeterminate: checked > 0 && checked < total }
})

function toggleSelectAll(checked: boolean) {
  const { modIds, sheetIds, userIds } = allCheckables.value
  if (checked) {
    selectedModules.value = new Set(modIds)
    selectedSheets.value = new Set(sheetIds)
    selectedUsers.value = new Set(userIds)
  } else {
    selectedModules.value = new Set()
    selectedSheets.value = new Set()
    selectedUsers.value = new Set()
  }
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const resourceLabel = computed(() =>
  props.resourceType === 'workspace' ? 'workspace' : 'module'
)

const title = computed(() =>
  props.resourceType === 'workspace' ? 'Share Workspace' : 'Share Module'
)

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// ─── Shared state / queries (unchanged) ──────────────────────────────────────

const { workspaceId } = useRouteIds()
const queryClient = useQueryClient()

const form = reactive({
  workspace_access_role_id: null as string | number | null,
  workspace_role_id: null as string | number | null,
  emails: [] as string[],
  note: '',
})

const roleError = computed(() => (!form.workspace_access_role_id ? 'Role is required' : ''))
const invalidEmails = computed<string[]>(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return form.emails.filter((e) => !re.test(e))
})
const emailError = computed(() =>
  invalidEmails.value.length ? `Invalid: ${invalidEmails.value.join(', ')}` : ''
)

const hasSelections = computed(() => {
  return (
    selectedModules.value.size > 0 ||
    selectedSheets.value.size > 0 ||
    selectedUsers.value.size > 0
  )
})

const canSubmit = computed(() => {
  const hasEmails =
    form.emails.length > 0 && invalidEmails.value.length === 0

  const hasAnyTarget = hasEmails || hasSelections.value

  if (!hasAnyTarget) return false

  // Role is required only when emails are used
  if (hasEmails && !form.workspace_access_role_id) return false

  // Module-specific role requirement
  if (props.resourceType === 'module' && hasEmails && !form.workspace_role_id) {
    return false
  }

  return true
})

function onEmailsInvalid(_bad: string[]) {}
function onEmailsAdd() {}

const workspaceStore = useWorkspaceStore()
const companyId = computed(() => workspaceStore.singleWorkspace?.company_id)
const { data: allUsersData } = useUsers(companyId)
const allUsers = computed(() => {
  if (!allUsersData.value?.data?.users) return []
  return allUsersData.value.data.users.map((u: any) => ({
    _id: u._id,
    name: u.u_full_name,
    email: u.u_email,
    profile_image: u.u_profile_image,
  }))
})

const agentStore = useAgentStore()
onMounted(() => {
  const id = workspaceId.value || workspaceResourceId.value

  if (id) {
    agentStore.fetchAgentsRolesPermissions(id)
  }
})
const companyIdFromLS = localStorage.getItem('company_id')

const { data: workspaceRolesData } = useWorkspaceRoles(
  {
    company_id: companyIdFromLS,
    workspace_id: workspaceResourceId,
  },
  {
    enabled: computed(() => !!companyIdFromLS && !!workspaceResourceId.value),
  }
)
const accessRoles = computed(() => {
  const isAgentContext = !!agentStore.agentsRolesPermissions?.access_roles?.length

  if (isAgentContext) {
    return (agentStore.agentsRolesPermissions.access_roles || []).map((r: any) => ({
      _id: r._id,
      title: r.title,
    }))
  }

  return (workspaceRolesData.value || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }))
})
const jobRoles = computed(() => {
  return (agentStore.agentsRolesPermissions.job_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }))
})

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

const { mutate: shareResource, isPending: isSharing } = useShareResource()
const selectionPayload = computed(() => {
  const allModuleIds = modules.value.map((m: any) => String(m._id))
  const allSheetIds = modules.value.flatMap((m: any) =>
    m.sheets?.map((s: any) => String(s._id)) ?? []
  )

  const selectedModuleIds = [...selectedModules.value]
  const selectedSheetIds = [...selectedSheets.value]

  const isAllModules =
    allModuleIds.length > 0 &&
    selectedModuleIds.length === allModuleIds.length

  const isAllSheets =
    allSheetIds.length > 0 &&
    selectedSheetIds.length === allSheetIds.length

  return {
    hasModules: selectedModuleIds.length > 0,
    hasSheets: selectedSheetIds.length > 0,

    modules: isAllModules ? 'all' : selectedModuleIds,
    sheets: isAllSheets ? 'all' : selectedSheetIds,
  }
})
function submit() {
  if (!canSubmit.value || isSharing.value) return

  const hasEmails = form.emails.length > 0

  const emailsPayload =
    form.emails.length === 1
      ? form.emails[0]
      : form.emails.length > 1
      ? form.emails
      : undefined

  const usersPayload =
    selectedUsers.value.size > 0
      ? Array.from(selectedUsers.value).map((userId) => ({
          user_id: userId,
          workspace_access_role_id:
            selectedUserRoles.value[userId] || null,
        }))
      : undefined

  shareResource(
    {
      workspace_id: workspaceId.value || workspaceResourceId.value, // ✅ FIX

      resource_type: props.resourceType,
      resource_id: props.resourceId,

      // ❌ REMOVE global role if you are using per-user roles
      // workspace_access_role_id: form.workspace_access_role_id,

      ...(props.resourceType === 'module' && {
        workspace_role_id: form.workspace_role_id,
      }),

      ...(props.resourceType === 'workspace' && {
        ...(hasEmails && {
          email: emailsPayload,
          workspace_access_role_id: form.workspace_access_role_id, // only for emails
        }),

        ...(form.workspace_role_id && {
          workspace_role_id: form.workspace_role_id,
        }),

        ...(selectionPayload.value.hasModules && {
          modules: selectionPayload.value.modules,
        }),

        ...(selectionPayload.value.hasSheets && {
          sheets: selectionPayload.value.sheets,
        }),

        ...(usersPayload && {
          users: usersPayload,
        }),

        note: form.note || "Welcome to the workspace",
      }),
    },
    {
      onSuccess: async () => {
        toast.success(`${title.value} successfully`)
        await queryClient.invalidateQueries({ queryKey: ['shared-users'] })
        emit('shared')
        reset()
        isOpen.value = false
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            `Failed to share ${resourceLabel.value}.`
        )
      },
    }
  )
}
function cancel() {
  reset()
  isOpen.value = false
}

function reset() {
  form.workspace_access_role_id = null
  form.workspace_role_id = null
  form.emails = []
  form.note = ''
  selectedModules.value = new Set()
  selectedSheets.value = new Set()
  selectedUsers.value = new Set()
  expandedModules.value = new Set()
}
</script>