<script setup lang="ts">
import { nextTick, ref } from 'vue'
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
import { useCreateTransition, useProcessStatus, useProcessWorkflow } from '../../../queries/useProcess'
import { useWorkspaceId } from '../../../composables/useQueryParams'
import { watch } from 'vue'
import BaseTextField from '../../ui/BaseTextField.vue'
import Button from '../../ui/Button.vue'
import Loader from '../../ui/Loader.vue'

const nodes = ref<VFNode[]>([])
const edges = ref<VFEdge[]>([])

const { setNodes, updateNode, addEdges, setEdges, onNodesInitialized, fitView, updateNodeInternals, addNodes, project, getNodes, getEdges } = useVueFlow()

// ---- API hooks ----
const { workspaceId } = useWorkspaceId()

const { data: statuses, isSuccess: isStatues } = useProcessStatus(workspaceId.value);
const { data: processWorkflow, isSuccess: isProcess, isPending: isProcessPending, isFetching: isProcessFetching } = useProcessWorkflow(workspaceId.value)

// ---- Helpers to normalize API -> VueFlow ----
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
watch(
  [() => isStatues.value, () => isProcess.value],
  async ([s1, s2]) => {
    if (s1 && s2 && statuses.value && !processWorkflow.value?.raw_transitions.nodes) {
      const newNodes: VFNode[] = statuses.value.map((n: any, i: any) => ({
        id: String(n._id),
        type: n.type ?? 'default',
        position: { x: 300 * i, y: 34 },   // numbers, not strings
        data: {
          label: n.title, "status": "To Do"
        },
      }))
      await nextTick()
      setNodes(newNodes)
      await nextTick()
      nodes.value = newNodes;
      // stop() // remove the watcher so it fires only once
    }
  },
  { immediate: true }
)
// ---- WATCH: put API data into VueFlow ----
watch(
  () => processWorkflow.value,
  async (resp: any) => {
    const fd = resp?.raw_transitions
    if (!fd)
      return
    const incomingNodes = Array.isArray(fd.nodes) ? fd.nodes.map(mapApiNode) : []
    let incomingEdges: any;
    if (Array.isArray(fd.edges)) {
      incomingEdges = fd.edges.map(mapApiEdge)
    }
    // 1) put nodes in first
    await nextTick()
    setNodes(incomingNodes)
    await nextTick()

    // 2) after nodes & handles are mounted/measured, then add edges
    onNodesInitialized(async () => {
      // (optional) make sure handle bounds are fresh
      incomingNodes.forEach((n: any) => updateNodeInternals(n.id))
      setEdges(incomingEdges)
      fitView({ padding: 0.2 }) // nice-to-have
      await nextTick()

    })
  },
  { immediate: true }
)

// ---- onConnect: ask for transition name first ----
function onConnect(conn: Connection) {
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
// --- Default (system) nodes like Jira: Start, To Do, Done ---

// type Status = 'To Do' | 'In Progress' | 'Blocked' | 'Done'

// const nextId = (() => {
//   let i = 1
//   return () => `n-${i++}`
// })()

const { mutate: createWorkflow, isPending: isSaving } = useCreateTransition(workspaceId.value)

const defaultEdgeOptions: Partial<VFEdge> = {
  // sharp/right-angle like Jira
  type: 'step',
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
}


// --- Modal state for create & rename ---
const showCreateModal = ref(false)
const createName = ref('')
const showTransitionModal = ref(false)
const transitionName = ref('')
const pendingConnection = ref<Connection | null>(null)

const emit = defineEmits(['edit:node'])

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
      }, style: { border: '2px solid #64748b', borderRadius: '10px', background: nodeData.status_color }
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
    style: { border: '2px solid #64748b', borderRadius: '10px', background: e.status_color },
  })

}

defineExpose({ openCreateNodeModal, handleAddNode, saveWorkflow, isSaving, handleConfirmEdit })

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
      nodes: currentNodes.map(mapVFNodeToApi),
      edges: currentEdges.map(mapVFEdgeToApi),
    },
  }
}

function saveWorkflow() {

  const payload = serializeWorkflowPayload()
  console.log(' >>> saving workspace', payload);
  createWorkflow({ payload })
}


// watch(nodes, scheduleSave, { deep: true })
// watch(edges, scheduleSave, { deep: true })

// Optional safety net when navigating away
window.addEventListener('beforeunload', () => {
  if (isSaving.value) return
  try { saveWorkflow() } catch { }
})
</script>

<template>
  <div class="workflow-wrap">
    <Loader v-if="isProcessPending || isProcessFetching" />

    <VueFlow v-else v-model:nodes="nodes" v-model:edges="edges" :default-edge-options="defaultEdgeOptions"
      :nodes-draggable="true" :nodes-connectable="true" :elements-selectable="true" fit-view-on-init
      @connect="onConnect">

      <Background />
      <!-- <MiniMap /> -->
      <Controls />

      <!-- Custom node content with connection handles and a status picker -->
      <template #node-default="{ id, data }">
        <div class="relative min-w-25  rounded-md ">
          <div class="flex justify-between items-center ">
            <span>
              {{ data.label }}
            </span>
            <i class="fa-solid fa-edit cursor-pointer" @click.stop="handleEditNode(id, data)"></i>
          </div>
          <!-- connection points -->
          <!-- inside #node-default -->
          <Handle id="in-top" type="target" :position="Position.Top" />
          <Handle id="out-right" type="source" :position="Position.Right" />
          <Handle id="out-bottom" type="source" :position="Position.Bottom" />
          <Handle id="in-left" type="target" :position="Position.Left" />

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
