<template>
  <Transition name="panel" appear>
    <div v-show="showPanel" :class="[
      'flex flex-col h-full overflow-y-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] border border-orchit-white/5 overflow-hidden transition-all duration-300 ease-in-out',
      isExpanded ? 'min-w-full max-w-full' : 'min-w-full max-w-[380px] sm:min-w-[380px]'
    ]" role="complementary" aria-label="Details panel">
      
      <!-- Header -->
      <div class="sticky top-0 z-10 border-b border-border px-4 sm:px-6 py-[9px] flex items-center justify-between bg-bg-card">
        <h5 class="text-[18px] font-semibold tracking-tight">Details</h5>
        <div class="flex items-center gap-2">
          <button class="p-2 rounded-xl hover:bg-orchit-white/5 active:scale-[.98] cursor-pointer transition"
            @click="isExpanded = !isExpanded" :aria-label="isExpanded ? 'Collapse details' : 'Expand details'">
            <i :class="['fa-solid', isExpanded ? 'fa-compress' : 'fa-expand', 'text-lg']"></i>
          </button>
          <button class="p-2 rounded-xl hover:bg-orchit-white/5 active:scale-[.98] cursor-pointer transition"
            @click="() => emit('close')" aria-label="Close details">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-40">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
      </div>

      <!-- Body -->
      <div v-else class="py-5 px-4 sm:px-6 flex flex-col gap-5 flex-grow">
        
       

        <!-- Title -->
        <div class="capitalize">
          <div class="mb-2 text-base font-semibold tracking-wide px-1">Process Title</div>
          <div v-if="editingTitle" class="relative">
             <input ref="titleInput" v-model="localTitle" 
              @blur="saveTitle" @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelEditTitle"
              class="w-full text-2xl font-semibold rounded-[6px] px-3 py-2 bg-orchit-white/5 border border-orchit-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40 transition" 
              type="text" />
          </div>
          <h2 v-else 
            class="text-[20px] leading-[28px] font-semibold tracking-tight rounded-[6px] px-2 py-2 hover:bg-bg-dropdown transition cursor-text border border-transparent hover:border-border"
            @click="editTitle">
            {{ localTitle || 'Untitled' }}
          </h2>
        </div>
         <!-- Card Type -->
        <div class="space-y-2">
          <div class="mb-2 text-base font-semibold tracking-wide px-1">Card Type</div>
          <BaseSelectField 
            :options="cardTypeOptions" 
            placeholder="Select Type" 
            :model-value="localType"
            @update:modelValue="handleTypeChange" 
            size="md"
          />
        </div>

        <!-- Workflow Preview -->
        <div v-if="processDetails?.raw_object?.flow_diagram" class="space-y-2">
            <div class="mb-2 text-base font-semibold tracking-wide px-1">Workflow Preview</div>
            <ProcessWorkflowPreview 
                :workflow-data="processDetails.raw_object.flow_diagram" 
                @open-builder="emit('open-builder')"
            />
        </div>

        <!-- Description -->
        <div>
          <h3 class="mb-2 text-base font-semibold tracking-wide px-1">Description</h3>
          <div v-if="!editingDesc" 
            class="text-[15px] leading-6 text-text-secondary whitespace-pre-wrap rounded-[6px] px-4 py-3 border border-orchit-white/10 bg-orchit-white/5 hover:border-orchit-white/20 transition cursor-text"
            @click="startEditDesc">
            <div v-if="localDesc" v-html="localDesc"></div>
            <span v-else class="opacity-60">Click to add a description…</span>
          </div>
          <div v-else ref="descEditorWrap" class="rounded-[6px] overflow-hidden border border-orchit-white/10 shadow-sm">
             <BaseTextAreaField v-model="localDesc" @focusOut="finishDescEdit" />
          </div>
        </div>

        <!-- Workflow Stats -->
        <div class="space-y-4 mt-2">
          <!-- Metadata Grid -->
          <div class="grid grid-cols-2 gap-3">
             <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Group</span>
                <span class="text-sm font-medium truncate">{{ processDetails?.group_id?.title || 'General' }}</span>
             </div>
             <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Type</span>
                <span class="text-sm font-medium truncate">{{ processDetails?.type_value || 'N/A' }}</span>
             </div>
             <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Status</span>
                <div class="flex items-center gap-2">
                    <div :class="['w-2 h-2 rounded-full', processDetails?.is_active ? 'bg-green-500' : 'bg-red-500']"></div>
                    <span class="text-sm font-medium">{{ processDetails?.is_active ? 'Active' : 'Inactive' }}</span>
                </div>
             </div>
             <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Total Transitions</span>
                <span class="text-sm font-medium">{{ totalTransitions }}</span>
             </div>
          </div>

          <!-- Status Analysis -->
          <div v-if="processDetails?.flow_metadatas?.length" class="space-y-3">
             <h3 class="text-base font-semibold tracking-wide px-1">Status Breakdown</h3>
             <div class="space-y-2">
                <div v-for="status in processDetails.flow_metadatas" :key="status._id" 
                    class="group/item flex flex-col gap-2 p-3 rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 hover:border-orchit-white/20 transition-all cursor-default"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold">{{ status.status }}</span>
                            <span v-if="status.is_start" class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase tracking-tighter">Start</span>
                            <span v-if="status.is_end" class="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold uppercase tracking-tighter">End</span>
                        </div>
                        <span class="text-[10px] text-text-secondary">Position {{ status.position }}</span>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2 mt-1">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase text-text-secondary/70">Forward</span>
                            <span class="text-xs font-semibold">{{ status.forward_moves?.length || 0 }}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase text-text-secondary/70">Backward</span>
                            <span class="text-xs font-semibold">{{ status.backward_moves?.length || 0 }}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase text-text-secondary/70">Total Moves</span>
                            <span class="text-xs font-semibold">{{ status.total_moves || 0 }}</span>
                        </div>
                    </div>

                    <!-- Jump-to statuses (tags) -->
                    <div v-if="status.forward_moves?.length" class="flex flex-wrap gap-1 mt-1">
                        <span v-for="move in status.forward_moves" :key="move" 
                            class="text-[9px] px-1.5 py-0.5 rounded bg-orchit-white/5 border border-orchit-white/10 text-text-secondary"
                        >
                            → {{ move }}
                        </span>
                    </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue' 
import {useProcessGroupsWithTransitions, useProcessTransition, useUpdateTransition, useFilteredCardTypes } from '../../../queries/useProcess2'
import { useRouteIds } from '../../../composables/useQueryParams'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import ProcessWorkflowPreview from './ProcessWorkflowPreview.vue'

const props = defineProps<{
  showPanel: boolean
  details: { _id: string; title: string; description?: string; [key: string]: any }
}>()

const emit = defineEmits(['close', 'open-builder'])

const isExpanded = ref(false)
const { workspaceId } = useRouteIds()

// --- Data Fetching ---
const processId = computed(() => props.details?._id)
const { data: processDetails, isLoading, refetch } = useProcessTransition(workspaceId, processId, {
  enabled: computed(() => !!processId.value && props.showPanel)
})

const {  refetch:refetchAllTransitions } = useProcessGroupsWithTransitions(workspaceId,{
  enabled: computed(() => !!processId.value && props.showPanel)
})

const { data: cardTypes } = useFilteredCardTypes(workspaceId)
const cardTypeOptions = computed(() => {
  const opts = (cardTypes.value || []).map((t: any) => ({ 
    _id: t.slug || t.title || t._id, 
    title: t.title 
  })); 
  return opts;
})


// --- Local State Sync ---
const localTitle = ref('')
const localDesc = ref('')
const localType = ref('')

watch(() => processDetails.value, (val) => {
  if (val) { 
    localTitle.value = val.title || ''
    localDesc.value = val.description || ''
    localType.value = val.type_value || '' 
  }
}, { immediate: true })
 

// --- Stats ---
const totalStatus = computed(() => {
  const raw = processDetails.value?.raw_object
  // raw_object might be { nodes: [], edges: [] } or just the array of nodes if format differs.
  // WorkflowCanvas usually uses vue-flow format: nodes[] and edges[] are separate or in one elements array.
  if (raw?.flow_diagram?.nodes && Array.isArray(raw.flow_diagram.nodes)) return raw.flow_diagram.nodes.length
  if (raw?.nodes && Array.isArray(raw.nodes)) return raw.nodes.length
  if (raw?.elements && Array.isArray(raw.elements)) return raw.elements.filter((e: any) => !e.source).length
  return 0
})

const totalTransitions = computed(() => {
   const raw = processDetails.value?.raw_object
   if (raw?.flow_diagram?.edges && Array.isArray(raw.flow_diagram.edges)) return raw.flow_diagram.edges.length
   if (raw?.edges && Array.isArray(raw.edges)) return raw.edges.length
   if (raw?.elements && Array.isArray(raw.elements)) return raw.elements.filter((e: any) => e.source && e.target).length
   return 0
})


// --- Mutations ---
const { mutate: updateTransition } = useUpdateTransition({
  onSuccess: () => {
     refetch();
     refetchAllTransitions();
  }
})

// --- Logic: Title ---
const editingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

function editTitle() {
  localTitle.value = processDetails.value?.title || props.details.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

function saveTitle() {
  if (localTitle.value.trim() !== processDetails.value?.title) {
    updateTransition({
      workspace_id: workspaceId.value,
      transition_id: props.details._id,
      payload: { title: localTitle.value.trim() }
    })
  }
  editingTitle.value = false
}

function cancelEditTitle() {
  localTitle.value = processDetails.value?.title || ''
  editingTitle.value = false
}

// --- Logic: Description ---
const editingDesc = ref(false)
const descEditorWrap = ref<HTMLElement | null>(null)

function startEditDesc() {
  editingDesc.value = true
}

function finishDescEdit() {
  if (localDesc.value !== processDetails.value?.description) {
      updateTransition({
      workspace_id: workspaceId.value,
      transition_id: props.details._id,
      payload: { description: localDesc.value }
    })
  }
  editingDesc.value = false
}

// Click outside listener for description editor
function onDocMouseDown(e: MouseEvent) {
  if (!editingDesc.value) return
  const target = e.target as Node
  if (descEditorWrap.value?.contains(target)) return
  finishDescEdit()
}
onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))

// --- Logic: Card Type ---
function handleTypeChange(val: any) { 
  localType.value = val
  updateTransition({
      workspace_id: workspaceId.value,
      transition_id: props.details._id,
      payload: { type_value: val } 
  })
}

</script>

<style scoped>
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(.98);
  filter: blur(2px);
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 200ms ease, transform 200ms ease, filter 200ms ease;
}
</style>
