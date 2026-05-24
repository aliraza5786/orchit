<template>
  <div class="w-full text-text-primary bg-bg-surface/40 min-h-screen">
    <div
      class="mx-auto w-full max-w-[1400px] pt-8 pb-10 px-[15px] md:pt-10"
    >
      <div class="mb-10 flex flex-wrap items-center justify-between gap-5 max-md:gap-4">
        <div class="flex flex-col gap-1.5 max-md:gap-1">
          <h1 class="text-2xl font-medium">Users</h1>
          <p class="text-sm text-text-secondary">
            Manage and invite team members to your organization.
          </p>
        </div>

        <Button variant="primary" @click="open()">
          <i class="fa-solid fa-plus mr-2 text-xs"></i>
          Invite Users
        </Button>
      </div>

      <EmptyState
        v-if="!isLoading && !data?.data?.users?.length"
        icon="fa-regular fa-users"
        title="No users found"
        description="Invite team members to start collaborating on your projects."
        container-class="px-6 py-20"
      />

      <div class="workspace-module-wrapper" v-else>
        <div class="workspace-list-container">
          <Table
            v-if="isLoading || data?.data?.users?.length"
            @row-click="handleClick"
            :columns="columns"
            :rows="data?.data?.users || []"
            :loading="isLoading"
            :skeletonRows="6"
            :hover="false"
            :rowClass="() => 'group workspace-row'"
            headerBgClass="bg-bg-body"
            paginationBgClass="bg-bg-body"
          >
            <!-- Custom slot for status -->
            <template #status="{ row }">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-600': row.status === 'pending',
                  'bg-red-100 text-red-600': row.status === 'rejected',
                  'bg-green-100 text-green-600': row.status === 'accepted',
                }"
              >
                {{ row.status }}
              </span>
            </template>

            <!-- Custom slot for team avatars -->
            <template #team="{ row }">
              <div class="flex -space-x-2">
                <span
                  v-for="(member, i) in row.Roles"
                  :key="i"
                  class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs"
                >
                  {{ member }}
                </span>
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>
  </div>

  <InviteUsers
    v-model="show"
    :defaultWorkspaceId="currentWorkspaceId"
    @invited="handleInvited"
  />
</template>
<script setup lang="ts">
import { defineAsyncComponent, h, ref } from "vue";
import { useCompanyId } from "../../services/user";
import Table from "../../components/ui/Table.vue";
import { useUsers } from "../../queries/useWorkspace";
import Button from "../../components/ui/Button.vue";
import EmptyState from "../../components/ui/EmptyState.vue";
import Collaborators from "../../components/ui/Collaborators.vue";
import { avatarColor } from "../../utilities/avatarColor";
const InviteUsers = defineAsyncComponent(
  () => import("./Modals/InviteUsers.vue"),
);
const { data: companyId } = useCompanyId();
const { data, isLoading } = useUsers(companyId);

const renderName = ({ row }: any) => {
  const initials = (row["u_full_name"] || "??")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return h("div", { class: "flex items-center gap-3 py-1" }, [
    // Avatar
    row.u_profile_image
      ? h("img", {
          src: row.u_profile_image,
          class:
            "h-9 w-9 rounded-full object-cover ring-1 ring-border shadow-sm",
        })
      : h(
          "div",
          {
            class:
              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/20",
            style: { backgroundColor: avatarColor({ email: row.u_email }) },
          },
          initials,
        ),
    // Name and Email
    h("div", { class: "flex flex-col min-w-0" }, [
      h(
        "span",
        {
          class:
            "text-[14px] font-bold text-text-primary truncate leading-tight",
        },
        row["u_full_name"],
      ),
      h(
        "span",
        { class: "text-[11px] text-text-secondary truncate" },
        row["u_email"],
      ),
    ]),
  ]);
};

const renderRole = ({ row }: any) => {
  return h("div", { class: "flex items-center" }, [
    h(
      "span",
      {
        class:
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-bg-body border border-border text-text-primary shadow-sm",
      },
      row["role_title"] || "Member",
    ),
  ]);
};

const renderStatus = ({ row }: any) => {
  const status = row["seat_status"]?.toLowerCase() || "pending";
  const styles: Record<string, string> = {
    accepted: "bg-green-500/10 text-green-600 border-green-500/20",
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return h("div", { class: "flex items-center" }, [
    h(
      "div",
      {
        class: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || "bg-slate-500/10 text-slate-600 border-slate-500/20"}`,
      },
      [
        h("span", { class: "h-1 w-1 rounded-full bg-current" }),
        h("span", row["seat_status"]),
      ],
    ),
  ]);
};

const columns = [
  {
    key: "u_full_name",
    label: "Name",
    render: renderName,
    width: "280px",
  },
  {
    key: "workspaces",
    label: "Spaces",
    render: ({ row }: any) =>
      h(Collaborators, {
        avatars: row.workspaces || [],
        size: "6",
        maxVisible: 4,
      }),
    width: "180px",
  },
  {
    key: "role_title",
    label: "Role",
    render: renderRole,
    width: "150px",
  },
  {
    key: "seat_status",
    label: "Status",
    render: renderStatus,
    width: "130px",
  },
];
const currentWorkspaceId = "abc123"; // or a ref/computed from route/store

const show = ref(false);
function open() {
  show.value = true;
}

// Optional: parent reacts to success
function handleInvited(payload: any) {
  // e.g. refresh a table, toast, etc.
  // queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  console.log("Invites sent:", payload);
}
const handleClick = () => {};
</script>

<style scoped>
.workspace-module-wrapper {
  width: 100%;
}

.workspace-list-container {
  background: transparent;
  width: 100%;
}

/* Professional Scrollbar */
.workspace-list-container :deep(.overflow-auto) {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  padding-bottom: 1rem;
}

.workspace-list-container :deep(.overflow-auto::-webkit-scrollbar) {
  width: 5px;
  height: 5px;
}

.workspace-list-container :deep(.overflow-auto::-webkit-scrollbar-thumb) {
  background-color: var(--border);
  border-radius: 10px;
}

.workspace-list-container :deep(.workspace-row) {
  transition: background-color 0.2s ease;
}

.workspace-list-container :deep(.workspace-row:hover) {
  background-color: var(--bg-body) !important;
}

.workspace-list-container :deep(table) {
  border-spacing: 0 !important;
  width: 100%;
  border-collapse: collapse;
}

.workspace-list-container :deep(td) {
  padding: 14px 16px !important;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.workspace-list-container :deep(tr:last-child td) {
  border-bottom: none;
}

.workspace-list-container :deep(th) {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 16px !important;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
</style>
