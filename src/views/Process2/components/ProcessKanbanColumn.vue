<template>
  <div class="flex bg-bg-body flex-col min-h-[565px] h-full w-full rounded-lg transition-all duration-200"
    :style="{ borderColor: column.color }">
    <!-- Column header -->
    <div class="flex items-center justify-between w-full p-4 border-b border-border cursor-grab">
      <div class="flex items-center gap-2 flex-auto max-w-4/5">
        <span class="font-semibold text-foreground">{{ column.title }}</span>
        <span class="text-xs bg-muted bg-bg-card aspect-square flex justify-center items-center text-muted-foreground p-1 min-w-6 rounded-full">
          {{ column.transitions ? column.transitions.length : 0 }}
        </span>
      </div>
      <i class="cursor-pointer fa-solid fa-plus" v-if="plusIcon" @click="emit('onPlus', column)" />

      <DropMenu :items="getMenuItems()">
        <template #trigger>
          <i class="fa-solid fa-ellipsis cursor-pointer"></i>
        </template>
      </DropMenu>
    </div>

    <!-- Tickets list -->
    <Draggable :disabled="!canDragList" v-model="localTickets" item-key="_id"
      :data-column-id="column._id"
      class="flex-1 p-4 space-y-3 overflow-y-auto" :group="{ name: 'tickets', pull: true, put: true }" :animation="180"
      :ghost-class="'kanban-ghost'" :chosen-class="'kanban-chosen'" @start="onStart" @end="onEnd"
      :drag-class="'kanban-dragging'" @change="onTicketsChange">
      <template #item="{ element: ticket, index }">
        <div>
          <slot name="ticket" :ticket="ticket" :index="index"></slot>
        </div>
      </template>
      <template #footer>
        <slot v-if="!localTickets.length" name="emptyState" :column="column"></slot>
      </template>
    </Draggable>

    <slot name="footer" :column='column'></slot>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Draggable from 'vuedraggable'
import DropMenu from '../../../components/ui/DropMenu.vue'

import { useWorkspaceStore } from '../../../stores/workspace'

type Id = string | number
export interface Ticket { _id: Id;[k: string]: any }
export interface Column { _id: Id; title: string; transitions: any; color?: string; showADDNEW?: any }

const props = defineProps<{ 
  column: Column, 
  canDragList: boolean, 
  plusIcon: boolean,
  index?: number,
  totalColumns?: number,
  listOwnerId?: Id
}>()

const emit = defineEmits<{
  (e: 'update:column', payload: { title: string, oldTitle: string }): void
  (e: 'delete:column', payload: { columnId: Id; title: string }): void
  (e: 'onPlus', payload: any): void
  (e: 'reorder', payload: any): void
  (e: 'select:ticket', payload: Ticket): void
  (e: 'move:column', payload: { direction: 'left' | 'right', column: Column }): void
}>()

const workspaceStore = useWorkspaceStore()
const onStart = () => {
  // workspaceStore.setTransition({ ...props?.column?.transitions, currentColumn: props.column?.title })
}
const onEnd = () => {
  // workspaceStore.setTransition({})
}
/** Inline title editing state */
const isEditingTitle = ref(false)
const localTitle = ref(props.column.title)
const titleInputRef = ref<HTMLInputElement | null>(null)

watch(() => props.column.title, (v) => { localTitle.value = v })

function beginEdit() {
  isEditingTitle.value = true
  nextTick(() => {
    if (titleInputRef.value) {
      titleInputRef.value.focus()
      titleInputRef.value.select()
    }
  })
}

function commitTitle() {
  const newTitle = (localTitle.value ?? '').trim() || 'Untitled'
  if (newTitle !== props.column.title) {
    emit('update:column', { ...props.column, title: newTitle, oldTitle: props.column.title })
  } else {
    localTitle.value = props.column.title
  }

  isEditingTitle.value = false
}

function cancelTitle() {
  localTitle.value = props.column.title
  isEditingTitle.value = false
}

/** Tickets local mirror */
const localTickets = ref<Ticket[]>([...(props.column.transitions ?? [])])
watch(() => props.column.transitions, (v) => { localTickets.value = [...(v ?? [])] })


/** Sortable change */
function onTicketsChange(evt: any) {
  const moved = evt.moved ?? evt.added
  if (!moved) return
  
  // Robustly get fromColumnId using dataset, preserving fallback just in case
  const fromColumnId = evt.from?.dataset?.columnId ?? props.listOwnerId ?? props.column?._id;

  emit('reorder', {
    moved: moved.element,
    fromColumnId: fromColumnId,
    toColumnId: props.column._id,
    oldIndex: moved.oldIndex ?? null,
    newIndex: moved.newIndex ?? null,
  })
}

function getMenuItems() {
  const items: any[] = [];
    items.push({
      label: 'Delete',
      danger: true,
      action: () => handleDeleteColumn(),
    });
  return items;
}

const handleDeleteColumn = () => {
  emit('delete:column', { title: props.column.title, columnId: props.column?._id })
}
</script>
