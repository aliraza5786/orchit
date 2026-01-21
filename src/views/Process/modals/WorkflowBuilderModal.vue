<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 bottom-[60px] sm:bottom-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @keydown.esc="close">
      <div class="relative flex h-full w-full flex-col bg-bg-body" role="dialog" aria-modal="true" tabindex="0">
        <!-- Header -->
         <div class="border-b border-border px-[20px] sm:px-6 py-4 overflow-x-auto">
         <div class="flex items-center justify-between max-w-content gap-3">
          <div class="flex items-center gap-4">
            <h2 class="flex items-center gap-2 text-lg sm:text-xl font-semibold text-text-primary text-nowrap">
              <i class="fa-solid fa-diagram-project text-accent" aria-hidden="true" />
              Workflow for {{ processTitle }}
            </h2>

            <label class="flex cursor-pointer items-center gap-2 text-sm text-text-secondary text-nowrap">
              <input type="checkbox" v-model="showTransitionLabels" class="rounded" />
              <span>Show transition labels</span>
            </label>
          </div>

          <div class="flex items-center gap-3">
            <Button variant="secondary" :disabled="!canCreateCard" size="sm" @click="handleAddStatus">
              <i class="fa-solid fa-plus mr-2" aria-hidden="true" /> Add Steps
            </Button>

            <Button variant="primary" size="sm" :disabled="isSaving || !canEditCard || !canCreateCard" @click="handleUpdateWorkflow">
              {{ updateButtonLabel }}
            </Button>

            <button class="text-xl text-text-secondary hover:text-text-primary" @click="close" aria-label="Close">
              <i class="fa-solid fa-times" aria-hidden="true" />
            </button>
          </div>
        </div>
         </div>
        

        <!-- Canvas -->
        <div class="relative flex-1 overflow-hidden">
          <div v-if="isLoading" class="flex items-center justify-center h-full bg-bg-surface">
            <div class="flex flex-col items-center gap-4">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
              <p class="text-sm text-text-secondary">Loading workflow...</p>
            </div>
          </div>
          <WorkflowCanvas v-else-if="processId" ref="Canvas" :can-delete="canDeleteCard" :process-id="processId" :can-edit="canEditCard"
            :show-transition-labels="showTransitionLabels" @update:workflow="handleWorkflowUpdate"
            @add:status="handleAddStatus" @add:transition="handleAddTransition" @edit:node="handleEditNode" />
        </div>

        <!-- Footer -->
        <!-- <div class="flex items-center justify-end sm:justify-between border-t border-border bg-bg-surface  sm:px-6 py-3">
          <div class="hidden sm:flex items-center gap-4 text-sm text-text-secondary">
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-hand-pointer" aria-hidden="true" /> Click and drag to pan
            </span>
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-magnifying-glass" aria-hidden="true" /> Scroll to zoom
            </span>
          </div>

          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="handleZoomOut">
              <i class="fa-solid fa-minus" aria-hidden="true" />
              <span class="sr-only">Zoom out</span>
            </Button>
            <Button variant="ghost" size="sm" @click="handleZoomReset">
              <i class="fa-solid fa-expand" aria-hidden="true" />
              <span class="sr-only">Reset zoom</span>
            </Button>
            <Button variant="ghost" size="sm" @click="handleZoomIn">
              <i class="fa-solid fa-plus" aria-hidden="true" />
              <span class="sr-only">Zoom in</span>
            </Button>
          </div>
        </div> -->
      </div>
    </div>
  </transition>

  <!-- Modals -->
  <AddStatusModal v-model="showAddStatusModal" :process-id="processId" :editing-status="editingStatus"
    @status:added="handleStatusAdded" @edit:node="handleEditConfirm" />

  <AddTransitionModal v-model="showAddTransitionModal" :process-id="processId" :statuses="workflowStatuses"
    @transition:added="handleTransitionAdded" />
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import Button from '../../../components/ui/Button.vue'
import WorkflowCanvas from '../../../components/feature/workflow/WorkflowCanvas.vue'
import AddStatusModal from './AddStatusModal.vue'
import AddTransitionModal from './AddTransitionModal.vue'
import { useWorkflowData } from '../../../queries/useProcess'
import { useLocalWorkflowState } from '../../../composables/useLocalWorkflowState'
// import { toast } from 'vue-sonner'

import { usePermissions } from "../../../composables/usePermissions";
const { canEditCard, canCreateCard, canDeleteCard } = usePermissions();

/* Props & emits */
const props = defineProps<{
  modelValue: boolean
  process: { _id?: string; id?: string; title?: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

/* Refs */
const Canvas = ref<InstanceType<typeof WorkflowCanvas> | null>(null)
const showTransitionLabels = ref(true)
const showAddStatusModal = ref(false)
const showAddTransitionModal = ref(false)

/* Derived state */
const isOpen = computed(() => props.modelValue)
const processId = computed(() => props.process?._id ?? props.process?.id ?? '')
const processTitle = computed(() => props.process?.title ?? 'Process')

/* Data and local workflow state */
const { data: workflowData, refetch: refetchWorkflow, isLoading } = useWorkflowData(processId)
const workflowState = useLocalWorkflowState()
provide('workflowState', workflowState)

const editingStatus = ref<any>(null)

const workflowStatuses = computed(() => workflowState.localStatuses.value)

/* Load/initialize on open */
watch(isOpen, (open) => {
  if (open && processId.value) refetchWorkflow()
})

watch(
  () => workflowData.value,
  (payload) => {
    if (payload && isOpen.value) {
      workflowState.initialize(payload.statuses, payload.transitions)
    }
  },
  { immediate: true }
)

/* UI labels (fixes build issue from inline template literals) */
const isSaving = computed(() => Boolean(Canvas.value?.isSaving))
const updateButtonLabel = computed(() => {
  if (isSaving.value) return 'Updating...'
  const changes = workflowState.changeCount.value || 0
  return changes > 0 ? `Update workflow (${changes})` : 'Update workflow'
})

/* Actions */
function close() {
  if (workflowState.hasChanges.value) {
    const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
    if (!confirmed) return
  }
  emit('update:modelValue', false)
  emit('close')
}

function handleAddStatus() {
  editingStatus.value='';
  showAddStatusModal.value = true
}

function handleAddTransition() {
  showAddTransitionModal.value = true
}

function handleWorkflowUpdate() {
  refetchWorkflow()
}

// const { mutate: batchUpdate, isPending: isUpdating } = useBatchUpdateWorkflow({
//   onSuccess: () => {
//     toast.success('Workflow updated successfully')
//     workflowState.resetChanges()
//     refetchWorkflow()
//     emit('update:modelValue', false)
//     emit('close')
//   },
//   onError: (error: any) => {
//     toast.error('Failed to update workflow')
//     console.error('Workflow update error:', error)
//   }
// })

function handleUpdateWorkflow() {
  Canvas.value?.saveWorkflow()
  // const validation = workflowState.validateWorkflow()
  // if (!validation.isValid) {
  //   toast.error('Workflow validation failed: ' + validation.errors.join(', '))
  //   return
  // }

  // const changes = workflowState.getChanges()
  // if (!workflowState.hasChanges.value) {
  //   toast.info('No changes to save')
  //   return
  // }

  // batchUpdate({
  //   processId: processId.value,
  //   statuses: changes.statuses,
  //   transitions: changes.transitions
  // })
}

// function handleZoomIn() {
//   window.dispatchEvent(new CustomEvent('workflow:zoom', { detail: { action: 'in' } }))
// }
// function handleZoomOut() {
//   window.dispatchEvent(new CustomEvent('workflow:zoom', { detail: { action: 'out' } }))
// }
// function handleZoomReset() {
//   window.dispatchEvent(new CustomEvent('workflow:zoom', { detail: { action: 'reset' } }))
// }

function handleStatusAdded(e: any) {

  showAddStatusModal.value = false
  Canvas.value?.handleAddNode?.(e)
  editingStatus.value = null
}

function handleTransitionAdded() {
  showAddTransitionModal.value = false
}

function handleEditNode(nodeData: any) {
  editingStatus.value = nodeData
  showAddStatusModal.value = true
}
const handleEditConfirm = (id: string, data: any) => {
  Canvas.value?.handleConfirmEdit(id, data)

}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>