<template>
  <div class="workflow-canvas-container">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-zoom="1"
      :min-zoom="0.1"
      :max-zoom="4"
      :snap-to-grid="false"
      :fit-view-on-init="false"
      @nodes-change="handleNodesChange"
      @edges-change="handleEdgesChange"
      @connect="handleConnect"
      @node-click="handleNodeClick"
      @edge-click="handleEdgeClick"
      @pane-click="handlePaneClick"
      class="workflow-canvas"
    >
      <Background pattern-color="#374151" :gap="20" />
      <Controls :show-zoom="false" :show-fit-view="false" :show-interactive="false" />
    </VueFlow>

    <div v-if="selectedStatus" class="absolute top-4 right-4 bg-bg-card border border-border rounded-lg p-4 w-80 shadow-lg z-50">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-text-primary">Edit Status</h4>
        <button @click="selectedStatus = null" class="text-text-secondary hover:text-text-primary">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-text-secondary mb-1 block">Name</label>
          <input v-model="selectedStatus.status_name" @input="handleStatusUpdate"
            class="w-full px-3 py-2 text-sm bg-bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
        </div>
        <div>
          <label class="text-xs text-text-secondary mb-1 block">Category</label>
          <div class="px-3 py-2 text-sm bg-bg-surface/50 border border-border rounded-md text-text-secondary">
            {{ getCategoryLabel(selectedStatus.category) }}
            <span class="text-xs ml-2">(locked)</span>
          </div>
        </div>
        <div>
          <label class="text-xs text-text-secondary mb-1 block">Color</label>
          <div class="flex gap-2">
            <input type="color" v-model="selectedStatus.status_color" @input="handleStatusUpdate"
              class="h-9 w-16 rounded border border-border cursor-pointer">
            <input v-model="selectedStatus.status_color" @input="handleStatusUpdate"
              class="flex-1 px-3 py-2 text-sm bg-bg-surface border border-border rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
          </div>
        </div>
        <button @click="handleDeleteStatus"
          class="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center gap-2">
          <i class="fa-solid fa-trash"></i>
          Delete Status
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-bg-body/50">
      <div class="text-text-secondary">
        <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@vue-flow/core'
import StatusNode from './StatusNode.vue'
import TransitionEdge from './TransitionEdge.vue'
import { transformWorkflowDataToVueFlow } from '../../../utilities/workflowTransform'
import { useWorkflowData, useUpdateStatus, useDeleteStatus, useCreateTransition, useDeleteTransition } from '../../../queries/useProcess'

const props = defineProps<{
  processId: string
  showTransitionLabels: boolean
}>()

const nodeTypes = {
  workflowStatus: StatusNode
}

const edgeTypes = {
  workflowTransition: TransitionEdge
}

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const selectedStatus = ref<any>(null)
const selectedEdge = ref<any>(null)

const { data: workflowData, isLoading, refetch } = useWorkflowData(props.processId)
const { zoomIn, zoomOut, setViewport } = useVueFlow()

const { mutate: updateStatus } = useUpdateStatus({
  onSuccess: () => {
    refetch()
  }
})

const { mutate: deleteStatus } = useDeleteStatus({
  onSuccess: () => {
    selectedStatus.value = null
    refetch()
  }
})

const { mutate: createTransition } = useCreateTransition({
  onSuccess: () => {
    refetch()
  }
})

const { mutate: deleteTransition } = useDeleteTransition({
  onSuccess: () => {
    selectedEdge.value = null
    refetch()
  }
})

watch(() => workflowData.value, (newData) => {
  if (newData) {
    const { nodes: newNodes, edges: newEdges } = transformWorkflowDataToVueFlow(newData)
    nodes.value = newNodes
    edges.value = newEdges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        showLabel: props.showTransitionLabels
      }
    }))
  }
}, { immediate: true, deep: true })

watch(() => props.showTransitionLabels, (show) => {
  edges.value = edges.value.map(edge => ({
    ...edge,
    data: {
      ...edge.data,
      showLabel: show
    }
  }))
})

onMounted(() => {
  window.addEventListener('workflow:zoom', handleZoomEvent)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('workflow:zoom', handleZoomEvent)
  document.removeEventListener('keydown', handleKeyDown)
})

function handleNodesChange(changes: NodeChange[]) {
  changes.forEach(change => {
    if (change.type === 'position' && change.dragging === false && change.position) {
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        updateStatus({
          id: node.id,
          payload: {
            position_x: change.position.x,
            position_y: change.position.y
          }
        })
      }
    }
  })
}

function handleEdgesChange(changes: EdgeChange[]) {
  changes.forEach(change => {
    if (change.type === 'remove') {
      const edge = edges.value.find(e => e.id === change.id)
      if (edge && confirm('Are you sure you want to delete this transition?')) {
        deleteTransition({ id: change.id })
      }
    }
  })
}

function handleConnect(connection: Connection) {
  if (!connection.source || !connection.target) return

  const existingEdge = edges.value.find(
    e => e.source === connection.source && e.target === connection.target
  )

  if (existingEdge) {
    alert('A transition already exists between these statuses')
    return
  }

  createTransition({
    payload: {
      process_id: props.processId,
      from_status_id: connection.source,
      to_status_id: connection.target,
      transition_label: '',
      rules: []
    }
  })
}

function handleNodeClick(event: any) {
  const nodeData = event.node.data?.fullData
  if (nodeData) {
    selectedStatus.value = { ...nodeData }
    selectedEdge.value = null
  }
}

function handleEdgeClick(event: any) {
  selectedEdge.value = event.edge
  selectedStatus.value = null
}

function handlePaneClick() {
  selectedStatus.value = null
  selectedEdge.value = null
}

function handleStatusUpdate() {
  if (!selectedStatus.value) return

  const node = nodes.value.find(n => n.id === selectedStatus.value.id)
  if (node) {
    node.data = {
      ...node.data,
      label: selectedStatus.value.status_name,
      color: selectedStatus.value.status_color
    }

    updateStatus({
      id: selectedStatus.value.id,
      payload: {
        status_name: selectedStatus.value.status_name,
        status_color: selectedStatus.value.status_color
      }
    })
  }
}

function handleDeleteStatus() {
  if (!selectedStatus.value) return

  if (confirm(`Are you sure you want to delete the status "${selectedStatus.value.status_name}"? This will also delete all transitions connected to it.`)) {
    deleteStatus({ id: selectedStatus.value.id })
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Delete' && selectedEdge.value) {
    const edge = edges.value.find(e => e.id === selectedEdge.value.id)
    if (edge && confirm('Are you sure you want to delete this transition?')) {
      deleteTransition({ id: selectedEdge.value.id })
    }
  }
  if (event.key === 'Escape') {
    selectedStatus.value = null
    selectedEdge.value = null
  }
}

function handleZoomEvent(event: Event) {
  const e = event as CustomEvent
  const action = e.detail?.action

  if (action === 'in') {
    zoomIn({ duration: 300 })
  } else if (action === 'out') {
    zoomOut({ duration: 300 })
  } else if (action === 'reset') {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done'
  }
  return labels[category] || category
}
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.workflow-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.workflow-canvas {
  width: 100%;
  height: 100%;
  background-color: var(--bg-body, #111827);
}

.vue-flow__background {
  background-color: var(--bg-body, #111827);
}

.vue-flow__edge-path {
  stroke-width: 2;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #3b82f6;
  stroke-width: 3;
}

.vue-flow__edge:hover .vue-flow__edge-path {
  stroke: #3b82f6;
  stroke-width: 3;
}

.vue-flow__node {
  border-radius: 8px;
}

.vue-flow__node.selected {
  box-shadow: 0 0 0 2px #2563eb;
}

.vue-flow__handle {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border: 2px solid #ffffff;
}

.vue-flow__handle:hover {
  width: 16px;
  height: 16px;
  background: #2563eb;
}
</style>
