<script setup lang="ts">
import { ref } from 'vue'
import {
  VueFlow,
  Handle,
  Position,
  useVueFlow,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
} from '@vue-flow/core'
import { ConnectionMode } from '@vue-flow/core'

import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
// import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useProcessWorkflow } from '../../../queries/useProcess'
import { useWorkspaceId } from '../../../composables/useQueryParams'

// --- Default (system) nodes like Jira: Start, To Do, Done ---

type Status = 'To Do' | 'In Progress' | 'Blocked' | 'Done'

const nextId = (() => {
  let i = 1
  return () => `n-${i++}`
})()

const nodes = ref<Node[]>([
  {
    id: 'start',
    position: { x: 50, y: 100 },
    data: { label: 'Start', status: 'To Do' satisfies Status },
    style: { borderRadius: '9999px', background: '#fff' },
    // prevent deletion/drag toggle by user config
    deletable: false,
  },
  {
    id: 'todo',
    position: { x: 300, y: 60 },
    data: { label: 'To Do', status: 'To Do' satisfies Status },
    style: { borderRadius: '10px', background: '#fff' },
    deletable: false,
  },
  {
    id: 'done',
    position: { x: 300, y: 220 },
    data: { label: 'Done', status: 'Done' satisfies Status },
    style: { borderRadius: '10px', background: '#fff' },
    deletable: false,
  },
])

const edges = ref<Edge[]>([
  // sample system wiring (editable but nodes aren’t deletable)
  { id: 'e-start-todo', source: 'start', target: 'todo', type: 'step' },
  { id: 'e-todo-done', source: 'todo', target: 'done', type: 'step' },
])

const defaultEdgeOptions: Partial<Edge> = {
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
}


const { addEdges, addNodes, updateNode, project } = useVueFlow()

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

// Connect any node to any other node (disallow self-connect)
function onConnect(conn: Connection) {
  if (!conn.source || !conn.target || conn.source === conn.target) return
  addEdges({ ...conn, id: `${conn.source}-${conn.target}-${crypto.randomUUID?.() ?? Math.random()}` })
}

// Optional: validate connections (e.g., prevent multiple parallel edges between same pair)
function isValidConnection(conn: Connection) {
  if (!conn.source || !conn.target || conn.source === conn.target) return false
  return !edges.value.some(e => e.source === conn.source && e.target === conn.target)
}


defineExpose({ openCreateNodeModal, handleAddNode })
const { workspaceId } = useWorkspaceId();
const { data: processWorkflow } = useProcessWorkflow(workspaceId); 

</script>

<template>
  <div class="workflow-wrap">
    <VueFlow :connection-mode="ConnectionMode.Strict" v-model:nodes="nodes" v-model:edges="edges"
      :default-edge-options="defaultEdgeOptions" :nodes-draggable="true" :nodes-connectable="true"
      :elements-selectable="true" fit-view-on-init @connect="onConnect" :is-valid-connection="isValidConnection">
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
          <Handle type="target" :position="Position.Top" />
          <Handle type="source" :position="Position.Right" />
          <Handle type="source" :position="Position.Bottom" />
          <Handle type="target" :position="Position.Left" />
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
