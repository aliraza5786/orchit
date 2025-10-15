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
import { ConnectionMode } from '@vue-flow/core'

import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
// import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useCreateTransition, useProcessStatus, useProcessWorkflow } from '../../../queries/useProcess'
import { useWorkspaceId } from '../../../composables/useQueryParams'
import { watch } from 'vue'

const nodes = ref<VFNode[]>([])
const edges = ref<VFEdge[]>([])

const { setNodes, addEdges, setEdges, onNodesInitialized, fitView, updateNodeInternals, addNodes, project } = useVueFlow()

// ---- API hooks ----
const { workspaceId } = useWorkspaceId()

const { data: statuses, isSuccess: isStatues } = useProcessStatus(workspaceId.value);
const { data: processWorkflow, isSuccess: isProcess } = useProcessWorkflow(workspaceId.value)
const { mutate: createTransition } = useCreateTransition(workspaceId.value)

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

function normalizeMarkerType(t?: string) {
  if (!t) return undefined
  const key = t.toLowerCase()
  if (key === 'arrow') return MarkerType.Arrow
  if (key === 'arrowclosed') return MarkerType.ArrowClosed
  if (key === 'circle') return MarkerType.Circle
  if (key === 'square') return MarkerType.Square
  if (key === 'diamond') return MarkerType.Diamond
  if (key === 'dot') return MarkerType.Dot
  // fallback
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
    console.log(s1, s2, '>>>> stau');

    if (s1 && s2 && statuses.value && !processWorkflow.value?.raw_transitions.nodes) {
      const newNodes: VFNode[] = statuses.value.map((n: any, i:any) => ({
        id: String(n._id),
        type: n.type ?? 'default',
        position: { x: 300 * i, y: 34 },   // numbers, not strings
        data: { label: n.title ,                    "status": "To Do"
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
    const incomingEdges = Array.isArray(fd.edges) ? fd.edges.map(mapApiEdge) : []
    // 1) put nodes in first
    await nextTick()
    setNodes(incomingNodes)
    // 2) after nodes & handles are mounted/measured, then add edges
    onNodesInitialized(() => {
      // (optional) make sure handle bounds are fresh
      incomingNodes.forEach((n: any) => updateNodeInternals(n.id))
      setEdges(incomingEdges)
      fitView({ padding: 0.2 }) // nice-to-have
    })
  },
  { immediate: true }
)

// ---- onConnect: still send to API and add locally ----
function onConnect(conn: Connection) {
  const id = `${conn.source}-${conn.target}-${crypto.randomUUID?.() ?? Math.random()}`
  const payload: VFEdge = {
    ...conn,
    id,
    type: 'step',
    label: 'Transition',
    data: { name: 'Transition' },
    style: { stroke: '#1152de', strokeWidth: 2 },
    markerEnd: { type: MarkerType.Arrow, color: '#1152de', width: 18, height: 18 },
  }

  // createTransition({ payload }) // your POST
  addEdges(payload)             // update UI
}
// --- Default (system) nodes like Jira: Start, To Do, Done ---

type Status = 'To Do' | 'In Progress' | 'Blocked' | 'Done'

const nextId = (() => {
  let i = 1
  return () => `n-${i++}`
})()

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
const renameId = ref<string | null>(null)
const renameName = ref('')

function openCreateNodeModal() {
  createName.value = ''
  showCreateModal.value = true
}

function confirmCreateNode() {
  const id = nextId()
  const pos = project({ x: 60, y: 360 })
  const name = (createName.value || `Node ${id}`).trim()
  addNodes({
    id,
    position: pos,
    data: { label: name, status: 'In Progress' as Status },
    style: { borderRadius: '10px', background: '#fff' },
  })
  showCreateModal.value = false
}

function cancelCreateNode() {
  showCreateModal.value = false
}

function startRename(nodeId: string, currentName: string) {
  renameId.value = nodeId
  renameName.value = currentName
}

function confirmRename() {
  if (!renameId.value) return
  const name = renameName.value.trim()
  if (name) updateNode(renameId.value, n => ({ ...n, data: { ...n.data, label: name } }))
  renameId.value = null
}

function cancelRename() { renameId.value = null }

// Add a brand-new independent node
function handleAddNode(e: any) {
  const id = nextId()
  const pos = project({ x: 60, y: 360 }) // place near bottom-left; project to account for zoom/pan
  const status: Status = 'In Progress'
  addNodes({
    id,
    position: pos,
    data: { label: e, status },
    style: { border: '2px solid #64748b', borderRadius: '10px', background: '#fff' },
  })
}
// Optional: validate connections (e.g., prevent multiple parallel edges between same pair)
// Allowed status transitions (Jira-like). Tweak as needed.
const ALLOWED: Record<string, string[]> = {
  start: ['todo'],         // Start -> To Do
  todo: ['done'],         // To Do -> Done (add 'blocked' etc if you have it)
  done: [],               // Done is terminal in this example
}

// Build a quick lookup for duplicates
const transitionKey = (s: string, t: string) => `${s}->${t}`

function isValidConnection(conn: Connection) {
  // 1) basic checks
  if (!conn.source || !conn.target || !conn.sourceHandle || !conn.targetHandle) return false
  if (conn.source === conn.target) return false
  console.log(conn, 'cc from valid');

  // 2) (optional) enforce out-* → in-* or other handle rules
  // const isSourceOut = conn.sourceHandle.startsWith('out-')
  // const isTargetIn  = conn.targetHandle.startsWith('in-')
  // if (!isSourceOut || !isTargetIn) return false

  // 3) (optional) enforce allowed status transitions via your ALLOWED map
  // const srcNode = nodes.value.find(n => n.id === conn.source)
  // const tgtNode = nodes.value.find(n => n.id === conn.target)
  // if (!srcNode || !tgtNode) return false
  // if (!(ALLOWED[srcNode.id] || []).includes(tgtNode.id)) return false

  // 4) duplicates
  if (isDuplicateEdge(conn)) return false

  return true
}

type DedupMode = 'direction' | 'handle-pair' | 'node-pair'
const DEDUPE_MODE: DedupMode = 'direction' // ← pick one

function edgeMatches(conn: Connection, e: VFEdge, mode: DedupMode) {
  const sameDirection =
    e.source === conn.source && e.target === conn.target

  const sameHandles =
    e.sourceHandle === conn.sourceHandle && e.targetHandle === conn.targetHandle

  const undirectedPair =
    (e.source === conn.source && e.target === conn.target) ||
    (e.source === conn.target && e.target === conn.source)

  if (mode === 'direction') return sameDirection
  if (mode === 'handle-pair') return sameDirection && sameHandles
  if (mode === 'node-pair') return undirectedPair
  return false
}

function isDuplicateEdge(conn: Connection) {
  return edges.value.some(e => edgeMatches(conn, e, DEDUPE_MODE))
}

defineExpose({ openCreateNodeModal, handleAddNode, saveWorkflow, isSaving })

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
  return {
    id: e.id,
    type: e.type ?? 'step',
    source: e.source,
    target: e.target,
    source_handle: e.sourceHandle,      // snake_case for API
    target_handle: e.targetHandle,
    label: e.label,
    data: e.data,
    style: e.style
      ? { ...e.style, strokeWidth: Number((e.style as any).strokeWidth ?? 2) }
      : undefined,
    marker_end: e.markerEnd
      ? {
        type: markerTypeToApi(e.markerEnd.type as any),
        color: (e.markerEnd as any).color,
        width: Number((e.markerEnd as any).width ?? 18),
        height: Number((e.markerEnd as any).height ?? 18),
      }
      : undefined,
    animated: !!e.animated,
  }
}

function serializeWorkflowPayload() {
  return {
    workspace_id: workspaceId.value,
    // optional: send totals/summary if you compute them client-side;
    // otherwise the server can recompute and return them.
    flow_diagram: {
      nodes: nodes.value.map(mapVFNodeToApi),
      edges: edges.value.map(mapVFEdgeToApi),
      // optional: include meta if you want
      // meta: { ... }
    }
  }
}

function saveWorkflow() {
  console.log(' >>> saving workspace');

  const payload = serializeWorkflowPayload()
  createWorkflow({ payload })
}

let saveTimer: any = null
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveWorkflow, 800) // debounce 800ms
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

    <VueFlow v-model:nodes="nodes" v-model:edges="edges" :default-edge-options="defaultEdgeOptions" :nodes-draggable="true"
      :nodes-connectable="true" :elements-selectable="true" fit-view-on-init @connect="onConnect"
      :is-valid-connection="isValidConnection">

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
            <i class="fa-solid fa-edit cursor-pointer" @click.stop="startRename(id, data.label)"></i>
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

    <!-- Create Node Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="cancelCreateNode">
      <div class="modal">
        <h3>Create node</h3>
        <input v-model="createName" placeholder="Enter node name" @keyup.enter="confirmCreateNode" />
        <div class="modal-actions">
          <button class="btn" @click="confirmCreateNode">Create</button>
          <button class="btn ghost" @click="cancelCreateNode">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Rename Node Modal -->
    <div v-if="renameId" class="modal-backdrop" @click.self="cancelRename">
      <div class="modal">
        <h3>Rename node</h3>
        <input v-model="renameName" placeholder="Node name" @keyup.enter="confirmRename" />
        <div class="modal-actions">
          <button class="btn" @click="confirmRename">Save</button>
          <button class="btn ghost" @click="cancelRename">Cancel</button>
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
