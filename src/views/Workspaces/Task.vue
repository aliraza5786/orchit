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
            <Table @row-click="handleClick" :columns="columns" :rows="data?.data?.cards || []" :loading="isPending"
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

            </Table>
        </div>
    </div>
</template>
<script setup lang="ts">
import { h } from "vue";
import { useUserId } from "../../services/user";
import { useTasks } from "../../queries/useWorkspace";
import Table from "../../components/ui/Table.vue";
const { data: userId } = useUserId();
const { data, isPending } = useTasks(userId)
const columns = [
    {
        key: "variables", label: 'Task name', render: ({ value }: any) =>
            h('div', { class: ' capitalize flex flex-col items-start gap-1' }, [
                h('span',{class:'text-sm text-text-primary'}, value['card-title'] ),
                h('p', {class:'max-w-50 line-clamp-1 text-xs text-text-secondary'},  value['card-description'])
            ]),

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
    }
]

const handleClick = () => {

}
</script>