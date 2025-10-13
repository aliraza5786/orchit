<template>
  <div class="overflow-x-auto rounded bg-bg-card text-sm  ">
    <table
      class="min-w-[1230px] w-full table-auto border-collapse text-left"
      :aria-busy="loading ? 'true' : 'false'"
    >
      <thead class="bg-bg-body text-text-secondary font-semibold ">
        <tr>
          <th
            class="sticky left-0 px-4.5 py-3.5 text-sm font-medium  text-text-primary border border-border "
          >
            Projects
          </th>
          <th
            v-for="col in columns"
            :key="col"
            class="px-4.5 py-3.5 whitespace-nowrap text-center text-sm font-medium text-text-primary  border border-border"
          >
            {{ col }}
          </th>
        </tr>
      </thead>

      <!-- Data rows -->
      <tbody v-if="!loading && visibleRows.length">
        <tr
          v-for="(row, rowIndex) in visibleRows"
          :key="row.id ?? row._id ?? rowIndex"
          class="hover:bg-bg-body "
        >
          <!-- Sticky first column -->
          <td
            class="sticky left-0 z-[2] flex items-center gap-2 px-4.5 py-3.5 border-t border-l border-border bg-bg-body  text-text-secondary"
          >
            <!-- <img :src="getIcon(row)" class="h-5 w-5 rounded-md" /> -->
            <span>{{ getTitle(row) }}</span>
          </td>

          <!-- Dynamic status cells -->
          <td
            v-for="(col, cIdx) in columns"
            :key="cIdx"
            class="px-4.5 py-3.5 text-center border border-border text-text-secondary"
          >
            <span :class="statusClass(row[col])">{{ row[col] ?? '—' }}</span>
          </td>
        </tr>
      </tbody>

      <!-- Skeleton rows -->
      <tbody v-else-if="loading">
        <tr v-for="n in resolvedSkeletonRows" :key="'sk-'+n" class="animate-pulse">
          <!-- Sticky first column skeleton -->
          <td
            class="sticky left-0 z-[2] px-4.5 py-3.5 border-t border-border bg-bg-surface "
          >
            <div class="flex items-center gap-2">
              <div class="h-5 w-5 rounded-full bg-bg-card"></div>
              <div class="h-3 rounded bg-bg-card w-32"></div>
            </div>
          </td>

          <!-- Cell skeletons -->
          <td
            v-for="(_, idx) in columns"
            :key="'skc-'+idx"
            class="px-4.5 py-3.5 text-center border border-border"
          >
            <div
              class="h-6 inline-block rounded-full bg-bg-card"
              :class="skeletonWidth(idx)"
            ></div>
          </td>
        </tr>
        <tr class="sr-only">
          <td :colspan="columns.length + 1">Loading…</td>
        </tr>
      </tbody>

      <!-- Empty state -->
      <tbody v-else>
        <tr>
          <td
            :colspan="columns.length + 1"
            class="px-4.5 py-10 text-center text-text-secondary"
          >
            No data
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination bar -->
    <div
      v-if="showPagination"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 "
      role="navigation"
      aria-label="Pagination"
    >
      <div class="text-xs sm:text-sm text-text-secondary ">
        <template v-if="!loading && totalItems > 0">
          Showing <span class="font-medium">{{ rangeStart }}</span>–<span class="font-medium">{{ rangeEnd }}</span>
          of <span class="font-medium">{{ totalItems }}</span>
        </template>
        <template v-else>
          &nbsp;
        </template>
      </div>

      <div class="flex items-center gap-2">
        <!-- Page size -->
        <label class="text-xs sm:text-sm text-text-secondary ">Rows per page:</label>
        <select
          class="px-2 py-1 rounded-md border border-border bg-bg-card text-sm text-text-secondary "
          :value="pageSize"
          @change="onPageSizeChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>

        <!-- Pager -->
        <button
          class="px-2.5 py-1.5 rounded-md text-sm border border-transparent hover:border-border disabled:opacity-40"
          :disabled="page <= 1 || loading"
          @click="setPage(page - 1)"
        >
          Prev
        </button>

        <button
          v-for="p in pageList"
          :key="'p-'+p"
          class="px-2.5 py-1.5 rounded-md text-sm border"
          :class="[
            p === '…'
              ? 'cursor-default border-transparent text-text-secondary'
              : (p === page
                  ? 'bg-bg-surface border-border text-text-primary '
                  : 'border-border-gray  hover:bg-bg-surface ')
          ]"
          :disabled="p === '…' || loading"
          @click="typeof p === 'number' && setPage(p as number)"
        >
          {{ p }}
        </button>

        <button
          class="px-2.5 py-1.5 rounded-md text-sm border border-transparent hover:border-border disabled:opacity-40"
          :disabled="page >= totalPages || loading"
          @click="setPage(page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ProjectRow {
  id?: string | number
  _id?: string | number
  name?: string
  title?: string
  icon?: string
  logo?: string
  [key: string]: any
}

const props = withDefaults(defineProps<{
  columns: string[]
  rows: ProjectRow[]
  /* loading & skeletons */
  loading?: boolean
  skeletonRows?: number
  /* pagination */
  page?: number          // v-model:page (1-based)
  pageSize?: number      // v-model:pageSize
  total?: number | null  // server-side total; omit for client-side
  pageSizes?: number[]
}>(), {
  loading: false,
  skeletonRows: 6,
  page: 1,
  pageSize: 10,
  total: null,
  pageSizes: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'page-change', payload: { page: number; pageSize: number }): void
}>()

/* Fallbacks so either {name,icon} or {title,logo} works */
const getTitle = (row: ProjectRow) => row.title ?? row.name ?? row?.lane_title ??'—'
// const getIcon  = (row: ProjectRow) => row.logo ?? row.icon ?? row?.lane_color?? ''

/* Mode & totals */
const isServer = computed(() => props.total !== null && props.total !== undefined)
const totalItems = computed(() => isServer.value ? (props.total as number) : props.rows.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / props.pageSize)))

/* Visible rows (client-side only) */
const visibleRows = computed(() => {
  if (props.loading) return []
  if (isServer.value) return props.rows
  const start = (props.page - 1) * props.pageSize
  return props.rows.slice(start, start + props.pageSize)
})

/* Range text */
const rangeStart = computed(() => totalItems.value === 0 ? 0 : (props.page - 1) * props.pageSize + 1)
const rangeEnd = computed(() => Math.min(props.page * props.pageSize, totalItems.value))

/* Pagination bar render rule */
const showPagination = computed(() => props.loading || totalItems.value > 0)

/* Page list with ellipses */
const pageList = computed<(number | '…')[]>(() => {
  const p = props.page
  const t = totalPages.value
  const maxButtons = 7
  if (t <= maxButtons) return Array.from({ length: t }, (_, i) => i + 1)
  if (p <= 4) return [1, 2, 3, 4, 5, '…', t]
  if (p >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t]
  return [1, '…', p - 1, p, p + 1, '…', t]
})

/* Events */
function setPage(next: number) {
  const bounded = Math.min(Math.max(1, next), totalPages.value)
  if (bounded === props.page) return
  emit('update:page', bounded)
  emit('page-change', { page: bounded, pageSize: props.pageSize })
}

function onPageSizeChange(val: string) {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0) return
  emit('update:pageSize', n)
  emit('update:page', 1) // reset to first page
  emit('page-change', { page: 1, pageSize: n })
}

/* Skeleton helpers */
const resolvedSkeletonRows = computed(() => props.skeletonRows ?? 6)
const widthCycle = ['w-16', 'w-24', 'w-12', 'w-28', 'w-20', 'w-24']
const skeletonWidth = (idx: number) => widthCycle[idx % widthCycle.length]

/* Status badge classes (light + dark) */
const statusClass = (status: string) => {
  switch (status) {
    case 'Done':
      return [
        'badge',
        'bg-light-green',
        'text-emerald-700',
        'dark:bg-emerald-500/20',
        'emerald-300'
      ].join(' ')
    case 'In progress':
      return [
        'badge',
        'bg-light-blue',
        'text-sky-700',
        'dark:bg-sky-500/20',
        'sky-300'
      ].join(' ')
    default:
      return [
        'badge',
        'bg-bg-surface',
        'text-text-secondary',
      ].join(' ')
  }
}
</script>
