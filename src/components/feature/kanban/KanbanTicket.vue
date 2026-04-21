<template>
    <div @click="() => {
        emit('select')
    }" class="product-ticket relative bg-bg-card rounded-lg p-4 shadow-sm cursor-grab border-t-4
             hover:shadow-md transition-all duration-200 active:cursor-grabbing" :class="priorityBorderClass"
        :style="{ borderColor: ticket?.lane?.variables['lane-color'] }">
        <div class="flex justify-between gap-2 items-start mb-3">
            <div class="flex gap-2 flex-wrap items-center"> 
                <span v-if="ticket['card-type'] || ticket['card-type']=== null && selectedVarSlug[0]?.slug != 'card-type'"
                    class="text-[10px] px-2 py-1 h-6 rounded bg-bg-surface/60 text-text-secondary font-medium captalize">
                    {{ ticket['card-type'] && ticket['card-type'] !== '' ? ticket['card-type'] : 'General' }}
                </span>
                <span v-if="localStatus && selectedVarSlug[0]?.slug != 'card-status'"
                    class="text-[10px] px-2 py-1 h-6 rounded bg-accent/20 text-accent font-medium capitalize">
                    {{ localStatus }}
                </span>
            </div>

            <div
                v-if="canDeleteCard || canEditCard"
                class="product-menu-icon transition-all w-6 py-1 px-2 h-6 flex justify-center items-center duration-100 ease-in-out bg-bg-surface/40 rounded-md"
                :class="{ 'menu-open': isMenuOpen }"
            >
                <DropMenu @click.stop="" :items="getMenuItems()" @open-change="(v) => isMenuOpen = v">
                    <template #trigger>
                        <i class="cursor-pointer text-sm fa-solid fa-ellipsis"></i>
                    </template>
                </DropMenu>
            </div>
        </div>

        <h3 class="text-sm font-medium text-card-foreground leading-tight mb-2 capitalize">
            {{ ticket['card-title'] }}
        </h3>

        <p v-html="ticket['card-description']"
            class="text-xs text-muted-foreground mb-3 text-text-secondary line-clamp-2 max-h-20">
        </p>

        <div v-if="!footer" class="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
            <div class="flex items-center gap-3 flex-1">
                <div v-if="canAssignCard || canViewCard ">
                    <AssigmentDropdown :users="members" @assign="assignHandle" :assigneeId="ticket.seat_id"
                        :seat="ticket?.seats" />
                </div>

                <div @click.stop
                    class="flex items-center gap-2 text-nowrap overflow-ellipsis text-xs text-text-secondary">
                    <DatePicker placeholder="end date" :model-value="dueDate" theme="dark" emit-as="ymd"
                        @update:modelValue="setDueDate" />
                </div>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 text-xs text-text-secondary">
                    <i class="fa-regular fa-message text-[10px]"></i>
                    <span>{{ ticket?.comments_count }}</span>
                </div>
                <div v-if="ticket?.attachments" class="flex items-center gap-1 text-xs text-text-secondary">
                    <i class="fa-regular fa-file text-[10px]"></i>
                    <span>{{ ticket?.attachments?.length }}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="no-drag-zone" draggable="false" @mousedown.stop @touchstart.passive.stop @pointerdown.stop>
        <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Ticket" itemLabel="Ticket"
            :itemName="ticket.title" :requireMatchText="ticket.title" confirmText="Delete Ticket" cancelText="Cancel"
            size="md" :loading="deletingTicket" @confirm="handleDeleteTicket" @cancel="() => {
                showDelete = false
            }">
        </ConfirmDeleteModal>
    </div>
</template>

<script setup lang="ts">
/**
 * KanbanTicket Component
 *
 * Renders an individual card within the Kanban board.
 * 
 * Features:
 * - Dynamic priority borders and lane coloring.
 * - Context menu for managing the ticket (e.g., Change Status, Delete).
 * - "Optimistic UI" updates for status changes: moving a card visually updates
 *   the board and ticket badge instantly before the API request completes, rolling back on failure.
 */
import { computed, ref, watch } from 'vue'
import { useDeleteTicket, useMoveCard, useVariables } from '../../../queries/useSheets'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../ui/DropMenu.vue'
import ConfirmDeleteModal from '../../../views/Product/modals/ConfirmDeleteModal.vue'
import AssigmentDropdown from '../../../views/Product/components/AssigmentDropdown.vue'
import DatePicker from '../../../views/Product/components/DatePicker.vue'
import { useWorkspacesRoles } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'

import { usePermissions } from '../../../composables/usePermissions'
import { toast } from 'vue-sonner'
const { canDeleteCard,  canAssignCard, canViewCard, canEditCard } = usePermissions()

const { workspaceId, moduleId } = useRouteIds();
const { data: members } = useWorkspacesRoles(workspaceId.value);



type Priority = any
export interface Ticket {
    _id: string | number
    title: string
    description?: string
    priority: Priority
    color_code: string
    card_type_id: any
    card_status_id: any
    priority_id: any
    card_code: string
    start_date: string
    end_date: string
}

const props = defineProps<{
    ticket: any
    selectedVar?: any
    footer?:boolean 
}>() 

const priorityBorderMap: Record<Priority, string> = {
    critical: 'border-l-priority-critical',
    high: 'border-l-priority-high',
    medium: 'border-l-priority-medium',
    low: 'border-l-priority-low',
}
const priorityBorderClass = computed(
    () => priorityBorderMap[props.ticket.priority] ?? 'border-l-gray-300'
)
const showDelete = ref(false)
const isMenuOpen = ref(false)
const dueDate = ref<string | null>(props.ticket['end-date'] ?? null)
const startDate = ref<string | null>(props.ticket['start-date'] ?? null)
// Optimistic status — updates instantly without waiting for API
const localStatus = ref<string | null>(props.ticket['card-status'] ?? null)
watch(() => props.ticket?.['end-date'], v => { dueDate.value = v ?? null })
watch(() => props.ticket?.['start-date'], v => { startDate.value = v ?? null })
// Keep localStatus in sync if ticket is refreshed from the server
watch(() => props.ticket?.['card-status'], v => { localStatus.value = v ?? null })
const queryClient = useQueryClient()
const moveCard = useMoveCard({
    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ['people-lists']
        })
        queryClient.invalidateQueries({
            queryKey: ['get-sheets']
        })
        queryClient.invalidateQueries({
            queryKey: ['sheet-list']
        })
        queryClient.invalidateQueries({
            queryKey: ['roles']
        })
    }
})
const { mutate: deleteCard, isPending: deletingTicket } = useDeleteTicket(props.ticket._id, {
    onSuccess: async() => {
       await queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
       await queryClient.invalidateQueries({ queryKey: ['sprint-kanban'] })
       await queryClient.invalidateQueries({ queryKey: ['table-cards-flat'] })
       await queryClient.invalidateQueries({ queryKey: ['sprint-table-flat'] })
       showDelete.value = false
       toast.success("Ticket deleted successfully");
    }
})
// const handleSelect = (val: any) => {
//     moveCard.mutate({
//         card_id: props.ticket._id,
//         variables: val,
//     })
// }

function getMenuItems() {
  const items: any[] = []

  // Change status submenu
  if (statusOptions.value.length) {
    items.push({
      label: 'Change status',
      danger: false,
      children: statusOptions.value.map((s: string) => ({
        label: s,
        danger: false,
        action: () => changeStatus(s),
      })),
    })
  }

  // Delete
  if (canDeleteCard.value) {
    items.push({
      label: 'Delete',
      danger: true,
      action: () => {
        showDelete.value = true
      },
    })
  }

  return items
}

const handleDeleteTicket = () => {
    deleteCard({})
}
const assignHandle = (users: any[]) => {
    const payload = {
        card_id: props.ticket._id,
        seat_id: users.map(u => u._id || u.id).filter(Boolean)
    }
    moveCard.mutate(payload);
}

// const setStartDate = (date: string | null) => {
//     moveCard.mutate({
//         card_id: props.ticket._id,
//         variables: { 'start-date': date }
//     })
// }

const setDueDate = (date: string | null) => {
    moveCard.mutate({
        card_id: props.ticket._id,
        variables: { 'end-date': date }
    })
}

const { data: variables } = useVariables(workspaceId, moduleId, ref(""))
const selectedVarSlug = computed(() => (variables?.value ?? []).filter((e: any) => e._id == props.selectedVar))

// Derive status options from the card-status variable's data values
const statusOptions = computed<string[]>(() => {
  const statusVar = (variables?.value ?? []).find(
    (v: any) => v.slug === 'card-status' || v.slug === 'status' || v.title?.toLowerCase() === 'status'
  )
  if (!statusVar?.data) return []
  return (statusVar.data as any[]).map((d: any) => String(d.value ?? d)).filter(Boolean)
})

/**
 * Updates the ticket's status optimistically.
 * It immediately updates the local UI badge and moves the card within the 
 * TanStack query cache so the Kanban board reflects the change instantly.
 * If the API call fails, the changes are rolled back.
 * 
 * @param {string} newStatus - The new status to apply to the card.
 */
function changeStatus(newStatus: string) {
  // ── 1. Optimistic local badge ──────────────────────────────────────────────
  localStatus.value = newStatus

  // ── 2. Snapshot current cache for rollback ────────────────────────────────
  const snapshots: { queryKey: any; data: any }[] = []

  // ── 3. Optimistically move the card in the board caches ───────────────────
  
  // A. Product/Sheet View (Key: sheet-list)
  // Structure: { sheets: [{ sheet_lists: [{ title, cards: [] }] }] }
  queryClient.setQueriesData(
    { queryKey: ['sheet-list'], exact: false },
    (oldData: any) => {
      if (!oldData?.sheets) return oldData
      snapshots.push({ queryKey: ['sheet-list'], data: oldData })
      return {
        ...oldData,
        sheets: oldData.sheets.map((sheet: any) => ({
          ...sheet,
          sheet_lists: moveBetweenColumns(sheet.sheet_lists ?? [], String(props.ticket._id), newStatus),
        })),
      }
    }
  )

  // B. Sprint/Plan View (Key: sprint-kanban)
  // Structure: { groups: [{ title, cards: [] }] }
  queryClient.setQueriesData(
    { queryKey: ['sprint-kanban'], exact: false },
    (oldData: any) => {
      if (!oldData?.groups) return oldData
      snapshots.push({ queryKey: ['sprint-kanban'], data: oldData })
      return {
        ...oldData,
        groups: moveBetweenColumns(oldData.groups ?? [], String(props.ticket._id), newStatus),
      }
    }
  )

  // ── 4. Fire the API ────────────────────────────────────────────────────────
  moveCard.mutate(
    {
      card_id: props.ticket._id,
      variables: { 'card-status': newStatus },
    },
    {
      onSuccess: () => {
        // Let the normal invalidation logic handle any further refreshes
      },
      onError: () => {
        // ── Rollback cache + badge ───────────────────────────────────────────
        localStatus.value = props.ticket['card-status'] ?? null
        snapshots.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data)
        })
      },
    }
  )
}

/**
 * Moves a card identified by cardId to the column whose title matches newStatus.
 * If the target column doesn't exist, the card just gets its card-status field updated in-place.
 */
function moveBetweenColumns(sheetLists: any[], cardId: string, newStatus: string): any[] {
  let cardToMove: any = null

  // Remove card from wherever it currently lives
  const listsWithout = sheetLists.map((col: any) => {
    const idx = (col.cards ?? []).findIndex(
      (c: any) => String(c._id) === cardId || String(c.id) === cardId
    )
    if (idx !== -1) {
      cardToMove = { ...(col.cards[idx]), 'card-status': newStatus }
      return { ...col, cards: col.cards.filter((_: any, i: number) => i !== idx) }
    }
    return col
  })

  if (!cardToMove) return sheetLists

  // Insert into target column
  const targetIdx = listsWithout.findIndex(
    (col: any) => col.title?.toLowerCase() === newStatus?.toLowerCase()
  )

  if (targetIdx !== -1) {
    // Add to the top of the target column so it's immediately visible
    return listsWithout.map((col: any, i: number) =>
      i === targetIdx
        ? { ...col, cards: [cardToMove, ...col.cards] }
        : col
    )
  }

  // Target column not found (status not in board) — just update the field in-place
  return sheetLists.map((col: any) => ({
    ...col,
    cards: (col.cards ?? []).map((c: any) =>
      String(c._id) === cardId || String(c.id) === cardId
        ? { ...c, 'card-status': newStatus }
        : c
    ),
  }))
}

const emit = defineEmits(['select'])
</script>
<style scoped>
.product-menu-icon {
    visibility: hidden;
}

.product-ticket:hover .product-menu-icon,
.product-menu-icon.menu-open {
    visibility: visible;
}
</style>