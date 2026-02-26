<template>
  <div
    class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="overflow-x-auto shrink-0 border-b border-border">
      <div class="header px-4 py-3 flex items-center justify-between gap-2">
        <Dropdown
          :actions="false"
          v-model="selected_view_agent"
          :options="viewAgents"
          variant="secondary"
          customClasses="fixed w-[135px]"
        />
        <div class="flex gap-2">
          <Dropdown
            :actions="false"
            v-model="selected_view_id"
            :options="viewData"
            variant="secondary"
            customClasses="fixed w-[135px]"
          />
          <div class="flex gap-3 items-center">
            <SearchBar
              class="max-w-[250px]"
              @onChange="(e: any) => { searchQuery = e }"
              placeholder="Search in Orchit AI space"
            />
          </div>
        </div>
      </div>
    </div>

    <KanbanSkeleton v-if="isLoading" />

    <div v-else class="flex flex-col flex-1 overflow-hidden">

      <!-- ══════════════════════════════════════════════════════════════════
           AGENT SECTION
           Hidden by default. Revealed only when the user explicitly picks
           a value from the left (viewAgents) dropdown.
           Rendered ABOVE the people kanban.
      ═══════════════════════════════════════════════════════════════════ -->
      <template v-if="showAgentSection">
        <!-- Section header bar -->
        <div class="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-bg-surface/40">
          <i class="fa-solid fa-robot text-accent text-xs"></i>
          <span class="text-xs font-semibold text-text-primary capitalize">
            Agents by {{ selected_view_agent }}
          </span>
          <span class="text-[10px] text-text-secondary ml-0.5">
            · {{ totalAgentCount }} agent{{ totalAgentCount !== 1 ? 's' : '' }}
          </span>
          <span v-if="isFetchingAgents" class="ml-2">
            <i class="fa-solid fa-spinner animate-spin text-accent text-[10px]"></i>
          </span>
        </div>

        <!-- Agent columns — horizontally scrollable -->
        <div class="shrink-0 overflow-x-auto px-4 py-3 border-b border-border">
          <div class="flex gap-3 min-w-max">
            <div
              v-for="group in agentGroups"
              :key="group.title"
              class="flex flex-col gap-2 w-[220px]"
            >
              <!-- Column header -->
              <div class="flex items-center justify-between px-1 mb-0.5">
                <span
                  class="text-[11px] font-semibold text-text-primary truncate max-w-[170px]"
                  :title="group.title"
                >
                  {{ group.title }}
                </span>
                <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-bg-surface border border-border text-text-secondary ml-1">
                  {{ group.agents.length }}
                </span>
              </div>

              <!-- Empty state -->
              <div
                v-if="group.agents.length === 0"
                class="text-[11px] text-text-secondary/50 text-center py-5 border border-dashed border-border rounded-lg"
              >
                No agents
              </div>

              <!-- Agent cards -->
              <div
                v-for="agent in group.agents"
                :key="agent._id"
                class="bg-bg-surface border border-border rounded-lg p-3 flex flex-col gap-2 hover:border-accent/40 transition-colors"
              >
                <!-- Name + level badge -->
                <div class="flex items-start justify-between gap-1">
                  <span class="text-[11px] font-semibold text-text-primary leading-tight line-clamp-2 flex-1">
                    {{ agent.name }}
                  </span>
                  <span
                    class="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    :class="levelClass(agent.level)"
                  >
                    {{ agent.level }}
                  </span>
                </div>

                <!-- Role -->
                <div class="flex items-center gap-1 text-[10px] text-text-secondary">
                  <i class="fa-solid fa-briefcase text-[9px] shrink-0"></i>
                  <span class="truncate">{{ agent.role }}</span>
                </div>

                <!-- Model -->
                <div class="flex items-center gap-1 text-[10px] text-text-secondary/60">
                  <i class="fa-solid fa-microchip text-[9px] shrink-0"></i>
                  <span>{{ agent.model }}</span>
                </div>

                <!-- Skills -->
                <div v-if="agent.skills?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="skill in agent.skills.slice(0, 3)"
                    :key="skill"
                    class="text-[9px] bg-accent/10 text-accent border border-accent/20 rounded px-1.5 py-0.5 leading-none"
                  >
                    {{ skill }}
                  </span>
                  <span v-if="agent.skills.length > 3" class="text-[9px] text-text-secondary/50">
                    +{{ agent.skills.length - 3 }}
                  </span>
                </div>

                <!-- Capabilities -->
                <div v-if="agent.capabilities?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="cap in agent.capabilities.slice(0, 2)"
                    :key="cap"
                    class="text-[9px] bg-bg-card border border-border rounded px-1.5 py-0.5 text-text-secondary/70 leading-none"
                  >
                    {{ formatCapability(cap) }}
                  </span>
                  <span v-if="agent.capabilities.length > 2" class="text-[9px] text-text-secondary/50">
                    +{{ agent.capabilities.length - 2 }}
                  </span>
                </div>

                <!-- Active dot -->
                <div class="flex items-center gap-1">
                  <span
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="agent.is_active ? 'bg-green-500' : 'bg-gray-400'"
                  />
                  <span class="text-[9px] text-text-secondary/50">
                    {{ agent.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════════════════
           PEOPLE KANBAN — always visible (default view)
      ═══════════════════════════════════════════════════════════════════ -->
      <div
        v-show="currentView === 'kanban'"
        class="flex flex-1 p-4 overflow-x-auto gap-3 custom_scroll_bar"
      >
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
              :class="canInviteUser ? 'cursor-pointer' : 'cursor-not-allowed'"
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
              <p class="text-sm text-text-secondary">You can assign user later</p>
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
                :class="canCreateVariable ? 'cursor-pointer' : 'cursor-not-allowed'"
                @click="emitAddColumn"
                type="submit"
                variant="primary"
                class="px-3 py-1 bg-accent text-white rounded"
              >
                {{ addingList ? "Adding..." : "Add Team" }}
              </Button>
              <i class="fa-solid fa-close cursor-pointer" @click="setActiveAddList" />
            </div>
          </form>
          <button
            v-else
            class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
            @click.stop="setActiveAddList"
            :disabled="!canCreateVariable"
            :class="canCreateVariable ? 'cursor-pointer' : 'cursor-not-allowed'"
          >
            + Add Team
          </button>
        </div>
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
    @cancel="() => { showDelete = false }"
  />

  <DetailPanel
    @close="selectCardHandler(null)"
    :showPanel="showPanel"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch, onMounted, computed } from "vue";
import { useRouteIds } from "../../composables/useQueryParams";
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

const KanbanSkeleton = defineAsyncComponent(
  () => import("../../components/skeletons/KanbanSkeleton.vue")
);
const BaseTextField = defineAsyncComponent(
  () => import("../../components/ui/BaseTextField.vue")
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../Product/modals/ConfirmDeleteModal.vue")
);
const Button = defineAsyncComponent(
  () => import("../../components/ui/Button.vue")
);
const BaseEmailChip = defineAsyncComponent(
  () => import("../../components/ui/BaseEmailChip.vue")
);
const Dropdown = defineAsyncComponent(
  () => import("../../components/ui/Dropdown.vue")
);
const DetailPanel = defineAsyncComponent(
  () => import("./components/DetailPanel.vue")
);
const SearchBar = defineAsyncComponent(
  () => import("../../components/ui/SearchBar.vue")
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue")
);
const KanbanCard = defineAsyncComponent(
  () => import("./components/KanbanCard.vue")
);

import { usePermissions } from "../../composables/usePermissions";
import { toast } from "vue-sonner";
import { useSidePanelStore } from "../../stores/sidePanelStore";
import { usePeopleStore } from "../../stores/peopleStore";
import { useAgentStore } from "../../stores/agentStore";

// ─── Stores & permissions ─────────────────────────────────────────────────────
const { canCreateVariable, canInviteUser } = usePermissions();
const sidePanelStore = useSidePanelStore();
const peopleStore = usePeopleStore();
const agentStore = useAgentStore();
const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();

// ─── Dropdown options ─────────────────────────────────────────────────────────
const viewData = [
  { title: "Role",   _id: "role"   },
  { title: "Team",   _id: "team"   },
  { title: "Status", _id: "status" },
];

const viewAgents = [
  { title: "Module", _id: "module" },
  { title: "Role",   _id: "role"   },
];

// ─── State ────────────────────────────────────────────────────────────────────
const selected_view_id    = ref("team");
const selected_view_agent = ref("module");

/**
 * Controls the agent section visibility.
 * Stays false on mount — only becomes true when the user explicitly
 * switches the left (viewAgents) dropdown to a different value.
 */
const showAgentSection = ref(false);
const isFetchingAgents = ref(false);

const showDelete     = ref(false);
const localColumn    = ref();
const localList      = ref<any>([]);
const showPanel      = ref(false);
const searchQuery    = ref("");
const debouncedQuery = ref("");
const activeAddList  = ref(false);
const newColumn      = ref("");
const currentView    = ref<"kanban" | "list">("kanban");
const selectedCard   = ref<any>();

// ─── People store ─────────────────────────────────────────────────────────────
const isLoading  = computed(() => peopleStore.isFetchingPeople);
const peopleList = computed(() => peopleStore.peopleData);
const agentGroups = computed<Array<{ title: string; agents: any[] }>>(
  () => (agentStore.agentsForTalent ?? []) as Array<{ title: string; agents: any[] }>
);

const totalAgentCount = computed(() =>
  agentGroups.value.reduce((sum, g) => sum + (g.agents?.length ?? 0), 0)
);

// ─── Sync people list from store ─────────────────────────────────────────────
watch(
  () => peopleList.value,
  (newVal) => {
    if (newVal) localList.value = JSON.parse(JSON.stringify(newVal));
  },
  { immediate: true }
);

// ─── Fetch people ─────────────────────────────────────────────────────────────
const controller = new AbortController();

const fetchPeople = async () => {
  peopleStore.fetchPeopleList(workspaceId.value, selected_view_id.value, controller.signal);
};

watch(
  () => selected_view_id.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) fetchPeople();
  }
);

// ─── Fetch agents ─────────────────────────────────────────────────────────────
async function fetchAgents() {
  isFetchingAgents.value = true;
  try {
    await agentStore.fetchAgentsByRoleOrModule(workspaceId.value, selected_view_agent.value);
  } finally {
    isFetchingAgents.value = false;
  }
}

/**
 * When the user explicitly changes the left dropdown:
 *  1. reveal the agent section
 *  2. fetch fresh data for the chosen type
 */
watch(
  () => selected_view_agent.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      showAgentSection.value = true;
      fetchAgents();
    }
  }
);

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchPeople();
  // Pre-fetch silently so the first dropdown change is instant.
  // showAgentSection stays false — section only appears on explicit user action.
  agentStore.fetchAgentsByRoleOrModule(workspaceId.value, selected_view_agent.value);
  localList.value = peopleList.value ? JSON.parse(JSON.stringify(peopleList.value)) : [];
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
  if (!t) { toast.error("Column name is required."); return; }
  handleAddColumn(t);
}

const handleAddColumn = (name: any) => {
  addList({ payload: { workspace_id: workspaceId.value, title: name, max_num_people: 1 } });
};

// ─── Update / delete list ─────────────────────────────────────────────────────
const updateList = useUpdateInvitedWorkspace({
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["people-lists"] }); },
});

const handleUpdateColumn = (newTitle: any) => {
  updateList.mutate({
    id: newTitle._id,
    payload: { workspace_id: workspaceId.value, title: newTitle?.title, max_num_people: 1 },
  });
};

const { mutate: deleteList, isPending: isDeletingList } = useDeleteTeam({
  onSuccess: (data: any) => {
    showDelete.value = false;
    localList.value = localList.value.filter((e: any) => e._id !== data.deletedRole?._id);
  },
});

const handleDeleteColumn = () => { deleteList({ id: localColumn.value?.columnId }); };
const handleDelete = (e: any) => { showDelete.value = true; localColumn.value = e; };

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
    const optimisticSeat = { _id: `temp-${Date.now()}`, name: payload.name, email: payload.email, role_id: payload.role_id };
    const nextCol = { ...col, cards: [...(col.cards ?? []), optimisticSeat] };
    localList.value = [...localList.value.slice(0, idx), nextCol, ...localList.value.slice(idx + 1)];
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
    const filteredCards = (col.cards ?? []).filter((c: any) => !String(c._id).startsWith("temp-"));
    const nextCol = { ...col, cards: [...filteredCards, data.assigned_seat] };
    localList.value = [...localList.value.slice(0, idx), nextCol, ...localList.value.slice(idx + 1)];
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
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}

const toggleAddNewColumn = (column: any) => {
  if (!canInviteUser.value) return;
  window.dispatchEvent(new CustomEvent("close-all-showADDNEW"));
  column.showADDNEW = !column.showADDNEW;
};

const addSeatToColumn = (column: any) => { handlePLus(column); };

// ─── Reorder ──────────────────────────────────────────────────────────────────
const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  if (a.type === "column") {
    reorderList.mutate({ id: workspaceId.value, payload: { role_id: a.meta._id, new_sort_order: a.meta.newIndex } });
  } else {
    reorderCard.mutate({ id: a.meta.toColumnId, payload: { team_member_id: a.meta.moved._id, new_sort_order: a.meta.newIndex } });
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────
watch(searchQuery, debounce((val: any) => { debouncedQuery.value = val; }, 200));

const fuse = computed(() => {
  const allCards = localList.value.flatMap((col: any) =>
    col.cards.map((card: any) => ({ ...card, columnId: col.title }))
  );
  return new Fuse(allCards, { keys: ["title", "name"], threshold: 0.3 });
});

const filteredBoard = computed(() => {
  if (!searchQuery.value) return localList.value;
  const results = fuse.value.search(searchQuery.value).map((r: any) => r.item);
  return localList.value
    .map((col: any) => ({ ...col, cards: results.filter((c: any) => c.columnId === col.title) }))
    .filter((col: any) => col.cards.length > 0);
});

// ─── Agent display helpers ────────────────────────────────────────────────────

function levelClass(level: string): string {
  const map: Record<string, string> = {
    EXPERT: "bg-purple-100 text-purple-700 border border-purple-200",
    LEAD:   "bg-blue-100   text-blue-700   border border-blue-200",
    SENIOR: "bg-green-100  text-green-700  border border-green-200",
    MID:    "bg-yellow-100 text-yellow-700 border border-yellow-200",
    JUNIOR: "bg-gray-100   text-gray-600   border border-gray-200",
  };
  return map[level] ?? "bg-gray-100 text-gray-600 border border-gray-200";
}

function formatCapability(cap: string): string {
  const map: Record<string, string> = {
    webBrowsing:       "Web",
    workspaceData:     "Workspace",
    module_knowledge:  "Module",
    sheet_knowledge:   "Sheet",
    tickets_knowledge: "Tickets",
  };
  return map[cap] ?? cap;
}
</script>

<style>
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