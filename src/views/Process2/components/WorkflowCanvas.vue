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
// import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useWorkspaceId } from '../../../composables/useQueryParams'

import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
// import Loader from '../../../components/ui/Loader.vue'
import type { EdgeUpdateEvent } from '@vue-flow/core'

import { useTheme } from "../../../composables/useTheme";
const { isDark } = useTheme();

// --- Modal state for editing an existing transition (edge) ---
const showEditEdgeModal = ref(false)
const editEdgeName = ref('')
const selectedEdgeId = ref<string | null>(null)

const nodes = ref<VFNode[]>([])
const edges = ref<VFEdge[]>([])

/**
 *  
 * Tracks the flow diagram and generates status objects for Kanban statuses.
 */
const statusObjects = computed(() => {
  const filtered = nodes.value.filter(node => node.data?.label)
  return filtered.map((node, index) => {
    const outgoingEdges = edges.value.filter(e => e.source === node.id)
    const incomingEdges = edges.value.filter(e => e.target === node.id)

    const forwardMoves = [...new Set(outgoingEdges.map(e => {
      const targetNode = nodes.value.find(n => n.id === e.target)
      return targetNode?.data?.label
    }).filter(Boolean))]

    const backwardMoves = [...new Set(incomingEdges.map(e => {
      const sourceNode = nodes.value.find(n => n.id === e.source)
      return sourceNode?.data?.label
    }).filter(Boolean))]

    return {
      _id: node.id,
      status: node.data.label,
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

// Output the full array of status objects whenever it changes
watch(statusObjects, (newValue) => {
  console.log('Workflow Status Objects Change:', JSON.stringify(newValue, null, 2))
}, { deep: true })

const { setNodes, updateNode, addEdges, setEdges, removeEdges,  onNodesInitialized, fitView, updateNodeInternals, addNodes, project, getNodes, getEdges, zoomIn, zoomOut } = useVueFlow()
// ---- API hooks ----
const { workspaceId } = useWorkspaceId()
const props = withDefaults(defineProps<{
    processId?:any,
    showTransitionLabels?:boolean,
    workflowData?: any,
    canEdit?: boolean,
    canDelete?: boolean,

}>(), { canEdit: true })

// ---- Helpers to normalize API -> VueFlow ----

// Watch for prop-injected data
watch(() => props.workflowData, async (data) => {
    if (data) {
        // Assuming data structure matches what we expect (nodes, edges) or the API response shape
        // If it's the raw transition object, we might need to drill down
        const fd = data.flow_diagram || data; // Adapt as needed based on API
        
        const incomingNodes = Array.isArray(fd.nodes) ? fd.nodes.map(mapApiNode) : []
        const incomingEdges = Array.isArray(fd.edges) ? fd.edges.map(mapApiEdge) : []

        await nextTick()
        setNodes(incomingNodes)
        
        onNodesInitialized(async () => {
             incomingNodes.forEach((n: any) => updateNodeInternals(n.id))
             setEdges(incomingEdges)
             fitView({ padding: 0.5, maxZoom: 1 })
        })
    }
}, { immediate: true })


function triggerSave() {
    const payload = serializeWorkflowPayload()
    emit('save', payload)
}

function saveWorkflow() {
  const payload = serializeWorkflowPayload()
  console.log(' >>> saving workflow (process2)', payload);
  emit('save', payload)
}

// ... expose triggerSave ...
defineExpose({ openCreateNodeModal, handleAddNode, saveWorkflow, triggerSave, handleConfirmEdit })

function mapApiNode(n: any): VFNode {
  return {
    id: n.id,
    type: n.type ?? 'default',
    position: n.position,
    data: n.data,
    style: n.style,
    // (optional) dimensions aren’t required by VueFlow; it will measure.
  }
}

// Replace your normalizeMarkerType with this:
function normalizeMarkerType(t?: string): MarkerType {
  const key = (t ?? 'arrow').toLowerCase()
  if (key === 'arrow') return MarkerType.Arrow
  if (key === 'arrowclosed') return MarkerType.ArrowClosed
  // add other mappings here if you use them; default to Arrow
  return MarkerType.Arrow
}

function mapApiEdge(e: any): VFEdge {
  // Accept either snake_case or camelCase from API
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


// ---- onConnect: ask for transition name first ----
function onConnect(conn: Connection) {
  if(!props.canEdit) return;
  pendingConnection.value = conn
  transitionName.value = ''
  showTransitionModal.value = true
}

function confirmTransition() {
  if (!pendingConnection.value) return

  const conn = pendingConnection.value
  const name = transitionName.value.trim() || 'Transition'
  const id = `${conn.source}-${conn.target}-${crypto.randomUUID?.() ?? Math.random()}`

  const payload: VFEdge = {
    ...conn,
    id,
    type: 'step',
    label: name,
    data: { name },
    style: { stroke: '#1152de', strokeWidth: 2 },
    markerEnd: { type: MarkerType.Arrow, color: '#1152de', width: 18, height: 18 },
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle, 
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
  // sharp/right-angle like Jira
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

const emit = defineEmits(['edit:node', 'save', 'update:workflow', 'add:status', 'add:transition'])

function openCreateNodeModal() {
  createName.value = ''
  showCreateModal.value = true
}

function handleEditNode(nodeId: string, nodeData: any) {
  const node = getNodes.value.find(n => n.id === nodeId)
  console.log(node, '>>>>');

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
      ...n, data: {
        ...n.data, label: nodeData.name, status: nodeData.category,
      }, style: { border: '2px solid #64748b', borderRadius: '8px', background: nodeData.status_color }
    }))
  }
  nextTick();

}
// Add a brand-new independent node
async function handleAddNode(e: any) {
  const makeId = () => crypto.randomUUID?.() ?? `n-${Date.now()}-${Math.random()}`
  const id = makeId();
  const pos = project({ x: e.position_x, y: e.position_y }) // place near bottom-left; project to account for zoom/pan
    addNodes({
      id,
      position: pos,
      data: { label: e.name, status: e.status_name },
      style: { border: '2px solid #64748b', borderRadius: '8px', background: e.status_color },
    })

}


function markerTypeToApi(t?: MarkerType | string) {
  if (!t) return undefined
  // VueFlow enum values stringify to names; also accept strings
  const key = String(t).toLowerCase()
  // normalize common cases
  if (key.includes('arrowclosed')) return 'arrowclosed'
  if (key.includes('arrow')) return 'arrow'
  if (key.includes('circle')) return 'circle'
  if (key.includes('square')) return 'square'
  if (key.includes('diamond')) return 'diamond'
  if (key.includes('dot')) return 'dot'
  return 'arrow'
}

function mapVFNodeToApi(n: VFNode) {
  // Send what your GET returned under flow_diagram.nodes
  return {
    id: n.id,
    type: n.type ?? 'default',
    position: n.position,
    // dimensions are optional; backend can store last known box if you want
    data: n.data,
    style: n.style,
  }
}

function mapVFEdgeToApi(e: VFEdge) {
  // narrow markerEnd which is EdgeMarkerType (object | string | undefined)
  const m = e.markerEnd
  const marker_end = m
    ? (() => {
      const mt = typeof m === 'string' ? m : (m as any).type
      return {
        type: markerTypeToApi(mt as MarkerType | string), // ← now safe
        color: typeof m === 'string' ? undefined : (m as any).color,
        width: typeof m === 'string' ? undefined : Number((m as any).width ?? 18),
        height: typeof m === 'string' ? undefined : Number((m as any).height ?? 18),
      }
    })()
    : undefined

  return {
    id: e.id,
    type: e.type ?? 'step',
    source: e.source,
    target: e.target,
    source_handle: e.sourceHandle,
    target_handle: e.targetHandle,
    label: e.label,
    data: e.data,
    style: e.style
      ? { ...(e.style as Record<string, any>), strokeWidth: Number((e.style as any).strokeWidth ?? 2) }
      : undefined,
    marker_end,                 // ← use the narrowed value
    animated: !!e.animated,
  }
}


function serializeWorkflowPayload() {
  const currentNodes = getNodes.value   // ✅ not getNodes()
  const currentEdges = getEdges.value   // ✅ not getEdges()

  return {
    workspace_id: workspaceId.value,
    flow_diagram: {
      nodes: currentNodes.filter((n) => n.type !== 'custom-add-icon').map(mapVFNodeToApi),
      edges: currentEdges.map(mapVFEdgeToApi),
    },
    flow_metadata:statusObjects.value
  }
}


// Optional safety net when navigating away
window.addEventListener('beforeunload', () => {
    // We can't really save synchronousy here if it's an API call, 
    // but we can trigger event.
})


function openEditEdge(edge: VFEdge) {
  console.log(edge, 'edge');
  
  selectedEdgeId.value = edge.id
  // prefer existing label, fallback to data.name, else empty
  editEdgeName.value = String(edge.label ?? edge.data?.name ?? '')
  showEditEdgeModal.value = true
}

function confirmEditEdge() {
  if (!selectedEdgeId.value) return
  const name = editEdgeName.value.trim()

  // Update the edge’s label (and mirror into data.name to keep your API shape consistent)
  setEdges(eds =>
    eds.map(e =>
      e.id === selectedEdgeId.value
        ? { ...e, label: name || e.label, data: { ...(e.data ?? {}), name: name || e.data?.name } }
        : e
    )
  )

  // reset modal
  showEditEdgeModal.value = false
  selectedEdgeId.value = null
  editEdgeName.value = ''
}
// delete edge
function deleteSelectedEdge() {
  if (!selectedEdgeId.value) return

  removeEdges([selectedEdgeId.value])

  // close modal + reset state
  showEditEdgeModal.value = false
  selectedEdgeId.value = null
  editEdgeName.value = ''
}

// reverse selection transition
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

// delete status node
function deleteStatus(nodeId: string) {
  // Remove the node itself
  setNodes(nodes => nodes.filter(n => n.id !== nodeId))

  // Remove all edges connected to this node
  setEdges(edges =>
    edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )
  )
   // clear selection if needed
  selectedEdgeId.value = null
}
function confirmDeleteNode(nodeId: string) {
  const ok = window.confirm(
    'Are you sure you want to delete this status? All transitions will also be removed.'
  )
  if (!ok) return

  deleteStatus(nodeId)
}

// change transition direction by dragging and dropping
function onEdgeUpdate(event: EdgeUpdateEvent) {
  const { edge, connection } = event
  if (!edge || !connection) return

  setEdges(edges =>
    edges.map(e =>
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
function onEdgeClick({event, edge}:{event:any, edge:any}) {
  console.log('>>> click',edge);
  
  openEditEdge(edge)
  event.stopPropagation()
}


// zoom in zoom out
onMounted(() => {
  window.addEventListener('workflow:zoom', handleZoomEvent)
})

onUnmounted(() => {
  window.removeEventListener('workflow:zoom', handleZoomEvent)
})

function handleZoomEvent(e: Event) {
  const detail = (e as CustomEvent).detail
  if (!detail) return
  
  if (detail.action === 'in') zoomIn()
  if (detail.action === 'out') zoomOut()
  if (detail.action === 'reset') fitView({ padding: 0.12 })
}

// Ensure the "Add" button node is always after the last node
watch(
  [nodes, () => props.canEdit],
  ([newNodes, canEdit]) => {
    // If editing is disabled, ensure the add button is removed
    if (!canEdit) {
       const btn = newNodes.find(n => n.id === 'add-button-node')
       if (btn) removeEdges(btn.id) // wait, removeNodes
       setNodes(newNodes.filter(n => n.id !== 'add-button-node'))
       return;
    }

    // Filter out the add button itself to find the real last node
    const realNodes = newNodes.filter((n) => n.type !== 'custom-add-icon');
    
    // Default position if no nodes exist
    let targetX = 50;
    let targetY = 150;

    if (realNodes.length > 0) {
        // Find the right-most node (max X)
        const lastNode = realNodes.reduce((prev, current) => {
          const prevX = prev.position.x;
          const currX = current.position.x;
          return currX > prevX ? current : prev;
        }, realNodes[0]);

        const PADDING_X = 200; 
        targetX = lastNode.position.x + PADDING_X;
        targetY = lastNode.position.y; // Keep same Y level
    }

    const addButtonNodeId = 'add-button-node';
    const existingNode = newNodes.find((n) => n.id === addButtonNodeId);

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
);

function triggerAddStatus() {
  console.log('>>> Add Status Clicked');
  emit('add:status');
}

</script>

<template>
  <div class="workflow-wrap">
    <!-- <Loader v-if="isProcessPending || isProcessFetching" /> -->

    <VueFlow
  v-model:nodes="nodes"
  v-model:edges="edges"
  :default-edge-options="defaultEdgeOptions"
  :nodes-draggable="canEdit"
  :nodes-connectable="canEdit"
  :elements-selectable="canEdit"
  :min-zoom="0.01"
  :max-zoom="100"
  fit-view-on-init
  @connect="onConnect"
  @edge-click="(e) => (canEdit ? onEdgeClick(e) : null)"
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
