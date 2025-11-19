<template>
  <div class="kanban-table space-y-4">
    <h2 class="text-xl font-semibold">Jira-like Table View</h2>

    <table class="w-full border-collapse shadow-sm rounded-lg overflow-hidden bg-bg-card">
      <thead class="bg-bg-surface border-b border-border">
        <tr>
          <th class="w-8 p-2"></th>
          <th class="text-left p-2 font-medium">Title</th>
          <th class="text-left p-2 font-medium">Description</th>
          <th class="text-left p-2 font-medium">Status</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="(ticket, index) in tickets" :key="ticket.id">
          
          <!-- Add Row Above -->
          <tr
            v-if="hoverIndex === index && !hasActiveEmptyRow"
            class="relative bg-bg-surface/50 transition-all cursor-pointer"
            @mouseleave="hoverIndex = null"
          >
            <td class="!p-0 w-8" @click="insertEmptyRow(index)">
              <span
                class="absolute left-[-6px] top-[-6px] bg-bg-card border border-border w-6 h-6 text-sm rounded-md flex justify-center items-center shadow-sm hover:bg-bg-card/10"
              >+</span>
            </td>
            <td class="!p-0" colspan="3"></td>
          </tr>

          <!-- Actual Row -->
          <tr
            @mouseenter="hoverIndex = index"
            class="hover:bg-surface/50 transition-colors border-b border-border"
          >
            <td class="p-2"></td>

            <!-- Title -->
            <td class="p-2">
              <input
                v-if="editing.id === ticket.id && editing.field === 'title'"
                v-model="ticket.title"
                @blur="finishEdit(ticket)"
                class="w-full p-1 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                :ref="el => el && editing.id === ticket.id && editing.field === 'title' && (titleInput = el)"
              />

              <span
                v-else
                class="cursor-text text-text-primary hover:underline"
                @click="editField(ticket, 'title')"
              >
                {{ ticket.title || 'Click to edit' }}
              </span>
            </td>

            <!-- Description -->
            <td class="p-2">
              <input
                v-if="editing.id === ticket.id && editing.field === 'description'"
                v-model="ticket.description"
                @blur="stopEditing"
                class="w-full p-1 border rounded focus:outline-none focus:ring focus:ring-blue-300"
              />
              <span
                v-else
                class="cursor-text text-text-secondary hover:underline"
                @click="editField(ticket, 'description')"
              >
                {{ ticket.description || 'Click to edit' }}
              </span>
            </td>

            <!-- Status -->
            <td class="p-2">
              <select
                v-model="ticket.status"
                class="p-1 border rounded bg-bg-card focus:ring focus:ring-blue-300"
              >
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </td>
          </tr>
        </template>

        <!-- Add Row at End -->
        <tr
          v-if="!hasActiveEmptyRow"
          class="hover:bg-blue-50 transition cursor-pointer border-t border-border"
          @mouseenter="hoverIndex = tickets.length"
          @mouseleave="hoverIndex = null"
        >
          <td class="p-2" @click="insertEmptyRow(tickets.length)">
            <span
              class="plus inline-flex w-5 h-5 border border-border rounded-full justify-center items-center text-secondary hover:bg-bg-surface/200 transition"
            >+</span>
          </td>
          <td colspan="3" class="p-2 text-text-secondary">Add New Ticket</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, nextTick, computed, watch } from 'vue';

/** Column config */
export interface Column<T = any> {
  key: string;
  label: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  class?: string;
  headerClass?: string;
  sortable?: boolean;
  accessor?: (row: T) => unknown;
  render?: (ctx: { row: T; column: Column<T>; value: unknown; index: number }) => any;
}

/** Row type */
export type Row = Record<string, unknown>;

/** Props */
const props = withDefaults(
  defineProps<{
    columns: Column[];
    rows: Row[];
    loading?: boolean;
    skeletonRows?: number;
  }>(),
  {
    loading: false,
    skeletonRows: 6,
  }
);

/** Emits */
const emit = defineEmits<{
  (e: 'update:rows', val: Row[]): void;
}>();

/** Local reactive rows for editing */
const tickets = reactive<Row[]>(props.rows || []);

/** Watch parent rows prop */
watch(
  () => props.rows,
  newRows => {
    if (newRows) {
      tickets.splice(0, tickets.length, ...newRows);
    }
  }
);

/** Editing state */
const editing = reactive<{ id: string | number | null; field: string }>({
  id: null,
  field: '',
});

/** Hover row index for + insert row */
const hoverIndex = ref<number | null>(null);

/** Ref for auto-focusing title input */
const titleInput = ref<HTMLInputElement | null>(null);

/** Hide + row if there's an empty active row being edited */
const hasActiveEmptyRow = computed(() => {
  return tickets.some(
    t =>
      editing.id === t.id &&
      editing.field === 'title' &&
      (!t.title || t.title.toString().trim() === '')
  );
});

/** Edit a field (title/description/etc.) */
const editField = (ticket: Row, field: string) => {
  editing.id = ticket.id;
  editing.field = field;

  nextTick(() => {
    if (field === 'title' && titleInput.value) {
      titleInput.value.focus();
    }
  });
};

/** Stop editing */
const stopEditing = () => {
  editing.id = null;
  editing.field = '';
};

/** Finish editing: remove empty row if needed */
const finishEdit = (ticket: Row) => {
  const title = ticket.title?.toString() || '';
  if (!title.trim()) {
    const index = tickets.findIndex(t => t.id === ticket.id);
    if (index !== -1) tickets.splice(index, 1);
  }
  stopEditing();
  emit('update:rows', tickets.slice());
};

/** Insert empty row at index */
const insertEmptyRow = (index: number) => {
  const newTicket: Row = {
    id: Date.now(),
    title: '',
    description: '',
    status: 'To Do',
  };
  tickets.splice(index, 0, newTicket);
  editField(newTicket, 'title');
  hoverIndex.value = null;
  emit('update:rows', tickets.slice());
};

/** Skeleton rows */
const resolvedSkeletonRows = computed(() => props.skeletonRows ?? 6);

/** Auto-focus any input already focused on mount */
nextTick(() => {
  const input = document.querySelector<HTMLInputElement>('input:focus');
  input?.focus();
});
</script>

<style scoped>
.kanban-table {
  padding: 16px;
  font-family: Arial, sans-serif;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ccc;
  padding: 8px;
}

input {
  width: 100%;
  box-sizing: border-box;
}

.hover-add-row {
  background-color: #f9f9f9;
  cursor: pointer;
}

.hover-add-row .plus {
  display: inline-block;
  width: 16px;
  height: 16px;
  text-align: center;
  border: 1px solid #888;
  border-radius: 50%;
  margin-left: 4px;
  font-weight: bold;
  line-height: 14px;
  color: #444;
}

.hover-add-row:hover {
  background-color: #e0f7fa;
}
</style>