<template>
  <div class="" @scroll="onScroll">
    <div class="kanban-table space-y-4  h-[85vh] mt-4 overflow-y-auto overflow-x-auto ps-4 mb-5 ">

    <table class="w-full table-fixed border-collapse rounded-[6px] shadow-sm 
             bg-bg-body/20 text-sm
             border border-border/60 ">

      <!-- HEADER -->
      <thead class="bg-bg-surface border-b border-border sticky top-[-1px] z-10 ">
        <tr class="text-text-secondary">
          <th class="w-8 p-0 sticky left-0 z-20 bg-bg-surface"></th>
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
                class="column-menu absolute w-[200px] -right-1 bg-bg-dropdown border border-border rounded shadow z-50">
                <div v-for="col in props.columns.filter(c => c.label.toLowerCase() !== 'process')" :key="'toggle-' + col.key" class="flex items-center space-x-2 px-3 py-1.5 capitalize font-medium cursor-pointer hover:bg-bg-dropdown-menu-hover text-[12px] text-text-primary gap-2">
                 <input
                  type="checkbox"
                 :checked="visibleColumnKeys.includes(col.key)"
                 @change="toggleColumn(col.key)"
                 class="h-4 w-4 mt-0.5 rounded border-border accent-accent cursor-pointer flex-shrink-0"
               />
                  <span>{{ col.label }}</span>
                </div>
                <div v-if="canCreateVariable" @click="emit('addVar')" class=" sticky bottom-0 bg-bg-dropdown shadow-md mt-2 shadow-border  capitalize border-t  border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover  cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap ">
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
            <td>
              <div class="w-4 h-4 bg-bg-surface rounded"></div>
            </td>

            <td v-for="(col, i) in columns" :key="col.key" class=" border-r border-border h-8"
              :style="{ width: columnWidths[col.key] + 'px' }"
              :colspan="i === visibleColumns.length - 1 ? 2 : 1"
              >
              <div class="w-full h-4 bg-bg-surface rounded"></div>
            </td>
          </tr>
        </template>

        <!-- ROW INSERT HOVER -->
        <template v-else v-for="(ticket, index) in tickets" :key="ticket?.id">
          <tr v-if="hoverIndex === index && !hasActiveEmptyRow" class="relative bg-bg-surface/20 transition-all cursor-pointer 
                  border border-accent" @mouseleave="hoverIndex = null">
            <td class="!p-0 w-8" @click="insertEmptyRow(index)">
              <span class="absolute left-[-20px] top-[-14px] bg-bg-surface border border-border 
                       w-6 h-6 text-sm rounded-md flex justify-center items-center 
                       shadow-sm hover:bg-bg-surface pb-[0.5px]">+</span>
            </td>
            <td class="!p-0" :colspan="columns?.length"></td>
          </tr>

          <!-- ACTUAL ROW -->
          <tr @mouseenter="hoverIndex = index"
            class="border-b border-border hover:bg-bg-surface/40 transition-colors">
            <td class="w-8  group text-center align-middle border-r border-border/40 relative">
                 <div class="flex justify-center items-center h-full w-full relative">
                     <div class="h-6 w-5 flex items-center justify-center rounded hover:bg-bg-dropdown-menu-hover cursor-pointer text-text-secondary row-action-btn"
                          @click.stop="toggleRowMenu(ticket._id || ticket.id)">
                         <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                     </div>
                     
                     <!-- Custom Dropdown -->
                     <div v-if="activeMenuId === (ticket._id || ticket.id)" 
                          class="absolute left-6 top-6 bg-bg-dropdown border border-border rounded shadow-md z-50 min-w-[120px] text-left overflow-hidden row-action-menu">
                        <div v-if="canDelete" 
                             @click.stop="() => { emit('delete', ticket); activeMenuId = null; }"
                             class="px-3 py-2 text-xs text-red-500 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-2">
                             <i class="fa-solid fa-trash"></i> Delete
                        </div>
                     </div>
                 </div>
            </td>

            <td v-for="(col,i) in visibleColumns" :key="col?.key" class=" border-r border-border overflow-visible relative h-8"
              :style="{ width: columnWidths[col.key] + 'px' }"
              :colspan="i === visibleColumns.length - 1 ? 2 : 1"
              >
              
              <!-- Editable input -->
              <input v-if="editing?.id === ticket?.id && editing?.field === col?.key" v-model="ticket[col?.key]"
                @blur="finishEdit(ticket)" class=" min-w-[200px] w-full p-1 border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-bg-body  text-[12px] h-8"
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
        <tr v-if="!hasActiveEmptyRow && canCreate" @click="insertEmptyRow(tickets?.length)" class=" bg-bg-surface border-t border-border cursor-pointer
                 transition hover:bg-bg-body" @mouseenter="hoverIndex = tickets?.length"
          @mouseleave="hoverIndex = null">
          <td :colspan="footerColspan" class=" text-text-secondary h-8 px-3">
            <span class="inline-flex w-5 h-5 border border-border-input rounded-full 
                     justify-center items-center text-secondary
                     hover:bg-bg-surface/50 transition pb-0.5">+</span> Add New Row
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, nextTick, computed, watch, h, onUnmounted } from 'vue'

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
  canDelete?: boolean
}>(), {
  canCreate: true,
  canCreateVariable: true,
  canDelete: false
})

const emit = defineEmits<{
  (e: 'update:rows', val: Row[]): void
  (e: 'create', val: any): void
  (e: 'toggleVisibility', val: any, v:any): void
  (e: 'addVar'): void
  (e: 'delete', val: any): void
  (e: 'scroll', val: any): void
}>()

const tickets = reactive<Row[]>(props.rows || [])
const onScroll = (e: Event) => {
  emit('scroll', e);
}
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
    if (indx == 0) columnWidths[col.key] = 250 // start with null, i.e., auto 
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


const visibleColumnKeys = ref<string[]>(
  props.columns.filter(c => c.visible ?? true).map(c => c.key)
)

const visibleColumns = computed(() =>
  props.columns.filter(c => visibleColumnKeys.value.includes(c.key) &&  c.label.toLowerCase() !== 'process')
)


// Show/hide menu
const showColumnMenu = ref(false)

const activeMenuId = ref<string | number | null>(null)

const toggleRowMenu = (id: string | number) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = id
  }
}

// Close menu on click outside
const closeMenus = (e: Event) => {
  if (!(e.target as HTMLElement).closest('.column-menu')) {
    showColumnMenu.value = false
  }
  
  // Close row action menu if clicked outside
  if (!(e.target as HTMLElement).closest('.row-action-btn') && !(e.target as HTMLElement).closest('.row-action-menu')) {
    activeMenuId.value = null
  }
}

document.addEventListener('click', closeMenus)

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
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

const footerColspan = computed(() => {
  return 1 + visibleColumns.value.length + 1
})

</script>
