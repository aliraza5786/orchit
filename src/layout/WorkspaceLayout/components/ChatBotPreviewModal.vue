<template>
  <div class="w-full flex items-center justify-center">
    <div class="w-full">
      <!-- Header -->
      <div
        class="px-3 py-1.5 border-b border-border flex flex-col justify-between"
      >
        <h3 class="text-sm font-semibold text-text-primary">
          {{ isReadAction ? "Fetched Cards" : "AI Suggested Changes" }}
        </h3>
        <p class="text-xs text-text-secondary" v-if="isReadAction">
          Found {{ fetchedItems.length }} card<span
            v-if="fetchedItems?.length > 1"
            >s</span
          >
          matching your query.
        </p>
      </div>
      <div
        class="py-5 px-3 space-y-4 overflow-y-auto max-h-[80vh] overflow-x-auto"
      >
        <!-- ================= READ ACTION ================= -->
        <template v-if="isReadAction">
  <div class="flex flex-wrap gap-4">

    <!-- CARD -->
    <div
      v-for="card in fetchedItems"
      :key="card.id || card._id"
      class="relative bg-bg-card rounded-lg p-4 shadow-sm border-t-4
             hover:shadow-md transition-all duration-200
             w-full md:w-[calc(50%-0.5rem)]"
    >

      <!-- Header -->
      <div class="flex justify-between items-start gap-2 mb-3">
        <div class="flex gap-2 flex-wrap items-center">

          <span
            v-if="card['card-status']"
            class="text-[10px] px-2 py-1 h-6 rounded
                   bg-accent/20 text-accent font-medium capitalize"
          >
            {{ card["card-status"] }}
          </span>

          <span
            v-if="card.priority || card['card-priority']"
            class="text-[10px] px-2 py-1 h-6 rounded
                   bg-orange-500/15 text-orange-500 font-medium capitalize"
          >
            {{ card.priority || card["card-priority"] }}
          </span>

        </div>
      </div>

      <!-- Title -->
      <h3 class="text-sm font-medium text-card-foreground leading-tight mb-2 capitalize">
        {{ card["card-title"] || card.title }}
      </h3>

      <!-- Description -->
      <div
        v-if="card['card-description']"
        class="text-xs text-text-secondary mb-3 line-clamp-2 max-h-20"
        v-html="card['card-description']"
      />

      <!-- Footer -->
      <div
        v-if="card['start-date'] || card['end-date'] || canAssignCard || canViewCard"
        class="flex justify-between items-center mt-3 pt-3 border-t border-border/50 text-xs text-text-secondary"
      >

        <!-- Left Section -->
        <div class="flex items-center flex-1">

          <div v-if="canAssignCard || canViewCard" @click.stop>
            <AssigmentDropdown
              :users="members"
              :assigneeId="card.seat_id"
            />
          </div>

          <div class="flex items-center gap-3">
             <div @click.stop
                    class="flex items-center gap-2 text-nowrap overflow-ellipsis text-xs text-text-secondary">
                    <DatePicker
                      placeholder="end date"
                      :model-value="card['end-date']"
                      theme="dark"
                      emit-as="ymd"
                      @update:modelValue="(date) => setDueDate(date, card?.id || card?._id)"
                    />

                </div>

          </div>
        </div>

        <!-- Right Section -->
        <div
          v-if="card?.comments_count || card?.attachments?.length"
          class="flex items-center gap-3"
        >

          <div
            v-if="card?.comments_count"
            class="flex items-center gap-1"
          >
            <i class="fa-regular fa-message text-[10px]"></i>
            <span>{{ card?.comments_count }}</span>
          </div>

          <div
            v-if="card?.attachments?.length"
            class="flex items-center gap-1"
          >
            <i class="fa-regular fa-file text-[10px]"></i>
            <span>{{ card?.attachments?.length }}</span>
          </div>

        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!fetchedItems.length"
      class="w-full text-center py-10 text-text-secondary"
    >
      No cards found
    </div>

  </div>
</template>


        <!-- ================= CREATE ACTION ================= -->
        <template v-else>
          <p class="text-sm text-text-secondary">
            The AI suggests the following changes. Please review before
            applying.
          </p>

          <Checkbox
            :checked="selectAll"
            label="Select All"
            @change="toggleSelectAll"
          />

          <div class="space-y-4 mt-4" v-if="sheetsPreview?.length">
            <!-- SHEET -->
            <div
              v-for="sheet in sheetsPreview"
              :key="sheet.variables['sheet-title']"
              class="bg-bg-card rounded-lg shadow-sm border border-border p-4"
            >
              <!-- Sheet Header -->
              <div
                class="flex items-start gap-3 cursor-pointer transition-all duration-150"
                @click="toggleItem(sheet.variables['sheet-title'])"
                :class="{
                  'ring-2 ring-accent rounded-md p-3': selectedItems.includes(
                    sheet.variables['sheet-title'],
                  ),
                }"
              >
                <div
                  class="w-10 h-10 flex items-center justify-center rounded-md bg-bg-surface border border-border"
                >
                  <i
                    :class="[
                      sheet.variables['sheet-icon']?.prefix,
                      sheet.variables['sheet-icon']?.iconName,
                      'text-accent',
                    ]"
                  />
                </div>

                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-card-foreground">
                    {{ sheet.variables["sheet-title"] }}
                  </h4>
                  <p class="text-xs text-text-secondary mt-1">
                    {{ sheet.variables["sheet-description"] }}
                  </p>
                </div>

                <input
                  type="checkbox"
                  :checked="
                    selectedItems.includes(sheet.variables['sheet-title'])
                  "
                  @change.stop="toggleItem(sheet.variables['sheet-title'])"
                />
              </div>

              <!-- CARDS PREVIEW -->
              <div
                v-if="groupedCards[sheet.variables['sheet-title']]?.length"
                class="mt-4"
              >
                <p class="text-xs font-semibold text-text-secondary mb-2">
                  Cards to be created
                </p>

                <div class="flex flex-wrap gap-3">
                  <div
                    v-for="card in groupedCards[sheet.variables['sheet-title']]"
                    :key="card.variables['card-code']"
                    class="relative bg-bg-card rounded-lg p-4 shadow-sm border-t-4 hover:shadow-md transition-all duration-200 w-full mt-3 sm:w-[48%] lg:w-[32%]"
                    :class="{
                      'ring-2 ring-accent': selectedCards?.includes(
                        card.variables['card-code'],
                      ),
                    }"
                  >
                    <div
                      class="flex justify-between items-start gap-3 cursor-pointer"
                      @click="toggleCard(card.variables['card-code'])"
                    >
                      <input
                        type="checkbox"
                        class="mt-1"
                        :checked="
                          selectedCards?.includes(card.variables['card-code'])
                        "
                        @change.stop="toggleCard(card.variables['card-code'])"
                      />

                      <div class="flex-1 space-y-2">
                        <span
                          class="text-[10px] px-2 py-1 h-6 rounded bg-accent/20 text-accent font-medium capitalize"
                        >
                          {{ card.variables["card-status"] }}
                        </span>

                        <h3
                          class="text-sm font-medium text-card-foreground leading-tight capitalize"
                        >
                          {{ card.variables["card-title"] }}
                        </h3>

                        <p class="text-xs text-text-secondary line-clamp-2">
                          {{ card.variables["card-description"] }}
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

      <!-- ================= FOOTER ================= -->
      <div
        class="px-5 py-4 border-t border-border flex justify-end gap-3 bg-bg-card"
        v-if="!isReadAction"
      >
        <button
          class="px-4 py-2 text-sm rounded-md border border-border text-text-primary hover:bg-bg-body transition"
          @click="emit('decline')"
        >
          {{ isReadAction ? "Cancel" : "Decline" }}
        </button>

        <button
          class="px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent-hover transition disabled:opacity-50"
          :disabled="
            isReadAction
              ? !selectedReadCards.length
              : !selectedItems.length && !selectedCards.length
          "
          @click="acceptChanges"
        >
          {{ isReadAction ? "Add Selected Cards" : "Accept Changes" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Checkbox from "@/components/ui/Checkbox.vue";
import AssigmentDropdown from "../../../views/Product/components/AssigmentDropdown.vue";
import { useWorkspacesRoles } from "../../../queries/useWorkspace";
import { useRouteIds } from "../../../composables/useQueryParams";
import { usePermissions } from "../../../composables/usePermissions";
import { useMoveCard } from "../../../queries/useSheets";
import DatePicker from "../../../views/Product/components/DatePicker.vue";
import { useQueryClient } from "@tanstack/vue-query";
const { canDeleteCard, canAssignCard, canViewCard } = usePermissions();
const props = defineProps({
  modelValue: Boolean,
  title: String,
  data: Array,
});
const queryClient = useQueryClient()
const { workspaceId, moduleId } = useRouteIds();
const emit = defineEmits(["update:modelValue", "accept", "decline"]);
const moveCard = useMoveCard({
  onSuccess: () => {

    queryClient.invalidateQueries({
      predicate: (query) =>
        [
          'people-lists',
          'get-sheets',
          'sheet-list',
          'cards',
          'lanes'
        ].includes(query.queryKey[0])
    })

  }
})

const setDueDate = (date, id) => {
    moveCard.mutate({
        card_id: id,
        variables: { 'end-date': date }
    })
}
// Determine if this is a read action
const isReadAction = computed(() => {
  return props?.data?.[0]?.action === "read";
});
const { data: members } = useWorkspacesRoles(workspaceId.value);
// For READ actions
const fetchedItems = computed(() => {
  if (!isReadAction.value) return [];
  return props?.data?.[0]?.result?.items || [];
});

const selectedReadCards = ref([]);

const selectAllRead = computed(() => {
  return (
    fetchedItems.value.length > 0 &&
    selectedReadCards.value.length === fetchedItems.value.length
  );
});

const toggleSelectAllRead = () => {
  if (selectAllRead.value) {
    selectedReadCards.value = [];
  } else {
    selectedReadCards.value = fetchedItems.value.map((c) => c.id || c._id);
  }
};

const toggleReadCard = (id) => {
  if (selectedReadCards.value.includes(id)) {
    selectedReadCards.value = selectedReadCards.value.filter((c) => c !== id);
  } else {
    selectedReadCards.value.push(id);
  }
};

// For CREATE actions
const sheetsPreview = computed(() => {
  if (isReadAction.value) return [];
  return props?.data?.[0]?.payload?.sheets_preview || [];
});

const cards = computed(() => {
  if (isReadAction.value) return [];
  return props?.data?.[0]?.payload?.cards || [];
});

const selectedItems = ref([]);
const selectedCards = ref([]);

const groupedCards = computed(() => {
  if (!cards.value.length) return {};

  const result = {};
  const sheetsCount = sheetsPreview.value.length;
  const cardsPerSheet = Math.ceil(cards.value.length / sheetsCount);

  sheetsPreview.value.forEach((sheet, index) => {
    const start = index * cardsPerSheet;
    const end = start + cardsPerSheet;
    result[sheet.variables["sheet-title"]] = cards.value.slice(start, end);
  });
  return result;
});

const getSheetCards = (sheetTitle) => {
  return (
    groupedCards.value?.[sheetTitle]?.map((c) => c.variables["card-code"]) || []
  );
};

const selectAll = computed(() => {
  const allSheetsSelected =
    selectedItems.value.length === sheetsPreview.value.length;
  const allCardsSelected = selectedCards.value.length === cards.value.length;
  return sheetsPreview.value.length && cards.value.length
    ? allSheetsSelected && allCardsSelected
    : allSheetsSelected;
});

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = [];
    selectedCards.value = [];
  } else {
    selectedItems.value = sheetsPreview.value.map(
      (s) => s.variables["sheet-title"],
    );
    selectedCards.value = cards.value.map((c) => c.variables["card-code"]);
  }
};

const toggleItem = (sheetTitle) => {
  const sheetCards = getSheetCards(sheetTitle);
  if (selectedItems.value.includes(sheetTitle)) {
    selectedItems.value = selectedItems.value.filter((s) => s !== sheetTitle);
    selectedCards.value = selectedCards.value.filter(
      (c) => !sheetCards.includes(c),
    );
  } else {
    selectedItems.value.push(sheetTitle);
    sheetCards.forEach((code) => {
      if (!selectedCards.value.includes(code)) selectedCards.value.push(code);
    });
  }
};

const toggleCard = (code) => {
  if (selectedCards.value.includes(code)) {
    selectedCards.value = selectedCards.value.filter((c) => c !== code);
  } else {
    selectedCards.value.push(code);
  }
};

const acceptChanges = () => {
  if (isReadAction.value) {
    // Handle READ action - emit selected cards WITH workspace_id
    const workspace_id = props.data?.[0]?.workspace_id || null;
    const selected = fetchedItems.value.filter((card) =>
      selectedReadCards.value.includes(card.id || card._id),
    );
    emit("accept", {
      action: "read",
      workspace_id,
      cards: selected,
    });
  } else {
    // Handle CREATE action - existing logic
    const workspace_id = workspaceId.value || null;

    const module = {
      _id: moduleId.value || props.data?.[0]?._id,
      variables: {
        "module-title":
          props.data?.[0]?.variables?.["module-title"] || "",
        "module-description":
          props.data?.[0]?.variables?.["module-description"] ||
          "",
      },
      is_ai_generated: true,
    };

   const sheets = selectedItems.value
  .map((sheetTitle) => {
    const sheetObj = sheetsPreview.value.find(
      (s) => s.variables["sheet-title"] === sheetTitle
    );
    if (!sheetObj) return null;

    const sheetCardCodes = getSheetCards(sheetTitle);

    const selectedCardsForSheet = cards.value
      .filter(
        (c) =>
          sheetCardCodes.includes(c.variables["_id"]) &&
          selectedCards.value.includes(c.variables["_id"])
      )
      .map((card) => {
        const originalCard = props.data?.[0]?.payload?.cards?.find(
          (c) => c.variables["_id"] === card.variables["_id"]
        );

        return {
          _id: originalCard?._id || null,
          variables: {
            _id: card.variables["_id"],
            "card-title": card.variables["card-title"],
            "card-status": card.variables["card-status"],
            "card-priority": card.variables["priority"],
          },
          seat_id: originalCard?.variables?.seat_id
            ? [originalCard.variables.seat_id]
            : [],
          assigned_to: [],
          workspace_lane_id:
            originalCard?.variables?.workspace_lane_id || null,
        };
      });
    return {
      _id: sheetObj._id || null,
      variables: {
        "sheet-title": sheetObj.variables["sheet-title"],
        "sheet-description": sheetObj.variables["sheet-description"],
        "sheet-icon": sheetObj.variables["sheet-icon"],
      },
      cards: selectedCardsForSheet.length ? selectedCardsForSheet : [],
    };
  })
  .filter(Boolean);
    const payload = {
      workspace_id,
      module,
      sheets,
    };
    emit("accept", payload);
  }
};
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
