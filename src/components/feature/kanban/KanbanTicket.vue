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
                    class="text-[10px] px-2 py-1 h-6 rounded bg-primary-color/20 text-primary-color font-medium capitalize">
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

        <h3   :title="ticket['card-title']" class="text-sm font-medium text-card-foreground leading-tight mb-2 capitalize line-clamp-2 break-words">
            {{ ticket['card-title'] }}
        </h3>

        <p v-html="ticket['card-description']"
            class="card-description text-xs text-muted-foreground mb-3 text-text-secondary line-clamp-2 max-h-20">
        </p>

        <div v-if="!footer" class="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
            <div class="flex items-center gap-3 flex-1">
                <div @click.stop>
                    <AssigmentDropdown :disabled="!canAssignCard" :users="members" @assign="assignHandle" :assigneeId="ticket.seat_id"
                        :seat="ticket?.seats" />
                </div>

                <div @click.stop
                    class="flex items-center gap-2 text-nowrap overflow-ellipsis text-xs text-text-secondary">
                    <DatePicker :disabled="!canEditCard" :inSpace="true" placeholder="end date" :model-value="dueDate" theme="dark" emit-as="ymd"
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
const { canDeleteCard,  canAssignCard, canEditCard } = usePermissions()

const { workspaceId } = useRouteIds();
const { data: members } = useWorkspacesRoles(workspaceId.value);



import { 
    removeFromCacheStructure, 
    performOptimisticUpdate,
    rollbackOptimisticUpdate
} from '../../../utilities/cacheSync'
import { useSidePanelStore } from '../../../stores/sidePanelStore'

const sidePanelStore = useSidePanelStore()

const props = defineProps<{
    ticket: any
    selectedVar?: any
    footer?: boolean
    invalidateKeys?: string[]
    workspaceId?: any
    moduleId?: any
}>()

const invalidateKeys = computed(() => props.invalidateKeys || ['sheet-list'])
const detailKey = computed(() => ['cardDetail', String(props.ticket._id)])
 
// type Priority = 'low' | 'medium' | 'high' | 'critical';

const priorityBorderMap: Record<string, string> = {
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
        const allKeys = [...invalidateKeys.value, 'sheet-list', 'get-sheets', 'roles', 'people-lists'];
        [...new Set(allKeys)].forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] })
        })
        queryClient.invalidateQueries({ queryKey: detailKey.value })
    }
})

const { mutate: deleteCard, isPending: deletingTicket } = useDeleteTicket(props.ticket._id, {
    onSuccess: async () => {
        invalidateKeys.value.forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] })
        })
        queryClient.invalidateQueries({ queryKey: detailKey.value })
        showDelete.value = false
        toast.success("Ticket deleted successfully")
    }
})

const handleDeleteTicket = async () => {
    const cardId = String(props.ticket._id)
    const snapshots: { queryKey: any; data: any }[] = []

    // ── 1. Optimistically remove from all provided caches ────────────────────
    const allCacheKeys = [...invalidateKeys.value, 'sheet-list', 'sprint-kanban', 'table-cards-flat', 'sprint-table-flat']
    
    // Board Caches
    allCacheKeys.forEach(key => {
        queryCacheUpdater([key], (data) => removeFromCacheStructure(data, cardId), snapshots)
    })

    // Detail Cache (SidePanel)
    queryCacheUpdater(detailKey.value, () => null, snapshots)

    deleteCard({}, {
        onError: () => rollbackSnapshots(snapshots)
    })
}

/**
 * Helper to update query cache with snapshotting
 */
function queryCacheUpdater(key: any[], updater: (data: any) => any, snapshots: any[]) {
    queryClient.setQueriesData({ queryKey: key, exact: false }, (oldData: any) => {
        if (!oldData) return oldData
        snapshots.push({ queryKey: key, data: oldData })
        return updater(oldData)
    })
}

function rollbackSnapshots(snapshots: any[]) {
    rollbackOptimisticUpdate(queryClient, snapshots)
}

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

const assignHandle = (users: any[]) => {
    // Correctly extract IDs whether the input is an object or a string ID
    const userIds = users.map(u => typeof u === 'string' ? u : (u?._id || u?.id)).filter(Boolean)
    // Maintain local consistency for seat (single) and seats (multiple)
    const primarySeat = users.length > 0 ? users[0] : null
    
    const snapshots = performOptimisticUpdate({
        queryClient,
        sidePanelStore,
        cardId: props.ticket._id,
        updates: { 
            seat_id: userIds, 
            seat: primarySeat, 
            seats: users 
        },
        invalidateKeys: invalidateKeys.value
    })

    moveCard.mutate(
        { card_id: props.ticket._id, seat_id: userIds },
        { 
            onError: () => rollbackSnapshots(snapshots),
            // Don't invalidate immediately to avoid flashing/resetting while user is still selecting
            onSuccess: () => {
                // We still want to invalidate eventually, but maybe not on every single click if fast
                // TanStack Query handles deduplication of invalidations anyway
            }
        }
    )
}

const setDueDate = (date: string | null) => {
    const snapshots = performOptimisticUpdate({
        queryClient,
        sidePanelStore,
        cardId: props.ticket._id,
        updates: { 'end-date': date },
        invalidateKeys: invalidateKeys.value
    })

    moveCard.mutate(
        { card_id: props.ticket._id, variables: { 'end-date': date } },
        { onError: () => rollbackSnapshots(snapshots) }
    )
}

const { workspaceId: routeWorkspaceId, moduleId: routeModuleId } = useRouteIds();
const effectiveWorkspaceId = computed(() => props.workspaceId || routeWorkspaceId.value);
const effectiveModuleId = computed(() => props.moduleId || routeModuleId.value);

const { data: variables } = useVariables(effectiveWorkspaceId, effectiveModuleId, ref(""))
const selectedVarSlug = computed(() => (variables?.value ?? []).filter((e: any) => e._id == props.selectedVar))

const statusOptions = computed<string[]>(() => {
  const statusVar = (variables?.value ?? []).find(
    (v: any) => v.slug === 'card-status' || v.slug === 'status' || v.title?.toLowerCase() === 'status'
  )
  if (!statusVar?.data) return []
  return (statusVar.data as any[]).map((d: any) => String(d.value ?? d)).filter(Boolean)
})

function changeStatus(newStatus: string) {
    localStatus.value = newStatus
    
    const snapshots = performOptimisticUpdate({
        queryClient,
        sidePanelStore,
        cardId: props.ticket._id,
        updates: { 'card-status': newStatus },
        invalidateKeys: invalidateKeys.value
    })

    moveCard.mutate(
        { card_id: props.ticket._id, variables: { 'card-status': newStatus } },
        { onError: () => {
            localStatus.value = props.ticket['card-status'] ?? null
            rollbackSnapshots(snapshots)
        }}
    )
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
.card-description :deep(a){
  color: var(--color-text-primary, #6b7280) !important;
  text-decoration: underline !important;
}
</style>