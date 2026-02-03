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
             <div class="space-y-4 mt-4" v-if="sheetsPreview?.length">
  <div
    v-for="sheet in sheetsPreview"
    :key="sheet.variables['sheet-title']"
    class="bg-bg-card border border-border rounded-lg p-4"
  >
    <!-- Sheet Header -->
    <div
      class="flex items-start gap-3 cursor-pointer"
      @click="toggleItem(sheet.variables['sheet-title'])"
      :class="{
        'ring-2 ring-accent rounded-md p-3':
          selectedItems.includes(sheet.variables['sheet-title'])
      }"
    >
      <!-- Icon -->
      <div
        class="w-10 h-10 flex items-center justify-center rounded-md bg-bg-body border border-border"
      >
        <i
          :class="[
            sheet.variables['sheet-icon'].prefix,
            sheet.variables['sheet-icon'].iconName,
            'text-accent'
          ]"
        />
      </div>

      <div class="flex-1">
        <h4 class="text-sm font-semibold text-text-primary">
          {{ sheet.variables['sheet-title'] }}
        </h4>
        <p class="text-xs text-text-secondary mt-1">
          {{ sheet.variables['sheet-description'] }}
        </p>
      </div>

      <input
        type="checkbox"
        :checked="selectedItems.includes(sheet.variables['sheet-title'])"
        @change.stop="toggleItem(sheet.variables['sheet-title'])"
      />
    </div>

    <!-- Cards Preview -->
    <div
      v-if="groupedCards[sheet.variables['sheet-title']]?.length"
      class="mt-4"
    >
      <p class="text-xs font-semibold text-text-secondary">
        Cards to be created
      </p>
      <div class="flex flex-wrap gap-3">
  <div
  v-for="card in groupedCards[sheet.variables['sheet-title']]"
  :key="card.variables['card-code']"
  class="
    bg-bg-body border border-border rounded-md p-3 text-sm
    w-full mt-3
    sm:w-[48%]
    lg:w-[32%]
  "
  :class="{
        'ring-2 ring-accent rounded-md p-3':
          selectedCards?.includes(card.variables['card-code'])
      }"
>
  <div class="flex justify-between items-start cursor-pointer gap-3" @click="toggleCard(card.variables['card-code'])"
  >
    <!-- Card checkbox -->
    <input
      type="checkbox"
      class="mt-1"
      :checked="selectedCards?.includes(card.variables['card-code'])"
      @change.stop="toggleCard(card.variables['card-code'])"
    />

    <div class="space-y-2 flex-1">
      <span
        class="inline-block text-xs px-2 py-1 rounded bg-bg-card border border-border"
      >
        {{ card.variables['card-status'] }}
      </span>

      <p class="font-medium text-text-primary">
        {{ card.variables['card-title'] }}
      </p>

      <p class="text-xs text-text-secondary">
        {{ card.variables['card-description'] }}
      </p>
    </div>
  </div>
</div>

</div>

      
    </div>
  </div>
</div>      
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
            :disabled="!selectedItems.length && !selectedCards.length"
            @click="acceptChanges"
          >
            Accept Changes
          </button>


        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import Checkbox from '@/components/ui/Checkbox.vue'

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

const sheetsPreview = computed(() => {
  return props?.data?.[0]?.payload?.sheets_preview || []
})

const moduleId = computed(() => props?.data?.[0]?.result?.module?.variables?.module_id || null)
const cards = computed(() => props?.data?.[0]?.payload?.cards || [])

const selectedItems = ref([])
const selectedCards = ref([])

/**
 * Map cards to sheets using sheet title as key
 * For now, backend doesn't provide mapping, so assume first N/2 cards belong to first sheet etc.
 */
const groupedCards = computed(() => {
  if (!cards.value.length) return {}

  const result = {}
  const sheetsCount = sheetsPreview.value.length
  const cardsPerSheet = Math.ceil(cards.value.length / sheetsCount)

  sheetsPreview.value.forEach((sheet, index) => {
    const start = index * cardsPerSheet
    const end = start + cardsPerSheet
    result[sheet.variables['sheet-title']] = cards.value.slice(start, end)
  })
  return result
})

// helper to get card codes for a sheet
const getSheetCards = (sheetTitle) => {
  return groupedCards.value?.[sheetTitle]?.map(c => c.variables['card-code']) || []
}

/**
 * Select All Sheets + Cards
 */
const selectAll = computed(() => {
  const allSheetsSelected = selectedItems.value.length === sheetsPreview.value.length
  const allCardsSelected = selectedCards.value.length === cards.value.length
  return sheetsPreview.value.length && cards.value.length
    ? allSheetsSelected && allCardsSelected
    : allSheetsSelected
})

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = []
    selectedCards.value = []
  } else {
    selectedItems.value = sheetsPreview.value.map(s => s.variables['sheet-title'])
    selectedCards.value = cards.value.map(c => c.variables['card-code'])
  }
}

/**
 * Toggle Sheet selection
 */
const toggleItem = (sheetTitle) => {
  const sheetCards = getSheetCards(sheetTitle)
  if (selectedItems.value.includes(sheetTitle)) {
    selectedItems.value = selectedItems.value.filter(s => s !== sheetTitle)
    selectedCards.value = selectedCards.value.filter(c => !sheetCards.includes(c))
  } else {
    selectedItems.value.push(sheetTitle)
    sheetCards.forEach(code => {
      if (!selectedCards.value.includes(code)) selectedCards.value.push(code)
    })
  }
}

/**
 * Toggle individual Card
 */
const toggleCard = (code) => {
  if (selectedCards.value.includes(code)) {
    selectedCards.value = selectedCards.value.filter(c => c !== code)
  } else {
    selectedCards.value.push(code)
  }
}

/**
 * Payload for backend on Accept
 */
const acceptChanges = () => {
  const payload = {
    module_id: props.data?.[0]?.result?.module?.variables?.module_id,
    sheets: selectedItems.value.map(sheetTitle => {
      const sheetObj = sheetsPreview.value.find(s => s.variables['sheet-title'] === sheetTitle)
      return {
        sheet_id: sheetObj?._id || null,
        sheet_title: sheetObj?.variables['sheet-title'],
        cards: getSheetCards(sheetTitle)
          .filter(code => selectedCards.value.includes(code))
          .map(code => {
            const cardObj = cards.value.find(c => c.variables['card-code'] === code)
            return {
              card_id: cardObj?._id || null,
              card_code: cardObj?.variables['card-code'],
              card_title: cardObj?.variables['card-title']
            }
          })
      }
    })
  }

  emit('accept', payload)
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

/* Modal animation */
.modal-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.modal-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.modal-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

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
