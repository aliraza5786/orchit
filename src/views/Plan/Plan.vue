<template>


  <div v-if="sprintsList?.sprints.length > 0"
    class="flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
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
        <Button size="sm">Start Sprint</Button>
      </div>
    </div>
    <div class="space-y-6 p-4 w-full flex-auto overflow-y-auto">
      <!-- Header -->

      <div class="flex flex-col gap-6">
        <section class="space-y-4 bg-bg-surface/30 p-4 rounded-md">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">Sprint (100 Taks)</h2>

          </div>

          <SprintCard :sprint="sprints[0]" @open-ticket="openTicket" @edit-sprint="openEditSprint"
            @toggle-start="toggleStartSprint" @move-selected-to-backlog="moveSelectedToBacklog"
            @delete-selected-sprint="(id) => deleteSelected('sprint', id)" />
        </section>
        <section class="space-y-4 bg-bg-surface/30 p-4 rounded-md">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">Backlog (100 Taks)</h2>
            <div class="flex items-center gap-2">
              <button
                class=" w-8 h-8 rounded-md border  cursor-pointer aspect-square text-sm border-border  hover:bg-gray-50"
                @click="openCreateBacklogTicket">
                <i class="text-text-primary fa-regular fa-plus"></i>
              </button>
            </div>
          </div>
          <BacklogTable :sorters="sorters" @move-selected-to-sprint="moveSelectedToSprint"
            @delete-selected-backlog="deleteSelected('backlog')" @open-ticket="openTicket" />
        </section>


      </div>


    </div>
  </div>
  <div v-else
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
  </div>

  <!-- Modals -->

  <ConfirmDeleteModal @click.stop="" v-model="showSprintDelete" title="Delete Sprint" itemLabel="Sprint"
    :itemName="selectedSprint?.title" :requireMatchText="selectedSprint?.title" confirmText="Delete Ticket"
    cancelText="Cancel" size="md" :loading="isDeleting" @confirm="handleDeleteTicket" @cancel="() => {
      selectedSprint = null;
      showSprintDelete = false
    }">

  </ConfirmDeleteModal>
  <TicketModal v-model="ticketModalOpen" :editing="!!editingTicket" :ticket="editingTicket" @save="handleSaveTicket" />
  <SprintModal v-model="sprintModalOpen" @save="saveSprintHandler" :sprint="selectedSprint"
    :creatingSprint="selectedSprint ? isUpdatingSprint : creatingSprint" />
</template>

<script setup lang="ts">
import BacklogTable from './components/BacklogTable.vue'
import SprintCard from './components/SprintCard.vue'
import TicketModal from './modals/TicketModal.vue'
import SprintModal from './modals/SprintModal.vue'

import { computed, nextTick, ref } from 'vue'
import { useBacklogStore, type Ticket } from './composables/useBacklogStore'
import Button from '../../components/ui/Button.vue'
import Dropdown from '../../components/ui/Dropdown.vue'
import SearchBar from '../../components/ui/SearchBar.vue'
import { useBacklogList, useCreateSprint, useDeleteSprint, useSprintDetail, useSprintList, useUpdateSprint } from '../../queries/usePlan'
import { useWorkspaceId } from '../../composables/useQueryParams'
import { useQueryClient } from '@tanstack/vue-query'
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue'
const { workspaceId } = useWorkspaceId();
const {
  backlog, sprints,
  selectedBacklogIds, selectedSprintIds,
  moveSelectedToSprint, moveSelectedToBacklog, deleteSelected,
  createTicket, saveSprintMeta, toggleStartSprint
} = useBacklogStore()
// delete sprint
const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
    showSprintDelete.value = false
  }
})
const selectedSprint = ref(null)
const showSprintDelete = ref(false)
const handleDeleteTicket = () => {
  console.log(selectedSprint, '>>>');

  deleteSprint(selectedSprint.value?._id)
}
const { data: sprintsList } = useSprintList(workspaceId.value);
const firstSprintId = computed(() => sprintsList?.value?.sprints[0]?._id);
const selectedSprintId = ref(firstSprintId)
const openSprintMadal = () => {
  sprintModalOpen.value = true
}

const { data: sprintDetail } = useSprintDetail(firstSprintId)
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
  editingTicket.value = null
  createTarget = 'backlog'
  ticketModalOpen.value = true
}
function openCreateSprintTicket() {
  editingTicket.value = null
  createTarget = 'sprint'
  ticketModalOpen.value = true
}
function openTicket(t: Ticket) {
  editingTicket.value = t
  createTarget = 'backlog' // not used on edit path
  ticketModalOpen.value = true
}
function handleSaveTicket(partial: Partial<Ticket>) {
  if (editingTicket.value) {
    Object.assign(editingTicket.value, partial)
  } else {
    createTicket(createTarget, {
      summary: partial.summary!,
      type: partial.type as Ticket['type'],
      status: (partial.status as Ticket['status']) || 'Todo',
      assignee: (partial.assignee?.trim() || 'Unassigned'),
      storyPoints: Number(partial.storyPoints) || 0,
      priority: partial.priority as Ticket['priority'],
      description: partial.description || ''
    })
  }
}

// Sprint modal state (edit only)
const sprintModalOpen = ref(false)
function openEditSprint() { sprintModalOpen.value = true }
const queryClient = useQueryClient();
const { mutate: createSprint, isPending: creatingSprint } = useCreateSprint({
  onSuccess: (data: any) => {
    saveSprintMeta({ name: data.title })
    queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
    sprintModalOpen.value = false;
  }
});
const { mutate: updateSprint, isPending: isUpdatingSprint } = useUpdateSprint(
  {
    onSuccess: (data: any) => {
      saveSprintMeta({ name: data.title })
      queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
      sprintModalOpen.value = false;
    }
  }
)
function saveSprintHandler(e: any) {
  if (selectedSprint.value) {
    updateSprint(
      {
        id: selectedSprint.value?._id,
        payload: {
          "workspace_id": workspaceId.value,
          "title": e.name,
        }
      }
    )
  } else {
    createSprint({
      payload: {
        "workspace_id": workspaceId.value,
        "title": e.name,
      }
    });
  }

}
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
</script>