<template>
  <transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      @keydown.esc="close">
      <div class="bg-bg-body w-full h-full flex flex-col relative" role="dialog" aria-modal="true">
        <div class="border-b border-border px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-text-primary flex items-center gap-2">
              <i class="fa-solid fa-diagram-project text-accent"></i>
              Workflow for {{ process?.title || 'Process' }}
            </h2>
            <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" v-model="showTransitionLabels" class="rounded">
              <span>Show transition labels</span>
            </label>
          </div>
          <div class="flex items-center gap-3">
            <Button @click="handleAddStatus" variant="secondary" size="sm">
              <i class="fa-solid fa-plus mr-2"></i>Add Status
            </Button>
            <Button @click="handleUpdateWorkflow" variant="primary" size="sm"
              >
              {{ Canvas?.isSaving ? 'Updating...' : `Update workflow${workflowState.changeCount.value > 0 ? `
              (${workflowState.changeCount.value})` : ''}` }}
            </Button>
            <button class="text-text-secondary hover:text-text-primary text-xl" @click="close">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden relative">
          <WorkflowCanvas ref="Canvas" v-if="process" :process-id="process._id || process.id"
            :show-transition-labels="showTransitionLabels" @update:workflow="handleWorkflowUpdate"
            @add:status="handleAddStatus" @add:transition="handleAddTransition" />
        </div>

        <div class="border-t border-border px-6 py-3 flex items-center justify-between bg-bg-surface">
          <div class="flex items-center gap-4 text-sm text-text-secondary">
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-hand-pointer"></i>
              Click and drag to pan
            </span>
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-magnifying-glass"></i>
              Scroll to zoom
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button @click="handleZoomOut" variant="ghost" size="sm">
              <i class="fa-solid fa-minus"></i>
            </Button>
            <Button @click="handleZoomReset" variant="ghost" size="sm">
              <i class="fa-solid fa-expand"></i>
            </Button>
            <Button @click="handleZoomIn" variant="ghost" size="sm">
              <i class="fa-solid fa-plus"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <AddStatusModal v-model="showAddStatusModal" :process-id="process?._id || process?.id"
    @status:added="handleStatusAdded" />

  <AddTransitionModal v-model="showAddTransitionModal" :process-id="process?._id || process?.id"
    :statuses="workflowStatuses" @transition:added="handleTransitionAdded" />
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import Button from '../../../components/ui/Button.vue'
import WorkflowCanvas from '../../../components/feature/workflow/WorkflowCanvas.vue'
import AddStatusModal from './AddStatusModal.vue'
import AddTransitionModal from './AddTransitionModal.vue'
import { useWorkflowData, useBatchUpdateWorkflow } from '../../../queries/useProcess'
import { useLocalWorkflowState } from '../../../composables/useLocalWorkflowState'
import { toast } from 'vue-sonner'

const props = defineProps<{
  modelValue: boolean
  process: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()
const Canvas = ref(null);
const showTransitionLabels = ref(true)
const showAddStatusModal = ref(false)
const showAddTransitionModal = ref(false)

const processId = computed(() => props.process?._id || props.process?.id)
const { data: workflowData, refetch: refetchWorkflow } = useWorkflowData(processId)

const workflowStatuses = computed(() => workflowState.localStatuses.value)

const workflowState = useLocalWorkflowState()
provide('workflowState', workflowState)

// const { mutate: batchUpdate, isPending: isBatchUpdating } = useBatchUpdateWorkflow({
//   onSuccess: () => {
//     toast.success('Workflow updated successfully')
//     workflowState.resetChanges()
//     refetchWorkflow()
//   },
//   onError: (error: any) => {
//     toast.error(`Failed to update workflow: ${error.message || 'Unknown error'}`)
//   }
// })

watch(() => props.modelValue, (newVal) => {
  if (newVal && processId.value) {
    refetchWorkflow()
  }
})

watch(() => workflowData.value, (newData) => {
  if (newData && props.modelValue) {
    workflowState.initialize(newData.statuses, newData.transitions)
  }
}, { immediate: true })

function close() {
  if (workflowState.hasChanges.value) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to close?')
    if (!confirmed) return
  }
  emit('update:modelValue', false)
  emit('close')
}

function handleAddStatus() {
  
  showAddStatusModal.value = true
}

function handleAddTransition() {
  showAddTransitionModal.value = true
}

function handleWorkflowUpdate() {
  refetchWorkflow()
}

function handleUpdateWorkflow() {
  console.log('>>> i am upading ');
  
  // if (!workflowState.hasChanges.value) {
    // toast.info('No changes to save')
    Canvas.value.saveWorkflow();
    // return
  

  // const validation = workflowState.validateWorkflow()
  // if (!validation.isValid) {
  //   toast.error(`Cannot save workflow: ${validation.errors[0]}`)
  //   return
  // }

  // const changes = workflowState.getChanges()

  // batchUpdate({
  //   processId: processId.value,
  //   statuses: changes.statuses,
  //   transitions: changes.transitions
  // })
}

function handleZoomIn() {
  window.dispatchEvent(new CustomEvent('workflow:zoom', { detail: { action: 'in' } }))
}

function handleZoomOut() {
  window.dispatchEvent(new CustomEvent('workflow:zoom', { detail: { action: 'out' } }))
}

function handleZoomReset() {
  window.dispatchEvent(new CustomEvent('workflow:zoom', { detail: { action: 'reset' } }))
}

function handleStatusAdded(e:any) {
  showAddStatusModal.value = false
  Canvas.value.handleAddNode(e)
}

function handleTransitionAdded() {
  showAddTransitionModal.value = false
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
