<script setup lang="ts">
import { nextTick, ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  VueFlow,
  Handle,
  Position,
  useVueFlow,
  type Node as VFNode,
  type Edge as VFEdge,
  type Connection,
  MarkerType,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useWorkspaceId } from '../../../composables/useQueryParams'

import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import type { EdgeUpdateEvent } from '@vue-flow/core'

import { useTheme } from '../../../composables/useTheme'
const { isDark } = useTheme()

// --- Modal state for editing an existing transition (edge) ---
const showEditEdgeModal = ref(false)
const editEdgeName = ref('')
const selectedEdgeId = ref<string | null>(null)
import { shallowRef } from 'vue'

const nodes = shallowRef<VFNode[]>([])
const edges = shallowRef<VFEdge[]>([])

// ── Typed helpers ──────────────────────────────────────────────────────────────
type SafeNode = {
  id: string
  data?: {
    label?: string
  }
}

type SafeEdge = {
  id: string
  source: string
  target: string
}

// Explicit type predicate so filter() narrows to string[] not (string|undefined)[]
function isString(v: unknown): v is string {
  return typeof v === 'string'
}

// Typed shape for handleAddNode argument
interface AddNodePayload {
  name: string
  status_name?: string
  status_color?: string
}

const statusObjects = computed(() => {
  const safeNodes = nodes.value as SafeNode[]
  const safeEdges = edges.value as SafeEdge[]

  const nodeMap = new Map<string, SafeNode>(
    safeNodes.map(n => [n.id, n])
  )

  const filtered = safeNodes.filter(node => node.data?.label)

  return filtered.map((node, index) => {
    const outgoingEdges = safeEdges.filter(e => e.source === node.id)
    const incomingEdges = safeEdges.filter(e => e.target === node.id)

    // Use explicit type predicate → string[] instead of (string | undefined)[]
    const forwardMoves: string[] = [
      ...new Set(
        outgoingEdges
          .map(e => nodeMap.get(e.target)?.data?.label)
          .filter(isString)
      )
    ]

    const backwardMoves: string[] = [
      ...new Set(
        incomingEdges
          .map(e => nodeMap.get(e.source)?.data?.label)
          .filter(isString)
      )
    ]

    return {
      _id: node.id,
      status: node.data?.label,
      sort_order: index + 1,
      position: index + 1,
      forward_moves: forwardMoves,
      backward_moves: backwardMoves,
      total_moves: forwardMoves.length + backwardMoves.length,
      is_start: index === 0,
      is_end: index === filtered.length - 1
    }
  })
})

const {
  setNodes,
  updateNode,
  addEdges,
  setEdges,
  removeEdges,
  removeNodes,           // ← added: was missing, needed for node deletion in watch
  onNodesInitialized,
  fitView,
  updateNodeInternals,
  addNodes,
  getNodes,
  getEdges,
  zoomIn,
  zoomOut,
} = useVueFlow()

// ---- API hooks ----
const { workspaceId } = useWorkspaceId()

const props = withDefaults(defineProps<{
  processId?: any
  showTransitionLabels?: boolean
  workflowData?: any
  canEdit?: boolean
  canDelete?: boolean
  isSaving?: boolean
}>(), { canEdit: true })

// ---- Helpers to normalize API -> VueFlow ----
const initialized = ref(false)

watch(() => props.workflowData, async (data) => {
  if (!data || initialized.value) return
  if (props.isSaving) return

  const fd = data.flow_diagram || data

  const incomingNodes: VFNode[] = Array.isArray(fd.nodes) ? fd.nodes.map(mapApiNode) : []
  const incomingEdges: VFEdge[] = Array.isArray(fd.edges) ? fd.edges.map(mapApiEdge) : []

  await nextTick()
  setNodes(incomingNodes)

 onNodesInitialized(async () => {
  updateNodeInternals(incomingNodes.map(n => n.id))
  setEdges(incomingEdges)
  fitView({ padding: 0.5, maxZoom: 1 })
})

  initialized.value = true
}, { immediate: true })


function triggerSave() {
  const payload = serializeWorkflowPayload()
  emit('save', payload)
}

function saveWorkflow() {
  const payload = serializeWorkflowPayload()
  emit('save', payload)
}

defineExpose({ openCreateNodeModal, handleAddNode, saveWorkflow, triggerSave, handleConfirmEdit })

function mapApiNode(n: any): VFNode {
  return {
    id: n.id,
    type: n.type ?? 'default',
    position: n.position,
    data: n.data,
    style: n.style,
  }
}

function normalizeMarkerType(t?: string): MarkerType {
  const key = (t ?? 'arrow').toLowerCase()
  if (key === 'arrow') return MarkerType.Arrow
  if (key === 'arrowclosed') return MarkerType.ArrowClosed
  return MarkerType.Arrow
}

function mapApiEdge(e: any): VFEdge {
  const marker = e.markerEnd || e.marker_end
  const style = e.style

  return {
    id: e.id || e.flow_metadata?.transition_id,
    type: e.type ?? 'step',
    source: e.source ?? e.flow_metadata?.source_node?.id,
    target: e.target ?? e.flow_metadata?.target_node?.id,
    sourceHandle: e.sourceHandle ?? e.source_handle,
    targetHandle: e.targetHandle ?? e.target_handle,
    label: e.label,
    data: e.data,
    animated: e.animated ?? false,
    style: style ? { ...style, strokeWidth: Number(style.strokeWidth ?? 2) } : undefined,
    markerEnd: marker
      ? {
          type: normalizeMarkerType(marker.type),
          color: marker.color,
          width: Number(marker.width ?? 18),
          height: Number(marker.height ?? 18),
        }
      : undefined,
  }
}

// ---- onConnect ----
function onConnect(conn: Connection) {
  if (!props.canEdit) return
  pendingConnection.value = conn
  transitionName.value = ''
  showTransitionModal.value = true
}

function confirmTransition() {
  if (!pendingConnection.value) return

  const conn = pendingConnection.value
  const name = transitionName.value.trim() || 'Transition'
  const id = `${conn.source}-${conn.target}-${crypto.randomUUID?.() ?? Math.random()}`

  // Explicitly construct VFEdge — avoids spreading Connection onto VFEdge
  const payload: VFEdge = {
    id,
    source: conn.source!,
    target: conn.target!,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    type: 'step',
    label: name,
    data: { name },
    style: { stroke: '#1152de', strokeWidth: 2 },
    markerEnd: { type: MarkerType.Arrow, color: '#1152de', width: 18, height: 18 },
  }

  addEdges(payload)
  showTransitionModal.value = false
  pendingConnection.value = null
  transitionName.value = ''
}

function cancelTransition() {
  showTransitionModal.value = false
  pendingConnection.value = null
  transitionName.value = ''
}

const defaultEdgeOptions: Partial<VFEdge> = {
  type: 'default',
  animated: false,
  style: { strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.Arrow,
    color: '#3b82f6',
    width: 18,
    height: 18,
  },
  labelBgPadding: [6, 2],
  labelBgBorderRadius: 6,
  updatable: true,
}

// --- Modal state for create & rename ---
const showCreateModal = ref(false)
const createName = ref('')
const showTransitionModal = ref(false)
const transitionName = ref('')
const pendingConnection = ref<Connection | null>(null)

const emit = defineEmits<{
  (e: 'edit:node', payload: any): void
  (e: 'save', payload: any): void
  (e: 'update:workflow', payload: any): void
  (e: 'add:status'): void
  (e: 'add:transition'): void
}>()

function openCreateNodeModal() {
  createName.value = ''
  showCreateModal.value = true
}

function handleEditNode(nodeId: string, nodeData: any) {
  const node = getNodes.value.find(n => n.id === nodeId)

  if (node) {
    emit('edit:node', {
      id: nodeId,
      ...node.data,
      status_color: nodeData.status || '#6b7280'
    })
  }
}

function handleConfirmEdit(id: string, nodeData: any) {
  if (nodeData) {
    updateNode(id, n => ({
      ...n,
      data: {
        ...n.data,
        label: nodeData.name,
        status: nodeData.category,
      },
      style: {
        border: '2px solid #64748b',
        borderRadius: '8px',
        background: nodeData.status_color,
      }
    }))
  }
  nextTick()
}

// Add a brand-new independent node
async function handleAddNode(e: AddNodePayload) {
  const makeId = () => crypto.randomUUID?.() ?? `n-${Date.now()}-${Math.random()}`
  const id = makeId()

  const currentNodes = getNodes.value.filter(n => n.type !== 'custom-add-icon')

  let targetX = 50
  let targetY = 150

  if (currentNodes.length > 0) {
    const lastNode = currentNodes.reduce((prev, current) =>
      current.position.x > prev.position.x ? current : prev
    , currentNodes[0])

    const PADDING_X = 300
    targetX = lastNode.position.x + PADDING_X
    targetY = lastNode.position.y
  }

  addNodes({
    id,
    position: { x: targetX, y: targetY },
    data: { label: e.name, status: e.status_name },
    style: { border: '2px solid #64748b', borderRadius: '8px', background: e.status_color },
  })
}

function markerTypeToApi(t?: MarkerType | string): string {
  if (!t) return 'arrow'
  const key = String(t).toLowerCase()
  if (key.includes('arrowclosed')) return 'arrowclosed'
  if (key.includes('arrow')) return 'arrow'
  if (key.includes('circle')) return 'circle'
  if (key.includes('square')) return 'square'
  if (key.includes('diamond')) return 'diamond'
  if (key.includes('dot')) return 'dot'
  return 'arrow'
}

function mapVFNodeToApi(n: VFNode) {
  return {
    id: n.id,
    type: n.type ?? 'default',
    position: n.position,
    data: n.data,
    style: n.style,
  }
}

function mapVFEdgeToApi(e: VFEdge) {
  const m = e.markerEnd

  // Narrow marker_end cleanly with a proper type guard
  type MarkerObj = { type?: string; color?: string; width?: number; height?: number }
  const markerObj: MarkerObj | undefined = m
    ? (typeof m === 'string'
        ? { type: m }
        : (m as MarkerObj))
    : undefined

  const marker_end = markerObj
    ? {
        type: markerTypeToApi(markerObj.type as MarkerType | string),
        color: markerObj.color,
        width: Number(markerObj.width ?? 18),
        height: Number(markerObj.height ?? 18),
      }
    : undefined

  // Safe cast for style — CSSProperties is a subset of Record<string, any>
  const styleRecord = e.style as Record<string, unknown> | undefined

  return {
    id: e.id,
    type: e.type ?? 'step',
    source: e.source,
    target: e.target,
    source_handle: e.sourceHandle,
    target_handle: e.targetHandle,
    label: e.label,
    data: e.data,
    style: styleRecord
      ? { ...styleRecord, strokeWidth: Number(styleRecord.strokeWidth ?? 2) }
      : undefined,
    marker_end,
    animated: !!e.animated,
  }
}

function serializeWorkflowPayload() {
  const currentNodes = getNodes.value
  const currentEdges = getEdges.value

  return {
    workspace_id: workspaceId.value,
    flow_diagram: {
      nodes: currentNodes.filter(n => n.type !== 'custom-add-icon').map(mapVFNodeToApi),
      edges: currentEdges.map(mapVFEdgeToApi),
    },
    flow_metadata: statusObjects.value
  }
}

// Safety net — intentionally left as no-op (async API calls can't run here)
window.addEventListener('beforeunload', () => {})

function openEditEdge(edge: VFEdge) {
  selectedEdgeId.value = edge.id
  editEdgeName.value = String(edge.label ?? edge.data?.name ?? '')
  showEditEdgeModal.value = true
}

function confirmEditEdge() {
  if (!selectedEdgeId.value) return
  const name = editEdgeName.value.trim()

  setEdges(eds =>
    eds.map(e =>
      e.id === selectedEdgeId.value
        ? { ...e, label: name || e.label, data: { ...(e.data ?? {}), name: name || e.data?.name } }
        : e
    )
  )

  showEditEdgeModal.value = false
  selectedEdgeId.value = null
  editEdgeName.value = ''
}

function deleteSelectedEdge() {
  if (!selectedEdgeId.value) return

  removeEdges([selectedEdgeId.value])  // ← was removeEdges(selectedEdgeId.value) — now array

  showEditEdgeModal.value = false
  selectedEdgeId.value = null
  editEdgeName.value = ''
}

function reverseSelectedEdge() {
  if (!selectedEdgeId.value) return

  setEdges(eds =>
    eds.map(e =>
      e.id === selectedEdgeId.value
        ? {
            ...e,
            source: e.target,
            target: e.source,
            sourceHandle: null,
            targetHandle: null,
          }
        : e
    )
  )
}
function deleteStatus(nodeId: string) {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
  selectedEdgeId.value = null
}

function confirmDeleteNode(nodeId: string) {
  const ok = window.confirm(
    'Are you sure you want to delete this status? All transitions will also be removed.'
  )
  if (!ok) return
  deleteStatus(nodeId)
}

function onEdgeUpdate(event: EdgeUpdateEvent) {
  const { edge, connection } = event
  if (!edge || !connection) return

  setEdges(eds =>
    eds.map(e =>
      e.id === edge.id
        ? {
            ...e,
            source: connection.source!,
            target: connection.target!,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
          }
        : e
    )
  )
}

function cancelEditEdge() {
  showEditEdgeModal.value = false
  selectedEdgeId.value = null
  editEdgeName.value = ''
}

function onEdgeClick({ event, edge }: { event: MouseEvent; edge: VFEdge }) {
  openEditEdge(edge)
  event.stopPropagation()
}

// zoom in / out
onMounted(() => {
  window.addEventListener('workflow:zoom', handleZoomEvent)
})

onUnmounted(() => {
  window.removeEventListener('workflow:zoom', handleZoomEvent)
})

function handleZoomEvent(e: Event) {
  const detail = (e as CustomEvent<{ action: 'in' | 'out' | 'reset' }>).detail
  if (!detail) return

  if (detail.action === 'in') zoomIn()
  if (detail.action === 'out') zoomOut()
  if (detail.action === 'reset') fitView({ padding: 0.12 })
}

// Keep the add-button node positioned after the last real node
watch(
  [nodes, () => props.canEdit],
  ([newNodes, canEdit]) => {
<<<<<<< HEAD
    // If editing is disabled, ensure the add button is removed
     if (!canEdit) {
        const btn = newNodes.find(n => n.id === 'add-button-node')
        if (btn) removeEdges(btn.id) // wait, removeNodes
        setNodes(newNodes.filter(n => n.id !== 'add-button-node') as any)
        return;
     }
=======
    if (!canEdit) {
      // ← was removeEdges(btn.id) which is wrong — removeNodes takes node ids
      const btn = (newNodes as VFNode[]).find(n => n.id === 'add-button-node')
      if (btn) removeNodes([btn.id])
      return
    }
>>>>>>> staging

    const realNodes = (newNodes as VFNode[]).filter(n => n.type !== 'custom-add-icon')

    let targetX = 50
    let targetY = 150

    if (realNodes.length > 0) {
      const lastNode = realNodes.reduce((prev, current) =>
        current.position.x > prev.position.x ? current : prev
      , realNodes[0])

      const PADDING_X = 200
      targetX = lastNode.position.x + PADDING_X
      targetY = lastNode.position.y
    }

    const addButtonNodeId = 'add-button-node'
    const existingNode = (newNodes as VFNode[]).find(n => n.id === addButtonNodeId)

    if (existingNode) {
      if (
        Math.abs(existingNode.position.x - targetX) > 5 ||
        Math.abs(existingNode.position.y - targetY) > 5
      ) {
        updateNode(addButtonNodeId, { position: { x: targetX, y: targetY } })
      }
    } else {
      addNodes({
        id: addButtonNodeId,
        type: 'custom-add-icon',
        position: { x: targetX, y: targetY },
        data: {},
        draggable: false,
        selectable: false,
      })
    }
  },
  { deep: true, immediate: true }
)

function triggerAddStatus() {
  emit('add:status')
}
</script>

<template>
  <div class="workflow-wrap">
    <!-- <Loader v-if="isProcessPending || isProcessFetching" /> -->

    <VueFlow
  v-model:nodes="(nodes as any)"
  v-model:edges="(edges as any)"
  :default-edge-options="defaultEdgeOptions"
  :nodes-draggable="canEdit"
  :nodes-connectable="canEdit"
  :elements-selectable="canEdit"
  :min-zoom="0.01"
  :max-zoom="100"
  fit-view-on-init
  @connect="onConnect"
  @edge-click="(e) => (canEdit ? onEdgeClick(e as any) : null)"
  @edge-update="(e) => (canEdit ? onEdgeUpdate(e) : null)"
  :edge-updater-radius="20" 
>
      <Background />
      <!-- <MiniMap /> -->
      <Controls :show-zoom="false" :show-fit-view="false" :show-interactive="false" position="top-right" />

       <!-- Custom Zoom Controls -->
      <div :class="isDark? 'bg-[#2d3748]':'bg-[#fff]'" class="absolute top-4 left-2 flex flex-col gap-2 z-10 p-1 rounded-[4px] shadow-md">
         <button :class="isDark? 'text-[white]': 'text-[#444446]'" @click="zoomIn()" class="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center rounded cursor-pointer" title="Zoom In">
            <i class="fa-solid fa-plus"></i>
         </button>
         <button  :class="isDark? 'text-[white]': 'text-[#444446]'" @click="zoomOut()" class="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center  rounded  cursor-pointer" title="Zoom Out">
            <i class="fa-solid fa-minus"></i>
         </button>
         <button  :class="isDark? 'text-[white]': 'text-[#444446]'" @click="fitView({ padding: 0.2 })" class="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center rounded cursor-pointer" title="Fit View">
            <i class="fa-solid fa-compress"></i>
         </button>
      </div>

      <!-- Custom node content with connection handles and a status picker -->
      <template #node-default="{ id, data }">
        <div class="relative min-w-[60px] px-1.5 py-0.5 rounded-md text-xs">
          <div class="flex justify-between items-center gap-1.5">
            <span class="truncate">
              {{ data.label }}
            </span>
            <div class="flex items-center gap-1.5">
               <i :class="canEdit? 'cursor-pointer':'cursor-not-allowed'"   class="fa-solid fa-edit text-xs opacity-70 hover:opacity-100" @click.stop="handleEditNode(id, data)"></i>
               <i 
             class="fa-solid fa-trash text-red-500/80 hover:text-red-500 text-xs"
             :class="canDelete? 'cursor-pointer': 'cursor-not-allowed'"
             @click.stop="confirmDeleteNode(id)"
            ></i>
            </div>
           
          </div>
          <!-- connection points -->
          <!-- inside #node-default -->
          <Handle id="in-top" type="target" :position="Position.Top" />
          <Handle id="out-right" type="source" :position="Position.Right" />
          <Handle id="out-bottom" type="source" :position="Position.Bottom" />
          <Handle id="in-left" type="target" :position="Position.Left" />



        </div>
      </template>

      <!-- Custom Add Icon Node -->
      <template #node-custom-add-icon>
        <div 
          class="w-10 h-10 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 nopan nodrag nowheel"
          @click.stop="triggerAddStatus"
          title="Add Status"
          style="pointer-events: all !important; z-index: 1000 !important; cursor: pointer !important;"
        >
          <i class="fa-solid fa-plus font-bold text-lg"></i>
        </div>
      </template>
    </VueFlow>

    <!-- Transition Name Modal -->
    <div v-if="showTransitionModal" class=" modal-backdrop" @click.self="cancelTransition">
      <div class="modal  border border-border !bg-bg-body text-text-primary">
        <h3>Name this transition</h3>
        <BaseTextField v-model="transitionName" placeholder="e.g., Start work, Complete"
          @keyup.enter="confirmTransition" autofocus />
        <div class="modal-actions mt-4">
          <Button size="sm" @click="confirmTransition">Add Transition</Button>
          <Button variant="secondary" size="sm" @click="cancelTransition">Cancel</Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Transition Modal -->
<div v-if="showEditEdgeModal" class="modal-backdrop" @click.self="cancelEditEdge">
  <div class="modal border border-border !bg-bg-body text-text-primary">
    <div class="relative flex justify-between items-start">
      <h3>Edit transition</h3>
       <!-- Close Button -->
          <button
            class=" cursor-pointe text-text-secondary hover:text-text-primary text-xl "
             @click="cancelEditEdge"
          >
          <img src="../../../assets/icons/cross.svg"
          alt="">
          </button>
    </div>
    <BaseTextField
      v-model="editEdgeName"
      placeholder="Transition name"
      @keyup.enter="confirmEditEdge"
      autofocus
    />
    <div class="modal-actions mt-4">
      <Button size="sm" @click="confirmEditEdge">Save</Button>
       <!-- DELETE BUTTON -->
      <Button
        size="sm"
        variant="danger"
        @click="deleteSelectedEdge"
      >
        Delete
      </Button>
      <Button
        size="sm"
        variant="secondary"
        @click="reverseSelectedEdge"
      >
        Reverse
      </Button>
    </div>
  </div>
</div>

</template>

<style scoped>
.workflow-wrap {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  position: sticky;
  top: 0;
  z-index: 2;
}

.btn {
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:hover {
  opacity: .9
}

.hint {
  margin-left: auto;
  color: #6b7280;
  font-size: 12px;
}




/* Make connection handles visible and clickable */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  border: 2px solid #111827;
  background: white;
}

/* Sharper edges */
:deep(.vue-flow__edge-path) {
  stroke: #111827;
  stroke-width: 2px;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  display: grid;
  place-items: center;
  z-index: 50;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 16px;
  width: 320px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .15);
}

.modal h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.modal input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn.ghost {
  background: #f3f4f6;
  color: #111827;
}

/* pull handles outward by 2px to compensate for the node border */
:deep(.vue-flow__handle-top) {
  transform: translate(-50%, calc(-50% - 10px));
}

:deep(.vue-flow__handle-right) {
  transform: translate(calc(50% + 10px), -50%);
}

:deep(.vue-flow__handle-bottom) {
  transform: translate(-50%, calc(50% + 10px));
}

:deep(.vue-flow__handle-left) {
  transform: translate(calc(-50% - 10px), -50%);
}

:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #9ca3af;
}

/* Selected node */
:deep(.vue-flow__node.selected) {
  box-shadow: 0 0 0 3px #2563eb;
  border-color: #2563eb !important;
  z-index: 10;
}


/* Selected edge */
:deep(.vue-flow__edge-path) {
  stroke: #1152de;
  stroke-width: 3px;
}

/* Selected edge */
:deep(.vue-flow__edge-path.selected) {
  stroke: #10285c !important;
  stroke-width: 3px;
  filter: drop-shadow(0 0 4px #2563eb);
}
</style>
