<template>
  <div
    class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <div class="overflow-x-auto shrink-0 border-b border-border">
      <div class="header px-4 py-3 flex items-center justify-between gap-2">
        <div
          class="flex border-b border-border bg-bg-surface/50 gap-2 rounded-md py-1 px-1"
        >
          <button
            @click="currentTab = 'talent'"
            :class="
              currentTab === 'talent'
                ? 'bg-accent text-white font-semibold rounded-md'
                : 'text-text-primary'
            "
            class="px-4 py-1 text-sm transition-colors"
          >
            View Talent
          </button>
          <button
            @click="currentTab = 'agents'"
            :class="
              currentTab === 'agents'
                ? 'bg-accent text-white font-semibold rounded-md'
                : 'text-text-secondary'
            "
            class="px-4 py-1 text-sm transition-colors"
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

    <KanbanSkeleton v-if="isLoading" />

    <div v-else class="flex flex-col flex-1 overflow-hidden">
      <template v-if="currentView === 'kanban'">
        <!-- AGENTS KANBAN -->
        <template v-if="currentTab === 'agents'">
          <div class="custom_scroll_bar h-full flex flex-col">
            <Draggable
              v-model="filteredAgentGroups"
              item-key="title"
              group="agent-groups"
              :animation="180"
              class="flex gap-4 mx-4 my-3 overflow-x-auto custom_scroll_bar flex-1 cursor-grab"
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
                    class="text-normal font-semibold text-text-primary border-b border-border py-4 px-5"
                  >
                    {{ group.title }}
                  </div>

                  <div
                    class="flex flex-col gap-4 mx-4 mt-4 overflow-y-auto flex-1"
                  >
                    <div
                      v-for="agent in group.agents"
                      :key="agent._id"
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

                      <div class="flex items-center gap-2 mt-auto">
                        <span
                          class="w-2 h-2 rounded-full"
                          :class="
                            agent.is_active ? 'bg-green-500' : 'bg-gray-400'
                          "
                        />
                        <span class="text-xs text-green-500">
                          {{ agent.is_active ? "Active" : "Inactive" }}
                        </span>
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
          <div class="flex flex-1 p-4 overflow-x-auto gap-3 custom_scroll_bar">
            <KanbanBoard
              :plusIcon="false"
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
                  @deleted="fetchPeople()"
                  @assigned="fetchPeople"
                  @unAssigned="fetchPeople"
                />
              </template>
              <template #column-footer="{ column }: any">
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
                  <Button size="md" @click="addSeatToColumn(column)">
                    {{ isPending ? "Adding..." : "Add Seat" }}
                  </Button>
                  <i
                    class="fa-solid fa-close cursor-pointer ml-2"
                    @click="toggleAddNewColumn('')"
                  />
                </div>
              </template>
            </KanbanBoard>
            <!-- Add Column --> 
             <div class="min-w-[270px] sm:min-w-[328px]" @click.stop> 
              <form @submit.prevent="" v-if="activeAddList" class="bg-bg-body rounded-lg p-4" > 
                <BaseTextField :autofocus="true" 
                v-model="newColumn" 
                placeholder="Add New list" /> 
                <p class="text-xs mt-1.5">You can add details while editing</p> 
                <div class="flex items-center mt-3 gap-3"> 
                  <Button :disabled="!canCreateVariable" :class=" canCreateVariable ? 'cursor-pointer' : 'cursor-not-allowed' " @click="emitAddColumn" type="submit" variant="primary" 
                  class="px-3 py-1 bg-accent text-white rounded" > {{ addingList ? "Adding..." : "Add Team" }} 
                  </Button> <i class="fa-solid fa-close cursor-pointer" @click="setActiveAddList" /> 
                </div> 
              </form> 
              <button v-else class="text-sm text-text-primary py-2.5 
              font-medium flex items-center justify-center 
              w-full gap-2 bg-bg-body rounded-lg" 
              @click.stop="setActiveAddList" :disabled="!canCreateVariable" 
              :class="canCreateVariable ? 'cursor-pointer' : 'cursor-not-allowed'" > 
              + Add Team 
            </button> 
          </div> 
          </div>
        </template>
      </template>
      <div v-else-if="currentView === 'table'" class="w-full mx-3">
        <TableView
          :columns="tableColumns"
          :rows="tableRows"
          :isPending="false"
        />
      </div>

     <div
  v-if="currentView === 'mindmap'"
  ref="mindMapRef"
  style="width: 100%; height: 100vh; background: #fff; position: relative; overflow: hidden;"
></div>
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

  <DetailPanel @close="selectCardHandler(null)" :showPanel="showPanel" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch, onMounted, computed, nextTick, toRaw } from "vue";
import { useRouteIds } from "../../composables/useQueryParams";
import Draggable from "vuedraggable";
import MindElixir from "mind-elixir";
import {
  ReOrderCard,
  ReOrderList,
  useCreateTeam,
  useCreateTeamMember,
  useDeleteTeam,
} from "../../queries/usePeople";
import { useUpdateInvitedWorkspace } from "../../queries/useWorkspace";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/vue-query";
import TableView from "../../components/feature/TableView/TableView.vue";
const KanbanSkeleton = defineAsyncComponent(
  () => import("../../components/skeletons/KanbanSkeleton.vue"),
);
const BaseTextField = defineAsyncComponent(
  () => import("../../components/ui/BaseTextField.vue"),
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../Product/modals/ConfirmDeleteModal.vue"),
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
const { canCreateVariable, canInviteUser } = usePermissions();
const sidePanelStore = useSidePanelStore();
const peopleStore = usePeopleStore();
const agentStore = useAgentStore();
const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();
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
const searchQuery = ref("");
const debouncedQuery = ref("");
const activeAddList = ref(false);
const newColumn = ref("");
const currentView = ref("kanban");
const selectedCard = ref<any>();

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
    keys: ["name", "role", "model", "skills"], // fields to search
    threshold: 0.3, // adjust sensitivity
  });
});

// Filtered agentGroups based on searchQuery
const filteredAgentGroups = computed(() => {
  if (!searchQuery.value) return agentGroups.value;

  const results = agentFuse.value.search(searchQuery.value).map((r) => r.item);

  // Keep the original grouping structure, but only include matching agents
  return agentGroups.value
    .map((group) => ({
      ...group,
      agents: group.agents.filter((agent) => results.includes(agent)),
    }))
    .filter((group) => group.agents.length > 0); // remove empty groups
});
// ─── Sync people list from store ─────────────────────────────────────────────
watch(
  () => peopleList.value,
  (newVal) => {
    if (newVal) localList.value = JSON.parse(JSON.stringify(newVal));
  },
  { immediate: true },
);

// ─── Fetch people ─────────────────────────────────────────────────────────────
const controller = new AbortController();

const fetchPeople = async () => {
  peopleStore.fetchPeopleList(
    workspaceId.value,
    selected_view_id.value,
    controller.signal,
  );
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
  // evt contains oldIndex, newIndex
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
  // Pre-fetch silently so the first dropdown change is instant.
  // showAgentSection stays false — section only appears on explicit user action.
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

const handleClickTicket = (ticket: any) => {
  selectedCard.value = ticket;
  sidePanelStore.selectCard(ticket);
  showPanel.value = true;
};

const handleBoardUpdate = (_: any) => {};

// ─── Add list ─────────────────────────────────────────────────────────────────
const { mutate: addList, isPending: addingList } = useCreateTeam({
  onSuccess: (data: any) => {
    localList.value = [...(localList.value || []), data];
    newColumn.value = "";
    activeAddList.value = false;
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
    queryClient.invalidateQueries({ queryKey: ["people-lists"] });
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
    showDelete.value = false;
    localList.value = localList.value.filter(
      (e: any) => e._id !== data.deletedRole?._id,
    );
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
    await queryClient.cancelQueries({ queryKey: ["people-lists"] });
    const previous = queryClient.getQueryData(["people-lists"]);
    const { id, payload } = variables ?? {};
    if (!id || !payload) return { previous };
    const idx = localList.value.findIndex((e: any) => e._id === id);
    if (idx === -1) return { previous };
    const col = localList.value[idx];
    const optimisticSeat = {
      _id: `temp-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role_id: payload.role_id,
    };
    const nextCol = { ...col, cards: [...(col.cards ?? []), optimisticSeat] };
    localList.value = [
      ...localList.value.slice(0, idx),
      nextCol,
      ...localList.value.slice(idx + 1),
    ];
    queryClient.setQueryData(["people-lists"], localList.value);
    return { previous };
  },
  onError: (_err: any, _variables: any, context: any) => {
    if (context?.previous) {
      localList.value = context.previous;
      queryClient.setQueryData(["people-lists"], context.previous);
    }
    toast.error("Failed to add seat. Please try again.");
  },
  onSuccess: (data: any, variables: any) => {
    const { id } = variables;
    const idx = localList.value.findIndex((e: any) => e._id === id);
    if (idx === -1) return;
    const col = localList.value[idx];
    const filteredCards = (col.cards ?? []).filter(
      (c: any) => !String(c._id).startsWith("temp-"),
    );
    const nextCol = { ...col, cards: [...filteredCards, data.assigned_seat] };
    localList.value = [
      ...localList.value.slice(0, idx),
      nextCol,
      ...localList.value.slice(idx + 1),
    ];
    queryClient.setQueryData(["people-lists"], localList.value);
    queryClient.invalidateQueries({ queryKey: ["workspaceRoles"] });
  },
});

const handlePLus = (column: any) => {
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
  handlePLus(column);
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
  if (!searchQuery.value) return localList.value;
  const results = fuse.value.search(searchQuery.value).map((r: any) => r.item);
  return localList.value
    .map((col: any) => ({
      ...col,
      cards: results.filter((c: any) => c.columnId === col.title),
    }))
    .filter((col: any) => col.cards.length > 0);
});
const tableRows = computed(() => {
  if (currentTab.value === "talent") {
    return filteredBoard.value.flatMap((col: any) =>
      col.cards.map((card: any) => ({
        id: card._id,
        title: card.title || card.name || "Untitled",
        column: col.title,
        role: card.role_title ?? "-",
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
        title: agent.name,
        column: group.title,
        role: agent.role,
        model: agent.model,
        level: agent.level,
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
      { key: "role", label: "Role" },
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

const mindMapRef = ref<HTMLElement | null>(null);
const mindmapData = computed(() => {
  if (currentTab.value === "talent") {
    return {
      nodeData: {
        id: "root",
        topic: "Talent",
        children: filteredBoard.value.map((col: any) => ({
          id: `col-${col.title}`,
          topic: col.title,
          children: col.cards.map((card: any) => ({
            id: card._id,
            topic: card.title || card.name || "Untitled",
          })),
        })),
      },
    };
  }

  if (currentTab.value === "agents") {
    console.log(filteredAgentGroups.value);
    
    return {
      nodeData: {
        id: "root",
        topic: "Agents",
        children: filteredAgentGroups.value.map((group: any) => ({
          id: `group-${group.title}`,
          topic: group.title,
          children: group.agents.map((agent: any) => ({
            id: agent._id,
            topic: agent.name,
          })),
        })),
      },
    };
  }

  return { nodeData: { id: "root", topic: "Empty", children: [] } };
});
let mind: any = null;
function getCleanMindData() {
  // toRaw + JSON.parse(JSON.stringify(...)) strips Vue reactivity and proxies
  return JSON.parse(JSON.stringify(toRaw(mindmapData.value)));
}
async function initMindMap() {
  await nextTick();
  if (!mindMapRef.value) return;

  const data = mindmapData.value; // pass full object with nodeData

  if (mind) {
    mind = null;
    mindMapRef.value.innerHTML = ""; // reset
  }

  mind = new MindElixir({
    el: mindMapRef.value,
    direction: MindElixir.SIDE,
    draggable: true,
    contextMenu: true,
    toolBar: true,
    nodeMenu: true,
    keypress: true,
  });

  mind.init(data);
}

onMounted(() => {
  if (currentView.value === "mindmap") initMindMap();
});
watch(
  [() => currentTab.value, () => filteredAgentGroups.value, () => filteredBoard.value],
  async () => {
    await nextTick();
    mind?.refresh(getCleanMindData());
  }
);
watch(
  [() => currentView.value, () => selected_view_agent.value, () => currentTab.value],
  async ([view]) => {
    if (view !== "mindmap") return;
    await nextTick();
    if (!mindMapRef.value) return;

    if (!mind) {
      // initialize once
      mind = new MindElixir({
        el: mindMapRef.value,
        direction: MindElixir.SIDE,
        draggable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true,
      });
      mind.init(getCleanMindData());
    } else {
      mind.init(getCleanMindData());
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
/* Toolbar */
:deep(.mind-elixir-toolbar.rb) {
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 2px;
  width: 15rem;
}

:deep(.mind-elixir-toolbar.rb > *) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  padding: 5px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

:deep(.mind-elixir-toolbar.lt > *) {
  cursor: pointer;
}

:deep(.mind-elixir-toolbar.rb > *:hover),
:deep(.mind-elixir-toolbar.lt > *:hover) {
  color: #7d68c8;
  border: 1px solid #7d68c8;
  border-radius: 5px;
}

.me-toolbar-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.me-toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}
</style>
