import { ref, computed } from 'vue'
import type { WorkflowStatus, WorkflowTransition } from '../utilities/workflowTransform'

interface ChangeTracker {
  statuses: {
    added: WorkflowStatus[]
    updated: WorkflowStatus[]
    deleted: string[]
  }
  transitions: {
    added: WorkflowTransition[]
    updated: WorkflowTransition[]
    deleted: string[]
  }
}

export function useLocalWorkflowState() {
  const localStatuses = ref<WorkflowStatus[]>([])
  const localTransitions = ref<WorkflowTransition[]>([])
  const originalStatuses = ref<WorkflowStatus[]>([])
  const originalTransitions = ref<WorkflowTransition[]>([])
  const isInitialized = ref(false)

  const changes = ref<ChangeTracker>({
    statuses: {
      added: [],
      updated: [],
      deleted: []
    },
    transitions: {
      added: [],
      updated: [],
      deleted: []
    }
  })

  const hasChanges = computed(() => {
    return (
      changes.value.statuses.added.length > 0 ||
      changes.value.statuses.updated.length > 0 ||
      changes.value.statuses.deleted.length > 0 ||
      changes.value.transitions.added.length > 0 ||
      changes.value.transitions.updated.length > 0 ||
      changes.value.transitions.deleted.length > 0
    )
  })

  const changeCount = computed(() => {
    return (
      changes.value.statuses.added.length +
      changes.value.statuses.updated.length +
      changes.value.statuses.deleted.length +
      changes.value.transitions.added.length +
      changes.value.transitions.updated.length +
      changes.value.transitions.deleted.length
    )
  })

  function initialize(statuses: WorkflowStatus[], transitions: WorkflowTransition[]) {
    localStatuses.value = JSON.parse(JSON.stringify(statuses))
    localTransitions.value = JSON.parse(JSON.stringify(transitions))
    originalStatuses.value = JSON.parse(JSON.stringify(statuses))
    originalTransitions.value = JSON.parse(JSON.stringify(transitions))
    isInitialized.value = true
    resetChanges()
  }

  function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  function addStatus(status: Omit<WorkflowStatus, 'id'>): WorkflowStatus {
    const newStatus: WorkflowStatus = {
      ...status,
      id: generateId('status')
    }

    localStatuses.value.push(newStatus)
    changes.value.statuses.added.push(newStatus)

    return newStatus
  }

  function updateStatus(id: string, updates: Partial<WorkflowStatus>) {
    const index = localStatuses.value.findIndex(s => s.id === id)
    if (index === -1) return

    localStatuses.value[index] = {
      ...localStatuses.value[index],
      ...updates
    }

    const isNew = changes.value.statuses.added.find(s => s.id === id)
    if (isNew) {
      const addedIndex = changes.value.statuses.added.findIndex(s => s.id === id)
      changes.value.statuses.added[addedIndex] = localStatuses.value[index]
    } else {
      const updatedIndex = changes.value.statuses.updated.findIndex(s => s.id === id)
      if (updatedIndex === -1) {
        changes.value.statuses.updated.push(localStatuses.value[index])
      } else {
        changes.value.statuses.updated[updatedIndex] = localStatuses.value[index]
      }
    }
  }

  function deleteStatus(id: string) {
    const index = localStatuses.value.findIndex(s => s.id === id)
    if (index === -1) return

    localStatuses.value.splice(index, 1)

    const addedIndex = changes.value.statuses.added.findIndex(s => s.id === id)
    if (addedIndex !== -1) {
      changes.value.statuses.added.splice(addedIndex, 1)
    } else {
      if (!changes.value.statuses.deleted.includes(id)) {
        changes.value.statuses.deleted.push(id)
      }
    }

    const updatedIndex = changes.value.statuses.updated.findIndex(s => s.id === id)
    if (updatedIndex !== -1) {
      changes.value.statuses.updated.splice(updatedIndex, 1)
    }

    const relatedTransitions = localTransitions.value.filter(
      t => t.from_status_id === id || t.to_status_id === id
    )
    relatedTransitions.forEach(t => deleteTransition(t.id))
  }

  function addTransition(transition: Omit<WorkflowTransition, 'id'>): WorkflowTransition {
    const newTransition: WorkflowTransition = {
      ...transition,
      id: generateId('transition')
    }

    localTransitions.value.push(newTransition)
    changes.value.transitions.added.push(newTransition)

    return newTransition
  }

  function updateTransition(id: string, updates: Partial<WorkflowTransition>) {
    const index = localTransitions.value.findIndex(t => t.id === id)
    if (index === -1) return

    localTransitions.value[index] = {
      ...localTransitions.value[index],
      ...updates
    }

    const isNew = changes.value.transitions.added.find(t => t.id === id)
    if (isNew) {
      const addedIndex = changes.value.transitions.added.findIndex(t => t.id === id)
      changes.value.transitions.added[addedIndex] = localTransitions.value[index]
    } else {
      const updatedIndex = changes.value.transitions.updated.findIndex(t => t.id === id)
      if (updatedIndex === -1) {
        changes.value.transitions.updated.push(localTransitions.value[index])
      } else {
        changes.value.transitions.updated[updatedIndex] = localTransitions.value[index]
      }
    }
  }

  function deleteTransition(id: string) {
    const index = localTransitions.value.findIndex(t => t.id === id)
    if (index === -1) return

    localTransitions.value.splice(index, 1)

    const addedIndex = changes.value.transitions.added.findIndex(t => t.id === id)
    if (addedIndex !== -1) {
      changes.value.transitions.added.splice(addedIndex, 1)
    } else {
      if (!changes.value.transitions.deleted.includes(id)) {
        changes.value.transitions.deleted.push(id)
      }
    }

    const updatedIndex = changes.value.transitions.updated.findIndex(t => t.id === id)
    if (updatedIndex !== -1) {
      changes.value.transitions.updated.splice(updatedIndex, 1)
    }
  }

  function getTransition(id: string): WorkflowTransition | undefined {
    return localTransitions.value.find(t => t.id === id)
  }

  function getStatus(id: string): WorkflowStatus | undefined {
    return localStatuses.value.find(s => s.id === id)
  }

  function hasTransition(fromId: string, toId: string): boolean {
    return localTransitions.value.some(
      t => t.from_status_id === fromId && t.to_status_id === toId
    )
  }

  function resetChanges() {
    changes.value = {
      statuses: {
        added: [],
        updated: [],
        deleted: []
      },
      transitions: {
        added: [],
        updated: [],
        deleted: []
      }
    }
  }

  function reset() {
    localStatuses.value = JSON.parse(JSON.stringify(originalStatuses.value))
    localTransitions.value = JSON.parse(JSON.stringify(originalTransitions.value))
    resetChanges()
  }

  function getChanges(): ChangeTracker {
    return JSON.parse(JSON.stringify(changes.value))
  }

  function validateWorkflow(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    localTransitions.value.forEach(transition => {
      const fromExists = localStatuses.value.find(s => s.id === transition.from_status_id)
      const toExists = localStatuses.value.find(s => s.id === transition.to_status_id)

      if (!fromExists) {
        errors.push(`Transition ${transition.id} references non-existent source status`)
      }
      if (!toExists) {
        errors.push(`Transition ${transition.id} references non-existent target status`)
      }
    })

    const duplicates = new Set<string>()
    localTransitions.value.forEach(t => {
      const key = `${t.from_status_id}-${t.to_status_id}`
      if (duplicates.has(key)) {
        errors.push(`Duplicate transition from ${t.from_status_id} to ${t.to_status_id}`)
      }
      duplicates.add(key)
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  return {
    localStatuses,
    localTransitions,
    hasChanges,
    changeCount,
    isInitialized,
    initialize,
    addStatus,
    updateStatus,
    deleteStatus,
    addTransition,
    updateTransition,
    deleteTransition,
    getTransition,
    getStatus,
    hasTransition,
    reset,
    resetChanges,
    getChanges,
    validateWorkflow
  }
}
