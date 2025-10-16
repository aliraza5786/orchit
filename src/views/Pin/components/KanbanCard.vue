<template>
    <div @click="$emit('click')" class=" bg-bg-card rounded-lg p-4  shadow-sm cursor-grab
             hover:shadow-md transition-all duration-200 active:cursor-grabbing"
        :style="{ borderColor: ticket?.lane?.variables['lane-color'] }">

        <div class="flex justify-between gap-2 items-start">
            <div class="flex items-start gap-2 ">
                <div class="w-10 aspect-square bg-bg-surface flex justify-center items-center rounded-full ">
                    {{ getInitials(ticket?.name) }} <i v-if="!ticket?.name" class="fa-solid fa-user text-white"></i>
                </div>
                <div>
                    <h3 class="text-sm font-medium text-card-foreground leading-tight">
                        {{ ticket?.name ?? ticket['title'] ?? `Team Member ${index + 1}` }}
                    </h3>
                    <!-- <p class="text-text-secondary text-sm"> {{ ticket['email'] ?? 'example@gmail.com' }}</p> -->
                    <p class="text-text-secondary text-xs"> {{ ticket?.role ?? 'e.g. Node Developer' }}</p>
                </div>
            </div>
            <DropMenu @click.stop="" :items="getMenuItems()">
                <template #trigger>
                    <i class=" cursor-pointer fa-solid fa-ellipsis"></i>
                </template>
            </DropMenu>

        </div>
       
 
    </div>
    <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Team seat" itemLabel="Seat"
        :itemName="ticket.title" :requireMatchText="ticket.title" confirmText="Delete Seat" cancelText="Cancel"
        size="md" :loading="deletingTicket" @confirm="handleDeleteTicket" @cancel="() => {
            showDelete = false
        }">
    </ConfirmDeleteModal>



</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../../components/ui/DropMenu.vue'
import {  useDeleteSeat, useUnAssignTeam } from '../../../queries/usePeople'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'
import { getInitials } from '../../../utilities'
const showAddMembers = ref(false);
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
    index: any
}>()



const showDelete = ref(false)
const queryClient = useQueryClient()

function getMenuItems() {
    return [
        {
            label: 'Assign User', danger: true,
            action: () => {
                showAddMembers.value = true
            },
            icon: {
                prefix: 'fa-regular',
                iconName: 'fa-user-plus'
            }
        },
        ...(props.ticket.name ? [{
            label: 'UnAssign User', danger: true,
            action: () => {
                unassignHandler()
            },
            icon: {
                prefix: 'fa-regular',
                iconName: 'fa-user-minus'
            }
        }] : []),
        {
            label: 'Delete Seat', danger: true, action: () => {
                showDelete.value = true
            },
            icon: {
                prefix: 'fa-regular',
                iconName: 'fa-trash'
            }

        },
    ]
}

const { mutate: deleleSeat, isPending: deletingTicket } = useDeleteSeat({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['people-lists'] })
    }
})

const handleDeleteTicket = () => {
    deleleSeat({ id: props.ticket._id })
}

const { mutate: unassign } = useUnAssignTeam(
    {
        onSuccess: () => {

            showAddMembers.value = false;
            queryClient.invalidateQueries({ queryKey: ['people-lists'] })
        }
    }
);

function unassignHandler() {
    unassign(
        {
            id: props.ticket._id
        }
    )
}
</script>