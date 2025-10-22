<script setup lang="ts">
import Table from '../../../components/ui/Table.vue';
import { h } from "vue"
import { formatDate } from '../../../utilities/FormatDate';
import Collaborators from '../../../components/ui/Collaborators.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Memoize formatDate results
const dateCache = new Map<string, string>();
const getCachedDate = (dateStr: string) => {
  if (!dateCache.has(dateStr)) {
    dateCache.set(dateStr, formatDate(dateStr));
  }
  return dateCache.get(dateStr)!;
};

const handleClick = (row: any) => {
    const jobId = row.row.LatestTask?.job_id;
    if (jobId) {
        localStorage.setItem('jobId', jobId);
    } else {
        localStorage.removeItem('jobId');
    }
    router.push(`/workspace/peak/${row.row._id}/${jobId || ''}`);
}

// Move render functions outside to prevent recreation
const renderProject = ({ row, value }: any) => h('div', { class: 'flex items-center gap-2' }, [
    row.logo ? h('img', { src: row.logo, alt: value?.title || 'Project', class: 'h-8 w-8 bg-bg-card rounded-full', loading: 'lazy', decoding: 'async' }) : h('div', { class: 'bg-white h-8 w-8 bg-bg-card rounded-full' }),
    h('span', value?.title || 'Untitled')
]);

const renderProjectType = ({ value }: any) => h('span', { class: 'capitalize' }, value?.['workspace-type'] || '-');

const renderPeople = ({ value }: any) => h(Collaborators, { avatars: value || [], image: false, maxVisible: 3 });

const renderStartDate = ({ value }: any) => h('span', getCachedDate(value));

const columns = [
    { key: "variables", label: 'Project', render: renderProject },
    { key: 'variables', label: 'Project type', render: renderProjectType },
    { key: 'People', label: 'People', render: renderPeople },
    { key: 'created_at', label: 'Start Date', render: renderStartDate },
];

defineProps<{ data: any[], isPending: boolean }>()

</script>

<template>
    <Table @row-click="handleClick"  :columns="columns" :rows="data || []" :loading="isPending" :skeletonRows="6">
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