import type { Node, Edge } from '@vue-flow/core'
import { MarkerType } from '@vue-flow/core'

export interface WorkflowStatus {
  id: string
  process_id: string
  status_name: string
  category: string
  status_color: string
  position_x: number
  position_y: number
  order: number
  is_initial?: boolean
  is_final?: boolean
}

export interface WorkflowTransition {
  id: string
  process_id: string
  from_status_id: string
  to_status_id: string
  transition_label: string
  rules: any[]
}

export interface WorkflowData {
  statuses: WorkflowStatus[]
  transitions: WorkflowTransition[]
}

export function transformStatusToNode(status: WorkflowStatus): Node {
  return {
    id: status.id,
    type: 'workflowStatus',
    position: {
      x: status.position_x || 0,
      y: status.position_y || 0
    },
    data: {
      label: status.status_name,
      color: status.status_color,
      category: status.category,
      isInitial: status.is_initial,
      isFinal: status.is_final,
      fullData: status
    }
  }
}

export function transformTransitionToEdge(transition: WorkflowTransition): Edge {
  return {
    id: transition.id,
    source: transition.from_status_id,
    target: transition.to_status_id,
    type: 'workflowTransition',
    label: transition.transition_label,
    data: {
      fullData: transition
    },
    markerEnd: {
      type: MarkerType.ArrowClosed
    }
  }
}

export function transformWorkflowDataToVueFlow(workflowData: WorkflowData): {
  nodes: Node[]
  edges: Edge[]
} {
  const nodes = workflowData.statuses.map(transformStatusToNode)
  const edges = workflowData.transitions.map(transformTransitionToEdge)

  return { nodes, edges }
}

export function transformNodeToStatus(node: Node): Partial<WorkflowStatus> {
  return {
    position_x: node.position.x,
    position_y: node.position.y,
    status_name: node.data?.label,
    status_color: node.data?.color,
    category: node.data?.category
  }
}

export function transformEdgeToTransition(edge: Edge): Partial<WorkflowTransition> {
  return {
    from_status_id: edge.source,
    to_status_id: edge.target,
    transition_label: edge.label as string || ''
  }
}
