<template>
  <div
    class="flex-auto bg-bg-surface backdrop-blur rounded-[6px] flex-grow h-full border border-border flex flex-col w-full overflow-hidden"
  >
    <!-- ── Header — never scrolls ─────────────────────────────────────────── -->
    <div class="shrink-0 relative">
      <div
        class="header py-2 px-2 border-b border-border flex items-center justify-between gap-2 overflow-x-auto h-full"
      >
        <div class="flex gap-2">
          <!-- Scope Dropdown -->
          <Dropdown
            :inSpace="true"
            ref="scopeDropdownRef"
            @open="closeAllDropdowns('scope')"
            v-model="selectedScope"
            :canEdit="false"
            :canDelete="false"
            :options="scopeOptions"
            variant="secondary"
            customClasses="fixed w-auto"
            custom-title="Select Scope"
            :multiple="false"
          />

          <!-- Filter button -->
          <div class="relative flex items-center gap-2">
            <button
              ref="filterTriggerRef"
              @click.stop="toggleFilters"
              class="flex items-center gap-2 px-3 h-[33px] rounded-md border cursor-pointer bg-bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
              :class="showFilterBar ? 'border-primary-color' : 'border-border'"
            >
              <i class="fa-solid fa-filter text-primary-color text-[14px]"></i>
              <span>Filter</span>
              <span
                v-if="activeFilterCount"
                class="bg-primary-color text-white rounded-full px-1.5 py-0.5 text-[9px] min-w-[16px] flex items-center justify-center"
              >
                {{ activeFilterCount }}
              </span>
            </button>

            <button
              v-if="hasActiveFilters"
              @click="handleClearFilters"
              class="text-[11px] font-medium text-text-secondary hover:text-primary-color transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>

             <ProductFilters
              v-if="showFilterBar"
              :triggerRef="filterTriggerRef"
              :variables="[]"
              :workspaceId="workspaceId"
              :activeFilters="activeFilters"
              :hideCategories="{
                dates:    true,
                plan:     true,
                priority: true,
              }"
              :labelOverrides="{
                status:    'Learning Status',
                card_type: 'Category',
                assignees: 'Created By',
              }"
              @apply="(f) => { handleApplyFilters(f); showFilterBar = false }"
              @clear="handleClearFilters"
              @close="showFilterBar = false"
            />
          </div>

          <!-- Group button for kanban/table -->
          <div
            v-if="view === 'kanban' || view === 'table'"
            class="relative flex items-center gap-3"
          >
            <button
              ref="groupTriggerRef"
              @click="toggleGroupDropdown"
              class="flex items-center gap-2 px-3 h-[33px] rounded-md border cursor-pointer bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
              :class="
                showGroupDropdown
                  ? 'border-primary-color text-primary-color'
                  : 'border-border text-text-primary'
              "
            >
              <i class="fa-solid fa-layer-group text-primary-color text-[14px]"></i>
              <span>Group: {{ activeGroupByLabel }}</span>
            </button>

            <TableGroupDropdown
              v-if="showGroupDropdown"
              :triggerRef="groupTriggerRef"
              v-model="activeGroupBy"
              :pin="true"
              :options="knowledgeGroupOptions"
              @close="showGroupDropdown = false"
            />
          </div>

          <!-- Group / View-by for mindmap/gantt/calendar/timeline -->
          <div
            v-if="view !== 'kanban' && view !== 'table'"
            class="relative flex items-center gap-2"
          >
            <button
              ref="groupViewTriggerRef"
              @click="toggleGroupViewDropdown"
              class="flex items-center gap-2 text-nowrap px-3 h-[33px] rounded-md border cursor-pointer bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
              :class="
                showGroupViewDropdown
                  ? 'border-primary-color text-primary-color'
                  : 'border-border text-text-primary'
              "
            >
              <i class="fa-solid fa-layer-group text-primary-color text-[14px]"></i>
              <span class="text-nowrap">Group: {{ activeGroupByLabel }}</span>
            </button>

            <TableGroupDropdown
              v-if="showGroupViewDropdown"
              :triggerRef="groupViewTriggerRef"
              v-model="activeGroupBy"
              :pin="true"
              :options="knowledgeGroupOptions"
              @close="showGroupViewDropdown = false"
            />
          </div>
        </div>

        <!-- Right side: Search + View toggles -->
        <div class="flex gap-2 items-center">
          <Searchbar
            :class="{
              'opacity-60 pointer-events-none': isEmpty && !isPending,
            }"
            @onChange="(e) => (searchQuery = e)"
            placeholder="Search knowledge base"
          />

          <div
            class="flex items-center gap-1 bg-bg-surface/50 h-[36px] px-1.5 border-border border rounded-[6px]"
          >
            <button
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="view === 'kanban' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
              title="Kanban view"
              @click="view = 'kanban'"
            >
              <i class="fa-solid fa-chart-kanban text-[14px]"></i>
            </button>

            <button
              @click="view = 'table'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="view === 'table' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
              title="List view"
            >
              <i class="fa-solid fa-align-left text-[14px]"></i>
            </button>

            <button
              @click="view = 'mindmap'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="view === 'mindmap' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
              title="MindMap view"
            >
              <i class="fa-solid fa-chart-diagram text-[14px]"></i>
            </button>

            <button
              @click="view = 'gantt'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="view === 'gantt' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
              title="Gantt Chart view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z" />
              </svg>
            </button>

            <button
              @click="view = 'calendar'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="view === 'calendar' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
              title="Calendar view"
            >
              <i class="fa-regular fa-calendar text-[14px]"></i>
            </button>

            <button
              @click="view = 'timeline'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="view === 'timeline' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
              title="Timeline view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm16 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" opacity="0" />
                <path d="M4 12h4m8 0h4M9 12h6M9 12v-6M15 12v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Add Knowledge button -->
          <Dropdown
            ref="addDropdownRef"
            :inSpace="true"
            @open="closeAllDropdowns('add')"
            v-model="addKnowledgeValue"
            :canEdit="false"
            :canDelete="false"
            :options="addKnowledgeOptions"
            variant="primary"
            customClasses="fixed w-auto"
            custom-title="Add Knowledge"
            :multiple="false"
            @update:modelValue="handleAddKnowledge"
          />
        </div>
      </div>
    </div>

    <!-- ── Kanban View ───────────────────────────────────────────────────────── -->
    <template v-if="view === 'kanban'">
      <KanbanSkeleton v-show="isPending" />

      <div
        v-if="!isPending && isEmpty"
        class="flex flex-col items-center justify-center flex-1 h-full py-20 text-center"
      >
        <EmptyState
          icon="fa-solid fa-chart-kanban"
          title="No columns to display"
          description="There are no columns found for the current grouping or filter selection."
          container-class="py-0"
        />
      </div>

      <!-- Mirrors Product.vue exactly: overflow-x-auto div wrapping KanbanBoard -->
      <div
        v-show="!isPending && !isEmpty"
        class="flex overflow-x-auto gap-2 scrollbar-visible h-full mx-2 pt-2"
      >
        <div class="flex gap-2">
          <KanbanBoard
            :board="adaptedLists"
            @onPlus="plusHandler"
            :variable_id="activeGroupByValue || 'learning_status'"
            :sheet_id="''"
            @select:ticket="(item: any) => openEditModal(item as KnowledgeItem)"
          >
            <template #ticket="{ ticket }">
              <KnowledgeCard
                :item="ticket"
                @approve="handleApprove"
                @reject="handleReject"
                @archive="handleArchive"
                @unarchive="handleUnarchive"
                @delete="handleDelete"
                @reindex="handleReindex"
                @view-chunks="handleViewChunks"
                @edit="openEditModal"
                @click="openDetailPanel(ticket)"
              />
            </template>
          </KanbanBoard>
        </div>
      </div>
    </template>

     <template v-if="view === 'table'">
  <div class="ps-4 pe-4">
    <TableView
      :columns="columns"
      :rows="tableRows"
      :groups="tableGroups"
      :is-grouped="!!(activeGroupByValue && isGrouped)"
      :selected-group="activeGroupByValue"
      :is-pending="isPending"
      :can-create="false"
      :can-create-variable="false"
      :total-count="pagination?.total ?? 0"
      :total-total="pagination?.total ?? 0"
      @delete="(item) => handleDelete(item)"
    >
      <!-- Title cell — clickable to open detail panel -->
      <template #name="{ row }">
  <span
    class="px-2 text-[13px] font-medium text-text-primary cursor-pointer hover:text-primary-color transition-colors truncate block"
    @click="selectedItem = row as KnowledgeItem"
  >
    {{ row.name || 'Untitled' }}
  </span>
</template>

      <!-- Status badge -->
      <template #learning_status="{ row }">
        <span class="px-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
            :style="{
              background: statusBgMap[row.learning_status] ?? 'rgba(107,114,128,0.12)',
              color: statusColorMap[row.learning_status] ?? '#6b7280',
              borderColor: (statusColorMap[row.learning_status] ?? '#6b7280') + '33',
            }"
          >
            <span
              v-if="row.learning_status === 'indexed'"
              class="flex h-1.5 w-1.5 relative"
            >
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            {{ row.learning_status?.replace(/_/g, ' ') }}
          </span>
        </span>
      </template>

      <!-- Scope pill -->
      <template #scope_type="{ row }">
        <span class="px-2 text-[12px] capitalize text-text-secondary">{{ row.scope_type }}</span>
      </template>

      <!-- Visibility pill -->
      <template #visibility="{ row }">
        <span class="px-2 text-[12px] capitalize text-text-secondary">{{ row.visibility?.replace(/_/g, ' ') }}</span>
      </template>

      <!-- Trust level -->
      <template #trust_level="{ row }">
        <span class="px-2 text-[12px] capitalize text-text-secondary">{{ row.trust_level?.replace(/_/g, ' ') }}</span>
      </template>

      <!-- Source type -->
      <template #source_type="{ row }">
        <span class="flex items-center gap-1.5 px-2 text-[12px] text-text-secondary">
          <i :class="sourceIconMap[row.source_type] ?? 'fa-solid fa-file'" class="text-[11px]"></i>
          <span class="capitalize">{{ row.source_type?.replace(/_/g, ' ') }}</span>
        </span>
      </template>
    </TableView>
  </div>
</template>

    <!-- ── MindMap View ──────────────────────────────────────────────────────── -->
    <template v-if="view === 'mindmap'">
      <div class="relative flex-1 flex flex-col px-2 overflow-hidden">
        <div
          v-if="isPending"
          class="absolute inset-0 z-20 flex items-center justify-center bg-bg-card/60 backdrop-blur-[2px]"
        >
          <div class="flex flex-col items-center gap-3">
            <i class="fa-solid fa-spinner fa-spin text-primary-color text-3xl"></i>
            <span class="text-sm font-medium text-text-secondary italic">Mapping your knowledge...</span>
          </div>
        </div>
        <MindMapView
          :listsData="adaptedLists"
          :workspaceId="workspaceId"
          :selectedSheetId="''"
          :selectedViewBy="''"
          :moduleId="''"
          :addingList="false"
          :activeAddList="false"
          :canCreateSheet="false"
          :canCreateVariable="false"
          :canEditSheet="false"
          :newColumn="''"
          :canCreate="false"
          :canEdit="true"
          :canDelete="false"
          :canMove="false"
          :canAssign="false"
          :canCreateCard="false"
          :canEditCard="true"
          :canDeleteCard="false"
          :canMoveCard="false"
          :canAssignCard="false"
          :dataLoading="isPending"
          @select:ticket="(item: any) => openDetailPanel(item as KnowledgeItem)"
        />
      </div>
    </template>

    <!-- ── Gantt View ────────────────────────────────────────────────────────── -->
    <template v-if="view === 'gantt'">
      <CustomGanttChart
        :data="adaptedLists"
        :groups="adaptedLists"
        :isGrouped="!!(activeGroupByValue && isGrouped)"
        :selectedGroup="activeGroupByValue"
        :canCreate="false"
        :canEdit="true"
        :data-loading="isPending"
        @select:ticket="(item: any) => openDetailPanel(item)"
        @create:ticket="() => openIngestModal('create')"
        @update:ticket="() => {}"
        @quickCreate="() => {}"
      />
    </template>

    <!-- ── Calendar View ─────────────────────────────────────────────────────── -->
    <template v-if="view === 'calendar'">
      <CustomCalendarView
        :data="adaptedLists"
        @select:ticket="(item: any) => openDetailPanel(item)"
      />
    </template>

    <!-- ── Timeline View ─────────────────────────────────────────────────────── -->
    <template v-if="view === 'timeline'">
      <CustomTimelineView
        :data="adaptedLists"
        :groups="adaptedLists"
        :isGrouped="!!(activeGroupByValue && isGrouped)"
        :selectedGroup="activeGroupByValue"
        :canCreate="false"
        :canEdit="true"
        :data-loading="isPending"
        @select:ticket="(item: any) => openDetailPanel(item)"
        @create:ticket="() => openIngestModal('create')"
        @update:ticket="() => {}"
        @quickCreate="() => {}"
      />
    </template>

  </div>

  <!-- ── Ingest / Create Modal ──────────────────────────────────────────────── -->
  <IngestModal
    v-if="showIngestModal"
    v-model="showIngestModal"
    :mode="ingestMode"
    :workspaceId="workspaceId"
    :scopeType="defaultScopeType"
    :filterOptions="filterOptions"
    @success="handleIngestSuccess"
  />
 <KnowledgeItemDetailPanel
    v-if="selectedItem"
    :item="selectedItem"
    :show-panel="!!selectedItem"
    :is-pending="isItemPending"
    @close="selectedItem = null"
    @approve="handleApprove"
    @reject="handleReject"
    @archive="handleArchive"
    @unarchive="handleUnarchive"
    @delete="handleDelete"
    @reindex="handleReindex"
    @view-chunks="handleViewChunks"
    @edit="openEditModal"
    @update="handleFieldUpdate"
  />
  <!-- ── Edit Modal ─────────────────────────────────────────────────────────── -->
  <EditKnowledgeModal
    v-if="showEditModal && editingItem"
    v-model="showEditModal"
    :item="editingItem"
    :workspaceId="workspaceId"
    :filterOptions="filterOptions"
    @success="handleEditSuccess"
  />

  <!-- ── Delete Confirm ─────────────────────────────────────────────────────── -->
  <ConfirmDeleteModal
    v-model="showDeleteModal"
    title="Delete Knowledge Item"
    itemLabel="knowledge item"
    :itemName="deletingItem?.name"
    :requireMatchText="deletingItem?.name"
    confirmText="Delete Item"
    cancelText="Cancel"
    size="md"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="showDeleteModal = false"
  />

  <!-- ── Chunks Drawer ──────────────────────────────────────────────────────── -->
  <ChunksDrawer
    v-if="showChunksDrawer && chunksItemId"
    v-model="showChunksDrawer"
    :itemId="chunksItemId"
    :workspaceId="workspaceId"
  />
</template>

<script setup lang="ts">
import {
  defineAsyncComponent,
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  h
} from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRouteIds } from '../../composables/useQueryParams'
import { toast } from 'vue-sonner'
import {
  useKnowledgeList,
  useKnowledgeFilters,
  useDeleteKnowledgeItem,
  useApproveKnowledgeItem,
  useRejectKnowledgeItem,
  useArchiveKnowledgeItem,
  useReindexItem,
  knowledgeKeys,
  useUnarchiveKnowledgeItem,
  type KnowledgeItem,
  type GroupBy,
  type ScopeType,
} from '../../queries/useKnowledgeHub'
import TableView from '../../components/feature/TableView/TableView.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import type { Column, Ticket } from '../../components/feature/kanban/KanbanBoard.vue' // adjust import path
// ─── Lazy Components ───────────────────────────────────────────────────────────
import KnowledgeItemDetailPanel from "./components/KnowledgeDetailPanel.vue"
const Dropdown = defineAsyncComponent(
  () => import('../../components/ui/Dropdown.vue'),
)
const Searchbar = defineAsyncComponent(
  () => import('../../components/ui/SearchBar.vue'),
)

const KanbanSkeleton = defineAsyncComponent(
  () => import('../../components/skeletons/KanbanSkeleton.vue'),
)
const ProductFilters = defineAsyncComponent(
  () => import('./components/ProductFilters.vue'),
)
const TableGroupDropdown = defineAsyncComponent(
  () => import('./components/TableGroupDropdown.vue'),
)

const KnowledgeCard = defineAsyncComponent(
  () => import('./components/KnowledgeCard.vue'),
)
const MindMapView = defineAsyncComponent(
  () => import('../../components/feature/MindmapView.vue'),
)
const CustomGanttChart = defineAsyncComponent(
  () => import('../../components/feature/CustomGanttChart.vue'),
)
const CustomCalendarView = defineAsyncComponent(
  () => import('../../components/feature/CustomCalendarView.vue'),
)
const CustomTimelineView = defineAsyncComponent(
  () => import('../../components/feature/CustomTimelineView.vue'),
)
const IngestModal = defineAsyncComponent(
  () => import('./modals/IngestModal.vue'),
)
const EditKnowledgeModal = defineAsyncComponent(
  () => import('./modals/EditKnowledgeModal.vue'),
)
const ConfirmDeleteModal = defineAsyncComponent(
  () => import('./modals/ConfirmDeleteModal.vue'),
)
const ChunksDrawer = defineAsyncComponent(
  () => import('./components/ChunksDrawer.vue'),
)
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue"),
);
// ─── Route / Query ─────────────────────────────────────────────────────────────
const { workspaceId } = useRouteIds()
const queryClient = useQueryClient()

// ─── View ──────────────────────────────────────────────────────────────────────
const view = ref<'kanban' | 'table' | 'mindmap' | 'gantt' | 'calendar' | 'timeline'>('kanban')

// ─── Pagination / Search ───────────────────────────────────────────────────────
const currentPage = ref(1)
const searchQuery = ref('')
const debouncedSearch = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout>
const selectedItem = ref<KnowledgeItem | null>(null)
const isItemPending = ref(false)
watch(searchQuery, (val) => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearch.value = val
    currentPage.value = 1
  }, 250)
})

// ─── Scope selector ────────────────────────────────────────────────────────────
const selectedScope = ref<string>('')
const scopeDropdownRef = ref<any>(null)

const scopeOptions = computed(() => [
  {
    _id: '',
    title: 'All Scopes',
    icon: { prefix: 'fa-solid', iconName: 'fa-layer-group' },
    hideActions: true,
  },
  {
    _id: 'workspace',
    title: 'Workspace',
    icon: { prefix: 'fa-solid', iconName: 'fa-building' },
    hideActions: true,
  },
  {
    _id: 'global',
    title: 'Global',
    icon: { prefix: 'fa-solid', iconName: 'fa-globe' },
    hideActions: true,
  },
  {
    _id: 'module',
    title: 'Module',
    icon: { prefix: 'fa-solid', iconName: 'fa-cube' },
    hideActions: true,
  },
])

// ─── Filters ───────────────────────────────────────────────────────────────────
const activeFilters = ref<Record<string, any>>({})
const showFilterBar = ref(false)
const filterTriggerRef = ref<HTMLElement | null>(null)
const activeFilterCount = computed(() => {
  const f = activeFilters.value
  let count = 0
  Object.values(f).forEach((val) => {
    if (Array.isArray(val)) count += val.length
    else if (val) count += 1
  })
  return count
})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)

function handleApplyFilters(filters: Record<string, any>) {
  activeFilters.value = filters
  currentPage.value = 1
}

function handleClearFilters() {
  activeFilters.value = {}
  currentPage.value = 1
}

// ─── Group By ──────────────────────────────────────────────────────────────────
// TableGroupDropdown with pin=true emits the full option object, not just the id string.
// So we track either a string (when cleared) or an option object.
const activeGroupBy = ref<string | Record<string, any>>('')
const showGroupDropdown = ref(false)
const groupTriggerRef = ref<HTMLElement | null>(null)
const showGroupViewDropdown = ref(false)
const groupViewTriggerRef = ref<HTMLElement | null>(null)

// The actual group_by string value to send to the API
const activeGroupByValue = computed<GroupBy | ''>(() => {
  if (!activeGroupBy.value) return ''
  if (typeof activeGroupBy.value === 'string') return activeGroupBy.value as GroupBy | ''
  return (activeGroupBy.value._id ?? activeGroupBy.value.value ?? '') as GroupBy | ''
})

const activeGroupByLabel = computed(() => {
  if (!activeGroupBy.value) return 'None'
  if (typeof activeGroupBy.value === 'string') {
    return knowledgeGroupOptions.find((o) => o._id === activeGroupBy.value)?.title ?? 'None'
  }
  return (activeGroupBy.value.title ?? activeGroupBy.value.label ?? 'None') as string
})

// Options passed to TableGroupDropdown via :pin + :options
const knowledgeGroupOptions = [
  { _id: '', title: 'None' },
  { _id: 'scope_type', title: 'Scope Type' },
  { _id: 'knowledge_category', title: 'Category' },
  { _id: 'visibility', title: 'Visibility' },
  { _id: 'learning_status', title: 'Status' },
  { _id: 'trust_level', title: 'Trust Level' },
]

function closeAllDropdowns(except?: string) {
  if (except !== 'scope') scopeDropdownRef.value?.closeDropdown?.()
  if (except !== 'filter') showFilterBar.value = false
  if (except !== 'group') showGroupDropdown.value = false
  if (except !== 'groupView') showGroupViewDropdown.value = false
}

function handleGlobalClick(e: MouseEvent) {
  const target = e.target as Node

  // Don't close anything if click is inside the filter bar itself
  if (filterTriggerRef.value?.contains(target)) return

  const triggers = [groupTriggerRef, groupViewTriggerRef]
  if (triggers.every((r) => !r.value?.contains(target))) {
    showGroupDropdown.value = false
    showGroupViewDropdown.value = false
  }
}

function toggleFilters() {
  const willShow = !showFilterBar.value
  if (willShow) closeAllDropdowns('filter')
  showFilterBar.value = willShow
}
function toggleGroupDropdown() {
  const willShow = !showGroupDropdown.value
  if (willShow) closeAllDropdowns('group')
  showGroupDropdown.value = willShow
}
function toggleGroupViewDropdown() {
  const willShow = !showGroupViewDropdown.value
  if (willShow) closeAllDropdowns('groupView')
  showGroupViewDropdown.value = willShow
}

onMounted(() => document.addEventListener('click', handleGlobalClick, true))
onBeforeUnmount(() => document.removeEventListener('click', handleGlobalClick, true))
const listParams = computed(() => {
  const f = activeFilters.value
  const first = (arr: any) => Array.isArray(arr) ? arr[0] : arr

  return {
    workspace_id: workspaceId.value,
    page:         currentPage.value,
    limit:        50,
    ...(selectedScope.value          ? { scope_type:         selectedScope.value as ScopeType } : {}),
    ...(activeGroupByValue.value     ? { group_by:           activeGroupByValue.value }          : {}),
    ...(debouncedSearch.value        ? { search:             debouncedSearch.value }              : {}),
    ...(f.status?.length             ? { learning_status:    first(f.status) }                   : {}),
    ...(f.card_type?.length          ? { knowledge_category: first(f.card_type) }                : {}),
    ...(f.visibility?.length         ? { visibility:         first(f.visibility) }               : {}),
    ...(f.trust_level?.length        ? { trust_level:        first(f.trust_level) }              : {}),
    ...(f.source_type?.length        ? { source_type:        first(f.source_type) }              : {}),
    // assignees filter maps to created_by user _id
    ...(f.assignees?.length          ? { created_by:         first(f.assignees) }                : {}),
  }
})

// ─── Queries ───────────────────────────────────────────────────────────────────
const { data: listData, isPending } = useKnowledgeList(listParams)
const { data: filtersData } = useKnowledgeFilters(workspaceId)

// ─── Filter options (passed to IngestModal / EditModal) ────────────────────────
const filterOptions = computed(() => filtersData.value?.data ?? filtersData.value ?? {})

// ─── Data normalisation ────────────────────────────────────────────────────────
const rawData = computed(() => {
  const d = listData.value?.data ?? listData.value
  console.log('rawData', d)
  return d
})
const pagination = computed(() => listData.value?.pagination ?? null)

const isGrouped = computed<boolean>(() => !!(activeGroupByValue.value && rawData.value?.groups))

const groupedData = computed<Record<string, { items: KnowledgeItem[]; total: number }>>(
  () => rawData.value?.groups ?? {},
)
const flatItems = computed<KnowledgeItem[]>(() => {
  const d = rawData.value
  if (!d) return []
  // handles both plain array and Proxy-wrapped array
  return Array.isArray(d) ? d : Object.values(d) as KnowledgeItem[]
})

const isEmpty = computed<boolean>(() => {
  if (isGrouped.value) return Object.keys(groupedData.value).length === 0
  return flatItems.value.length === 0
})

function formatGroupKey(key: string): string {
  return key.replace(/_/g, ' ')
}
function itemToCard(item: KnowledgeItem): Ticket {
  return {
    ...item,
    _id: item._id,
    id: item._id,               // ← add this so TableView hover/edit tracking works too
    name: item.name,            // ← explicitly preserve name
    'card-title': item.name ?? '',
    'card-status': item.learning_status ?? '',
    'card-type': item.knowledge_category ?? '',
    'start-date': (item as any).created_at ?? null,
    'end-date': (item as any).updated_at ?? null,
  } as unknown as Ticket
}
const adaptedLists = computed<Column[]>(() => {
  if (isGrouped.value) {
    return Object.entries(groupedData.value).map(([key, group]) => ({
      title: formatGroupKey(key),
      _id: key,
      cards: group.items.map(itemToCard),
      transitions: [],
    })) as Column[]
  }

const statuses = [
  { value: 'draft',          label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved',       label: 'Approved' },
  { value: 'indexed',        label: 'Indexed' },
  { value: 'rejected',       label: 'Rejected' },
  { value: 'archived',       label: 'Archived' },
  { value: 'failed',         label: 'Failed' },
]
  return statuses.map((s) => ({
    title: s.label,
    _id: s.value,
    cards: flatItems.value
      .filter((i) => i.learning_status === s.value)
      .map(itemToCard),
    transitions: [],
  })) as Column[]
})

// ─── defaultScopeType for IngestModal ─────────────────────────────────────────
const defaultScopeType = computed<ScopeType>(() => 'workspace')

// ─── Ingest / Create modal ─────────────────────────────────────────────────────
const showIngestModal = ref(false)
const ingestMode = ref<'file' | 'url' | 'text' | 'create'>('file')

function openIngestModal(mode: 'file' | 'url' | 'text' | 'create') {
  ingestMode.value = mode
  showIngestModal.value = true
  closeAllDropdowns()
}

function handleIngestSuccess() {
  toast.success('Knowledge item added successfully')
  queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
  queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(workspaceId.value) })
}

// ─── Edit modal ────────────────────────────────────────────────────────────────
const showEditModal = ref(false)
const editingItem = ref<KnowledgeItem | null>(null)

function openEditModal(item: KnowledgeItem) {
  editingItem.value = item
  showEditModal.value = true
}

function handleEditSuccess() {
  toast.success('Knowledge item updated')
  queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
}

// ─── Delete ────────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletingItem = ref<KnowledgeItem | null>(null)

const { mutate: deleteItem, isPending: isDeleting } = useDeleteKnowledgeItem({
  onSuccess: () => {
    toast.success('Knowledge item deleted')
    showDeleteModal.value = false
    deletingItem.value = null
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
  },
})

function handleDelete(item: KnowledgeItem) {
  deletingItem.value = item
  showDeleteModal.value = true
}
function confirmDelete() {
  if (!deletingItem.value) return
  deleteItem({ id: deletingItem.value._id, workspaceId: workspaceId.value })
}

// ─── Approve ───────────────────────────────────────────────────────────────────
const { mutate: approveItem } = useApproveKnowledgeItem({
  onSuccess: () => {
    toast.success('Item approved and queued for indexing')
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
  },
})
function handleApprove(item: KnowledgeItem) {
  approveItem({
    id: item._id,
    payload: { workspace_id: workspaceId.value, trust_level: 'approved_learning' },
  })
}

// ─── Reject ────────────────────────────────────────────────────────────────────
const { mutate: rejectItem } = useRejectKnowledgeItem({
  onSuccess: () => {
    toast.success('Item rejected')
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
  },
})
function handleReject(item: KnowledgeItem) {
  rejectItem({ id: item._id, payload: { workspace_id: workspaceId.value } })
}

// ─── Archive ───────────────────────────────────────────────────────────────────
const { mutate: archiveItem } = useArchiveKnowledgeItem({
  onSuccess: () => {
    toast.success('Item archived')
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
  },
})
// ─── Unarchive ─────────────────────────────────────────────────────────────────
const { mutate: unarchiveItem } = useUnarchiveKnowledgeItem({
  onSuccess: () => {
    toast.success('Item restored from archive')
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
  },
})
function handleUnarchive(item: KnowledgeItem) {
  unarchiveItem({ id: item._id, workspaceId: workspaceId.value })
}
function handleArchive(item: KnowledgeItem) {
  archiveItem({ id: item._id, workspaceId: workspaceId.value })
}

// ─── Re-index ──────────────────────────────────────────────────────────────────
const { mutate: reindexItem } = useReindexItem({
  onSuccess: () => toast.success('Re-index queued — processing in background'),
})
function handleReindex(item: KnowledgeItem) {
  reindexItem({ id: item._id, workspaceId: workspaceId.value })
}

// ─── Chunks drawer ─────────────────────────────────────────────────────────────
const showChunksDrawer = ref(false)
const chunksItemId = ref<string | null>(null)

function handleViewChunks(item: KnowledgeItem) {
  chunksItemId.value = item._id
  showChunksDrawer.value = true
}
// ─── Add Knowledge dropdown ────────────────────────────────────────────────────
const addDropdownRef = ref<any>(null)
const addKnowledgeValue = ref<string>('')

const addKnowledgeOptions = [
  {
    _id: 'file',
    title: 'Upload File',
    icon: { prefix: 'fa-solid', iconName: 'fa-file-arrow-up' },
    hideActions: true,
  },
  {
    _id: 'url',
    title: 'Add URL',
    icon: { prefix: 'fa-solid', iconName: 'fa-link' },
    hideActions: true,
  },
  {
    _id: 'text',
    title: 'Write Note / Text',
    icon: { prefix: 'fa-solid', iconName: 'fa-pen-to-square' },
    hideActions: true,
  },
  {
    _id: 'create',
    title: 'Manual Entry (Draft)',
    icon: { prefix: 'fa-solid', iconName: 'fa-circle-plus' },
    hideActions: true,
  },
]

function handleAddKnowledge(val: string) {
  if (!val) return
  openIngestModal(val as 'file' | 'url' | 'text' | 'create')
  nextTick(() => { addKnowledgeValue.value = '' })
}

const validIngestModes = ['file', 'url', 'text', 'create']

const plusHandler = (e: any) => {
  const mode = typeof e === 'string' && validIngestModes.includes(e) ? e : 'file'
  openIngestModal(mode as 'file' | 'url' | 'text' | 'create')
  nextTick(() => { addKnowledgeValue.value = '' })
}
function openDetailPanel(item: any) {
  // prefer the full KnowledgeItem from the flat list over the adapted card shape
  const full = flatItems.value.find(i => i._id === (item._id ?? item.id)) ?? item
  selectedItem.value = full as KnowledgeItem
}
function handleFieldUpdate(payload: any) {
  console.log("Field updated:", payload)
}
const columns = computed(() => [
  {
    key: 'name',
    label: 'Title',
    visible: true,
  },
  {
    key: 'learning_status',
    label: 'Status',
    visible: true,
  },
  {
    key: 'scope_type',
    label: 'Scope',
    visible: true,
  },
  {
    key: 'visibility',
    label: 'Visibility',
    visible: true,
  },
  {
    key: 'trust_level',
    label: 'Trust Level',
    visible: true,
  },
  {
    key: 'source_type',
    label: 'Source',
    visible: true,
  },
  {
    key: 'created_at',
    label: 'Created',
    visible: true,
    render: ({ value }: { value: string }) =>
      h('span', { class: 'text-[12px] text-text-secondary px-2' },
        value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
      ),
  },
])

// ─── Flat rows (for non-grouped view) ────────────────────────────────────────
const tableRows = computed<Record<string, any>[]>(() =>
  flatItems.value?.map(item => ({ ...item, id: item._id })) ?? []
)

// ─── Grouped rows (for grouped view) ─────────────────────────────────────────
const tableGroups = computed(() => {
  if (!activeGroupByValue.value || !isGrouped.value) return []
  return Object.entries(groupedData.value ?? {}).map(([key, group]: [string, any]) => ({
    title: formatGroupKey(key),
    cards: group.items?.map((item: KnowledgeItem) => ({ ...item, id: item._id })) ?? [],
    total: group.total ?? 0,
  }))
})
// ─── Status maps (reused in table cells) ─────────────────────────────────────
const statusBgMap: Record<string, string> = {
  draft:          'rgba(107,114,128,0.12)',
  pending_review: 'rgba(245,158,11,0.12)',
  approved:       'rgba(59,130,246,0.12)',
  indexed:        'rgba(16,185,129,0.12)',
  rejected:       'rgba(239,68,68,0.12)',
  archived:       'rgba(139,92,246,0.12)',
  failed:         'rgba(220,38,38,0.12)',
}
const statusColorMap: Record<string, string> = {
  draft:          '#6b7280',
  pending_review: '#f59e0b',
  approved:       '#3b82f6',
  indexed:        '#10b981',
  rejected:       '#ef4444',
  archived:       '#8b5cf6',
  failed:         '#dc2626',
}
const sourceIconMap: Record<string, string> = {
  file:               'fa-solid fa-file',
  url:                'fa-solid fa-link',
  text:               'fa-solid fa-align-left',
  note:               'fa-solid fa-note-sticky',
  log:                'fa-solid fa-list',
  comment:            'fa-solid fa-comment',
  api:                'fa-solid fa-code',
  database:           'fa-solid fa-database',
  agent_chat:         'fa-solid fa-robot',
  agent_feedback:     'fa-solid fa-star',
  agent_action:       'fa-solid fa-bolt',
  agent_memory:       'fa-solid fa-brain',
  analytical_insight: 'fa-solid fa-chart-line',
  pdf:                'fa-solid fa-file-pdf',
  docx:               'fa-solid fa-file-word',
  image:              'fa-solid fa-image',
  screenshot:         'fa-solid fa-camera',
  manual:             'fa-solid fa-pen',
}
watch(selectedScope, () => {
  currentPage.value = 1
})

watch(activeGroupByValue, () => {
  currentPage.value = 1
})
</script>

<style scoped></style>