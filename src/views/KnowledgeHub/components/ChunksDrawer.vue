<template>
  <Transition name="panel" appear>
    <div
      v-show="modelValue"
      class="fixed inset-y-0 right-0 z-50 w-[420px] flex flex-col bg-bg-surface border-l border-border shadow-2xl overflow-hidden"
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h4 class="text-[14px] font-semibold">Indexed Chunks</h4>
          <p class="text-[11px] text-text-secondary mt-0.5">
            {{ pagination?.total ?? 0 }} chunks · {{ indexStatus?.total_tokens_approx ?? 0 }} tokens approx
          </p>
        </div>
        <button
          @click="$emit('update:modelValue', false)"
          class="w-8 h-8 rounded-lg hover:bg-bg-body flex items-center justify-center transition-colors"
        >
          <i class="fa-solid fa-xmark text-text-primary"></i>
        </button>
      </div>

      <!-- Index Status Banner -->
      <div
        v-if="indexStatus"
        class="px-4 py-2 border-b border-border flex items-center gap-2 text-xs"
        :class="statusClass"
      >
        <i :class="statusIcon"></i>
        <span class="font-medium">{{ indexStatus.learning_status.replace(/_/g, ' ') }}</span>
        <span v-if="indexStatus.indexed_at" class="text-text-secondary ml-auto">
          Indexed {{ new Date(indexStatus.indexed_at).toLocaleDateString() }}
        </span>
      </div>

      <!-- Chunks List -->
      <div class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 scrollbar-visible">
        <div v-if="isPending" class="flex flex-col gap-3 animate-pulse">
          <div v-for="i in 5" :key="i" class="h-20 rounded-lg bg-bg-body"></div>
        </div>

        <div
          v-else-if="!chunks?.length"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <i class="fa-solid fa-puzzle-piece text-3xl text-text-secondary/30 mb-3"></i>
          <p class="text-text-secondary text-sm">No chunks found</p>
          <p class="text-text-secondary/60 text-xs mt-1">This item may not be indexed yet</p>
        </div>

        <div
          v-for="chunk in chunks"
          :key="chunk._id"
          class="bg-bg-body rounded-lg p-3 border border-border"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-semibold text-primary-color">
              Chunk #{{ chunk.chunk_index + 1 }}
            </span>
            <span class="text-[10px] text-text-secondary">
              ~{{ chunk.tokens_approx }} tokens
            </span>
          </div>
          <p class="text-[12px] text-text-primary leading-relaxed line-clamp-4 whitespace-pre-line">
            {{ chunk.text }}
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination && pagination.pages > 1"
        class="px-4 py-3 border-t border-border flex items-center justify-between"
      >
        <button
          :disabled="currentPage <= 1"
          @click="currentPage--"
          class="px-3 py-1.5 rounded border border-border text-xs disabled:opacity-40 hover:border-primary-color"
        >
          Prev
        </button>
        <span class="text-xs text-text-secondary">{{ currentPage }} / {{ pagination.pages }}</span>
        <button
          :disabled="currentPage >= pagination.pages"
          @click="currentPage++"
          class="px-3 py-1.5 rounded border border-border text-xs disabled:opacity-40 hover:border-primary-color"
        >
          Next
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledgeChunks, useIndexStatus } from '../../../queries/useKnowledgeHub'

const props = defineProps<{
  modelValue: boolean
  itemId: string
  workspaceId: string
}>()

defineEmits<{ 'update:modelValue': [val: boolean] }>()

const currentPage = ref(1)

// Chunks query
const { data: chunksData, isPending } = useKnowledgeChunks(
  computed(() => props.itemId),
  computed(() => props.workspaceId),
  currentPage,
)

// Index status query (non-polling — just for display)
const { data: indexStatusData } = useIndexStatus(
  computed(() => props.itemId),
  computed(() => props.workspaceId),
  computed(() => !!props.itemId),
)

const chunks = computed(() => chunksData.value?.data ?? [])
const pagination = computed(() => chunksData.value?.pagination ?? null)
const indexStatus = computed(() => indexStatusData.value?.data ?? indexStatusData.value)

const statusClass = computed(() => {
  const s = indexStatus.value?.learning_status
  return {
    'bg-green-500/10 text-green-600':   s === 'indexed',
    'bg-blue-500/10 text-blue-600':     s === 'approved',
    'bg-red-500/10 text-red-600':       s === 'failed',
    'bg-yellow-500/10 text-yellow-600': s === 'pending_review',
    'bg-bg-body text-text-secondary':   !s || s === 'draft' || s === 'archived',
  }
})
type LearningStatus =
  | 'indexed'
  | 'approved'
  | 'failed'
  | 'pending_review'
const statusIcon: Record<LearningStatus, string> = {
  indexed: 'fa-solid fa-circle-check',
  approved: 'fa-solid fa-spinner fa-spin',
  failed: 'fa-solid fa-circle-exclamation',
  pending_review: 'fa-solid fa-clock',
}
</script>

<style scoped>
.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
</style>