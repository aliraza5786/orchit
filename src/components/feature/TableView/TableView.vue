<template>
  <div class="kanban-table space-y-4 px-4 h-[85vh] overflow-y-auto">

    <table
      class="w-full border-collapse border-border  shadow-sm rounded-lg  overflow-hidden bg-bg-body/80 h-[200px] overflow-y-auto">
      <thead class="bg-bg-surface border-b border-border sticky top-0 z-1">
        <tr>
          <th class="w-8 p-1"></th>
          <th v-for="col in columns" :key="col?.key" class="text-left p-1 font-medium">
            {{ col?.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="isPending">
          <tr v-for="n in 5" :key="'sk-' + n" class="animate-pulse border-b border-border">
            <td class="p-2">
              <div class="w-4 h-4 bg-bg-surface rounded"></div>
            </td>

            <td v-for="col in columns" :key="col.key" class="p-2">
              <div class="w-full h-4 bg-bg-surface rounded"></div>
            </td>
          </tr>
        </template>
        <!-- Hover Insert Row -->
        <template v-else v-for="(ticket, index) in tickets" :key="ticket?.id">
          <tr v-if="hoverIndex === index && !hasActiveEmptyRow"
            class="relative bg-bg-surface/50 transition-all cursor-pointer  border  border-accent" @mouseleave="hoverIndex = null">
            <td class="!p-0 w-8" @click="insertEmptyRow(index)">
              <span
                class="absolute left-[-6px] top-[-6px] bg-bg-card border border-border w-6 h-6 text-sm rounded-md flex justify-center items-center shadow-sm hover:bg-bg-card/10">+</span>
            </td>
            <td class="!p-0" :colspan="columns?.length"></td>
          </tr>

          <!-- Actual Row -->
          <tr @mouseenter="hoverIndex = index" class="hover:bg-surface/50 transition-colors border-b border-border">
            <td class="p-2"></td>

            <td v-for="col in columns" :key="col?.key" class="p-2">
              <!-- Editable input -->
              <input v-if="editing?.id === ticket?.id && editing?.field === col?.key" v-model="ticket[col?.key]"
                @blur="finishEdit(ticket)"
                class="w-full p-1 border border-border rounded focus:outline-none focus:ring focus:ring-blue-300"
                :ref="(el: any) => el && editing?.id === ticket?.id && editing?.field === col?.key && (titleInput = el)" />

              <!-- Display value -->
              <span v-else class="cursor-text hover:underline" @click="editField(ticket, col?.key)">
                {{ ticket[col?.key] || 'Click to edit' }}
              </span>

              <slot v-else :name="col.key" :row="ticket" :column="col" :index="`r-${ticket._id}`">
                <component :is="RenderCell" :row="ticket" :column="col" :index="ticket._id" />
              </slot>
            </td>
          </tr>
        </template>

        <!-- Add Row at End -->
        <tr v-if="!hasActiveEmptyRow"
          class=" bg-bg-surface transition sticky bottom-0 cursor-pointer border-t h-2 border-accent"
          @mouseenter="hoverIndex = tickets?.length" @mouseleave="hoverIndex = null">
          <td class="p-2" @click="insertEmptyRow(tickets?.length)">
            <span
              class="plus inline-flex w-5 h-5 border border-border rounded-full justify-center items-center text-secondary hover:bg-bg-surface/200 transition">+</span>
          </td>
          <td :colspan="columns.length" class="p-2 text-text-secondary border-accent ">Add New Row</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, nextTick, computed, watch, h } from 'vue'

interface Column {
  key: string
  label: string
}

type Row = Record<string, any>

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Row[]
  isPending: boolean
}>(), {})

const emit = defineEmits<{
  (e: 'update:rows', val: Row[]): void
  (e: 'create', val: any): void
}>()

const tickets = reactive<Row[]>(props.rows || [])

watch(() => props.rows, newRows => {
  if (newRows) tickets.splice(0, tickets.length, ...newRows)
})

const editing = reactive<{ id: string | number | null; field: string }>({ id: null, field: '' })
const hoverIndex = ref<number | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)

const hasActiveEmptyRow = computed(() =>
  tickets.some(t => editing.id === t.id && !t[editing.field])
)

const editField = (ticket: Row, field: string) => {
  editing.id = ticket.id
  editing.field = field
  nextTick(() => titleInput.value?.focus())
}

const stopEditing = () => {
  editing.id = null
  editing.field = ''
}

const finishEdit = (ticket: Row) => {

  if (!ticket[editing.field]?.trim()) {
    const index = tickets.findIndex(t => t.id === ticket.id)
    if (index !== -1) tickets.splice(index, 1)
  }
  stopEditing()
  emit('update:rows', tickets.slice())
  emit('create', ticket)
}

const insertEmptyRow = (index: number) => {
  const newRow: Row = { id: Date.now() }
  props.columns.forEach(col => newRow[col.key] = '')
  tickets.splice(index, 0, newRow)
  editField(newRow, props.columns[0]?.key || '')
  hoverIndex.value = null
  emit('update:rows', tickets.slice())
}
function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  if (!path.includes('.')) return obj[path]
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}
function cellValue(row: Row, col: any) {
  return col?.accessor ? col.accessor(row) : getByPath(row, col.key)
}
const RenderCell = (p: { row: Row; column: any; index: number }) => {
  const val = cellValue(p.row, p.column)
  if (p.column?.render) return p.column.render({ row: p?.row, column: p?.column, value: val, index: p?.index })
  return h('span', String(val ?? ''))
}

</script>
