<script setup lang="ts">
import Table from '../../../components/ui/Table.vue'
import { h, ref, computed, watch } from 'vue'
import { formatDate } from '../../../utilities/FormatDate'
import Collaborators from '../../../components/ui/Collaborators.vue'
import { useRouter } from 'vue-router'
import { useWorkspaces, useDeleteWorkspace, useArchiveWorkspace, useWorkspaceModulesAndUsers } from '../../../queries/useWorkspace'
import InviteUsersWithPermissions from '../Modals/InviteUsersWithPermissions.vue'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'
import { toast } from 'vue-sonner'
import { useQueryClient } from '@tanstack/vue-query'
import ShareModal from '../../../layout/WorkspaceLayout/components/ShareModal.vue'

const router = useRouter()
const queryClient = useQueryClient()

/* ------------ Column render helpers ------------ */
const dateCache = new Map<string, string>()
const getCachedDate = (dateStr: string) => {
  if (!dateCache.has(dateStr)) dateCache.set(dateStr, formatDate(dateStr))
  return dateCache.get(dateStr)!
}
const handleClick = async (rowEvt: any) => {
  const r = rowEvt.row
  const jobId: string | undefined = r?.LatestTask?.job_id
  const workspaceId: string = r._id

  const theme = localStorage.getItem('theme') || 'light'

  // Path we want to land on after redirect
  const peakPath = jobId
    ? `/workspace/peak/${workspaceId}/${jobId}`
    : `/workspace/peak/${workspaceId}`

  const company = r?.company
  const domainLink: string | undefined = company?.domain_link

  // ── Personal workspace (no company / no domain_link) ───────────────────────
  if (!domainLink) {
    if (jobId) {
      localStorage.setItem('jobId', jobId)
    } else {
      localStorage.removeItem('jobId')
    }
    router.push(peakPath)
    return
  }

const queryParams = new URLSearchParams({ theme })
queryParams.set('company_id', company._id)
  const targetUrl = `${domainLink.replace(/\/$/, '')}${peakPath}?${queryParams.toString()}`
  setTimeout(() => {
    window.location.href = targetUrl
  }, 80)
}

const showInviteModal = ref(false)
const selectedInvitingWorkspaceId = ref<string | number | undefined>(undefined)
const showDeleteConfirm = ref(false)
const workspaceToAction = ref<any>(null)
const isDeleting = ref(false)

const showShareModal = ref(false)
const selectedShareWorkspace = ref<any>(null)

const openInviteModal = (workspaceId: string | number) => {
  selectedInvitingWorkspaceId.value = workspaceId
  showInviteModal.value = true
}
const selectedShareWorkspaceId = computed(() => selectedShareWorkspace.value?._id ?? '')

const {
  data: workspaceModulesAndUsers,
  isPending: isModulesAndUsersPending
} = useWorkspaceModulesAndUsers(selectedShareWorkspaceId)

const { mutate: deleteWorkspace } = useDeleteWorkspace({
  onSuccess: () => {
    toast.success('Workspace deleted successfully')
    queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    showDeleteConfirm.value = false
    isDeleting.value = false
  },
  onError: (err: any) => {
    isDeleting.value = false
    toast.error(err?.response?.data?.message || 'Failed to delete workspace')
  }
})

const { mutate: archiveWorkspace } = useArchiveWorkspace({
  onSuccess: () => {
    const msg = props.filter === 'archived' ? 'Workspace unarchived successfully' : 'Workspace archived successfully'
    toast.success(msg)
    queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  },
  onError: (err: any) => {
    toast.error(err?.response?.data?.message || 'Failed to archive workspace')
  }
})

const handleArchive = (row: any) => {
  archiveWorkspace({ id: row._id })
}

const openDeleteConfirm = (row: any) => {
  workspaceToAction.value = row
  showDeleteConfirm.value = true
}

const onConfirmDelete = () => {
  if (!workspaceToAction.value) return
  isDeleting.value = true
  deleteWorkspace({ id: workspaceToAction.value._id })
}

const renderActions = ({ row }: any) => {
  if (props.filter === 'deleted') return h('div', { class: 'h-8' })

  const isArchived = props.filter === 'archived'
  const archiveIcon = isArchived ? 'fa-regular fa-box-archive' : 'fa-solid fa-box-archive'
  const archiveTitle = isArchived ? 'Unarchive' : 'Archive'

  return h(
    'div',
    { class: 'flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity' },
    [
      h(
        'button',
        {
          class: 'p-2 hover:bg-bg-body rounded-md transition-colors text-text-secondary hover:text-text-primary',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleClick({ row })
          },
          title: 'View'
        },
        [h('i', { class: 'fa-regular fa-eye text-sm' })]
      ),

      row.has_permission_to_manage_user
        ? h(
            'button',
            {
              class: 'p-2 hover:bg-bg-body rounded-md transition-colors text-text-secondary hover:text-text-primary',
              onClick: (e: Event) => {
                e.stopPropagation()
                openShareModal(row)
              },
              title: 'Share'
            },
            [h('i', { class: 'fa-regular fa-share-nodes text-sm' })]
          )
        : null,

      row.has_permission_to_manage_user
        ? h(
            'button',
            {
              class: 'p-2 hover:bg-bg-body rounded-md transition-colors text-text-secondary hover:text-text-primary',
              onClick: (e: Event) => {
                e.stopPropagation()
                handleArchive(row)
              },
              title: archiveTitle
            },
            [h('i', { class: `${archiveIcon} text-sm` })]
          )
        : null,

      row.has_permission_to_manage_user
        ? h(
            'button',
            {
              class: 'p-2 hover:bg-red-500/10 rounded-md transition-colors text-red-500 hover:text-red-600',
              onClick: (e: Event) => {
                e.stopPropagation()
                openDeleteConfirm(row)
              },
              title: 'Delete'
            },
            [h('i', { class: 'fa-regular fa-trash-can text-sm' })]
          )
        : null,
    ].filter(Boolean)
  )
}

const renderOrganization = ({ row }: any) => {
  const company = row?.company
  if (!company) return h('span', { class: 'text-text-secondary text-xs' }, '-----')

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const getColorFromString = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`
  }

  const goToDomain = (e: Event) => {
    e.stopPropagation()
    if (!company.domain_link) return

    const theme = localStorage.getItem('theme') || 'light'
    const queryParams = new URLSearchParams({ theme, company_id: company._id })
    const target = `${company.domain_link.replace(/\/$/, '')}/dashboard?${queryParams.toString()}`

    window.location.href = target
  }

  const avatar = company.logo
    ? h('img', {
        src: company.logo,
        alt: company.title,
        class: 'h-6 w-6 rounded-full object-cover',
        loading: 'lazy',
        decoding: 'async',
      })
    : h('div', {
        class: 'h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0',
        style: { backgroundColor: getColorFromString(company.title) }
      }, getInitials(company.title))

  const title = h(
    'span',
    {
      class: company.domain_link
        ? 'text-xs text-text-primary hover:underline cursor-pointer'
        : 'text-xs text-text-primary',
      onClick: company.domain_link ? goToDomain : undefined,
      title: company.domain_link ? `Go to ${company.domain_link}` : company.title,
    },
    company.title
  )

  return h('div', { class: 'flex items-center gap-2' }, [avatar, title])
}

const renderProject = ({ row, value }: any) =>
  h('div', { class: 'flex items-center gap-2' }, [
    row.logo
      ? h('img', {
          src: row.logo,
          alt: value?.title || 'Project',
          class: 'h-8 w-8 bg-bg-card rounded-full object-cover',
          loading: 'lazy',
          decoding: 'async',
        })
      : h('div', { class: 'h-8 w-8 rounded-full bg-bg-card' }),
    h('span', {
      class: 'cursor-pointer hover:underline',
      onClick: (e: Event) => {
        e.stopPropagation()
        handleClick({ row })
      }
    }, value?.title || 'Untitled'),
  ])

const renderCompanyPercentage = ({ row }: any) => {
  const percentage = row?.task_stats?.total_percentage ?? 0

  return h('div', { class: 'flex items-center gap-2 w-full' }, [
    h('div', {
      class: 'flex-1 h-2 rounded-full bg-bg-body border border-border overflow-hidden'
    }, [
      h('div', {
        class: 'h-full rounded-full bg-accent transition-all duration-300',
        style: { width: `${percentage}%` }
      })
    ]),
    h('span', {
      class: 'text-xs text-text-secondary w-7 text-right'
    }, `${percentage}%`)
  ])
}

const renderProjectType = ({ value }: any) =>
  h(
    'span',
    { class: 'capitalize' },
    value?.['workspace-type'] === 'team'
      ? 'Organization'
      : value?.['workspace-type'] || '-'
  )

const renderPeople = ({ row, value }: any) =>
  h('div', { class: 'flex items-center -space-x-3' }, [
    h(Collaborators, { avatars: value || [], image: true, maxVisible: 3 }),
    h('button', {
      class: row.has_permission_to_manage_user
        ? 'flex justify-center items-center rounded-full border border-border text-xs bg-bg-dropdown cursor-pointer hover:bg-bg-dropdown-menu-hover transition h-8 w-8 cursor-pointer'
        : 'hidden',
      onClick: (e: Event) => {
        e.stopPropagation()
        openInviteModal(row._id)
      },
      title: 'Invite Users'
    }, [
      h('i', { class: 'fa-solid fa-plus text-gray-500 text-xs' })
    ])
  ])

const renderStartDate = ({ value }: any) =>
  h('span', getCachedDate(value))

const renderCompanyAdmin = ({ row }: any) => {
  const owner = row?.owner
  if (!owner) return h('span', '-')

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase()

  const getColorFromString = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`
  }

  return h('div', { class: 'flex items-center gap-2' }, [
    owner.profile_img
      ? h('img', {
          src: owner.profile_img,
          alt: owner.name,
          class: 'h-6 w-6 rounded-full object-cover',
          loading: 'lazy',
          decoding: 'async',
        })
      : h('div', {
          class: 'h-8 w-8 border-primary border-2 shadow-md flex items-center justify-center rounded-full text-white text-xs font-medium',
          style: { backgroundColor: getColorFromString(owner.name) }
        }, getInitials(owner.name)),
    h('span', owner.name)
  ])
}

function openShareModal(row: any) {
  selectedShareWorkspace.value = row
  showShareModal.value = true
}

const columns = [
  { key: 'variables',   label: 'Workspace',       render: renderProject,           width: '200px' },
  { key: 'variables',   label: 'Workspace Type',   render: renderProjectType,       width: '150px' },
  { key: 'People',      label: 'People',           render: renderPeople,            width: '120px' },
  { key: 'created_at',  label: 'Start Date',       render: renderStartDate,         width: '100px' },
  { key: 'organization', label: 'Organization',    render: renderOrganization,      width: '150px' },
  { key: 'admin',       label: 'Workspace Owner',  render: renderCompanyAdmin,      width: '180px' },
  { key: 'percentage',  label: 'Percentage',       render: renderCompanyPercentage, width: '150px' },
  { key: 'actions',     label: 'Actions',          render: renderActions,           align: 'right' as const, width: '50px' },
]

const props = defineProps({
  filter: {
    type: String,
    default: 'all'
  }
})

const page = ref(1)
const pageSize = ref(10)
const { data, isPending } = useWorkspaces(page, pageSize, computed(() => props.filter))
const isLoading = computed(() => isPending.value)
const items = computed(() => data.value?.workspaces ?? [])
const totalCount = ref(0)

watch(() => props.filter, () => {
  page.value = 1
})

watch(data, (newVal) => {
  totalCount.value = newVal?.pagination?.totalCount ?? 0
}, { immediate: true })

const emptyMessage = computed(() => {
  switch (props.filter) {
    case 'archived': return 'No archived workspaces'
    case 'deleted': return 'No deleted workspaces'
    case 'private': return 'No private workspaces'
    case 'shared': return 'No shared workspaces'
    default: return 'No workspaces yet — create your first one'
  }
})
</script>

<template>
  <Table
    v-if="isLoading || items.length"
    :columns="columns"
    :rows="items"
    :loading="isLoading"
    :total="totalCount"
    v-model:page="page"
    v-model:pageSize="pageSize"
    :pageSizes="[10, 20, 50, 100]"
    :rowClass="() => 'group'"
    @row-click="handleClick"
  >
    <template #status="{ row }">
      <span class="px-3 py-1 rounded-full text-xs font-medium" :class="{
        'bg-blue-100 text-blue-600': row.status === 'In progress',
        'bg-red-100 text-red-600': row.status === 'Live',
        'bg-green-100 text-green-600': row.status === 'Done'
      }">
        {{ row.status }}
      </span>
    </template>

    <template #team="{ row }">
      <div class="flex -space-x-2">
        <span v-for="(member, i) in row.Roles" :key="i"
          class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs">
          {{ member }}
        </span>
      </div>
    </template>
  </Table>

  <!-- Custom empty state -->
  <div
    v-if="!isLoading && !items.length"
    class="flex flex-col items-center justify-center gap-3 py-20 text-center"
  >
    <div class="grid h-14 w-14 place-items-center rounded-2xl bg-bg-card border border-border/70">
      <i class="fa-regular fa-folder-open text-xl text-text-secondary"></i>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-sm font-medium text-text-primary">{{ emptyMessage }}</p>
      <p class="text-xs text-text-secondary">
        {{ props.filter === 'all' ? 'Get started by creating your first workspace.' : 'Try switching to a different filter.' }}
      </p>
    </div>
  </div>

  <InviteUsersWithPermissions v-model="showInviteModal" :defaultWorkspaceId="selectedInvitingWorkspaceId" />
  <ShareModal
    v-if="selectedShareWorkspace"
    v-model="showShareModal"
    resource-type="workspace"
    :resourceId="selectedShareWorkspace._id"
    :modulesAndUsers="workspaceModulesAndUsers"
    :modulesAndUsersLoading="isModulesAndUsersPending"
    @shared="queryClient.invalidateQueries({ queryKey: ['workspaces'] })"
  />
  <ConfirmDeleteModal
    v-model="showDeleteConfirm"
    title="Delete Workspace"
    :item-label="'workspace'"
    :item-name="workspaceToAction?.variables?.title || 'this workspace'"
    :require-match-text="workspaceToAction?.variables?.title || ''"
    :loading="isDeleting"
    confirm-text="Delete Workspace"
    size="md"
    @confirm="onConfirmDelete"
    @cancel="showDeleteConfirm = false"
  >
    <template #message>
      <p class="text-sm text-text-secondary">
        This action cannot be undone. This will permanently delete the workspace
        <span class="font-semibold text-text-primary">{{ workspaceToAction?.variables?.title }}</span>
        and all of its data.
      </p>
    </template>
  </ConfirmDeleteModal>
</template>