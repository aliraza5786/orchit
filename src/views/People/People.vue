<template>
  <div
    class="flex-auto flex-grow h-full bg-bg-surface rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <div class="overflow-x-auto shrink-0 border-b border-border">
      <div class="header py-2 flex items-center justify-between gap-2 mx-2">
        <div
          class="flex border-b border-border bg-bg-surface/50 gap-2 rounded-md py-1 px-1"
        >
          <button
            @click="currentTab = 'talent'"
            :class="
              currentTab === 'talent'
                ? 'bg-primary-color text-white rounded-md'
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
                ? 'bg-primary-color text-white rounded-md '
                : 'text-text-secondary'
            "
            class="px-4 py-1 text-sm transition-colors text-nowrap"
          >
            View Agents
          </button>
        </div>

        <div class="flex gap-2">
          <Dropdown
            :inSpace="true"
            v-if="currentTab === 'talent'"
            :actions="false"
            v-model="selected_view_id"
            :options="viewData"
            variant="secondary"
            customClasses="fixed w-[135px]"
          />
          <Dropdown
            :inSpace="true"
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
                class="aspect-square cursor-pointer rounded-sm  py-0.5 px-1 border border-border outline-0"
                :class="
                  currentView === 'kanban'
                    ? 'text-primary-color'
                    : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
                "
                title="Kanban view"
                @click="currentView = 'kanban'"
              >
                <i class="fa-solid fa-chart-kanban"></i>
              </button>

              <button
                @click="currentView = 'table'"
                class="aspect-square cursor-pointer rounded-sm py-0.5 px-1 border border-border outline-0"
                :class="
                  currentView === 'table'
                    ? 'text-primary-color'
                    : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
                "
                title="List view"
              >
                <i class="fa-solid fa-align-left"></i>
              </button>
              <button
                @click="currentView = 'mindmap'"
                class="aspect-square cursor-pointer rounded-sm py-0.5 px-1 border border-border outline-0"
                :class="
                  currentView === 'mindmap'
                    ? 'text-primary-color'
                    : ' backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
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
  v-else-if="isLoading && currentView === 'mindmap'"
  class="flex flex-1 items-center justify-center"
>
  <div class="flex flex-col items-center gap-3 text-text-secondary">
    <i class="fa-solid fa-chart-diagram text-2xl animate-pulse text-primary-color"></i>
    <span class="text-sm animate-pulse">Loading mindmap...</span>
  </div>
</div>
    <div v-else class="flex flex-col flex-1 overflow-hidden px-2">
      <template v-if="currentView === 'kanban'">
        <!-- AGENTS KANBAN -->
        <template v-if="currentTab === 'agents'">
          <div class="scrollbar-visible h-full flex flex-col">
            <Draggable
              v-model="filteredAgentGroups"
              item-key="title"
              group="agent-groups"
              :animation="180"
              class="flex gap-2 mt-2 overflow-x-auto scrollbar-visible flex-1 cursor-grab"
              direction="horizontal"
              @end="onAgentGroupsEnd"
              :disabled="isMobile"
            >
              <template #item="{ element: group }">
                <div
                  class="flex flex-col bg-bg-body rounded-md mb-2"
                  :class="{
                    'snap-center min-w-[270px] max-w-[270px]': isMobile,
                    'min-w-[270px] max-w-[270px]': !isMobile,
                  }"
                >
                  <div
                    class="flex justify-between px-2 py-2.5 border-b border-border"
                  >
                    <div
                      class="text-normal flex items-center gap-2 font-semibold text-text-primary"
                    >
                      <span class="text-[14px]">{{ group.title }}</span>
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
                    class="flex flex-col gap-2 mx-2 mt-2 overflow-y-auto flex-1"
                  >
                    <div
                      v-for="agent in group.agents"
                      :key="agent._id"
                      @click="handleClickAgent(agent)"
                      class="group/agent bg-bg-card border border-border rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3"
                    >
                      <div class="flex items-start gap-2 w-full">
                        <!-- Agent Avatar/Icon -->
                        <div 
                          class="w-10 min-w-10 aspect-square bg-bg-surface flex justify-center items-center rounded-full text-white text-sm font-semibold border border-border/20 shadow-sm"
                          :style="{ backgroundColor: avatarColor({ name: agent.name }) }"
                        >
                          {{ getInitials(agent.name) }}
                        </div>
                        
                        <div class="flex-1 min-w-0">
                          <div class="flex justify-between items-start mb-0.5">
                            <h3 class="text-sm font-semibold text-text-primary leading-tight truncate pr-1">
                              {{ agent.name }}
                            </h3>
                            <span
                              class="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter"
                              :class="levelClass(agent.level)"
                            >
                              {{ agent.level }}
                            </span>
                          </div>
                          
                          <p class="text-text-secondary text-[11px] truncate mb-2">
                            {{ agent.role }}
                          </p>
                          
                          <div class="flex items-center gap-2 mt-auto">
                              <span
                                class="w-1.5 h-1.5 rounded-full"
                                :class="agent.is_active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-gray-400'"
                              />
                              <span class="text-[10px] font-medium" :class="agent.is_active ? 'text-green-500' : 'text-text-secondary'">
                                {{ agent.is_active ? "Active" : "Inactive" }}
                              </span>
                              <span class="text-[10px] text-text-secondary/60 ml-auto font-medium">
                                {{ agent.model }}
                              </span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Footer Action -->
                      <div class="border-t border-border pt-3 mt-1">
                          <button
                            class="w-full bg-primary-color/5 hover:bg-primary-color text-primary-color hover:text-white text-[10px] font-bold rounded-md px-3 py-1.5 transition-all duration-300 flex items-center justify-center gap-2 border border-primary-color/20 hover:border-primary-color"
                            @click.stop="handleChatWithAgent(agent, group.module_id, group?.title)"
                          >
                            <i class="fa-solid fa-comments text-[10px]"></i>
                            CHAT WITH AGENT
                          </button>
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
          <div class="flex flex-1 overflow-x-auto gap-2 scrollbar-visible pt-2 overflow-y-hidden">
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
                  <Button :inSpace="true" size="md" @click="addSeatToColumn(column)" :disabled="isPending">{{
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
            
            <!-- Add Column -->
            <div class="min-w-[270px] sm:min-w-[270px]" @click.stop>
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
                    :inSpace="true"
                    :disabled="!canCreateVariable"
                    :class="
                      canCreateVariable
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    "
                    @click="emitAddColumn"
                    type="submit"
                    variant="primary"
                    class="px-3 py-1 bg-primary-color text-white rounded"
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
        <PeopleTableView
          :columns="tableColumns"
          :groups="currentTab === 'talent' ? filteredBoard : filteredAgentGroups"
          :isPending="isLoading"
          :isTalent="currentTab === 'talent'"
          :isTeamView="currentTab === 'talent' && selected_view_id === 'team'"
          :workspaceRoles="workspaceRoles || []"
          @select:ticket="handleMindmapSelectTicket"
          @deleted="handleSeatDeleted"
          @assigned="(res: any) => handleSeatUpdated(res._id || res.id, res)"
          @unAssigned="() => fetchPeople(true)"
          @addVar="isCreateVar = true"
          @add-seat="(group: any) => currentTab === 'talent' ? handlePLus(group) : handleAgent({ title: group.title, module_id: String(group.module_id) })"
          @invite="(person: any) => { activePerson = person; showAddMembers = true; }"
          @unassign="unassignHandler"
          @delete-seat="(person: any) => { activePerson = person; showDeleteSeat = true; }"
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

  <ConfirmDeleteModal 
    v-model="showDeleteSeat"
    title="Delete Team seat" 
    itemLabel="Seat"
    :itemName="activePerson?.title || activePerson?.name || 'Seat'" 
    :requireMatchText="activePerson?.title || activePerson?.name || 'Seat'" 
    confirmText="Delete Seat" 
    cancelText="Cancel"
    size="md" 
    :loading="deletingSeat" 
    @confirm="handleDeletePerson" 
    @cancel="() => { showDeleteSeat = false; activePerson = null; }"
  />

  <AssignmentModal
    v-if="showAddMembers"
    :isSubmitting="inviting"
    v-model="showAddMembers"
    :members="peopleDirectory?.people"
    :directory="peopleDirectory?.people"
    @submit="handleAssignSubmit"
  />

  <DetailPanel
    v-if="showPanel"
    @close="selectCardHandler(null)"
    @role-assigned="() => fetchPeople(true)"
    @refetch-people="() => fetchPeople(true)"
    @update-variable="handleVariableUpdate"
    :showPanel="showPanel"
  />
  <AgentsDetailPanel
    @close="selectAgentHandler(null)"
    @persona-updated="handlePersonaUpdated"
    :showAgentPanel="showAgentPanel"
    v-if="showAgentPanel"
  />

  <BaseModal :inSpace="true" v-model="showModal" size="md" title="Add Seat">
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
      <Button :inSpace="true" variant="secondary" @click="closeModal">Cancel</Button>
      <Button :inSpace="true" variant="primary" @click="addSeatToColumn(modalColumn)" :disabled="isPending">
        {{ isPending ? "Adding..." : "Add Seat" }}
      </Button>
    </div>
  </BaseModal>

  <CreateVariableModal
    v-model="isCreateVar"
    v-if="isCreateVar"
    @refetchCardDetails="refetchCardDetails"
    :sheetID="workspaceId"
  />
</template>

<script setup lang="ts">
import { h, defineAsyncComponent, ref, watch, onMounted, computed} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRouteIds } from "../../composables/useQueryParams";
import Draggable from "vuedraggable";
import { useWorkspaceRoles, usePeopleVar } from "../../queries/usePeople";
import {
  ReOrderCard,
  ReOrderList,
  useCreateTeam,
  useCreateTeamMember,
  useDeleteTeam,
  useAssignRole,
  useAssignTeam,
  useDeleteSeat,
  useUnAssignTeam,
  usePeople,
  useUpdateVar,
} from "../../queries/usePeople";
import { useUpdateInvitedWorkspace } from "../../queries/useWorkspace";
import { useWorkspaceStore } from "../../stores/workspace";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/vue-query";
import PeopleTableView from "./components/PeopleTableView.vue";
import MindmapView from "../../components/feature/MindmapView.vue";
// import { useVariables } from "../../queries/useSheets";
import { useSingleWorkspaceCompany } from "../../queries/useWorkspace";
import { avatarColor } from "../../utilities/avatarColor";
import { getInitials } from "../../utilities";
import { useCompanyId } from "../../services/user";
const KanbanSkeleton = defineAsyncComponent(
  () => import("../../components/skeletons/KanbanSkeleton.vue"),
);
const BaseTextField = defineAsyncComponent(
  () => import("../../components/ui/BaseTextField.vue"),
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../Product/modals/ConfirmDeleteModal.vue"),
);
const CreateVariableModal = defineAsyncComponent(
  () => import("./modals/PeopleCreateVariableModal.vue"),
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
const TableSearchCell = defineAsyncComponent(
  () => import("../../components/feature/TableView/TableSearchCell.vue"),
);
const AssignmentModal = defineAsyncComponent(
  () => import("./modals/AssignmentModal.vue"),
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
const route = useRoute();
const router = useRouter();
const { workspaceId } = useRouteIds(); 
const workspaceStore = useWorkspaceStore();
const currentTab = ref("talent"); 
const { data: peopleVariables } = usePeopleVar(
  workspaceId
);
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
const queryClient = useQueryClient();

function refetchCardDetails() {
  queryClient.invalidateQueries({ queryKey: ["people-var"] });
  queryClient.invalidateQueries({ queryKey: ["people-lists"] });
}

const showModal = ref(false);
const isCreateVar = ref(false);
const modalColumn = ref({ email: [], cards: [], title: "", _id: "" }); 

const showAddMembers = ref(false);
const showDeleteSeat = ref(false);
const activePerson = ref<any>(null);

const { data: companyId } = useCompanyId();
const { data: peopleDirectory } = usePeople(workspaceId, companyId);
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
    enabled: computed(() => !!workspaceId.value),
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
      return merged;
    }),
  }));

  // Sync with SidePanel if this seat is currently open
  if (sidePanelStore.selectedCardPeople?._id === seatId) {
    sidePanelStore.selectCard({ ...sidePanelStore.selectedCardPeople, ...updatedSeat });
  }

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

// ─── Seat Actions (Table View) ────────────────────────────────────────────────
const { mutate: deleteSeatAction, isPending: deletingSeat } = useDeleteSeat({
  onSuccess: () => {
    toast.success("Seat deleted successfully!");
    if (activePerson.value) {
      handleSeatDeleted(activePerson.value._id);
    }
    showDeleteSeat.value = false;
    activePerson.value = null;
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to delete seat.");
  }
});

const { mutate: invitePeopleAction, isPending: inviting } = useAssignTeam({
  onSuccess: (res: any) => {
    toast.success("Seat assigned successfully!");
    showAddMembers.value = false;
    handleSeatUpdated(activePerson.value?._id, res?.data ?? res);
    activePerson.value = null;
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to assign seat.");
  }
});

const { mutate: unassignSeatAction } = useUnAssignTeam({
  onSuccess: () => {
    toast.success("Seat unassigned successfully!");
    fetchPeople(true);
    activePerson.value = null;
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to unassign seat.");
  }
});

const { mutate: assignRoleAction } = useAssignRole({
  onSuccess: (data: any, variables: any) => {
    handleSeatUpdated(variables.id, data);
    toast.success("Access role updated!");
    queryClient.invalidateQueries({ queryKey: ["people-lists"] });
  }
});

const handleRoleChange = (person: any, roleId: string) => {
  if (person.workspace_access_role_id === roleId) return;
  
  // Optimistic update
  handleSeatUpdated(person._id, { workspace_access_role_id: roleId });

  assignRoleAction({
    id: person._id,
    workspace_access_role_id: roleId
  });
};

const handleAssignSubmit = (payload: { invite: any }) => {
  if (!activePerson.value) return;
  invitePeopleAction({
    id: activePerson.value._id,
    payload: {
      name: extractNameFromEmail(payload.invite.email),
      email: payload.invite.email
    }
  });
};

function handleDeletePerson() { 
  if (!activePerson.value) return;
  deleteSeatAction({ id: activePerson.value._id });
}

function unassignHandler(person: any) {
  unassignSeatAction({ id: person._id, payload: {} });
}

function getStatusClass(status: string) {
  const s = status?.toLowerCase();
  if (s === 'accepted' || s === 'active') return 'bg-green-600/10 text-green-600';
  if (s === 'pending') return 'bg-amber-600/10 text-amber-600';
  if (s === 'rejected' || s === 'inactive') return 'bg-red-600/10 text-red-600';
  if (s === 'unassigned') return 'bg-bg-surface/60 text-text-secondary';
  return 'bg-bg-surface/60 text-text-secondary';
}

function getLevelClass(level: string) {
  const map: Record<string, string> = {
    EXPERT: "bg-purple-100 text-purple-700 border border-purple-200",
    LEAD: "bg-blue-100   text-blue-700   border border-blue-200",
    SENIOR: "bg-green-100  text-green-700  border border-green-200",
    MID: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    JUNIOR: "bg-gray-100   text-gray-600   border border-gray-200",
  };
  return map[level] ?? "bg-gray-100 text-gray-600 border border-gray-200";
}

function getEmailInitials(email: string): string {
  const local = email?.split('@')[0] || '';
  return local.slice(0, 2).toUpperCase();
}

const getVariableValue = (person: any, colKey: string) => {
  if (!person.variable_values || !Array.isArray(person.variable_values)) return null;
  const v = person.variable_values.find((v: any) => v.module_variable_id === colKey);
  return v?.value || null;
}

const { mutate: updateVarAction } = useUpdateVar({
  onSuccess: () => {
    toast.success("Field updated successfully!");
    fetchPeople(true);
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to update field.");
  },
});

const handleVariableUpdate = (person: any, variableId: string, value: any) => {
  // Check if value actually changed
  const currentValue = getVariableValue(person, variableId);
  if (currentValue === value) return;

  // Optimistic update
  handleSeatUpdated(person._id, {
    variable_values: [
      ...(person.variable_values || []).filter((v: any) => v.module_variable_id !== variableId),
      { module_variable_id: variableId, value }
    ]
  });

  updateVarAction({
    id: person._id,
    payload: {
      variable_values: [{ module_variable_id: variableId, value }]
    }
  });
};

const getRoleTitle = (id: string) => {
  if (!id) return "";
  const role = (workspaceRoles.value || []).find((r: any) => r._id === id);
  return role?.title || id;
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
    showModal.value = false
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
    showModal.value = false;
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
  const local = (email?.split("@")[0] || "").split("+")[0];
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
// const roleMap = computed(() => {
//   const map: Record<string, string> = {};

//   (workspaceRoles.value || []).forEach((r: any) => {
//     map[r._id] = r.title;
//   });

//   return map;
// });
// const tableRows = computed(() => {
//   if (currentTab.value === "talent") {
//     return filteredBoard.value.flatMap((col: any) =>
//       col.cards.map((card: any) => ({
//         id: card._id,
//         title: card.title || card.name || "Untitled",
//         column: col.title,
//         role: roleMap.value[card.workspace_access_role_id] ?? "-",
//         seat_number: card.seat_number ?? "-",
//         status: card.status ?? "-",
//         assigned_cards_count: card.assigned_cards_count ?? 0,
//       })),
//     );
//   }

//   if (currentTab.value === "agents") {
//     return filteredAgentGroups.value.flatMap((group: any) =>
//       group.agents.map((agent: any) => ({
//         id: agent._id,
//         title: agent.name || "Unnamed Agent",
//         column: group.title,
//         role: agent.role || "-",
//         model: agent.model || "-",
//         level: agent.level || "-",
//         status: agent.is_active ? "Active" : "Inactive",
//       })),
//     );
//   }

//   return [];
// });
const tableColumns = computed(() => {
  if (currentTab.value === "talent") {
    return [
      { 
        key: "title", 
        label: "Seat",
        render: ({ row: person }: any) => h("div", { class: "flex items-center gap-2 overflow-hidden h-full" }, [
          h("div", { 
            class: "w-8 h-8 min-w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 bg-bg-surface",
            style: { backgroundColor: (person.name || person.user_info?.name || person.email) ? avatarColor({ email: person.email || person.user_info?.email, name: person.name || person.user_info?.name }) : '' }
          }, [
            person.user_info?.avatar 
              ? h("img", { src: person.user_info.avatar, class: "w-full h-full rounded-full object-cover" })
              : (person.name || person.user_info?.name) ? getInitials(person.name || person.user_info?.name || '') : (person.email ? getEmailInitials(person.email) : h("i", { class: "fa-solid fa-user text-white" }))
          ]),
          h("div", { class: "flex flex-col justify-center min-w-0" }, [
            h("span", { class: "truncate font-medium text-[13px] text-text-primary leading-tight" }, person.name || person.user_info?.name || person.title || 'Team Member '),
            (person.email || person.user_info?.email) ? h("span", { class: "truncate text-[11px] text-text-secondary leading-tight mt-0.5" }, person.email || person.user_info?.email) : null
          ])
        ])
      },
      { 
        key: "role", 
        label: "Access Role",
        render: ({ row: person }: any) => h("div", { class: "w-full" }, [
          h(TableSearchCell, {
            modelValue: person.workspace_access_role_id,
            options: workspaceRoles.value || [],
            placeholder: "Assign Access Role",
            emptyText: "Access Role",
            onChange: (val: any) => handleRoleChange(person, val)
          }, {
            display: () => getRoleTitle(person.workspace_access_role_id) ? h("span", { class: "text-[12px] font-medium text-text-primary truncate" }, getRoleTitle(person.workspace_access_role_id)) : null
          })
        ])
      },
      { 
        key: "status", 
        label: "Status",
        render: ({ row: person }: any) => h("div", {}, [
          h("span", { 
            class: ["px-2 py-0.5 rounded-md text-[11px] font-medium capitalize", getStatusClass(person.status ?? (person.is_active ? 'Active' : 'Inactive'))]
          }, person.status ?? (person.is_active ? 'Active' : 'Inactive'))
        ])
      },
      { 
        key: "assigned_cards_count", 
        label: "Assigned Cards",
        render: ({ row: person }: any) => h("div", { class: "text-[12px] text-text-secondary" }, [
          h("div", { class: "flex items-center gap-1.5" }, [
            h("i", { class: "fa-regular fa-clone opacity-50" }),
            h("span", {}, person.assigned_cards_count || '-')
          ])
        ])
      },
      ...((peopleVariables.value && Array.isArray(peopleVariables.value)) ? peopleVariables.value.map((v: any) => ({
        key: v._id,
        label: v.title,
        render: ({ row: person }: any) => {
          if (v.variable_type_id?.title === 'Select') {
            return h("div", { class: "w-full" }, [
              h(TableSearchCell, {
                modelValue: getVariableValue(person, v._id),
                options: (v.data || []).map((opt: any) => ({ _id: opt, title: opt })),
                placeholder: `Select ${v.title}`,
                emptyText: v.title,
                onChange: (val: any) => handleVariableUpdate(person, v._id, val)
              }, {
                display: () => getVariableValue(person, v._id) ? h("span", { class: "text-[12px] font-medium text-text-primary truncate" }, getVariableValue(person, v._id)) : null
              })
            ])
          }
          return h("div", { class: "text-[12px] text-text-secondary truncate" }, person[v._id] || getVariableValue(person, v._id) || '-')
        }
      })) : [])
    ];
  } else {
    return [
      { 
        key: "title", 
        label: "Agent",
        render: ({ row: agent }: any) => h("div", { class: "flex items-center gap-2 overflow-hidden h-full" }, [
          h("div", { 
            class: "w-8 h-8 min-w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 bg-bg-surface",
            style: { backgroundColor: avatarColor({ name: agent.name }) }
          }, getInitials(agent.name || '')),
          h("div", { class: "flex flex-col justify-center min-w-0" }, [
            h("span", { class: "truncate font-medium text-[13px] text-text-primary leading-tight" }, agent.name || 'Unnamed Agent'),
            h("span", { class: "truncate text-[11px] text-text-secondary leading-tight mt-0.5" }, agent.role || '')
          ])
        ])
      },
      { 
        key: "role", 
        label: "Role",
        render: ({ row: agent }: any) => h("div", { class: "text-[12px] text-text-secondary truncate" }, agent.role || '-')
      },
      { 
        key: "model", 
        label: "Model",
        render: ({ row: agent }: any) => h("div", { class: "flex items-center gap-1.5" }, [
          h("i", { class: "fa-solid fa-microchip text-[10px] text-text-secondary/70" }),
          h("span", { class: "text-[12px]" }, agent.model || '-')
        ])
      },
      { 
        key: "level", 
        label: "Level",
        render: ({ row: agent }: any) => h("div", {}, [
          h("span", { 
            class: ["px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase", getLevelClass(agent.level)]
          }, agent.level || '-')
        ])
      },
      { 
        key: "status", 
        label: "Status",
        render: ({ row: agent }: any) => h("div", {}, [
          h("span", { 
            class: ["px-2 py-0.5 rounded-md text-[11px] font-medium capitalize", getStatusClass(agent.is_active ? 'Active' : 'Inactive')]
          }, agent.is_active ? "Active" : "Inactive")
        ])
      },
      ...((peopleVariables.value && Array.isArray(peopleVariables.value)) ? peopleVariables.value.map((v: any) => ({
        key: v._id,
        label: v.title,
        render: ({ row: person }: any) => {
          if (v.variable_type_id?.title === 'Select') {
            return h("div", { class: "w-full" }, [
              h(TableSearchCell, {
                modelValue: getVariableValue(person, v._id),
                options: (v.data || []).map((opt: any) => ({ _id: opt, title: opt })),
                placeholder: `Select ${v.title}`,
                emptyText: v.title,
                onChange: (val: any) => handleVariableUpdate(person, v._id, val)
              }, {
                display: () => getVariableValue(person, v._id) ? h("span", { class: "text-[12px] font-medium text-text-primary truncate" }, getVariableValue(person, v._id)) : null
              })
            ])
          }
          return h("div", { class: "text-[12px] text-text-secondary truncate" }, person[v._id] || getVariableValue(person, v._id) || '-')
        }
      })) : [])
    ];
  }
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

// Handle deep link to user profile via query param
watch(
  [() => route.query.user_id, () => localList.value],
  ([userId, list]) => {
    if (userId && list && list.length > 0) {
      const allCards = list.flatMap((col: any) => col.cards || []);
      const card = allCards.find((c: any) => c._id === userId);

      if (card) {
        currentTab.value = "talent";
        handleClickTicket(card);
        
        // Clean up URL
        const query = { ...route.query };
        delete query.user_id;
        router.replace({ query });
      }
    }
  },
  { immediate: true }
);
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
