<template>
  <div class="flex h-full w-full gap-2">
    <div
      class="flex-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px]
      flex flex-col border border-border overflow-hidden"
    >
      <div class="sticky top-0 z-20 bg-bg-card overflow-x-auto shrink-0">
        <div
          class="header lg:px-4 px-2 py-2 flex justify-between items-center gap-1 overflow-auto border-b border-border"
        >
          <div class="flex lg:gap-4 gap-2 py-1">
            <div class="hidden sm:flex">
              <button
                class="lg:px-3 px-2 h-8 mt-1 rounded-2xl bg-accent text-white font-medium cursor-pointer"
                @click="$emit('go-back')"
              >
                <i class="fa-solid fa-chevron-left"></i>
                Go Back
              </button>
            </div>

            <div class="flex sm:hidden">
              <button
                class="cursor-pointer bg-gradient-to-tr from-accent to-accent-hover px-2 text-white items-center justify-center py-1 rounded-2xl font-medium"
                @click="$emit('go-back')"
              >
                <i class="fa-solid fa-chevron-left"></i>
              </button>
            </div>

            <div
              class="lg:px-4 px-2 flex items-center h-8 mt-1 rounded-2xl bg-accent text-white font-medium cursor-pointer"
            >
              {{ activeSprint }}
            </div>
          </div>

          <!-- VIEW SWITCHER -->
          <div class="flex gap-3 items-center">
            <div class="flex gap-3 items-center">
              <div class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md">
                <button
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'kanban'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  @click="view = 'kanban'"
                >
                  <i class="fa-solid fa-chart-kanban"></i>
                </button>

                <button
                  @click="view = 'table'"
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'table'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Gallery view"
                >
                  <i class="fa-solid fa-align-left"></i>
                </button>

                <!-- MindMap button — kept, logic lives in MindMapView component -->
                <button
                  @click="view = 'mindmap'"
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'mindmap'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="MindMap view"
                >
                  <i class="fa-solid fa-chart-diagram"></i>
                </button>

                <button
                  @click="view = 'calendar'"
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'calendar'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Calendar view"
                >
                  <i class="fa-regular fa-calendar"></i>
                </button>

                <button
                  @click="view = 'gantt'"
                  class="aspect-square cursor-pointer rounded-sm p-0"
                  :class="view === 'gantt'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Gantt Chart view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z" />
                  </svg>
                </button>

                <button
                  @click="view = 'timeline'"
                  class="aspect-square cursor-pointer rounded-sm p-0"
                  :class="view === 'timeline'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Timeline view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
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
      </div>

      <!-- ===== MAIN ===== -->
      <div class="flex flex-1 overflow-hidden bg-bg-card">
        <div class="flex-1 min-w-0 flex flex-col">

          <!-- ── Kanban View ─────────────────────────────────────── -->
          <template v-if="view === 'kanban'">
            <KanbanSkeleton v-show="isPending" />
            <div
              v-show="!isPending"
              class="flex-1 overflow-x-auto overflow-y-hidden scrollbar-visible me-3"
            >
              <div class="flex gap-3 p-4 min-w-max h-full">
                <KanbanBoard
                  class="flex h-full"
                  :board="filteredBoard"
                  :variable_id="selected_view_by"
                  :sheet_id="selected_sheet_id"
                  @onPlus="plusHandler"
                  @delete:column="(e: any) => deleteHandler(e)"
                  @update:column="(e: any) => handleUpdateColumn(e)"
                  @reorder="onReorder"
                  @addColumn="handleAddColumn"
                  @select:ticket="selectCardHandler"
                  @onBoardUpdate="handleBoardUpdate"
                >
                  <template #column-footer="column">
                    <div
                      class="mx-auto text-text-secondary/80 m-2 w-[90%] h-full justify-center flex items-center border border-dashed border-border"
                      v-if="
                        workspaceStore?.transitions?.all_allowed &&
                        !workspaceStore?.transitions?.all_allowed?.includes(column.column.title) &&
                        workspaceStore.transitions.currentColumn != column.column.title
                      "
                    >
                      Disable ( you can't drop here )
                    </div>
                  </template>

                  <template #ticket="{ ticket }">
                    <div class="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                      <KanbanTicket
                        :selectedVar="selected_view_by"
                        :ticket="ticket"
                        @select="() => selectCardHandler(ticket)"
                      />
                    </div>
                  </template>
                </KanbanBoard>
              </div>
            </div>
          </template>

          <!-- ── Table View ──────────────────────────────────────── -->
          <template v-if="view === 'table'">
            <div class="flex-1 overflow-auto pb-12">
              <TableView
                @toggleVisibility="toggleVisibilityHandler"
                @addVar="() => { isCreateVar = true }"
                :isPending="isPending || isVariablesPending"
                :columns="columns"
                :rows="filteredBoard"
                :canCreate="canCreateCard"
                :canCreateVariable="canCreateVariable"
                @create="handleCreateTicket"
              />
            </div>
          </template>

          <!-- ── MindMap View ─────────────────────────────────────── -->
          <template v-if="view === 'mindmap'">
            <MindMapView
              :listsData="Lists ?? []"
              :selectedSheetId="selected_sheet_id"
              :selectedViewBy="selected_view_by"
              :workspaceId="workspaceId"
              :moduleId="moduleId"
              :addingList="!!addingList"
              :activeAddList="activeAddList"
              :newColumn="newColumn"
              :canCreateCard="canCreateCard"
              :canEditCard="canEditCard"
              :canDeleteCard="canDeleteCard"
              :canAssignCard="canAssignCard"
              :canCreateSheet="false"
              :canCreateVariable="canCreateVariable"
              :canEditSheet="false"
              @select:ticket="selectCardHandler"
              @delete:ticket="handleMindmapDeleteTicket"
              @create:sheet="handleMindmapCreateSheet"
              @create:card="handleMindmapCreateCard"
              @update:card="handleMindmapUpdateCard"
              @update:sheet="handleMindmapUpdateSheet"
              @reorder:card="handleMindmapReorderCard"
              @toggle-add-list="setActiveAddList"
              @add-column="handleAddColumn"
            />
          </template>

          <!-- ── Calendar View ───────────────────────────────────── -->
          <template v-if="view === 'calendar'" class="max-h-[calc(100vh-100px)] overflow-y-auto">
            <CalendarView
              :data="filteredBoard"
              @select:ticket="selectCardHandler"
              class="min-h-[600px]"
            />
          </template>

          <!-- ── Gantt View ───────────────────────────────────────── -->
          <template v-if="view === 'gantt'" class="max-h-[calc(100vh-100px)] overflow-y-auto">
            <GanttChartView
              :data="filteredBoard"
              @select:ticket="selectCardHandler"
            />
          </template>

          <!-- ── Timeline View ───────────────────────────────────── -->
          <template v-if="view === 'timeline'" class="max-h-[calc(100vh-100px)] overflow-y-auto">
            <TimelineView
              :data="filteredBoard"
              @select:ticket="selectCardHandler"
            />
          </template>

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
            @cancel="() => { showDelete = false }"
          />

          <CreateTaskModal
            :selectedVariable="selected_view_by"
            :listId="localColumnData?.title"
            :sheet_id="selected_sheet_id"
            v-if="createTeamModal"
            key="createTaskModalKey"
            v-model="createTeamModal"
            @submit=""
          />

        </div>
      </div>
    </div>

    <!-- ===== SIDE PANEL ===== -->
    <SidePanel
      v-if="selectedCard?._id"
      class="shrink-0 h-full"
      :details="selectedCard"
      @close="() => selectCardHandler({ variables: {} })"
      :showPanel="!!selectedCard?._id"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  ref,
  watch,
  h,
  triggerRef,
} from "vue";
import { toast } from "vue-sonner";
import { usePermissions } from "../../../composables/usePermissions";
import { useWorkspaceStore } from "../../../stores/workspace";
import TableView from "../../../components/feature/TableView/TableView.vue";
import { request, toApiMessage } from "../../../libs/api";
import {
  ReOrderCard,
  ReOrderList,
  useAddList,
  useSheets,
  useVariables,
  useLanes,
  useMoveCard,
  useCreateWorkspaceSheet,
  useUpdateWorkspaceSheet,
  useVarVisibilty,
  useAddTicket,
} from "../../../queries/useSheets";
import { useRoute } from "vue-router";
import KanbanSkeleton from "../../../components/skeletons/KanbanSkeleton.vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useSprintKanban } from "../../../queries/usePlan";
import KanbanTicket from "../../../components/feature/kanban/KanbanTicket.vue";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { useSingleWorkspace } from "../../../queries/useWorkspace";
import { getInitials } from "../../../utilities";
import { avatarColor } from "../../../utilities/avatarColor";

// ─── Lazy components ──────────────────────────────────────────────────────────
const CreateTaskModal = defineAsyncComponent(() => import("../../Product/modals/CreateTaskModal.vue"));
const ConfirmDeleteModal = defineAsyncComponent(() => import("../../Product/modals/ConfirmDeleteModal.vue"));
const SidePanel = defineAsyncComponent(() => import("../../Product/components/SidePanel.vue"));
const KanbanBoard = defineAsyncComponent(() => import("../../../components/feature/kanban/KanbanBoard.vue"));
const DatePicker = defineAsyncComponent(() => import("../../Product/components/DatePicker.vue"));
const TableSearchCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableSearchCell.vue"));
const TableAssigneeCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableAssigneeCell.vue"));
const CalendarView = defineAsyncComponent(() => import("../../../components/feature/CalendarView.vue"));
const GanttChartView = defineAsyncComponent(() => import("../../../components/feature/GanttChartView.vue"));
const TimelineView = defineAsyncComponent(() => import("../../../components/feature/TimelineView.vue"));
const MindMapView = defineAsyncComponent(
  () => import("../../../components/feature/MindmapView.vue"),
);
const props = defineProps<{
  sptint_id: any;
  searchQuery: string;
  activeSprint: string;
}>();
const {
  canCreateVariable,
  canCreateCard,
  canEditCard,
  canDeleteCard,
  canAssignCard,
} = usePermissions();
const view = ref("kanban");
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const queryClient = useQueryClient();
const workspaceStore = useWorkspaceStore();
const isCreateVar = ref(false);
const selected_module_id = ref<string>("");
const selectedCard = ref<any>();
const createTeamModal = ref(false);
const showDelete = ref(false);
const localColumnData = ref();
const activeAddList = ref(false);
const newColumn = ref("");
const showDeleteModal = ref(false);
const selectedDeleteId = ref<string | null>(null);
const isDeletingTicket = ref(false);
const selectedSheetTitle = ref<string>("");
const { data: workspaces } = useSingleWorkspace(workspaceId.value);
const modules = ref(workspaces.value.modules || []);

const moduleOptions = computed(() => {
  return (modules.value || []).map((m: any) => ({
    _id: m._id,
    title: m.variables?.["module-title"] ?? "Untitled module",
    description: m.variables?.["module-description"] ?? "",
    icon: m.icon ?? null,
    status: m.status ?? null,
  }));
});

watch(
  moduleOptions,
  (opts) => {
    if (!opts.length) return;
    if (!selected_module_id.value) {
      const defaultModule = opts.find((m: any) => m.title === "Tasks") || opts[0];
      selected_module_id.value = defaultModule._id;
    }
  },
  { immediate: true },
);
const { data: sheets, refetch: refetchSheets } = useSheets({
  workspace_id: workspaceId.value,
  workspace_module_id: moduleId.value,
});

watch(selected_module_id, (newModuleId) => {
  if (newModuleId) refetchSheets();
});

const sheetId = computed(() => (sheets.value ? sheets.value[0]?._id : ""));
const selected_sheet_id = ref<any>(sheetId);
const { data: variables, isPending: isVariablesPending } = useVariables(
  workspaceId,
  selected_module_id,
  selected_sheet_id,
);

const viewBy = computed(() => (variables.value ? variables.value[0]?._id : ""));
const selected_view_by = ref(viewBy);

const selected_sprint_id = computed(() => props.sptint_id);
const { data: Lists, isPending, refetch: refetchSheetLists } = useSprintKanban(selected_sprint_id);

interface DropdownOption {
  _id: string;
  title: string;
  description?: string;
  icon?: any;
  status?: string;
}

const transformedData = computed<DropdownOption[]>(() => {
  if (!sheets.value?.length) return [];
  return sheets.value.map((item: any) => ({
    _id: item._id,
    title: item.variables?.["sheet-title"] || "Untitled Sheet",
    description: item.variables?.["sheet-description"] || "",
    icon: item.icon || null,
    status: item.generation_status || null,
  }));
});

watch(
  transformedData,
  (newVal) => {
    if (newVal.length > 0 && !selected_sheet_id.value) {
      selected_sheet_id.value = newVal[0]._id;
    }
  },
  { immediate: true },
);

watch(
  transformedData,
  (newData) => {
    selectedSheetTitle.value = newData.length > 0 ? newData[0].title : props.activeSprint;
  },
  { immediate: true },
);

watch(sheets, (newSheetId) => {
  if (newSheetId?.length > 0) selected_sheet_id.value = newSheetId[0]?._id;
});

const selectCardHandler = (card: any) => {
  selectedCard.value = card;
};

const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  if (a.type === "column") {
    reorderList.mutate({
      payload: {
        workspace_id: workspaceId.value,
        workspace_module_id: moduleId.value,
        variable_id: selected_view_by.value,
        moved_value: a.meta.id,
        new_index: a.meta.newIndex,
      },
    });
  } else {
    reorderCard.mutate({
      payload: {
        workspace_id: workspaceId.value,
        card_id: a.meta.moved._id,
        group_value: a.meta.fromColumnId,
        group_variable_id: selected_view_by.value,
        new_index: a.meta.newIndex,
        sheet_id: selected_sheet_id.value,
      },
    });
  }
}

const handleBoardUpdate = (_: any) => {};

const { mutate: updateSheet } = useUpdateWorkspaceSheet({
  onSuccess: () => {
    refetchSheets();
    showDeleteModal.value = false;
  },
});

const { mutate: addList, isPending: addingList } = useAddList({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    newColumn.value = "";
    showDelete.value = false;
    activeAddList.value = false;
  },
});

const handleAddColumn = (v: any) => {
  addList({
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    variable_id: selected_view_by.value,
    value: v,
  });
};

function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}

const handleUpdateColumn = (newTitle: any) => {
  addList({
    workspace_id: route.params.id,
    module_id: route.params.module_id,
    new_value: newTitle.title,
    value: newTitle.oldTitle,
    variable_id: selected_view_by.value,
  });
};

const handleDeleteColumn = () => {
  addList({
    value: localColumnData.value.title,
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    newValue: localColumnData.value.title,
    variable_id: selected_view_by.value,
    is_trash: true,
  });
};

const deleteHandler = (e: any) => { showDelete.value = true; localColumnData.value = e; };
const plusHandler = (e: any) => {
  createTeamModal.value = true;
  localStorage.setItem("selectedStatusTitle", e?.title);
  localStorage.setItem("selectedModuleId", selected_module_id.value);
  localColumnData.value = e;
};

const searchQuery = computed(() => props.searchQuery);
const debouncedQuery = ref("");

watch(
  searchQuery,
  debounce((val: string) => { debouncedQuery.value = val; }, 200),
);

const fuse = computed(() => {
  const allCards = Lists.value?.flatMap((col: any) =>
    col.cards.map((card: any) => ({ ...card, columnId: col.title })),
  );
  return new Fuse(allCards, { keys: ["card-title", "card-description"], threshold: 0.3 });
});

const normalizedTableData = computed(() => {
  let array: any = [];
  (Lists.value ?? []).forEach((col: any) => { array = [...array, ...col?.cards]; });
  return array;
});

const filteredBoard = computed(() => {
  if (view.value === "kanban") {
    if (!searchQuery.value) return Lists.value;
    const results = fuse.value.search(searchQuery.value).map((r: any) => r.item);
    return Lists.value.map((col: any) => ({
      ...col,
      cards: results.filter((c: any) => c.columnId === col.title),
    }));
  } else {
    const query = searchQuery.value?.trim();
    if (!query) {
      let array: any = [];
      (Lists.value ?? [])?.forEach((col: any) => { array = [...array, ...col?.cards]; });
      return array;
    }
    const fuseTable = new Fuse(normalizedTableData.value, {
      keys: ["card-title", "card-description"],
      threshold: 0.3,
    });
    return fuseTable.search(query).map((r) => r.item);
  }
});

const { data: lanes } = useLanes(workspaceId);

const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  })),
);

const getOptions = (options: any) =>
  options.map((el: any) => ({ _id: el.value ?? el, title: el.value ?? el }));

const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["get-sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  },
});

const { mutate: addTicket } = useAddTicket({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
  },
});

const updateOptimisticCard = (cardId: string, updater: (card: any) => void) => {
  if (!Lists.value) return;
  const listIndex = Lists.value.findIndex((l: any) => l.cards.some((c: any) => c._id === cardId));
  if (listIndex !== -1) {
    const cardIndex = Lists.value[listIndex].cards.findIndex((c: any) => c._id === cardId);
    if (cardIndex !== -1) {
      const newCard = { ...Lists.value[listIndex].cards[cardIndex] };
      updater(newCard);
      Lists.value[listIndex].cards[cardIndex] = newCard;
      triggerRef(Lists);
    }
  }
};

function setLane(id: any, v: any) {
  updateOptimisticCard(id, (card) => {
    const newLane = laneOptions.value.find((l: any) => l._id === v);
    if (newLane) card.lane = newLane;
  });
  triggerRef(Lists);
  moveCard.mutate({ card_id: id, workspace_lane_id: v });
}

const assignHandle = (cardId: any, users: any[]) => {
  const userIds = users.filter((u) => u && (u._id || u.id)).map((u) => u._id || u.id);
  updateOptimisticCard(cardId, (card) => {
    card.seat = users;
    card.seats = users;
    card.seat_id = userIds;
  });
  moveCard.mutate({ card_id: cardId, seat_id: userIds });
};

function handleChangeTicket(id: any, key: any, value: any) {
  updateOptimisticCard(id, (card) => {
    if (key === "card-title") card[key] = value;
    if (Array.isArray(card.variables)) {
      const variable = card.variables.find((v: any) => v.slug === key);
      if (variable) variable.value = value;
      else card.variables.push({ slug: key, value, type: "Select" });
    } else if (card.variables && typeof card.variables === "object") {
      card.variables[key] = value;
    } else {
      card[key] = value;
    }
  });
  moveCard.mutate({ card_id: id, variables: { [key]: value.trim() } });
}

function handleCreateTicket(title: any) {
  if (title["card-title"]) {
    addTicket({
      sheet_list_id: "To Do",
      workspace_id: workspaceId.value,
      sheet_id: selected_sheet_id.value,
      variables: { "card-title": title["card-title"].trim() },
      createdAt: new Date().toISOString(),
    });
  }
}

const setStartDate = (card_id: any, e: any) => {
  const listIndex = Lists.value.findIndex((l: any) => l.cards.some((c: any) => c._id === card_id));
  if (listIndex !== -1) {
    const cardIndex = Lists.value[listIndex].cards.findIndex((c: any) => c._id === card_id);
    if (cardIndex !== -1) Lists.value[listIndex].cards[cardIndex]["end-date"] = e;
  }
  moveCard.mutate({ card_id, variables: { "start-date": e } });
};

const { mutate: toggleVisibility } = useVarVisibilty();
const toggleVisibilityHandler = (key: any, visible: any) => {
  toggleVisibility({
    payload: {
      sheet_id: selected_sheet_id.value,
      workspace_id: workspaceId.value,
      variable_slug: key,
      is_visible: visible,
    },
  });
};

const columns = computed(() => {
  return [
    {
      key: "card-title",
      label: "Title",
      render: ({ row, value }: any) =>
        h("div", { class: "flex items-center gap-1 w-full" }, [
          h("a", {
            onClick: () => (selectedCard.value = row),
            class: "text-[12px] underline text-blue-500 shrink-0 overflow-ellipsis cursor-pointer",
          }, row["card-code"]),
          h("div", { class: "flex-1 min-w-0" }, [
            h("input", {
              onFocusout: (e: any) => { handleChangeTicket(row?._id, "card-title", e?.target?.value); },
              class: "text-[12px] w-full overflow-ellipsis capitalize p-1 focus:border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-transparent focus:bg-bg-body h-8",
              defaultValue: value,
              disabled: !canEditCard.value,
            }),
          ]),
        ]),
    },
    {
      key: "end-date",
      label: "Due Date",
      render: ({ row, value }: any) => {
        const date = ref<any>(value);
        return h(DatePicker, {
          class: "capitalize flex items-center gap-2 text-[12px]",
          placeholder: "Set start date",
          tableInputClass: true,
          modelValue: date.value,
          disabled: !canEditCard.value,
          "onUpdate:modelValue": (e: any) => setStartDate(row?._id, e),
          emptyText: "Date",
        });
      },
    },
    {
      key: "lane",
      label: "Lane",
      render: ({ row }: any) =>
        h(TableSearchCell, {
          options: laneOptions.value ?? [],
          placeholder: "Select lane",
          modelValue: row.lane?._id || null,
          disabled: !canEditCard.value,
          "onUpdate:modelValue": (e: any) => setLane(row?._id, e),
          displayField: "title",
          emptyText: "Lane",
        }),
    },
    {
      key: "created_by",
      label: "Owner",
      render: ({ value }: any) =>
        h("div", { class: "capitalize flex items-center gap-2 px-3" }, [
          h("div", { class: "rounded-full" }, [
            value?.u_profile_image
              ? h("img", { class: "w-6 h-6 rounded-full", src: value?.u_profile_image })
              : h("div", {
                  class: "w-5 h-5 rounded-full flex justify-center items-center text-[11px]",
                  style: `background:${value?.u_full_name ? avatarColor({ name: value.u_full_name, email: value.u_email }) : ""}`,
                }, getInitials(value?.u_full_name)),
          ]),
          h("span", { class: "text-[12px]" }, value ? value?.u_full_name : ""),
        ]),
    },
    {
      key: "seat",
      label: "Assignee",
      render: ({ row, value }: any) =>
        h(TableAssigneeCell, {
          class: "capitalize flex items-center gap-2",
          onAssign: (users: any[]) => assignHandle(row?._id, users),
          assigneeId: row.seats || row.seat_id || value,
          seat: row.seats || row.seat || value,
          name: true,
          disabled: !canAssignCard.value,
          emptyText: "Assignee",
        }),
    },
    ...(variables.value?.variables
      ?.filter((e: any) => e?.type?.title === "Select")
      .map((e: any) => ({
        key: e?.slug,
        label: e?.slug,
        render: ({ row, value }: any) => {
          let cellValue = value;
          if (Array.isArray(row?.variables)) {
            const found = row.variables.find((v: any) => v.slug === e.slug);
            if (found) cellValue = found.value;
          } else {
            cellValue = row?.variables?.[e.slug] ?? row?.[e.slug] ?? value;
          }
          return h("div", { class: "capitalize flex items-center gap-2" }, [
            h(TableSearchCell, {
              options: getOptions(e.data ?? []),
              modelValue: cellValue,
              disabled: !canEditCard.value,
              emptyText: e.slug,
              "onUpdate:modelValue": (val: any) => { handleChangeTicket(row?._id, e.slug, val); },
              columnName: e.slug,
            }),
          ]);
        },
        visible: e?.is_visible,
      })) ?? []),
  ];
});

interface Card { _id: string; }
interface SheetList { cards: Card[]; }
interface Sheet { sheet_lists: SheetList[]; }

const removeCardFromState = (cardId: string) => {
  Lists.value?.sheets?.forEach((sheet: Sheet) => {
    sheet.sheet_lists?.forEach((list: SheetList) => {
      list.cards = list.cards.filter((card: Card) => card._id !== cardId);
    });
  });
};

const deleteTicket = async () => {
  if (!selectedDeleteId.value) return;
  try {
    isDeletingTicket.value = true;
    await request({ url: `workspace/card/${selectedDeleteId.value}`, method: "DELETE" });
    removeCardFromState(selectedDeleteId.value);
    toast.success("Ticket deleted successfully");
    await refetchSheets();
    await refetchSheetLists();
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    isDeletingTicket.value = false;
  }
};
const { mutateAsync: createNewSheet } = useCreateWorkspaceSheet({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
  },
});

async function handleMindmapDeleteTicket(cardId: string) {
  selectedDeleteId.value = cardId;
  await deleteTicket();
}

async function handleMindmapCreateSheet(payload: any) {
  try {
    await createNewSheet(payload);
  } catch (err) {
    console.error("Error creating sheet from mindmap:", err);
  }
}

function handleMindmapCreateCard(payload: any) {
  addTicket(payload);
}

function handleMindmapUpdateCard(payload: any) {
  moveCard.mutate(payload);
}

function handleMindmapUpdateSheet(payload: any) {
  updateSheet(payload);
}

function handleMindmapReorderCard(_payload: any) {
  refetchSheets();
  refetchSheetLists();
}
</script>

<style scoped>
.scrollbar-visible::-webkit-scrollbar {
  height: 8px;
  margin-bottom: 5px !important;
}
.scrollbar-visible::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 8px;
}
.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background-color: rgba(150, 150, 150, 0.6);
}
.scrollbar-visible {
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent;
}
</style>