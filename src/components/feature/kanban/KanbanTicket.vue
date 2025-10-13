<template>
    <div @click="$emit('click')" class=" bg-bg-card rounded-lg p-4 pt-0 shadow-sm cursor-grab border-t-4
             hover:shadow-md transition-all duration-200 active:cursor-grabbing" :class="priorityBorderClass"
        :style="{ borderColor: ticket?.lane?.variables['lane-color'] }">
        <div class="flex justify-between gap-2 items-center">
            <div class="flex gap-2 py-2 flex-wrap ">
                <TypeChanger v-for="(item, index) in ticket.variables"
                    v-show="item?.type === 'Select' && item?.visible_on_card" :key="index" @click.stop
                    :default="item?.value" :data="item?.data" :cardId="ticket?._id"
                    @onselect="(val) => handleSelect(val)" />
            </div>
            <DropMenu @click.stop="" :items="getMenuItems()">
                <template #trigger>
                    <i class=" cursor-pointer fa-solid fa-ellipsis"></i>
                </template>
            </DropMenu>
        </div>
        <div class="flex items-start justify-between mb-2">
            <h3 class="text-sm font-medium text-card-foreground leading-tight">
                {{ ticket['card-title'] }}
            </h3>
        </div>
        <p v-html="ticket['card-description']" v-once
            class="text-xs text-muted-foreground mb-3 text-text-secondary line-clamp-2">
        </p>
        <!-- Footer Meta -->
        <div class="flex justify-between items-center mt-2">
            <div class="flex items-center gap-2 text-xs  text-text-secondary uppercase">
                <img src="../../../assets/icons/ticket.svg" class="w-4" alt="ticket" />
                <span>{{ ticket['card-code'] }}</span>
            </div>

            <!-- Assignment trigger (stops bubbling) -->
            <div @click.stop>
                <AssigmentDropdown :users="members" @assign="assignHandle" :assigneeId="ticket.assigned_to" :seat="ticket?.seat" />
            </div>
        </div>

        <!-- Bottom Info -->
        <div @click.stop class="flex gap-2 text-xs text-text-secondary mt-2">
            <DatePicker placeholder="set start date" :model-value="startDate" theme="dark" emit-as="ymd"
                @update:modelValue="setStartDate" /> -
            <DatePicker placeholder="set end date" :model-value="dueDate" theme="dark" emit-as="ymd"
                @update:modelValue="setDueDate" />
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
import TypeChanger from '../../../views/Product/components/TypeChanger.vue'
import DatePicker from '../../../views/Product/components/DatePicker.vue'
import { useDeleteTicket, useMoveCard } from '../../../queries/useSheets'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../ui/DropMenu.vue'
import ConfirmDeleteModal from '../../../views/Product/modals/ConfirmDeleteModal.vue'
import AssigmentDropdown from '../../../views/Product/components/AssigmentDropdown.vue'
import { useWorkspacesRoles } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'
const {workspaceId} = useRouteIds();
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
watch(() => props.ticket?.end_date, v => { dueDate.value = v ?? null })
const sd = computed(() => props.ticket['start-date'])
const ed = computed(() => props.ticket['end-date'])
const startDate = ref<string | null>(props.ticket['start-date'] ?? null)
watch(sd, () => startDate.value = sd.value)
watch(ed, () => dueDate.value = ed.value)

function setDueDate(v: string | null) {
    if (!props.ticket?._id) return
    dueDate.value = v
    moveCard.mutate({
        card_id: props.ticket._id,
        end_date: v
    })
}
function setStartDate(v: string | null) {
    if (!props.ticket?._id) return
    startDate.value = v
    moveCard.mutate({
        card_id: props.ticket._id,
        start_date: v
    })
}
const queryClient = useQueryClient()
const moveCard = useMoveCard({
    onSuccess: () => {
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
const handleSelect = (val: any) => {
    moveCard.mutate({
        card_id: props.ticket._id,
        variables: val,
    })
}

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
    moveCard.mutate(payload)
}
defineEmits(['click'])
</script>