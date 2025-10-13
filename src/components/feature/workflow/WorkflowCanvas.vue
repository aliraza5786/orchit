<template>
  <div ref="containerRef" class="workflow-canvas w-full h-full bg-bg-body relative overflow-hidden">
    <svg ref="svgRef" class="w-full h-full">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
        </marker>
      </defs>
      <g ref="mainGroupRef">
        <g ref="transitionsGroupRef"></g>
        <g ref="statusesGroupRef"></g>
      </g>
    </svg>

    <div v-if="selectedStatus" class="absolute top-4 right-4 bg-bg-card border border-border rounded-lg p-4 w-80 shadow-lg">
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
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useWorkflowData, useUpdateStatus, useDeleteStatus } from '../../../queries/useProcess'

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

const { data: workflowData, isLoading, refetch } = useWorkflowData(props.processId)
const selectedStatus = ref<any>(null)

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

let zoom: any = null

onMounted(() => {
  initializeCanvas()
  setupZoomHandlers()
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
    .on('zoom', (event) => {
      mainGroup.attr('transform', event.transform)
    })

  svg.call(zoom as any)
}

function setupZoomHandlers() {
  window.addEventListener('workflow:zoom', (event: Event) => {
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
  })
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
    .style('cursor', 'pointer')
    .call(d3.drag<SVGGElement, any>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded) as any
    )

  nodeEnter.append('rect')
    .attr('width', 140)
    .attr('height', 50)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', (d: any) => d.status_color || '#3b82f6')
    .attr('stroke', '#1f2937')
    .attr('stroke-width', 2)

  nodeEnter.append('text')
    .attr('x', 70)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('fill', '#ffffff')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .text((d: any) => d.status_name)

  nodeEnter.on('click', (event: any, d: any) => {
    event.stopPropagation()
    selectedStatus.value = { ...d }
  })

  const nodeUpdate = nodeEnter.merge(statusNodes)

  nodeUpdate.select('rect')
    .attr('fill', (d: any) => d.status_color || '#3b82f6')

  nodeUpdate.select('text')
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

  groupEnter.append('path')
    .attr('class', 'transition-path')
    .attr('fill', 'none')
    .attr('stroke', '#6b7280')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)')

  if (props.showTransitionLabels) {
    groupEnter.append('text')
      .attr('class', 'transition-label')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
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

      const midX = (x1 + x2) / 2
      const curveOffset = 50

      return `M ${x1},${y1} Q ${midX},${y1 - curveOffset} ${x2},${y2}`
    })

  if (props.showTransitionLabels) {
    groupUpdate.select('.transition-label')
      .attr('x', (d: any) => {
        const fromStatus = statuses.find((s: any) => s.id === d.from_status_id)
        const toStatus = statuses.find((s: any) => s.id === d.to_status_id)
        if (!fromStatus || !toStatus) return 0
        return ((fromStatus.position_x || 0) + 140 + (toStatus.position_x || 0)) / 2
      })
      .attr('y', (d: any) => {
        const fromStatus = statuses.find((s: any) => s.id === d.from_status_id)
        const toStatus = statuses.find((s: any) => s.id === d.to_status_id)
        if (!fromStatus || !toStatus) return 0
        return ((fromStatus.position_y || 0) + (toStatus.position_y || 0)) / 2 - 20
      })
      .text((d: any) => d.transition_label || '')
  }
}

function dragStarted(event: any) {
  if (event.sourceEvent?.target?.parentNode) {
    d3.select(event.sourceEvent.target.parentNode).raise()
  }
}

function dragged(event: any, d: any) {
  const node = d3.select(event.sourceEvent.target.parentNode)
  d.position_x = event.x
  d.position_y = event.y
  node.attr('transform', `translate(${event.x}, ${event.y})`)
  renderWorkflow()
}

function dragEnded(_event: any, d: any) {
  updateStatus({
    id: d.id,
    payload: {
      position_x: d.position_x,
      position_y: d.position_y
    }
  })
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

  if (confirm(`Are you sure you want to delete the status "${selectedStatus.value.status_name}"?`)) {
    deleteStatus({ id: selectedStatus.value.id })
  }
}
</script>

<style scoped>
.workflow-canvas {
  background-image: radial-gradient(circle, #374151 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>
