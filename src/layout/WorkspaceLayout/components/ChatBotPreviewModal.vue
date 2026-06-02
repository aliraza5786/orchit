<template>
  <div class="w-full h-full flex items-center justify-center">
    <div class="w-full h-[85vh] flex flex-col">
      <!-- HEADER -->
      <div
        class="px-3 py-1.5 border-b border-border flex flex-col justify-between flex-shrink-0"
      >
        <h3 class="text-sm font-semibold text-text-primary py-3 -mt-5.5">
          {{
            isPeakWidget
              ? "AI Generated Widget"
              : isSprintCreate
                ? "AI Suggested Sprint"
                : isReadAction
                  ? "Fetched Cards"
                  : "AI Suggested Changes"
          }}
        </h3>
        <p
          class="text-xs text-text-secondary"
          v-if="isReadAction && !isPeakWidget"
        >
          Found {{ fetchedItems.length }} card<span
            v-if="fetchedItems?.length > 1"
            >s</span
          >
          matching your query.
        </p>
        <p class="text-xs text-text-secondary" v-if="isSprintCreate">
          Review the AI-suggested {{ sprintCreatePayload.sprintType || 'sprint' }} and its cards before accepting.
        </p>
        <p class="text-xs text-text-secondary" v-if="isPeakWidget">
          Preview the widget{{ allPeakWidgets.length > 1 ? "s" : "" }} below.
          Accept to pin to your Peak module.
        </p>
      </div>

      <!-- BODY -->
      <div class="flex-1 py-5 px-3 space-y-4 overflow-y-auto overflow-x-auto">
        <!-- ================= PEAK WIDGET HTML PREVIEW ================= -->
        <template v-if="isPeakWidget">
          <div class="space-y-6">
            <div
              v-if="
                peakWidgetItem?.payload?.type === 'create_widget' ||
                peakWidgetItem?.payload?.type === 'create_dashboard' ||
                peakWidgetItem?.payload?.type === 'update_widget' ||
                ('create_widget' && peakWidgetItem?.payload?.dashboard_title)
              "
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border/60 bg-bg-body/60"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                :style="{ background: (peakWidgetItem.payload.dashboard_color ?? '#6366f1') + '20' }"
              >
                <i
                  class="fa-solid fa-table-columns text-sm"
                  :style="{ color: peakWidgetItem.payload.dashboard_color ?? '#6366f1' }"
                ></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-text-primary">
                  {{ peakWidgetItem.payload.dashboard_title }}
                </p>
                <p class="text-xs text-text-secondary mt-0.5">
                  {{ allPeakWidgets.length }} widget{{
                    allPeakWidgets.length > 1 ? "s" : ""
                  }}
                  in this dashboard
                </p>
              </div>
            </div>

            <!-- Loop over every widget -->
            <div
              v-for="(widget, idx) in allPeakWidgets"
              :key="idx"
              class="space-y-3"
            >
              <!-- Widget meta row -->
              <div
                class="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-bg-body/60"
              >
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ background: (widget.color ?? '#6366f1') + '18' }"
                >
                  <i
                    :class="chartIcon(widget.data?.chart_type ?? widget.query?.chart_type)"
                    class="text-sm"
                    :style="{ color: widget.color ?? '#6366f1' }"
                  ></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-text-primary truncate">
                    {{ widget.title }}
                  </p>
                  <p class="text-xs text-text-secondary mt-0.5 truncate">
                    {{ widget.description }}
                  </p>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span
                    class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 capitalize"
                  >
                    {{ widget.data?.chart_type ?? widget.query?.chart_type ?? "chart" }}
                  </span>
                  <span class="text-[10px] text-text-tertiary">{{ widget.data?.total ?? 0 }} total</span>
                </div>
              </div>

              <!-- iframe chart -->
              <div class="rounded-xl border border-border/60 overflow-hidden shadow-sm">
                <div
                  class="px-3 py-2 border-b border-border/40 bg-bg-body/40 flex items-center gap-2"
                >
                  <div class="flex gap-1">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-400/60"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-400/60"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-green-400/60"></div>
                  </div>
                  <span class="text-[11px] text-text-tertiary ml-1">{{ widget.title }} — Preview</span>
                </div>
                <iframe
                  :srcdoc="widget._wrappedHtml"
                  class="w-full border-0 block"
                  style="height: 400px"
                  sandbox="allow-scripts"
                  :title="widget.title"
                ></iframe>
              </div>

              <!-- Series breakdown -->
              <div v-if="widget.data?.series?.length" class="space-y-1.5">
                <p class="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-1">
                  Data breakdown
                </p>
                <div
                  v-for="(s, si) in widget.data.series"
                  :key="si"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-body/60 border border-border/40"
                >
                  <div
                    class="w-2.5 h-2.5 rounded-sm shrink-0"
                    :style="{ background: seriesColor(widget, si) }"
                  ></div>
                  <span class="text-sm text-text-primary flex-1">{{ s.label }}</span>
                  <span class="text-sm font-semibold text-text-primary">{{ s.value }}</span>
                </div>
              </div>

              <!-- divider between widgets -->
              <div
                v-if="idx < allPeakWidgets.length - 1"
                class="border-t border-border/30 pt-2"
              ></div>
            </div>
          </div>
        </template>

        <!-- ================= SPRINT CREATE PREVIEW ================= -->
        <template v-else-if="isSprintCreate">
          <div class="bg-bg-body rounded-xl border border-border p-4 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-accent/10">
                <i class="fa-solid fa-flag-checkered text-accent text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-text-primary truncate">
                  {{ sprintCreatePayload.title }}
                </p>
                <p class="text-xs text-text-secondary mt-0.5 capitalize">
                  {{ sprintCreatePayload.sprintType || 'sprint' }}
                </p>
              </div>
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 capitalize">
                {{ sprintCreatePayload.status || 'planning' }}
              </span>
            </div>
            <p v-if="sprintCreatePayload.description" class="text-xs text-text-secondary leading-relaxed">
              {{ sprintCreatePayload.description }}
            </p>
            <p v-if="sprintCreatePayload.goal" class="text-xs text-text-secondary italic border-l-2 border-accent/40 pl-2">
              🎯 {{ sprintCreatePayload.goal }}
            </p>
            <div class="flex flex-wrap gap-3 text-xs text-text-secondary">
              <span v-if="sprintCreatePayload.start_date" class="flex items-center gap-1">
                <i class="fa-regular fa-calendar text-[10px]"></i>
                {{ sprintCreatePayload.start_date }}
              </span>
              <span v-if="sprintCreatePayload.end_date" class="flex items-center gap-1">
                <i class="fa-regular fa-calendar-check text-[10px]"></i>
                {{ sprintCreatePayload.end_date }}
              </span>
              <span v-if="sprintCreatePayload.duration" class="flex items-center gap-1">
                <i class="fa-regular fa-clock text-[10px]"></i>
                {{ sprintCreatePayload.duration }}
              </span>
            </div>
          </div>

          <!-- Cards section -->
          <div v-if="sprintCreateCards.length" class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Cards ({{ sprintCreateCards.length }})
              </p>
              <Checkbox
                :checked="sprintCreateSelectAll"
                label="Select All"
                @change="toggleSprintCreateSelectAll"
              />
            </div>
            <div class="flex flex-wrap gap-4">
              <div
                v-for="card in sprintCreateCards"
                :key="card._id || card.id || card.card_id"
                class="relative bg-bg-card rounded-lg cursor-pointer p-4 shadow-sm border-t-4 hover:shadow-md transition-all duration-200 w-full md:w-[calc(25%-0.75rem)] flex flex-col"
                :class="{ 'ring-2 ring-accent': selectedSprintCreateCards.includes(card._id || card.id || card.card_id) }"
                :style="{ borderTopColor: getPriorityColor(card.priority || card['card-priority']) }"
                @click="toggleSprintCreateCard(card._id || card.id || card.card_id)"
              >
                <!-- Top row -->
                <div class="flex justify-between gap-2 items-start mb-3">
                  <div class="flex gap-2 flex-wrap items-center">
                    <input
                      type="checkbox"
                      class="mt-1"
                      :checked="selectedSprintCreateCards.includes(card._id || card.id || card.card_id)"
                      @change.stop="toggleSprintCreateCard(card._id || card.id || card.card_id)"
                    />
                    <span
                      v-if="card['card-type'] || card.card_type"
                      class="text-[10px] px-2 py-1 h-6 rounded bg-bg-surface/60 text-text-secondary font-medium capitalize"
                    >
                      {{ card['card-type'] || card.card_type || 'General' }}
                    </span>
                    <span
                      v-if="card['card-status'] || card.status"
                      class="text-[10px] px-2 py-1 h-6 rounded bg-accent/20 text-accent font-medium capitalize"
                    >
                      {{ card['card-status'] || card.card_status }}
                    </span>
                    <span
                      v-if="card.priority || card['card-priority']"
                      class="text-[10px] px-2 py-1 h-6 rounded bg-orange-500/15 text-orange-500 font-medium capitalize"
                    >
                      {{ card.priority || card['card-priority'] }}
                    </span>
                  </div>
                </div>
                <!-- Title -->
                <h3 class="text-sm font-medium text-card-foreground leading-tight mb-2 capitalize">
                  {{ card['card-title'] || card.card_title }}
                </h3>
                <!-- Description -->
                <div
                  v-if="card['card-description'] || card.description"
                  class="text-xs text-text-secondary mb-3 line-clamp-2"
                  v-html="card['card-description'] || card.description"
                />
                <!-- Footer meta -->
                <div class="flex items-center gap-3 mt-auto pt-1.5 border-t border-border/50 text-xs text-text-secondary">
                  <span v-if="card['story-points'] || card.story_points" class="flex items-center gap-1">
                    <i class="fa-solid fa-star-half-stroke text-[10px]"></i>
                    {{ card['story-points'] || card.story_points }} pts
                  </span>
                  <span v-if="card['end-date'] || card.end_date" class="flex items-center gap-1">
                    <i class="fa-regular fa-calendar text-[10px]"></i>
                    {{ card['end-date'] || card.end_date }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty cards state -->
          <div v-else class="w-full text-center py-8 text-text-secondary text-xs">
            No cards attached to this {{ sprintCreatePayload.sprintType }}.
          </div>
        </template>

        <!-- ================= READ ACTION (non-plan) ================= -->
        <template v-else-if="isReadAction && !isPlanModule">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  <div
    v-for="card in fetchedItems"
    :key="card.id || card._id"
    @click="selectedCard = card"
    class="relative bg-bg-card rounded-lg cursor-pointer p-4 shadow-sm border-t-4 hover:shadow-md transition-all duration-200 flex flex-col"
    :style="{ borderTopColor: getPriorityColor(card.priority || card['card-priority']) }"
  >
    <!-- Top row -->
    <div class="flex justify-between gap-2 items-start mb-3">
      <div class="flex gap-2 flex-wrap items-center">
        <span
          v-if="card['card-type']"
          class="text-[10px] px-2 py-1 h-6 rounded bg-bg-surface/60 text-text-secondary font-medium capitalize"
        >
          {{ card['card-type'] || 'General' }}
        </span>

        <span
          v-if="card['card-status']"
          class="text-[10px] px-2 py-1 h-6 rounded bg-accent/20 text-accent font-medium capitalize"
        >
          {{ card['card-status'] }}
        </span>

        <span
          v-if="card.priority || card['card-priority']"
          class="text-[10px] px-2 py-1 h-6 rounded bg-orange-500/15 text-orange-500 font-medium capitalize"
        >
          {{ card.priority || card['card-priority'] }}
        </span>
      </div>

      <button
        class="cursor-pointer text-text-secondary hover:text-accent transition-colors flex-shrink-0"
        @click="nativeShare(card)"
      >
        <i class="fa-light fa-share text-xs"></i>
      </button>
    </div>

    <!-- Title -->
    <h3 class="text-sm font-medium text-card-foreground leading-tight mb-2 capitalize">
      {{ card['card-title'] || card.title }}
    </h3>

    <!-- Description -->
    <div
      v-if="card['card-description']"
      class="text-xs text-text-secondary mb-3 line-clamp-2 max-h-20"
      v-html="card['card-description']"
    />

    <!-- Footer -->
    <div class="flex justify-between items-center mt-auto pt-1.5 border-t border-border/50 text-xs text-text-secondary">
      <div class="flex items-center gap-2 flex-1">
        <div @click.stop v-if="canAssignCard || canViewCard">
          <AssigmentDropdown
            :inSpace="true" 
            :users="members"
            :assigneeId="card.seat_id"
            @assign="assignHandle(card)"
          />
        </div>

        <div @click.stop>
          <DatePicker
            :inSpace="true"
            placeholder="end date"
            :model-value="card['end-date']"
            theme="dark"
            emit-as="ymd"
            @update:modelValue="(date) => setDueDate(date, card?.id || card?._id)"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div v-if="card?.comments_count" class="flex items-center gap-1">
          <i class="fa-regular fa-message text-[10px]"></i>
          <span>{{ card.comments_count }}</span>
        </div>

        <div v-if="card?.attachments?.length" class="flex items-center gap-1">
          <i class="fa-regular fa-file text-[10px]"></i>
          <span>{{ card.attachments.length }}</span>
        </div>
      </div>
    </div>
  </div>
</div>
          <!-- Empty state -->
          <div v-if="!fetchedItems.length" class="w-full text-center py-10 text-text-secondary">
            No cards found
          </div>
        </template>
        <template v-else>
          <p class="text-sm text-text-secondary overflow-y-auto">
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
              class="bg-bg-body rounded-lg border border-border p-4"
            >
              <div
                class="flex items-start gap-3 cursor-pointer transition-all duration-150"
                @click="toggleItem(sheet.variables['sheet-title'])"
                :class="{
                  'ring-2 ring-accent rounded-md p-3': selectedItems.includes(sheet.variables['sheet-title']),
                }"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-md bg-bg-surface border border-border">
                  <i
                    :class="[
                      sheet.variables['sheet-icon']
                        ? `${sheet.variables['sheet-icon'].prefix} ${sheet.variables['sheet-icon'].iconName}`
                        : 'fa-solid fa-file',
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
                  :checked="selectedItems.includes(sheet.variables['sheet-title'])"
                  @change.stop="toggleItem(sheet.variables['sheet-title'])"
                />
              </div>
              <div v-if="groupedCards[sheet.variables['sheet-title']]?.length" class="mt-4">
                <p class="text-xs font-semibold text-text-secondary mb-2">Cards to be created</p>
                <div class="flex sm:flex-wrap flex-nowrap gap-3">
                  <div
                    v-for="card in groupedCards[sheet.variables['sheet-title']]"
                    :key="card.variables['card-code']"
                    class="relative bg-bg-card rounded-lg p-3 shadow-sm border-t-4 hover:shadow-md transition-all duration-200 w-full mt-3 md:w-[24%]"
                    :class="{ 'ring-2 ring-accent': selectedCards?.includes(card._id) }"
                    @click="toggleCard(card._id)"
                    @change.stop="toggleCard(card._id)"
                  >
                    <div
                      class="flex justify-between items-start gap-3 cursor-pointer"
                      @click="toggleCard(card?._id)"
                    >
                      <input
                        type="checkbox"
                        class="mt-1"
                        :checked="selectedCards?.includes(card._id)"
                        @change.stop="toggleCard(card._id)"
                      />
                      <div class="flex-1 space-y-2">
                        <div class="flex justify-between">
                          <span class="text-[10px] px-2 py-1 h-6 rounded bg-accent/20 text-accent font-medium capitalize">
                            {{ card.variables["card-status"] }}
                          </span>
                        </div>
                        <h3 class="text-sm font-medium text-card-foreground leading-tight capitalize mt-1.5">
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
      <!-- ✅ BODY closes here — was misplaced before -->

      <!-- FOOTER: default (create action + peak widget) -->
      <div
        class="px-5 py-4 border-t border-border flex justify-end gap-3 bg-bg-card flex-shrink-0"
        v-if="(!isReadAction && !isSprintCreate) || isPeakWidget"
      >
        <button
          class="px-4 py-2 text-sm rounded-md cursor-pointer border border-border text-text-primary hover:bg-bg-body transition"
          @click="emit('decline')"
        >
          {{ isPeakWidget ? "Dismiss" : "Decline" }}
        </button>
        <button
          class="px-4 py-2 text-sm rounded-md bg-accent cursor-pointer text-white hover:bg-accent-hover transition disabled:opacity-50 flex items-center gap-2 justify-center"
          :disabled="agentStore.isAcceptingEntities || (!isPeakWidget && !selectedItems.length && !selectedCards.length)"
          @click="acceptChanges"
        >
          <span
            v-if="agentStore.isAcceptingEntities"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></span>
          <span>
            {{
              agentStore.isAcceptingEntities
                ? "Processing..."
                : isPeakWidget
                  ? "Pin to Peak"
                  : isReadAction
                    ? "Add Selected Cards"
                    : "Accept Changes"
            }}
          </span>
        </button>
      </div>

      <!-- FOOTER: Sprint Create -->
      <div
        class="px-5 py-4 border-t border-border flex justify-end gap-3 bg-bg-card flex-shrink-0"
        v-if="isSprintCreate"
      >
        <button
          class="px-4 py-2 text-sm rounded-md cursor-pointer border border-border text-text-primary hover:bg-bg-body transition"
          @click="emit('decline')"
        >
          Decline
        </button>
        <button
          class="px-4 py-2 text-sm rounded-md bg-accent cursor-pointer text-white hover:bg-accent-hover transition disabled:opacity-50 flex items-center gap-2 justify-center"
          :disabled="agentStore.isAcceptingEntities"
          @click="acceptChanges"
        >
          <span
            v-if="agentStore.isAcceptingEntities"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></span>
          <span>
              {{
                agentStore.isAcceptingEntities
                  ? "Processing..."
                  : `Create ${
                      sprintCreatePayload.sprintType
                        ? sprintCreatePayload.sprintType.charAt(0).toUpperCase() +
                          sprintCreatePayload.sprintType.slice(1)
                        : "Sprint"
                    }`
              }}
            </span>
        </button>
      </div>

      <!-- FOOTER: Plan module read action -->
      <div
        class="px-5 py-4 border-t border-border flex justify-end gap-3 bg-bg-card flex-shrink-0"
        v-if="isReadAction && isPlanModule"
      >
        <button
          class="px-4 py-2 text-sm rounded-md cursor-pointer border border-border text-text-primary hover:bg-bg-body transition"
          @click="emit('decline')"
        >
          Decline
        </button>
        <button
          class="px-4 py-2 text-sm rounded-md bg-accent cursor-pointer text-white hover:bg-accent-hover transition disabled:opacity-50 flex items-center gap-2 justify-center"
          :disabled="!selectedSprintCards"
          @click="acceptChanges"
        >
          <span
            v-if="agentStore.isAcceptingEntities"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></span>
          <span>
            {{
              agentStore.isAcceptingEntities
                ? "Processing..."
                : "Add Selected Cards"
            }}
          </span>
        </button>
      </div>
    </div>

    <!-- CARD PREVIEW MODAL — inside root div ✅ -->
    <div v-if="selectedCard" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30" @click="selectedCard = null"></div>
      <div class="relative w-[900px] max-h-[85vh] overflow-y-auto bg-bg-card rounded-xl">
        <CardPreviewModal
          :details="selectedCard"
          :moduleId="moduleId"
          :showPanel="!!selectedCard"
          @close="() => selectedCard = null"
          @closeSidePanel="closeSidePanel"
          @comment:post="incrementCommentCount"
          :sheetID="selected_sheet_id"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed,watch } from "vue";
import { useRoute } from "vue-router";
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
import CardPreviewModal from "./CardView.vue"
const { canDeleteCard, canAssignCard, canViewCard } = usePermissions();

const props = defineProps({
  modelValue: Boolean,
  title: String,
  data: Array,
});
const selectedCard = ref(null);
const showPreview = ref(false);
const globalSelectAllSprintCards = ref(false)

const openCardView = (card) => {
  console.log(card, "card is");
  
  selectedCard.value = card;
  showPreview.value = true;
};
const route = useRoute();
const queryClient = useQueryClient();
const preserveLog = ref(false);
const { workspaceId, moduleId } = useRouteIds();
const agentStore = useAgentStore();
const emit = defineEmits(["update:modelValue", "accept", "decline"]);
const isPlanModule = computed(() => {
  if (isPeakWidget.value) return false;
  return props?.data?.[0]?.module_name=== "Plan" || props?.data?.[0]?.module_name=== "peak";
});
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        ["people-lists", "get-sheets", "sheet-list", "cards", "lanes"].includes(
          query.queryKey[0],
        ),
    });
  },
});

const setDueDate = (date, id) => {
  moveCard.mutate({ card_id: id, variables: { "end-date": date } });
};

const isOnPeakRoute = computed(() =>
  route?.path?.toLowerCase().includes("peak"),
);

const peakWidgetItem = computed(() => {
  if (!isOnPeakRoute.value) return null;
  if (!Array.isArray(props.data)) return null;

  return (
    props.data.find((item) => {
      if (item?.entity_type !== "widget") return false;
      const payload = item?.payload ?? {};
      // Shape A: payload.html exists directly
      if (payload.html?.trim()) return true;
      // Shape B: payload.widgets[] array with at least one html entry
      if (
        Array.isArray(payload.widgets) &&
        payload.widgets.some((w) => w?.html?.trim())
      )
        return true;
      return false;
    }) ?? null
  );
});

const isPeakWidget = computed(() => !!peakWidgetItem.value);

function seriesColor(widget, idx) {
  // Use the widget's own color for single-series charts (bar),
  // cycle through palette for multi-series (pie / doughnut)
  const type = widget.data?.chart_type ?? widget.query?.chart_type ?? "";
  if (["pie", "doughnut"].includes(type))
    return CHART_COLORS[idx % CHART_COLORS.length];
  return widget.color ?? CHART_COLORS[0];
}

function chartIcon(type) {
  const map = {
    pie: "fa-solid fa-chart-pie",
    doughnut: "fa-solid fa-chart-pie",
    bar: "fa-solid fa-chart-bar",
    line: "fa-solid fa-chart-line",
    area: "fa-solid fa-chart-area",
  };
  return map[type] ?? "fa-solid fa-chart-bar";
}

const CHART_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#e11d48",
  "#7c3aed",
  "#0ea5e9",
  "#d946ef",
];

function injectSeriesData(html, series = [], color = "#6366f1") {
  if (!series.length) return html;

  const labels = JSON.stringify(series.map((s) => s.label ?? s.name ?? ""));
  const values = JSON.stringify(series.map((s) => s.value ?? s.count ?? 0));
  const colors = JSON.stringify(
    series.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
  );

  return (
    html
      // Replace empty labels array
      .replace(/labels\s*:\s*\[\s*\]/, `labels: ${labels}`)
      // Replace empty data array inside datasets
      .replace(/data\s*:\s*\[\s*\]/, `data: ${values}`)
      // Replace empty backgroundColor array inside datasets
      .replace(/backgroundColor\s*:\s*\[\s*\]/, `backgroundColor: ${colors}`)
  );
}

function wrapHtml(html) {
  if (
    html.trim().toLowerCase().startsWith("<!doctype") ||
    html.trim().toLowerCase().startsWith("<html")
  ) {
    return html;
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;padding:16px}</style>
</head><body>${html}</body></html>`;
}

// ── computed ──────────────────────────────────────────────────────────

const allPeakWidgets = computed(() => {
  const item = peakWidgetItem.value;
  if (!item) return [];
  const payload = item.payload ?? {};

  // Shape B: payload.widgets[]
  if (Array.isArray(payload.widgets) && payload.widgets.length) {
    return payload.widgets
      .filter((w) => w?.html?.trim())
      .map((w) => {
        const enriched = injectSeriesData(
          w.html,
          w.data?.series ?? [],
          w.color,
        );
        return { ...w, _wrappedHtml: wrapHtml(enriched) };
      });
  }

  // Shape A: payload.html directly  ← your current case
  if (payload.html?.trim()) {
    const enriched = injectSeriesData(
      payload.html,
      payload.data?.series ?? [],
      payload.color,
    );
    return [{ ...payload, _wrappedHtml: wrapHtml(enriched) }];
  }

  return [];
});
const isReadAction = computed(() => {
  if (isPeakWidget.value) return false;
  return props?.data?.[0]?.action === "read";
});

// ── SPRINT CREATE ─────────────────────────────────────────────────────
const isSprintCreate = computed(() => {
  if (isPeakWidget.value) return false;
  const d = props?.data?.[0];
  return d?.action === "create" && d?.entity_type === "sprint";
});

const sprintCreatePayload = computed(() => props?.data?.[0]?.payload ?? {});

const sprintCreateCards = computed(() => sprintCreatePayload.value?.cards ?? []);

const selectedSprintCreateCards = ref([]);

const sprintCreateSelectAll = computed(() =>
  sprintCreateCards.value.length > 0 &&
  sprintCreateCards.value.every((card) =>
    selectedSprintCreateCards.value.includes(card._id || card.id || card.card_id)
  )
);

const toggleSprintCreateSelectAll = () => {
  if (sprintCreateSelectAll.value) {
    selectedSprintCreateCards.value = [];
  } else {
    selectedSprintCreateCards.value = sprintCreateCards.value.map(
      (card) => card._id || card.id || card.card_id
    );
  }
};

const toggleSprintCreateCard = (id) => {
  if (selectedSprintCreateCards.value.includes(id)) {
    selectedSprintCreateCards.value = selectedSprintCreateCards.value.filter((c) => c !== id);
  } else {
    selectedSprintCreateCards.value = [...selectedSprintCreateCards.value, id];
  }
};

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
    selectedReadCards.value.length === fetchedItems.value.length,
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

// ── SHEETS / CARDS ────────────────────────────────────────────────────
const sheetsPreview = computed(() => {
  if (isReadAction.value || isPeakWidget.value) return [];
  return (Array.isArray(props.data) ? props.data : [])
    .flatMap((item) => item.result?.sheets || [])
    .filter((sheet) => sheet?.variables?.["sheet-title"]);
});

const allCards = computed(() => {
  if (isReadAction.value || isPeakWidget.value) return [];
  return (Array.isArray(props.data) ? props.data : []).flatMap(
    (item) =>
      item.result?.sheets?.flatMap(
        (sheet) => sheet.items || sheet.cards || [],
      ) ?? [],
  );
});

const groupedCards = computed(() => {
  const result = {};
  for (const sheet of sheetsPreview.value) {
    result[sheet.variables["sheet-title"]] = allCards.value.filter(
      (c) => c.sheet_id === sheet._id,
    );
  }
  return result;
});

// ── Selection state ───────────────────────────────────────────────────
const selectedItems = ref([]);
const selectedCards = ref([]);

const getSheetCardIds = (sheetTitle) => {
  const sheet = sheetsPreview.value.find(
    (s) => s.variables["sheet-title"] === sheetTitle,
  );
  if (!sheet) return [];
  return allCards.value
    .filter((c) => c.sheet_id === sheet._id)
    .map((c) => c._id);
};

const selectAll = computed(() => {
  if (!sheetsPreview.value.length) return false;
  return (
    selectedItems.value.length === sheetsPreview.value.length &&
    (allCards.value.length === 0 ||
      selectedCards.value.length === allCards.value.length)
  );
});

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = [];
    selectedCards.value = [];
  } else {
    selectedItems.value = sheetsPreview.value.map(
      (s) => s.variables["sheet-title"],
    );
    selectedCards.value = allCards.value.map((c) => c._id);
  }
};

const toggleItem = (sheetTitle) => {
  const sheetCardIds = getSheetCardIds(sheetTitle);
  if (selectedItems.value.includes(sheetTitle)) {
    selectedItems.value = selectedItems.value.filter((s) => s !== sheetTitle);
    selectedCards.value = selectedCards.value.filter(
      (id) => !sheetCardIds.includes(id),
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
  if (isPeakWidget.value) {
    emit("accept", {
      action: "widget",
      workspace_id: peakWidgetItem.value?.workspace_id ?? null,
      widget: peakWidgetItem.value,
    });
    return;
  }

  // ── Sprint Create branch ──────────────────────────────────────────
  if (isSprintCreate.value) {
    const p = sprintCreatePayload.value;
    const selectedCards = sprintCreateCards.value.filter((card) =>
      selectedSprintCreateCards.value.includes(card._id || card.id || card.card_id)
    );
    emit("accept", {
      action: "create",
      workspace_id: p.workspace_id || props.data?.[0]?.workspace_id || null,
      sprint: {
        type: p.type || "create_sprint",
        title: p.title || "",
        description: p.description || "",
        goal: p.goal || "",
        sprintType: p.sprintType || "sprint",
        status: p.status || "planning",
        start_date: p.start_date || null,
        end_date: p.end_date || null,
        duration: p.duration || null,
        capacity: p.capacity || 0,
        tags: p.tags || [],
        workspace_module_id: p.workspace_module_id || null,
        parent_sprint_id: p.parent_sprint_id || null,
        cards: selectedCards.map((card) => ({
          card_id: card._id || card.id || card.card_id,
          priority: card.priority || card["card-priority"] || "medium",
          story_points: card["story-points"] || card.story_points || 0,
          estimated_hours: card.estimated_hours || 0,
          labels: card.labels || [],
        })),
      },
    });
    return;
  }

  if (isReadAction.value && isPlanModule.value) {
    const workspace_id = props.data?.[0]?.workspace_id || null;
    const selected = fetchedItems.value.filter((card) =>
      selectedSprintCards.value.includes(card._id || card.id)
    );

    if (route.path?.toLowerCase().includes("plan")) {
      const sprintMeta = props.data?.[0]?.sprint || {};
      emit("accept", {
        action: "read",
        workspace_id,
        sprint: {
          type: "create_sprint",
          title: sprintMeta.title || "Sprint 1",
          description: sprintMeta.description || "",
          goal: sprintMeta.goal || "",
          sprintType: sprintMeta.sprintType || "sprint",
          status: sprintMeta.status || "planning",
          start_date: sprintMeta.start_date || new Date().toISOString(),
          end_date: sprintMeta.end_date || null,
          duration: sprintMeta.duration || null,
          workspace_module_id: sprintMeta.workspace_module_id || props.data?.[0]?.module_id || null,
          parent_sprint_id: sprintMeta.parent_sprint_id || null,
          cards: selected.map((card) => ({
            card_id: card._id || card.id,
            priority: card.priority || card["card-priority"] || "medium",
            story_points: card["story-points"] || card.story_points || 0,
            estimated_hours: card.estimated_hours || 0,
            labels: card.labels || [],
          })),
        },
      });
    } else {
      emit("accept", { action: "read", workspace_id, cards: selected });
    }
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
        (s) => s.variables["sheet-title"] === sheetTitle,
      );
      if (!sheetObj) return null;
      const cardsForSheet = allCards.value.filter(
        (c) =>
          c.sheet_id === sheetObj._id && selectedCards.value.includes(c._id),
      );
      const items = cardsForSheet.map((card) => ({
        _id: card._id || null,
        workspace_lane_id: card.workspace_lane_id || null,
        variables: {
          title: card["card-title"] || card.variables?.["card-title"] || "",
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
        seat_id:
          Array.isArray(card.seat_id) && card.seat_id.length
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
        items,
      };
    })
    .filter(Boolean);

  emit("accept", { workspace_id, module, sheets, ispined: preserveLog.value });
};

// ── Assign / share helpers ────────────────────────────────────────────
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
          {
            property: "og:description",
            content: ogData.value.description || "",
          },
          {
            property: "og:url",
            content: ogData.value.url || window.location.href,
          },
          { property: "og:type", content: "website" },
          { property: "og:image", content: ogData.value.image || "" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: ogData.value.title || "" },
          {
            name: "twitter:description",
            content: ogData.value.description || "",
          },
          { name: "twitter:image", content: ogData.value.image || "" },
        ]
      : [],
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
  const code = details["card-code"] || "";
  const title = details["card-title"] || "";
  if (navigator.share) {
    try {
      await navigator.share({ title: `${code}: ${title}`, url: shareUrl });
    } catch (err) {
      if (err.name !== "AbortError") console.error("Share failed:", err);
    }
  } else {
    const description = details["card-description"] || "";
    const status = details["card-status"] || "";
    const priority = details["priority"] || "";
    const dueDate = details["end-date"] || "";
    const message = `📌 ${code}: ${title}\n\n${description}\n\n🟢 Status: ${status}\n🔥 Priority: ${priority}\n📅 Due: ${dueDate}\n\n🔗 ${shareUrl}`;
    await navigator.clipboard.writeText(message);
  }
}
function getPriorityColor(priority) {
  const map = {
    highest: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    lowest: '#6b7280',
  };

  return map[(priority || '').toLowerCase()] || 'var(--accent)';
}
// toggle sprint select cards
const selectedSprintCards = ref([])

const planSelectAll = computed(() =>
  fetchedItems.value.length > 0 &&
  fetchedItems.value.every((card) =>
    selectedSprintCards.value.includes(card._id || card.id)
  )
)

const togglePlanSelectAll = () => {
  if (planSelectAll.value) {
    selectedSprintCards.value = []
  } else {
    selectedSprintCards.value = fetchedItems.value.map((card) => card._id || card.id)
  }
}

const togglePlanCard = (id) => {
  if (selectedSprintCards.value.includes(id)) {
    selectedSprintCards.value = selectedSprintCards.value.filter((c) => c !== id)
  } else {
    selectedSprintCards.value = [...selectedSprintCards.value, id]
  }
}
// select all sprint cards
function toggleGlobalSprintCards() {
  if (globalSelectAllSprintCards.value) {
    // unselect all
    selectedSprintCreateCards.value = []
    globalSelectAllSprintCards.value = false
  } else {
    // select all
    selectedSprintCreateCards.value = sprintCreateCards.value.map(
      (card) => card._id || card.id || card.card_id
    )
    globalSelectAllSprintCards.value = true
  }
}
watch(
  () => selectedSprintCreateCards.value.length,
  (len) => {
    globalSelectAllSprintCards.value =
      len === sprintCreateCards.value.length && len > 0
  }
)
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