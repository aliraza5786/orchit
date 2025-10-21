<template>
  <div class="h-full flex  gap-3 relative">
    <div v-if="isRefetching" class="absolute top-2 right-2 z-10">
      <div class="bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary flex items-center gap-2 shadow-sm">
        <i class="fa-solid fa-rotate animate-spin"></i>
        Refreshing...
      </div>
    </div>
    <Draggable v-model="localBoard.columns" item-key="_id" group="columns" :animation="180"
      :ghost-class="'kanban-ghost'" :chosen-class="'kanban-chosen'" :drag-class="'kanban-dragging'"
      :force-fallback="true" class="flex gap-3 min-w-max" direction="horizontal" @end="onColumnsEnd">
      <!-- Each column -->
      <template #item="{ element: column }">
        <div class="min-w-[320px] max-w-[320px] rounded-lg bg-bg-surface  " style="height: calc(100dvh - 190px);">
          <KanbanColumn @onPlus="(e) => emit('onPlus', e)" :sheet_id="sheet_id" :variable_id="variable_id"
            @update:column="(e) => emit('update:column', e)" @select:ticket="(v: Ticket) => emit('select:ticket', v)"
            @delete:column="(e: any) => emit('delete:column', e)" :column="column" @reorder="onTicketEnd">
            <template #emptyState="{ column }">
              <slot name="emptyState" :column="column"></slot>
            </template>

            <template #ticket="{ ticket }">
              <slot name="ticket" :ticket="ticket" >
              </slot>
            </template>
            <template #footer="{ column }">
              <slot name="column-footer" :column="column"></slot>
            </template>
          </KanbanColumn>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Draggable from 'vuedraggable'
import KanbanColumn from './KanbanColumn.vue'
export interface Ticket { _id: string | number;[k: string]: any }
export interface Column { _id: string | number; title: string; cards: Ticket[]; transitions: any }
export interface Board { columns: Column[] }

const props = withDefaults(defineProps<{
  board: Column[]
  onBoardUpdate?: (board: Board) => void
  variable_id: string
  sheet_id: string
  isRefetching?: boolean
}>(), {
  isRefetching: false
})

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
    meta?: {
      cardId?: string | number
      fromColumnId?: string | number
      toColumnId?: string | number
      oldIndex?: number
      newIndex?: number
    }

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
  const id = moved?.title ? moved?.title : ""

  if (id != null) {
    pushUpdate('column', { id, oldIndex, newIndex })
  }

}

function onTicketEnd(e: any) {
  console.log(e);

  pushUpdate('ticket', e)
}


/** Broadcast updates: emit + optional callback prop */
function pushUpdate(type: 'column' | 'ticket', meta?: any) {
  const board = localBoard.value
  emit('update:board', board)

  emit('reorder', { type, board, meta })
  props.onBoardUpdate?.(board)
}

/** Helpers */
function cloneBoard(b: Column[]): Board {
  return {
    columns: (b?.length > 0 ? b : []).map(c => ({
      _id: c?._id,
      title: c?.title,
      transitions: c.transitions,
      cards: (c?.cards ?? []).map(t => ({ ...t }))
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
</style>