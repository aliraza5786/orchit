<template>
  <div
    class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border flex-col flex overflow-hidden"
  >
    <!-- Header -->
    <div class="overflow-x-auto shrink-0 border-b border-border">
      <div class="header px-4 py-3 flex items-center justify-between gap-2">
        <Dropdown
          v-model="selected_sheet_id"
          :options="transformedData"
          variant="secondary"
          v-bind="dropdownListeners"
          :canEdit="canEditSheet"
          :canDelete="canDeleteSheet"
        >
          <template #more>
            <div
              @click="toggleCreateSheet"
              v-if="canCreateSheet"
              class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
            >
              <i class="fa-solid fa-plus"></i> Add new
            </div>
          </template>
        </Dropdown>
        <div class="flex gap-2">
          <SearchBar
            class="max-w-[250px]"
            @onChange="
              (e) => {
                searchQuery = e;
              }
            "
            placeholder="Search in Orchit AI space"
          >
          </SearchBar>
          <div
            class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md"
          >
            <button
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="
                view === 'kanban'
                  ? 'text-accent bg-accent-text'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
              title="Kanban view"
              @click="view = 'kanban'"
            >
              <i class="fa-solid fa-chart-kanban"></i>
            </button>

            <button
              @click="view = 'table'"
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="
                view === 'table'
                  ? 'text-accent bg-accent-text'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
              title="List view"
            >
              <i class="fa-solid fa-align-left"></i>
            </button>
            <button
              @click="view = 'mindmap'"
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="
                view === 'mindmap'
                  ? 'text-accent bg-accent-text'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
              title="MindMap view"
            >
              <i class="fa-solid fa-chart-diagram"></i>
            </button>

            <button
              @click="view = 'calendar'"
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="
                view === 'calendar'
                  ? 'text-accent bg-accent-text'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
              title="Calendar view"
            >
              <i class="fa-regular fa-calendar"></i>
            </button>

            <button
              @click="view = 'gantt'"
              class="aspect-square cursor-pointer rounded-sm p-0"
              :class="
                view === 'gantt'
                  ? 'text-accent bg-accent-text'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
              title="Gantt Chart view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z"
                />
              </svg>
            </button>

            <button
              @click="view = 'timeline'"
              class="aspect-square cursor-pointer rounded-sm p-0"
              :class="
                view === 'timeline'
                  ? 'text-accent bg-accent-text'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
              title="Timeline view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M4 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm16 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                  opacity="0"
                />
                <path
                  d="M4 12h4m8 0h4M9 12h6M9 12v-6M15 12v6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Kanban Skeleton -->
    <KanbanSkeleton v-show="isListPending" />

    <!-- Kanban Board -->
    <div
      v-show="!isListPending"
      class="flex overflow-x-auto custom_scroll_bar gap-3 py-4 h-full mx-4"
      v-if="view === 'kanban'"
    >
      <KanbanBoard
        @onPlus="plusHandler"
        @delete:column="deleteHandler"
        @update:column="handleUpdateColumn"
        @reorder="onReorder"
        @addColumn="handleAddColumn"
        @select:ticket="selectCardHandler"
        @onBoardUpdate="handleBoardUpdate"
        :board="filteredBoard"
        :variable_id="selected_view_by"
        :sheet_id="selected_sheet_id"
      >
        <template #ticket="{ ticket }">
          <KanbanCard @click="handleClickTicket(ticket)" :ticket="ticket" />
        </template>

        <template #emptyState="{ column }">
          <div class="flex flex-col items-center justify-center gap-2 py-10">
            <img src="../../assets/emptyStates/pin.png" alt="" />
            <h1 class="text-sm text-text-primary mt-2">
              Start creating your pins
            </h1>
            <p class="text-sm text-text-secondary mb-2 text-center">
              Create pins and add your ideas into the related pins.
            </p>
            <Button
              :disabled="!canCreateVariable"
              size="sm"
              @click="plusHandler(column)"
              >Create Pin</Button
            >
          </div>
        </template>
      </KanbanBoard>
      <!-- Add List Section -->
      <div class="min-w-[328px]" v-if="view === 'kanban'" @click.stop>
        <div v-if="activeAddList" class="bg-bg-body rounded-lg p-4">
          <BaseTextField
            :autofocus="true"
            v-model="newColumn"
            placeholder="Add New list"
            @keyup.enter="emitAddColumn"
          />
          <p class="text-xs mt-1.5">You can add details while editing</p>
          <div class="flex items-center mt-3 gap-3">
            <Button
              @click="emitAddColumn"
              variant="primary"
              class="px-3 py-1 bg-accent cursor-pointer text-white rounded"
            >
              {{ addingList ? "Adding..." : "Add list" }}
            </Button>
            <i class="fa-solid fa-close" @click="toggleAddList"></i>
          </div>
        </div>
        <button
          v-else
          class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
          :class="!canCreateVariable ? 'cursor-not-allowed' : 'cursor-pointer'"
          @click.stop="toggleAddList"
          :disabled="!canCreateVariable"
        >
          + Add List
        </button>
      </div>
    </div>
    <template v-if="view == 'table'">
      <TableView
        class="mx-3"
        :columns="columns"
        :isPending="false"
        @addVar="
          () => {
            isCreateVar = true;
          }
        "
        :rows="tableRows"
        :canCreate="canCreateCard"
        :canCreateVariable="canCreateVariable"
        :canDelete="canDeleteCard"
      />
    </template>
    <div
      v-if="view === 'mindmap'"
      class="flex-1 h-full min-h-0 overflow-hidden"
    >
      <PinMindmapView
        :listsData="Lists?.data ?? []"
        :workspaceId="String(workspaceId)"
        :moduleId="String(moduleId)"
        :canCreateCard="canCreateCard"
        :canEditCard="canEditCard"
        :canDeleteCard="canDeleteCard"
        :canAssignCard="canAssignCard"
        :canCreateSheet="canCreateSheet"
        :canCreateVariable="canCreateVariable"
        :canEditSheet="canEditSheet"
        @update:card="handleMindmapUpdateCard"
        @select:ticket="selectCardHandler"
        @delete:ticket="(id) => openDeleteModal(id)"
        @create:card="(payload) => handleMindmapCreateCard(payload)"
      />
    </div>
    <template v-if="view === 'calendar'">
      <CalendarView :data="filteredBoard" @select:ticket="selectCardHandler" />
    </template>
    <!-- ── Gantt View ──────────────────────────────────────────────────────── -->
    <template v-if="view === 'gantt'">
      <GanttChartView
        :data="filteredBoard"
        @select:ticket="selectCardHandler"
      />
    </template>

    <!-- ── Timeline View ───────────────────────────────────────────────────── -->
    <template v-if="view === 'timeline'">
      <TimelineView :data="filteredBoard" @select:ticket="selectCardHandler" />
    </template>

    <!-- Modals -->
    <ConfirmDeleteModal
      v-model="showDelete"
      title="Delete List"
      itemLabel="list"
      :itemName="localColumnData?.title"
      :requireMatchText="localColumnData?.title"
      confirmText="Delete List"
      cancelText="Cancel"
      size="md"
      :loading="addingList"
      @confirm="handleDeleteColumn"
      @cancel="() => (showDelete = false)"
    />
    <ConfirmDeleteModal
      v-model="showDeleteTicket"
      title="Delete Ticket"
      itemLabel="Ticket"
      :itemName="localColumnData?.title"
      :requireMatchText="localColumnData?.title"
      confirmText="Delete Ticket"
      cancelText="Cancel"
      size="md"
      :loading="addingList"
      @confirm="handleDeleteCard"
      @cancel="() => (showDeleteTicket = false)"
    />
    <CreateTaskModal
      size="md"
      :pin="true"
      :selectedVariable="selected_view_by"
      :listId="localColumnData?.title"
      :sheet_id="selected_sheet_id"
      v-if="createTeamModal"
      key="createTaskModalKey"
      v-model="createTeamModal"
    />

    <CreateSheetModal
      :sheet="selectedSheettoAction"
      size="md"
      v-model="isCreateSheetModal"
    />
    <CreateVariableModal
      v-if="isCreateVar"
      v-model="isCreateVar"
      :sheetID="selected_sheet_id"
    />
    <ConfirmDeleteModal
      @click.stop=""
      v-model="showDeleteModal"
      title="Delete Sheet"
      itemLabel="Sheet"
      :itemName="selectedSheettoAction?.title"
      :requireMatchText="selectedSheettoAction?.title"
      confirmText="Delete Sheet"
      cancelText="Cancel"
      size="md"
      :loading="isDeleting"
      @confirm="handleDeleteSheet"
      @cancel="
        () => {
          showDeleteModal = false;
        }
      "
    />
  </div>
  <SidePanel
    v-if="selectedCard?._id"
    :details="selectedCard"
    :showPanel="!!selectedCard?._id"
    :pin="true"
    @close="() => selectCardHandler({ variables: {} })"
  />
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useWorkspaceStore } from "../../stores/workspace";
import {
  useAddList,
  useSheetList,
  useSheets,
  useVariables,
  ReOrderList,
  ReOrderCard,
  useUpdateWorkspaceSheet,
  useAddTicket,
} from "../../queries/useSheets";
import { useRouteIds } from "../../composables/useQueryParams";

// Components
import Dropdown from "../../components/ui/Dropdown.vue";
import BaseTextField from "../../components/ui/BaseTextField.vue";
import Button from "../../components/ui/Button.vue";
import KanbanCard from "./components/KanbanCard.vue";
import KanbanSkeleton from "../../components/skeletons/KanbanSkeleton.vue";
import CreateTaskModal from "../Product/modals/CreateTaskModal.vue";
import SidePanel from "../Product/components/SidePanel.vue";
import CreateSheetModal from "../Product/modals/CreateSheetModal.vue";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { request, toApiMessage } from "../../libs/api";
import SearchBar from "../../components/ui/SearchBar.vue";
import PinMindmapView from "../Pin/components/MindMap.vue";
import TableView from "../../components/feature/TableView/TableView.vue";
import CalendarView from "../../components/feature/CalendarView.vue";
import GanttChartView from "../../components/feature/GanttChartView.vue";
import TimelineView from "../../components/feature/TimelineView.vue";
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../Product/modals/ConfirmDeleteModal.vue"),
);
const CreateVariableModal = defineAsyncComponent(
  () => import("../Product/modals/CreateVariableModal.vue"),
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue"),
);
import { usePermissions } from "../../composables/usePermissions";
import { toast } from "vue-sonner";
import { useMoveCard } from "../../queries/useSheets";
const {
  canEditSheet,
  canDeleteSheet,
  canCreateVariable,
  canCreateSheet,
  canCreateCard,
  canDeleteCard,
  canAssignCard,
  canEditCard,
} = usePermissions();

// State
const isCreateVar = ref(false);
const isCreateSheetModal = ref(false);
const createTeamModal = ref(false);
const showDelete = ref(false);
const showDeleteTicket = ref(false);
const localColumnData = ref<any>();
const activeAddList = ref(false);
const newColumn = ref("");
const selectedCard = ref<{ _id: any; variables: any }>();
const localList = ref<any>([]);
const view = ref("kanban");
// Routing & Stores
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const workspaceStore = useWorkspaceStore();
const queryClient = useQueryClient();
// Variables & Sheets
// Sheets Data
const { data, refetch: refetchSheets } = useSheets(
  { workspace_id: workspaceId, workspace_module_id: moduleId },
  { onSuccess: () => refetchList() },
);

const selected_sheet_id = ref<any>(data.value?.[0]?._id ?? null);
const { data: variables } = useVariables(
  workspaceId,
  moduleId,
  selected_sheet_id,
);
const viewBy = computed(() => variables.value?.[0]?._id ?? "");
const selected_view_by = ref(viewBy.value);
watch(viewBy, (val) => (selected_view_by.value = val));

watch(data, (sheets) => {
  if (sheets?.length) selected_sheet_id.value = sheets[0]._id;
});

// Lists
const {
  data: Lists,
  isPending: isListPending,
  refetch: refetchList,
} = useSheetList(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  selected_view_by,
);

watch(Lists, (newLists) => {
  localList.value = Array.isArray(newLists)
    ? JSON.parse(JSON.stringify(newLists))
    : [];
});

onMounted(() => {
  localList.value = Array.isArray(Lists.value)
    ? JSON.parse(JSON.stringify(Lists.value))
    : [];
});
// Add List Logic
const { mutate: addList, isPending: addingList } = useAddList({
  onSuccess: (data: any, payload: any) => {
    if (payload.is_trash) {
      localList.value = localList.value.filter(
        (e: any) => e.title !== payload.value,
      );
      showDelete.value = false;
    } else {
      localList.value = [...localList.value, { title: data?.value }];
    }
    activeAddList.value = false;

    newColumn.value = "";
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    Object.assign({ newColumn: "", showDelete: false, activeAddList: false });
  },
});

function handleAddColumn(value: string) {
  addList({
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    variable_id: selected_view_by.value,
    value,
  });
}
const dropdownListeners = computed(() => {
  const listeners: Record<string, Function> = {};

  if (canEditSheet.value) listeners["onEdit-option"] = openEditSprintModal;
  if (canDeleteSheet.value)
    listeners["onDelete-option"] = handleDeleteSheetModal;

  return listeners;
});

function emitAddColumn() {
  const trimmed = newColumn.value.trim();
  if (trimmed) handleAddColumn(trimmed);
}

function handleUpdateColumn({ title, oldTitle }: any) {
  addList({
    workspace_id: route.params.id,
    module_id: route.params.module_id,
    new_value: title,
    value: oldTitle,
    variable_id: selected_view_by.value,
  });
}

// Delete Column Logic
function handleDeleteColumn() {
  addList({
    value: localColumnData.value.title,
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    newValue: localColumnData.value.title,
    variable_id: selected_view_by.value,
    is_trash: true,
  });
}

function deleteHandler(e: any) {
  showDelete.value = true;
  localColumnData.value = e;
}

// Reorder Logic
const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  const { type, meta } = a;
  if (type === "column") {
    reorderList.mutate({
      payload: {
        workspace_id: workspaceId.value,
        workspace_module_id: moduleId.value,
        variable_id: selected_view_by.value,
        moved_value: meta.id,
        new_index: meta.newIndex,
      },
    });
  } else {
    reorderCard.mutate({
      payload: {
        workspace_id: workspaceId.value,
        card_id: meta.moved._id,
        group_value: meta.fromColumnId,
        group_variable_id: selected_view_by.value,
        new_index: meta.newIndex,
        sheet_id: selected_sheet_id.value,
      },
    });
  }
}

function handleBoardUpdate(_: any) {}

function selectCardHandler(card: any) {
  selectedCard.value = card;
}

function handleClickTicket(ticket: any) {
  selectedCard.value = ticket;
}

function plusHandler(e: any) {
  createTeamModal.value = true;
  localStorage.setItem("selectedStatusTitle", e?.title);
  localColumnData.value = e;
}
const moveCard = useMoveCard({
  onMutate: async (newPayload: any) => {
    const { card_id, variables: updatedVariables } = newPayload;

    await queryClient.cancelQueries({ queryKey: ["product-card", card_id] });
    await queryClient.cancelQueries({ queryKey: ["sheet-list"] });
    toast.success("Card Formatted successfully");
    const previousCard = queryClient.getQueryData(["product-card", card_id]);
    const previousLists = queryClient.getQueryData(["sheet-list"]);

    // Snapshot ALL sprint-kanban queries for rollback
    const previousSprintKanbans = queryClient.getQueriesData({
      queryKey: ["sprint-kanban"],
    });

    const updateCardLogic = (oldCard: any) => {
      if (!oldCard || oldCard._id !== card_id) return oldCard;

      const updatedCard = {
        ...oldCard,
        variables: Array.isArray(oldCard.variables)
          ? [...oldCard.variables]
          : [],
      };

      if (updatedVariables) {
        Object.assign(updatedCard, updatedVariables);

        Object.entries(updatedVariables).forEach(([key, value]) => {
          const idx = updatedCard.variables.findIndex(
            (v: any) => v.slug === key,
          );

          if (idx !== -1) {
            updatedCard.variables[idx] = {
              ...updatedCard.variables[idx],
              value,
            };
          } else {
            updatedCard.variables.push({ slug: key, value, type: "Text" });
          }

          if (key === "card-description") {
            updatedCard["card-description"] = value;
            updatedCard.description = value;
          }
        });
      }

      if (newPayload.workspace_lane_id) {
        updatedCard.workspace_lane_id = newPayload.workspace_lane_id;
      }

      if (newPayload.optimisticUser) {
        const users = Array.isArray(newPayload.optimisticUser)
          ? newPayload.optimisticUser
          : [newPayload.optimisticUser];
        updatedCard.seats = users;
        updatedCard.seat_id = users
          .map((u: any) => u?._id || u?.id)
          .filter(Boolean);
        updatedCard.seat = users[0] || null;
        updatedCard.assigned_to = users;
      }

      return updatedCard;
    };

    // Update product-card cache
    queryClient.setQueryData(["product-card", card_id], updateCardLogic);

    // Update sheet-list cache
    queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
      if (!old || !Array.isArray(old.data)) return old;
      return {
        ...old,
        data: old.data.map((column: any) => ({
          ...column,
          cards: column.cards?.map((card: any) =>
            card._id === card_id ? { ...updateCardLogic(card) } : card,
          ),
        })),
      };
    });

    // Update ALL sprint-kanban cached queries optimistically
    // Each entry is [queryKey, data] — update only the one containing this card
    queryClient.setQueriesData({ queryKey: ["sprint-kanban"] }, (old: any) => {
      // sprint-kanban returns array of columns directly
      if (!old || !Array.isArray(old)) return old;

      const hasCard = old.some((col: any) =>
        col.cards?.some((c: any) => c._id === card_id),
      );

      // Only patch the query instance that actually contains this card
      if (!hasCard) return old;

      return old.map((col: any) => ({
        ...col,
        cards: (col.cards ?? []).map((card: any) =>
          card._id === card_id ? { ...updateCardLogic(card) } : card,
        ),
      }));
    });

    return { previousCard, previousLists, previousSprintKanbans };
  },

  onSuccess: (serverCard: any, variables: any) => {
    const cardId = variables.card_id;

    if (serverCard) {
      // Update product-card cache with server response
      queryClient.setQueryData(["product-card", cardId], serverCard);

      // Update sheet-list cache with server response
      queryClient.setQueryData(["sheet-list"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((column: any) => ({
            ...column,
            cards: column.cards?.map((card: any) =>
              card._id === cardId ? { ...card, ...serverCard } : card,
            ),
          })),
        };
      });

      // Update ALL sprint-kanban queries with server response
      queryClient.setQueriesData(
        { queryKey: ["sprint-kanban"] },
        (old: any) => {
          if (!old || !Array.isArray(old)) return old;

          const hasCard = old.some((col: any) =>
            col.cards?.some((c: any) => c._id === cardId),
          );

          if (!hasCard) return old;

          return old.map((col: any) => ({
            ...col,
            cards: (col.cards ?? []).map((card: any) =>
              card._id === cardId ? { ...card, ...serverCard } : card,
            ),
          }));
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["product-card", cardId],
      });
    }
  },

  onError: (_err: any, variables: any, context: any) => {
    if (!context) return;

    const cardId = variables.card_id;

    // Rollback product-card cache
    queryClient.setQueryData(["product-card", cardId], context.previousCard);

    // Rollback sheet-list cache
    queryClient.setQueriesData(
      { queryKey: ["sheet-list"] },
      context.previousLists,
    );
  },

  onSettled: (_data: any, _err: any, variables: any) => {
    const cardId = variables.card_id;

    queryClient.invalidateQueries({ queryKey: ["product-card", cardId] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
  },
});
function handleMindmapUpdateCard(payload: any) {
  moveCard.mutate(payload);
}
function toggleCreateSheet() {
  selectedSheettoAction.value = {};
  isCreateSheetModal.value = !isCreateSheetModal.value;
}

function toggleAddList() {
  activeAddList.value = !activeAddList.value;
}

// Dropdown Transformation
const transformedData = computed(() =>
  (data.value || []).map((item: any) => ({
    _id: item._id,
    title: item.variables["sheet-title"],
    description: item.variables["sheet-description"],
    icon: item.icon,
  })),
);

const showDeleteModal = ref(false);
const selectedSheettoAction = ref<any>();
const { mutate: updateSheet, isPending: isDeleting } = useUpdateWorkspaceSheet({
  onSuccess: () => {
    console.log(">>. clicong");

    showDeleteModal.value = false;
    refetchSheets();
  },
});
function handleDeleteSheetModal(opt: any) {
  showDeleteModal.value = true;
  selectedSheettoAction.value = opt;
}
function handleDeleteSheet() {
  updateSheet({
    sheet_id: selectedSheettoAction.value?._id,
    workspace_module_id: moduleId.value,
    is_trash: true,
  });
}
function openEditSprintModal(opt: any) {
  isCreateSheetModal.value = true;
  selectedSheettoAction.value = opt;
}

// reactive search query
const searchQuery = ref("");
const debouncedQuery = ref("");

watch(
  searchQuery,
  debounce((val: any) => {
    debouncedQuery.value = val;
  }, 200),
);
// computed filtered board
const fuse = computed(() => {
  const lists = Array.isArray(Lists.value?.data?.data)
    ? Lists.value?.data?.data
    : [];
  console.log("lists data", Lists.value?.data);

  const allCards = lists.flatMap((col: any) =>
    (col.cards || []).map((card: any) => ({
      ...card,
      columnId: col.title,
      "card-title": card["card-title"] || "", // <- top-level now
      "card-description": card["card-description"] || "", // <- top-level
    })),
  );

  return new Fuse(allCards, {
    keys: ["card-title", "card-description"],
    threshold: 0.3,
  });
});

const filteredBoard = computed(() => {
  const lists = Array.isArray(Lists.value?.data) ? Lists.value?.data : [];

  if (!searchQuery.value) {
    return lists.map((col: any) => ({
      ...col,
      cards: (col.cards || []).map((card: any) => ({
        _id: card._id,
        "card-title": card["card-title"], // include title
        "card-description": card["card-description"], // include description
        created_at: card.created_at,
        "card-code": card["card-code"],
        variables: card.variables || {},
        // "start-date": card["start-date"],
        // "end-date": card["end-date"],
      })),
    }));
  }

  const results = fuse.value.search(searchQuery.value).map((r: any) => r.item);

  return lists.map((col: any) => {
    const filteredCards = results
      .filter((c: any) => c.columnId === col.title)
      .map((card: any) => ({
        _id: card._id,
        "card-title": card["card-title"], // include title
        "card-description": card["card-description"], // include description
        created_at: card.created_at,
        "card-code": card["card-code"],
        variables: card.variables || {},
      }));

    return { ...col, cards: filteredCards };
  });
});
const tableRows = computed(() => {
  const lists = Lists.value?.data || [];

  return lists.flatMap((sheet: any) =>
    (sheet.cards || []).map((card: any) => ({
      id: card._id,

      Title: card["card-title"],

      "Due Date": card["end-date"],

      Owner: card?.created_by?.u_full_name || "",

      Assignee: card?.seat?.title || "",

      raw: card,
    })),
  );
});
const columns = [
  { key: "Title", label: "Title" },
  { key: "Due Date", label: "Due Date" },
  { key: "Owner", label: "Owner" },
  { key: "Assignee", label: "Assignee" },
];
const selectedDeleteId = ref<string | null>(null);
const openDeleteModal = (cardId: string) => {
  selectedDeleteId.value = cardId;
  showDeleteTicket.value = true;
};
const handleDeleteCard = async () => {
  if (!selectedDeleteId.value) return;

  try {
    await request({
      url: `workspace/card/${selectedDeleteId.value}`,
      method: "DELETE",
    });

    toast.success("Ticket deleted successfully");

    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    await refetchSheets();
    refetchList();
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    showDeleteTicket.value = false;
    selectedDeleteId.value = null;
  }
};
const localPendingTickets = ref<any[]>([]);
const { mutate: addTicket } = useAddTicket({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    localPendingTickets.value = [];
  },
});
function handleMindmapCreateCard(payload: any) {
  addTicket(payload);
}
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
