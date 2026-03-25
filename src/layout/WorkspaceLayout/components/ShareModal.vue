<template>
  <BaseModal v-model="isOpen" size="md" modalClass="!py-0" title="Share Module">
    <p class="text-sm text-text-secondary p-6"> Share this module with other users.</p>

    <!-- Body -->
    <div class="px-6 flex flex-col gap-4">
      <!-- Emails and Access Role Side-by-Side -->
      <div class="flex items-start gap-3">
        <EmailSearchChip class="flex-1" label="User emails" v-model="form.emails" :error="!!emailError"
          :message="emailError || 'Press Enter after each email'" showName @invalid="onEmailsInvalid"
          @add="onEmailsAdd" :suggestions="allUsers" />

        <BaseSelectField 
          v-if="form.emails.length > 0"
          size="md"   
          class="w-32 shrink-0 mt-7" 
          :options="accessRoles" 
          placeholder="Role" 
          v-model="form.workspace_access_role_id"
          :message="roleError" :error="!!roleError"
        />
      </div>

      <!-- People with access -->
      <div v-if="sharedUsers?.length && form.emails.length < 1 " class="mt-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-text-primary">People with access</h3>
          <!-- <div class="flex gap-2">
            <button class="p-1 hover:bg-bg-hover rounded transition-colors text-text-secondary" title="Copy link">
              <i class="fa-regular fa-copy text-sm"></i>
            </button>
            <button class="p-1 hover:bg-bg-hover rounded transition-colors text-text-secondary" title="Email">
              <i class="fa-regular fa-envelope text-sm"></i>
            </button>
          </div> -->
        </div>

        <div class="space-y-4 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
          <div v-for="item in sharedUsers" :key="item.user._id" class="flex items-center justify-between group">
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
                  {{ item.user.u_full_name }} {{ item.user._id === currentUserId ? '(you)' : '' }}
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
                  class="!w-24 border-none shadow-none !px-0"
                  :options="[
                    { title: 'Editor', _id: 'editor' },
                    { title: 'Viewer', _id: 'viewer' }
                  ]"
                  :model-value="item.role"
                  @update:modelValue="(val) => val && handleUpdateUserRole(item.user._id, val)"
                />
                <button 
                  @click="handleRemoveAccess(item)"
                  class="text-xs text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove access
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



      <!-- Job Role -->
      <BaseSelectField 
        v-if="form.emails.length > 0"
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
        {{ isSharing ? 'Sharing…' : 'Share' }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import EmailSearchChip from './EmailSearchChip.vue'
import Button from '../../../components/ui/Button.vue'
import { useShareResource, useSharedUsers, useUpdateShareRole, useRemoveShareAccess, useUsers } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'
import { getInitials, generateAvatarColor } from '../../../utilities'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useAgentStore } from '../../../stores/agentStore'

const currentUserId = localStorage.getItem('user_id') // or similar from store

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'shared'): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    resourceId?: string
  }>(),
  { modelValue: false }
)

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const { workspaceId } = useRouteIds()

const form = reactive({
  workspace_access_role_id: null as string | number | null,
  workspace_role_id: null as string | number | null,
  emails: [] as string[],
  note: ''
})

const roleError = computed(() => (!form.workspace_access_role_id ? 'Role is required' : ''))
const invalidEmails = computed<string[]>(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return form.emails.filter(e => !re.test(e))
})
const emailError = computed(() =>
  invalidEmails.value.length ? `Invalid: ${invalidEmails.value.join(', ')}` : ''
)
const canSubmit = computed(
  () => !!form.workspace_access_role_id && !!form.workspace_role_id && form.emails.length > 0 && invalidEmails.value.length === 0
)

function onEmailsInvalid(_bad: string[]) { }
function onEmailsAdd() { }

 const workspaceStore = useWorkspaceStore()

  const companyId = computed(() => {
    const id = workspaceStore.singleWorkspace?.company_id
    return  id
  })

const { data: allUsersData } = useUsers(companyId)

const allUsers = computed(() => {
  if (!allUsersData.value?.data?.users) return []
  return allUsersData.value.data.users.map((u: any) => ({
    _id: u._id,
    name: u.u_full_name,
    email: u.u_email,
    profile_image: u.u_profile_image
  }))
})

// Roles and permissions from agentStore
const agentStore = useAgentStore()

onMounted(() => {
  if (workspaceId.value) {
    agentStore.fetchAgentsRolesPermissions(workspaceId.value)
  }
})

const accessRoles = computed(() => {
  return (agentStore.agentsRolesPermissions.access_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title
  }))
})

const jobRoles = computed(() => {
  return (agentStore.agentsRolesPermissions.job_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title
  }))
})

const { data: sharedUsersData, refetch: refetchSharedUsers } = useSharedUsers({
  resource_type: 'module',
  resource_id: props.resourceId || '',
  workspace_id: workspaceId.value
})

const sharedUsers = computed(() => sharedUsersData.value || [])

const { mutate: updateRole } = useUpdateShareRole({
  type: 'module',
  id: props.resourceId || ''
})

const { mutate: removeAccess } = useRemoveShareAccess({
  resource_type: 'module',
  resource_id: props.resourceId || ''
})

function handleUpdateUserRole(userId: string, newRole: string | number) {
  updateRole(
    {
      payload: {
        user_id: userId,
        access_level: newRole
      }
    },
    {
      onSuccess: () => {
        toast.success('Role updated successfully')
        refetchSharedUsers()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to update role.'
        toast.error(msg)
      }
    }
  )
}

function handleRemoveAccess(item: any) {
  removeAccess(
    {
      params: {
        workspace_id: workspaceId.value,
        user_id: item.user._id,
        email: item.user.u_email
      }
    },
    {
      onSuccess: () => {
        toast.success('Access removed successfully')
        refetchSharedUsers()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to remove access.'
        toast.error(msg)
      }
    }
  )
}

const { mutate: shareResource, isPending: isSharing } = useShareResource()

function submit() {
  if (!canSubmit.value || isSharing.value) return
  
  shareResource(
    {
      payload: {
        workspace_id: workspaceId.value,
        resource_type: 'module',
        resource_id: props.resourceId,
        workspace_access_role_id: form.workspace_access_role_id,
        workspace_role_id: form.workspace_role_id,
        email: form.emails,
        note: form.note
      }
    },
    {
      onSuccess: () => {
        toast.success('Module shared successfully')
        refetchSharedUsers()
        emit('shared')
        reset()
        isOpen.value = false
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to share module.'
        toast.error(msg)
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
}
</script>
