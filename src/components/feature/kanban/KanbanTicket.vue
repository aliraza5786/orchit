<template>
    <div @click="$emit('click')" class="product-ticket relative bg-bg-card rounded-lg p-4 shadow-sm cursor-grab border-t-4
             hover:shadow-md transition-all duration-200 active:cursor-grabbing" :class="priorityBorderClass"
        :style="{ borderColor: ticket?.lane?.variables['lane-color'] }">

        <div class="flex justify-between gap-2 items-start mb-3">
            <div class="flex gap-2 flex-wrap items-center">
                <span v-if="ticket?.card_type?.title" class="text-[10px] px-2 py-1 rounded bg-bg-surface/60 text-text-secondary font-medium uppercase">
                    {{ ticket.card_type.title }}
                </span>
                <span v-if="ticket?.card_status?.title" class="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent font-medium">
                    {{ ticket.card_status.title }}
                </span>
            </div>

            <div class="product-menu-icon transition-all py-1 px-2 h-6 flex justify-center items-center duration-100 ease-in-out bg-bg-surface/40 rounded-md">
                <DropMenu @click.stop="" :items="getMenuItems()">
                    <template #trigger>
                        <i class="cursor-pointer text-sm fa-solid fa-ellipsis"></i>
                    </template>
                </DropMenu>
            </div>
        </div>

        <h3 class="text-sm font-medium text-card-foreground leading-tight mb-2">
            {{ ticket['card-title'] }}
        </h3>

        <p v-html="ticket['card-description']" v-once
            class="text-xs text-muted-foreground mb-3 text-text-secondary line-clamp-2">
        </p>

        <div class="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
            <div class="flex items-center gap-3">
                <div @click.stop>
                    <AssigmentDropdown :users="members" @assign="assignHandle" :assigneeId="ticket.assigned_to"
                        :seat="ticket?.seat" />
                </div>

                <div v-if="dueDate" class="flex items-center gap-1 text-xs text-text-secondary">
                    <i class="fa-regular fa-calendar text-[10px]"></i>
                    <span>{{ formatDate(dueDate) }}</span>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 text-xs text-text-secondary">
                    <i class="fa-regular fa-message text-[10px]"></i>
                    <span>{{ ticket?.comments_count }}</span>
                </div>
                <div class="flex items-center gap-1 text-xs text-text-secondary">
                    <i class="fa-regular fa-file text-[10px]"></i>
                    <span>{{ ticket?.attachments.length }}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="no-drag-zone" draggable="false" @mousedown.stop @touchstart.stop @pointerdown.stop>
        <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Ticket" itemLabel="Ticket"
            :itemName="ticket.title" :requireMatchText="ticket.title" confirmText="Delete Ticket" cancelText="Cancel"
            size="md" :loading="deletingTicket" @confirm="handleDeleteTicket" @cancel="() => {
                showDelete = false
            }">

        </ConfirmDeleteModal>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDeleteTicket, useMoveCard } from '../../../queries/useSheets'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../ui/DropMenu.vue'
import ConfirmDeleteModal from '../../../views/Product/modals/ConfirmDeleteModal.vue'
import AssigmentDropdown from '../../../views/Product/components/AssigmentDropdown.vue'
import { useWorkspacesRoles } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'
const { workspaceId } = useRouteIds();
const { data: members } = useWorkspacesRoles(workspaceId.value);

function formatDate(dateStr: string | null): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
        return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow'
    }

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return date.toLocaleDateString(undefined, options)
}



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
const dueDate = ref<string | null>(props.ticket['end-date'] ?? null)
watch(() => props.ticket?.['end-date'], v => { dueDate.value = v ?? null })
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
    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ['sheet-list']
        })
        showDelete.value = false
    }
})
// const handleSelect = (val: any) => {
//     moveCard.mutate({
//         card_id: props.ticket._id,
//         variables: val,
//     })
// }

function getMenuItems() {
    return [{
        label: 'Delete', danger: true, action: () => {
            showDelete.value = true
        }
    },
    ]
}
const handleDeleteTicket = () => {
    deleteCard({})
}
const assignHandle = (user: any) => {
    const payload = {
        card_id: props.ticket._id,
        seat_id: user?._id
    }
    moveCard.mutate(payload);

}
defineEmits(['click'])
</script>
<style scoped>
.product-menu-icon {
    visibility: hidden;
}

.product-ticket:hover .product-menu-icon {
    visibility: visible;
}
</style>