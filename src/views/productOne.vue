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
          v-model="selected_view_by"
          :options="variables"
          variant="secondary"
           customClasses="fixed w-auto"
           @nested-select="handleProcessNestedSelection"
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
        class="flex overflow-x-auto gap-3 p-4 scrollbar-visible h-full"
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
      <div class="relative w-full h-[100%] flex">
        <!-- Mind Map Canvas -->
        <div
          ref="mindMapRef"
          class="flex-1 h-[100%] overflow-y-hidden rounded-md relative"
        ></div>
        <!-- Formatting Sidebar -->
        <div v-if="showFormatSidebar" class="format-sidebar py-4">
          <div class="format-header">
            <h3 class="format-title">Format Node</h3>
            <button @click="showFormatSidebar = false" class="close-btn">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="format-content">
            <!-- Background -->

            <div class="format-group">
              <label>Background Color</label>
              <input
                type="color"
                :value="selectedMindNode?.style?.background"
                @input="onStyleChange('bg_color', $event)"
              />
            </div>

            <!-- Text Color -->
            <div class="format-group">
              <label>Text Color</label>
              <input
                type="color"
                :value="selectedMindNode?.style?.color"
                @input="onStyleChange('color', $event)"
              />
            </div>

            <!-- Font Size -->
            <div class="format-group">
              <label>Font Size</label>
              <input
                type="number"
                min="8"
                max="60"
                :value="selectedMindNode?.style?.fontSize"
                @input="onStyleChange('font_size', $event)"
              />
            </div>

            <!-- Font Weight -->
            <div class="format-group">
              <label>Font Weight</label>
              <select
                :value="selectedMindNode?.style?.fontWeight"
                @change="onStyleChange('font_weight', $event)"
              >
                <option value="lighter">Light</option>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="bolder">Extra Bold</option>
              </select>
            </div>

            <!-- Font Style -->
            <div class="format-group">
              <label>Font Style</label>
              <select
                :value="selectedMindNode?.style?.fontStyle"
                @change="onStyleChange('font_style', $event)"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
                <option value="oblique">Oblique</option>
              </select>
            </div>

            <!-- Font Family -->
            <div class="format-group">
              <label>Font Family</label>
              <select
                :value="selectedMindNode?.style?.fontFamily"
                @change="onStyleChange('font_family', $event)"
              >
                <!-- System -->
                <option value="Inter">Inter (Default)</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>

                <!-- Serif -->
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Garamond">Garamond</option>

                <!-- Monospace -->
                <option value="Courier New">Courier New</option>
                <option value="Consolas">Consolas</option>
                <option value="Monaco">Monaco</option>

                <!-- Modern -->
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>

            <!-- Border Color -->
            <div class="format-group">
              <label>Border Color</label>
              <input
                type="color"
                :value="selectedMindNode?.style?.borderColor"
                @input="onStyleChange('border_color', $event)"
              />
            </div>

            <!-- Border Width -->
            <div class="format-group">
              <label>Border Width</label>
              {{ selectedMindNode?.style?.borderWidth }}
              <input
                type="number"
                min="0"
                max="10"
                :value="selectedMindNode?.style?.borderWidth"
                @input="onStyleChange('border_width', $event)"
              />
            </div>

            <!-- Border Radius -->
            <div class="format-group">
              <label>Border Radius</label>
              <input
                type="number"
                min="0"
                max="50"
                :value="selectedMindNode?.style?.borderRadius"
                @input="onStyleChange('border-radius', $event)"
              />
            </div>
            <!-- Padding -->
            <div class="format-group">
              <label>Padding</label>
              <input
                type="text"
                :value="selectedMindNode?.style?.padding"
                @input="onStyleChange('padding', $event)"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="format-footer overflow-hidden mx-auto">
            <button
              class="bg-gradient-to-tr from-accent to-accent-hover mx-3 cursor-pointer overflow-hidden text-white flex items-center gap-2 text-center px-8 py-2 rounded-[6px] text-normal font-medium transition-all hover:shadow-lg hover:shadow-accent/20"
              @click="saveNodeStyle"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      <!-- EXISTING POPUP (UNCHANGED) -->
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
  defineAsyncComponent,
  h,
  ref,
  watch,
  toRaw,
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
  useCreateWorkspaceSheet
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

  // function for nested process selection
const selectedProcessMeta = ref<any>(null);
const handleProcessNestedSelection = (val: any) => {  
  selectedProcessMeta.value = val; 
};
const selectedMindNode = ref<any>(null);
const showFormatSidebar = ref(false);
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
// reactively checking selected view by value
const selectedViewByVariable = computed(() => {
  return variables.value?.find(
    (v: any) => v._id === selected_view_by.value
  );
});
//add column
const handleAddColumn = (v: any) => {
  const payload: any = {
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    variable_id: selected_view_by.value,
    value: v,
    ...listProcessPayload.value,
  }; 

  // if (
  //   selectedViewByVariable.value?.title === "Process" &&
  //   selectedProcessMeta.value
  // ) {
  //   payload.type_value = selectedProcessMeta.value?.title;
  // }

  addList(payload);
};

const listProcessPayload = computed(() => {
  if (
    selectedViewByVariable.value?.title === "Process" &&
    selectedProcessMeta.value
  ) {
    return {
      type_value: selectedProcessMeta.value.title, // optional
    };
  }

  return {};
});

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
const { data: Lists, isPending, refetch: refetchSheetLists } = useSheetList(
  moduleId,
  selected_sheet_id, // ref
  computed(() => [...workspaceStore.selectedLaneIds]), // clone so identity changes on mutation
  selected_view_by, // ref
  listProcessPayload
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
          refetchSheetLists();
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
          refetchSheetLists();
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
        h("div", { class: "capitalize flex items-center gap-2 px-3 w-full truncate" }, [
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
            class: "text-[12px] truncate", // your class here
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
function resolveStyle<T>(
  uiValue: T | undefined,
  originalValue: T | undefined,
  defaultValue: T
): T {
  return uiValue !== undefined
    ? uiValue
    : originalValue !== undefined
    ? originalValue
    : defaultValue;
}

function onStyleChange(prop: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = target.type === "number" ? Number(target.value) : target.value;

  const node = selectedMindNode.value.nodeObj;
  if (!node.style) node.style = {};

  switch (prop) {
    case "bg_color":
      node.style.background = value;
      break;

    case "color":
      node.style.color = value;
      break;

    case "font_size":
      node.style.fontSize = `${value}px`;
      break;

    case "font_weight":
      node.style.fontWeight = value;
      break;

    case "font_style":
      node.style.fontStyle = value;
      break;

    case "font_family":
      node.style.fontFamily = value;
      break;

    case "border_color":
      node.style.borderColor = value;
      break;

    case "border_width":
      node.style.borderWidth = `${value}px`;
      break;

    case "border_radius":
      node.style.borderRadius = `${value}px`;
      break;

    case "padding":
      node.style.padding = `${value}px`;
      break;
  }

  const nodeElement = document.getElementById(node.id);
  if (nodeElement) applyNodeStyle(node, nodeElement);
}
const DEFAULT_BACKEND_STYLE = {
  bg_color: "#ffffff",
  color: "#000000",
  font_size: 14,
  font_weight: "normal",
  font_style: "normal",
  font_family: "Inter",
  border_color: "#cccccc",
  border_width: 0,
  border_radius: 0,
  padding: 0,
};
function saveNodeStyle() {
  const node = selectedMindNode.value.nodeObj;
  if (!node) return;

  const plainNode = toRaw(node);

  if (!plainNode._originalStyle) {
    plainNode._originalStyle = {};
  }

  const style = plainNode.style || {};
  const original = plainNode._originalStyle;

  const mergedStylePayload = {
    bg_color: resolveStyle(
      style.background,
      original.bg_color,
      DEFAULT_BACKEND_STYLE.bg_color
    ),

    color: resolveStyle(
      style.color,
      original.color,
      DEFAULT_BACKEND_STYLE.color
    ),

    font_size: resolveStyle(
      style.fontSize ? parseInt(style.fontSize) : undefined,
      original.font_size,
      DEFAULT_BACKEND_STYLE.font_size
    ),

    font_weight: resolveStyle(
      style.fontWeight,
      original.font_weight,
      DEFAULT_BACKEND_STYLE.font_weight
    ),

    font_style: resolveStyle(
      style.fontStyle,
      original.font_style,
      DEFAULT_BACKEND_STYLE.font_style
    ),

    font_family: resolveStyle(
      style.fontFamily,
      original.font_family,
      DEFAULT_BACKEND_STYLE.font_family
    ),

    border_color: resolveStyle(
      style.borderColor,
      original.border_color,
      DEFAULT_BACKEND_STYLE.border_color
    ),

    border_width: resolveStyle(
      style.borderWidth ? parseInt(style.borderWidth) : undefined,
      original.border_width,
      DEFAULT_BACKEND_STYLE.border_width
    ),

    border_radius: resolveStyle(
      style.borderRadius ? parseInt(style.borderRadius) : undefined,
      original.border_radius,
      DEFAULT_BACKEND_STYLE.border_radius
    ),
    padding: resolveStyle(
      style.padding ? parseInt(style.padding) : undefined,
      original.padding,
      DEFAULT_BACKEND_STYLE.padding
    ),
  };
  plainNode._originalStyle = { ...mergedStylePayload };

  const payload =
    plainNode.unique_name === "sheet"
      ? {
          sheet_id: plainNode.id,
          workspace_id: workspaceId.value,
          workspace_module_id: moduleId.value,
          style: mergedStylePayload,
        }
      : {
          card_id: plainNode.id,
          seat_id: plainNode.seat_id,
          style: mergedStylePayload,
        };

  plainNode.unique_name === "sheet"
    ? updateSheet(payload)
    : moveCard.mutate(payload);

  showFormatSidebar.value = false;
}

interface MindNodeStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
}

interface MindNode {
  id: string;
  seat_id?: string;
  topic: string;
  style: MindNodeStyle;
  _originalStyle: MindNodeStyle;
  children: MindNode[];
  parent?: MindNode;
  isRoot?: boolean;
  unique_name?: string;
  variables?: any;
}
const cardData = ref([] as any);
// mindmap
function buildMindMapDataAllSheets(sheetsData: any[]): MindNode {
  const root: MindNode = {
    id: "root",
    topic: localStorage.getItem("currentName") ?? "",
    isRoot: true,
    children: [],
    style: {},
    _originalStyle: {},
    unique_name: "root",
  };

  if (!Array.isArray(sheetsData)) return root;

  const variables: Record<string, MindNode> = {};

  sheetsData.forEach((sheet) => {
    const title = sheet.variables?.["sheet-title"] || "Untitled";

    if (!variables[title]) {
      variables[title] = {
        id: sheet._id,
        topic: title,
        variables: sheet?.variables,
        children: [],
        style: sheet?.style,
        _originalStyle: sheet?.style || {},
        unique_name: "sheet",
      };
      root.children.push(variables[title]);
    }

    const listNode: MindNode = {
      id: sheet?._id,
      topic: sheet.title,
      children: [],
      style: mapBackendStyleToMindElixir(sheet?.style),
      _originalStyle: sheet.style || {},
      unique_name: "List",
    };

    (sheet.cards || []).forEach((card: any, cardIdx: number) => {
      const cardNode: MindNode = {
        id: card._id || `card-${cardIdx}`,
        seat_id: card.seat_id,
        topic: card["card-title"],
        style: mapBackendStyleToMindElixir(card.style),
        _originalStyle: card.style || {},
        children: [],
        unique_name: "card",
      };
      listNode.children.push(cardNode);
      cardData.value = cardNode;
    });

    variables[title].children.push(listNode);
  });

  return root;
}
const { mutateAsync: createNewSheet } = useCreateWorkspaceSheet({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['sheets'] });
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] });
    close();
  },
});

watchEffect(() => {
  if (view.value !== "mindmap" || !mindMapRef.value || !Lists.value) return;

  nextTick(() => {
    const rootNode = buildMindMapDataAllSheets(Lists.value);

    if (mindMapInstance.value) {
      mindMapInstance.value.destroy?.();
      mindMapInstance.value = null;
    }

    const instance = new MindElixir({
      el: mindMapRef.value as HTMLElement,
      theme: undefined,
      draggable: true,
      contextMenu: true,
      contextMenuOption: {
        Update: true,
        extend: [
          {
            name: "Update Node",
            onclick: () => {
              if (showFormatSidebar.value === true) {
                showFormatSidebar.value = false;
              }
              selectCardHandler(cardData.value);
            },
          },
        ],
      },
    });

    mindMapInstance.value = instance;
    instance.init({ nodeData: rootNode });

    // Select node
    instance.bus.addListener("selectNode", (nodeObj: any) => {
      if (!nodeObj) return;
      selectedMindNode.value = { nodeObj };

      showFormatSidebar.value = true;
    });

    // Render node styles
    instance.bus.addListener("renderNode" as any, (event: any) => {
      if (!event?.nodeObj || !event?.element) return;
      applyNodeStyle(event.nodeObj, event.element as HTMLElement);
    });

    // Listen for **after sibling insert** (Enter key)
 // Track nodes already added to backend
const addedNodeIds = new Set<string>();

instance.bus.addListener("operation", async (data: any) => {
  if (!data || (data.name !== "insertSibling" && data.name !== "addChild")) return;

  const newNode = data.obj;
  if (!newNode || !newNode.id) return;

  // Prevent duplicate processing
  if (addedNodeIds.has(newNode.id)) return;
  addedNodeIds.add(newNode.id);

  // Determine parent node
  let parentNode;
  if (data.name === "addChild") {
    parentNode = instance.currentNode?.nodeObj;
  } else {
    // insertSibling: parent of current node
    parentNode = instance.currentNode?.nodeObj?.parent;
  }

  if (!parentNode || !("unique_name" in parentNode)) return;

  // Only allow cards under List
  if (parentNode.unique_name !== "List") return;

  try {
    const payload = createDefaultCardPayload(
      {
        topic: newNode.topic ?? "New Card",
        id: newNode.id,
      },
      parentNode
    );

    await addTicket(payload);
    await refetchSheetLists();
  } catch (err) {
    console.error("Error creating card or refetching sheets:", err);
  }
});


// Keep track of nodes already handled to prevent duplicate sheets
const createdSheetNodeIds = new Set<string>();

instance.bus.addListener("operation", async (data: any) => {
  if (!data) return;

  const newNode = data.obj;
  if (!newNode?.id) return;

  // Resolve parent node
  const parentNode = newNode.parent ?? instance.currentNode?.nodeObj?.parent;
  if (!parentNode || !("unique_name" in parentNode)) return;

  // -------------------- ROOT → CREATE SHEET --------------------
 if (
  data.name === "addChild" &&
  parentNode.unique_name === "root" &&
  !createdSheetNodeIds.has(newNode.id)
) {
  createdSheetNodeIds.add(newNode.id);

  try {
    await createNewSheet({
  variables: {
    "sheet-title": newNode.topic ?? "New Sheet",
    "sheet-description": "This is custom description",
  },
  is_ai_generated: false,
  workspace_id: workspaceId.value,
  workspace_module_id: moduleId.value,
});

  } catch (err) {
    console.error("Error creating workspace sheet:", err);
  }

  return;
}


  // -------------------- LIST → CREATE CARD --------------------
  if (parentNode.unique_name !== "List") return;

  try {
    const payload = createDefaultCardPayload(
      {
        topic: newNode.topic ?? "New Card",
        id: newNode.id,
      },
      parentNode
    );

    await addTicket(payload);
    await refetchSheetLists();
  } catch (err) {
    console.error("Error creating card or refetching sheets:", err);
  }
});


  });
});

// ----------------------
function applyNodeStyle(nodeObj: any, element?: HTMLElement) {
  if (!nodeObj || !element || !nodeObj.style) return;

  const topic = element.querySelector(".topic") as HTMLElement | null;

  const nodeWrapper =
    (element.querySelector(".node") as HTMLElement | null) ?? element;

  const style = nodeObj.style;

  if (style.background) nodeWrapper.style.background = style.background;
  if (style.color && topic) topic.style.color = style.color;

  if (topic) {
    if (style.fontSize) topic.style.fontSize = style.fontSize;
    if (style.fontFamily) topic.style.fontFamily = style.fontFamily;
    if (style.fontWeight) topic.style.fontWeight = style.fontWeight;
    if (style.fontStyle) topic.style.fontStyle = style.fontStyle;
  }

  if (style.borderColor) nodeWrapper.style.borderColor = style.borderColor;
  if (style.borderWidth) nodeWrapper.style.borderWidth = style.borderWidth;
  if (style.borderRadius) nodeWrapper.style.borderRadius = style.borderRadius;
  if (style.padding) nodeWrapper.style.padding = style.padding;
}

function mapBackendStyleToMindElixir(style: any = {}) {
  return {
    background: style.bg_color,
    color: style.color,
    fontSize: style.font_size != null ? `${style.font_size}px` : undefined,
    fontWeight: style.font_weight,
    fontStyle: style.font_style,
    fontFamily: style.font_family,
    borderColor: style.border_color,
    borderWidth:
      style.border_width != null ? `${style.border_width}px` : undefined,
    borderRadius:
      style.border_radius != null ? `${style.border_radius}px` : undefined,
    padding: style.padding != null ? `${style.padding}px` : undefined,
  };
}

function createDefaultCardPayload(nodeObj: any, sheet: any) {

  const now = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return {
    sheet_list_id: sheet?.topic || "In Progress",
    workspace_id: workspaceId.value,
    sheet_id: selected_sheet_id.value,
    workspace_lane_id: nodeObj?.workspace_lane_id || null,
    variables: {
      "card-status": sheet?.topic || "In Progress",
      "card-type": null,
      priority: null,
      process: null,
      "card-title": nodeObj.topic || "New Card",
      "card-description": "",
      "start-date": startDate,
      "end-date": endDate,
    },
    createdAt: new Date().toISOString(),
  };
}

</script>
<style scoped>
@import "https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css";
.format-sidebar {
  width: 350px;
  background: white;
  border-left: 1px solid #e0e0e0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.format-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.format-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  border: 1px solid gray;
  border-radius: 5px;
}

.format-content {
  padding: 16px;
}

.format-group {
  margin-bottom: 20px;
}

.format-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.color-input {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.number-input,
.select-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.number-input:focus,
.select-input:focus {
  outline: none;
  border-color: #4a9eff;
}

.format-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.format-group {
  margin-bottom: 1.25rem;
}

.format-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #fff);
}

.format-group input,
.format-group select {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-surface, #252525);
  border: 1px solid var(--border, #333);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.format-group input:focus,
.format-group select:focus {
  outline: none;
  border-color: var(--accent, #4a9eff);
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.color-input {
  height: 40px;
  cursor: pointer;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.select-input {
  cursor: pointer;
}

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
</style>