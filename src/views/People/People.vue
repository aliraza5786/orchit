<template>
  <div
    class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <div class="overflow-x-auto shrink-0 border-b border-border mx-4">
      <div class="header py-3 flex items-center justify-between gap-2">
        <div
          class="flex border-b border-border bg-bg-surface/50 gap-2 rounded-md py-1 px-1"
        >
          <button
            @click="currentTab = 'talent'"
            :class="
              currentTab === 'talent'
                ? 'bg-accent text-white rounded-md'
                : 'text-text-primary'
            "
            class="px-4 py-1 text-sm transition-colors text-nowrap"
          >
            View Human
          </button>
          <button
            @click="currentTab = 'agents'"
            :class="
              currentTab === 'agents'
                ? 'bg-accent text-white rounded-md '
                : 'text-text-secondary'
            "
            class="px-4 py-1 text-sm transition-colors text-nowrap"
          >
            View Agents
          </button>
        </div>

        <div class="flex gap-2">
          <Dropdown
            v-if="currentTab === 'talent'"
            :actions="false"
            v-model="selected_view_id"
            :options="viewData"
            variant="secondary"
            customClasses="fixed w-[135px]"
          />
          <Dropdown
            v-if="currentTab === 'agents'"
            :actions="false"
            v-model="selected_view_agent"
            :options="viewAgents"
            variant="secondary"
            customClasses="fixed w-[135px]"
          />
          <div class="flex gap-3 items-center">
            <SearchBar
              class="max-w-[250px]"
              @onChange="
                (e: any) => {
                  searchQuery = e;
                }
              "
              placeholder="Search in Orchit AI space"
            />
            <div
              class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md"
            >
              <button
                class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                :class="
                  currentView === 'kanban'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
                "
                title="Kanban view"
                @click="currentView = 'kanban'"
              >
                <i class="fa-solid fa-chart-kanban"></i>
              </button>

              <button
                @click="currentView = 'table'"
                class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                :class="
                  currentView === 'table'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
                "
                title="List view"
              >
                <i class="fa-solid fa-align-left"></i>
              </button>
              <button
                @click="currentView = 'mindmap'"
                class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                :class="
                  currentView === 'mindmap'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
                "
                title="MindMap view"
              >
                <i class="fa-solid fa-chart-diagram"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

   <KanbanSkeleton v-if="isLoading && currentView !== 'mindmap' && currentView !== 'table'" />
   <div
  v-else-if="isLoading && currentView === 'table'"
  class="flex flex-1 items-center justify-center"
>
  <div class="flex flex-col items-center gap-3 text-text-secondary">
    <i class="fa-solid fa-align-left text-2xl animate-pulse text-accent"></i>
    <span class="text-sm animate-pulse">Loading table...</span>
  </div>
</div>
   <div
  v-else-if="isLoading && currentView === 'mindmap'"
  class="flex flex-1 items-center justify-center"
>
  <div class="flex flex-col items-center gap-3 text-text-secondary">
    <i class="fa-solid fa-chart-diagram text-2xl animate-pulse text-accent"></i>
    <span class="text-sm animate-pulse">Loading mindmap...</span>
  </div>
</div>
    <div v-else class="flex flex-col flex-1 overflow-hidden px-4">
      <template v-if="currentView === 'kanban'">
        <!-- AGENTS KANBAN -->
        <template v-if="currentTab === 'agents'">
          <div class="custom_scroll_bar h-full flex flex-col">
            <Draggable
              v-model="filteredAgentGroups"
              item-key="title"
              group="agent-groups"
              :animation="180"
              class="flex gap-4 mt-4 overflow-x-auto custom_scroll_bar flex-1 cursor-grab"
              direction="horizontal"
              @end="onAgentGroupsEnd"
              :disabled="isMobile"
            >
              <template #item="{ element: group }">
                <div
                  class="flex flex-col min-w-[220px] bg-bg-body h-full rounded-md"
                  :class="{
                    'snap-center min-w-[270px] max-w-[270px]': isMobile,
                    'min-w-[320px] max-w-[320px]': !isMobile,
                  }"
                >
                  <div
                    class="flex justify-between px-5 py-4 border-b border-border"
                  >
                    <div
                      class="text-normal flex gap-2 font-semibold text-text-primary"
                    >
                      <span>{{ group.title }}</span>
                      <span
                        class="text-xs bg-muted bg-bg-card aspect-square flex justify-center items-center text-muted-foreground p-1 min-w-6 rounded-full"
                      >
                        {{ group?.agents.length }}
                      </span>
                    </div>
                    <div
                      class="cursor-pointer"
                      @click="
                        handleAgent({
                          title: group.title,
                          module_id: String(group.module_id),
                        })
                      "
                    >
                      <i class="fa-solid fa-plus"></i>
                    </div>
                  </div>
                  <div
                    class="flex flex-col gap-4 mx-4 mt-4 overflow-y-auto flex-1"
                  >
                    <div
                      v-for="agent in group.agents"
                      :key="agent._id"
                      @click="handleClickAgent(agent)"
                      class="bg-bg-card border border-border rounded-lg px-4 py-3 flex flex-col gap-3"
                    >
                      <div class="flex justify-between items-start">
                        <span class="text-sm font-medium">
                          {{ agent.name }}
                        </span>

                        <span
                          class="text-xs font-semibold px-2 py-0.5 rounded-full"
                          :class="levelClass(agent.level)"
                        >
                          {{ agent.level }}
                        </span>
                      </div>

                      <div class="text-xs text-text-secondary">
                        {{ agent.role }}
                      </div>

                      <div class="text-xs text-accent-hover">
                        {{ agent.model }}
                      </div>
                      <div class="flex justify-between">
                        <div class="flex items-center gap-2 mt-auto">
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="
                              agent.is_active ? 'bg-green-500' : 'bg-gray-400'
                            "
                          />
                          <div class="flex justify-between">
                            <span class="text-xs text-green-500">
                              {{ agent.is_active ? "Active" : "Inactive" }}
                            </span>
                          </div>
                        </div>
                        <div>
                          <button
                            class="bg-accent text-xs rounded-full px-2 py-1 text-white cursor-pointer"
                            @click.stop="
                              handleChatWithAgent(
                                agent,
                                group.module_id,
                                group?.title,
                              )
                            "
                          >
                            Chat Agent
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Draggable>

            <div
              v-if="filteredAgentGroups.length === 0"
              class="p-6 text-center text-text-secondary/50"
            >
              No agents available.
            </div>
          </div>
        </template>

        <!-- TALENT KANBAN -->
        <template v-else>
          <div class="flex flex-1 overflow-x-auto gap-3 custom_scroll_bar py-4 overflow-y-hidden">
            <KanbanBoard
              :plusIcon="selected_view_id === 'team' && canCreateCard"
              v-if="filteredBoard?.length > 0"
              @onPlus="(e) => handlePLus(e)"
              @delete:column="(e: any) => handleDelete(e)"
              @update:column="(e) => handleUpdateColumn(e)"
              @reorder="onReorder"
              @addColumn="handleAddColumn"
              @select:ticket="selectCardHandler"
              :board="filteredBoard"
              @onBoardUpdate="handleBoardUpdate"
              variable_id=""
              sheet_id="selected_sheet_id"
            >
              <template #ticket="{ ticket }">
                <KanbanCard
                  @click="handleClickTicket(ticket)"
                  :ticket="ticket"
                  @deleted="handleSeatDeleted(ticket._id)"
                  @assigned="(res:any) => handleSeatUpdated(ticket._id, res)"
                  @unAssigned="() => handleSeatUpdated(ticket._id, { email: null, name: null, status: 'unassigned' })"
                />
              </template>
              <template #column-footer="{ column }: any">
                <template v-if="selected_view_id === 'team' && canCreateCard">
                  <div
                    v-if="!column.showADDNEW"
                  @click="toggleAddNewColumn(column)"
                  :disabled="!canInviteUser"
                  :class="
                    canInviteUser ? 'cursor-pointer' : 'cursor-not-allowed'
                  "
                  class="flex py-3 px-3 justify-center text-sm text-text-primary items-center gap-3 border border-text-primary border-dashed mb-4 mx-4 rounded-md"
                >
                  <i class="fa-solid fa-plus"></i> Add Seat
                </div>
                <div
                  v-else-if="column.showADDNEW"
                  class="p-4 space-y-2 bg-bg-surface m-4 rounded-md"
                >
                  <p class="text-sm text-text-primary">
                    {{ column.title }} {{ column.cards.length + 1 }}
                  </p>
                  <BaseEmailChip
                    :maxEmails="1"
                    placeholder="team member email"
                    v-model="column.email"
                  />
                  <p class="text-sm text-text-secondary">
                    You can assign user later 
                  </p>
                  <Button size="md" @click="addSeatToColumn(column)">{{
                    isPending ? "Adding..." : "Add Seat"
                  }}</Button>
                  <i
                    class="fa-solid fa-close cursor-pointer ml-2"
                    @click="toggleAddNewColumn('')"
                  ></i>
                </div>
                </template>
              </template>
            </KanbanBoard>
            <BaseModal v-model="showModal" size="md" title="Add Seat">
              <div class="px-6 py-4 space-y-4">
                <p class="text-sm text-text-secondary">
                  {{ modalColumn.title }} &middot; Seat {{ (modalColumn.cards?.length ?? 0) + 1 }}
                </p>
                <BaseEmailChip
                  :maxEmails="1"
                  placeholder="team member email"
                  v-model="modalColumn.email"
                />
                <p class="text-sm text-text-secondary">
                  You can assign a user later
                </p>
              </div>
              <div class="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <Button variant="secondary" @click="closeModal">Cancel</Button>
                <Button variant="primary" @click="addSeatToColumn(modalColumn)">
                  {{ isPending ? "Adding..." : "Add Seat" }}
                </Button>
              </div>
            </BaseModal>
            <!-- Add Column -->
            <div class="min-w-[270px] sm:min-w-[328px]" @click.stop>
              <form
                @submit.prevent=""
                v-if="activeAddList"
                class="bg-bg-body rounded-lg p-4"
              >
                <BaseTextField
                  :autofocus="true"
                  v-model="newColumn"
                  placeholder="Add New list"
                />
                <p class="text-xs mt-1.5">You can add details while editing</p>
                <div class="flex items-center mt-3 gap-3">
                  <Button
                    :disabled="!canCreateVariable"
                    :class="
                      canCreateVariable
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    "
                    @click="emitAddColumn"
                    type="submit"
                    variant="primary"
                    class="px-3 py-1 bg-accent text-white rounded"
                  >
                    {{ addingList ? "Adding..." : "Add Team" }}
                  </Button>
                  <i
                    class="fa-solid fa-close cursor-pointer"
                    @click="setActiveAddList"
                  />
                </div>
              </form>
              <button
                v-else
                class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
                @click.stop="setActiveAddList"
                :disabled="!canCreateVariable"
                :class="
                  canCreateVariable ? 'cursor-pointer' : 'cursor-not-allowed'
                "
              >
                + Add Team
              </button>
            </div>
          </div>
        </template>
      </template>
      <div
        v-else-if="currentView === 'table'"
        class=""
      >
        <TableView
          :columns="tableColumns"
          :rows="tableRows"
          :isPending="false"
          :isTalent="true"
        />
      </div>

      <div v-if="currentView === 'mindmap'" class="flex flex-1 overflow-hidden">
        <MindmapView
          :listsData="mindmapListsData"
          :selectedSheetId="''"
          :selectedViewBy="''"
          :workspaceId="workspaceId"
          :moduleId="''"
          :addingList="false"
          :activeAddList="false"
          :newColumn="''"
          :canCreateCard="true"
          :canEditCard="true"
          :canDeleteCard="false"
          :canAssignCard="true"
          :canCreateSheet="false"
          :canCreateVariable="false"
          :canEditSheet="false"
          :asTalent="true"
          :talent-type="currentTab"
          @select:ticket="handleMindmapSelectTicket"
          @delete:ticket="() => {}"
          @create:sheet="() => {}"
          @create:card="() => {}"
          @update:card="() => {}"
          @update:sheet="() => {}"
          @reorder:card="() => {}"
          @toggle-add-list="() => {}"
          @add-column="() => {}"
        />
      </div>
    </div>
  </div>
  <!-- ── Modals ─────────────────────────────────────────────────────────── -->
  <ConfirmDeleteModal 
    @click.stop=""
    v-model="showDelete"
    title="Delete List"
    itemLabel="list"
    :itemName="localColumn?.title"
    :requireMatchText="localColumn?.title"
    confirmText="Delete List"
    cancelText="Cancel"
    size="md"
    :loading="isDeletingList"
    @confirm="handleDeleteColumn"
    @cancel="
      () => {
        showDelete = false;
      }
    "
  />

  <DetailPanel
    v-if="showPanel"
    @close="selectCardHandler(null)"
    @role-assigned="() => fetchPeople(true)"
    @refetch-people="() => fetchPeople(true)"
    :showPanel="showPanel"
  />
  <AgentsDetailPanel
    @close="selectAgentHandler(null)"
    @persona-updated="handlePersonaUpdated"
    :showAgentPanel="showAgentPanel"
    v-if="showAgentPanel"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch, onMounted, computed } from "vue";
import { useRouteIds } from "../../composables/useQueryParams";
import Draggable from "vuedraggable";
import { useWorkspaceRoles } from "../../queries/usePeople";
import {
  ReOrderCard,
  ReOrderList,
  useCreateTeam,
  useCreateTeamMember,
  useDeleteTeam,
} from "../../queries/usePeople";
import { useUpdateInvitedWorkspace } from "../../queries/useWorkspace";
import { useWorkspaceStore } from "../../stores/workspace";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/vue-query";
import TableView from "../../components/feature/TableView/TableView.vue";
import MindmapView from "../../components/feature/MindmapView.vue";
import { useSingleWorkspaceCompany } from "../../queries/useWorkspace";
const KanbanSkeleton = defineAsyncComponent(
  () => import("../../components/skeletons/KanbanSkeleton.vue"),
);
const BaseTextField = defineAsyncComponent(
  () => import("../../components/ui/BaseTextField.vue"),
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../Product/modals/ConfirmDeleteModal.vue"),
);
const BaseModal = defineAsyncComponent(
  () => import("../../components/ui/BaseModal.vue"),
);
const Button = defineAsyncComponent(
  () => import("../../components/ui/Button.vue"),
);
const BaseEmailChip = defineAsyncComponent(
  () => import("../../components/ui/BaseEmailChip.vue"),
);
const Dropdown = defineAsyncComponent(
  () => import("../../components/ui/Dropdown.vue"),
);
const DetailPanel = defineAsyncComponent(
  () => import("./components/DetailPanel.vue"),
);
const AgentsDetailPanel = defineAsyncComponent(
  () => import("./components/AgentDetailsPanel.vue"),
);
const SearchBar = defineAsyncComponent(
  () => import("../../components/ui/SearchBar.vue"),
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue"),
);
const KanbanCard = defineAsyncComponent(
  () => import("./components/KanbanCard.vue"),
);
import { usePermissions } from "../../composables/usePermissions";
import { toast } from "vue-sonner";
import { useSidePanelStore } from "../../stores/sidePanelStore";
import { usePeopleStore } from "../../stores/peopleStore";
import { useAgentStore } from "../../stores/agentStore";
import { useMediaQuery } from "@vueuse/core";
const { canCreateVariable, canInviteUser, canCreateCard } = usePermissions();
const sidePanelStore = useSidePanelStore();
const peopleStore = usePeopleStore();
const agentStore = useAgentStore();
const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();
const workspaceStore = useWorkspaceStore();
const currentTab = ref("talent");
const isMobile = useMediaQuery("(max-width: 650px)");
const viewData = [
  { title: "Role", _id: "role" },
  { title: "Team", _id: "team" },
  { title: "Status", _id: "status" },
];

const viewAgents = [
  { title: "Module", _id: "module" },
  { title: "Role", _id: "role" },
];
const selected_view_id = ref("team");
const selected_view_agent = ref("module");

const showAgentSection = ref(false);
const isFetchingAgents = ref(false);

const showDelete = ref(false);
const localColumn = ref();
const localList = ref<any>([]);
const showPanel = ref(false);
const showAgentPanel = ref(false);
const searchQuery = ref("");
const debouncedQuery = ref("");
const activeAddList = ref(false);
const newColumn = ref("");
const currentView = ref("kanban");
const selectedCard = ref<any>();
const showModal = ref(false);
const modalColumn = ref({ email: [], cards: [], title: "", _id: "" }); 
const closeModal = () => {
  showModal.value = false;
};
// ─── People store ─────────────────────────────────────────────────────────────
const isLoading = computed(() => peopleStore.isFetchingPeople);
const peopleList = computed(() => peopleStore.peopleData);
const agentGroups = computed<Array<{ title: string; agents: any[] }>>(
  () =>
    (agentStore.agentsForTalent ?? []) as Array<{
      title: string;
      agents: any[];
    }>,
);

const agentFuse = computed(() => {
  const list = agentGroups.value.flatMap((group) => group.agents);
  return new Fuse(list, {
    keys: ["name", "role", "model", "skills"],
    threshold: 0.3,
  });
});

const filteredAgentGroups = computed(() => {
  if (!searchQuery.value) return agentGroups.value;

  const results = agentFuse.value.search(searchQuery.value).map((r) => r.item);

  return agentGroups.value
    .map((group) => ({
      ...group,
      agents: group.agents.filter((agent) => results.includes(agent)),
    }))
    .filter((group) => group.agents.length > 0);
});
// ─── Sync people list from store ─────────────────────────────────────────────
watch(
  () => peopleList.value,
  (newVal) => {
    if (newVal) localList.value = JSON.parse(JSON.stringify(newVal));
  },
  { immediate: true },
);
const { data: workspaceData } = useSingleWorkspaceCompany(workspaceId, {
  enabled: computed(() => !!workspaceId.value), //reactive
});
const newCompanyId = computed(() => workspaceData.value?.company_id ?? null);
const { data: workspaceRoles } = useWorkspaceRoles(
  {
    company_id: newCompanyId,
    workspace_id: workspaceId,
  },
  {
    enabled: computed(() => !!newCompanyId.value && !!workspaceId.value),
  },
);
// ─── Fetch people ─────────────────────────────────────────────────────────────
const controller = new AbortController();

const fetchPeople = async (silent = false) => {
  peopleStore.fetchPeopleList(
    workspaceId.value,
    selected_view_id.value,
    controller.signal,
    silent
  );
};

const handleSeatDeleted = (seatId: string) => {
  localList.value = localList.value.map((col: any) => ({
    ...col,
    cards: (col.cards || []).filter((c: any) => c._id !== seatId),
  }));
  fetchPeople(true);
};

const handleSeatUpdated = (seatId: string, updatedSeat: any) => {
  localList.value = localList.value.map((col: any) => ({
    ...col,
    cards: (col.cards || []).map((c: any) => {
      if (c._id !== seatId) return c;
      const merged = { ...c, ...updatedSeat };
      // If we got a full object from backend, use it
      return merged;
    }),
  }));
  fetchPeople(true);
};

watch(
  () => selected_view_id.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      isFetchingAgents.value = false;
      fetchPeople();
    }
  },
);
const onAgentGroupsEnd = (evt: any) => {
  console.log("Agent groups reordered:", evt);
};
// ─── Fetch agents ─────────────────────────────────────────────────────────────
async function fetchAgents() {
  isFetchingAgents.value = true;
  try {
    await agentStore.fetchAgentsByRoleOrModule(
      workspaceId.value,
      selected_view_agent.value,
    );
  } finally {
    isFetchingAgents.value = false;
  }
}
const handlePersonaUpdated = async () => {
  await fetchAgents();
};
watch(
  () => selected_view_agent.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      showAgentSection.value = true;
      fetchAgents();
    }
  },
);

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchPeople();
  agentStore.fetchAgentsByRoleOrModule(
    workspaceId.value,
    selected_view_agent.value,
  );
  localList.value = peopleList.value
    ? JSON.parse(JSON.stringify(peopleList.value))
    : [];
});

// ─── Card selection ───────────────────────────────────────────────────────────
const selectCardHandler = (card: any) => {
  sidePanelStore.selectCard(card);
  showPanel.value = false;
};
const selectAgentHandler = (card: any) => {
  sidePanelStore.selectCard(card);
  showAgentPanel.value = false;
};
const handleClickTicket = (ticket: any) => {
  selectedCard.value = ticket;
  sidePanelStore.selectCard(ticket);
  showPanel.value = true;
};
const handleClickAgent = (agent: any) => {
  selectedCard.value = agent;
  sidePanelStore.selectCard(agent);
  showAgentPanel.value = true;
};
type AgentPayload = {
  title: string;
  module_id: string;
};

const handleAgent = (payload: AgentPayload) => {
  showAgentPanel.value = true;
  sidePanelStore.selectCard(payload);
};
const handleBoardUpdate = (_: any) => {};

// ─── Add list ─────────────────────────────────────────────────────────────────
const { mutate: addList, isPending: addingList } = useCreateTeam({
  onSuccess: (data: any) => {
    toast.success("Team added successfully!");
    localList.value = [...(localList.value || []), data];
    newColumn.value = "";
    activeAddList.value = false;
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to add team.");
  },
});

function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}

function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) {
    toast.error("Column name is required.");
    return;
  }
  handleAddColumn(t);
}

const handleAddColumn = (name: any) => {
  addList({
    payload: {
      workspace_id: workspaceId.value,
      title: name,
      max_num_people: 1,
    },
  });
};

// ─── Update / delete list ─────────────────────────────────────────────────────
const updateList = useUpdateInvitedWorkspace({
  onSuccess: () => {
    toast.success("Team updated successfully!");
    queryClient.invalidateQueries({ queryKey: ["people-lists"] });
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to update team.");
  },
});

const handleUpdateColumn = (newTitle: any) => {
  updateList.mutate({
    id: newTitle._id,
    payload: {
      workspace_id: workspaceId.value,
      title: newTitle?.title,
      max_num_people: 1,
    },
  });
};

const { mutate: deleteList, isPending: isDeletingList } = useDeleteTeam({
  onSuccess: (data: any) => {
    toast.success("Team deleted successfully!");
    showDelete.value = false;
    localList.value = localList.value.filter(
      (e: any) => e._id !== data.deletedRole?._id,
    );
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to delete team.");
  },
});

const handleDeleteColumn = () => {
  deleteList({ id: localColumn.value?.columnId });
};
const handleDelete = (e: any) => {
  showDelete.value = true;
  localColumn.value = e;
};

// ─── Add seat ─────────────────────────────────────────────────────────────────
const { mutate: createTeam, isPending } = useCreateTeamMember({
  onMutate: async (variables: any) => {
    const { id, payload } = variables ?? {};
    if (!id || !payload) return {};

    // Snapshot for rollback
    const previous = JSON.parse(JSON.stringify(localList.value));

    const optimisticSeat = {
      _id: `temp-${Date.now()}`,
      name: payload.name || "New Seat",
      title: payload.name || "New Seat",
      email: payload.email,
      role_id: payload.role_id,
      status: "pending",
      assigned_cards_count: 0,
    };

    // Push temp seat directly into localList
    localList.value = (localList.value ?? []).map((col: any) => {
      if (col._id !== id) return col;
      return { ...col, cards: [...(col.cards ?? []), optimisticSeat] };
    });

    return { previous };
  },

  onError: (_err: any, _variables: any, context: any) => {
    // Roll back to snapshot
    if (context?.previous) {
      localList.value = context.previous;
    }
    toast.error(_err.message || "Failed to add seat. Please try again.");
  },

  onSuccess: (res: any, variables: any) => {
    toast.success("Seat added successfully!");
    fetchPeople(true)
    const data = res?.data ?? res;
    const { id } = variables;

    // Replace temp seat with real server response — no refetch
    localList.value = (localList.value ?? []).map((col: any) => {
      if (col._id !== id) return col;
      const filteredCards = (col.cards ?? []).filter(
        (c: any) => !String(c._id).startsWith("temp-"),
      );
      return { ...col, cards: [...filteredCards, data.assigned_seat] };
    });
  },
});

// Opens the modal — does NOT create the seat directly
const handlePLus = (column: any) => {
  modalColumn.value = { ...column, email: [] };
  showModal.value = true;
};

// Actual seat creation (called from modal & inline footer)
const createSeat = (column: any) => {
  localColumn.value = column;
  createTeam({
    id: column._id,
    payload: {
      name: column?.email ? extractNameFromEmail(column?.email[0]) : "",
      email: column?.email ? column?.email[0] : "",
      role_id: column?._id,
      workspace_id: workspaceId?.value,
      additional_seats: 1,
    },
  });
};

function extractNameFromEmail(email: string) {
  const local = (email.split("@")[0] || "").split("+")[0];
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean);
  if (!parts.length) return email;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

const toggleAddNewColumn = (column: any) => {
  if (!canInviteUser.value) return;
  window.dispatchEvent(new CustomEvent("close-all-showADDNEW"));
  column.showADDNEW = !column.showADDNEW;
};

const addSeatToColumn = (column: any) => {
  createSeat(column);
  column.showADDNEW = false;
  showModal.value = false;
};

// ─── Reorder ──────────────────────────────────────────────────────────────────
const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  if (a.type === "column") {
    reorderList.mutate({
      id: workspaceId.value,
      payload: { role_id: a.meta._id, new_sort_order: a.meta.newIndex },
    });
  } else {
    reorderCard.mutate({
      id: a.meta.toColumnId,
      payload: {
        team_member_id: a.meta.moved._id,
        new_sort_order: a.meta.newIndex,
      },
    });
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────
watch(
  searchQuery,
  debounce((val: any) => {
    debouncedQuery.value = val;
  }, 200),
);

const fuse = computed(() => {
  const allCards = localList.value.flatMap((col: any) =>
    col.cards.map((card: any) => ({ ...card, columnId: col.title })),
  );
  return new Fuse(allCards, { keys: ["title", "name"], threshold: 0.3 });
});

const filteredBoard = computed(() => {
  const safe = localList.value.map((col: any) => ({
    ...col,
    cards: (col.cards || []).filter((c: any) => c && c._id),
  }));

  if (!searchQuery.value) return safe;

  const results = fuse.value.search(searchQuery.value).map((r: any) => r.item);

  return safe
    .map((col: any) => ({
      ...col,
      cards: results.filter((c: any) => c.columnId === col.title),
    }))
    .filter((col: any) => col.cards.length > 0);
});

// ─── Mindmap data adapter ─────────────────────────────────────────────────────
// The custom MindmapView expects listsData as an array of sheet-like objects:
// { _id, title, variables: { "sheet-title": string }, cards: Array<{ _id, "card-title", variables, style }> }
const mindmapListsData = computed(() => {
  if (currentTab.value === "talent") {
    return filteredBoard.value.map((col: any) => ({
      _id: col._id || col.title,
      title: col.title,
      variables: { "sheet-title": col.title },
      style: {},
      sort_order: col.sort_order ?? 0,
      cards: (col.cards || []).map((card: any) => ({
        _id: card._id,
        "card-title": card.title || card.name || "Untitled",
        sheet_id: col._id || col.title,
        seat_id: card.seat_id,
        variables: {
          "card-title": card.title || card.name || "Untitled",
          "card-status": card.status || "",
          "card-type": card.role_title || "",
          priority: "",
          process: null,
          "start-date": "",
          "end-date": "",
          "card-description": "",
        },
        style: card.style || {},
        lane: null,
      })),
    }));
  }

  if (currentTab.value === "agents") {
    return filteredAgentGroups.value.map((group: any) => ({
      _id: group.module_id || group.title,
      title: group.title,
      variables: { "sheet-title": group.title },
      style: {},
      sort_order: 0,
      cards: (group.agents || []).map((agent: any) => ({
        _id: agent._id,
        "card-title": agent.name || "Unnamed Agent",
        sheet_id: group.module_id || group.title,
        seat_id: null,
        variables: {
          "card-title": agent.name || "Unnamed Agent",
          "card-status": agent.is_active ? "Active" : "Inactive",
          "card-type": agent.level || "",
          priority: "",
          process: null,
          "start-date": "",
          "end-date": "",
          "card-description": agent.role || "",
        },
        style: {},
        lane: null,
      })),
    }));
  }

  return [];
});

// ─── Mindmap ticket handler ───────────────────────────────────────────────────
const handleMindmapSelectTicket = (node: any) => {
  if (!node) return;
  if (currentTab.value === "talent") {
    sidePanelStore.selectCard(node);
    showPanel.value = true;
  } else if (currentTab.value === "agents") {
    sidePanelStore.selectCard(node);
    showAgentPanel.value = true;
  }
};
const roleMap = computed(() => {
  const map: Record<string, string> = {};

  (workspaceRoles.value || []).forEach((r: any) => {
    map[r._id] = r.title;
  });

  return map;
});
const tableRows = computed(() => {
  if (currentTab.value === "talent") {
    return filteredBoard.value.flatMap((col: any) =>
      col.cards.map((card: any) => ({
        id: card._id,
        title: card.title || card.name || "Untitled",
        column: col.title,
        role: roleMap.value[card.workspace_access_role_id] ?? "-",
        seat_number: card.seat_number ?? "-",
        status: card.status ?? "-",
        assigned_cards_count: card.assigned_cards_count ?? 0,
      })),
    );
  }

  if (currentTab.value === "agents") {
    return filteredAgentGroups.value.flatMap((group: any) =>
      group.agents.map((agent: any) => ({
        id: agent._id,
        title: agent.name || "Unnamed Agent",
        column: group.title,
        role: agent.role || "-",
        model: agent.model || "-",
        level: agent.level || "-",
        status: agent.is_active ? "Active" : "Inactive",
      })),
    );
  }

  return [];
});
const tableColumns = computed(() => {
  if (currentTab.value === "talent") {
    return [
      { key: "title", label: "Title" },
      { key: "column", label: "Team" },
      { key: "role", label: "Access Role" },
      { key: "seat_number", label: "Seat" },
      { key: "status", label: "Status" },
      { key: "assigned_cards_count", label: "Cards" },
    ];
  }

  return [
    { key: "title", label: "Agent" },
    { key: "column", label: "Group" },
    { key: "role", label: "Role" },
    { key: "model", label: "Model" },
    { key: "level", label: "Level" },
    { key: "status", label: "Status" },
  ];
});

function levelClass(level: string): string {
  const map: Record<string, string> = {
    EXPERT: "bg-purple-100 text-purple-700 border border-purple-200",
    LEAD: "bg-blue-100   text-blue-700   border border-blue-200",
    SENIOR: "bg-green-100  text-green-700  border border-green-200",
    MID: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    JUNIOR: "bg-gray-100   text-gray-600   border border-gray-200",
  };
  return map[level] ?? "bg-gray-100 text-gray-600 border border-gray-200";
}

function handleChatWithAgent(agent: any, module_id: any, module_name: any) {
  console.log("module name", module_name);
  agentStore.handleAgentPassed(agent, module_id, module_name);
  workspaceStore.toggleChatBotPanel();
}


// handle close panel
watch(currentTab, (tab) => {
  if (tab === 'agents') {
    // Close People Detail Panel
    selectCardHandler(null); // or showPanel.value = false
  } else if (tab === 'talent') {
    // Close Agents Detail Panel
    selectAgentHandler(null); // or showAgentPanel.value = false
  }
});
</script>

<style scoped>
.custom_scroll_bar::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
.custom_scroll_bar::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 10px;
}
.custom_scroll_bar::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}
.custom_scroll_bar::-webkit-scrollbar-track {
  background: transparent;
}
.custom_scroll_bar {
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
</style>
