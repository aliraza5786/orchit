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
        <div class="flex justify-end pt-2 items-center text-xs gap-4  text-text-secondary">
            <div class="flex justify-center items-center text-xs gap-1 text-text-secondary ">
                <i class="fa-regular fa-message"></i>
                {{ ticket?.comments_count }}
            </div>
            <div class="flex justify-center items-center text-xs gap-1 text-text-secondary ">
                <i class="fa-regular fa-file"></i>
                {{ ticket?.attachments.length }}
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
import { useDeleteTicket, useMoveCard } from '../../../queries/useSheets'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../../components/ui/DropMenu.vue'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'
import DatePicker from '../../../views/Product/components/DatePicker.vue'

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
const handleSelect = (val: any) => {
    moveCard.mutate({
        card_id: props.ticket._id,
        variables: val,
    })
}

function getMenuItems() {
    return [{
        label: 'View Card', danger: true, action: () => {
            emit('click', props.ticket)
        },
        icon: {
            prefix: 'fa-regular',
            iconName: 'fa-eye'
        }
    }, {
        label: 'Delete', danger: true, action: () => {
            showDelete.value = true
        }, icon: {
            prefix: 'fa-regular',
            iconName: 'fa-trash'
        }
    },
    ]
}
const handleDeleteTicket = () => {
    deleteCard({})
}

const setStartDate = (date: string | null) => {
    moveCard.mutate({
        card_id: props.ticket._id,
        variables: { 'start-date': date }
    })
}

const setDueDate = (date: string | null) => {
    moveCard.mutate({
        card_id: props.ticket._id,
        variables: { 'end-date': date }
    })
}

const emit = defineEmits(['click'])
</script>