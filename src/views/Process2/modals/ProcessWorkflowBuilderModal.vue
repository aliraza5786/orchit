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
            </div>

            <div class="flex items-center gap-3">
              <Button :disabled="!canCreateCard" variant="secondary" size="sm" @click="handleAddStatus">
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
              <p class="text-sm text-text-secondary">Loading workflow data...</p>
            </div>
          </div>
          <WorkflowCanvas v-else ref="Canvas" 
            :process-id="processId"
            :can-edit="canEditCard"
            :can-delete="canDeleteCard"
            :workflow-data="transitionData?.raw_object || {}"
            :show-transition-labels="true" 
            @save="handleSave"
            @update:workflow="handleWorkflowUpdate"
            @add:status="handleAddStatus" 
            @edit:node="handleEditNode" />
        </div>
      </div>
    </div>
  </transition>
  
  <AddStatusModal v-model="showAddStatusModal" :process-id="processId" :editing-status="editingStatus"
    @status:added="handleStatusAdded" @edit:node="handleEditConfirm" />
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import Button from '../../../components/ui/Button.vue'
import WorkflowCanvas from '../components/WorkflowCanvas.vue'
import AddStatusModal from './AddStatusModal.vue'
import { useProcessTransition, useUpdateTransition } from '../../../queries/useProcess2'
import { useLocalWorkflowState } from '../../../composables/useLocalWorkflowState'
import { useRouteIds } from '../../../composables/useQueryParams'
import { usePermissions } from "../../../composables/usePermissions";
import { toast } from 'vue-sonner'
const { 
  canCreateCard,
  canEditCard,
  canDeleteCard 
} = usePermissions();

/* Props & emits */
const props = defineProps<{
  modelValue: boolean
  process: { _id?: string; id?: string; title?: string ; type_value?: string} | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

/* Refs */
const Canvas = ref<InstanceType<typeof WorkflowCanvas> | null>(null)
const showAddStatusModal = ref(false)
const editingStatus = ref<any>(null)

/* Derived state */
const isOpen = computed(() => props.modelValue)
const processId = computed(() => props.process?._id ?? props.process?.id ?? '')
const processTitle = computed(() => props.process?.title ?? 'Process Workflow')
const processTypeValue =  computed(() => props.process?.type_value ?? '')
const { workspaceId } = useRouteIds()

/* Data fetching */
const { data: transitionData, isLoading, refetch } = useProcessTransition(workspaceId, processId, {
    enabled: computed(() => isOpen.value && !!processId.value)
})

/* Workflow State */
const workflowState = useLocalWorkflowState()
provide('workflowState', workflowState)

/* Initialize Workflow on Open / Data Load */
watch(() => transitionData.value, (data) => {
    if (data && isOpen.value) {
        // Assume raw_object or similar holds the workflow structure
        // If raw_object is empty, we might initialize with defaults or empty
        // const flow = data.raw_object || { nodes: [], edges: [] };
        // WorkflowCanvas expects 'raw_transitions' structure usually, 
        // but let's see how WorkflowCanvas consumes it. 
        // Actually WorkflowCanvas fetches its own data internally via useProcessWorkflow usually.
        // BUT here we want to inject OUR fetched data.
        
        // Wait, WorkflowCanvas in the previous file snippet looked like it takes :process-id 
        // and calls useProcessWorkflow itself (lines 39) or accepts data via some mechanism.
        
        // Actually, looking at WorkflowCanvas content from step 227:
        // It has `watch(processWorkflow, ...)`
        // It does NOT seem to accept a prop to seed data directly easily, 
        // UNLESS we modify WorkflowCanvas to accept a `initialData` prop or similar.
        
        // However, WorkflowCanvas is tightly coupled to `useProcessWorkflow` which fetches by workspaceId (line 39).
        // It doesn't seem to fetch by process-id specific logic for single transition.
        
        // The user said "make new workflowprocess buider".
        // I might need to make a wrapper that passes data to a modified WorkflowCanvas 
        // OR duplicate WorkflowCanvas logic here if it's simple enough.
        
        // Given existing WorkflowCanvas is complex (vue-flow setup), it's better to Reuse.
        // But WorkflowCanvas uses `useProcessWorkflow(workspaceId.value)`.
        
        // I should probably modify WorkflowCanvas to accept `workflowData` prop 
        // and if provided, use that instead of fetching.
        
        // For now, I will assume I can pass data to it via a prop if I modify it, 
        // or I'll just rely on `provide/inject` if that's easier.
        // Checking WorkflowCanvas again...
        // It watches `processWorkflow`. 
        
        // Let's modify WorkflowCanvas to accept a `workflowData` prop.
        // But first, let's finish THIS file assuming WorkflowCanvas can accept `initialData`.
    }
})

// BUT wait, WorkflowCanvas fetches data using `useProcessStatus` and `useProcessWorkflow`. 
// Those fetch ALL statuses and transitions for the WORKSPACE.
// The user wants "make process against EACH process card". 
// This implies the workflow is isolated per card.

// If so, `WorkflowCanvas` as it is (workspace-level) is NOT suitable without modification.
// I need to modify `WorkflowCanvas` to support "Input Data" mode vs "Fetch from Workspace" mode.

/* Saving */
const queryClient = useQueryClient()
const { mutate: updateTransition, isPending: isSaving } = useUpdateTransition({
    onSuccess: () => {
        refetch()
        queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] })
        toast.success('Workflow saved successfully!')
    },
     onError: (err: any) => {
        toast.error(err?.message || 'Failed to save workflow') 
    }
    
})

const updateButtonLabel = computed(() => isSaving.value ? 'Saving...' : 'Save Workflow')

function handleUpdateWorkflow() {
    Canvas.value?.triggerSave() 
}

function handleSave(payload: any) {
    updateTransition({
        workspace_id: workspaceId.value,
        transition_id: processId.value,
        payload: {
            raw_object: {
               workspace_id: payload.workspace_id,
               flow_diagram: payload.flow_diagram
            },
            variable_type: props.process?.title?.toLocaleLowerCase().includes('general') ? 'card-status' : 'card-type',
            type_value: processTypeValue.value,
            flow_metadatas: payload.flow_metadata
             // Save the whole flow
        }
    })
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

// ... event handlers
function handleAddStatus() { showAddStatusModal.value = true; editingStatus.value = ''; }
function handleStatusAdded(e: any) { showAddStatusModal.value = false; Canvas.value?.handleAddNode?.(e); }
function handleEditNode(nodeData: any) { editingStatus.value = nodeData; showAddStatusModal.value = true; }
function handleEditConfirm(id: string, data: any) { Canvas.value?.handleConfirmEdit(id, data); }
function handleWorkflowUpdate() { refetch(); }

</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
