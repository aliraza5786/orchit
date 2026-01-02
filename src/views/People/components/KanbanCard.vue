<template>
    <div @click="$emit('click')" class=" group bg-bg-card rounded-lg p-4  shadow-sm cursor-grab
             hover:shadow-md transition-all duration-200 active:cursor-grabbing"
        :style="{ borderColor: ticket?.lane?.variables['lane-color'] }">

        <div class="flex justify-between gap-2 items-start w-full">
            <div class="flex items-center gap-2 w-[90%] ">
                <img v-if="ticket?.avatar" :src="ticket?.avatar" class="min-w-10 w-10 h-10 rounded-full object-cover"
                    alt="avartar">
                <div v-else
                    class="w-10 min-w-10 overflow-hidden overflow-ellipsis aspect-square bg-bg-surface flex justify-center items-center rounded-full "
                    :style="{ backgroundColor: ticket?.name ? avatarColor({ email: ticket?.email, }) : '' }">
                    {{ getInitials(ticket?.name) }} <i v-if="!ticket?.name" class="fa-solid fa-user text-white"></i>
                </div>
                <div class=" max-w-[70%]">
                    <h3 class="text-sm font-medium mb-1 text-card-foreground leading-tight w-full">
                        {{ ticket?.name ?? ticket['title'] ?? `Team Member ` }}
                    </h3>
                    <!-- <p class="text-text-secondary text-sm"> {{ ticket['email'] ?? 'example@gmail.com' }}</p> -->
                    <p class="text-text-secondary text-xs overflow-hidden overflow-ellipsis"> {{ ticket?.email }}</p>
                </div>

            </div>
            <div v-if="getMenuItems().length > 0" class="group-hover:flex justify-center items-center hidden w-6 h-6 bg-bg-surface/40 rounded-md ">

                <DropMenu @click.stop="" :items="getMenuItems()">
                    <template #trigger>
                        <i class=" cursor-pointer fa-solid fa-ellipsis"></i>
                    </template>
                </DropMenu>
            </div>

        </div>
        <!-- <div v-if="ticket?.status == 'unassigned'" class="w-6 h-6 cursor-pointer ml-auto  text-xs flex justify-center items-center  bg-bg-body/60 rounded-full"> <i class="fa-regular fa-plus"></i>
        </div> -->
        <!-- <p v-html="ticket['card-description']"
            class="text-xs text-muted-foreground mb-3 text-text-secondary line-clamp-2">
        </p> -->
        <!-- <div class="flex justify-between items-center mt-2"> -->
        <div @click.stop>
            <AssigmentDropdown :users="members" @assign="assignHandle" :assigneeId="ticket.assigned_to" />
        </div>
        <!-- </div> -->
    </div>
    <div class="no-drag-zone" draggable="false" @mousedown.stop @touchstart.stop @pointerdown.stop>
        <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Team seat" itemLabel="Seat"
            :itemName="ticket.title" :requireMatchText="ticket.title" confirmText="Delete Seat" cancelText="Cancel"
            size="md" :loading="deletingTicket" @confirm="handleDeleteTicket" @cancel="() => {
                showDelete = false
            }">
        </ConfirmDeleteModal>


        <AssignmentModal :isSubmitting="inviting" v-model="showAddMembers" :members="people?.people"
            :directory="people?.people" @submit="({ invite }) => sendInvites(invite)" />

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../../components/ui/DropMenu.vue'
import { useAssignTeam, useDeleteSeat, usePeople, useUnAssignTeam } from '../../../queries/usePeople'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'
import { useWorkspaceId } from '../../../composables/useQueryParams'
import { useCompanyId } from '../../../services/user'
import AssignmentModal from '../modals/AssignmentModal.vue'
import { getInitials } from '../../../utilities'
import { avatarColor } from '../../../utilities/avatarColor'
import { usePermissions } from '../../../composables/usePermissions'
const {   canInviteUser,  canEditUser, canDeleteUser} = usePermissions()
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

}>()

const { workspaceId } = useWorkspaceId();
const { data: companyId } = useCompanyId();

const { data: people } = usePeople(workspaceId.value, companyId);

const members = ref([]);
const showDelete = ref(false)
const queryClient = useQueryClient()

// function getMenuItems() {
//     return [
//         {
//             label: 'Assign User', danger: true,
//             action: () => {
//                 showAddMembers.value = true
//             },
//             icon: {
//                 prefix: 'fa-regular',
//                 iconName: 'fa-user-plus'
//             }
//         },
//         ...(props.ticket.name ? [{
//             label: 'UnAssign User', danger: true,
//             action: () => {
//                 unassignHandler()
//             },
//             icon: {
//                 prefix: 'fa-regular',
//                 iconName: 'fa-user-minus'
//             }
//         }] : []),
//         {
//             label: 'Delete Seat', danger: true, action: () => {
//                 showDelete.value = true
//             },
//             icon: {
//                 prefix: 'fa-regular',
//                 iconName: 'fa-trash'
//             }

//         },
//     ]
// }

function getMenuItems() {
  const isAdmin = props.ticket?.role_title?.toLowerCase() === 'admin'
  const hasUser = Boolean(props.ticket?.name)

  const items = []

  if (canInviteUser.value && !isAdmin) {
    items.push({
      label: 'Assign User',
      danger: true,
      action: () => {
        showAddMembers.value = true
      },
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-user-plus'
      }
    })
  }

  if (hasUser && canEditUser.value && !isAdmin) {
    items.push({
      label: 'UnAssign User',
      danger: true,
      action: unassignHandler,
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-user-minus'
      }
    })
  }

  if (canDeleteUser.value && !isAdmin) {
    items.push({
      label: 'Delete Seat',
      danger: true,
      action: () => {
        showDelete.value = true
      },
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-trash'
      }
    })
  }

  return items as { label: string; icon?: any; action?: () => void }[]
}



const assignHandle = () => {
    // moveCard.mutate(payload)
}
const { mutate: deleleSeat, isPending: deletingTicket } = useDeleteSeat({
    onSuccess: () => {

        queryClient.invalidateQueries({ queryKey: ['people-lists'] })
    }
})

const handleDeleteTicket = () => { 
    deleleSeat({ id: props.ticket._id })
}

const { mutate: invitePeople, isPending: inviting } = useAssignTeam({
    onSuccess: () => {
        showAddMembers.value = false;
        queryClient.invalidateQueries({ queryKey: ['people-lists'] })
    }
})
function extractNameFromEmail(email: string) {
    const local = (email.split('@')[0] || '').split('+')[0]
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
    if (!parts.length) return email
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}
const { mutate: unassign } = useUnAssignTeam(
    {
        onSuccess: () => {

            showAddMembers.value = false;
            queryClient.invalidateQueries({ queryKey: ['people-lists'] })
        }
    }
);
function sendInvites(inviteEmails: any) {
    invitePeople(
        {
            id: props.ticket._id,
            payload: {
                name: extractNameFromEmail(inviteEmails.email),
                email: inviteEmails.email
            }
        }
    )
}
function unassignHandler() {
    unassign(
        {
            id: props.ticket._id
        }
    )
}
</script>