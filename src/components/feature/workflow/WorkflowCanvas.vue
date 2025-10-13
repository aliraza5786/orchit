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

function initializeCanvas() {
  if (!svgRef.value || !mainGroupRef.value) return

  const svg = d3.select(svgRef.value)
  const mainGroup = d3.select(mainGroupRef.value)

  zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .filter((event: any) => {
      if (isDraggingNode) return false
      if (connectionState.value?.active) return false
      return !event.button
    })
    .on('zoom', (event) => {
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

    const transformed = pt.matrixTransform(transform.inverse())

    connectionState.value.mouseX = transformed.x
    connectionState.value.mouseY = transformed.y

    renderTempLine()
  }
}

function handleSvgMouseUp() {
  if (connectionState.value?.active) {
    connectionState.value = null
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

    handleGroup.on('mouseenter', function() {
      d3.select(this).select('circle')
        .attr('r', 8)
        .attr('fill', '#2563eb')
        .attr('filter', 'url(#glow)')
    })

    handleGroup.on('mouseleave', function() {
      d3.select(this).select('circle')
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

    tempGroup.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', mouseX)
      .attr('y2', mouseY)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6)
  }
}

function startConnection(sourceStatus: any, handleId: string, event: any) {
  event.stopPropagation()

  connectionState.value = {
    active: true,
    sourceStatus,
    sourceHandle: handleId,
    mouseX: event.x,
    mouseY: event.y
  }
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
  renderTempLine()
}

function dragStarted(event: any) {
  isDraggingNode = true
  if (event.sourceEvent?.target?.parentNode) {
    d3.select(event.sourceEvent.target.parentNode as SVGGElement).raise()
  }
}

function dragged(event: any, d: any) {
  d.position_x = event.x
  d.position_y = event.y

  const node = d3.select(event.sourceEvent.target.parentNode)
  node.attr('transform', `translate(${event.x}, ${event.y})`)

  renderTransitions(workflowData.value?.transitions || [], workflowData.value?.statuses || [])
}

function dragEnded(_event: any, d: any) {
  isDraggingNode = false

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
  transition: opacity 0.2s ease;
}

.transition-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.transition-label {
  user-select: none;
}
</style>
