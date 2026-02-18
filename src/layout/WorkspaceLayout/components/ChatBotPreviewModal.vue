<template>
    <div
      class="w-full flex items-center justify-center"
    >

      <!-- Modal -->
      <div
        class="w-full"
      >
        <!-- Header -->
        <div
          class="px-3 py-1.5 border-b border-border flex flex-col justify-between"
        >
          <h3 class="text-sm font-semibold text-text-primary">
            {{ isReadAction ? 'Fetched Cards' : 'AI Suggested Changes' }}
          </h3>
          <p class="text-xs text-text-secondary" v-if="isReadAction">
              Found {{ fetchedItems.length }} card<span v-if="fetchedItems?.length > 1">s</span> matching your query.
            </p>
        </div>

        <!-- Content -->
        <div class="py-5 px-2 space-y-4 overflow-y-auto max-h-[80vh] overflow-x-auto custom_scroll_bar">
          <!-- Read Action - Display fetched cards -->
          <template v-if="isReadAction">
            <div class="space-y-3 mt-4 flex flex-wrap gap-3">
              <div
                v-for="card in fetchedItems"
                :key="card.id || card._id"
                class="bg-bg-body border border-border rounded-md p-4
                      w-full sm:w-full md:w-full lg:w-[calc(50%-1rem)]"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="inline-block text-xs px-2 py-1 rounded bg-bg-card border border-border"
                      >
                        {{ card['card-code'] || 'N/A' }}
                      </span>
                      <span
                        v-if="card['card-status']"
                        class="inline-block text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20"
                      >
                        {{ card['card-status'] }}
                      </span>
                      <span
                        v-if="card.priority || card['card-priority']"
                        class="inline-block text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      >
                        {{ card.priority || card['card-priority'] }}
                      </span>
                    </div>

                    <p class="font-medium text-text-primary">
                      {{ card['card-title'] || card.title }}
                    </p>

                    <div
                      v-if="card['card-description']"
                      class="text-xs text-text-secondary"
                      v-html="card['card-description']"
                    />

                    <div v-if="card['start-date'] || card['end-date']" class="flex gap-3 text-xs text-text-secondary">
                      <span v-if="card['start-date']">
                        <i class="fa-solid fa-calendar-start mr-1"></i>
                        {{ card['start-date'] }}
                      </span>
                      <span v-if="card['end-date']">
                        <i class="fa-solid fa-calendar-end mr-1"></i>
                        {{ card['end-date'] }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!fetchedItems.length" class="text-center py-8 text-text-secondary">
                No cards found
              </div>
            </div>
          </template>

          <!-- Create Action - Display sheets and cards to create -->
          <template v-else>
            <p class="text-sm text-text-secondary">
              The AI suggests the following changes. Please review before applying.
            </p>

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
                  <div
                    class="w-10 h-10 flex items-center justify-center rounded-md bg-bg-body border border-border"
                  >
                    <i
                      :class="[
                        sheet.variables['sheet-icon']?.prefix,
                        sheet.variables['sheet-icon']?.iconName,
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
                      class="bg-bg-body border border-border rounded-md p-3 text-sm w-full mt-3 sm:w-[48%] lg:w-[32%]"
                      :class="{
                        'ring-2 ring-accent rounded-md p-3':
                          selectedCards?.includes(card.variables['card-code'])
                      }"
                    >
                      <div
                        class="flex justify-between items-start cursor-pointer gap-3"
                        @click="toggleCard(card.variables['card-code'])"
                      >
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
          </template>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t border-border flex justify-end gap-3" v-if="!isReadAction">
          <button
            class="px-4 py-2 text-sm rounded-md border border-border text-text-primary hover:bg-bg-body"
            @click="emit('decline')"
          >
            {{ isReadAction ? 'Cancel' : 'Decline' }}
          </button>
          <button
            class="px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
            :disabled="isReadAction ? !selectedReadCards.length : (!selectedItems.length && !selectedCards.length)"
            @click="acceptChanges"
          >
            {{ isReadAction ? 'Add Selected Cards' : 'Accept Changes' }}
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Checkbox from '@/components/ui/Checkbox.vue'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  data: Array
})

const emit = defineEmits(['update:modelValue', 'accept', 'decline'])

// Determine if this is a read action
const isReadAction = computed(() => {
  return props?.data?.[0]?.action === 'read'
})

// For READ actions
const fetchedItems = computed(() => {
  if (!isReadAction.value) return []
  return props?.data?.[0]?.result?.items || []
})

const selectedReadCards = ref([])

const selectAllRead = computed(() => {
  return fetchedItems.value.length > 0 && 
         selectedReadCards.value.length === fetchedItems.value.length
})

const toggleSelectAllRead = () => {
  if (selectAllRead.value) {
    selectedReadCards.value = []
  } else {
    selectedReadCards.value = fetchedItems.value.map(c => c.id || c._id)
  }
}

const toggleReadCard = (id) => {
  if (selectedReadCards.value.includes(id)) {
    selectedReadCards.value = selectedReadCards.value.filter(c => c !== id)
  } else {
    selectedReadCards.value.push(id)
  }
}

// For CREATE actions
const sheetsPreview = computed(() => {
  if (isReadAction.value) return []
  return props?.data?.[0]?.payload?.sheets_preview || []
})

const cards = computed(() => {
  if (isReadAction.value) return []
  return props?.data?.[0]?.payload?.cards || []
})

const selectedItems = ref([])
const selectedCards = ref([])

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

const getSheetCards = (sheetTitle) => {
  return groupedCards.value?.[sheetTitle]?.map(c => c.variables['card-code']) || []
}

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

const toggleCard = (code) => {
  if (selectedCards.value.includes(code)) {
    selectedCards.value = selectedCards.value.filter(c => c !== code)
  } else {
    selectedCards.value.push(code)
  }
}

const acceptChanges = () => {
  if (isReadAction.value) {
    // Handle READ action - emit selected cards WITH workspace_id
    const workspace_id = props.data?.[0]?.workspace_id || null
    const selected = fetchedItems.value.filter(card => 
      selectedReadCards.value.includes(card.id || card._id)
    )
    emit('accept', { 
      action: 'read', 
      workspace_id,
      cards: selected 
    })
  } else {
    // Handle CREATE action - existing logic
    const workspace_id = props.data?.[0]?.workspace_id || null

    const module = {
      _id: props.data?.[0]?.result?.module?._id || null,
      variables: {
        'module-title':
          props.data?.[0]?.result?.module?.variables?.['module-title'] || '',
        'module-description':
          props.data?.[0]?.result?.module?.variables?.['module-description'] || ''
      },
      is_ai_generated: true
    }

    const sheets = selectedItems.value
      .map(sheetTitle => {
        const sheetObj = sheetsPreview.value.find(
          s => s.variables['sheet-title'] === sheetTitle
        )
        if (!sheetObj) return null

        const sheetCardCodes = getSheetCards(sheetTitle)
        const selectedCardsForSheet = cards.value
          .filter(
            c =>
              sheetCardCodes.includes(c.variables['card-code']) &&
              selectedCards.value.includes(c.variables['card-code'])
          )
          .map(card => {
            const originalCard = props.data?.[0]?.payload?.cards?.find(
              c => c.variables['card-code'] === card.variables['card-code']
            )
            console.log("card id", card.variables);
            
            return {
              _id: originalCard?._id || null,
              variables: {
                '_id':card.variables['_id'],
                'card-title': card.variables['card-title'],
                'card-status': card.variables['card-status'],
                'card-priority': card.variables['priority']
              },
              seat_id: originalCard?.variables?.seat_id
                ? [originalCard.variables.seat_id]
                : [],
              assigned_to: [],
              workspace_lane_id:
                originalCard?.variables?.workspace_lane_id || null
            }
          })

        if (!selectedCardsForSheet.length) return null

        return {
          _id: sheetObj._id || null,
          variables: {
            'sheet-title': sheetObj.variables['sheet-title'],
            'sheet-description': sheetObj.variables['sheet-description'],
            'sheet-icon': sheetObj.variables['sheet-icon']
          },
          cards: selectedCardsForSheet
        }
      })
      .filter(Boolean)

    const payload = {
      workspace_id,
      module,
      sheets
    }
    emit('accept', payload)
  }
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

.custom_scroll_bar {
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
</style>
