<template>
  <div class="h-full flex gap-3">
    <!-- Columns (horizontal) -->
    <Draggable v-model="localBoard.columns" item-key="_id" group="columns" :animation="180"
      :ghost-class="'kanban-ghost'" :chosen-class="'kanban-chosen'" :drag-class="'kanban-dragging'"
      :force-fallback="true" 
      :disabled="isMobile"
      class="flex gap-3"
      :class="{
        'overflow-x-auto snap-x snap-mandatory w-full pb-4 mobile-scroll-visible': isMobile,
        'min-w-max': !isMobile
      }"
      direction="horizontal" @end="onColumnsEnd" @start="onStart">
      <!-- Each column -->
      <template #item="{ element: column, index }">
        <div class="rounded-lg bg-bg-surface h-full " 
          :class="{ 
            'snap-center min-w-[270px] max-w-[270px]': isMobile,
            'min-w-[320px] max-w-[320px]': !isMobile 
          }"
        >
          <ProcessKanbanColumn 
             :listOwnerId="column._id"
             :plusIcon="plusIcon" 
             :canDragList="!isMobile" 
             @onPlus="(e) => emit('onPlus', e)" 
             @update:column="(e) => emit('update:column', e)"
             :index="index" :totalColumns="localBoard.columns.length"
             @select:ticket="(v: Ticket) => emit('select:ticket', v)"
             @delete:column="(e: any) => emit('delete:column', e)" 
             :column="column" 
             @reorder="onTicketEnd"
             @drag:start="onColumnDragStart"
             @move:column="handleMoveColumn">
            <template #emptyState="{ column }">
              <slot name="emptyState" :column="column"></slot>
            </template>

            <template #ticket="{ ticket, index }">
              <slot name="ticket" :ticket="ticket" :index="index">
              </slot>
            </template>
            <template #footer="{ column }">
              <slot name="column-footer" :column="column"></slot>
            </template>
          </ProcessKanbanColumn>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Draggable from 'vuedraggable'
import ProcessKanbanColumn from './ProcessKanbanColumn.vue'
import { useMediaQuery } from '@vueuse/core'

export interface Ticket { _id: string | number;[k: string]: any }
export interface Column { _id: string | number; title: string; transitions: Ticket[] }
export interface Board { columns: Column[] }

const isMobile = useMediaQuery('(max-width: 650px)')

const canDragList = ref(true); 
const dragSourceId = ref<string | number | null>(null);

const onStart = () => {
 // console.log(">>> strating");
  canDragList.value = false
};

const onColumnDragStart = (columnId: string | number) => {
  dragSourceId.value = columnId;
}


const props = withDefaults(defineProps<{
  board: Column[]
  onBoardUpdate?: (board: Board) => void
  plusIcon?:boolean
}>(), {plusIcon:true})

const emit = defineEmits<{
  /** v-model style if you want to two-way bind the board */
  (e: 'update:board', payload: Board): void
  (e: 'select:ticket', payload: Ticket): void
  (e: 'update:column', payload: any): void
  (e: 'delete:column', payload: any): void
  (e: 'onPlus', payload: any): void
  (e: 'reorder', payload: {
    type: 'column' | 'ticket'
    board: Board
    meta?: any
  }): void
}>()

/** Local mirror so we never mutate props directly (optimistic UI) */
const localBoard = ref<Board>(cloneBoard(props.board))

watch(() => props.board, (v) => {
  // Only replace when the reference changes (e.g. from server)
  localBoard.value = cloneBoard(v)
})

/** Column drag end -> columns array already reordered by vuedraggable */
function onColumnsEnd(e: any) {
  const oldIndex = e.oldIndex
  const newIndex = e.newIndex

  // Model should be updated now; grab the moved column
  const moved = localBoard.value.columns[newIndex]
  const id = moved?._id 
  const _id = moved?._id 

  if (id != null) {
    pushUpdate('column', { id, oldIndex, newIndex ,_id})
  }
  canDragList.value = true;
}

function onTicketEnd(e: any) {
  // Note: e is { moved: ..., fromColumnId: ..., toColumnId: ... }
  // If fromColumnId is missing (cross-column move), use the tracked dragSourceId
  if (!e.fromColumnId && dragSourceId.value) {
    e.fromColumnId = dragSourceId.value;
  }
  
  // Re-emit ticket reorder with meta
  pushUpdate('ticket', e)
  
  // Reset after a short delay or immediately? 
  // Safety: reset after processing
  // dragSourceId.value = null; 
}



/** Broadcast updates: emit + optional callback prop */
function pushUpdate(type: 'column' | 'ticket', meta?: any) {
  const board = localBoard.value
  emit('update:board', board)

  emit('reorder', { type, board, meta })
  props.onBoardUpdate?.(board)
}

function handleMoveColumn({ direction, column }: { direction: 'left' | 'right', column: Column }) {
  const columns = [...localBoard.value.columns] // Create a copy
  const idx = columns.findIndex(c => c._id === column._id)
 
  if (idx === -1) return

  let newIndex = idx
  if (direction === 'left' && idx > 0) {
    newIndex = idx - 1
  } else if (direction === 'right' && idx < columns.length - 1) {
    newIndex = idx + 1
  }

  if (newIndex !== idx) {
    // Swap using splice for clarity and safety with copies
    const [movedColumn] = columns.splice(idx, 1)
    columns.splice(newIndex, 0, movedColumn)
    
    // Assign back to trigger reactivity
    localBoard.value.columns = columns
    
    // Trigger update
    const moved = columns[newIndex]
    const id = moved?._id 
    const _id = moved?._id 

    if (id != null) {
      pushUpdate('column', { id, oldIndex: idx, newIndex, _id })
    }
  }
}

/** Helpers */
function cloneBoard(b: Column[]): Board {
  return {
    columns: (b?.length > 0 ? b : []).map(c => ({
      ...c,
      title: c?.title,
      transitions: (c.transitions ?? []).map(t => ({ ...t }))
    }))
  }
}
</script>


<style scoped>
/* Drag classes from vuedraggable / SortableJS */
.kanban-ghost {
  opacity: 0.6;
  transform: rotate(2deg) scale(0.98);
}

.kanban-chosen {
  outline: 2px dashed rgba(0, 0, 0, .15);
}

.kanban-dragging {
  cursor: grabbing !important;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<style>
/* Global override for mobile scrollbar visibility in Kanban */
.mobile-scroll-visible::-webkit-scrollbar {
  display: block !important;
  height: 8px !important; /* Visible height */
}

.mobile-scroll-visible::-webkit-scrollbar-track {
  background: var(--bg-body) !important;
  border-radius: 4px;
}

.mobile-scroll-visible::-webkit-scrollbar-thumb {
  background-color: var(--border) !important;
  border-radius: 4px;
  border: 2px solid var(--bg-body) !important; /* Creates padding effect */
}

.mobile-scroll-visible::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-secondary) !important;
}

/* Ensure firefox supports it too if possible, though 'scrollbar-width: auto' usually handles it */
.mobile-scroll-visible {
  scrollbar-width: auto !important;
  scrollbar-color: var(--border) var(--bg-body) !important;
}
</style>
