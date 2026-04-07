<template>
  <div class="peak-root bg-bg-card rounded-lg border border-border">
    <!-- Header -->
    <div class="peak-header">
      <div class="peak-header-left">
        <div class="peak-header-icon">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <div>
          <h1 class="peak-title">Peak</h1>
          <p class="peak-subtitle">Live workspace insights</p>
        </div>
      </div>
      <div class="peak-header-actions">
        <button class="btn-ghost" @click="fetchAllPinnedWidgetData" :disabled="store.isLoadingWidgets" title="Refresh all">
          <i class="fa-solid fa-rotate" :class="{ 'fa-spin': store.isLoadingWidgets }"></i>
        </button>
        <button class="btn-primary" @click="openAddModal">
          <i class="fa-solid fa-plus"></i>
          <span>Add Widget</span>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!store.isLoadingWidgets && store.pinnedWidgets.length === 0 && !store.pendingProposal" class="empty-state">
      <div class="empty-icon">
        <i class="fa-solid fa-chart-pie"></i>
      </div>
      <h3 class="empty-title">No widgets yet</h3>
      <p class="empty-desc">Add widgets to track your workspace metrics in real time.</p>
      <button class="btn-primary" @click="openAddModal">
        <i class="fa-solid fa-plus"></i> Add your first widget
      </button>
    </div>

    <!-- Pending agent proposal banner -->
    <div v-if="store.pendingProposal" class="proposal-banner">
      <div class="proposal-banner-left">
        <div class="proposal-badge">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <p class="proposal-title">Agent suggested a widget</p>
          <p class="proposal-name">{{ store.pendingProposal?.title }}</p>
        </div>
      </div>
      <div class="proposal-actions">
        <button class="btn-ghost-sm" @click="store.clearPendingProposal()">Dismiss</button>
        <button class="btn-accent-sm" @click="acceptProposal" :disabled="store.isSaving">
          <i class="fa-solid fa-thumbtack"></i> Pin to Peak
        </button>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="store.isLoadingWidgets" class="widgets-grid">
      <div v-for="i in 4" :key="i" class="widget-card widget-skeleton">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-value"></div>
      </div>
    </div>

    <!-- Widgets grid -->
    <div v-else-if="store.pinnedWidgets.length > 0" class="widgets-grid">
      <div
        v-for="widget in store.pinnedWidgets"
        :key="widget._id"
        class="widget-card"
        :class="{ 'widget-card--loading': store.isWidgetDataLoading(widget._id) }"
      >
        <!-- Card header -->
        <div class="widget-card-header">
          <div
            class="widget-icon-wrap"
            :style="{
              background: widget.color ? widget.color + '18' : 'var(--bg-lavender)',
              color: widget.color || 'var(--accent)',
            }"
          >
            <span class="widget-icon-emoji">{{ widget.icon || '📊' }}</span>
          </div>
          <div class="widget-meta">
            <p class="widget-title">{{ widget.title }}</p>
            <p class="widget-entity">{{ widget.query?.entity }} · {{ widget.query?.result_type }}</p>
          </div>
          <div class="widget-actions">
            <button
              class="icon-btn"
              @click="refreshWidget(widget._id)"
              title="Refresh"
              :disabled="store.isWidgetDataLoading(widget._id)"
            >
              <i class="fa-solid fa-rotate" :class="{ 'fa-spin': store.isWidgetDataLoading(widget._id) }"></i>
            </button>
            <button class="icon-btn" @click="openEditModal(widget)" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              class="icon-btn icon-btn--danger"
              @click="confirmDelete(widget)"
              title="Delete"
              :disabled="store.isWidgetDeleting(widget._id)"
            >
              <i
                class="fa-solid fa-trash"
                :class="{ 'fa-spin': store.isWidgetDeleting(widget._id) }"
              ></i>
            </button>
          </div>
        </div>

        <!-- Card body -->
        <div class="widget-card-body">
          <template v-if="store.isWidgetDataLoading(widget._id)">
            <div class="data-loading">
              <i class="fa-solid fa-circle-notch fa-spin"></i>
            </div>
          </template>

          <template v-else-if="store.getWidgetData(widget._id)">
            <!-- LIST -->
            <template v-if="widget.query?.result_type === 'list'">
              <div class="list-result">
                <div class="list-count-badge">
                  {{ store.getWidgetData(widget._id)?.data?.total ?? 0 }} items
                </div>
                <ul class="list-items">
                  <li
                    v-for="(item, idx) in (store.getWidgetData(widget._id)?.data?.items ?? []).slice(0, 5)"
                    :key="idx"
                    class="list-item"
                  >
                    <span class="list-item-dot" :style="{ background: widget.color || 'var(--accent)' }"></span>
                    <span class="list-item-text">
                      {{ item?.variables?.['card-title'] || item?.title || 'Untitled' }}
                    </span>
                    <span v-if="item?.variables?.['card-status']" class="list-item-status">
                      {{ item.variables['card-status'] }}
                    </span>
                  </li>
                </ul>
                <p v-if="(store.getWidgetData(widget._id)?.data?.total ?? 0) > 5" class="list-more">
                  +{{ (store.getWidgetData(widget._id)?.data?.total ?? 0) - 5 }} more
                </p>
              </div>
            </template>

            <!-- COUNT -->
            <template v-else-if="widget.query?.result_type === 'count'">
              <div class="count-result">
                <p class="count-value" :style="{ color: widget.color || 'var(--accent)' }">
                  {{ (store.getWidgetData(widget._id)?.data?.value ?? 0).toLocaleString() }}
                </p>
                <p class="count-label">
                  {{ store.getWidgetData(widget._id)?.data?.label || widget.description }}
                </p>
              </div>
            </template>

            <!-- COMPUTED -->
            <template v-else-if="widget.query?.result_type === 'computed'">
              <div class="computed-result">
                <div class="computed-main">
                  <p class="computed-value" :style="{ color: widget.color || 'var(--accent)' }">
                    {{ store.getWidgetData(widget._id)?.data?.value ?? 0 }}
                  </p>
                  <p class="computed-unit">{{ store.getWidgetData(widget._id)?.data?.unit }}</p>
                </div>
                <p class="computed-label">{{ store.getWidgetData(widget._id)?.data?.label }}</p>
                <div
                  v-if="store.getWidgetData(widget._id)?.data?.completed != null"
                  class="computed-progress-wrap"
                >
                  <div class="computed-progress-bar">
                    <div
                      class="computed-progress-fill"
                      :style="{
                        width:
                          Math.round(
                            (store.getWidgetData(widget._id)?.data?.completed /
                              store.getWidgetData(widget._id)?.data?.total) *
                              100
                          ) + '%',
                        background: widget.color || 'var(--accent)',
                      }"
                    ></div>
                  </div>
                  <span class="computed-progress-text">
                    {{ store.getWidgetData(widget._id)?.data?.completed }}/{{
                      store.getWidgetData(widget._id)?.data?.total
                    }}
                  </span>
                </div>
              </div>
            </template>

            <!-- CHART -->
            <template v-else-if="widget.query?.result_type === 'chart'">
              <div class="chart-result">
                <div class="chart-total">
                  <span class="chart-total-value">
                    {{ store.getWidgetData(widget._id)?.data?.total ?? 0 }}
                  </span>
                  <span class="chart-total-label">total</span>
                </div>
                <div class="chart-bars">
                  <div
                    v-for="(series, idx) in store.getWidgetData(widget._id)?.data?.series ?? []"
                    :key="idx"
                    class="chart-bar-item"
                  >
                    <div class="chart-bar-label">{{ series.label }}</div>
                    <div class="chart-bar-track">
                      <div
  class="chart-bar-fill"
  :style="{
    width:
      Math.round(
        (Number(series.value) /
          (store.getWidgetData(widget._id)?.data?.total || 1)) *
          100
      ) + '%',
    background: widget.color || getChartColor(idx),
  }"
></div>
                    </div>
                    <div class="chart-bar-val">{{ series.value }}</div>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- No data -->
          <template v-else>
            <div class="no-data">
              <i class="fa-solid fa-circle-info"></i>
              <span>No data — click refresh</span>
            </div>
          </template>
        </div>

        <!-- Card footer -->
        <div class="widget-card-footer">
          <span class="widget-resolved-at" v-if="store.getWidgetData(widget._id)?.resolved_at">
            <i class="fa-regular fa-clock"></i>
            {{ formatTime(store.getWidgetData(widget._id)?.resolved_at) }}
          </span>
          <span class="widget-refresh-interval" v-if="widget.refresh_interval > 0">
            Auto {{ widget.refresh_interval }}s
          </span>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h2 class="modal-title">{{ editingWidget ? 'Edit Widget' : 'Add Widget' }}</h2>
              <button class="icon-btn" @click="closeModal">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="modal-body">
              <!-- Basic Info -->
              <div class="form-section-label">Basic Info</div>

              <div class="form-group">
                <label>Title <span class="required">*</span></label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. My Today Tasks"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Description</label>
                <input
                  v-model="form.description"
                  type="text"
                  placeholder="Optional description"
                  class="form-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Icon (emoji)</label>
                  <input
                    v-model="form.icon"
                    type="text"
                    placeholder="📋"
                    maxlength="2"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Accent color</label>
                  <div class="color-row">
                    <input v-model="form.color" type="color" class="form-color" />
                    <input
                      v-model="form.color"
                      type="text"
                      placeholder="#7D68C8"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Query -->
              <div class="form-section-label">Query</div>

              <div class="form-row">
                <div class="form-group">
                  <label>Entity</label>
                  <select v-model="form.query.entity" class="form-select">
                    <option value="cards">Cards</option>
                    <option value="sprints">Sprints</option>
                    <option value="sprint_backlog">Sprint Backlog</option>
                    <option value="token_usage">Token Usage</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Result type</label>
                  <select v-model="form.query.result_type" class="form-select">
                    <option value="list">List</option>
                    <option value="count">Count</option>
                    <option value="computed">Computed</option>
                    <option value="chart">Chart</option>
                  </select>
                </div>
              </div>

              <!-- Chart-specific fields -->
              <div class="form-row" v-if="form.query.result_type === 'chart'">
                <div class="form-group">
                  <label>Chart type</label>
                  <select v-model="form.query.chart_type" class="form-select">
                    <option value="bar">Bar</option>
                    <option value="pie">Pie</option>
                    <option value="donut">Donut</option>
                    <option value="line">Line</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Group by field</label>
                  <input
                    v-model="form.query.group_by"
                    type="text"
                    placeholder="variables.card-status"
                    class="form-input"
                  />
                </div>
              </div>

              <!-- Computed formula -->
              <div
                class="form-group"
                v-if="form.query.result_type === 'computed' && form.query.entity === 'sprints'"
              >
                <label>Formula</label>
                <select v-model="form.query.formula" class="form-select">
                  <option value="days_until_end">Days until end</option>
                  <option value="days_since_start">Days since start</option>
                  <option value="completion_percentage">Completion %</option>
                </select>
              </div>

              <!-- Filters -->
              <div class="form-section-label">Filters</div>

              <div class="form-row">
                <div class="form-group">
                  <label>Assigned to</label>
                  <select v-model="form.query.filters.assigned_to" class="form-select">
                    <option value="">Anyone</option>
                    <option value="$ME">Me ($ME)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Date filter</label>
                  <select v-model="form.query.filters.date_filter.value" class="form-select">
                    <option value="">None</option>
                    <option value="today">Today</option>
                    <option value="this_week">This week</option>
                    <option value="this_month">This month</option>
                    <option value="next_7_days">Next 7 days</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <!-- Cards-specific filters -->
              <div class="form-row" v-if="form.query.entity === 'cards'">
                <div class="form-group">
                  <label>Status</label>
                  <input
                    v-model="form.query.filters.status"
                    type="text"
                    placeholder="In Progress"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Priority</label>
                  <select v-model="form.query.filters.priority" class="form-select">
                    <option value="">Any</option>
                    <option value="highest">Highest</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="lowest">Lowest</option>
                  </select>
                </div>
              </div>

              <!-- Sprint-specific filters -->
              <div
                class="form-row"
                v-if="form.query.entity === 'sprints' || form.query.entity === 'sprint_backlog'"
              >
                <div class="form-group">
                  <label>Sprint status</label>
                  <select v-model="form.query.filters.sprint_status" class="form-select">
                    <option value="">Any</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <!-- Display -->
              <div class="form-section-label">Display</div>

              <div class="form-row">
                <div class="form-group">
                  <label>Limit (list)</label>
                  <input
                    v-model.number="form.query.limit"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="20"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Auto-refresh (seconds)</label>
                  <input
                    v-model.number="form.refresh_interval"
                    type="number"
                    min="0"
                    placeholder="300"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Sort by</label>
                  <input
                    v-model="form.query.sort_by"
                    type="text"
                    placeholder="created_at"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Sort order</label>
                  <select v-model="form.query.sort_order" class="form-select">
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.is_pinned" class="form-checkbox" />
                  Pin widget to dashboard
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-ghost" @click="closeModal">Cancel</button>
              <button
                class="btn-primary"
                @click="saveWidget"
                :disabled="store.isSaving || !form.title.trim()"
              >
                <i v-if="store.isSaving" class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ editingWidget ? 'Save changes' : 'Create widget' }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div
          v-if="showDeleteModal"
          class="modal-backdrop"
          @click.self="showDeleteModal = false"
        >
          <div class="modal-card modal-card--sm">
            <div class="modal-header">
              <h2 class="modal-title">Delete widget</h2>
              <button class="icon-btn" @click="showDeleteModal = false">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-confirm-text">
                Are you sure you want to delete
                <strong>{{ widgetToDelete?.title }}</strong>? This cannot be undone.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
              <button
                class="btn-danger"
                @click="deleteWidget"
                :disabled="!!widgetToDelete && store.isWidgetDeleting(widgetToDelete._id)"
              >
                <i
                  v-if="!!widgetToDelete && store.isWidgetDeleting(widgetToDelete._id)"
                  class="fa-solid fa-spinner fa-spin"
                ></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useWidgetStore } from '../../stores/widgets'

// ── Types ──────────────────────────────────────────────────────────────────
type Entity = 'cards' | 'sprints' | 'sprint_backlog' | 'token_usage'
type ResultType = 'list' | 'count' | 'computed' | 'chart'
type ChartType = 'bar' | 'pie' | 'donut' | 'line'
type SortOrder = 'asc' | 'desc'
type Priority = '' | 'highest' | 'high' | 'medium' | 'low' | 'lowest'
type SprintStatus = '' | 'planning' | 'active' | 'completed' | 'cancelled'
type DateFilterValue = '' | 'today' | 'this_week' | 'this_month' | 'next_7_days' | 'overdue'
type Formula = 'days_until_end' | 'days_since_start' | 'completion_percentage'

interface WidgetForm {
  title: string
  description: string
  icon: string
  color: string
  is_pinned: boolean
  refresh_interval: number
  query: {
    entity: Entity
    result_type: ResultType
    chart_type: ChartType
    formula: Formula
    group_by: string
    sort_by: string
    sort_order: SortOrder
    limit: number
    filters: {
      assigned_to: string
      status: string
      priority: Priority
      sprint_status: SprintStatus
      date_filter: {
        type: 'relative'
        value: DateFilterValue
      }
    }
  }
}

interface Widget {
  _id: string
  title: string
  description?: string
  icon?: string
  color?: string
  is_pinned: boolean
  is_preview?: boolean
  pin_order?: number
  refresh_interval: number
  query?: {
    entity?: string
    result_type?: string
    chart_type?: string
    formula?: string
    group_by?: string
    sort_by?: string
    sort_order?: string
    limit?: number
    aggregation?: string
    filters?: {
      assigned_to?: string
      status?: string
      priority?: string
      sprint_status?: string
      date_filter?: {
        type?: string
        value?: string
      }
    }
  }
}

// ── Props & store ──────────────────────────────────────────────────────────
const props = defineProps<{ workspaceId: string }>()
const store = useWidgetStore()

// ── Modal state ────────────────────────────────────────────────────────────
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingWidget = ref<Widget | null>(null)
const widgetToDelete = ref<Widget | null>(null)

// ── Form — use ref instead of reactive to avoid deep-merge pitfalls ────────
const defaultForm = (): WidgetForm => ({
  title: '',
  description: '',
  icon: '📊',
  color: '#7D68C8',
  is_pinned: true,
  refresh_interval: 300,
  query: {
    entity: 'cards',
    result_type: 'list',
    chart_type: 'bar',
    formula: 'days_until_end',
    group_by: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 20,
    filters: {
      assigned_to: '$ME',
      status: '',
      priority: '',
      sprint_status: '',
      date_filter: {
        type: 'relative',
        value: 'today',
      },
    },
  },
})

// Use ref<WidgetForm> so reassignment fully replaces the object — no
// Object.assign shallow-merge issues with nested reactive objects.
const form = ref<WidgetForm>(defaultForm())

// ── Auto-refresh timers ────────────────────────────────────────────────────
const refreshTimers = ref<Record<string, ReturnType<typeof setInterval>>>({})

function setupAutoRefresh(widget: Widget): void {
  if (!widget.refresh_interval || widget.refresh_interval <= 0) return
  clearWidgetTimer(widget._id)
  refreshTimers.value[widget._id] = setInterval(() => {
    store.fetchWidgetData(widget._id)
  }, widget.refresh_interval * 1000)
}

function clearWidgetTimer(id: string): void {
  if (refreshTimers.value[id]) {
    clearInterval(refreshTimers.value[id])
    delete refreshTimers.value[id]
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await store.fetchWidgets(props.workspaceId)
  await store.fetchAllPinnedWidgetData()
  store.pinnedWidgets.forEach((w: Widget) => setupAutoRefresh(w))
})

onBeforeUnmount(() => {
  Object.keys(refreshTimers.value).forEach(clearWidgetTimer)
})

// ── Actions ────────────────────────────────────────────────────────────────
async function fetchAllPinnedWidgetData(): Promise<void> {
  await store.fetchAllPinnedWidgetData()
}

async function refreshWidget(id: string): Promise<void> {
  await store.refreshWidget(id)
}

function openAddModal(): void {
  editingWidget.value = null
  form.value = defaultForm()
  showModal.value = true
}

function openEditModal(widget: Widget): void {
  editingWidget.value = widget
  form.value = {
    title: widget.title,
    description: widget.description ?? '',
    icon: widget.icon ?? '📊',
    color: widget.color ?? '#7D68C8',
    is_pinned: widget.is_pinned,
    refresh_interval: widget.refresh_interval ?? 300,
    query: {
      entity: (widget.query?.entity as Entity) ?? 'cards',
      result_type: (widget.query?.result_type as ResultType) ?? 'list',
      chart_type: (widget.query?.chart_type as ChartType) ?? 'bar',
      formula: (widget.query?.formula as Formula) ?? 'days_until_end',
      group_by: widget.query?.group_by ?? '',
      sort_by: widget.query?.sort_by ?? 'created_at',
      sort_order: (widget.query?.sort_order as SortOrder) ?? 'desc',
      limit: widget.query?.limit ?? 20,
      filters: {
        assigned_to: widget.query?.filters?.assigned_to ?? '$ME',
        status: widget.query?.filters?.status ?? '',
        priority: (widget.query?.filters?.priority as Priority) ?? '',
        sprint_status: (widget.query?.filters?.sprint_status as SprintStatus) ?? '',
        date_filter: {
          type: 'relative',
          value: (widget.query?.filters?.date_filter?.value as DateFilterValue) ?? 'today',
        },
      },
    },
  }
  showModal.value = true
}

function closeModal(): void {
  showModal.value = false
  editingWidget.value = null
}

function buildQueryPayload(): Record<string, unknown> {
  const f = form.value
  const cleanFilters: Record<string, unknown> = {}

  if (f.query.filters.assigned_to) cleanFilters.assigned_to = f.query.filters.assigned_to
  if (f.query.filters.status) cleanFilters.status = f.query.filters.status
  if (f.query.filters.priority) cleanFilters.priority = f.query.filters.priority
  if (f.query.filters.sprint_status) cleanFilters.sprint_status = f.query.filters.sprint_status
  if (f.query.filters.date_filter.value) {
    cleanFilters.date_field = 'variables.start-date'
    cleanFilters.date_filter = {
      type: 'relative',
      value: f.query.filters.date_filter.value,
    }
  }

  const query: Record<string, unknown> = {
    entity: f.query.entity,
    result_type: f.query.result_type,
    filters: cleanFilters,
    sort_by: f.query.sort_by || undefined,
    sort_order: f.query.sort_order || undefined,
    limit: f.query.limit || 20,
  }

  if (f.query.result_type === 'chart') {
    query.chart_type = f.query.chart_type
    query.group_by = f.query.group_by
    query.aggregation = 'count'
  }

  if (f.query.result_type === 'computed') {
    query.formula = f.query.formula
  }

  return query
}

async function saveWidget(): Promise<void> {
  const f = form.value
  const queryPayload = buildQueryPayload()

  if (editingWidget.value) {
    const updates: Record<string, unknown> = {
      title: f.title,
      description: f.description || null,
      icon: f.icon,
      color: f.color,
      is_pinned: f.is_pinned,
      refresh_interval: f.refresh_interval,
      query: queryPayload,
    }

    const updated: Widget | null = await store.updateWidgetViaAgent(
      props.workspaceId,
      editingWidget.value._id,
      updates,
    )

    if (updated) {
      clearWidgetTimer(editingWidget.value._id)
      setupAutoRefresh(updated)
      await store.fetchWidgetData(updated._id)
    }
  } else {
    const created: Widget | null = await store.createWidget(props.workspaceId, {
      title: f.title,
      description: f.description || null,
      icon: f.icon,
      color: f.color,
      is_pinned: f.is_pinned,
      refresh_interval: f.refresh_interval,
      query: queryPayload,
    })

    if (created) {
      setupAutoRefresh(created)
      await store.fetchWidgetData(created._id)
    }
  }

  closeModal()
}

async function acceptProposal(): Promise<void> {
  const proposal = store.pendingProposal
  if (!proposal) return

  const created: Widget | null = await store.createWidget(props.workspaceId, {
    title: proposal.title ?? 'Agent Widget',
    description: proposal.description ?? null,
    icon: proposal.icon ?? '📊',
    color: proposal.color ?? '#7D68C8',
    is_pinned: true,
    refresh_interval: proposal.refresh_interval ?? 300,
    query: proposal.query ?? {},
  })

  if (created) {
    setupAutoRefresh(created)
    await store.fetchWidgetData(created._id)
  }
}

function confirmDelete(widget: Widget): void {
  widgetToDelete.value = widget
  showDeleteModal.value = true
}

async function deleteWidget(): Promise<void> {
  if (!widgetToDelete.value) return
  clearWidgetTimer(widgetToDelete.value._id)
  await store.deleteWidget(widgetToDelete.value._id)
  showDeleteModal.value = false
  widgetToDelete.value = null
}

// ── Helpers ────────────────────────────────────────────────────────────────
const CHART_COLORS = ['#7D68C8', '#6e3b96', '#9356c5', '#a78bfa', '#c4b5fd']

function getChartColor(idx: string | number): string {
  return CHART_COLORS[Number(idx) % CHART_COLORS.length]
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.peak-root {
  padding: 20px 24px;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.peak-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.peak-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.peak-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #7d68c8);
  font-size: 16px;
  flex-shrink: 0;
}
.peak-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #2b2c30);
  margin: 0;
  line-height: 1.2;
}
.peak-subtitle {
  font-size: 12px;
  color: var(--text-secondary, #6b6b6e);
  margin: 0;
}
.peak-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Buttons ────────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--accent, #7d68c8);
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover, #6e3b96); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--bg-card, #fff);
  color: var(--text-primary, #2b2c30);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 7px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover:not(:disabled) { background: var(--bg-surface, #dedfe3); }
.btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ghost-sm {
  padding: 5px 10px;
  background: transparent;
  color: var(--text-secondary, #6b6b6e);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-ghost-sm:hover { background: var(--bg-surface, #dedfe3); }

.btn-accent-sm {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--accent, #7d68c8);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-accent-sm:hover:not(:disabled) { background: var(--accent-hover, #6e3b96); }
.btn-accent-sm:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary, #6b6b6e);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.icon-btn:hover { background: var(--bg-surface, #dedfe3); color: var(--text-primary, #2b2c30); }
.icon-btn--danger:hover { background: #fef2f2; color: #ef4444; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Empty state ────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  gap: 12px;
}
.empty-icon {
  width: 56px;
  height: 56px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--accent, #7d68c8);
  margin-bottom: 4px;
}
.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #2b2c30);
  margin: 0;
}
.empty-desc {
  font-size: 13px;
  color: var(--text-secondary, #6b6b6e);
  margin: 0;
  max-width: 300px;
}

/* ── Proposal banner ────────────────────────────────────────────────────── */
.proposal-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  border: 1px solid rgba(125, 104, 200, 0.25);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
}
.proposal-banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.proposal-badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--accent, #7d68c8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.proposal-title {
  font-size: 11px;
  color: var(--text-secondary, #6b6b6e);
  margin: 0;
}
.proposal-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #2b2c30);
  margin: 0;
}
.proposal-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* ── Grid ───────────────────────────────────────────────────────────────── */
.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ── Widget card ────────────────────────────────────────────────────────── */
.widget-card {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
  position: relative;
}
.widget-card:hover {
  border-color: rgba(125, 104, 200, 0.35);
  box-shadow: 0 4px 16px rgba(125, 104, 200, 0.1);
}
.widget-card--loading { opacity: 0.85; }

.widget-card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--border, #d9d9d9);
}
.widget-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.widget-icon-emoji { font-size: 16px; line-height: 1; }
.widget-meta { flex: 1; min-width: 0; }
.widget-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #2b2c30);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.widget-entity {
  font-size: 10px;
  color: var(--text-secondary, #6b6b6e);
  margin: 2px 0 0;
  text-transform: capitalize;
}
.widget-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.widget-card:hover .widget-actions { opacity: 1; }

.widget-card-body { flex: 1; padding: 14px; }

.data-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: var(--text-secondary, #6b6b6e);
  font-size: 18px;
}
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 80px;
  font-size: 12px;
  color: var(--text-secondary, #6b6b6e);
}

/* list */
.list-count-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  color: var(--accent, #7d68c8);
  border-radius: 20px;
  margin-bottom: 8px;
}
.list-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.list-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-primary, #2b2c30); }
.list-item-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.list-item-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-item-status {
  font-size: 10px;
  padding: 1px 6px;
  background: var(--bg-surface, #dedfe3);
  border-radius: 4px;
  color: var(--text-secondary, #6b6b6e);
  flex-shrink: 0;
}
.list-more { font-size: 11px; color: var(--text-secondary, #6b6b6e); margin: 6px 0 0; padding-left: 13px; }

/* count */
.count-result { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 0; gap: 4px; }
.count-value { font-size: 40px; font-weight: 700; line-height: 1; margin: 0; }
.count-label { font-size: 12px; color: var(--text-secondary, #6b6b6e); margin: 0; text-align: center; }

/* computed */
.computed-result { display: flex; flex-direction: column; gap: 6px; }
.computed-main { display: flex; align-items: baseline; gap: 6px; }
.computed-value { font-size: 36px; font-weight: 700; line-height: 1; margin: 0; }
.computed-unit { font-size: 14px; color: var(--text-secondary, #6b6b6e); margin: 0; }
.computed-label { font-size: 12px; color: var(--text-secondary, #6b6b6e); margin: 0; }
.computed-progress-wrap { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.computed-progress-bar { flex: 1; height: 6px; background: var(--bg-surface, #dedfe3); border-radius: 20px; overflow: hidden; }
.computed-progress-fill { height: 100%; border-radius: 20px; transition: width 0.4s ease; }
.computed-progress-text { font-size: 11px; color: var(--text-secondary, #6b6b6e); white-space: nowrap; }

/* chart */
.chart-total { display: flex; align-items: baseline; gap: 5px; margin-bottom: 10px; }
.chart-total-value { font-size: 22px; font-weight: 700; color: var(--text-primary, #2b2c30); }
.chart-total-label { font-size: 12px; color: var(--text-secondary, #6b6b6e); }
.chart-bars { display: flex; flex-direction: column; gap: 7px; }
.chart-bar-item { display: flex; align-items: center; gap: 8px; }
.chart-bar-label { font-size: 11px; color: var(--text-secondary, #6b6b6e); width: 72px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chart-bar-track { flex: 1; height: 8px; background: var(--bg-surface, #dedfe3); border-radius: 20px; overflow: hidden; }
.chart-bar-fill { height: 100%; border-radius: 20px; transition: width 0.4s ease; min-width: 4px; }
.chart-bar-val { font-size: 11px; font-weight: 600; color: var(--text-primary, #2b2c30); width: 24px; text-align: right; flex-shrink: 0; }

/* footer */
.widget-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-top: 1px solid var(--border, #d9d9d9);
  background: var(--bg-surface, #dedfe3);
}
.widget-resolved-at,
.widget-refresh-interval {
  font-size: 10px;
  color: var(--text-secondary, #6b6b6e);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
.widget-skeleton { pointer-events: none; padding: 14px; gap: 10px; display: flex; flex-direction: column; }
.skeleton-line { height: 12px; background: var(--bg-surface, #dedfe3); border-radius: 6px; animation: pulse 1.4s ease-in-out infinite; }
.skeleton-line.short { width: 40%; }
.skeleton-line.long { width: 80%; }
.skeleton-value { height: 48px; background: var(--bg-surface, #dedfe3); border-radius: 8px; margin-top: 4px; animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}
.modal-card {
  background: var(--bg-card, #fff);
  border-radius: 14px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-card--sm { max-width: 380px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  flex-shrink: 0;
}
.modal-title { font-size: 15px; font-weight: 700; color: var(--text-primary, #2b2c30); margin: 0; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--border, #d9d9d9); flex-shrink: 0; }

/* ── Form ───────────────────────────────────────────────────────────────── */
.form-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent, #7d68c8);
  padding: 4px 0 2px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  margin-top: 4px;
}
.form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #6b6b6e);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.required { color: #ef4444; margin-left: 2px; }
.form-row { display: flex; gap: 12px; flex-wrap: wrap; }
.form-row .form-group { min-width: 140px; }
.form-input {
  padding: 7px 10px;
  background: var(--bg-input, #fff);
  border: 1px solid var(--border-input, #d9d9d9);
  border-radius: 7px;
  font-size: 13px;
  color: var(--text-primary, #2b2c30);
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--accent, #7d68c8); box-shadow: 0 0 0 2px rgba(125, 104, 200, 0.15); }
.form-select {
  padding: 7px 10px;
  background: var(--bg-input, #fff);
  border: 1px solid var(--border-input, #d9d9d9);
  border-radius: 7px;
  font-size: 13px;
  color: var(--text-primary, #2b2c30);
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
  cursor: pointer;
}
.form-select:focus { border-color: var(--accent, #7d68c8); }
.color-row { display: flex; align-items: center; gap: 8px; }
.form-color {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 7px;
  cursor: pointer;
  padding: 2px;
  background: var(--bg-input, #fff);
  flex-shrink: 0;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary, #2b2c30);
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}
.form-checkbox { width: 16px; height: 16px; accent-color: var(--accent, #7d68c8); cursor: pointer; }
.delete-confirm-text { font-size: 13px; color: var(--text-primary, #2b2c30); line-height: 1.6; margin: 0; }

/* ── Transitions ────────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s, transform 0.18s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.97); }

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .peak-root { padding: 14px 12px; }
  .widgets-grid { grid-template-columns: 1fr; }
  .peak-title { font-size: 16px; }
  .modal-body { padding: 14px; }
  .form-row { flex-direction: column; }
  .proposal-banner { flex-direction: column; align-items: flex-start; }
}
</style>