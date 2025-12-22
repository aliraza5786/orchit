<template>
  <div
    class="flex-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] flex-grow h-full bg-bg-card border border-border overflow-x-auto flex-col flex scrollbar-visible"
  >
    <div class="overflow-x-auto shrink-0 ">
       <div
      class="header  px-4 py-3 border-b border-border flex items-center justify-between gap-1 min-w-max h-full"
    >
      <Dropdown
        @edit-option="openEditSprintModal"
        v-model="selected_sheet_id"
        :canEdit="canEditSheet"
        :canDelete="canDeleteSheet"
        @delete-option="handleDeleteSheetModal"
        :options="transformedData"
        variant="secondary"
        customClasses="fixed w-auto"
      >
        <template #more>
          <div
            v-if="canCreateSheet"
            @click="createSheet()"
            class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
          >
            <i class="fa-solid fa-plus"></i> Add new
          </div>
        </template>
      </Dropdown>
      <div class="flex gap-3 items-center">
        <Dropdown
          v-if="view == 'kanban' || 'mindmap'"
          :actions="false"
          prefix="View by"
          v-model="selected_view_by"
          :options="variables"
          variant="secondary"
           customClasses="fixed w-auto"
        >
          <template #more>
            <div
              v-if="canCreateVariable"
              @click="
                () => {
                  isCreateVar = true;
                }
              "
              class="sticky bottom-0 bg-bg-dropdown shadow-md shadow-border capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
            >
              <i class="fa-solid fa-plus"></i> Add new
            </div>
          </template>
        </Dropdown>
        <Searchbar
          @onChange="
            (e) => {
              searchQuery = e;
            }
          "
          placeholder="Search in Orchit AI space"
        >
        </Searchbar>

        <div
          class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md"
        >
          <button
            class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
            :class="
              view === 'kanban'
                ? 'text-accent bg-accent-text'
                : ' hover:bg-border/50 backdrop-blur-2xl  transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
            "
            title="List view"
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
            title="Gallery view"
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
        </div>
      </div>
    </div>
    </div>
    <template v-if="view == 'kanban'">
      <KanbanSkeleton v-show="isPending || isSheetPending" />
      <div
        v-show="!isPending && !isSheetPending"
        class="flex overflow-x-auto gap-3 p-4 scrollbar-visible"
      >
        <KanbanBoard
          @onPlus="plusHandler"
          :board="filteredBoard"
          @delete:column="(e: any) => deleteHandler(e)"
          @update:column="(e: any) => handleUpdateColumn(e)"
          @reorder="onReorder"
          @addColumn="handleAddColumn"
          @select:ticket="selectCardHandler"
          @onBoardUpdate="handleBoardUpdate"
          :variable_id="selected_view_by"
          :sheet_id="selected_sheet_id"
        >
          <template #column-footer="column">
            <div
              class="mx-auto text-text-secondary/80 m-2 w-[90%] h-full justify-center flex items-center border border-dashed border-border"
              v-if="
                workspaceStore?.transitions?.all_allowed &&
                !workspaceStore?.transitions?.all_allowed?.includes(
                  column.column.title
                ) &&
                workspaceStore.transitions.currentColumn != column.column.title
              "
            >
              Disbale ( you can't drop here )
            </div>
          </template>
          <template #ticket="{ ticket }">
            <KanbanTicket
              :selectedVar="selected_view_by"
              @select="
                () => {
                  selectCardHandler(ticket);
                }
              "
              :ticket="ticket"
            />
          </template>
        </KanbanBoard>
        <div class="min-w-[328px]" @click.stop>
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
                varaint="primary"
                class="px-3 py-1 bg-accent cursor-pointer text-white rounded"
                >{{ addingList ? "Adding..." : "Add list" }}</Button
              >
              <i class="fa-solid fa-close" @click="setActiveAddList"></i>
            </div>
          </div>
          <button
            v-else
            :disabled="!canCreateVariable"
            class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
            :class="
              !canCreateVariable ? 'cursor-not-allowed' : 'cursor-pointer'
            "
            @click.stop="setActiveAddList"
          >
            + Add List
          </button>
        </div>
      </div>
    </template>
    <template v-if="view == 'table'">
      <TableView
        @toggleVisibility="toggleVisibilityHandler"
        @addVar="
          () => {
            isCreateVar = true;
          }
        "
        :isPending="isPending || isVariablesPending"
        :columns="columns"
        :rows="filteredBoard"
        :canCreate="canCreateCard"
        :canCreateVariable="canCreateVariable"
        @create="handleCreateTicket"
      />
    </template>
    <!-- MindMap View -->
    <template v-if="view === 'mindmap'">
      <div ref="mindMapRef" class="w-full h-[100%] overflow-y-hidden rounded-md relative"></div>
      <!-- Popup container -->
      <div
        v-if="activeAddList"
        class="absolute top-40 left-70 bg-bg-body rounded-lg p-4 shadow-lg z-100 min-w-[328px] border"
        @click.stop
      >
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
            varaint="primary"
            class="px-3 py-1 bg-accent cursor-pointer text-white rounded"
          >
            {{ addingList ? "Adding..." : "Add list" }}
          </Button>
          <i
            class="fa-solid fa-close cursor-pointer"
            @click="setActiveAddList"
          ></i>
        </div>
      </div>
    </template>
  </div>
  <ConfirmDeleteModal
    @click.stop=""
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
    @cancel="
      () => {
        showDelete = false;
      }
    "
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
  <SidePanel
    v-if="selectedCard?._id"
    :details="selectedCard"
    @close="
      () => {
        selectCardHandler({ variables: {} });
      }
    "
    :showPanel="selectedCard?._id ? true : false"
  />
  <CreateSheetModal
    size="md"
    :sheet="selectedSheettoAction"
    v-model="isCreateSheetModal"
  />
  <CreateVariableModal
    v-model="isCreateVar"
    v-if="isCreateVar"
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
  <ConfirmDeleteModal
    v-model="showTicketDelete"
    title="Delete Ticket"
    itemLabel="Ticket"
    :itemName="ticketToDelete?.title"
    :requireMatchText="ticketToDelete?.title"
    confirmText="Delete Ticket"
    cancelText="Cancel"
    size="md"
    :loading="isDeletingTicket"
    @confirm="handleDeleteTicket"
    @cancel="
      () => {
        showTicketDelete = false;
        ticketToDelete = null;
      }
    "
  />

  <div></div>
</template>
<script setup lang="ts">
import {
  computed,
  onMounted,
  defineAsyncComponent,
  h,
  ref,
  watch,
  watchEffect,
  nextTick,
  triggerRef
} from "vue";
import { useWorkspaceStore } from "../../stores/workspace";
import Dropdown from "../../components/ui/Dropdown.vue";
import Searchbar from "../../components/ui/SearchBar.vue";
import {
  ReOrderCard,
  ReOrderList,
  useAddList,
  useAddTicket,
  useLanes,
  useMoveCard,
  useSheetList,
  useSheets,
  useUpdateWorkspaceSheet,
  useVarVisibilty,
  useVariables,
} from "../../queries/useSheets";
import { useRoute } from "vue-router";
import KanbanSkeleton from "../../components/skeletons/KanbanSkeleton.vue";
import BaseTextField from "../../components/ui/BaseTextField.vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../composables/useQueryParams";
import Button from "../../components/ui/Button.vue";
import KanbanTicket from "../../components/feature/kanban/KanbanTicket.vue";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import TableView from "../../components/feature/TableView/TableView.vue";
import { getInitials } from "../../utilities";
import { avatarColor } from "../../utilities/avatarColor";
import DatePicker from "./components/DatePicker.vue";
import MindElixir from "mind-elixir";
import { toast } from "vue-sonner";
import { usePermissions } from "../../composables/usePermissions";
import { request, toApiMessage } from "../../libs/api";
import TableSearchCell from "../../components/feature/TableView/TableSearchCell.vue";
import TableAssigneeCell from "../../components/feature/TableView/TableAssigneeCell.vue";
const {
  canEditSheet,
  canDeleteSheet,
  canCreateVariable,
  canCreateSheet,
  canCreateCard,
  canEditCard,
  canAssignCard,
} = usePermissions();
const showDeleteModal = ref(false);
const ticketToDelete = ref<any>(null);
const showTicketDelete = ref(false);
const selectedDeleteId = ref<string | null>(null);
const cardToEdit = ref<any>(null);
const isEditingTicket = ref(false);
const isDeletingTicket = ref(false);
const view = ref("kanban");
const mindMapRef = ref<HTMLElement | null>(null);
const mindMapInstance = ref<any>(null);
const isCreateVar = ref(false);
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const queryClient = useQueryClient();
const createTeamModal = ref(false);
const selectedCard = ref<any>();
declare global {
  interface Window {
    toggleMenu: (el: HTMLElement) => void;
    handleEdit: (e: Event) => void;
    handleDelete: (e: Event) => void;
    handleStatusChange: (
      e: Event,
      sheetIdx: number,
      listIdx: number,
      cardIdx: number
    ) => void;
  }
}

// delete ticket
const deleteTicket = async () => {

  if (!selectedDeleteId.value) return;

  try {
    isDeletingTicket.value = true;

    await request({
      url: `workspace/card/${selectedDeleteId.value}`,
      method: "DELETE",
    });

    // Optionally remove card locally (for immediate UI feedback)
    removeCardFromState(selectedDeleteId.value);

    // REFRESH all sheets data after delete
    await refetchSheets();

    // Close modal and reset state
    showTicketDelete.value = false;
    ticketToDelete.value = null;

    toast.success("Ticket deleted successfully");
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    isDeletingTicket.value = false;
  }
};

const handleDeleteTicket = async () => {
  await deleteTicket();
};
// Update status
const handleEditTicket = async (card: any, newStatus: string) => {
  if (!card?._id) return;

  cardToEdit.value = card;
  isEditingTicket.value = true;

  try {
    await request({
      url: "/workspace/cards/update",
      method: "PATCH",
      data: {
        card_id: card._id,
        variables: { "card-status": newStatus },
      },
    });

    // Update local state for immediate UI feedback
    card["card-status"] = newStatus;

    toast.success("Ticket status updated successfully");
    await refetchSheets();
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    isEditingTicket.value = false;
    cardToEdit.value = null;
  }
};

interface Card {
  _id: string;
  // other fields
}

interface SheetList {
  cards: Card[];
  // other fields
}

interface Sheet {
  sheet_lists: SheetList[];
  // other fields
}

const removeCardFromState = (cardId: string) => {
  Lists.value?.sheets?.forEach((sheet: Sheet) => {
    sheet.sheet_lists?.forEach((list: SheetList) => {
      list.cards = list.cards.filter((card: Card) => card._id !== cardId);
    });
  });
};

const CreateTaskModal = defineAsyncComponent(
  () => import("./modals/CreateTaskModal.vue")
);
const CreateSheetModal = defineAsyncComponent(
  () => import("./modals/CreateSheetModal.vue")
);
const CreateVariableModal = defineAsyncComponent(
  () => import("./modals/CreateVariableModal.vue")
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("./modals/ConfirmDeleteModal.vue")
);
const SidePanel = defineAsyncComponent(
  () => import("./components/SidePanel.vue")
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue")
);

const {
  data,
  refetch: refetchSheets,
  isPending: isSheetPending,
} = useSheets({
  workspace_id: workspaceId,
  workspace_module_id: moduleId,
});

const sheetId = computed(() => (data.value ? data.value[0]?._id : ""));

const selected_sheet_id = ref<any>(sheetId.value);

const { data: variables, isPending: isVariablesPending } = useVariables(
  workspaceId.value,
  moduleId.value,
  selected_sheet_id
);

const { mutate: addList, isPending: addingList } = useAddList({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    newColumn.value = "";
    showDelete.value = false;
    activeAddList.value = false;
    showDelete.value = false;
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

// Fetch sheets using `useSheets`

watch(sheetId, () => {
  selected_sheet_id.value = sheetId.value;
});

const viewBy = computed(() =>
  variables?.value ? variables?.value[0]?._id : ""
);
const selected_view_by = ref(viewBy.value);
watch(viewBy, () => {
  selected_view_by.value = viewBy.value;
});
const workspaceStore = useWorkspaceStore();

// usage
const { data: Lists, isPending } = useSheetList(
  moduleId,
  selected_sheet_id, // ref
  computed(() => [...workspaceStore.selectedLaneIds]), // clone so identity changes on mutation
  selected_view_by // ref
);

const selectCardHandler = (card: any) => {
  selectedCard.value = card;
};
(window as any).selectCardHandler = selectCardHandler;

const isCreateSheetModal = ref(false);
const createSheet = () => {
  selectedSheettoAction.value = {};
  isCreateSheetModal.value = !isCreateSheetModal.value;
};

const reorderList = ReOrderList();
const reorderCard = ReOrderCard();
function onReorder(a: any) {
  if (a.type === "column") {
    reorderList.mutate(
      {
        payload: {
          workspace_id: workspaceId.value,
          workspace_module_id: moduleId.value,
          variable_id: selected_view_by.value,
          moved_value: a.meta.id,
          new_index: a.meta.newIndex,
        },
      },
      {
        onSuccess: () => {
          refetchSheets();
        },
      }
    );
  } else {
    reorderCard.mutate(
      {
        payload: {
          workspace_id: workspaceId.value,
          card_id: a.meta.moved._id,
          group_value: a.meta.fromColumnId,
          group_variable_id: selected_view_by.value,
          new_index: a.meta.newIndex,
          sheet_id: selected_sheet_id.value,
        },
      },
      {
        onSuccess: () => {
          refetchSheets();
        },
      }
    );
  }
}

const handleBoardUpdate = (_: any) => {};

interface IconData {
  prefix: string;
  iconName: string;
}
interface DropdownOption {
  _id: string;
  title: string;
  icon: IconData;
}
// Define the `transformedData` computed property
const transformedData = computed<DropdownOption[]>(() => {
  return (data.value || []).map((item: any) => ({
    _id: item._id,
    title: item?.variables["sheet-title"],
    description: item?.variables["sheet-description"],
    icon: item["icon"],
    status: item?.generation_status,
  }));
});
watch(data, (newSheetId) => {
  if (newSheetId?.length > 0) {
    selected_sheet_id.value = newSheetId[0]?._id; // Trigger the refetch with the new sheet_id
  }
});
// add column
const activeAddList = ref(false);
const newColumn = ref("");
function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}
function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) return;
  handleAddColumn(t);
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
const showDelete = ref(false);
const localColumnData = ref();
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
const deleteHandler = (e: any) => {
  showDelete.value = true;
  localColumnData.value = e;
};
const plusHandler = (e: any) => {
  createTeamModal.value = true;
  localColumnData.value = e;
};

const selectedSheettoAction = ref<any>();
function handleDeleteSheetModal(opt: any) {
  showDeleteModal.value = true;
  selectedSheettoAction.value = opt;
}
const { mutate: updateSheet, isPending: isDeleting } = useUpdateWorkspaceSheet({
  onSuccess: () => {
    refetchSheets();
    showDeleteModal.value = false;
  },
});
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
  }, 200)
);
// computed filtered board

const fuse = computed(() => {
  const allCards = Lists.value.flatMap((col: any) =>
    col.cards.map((card: any) => ({ ...card, columnId: col.title }))
  );
  return new Fuse(allCards, {
    keys: ["card-title", "card-description"],
    threshold: 0.3,
  });
});

const filteredBoard = computed(() => {
  if (view.value === "kanban") {
    // Kanban filtering by columns
    if (!searchQuery.value) return Lists.value;

    const results = fuse.value
      .search(searchQuery.value)
      .map((r: any) => r.item);
    return Lists.value.map((col: any) => ({
      ...col,
      cards: results.filter((c: any) => c.columnId === col.title),
    }));
  } else {
    // Table filtering by flat tickets
    const query = searchQuery.value?.trim();
    if (!query) {
      let array: any = [];
      (Lists.value ?? []).forEach((col: any) => {
        array = [...array, ...col?.cards];
      });
      return array;
    }

    const fuseTable = new Fuse(normalizedTableData.value, {
      keys: ["card-title", "card-description"], // include keys you want searchable
      threshold: 0.3,
    });
    return fuseTable.search(query).map((r) => r.item);
  }
});

const { data: lanes } = useLanes(workspaceId);

// import ticket from '../../assets/icons/ticket.svg'
const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  }))
);
// const { data: statusData } = useProductVarsData(workspaceId, moduleId, 'card-status')
// const { data: typeData } = useProductVarsData(workspaceId, moduleId, 'card-type')

const columns = computed(() => {
  return [
     {
    key: "card-title",
    label: "Title",
    render: ({ row, value }: any) =>
      h("div", { class: "flex items-center gap-1 w-full" }, [
        h(
          "a",
          {
            onClick: () => (selectedCard.value = row),
            class:
              "text-[12px] underline text-blue-500 shrink-0 overflow-ellipsis cursor-pointer",
          },
          row["card-code"]
        ),
        h("div", { class: "flex-1 min-w-0" }, [
           h("input", {
            onFocusout: (e: any) => {
              handleChangeTicket(row?._id, "card-title", e?.target?.value);
            },
            class:
              "text-[12px] w-full overflow-ellipsis capitalize p-1 w-full p-1 focus:border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-transparent focus:bg-bg-body text-[12px] h-8",
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
          class: " capitalize flex items-center gap-2 text-[12px]",
          placeholder: "Set start date", 
          tableInputClass: true,
          modelValue: date.value,
          disabled: !canEditCard.value,
          "onUpdate:modelValue": (e: any) => setStartDate(row?._id, e),
           emptyText: "Date"
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
            modelValue: row.lane?._id || null, // Pass ID
            disabled: !canEditCard.value,
            'onUpdate:modelValue': (e: any) => setLane(row?._id, e),
            displayField: 'title',
            emptyText: "Lane"
        }),
    },
    {
      key: "created_by",
      label: "Owner",
      render: ({ value }: any) =>
        h("div", { class: "capitalize flex items-center gap-2  px-3" }, [
          h("div", { class: ` rounded-full  ` }, [
            value?.u_profile_image
              ? h("img", {
                  class: "w-6 h-6 rounded-full",
                  src: value?.u_profile_image,
                })
              : h(
                  "div",
                  {
                    class:
                      "w-5 h-5 rounded-full flex justify-center items-center text-[11px] ",
                    style: `background:${
                      value?.u_full_name
                        ? avatarColor({
                            name: value.u_full_name,
                            email: value.u_email,
                          })
                        : ""
                    }`,
                  },
                  getInitials(value?.u_full_name)
                ),
          ]),
          h("span",
          {
            class: "text-[12px]", // your class here
          },  
          value ? value?.u_full_name : ""),
        ]),
    },
    {
      key: "seat",
      label: "Assignee",
      render: ({ row, value }: any) =>
        h(TableAssigneeCell, {
          class: "capitalize flex items-center gap-2 ",
          onAssign: (user: any) => assignHandle(row?._id, user),
          assigneeId: value,
          seat: value,
          name: true,
          disabled: !canAssignCard.value,
          emptyText: "Assignee"
        }),
    },

    ...(variables.value
      ?.filter((e: any) => e?.type?.title === "Select")
      .map((e: any) => ({
        key: e?.slug,
        label: e?.slug,
        render: ({ row, value }: any) => {
          // Dynamic variables are in an array: [{ slug: 'priority', value: 'High' }]
          let cellValue = value;
          if (Array.isArray(row?.variables)) {
             const found = row.variables.find((v: any) => v.slug === e.slug);
             if (found) cellValue = found.value;
          } else {
             // Fallback for object map or top-level
             cellValue = row?.variables?.[e.slug] ?? row?.[e.slug] ?? value;
          }
          
          return h("div", { class: "capitalize flex items-center gap-2" }, [
            h(TableSearchCell, {
              options: getOptions(e.data ?? []),
              modelValue: cellValue,
              disabled: !canEditCard.value,
              emptyText: e.slug, // Add placeholder
              'onUpdate:modelValue': (val: any) => {
                handleChangeTicket(row?._id, e.slug, val);
              },
              columnName: e.slug,
            }),
          ]);
        },
        visible: e?.is_visible,
      })) ?? []),
  ];
});
const assignHandle = (cardId: any, user: any) => {
updateOptimisticCard(cardId, (card) => {
      card.seat = user;
  });
  moveCard.mutate({ card_id: cardId, seat_id: user?._id });
};

const normalizedTableData = computed(() => {
  let array: any = [];
  (Lists.value ?? []).forEach((col: any) => {
    array = [...array, ...col?.cards];
  });
  return array;
});

const getOptions = (options: any) => {

  return options.map((el: any) => ({
    _id: el.value ?? el,
    title: el.value ?? el,
  }));
};
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['get-sheets'] })
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  },
});
const updateOptimisticCard = (cardId: string, updater: (card: any) => void) => {
  // Fallback to local mutation as setQueriesData might miss the exact key or not trigger the view update
  if (!Lists.value) return;
  
  const listIndex = Lists.value.findIndex((l: any) =>
    l.cards.some((c: any) => c._id === cardId)
  );

  if (listIndex !== -1) {
    const cardIndex = Lists.value[listIndex].cards.findIndex(
      (c: any) => c._id === cardId
    );
    if (cardIndex !== -1) {
       // Create a shallow copy of the card to trigger reactivity (immutable update)
       const newCard = { ...Lists.value[listIndex].cards[cardIndex] };
       
       // Run the updater on the copy
       updater(newCard);
       
       // Replace the card in the list
       Lists.value[listIndex].cards[cardIndex] = newCard;
       
       // trigger Vue to detect changes
       triggerRef(Lists);
    }
  }
};
const { mutate: addTicket } = useAddTicket({
  onSuccess: () => {
    // queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
  },
});
function handleChangeTicket(id: any, key: any, value: any) {
  updateOptimisticCard(id, (card) => {
      // Always update top-level property if it matches certain keys like 'card-title'
      if (key === 'card-title') {
          card[key] = value;
      }

      // Check if variables is an array (per user data)
      if (Array.isArray(card.variables)) {
          const variable = card.variables.find((v: any) => v.slug === key);
          if (variable) {
              variable.value = value;
          } else {
              // Add new variable if not found (assuming Type Select/Text defaults)
              card.variables.push({ slug: key, value: value, type: 'Select' });
          }
      } else if (card.variables && typeof card.variables === 'object') {
          // Fallback for object structure if mixed
          card.variables[key] = value;
      } else {
          // Fallback for top-level props
          card[key] = value;
      }
  });

  moveCard.mutate({ card_id: id, variables: { [key]: value.trim() } });
}
function handleCreateTicket(title: any) {
  if (title["card-title"]) {
    const payload = {
      sheet_list_id: "To Do",
      workspace_id: workspaceId.value,
      sheet_id: selected_sheet_id.value,
      // workspace_lane_id: form.lane_id,
      variables: {
        ["card-title"]: title["card-title"].trim(),
      },
      createdAt: new Date().toISOString(),
    };

    addTicket(payload);
  }
}
const setStartDate = (card_id: any, e: any) => {
  // Optimistic Update
  const listIndex = Lists.value.findIndex((l: any) =>
    l.cards.some((c: any) => c._id === card_id)
  );
  if (listIndex !== -1) {
    const cardIndex = Lists.value[listIndex].cards.findIndex(
      (c: any) => c._id === card_id
    );
    if (cardIndex !== -1) {
      Lists.value[listIndex].cards[cardIndex]["end-date"] = e;
    }
  }
  moveCard.mutate({ card_id: card_id, variables: { "start-date": e } });
};
function setLane(id: any, v: any) {
  updateOptimisticCard(id, (card) => {
      const newLane = laneOptions.value.find((l: any) => l._id === v);
       if (newLane) { 
            card.lane = newLane; 
       }
  });
  // Trigger Vue to detect the nested change
  triggerRef(Lists);

  moveCard.mutate({ card_id: id, workspace_lane_id: v });
}
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
const sheetDescription = ref<string>("");
// mindmap
function buildMindMapDataAllSheets(sheetsData: any[]) {
  if (!Array.isArray(sheetsData)) {
    return {
      id: "root",
      topic: localStorage.getItem("currentName") || "Root Node",
      isRoot: true,
      children: [],
    };
  }

  const STATUS_COLORS: Record<string, string> = {
    "In Progress": "#FFB979",
    "To Do": "#A9EAFF",
    Done: "#9AFFC6",
  };

  const root = {
    id: "root",
    topic: localStorage.getItem("currentName") || "Root Node",
    isRoot: true,
    children: [] as any[],
  };

const variableMap: Record<string, any> = {};
   
  sheetsData.forEach((sheet, sheetIdx) => {
    const sheetTitle: string = sheet.variables?.["sheet-title"] || "Untitled";
    const description: string = sheet.variables?.["sheet-description"] || "Untitled";
    sheetDescription.value = description;
    if (!variableMap[sheetTitle]) {
      variableMap[sheetTitle] = {
        id: `variable-${sheet._id || sheetIdx}`,
        topic: sheetTitle,
        children: [] as any[],
      };
      root.children.push(variableMap[sheetTitle]);
    }

    const variableNode = variableMap[sheetTitle];

    // Sheet list node
    const sheetListNode = {
      id: `sheetlist-${sheetIdx}`,
      topic: sheet.title || `Untitled Sheet List ${sheetIdx + 1}`,
      children: [] as any[],
    };
    
    const listIdx = variableNode.children.length;

    const cards: any[] = Array.isArray(sheet.cards) ? sheet.cards : [];

    cards.forEach((card, cardIdx) => {
      const seat = card.seat;
      const getInitials = (name: string | null | undefined) => {
        if (!name) return "UN";
        return name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      };
      const allSheetTitles: string[] = sheetsData.map(sheet => sheet.title || "Untitled");
      const initials = getInitials(seat?.status);
      const assigned = seat?.status === "assigned";
      const statusTitle: string = sheet.title || "Untitled";
      const statusBg: string = STATUS_COLORS[statusTitle] || "#D3D3D3";
      const truncatedTitle: string = (card["card-title"] || "Untitled").slice(0, 25);

      const cardHtml = `
          <div class="card-content" style="
            width: 350px;
            height: 110px;
            background: #AFF4EF;
            padding: 5px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: DM Sans, sans-serif;
            margin: 0;
            pointer-events:auto;
          ">
            <div style="display:flex; justify-content:space-between;">
              <div style="
                width:auto;
                height:40px;
                display:flex;
                color:#2B2C30;
                align-items:center;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-weight:500;
                font-size:14px;
                padding-left:10px;
              ">
                ${truncatedTitle}...
              </div>

              <select class="status-select" style="
                background:${statusBg};
                pointer-events:auto;
                color:#2B2C30;
                border:none;
                border-radius:20px;
                font-size:11px;
                font-weight:500;
                height:30px;
                display:flex;
                justify-content:center;
                align-items:center;
                padding:5px 12px;
                margin-top:7px;
                cursor:pointer;
              " onclick="event.stopPropagation(); event.stopImmediatePropagation();"
                  onmousedown="event.stopPropagation(); event.stopImmediatePropagation();"
                  onchange="handleStatusChange(event, ${sheetIdx}, ${listIdx}, ${cardIdx})" >
                ${allSheetTitles
                  .map(
                    (status) =>
                      `<option value="${status}" ${
                        status === statusTitle ? "selected" : ""
                      } style="pointer-events:auto;">${status}</option>`
                  )
                  .join("")}
              </select>

              <div style="position:relative; margin-right:10px; margin-top:-35px; height:20px; width:20px; pointer-events:auto;">
                <svg 
                  width="20" height="20" viewBox="0 0 20 20" fill="none" 
                  class="menu-wrapper" 
                  style="cursor:pointer; pointer-events:auto;"
                  onclick="event.stopPropagation(); event.stopImmediatePropagation(); toggleMenu(this);"
                  onmousedown="event.stopPropagation(); event.stopImmediatePropagation();"
                  onpointerdown="event.stopPropagation(); event.stopImmediatePropagation();" 
                  data-cardid="card-${sheetIdx}-${listIdx}-${cardIdx}"
                >
                  <circle cx="5.23717" cy="9.99986" r="1.42857" fill="#2B2C30" fill-opacity="0.8"></circle>
                  <circle cx="10.0008" cy="9.99986" r="1.42857" fill="#2B2C30" fill-opacity="0.8"></circle>
                  <circle cx="14.7626" cy="9.99986" r="1.42857" fill="#2B2C30" fill-opacity="0.8"></circle>
                </svg>

                <ul class="menu-dropdown" style="
                  display:none; 
                  pointer-events:auto; 
                  position:absolute; 
                  top:70px; 
                  right:0; 
                  background:white; 
                  border-radius:6px; 
                  list-style:none; 
                  padding-top: -10px;
                  width:100px; 
                  height: 70px; 
                  gap: 20px;
                  font-size:13px; 
                  z-index:9999; 
                  overflow: hidden;"
                  onclick="event.stopPropagation(); event.stopImmediatePropagation();"
                  onmousedown="event.stopPropagation(); event.stopImmediatePropagation();"
                >
                  <li style="margin-top:-30px; padding-left:5px; padding-right:5px; cursor:pointer; color:#2B2C30; border-bottom: 1px solid #333;" onclick="handleEdit(event)">Edit Ticket</li>
                  <li style="margin-top:-35px; padding-left:5px; padding-right:5px; cursor:pointer; color:#2B2C30;" onclick="handleDelete(event)">Delete Ticket</li>
                </ul>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:20px; width:320px; height:100px; overflow:hidden;">
              <div style="height:30px; margin-left: 10px; width:100px; font-size:12px; display:flex; justify-content: center; overflow:hidden;">
                <div style="margin-top:-27px !important;">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="20" height="20" rx="3.33333" fill="#29BF7F"/>
                    <path d="M6.43164 14.3018L9.29004 12.167L9.29102 12.166C9.47176 12.0328 9.69053 11.9609 9.91504 11.9609C10.0834 11.9609 10.2482 12.0017 10.3965 12.0781L10.5391 12.166L10.54 12.167L13.373 14.291V5.91699H6.43164V14.3018ZM14.4316 14.3789C14.4277 14.5672 14.3725 14.7506 14.2725 14.9102C14.1723 15.0699 14.0303 15.1996 13.8623 15.2852C13.6944 15.3706 13.5064 15.4094 13.3184 15.3965C13.1304 15.3835 12.9495 15.3196 12.7949 15.2119L12.79 15.208L9.91504 13.0518L7.01465 15.209C6.83427 15.3432 6.61546 15.4161 6.39062 15.417H6.38965C6.2298 15.4164 6.07171 15.38 5.92773 15.3105V15.3096C5.75087 15.2261 5.60123 15.0946 5.49609 14.9297C5.3907 14.7642 5.33364 14.5721 5.33301 14.376V5.87402C5.3338 5.7361 5.36234 5.59971 5.41602 5.47266C5.46971 5.3456 5.54812 5.23049 5.64648 5.13379C5.74485 5.0371 5.86131 4.96069 5.98926 4.90918C6.1165 4.85797 6.2525 4.83272 6.38965 4.83398V4.83301H13.3906C13.6661 4.83457 13.9302 4.94494 14.125 5.13965C14.3198 5.33446 14.4301 5.59852 14.4316 5.87402V14.3789Z" fill="white" stroke="white" stroke-width="0.333333"/>
                  </svg>
                </div>
                <div style="color:#2B2C30B2; margin-top: -35px; margin-left: -35px; height: 30px; font-size:14px; border: 2px solid red;">
                  <p>${card["card-code"] }</p>
                </div>
              </div>

              <div style="
                height:26px;
                width:26px;
                padding:5px;
                color:white;
                border:1px solid white;
                display:flex;
                justify-content:center;
                border-radius:50%;
                align-items:center;
                margin-top:5px;
                pointer-events:none;
                background:${assigned ? "#4ADE80" : "#9CA3AF"};
              " onclick="event.stopPropagation();">
                <span style="font-size:13px;">${initials}</span>
              </div>
            </div>
          </div>
                `;

      const isLastCard = cardIdx === cards.length - 1;

      sheetListNode.children.push({
        id: `card-${sheetIdx}-${cardIdx}`,
        dangerouslySetInnerHTML: `<div disabled id="card-inner-${sheetIdx}-${cardIdx}" style="pointer-events:auto; height: 110px; width: 0px;">${cardHtml}</div>`,
        expanded: false,
        isLastCard,
        selectable: false,
      });
    });

    variableNode.children.push(sheetListNode);
  });

  return root;
}

const onWheelZoom = (e: WheelEvent) => {
  if (!e.shiftKey) return; // use Shift instead of Ctrl
  e.preventDefault();
  e.stopPropagation();

  const zoomIn = e.deltaY < 0;
  if (zoomIn) mindMapInstance.value?.execCommand?.("zoomIn");
  else mindMapInstance.value?.execCommand?.("zoomOut");
};

onMounted(() => {
  nextTick(() => {
    const container = mindMapRef.value;
    if (!container) return;
    container.addEventListener("wheel", onWheelZoom, { passive: false });
  });
});


watchEffect(() => {
  if (
    view.value === "mindmap" &&
    mindMapRef.value &&
    Lists.value
  ) {
    nextTick(() => {
      const rootNode = buildMindMapDataAllSheets(Lists.value);
       
      if (mindMapInstance.value) {
        mindMapInstance.value.destroy?.();
        mindMapInstance.value = null;
      }

      const hideMenu = () => {
        const menu = document.querySelector(
          ".mind-elixir .context-menu"
        ) as HTMLElement | null;
        if (!menu) return;

        menu.style.display = "";
        menu.style.visibility = "";
        menu.style.opacity = "";
        menu.style.pointerEvents = "";

        menu.classList.remove("show", "visible", "open");

        menu.hidden = true;

        requestAnimationFrame(() => {
          if (menu) menu.hidden = true;
        });
      };

      const instance = new MindElixir({
        el: mindMapRef.value as HTMLElement,
        direction: MindElixir.RIGHT,
        draggable: true,
        contextMenu: true,

        contextMenuOption: {
          link: false,
          focus: true,
          addChild: false,
          addParent: false,
          summary: false,

          extend: [
            {
              id: "cm-addVariable",
              name: "Add Variable",
              onclick: () => {
                const node = mindMapInstance.value?.currentNode?.nodeObj;
                if (!node) return;

                if (node.isRoot) {
                  createSheet();
                } else {
                  toast.error("Add Variable is only allowed on the root node.");
                }
                hideMenu();
              },
            },
            {
              id: "cm-addList",
              name: "Add List",
              onclick: () => {
                const node = mindMapInstance.value?.currentNode?.nodeObj;
                if (!node) return;

                if (node.id?.startsWith("variable")) {
                  setActiveAddList();
                } else {
                  toast.error("Add List is only allowed on variable nodes.");
                }
                hideMenu();
              },
            },
            {
              id: "cm-deleteList",
              name: "Delete List",
              onclick: () => {
                const node = mindMapInstance.value?.currentNode?.nodeObj;
                if (!node) return;

                if (node.id?.startsWith("sheetlist")) {
                  const [_, sheetIdx] = node.id.split("-").map(Number);
                  const sheet = Lists.value?.sheets?.[sheetIdx];
                  const variableNode = sheet?.variables;

                  localColumnData.value = {
                    ...variableNode,
                    title: node.topic,
                  };

                  showDelete.value = true;
                } else {
                  toast.error("Delete List is only allowed on variable nodes.");
                }

                hideMenu();
              },
            },
            {
              id: "cm-addTask",
              name: "Add Task",
              onclick: () => {
                const node = mindMapInstance.value?.currentNode?.nodeObj;
                if (!node) return;

                if (node.id?.startsWith("sheetlist")) {
                  createTeamModal.value = true;
                } else {
                  toast.error("Add Task is only allowed on sheet list nodes.");
                }
                hideMenu();
              },
            },
          ],
        },
      });

      mindMapInstance.value = instance;
      instance.init({ nodeData: rootNode });
      mindMapRef.value?.addEventListener("contextmenu", () => {
        setTimeout(() => {
          const node = mindMapInstance.value?.currentNode?.nodeObj;
          if (!node) return;

          // Get all menu items as HTMLElements
          const menuItems = Array.from(
            document.querySelectorAll(".mind-elixir .context-menu li")
          ) as HTMLElement[];

          menuItems.forEach((li) => {
            const id = li.id;

            if (node.isRoot) {
              li.style.display = id === "Add Variable" ? "" : "none";
            } else if (node.id?.startsWith("variable")) {
              li.style.display = id === "Add List" ? "" : "none";
            } else if (node.id?.startsWith("sheetlist")) {
              li.style.display =
                id === "Add Task" || id === "Delete List" ? "" : "none";
            } else if (node.id?.startsWith("card")) {
              li.style.display = "none";
            }
          });
        }, 10);
      });
      // Make sure this runs after MindElixir instance is initialized
nextTick(() => {
  const tooltipId = "sheet-description-tooltip";
  let tooltip = document.getElementById(tooltipId) as HTMLDivElement;

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = tooltipId;
    tooltip.style.position = "absolute";
    tooltip.style.background = "#fff";
    tooltip.style.color = "#2B2C30";
    tooltip.style.padding = "8px 12px";
    tooltip.style.border = "1px solid #ccc";
    tooltip.style.borderRadius = "6px";
    tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    tooltip.style.fontSize = "12px";
    tooltip.style.display = "none";
    tooltip.style.zIndex = "9999";
    document.body.appendChild(tooltip);
  }

  const mindMapEl = mindMapRef.value as HTMLElement;
  if (!mindMapEl) return;

  mindMapEl.addEventListener("mouseover", (e) => {
    const node = mindMapInstance.value?.currentNode?.nodeObj;
    if (!node || !node.id?.startsWith("variable")) return;

    tooltip.innerText = sheetDescription.value || "No description available";
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
    tooltip.style.display = "block";
  });

  mindMapEl.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
  });
});

nextTick(() => {
  const tooltipId = "list-description-tooltip";
  let tooltip = document.getElementById(tooltipId) as HTMLDivElement;

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = tooltipId;
    tooltip.style.position = "absolute";
    tooltip.style.background = "#fff";
    tooltip.style.color = "#2B2C30";
    tooltip.style.padding = "8px 12px";
    tooltip.style.border = "1px solid #ccc";
    tooltip.style.borderRadius = "6px";
    tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    tooltip.style.fontSize = "12px";
    tooltip.style.display = "none";
    tooltip.style.zIndex = "9999";
    document.body.appendChild(tooltip);
  }

  const mindMapEl = mindMapRef.value as HTMLElement;
  if (!mindMapEl) return;

  mindMapEl.addEventListener("mouseover", (e) => {
    const node = mindMapInstance.value?.currentNode?.nodeObj;
    if (!node || !node.id?.startsWith("sheetlist")) return;

    tooltip.innerText = "These are the lists, each list have their own tickets";
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
    tooltip.style.display = "block";
  });

  mindMapEl.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
  });
});
    });
  }
});
window.toggleMenu = function (el: HTMLElement) {
  const menu = el.nextElementSibling as HTMLElement;
  if (!menu) return;

  const isOpen = menu.style.display === "block";
  menu.style.display = isOpen ? "none" : "block";
  const handleClickOutside = (event: MouseEvent) => {
    if (!(event.target as HTMLElement).closest(".menu-wrapper")) {
      document.querySelectorAll(".menu-dropdown").forEach((m) => {
        (m as HTMLElement).style.display = "none";
      });
      document.removeEventListener("click", handleClickOutside);
    }
  };
  document.addEventListener("click", handleClickOutside);
};

window.handleEdit = function (e: Event) {
  e.stopPropagation();
  e.stopImmediatePropagation();

  const target = e.target as HTMLElement;
  const menu = target.closest(".menu-dropdown") as HTMLElement | null;
  if (!menu) return;
  const container = menu.parentElement;
  const wrapper = container?.querySelector(".menu-wrapper") as HTMLElement | null;
  if (!wrapper) return;

  const cardId = wrapper.getAttribute("data-cardid");
  if (!cardId) return;

  const [, sheetIdx, , cardIdx] = cardId.split("-").map(Number);

  const sheet = Lists.value?.[sheetIdx];
  if (!sheet || !Array.isArray(sheet.cards)) return;

  const card = sheet.cards[cardIdx];
  if (!card) return;
(window as any).selectCardHandler(card);
 
  document.querySelectorAll(".menu-dropdown").forEach((m) => {
    (m as HTMLElement).style.display = "none";
  });
};


window.handleDelete = function (e: Event) {
  e.stopPropagation();
  e.stopImmediatePropagation();

   const target = e.target as HTMLElement;
  const menu = target.closest(".menu-dropdown") as HTMLElement | null;
  if (!menu) return;
  const container = menu.parentElement;
  const wrapper = container?.querySelector(".menu-wrapper") as HTMLElement | null;
  if (!wrapper) return;

  const cardId = wrapper.getAttribute("data-cardid");
  if (!cardId) return;

  const [, sheetIdx, , cardIdx] = cardId.split("-").map(Number);

  const sheet = Lists.value?.[sheetIdx];
  if (!sheet || !Array.isArray(sheet.cards)) return;

  const card = sheet.cards[cardIdx];
  if (!card) return;

  ticketToDelete.value = card;
  selectedDeleteId.value = card._id;
  showTicketDelete.value = true;

  document.querySelectorAll(".menu-dropdown").forEach((m) => {
    (m as HTMLElement).style.display = "none";
  });
};



window.handleStatusChange = function (
  e: Event,
  sheetIdx: number,
  _listIdx: number, // intentionally unused
  cardIdx: number
) {

  const sheet = Lists.value?.[sheetIdx];
  if (!sheet || !Array.isArray(sheet.cards)) return;

  const card = sheet.cards[cardIdx];
  if (!card) return;

  const newStatus = (e.target as HTMLSelectElement).value;

  handleEditTicket(card, newStatus);
};

</script>
<style scoped>
@import "https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css";
/* Force visible scrollbars only where applied */
.scrollbar-visible::-webkit-scrollbar {
  display: block !important;
  height: 8px;
  /* horizontal scrollbar height */
  width: 8px;
  /* vertical scrollbar width */
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 8px;
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background-color: rgba(150, 150, 150, 0.6);
}

.scrollbar-visible {
  scrollbar-width: thin !important;
  /* Firefox */
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}

/* Hide default context menu items in MindElixir */
::v-deep(.mind-elixir .context-menu #cm-down) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-add_child) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-fucus) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-fucus) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-unfucus) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-add_parent) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-add_sibling) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-up) {
  display: none !important;
}
::v-deep(.mind-elixir .context-menu #cm-down) {
  display: none !important;
}
</style>