<template>
  <div
    class="status-node"
    :style="{
      backgroundColor: data.color || '#3b82f6',
      borderColor: isSelected ? '#2563eb' : '#1f2937'
    }"
    @click="handleClick"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="connection-handle"
    />
    <Handle
      type="target"
      :position="Position.Top"
      class="connection-handle"
    />

    <div class="status-content">
      <span class="status-label">{{ data.label }}</span>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      class="connection-handle"
    />
    <Handle
      type="source"
      :position="Position.Bottom"
      class="connection-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

interface StatusNodeData {
  label: string
  color: string
  category: string
  isInitial?: boolean
  isFinal?: boolean
  fullData?: any
}

const props = defineProps<NodeProps<StatusNodeData>>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const isSelected = props.selected || false

function handleClick(event: MouseEvent) {
  event.stopPropagation()
  emit('select', props.id)
}
</script>

<style scoped>
.status-node {
  width: 140px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: move;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  width: 100%;
}

.status-label {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connection-handle {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border: 2px solid #ffffff;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.status-node:hover .connection-handle {
  opacity: 1;
}

.connection-handle:hover {
  width: 16px;
  height: 16px;
  background: #2563eb;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}
</style>
