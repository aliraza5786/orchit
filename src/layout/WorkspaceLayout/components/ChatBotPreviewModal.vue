<template>
  <div class="w-full h-full flex items-center justify-center">
    <div class="w-full h-[85vh] flex flex-col">
      <!-- {{ sheetsPreview}}  -->
      <!-- Header -->
      <div
        class="px-3 py-1.5 border-b border-border flex flex-col justify-between flex-shrink-0"
      >
        <h3 class="text-sm font-semibold text-text-primary py-2">
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
  class="flex-1 py-5 px-3 space-y-4 overflow-y-auto overflow-x-auto"
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
        <button class="cursor-pointer text-accent hover:text-accent-hover" @click="nativeShare(card)" title="Share this Ticket">
          <i class="fa-light fa-share"></i>
        </button>
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
          <div @click.stop>
            <AssigmentDropdown
              :users="members"
              :assigneeId="card.seat_id"
              @assign="assignHandle(card)"
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
          <p class="text-sm text-text-secondary overflow-y-auto">
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
             <!-- {{ sheetsPreview}} -->
            <div
              v-for="sheet in sheetsPreview"
              :key="sheet.variables['sheet-title']"
              class="bg-bg-body rounded-lg border border-border p-4"
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
                    'fa-solid',
                    sheet.variables['sheet-icon'],
                    'text-accent'
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
                    class="relative bg-bg-card rounded-lg p-4 shadow-sm border-t-4 hover:shadow-md transition-all duration-200 w-full mt-3 md:w-[32%]"
                    :class="{ 'ring-2 ring-accent': selectedCards?.includes(card._id) }"
                      @click="toggleCard(card._id)"
                      :checked="selectedCards?.includes(card._id)"
                      @change.stop="toggleCard(card._id)"
                  >
                    <div
                      class="flex justify-between items-start gap-3 cursor-pointer"
                      @click="toggleCard(card?._id)"
                    >
                      <input
                        type="checkbox"
                        class="mt-1"
                        :checked="
                          selectedCards?.includes(card.variables['_id'])
                        "
                        @change.stop="toggleCard(card.variables['_id'])"
                      />

                      <div class="flex-1 space-y-2">
                        <span
                          class="text-[10px] px-2 py-1 h-6 rounded bg-accent/20 text-accent font-medium capitalize"
                        >
                          {{ card.variables["card-status"] }}
                        </span>

                        <h3
                          class="text-sm font-medium text-card-foreground leading-tight capitalize mt-1.5"
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
             <label class="flex items-center ms-1 gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="preserveLog"
              class="w-3 h-3"
            />

            <span class="text-text-secondary">Do you want to preserve the suggestion log?</span>
           </label>
        </template>
      </div>
<div
  class="px-5 py-4 border-t border-border flex justify-end gap-3 bg-bg-card flex-shrink-0"
        v-if="!isReadAction"
      >
        <button
          class="px-4 py-2 text-sm rounded-md cursor-pointer border border-border text-text-primary hover:bg-bg-body transition"
          @click="emit('decline')"
        >
          {{ isReadAction ? "Cancel" : "Decline" }}
        </button>

        <button
  class="px-4 py-2 text-sm rounded-md bg-accent cursor-pointer text-white hover:bg-accent-hover transition disabled:opacity-50 flex items-center gap-2 justify-center"
  :disabled="
    agentStore.isAcceptingEntities ||
    (isReadAction
      ? !selectedReadCards.length
      : !selectedItems.length && !selectedCards.length)
  "
  @click="acceptChanges"
>
  <!-- Spinner -->
  <span
    v-if="agentStore.isAcceptingEntities"
    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
  ></span>

  <!-- Text -->
  <span>
    {{
      agentStore.isAcceptingEntities
        ? "Processing..."
        : isReadAction
        ? "Add Selected Cards"
        : "Accept Changes"
    }}
  </span>
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
import { useHead } from "@vueuse/head";
import { useAgentStore } from "../../../stores/agentStore";

const { canDeleteCard, canAssignCard, canViewCard } = usePermissions();

const props = defineProps({
  modelValue: Boolean,
  title: String,
  data: Array,
});

const queryClient = useQueryClient();
const preserveLog = ref(false);
const { workspaceId, moduleId } = useRouteIds();
const agentStore = useAgentStore();
const emit = defineEmits(["update:modelValue", "accept", "decline"]);

const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        ["people-lists", "get-sheets", "sheet-list", "cards", "lanes"].includes(
          query.queryKey[0]
        ),
    });
  },
});

const setDueDate = (date, id) => {
  moveCard.mutate({ card_id: id, variables: { "end-date": date } });
};

const isReadAction = computed(() => props?.data?.[0]?.action === "read");
const ogData = computed(() => agentStore.ogTypesTicket);
const { data: members } = useWorkspacesRoles(workspaceId.value);

// ── READ ──────────────────────────────────────────────────────────────
const fetchedItems = computed(() => {
  if (!isReadAction.value) return [];
  return props?.data?.[0]?.result?.items || [];
});

const selectedReadCards = ref([]);

const selectAllRead = computed(
  () =>
    fetchedItems.value.length > 0 &&
    selectedReadCards.value.length === fetchedItems.value.length
);

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

const sheetsPreview = computed(() => {
  if (isReadAction.value) return [];
  return (Array.isArray(props.data) ? props.data : [])
    .flatMap((item) => item.payload?.sheets || [])
    .filter((sheet) => sheet?.variables?.["sheet-title"]); // guard here
});


// ALL cards flat, each card has root-level _id and sheet_id
const allCards = computed(() => {
  if (isReadAction.value) return [];
  return (Array.isArray(props.data) ? props.data : [])
    .flatMap((item) =>
      item.payload?.sheets?.flatMap((sheet) => sheet.items || sheet.cards || []) ?? []
    );
});

// Group cards by sheet using sheet_id — NOT index math
const groupedCards = computed(() => {
  const result = {};
  for (const sheet of sheetsPreview.value) {
    result[sheet.variables["sheet-title"]] = allCards.value.filter(
      (c) => c.sheet_id === sheet._id
    );
  }
  return result;
});

// ── Selection state ───────────────────────────────────────────────────
const selectedItems = ref([]);
const selectedCards = ref([]); // stores root-level card._id strings

// Returns root _id list for cards belonging to a sheet
const getSheetCardIds = (sheetTitle) => {
  const sheet = sheetsPreview.value.find(
    (s) => s.variables["sheet-title"] === sheetTitle
  );
  if (!sheet) return [];
  return allCards.value
    .filter((c) => c.sheet_id === sheet._id)
    .map((c) => c._id);
};

const selectAll = computed(() => {
  if (!sheetsPreview.value.length) return false;
  const allSheetsSelected =
    selectedItems.value.length === sheetsPreview.value.length;
  const allCardsSelected =
    allCards.value.length === 0 ||
    selectedCards.value.length === allCards.value.length;
  return allSheetsSelected && allCardsSelected;
});

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = [];
    selectedCards.value = [];
  } else {
    selectedItems.value = sheetsPreview.value.map(
      (s) => s.variables["sheet-title"]
    );
    // KEY FIX: use root _id, not variables["_id"]
    selectedCards.value = allCards.value.map((c) => c._id);
  }
};

const toggleItem = (sheetTitle) => {
  const sheetCardIds = getSheetCardIds(sheetTitle);
  if (selectedItems.value.includes(sheetTitle)) {
    selectedItems.value = selectedItems.value.filter((s) => s !== sheetTitle);
    selectedCards.value = selectedCards.value.filter(
      (id) => !sheetCardIds.includes(id)
    );
  } else {
    selectedItems.value.push(sheetTitle);
    sheetCardIds.forEach((id) => {
      if (!selectedCards.value.includes(id)) selectedCards.value.push(id);
    });
  }
};

const toggleCard = (id) => {
  if (selectedCards.value.includes(id)) {
    selectedCards.value = selectedCards.value.filter((c) => c !== id);
  } else {
    selectedCards.value.push(id);
  }
};

// ── Accept ────────────────────────────────────────────────────────────
const acceptChanges = () => {
  if (isReadAction.value) {
    const workspace_id = props.data?.[0]?.workspace_id || null;
    const selected = fetchedItems.value.filter((card) =>
      selectedReadCards.value.includes(card.id || card._id)
    );
    emit("accept", { action: "read", workspace_id, cards: selected });
    return;
  }

  const workspace_id =
    workspaceId.value || props.data?.[0]?.workspace_id || null;

  const module = {
    _id:
      props.data?.[0]?.module_id ||
      props.data?.[0]?.payload?.module?._id ||
      moduleId.value,
    variables: {
      "module-title": props.data?.[0]?.variables?.["module-title"] || "",
      "module-description":
        props.data?.[0]?.variables?.["module-description"] || "",
    },
    is_ai_generated: true,
  };

  const sheets = selectedItems.value
    .map((sheetTitle) => {
      const sheetObj = sheetsPreview.value.find(
        (s) => s.variables["sheet-title"] === sheetTitle
      );
      if (!sheetObj) return null;

      // Cards for this sheet that the user selected
      const cardsForSheet = allCards.value.filter(
        (c) => c.sheet_id === sheetObj._id && selectedCards.value.includes(c._id)
      );

      const items = cardsForSheet.map((card) => ({
        _id: card._id || null,
        workspace_lane_id: card.workspace_lane_id || null,
        variables: {
          // API contract uses "title" not "card-title"
          title:
            card["card-title"] || card.variables?.["card-title"] || "",
          description:
            card["card-description"] ||
            card.variables?.["card-description"] ||
            "",
          "card-type":
            card["card-type"] || card.variables?.["card-type"] || "Task",
          "card-status":
            card["card-status"] || card.variables?.["card-status"] || "To Do",
          "story-points":
            card["story-points"] || card.variables?.["story-points"] || 0,
            "end-date":
            card["end-date"] ||
            card.variables?.["end-date"] ||
            new Date().toISOString().split("T")[0],
        },
        assigned_to: card.assigned_to || [],
        seat_id: Array.isArray(card.seat_id) && card.seat_id.length
          ? card.seat_id
          : [],
      }));

      return {
        _id: sheetObj._id || null,
        variables: {
          "sheet-title": sheetObj.variables["sheet-title"],
          "sheet-description": sheetObj.variables["sheet-description"] || "",
          "sheet-icon": sheetObj.variables["sheet-icon"] || null,
        },
        items, // ← API expects "items" not "cards"
      };
    })
    .filter(Boolean);

  emit("accept", { workspace_id, module, sheets, ispined: preserveLog.value });
};

// ── Assign / share helpers (unchanged) ───────────────────────────────
const assignHandle = (card) => {
  moveCard.mutate({
    card_id: card?._id,
    seat_id: members.value?.map((u) => u._id || u.id).filter(Boolean),
  });
};

useHead({
  title: computed(() => ogData.value?.details || ""),
  meta: computed(() =>
    ogData.value
      ? [
          { property: "og:title", content: ogData.value.title || "" },
          { property: "og:description", content: ogData.value.description || "" },
          { property: "og:url", content: ogData.value.url || window.location.href },
          { property: "og:type", content: "website" },
          { property: "og:image", content: ogData.value.image || "" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: ogData.value.title || "" },
          { name: "twitter:description", content: ogData.value.description || "" },
          { name: "twitter:image", content: ogData.value.image || "" },
        ]
      : []
  ),
});

function parseTicketDetailsFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const details = {};
  doc.querySelectorAll("meta[property^='ticket:variable']").forEach((meta) => {
    const key = meta.getAttribute("property").replace("ticket:variable:", "");
    details[key] = meta.getAttribute("content") || "";
  });
  return details;
}

const getShareUrl = (card) =>
  `https://www.orchit.ai/workspace/${workspaceId.value}/${moduleId.value}`;

async function nativeShare(card) {
  await agentStore.shareTicketTypes(card.id || card._id);
  const details = parseTicketDetailsFromHTML(agentStore.ogTypesTicket);
  const shareUrl = getShareUrl(card);
  const message = `📌 ${details["card-code"]}: ${details["card-title"]}\n\n${details["card-description"]}\n\n🟢 Status: ${details["card-status"]}\n🔥 Priority: ${details["priority"]}\n📅 Due: ${details["end-date"]}\n\n🔗 Open Ticket:\n${shareUrl}`;
  if (navigator.share) {
    await navigator.share({
      title: `${details["card-code"]}: ${details["card-title"]}`,
      text: message,
    });
  } else {
    await navigator.clipboard.writeText(message);
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
