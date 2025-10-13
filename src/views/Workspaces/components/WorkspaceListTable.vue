<script setup lang="ts">
import Table from '../../../components/ui/Table.vue';
import { h } from "vue"
import { formatDate } from '../../../utilities/FormatDate';
import Collaborators from '../../../components/ui/Collaborators.vue';
const handleClick = (row: any) => {
    localStorage.setItem('jobId', row.row.LatestTask?.job_id)
    window.open(`/workspace/peak/${row.row._id}/${row.row.LatestTask?.job_id ? row.row.LatestTask?.job_id :''}`, '_blank');
}

const columns = [
    {
        key: "variables", label: 'Project', render: ({ row, value }: any) => h('div', { class: 'flex items-center gap-2' }, [
            row.logo ? h('img', { src: row?.logo, alt: value.title, class: 'h-8 w-8 bg-bg-card rounded-full' }) : h('div', { class: ' bg-white h-8 w-8 bg-bg-card rounded-full' }),
            h('span', value?.title)
        ])
    },
    {
        key: 'variables', label: 'Project type',
        render: ({ value }: any) => h('div', { class: ' capitalize flex items-center gap-2' }, [

            h('span', value['workspace-type'])
        ])
    },
    {
        key: 'People', label: 'People',
        render: ({ value }: any) => h('div', { class: ' capitalize flex items-center gap-2' }, [
            h(Collaborators, { avatars: value, image: false })
        ])
    },
    {
        key: 'created_at', label: 'Start Date', render: ({ value }: any) => h('div', { class: 'flex items-center gap-2' }, [

            h('span', formatDate(value))
        ])
    },
    // { key: 'Roles', label: 'Team' }
]

defineProps<{ data: [], isPending: boolean }>()
</script>

<template>
    <Table @row-click="handleClick" :columns="columns" :rows="data || []" :loading="isPending" :skeletonRows="6">
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
</template>