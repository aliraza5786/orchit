<template>
    <div class="w-full text-text-primary  bg-bg-body ">
        <div class="max-w-[1440px] w-full mx-auto md:px-15 md:py-20 px-5 py-10  ">
            <div class="flex justify-between items-center flex-wrap gap-5 mb-8">
                <div class="flex flex-col gap-2 max-md:gap-1 ">
                    <h1 class="text-2xl font-medium text-text-primary ">My Taks</h1>
                    <p class="text-sm text-text-secondary">View and manage your assigned tasks.
                    </p>
                </div>
            </div>

            <div v-if="data && data?.length == 0"
                class="flex py-10 justify-center items-center text-sm text-text-secondary">No Workspace</div>
            <Table @row-click="(row:any)=>handleClick(row)" :columns="columns" :rows="data?.data?.cards || []" :loading="isPending"
                :skeletonRows="6">
                <!-- Custom slot for status -->
                <template #status="{ row }">
                    <span class="px-3 py-1 rounded-full text-xs font-medium" :class="{
                        'bg-blue-100 text-blue-600': row.status === 'In progress',
                        'bg-red-100 text-red-600': row.status === 'Live',
                        'bg-green-100 text-green-600': row.status === 'Done'
                    }">
                        {{ row.status }}
                    </span>
                </template>

                <!-- Custom slot for team avatars -->
                <template #team="{ row }">
                    <div class="flex -space-x-2">
                        <span v-for="(member, i) in row.Roles" :key="i"
                            class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs">
                            {{ member }}
                        </span>
                    </div>
                </template>

                <!-- Custom slot for assignee -->
                <template #assignee="{ row }">
                    <div class="flex justify-center" @click.stop>
                        <AssigmentDropdown
                            :assigneeId="row.assigned_to"
                            :seat="row.seat"
                            @assign="(user: any) => handleAssign(user, row._id as string)"
                        />
                    </div>
                </template>

            </Table>
        </div>

        <TaskDetailsModal
            v-model="showTaskModal"
            :cardId="selectedCardId"
            @close="closeModal"
        />
    </div>
</template>
<script setup lang="ts">
import { h, ref } from "vue";
import { useUserId } from "../../services/user";
import { useTasks } from "../../queries/useWorkspace";
import Table from "../../components/ui/Table.vue";
import TaskDetailsModal from "./Modals/TaskDetailsModal.vue";
import AssigmentDropdown from "../../views/Product/components/AssigmentDropdown.vue";
import { useMoveCard } from "../../queries/useSheets";
import { useQueryClient } from "@tanstack/vue-query";

const { data: userId } = useUserId();
const { data, isPending } = useTasks(userId)
const queryClient = useQueryClient();

const showTaskModal = ref(false);
const selectedCardId = ref('');

const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})

const handleAssign = (user: any, cardId: string) => {
  if (cardId) {
    moveCard.mutate({ card_id: cardId, assigned_to: user?.user_info?._id })
  }
}

const columns = [
    {
        key: "variables", label: 'Task name', render: ({ value }: any) =>
            h('span', { class: 'text-sm text-text-primary capitalize' }, value['card-title']),
    },
    {
        key: 'variables', label: 'Status',
        render: ({ value }: any) => h('div', { class: ' capitalize flex items-center gap-2' }, [
            h('span', value['card-status'])
        ])
    },
    {
        key: 'variables', label: 'Due Date',
        render: ({ value }: any) => h('div', { class: ' capitalize flex items-center gap-2' }, [
            h('span', value['end-date'])
        ])
    },
    {
        key: 'assignee', label: 'Assignee', align: 'center' as const
    }
]

const handleClick = (row: any) => {
    if (row.row && row.row._id) {
        selectedCardId.value = row?.row._id;
        showTaskModal.value = true;
    }
}

const closeModal = () => {
    
    showTaskModal.value = false;
    selectedCardId.value = '';
}
</script>