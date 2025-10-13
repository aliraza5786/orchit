<template>
  <div ref="containerRef" class="workflow-canvas w-full h-full bg-bg-body relative overflow-hidden">
    <svg ref="svgRef" class="w-full h-full">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g ref="mainGroupRef">
        <g ref="transitionsGroupRef"></g>
        <g ref="tempLineGroupRef"></g>
        <g ref="statusesGroupRef"></g>
      </g>
    </svg>

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
/**
 * WorkflowCanvas - Jira-Style Interactive Workflow Editor
 *
 * This component implements a drag-and-drop workflow editor with zoom/pan capabilities.
 * It uses D3.js v7 for SVG manipulation and coordinate transformations.
 *
 * CRITICAL: Coordinate System Architecture
 * ========================================
 *
 * This component maintains TWO coordinate systems:
 *
 * 1. SCREEN COORDINATES (pointer events, clientX/clientY)
 *    - Raw mouse/pointer positions from browser events
 *    - Affected by zoom level and pan offset
 *    - Used only for initial event capture
 *
 * 2. GRAPH COORDINATES (node positions, status.position_x/position_y)
 *    - The "logical" coordinate space where nodes exist
 *    - Independent of zoom level or pan offset
 *    - Stored in database and used for all position calculations
 *
 * COORDINATE CONVERSION:
 * ----------------------
 * To convert screen → graph coordinates:
 *   const pt = svg.createSVGPoint()
 *   pt.x = event.clientX
 *   pt.y = event.clientY
 *   const transform = mainGroup.getCTM()  // Current Transform Matrix
 *   const graphPoint = pt.matrixTransform(transform.inverse())
 *
 * Why this matters:
 * - At zoom=1.0, screen coords ≈ graph coords (no conversion needed)
 * - At zoom=0.5, a 100px screen movement = 200px graph movement
 * - At zoom=2.0, a 100px screen movement = 50px graph movement
 *
 * THE BUG WE FIXED:
 * -----------------
 * The original code used event.x/event.y directly (screen coords) for node positions,
 * causing nodes to "jump" toward (0,0) at zoom levels != 1.0.
 *
 * The fix: Always convert screen → graph coordinates, maintain a drag offset,
 * and apply zoom transform ONLY to the viewport, never to node data.
 */
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import * as d3 from 'd3'
import { useWorkflowData, useUpdateStatus, useDeleteStatus, useCreateTransition, useUpdateTransition, useDeleteTransition } from '../../../queries/useProcess'

const props = defineProps<{
  processId: string
  showTransitionLabels: boolean
}>()

defineEmits<{
  (e: 'update:workflow'): void
  (e: 'add:status'): void
  (e: 'add:transition'): void
}>()

const containerRef = ref<HTMLDivElement>()
const svgRef = ref<SVGSVGElement>()
const mainGroupRef = ref<SVGGElement>()
const statusesGroupRef = ref<SVGGElement>()
const transitionsGroupRef = ref<SVGGElement>()
const tempLineGroupRef = ref<SVGGElement>()

const { data: workflowData, isLoading, refetch } = useWorkflowData(props.processId)
const selectedStatus = ref<any>(null)
const selectedTransition = ref<any>(null)
const editingTransition = ref<any>(null)

const connectionState = ref<{
  active: boolean
  sourceStatus: any
  sourceHandle: string
  mouseX: number
  mouseY: number
} | null>(null)

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

const { mutate: updateTransition } = useUpdateTransition({
  onSuccess: () => {
    editingTransition.value = null
    refetch()
  }
})

const { mutate: deleteTransition } = useDeleteTransition({
  onSuccess: () => {
    selectedTransition.value = null
    refetch()
  }
})

let zoom: any = null
let isDraggingNode = false
let animationFrameId: number | null = null

onMounted(() => {
  initializeCanvas()
  setupZoomHandlers()
  setupGlobalEventHandlers()
})

onUnmounted(() => {
  window.removeEventListener('workflow:zoom', handleZoomEvent)
  if (svgRef.value) {
    svgRef.value.removeEventListener('mousemove', handleSvgMouseMove)
    svgRef.value.removeEventListener('mouseup', handleSvgMouseUp)
  }
  document.removeEventListener('keydown', handleKeyDown)
})

watch(() => workflowData.value, () => {
  nextTick(() => {
    renderWorkflow()
  })
}, { deep: true })

watch(() => props.showTransitionLabels, () => {
  renderWorkflow()
})

/**
 * Initializes the SVG canvas with zoom and pan capabilities.
 *
 * Key architectural decisions:
 * - Zoom transform is applied ONLY to the mainGroup (viewport), not the SVG root
 * - Node position data (x, y) remains in graph coordinates and is NEVER modified by zoom
 * - Drag operations convert between screen and graph coordinates using transform.inverse()
 * - Zoom is disabled during node dragging to prevent coordinate conflicts
 */
function initializeCanvas() {
  if (!svgRef.value || !mainGroupRef.value) return

  const svg = d3.select(svgRef.value)
  const mainGroup = d3.select(mainGroupRef.value)

  zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .filter((event: any) => {
      // Disable zoom during node dragging to prevent interference
      if (isDraggingNode) return false
      // Disable zoom during connection drawing
      if (connectionState.value?.active) return false
      // Allow zoom on left mouse button only
      return !event.button
    })
    .on('zoom', (event) => {
      // Apply zoom transform to viewport group only
      // This keeps node x,y coordinates in their original graph space
      mainGroup.attr('transform', event.transform)
    })

  svg.call(zoom as any)

  svg.on('click', () => {
    selectedStatus.value = null
    selectedTransition.value = null
  })
}

function setupGlobalEventHandlers() {
  if (svgRef.value) {
    svgRef.value.addEventListener('mousemove', handleSvgMouseMove)
    svgRef.value.addEventListener('mouseup', handleSvgMouseUp)
  }
  document.addEventListener('keydown', handleKeyDown)
}

function handleSvgMouseMove(event: MouseEvent) {
  if (connectionState.value?.active) {
    const svg = svgRef.value
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY

    const mainGroup = mainGroupRef.value
    if (!mainGroup) return

    const transform = mainGroup.getCTM()
    if (!transform) return

    // Convert screen coordinates to graph coordinates for accurate line drawing at any zoom
    const transformed = pt.matrixTransform(transform.inverse())

    connectionState.value.mouseX = transformed.x
    connectionState.value.mouseY = transformed.y

    renderTempLine()
  }
}

function handleSvgMouseUp() {
  if (connectionState.value?.active) {
    connectionState.value = null
    d3.selectAll('.connection-handle').style('opacity', 0)
    d3.selectAll('.status-node').classed('connection-mode', false)
    d3.selectAll('.status-node').classed('drop-target', false)
    renderTempLine()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Delete' && selectedTransition.value) {
    handleDeleteTransition(selectedTransition.value)
  }
  if (event.key === 'Escape') {
    selectedStatus.value = null
    selectedTransition.value = null
    connectionState.value = null
    renderTempLine()
  }
}

function handleZoomEvent(event: Event) {
  const e = event as CustomEvent
  const action = e.detail?.action
  if (!svgRef.value || !zoom) return

  const svg = d3.select(svgRef.value)

  if (action === 'in') {
    svg.transition().call(zoom.scaleBy as any, 1.3)
  } else if (action === 'out') {
    svg.transition().call(zoom.scaleBy as any, 0.7)
  } else if (action === 'reset') {
    svg.transition().call(zoom.transform as any, d3.zoomIdentity)
  }
}

function setupZoomHandlers() {
  window.addEventListener('workflow:zoom', handleZoomEvent)
}

function renderWorkflow() {
  if (!workflowData.value || !statusesGroupRef.value || !transitionsGroupRef.value) return

  const statuses = workflowData.value.statuses || []
  const transitions = workflowData.value.transitions || []

  renderTransitions(transitions, statuses)
  renderStatuses(statuses)
}

function renderStatuses(statuses: any[]) {
  if (!statusesGroupRef.value) return

  const statusGroup = d3.select(statusesGroupRef.value)
  const statusNodes = statusGroup.selectAll<SVGGElement, any>('.status-node')
    .data(statuses, (d: any) => d.id)

  statusNodes.exit().remove()

  const nodeEnter = statusNodes.enter()
    .append('g')
    .attr('class', 'status-node')
    .attr('transform', (d: any) => `translate(${d.position_x || 0}, ${d.position_y || 0})`)

  nodeEnter.append('rect')
    .attr('class', 'status-rect')
    .attr('width', 140)
    .attr('height', 50)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', (d: any) => d.status_color || '#3b82f6')
    .attr('stroke', '#1f2937')
    .attr('stroke-width', 2)
    .style('cursor', 'move')
    .on('mouseenter', function(this: SVGRectElement) {
      if (this.parentNode) {
        d3.select(this.parentNode as SVGGElement).selectAll('.connection-handle').style('opacity', 1)
      }
    })
    .on('mouseleave', function(this: SVGRectElement) {
      if (!connectionState.value?.active && this.parentNode) {
        d3.select(this.parentNode as SVGGElement).selectAll('.connection-handle').style('opacity', 0)
      }
    })

  nodeEnter.append('text')
    .attr('class', 'status-text')
    .attr('x', 70)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ffffff')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .attr('pointer-events', 'none')
    .text((d: any) => d.status_name)

  const handles = [
    { id: 'left', x: 0, y: 25 },
    { id: 'right', x: 140, y: 25 },
    { id: 'top', x: 70, y: 0 },
    { id: 'bottom', x: 70, y: 50 }
  ]

  handles.forEach(handle => {
    const handleGroup = nodeEnter.append('g')
      .attr('class', `connection-handle connection-handle-${handle.id}`)
      .attr('transform', `translate(${handle.x}, ${handle.y})`)
      .style('opacity', 0)
      .style('cursor', 'crosshair')
      .style('transition', 'opacity 0.2s')

    handleGroup.append('circle')
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)

    handleGroup.on('mousedown', function(event: any, d: any) {
      event.stopPropagation()
      startConnection(d, handle.id, event)
    })

    handleGroup.on('mouseup', function(event: any, d: any) {
      event.stopPropagation()
      if (connectionState.value?.active && connectionState.value.sourceStatus.id !== d.id) {
        completeConnection(d)
      }
    })

    handleGroup.on('mouseenter', function(_event: any, d: any) {
      if (connectionState.value?.active && connectionState.value.sourceStatus.id !== d.id) {
        const parent = (this as SVGGElement).parentNode
        if (parent) {
          const node = d3.select(parent as SVGGElement)
          node.classed('drop-target', true)
        }
        d3.select(this as SVGGElement).select('circle')
          .attr('r', 10)
          .attr('fill', '#10b981')
          .attr('filter', 'url(#glow)')
      } else if (!connectionState.value?.active) {
        d3.select(this as SVGGElement).select('circle')
          .attr('r', 8)
          .attr('fill', '#2563eb')
          .attr('filter', 'url(#glow)')
      }
    })

    handleGroup.on('mouseleave', function() {
      if (connectionState.value?.active) {
        const parent = (this as SVGGElement).parentNode
        if (parent) {
          const node = d3.select(parent as SVGGElement)
          node.classed('drop-target', false)
        }
      }
      d3.select(this as SVGGElement).select('circle')
        .attr('r', 6)
        .attr('fill', '#3b82f6')
        .attr('filter', null)
    })

  })

  const drag = d3.drag<SVGGElement, any>()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded)

  nodeEnter.select('.status-rect').call(drag as any)

  nodeEnter.on('click', (event: any, d: any) => {
    event.stopPropagation()
    if (!connectionState.value?.active) {
      selectedStatus.value = { ...d }
      selectedTransition.value = null
    }
  })

  const nodeUpdate = nodeEnter.merge(statusNodes)

  nodeUpdate.attr('transform', (d: any) => `translate(${d.position_x || 0}, ${d.position_y || 0})`)

  nodeUpdate.select('.status-rect')
    .attr('fill', (d: any) => d.status_color || '#3b82f6')

  nodeUpdate.select('.status-text')
    .text((d: any) => d.status_name)
}

function renderTransitions(transitions: any[], statuses: any[]) {
  if (!transitionsGroupRef.value) return

  const transitionGroup = d3.select(transitionsGroupRef.value)
  const transitionGroups = transitionGroup.selectAll<SVGGElement, any>('.transition-group')
    .data(transitions, (d: any) => d.id)

  transitionGroups.exit().remove()

  const groupEnter = transitionGroups.enter()
    .append('g')
    .attr('class', 'transition-group')
    .style('cursor', 'pointer')

  groupEnter.append('path')
    .attr('class', 'transition-path')
    .attr('fill', 'none')
    .attr('stroke', '#6b7280')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)')
    .on('mouseenter', function() {
      d3.select(this)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 3)
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 2)
    })
    .on('click', function(event: any, d: any) {
      event.stopPropagation()
      selectedTransition.value = d
      selectedStatus.value = null
    })

  if (props.showTransitionLabels) {
    groupEnter.append('rect')
      .attr('class', 'transition-label-bg')
      .attr('fill', '#1f2937')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', '#374151')
      .attr('stroke-width', 1)

    groupEnter.append('text')
      .attr('class', 'transition-label')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'all')
      .style('cursor', 'text')
      .on('click', function(event: any, d: any) {
        event.stopPropagation()
        startEditingTransitionLabel(d, this)
      })
      .on('mouseenter', function() {
        d3.select(this).attr('fill', '#3b82f6')
      })
      .on('mouseleave', function() {
        d3.select(this).attr('fill', '#9ca3af')
      })
  }

  const groupUpdate = groupEnter.merge(transitionGroups)

  groupUpdate.select('.transition-path')
    .attr('d', (d: any) => {
      const fromStatus = statuses.find((s: any) => s.id === d.from_status_id)
      const toStatus = statuses.find((s: any) => s.id === d.to_status_id)

      if (!fromStatus || !toStatus) return ''

      const x1 = (fromStatus.position_x || 0) + 140
      const y1 = (fromStatus.position_y || 0) + 25
      const x2 = (toStatus.position_x || 0)
      const y2 = (toStatus.position_y || 0) + 25

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
    })

  if (props.showTransitionLabels) {
    groupUpdate.each(function(d: any) {
      const group = d3.select(this)
      const fromStatus = statuses.find((s: any) => s.id === d.from_status_id)
      const toStatus = statuses.find((s: any) => s.id === d.to_status_id)

      if (!fromStatus || !toStatus) return

      const x1 = (fromStatus.position_x || 0) + 140
      const y1 = (fromStatus.position_y || 0) + 25
      const x2 = (toStatus.position_x || 0)
      const y2 = (toStatus.position_y || 0) + 25

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      const label = d.transition_label || 'Click to edit'
      const labelWidth = label.length * 6.5 + 16
      const labelHeight = 20

      group.select('.transition-label-bg')
        .attr('x', midX - labelWidth / 2)
        .attr('y', midY - labelHeight / 2 - 30)
        .attr('width', labelWidth)
        .attr('height', labelHeight)

      group.select('.transition-label')
        .attr('x', midX)
        .attr('y', midY - 21)
        .text(label)
    })
  }
}

function renderTempLine() {
  if (!tempLineGroupRef.value) return

  const tempGroup = d3.select(tempLineGroupRef.value)
  tempGroup.selectAll('*').remove()

  if (connectionState.value?.active) {
    const { sourceStatus, mouseX, mouseY } = connectionState.value
    const x1 = (sourceStatus.position_x || 0) + 140
    const y1 = (sourceStatus.position_y || 0) + 25

    const dx = mouseX - x1
    const dy = mouseY - y1
    const distance = Math.sqrt(dx * dx + dy * dy)
    const curveOffset = Math.min(distance / 3, 50)

    const midX = (x1 + mouseX) / 2
    const midY = (y1 + mouseY) / 2

    const perpX = -dy / distance
    const perpY = dx / distance

    const controlX = midX + perpX * curveOffset
    const controlY = midY + perpY * curveOffset

    const pathData = `M ${x1},${y1} Q ${controlX},${controlY} ${mouseX},${mouseY}`

    tempGroup.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0.7)
      .style('pointer-events', 'none')

    tempGroup.append('circle')
      .attr('cx', mouseX)
      .attr('cy', mouseY)
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.8)
      .style('pointer-events', 'none')
  }
}

/**
 * Updates transition paths during node dragging for smooth real-time feedback.
 * This function recalculates curved Bezier paths connecting status nodes.
 * Called via requestAnimationFrame to optimize performance during drag operations.
 */
function updateTransitionsForDrag() {
  if (!transitionsGroupRef.value || !workflowData.value) return

  const statuses = workflowData.value.statuses || []
  const transitionGroup = d3.select(transitionsGroupRef.value)

  // Batch update all transition paths for optimal performance
  transitionGroup.selectAll<SVGGElement, any>('.transition-group')
    .select('.transition-path')
    .attr('d', (d: any) => {
      const fromStatus = statuses.find((s: any) => s.id === d.from_status_id)
      const toStatus = statuses.find((s: any) => s.id === d.to_status_id)

      if (!fromStatus || !toStatus) return ''

      // Calculate endpoints: right edge of source, left edge of target
      const x1 = (fromStatus.position_x || 0) + 140
      const y1 = (fromStatus.position_y || 0) + 25
      const x2 = (toStatus.position_x || 0)
      const y2 = (toStatus.position_y || 0) + 25

      const dx = x2 - x1
      const dy = y2 - y1
      const distance = Math.sqrt(dx * dx + dy * dy)
      const curveOffset = Math.min(distance / 3, 80)

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      // Calculate perpendicular offset for curved path
      const perpX = -dy / distance
      const perpY = dx / distance

      const controlX = midX + perpX * curveOffset
      const controlY = midY + perpY * curveOffset

      // Return quadratic Bezier curve path
      return `M ${x1},${y1} Q ${controlX},${controlY} ${x2},${y2}`
    })

  // Update label positions if visible
  if (props.showTransitionLabels) {
    transitionGroup.selectAll<SVGGElement, any>('.transition-group')
      .each(function(d: any) {
        const group = d3.select(this)
        const fromStatus = statuses.find((s: any) => s.id === d.from_status_id)
        const toStatus = statuses.find((s: any) => s.id === d.to_status_id)

        if (!fromStatus || !toStatus) return

        const x1 = (fromStatus.position_x || 0) + 140
        const y1 = (fromStatus.position_y || 0) + 25
        const x2 = (toStatus.position_x || 0)
        const y2 = (toStatus.position_y || 0) + 25

        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        const label = d.transition_label || 'Click to edit'
        const labelWidth = label.length * 6.5 + 16
        const labelHeight = 20

        group.select('.transition-label-bg')
          .attr('x', midX - labelWidth / 2)
          .attr('y', midY - labelHeight / 2 - 30)
          .attr('width', labelWidth)
          .attr('height', labelHeight)

        group.select('.transition-label')
          .attr('x', midX)
          .attr('y', midY - 21)
      })
  }
}

function startConnection(sourceStatus: any, handleId: string, event: any) {
  event.stopPropagation()

  const svg = svgRef.value
  if (!svg) return

  const pt = svg.createSVGPoint()
  pt.x = event.sourceEvent.clientX
  pt.y = event.sourceEvent.clientY

  const mainGroup = mainGroupRef.value
  if (!mainGroup) return

  const transform = mainGroup.getCTM()
  if (!transform) return

  // Convert initial pointer position to graph coordinates for accurate connection start
  const transformed = pt.matrixTransform(transform.inverse())

  connectionState.value = {
    active: true,
    sourceStatus,
    sourceHandle: handleId,
    mouseX: transformed.x,
    mouseY: transformed.y
  }

  d3.selectAll('.connection-handle').style('opacity', 1)
  d3.selectAll('.status-node').classed('connection-mode', true)
  renderTempLine()
}

function completeConnection(targetStatus: any) {
  if (!connectionState.value) return

  const { sourceStatus } = connectionState.value

  const existingTransition = workflowData.value?.transitions?.find((t: any) =>
    t.from_status_id === sourceStatus.id && t.to_status_id === targetStatus.id
  )

  if (existingTransition) {
    alert('A transition already exists between these statuses')
    connectionState.value = null
    d3.selectAll('.connection-handle').style('opacity', 0)
    d3.selectAll('.status-node').classed('connection-mode', false)
    d3.selectAll('.status-node').classed('drop-target', false)
    renderTempLine()
    return
  }

  createTransition({
    payload: {
      process_id: props.processId,
      from_status_id: sourceStatus.id,
      to_status_id: targetStatus.id,
      transition_label: '',
      rules: []
    }
  })

  connectionState.value = null
  d3.selectAll('.connection-handle').style('opacity', 0)
  d3.selectAll('.status-node').classed('connection-mode', false)
  d3.selectAll('.status-node').classed('drop-target', false)
  renderTempLine()
}

// Store drag offset for each node to maintain cursor alignment at any zoom level
let dragOffset: { x: number; y: number } | null = null

function dragStarted(event: any, d: any) {
  isDraggingNode = true

  // Convert pointer position from screen coordinates to graph coordinates
  // This ensures accurate positioning regardless of the current zoom level
  const svg = svgRef.value
  const mainGroup = mainGroupRef.value
  if (!svg || !mainGroup) return

  const pt = svg.createSVGPoint()
  pt.x = event.sourceEvent.clientX
  pt.y = event.sourceEvent.clientY

  const transform = mainGroup.getCTM()
  if (!transform) return

  // Transform screen coordinates to graph coordinates using the inverse transform
  const graphPoint = pt.matrixTransform(transform.inverse())

  // Calculate and store the offset between the pointer and the node's current position
  // This offset remains constant throughout the drag, keeping the node under the cursor
  dragOffset = {
    x: d.position_x - graphPoint.x,
    y: d.position_y - graphPoint.y
  }

  const node = d3.select(event.sourceEvent.target.parentNode as SVGGElement)
  node.raise()
  node.classed('dragging', true)

  node.select('.status-rect')
    .style('filter', 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))')
    .style('cursor', 'grabbing')
}

function dragged(event: any, d: any) {
  // Convert pointer position to graph coordinates at the current zoom level
  const svg = svgRef.value
  const mainGroup = mainGroupRef.value
  if (!svg || !mainGroup || !dragOffset) return

  const pt = svg.createSVGPoint()
  pt.x = event.sourceEvent.clientX
  pt.y = event.sourceEvent.clientY

  const transform = mainGroup.getCTM()
  if (!transform) return

  // Get current pointer position in graph coordinates
  const graphPoint = pt.matrixTransform(transform.inverse())

  // Apply the stored offset to maintain cursor alignment
  // This prevents jumping and keeps the node exactly where the user expects it
  d.position_x = graphPoint.x + dragOffset.x
  d.position_y = graphPoint.y + dragOffset.y

  const node = d3.select(event.sourceEvent.target.parentNode)
  node.attr('transform', `translate(${d.position_x}, ${d.position_y})`)

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = requestAnimationFrame(() => {
    updateTransitionsForDrag()
    animationFrameId = null
  })
}

function dragEnded(event: any, d: any) {
  isDraggingNode = false
  dragOffset = null

  const node = d3.select(event.sourceEvent.target.parentNode as SVGGElement)
  node.classed('dragging', false)

  node.select('.status-rect')
    .style('filter', null)
    .style('cursor', 'move')

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  renderTransitions(workflowData.value?.transitions || [], workflowData.value?.statuses || [])

  updateStatus({
    id: d.id,
    payload: {
      position_x: d.position_x,
      position_y: d.position_y
    }
  })
}

function startEditingTransitionLabel(transition: any, textElement: any) {
  const text = d3.select(textElement)
  const currentLabel = transition.transition_label || ''

  const foreignObject = d3.select(textElement.parentNode)
    .append('foreignObject')
    .attr('x', parseFloat(text.attr('x')) - 100)
    .attr('y', parseFloat(text.attr('y')) - 10)
    .attr('width', 200)
    .attr('height', 30)

  const input = foreignObject.append('xhtml:input')
    .attr('type', 'text')
    .attr('value', currentLabel)
    .style('width', '100%')
    .style('padding', '4px 8px')
    .style('font-size', '11px')
    .style('background', '#1f2937')
    .style('border', '1px solid #3b82f6')
    .style('border-radius', '4px')
    .style('color', '#ffffff')
    .style('outline', 'none')
    .on('blur', function() {
      const newLabel = (this as HTMLInputElement).value.trim()
      updateTransition({
        id: transition.id,
        payload: {
          transition_label: newLabel
        }
      })
      foreignObject.remove()
    })
    .on('keydown', function(event: any) {
      if (event.key === 'Enter') {
        (this as HTMLInputElement).blur()
      } else if (event.key === 'Escape') {
        foreignObject.remove()
      }
    })

  const inputElement = input.node() as HTMLInputElement
  inputElement?.focus()
  inputElement?.select()
}

function handleStatusUpdate() {
  if (!selectedStatus.value) return

  updateStatus({
    id: selectedStatus.value.id,
    payload: {
      status_name: selectedStatus.value.status_name,
      status_color: selectedStatus.value.status_color
    }
  })
}

function handleDeleteStatus() {
  if (!selectedStatus.value) return

  if (confirm(`Are you sure you want to delete the status "${selectedStatus.value.status_name}"? This will also delete all transitions connected to it.`)) {
    deleteStatus({ id: selectedStatus.value.id })
  }
}

function handleDeleteTransition(transition: any) {
  if (confirm('Are you sure you want to delete this transition?')) {
    deleteTransition({ id: transition.id })
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

<style scoped>
.workflow-canvas {
  background-image: radial-gradient(circle, #374151 1px, transparent 1px);
  background-size: 20px 20px;
}

.connection-handle {
  transition: opacity 0.15s ease-in-out;
  will-change: opacity;
}

.transition-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
  will-change: d;
}

.transition-label {
  user-select: none;
}

:deep(.status-node) {
  transition: none;
  will-change: transform;
}

:deep(.status-node.dragging) {
  transition: none;
  cursor: grabbing !important;
}

:deep(.status-node.dragging .status-rect) {
  transition: filter 0.2s ease;
}

:deep(.status-node.connection-mode) {
  pointer-events: all;
}

:deep(.status-node.drop-target .status-rect) {
  stroke: #10b981 !important;
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.5));
}

:deep(.connection-handle circle) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: r, fill;
}

:deep(.status-rect) {
  transition: filter 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease;
  will-change: filter;
}
</style>
