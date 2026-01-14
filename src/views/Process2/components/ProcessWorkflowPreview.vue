<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { VueFlow, useVueFlow, Handle, Position, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const props = defineProps<{
  workflowData?: any
}>()

const emit = defineEmits(['open-builder'])

const previewId = `workflow-preview-${Math.random().toString(36).slice(2, 9)}`
const { fitView, onNodesInitialized, updateNodeInternals } = useVueFlow({ id: previewId })

const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const isHovered = ref(false)

function normalizeMarkerType(t?: string) {
  const key = (t ?? 'arrow').toLowerCase()
  if (key === 'arrow') return MarkerType.Arrow
  if (key === 'arrowclosed') return MarkerType.ArrowClosed
  return MarkerType.Arrow
}

function mapApiNode(n: any) {
  return {
    id: n.id,
    type: n.type ?? 'default',
    position: n.position,
    data: n.data,
    style: { 
        ...n.style, 
        fontSize: '7px',
        padding: '2px 4px',
        minWidth: '40px',
        borderWidth: '1px'
    },
  }
}

function mapApiEdge(e: any) {
  const marker = e.marker_end || e.markerEnd
  return {
    id: e.id || e.flow_metadata?.transition_id,
    type: e.type ?? 'step',
    source: e.source ?? e.flow_metadata?.source_node?.id,
    target: e.target ?? e.flow_metadata?.target_node?.id,
    sourceHandle: e.source_handle || e.sourceHandle,
    targetHandle: e.target_handle || e.targetHandle,
    label: '', 
    animated: !!e.animated,
    style: { stroke: '#3b82f6', strokeWidth: 1.5 },
    markerEnd: {
        type: marker ? normalizeMarkerType(marker.type) : MarkerType.Arrow,
        color: marker?.color || '#3b82f6',
        width: 10,
        height: 10
    }
  }
}

watch(() => props.workflowData, async (fd) => {
  if (fd) {
    nodes.value = Array.isArray(fd.nodes) ? fd.nodes.map(mapApiNode) : []
    edges.value = Array.isArray(fd.edges) ? fd.edges.map(mapApiEdge) : []
    
    await nextTick()
    // Small delay to ensure rendering started
    setTimeout(() => {
        nodes.value.forEach((n: any) => updateNodeInternals(n.id))
        fitView({ padding: 0.3, maxZoom: 1 })
    }, 100)
  }
}, { immediate: true })

onNodesInitialized(() => {
    fitView({ padding: 0.3, maxZoom: 1 })
})

</script>

<template>
  <div 
    class="relative group h-[200px] w-full rounded-[8px] border border-orchit-white/10 overflow-hidden bg-bg-body/50 transition-all duration-300 hover:border-accent/30"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Vue Flow Container -->
    <div class="absolute inset-0 pointer-events-none opacity-70">
        <VueFlow
            :id="previewId"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :nodes-draggable="false"
            :nodes-connectable="false"
            :elements-selectable="false"
            :zoom-on-scroll="false"
            :zoom-on-pinch="false"
            :zoom-on-double-click="false"
            :pan-on-drag="false"
            :prevent-scrolling="true"
            fit-view-on-init
        >
            <!-- Custom node template to support handles -->
            <template #node-default="{ data }">
                <div class="relative px-1 py-0.5 rounded-sm">
                    <span class="truncate block max-w-[80px]">
                        {{ data.label }}
                    </span>
                    <!-- handles must exist for edges to attach; opacity-0 keeps them invisible -->
                    <Handle id="in-top" type="target" :position="Position.Top" class="opacity-0 !w-1 !h-1 !min-w-0 !min-h-0" />
                    <Handle id="out-right" type="source" :position="Position.Right" class="opacity-0 !w-1 !h-1 !min-w-0 !min-h-0" />
                    <Handle id="out-bottom" type="source" :position="Position.Bottom" class="opacity-0 !w-1 !h-1 !min-w-0 !min-h-0" />
                    <Handle id="in-left" type="target" :position="Position.Left" class="opacity-0 !w-1 !h-1 !min-w-0 !min-h-0" />
                </div>
            </template>
            <Background color="#1a1a1a" :gap="12" pattern-color="rgba(255,255,255,0.05)" />
        </VueFlow>
    </div>

    <!-- Overlay with button -->
    <div 
      class="absolute inset-0 z-20 flex items-center justify-center bg-bg-card/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      <button 
        @click="emit('open-builder')"
        class="px-4 py-2 bg-accent text-white rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 font-medium flex items-center gap-2 text-sm"
      >
        <i class="fa-solid fa-pen-to-square"></i>
        Open to edit
      </button>
    </div>

    <!-- Small label -->
    <div class="absolute bottom-2 left-2 text-[10px] text-text-secondary opacity-50 group-hover:opacity-0 transition-opacity uppercase tracking-wider font-semibold">
        Flow Preview
    </div>
  </div>
</template>

<style scoped>
:deep(.vue-flow__handle) {
  /* Using opacity: 0 in template instead of display: none */
  pointer-events: none !important;
}
:deep(.vue-flow__node) {
    pointer-events: none !important;
}
:deep(.vue-flow__edge) {
    pointer-events: none !important;
}
:deep(.vue-flow__attribution) {
    display: none !important;
}
</style>
