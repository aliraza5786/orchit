<template>
  <BaseEdge
    :id="id"
    :style="edgeStyle"
    :path="path"
    :marker-end="markerEnd"
  />
  <EdgeLabelRenderer>
    <div
      v-if="showLabel && labelPosition"
      class="transition-label-wrapper"
      :style="{
        transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`
      }"
      @click="handleLabelClick"
    >
      <div v-if="!isEditing" class="transition-label">
        {{ data?.fullData?.transition_label || 'Click to edit' }}
      </div>
      <input
        v-else
        ref="inputRef"
        v-model="editLabel"
        type="text"
        class="transition-label-input"
        @blur="handleLabelBlur"
        @keydown.enter="handleLabelBlur"
        @keydown.esc="cancelEdit"
        @click.stop
      />
    </div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'

const props = defineProps<EdgeProps & { showLabel?: boolean }>()

const emit = defineEmits<{
  (e: 'update:label', id: string, label: string): void
  (e: 'select', id: string): void
}>()

const isEditing = ref(false)
const editLabel = ref('')
const inputRef = ref<HTMLInputElement>()

const edgeStyle = computed(() => ({
  stroke: props.selected ? '#3b82f6' : '#6b7280',
  strokeWidth: props.selected ? 3 : 2,
  transition: 'all 0.2s ease'
}))

const [path, labelX, labelY] = getBezierPath({
  sourceX: props.sourceX,
  sourceY: props.sourceY,
  sourcePosition: props.sourcePosition,
  targetX: props.targetX,
  targetY: props.targetY,
  targetPosition: props.targetPosition
})

const labelPosition = computed(() => ({
  x: labelX,
  y: labelY - 30
}))

watch(() => props.data?.fullData?.transition_label, (newLabel) => {
  if (!isEditing.value) {
    editLabel.value = newLabel || ''
  }
})

function handleLabelClick(event: MouseEvent) {
  event.stopPropagation()
  isEditing.value = true
  editLabel.value = props.data?.fullData?.transition_label || ''
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function handleLabelBlur() {
  if (isEditing.value) {
    isEditing.value = false
    const newLabel = editLabel.value.trim()
    emit('update:label', props.id, newLabel)
  }
}

function cancelEdit() {
  isEditing.value = false
  editLabel.value = props.data?.fullData?.transition_label || ''
}
</script>

<style scoped>
.transition-label-wrapper {
  position: absolute;
  pointer-events: all;
  z-index: 10;
}

.transition-label {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  cursor: text;
  user-select: none;
  transition: all 0.2s ease;
}

.transition-label:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

.transition-label-input {
  background: #1f2937;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #ffffff;
  outline: none;
  min-width: 100px;
}
</style>
