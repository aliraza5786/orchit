<script setup lang="ts">
import Table from '../../../components/ui/Table.vue'
import { h, ref, computed, watch } from 'vue'
import { formatDate } from '../../../utilities/FormatDate'
import Collaborators from '../../../components/ui/Collaborators.vue'
import { useRouter } from 'vue-router'
import { useWorkspaces } from '../../../queries/useWorkspace'
import InviteUsersWithPermissions from '../Modals/InviteUsersWithPermissions.vue'

const router = useRouter()

/* ------------ Column render helpers ------------ */
const dateCache = new Map<string, string>()
const getCachedDate = (dateStr: string) => {
    if (!dateCache.has(dateStr)) dateCache.set(dateStr, formatDate(dateStr))
    return dateCache.get(dateStr)!
}

const handleClick = (rowEvt: any) => {
    const r = rowEvt.row
    const jobId = r?.LatestTask?.job_id
    if (jobId) localStorage.setItem('jobId', jobId)
    else localStorage.removeItem('jobId')
    router.push(`/workspace/peak/${r?._id}/${jobId || ''}`)
}

const showInviteModal = ref(false)
const selectedInvitingWorkspaceId = ref<string | number | undefined>(undefined)


const openInviteModal = (workspaceId: string | number) => {
    selectedInvitingWorkspaceId.value = workspaceId
    showInviteModal.value = true
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

const renderProjectType = ({ value }: any) =>
    h('span', { class: 'capitalize' }, value?.['workspace-type'] || '-')

const renderPeople = ({ row, value }: any) =>
    h('div', { class: 'flex items-center -space-x-3' }, [
        h(Collaborators, { avatars: value || [], image: true, maxVisible: 3 }),
        h('button', {
            class:row.has_permission_to_manage_user? 'flex justify-center items-center rounded-full border border-border text-xs bg-bg-dropdown cursor-pointer hover:bg-bg-dropdown-menu-hover transition  h-8 w-8 cursor-pointer': 'hidden',
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
  const owner = row?.owner;
  if (!owner) return h('span', '-');

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  // Function to generate consistent color from string
  const getColorFromString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 50%)`; // adjust saturation/lightness as needed
  }

  // Render avatar or initials
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
  ]);
};


 

/* ------------ Table columns ------------ */
const columns = [
    { key: 'variables', label: 'Project', render: renderProject },
    { key: 'variables', label: 'Project type', render: renderProjectType },
    { key: 'People', label: 'People', render: renderPeople },
    { key: 'created_at', label: 'Start Date', render: renderStartDate },
    { key: 'admin', label: 'Workspace Owner', render:  renderCompanyAdmin },

]

/* ------------ Internal pagination + sort state ------------ */
const page = ref(1)
const pageSize = ref(10)

/* ------------ Data fetching (server mode) ------------ */
/** useWorkspaces must accept reactive { page, pageSize, sort } and refetch when they change */
const { data, isPending } = useWorkspaces(page, pageSize)

/** Unwrap API shape: { workspaces: any[]; pagination: { totalCount: number } } */
const items = computed(() => data.value?.workspaces ?? [])
console.log(items.value)
const totalCount = ref(0)

watch(data, () => {
    if (data.value?.pagination?.totalCount)
        totalCount.value = data.value?.pagination?.totalCount;
})
</script>

<template>
    <Table :columns="columns" :rows="items" :loading="isPending" :total="totalCount" v-model:page="page"
        v-model:pageSize="pageSize" :pageSizes="[10, 20, 50, 100]" >
        <!-- Optional slots you were using -->
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
    <InviteUsersWithPermissions v-model="showInviteModal" :defaultWorkspaceId="selectedInvitingWorkspaceId" />
</template>
