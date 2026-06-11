<template>
  <div
    class="bg-bg-surface cursor-grab rounded-lg p-3 flex flex-col gap-2 transition-all group"
  >
    <!-- Status badge + source type icon -->
    <div class="flex items-center justify-between gap-1">
      <span
        class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
        :style="{ background: statusBg, color: statusColor }"
      >
        {{ item.learning_status.replace(/_/g, ' ') }}
      </span>

      <div class="flex items-center gap-2">
        <!-- Source type -->
        <span class="flex items-center gap-1 text-[11px] text-text-secondary">
          <i :class="sourceIcon" class="text-[12px]"></i>
          <span class="capitalize">{{ sourceLabel }}</span>
        </span>

        <!-- Drop menu -->
        <div
          v-if="canDeleteCard"
          class="product-menu-icon transition-all w-6 py-1 px-2 h-6 flex justify-center items-center duration-100 ease-in-out bg-bg-surface/40 rounded-md"
          :class="{ 'menu-open': isMenuOpen }"
        >
          <DropMenu @click.stop="" :items="getMenuItems()" @open-change="(v) => isMenuOpen = v">
            <template #trigger>
              <i class="cursor-pointer text-sm fa-solid fa-ellipsis"></i>
            </template>
          </DropMenu>
        </div>
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-sm font-medium text-card-foreground leading-tight capitalize line-clamp-2 break-words">
      {{ item?.name }}
    </h3>

    <!-- Description -->
    <p
      v-html="item?.description"
      class="card-description text-xs text-muted-foreground mb-1 text-text-secondary line-clamp-2 max-h-20"
    ></p>

    <!-- Category / scope / visibility -->
    <div class="flex items-center gap-1 flex-wrap">
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary-color/10 text-primary-color capitalize">
        {{ item.knowledge_category.replace(/_/g, ' ') }}
      </span>
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-bg-body text-text-secondary capitalize">
        {{ item.scope_type }}
      </span>
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-bg-body text-text-secondary capitalize">
        {{ item.visibility }}
      </span>
    </div>

    <!-- Assigned agents -->
    <div v-if="item.assigned_agents?.length" class="flex items-center gap-1">
      <i class="fa-solid fa-robot text-[10px] text-text-secondary"></i>
      <span class="text-[10px] text-text-secondary truncate">
        {{ item.assigned_agents.map((a) => a.name).join(', ') }}
      </span>
    </div>

    <!-- Progress bar -->
    <div class="h-[3px] rounded-full bg-border overflow-hidden mt-0.5">
      <div
        class="h-full rounded-full transition-all duration-500"
        :style="{ width: progressWidth, background: 'linear-gradient(90deg, var(--primary-color, #7c3aed), #06b6d4)' }"
      ></div>
    </div>

    <!-- Sync status + active indicator -->
    <div class="flex items-center justify-between mt-0.5">
      <span class="flex items-center gap-1 text-[11px] text-text-secondary">
        <i :class="syncIcon" class="text-[11px]" :style="{ color: syncIconColor }"></i>
        {{ syncLabel }}
      </span>
      <span class="flex items-center gap-1.5 text-[11px] text-text-secondary">
        <span
          class="w-1.5 h-1.5 rounded-full inline-block"
          :style="{ background: isActive ? '#10b981' : '#6b7280' }"
        ></span>
        {{ isActive ? 'Active' : 'Inactive' }}
      </span>
    </div>

    <!-- Hover actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
      <button
        v-if="item.learning_status === 'draft' || item.learning_status === 'pending_review'"
        @click.stop="$emit('approve', item)"
        class="flex-1 text-[10px] py-1 rounded bg-primary-color/10 text-primary-color hover:bg-primary-color/20 transition-colors"
      >
        Approve
      </button>
      <button
        v-if="item.learning_status === 'draft' || item.learning_status === 'pending_review'"
        @click.stop="$emit('reject', item)"
        class="flex-1 text-[10px] py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
      >
        Reject
      </button>
      <button
        v-if="item.learning_status === 'indexed' || item.learning_status === 'failed'"
        @click.stop="$emit('reindex', item)"
        class="flex-1 text-[10px] py-1 rounded bg-bg-body text-text-secondary hover:text-primary-color transition-colors"
        title="Re-index"
      >
        <i class="fa-solid fa-arrows-rotate"></i>
      </button>
      <button
        v-if="item.learning_status === 'indexed'"
        @click.stop="$emit('view-chunks', item)"
        class="text-[10px] py-1 px-2 rounded bg-bg-body text-text-secondary hover:text-primary-color transition-colors"
        title="View chunks"
      >
        <i class="fa-solid fa-puzzle-piece"></i>
      </button>
      <button
        v-if="item.learning_status === 'archived'"
        @click.stop="$emit('unarchive', item)"
        class="flex-1 text-[10px] py-1 rounded bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-colors"
        title="Unarchive"
      >
        <i class="fa-solid fa-box-open mr-1"></i>
        Unarchive
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { KnowledgeItem } from '../../../queries/useKnowledgeHub'
import { usePermissions } from '../../../composables/usePermissions'
import DropMenu from '../../../components/ui/DropMenu.vue'

const { canDeleteCard, canEditCard } = usePermissions()

const props = defineProps<{ item: KnowledgeItem & Record<string, any> }>()

const emit = defineEmits<{
  approve: [item: KnowledgeItem]
  reject: [item: KnowledgeItem]
  archive: [item: KnowledgeItem]
  unarchive: [item: KnowledgeItem]
  delete: [item: KnowledgeItem]
  reindex: [item: KnowledgeItem]
  'view-chunks': [item: KnowledgeItem]
  edit: [item: KnowledgeItem]
}>()

const isMenuOpen = ref(false)

// ─── Status map ───────────────────────────────────────────────────────────────
const statusMap: Record<string, { bg: string; color: string }> = {
  draft:          { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
  pending_review: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  approved:       { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  indexed:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  rejected:       { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  archived:       { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  failed:         { bg: 'rgba(220,38,38,0.12)',   color: '#dc2626' },
}

const statusBg    = computed(() => statusMap[props.item.learning_status]?.bg    ?? 'rgba(107,114,128,0.12)')
const statusColor = computed(() => statusMap[props.item.learning_status]?.color ?? '#6b7280')

// ─── Source type icon + label ─────────────────────────────────────────────────
const sourceTypeMap: Record<string, { icon: string; label: string }> = {
  file:               { icon: 'fa-solid fa-file',            label: 'File' },
  url:                { icon: 'fa-solid fa-link',             label: 'URL' },
  text:               { icon: 'fa-solid fa-align-left',       label: 'Text' },
  note:               { icon: 'fa-solid fa-note-sticky',      label: 'Note' },
  log:                { icon: 'fa-solid fa-list',             label: 'Log' },
  comment:            { icon: 'fa-solid fa-comment',          label: 'Comment' },
  api:                { icon: 'fa-solid fa-code',             label: 'API' },
  database:           { icon: 'fa-solid fa-database',         label: 'Database' },
  agent_chat:         { icon: 'fa-solid fa-robot',            label: 'Agent Chat' },
  agent_feedback:     { icon: 'fa-solid fa-star',             label: 'Feedback' },
  agent_action:       { icon: 'fa-solid fa-bolt',             label: 'Action' },
  agent_memory:       { icon: 'fa-solid fa-brain',            label: 'Memory' },
  analytical_insight: { icon: 'fa-solid fa-chart-line',       label: 'Insight' },
  // common sub-types derived from file
  pdf:                { icon: 'fa-solid fa-file-pdf',         label: 'PDF' },
  docx:               { icon: 'fa-solid fa-file-word',        label: 'Word' },
  xlsx:               { icon: 'fa-solid fa-file-excel',       label: 'Excel' },
  csv:                { icon: 'fa-solid fa-file-csv',         label: 'CSV' },
  image:              { icon: 'fa-solid fa-image',            label: 'Image' },
  screenshot:         { icon: 'fa-solid fa-camera',           label: 'Screenshot' },
  manual:             { icon: 'fa-solid fa-pen',              label: 'Manual' },
}

const sourceIcon  = computed(() => sourceTypeMap[props.item.source_type]?.icon  ?? 'fa-solid fa-file')
const sourceLabel = computed(() => sourceTypeMap[props.item.source_type]?.label ?? props.item.source_type)

// ─── Progress bar ─────────────────────────────────────────────────────────────
const progressMap: Record<string, number> = {
  draft:          25,
  pending_review: 50,
  approved:       70,
  indexed:        100,
  rejected:       20,
  archived:       90,
  failed:         30,
}

const progressWidth = computed(() => `${progressMap[props.item.learning_status] ?? 0}%`)

// ─── Sync / active ────────────────────────────────────────────────────────────
const isActive   = computed(() => props.item.learning_status === 'indexed' || props.item.learning_status === 'approved')
const isSynced   = computed(() => props.item.learning_status === 'indexed')
const syncLabel  = computed(() => isSynced.value ? 'Synced' : 'Pending sync')
const syncIcon   = computed(() => isSynced.value ? 'fa-solid fa-circle-check' : 'fa-solid fa-arrows-rotate')
const syncIconColor = computed(() => isSynced.value ? '#10b981' : '#6b7280')

// ─── Drop menu ────────────────────────────────────────────────────────────────
function getMenuItems() {
  const items: any[] = []

  if (canEditCard.value) {
    items.push({
      label: 'Edit',
      icon: 'fa-solid fa-pen',
      action: () => emit('edit', props.item),
    })
  }

  if (props.item.learning_status !== 'archived') {
    items.push({
      label: 'Archive',
      icon: 'fa-solid fa-box-archive',
      action: () => emit('archive', props.item),
    })
  }

  if (canDeleteCard.value) {
    items.push({
      label: 'Delete',
      icon: 'fa-solid fa-trash',
      danger: true,
      action: () => emit('delete', props.item),
    })
  }

  return items
}
</script>