<template>
  <div class="overflow-auto rounded-lg border border-border bg-card shadow" role="region"
    :aria-busy="loading ? 'true' : 'false'" aria-live="polite">
    <table class="min-w-full text-sm text-left" role="grid">
      <!-- Header -->
      <thead class="bg-bg-surface text-text-secondary font-semibold sticky top-0 z-[1]">
        <tr role="row">
          <th v-for="(col, cIdx) in resolvedColumns" :key="col.key" scope="col" :style="columnStyle(col)"
            class="px-4.5 py-2 whitespace-nowrap text-sm text-text-primary font-medium capitalize select-none"
            :class="[col.headerClass, alignClass(col.headerAlign || col.align)]" :aria-colindex="cIdx + 1">
            <button v-if="col.sortable" type="button" class="inline-flex items-center gap-1"
              @click="toggleSort(col.key)" :aria-sort="ariaSort(col.key)">
              <slot :name="`${col.key}-header`" :column="col">
                {{ col.label }}
              </slot>
              <span class="text-xs" aria-hidden="true">
                {{ sort.key === col.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕' }}
              </span>
            </button>

            <template v-else>
              <slot :name="`${col.key}-header`" :column="col">
                {{ col.label }}
              </slot>
            </template>
          </th>
        </tr>
      </thead>

      <!-- Data rows -->
      <tbody v-if="!loading && visibleRows.length" class="divide-y divide-border text-text-secondary">
        <tr v-for="(row, rIdx) in visibleRows" :key="rowKey(row, rIdx)" class="transition-all duration-100" :class="[
          hover ? 'hover:bg-surface cursor-pointer' : '',
          striped && rIdx % 2 === 1 ? 'bg-bg-surface/40' : '',
          rowClass?.(row, rIdx)
        ]" @click="emitRowClick(row, rIdx)" @keydown.enter.prevent="emitRowClick(row, rIdx)" tabindex="0" role="row"
          :aria-rowindex="rowIndex(rIdx)">
          <td v-for="(col, cIdx) in resolvedColumns" :key="col.key" class="px-4.5 py-4 align-center"
            :class="[col.class, alignClass(col.align)]" :aria-colindex="cIdx + 1">
            <!-- Priority: named slot > column.render > column.accessor > direct key -->
            <slot :name="col.key" :row="row" :column="col" :index="rIdx">
              <component :is="RenderCell" :row="row" :column="col" :index="rIdx" />
            </slot>
          </td>
        </tr>
      </tbody>

      <!-- Skeleton rows -->
      <tbody v-else-if="loading" class="divide-y divide-border text-text-secondary">
        <tr v-for="n in resolvedSkeletonRows" :key="n" class="animate-pulse">
          <td v-for="(col, colIdx) in resolvedColumns" :key="col.key" class="px-4.5 py-4">
            <slot :name="`skeleton-${col.key}`">
              <div class="h-4 rounded bg-bg-surface" :class="skeletonWidth(colIdx)" />
              <br>
              <div class="h-2 rounded bg-bg-surface" :class="skeletonWidth(colIdx)" />
            </slot>
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
    <div v-if="showPagination"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 border-t border-border"
      role="navigation" aria-label="Pagination">
      <div class="text-xs sm:text-sm text-text-secondary">
        <template v-if="!loading">
          Showing <span class="font-medium">{{ rangeStart }}</span>–<span class="font-medium">{{ rangeEnd }}</span>
          of <span class="font-medium">{{ totalItems }}</span>
        </template>
        <template v-else>Loading…</template>
      </div>

      <div class="flex items-center gap-2">
        <!-- page size -->
        <label class="text-xs sm:text-sm text-text-secondary" for="page-size">Rows per page:</label>
        <select id="page-size" class="px-2 py-1 rounded-md border border-border bg-bg-card text-sm text-text-secondary"
          :value="pageSize" @change="onPageSizeChange(($event.target as HTMLSelectElement).value)">
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>

        <!-- pager -->
      <!-- pager -->
<nav class="flex items-center gap-1">
  <!-- Prev -->
  <button
    type="button"
    class="px-2.5 py-1.5 rounded-md text-sm border border-transparent hover:border-border disabled:opacity-40"
    :disabled="pageRef <= 1 || loading"
    @click="setPage(pageRef - 1)"
  >
    Prev
  </button>

  <!-- Numbered pages -->
  <button
    v-for="p in pageList"
    :key="`p-${p}`"
    type="button"
    class="px-2.5 py-1.5 rounded-md text-sm border"
    :class="[
      p === '…'
        ? 'cursor-default border-transparent text-text-secondary'
        : (p === pageRef
            ? 'bg-bg-body text-text-primary border-border'
            : 'border-border hover:bg-bg-dropdown-menu-hover')
    ]"
    :disabled="p === '…' || loading"
    @click="typeof p === 'number' && setPage(p as number)"
  >
    {{ p }}
  </button>

  <!-- Next -->
  <button
    type="button"
    class="px-2.5 py-1.5 rounded-md text-sm border border-transparent hover:border-border disabled:opacity-40"
    :disabled="pageRef >= totalPages || loading"
    @click="setPage(pageRef + 1)"
  >
    Next
  </button>
</nav>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, h, type VNodeChild, watch, ref } from 'vue'

/** Column config */
export interface Column<T = Row> {
  key: string
  label: string
  /** enable header sort toggle */
  sortable?: boolean
  /** cell/header alignment */
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  /** utility classes */
  class?: string
  headerClass?: string
  /** fixed width (px, %, ch, etc.) */
  width?: string | number
  /** custom accessor (for deep paths or computed values) */
  accessor?: (row: T) => unknown
  /** custom render function (fallback to slots if provided) */
  render?: (ctx: { row: T; column: Column<T>; value: unknown; index: number }) => VNodeChild
}

export type Row = Record<string, any>

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Row[]

  /** loading state & skeleton rows */
  loading?: boolean
  skeletonRows?: number

  /** pagination (v-model) */
  page?: number
  pageSize?: number

  /** server-side total; omit/null for client-side */
  total?: number | null

  /** page size options */
  pageSizes?: number[]

  /** UI options */
  hover?: boolean
  striped?: boolean

  /** key/class hooks */
  itemKey?: (row: Row, idx: number) => string | number
  rowClass?: (row: Row, idx: number) => string

  /** sorting */
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
  /** per-column sorter overrides */
  sorters?: Record<string, (a: Row, b: Row, dir: 'asc' | 'desc') => number>
}>(), {
  loading: false,
  skeletonRows: 8,
  page: 1,
  pageSize: 10,
  total: null,
  pageSizes: () => [10, 20, 50, 100],
  hover: true,
  striped: false
})

const emit = defineEmits<{
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'page-change', payload: { page: number; pageSize: number }): void
  (e: 'row-click', payload: { row: Row; index: number }): void
  (e: 'sort-change', payload: { key: string | null; dir: 'asc' | 'desc' | null }): void
}>()


/* Sorting state */
const sort = reactive<{ key: string | null; dir: 'asc' | 'desc' | null }>(
  {
    key: props.defaultSort?.key ?? null,
    dir: props.defaultSort?.dir ?? null
  }
)

const resolvedColumns = computed(() => props.columns)

/* Utility: deep-get using dot path */
function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  if (!path.includes('.')) return obj[path]
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

/* Utility: Intl-aware string comparison, stable sorting */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
function defaultCompare(a: any, b: any, dir: 'asc' | 'desc') {
  // Normalize values for compare
  const isNullishA = a == null
  const isNullishB = b == null
  if (isNullishA && isNullishB) return 0
  if (isNullishA) return dir === 'asc' ? -1 : 1
  if (isNullishB) return dir === 'asc' ? 1 : -1
  if (typeof a === 'string' && typeof b === 'string') {
    return dir === 'asc' ? collator.compare(a, b) : collator.compare(b, a)
  }
  if (a < b) return dir === 'asc' ? -1 : 1
  if (a > b) return dir === 'asc' ? 1 : -1
  return 0
}

/* Decide value for a given cell */
function cellValue(row: Row, col: Column) {
  if (col.accessor) return col.accessor(row)
  return getByPath(row, col.key)
}

/* RenderCell component to allow function-based rendering as fallback */
const RenderCell = (props2: { row: Row; column: Column; index: number }) => {
  const val = cellValue(props2.row, props2.column)
  if (props2.column.render) {
    return props2.column.render({ row: props2.row, column: props2.column, value: val, index: props2.index })
  }
  // Default textual render
  return h('span', String(val ?? ''))
}



function emitRowClick(row: Row, index: number) {
  if (props.loading || !row) return
  emit('row-click', { row, index }) // parent decides navigation/action
}

/* Keys & skeleton helpers */
const resolvedSkeletonRows = computed(() => props.skeletonRows ?? 8)
const widthCycle = ['w-24', 'w-32', 'w-16', 'w-40', 'w-20', 'w-28']
function skeletonWidth(idx: number) {
  return widthCycle[idx % widthCycle.length]
}
function rowKey(row: Row, idx: number) {
  return props.itemKey ? props.itemKey(row, idx) : (row._id ?? idx)
}
function rowIndex(rIdx: number) {
  // 1-based index including header row
  return rIdx + 2
}

/* Sorting interaction */
function toggleSort(key: string) {
  if (sort.key !== key) {
    sort.key = key
    sort.dir = 'asc'
  } else {
    sort.dir = sort.dir === 'asc' ? 'desc' : (sort.dir === 'desc' ? null : 'asc')
    if (sort.dir === null) sort.key = null
  }
  emit('sort-change', { key: sort.key, dir: sort.dir })
}
function ariaSort(key: string) {
  if (sort.key !== key || !sort.dir) return 'none'
  return sort.dir === 'asc' ? 'ascending' : 'descending'
}

/* Styling helpers */
function alignClass(align?: 'left' | 'center' | 'right') {
  switch (align) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
  }
}
function columnStyle(col: Column) {
  const w = col.width
  return w != null ? { width: typeof w === 'number' ? `${w}px` : String(w) } : undefined
}


const pageRef = ref(props.page)
const pageSizeRef = ref(props.pageSize)

// 🔹 Allow optional external control: if parent changes props, sync our internals
watch(() => props.page, (v) => { if (typeof v === 'number' && v > 0) pageRef.value = v })
watch(() => props.pageSize, (v) => { if (typeof v === 'number' && v > 0) pageSizeRef.value = v })

/* Modes + totals */
const isServer = computed(() => props.total !== null && props.total !== undefined)
// use internal pageSizeRef here
const totalItems = computed(() => (isServer.value ? (props.total as number) : props.rows.length))
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSizeRef.value)))

/* Sorting state — unchanged */
// ... sort/reactive etc ...

/* Client-side processing (sort + slice) */
const clientRows = computed(() => {
  if (props.loading) return [] as Row[]
  let r = props.rows.slice()

  if (sort.key) {
    const dir = sort.dir ?? 'asc'
    const key = sort.key
    const sorter =
      props.sorters?.[key] ??
      ((a: Row, b: Row, d: 'asc' | 'desc') => {
        const col = resolvedColumns.value.find(c => c.key === key)
        const av = col?.accessor ? col.accessor(a) : getByPath(a, key)
        const bv = col?.accessor ? col.accessor(b) : getByPath(b, key)
        return defaultCompare(av, bv, d)
      })

    r = r
      .map((item, idx) => ({ item, idx }))
      .sort((x, y) => {
        const cmp = sorter(x.item, y.item, dir)
        return cmp === 0 ? x.idx - y.idx : cmp
      })
      .map(({ item }) => item)
  }

  const start = (pageRef.value - 1) * pageSizeRef.value
  return r.slice(start, start + pageSizeRef.value)
})

const visibleRows = computed(() => (isServer.value ? props.rows : clientRows.value))

/* Range text — use internal refs */
const rangeStart = computed(() => (totalItems.value === 0 ? 0 : (pageRef.value - 1) * pageSizeRef.value + 1))
const rangeEnd = computed(() => Math.min(pageRef.value * pageSizeRef.value, totalItems.value))
const showPagination = computed(() => totalItems.value > 0 || props.loading)

/* Page list with ellipses — use internal pageRef */
const pageList = computed<(number | '…')[]>(() => {
  const p = pageRef.value
  const t = totalPages.value
  const max = 7
  if (t <= max) return Array.from({ length: t }, (_, i) => i + 1)
  if (p <= 4) return [1, 2, 3, 4, 5, '…', t]
  if (p >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t]
  return [1, '…', p - 1, p, p + 1, '…', t]
})

/* Events — INTERNAL ONLY now */
function setPage(next: number) {
  const bounded = Math.min(Math.max(1, next), totalPages.value)
  if (bounded === pageRef.value) return
  pageRef.value = bounded
  // ❌ no emits — internal control
}

function onPageSizeChange(val: string) {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0) return
  pageSizeRef.value = n
  pageRef.value = 1 // reset to first page
  // ❌ no emits — internal control
}


</script>
