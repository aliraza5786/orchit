<template>



  <div class="flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
    <div class="header px-4 py-3 border-b  border-border flex items-center justify-between gap-1">
      <Dropdown prefix="View By" v-model="selectedSprintId" :options="sprintsList?.sprints" variant="secondary"
        @edit-option="openEditSprintModal" @delete-option="handleDeleteSprint">
        <template #more>
          <div @click="openSprintModal()"
            class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap ">
            <i class="fa-solid fa-plus"></i> Add new
          </div>
        </template>
      </Dropdown>
      <div class="flex gap-3 items-center ">
        <SearchBar placeholder="Search in Orchit AI space">
        </SearchBar>
        <Button v-if="sprintDetailData?.status == 'active'" size="sm" @click="handleCompleteSprint">{{
          isCompletingSprint ?
          'Ending...' : 'End' }}</Button>
        <Button v-else size="sm" @click="openStartSprintModal">Start Sprint</Button>

      </div>
    </div>
    <template v-if="sprintDetailData?.status == 'active'">
      <ActiveSprint :sptint_id="selectedSprintId" />
    </template>
    <div v-else class="space-y-6 p-4 w-full flex-auto overflow-y-auto">
      <!-- Header -->

      <div class="flex flex-col gap-6">
        <section class="space-y-4 bg-bg-surface/30 p-4 rounded-md">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">Sprint ({{firstSprint?.tickets?.length}} Taks)</h2>

          </div>
          <div v-if="isSprintPending" class="w-full h-full min-h-[250px] flex justify-center items-center">
            <div role="status" aria-label="Loading"
              class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"></div>

          </div>
          <SprintCard v-else :sprintId="selectedSprintId" v-if="firstSprint" :sprint="firstSprint"
            @open-ticket="openTicket" @edit-sprint="openEditSprint" @toggle-start="toggleStartSprint"
            @move-selected-to-backlog="moveSelectedToBacklog"
            @delete-selected-sprint="(id) => deleteSelected('sprint', id)" @refresh="handleRefresh" />
        </section>
        <section class="space-y-4 bg-bg-surface/30 p-4 rounded-md">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">Backlog ({{ backlogResp?.cards?.length }} Tasks)</h2>
            <div class="flex items-center gap-2">
              <button
                class=" w-8 h-8 rounded-md border  cursor-pointer aspect-square text-sm border-border  hover:bg-gray-50"
                @click="openCreateBacklogTicket">
                <i class="text-text-primary fa-regular fa-plus"></i>
              </button>
            </div>
          </div>
          <div v-if="isBacklogPenidng" class="w-full h-full  min-h-[250px] flex justify-center items-center">
            <div role="status" aria-label="Loading"
              class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"></div>

          </div>
          <BacklogTable v-else :sorters="sorters" @move-selected-to-sprint="moveSelectedToSprint"
            @delete-selected-backlog="deleteSelected('backlog')" @open-ticket="openTicket"
            @ticket-moved-to-backlog="handleTicketMovedToBacklog" />
        </section>


      </div>


    </div>
  </div>
  <!-- <div v-else
      class="flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
      <div class="empty-state w-full flex flex-col h-full justify-center items-center ">
        <img src="../../assets/emptyStates/sprint-plan.svg" class="mb-4" alt="backlog-plan">
        <h6 class="text-sm text-text-primary font-semibold mb-1 text-center">Plan your sprint</h6>
        <p class="text-sm text-text-primary/90 mb-3 max-w-120 text-center">Drag work items from the <span
            class="font-bold">
            Backlog
          </span>
          section or create new ones to plan the
          work for this sprint. Select <span class="font-bold">Start sprint</span> when you're ready.</p>
        <Button @click="openSprintModal">Create Sprint</Button>
      </div>
    </div> -->


  <!-- Modals -->
  <ConfirmDeleteModal @click.stop="" v-model="showSprintDelete" title="Delete Sprint" itemLabel="Sprint"
    :itemName="selectedSprint?.title" :requireMatchText="selectedSprint?.title" confirmText="Delete Ticket"
    cancelText="Cancel" size="md" :loading="isDeleting" @confirm="handleDeleteTicket" @cancel="() => {
      selectedSprint = null;
      showSprintDelete = false
    }">

  </ConfirmDeleteModal>
  <!-- <TicketModal v-model="ticketModalOpen" :editing="!!editingTicket" :ticket="editingTicket" @save="handleSaveTicket" />
  <SprintModal v-model="sprintModalOpen" @save="saveSprintHandler" :sprint="selectedSprint"
    :creatingSprint="selectedSprint ? isUpdatingSprint : creatingSprint" /> -->
  <StartSprintModal :sprint="selectedSprint" v-model="startsprintModalOpen" @save="startSprintHandler"
    :creatingSprint="isStartingSprint || isUpdatingSprint2"   />
  <!-- <CreateBacklogTicket v-model="isCreateTicketModalOpen" /> -->

</template>

<script setup lang="ts">
import BacklogTable from './components/BacklogTable.vue'
import SprintCard from './components/SprintCard.vue'
// import TicketModal from './modals/TicketModal.vue'
// import SprintModal from './modals/SprintModal.vue'
import { computed, ref, watch } from 'vue'
import { useBacklogStore, type Ticket } from './composables/useBacklogStore'
import Button from '../../components/ui/Button.vue'
import Dropdown from '../../components/ui/Dropdown.vue'
import SearchBar from '../../components/ui/SearchBar.vue'
import { useBacklogList, useCompleteSprint, useDeleteSprint, useRemoveCardFromSprint, useSprintCard, useSprintDetail, useSprintList, useStartSprint, useUpdateSprint } from '../../queries/usePlan'
import { toast } from 'vue-sonner'
import { useWorkspaceId } from '../../composables/useQueryParams'
import { useQueryClient } from '@tanstack/vue-query'
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue'
import StartSprintModal from './modals/StartSprintModal.vue'
// import CreateBacklogTicket from './modals/CreateBacklogTicket.vue'
import ActiveSprint from './components/ActiveSprint.vue'
const { workspaceId } = useWorkspaceId();
const isCreateTicketModalOpen = ref(false)
const {
  // backlog, sprints,
  // selectedBacklogIds, selectedSprintIds,
  moveSelectedToSprint, moveSelectedToBacklog, deleteSelected,
   saveSprintMeta, toggleStartSprint
} = useBacklogStore()
const { data: backlogResp,  } = useBacklogList(workspaceId)

// delete sprint
const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
    showSprintDelete.value = false
  }
})
const selectedSprint = ref<any>(null)
const showSprintDelete = ref(false)
const handleDeleteTicket = () => {
  deleteSprint(selectedSprint.value?._id)
}
const { mutate: updateSprint2, isPending: isUpdatingSprint2 } = useUpdateSprint(
  {
    onSuccess: (data: any) => {
      saveSprintMeta({ name: data.title })
      startSprint({
        id: selectedSprintId.value,

      })
      // queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
      startsprintModalOpen.value = false;
    }
  }
)
const { mutate: startSprint, isPending: isStartingSprint } = useStartSprint({
  onSuccess:()=>{
    refetchSprintDetail();

  }
})
const startSprintHandler = (e: any) => {
  console.log('helo', selectedSprint.value, e);

  updateSprint2({
    id: selectedSprintId.value,
    payload: {
      goal: e.goal,
      start_date: e.start,
      end_date: e.end
    }
  })
}
const { data: sprintsList, refetch: refetchSprints, } = useSprintList(workspaceId.value);
const {  refetch: refetchBacklog, isPending: isBacklogPenidng } = useBacklogList(workspaceId);
const firstSprintId = computed(() => sprintsList?.value?.sprints[0]?._id);
const selectedSprintId = ref(firstSprintId.value)
watch(() => firstSprintId.value, (newVal) => {
  selectedSprintId.value = newVal;
})
// const openSprintMadal = () => {
//   sprintModalOpen.value = true
// }

const { data: sprintDetailData, refetch: refetchSprintDetail } = useSprintDetail(firstSprintId)
const startsprintModalOpen = ref(false);
const openStartSprintModal = () => {
  startsprintModalOpen.value = true

}
const { data: sprintData, isPending: isSprintPending } = useSprintCard(selectedSprintId);

watch(() => isSprintPending.value, (newVal) => {
  console.log(newVal, isSprintPending.value, '>>>> laoding state changes');

  // loadingState.value=newVal; 
})
// Convert API sprint to store Sprint format with cards
const firstSprint = computed(() => {
  const apiSprint = sprintData?.value?.backlog_items
  if (!apiSprint) return null

  // Map sprint cards from API
  const sprintCards = (sprintData?.value?.backlog_items || []).map((c: any) => {
    const v = c?.card?.variables || {}
    const id = c?.card?._id || c.card_id

    return {
      id,
      key: (v['card-code'] as string) || id?.slice(-6) || 'PRJ-?',
      summary: (v['card-title'] as string) || '(untitled)',
      type: 'Story' as const,
      status: mapStatus(String(v['card-status'] || '').trim()),
      assignee: c?.card?.assigned_to?.name || 'Unassigned',
      storyPoints: Number(c.story_points || 0),
      priority: mapPriority(String(v['priority'] || '').trim()),
      createdAt: c?.card?.created_at || new Date().toISOString(),
      description: (v['card-description'] as string) || '',
    }
  })

  return {
    id: apiSprint._id,
    name: apiSprint.title || 'Sprint 1',
    title: apiSprint.title,
    goal: '',
    start: '',
    end: '',
    started: false,
    tickets: sprintCards
  }
})

function mapStatus(s: string): 'Todo' | 'In Progress' | 'Done' {
  const normalized = s.toLowerCase()
  if (normalized.includes('progress')) return 'In Progress'
  if (normalized.includes('done') || normalized.includes('complete')) return 'Done'
  return 'Todo'
}

function mapPriority(p: string): 'Highest' | 'High' | 'Medium' | 'Low' {
  const s = p.toLowerCase()
  if (s === 'highest' || s === 'blocker' || s === 'critical') return 'Highest'
  if (s === 'high' || s === 'major') return 'High'
  if (s === 'medium' || s === 'normal') return 'Medium'
  return 'Low'
}

const { mutate: removeCardFromSprint } = useRemoveCardFromSprint({
  onSuccess: () => {
    toast.success('Card removed from sprint successfully')
    handleRefresh()
  },
  onError: (error: any) => {
    toast.error('Failed to remove card from sprint')
    console.error('Failed to remove card from sprint:', error)
  }
})

function handleRefresh() {
  refetchSprints()
  refetchBacklog()
  refetchSprintDetail()
}

function handleTicketMovedToBacklog(ticketId: string) {
  console.log('>>> moving back to backlog');

  if (!selectedSprintId) return

  removeCardFromSprint({
    sprintId: selectedSprintId,
    cardId: ticketId
  })
}
// sorters (example: createdAt)
const sorters = {
  createdAt: (a: any, b: any, dir: 'asc' | 'desc') => {
    const av = new Date(a.createdAt).getTime()
    const bv = new Date(b.createdAt).getTime()
    return dir === 'asc' ? av - bv : bv - av
  },
}

// Ticket modal state
const ticketModalOpen = ref(false)
const editingTicket = ref<Ticket | null>(null)
let createTarget: 'backlog' | 'sprint' = 'backlog'

function openCreateBacklogTicket() {
  isCreateTicketModalOpen.value = true;
  editingTicket.value = null
  createTarget = 'backlog'
  // ticketModalOpen.value = true
}

function openTicket(t: Ticket) {
  editingTicket.value = t
  createTarget = 'backlog' // not used on edit path
  ticketModalOpen.value = true
}
// function handleSaveTicket(partial: Partial<Ticket>) {
//   if (editingTicket.value) {
//     Object.assign(editingTicket.value, partial)
//   } else {
//     createTicket(createTarget, {
//       summary: partial.summary!,
//       type: partial.type as Ticket['type'],
//       status: (partial.status as Ticket['status']) || 'Todo',
//       assignee: (partial.assignee?.trim() || 'Unassigned'),
//       storyPoints: Number(partial.storyPoints) || 0,
//       priority: partial.priority as Ticket['priority'],
//       description: partial.description || ''
//     })
//   }
// }

// Sprint modal state (edit only)
const sprintModalOpen = ref(false)
function openEditSprint() { sprintModalOpen.value = true }
const queryClient = useQueryClient();
// const { mutate: createSprint } = useCreateSprint({
//   onSuccess: (data: any) => {
//     saveSprintMeta({ name: data.title })
//     queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
//     sprintModalOpen.value = false;
//   }
// });
// const { mutate: updateSprint, } = useUpdateSprint(
//   {
//     onSuccess: (data: any) => {
//       saveSprintMeta({ name: data.title })
//       queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
//       sprintModalOpen.value = false;
//     }
//   }
// )
// function saveSprintHandler(e: any) {
//   if (selectedSprint.value) {
//     updateSprint(
//       {
//         id: selectedSprint.value?._id,
//         payload: {
//           "workspace_id": workspaceId.value,
//           "title": e.name,
//         }
//       }
//     )
//   } else {
//     createSprint({
//       payload: {
//         "workspace_id": workspaceId.value,
//         "title": e.name,
//       }
//     });
//   }

// }
function openSprintModal() {
  selectedSprint.value = null;

  sprintModalOpen.value = true;


}
function openEditSprintModal(e: any) {
  selectedSprint.value = e;
  sprintModalOpen.value = true;
}
function handleDeleteSprint(e: any) {
  selectedSprint.value = e;
  showSprintDelete.value = true
}
const { mutate: completeSprint, isPending: isCompletingSprint } = useCompleteSprint(selectedSprintId, {
  onSuccess: () => {
    refetchSprintDetail();
  }
})

const handleCompleteSprint = () => {
  completeSprint({})
}
</script>