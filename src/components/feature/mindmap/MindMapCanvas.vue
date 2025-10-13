<template>
  <div ref="containerRef" class="mindmap-canvas">
    <MindMapToolbar
      :current-shape="currentShape"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :snap-to-grid="snapToGrid"
      @add-node="addNodeAtCenter"
      @change-shape="handleChangeShape"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @fit-view="fitView"
      @reset-zoom="resetZoom"
      @apply-layout="handleApplyLayout"
      @undo="undo"
      @redo="redo"
      @export="exportMindMap"
      @import="triggerImport"
      @clear="clearCanvas"
      @toggle-snap="snapToGrid = $event"
    />

    <svg
      ref="svgRef"
      class="mindmap-svg"
      @dblclick="handleCanvasDoubleClick"
      @contextmenu.prevent="handleCanvasContextMenu"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
        </marker>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
        <pattern
          id="grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="1" fill="#374151" opacity="0.3"/>
        </pattern>
      </defs>

      <g ref="mainGroupRef">
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

        <g ref="connectionsGroupRef"></g>
        <g ref="tempLineGroupRef"></g>
        <g ref="nodesGroupRef"></g>
      </g>
    </svg>

    <div v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <button @click="duplicateNode" v-if="contextMenu.nodeId">
        <i class="fa-solid fa-copy"></i> Duplicate
      </button>
      <button @click="deleteNode" v-if="contextMenu.nodeId">
        <i class="fa-solid fa-trash"></i> Delete
      </button>
      <button @click="changeNodeColor" v-if="contextMenu.nodeId">
        <i class="fa-solid fa-palette"></i> Change Color
      </button>
      <div class="menu-separator" v-if="contextMenu.nodeId"></div>
      <button @click="addNodeAtCenter" v-if="!contextMenu.nodeId">
        <i class="fa-solid fa-plus"></i> Add Node
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />

    <div class="minimap" v-if="showMinimap">
      <svg width="200" height="150" class="minimap-svg">
        <rect
          v-for="node in nodes"
          :key="node.id"
          :x="node.x / 10"
          :y="node.y / 10"
          :width="node.width / 10"
          :height="node.height / 10"
          :fill="node.backgroundColor"
          opacity="0.6"
        />
      </svg>
    </div>

    <div class="status-bar">
      <span>Nodes: {{ nodes.length }}</span>
      <span>Connections: {{ connections.length }}</span>
      <span>Zoom: {{ Math.round(currentZoom * 100) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import MindMapToolbar from './MindMapToolbar.vue'
import type { MindMapNode, MindMapConnection, MindMapData, LayoutType } from './types'

const props = defineProps<{
  processId?: string
}>()

const containerRef = ref<HTMLDivElement>()
const svgRef = ref<SVGSVGElement>()
const mainGroupRef = ref<SVGGElement>()
const nodesGroupRef = ref<SVGGElement>()
const connectionsGroupRef = ref<SVGGElement>()
const tempLineGroupRef = ref<SVGGElement>()
const fileInputRef = ref<HTMLInputElement>()

const nodes = ref<MindMapNode[]>([])
const connections = ref<MindMapConnection[]>([])
const selectedNodes = ref<Set<string>>(new Set())
const currentShape = ref<'rectangle' | 'rounded' | 'circle' | 'diamond'>('rounded')
const snapToGrid = ref(false)
const showMinimap = ref(true)
const currentZoom = ref(1)

const history = ref<MindMapData[]>([])
const historyIndex = ref(-1)
const canUndo = ref(false)
const canRedo = ref(false)

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  nodeId: null as string | null
})

const connectionState = ref<{
  active: boolean
  sourceId: string
  handle: string
  mouseX: number
  mouseY: number
} | null>(null)

let zoom: any = null
let isDraggingNode = false
let dragOffset: { x: number; y: number } | null = null
let autoSaveTimer: any = null

onMounted(() => {
  initializeCanvas()
  loadFromLocalStorage()
  startAutoSave()
  setupKeyboardShortcuts()
})

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleDocumentClick)
})

watch([nodes, connections], () => {
  nextTick(() => {
    renderMindMap()
  })
}, { deep: true })

function initializeCanvas() {
  if (!svgRef.value || !mainGroupRef.value) return

  const svg = d3.select(svgRef.value)
  const mainGroup = d3.select(mainGroupRef.value)

  zoom = d3.zoom()
    .scaleExtent([0.1, 5])
    .filter((event: any) => {
      if (isDraggingNode) return false
      if (connectionState.value?.active) return false
      return !event.button
    })
    .on('zoom', (event) => {
      mainGroup.attr('transform', event.transform)
      currentZoom.value = event.transform.k
    })

  svg.call(zoom as any)

  svg.on('click', () => {
    if (!isDraggingNode && !connectionState.value?.active) {
      selectedNodes.value.clear()
      renderMindMap()
    }
  })

  const initialTransform = d3.zoomIdentity.translate(400, 300).scale(1)
  svg.call(zoom.transform as any, initialTransform)
}

function handleCanvasDoubleClick(event: MouseEvent) {
  if ((event.target as SVGElement).tagName === 'svg' ||
      (event.target as SVGElement).tagName === 'rect') {
    const pos = getCanvasPosition(event)
    addNode(pos.x, pos.y)
  }
}

function getCanvasPosition(event: MouseEvent): { x: number; y: number } {
  const svg = svgRef.value
  const mainGroup = mainGroupRef.value
  if (!svg || !mainGroup) return { x: 0, y: 0 }

  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY

  const transform = mainGroup.getCTM()
  if (!transform) return { x: 0, y: 0 }

  const graphPoint = pt.matrixTransform(transform.inverse())
  return { x: graphPoint.x, y: graphPoint.y }
}

function addNode(x: number, y: number, content = 'New Node') {
  const newNode: MindMapNode = {
    id: `node-${Date.now()}-${Math.random()}`,
    x: snapToGrid.value ? Math.round(x / 20) * 20 : x,
    y: snapToGrid.value ? Math.round(y / 20) * 20 : y,
    width: 160,
    height: 80,
    content,
    shape: currentShape.value,
    backgroundColor: '#3b82f6',
    borderColor: '#1e40af',
    textColor: '#ffffff',
    fontSize: 14
  }

  nodes.value.push(newNode)
  saveToHistory()
  saveToLocalStorage()
}

function addNodeAtCenter() {
  const centerX = 0
  const centerY = 0
  addNode(centerX, centerY)
}

function renderMindMap() {
  if (!nodesGroupRef.value || !connectionsGroupRef.value) return

  renderConnections()
  renderNodes()
}

function renderNodes() {
  if (!nodesGroupRef.value) return

  const nodesGroup = d3.select(nodesGroupRef.value)
  const nodeElements = nodesGroup.selectAll<SVGGElement, MindMapNode>('.mind-node')
    .data(nodes.value, (d: MindMapNode) => d.id)

  nodeElements.exit().remove()

  const nodeEnter = nodeElements.enter()
    .append('g')
    .attr('class', 'mind-node')
    .attr('transform', (d: MindMapNode) => `translate(${d.x}, ${d.y})`)

  nodeEnter.each(function(d: MindMapNode) {
    const group = d3.select(this)

    if (d.shape === 'circle') {
      const radius = Math.min(d.width, d.height) / 2
      group.append('circle')
        .attr('class', 'node-shape')
        .attr('cx', d.width / 2)
        .attr('cy', d.height / 2)
        .attr('r', radius)
    } else if (d.shape === 'diamond') {
      const centerX = d.width / 2
      const centerY = d.height / 2
      const points = `${centerX},0 ${d.width},${centerY} ${centerX},${d.height} 0,${centerY}`
      group.append('polygon')
        .attr('class', 'node-shape')
        .attr('points', points)
    } else {
      group.append('rect')
        .attr('class', 'node-shape')
        .attr('width', d.width)
        .attr('height', d.height)
        .attr('rx', d.shape === 'rounded' ? 8 : 0)
    }

    group.select('.node-shape')
      .attr('fill', d.backgroundColor)
      .attr('stroke', d.borderColor)
      .attr('stroke-width', 2)
      .style('cursor', 'move')
      .style('filter', 'url(#shadow)')

    group.append('foreignObject')
      .attr('class', 'node-text')
      .attr('x', 5)
      .attr('y', 5)
      .attr('width', d.width - 10)
      .attr('height', d.height - 10)
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', d.textColor)
      .style('font-size', d.fontSize + 'px')
      .style('text-align', 'center')
      .style('word-wrap', 'break-word')
      .style('padding', '5px')
      .style('cursor', 'text')
      .attr('contenteditable', 'true')
      .text(d.content)
      .on('blur', function() {
        d.content = (this as HTMLDivElement).textContent || ''
        saveToLocalStorage()
      })
      .on('mousedown', (event: MouseEvent) => {
        event.stopPropagation()
      })

    const handles = [
      { id: 'left', x: 0, y: d.height / 2 },
      { id: 'right', x: d.width, y: d.height / 2 },
      { id: 'top', x: d.width / 2, y: 0 },
      { id: 'bottom', x: d.width / 2, y: d.height }
    ]

    handles.forEach(handle => {
      const handleGroup = group.append('g')
        .attr('class', `connection-handle handle-${handle.id}`)
        .attr('transform', `translate(${handle.x}, ${handle.y})`)
        .style('opacity', 0)
        .style('cursor', 'crosshair')

      handleGroup.append('circle')
        .attr('r', 6)
        .attr('fill', '#3b82f6')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)

      handleGroup.on('mousedown', function(event: any) {
        event.stopPropagation()
        startConnection(d.id, handle.id, event)
      })

      handleGroup.on('mouseup', function(event: any) {
        event.stopPropagation()
        if (connectionState.value?.active && connectionState.value.sourceId !== d.id) {
          completeConnection(d.id)
        }
      })
    })
  })

  const drag = d3.drag<SVGGElement, MindMapNode>()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded)

  nodeEnter.call(drag as any)

  nodeEnter.on('click', (event: any, d: MindMapNode) => {
    event.stopPropagation()
    if (event.shiftKey) {
      if (selectedNodes.value.has(d.id)) {
        selectedNodes.value.delete(d.id)
      } else {
        selectedNodes.value.add(d.id)
      }
    } else {
      selectedNodes.value.clear()
      selectedNodes.value.add(d.id)
    }
    renderMindMap()
  })

  nodeEnter.on('contextmenu', (event: any, d: MindMapNode) => {
    event.preventDefault()
    event.stopPropagation()
    showContextMenu(event.clientX, event.clientY, d.id)
  })

  nodeEnter.on('mouseenter', function() {
    d3.select(this).selectAll('.connection-handle').style('opacity', 1)
  })

  nodeEnter.on('mouseleave', function() {
    if (!connectionState.value?.active) {
      d3.select(this).selectAll('.connection-handle').style('opacity', 0)
    }
  })

  const nodeUpdate = nodeEnter.merge(nodeElements)

  nodeUpdate.attr('transform', (d: MindMapNode) => `translate(${d.x}, ${d.y})`)

  nodeUpdate.select('.node-shape')
    .attr('fill', (d: MindMapNode) => d.backgroundColor)
    .attr('stroke', (d: MindMapNode) => {
      return selectedNodes.value.has(d.id) ? '#10b981' : d.borderColor
    })
    .attr('stroke-width', (d: MindMapNode) => {
      return selectedNodes.value.has(d.id) ? 3 : 2
    })

  nodeUpdate.select('.node-text div')
    .style('color', (d: MindMapNode) => d.textColor)
    .style('font-size', (d: MindMapNode) => d.fontSize + 'px')
    .text((d: MindMapNode) => d.content)
}

function renderConnections() {
  if (!connectionsGroupRef.value) return

  const connectionsGroup = d3.select(connectionsGroupRef.value)
  const connectionElements = connectionsGroup.selectAll<SVGPathElement, MindMapConnection>('.mind-connection')
    .data(connections.value, (d: MindMapConnection) => d.id)

  connectionElements.exit().remove()

  const connectionEnter = connectionElements.enter()
    .append('path')
    .attr('class', 'mind-connection')
    .attr('fill', 'none')
    .attr('stroke', (d: MindMapConnection) => d.color)
    .attr('stroke-width', (d: MindMapConnection) => d.thickness)
    .attr('marker-end', 'url(#arrowhead)')
    .style('cursor', 'pointer')

  connectionEnter.on('click', (event: any, d: MindMapConnection) => {
    event.stopPropagation()
    if (confirm('Delete this connection?')) {
      connections.value = connections.value.filter(c => c.id !== d.id)
      saveToHistory()
      saveToLocalStorage()
    }
  })

  const connectionUpdate = connectionEnter.merge(connectionElements)

  connectionUpdate.attr('d', (d: MindMapConnection) => {
    const sourceNode = nodes.value.find(n => n.id === d.sourceId)
    const targetNode = nodes.value.find(n => n.id === d.targetId)

    if (!sourceNode || !targetNode) return ''

    const x1 = sourceNode.x + sourceNode.width
    const y1 = sourceNode.y + sourceNode.height / 2
    const x2 = targetNode.x
    const y2 = targetNode.y + targetNode.height / 2

    if (d.style === 'straight') {
      return `M ${x1},${y1} L ${x2},${y2}`
    } else if (d.style === 'elbow') {
      const midX = (x1 + x2) / 2
      return `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`
    } else {
      const dx = x2 - x1
      const dy = y2 - y1
      const distance = Math.sqrt(dx * dx + dy * dy)
      const curveOffset = Math.min(distance / 3, 80)

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      const perpX = -dy / distance
      const perpY = dx / distance

      const controlX = midX + perpX * curveOffset
      const controlY = midY + perpY * curveOffset

      return `M ${x1},${y1} Q ${controlX},${controlY} ${x2},${y2}`
    }
  })
}

function dragStarted(event: any, d: MindMapNode) {
  isDraggingNode = true

  const pos = getCanvasPosition(event.sourceEvent)
  dragOffset = {
    x: d.x - pos.x,
    y: d.y - pos.y
  }

  d3.select(event.sourceEvent.target.parentNode as SVGGElement)
    .raise()
    .classed('dragging', true)
}

function dragged(event: any, d: MindMapNode) {
  if (!dragOffset) return

  const pos = getCanvasPosition(event.sourceEvent)

  d.x = pos.x + dragOffset.x
  d.y = pos.y + dragOffset.y

  if (snapToGrid.value) {
    d.x = Math.round(d.x / 20) * 20
    d.y = Math.round(d.y / 20) * 20
  }

  d3.select(event.sourceEvent.target.parentNode)
    .attr('transform', `translate(${d.x}, ${d.y})`)

  renderConnections()
}

function dragEnded(event: any) {
  isDraggingNode = false
  dragOffset = null

  d3.select(event.sourceEvent.target.parentNode as SVGGElement)
    .classed('dragging', false)

  saveToHistory()
  saveToLocalStorage()
}

function startConnection(sourceId: string, handle: string, event: any) {
  const pos = getCanvasPosition(event.sourceEvent)

  connectionState.value = {
    active: true,
    sourceId,
    handle,
    mouseX: pos.x,
    mouseY: pos.y
  }

  d3.selectAll('.connection-handle').style('opacity', 1)

  if (svgRef.value) {
    svgRef.value.addEventListener('mousemove', handleConnectionDrag)
    svgRef.value.addEventListener('mouseup', handleConnectionEnd)
  }
}

function handleConnectionDrag(event: MouseEvent) {
  if (!connectionState.value?.active) return

  const pos = getCanvasPosition(event)
  connectionState.value.mouseX = pos.x
  connectionState.value.mouseY = pos.y

  renderTempConnection()
}

function handleConnectionEnd() {
  if (connectionState.value?.active) {
    connectionState.value = null
    d3.selectAll('.connection-handle').style('opacity', 0)
    clearTempConnection()
  }

  if (svgRef.value) {
    svgRef.value.removeEventListener('mousemove', handleConnectionDrag)
    svgRef.value.removeEventListener('mouseup', handleConnectionEnd)
  }
}

function completeConnection(targetId: string) {
  if (!connectionState.value) return

  const sourceId = connectionState.value.sourceId

  const exists = connections.value.some(
    c => c.sourceId === sourceId && c.targetId === targetId
  )

  if (!exists && sourceId !== targetId) {
    const newConnection: MindMapConnection = {
      id: `conn-${Date.now()}-${Math.random()}`,
      sourceId,
      targetId,
      style: 'curved',
      color: '#6b7280',
      thickness: 2
    }

    connections.value.push(newConnection)
    saveToHistory()
    saveToLocalStorage()
  }

  connectionState.value = null
  d3.selectAll('.connection-handle').style('opacity', 0)
  clearTempConnection()
}

function renderTempConnection() {
  if (!tempLineGroupRef.value || !connectionState.value) return

  const tempGroup = d3.select(tempLineGroupRef.value)
  tempGroup.selectAll('*').remove()

  const sourceNode = nodes.value.find(n => n.id === connectionState.value!.sourceId)
  if (!sourceNode) return

  const x1 = sourceNode.x + sourceNode.width
  const y1 = sourceNode.y + sourceNode.height / 2
  const x2 = connectionState.value.mouseX
  const y2 = connectionState.value.mouseY

  tempGroup.append('path')
    .attr('d', `M ${x1},${y1} L ${x2},${y2}`)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '8,4')
    .attr('opacity', 0.7)
    .style('pointer-events', 'none')
}

function clearTempConnection() {
  if (!tempLineGroupRef.value) return
  d3.select(tempLineGroupRef.value).selectAll('*').remove()
}

function handleCanvasContextMenu(event: MouseEvent) {
  event.preventDefault()
  showContextMenu(event.clientX, event.clientY, null)
}

function showContextMenu(x: number, y: number, nodeId: string | null) {
  contextMenu.value = {
    visible: true,
    x,
    y,
    nodeId
  }

  document.addEventListener('click', handleDocumentClick)
}

function handleDocumentClick() {
  contextMenu.value.visible = false
  document.removeEventListener('click', handleDocumentClick)
}

function duplicateNode() {
  if (!contextMenu.value.nodeId) return

  const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
  if (!node) return

  const newNode = { ...node, id: `node-${Date.now()}-${Math.random()}`, x: node.x + 50, y: node.y + 50 }
  nodes.value.push(newNode)
  saveToHistory()
  saveToLocalStorage()

  contextMenu.value.visible = false
}

function deleteNode() {
  if (!contextMenu.value.nodeId) return

  nodes.value = nodes.value.filter(n => n.id !== contextMenu.value.nodeId)
  connections.value = connections.value.filter(
    c => c.sourceId !== contextMenu.value.nodeId && c.targetId !== contextMenu.value.nodeId
  )
  saveToHistory()
  saveToLocalStorage()

  contextMenu.value.visible = false
}

function changeNodeColor() {
  if (!contextMenu.value.nodeId) return

  const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
  if (!node) return

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const currentIndex = colors.indexOf(node.backgroundColor)
  const nextIndex = (currentIndex + 1) % colors.length

  node.backgroundColor = colors[nextIndex]
  saveToLocalStorage()

  contextMenu.value.visible = false
}

function zoomIn() {
  if (!svgRef.value || !zoom) return
  d3.select(svgRef.value).transition().call(zoom.scaleBy as any, 1.3)
}

function zoomOut() {
  if (!svgRef.value || !zoom) return
  d3.select(svgRef.value).transition().call(zoom.scaleBy as any, 0.7)
}

function fitView() {
  if (!svgRef.value || !zoom || nodes.value.length === 0) return

  const padding = 50
  const minX = Math.min(...nodes.value.map(n => n.x)) - padding
  const minY = Math.min(...nodes.value.map(n => n.y)) - padding
  const maxX = Math.max(...nodes.value.map(n => n.x + n.width)) + padding
  const maxY = Math.max(...nodes.value.map(n => n.y + n.height)) + padding

  const width = maxX - minX
  const height = maxY - minY

  const svg = svgRef.value
  const svgRect = svg.getBoundingClientRect()

  const scale = Math.min(svgRect.width / width, svgRect.height / height, 2)
  const translateX = svgRect.width / 2 - (minX + width / 2) * scale
  const translateY = svgRect.height / 2 - (minY + height / 2) * scale

  const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)

  d3.select(svg).transition().duration(750).call(zoom.transform as any, transform)
}

function resetZoom() {
  if (!svgRef.value || !zoom) return
  const transform = d3.zoomIdentity.translate(400, 300).scale(1)
  d3.select(svgRef.value).transition().duration(750).call(zoom.transform as any, transform)
}

function handleChangeShape(shape: string) {
  currentShape.value = shape as 'rectangle' | 'rounded' | 'circle' | 'diamond'
}

function handleApplyLayout(layout: string) {
  applyLayout(layout as LayoutType)
}

function applyLayout(layoutType: LayoutType) {
  if (nodes.value.length === 0) return

  if (layoutType === 'tree') {
    applyTreeLayout()
  } else if (layoutType === 'radial') {
    applyRadialLayout()
  } else if (layoutType === 'force') {
    applyForceLayout()
  }

  saveToHistory()
  saveToLocalStorage()
}

function applyTreeLayout() {
  const levelWidth = 250

  nodes.value.forEach((node, index) => {
    node.x = index * levelWidth
    node.y = 0
  })
}

function applyRadialLayout() {
  const centerX = 0
  const centerY = 0
  const radius = 300

  nodes.value.forEach((node, index) => {
    const angle = (index / nodes.value.length) * 2 * Math.PI
    node.x = centerX + radius * Math.cos(angle) - node.width / 2
    node.y = centerY + radius * Math.sin(angle) - node.height / 2
  })
}

function applyForceLayout() {
  const simulation = d3.forceSimulation(nodes.value as any)
    .force('charge', d3.forceManyBody().strength(-1000))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(100))
    .on('tick', () => {
      nodes.value.forEach((node: any) => {
        node.x = node.x - node.width / 2
        node.y = node.y - node.height / 2
      })
      renderMindMap()
    })

  simulation.tick(300)
  simulation.stop()
}

function saveToHistory() {
  const currentState: MindMapData = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value))
  }

  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  history.value.push(currentState)
  historyIndex.value = history.value.length - 1

  canUndo.value = historyIndex.value > 0
  canRedo.value = false
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const state = history.value[historyIndex.value]
    nodes.value = JSON.parse(JSON.stringify(state.nodes))
    connections.value = JSON.parse(JSON.stringify(state.connections))

    canUndo.value = historyIndex.value > 0
    canRedo.value = true

    saveToLocalStorage()
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    const state = history.value[historyIndex.value]
    nodes.value = JSON.parse(JSON.stringify(state.nodes))
    connections.value = JSON.parse(JSON.stringify(state.connections))

    canUndo.value = true
    canRedo.value = historyIndex.value < history.value.length - 1

    saveToLocalStorage()
  }
}

function saveToLocalStorage() {
  const data: MindMapData = {
    nodes: nodes.value,
    connections: connections.value,
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
  }

  const key = props.processId ? `mindmap-${props.processId}` : 'mindmap-default'
  localStorage.setItem(key, JSON.stringify(data))
}

function loadFromLocalStorage() {
  const key = props.processId ? `mindmap-${props.processId}` : 'mindmap-default'
  const saved = localStorage.getItem(key)

  if (saved) {
    try {
      const data: MindMapData = JSON.parse(saved)
      nodes.value = data.nodes || []
      connections.value = data.connections || []
      saveToHistory()
    } catch (e) {
      console.error('Failed to load mind map:', e)
    }
  } else {
    addNode(-100, -50, 'Central Idea')
    addNode(150, -50, 'Branch 1')
    addNode(150, 80, 'Branch 2')
    connections.value.push({
      id: 'conn-init-1',
      sourceId: nodes.value[0].id,
      targetId: nodes.value[1].id,
      style: 'curved',
      color: '#6b7280',
      thickness: 2
    })
    connections.value.push({
      id: 'conn-init-2',
      sourceId: nodes.value[0].id,
      targetId: nodes.value[2].id,
      style: 'curved',
      color: '#6b7280',
      thickness: 2
    })
    saveToHistory()
    saveToLocalStorage()
  }
}

function startAutoSave() {
  autoSaveTimer = setInterval(() => {
    saveToLocalStorage()
  }, 30000)
}

function exportMindMap() {
  const data: MindMapData = {
    nodes: nodes.value,
    connections: connections.value,
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mindmap-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInputRef.value?.click()
}

function handleFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data: MindMapData = JSON.parse(e.target?.result as string)
      nodes.value = data.nodes || []
      connections.value = data.connections || []
      saveToHistory()
      saveToLocalStorage()
    } catch (error) {
      alert('Failed to import mind map. Invalid file format.')
    }
  }
  reader.readAsText(file)
}

function clearCanvas() {
  if (confirm('Are you sure you want to clear the entire mind map?')) {
    nodes.value = []
    connections.value = []
    selectedNodes.value.clear()
    saveToHistory()
    saveToLocalStorage()
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyDown)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).contentEditable === 'true') {
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    selectedNodes.value.forEach(nodeId => {
      nodes.value = nodes.value.filter(n => n.id !== nodeId)
      connections.value = connections.value.filter(
        c => c.sourceId !== nodeId && c.targetId !== nodeId
      )
    })
    selectedNodes.value.clear()
    saveToHistory()
    saveToLocalStorage()
  }

  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'z') {
      event.preventDefault()
      undo()
    } else if (event.key === 'y') {
      event.preventDefault()
      redo()
    } else if (event.key === 'd') {
      event.preventDefault()
      selectedNodes.value.forEach(nodeId => {
        const node = nodes.value.find(n => n.id === nodeId)
        if (node) {
          const newNode = { ...node, id: `node-${Date.now()}-${Math.random()}`, x: node.x + 50, y: node.y + 50 }
          nodes.value.push(newNode)
        }
      })
      saveToHistory()
      saveToLocalStorage()
    }
  }
}
</script>

<style scoped>
.mindmap-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-body);
}

.mindmap-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.mindmap-svg:active {
  cursor: grabbing;
}

:deep(.mind-node) {
  transition: none;
}

:deep(.mind-node.dragging) {
  opacity: 0.8;
}

:deep(.connection-handle) {
  transition: opacity 0.2s;
}

:deep(.connection-handle circle) {
  transition: all 0.2s;
}

:deep(.connection-handle:hover circle) {
  r: 8;
  fill: #2563eb;
}

:deep(.mind-connection) {
  transition: stroke 0.2s, stroke-width 0.2s;
}

:deep(.mind-connection:hover) {
  stroke: #3b82f6 !important;
  stroke-width: 3 !important;
}

.context-menu {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 180px;
  padding: 0.5rem 0;
}

.context-menu button {
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.context-menu button:hover {
  background: var(--bg-surface);
}

.menu-separator {
  height: 1px;
  background: var(--border);
  margin: 0.5rem 0;
}

.minimap {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.minimap-svg {
  display: block;
}

.status-bar {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
