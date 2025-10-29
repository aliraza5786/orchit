<template>
    <div class="w-full text-text-primary  bg-bg-body ">
        <div class="max-w-[1440px] w-full mx-auto md:px-15 md:py-20 px-5 py-10  ">
            <div class="flex justify-between items-center flex-wrap gap-5 mb-8">
                <div class="flex flex-col gap-2 max-md:gap-1 ">
                    <h1 class="text-2xl font-medium text-text-primary ">Users</h1>
                    <p class="text-sm text-text-secondary">Users are anyone who’s invited to your organization.
                    </p>
                </div>

                <Button @click="open()"> Invite Users</Button>
            </div>

            <div v-if="data && data?.length == 0"
                class="flex py-10 justify-center items-center text-sm text-text-secondary">No Workspace</div>
            <Table @row-click="handleClick" :columns="columns" :rows="data?.data?.users || []" :loading="isPending"
                :skeletonRows="6">
                <!-- Custom slot for status -->
                <template #status="{ row }">
                    <span class="px-3 py-1 rounded-full text-xs font-medium" :class="{
                        'bg-blue-100 text-blue-600': row.status === 'pending',
                        'bg-red-100 text-red-600': row.status === 'rejected',
                        'bg-green-100 text-green-600': row.status === 'accepted'
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

    <InviteUsers v-model="show" :defaultWorkspaceId="currentWorkspaceId" @invited="handleInvited" />
</template>
<script setup lang="ts">
import { defineAsyncComponent, h, ref } from "vue";
import { useCompanyId } from "../../services/user";
import Table from "../../components/ui/Table.vue";
import { useUsers } from "../../queries/useWorkspace";
import Button from "../../components/ui/Button.vue";
import Collaborators from "../../components/ui/Collaborators.vue";
import { getStatusStyle } from "../../utilities/stausStyle";
const InviteUsers = defineAsyncComponent(() => import("./Modals/InviteUsers.vue"));
const { data: companyId } = useCompanyId();
const { data, isPending } = useUsers(companyId)

const columns = [
    {
        key: "variables", label: 'Name', render: ({ row }: any) =>
            h('div', { class: ' capitalize flex flex-col items-start gap-1' }, [
                h('span', { class: 'text-sm text-text-primary' }, row['u_full_name']),
                h('p', { class: 'max-w-50 line-clamp-1 text-xs text-text-secondary' }, row['u_email'])
            ]),

    },
    {
        key: 'variables', label: 'Spaces',

        render: ({ row }: any) => h(Collaborators, { avatars: row.workspaces || [], image: true, maxVisible: 3 })


    },
    {
        key: 'variables', label: 'Role',
        render: ({ row }: any) => h('div', { class: ' capitalize flex items-center gap-2' }, [
            h('span', row['role_title'])
        ])
    },
    {
        key: 'variables', label: 'Status',
        render: ({ row }: any) => h('div', { class: `capitalize flex items-center gap-2 rounded-md inline w-fit px-2 py-1 ${getStatusStyle(row['seat_status'])}` }, [
            h('span', row['seat_status'])
        ])
    }
]
const currentWorkspaceId = 'abc123' // or a ref/computed from route/store

const show = ref(false)
function open() { show.value = true }

// Optional: parent reacts to success
function handleInvited(payload: any) {
    // e.g. refresh a table, toast, etc.
    // queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    console.log('Invites sent:', payload)
}
const handleClick = () => {

}
</script>