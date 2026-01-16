<template>
  <div
    class="flex-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] flex-grow h-full border border-border flex flex-col overflow-x-auto overflow-y-auto scrollbar-visible pb-4"
  >
    <div
      class="header px-4 py-3 flex items-center justify-between gap-1 w-[100%]"
    >
      <div class="flex gap-4">
       <div class="hidden sm:flex">
  <Button
    class="cursor-pointer bg-gradient-to-tr from-accent to-accent-hover text-white items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
    @click="$emit('go-back')"
  >
    <i class="fa-solid fa-chevron-left text-xs"></i>
    Go Back
  </Button>
</div>

<div class="flex sm:hidden">
  <Button
    class="cursor-pointer bg-gradient-to-tr from-accent to-accent-hover text-white items-center justify-center px-2 py-1 rounded-md text-xs font-medium"
    @click="$emit('go-back')"
  >
    <i class="fa-solid fa-chevron-left text-xs"></i>
  </Button>
</div>


        <!-- {{ sheetId }} -->
        <!-- <Dropdown
          v-model="selected_module_id"
          :options="moduleOptions"
          variant="secondary"
          customClasses="fixed w-auto"
        >
        </Dropdown> -->
        <!-- <Dropdown
          v-if="selected_module_id"
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
        </Dropdown> -->
        <div
    class="px-4 py-1 h-8 mt-1 rounded-2xl bg-accent text-white font-medium cursor-pointer"
  >
    {{ activeSprint }}
  </div>
      </div>

      <div class="flex gap-3 items-center">
        <!-- <Dropdown
          v-if="selected_module_id"
          :actions="false"
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
        </Dropdown> -->
        <!-- <Searchbar
          @onChange="
            (e:any) => {
              searchQuery = e;
            }
          "
          placeholder="Search in Orchit AI space"
        >
        </Searchbar> -->
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
            class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
            :class="
              view === 'gantt'
                ? 'text-accent bg-accent-text'
                : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
            "
            title="Gantt Chart view"
          >
            <i class="fa-solid fa-chart-gantt"></i>
          </button>
          <button
            @click="view = 'timeline'"
            class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
            :class="
              view === 'timeline'
                ? 'text-accent bg-accent-text'
                : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
            "
            title="Timeline view"
          >
            <i class="fa-solid fa-timeline"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="overflow-x-auto">
      <div
        v-if="view == 'kanban'"
        class="flex-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] flex-grow h-full bg-bg-card border border-border overflow-x-auto flex scrollbar-visible"
      >
        <KanbanSkeleton v-show="isPending" />
        <div
          v-show="!isPending"
          class="flex overflow-x-auto gap-3 p-4 scrollbar-visible"
        >
          <KanbanBoard
            @onPlus="plusHandler"
            @delete:column="(e: any) => deleteHandler(e)"
            @update:column="(e: any) => handleUpdateColumn(e)"
            @reorder="onReorder"
            @addColumn="handleAddColumn"
            @select:ticket="selectCardHandler"
            :board="filteredBoard"
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
                  workspaceStore.transitions.currentColumn !=
                    column.column.title
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
          <!-- <div class="min-w-[328px] " @click.stop>
                <div v-if="activeAddList" class="bg-bg-body  rounded-lg p-4">
                    <BaseTextField :autofocus="true" v-model="newColumn" placeholder="Add New list"
                        @keyup.enter="emitAddColumn" />
                    <p class="text-xs mt-1.5">You can add details while editing</p>
                    <div class="flex items-center mt-3 gap-3">
                        <Button @click="emitAddColumn" varaint="primary"
                            class="px-3 py-1 bg-accent cursor-pointer text-white rounded">{{ addingList ?
                                'Adding...' :
                                'Add list' }}</Button>
                        <i class="fa-solid fa-close" @click="setActiveAddList"></i>
                    </div>
                </div>
                <button v-else
                    class="text-sm text-text-primary   py-2.5 cursor-pointer font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
                    @click.stop="setActiveAddList">
                    + Add List
                </button>
            </div> -->
        </div>
      </div>

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
      <template
        v-if="view === 'mindmap'"
        class="max-h-[calc(100vh-100px)] overflow-y-auto"
      >
        <div class="relative w-full h-full flex overflow-hidden">
          <!-- Mind Map Canvas -->
          <div
            ref="mindMapRef"
            class="flex-1 h-full overflow-y-hidden rounded-md relative"
          ></div>

          <!-- Formatting Sidebar -->
          <div
            v-if="showFormatSidebar"
            class="format-sidebar h-full py-4 px-4 w-[320px] border-l bg-bg-card overflow-hidden flex flex-col"
          >
            <!-- Header -->
            <div class="flex items-center justify-between pb-3 mb-4 border-b">
              <h3 class="text-sm font-semibold text-secondary">Format Node</h3>
              <button
                @click="showFormatSidebar = false"
                class="text-gray-400 hover:text-gray-700"
              >
                <i class="fa-solid fa-times"></i>
              </button>
            </div>

            <div class="format-content space-y-6">
              <!-- ================= COLORS ================= -->
              <div>
                <h4 class="text-xs font-semibold text-secondary uppercase mb-3">
                  Colors
                </h4>

                <!-- Background -->
                <div class="format-group relative mb-3">
                  <label class="block text-xs text-secondary mb-1"
                    >Background</label
                  >

                  <div
                    class="flex items-center gap-2 cursor-pointer"
                    @click="showBgPicker = !showBgPicker"
                  >
                    <div
                      class="w-full h-7 rounded border"
                      :style="{ background: activeFormatStyle.background }"
                    ></div>
                    <span class="text-xs text-secondary">
                      {{ activeFormatStyle.background }}
                    </span>
                  </div>

                  <!-- Picker -->
                  <div
                    v-if="showBgPicker"
                    class="absolute z-50 mt-2 p-3 bg-bg-card rounded-lg shadow-lg border w-[240px]"
                  >
                    <div class="grid grid-cols-10 gap-1 mb-3">
                      <button
                        v-for="color in presetColors"
                        :key="color"
                        class="w-5 h-5 rounded border"
                        :style="{ background: color }"
                        @click="
                          onStyleChange('bg_color', {
                            target: { value: color },
                          } as any);
                          showBgPicker = false;
                        "
                      ></button>
                    </div>

                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        :value="activeFormatStyle.background"
                        class="w-8 h-8 cursor-pointer"
                        @input="onStyleChange('bg_color', $event)"
                      />
                      <input
                        type="text"
                        class="flex-1 text-xs border rounded px-2 py-1"
                        :value="activeFormatStyle.background"
                        readonly
                      />
                    </div>
                  </div>
                </div>

                <!-- Text Color -->
                <!-- Text Color -->
                <div class="format-group relative mb-3">
                  <label class="block text-xs text-secondary mb-1">Text</label>

                  <!-- Trigger -->
                  <div
                    class="flex items-center gap-2 cursor-pointer"
                    @click="showTextColorPicker = !showTextColorPicker"
                  >
                    <div
                      class="w-full h-7 rounded border"
                      :style="{ background: activeFormatStyle.color }"
                    ></div>
                    <span class="text-xs text-secondary">
                      {{ activeFormatStyle.color }}
                    </span>
                  </div>

                  <!-- Picker -->
                  <div
                    v-if="showTextColorPicker"
                    class="absolute z-50 mt-2 p-3 bg-bg-card rounded-lg shadow-lg border w-[240px]"
                  >
                    <!-- Color Grid -->
                    <div class="grid grid-cols-10 gap-1 mb-3">
                      <button
                        v-for="color in presetColors"
                        :key="color"
                        class="w-5 h-5 rounded border"
                        :style="{ background: color }"
                        @click="
                          onStyleChange('color', {
                            target: { value: color },
                          } as any);
                          showTextColorPicker = false;
                        "
                      ></button>
                    </div>

                    <!-- Native Picker + Hex -->
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        :value="activeFormatStyle.color"
                        class="w-8 h-8 cursor-pointer"
                        @input="onStyleChange('color', $event)"
                      />
                      <input
                        type="text"
                        class="flex-1 text-xs border rounded px-2 py-1"
                        :value="activeFormatStyle.color"
                        readonly
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div class="grid grid-cols-1 gap-3">
                  <div>
                    <label class="block text-xs text-secondary mb-1"
                      >Weight</label
                    >
                    <select
                      class="w-full h-8 border rounded px-2 text-sm"
                      :value="activeFormatStyle.fontWeight"
                      @change="onStyleChange('font_weight', $event)"
                    >
                      <option value="lighter">Light</option>
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="bolder">Extra Bold</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-6 pt-4">
              <button
                class="w-full cursor-pointer bg-gradient-to-tr from-accent to-accent-hover text-white flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium hover:shadow-md disabled:opacity-60"
                :disabled="isSavingNodeStyle"
                @click="saveNodeStyle"
              >
                <span
                  v-if="isSavingNodeStyle"
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></span>
                <span>{{ isSavingNodeStyle ? "Updating..." : "Update" }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- hyperlink pop up -->
        <div
          v-if="showHyperlinkModal"
          class="fixed inset-0 bg-black/30 flex items-center justify-center"
        >
          <div class="bg-white p-6 rounded-xl w-80">
            <h3 class="text-lg font-semibold mb-4">Insert Web Link</h3>
            <input
              v-model="hyperlink"
              type="text"
              placeholder="Enter or paste a URL"
              class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div class="flex justify-end gap-2 mt-4">
              <button
                @click="cancel"
                class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                :disabled="!hyperlink"
                @click="confirm"
                :class="[
                  'px-4 py-2 rounded-md text-white',
                  hyperlink
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-blue-300 cursor-not-allowed',
                ]"
              >
                Insert
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
      <template
        v-if="view === 'calendar'"
        class="max-h-[calc(100vh-100px)] overflow-y-auto"
      >
        <CalendarView
          :data="filteredBoard"
          @select:ticket="selectCardHandler"
          class="min-h-[600px]"
        />
      </template>
      <template
        v-if="view === 'gantt'"
        class="max-h-[calc(100vh-100px)] overflow-y-auto"
      >
        <GanttChartView
          :data="filteredBoard"
          @select:ticket="selectCardHandler"
        />
      </template>
      <template
        v-if="view === 'timeline'"
        class="max-h-[calc(100vh-100px)] overflow-y-auto"
      >
        <TimelineView
          :data="filteredBoard"
          @select:ticket="selectCardHandler"
        />
      </template>
      <ConfirmDeleteModal
        @click.stop=""
        v-model="showDelete"
        title="Delete List"
        itemLabel="list"
        :itemName="localColumnData?.title"
        :requireMatchText="localColumnData?.title"
        confirmText="Delete workspace"
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
    </div>
    <!-- <CreateSheetModal v-model="isCreateSheetModal" /> -->
    <!-- <CreateVariableModal v-model="isCreateVar" v-if="isCreateVar" :sheetID="selected_sheet_id" /> -->
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
  toRaw,
  watchEffect,
  nextTick,
} from "vue";
import { toast } from "vue-sonner";
import { usePermissions } from "../../../composables/usePermissions";
import { useWorkspaceStore } from "../../../stores/workspace";
// import Dropdown from "../../../components/ui/Dropdown.vue";
import TableView from "../../../components/feature/TableView/TableView.vue";
import { request,toApiMessage } from "../../../libs/api";
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
} from "../../../queries/useSheets";
import { useRoute } from "vue-router";
import MindElixir from "mind-elixir";
import KanbanSkeleton from "../../../components/skeletons/KanbanSkeleton.vue";
import { useTheme } from "../../../composables/useTheme";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../../composables/useQueryParams";
// import Button from '../../../components/ui/Button.vue';
import { useSprintKanban } from "../../../queries/usePlan";
import KanbanTicket from "../../../components/feature/kanban/KanbanTicket.vue";
import Fuse from "fuse.js";
import { debounce } from "lodash";
// import SearchBar from '../../../components/ui/SearchBar.vue';
import { useSingleWorkspace } from "../../../queries/useWorkspace";

const props = defineProps<{ sptint_id: any; searchQuery: string, activeSprint: string }>();
const CreateTaskModal = defineAsyncComponent(
  () => import("../../Product/modals/CreateTaskModal.vue")
);
// const CreateSheetModal = defineAsyncComponent(() => import('../../Product/modals/CreateSheetModal.vue'))
// const CreateVariableModal = defineAsyncComponent(() => import('../../Product/modals/CreateVariableModal.vue'))
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../../Product/modals/ConfirmDeleteModal.vue")
);
const SidePanel = defineAsyncComponent(
  () => import("../../Product/components/SidePanel.vue")
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../../components/feature/kanban/KanbanBoard.vue")
);
import { useVarVisibilty, useAddTicket } from "../../../queries/useSheets";
import { getInitials } from "../../../utilities";
import { avatarColor } from "../../../utilities/avatarColor";
const DatePicker = defineAsyncComponent(() => import("../../Product/components/DatePicker.vue"));
const TableSearchCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableSearchCell.vue"));
const TableAssigneeCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableAssigneeCell.vue"));
const CalendarView = defineAsyncComponent(() => import("../../../components/feature/CalendarView.vue"));
const GanttChartView = defineAsyncComponent(() => import("../../../components/feature/GanttChartView.vue"));
const TimelineView = defineAsyncComponent(() => import("../../../components/feature/TimelineView.vue"));
const Button = defineAsyncComponent(() => import("../../../components/ui/Button.vue"));
const showHyperlinkModal = ref(false);
const hyperlink = ref("");
const resolveCallback = ref<((link: string) => void) | null>(null);
const mindMapRef = ref<HTMLElement | null>(null);
const mindMapInstance = ref<any>(null);
const selectedSheetTitle = ref<string>("");
const { isDark } = useTheme();
const selectedDeleteId = ref<string | null>(null);
const isDeletingTicket = ref(false);
function openHyperlinkModal(callback: (link: string) => void) {
  hyperlink.value = "";
  showHyperlinkModal.value = true;
  resolveCallback.value = callback;
}

function confirm() {
  if (resolveCallback.value) {
    resolveCallback.value(hyperlink.value);
  }
  showHyperlinkModal.value = false;
}

function cancel() {
  showHyperlinkModal.value = false;
}
const { mutate: addTicket } = useAddTicket({
  onSuccess: () => {
    // queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
  },
});
function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) return;
  handleAddColumn(t);
}
function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}
// const isCreateVar = ref(false)
const route = useRoute();
const view = ref("kanban");
const { workspaceId, moduleId } = useRouteIds();
const selected_module_id = ref<string>("");
const isCreateVar = ref(false);
const showFormatSidebar = ref(false);
const {
  // canEditSheet,
  // canDeleteSheet,
  canCreateVariable,
  // canCreateSheet,
  canCreateCard,
  canEditCard,
  canAssignCard,
} = usePermissions();
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

const queryClient = useQueryClient();
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

watch(
  moduleOptions,
  (opts) => {
    if (!opts.length) return;

    // Only set default if user hasn't selected anything yet
    if (!selected_module_id.value) {
      const defaultModule =
        opts.find((m: any) => m.title === "Tasks") || opts[0];
      selected_module_id.value = defaultModule._id;
    }
  },
  { immediate: true }
);

const { data: sheets, refetch: refetchSheets } = useSheets({
  workspace_id: workspaceId.value,
  workspace_module_id: computed(() => selected_module_id.value),
});
watch(selected_module_id, (newModuleId) => {
  if (newModuleId) refetchSheets();
});

const sheetId = computed(() => (sheets.value ? sheets.value[0]?._id : ""));
const selected_sheet_id = ref<any>(sheetId);
const viewBy = computed(() => (variables.value ? variables.value[0]?._id : ""));
const selected_view_by = ref(viewBy);
const workspaceStore = useWorkspaceStore();
const selected_sprint_id = computed(() => props.sptint_id);
// usage
const { data: Lists, isPending, refetch: refetchSheetLists, } = useSprintKanban(
  selected_sprint_id,
);
const createTeamModal = ref(false);
const selectedCard = ref<any>();
const selectCardHandler = (card: any) => {
  selectedCard.value = card;
};
// const isCreateSheetModal = ref(false)
// const createSheet = () => {
//     isCreateSheetModal.value = !isCreateSheetModal.value
// }

const reorderList = ReOrderList();
const reorderCard = ReOrderCard();
function onReorder(a: any) {
  if (a.type == "column")
    reorderList.mutate({
      payload: {
        workspace_id: workspaceId.value,
        workspace_module_id: moduleId.value,
        variable_id: selected_view_by.value,
        moved_value: a.meta.id,
        new_index: a.meta.newIndex,
      },
    });
  else {
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
interface DropdownOption {
  _id: string;
  title: string;
  description?: string;
  icon?: any;
  status?: string;
}

const transformedData = computed<DropdownOption[]>(() => {
  if (!sheets.value || !sheets.value.length) return [];

  return sheets.value.map((item: any) => ({
    _id: item._id,
    title: item.variables?.["sheet-title"] || "Untitled Sheet",
    description: item.variables?.["sheet-description"] || "",
    icon: item.icon || null,
    status: item.generation_status || null,
  }));
});
// Set first sheet as default selected
watch(
  transformedData,
  (newVal) => {
    if (newVal.length > 0 && !selected_sheet_id.value) {
      selected_sheet_id.value = newVal[0]._id;
    }
  },
  { immediate: true }
);
watch(
  transformedData,
  (newData) => {
    if (newData.length > 0) {
      selectedSheetTitle.value = newData[0].title; // store the first sheet title
    } else {
      selectedSheetTitle.value = "";
    }
  },
  { immediate: true } // run immediately on initialization
);
watch(sheets, (newSheetId) => {
  if (newSheetId?.length > 0) {
    selected_sheet_id.value = newSheetId[0]?._id; // Trigger the refetch with the new sheet_id
  }
});
// add column
const activeAddList = ref(false);
const newColumn = ref("");
// function setActiveAddList() { activeAddList.value = !activeAddList.value }
// function emitAddColumn() {
//     const t = newColumn.value.trim()
//     if (!t) return
//     handleAddColumn(t)
// }

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
const searchQuery = computed(() => props.searchQuery);
const debouncedQuery = ref("");
watch(
  searchQuery,
  debounce((val: string) => {
    debouncedQuery.value = val;
  }, 200)
);
const fuse = computed(() => {
  const allCards = Lists.value?.flatMap((col: any) =>
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
      (Lists.value ?? [])?.forEach((col: any) => {
        array = [...array, ...col?.cards];
      });
      return array;
    }

    const fuseTable = new Fuse(normalizedTableData.value, {
      keys: ["card-title", "card-description"],
      threshold: 0.3,
    });
    return fuseTable.search(query).map((r) => r.item);
  }
});

const normalizedTableData = computed(() => {
  let array: any = [];
  (Lists.value ?? []).forEach((col: any) => {
    array = [...array, ...col?.cards];
  });
  return array;
});
//srint views
const showDeleteModal = ref(false);
// function openEditSprintModal(opt: any) {
//   isCreateSheetModal.value = true;
//   selectedSheettoAction.value = opt;
// }
// const selectedSheettoAction = ref<any>();
// function handleDeleteSheetModal(opt: any) {
//   showDeleteModal.value = true;
//   selectedSheettoAction.value = opt;
// }

// const isCreateSheetModal = ref(false);
// const createSheet = () => {
//   selectedSheettoAction.value = {};
//   isCreateSheetModal.value = !isCreateSheetModal.value;
// };

const { data: variables, isPending: isVariablesPending } = useVariables(
  workspaceId,
  selected_module_id,
  selected_sheet_id
);
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
const { data: lanes } = useLanes(workspaceId);

// import ticket from '../../assets/icons/ticket.svg'
const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  }))
);
const getOptions = (options: any) => {
  return options.map((el: any) => ({
    _id: el.value ?? el,
    title: el.value ?? el,
  }));
};
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["get-sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
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
const assignHandle = (cardId: any, user: any) => {
  updateOptimisticCard(cardId, (card) => {
    card.seat = user;
  });
  moveCard.mutate({ card_id: cardId, seat_id: user?._id });
};
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
          modelValue: row.lane?._id || null, // Pass ID
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
          h(
            "span",
            {
              class: "text-[12px]", // your class here
            },
            value ? value?.u_full_name : ""
          ),
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
          emptyText: "Assignee",
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
              "onUpdate:modelValue": (val: any) => {
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
function handleChangeTicket(id: any, key: any, value: any) {
  updateOptimisticCard(id, (card) => {
    // Always update top-level property if it matches certain keys like 'card-title'
    if (key === "card-title") {
      card[key] = value;
    }

    // Check if variables is an array (per user data)
    if (Array.isArray(card.variables)) {
      const variable = card.variables.find((v: any) => v.slug === key);
      if (variable) {
        variable.value = value;
      } else {
        // Add new variable if not found (assuming Type Select/Text defaults)
        card.variables.push({ slug: key, value: value, type: "Select" });
      }
    } else if (card.variables && typeof card.variables === "object") {
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
const selectedMindNode = ref<any>(null);
//mindmap view
const showBgPicker = ref(false);

const presetColors = [
  "#FFFFFF",
  "#F2F2F2",
  "#D9D9D9",
  "#BFBFBF",
  "#A6A6A6",
  "#808080",
  "#404040",
  "#000000",
  "#FFE066",
  "#FF9AA2",
  "#8EE4AF",
  "#00EAD3",
  "#90DBF4",
  "#4D96FF",
  "#6C63FF",
  "#C77DFF",
  "#F7A1C4",
  "#FFC300",
  "#FF5733",
  "#2ECC71",
  "#00B894",
  "#17A2B8",
  "#0984E3",
  "#3F51B5",
  "#9C27B0",
  "#E84393",
  "#FF8C00",
  "#E74C3C",
  "#1E8449",
  "#006D6F",
  "#004C6D",
  "#0057A8",
  "#1A237E",
  "#4A148C",
  "#7D3C98",
];
const showTextColorPicker = ref(false);
watch(showBgPicker, (v) => {
  if (v) showTextColorPicker.value = false;
});

watch(showTextColorPicker, (v) => {
  if (v) showBgPicker.value = false;
});
const activeFormatStyle = computed(() => {
  // If a node is selected → use its style
  if (selectedMindNode.value?.nodeObj?.style) {
    return selectedMindNode.value.nodeObj.style;
  }

  // Otherwise → default backend style mapped to MindElixir format
  return mapBackendStyleToMindElixir(DEFAULT_BACKEND_STYLE);
});

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
  if (!selectedMindNode.value?.nodeObj) return; // exit early if no node

  const node = selectedMindNode.value.nodeObj;
  if (!node.style) node.style = {};

  const target = event.target as HTMLInputElement;
  const value = target.type === "number" ? Number(target.value) : target.value;

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
const isSavingNodeStyle = ref(false);

async function saveNodeStyle() {
  const node = selectedMindNode.value?.nodeObj;
  if (!node || isSavingNodeStyle.value) return;

  isSavingNodeStyle.value = true;

  try {
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

      hyperLink: hyperlink.value || plainNode.hyperLink || "",
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
      ? await updateSheet(payload)
      : await moveCard.mutateAsync(payload);
  } finally {
    isSavingNodeStyle.value = false;
  }
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
  hyperLink?: string;
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
  hyperLink?: string;
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
    const title = selectedSheetTitle.value;
    const link = sheet.style?.hyperLink || "";
    if (!variables[title]) {
      variables[title] = {
        id: sheet._id,
        topic: title,
        variables: sheet?.variables,
        children: [],
        style: sheet?.style,
        _originalStyle: sheet?.style || {},
        unique_name: "sheet",
        hyperLink: link || "",
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
      hyperLink: link || "",
    };

    (sheet.cards || []).forEach((card: any, cardIdx: number) => {
      const link = card.style?.hyperLink || "";

      const cardNode: MindNode = {
        id: card._id || `card-${cardIdx}`,
        seat_id: card.seat_id,
        topic: card["card-title"],
        style: mapBackendStyleToMindElixir(card.style),
        _originalStyle: card.style || {},
        children: [],
        unique_name: "card",
        hyperLink: link || "",
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
    queryClient.invalidateQueries({ queryKey: ["sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    close();
  },
});
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
const showTicketDelete = ref(false);
const ticketToDelete = ref<any>(null);
const deleteTicket = async () => {
  if (!selectedDeleteId.value) return;

  try {
    isDeletingTicket.value = true;

    await request({
      url: `workspace/card/${selectedDeleteId.value}`,
      method: "DELETE",
    });
    removeCardFromState(selectedDeleteId.value);
    showTicketDelete.value = false;
    ticketToDelete.value = null;
    toast.success("Ticket deleted successfully");
    await refetchSheets();
    await refetchSheetLists();
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    isDeletingTicket.value = false;
  }
};
const handleReorderCard = async (payload: {
  workspace_id: string;
  card_id: string;
  group_value: string;
  group_variable_id: string;
  new_index: number;
  sheet_id: string;
}) => {
  try {
    await request({
      url: `workspace/cards/group-card-order`,
      method: "PATCH",
      data: payload,
    });

    // Refetch data after successful reorder
    refetchSheets();
    refetchSheetLists();

    console.log("Card reordered successfully");
  } catch (error) {
    console.error("Failed to reorder card:", error);
    // Optionally show error toast/notification to user
  }
};
// Define the toolbar functions outside watchEffect
function injectToolbarButton() {
  const toolbar = mindMapRef.value?.querySelector(".mind-elixir-toolbar.rb") as HTMLElement;
  if (!toolbar) return;

  // Prevent duplicate button
  if (toolbar.querySelector(".open-sidebar-btn")) return;

  const btn = document.createElement("button");
  btn.className = "open-sidebar-btn me-toolbar-btn ms-2";
  btn.title = "Open Formatting Sidebar";
  btn.innerHTML = `<i class="fa-solid fa-sidebar"></i>`;
  btn.addEventListener("click", () => {
    showFormatSidebar.value = !showFormatSidebar.value;
  });

  toolbar.appendChild(btn);
}

// Store observer reference to clean up later
let toolbarObserver: MutationObserver | null = null;

function setupToolbarObserver() {
  // Clean up existing observer if any
  if (toolbarObserver) {
    toolbarObserver.disconnect();
    toolbarObserver = null;
  }

  const toolbarContainer = mindMapRef.value?.querySelector(".mind-elixir-toolbar.rb")?.parentElement;
  if (!toolbarContainer) return;

  // Use MutationObserver to track changes in the toolbar
  toolbarObserver = new MutationObserver(() => {
    injectToolbarButton();
  });

  toolbarObserver.observe(toolbarContainer, { childList: true, subtree: true });

  // Inject immediately first time
  injectToolbarButton();
}

watchEffect(() => {
  if (view.value !== "mindmap" || !mindMapRef.value || !Lists.value) return;

  nextTick(() => {
    const rootNode = buildMindMapDataAllSheets(Lists.value);

    if (mindMapInstance.value) {
      mindMapInstance.value.destroy?.();
      mindMapInstance.value = null;
    }

    // Track temporary nodes (created but not yet edited/saved)
    const temporaryNodeIds = new Set<string>();

    // Track nodes already saved to backend
    const savedNodeIds = new Set<string>();

    // Keep track of sheet nodes
    const createdSheetNodeIds = new Set<string>();

    const instance = new MindElixir({
      el: mindMapRef.value as HTMLElement,
      theme: isDark.value ? MindElixir.DARK_THEME : MindElixir.THEME,
      draggable: true,
      contextMenu: true,
      toolBar: true,
      keypress: true,
      locale: "en",
      overflowHidden: false,
      contextMenuOption: {
        Update: true,
        extend: [
          {
            name: "Update Node",
            onclick: () => {
              if (showFormatSidebar.value) showFormatSidebar.value = false;
              const node = selectedMindNode.value?.nodeObj;
              if (!node) return;
              selectCardHandler(node);
            },
          },
          {
            name: "Add Hyperlink",
            onclick: () => {
              openHyperlinkModal(async () => {
                await saveNodeStyle();
              });
            },
          },
        ],
      },
    });

    mindMapInstance.value = instance;
    instance.init({ nodeData: rootNode });

    // Center only once after DOM is fully ready
    setTimeout(() => {
      instance.toCenter();
    }, 100);

    // Setup toolbar button after instance is initialized
    nextTick(() => {
      setupToolbarObserver();
    });

    // Selected node
    instance.bus.addListener("selectNode", (nodeObj: any) => {
      if (!nodeObj) return;
      selectedMindNode.value = { nodeObj };
    });

    // Render node styles
    instance.bus.addListener("renderNode" as any, (event: any) => {
      if (!event?.nodeObj || !event?.element) return;
      applyNodeStyle(event.nodeObj, event.element as HTMLElement);
    });

    // Helper: get parent sheet of a node
    const getSheetParent = (node: any): any => {
      let current = node;
      while (current) {
        if (current.unique_name === "sheet") return current;
        current = current.parent;
      }
      return null;
    };

    // Node operations
    instance.bus.addListener("operation", async (data: any) => {
      if (!data) return;

      // Drag & drop / reorder cards
      if (
        data.name === "moveNode" ||
        data.name === "moveNodeBefore" ||
        data.name === "moveNodeAfter"
      ) {
        const draggedNode = data.obj;
        const targetNode = data.target;

        if (!draggedNode || draggedNode.unique_name !== "card") return;
        if (!targetNode) return;

        // Determine source List
        const sourceList = draggedNode._originalParent || draggedNode.parent;
        if (!sourceList || sourceList.unique_name !== "List") return;

        // Determine target List
        const targetList =
          targetNode.unique_name === "List" ? targetNode : targetNode.parent;
        if (!targetList || targetList.unique_name !== "List") return;

        // Determine target Sheet
        const targetSheet = getSheetParent(targetList);
        if (!targetSheet) return;

        // Compute new index inside target List
        const newIndex = targetList.children.findIndex(
          (c: any) => c.id === draggedNode.id
        );
        if (newIndex === -1) return;

        // Important: Store the original parent before the move
        draggedNode._originalParent = targetList;

        // Call the reorder function
        await handleReorderCard({
          workspace_id: workspaceId.value,
          card_id: draggedNode.id,
          group_value: targetList.topic,
          group_variable_id: selected_view_by.value,
          new_index: newIndex,
          sheet_id: targetSheet.id,
        });

        return;
      }

      // Remove node (cards only)
      if (data.name === "removeNode") {
        const removedNode = data.obj;
        if (!removedNode || !removedNode.id) return;
        if (removedNode.unique_name !== "card") return;

        selectedDeleteId.value = removedNode.id;
        await deleteTicket();
        return;
      }

      // Add child or sibling nodes
      if (data.name === "addChild" || data.name === "insertSibling") {
        const newNode = data.obj;
        if (!newNode || !newNode.id) return;
        temporaryNodeIds.add(newNode.id);
        return;
      }

      // Begin edit
      if (data.name === "beginEdit") {
        const editingNode = data.obj;
        console.log("editing node", editingNode);
        return;
      }

      // Finish edit
      if (data.name === "finishEdit") {
        const editedNode = data.obj;
        if (!editedNode || !editedNode.id) return;

        const isTemporaryNode = temporaryNodeIds.has(editedNode.id);
        const isAlreadySaved = savedNodeIds.has(editedNode.id);
        if (!isTemporaryNode && !isAlreadySaved) return;
        if (isAlreadySaved) return;

        if (isTemporaryNode) {
          temporaryNodeIds.delete(editedNode.id);
          savedNodeIds.add(editedNode.id);

          const parentNode = editedNode.parent;
          if (!parentNode || !("unique_name" in parentNode)) {
            savedNodeIds.delete(editedNode.id);
            return;
          }

          // Create Sheet
          if (
            parentNode.unique_name === "root" &&
            !createdSheetNodeIds.has(editedNode.id)
          ) {
            createdSheetNodeIds.add(editedNode.id);
            try {
              await createNewSheet({
                variables: {
                  "sheet-title": editedNode.topic ?? "New Sheet",
                  "sheet-description": "This is custom description",
                },
                is_ai_generated: false,
                workspace_id: workspaceId.value,
                workspace_module_id: moduleId.value,
              });
            } catch (err) {
              console.error("Error creating workspace sheet:", err);
              savedNodeIds.delete(editedNode.id);
              createdSheetNodeIds.delete(editedNode.id);
            }
            return;
          }

          // Create Card
          if (parentNode.unique_name === "List") {
            try {
              const payload = createDefaultCardPayload(
                {
                  topic: editedNode.topic ?? "New Card",
                  id: editedNode.id,
                },
                parentNode
              );
              if (payload.variables) {
                payload.variables["card-description"] =
                  "This is a default description";
              }
              await addTicket(payload);
            } catch (err) {
              console.error("Error creating card:", err);
              savedNodeIds.delete(editedNode.id);
            }
            return;
          }

          // Create List (placeholder)
          if (parentNode.unique_name === "sheet") {
            try {
              console.log("Creating new list under sheet...");
            } catch (err) {
              console.error("Error creating list:", err);
              savedNodeIds.delete(editedNode.id);
            }
            return;
          }
        }
      }
    });
  });
});
watch(
  isDark,
  () => {
    if (!mindMapInstance.value) return;

    // Switch MindElixir theme
    mindMapInstance.value.changeTheme(
      isDark.value ? MindElixir.DARK_THEME : MindElixir.THEME
    );
  },
  { immediate: true }
);

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
    hyperLink: style.hyperLink || undefined,
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
.format-sidebar {
  width: 350px;
  border-left: 1px solid #e0e0e0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

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
:deep(.mind-elixir-toolbar.rb) {
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 2px;
  width: 15rem;
}

/* Normalize toolbar buttons */
:deep(.mind-elixir-toolbar.rb > *) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  padding: 5px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

:deep(.mind-elixir-toolbar.lt > *) {
  cursor: pointer;
}
:deep(.mind-elixir-toolbar.rb > *:hover) {
  color: #7D68C8;
  border: 1px solid #7D68C8;
  border-radius: 5px;
}
:deep(.mind-elixir-toolbar.lt > *:hover) {
  color: #7D68C8;
  border: 1px solid #7D68C8;
  border-radius: 5px;
}
</style>
