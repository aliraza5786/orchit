<template>
  <div class="overflow-auto flex flex-col rounded-lg border border-border bg-bg-card/90 shadow" role="region"
    :aria-busy="loading ? 'true' : 'false'" aria-live="polite">
    <table class="min-w-[700px] text-left text-sm" role="grid">
      <!-- Header -->
      <thead v-if="showHeader" class="sticky top-0 z-[1] bg-bg-surface font-semibold text-text-secondary/90">
        <tr role="row">
          <th v-for="(col, cIdx) in resolvedColumns" :key="col.key" scope="col" :style="columnStyle(col)"
            class="select-none whitespace-nowrap px-4.5 py-2 text-sm font-medium capitalize text-text-primary"
            :class="[col.headerClass, alignClass(col.headerAlign || col.align)]" :aria-colindex="cIdx + 1">
            <button v-if="col.sortable" type="button"
              class="inline-flex items-center gap-1 outline-none transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-orange-300"
              @click="toggleSort(col.key)" :aria-sort="ariaSort(col.key)">
              <slot :name="`${col.key}-header`" :column="col">{{ col.label }}</slot>
              <span class="text-xs" aria-hidden="true">
                {{ sort.key === col.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕' }}
              </span>
            </button>
            <template v-else>
              <slot :name="`${col.key}-header`" :column="col">{{ col.label }}</slot>
            </template>
          </th>
        </tr>
      </thead>

      <!-- Data rows -->
      <tbody v-if="!loading && visibleRows.length > 0" class="divide-y divide-border text-text-secondary">
        <tr v-for="(row, rIdx) in visibleRows" :key="rowKey(row, rIdx)" role="row" :aria-rowindex="rowIndex(rIdx)"
          tabindex="0" @click="emitRowClick(row, rIdx)" @keydown.enter.prevent="emitRowClick(row, rIdx)"
          class="transition-colors duration-150" :class="[
            hover ? 'hover:bg-bg-surface/60 cursor-pointer' : '',
            striped && rIdx % 2 === 1 ? 'bg-bg-surface/40' : '',
            rowClass?.(row, rIdx)
          ]" :draggable="rowDraggable || false"
          @dragstart="$emit('row-dragstart', { row, index: rIdx, $event: $event })"
          @dragend="$emit('row-dragend', { row, index: rIdx, $event: $event })">
          <td v-for="(col, cIdx) in resolvedColumns" :key="col.key" class="px-4.5 py-4 align-middle"
            :class="[col.class, alignClass(col.align)]" :aria-colindex="cIdx + 1">
            <slot :name="col.key" :row="row" :column="col" :index="rIdx">
              <component :is="RenderCell" :row="row" :column="col" :index="rIdx" />
            </slot>
          </td>
        </tr>
      </tbody>


      <!-- Skeleton rows -->
      <tbody v-else-if="loading" class="divide-y divide-border text-text-secondary">
        <tr v-for="n in resolvedSkeletonRows" :key="n">
          <td v-for="(col, colIdx) in resolvedColumns" :key="col.key" class="px-4.5 py-4">
            <div class="h-4 rounded bg-[length:200%_100%] animate-shimmer"
              :class="[skeletonWidth(colIdx), 'bg-gradient-to-r from-slate-200/80 via-slate-300/90 to-slate-200/80 dark:from-slate-700/50 dark:via-slate-600/60 dark:to-slate-700/50']" />
          </td>
        </tr>
        <tr class="sr-only">
          <td :colspan="resolvedColumns.length">Loading…</td>
        </tr>
      </tbody>

      <!-- Empty state -->
      <tbody v-else>
        <tr>
          <td :colspan="resolvedColumns.length" class="px-4.5 py-10 text-center text-text-secondary/70">
            <slot name="empty">No data</slot>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination bar -->
    <div v-if="showPagination && pagination"
      class="flex items-center mt-auto sticky bottom-0 bg-bg-surface justify-between gap-3 border-t border-border px-3 py-2 sm:flex-row min-w-[700px]" role="navigation"
      aria-label="Pagination">
      <div class="text-xs text-text-secondary sm:text-sm">
        <template v-if="!loading">
          Showing <span class="font-medium">{{ rangeStart }}</span>–<span class="font-medium">{{ rangeEnd }}</span>
          of <span class="font-medium">{{ totalItems }}</span>
        </template>
        <template v-else>Loading…</template>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs text-text-secondary sm:text-sm" for="page-size">Rows per page:</label>
        <select id="page-size"
          class="rounded-md border border-border bg-bg-card px-2 py-1 text-sm text-text-secondary outline-none transition focus-visible:ring-2 focus-visible:ring-orange-300"
          :value="pageSizeRef" @change="onPageSizeChange(($event.target as HTMLSelectElement).value)">
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>

        <!-- Pager -->
        <nav class="flex items-center gap-1" aria-label="Pages">
          <button type="button"
            class="rounded-md border border-transparent px-2.5 py-1.5 text-sm outline-none transition hover:border-border focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-40"
            :disabled="pageRef <= 1 || loading" @click="setPage(pageRef - 1)">
            Prev
          </button>

          <button v-for="p in pageList" :key="`p-${p}`" type="button"
            class="rounded-md border px-2.5 py-1.5 text-sm outline-none transition" :class="[
              p === '…'
                ? 'cursor-default border-transparent text-text-secondary'
                : p === pageRef
                  ? 'border-border bg-bg-body text-text-primary shadow-sm'
                  : 'border-border hover:bg-bg-dropdown-menu-hover focus-visible:ring-2 focus-visible:ring-orange-300'
            ]" :disabled="p === '…' || loading" @click="typeof p === 'number' && setPage(p as number)">
            {{ p }}
          </button>

          <button type="button"
            class="rounded-md border border-transparent px-2.5 py-1.5 text-sm outline-none transition hover:border-border focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-40"
            :disabled="pageRef >= totalPages || loading" @click="setPage(pageRef + 1)">
            Next
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, h, watch, ref } from 'vue'

/** Column config */
export interface Column<T = Row> {

  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  class?: string
  headerClass?: string
  width?: string | number
  accessor?: (row: T) => unknown
  // render?: (ctx: { row: T; column: Column<T>; value: unknown; index: number }) => VNodeChild
    render?: any
}

export type Row = Record<string, unknown>

const props = withDefaults(
  defineProps<{
    // props
    showHeader?:boolean
    pagination?:boolean
    rowDraggable?: boolean

    columns: Column[]
    rows: Row[]
    loading?: boolean
    skeletonRows?: number
    page?: number
    pageSize?: number
    total?: number | null
    pageSizes?: number[]
    hover?: boolean
    striped?: boolean
    itemKey?: (row: Row, idx: number) => string | number
    rowClass?: (row: Row, idx: number) => string
    defaultSort?: { key: string; dir: 'asc' | 'desc' }
    sorters?: Record<string, (a: Row, b: Row, dir: 'asc' | 'desc') => number>
  }>(),
  {
    pagination:true,
    showHeader:true,
    loading: false,
    skeletonRows: 8,
    page: 1,
    pageSize: 10,
    total: null,
    pageSizes: () => [10, 20, 50, 100],
    hover: true,
    striped: false,
  }
)

const emit = defineEmits<{
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'page-change', payload: { page: number; pageSize: number }): void
  (e: 'row-click', payload: { row: Row; index: number }): void
  (e: 'row-dragstart', payload: { row: Row; index: number, $event: any }): void
  (e: 'row-dragend', payload: { row: Row; index: number, $event: any }): void
  (e: 'sort-change', payload: { key: string | null; dir: 'asc' | 'desc' | null }): void
}>()

/* Sorting */
const sort = reactive<{ key: string | null; dir: 'asc' | 'desc' | null }>(
  {
    key: props.defaultSort?.key ?? null,
    dir: props.defaultSort?.dir ?? null,
  }
)

const resolvedColumns = computed(() => props.columns)

/* Helpers */
function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  if (!path.includes('.')) return obj[path]
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
function defaultCompare(a: any, b: any, dir: 'asc' | 'desc') {
  if (a == null && b == null) return 0
  if (a == null) return dir === 'asc' ? -1 : 1
  if (b == null) return dir === 'asc' ? 1 : -1
  if (typeof a === 'string' && typeof b === 'string') {
    return dir === 'asc' ? collator.compare(a, b) : collator.compare(b, a)
  }
  if (a < b) return dir === 'asc' ? -1 : 1
  if (a > b) return dir === 'asc' ? 1 : -1
  return 0
}

function cellValue(row: Row, col: Column) {
  return col.accessor ? col.accessor(row) : getByPath(row, col.key)
}

const RenderCell = (p: { row: Row; column: Column; index: number }) => {
  const val = cellValue(p.row, p.column)
  if (p.column.render) return p.column.render({ row: p.row, column: p.column, value: val, index: p.index })
  return h('span', String(val ?? ''))
}

function emitRowClick(row: Row, index: number) {
  if (props.loading || !row) return
  emit('row-click', { row, index })
}

/* Skeleton + keys */
const resolvedSkeletonRows = computed(() => props.skeletonRows ?? 8)
const widthCycle = ['w-24', 'w-32', 'w-16', 'w-40', 'w-20', 'w-28']
const skeletonWidth = (idx: number) => widthCycle[idx % widthCycle.length]
const rowKey = (row: Row, idx: number) => (props.itemKey ? props.itemKey(row, idx) : ((row as any)._id ?? idx))
const rowIndex = (rIdx: number) => rIdx + 2 // include header row

/* Sorting interaction */
function toggleSort(key: string) {
  if (sort.key !== key) {
    sort.key = key
    sort.dir = 'asc'
  } else {
    sort.dir = sort.dir === 'asc' ? 'desc' : sort.dir === 'desc' ? null : 'asc'
    if (sort.dir === null) sort.key = null
  }
  emit('sort-change', { key: sort.key, dir: sort.dir })
}
const ariaSort = (key: string) => (sort.key !== key || !sort.dir ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending')

/* Styling helpers */
function alignClass(align?: 'left' | 'center' | 'right') {
  return align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
}
const columnStyle = (col: Column) => (col.width != null ? { width: typeof col.width === 'number' ? `${col.width}px` : String(col.width) } : undefined)

/* Pagination state (internally controlled but emits for v-model compatibility) */
const pageRef = ref(props.page)
const pageSizeRef = ref(props.pageSize)
watch(
  () => props.page,
  (v) => {
    if (typeof v === 'number' && v > 0) pageRef.value = v
  }
)
watch(
  () => props.pageSize,
  (v) => {
    if (typeof v === 'number' && v > 0) pageSizeRef.value = v
  }
)

/* Totals + mode */
const isServer = computed(() => props.total != null)
const totalItems = computed(() => (isServer.value ? (props.total as number) : props.rows.length))
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSizeRef.value)))

/* Processing (client-side sort + slice when not server mode) - memoized */
const sortedRows = computed(() => {
  if (props.loading) return [] as Row[]
  const r = props.rows

  if (!sort.key || !sort.dir) return r

  const dir = sort.dir
  const key = sort.key
  const col = resolvedColumns.value.find((c) => c.key === key)
  const sorter = props.sorters?.[key]

  return r.slice().sort((a, b) => {
    if (sorter) return sorter(a, b, dir)
    const av = col?.accessor ? col.accessor(a) : getByPath(a, key)
    const bv = col?.accessor ? col.accessor(b) : getByPath(b, key)
    return defaultCompare(av, bv, dir)
  })
})

const clientRows = computed(() => {
  const rows = sortedRows.value
  const start = (pageRef.value - 1) * pageSizeRef.value
  return rows.slice(start, start + pageSizeRef.value)
})

const visibleRows = computed(() => (isServer.value ? props.rows : clientRows.value))

/* Ranges */
const rangeStart = computed(() => (totalItems.value === 0 ? 0 : (pageRef.value - 1) * pageSizeRef.value + 1))
const rangeEnd = computed(() => Math.min(pageRef.value * pageSizeRef.value, totalItems.value))
const showPagination = computed(() => totalItems.value > 0 || props.loading)

/* Page list with ellipses */
const pageList = computed<(number | '…')[]>(() => {
  const p = pageRef.value
  const t = totalPages.value
  const max = 7
  if (t <= max) return Array.from({ length: t }, (_, i) => i + 1)
  if (p <= 4) return [1, 2, 3, 4, 5, '…', t]
  if (p >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t]
  return [1, '…', p - 1, p, p + 1, '…', t]
})

/* Pager actions */
function setPage(next: number) {
  const bounded = Math.min(Math.max(1, next), totalPages.value)
  if (bounded === pageRef.value) return
  pageRef.value = bounded
  emit('update:page', bounded)
  emit('page-change', { page: bounded, pageSize: pageSizeRef.value })
}
function onPageSizeChange(val: string) {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0) return
  pageSizeRef.value = n
  pageRef.value = 1
  emit('update:pageSize', n)
  emit('update:page', 1)
  emit('page-change', { page: 1, pageSize: n })
}
</script>

<style scoped>
/* Skeleton shimmer keyframes (uses Tailwind arbitrary values above) */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
