<template>
  <div :class="[
    'max-w-[358px] flex-grow rounded-lg overflow-y-auto overflow-x-hidden relative transition-all',
    'text-text-primary bg-bg-card',
    workspaceStore.showSettingPanel ? 'translate-x-0 min-w-[350px] w-full h-full' : 'translate-x-100 !max-w-0 h-0'
  ]">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-border px-5 py-4.5 sticky top-0 bg-bg-card z-10">
      <h5 class="text-[16px] font-medium">Space Details</h5>
      <i class=" cursor-pointer text-text-primary fa-solid fa-close" @click="closeHandler"></i>
    </div>

    <div class="flex px-5 py-6 flex-col">
      <!-- Workspace Identity -->
      <div class="flex items-center gap-3.5">
        <!-- Logo + hover overlay -->
        <div class="relative group">
          <img :src="logoPreview || workspace.logo || dummy"
            class="w-12 h-12 min-w-12 object-cover aspect-square rounded-lg border border-border"
            alt="workspace logo" />
          <button type="button"
            class="absolute inset-0 rounded-lg bg-bg-dropdown opacity-0 group-hover:opacity-100 transition grid place-items-center text-text-primary text-xs"
            :disabled="isUploadingLogo" @click="triggerLogoPicker" aria-label="Change logo">
            <div class="flex items-center justify-center gap-1.5">
              <span v-if="isUploadingLogo"
                class="inline-block h-5 w-5 rounded-full border-2 border-border border-t-text-primary animate-spin motion-reduce:animate-none"
                aria-hidden="true"></span>
              <!-- upload icon -->
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </button>

          <input ref="logoInputRef" type="file" accept="image/*" class="hidden" @change="onLogoPicked" />
        </div>

        <!-- Title (click to edit) -->
        <div class="min-w-0">
          <template v-if="!isEditingTitle">
            <h3 class="text-2xl font-medium truncate cursor-text text-text-primary" @click="startEditTitle"
              title="Click to rename">
              {{ editableTitle }}
            </h3>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <input ref="titleInputRef" v-model="editableTitle"
                class="px-2 py-1 rounded-md border border-border bg-g-input text-text-primary text-xl font-medium outline-none min-w-[120px] max-w-[220px]"
                @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelEditTitle" @blur="saveTitle" />
            </div>
          </template>
        </div>
      </div>

      <!-- Tabs -->
      <!-- <SwitchTab v-model="switchState" :options="[
        { label: 'Details', value: 'details' },
        { label: 'Active logs', value: 'active-logs' }
      ]" /> -->
      <!-- Appearance / Theme Mode -->
      <div class=" mt-5">
        <h3 class="text-sm font-medium text-text-secondary mb-2">Theme Mode</h3>
        <div class="space-y-2 flex gap-4  ">
          <label
            :class="{ '!border-accent !border-2 shadow-md shadow-accent-hover/30 !bg-accent-hover/40': theme == 'light' }"
            class="flex flex-auto justify-center cursor-pointer  rounded-lg border-border border h-30  bg-bg-card items-center gap-2 text-sm"
            @click="setTheme('light')">
            <input class="hidden" type="radio" value="light" v-model="theme" />
            <i class="text-2xl fa-regular fa-sun"></i>
          </label>
          <label
            :class="{ '!border-accent !border-2 shadow-md shadow-accent-hover/30 !bg-accent-hover/10': theme == 'dark' }"
            class="flex flex-auto rounded-lg justify-center cursor-pointer border-border border h-30 items-center gap-2 text-sm"
            @click="setTheme('dark')">
            <input class="hidden" type="radio" value="dark" v-model="theme" />
            <i class="text-2xl fa-regular fa-moon"></i>
          </label>
        </div>
      </div>

      <!-- ===== DETAILS ===== -->
      <div v-if="switchState === 'details'" class="space-y-6 w-full">
        <hr class="mt-6 border-t border-border" />

        <!-- ===== SHARE / INVITE ===== -->
        <!-- <div>
          <div class="flex items-end flex-col gap-2">
            <BaseEmailChip class="w-full" label="Share" v-model="inviteEmails" :error="!!emailError"
              :message="emailError" showName @invalid="onEmailsInvalid" @add="onEmailsAdd" />

          </div>

          <div class="mt-4 flex gap-3">
           <button
              class="flex-1 border rounded-md py-2 px-4 text-sm flex items-center justify-center gap-1 border-border hover:bg-bg-surface transition-colors"
              type="button" @click="copyInviteLink">
              <FontAwesomeIcon :icon="['fas', 'link']" /> Copy Link
            </button>

            <button
              class="flex-1 cursor-pointer rounded-md py-2 px-4 text-sm bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              type="button" :disabled="!canInvite || inviting" @click="sendInvites">
              {{ inviting ? 'Sending…' : 'Share' }}
            </button>
          </div>
        </div> -->

        <!-- Members list -->
        <div class="mt-4 space-y-3">
          <div v-for="user in people" :key="user._id || user.id" class="flex items-center justify-between py-2.5">
            <div class="flex items-start gap-3 w-full">
              <div
                class="w-9 h-9 aspect-square rounded-full flex items-center justify-center bg-bg-surface text-text-primary font-semibold">
                {{ getInitials(user?.name) }}
              </div>

              <div class="w-full">
                <div class="flex justify-between w-full items-start">
                  <div>
                    <div class="text-sm font-medium text-text-secondary capitalize">
                      {{ user.name }}
                    </div>
                    <div class="text-xs text-text-secondary">{{ user.email }}</div>
                  </div>

                  <div class="space-x-2 flex items-center">
                    <span v-if="user.status != 'accepted'" :class="[
                      'rounded-lg px-2 mt-1 inline-flex justify-center items-center py-0.5 text-xs',
                      statusStyle(user.status)
                    ]">
                      {{ user.status }}
                    </span>

                    <DropMenu :items="getMenuItems(user)">
                      <template #trigger>
                        <i class="fa-solid fa-ellipsis cursor-pointer"></i>

                      </template>
                    </DropMenu>
                  </div>
                </div>

                <div v-if="user.role === 'Owner'" class="text-sm text-text-secondary font-medium">
                  {{ user.role }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-t border-border" />
        <!-- Usage -->
        <div class="space-y-6 rounded-xl w-full max-w-md">
          <!-- Color Palette -->
          <div>
            <h3 class="text-sm font-medium text-text-secondary mb-2">Color</h3>
            <div class="grid grid-cols-5 gap-2">
              <button v-for="(color, index) in colors" :key="index" type="button"
                class="w-13 h-13 rounded-full cursor-pointer border-2"
                :class="selectedColor === color.value ? 'border-text-primary' : 'border-transparent'"
                :style="{ backgroundColor: color.color }" @click="selectColor(color.value)" aria-label="Select color" />
            </div>
          </div>

          <!-- Theme Gallery -->
          <div>
            <h3 class="text-sm font-medium text-text-secondary mb-2">Theme</h3>
            <div class="grid grid-cols-4 gap-2.5">
              <button v-for="(th, index) in themes" :key="index" type="button"
                class="h-12 w-full rounded-md overflow-hidden border-2"
                :class="selectedTheme === th ? 'border-accent' : 'border-transparent'" @click="selectTheme(th)"
                aria-label="Select theme">
                <img :src="th" class="h-12 w-full object-cover" />
              </button>
            </div>
          </div>


          <div>
            <h3 class="text-sm font-medium text-text-secondary mb-2">Usage</h3>
            <div class="bg-bg-body rounded-xl p-4 space-y-3">
              <div class="flex items-center gap-2 text-text-primary text-base font-medium">
                <i class="fa-regular fa-cloud"></i>
                <span>Storage (80% full)</span>
              </div>
              <div class="h-2 w-full bg-border/60 rounded-full overflow-hidden">
                <div class="h-full bg-accent rounded-full" style="width: 80%"></div>
              </div>
              <div class="text-sm text-text-secondary">11.98 GB of 15 GB used</div>
            </div>
          </div>

          <hr class="border-t border-border" />

          <div>
            <!-- <h3 class="text-sm font-medium text-text-secondary mb-2">Danger Zone</h3> -->
            <div class="bg-bg-body rounded-xl p-4 space-y-3">
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-text-primary">Delete Workspace</h4>
                  <p class="text-xs text-text-secondary mt-1">
                    Permanently delete this workspace and all of its data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button type="button"
                class="w-full px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="openDeleteModal">
                Delete Workspace
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ===== ACTIVE LOGS ===== -->
      <ActivityTimeline v-else />
    </div>

  </div>

  <!-- Delete Workspace Confirmation Modal (Outside side panel for full screen) -->
  <ConfirmDeleteModal v-model="showDeleteModal" title="Delete Workspace" :item-label="'workspace'"
    :item-name="displayTitle" :require-match-text="displayTitle" :loading="isDeletingWorkspace"
    confirm-text="Delete Workspace" size="lg" @confirm="handleDeleteWorkspace" @cancel="showDeleteModal = false">
    <template #message>
      <p class="text-sm text-text-secondary">
        This action cannot be undone. This will permanently delete the workspace <span
          class="font-semibold text-text-primary">{{ displayTitle }}</span> and all of its data, including:
      </p>
      <ul class="mt-2 text-sm text-text-secondary list-disc list-inside space-y-1">
        <li>All tasks and cards</li>
        <li>All team members and permissions</li>
        <li>All files and attachments</li>
        <li>All workspace settings</li>
      </ul>
    </template>
  </ConfirmDeleteModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import theme1 from '../../../assets/theme/theme1.svg'
import theme2 from '../../../assets/theme/theme2.svg'
import theme3 from '../../../assets/theme/theme3.svg'
import theme4 from '../../../assets/theme/theme4.svg'
import theme5 from '../../../assets/theme/theme5.svg'
import theme6 from '../../../assets/theme/theme6.svg'
import theme7 from '../../../assets/theme/theme7.svg'
import ActivityTimeline from './ActivityTimeline.vue'
import { useWorkspaceStore } from '../../../stores/workspace'
// import Dropdown from '../../../components/ui/Dropdown.vue'
import { getInitials } from '../../../utilities'
import { useDeleteInvitedPeople, useDeleteWorkspace, useInvitePeople, useUpdateWorkspaceDetail, useWorkspacesRoles } from '../../../queries/useWorkspace'
import { usePermissions } from '../../../composables/usePermissions'
const { canInviteUser, canEditUser } = usePermissions()
// import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import DropMenu from '../../../components/ui/DropMenu.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { useTheme } from '../../../composables/useTheme'
import dummy from "../../../assets/global/dummy.jpeg"
import { useRouteIds } from '../../../composables/useQueryParams'
import { usePrivateUploadFile } from '../../../queries/useCommon'
import ConfirmDeleteModal from '../../../views/Product/modals/ConfirmDeleteModal.vue'
import { useRouter } from 'vue-router'
const queryClient = useQueryClient()
const router = useRouter()
const { workspaceId } = useRouteIds();
const { theme, setTheme } = useTheme()
const props = defineProps<{ workspace: any }>()
const { mutate: updateWS } = useUpdateWorkspaceDetail({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  }
});
/* ----- Stores / Queries ----- */
const workspaceStore = useWorkspaceStore()
const { data: roles } = useWorkspacesRoles(props.workspace._id)
// const updateRole = useUpdateInvitedWorkspace()
const deleteUser = useDeleteInvitedPeople({
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] })
})
const { mutate: invitePeople } = useInvitePeople()

/* ----- UI State ----- */
const switchState = ref<'details' | 'active-logs'>('details')
const selectedColor = ref<string>('#ffffff')
const selectedTheme = ref<string>('')
const themes = [theme1, theme2, theme3, theme4, theme5, theme6, theme7, theme6]
const colors = [
  { color: '#EDEEF0', value: '#EDEEF0' },
  { color: '#3CBAFB', value: '#D4F0FF80' },
  { color: '#266FD4', value: '#B0BFD3' },
  { color: '#EEA832', value: '#EEA8321A' },
  { color: '#E82368', value: '#D7B0BE' },
  { color: '#2B2C30', value: '#B1B2B2' },
  { color: '#4026D4', value: '#B6B0D3' },
  { color: '#0DDAB1', value: '#ABD4CC' },
  { color: '#1EA0DC', value: '#AFC9D5' },
  { color: '#2587BC', value: '#B0C4CE' }
]

/* ----- Safer accessors ----- */
const people = computed(() => props.workspace?.people ?? [])
const displayTitle = computed(() => props.workspace?.variables.title ?? 'Workspace')

/* ----- Title: inline edit ----- */
const isEditingTitle = ref(false)
const editableTitle = ref(displayTitle.value)
const titleInputRef = ref<HTMLInputElement | null>(null)

watch(displayTitle, (t) => {
  if (!isEditingTitle.value) editableTitle.value = t
})

function startEditTitle() {
  isEditingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}
function cancelEditTitle() {
  isEditingTitle.value = false
  editableTitle.value = displayTitle.value
}
function saveTitle() {
  const t = editableTitle.value?.trim()
  if (!t || t === displayTitle.value) {
    isEditingTitle.value = false
    return
  }
  isEditingTitle.value = false
  updateWS({
    workspace_id: workspaceId.value,
    variables: {

      'title': editableTitle.value
    }
  })
}

/* ----- Logo: upload on hover click ----- */
const logoInputRef = ref<HTMLInputElement | null>(null)
const isUploadingLogo = ref(false)
const logoPreview = ref<string>('')

function triggerLogoPicker() {
  logoInputRef.value?.click()
}
const { mutate } = usePrivateUploadFile({
  onSuccess: (data: any) => {
    const url: string | undefined = data?.data?.url;
    if (!url) {
      toast.error('Upload succeeded but no URL was returned.');
      return;
    }
    updateWS({
      workspace_id: workspaceId.value,
      logo: url
    })

  },
  onError: (err: any) => {
    console.error('File upload failed', err);
    toast.error('File upload failed. Please try again.');
  },
});

async function onLogoPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input?.files?.length) {
    const selectedFile = input.files[0];
    const fd = new FormData();
    fd.append('file', selectedFile);
    mutate(fd);
  }
  isUploadingLogo.value = true
}

/* ----- Invite state ----- */
const inviteEmails = ref<string[]>([])
const emailError = ref<string>('')
const inviteRole = ref<string>('')

watch(
  roles,
  (val) => {
    if (Array.isArray(val) && val.length && !inviteRole.value) {
      inviteRole.value = val[0]._id
    }
  },
  { immediate: true }
)

const canInvite = computed(() => canInviteUser.value && inviteEmails.value.length > 0 && !emailError.value && !!inviteRole.value)

// function onEmailsInvalid(bad: string[]) {
//   emailError.value = bad.length ? `Invalid: ${bad.join(', ')}` : ''
// }
// function onEmailsAdd() {
//   emailError.value = ''
// }

function extractNameFromEmail(email: string) {
  const local = (email.split('@')[0] || '').split('+')[0]
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
  if (!parts.length) return email
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}

// async function copyInviteLink() {
//   try {
//     const url = window.location.href
//     await navigator.clipboard.writeText(url)
//     toast.success('Invite link copied')
//   } catch {
//     toast.error('Could not copy link')
//   }
// }
function sendInvites() {
  if (!canInvite.value) return
  if (!canInviteUser.value) return
  invitePeople(
    {
      workspace_id: props.workspace._id,
      // workspace_role_id: inviteRole.value,
      emails: inviteEmails.value.map(e => ({ name: extractNameFromEmail(e), email: e }))
    },
    {
      onSuccess: (data: any) => {
        if (data?.failed)
          toast.error(data?.failedInvites[0]?.error)
        else toast.success('Invite sent successfully')
        queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        inviteEmails.value = []
        emailError.value = ''
      },
      onError: (err: any) => {
        emailError.value = err?.response?.data?.message || err?.message || 'Failed to send invitations.'
      }
    }
  )
}

/* ----- Member status & actions ----- */
const statusStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-600 text-white'
    case 'accepted':
      return 'bg-blue-600 text-white'
    case 'rejected':
      return 'bg-red-600 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

function getMenuItems(user: any) {
  const items = [
    {
      label: 'Remove User',
      danger: true,
      action: () => handleRemoveUser(user)
    }
  ] as any[]

  if (user.status !== 'accepted') {
    items.push({
      label: 'Reinvite',
      action: () => {
        inviteEmails.value = [user.email]
        sendInvites()
      }
    })
  }
  return items
}

function handleRemoveUser(user: any) {
  if (!canEditUser.value) return
  deleteUser.mutate({ id: user.id })
}

/** keep a local, reactive mirror of user->role for optimistic UI */
const userRoleById = ref<Record<string, string>>({})
function normalizeId(v: unknown) {
  return String(v ?? '')
}

function seedRolesFromProps() {
  const map: Record<string, string> = {}
  for (const u of props.workspace?.People ?? []) {
    const uid = normalizeId(u._id ?? u.id)
    if (!uid) continue
    map[uid] = normalizeId(u.role_id)
  }
  userRoleById.value = map
}
watch(() => props.workspace?.People, seedRolesFromProps, { deep: true, immediate: true })

// function getUserRole(user: any) {
//   const uid = normalizeId(user._id ?? user.id)
//   return userRoleById.value[uid] ?? normalizeId(user.role_id)
// }

// function handleUpdateRole(user: any, val: string | number) {
//   const uid = normalizeId(user._id ?? user.id)
//   const next = normalizeId(val)
//   const prev = getUserRole(user)

//   userRoleById.value[uid] = next

//   updateRole.mutate(
//     { id: user._id ?? user.id, payload: { role_id: next } },
//     {
//       onSuccess: () => {
//         user.role_id = next
//       },
//       onError: () => {
//         userRoleById.value[uid] = prev
//       }
//     }
//   )
// }
function hexToRgba(hex: string, alpha = 0.3) {
  let h = hex.trim();
  if (!h.startsWith('#')) h = `#${h}`;
  // Expand #RGB -> #RRGGBB
  if (/^#([0-9a-f]{3})$/i.test(h)) {
    h = '#' + h.slice(1).split('').map(c => c + c).join('');
  }
  // Strip any existing alpha (#RRGGBBAA -> #RRGGBB)
  if (/^#([0-9a-f]{8})$/i.test(h)) {
    h = '#' + h.slice(1, 7);
  }
  if (!/^#([0-9a-f]{6})$/i.test(h)) {
    // Fallback: if not hex, just return the input (or you could handle rgb/hsl here)
    return hex;
  }

  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ----- Simple helpers for palette / theme / menu ----- */
function selectColor(value: string) {
  selectedColor.value = value;
  const color30 = hexToRgba(value, 0.3); // 30% opacity
  workspaceStore.setBackground(color30);
}

function selectTheme(th: string) {
  selectedTheme.value = th
  workspaceStore.setBackground(`url(${th})`)
}
// function setMenu(kind: 'classic' | 'modern') {
//   workspaceStore.setMenuType(kind)
// }

/* ----- Close ----- */
function closeHandler() {
  workspaceStore.toggleSettingPanel()
}

/* ----- Delete Workspace ----- */
const showDeleteModal = ref(false)
const isDeletingWorkspace = ref(false)

const { mutate: deleteWorkspace } = useDeleteWorkspace({
  onSuccess: () => {
    toast.success('Workspace deleted successfully')
    queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    showDeleteModal.value = false
    workspaceStore.toggleSettingPanel()
    router.push('/')
  },
  onError: (err: any) => {
    isDeletingWorkspace.value = false
    const message = err?.response?.data?.message || err?.message || 'Failed to delete workspace'
    toast.error(message)
  }
})

function openDeleteModal() {
  showDeleteModal.value = true
}

function handleDeleteWorkspace() {
  isDeletingWorkspace.value = true
  deleteWorkspace({ id: props.workspace._id })
}
</script>