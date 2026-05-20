<template>
  <div class="w-full text-text-primary bg-bg-surface/40">
    <div
      class="mx-auto w-full max-w-[1400px] pt-8 pb-10 px-[15px] md:pt-10"
    >
      <div class="flex justify-between items-center flex-wrap gap-5 mb-10">
        <div class="flex flex-col gap-1.5 max-md:gap-1">
          <h1 class="text-2xl font-medium">My Tasks</h1>
          <p class="text-sm text-text-secondary">
            View and manage your assigned tasks across all workspaces.
          </p>
        </div>
      </div>

      <EmptyState
        v-if="!isPending && !data?.data?.cards?.length"
        icon="fa-regular fa-list-check"
        title="No tasks assigned"
        description="You don't have any tasks assigned to you at the moment. New assignments will appear here."
        container-class="px-6 py-20"
      />

      <div class="workspace-module-wrapper" v-else>
        <div class="workspace-list-container">
          <Table
            v-if="isPending || data?.data?.cards?.length"
            @row-click="(row: any) => handleClick(row)"
            :columns="columns"
            :rows="data?.data?.cards || []"
            :loading="isPending"
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
                  'bg-blue-100 text-blue-600': row.status === 'In progress',
                  'bg-red-100 text-red-600': row.status === 'Live',
                  'bg-green-100 text-green-600': row.status === 'Done',
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

            <!-- Custom slot for assignee -->
            <template #assignee="{ row }">
              <div class="flex justify-center" @click.stop>
                <AssigmentDropdown
                  :assigneeId="row.seat_id || row.assigned_to"
                  :seat="row.seats || row.seat"
                  @assign="(user: any) => handleAssign(user, row._id as string)"
                />
              </div>
            </template>
          </Table>
        </div>
      </div>
    </div>

    <TaskDetailsModal
      v-model="showTaskModal"
      v-if="showTaskModal"
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
import EmptyState from "../../components/ui/EmptyState.vue";
import TaskDetailsModal from "./Modals/TaskDetailsModal.vue";
import AssigmentDropdown from "../../views/Product/components/AssigmentDropdown.vue";
import { useMoveCard } from "../../queries/useSheets";
import { useQueryClient } from "@tanstack/vue-query";

const { data: userId } = useUserId();
const { data, isPending } = useTasks(userId);
const queryClient = useQueryClient();

const showTaskModal = ref(false);
const selectedCardId = ref("");

const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
});

const handleAssign = (users: any[], cardId: string) => {
  if (cardId) {
    const user_ids = Array.isArray(users)
      ? users.map((u) => u?._id || u?.id).filter(Boolean)
      : [];
    moveCard.mutate({ card_id: cardId, assigned_to: user_ids });
  }
};

const renderTaskName = ({ value, row }: any) => {
  return h("div", { class: "flex items-center gap-3 py-1" }, [
    h(
      "div",
      {
        class:
          "h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs",
      },
      [h("i", { class: "fa-solid fa-file-lines" })],
    ),
    h("div", { class: "flex flex-col min-w-0" }, [
      h(
        "span",
        {
          class:
            "text-[14px] font-bold text-text-primary truncate leading-tight hover:text-accent transition-colors cursor-pointer",
          onClick: (e: Event) => {
            e.stopPropagation();
            handleClick({ row });
          },
        },
        value["card-title"],
      ),
      h(
        "span",
        { class: "text-[11px] text-text-secondary truncate" },
        row.workspace_name || "Personal Workspace",
      ),
    ]),
  ]);
};

const renderStatus = ({ value }: any) => {
  const status = value["card-status"]?.toLowerCase() || "todo";
  const styles: Record<string, string> = {
    done: "bg-green-500/10 text-green-600 border-green-500/20",
    "in progress": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    live: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    todo: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  return h("div", { class: "flex items-center" }, [
    h(
      "div",
      {
        class: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || "bg-slate-500/10 text-slate-600 border-slate-500/20"}`,
      },
      [
        h("span", { class: "h-1 w-1 rounded-full bg-current" }),
        h("span", value["card-status"]),
      ],
    ),
  ]);
};

const renderDueDate = ({ value }: any) => {
  return h("div", { class: "flex items-center gap-2 text-text-secondary" }, [
    h("i", { class: "fa-regular fa-calendar text-[11px]" }),
    h(
      "span",
      { class: "text-[12px] font-medium" },
      value["end-date"] || "No due date",
    ),
  ]);
};

const columns = [
  {
    key: "variables",
    label: "Task name",
    render: renderTaskName,
    width: "320px",
  },
  {
    key: "variables",
    label: "Status",
    render: renderStatus,
    width: "150px",
  },
  {
    key: "variables",
    label: "Due Date",
    render: renderDueDate,
    width: "150px",
  },
];

const handleClick = (row: any) => {
  if (row.row && row.row._id) {
    selectedCardId.value = row?.row._id;
    showTaskModal.value = true;
  }
};

const closeModal = () => {
  showTaskModal.value = false;
  selectedCardId.value = "";
};
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
