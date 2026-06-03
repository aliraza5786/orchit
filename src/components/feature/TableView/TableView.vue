<template>
  <div class="flex flex-col h-[calc(100vh-125px)] relative rounded-[6px] mt-2 overflow-hidden border border-border/60">
    <div ref="tableViewport" class="kanban-table flex-1 overflow-y-auto overflow-x-auto rounded-[6px]">
      <table class="w-full table-fixed border-collapse shadow-sm bg-bg-surface text-sm"
      :class="{'h-[calc(100vh-175px)]':(!isGrouped && tickets.length === 0) || (isGrouped && groups.length === 0)}"
      >
        <!-- HEADER -->
        <thead class="bg-bg-body border-b border-border sticky top-[-1px] z-[999]">
          <tr class="text-text-secondary">
            <th class="w-8 p-0 sticky left-0 z-20 bg-bg-body"></th>
            <th 
              v-for="col in visibleColumns" 
              :key="col?.key" 
              class="relative font-bold p-2 uppercase text-left text-[11px] tracking-wide border-r border-border/40 select-none whitespace-nowrap min-w-[200px]"
              :style="{ width: columnWidths[col.key] ? columnWidths[col.key] + 'px' : '100%' }"
            >
              <span>{{ col?.label }}</span>

              <!-- Column Resize Handle -->
              <div 
                class="absolute right-0 top-0 h-full w-2 cursor-col-resize z-30 hover:bg-primary-color/20 active:bg-primary-color/40 transition" 
                @mousedown="(e) => startResize(e, col.key)"
              ></div>
            </th>

            <!-- Toggle Columns Button -->
            <th class="w-10 p-2 text-center sticky right-0 z-20 bg-bg-body border-l border-border/40">
              <div class="relative inline-block">
                <button 
                  @click.stop="showColumnMenu = !showColumnMenu" 
                  class="p-1 rounded hover:bg-bg-surface/50 cursor-pointer"
                >
                  <i class="fa-regular fa-columns-3"></i>
                </button>

                <!-- Column Toggle Menu -->
                <div 
                  v-if="showColumnMenu"
                  class="column-menu absolute w-[200px] -right-1 bg-bg-dropdown border border-border rounded shadow z-50"
                >
                  <div 
                    v-for="col in props.columns.filter(c => c.label.toLowerCase() !== 'process')" 
                    :key="'toggle-' + col.key" 
                    class="flex items-center space-x-2 px-3 py-1.5 capitalize font-medium cursor-pointer hover:bg-bg-dropdown-menu-hover text-[12px] text-text-primary gap-2"
                  >
                    <input
                      type="checkbox"
                      :checked="visibleColumnKeys.includes(col.key)"
                      @change="toggleColumn(col.key)"
                      class="h-4 w-4 mt-0.5 rounded border-border accent-primary-color cursor-pointer flex-shrink-0"
                    />
                    <span>{{ col.label }}</span>
                  </div>
                  <div 
                    v-if="canCreateVariable" 
                    @click="emit('addVar')" 
                    class="sticky bottom-0 bg-bg-dropdown shadow-md mt-2 shadow-border capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
                  >
                    <i class="fa-solid fa-plus"></i> Add new
                  </div>
                </div>
              </div>
            </th>
          </tr>
        </thead>


        <!-- BODY -->
        <tbody class="bg-bg-surface/20">
          <!-- SKELETON LOADING -->
          <template v-if="isPending">
            <tr v-for="n in 5" :key="'sk-' + n" class="border-b border-border animate-pulse">
              <td>
                <div class="w-4 h-4 bg-bg-surface rounded"></div>
              </td>
              <td 
                v-for="(col, i) in columns" 
                :key="col.key" 
                class="border-r border-border h-8"
                :style="{ width: columnWidths[col.key] + 'px' }"
                :colspan="i === visibleColumns.length - 1 ? 2 : 1"
              >
                <div class="w-full h-4 bg-bg-surface rounded"></div>
              </td>
            </tr>
          </template>

          <!-- EMPTY STATE -->
          <tr v-else-if="(!isGrouped && tickets.length === 0) || (isGrouped && groups.length === 0)">
            <td :colspan="visibleColumns.length + 2" class="text-center py-20">
              <div class="flex items-center justify-center w-full">
                <EmptyState
                  icon="fa-regular fa-folder-open"
                  title="No tickets found"
                  description="You can add a new ticket using the create button below."
                  container-class="py-0"
                />
              </div>
            </td>
          </tr>

          <!-- IF NO VISIBLE COLUMN -->
           <tr v-else-if="visibleColumns.length === 0">
            <td :colspan="visibleColumns.length + 2" class="text-center py-20">
              <div class="flex items-center justify-center w-full">
                <EmptyState
                  icon="fa-regular fa-folder-open"
                  title="Configure your columns"
                  description="You haven't configured any columns yet. Add fields as columns to see search results and their information."
                  container-class="py-0"
                />
              </div>
            </td>
          </tr>

          <!-- GROUPED VIEW -->
          <template v-else-if="isGrouped">
            <template v-for="(group, gIndex) in groups" :key="group.title || gIndex">
              <!-- GROUP HEADER -->
              <tr 
                class="bg-bg-body border-y border-border cursor-pointer hover:bg-bg-body/50 transition-colors group/header"
                @click="toggleGroup(group.title)"
              >
                <td :colspan="visibleColumns.length + 2" class="p-2 text-sm font-semibold text-text-primary border-r-0">
                  <div class="flex items-center gap-2 ps-2">
                    <i 
                      class="fa-solid fa-chevron-right text-xs transition-transform"
                      :class="{ 'rotate-90': expandedGroups[group.title] }"
                    ></i>
                    <span class="capitalize">{{ group.title || 'Clear selection / Empty' }}</span>
                    <span class="text-text-secondary font-normal text-xs ml-2">{{ group.cards?.length || 0 }} items</span>
                    
                    <!-- Group Header Quick Create '+' -->
                    <button 
                      v-if="selectedGroup !== 'owner'"
                      class="ml-2 w-5 h-5 flex items-center justify-center rounded-md border border-border bg-bg-surface hover:border-primary-color hover:text-primary-color opacity-0 group-hover/header:opacity-100 transition-all text-[10px]"
                      @click.stop="startInlineQuickCreate(0, group.title, group)"
                      title="Quick create in this group"
                    >
                      <i class="fa-solid fa-plus font-bold"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- GROUP CARDS -->
              <template v-if="expandedGroups[group.title]">
                <!-- Empty Group Inline Quick Create -->
                <tr 
                  v-if="inlineQuickCreate.active && inlineQuickCreate.index === 0 && inlineQuickCreate.groupTitle === group.title && group.cards.length === 0" 
                  class="inline-quick-create-row border-none transition-all"
                >
                  <td class="p-0 border-none sticky left-0 z-50 overflow-visible" colspan="0">
                    <div class="py-2.5" :style="{ width: viewportWidth + 'px' }">
                      <div class="mx-2 flex flex-col border border-primary-color/60 rounded-md bg-bg-surface shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.15)] overflow-hidden">
                        <div class="flex items-center px-3 py-1 gap-2">
                          <div class="flex items-center gap-1 text-primary-color/80 cursor-pointer hover:text-primary-color transition-colors">
                            <i class="fa-solid fa-sparkles text-sm"></i>
                            <i class="fa-solid fa-chevron-down text-[10px]"></i>
                          </div>
                          <input
                            ref="inlineQuickCreateInputRef"
                            v-model="inlineQuickCreate.title"
                            type="text"
                            placeholder="What needs to be done?"
                            :disabled="isCreating"
                            class="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-secondary/50 h-8 disabled:opacity-50"
                            @keydown.enter="handleQuickCreateSubmit"
                            @keydown.esc="handleQuickCreateCancel"
                          />
                          <div class="flex items-center gap-3">
                            <button 
                              class="bg-primary-color hover:bg-primary-color/90 disabled:bg-primary-color/40 disabled:cursor-not-allowed text-white px-3 py-0.5 rounded text-[12px] font-medium flex items-center gap-1.5 transition-all h-7 min-w-[70px] justify-center"
                              :disabled="!inlineQuickCreate.title.trim() || isCreating"
                              @click="handleQuickCreateSubmit"
                            >
                              <template v-if="isCreating">
                                <i class="fa-solid fa-spinner fa-spin text-[10px]"></i>
                                <span>Creating...</span>
                              </template>
                              <template v-else>
                                Create
                                <i class="fa-solid fa-level-down rotate-90 text-[10px] opacity-70"></i>
                              </template>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td :colspan="footerColspan - 1" class="p-0 border-none"></td>
                </tr>

                <template v-for="(ticket, index) in group.cards" :key="ticket?.id">
                  <!-- Inline Quick Create Row (Above current index) -->
                  <tr 
                    v-if="inlineQuickCreate.active && inlineQuickCreate.index === index && inlineQuickCreate.groupTitle === group.title" 
                    class="inline-quick-create-row border-none transition-all"
                  >
                    <td class="p-0 border-none sticky left-0 z-50 overflow-visible" colspan="0">
                      <div class="py-2.5" :style="{ width: viewportWidth + 'px' }">
                        <div class="mx-2 flex flex-col border border-primary-color/60 rounded-md bg-bg-surface shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.15)] overflow-hidden">
                          <div class="flex items-center px-3 py-1 gap-2">
                            <div class="flex items-center gap-1 text-primary-color/80 cursor-pointer hover:text-primary-color transition-colors">
                              <i class="fa-solid fa-sparkles text-sm"></i>
                              <i class="fa-solid fa-chevron-down text-[10px]"></i>
                            </div>
                            <input
                              ref="inlineQuickCreateInputRef"
                              v-model="inlineQuickCreate.title"
                              type="text"
                              placeholder="What needs to be done?"
                              :disabled="isCreating"
                              class="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-secondary/50 h-8 disabled:opacity-50"
                              @keydown.enter="handleQuickCreateSubmit"
                              @keydown.esc="handleQuickCreateCancel"
                            />
                            <div class="flex items-center gap-3">
                              <button 
                                class="bg-primary-color hover:bg-primary-color/90 disabled:bg-primary-color/40 disabled:cursor-not-allowed text-white px-3 py-0.5 rounded text-[12px] font-medium flex items-center gap-1.5 transition-all h-7 min-w-[70px] justify-center"
                                :disabled="!inlineQuickCreate.title.trim() || isCreating"
                                @click="handleQuickCreateSubmit"
                              >
                                <template v-if="isCreating">
                                  <i class="fa-solid fa-spinner fa-spin text-[10px]"></i>
                                  <span>Creating...</span>
                                </template>
                                <template v-else>
                                  Create
                                  <i class="fa-solid fa-level-down rotate-90 text-[10px] opacity-70"></i>
                                </template>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td :colspan="footerColspan - 1" class="p-0 border-none"></td>
                  </tr>

                  <!-- Data Row -->
                  <tr 
                    @mouseenter="(e) => { cancelLeave(); setHoverRow(e, Number(index), group.title, group) }"
                    @mouseleave="handleLeave"
                    :class="[
                      'border-b border-border transition-colors relative group/row',
                      hoverIndex === index && hoverGroupTitle === group.title && selectedGroup !== 'owner' && 'hover-active-row',
                      'hover:bg-bg-surface/40'
                    ]"
                  >
                    <td class="w-8 group text-center align-middle border-r border-border/40 sticky left-0 z-20 bg-bg-surface">
                      <div class="flex justify-center items-center h-full w-full relative">
                        <div 
                          class="h-6 w-5 flex items-center justify-center rounded hover:bg-bg-dropdown-menu-hover cursor-pointer text-text-secondary row-action-btn"
                          @click.stop="toggleRowMenu(ticket._id || ticket.id)"
                        >
                          <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                        </div>
                        <div 
                          v-if="activeMenuId === (ticket._id || ticket.id)" 
                          class="absolute left-6 top-6 bg-bg-dropdown border border-border rounded shadow-md z-50 min-w-[120px] text-left overflow-hidden row-action-menu"
                        >
                          <div  
                            @click.stop="() => { emit('delete', ticket); activeMenuId = null; }"
                            disabled="!canDelete" 
                            :class="[
                              'px-3 py-2 text-xs flex items-center gap-2 text-red-500',
                              canDelete ? ' hover:bg-bg-dropdown-menu-hover cursor-pointer' : ' cursor-not-allowed'
                            ]"
                            class="px-3 py-2 text-xs text-red-500 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-2"
                          >
                            <i class="fa-solid fa-trash"></i> Delete
                          </div>
                        </div>
                      </div>
                    </td> 
                    <td
                      v-for="(col, i) in visibleColumns"
                      :key="col?.key"
                      class="border-r border-border overflow-visible relative h-8"
                      :style="{ width: columnWidths[col.key] + 'px' }"
                      :colspan="i === visibleColumns.length - 1 ? 2 : 1"
                    >
                      <!-- EDIT MODE -->
                      <input
                        v-if="editing?.id === ticket?.id && editing?.field === col?.key"
                        v-model="ticket[col?.key]"
                        @blur="finishEdit(ticket)"
                        class="min-w-[200px] w-full p-1 border border-primary-color/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-color bg-bg-body text-[12px] h-8"
                        :ref="(el: any) => el && editing?.id === ticket?.id && editing?.field === col?.key && (titleInput = el)"
                      />

                      <!-- VIEW MODE -->
                      <slot
                        v-else
                        :name="col.key"
                        :row="ticket"
                        :column="col"
                        :index="`r-${ticket._id}`"
                      >
                        <component
                          :is="RenderCell"
                          :row="ticket"
                          :column="col"
                          :index="ticket._id"
                        />
                      </slot>
                    </td>
                  </tr>
                </template>
              </template>
            </template>
          </template>

          <!-- FLAT VIEW -->
          <template v-else v-for="(ticket, index) in tickets" :key="ticket?.id">
            <!-- Inline Quick Create (Above current index) -->
            <tr 
              v-if="inlineQuickCreate.active && inlineQuickCreate.index === index && !isGrouped" 
              class="inline-quick-create-row border-none transition-all"
            >
              <td class="p-0 border-none sticky left-0 z-50 overflow-visible" colspan="0">
                <div class="py-2.5" :style="{ width: viewportWidth + 'px' }">
                  <div class="mx-2 flex flex-col border border-primary-color/60 rounded-md bg-bg-surface shadow-[0_4px_12px_rgba(var(--primary-color-rgb),0.15)] overflow-hidden">
                    <div class="flex items-center px-3 py-1 gap-2">
                      <div class="flex items-center gap-1 text-primary-color/80 cursor-pointer hover:text-primary-color transition-colors">
                        <i class="fa-solid fa-sparkles text-sm"></i>
                        <i class="fa-solid fa-chevron-down text-[10px]"></i>
                      </div>
                      <input
                        ref="inlineQuickCreateInputRef"
                        v-model="inlineQuickCreate.title"
                        type="text"
                        placeholder="What needs to be done?"
                        :disabled="isCreating"
                        class="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-secondary/50 h-8 disabled:opacity-50"
                        @keydown.enter="handleQuickCreateSubmit"
                        @keydown.esc="handleQuickCreateCancel"
                      />
                      <div class="flex items-center gap-3"> 
                        <button 
                          class="bg-primary-color hover:bg-primary-color/90 disabled:bg-primary-color/40 disabled:cursor-not-allowed text-white px-3 py-0.5 rounded text-[12px] font-medium flex items-center gap-1.5 transition-all h-7 min-w-[70px] justify-center"
                          :disabled="!inlineQuickCreate.title.trim() || isCreating"
                          @click="handleQuickCreateSubmit"
                        >
                          <template v-if="isCreating">
                            <i class="fa-solid fa-spinner fa-spin text-[10px]"></i>
                            <span>Creating...</span>
                          </template>
                          <template v-else>
                            Create
                            <i class="fa-solid fa-level-down rotate-90 text-[10px] opacity-70"></i>
                          </template>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
              <td :colspan="footerColspan - 1" class="p-0 border-none"></td>
            </tr>

            <!-- ACTUAL ROW -->
            <tr 
              @mouseenter="(e) => { cancelLeave(); setHoverRow(e, index) }"
              @mouseleave="handleLeave"
              :class="[
                'border-b border-border transition-colors relative group/row',
                hoverIndex === index && !isGrouped && 'hover-active-row',
                'hover:bg-bg-surface/40'
              ]"
            >
              <td class="w-8 group text-center align-middle border-r border-border/40 sticky left-0 z-20 bg-bg-surface">
                <div class="flex justify-center items-center h-full w-full relative">
                  <div 
                    class="h-6 w-5 flex items-center justify-center rounded hover:bg-bg-dropdown-menu-hover cursor-pointer text-text-secondary row-action-btn"
                    @click.stop="toggleRowMenu(ticket._id || ticket.id)"
                  >
                    <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                  </div>
                  <div 
                    v-if="activeMenuId === (ticket._id || ticket.id)" 
                    class="absolute left-6 top-6 bg-bg-dropdown border border-border rounded shadow-md z-50 min-w-[120px] text-left overflow-hidden row-action-menu"
                  >
                    <div 
                      v-if="canDelete" 
                      @click.stop="() => { emit('delete', ticket); activeMenuId = null; }"
                      class="px-3 py-2 text-xs text-red-500 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-2"
                    >
                      <i class="fa-solid fa-trash"></i> Delete
                    </div>
                  </div>
                </div>
              </td>
              <td
                v-for="(col, i) in visibleColumns"
                :key="col?.key"
                class="border-r border-border overflow-visible relative h-8"
                :style="{ width: columnWidths[col.key] + 'px' }"
                :colspan="i === visibleColumns.length - 1 ? 2 : 1"
              >
                <!-- EDIT MODE -->
                <input
                  v-if="editing?.id === ticket?.id && editing?.field === col?.key"
                  v-model="ticket[col?.key]"
                  @blur="finishEdit(ticket)"
                  class="min-w-[200px] w-full p-1 border border-primary-color/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-color bg-bg-body text-[12px] h-8"
                  :ref="(el: any) => el && editing?.id === ticket?.id && editing?.field === col?.key && (titleInput = el)"
                />

                <!-- VIEW MODE -->
                <slot
                  v-else
                  :name="col.key"
                  :row="ticket"
                  :column="col"
                  :index="`r-${ticket._id}`"
                >
                  <component
                    :is="RenderCell"
                    :row="ticket"
                    :column="col"
                    :index="ticket._id"
                  />
                </slot>
              </td>
            </tr>
          </template>

        </tbody>
      </table>

      <!-- STICKY TABLE FOOTER -->
      <div 
        v-if="canCreate && !isTalent && !isGrouped" 
        ref="quickCreateContainerRef"
        class="sticky left-0 bg-bg-body border-t border-border/60 px-4 py-2"
        :style="{ width: viewportWidth + 'px' }"
      >
        <!-- IDLE STATE -->
        <div 
          v-if="!isQuickCreateActive" 
          class="flex items-center justify-between w-full text-text-secondary h-8"
        >
          <div 
            class="flex items-center gap-2 cursor-pointer hover:text-text-primary transition-colors group"
            @click.stop="toggleQuickCreate"
          >
            <div class="w-5 h-5 flex items-center justify-center rounded-full border border-border group-hover:border-primary-color transition-colors text-xs group-hover:text-primary-color">
              <i class="fa-solid fa-plus font-bold"></i>
            </div>
            <span class="text-[13px] font-medium group-hover:text-primary-color">Create</span>
          </div>

          <div class="flex items-center gap-4 text-[12px] text-text-secondary/80">
            <span class="font-medium">{{ totalCount }} of {{ totalTotal }}</span>
            <button 
              class="hover:text-primary-color transition-colors p-1" 
              @click.stop="emit('refresh')"
              title="Refresh table"
            >
              <i class="fa-solid fa-rotate-right transition-transform active:rotate-180"></i>
            </button>
          </div>
        </div>

        <!-- ACTIVE QUICK CREATE STATE -->
        <div 
          v-else 
          class="flex flex-col w-full border border-primary-color/60 rounded-md bg-bg-surface shadow-[0_0_0_1px_rgba(var(--primary-color-rgb),0.2)] overflow-hidden transition-all duration-200"
        >
          <div class="flex items-center px-3 py-1 gap-2">
            <div class="flex items-center gap-1 text-primary-color/80 cursor-pointer hover:text-primary-color transition-colors">
              <i class="fa-solid fa-sparkles text-sm"></i>
            </div>
            <input
              ref="quickCreateInputRef"
              v-model="quickCreateTitle"
              type="text"
              placeholder="What needs to be done?"
              :disabled="isCreating"
              class="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-secondary/50 h-7 disabled:opacity-50"
              @keydown.enter="handleQuickCreateSubmit"
              @keydown.esc="handleQuickCreateCancel"
            />
            <div class="flex items-center gap-3"> 
              <button 
                class="bg-primary-color hover:bg-primary-color/90 disabled:bg-primary-color/40 disabled:cursor-not-allowed text-white px-3 py-0.5 rounded text-[12px] font-medium flex items-center gap-1.5 transition-all h-7 min-w-[70px] justify-center"
                :disabled="!quickCreateTitle.trim() || isCreating"
                @click="handleQuickCreateSubmit"
              >
                <template v-if="isCreating">
                  <i class="fa-solid fa-spinner fa-spin text-[10px]"></i>
                  <span>Creating...</span>
                </template>
                <template v-else>
                  Create
                  <i class="fa-solid fa-level-down rotate-90 text-[10px] opacity-70"></i>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CreateTaskModal
      v-if="createTeamModal && route.path.includes('/plan')"
      v-model="createTeamModal"
      :selectedVariable="selected_view_by"
      :listId="localColumnData?.title"
      :sheet_id="selected_sheet_id"
    />
  </div>

  <!-- INSERT ROW TELEPORT -->
  <Teleport to="body">
    <div
      v-if="hoverIndex !== null && hoverRowRect && !hasActiveEmptyRow && !isTalent && selectedGroup !== 'owner'"
      class="fixed z-[9999]"
      :style="{
        top: hoverRowRect.top - 12 + 'px',
        left: hoverRowRect.left - 18 + 'px'
      }"
      @mouseenter="() => { isHoveringTeleport = true; cancelLeave() }"
      @mouseleave="() => { isHoveringTeleport = false; handleLeave() }"
    >
      <span
        @click.stop="startInlineQuickCreate(hoverIndex, hoverGroupTitle, hoverGroup)"
        class="bg-bg-surface border border-border w-6 h-6 text-sm rounded-md flex justify-center items-center shadow-sm hover:border-primary-color hover:text-primary-color cursor-pointer transition-colors"
      >
        <i class="fa-solid fa-plus text-xs"></i>
      </span>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
// ─── Imports ──────────────────────────────────────────────────────────────────
import { reactive, ref, nextTick, computed, watch, h, onUnmounted, defineAsyncComponent } from 'vue'
import { useRoute } from "vue-router";

const CreateTaskModal = defineAsyncComponent(() => import('../../../views/Product/modals/CreateTaskModal.vue'));
import { useRouteIds } from '../../../composables/useQueryParams';
import { useSheets, useVariables } from '../../../queries/useSheets';
import { useElementSize } from '@vueuse/core'
import EmptyState from '../../ui/EmptyState.vue'

// ─── State & Initialization ───────────────────────────────────────────────────
const { workspaceId } = useRouteIds();
const route = useRoute();
const createTeamModal = ref(false);
const localColumnData = ref();
const selected_module_id = ref<string>("");

// ─── Types ────────────────────────────────────────────────────────────────────
interface Column {
  key: string
  label: string
  visible?: boolean // optional, default true
}

type Row = Record<string, any>

// ─── Props & Emits ────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Row[]
  isPending: boolean
  canCreate?: boolean
  canCreateVariable?: boolean
  canDelete?: boolean
  isTalent?:boolean
  groups?: any[]
  isGrouped?: boolean
  selectedGroup?: string
  totalCount?: number
  totalTotal?: number
  isCreating?: boolean
}>(), {
  canCreate: true,
  canCreateVariable: true,
  canDelete: false,
  isGrouped: false,
  isCreating: false,
  groups: () => [],
  totalCount: 0,
  totalTotal: 0
})

// ─── Group Management ──────────────────────────────────────────────────────────
const expandedGroups = reactive<Record<string, boolean>>({})

watch(() => props.groups, (newGroups) => {
  if (newGroups && props.isGrouped) {
    newGroups.forEach((g: any) => {
      if (expandedGroups[g.title] === undefined) {
        expandedGroups[g.title] = true
      }
    })
  }
}, { immediate: true })

const toggleGroup = (title: string) => {
  expandedGroups[title] = !expandedGroups[title]
}

// ─── Sheets & Variables Integration ───────────────────────────────────────────

const { data: sheets } = useSheets(
  {
    workspace_id: workspaceId.value,
    workspace_module_id: selected_module_id,
  },
  
)
const sheetId = computed(() => (sheets.value ? sheets.value[0]?._id : ""));
const selected_sheet_id = ref<any>(sheetId);

const { data: variables } = useVariables(
  workspaceId,
  selected_module_id,
  selected_sheet_id
);

const viewBy = computed(() => (variables.value ? variables.value[0]?._id : ""));


const selected_view_by = ref(viewBy);
const emit = defineEmits<{
  (e: 'update:rows', val: Row[]): void
  (e: 'create', val: any): void
  (e: 'toggleVisibility', val: any, v: any): void
  (e: 'addVar'): void
  (e: 'delete', val: any): void
  (e: 'scroll', val: any): void
  (e: 'refresh'): void
  (e: 'quickCreate', title: string, group: any | null): void
}>()

// ─── Quick Create Logic ───────────────────────────────────────────────────────
const tickets = reactive<Row[]>(props.rows || [])

watch(() => props.rows, newRows => {
  if (newRows) tickets.splice(0, tickets.length, ...newRows)
})

const editing = reactive<{ id: string | number | null; field: string }>({ id: null, field: '' })
const hoverIndex = ref<number | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)

// Bottom Quick Create State
const isQuickCreateActive = ref(false)
const quickCreateTitle = ref('')
const quickCreateInputRef = ref<HTMLInputElement | null>(null)
const quickCreateContainerRef = ref<HTMLElement | null>(null)

// Viewport Ref
const tableViewport = ref<HTMLElement | null>(null)
const { width: viewportWidth } = useElementSize(tableViewport)

// Inline Quick Create State
const inlineQuickCreate = reactive({
  active: false,
  index: null as number | null,
  groupTitle: null as string | null,
  group: null as any,
  title: ''
})
const hoverGroup = ref<any>(null)
const inlineQuickCreateInputRef = ref<HTMLInputElement | null>(null)

// ─── Quick Create Actions ─────────────────────────────────────────────────────

function toggleQuickCreate() {
  isQuickCreateActive.value = !isQuickCreateActive.value
  if (isQuickCreateActive.value) {
    // Ensure inline is closed if bottom opens
    inlineQuickCreate.active = false
    nextTick(() => {
      quickCreateInputRef.value?.focus()
    })
  } else {
    quickCreateTitle.value = ''
  }
}

function startInlineQuickCreate(index: number, groupTitle: string | null = null, group: any = null) {
  if (groupTitle) {
    expandedGroups[groupTitle] = true
  }
  inlineQuickCreate.index = index
  inlineQuickCreate.groupTitle = groupTitle
  inlineQuickCreate.group = group          // ← store full group
  inlineQuickCreate.active = true
  inlineQuickCreate.title = ''
  isQuickCreateActive.value = false
  
  nextTick(() => {
    const inputEl = Array.isArray(inlineQuickCreateInputRef.value)
      ? inlineQuickCreateInputRef.value[0]
      : inlineQuickCreateInputRef.value
    inputEl?.focus()
  })
}

function handleQuickCreateSubmit() {
  const title = isQuickCreateActive.value ? quickCreateTitle.value : inlineQuickCreate.title
  const group = isQuickCreateActive.value ? null : inlineQuickCreate.group   // ← pass full group
  if (!title.trim() || props.isCreating) return
  
  emit('quickCreate', title.trim(), group)
}

defineExpose({
  closeQuickCreate: handleQuickCreateCancel
})

function handleQuickCreateCancel() {
  isQuickCreateActive.value = false
  quickCreateTitle.value = ''
  inlineQuickCreate.active = false
  inlineQuickCreate.title = ''
}

const hasActiveEmptyRow = computed(() =>
  tickets.some(t => editing.id === t.id && !t[editing.field])
)

// const editField = (ticket: Row, field: string) => {
//   editing.id = ticket.id
//   editing.field = field
//   nextTick(() => titleInput.value?.focus())
// }

// ─── Ticket Editing ───────────────────────────────────────────────────────────
const stopEditing = () => {
  editing.id = null
  editing.field = ''
}

const finishEdit = (ticket: Row) => {
  if (!ticket[editing.field]?.trim()) {
    const index = tickets.findIndex(t => t.id === ticket.id)
    if (index !== -1) tickets.splice(index, 1)
  }
  stopEditing()
  emit('update:rows', tickets.slice())
  emit('create', ticket)
}

// ─── Cell Rendering Logic ─────────────────────────────────────────────────────
function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  if (!path.includes('.')) return obj[path]
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

function cellValue(row: Row, col: any) {
  return col?.accessor ? col.accessor(row) : getByPath(row, col.key)
}

const RenderCell = (p: { row: Row; column: any; index: number }) => {
  const val = cellValue(p.row, p.column)
  if (p.column?.render) return p.column.render({ row: p?.row, column: p?.column, value: val, index: p?.index })
  return h('span', String(val ?? ''))
}

// ─── Column Resizing Logic ───────────────────────────────────────────────────
const columnWidths = reactive<Record<string, any>>({})

watch(() => props.columns, cols => {
  cols.forEach((col, indx) => {
    if (indx == 0) columnWidths[col.key] = 250 
    else if (!columnWidths[col.key]) columnWidths[col.key] = 150 
  })
}, { immediate: true })


let resizingCol: string | null = null
let startX = 0
let startWidth = 0

const startResize = (e: MouseEvent, colKey: string) => {
  resizingCol = colKey
  startX = e.clientX
  startWidth = columnWidths[colKey]

  document.addEventListener("mousemove", onResize)
  document.addEventListener("mouseup", stopResize)
}

const onResize = (e: MouseEvent) => {
  if (!resizingCol) return
  const dx = e.clientX - startX
  const newWidth = Math.max(80, startWidth + dx)
  columnWidths[resizingCol] = newWidth
}

const stopResize = () => {
  resizingCol = null
  document.removeEventListener("mousemove", onResize)
  document.removeEventListener("mouseup", stopResize)
}


// ─── Column Visibility ────────────────────────────────────────────────────────
const visibleColumnKeys = ref<string[]>(
  props.columns.filter(c => c.visible ?? true).map(c => c.key)
)

const visibleColumns = computed(() =>
  props.columns.filter(c => visibleColumnKeys.value.includes(c.key) &&  c.label.toLowerCase() !== 'process')
)

const showColumnMenu = ref(false)

// ─── Row Menu & Actions ───────────────────────────────────────────────────────
const activeMenuId = ref<string | number | null>(null)

const toggleRowMenu = (id: string | number) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = id
  }
}

// ─── Click Outside Logic ──────────────────────────────────────────────────────
const closeMenus = (e: Event) => {
  if (!(e.target as HTMLElement).closest('.column-menu')) {
    showColumnMenu.value = false
  }
  
  if (!(e.target as HTMLElement).closest('.row-action-btn') && !(e.target as HTMLElement).closest('.row-action-menu')) {
    activeMenuId.value = null
  }

  if (isQuickCreateActive.value && quickCreateContainerRef.value && !quickCreateContainerRef.value.contains(e.target as Node)) {
    isQuickCreateActive.value = false
    quickCreateTitle.value = ''
  }

  if (inlineQuickCreate.active) {
    const target = e.target as HTMLElement
    if (!target.closest('.inline-quick-create-row')) {
      inlineQuickCreate.active = false
      inlineQuickCreate.title = ''
    }
  }
}

const toggleColumn = (key: string) => {
  const index = visibleColumnKeys.value.indexOf(key)
  if (index === -1) {
    emit('toggleVisibility', key, true)
    visibleColumnKeys.value.push(key)
  } else {
    emit('toggleVisibility', key, false)
    visibleColumnKeys.value.splice(index, 1)
  }
}

document.addEventListener('click', closeMenus)

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})

// ─── Footer Logic ─────────────────────────────────────────────────────────────
const footerColspan = computed(() => {
  return 1 + visibleColumns.value.length + 1
})


// ─── Row Hover & Teleport Logic ───────────────────────────────────────────────
const isHoveringTeleport = ref(false)
let leaveTimeout: any = null
const hoverRowRect = ref<{ top: number; left: number; height: number } | null>(null)
const hoverGroupTitle = ref<string | null>(null)

const setHoverRow = (e: MouseEvent, index: number, groupTitle: string | null = null, group: any = null) => {
  const tr = (e.currentTarget as HTMLElement)
  const rect = tr.getBoundingClientRect()
  const viewportRect = tableViewport.value?.getBoundingClientRect();

  hoverIndex.value = index
  hoverGroupTitle.value = groupTitle
  hoverGroup.value = group 
  hoverRowRect.value = {
    top: rect.top,
    left: viewportRect?.left || rect.left,
    height: rect.height
  }
}

const handleLeave = () => {
  leaveTimeout = setTimeout(() => {
    if (!isHoveringTeleport.value) {
      hoverIndex.value = null
      hoverRowRect.value = null
    }
  }, 120) 
}

const cancelLeave = () => {
  clearTimeout(leaveTimeout)
}

</script>

<style scoped>
.hover-active-row td {
  border-top: 0.5px solid var(--primary-color) !important;
  position: relative;
  z-index: 40; /* Above sticky columns which are usually 20-30 */
}

/* Ensure the line stays visible on sticky cells */
.hover-active-row td.sticky {
  z-index: 41;
}

.inline-quick-create-row td {
  border: none !important;
}
</style>