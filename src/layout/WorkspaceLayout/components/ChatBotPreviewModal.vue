<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[9999] flex items-center justify-center px-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-pointer"
        @click="emit('update:modelValue', false)"
      />

      <!-- Modal -->
      <div
        class="relative bg-bg-card rounded-xl w-full max-w-[90vw] shadow-xl border border-border flex flex-col"
      >
        <!-- Header -->
        <div
          class="px-5 py-4 border-b border-border flex justify-between items-center"
        >
          <h3 class="text-sm font-semibold text-text-primary">
            AI Suggested Changes
          </h3>

          <button
            class="text-text-secondary hover:text-text-primary cursor-pointer"
            @click="emit('update:modelValue', false)"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-4 overflow-y-auto max-h-[70vh] overflow-x-auto custom_scroll_bar">
          <p class="text-sm text-text-secondary">
            The AI suggests the following changes. Please review before applying.
          </p>

          <!-- Select All -->
          <Checkbox
            :checked="selectAll"
            label="Select All"
            @change="toggleSelectAll"
          />

          <!-- Kanban Preview -->
          <KanbanBoard
            v-if="board.length"
            :board="board"
            variable_id=""
            sheet_id=""
            :plusIcon="false"
          >
            <template #ticket="{ ticket }" v-if="title==='People'">
              <KanbanCard :ticket="ticket" />
            </template>
            <!-- Uncomment for Pin cards
            <template #ticket="{ ticket }" v-if="title==='Pin'">
              <KanbanCardPin :ticket="ticket" />
            </template>
            -->
          </KanbanBoard>
        </div>

        <!-- Footer -->
        <div
          class="px-5 py-4 border-t border-border flex justify-end gap-3"
        >
          <button
            class="px-4 py-2 text-sm rounded-md border border-border text-text-primary hover:bg-bg-body"
            @click="emit('decline')"
          >
            Decline
          </button>

          <button
            class="px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
            :disabled="!selectedItems.length"
            @click="emit('accept')"
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import Checkbox from '@/components/ui/Checkbox.vue'
import KanbanBoard from '@/components/feature/kanban/KanbanBoard.vue'

import KanbanCard from '../../../views/People/components/KanbanCard.vue'
// import KanbanCardPin from '../../../views/Pin/components/KanbanCard.vue'

/* ================= PROPS / EMITS ================= */
const props = defineProps({
  modelValue: Boolean,
  title: String,
  data: Array
})

const emit = defineEmits([
  'update:modelValue',
  'accept',
  'decline'
])

/* ================= STATE ================= */
const selectedItems = ref([])
const selectAll = ref(false)

/* ================= BOARD ================= */
const board = computed(() => Array.isArray(props.data) ? props.data : [])

/* ================= SELECTION ================= */
function toggleSelectAll(e) {
  const checked = e.target.checked
  selectAll.value = checked

  selectedItems.value = checked
    ? board.value.flatMap(col => col.cards.map(card => card._id))
    : []
}

watch(selectedItems, () => {
  const totalCards = board.value.reduce(
    (sum, col) => sum + (col.cards?.length || 0),
    0
  )
  selectAll.value = totalCards > 0 && selectedItems.value.length === totalCards
})
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

.custom_scroll_bar::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

.custom_scroll_bar::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 10px;
}

.custom_scroll_bar::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

.custom_scroll_bar::-webkit-scrollbar-track {
  background: transparent;
}

/* Firefox support */
.custom_scroll_bar {
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
</style>
