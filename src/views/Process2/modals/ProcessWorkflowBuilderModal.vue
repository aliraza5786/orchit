<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 bottom-[60px] sm:bottom-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @keydown.esc="close">
      <div class="relative flex h-full w-full flex-col bg-bg-body" role="dialog" aria-modal="true" tabindex="0">
        <!-- Header -->
        <div class="border-b border-border px-[20px] sm:px-6 py-4 relative z-10">
          <div class="flex items-center justify-between max-w-content gap-3">
            <!-- Left: Title + Version Dropdown -->
            <div class="flex items-center gap-3">
              <h2 class="flex items-center gap-2 text-lg sm:text-xl font-semibold text-text-primary text-nowrap">
                <i class="fa-solid fa-diagram-project text-primary-color" aria-hidden="true" />
                Workflow for {{ processTitle }}
              </h2>

              <!-- Version History Dropdown (now next to title) -->
              <div class="relative" ref="versionDropdownRef">
                <Button :inSpace="true" variant="secondary" size="sm" @click="toggleVersionDropdown" :loading="isVersionsLoading">
                  <i class="fa-solid fa-clock-rotate-left mr-2" aria-hidden="true" />
                  {{ currentVersionLabel }}
                </Button>

                <div v-if="showVersionDropdown" class="absolute left-0 mt-2 w-64 bg-bg-dropdown border border-border shadow-2xl rounded-md z-[9999] py-1 flex flex-col">
                  <div class="px-3 py-1.5 border-b border-border/40 text-left">
                    <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Version History</span>
                  </div>

                  <div class="max-h-[240px] overflow-y-auto py-1 scrollbar-custom text-left">
                    <div v-if="!versionsList?.length" class="px-3 py-2 text-xs text-text-secondary text-center">
                      No past versions found
                    </div>
                    <div
                      v-else
                      v-for="v in versionsList"
                      :key="v._id"
                      class="px-3 py-2 flex flex-col gap-1 cursor-pointer hover:bg-bg-body text-text-primary border-b border-border/20 last:border-0"
                      @click="handleRestore(v)"
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          {{ v.version_label || `v${v.version}` }}
                          <span v-if="v.is_current_version" class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                            Active
                          </span>
                        </span>

                        <span v-if="!v.is_current_version" class="text-[10px] text-primary-color font-medium hover:underline">
                          Restore
                        </span>
                      </div>
                      <p v-if="v.version_notes" class="text-[10px] text-text-secondary line-clamp-1 italic">
                        "{{ v.version_notes }}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-3">
              <Button :inSpace="true" :disabled="!canCreateCard" variant="secondary" size="sm" @click="handleAddStatus">
                <i class="fa-solid fa-plus mr-2" aria-hidden="true" /> Add Steps
              </Button>

              <Button 
              :inSpace="true" 
              variant="primary" 
              size="sm" 
              :disabled="isSaving || !canEditCard || !canCreateCard || !hasChanges"
              @click="openSaveModal"
            >
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
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-color border-t-transparent"></div>
              <p class="text-sm text-text-secondary">Loading workflow data...</p>
            </div>
          </div>
          <WorkflowCanvas v-else ref="Canvas"
            :process-id="processId"
            :can-edit="canEditCard"
            :can-delete="canDeleteCard"
            :workflow-data="transitionData?.raw_object || {}"
            :show-transition-labels="true"
            :isSaving="isSaving"
            @save="handleSave"
            @update:workflow="handleWorkflowUpdate"
            @add:status="handleAddStatus"
            @edit:node="handleEditNode" />
        </div>
      </div>
    </div>
  </transition>

  <!-- Save Workflow Modal -->
  <transition name="fade">
    <div v-if="showSaveModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="closeSaveModal">
      <div class="bg-bg-body border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-text-primary flex items-center gap-2">
            <i class="fa-solid fa-floppy-disk text-primary-color" aria-hidden="true" />
            Save Workflow
          </h3>
          <button class="text-text-secondary hover:text-text-primary transition-colors" @click="closeSaveModal" aria-label="Close">
            <i class="fa-solid fa-times" aria-hidden="true" />
          </button>
        </div>
       <!-- Save Status -->
<div class="flex flex-col gap-1.5">
  <label class="text-xs font-medium text-text-secondary uppercase tracking-wide">Save as</label>

  <!-- Readonly state for General Process -->
  <template v-if="isGeneralProcess">
    <div class="flex items-center gap-2 h-9 bg-bg-input border border-border rounded-md px-3 opacity-60 cursor-not-allowed">
      <i class="fa-solid fa-lock text-xs text-text-secondary" aria-hidden="true" />
      <span class="text-sm text-text-primary">Active</span>
    </div>
    <div class="flex items-start gap-2 p-2.5 rounded-lg bg-primary-color/5 border border-primary-color/15">
      <i class="fa-solid fa-circle-info text-primary-color text-[11px] mt-0.5 shrink-0" aria-hidden="true" />
      <p class="text-[11px] text-text-secondary leading-snug">
        <span class="font-medium text-text-primary">General Processes</span> are always saved as
        <span class="font-medium text-text-primary">Active</span>. Draft mode is not available for this process type.
      </p>
    </div>
  </template>

  <!-- Normal dropdown -->
  <template v-else>
    <div class="relative">
      <select
        v-model="saveStatus"
        class="w-full h-9 bg-bg-input border border-border rounded-md px-3 pr-8 text-sm text-text-primary focus:ring-1 focus:ring-primary-color outline-none appearance-none cursor-pointer transition-all"
      >
        <option value="active">Active</option>
        <option value="draft">Draft</option>
      </select>
      <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary pointer-events-none" aria-hidden="true" />
    </div>
    <p class="text-[11px] text-text-secondary">
      <template v-if="saveStatus === 'active'">This version will become the live workflow immediately.</template>
      <template v-else>This version will be saved but not applied until activated.</template>
    </p>
  </template>
</div>

        <!-- Comments -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-text-secondary uppercase tracking-wide">Comments</label>
          <textarea
            v-model="versionNotes"
            placeholder="What changed in this version?"
            rows="3"
            class="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-primary-color outline-none resize-none transition-all placeholder:text-text-secondary/40"
          />
        </div>

        <!-- Modal Actions -->
        <div class="flex items-center justify-end gap-2 pt-1">
          <Button :inSpace="true" variant="secondary" size="sm" @click="closeSaveModal">
            Cancel
          </Button>
          <Button :inSpace="true" variant="primary" size="sm" :disabled="isSaving" :loading="isSaving" @click="confirmSave">
            {{ isSaving ? 'Saving...' : 'Confirm Save' }}
          </Button>
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
import {
  useProcessTransition,
  useUpdateTransition,
  useTransitionVersions,
  useRestoreTransitionVersion
} from '../../../queries/useProcess2'
import { useLocalWorkflowState } from '../../../composables/useLocalWorkflowState'
import { useRouteIds } from '../../../composables/useQueryParams'
import { usePermissions } from "../../../composables/usePermissions";
import { toast } from 'vue-sonner'
import { onClickOutside } from '@vueuse/core'

const {
  canCreateCard,
  canEditCard,
  canDeleteCard
} = usePermissions();

/* Props & emits */
const props = defineProps<{
  modelValue: boolean
  process: { _id?: string; id?: string; title?: string; type_value?: string } | null
}>()
console.log("props values for process", props.process);

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
const processTypeValue = computed(() => props.process?.type_value ?? '')
const isGeneralProcess = computed(() => 
  transitionData.value?.title?.toLocaleLowerCase() === 'general process'
)
const { workspaceId } = useRouteIds()

/* Versioning State & Queries */
const showVersionDropdown = ref(false)
const versionDropdownRef = ref<HTMLElement | null>(null)

const { data: versionsData, isLoading: isVersionsLoading, refetch: refetchVersions } = useTransitionVersions(
  workspaceId,
  processId,
  { enabled: computed(() => isOpen.value && !!processId.value) }
)

const versionsList = computed(() => {
  const list = versionsData.value?.data || versionsData.value || []
  return [...list].sort((a: any, b: any) => (b.version || 0) - (a.version || 0))
})

const currentVersionLabel = computed(() => {
  const active = versionsList.value.find((v: any) => v.is_current_version)
  return active ? active.version_label || `v${active.version}` : 'v1'
})

function toggleVersionDropdown() {
  showVersionDropdown.value = !showVersionDropdown.value
  if (showVersionDropdown.value) {
    refetchVersions()
  }
}

onClickOutside(versionDropdownRef, () => {
  showVersionDropdown.value = false
})

const { mutate: restoreVersion, isPending: isRestoring } = useRestoreTransitionVersion({
  onSuccess: () => {
    refetch()
    refetchVersions()
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] })
    queryClient.invalidateQueries({ queryKey: ['sheets'] })
    showVersionDropdown.value = false
    toast.success('Version restored successfully!')
  },
  onError: (err: any) => {
    toast.error(err?.message || 'Failed to restore version')
  }
})

function handleRestore(v: any) {
  if (v.is_current_version || isRestoring.value) return
  restoreVersion({
    workspace_id: workspaceId.value,
    transition_id: processId.value,
    version_number: v.version
  })
}

/* Data fetching */
const { data: transitionData, isLoading, refetch } = useProcessTransition(workspaceId, processId, {
  enabled: computed(() => isOpen.value && !!processId.value)
})

/* Workflow State */
const workflowState = useLocalWorkflowState()
provide('workflowState', workflowState)
const hasChanges = ref(false)

function resetChangeTracking() {
  hasChanges.value = false
}
const hasInitialized = ref(false)

watch(() => transitionData.value, (data) => {
  if (data && isOpen.value && !hasInitialized.value) {
    hasInitialized.value = true
    resetChangeTracking()
  }
})

watch(isOpen, (val) => {
  if (!val) {
    hasInitialized.value = false
    resetChangeTracking()
  }
})
/* Save Modal State */
const showSaveModal = ref(false)
const saveStatus = ref<'active' | 'draft'>('active')
const versionNotes = ref('')

function openSaveModal() {
  saveStatus.value = 'active'
  versionNotes.value = ''
  showSaveModal.value = true
}

function closeSaveModal() {
  showSaveModal.value = false
}

function confirmSave() {
  Canvas.value?.triggerSave()
}

/* Saving */
const queryClient = useQueryClient()
const { mutate: updateTransition, isPending: isSaving } = useUpdateTransition({
  onSuccess: async () => {
    refetch()
    refetchVersions()
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] })
    queryClient.invalidateQueries({ queryKey: ['sheets'] })
    closeSaveModal()
    resetChangeTracking()
    toast.success('Workflow saved successfully!')
  },
  onError: (err: any) => {
    toast.error(err?.message || 'Failed to save workflow')
  }
})

const updateButtonLabel = computed(() => isSaving.value ? 'Saving...' : 'Save Workflow')

// function handleUpdateWorkflow() {
//   Canvas.value?.triggerSave()
// }

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
      flow_metadatas: payload.flow_metadata,
      version_notes: versionNotes.value.trim() || undefined,
      status: saveStatus.value
    }
  })
  versionNotes.value = ''
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

// Event handlers
// Event handlers
function handleAddStatus() { showAddStatusModal.value = true; editingStatus.value = ''; }

function handleStatusAdded(e: any) { 
  showAddStatusModal.value = false
  Canvas.value?.handleAddNode?.(e)
  hasChanges.value = true  // ← add this
}

function handleEditNode(nodeData: any) { editingStatus.value = nodeData; showAddStatusModal.value = true; }

function handleEditConfirm(id: string, data: any) { 
  Canvas.value?.handleConfirmEdit(id, data)
  hasChanges.value = true  // ← add this
}

function handleWorkflowUpdate() { 
  hasChanges.value = true  // no refetch here
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>