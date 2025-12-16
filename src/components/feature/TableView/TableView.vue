<template>
  <div class="kanban-table space-y-4 px-4 h-[85vh] overflow-y-auto">

    <table class="w-full table-fixed border-collapse rounded-md shadow-sm 
             bg-bg-body/20 text-sm
             border border-border/60">

      <!-- HEADER -->
      <thead class="bg-bg-surface border-b border-border sticky top-[-1px] z-10">
        <tr class="text-text-secondary">
          <th class="w-2 p-0"></th>
          <th v-for="col in visibleColumns" :key="col?.key" class="relative font-bold p-2 uppercase text-left text-[11px] tracking-wide
             border-r border-border/40 select-none whitespace-nowrap min-w-[200px]"
             :style="{ width: columnWidths[col.key] ? columnWidths[col.key] + 'px' : '100%' }"
             >
            <span>{{ col?.label }}</span>

            <!-- Column Resize Handle -->
            <div class="absolute right-0 top-0 h-full w-2 cursor-col-resize z-30
               hover:bg-accent/20 active:bg-accent/40 transition" @mousedown="(e) => startResize(e, col.key)">
            </div>
          </th>

          <!-- Toggle Columns Button -->
          <th class="w-10 p-2 text-center relative">
            <div class="relative inline-block">
              <button @click.stop="showColumnMenu = !showColumnMenu" class="p-1 rounded hover:bg-bg-surface/50 cursor-pointer">
                <i class="fa-regular fa-columns-3"></i>
              </button>

              <!-- Column Toggle Menu -->
              <div v-if="showColumnMenu"
                class="column-menu absolute w-[200px] right-0 mt-2 bg-bg-surface border border-border rounded shadow p-2 z-50">
                <div v-for="col in props.columns" :key="'toggle-' + col.key" class="flex items-center space-x-2">
                  <span @click="toggleColumn(col.key)" class="cursor-pointer text-lg">
                    <i :class="visibleColumnKeys.includes(col.key) ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                  </span>
                  <span>{{ col.label }}</span>
                </div>
                <div v-if="canCreateVariable" @click="emit('addVar')" class=" sticky bottom-0 bg-bg-dropdown shadow-md shadow-border  capitalize border-t  border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover  cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap ">
                  <i class="fa-solid fa-plus"></i> Add new
                </div>
              </div>

            </div>
          </th>


        </tr>
      </thead>


      <!-- BODY -->
      <tbody class="bg-bg-surface/20">

        <!-- SKELETON LOADING -->
        <template v-if="isPending">
          <tr v-for="n in 5" :key="'sk-' + n" class="border-b border-border animate-pulse">
            <td class="p-3">
              <div class="w-4 h-4 bg-bg-surface rounded"></div>
            </td>

            <td v-for="col in columns" :key="col.key" class="p-3 border-r border-border"
              :style="{ width: columnWidths[col.key] + 'px' }">
              <div class="w-full h-4 bg-bg-surface rounded"></div>
            </td>
          </tr>
        </template>

        <!-- ROW INSERT HOVER -->
        <template v-else v-for="(ticket, index) in tickets" :key="ticket?.id">
          <tr v-if="hoverIndex === index && !hasActiveEmptyRow" class="relative bg-bg-surface/20 transition-all cursor-pointer 
                  border border-accent" @mouseleave="hoverIndex = null">
            <td class="!p-0 w-8" @click="insertEmptyRow(index)">
              <span class="absolute left-[-6px] top-[-6px] bg-bg-surface border border-border 
                       w-6 h-6 text-sm rounded-md flex justify-center items-center 
                       shadow-sm hover:bg-bg-surface/70">+</span>
            </td>
            <td class="!p-0" :colspan="columns?.length"></td>
          </tr>

          <!-- ACTUAL ROW -->
          <tr @mouseenter="hoverIndex = index"
            class="border-b border-border !bg-bg-surface/20 hover:bg-bg-surface/40 transition-colors">
            <td class="p-2"></td>

            <td v-for="col in visibleColumns" :key="col?.key" class="p-2 border-r border-border truncate"
              :style="{ width: columnWidths[col.key] + 'px' }">

              <!-- Editable input -->
              <input v-if="editing?.id === ticket?.id && editing?.field === col?.key" v-model="ticket[col?.key]"
                @blur="finishEdit(ticket)" class="w-full p-1 border border-border/60 rounded-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300
                       bg-bg-surface"
                :ref="(el: any) => el && editing?.id === ticket?.id && editing?.field === col?.key && (titleInput = el)" />

              <!-- Display value -->
              <span v-else class="cursor-text hover:underline text-text-primary truncate block"
                @click="editField(ticket, col?.key)">
                {{ ticket[col?.key] || 'Click to edit' }}
              </span>

              <!-- Slot Renderer -->
              <slot v-else :name="col.key" :row="ticket" :column="col" :index="`r-${ticket._id}`">
                <component :is="RenderCell" :row="ticket" :column="col" :index="ticket._id" />
              </slot>
            </td>
          </tr>
        </template>

        <!-- ADD NEW ROW FOOTER -->
        <tr v-if="!hasActiveEmptyRow && canCreate" @click="insertEmptyRow(tickets?.length)" class="sticky bottom-0 bg-bg-surface border-t border-border cursor-pointer
                 transition hover:bg-bg-surface/70" @mouseenter="hoverIndex = tickets?.length"
          @mouseleave="hoverIndex = null">
          <!-- <td class="p-2">
            <span class="inline-flex w-5 h-5 border border-border rounded-full 
                     justify-center items-center text-secondary
                     hover:bg-bg-surface/50 transition">+</span>
          </td> -->
          <td :colspan="columns.length" class="p-2 text-text-secondary">
            <span class="inline-flex w-5 h-5 border border-border rounded-full 
                     justify-center items-center text-secondary
                     hover:bg-bg-surface/50 transition">+</span> Add New Row
          </td>
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
  visible?: boolean // optional, default true
}

type Row = Record<string, any>

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Row[]
  isPending: boolean
  canCreate?: boolean
  canCreateVariable?: boolean
}>(), {
  canCreate: true,
  canCreateVariable: true
})

const emit = defineEmits<{
  (e: 'update:rows', val: Row[]): void
  (e: 'create', val: any): void
  (e: 'toggleVisibility', val: any, v:any): void
  (e: 'addVar'): void

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

// resize control 
// Track column widths
const columnWidths = reactive<Record<string, any>>({})

// Initialize widths on mount
watch(() => props.columns, cols => {
  cols.forEach((col, indx) => {
    if (indx == 0) columnWidths[col.key] = null // start with null, i.e., auto
    else if (!columnWidths[col.key]) columnWidths[col.key] = 150 // default width
  })
}, { immediate: true })

let resizingCol: string | null = null
let startX = 0
let startWidth = 0

const startResize = (e: MouseEvent, colKey: string) => {
  resizingCol = colKey
  startX = e.clientX
  startWidth = columnWidths[colKey]

  document.addEventListener("mousemove", onResize)
  document.addEventListener("mouseup", stopResize)
}

const onResize = (e: MouseEvent) => {
  if (!resizingCol) return
  const dx = e.clientX - startX
  const newWidth = Math.max(80, startWidth + dx)
  columnWidths[resizingCol] = newWidth
}

const stopResize = () => {
  resizingCol = null
  document.removeEventListener("mousemove", onResize)
  document.removeEventListener("mouseup", stopResize)
}
// Close menu on click outside (optional)
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.column-menu')) {
    showColumnMenu.value = false
  }
})

const visibleColumnKeys = ref<string[]>(
  props.columns.filter(c => c.visible ?? true).map(c => c.key)
)

const visibleColumns = computed(() =>
  props.columns.filter(c => visibleColumnKeys.value.includes(c.key))
)


// Show/hide menu
const showColumnMenu = ref(false)

// Close menu on click outside
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.column-menu')) {
    showColumnMenu.value = false
  }
})

const toggleColumn = (key: string) => {
  const index = visibleColumnKeys.value.indexOf(key)
  if (index === -1) {
    emit('toggleVisibility', key, true)
    visibleColumnKeys.value.push(key)
  } else {
    emit('toggleVisibility', key, false)
    visibleColumnKeys.value.splice(index, 1)
  }
}

</script>
