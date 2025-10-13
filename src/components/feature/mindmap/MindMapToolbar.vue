<template>
  <div class="mindmap-toolbar">
    <div class="toolbar-section">
      <button @click="$emit('add-node')" class="toolbar-btn" title="Add Node (Double-click canvas)">
        <i class="fa-solid fa-plus"></i>
      </button>

      <div class="toolbar-separator"></div>

      <button
        v-for="shape in shapes"
        :key="shape.value"
        @click="$emit('change-shape', shape.value)"
        :class="['toolbar-btn', { active: currentShape === shape.value }]"
        :title="`${shape.label} Shape`"
      >
        <i :class="shape.icon"></i>
      </button>
    </div>

    <div class="toolbar-section">
      <button @click="$emit('zoom-in')" class="toolbar-btn" title="Zoom In">
        <i class="fa-solid fa-magnifying-glass-plus"></i>
      </button>
      <button @click="$emit('zoom-out')" class="toolbar-btn" title="Zoom Out">
        <i class="fa-solid fa-magnifying-glass-minus"></i>
      </button>
      <button @click="$emit('fit-view')" class="toolbar-btn" title="Fit to Screen">
        <i class="fa-solid fa-expand"></i>
      </button>
      <button @click="$emit('reset-zoom')" class="toolbar-btn" title="Reset Zoom">
        <i class="fa-solid fa-arrows-to-dot"></i>
      </button>
    </div>

    <div class="toolbar-section">
      <button
        v-for="layout in layouts"
        :key="layout.value"
        @click="$emit('apply-layout', layout.value)"
        class="toolbar-btn"
        :title="`${layout.label} Layout`"
      >
        <i :class="layout.icon"></i>
      </button>
    </div>

    <div class="toolbar-section">
      <button @click="$emit('undo')" :disabled="!canUndo" class="toolbar-btn" title="Undo (Ctrl+Z)">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
      <button @click="$emit('redo')" :disabled="!canRedo" class="toolbar-btn" title="Redo (Ctrl+Y)">
        <i class="fa-solid fa-rotate-right"></i>
      </button>
    </div>

    <div class="toolbar-section">
      <button @click="$emit('export')" class="toolbar-btn" title="Export Mind Map">
        <i class="fa-solid fa-download"></i>
      </button>
      <button @click="$emit('import')" class="toolbar-btn" title="Import Mind Map">
        <i class="fa-solid fa-upload"></i>
      </button>
      <button @click="$emit('clear')" class="toolbar-btn" title="Clear Canvas">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>

    <div class="toolbar-section">
      <label class="toolbar-toggle">
        <input type="checkbox" :checked="snapToGrid" @change="handleSnapChange">
        <span>Snap to Grid</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentShape: string
  canUndo: boolean
  canRedo: boolean
  snapToGrid: boolean
}>()

const emit = defineEmits<{
  'add-node': []
  'change-shape': [shape: string]
  'zoom-in': []
  'zoom-out': []
  'fit-view': []
  'reset-zoom': []
  'apply-layout': [layout: string]
  'undo': []
  'redo': []
  'export': []
  'import': []
  'clear': []
  'toggle-snap': [enabled: boolean]
}>()

const shapes = [
  { value: 'rectangle', label: 'Rectangle', icon: 'fa-solid fa-square' },
  { value: 'rounded', label: 'Rounded', icon: 'fa-solid fa-square-full' },
  { value: 'circle', label: 'Circle', icon: 'fa-solid fa-circle' },
  { value: 'diamond', label: 'Diamond', icon: 'fa-solid fa-diamond' }
]

const layouts = [
  { value: 'tree', label: 'Tree', icon: 'fa-solid fa-sitemap' },
  { value: 'radial', label: 'Radial', icon: 'fa-solid fa-circle-nodes' },
  { value: 'force', label: 'Force', icon: 'fa-solid fa-chart-network' }
]

function handleSnapChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('toggle-snap', target.checked)
}
</script>

<style scoped>
.mindmap-toolbar {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-section {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 0.25rem;
}

.toolbar-btn {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-color: var(--border);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.toolbar-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.toolbar-toggle input {
  cursor: pointer;
}

.toolbar-toggle:hover {
  color: var(--text-primary);
}
</style>
