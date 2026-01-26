<template>
  <Transition name="panel" appear>
    <div
      v-show="showPanel"
      :class="[
        'flex flex-col h-full overflow-y-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] border border-orchit-white/5 overflow-hidden transition-all duration-300 ease-in-out',
        isExpanded
          ? 'min-w-full max-w-full'
          : 'min-w-full max-w-[380px] sm:min-w-[380px]',
      ]"
      role="complementary"
      aria-label="Details panel"
    >
      <div
        v-if="isPending && !cardDetails"
        class="flex flex-col gap-5 p-6 animate-pulse"
      >
        <div class="h-8 bg-orchit-white/10 rounded-xl w-3/4"></div>
        <div class="space-y-2">
          <div class="h-4 bg-orchit-white/10 rounded w-full"></div>
          <div class="h-4 bg-orchit-white/10 rounded w-5/6"></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="h-20 bg-orchit-white/10 rounded-xl"></div>
          <div class="h-20 bg-orchit-white/10 rounded-xl"></div>
        </div>
      </div>
      <div v-else>
        <!-- Header -->
        <div
          class="sticky top-0 z-10 border-b border-border px-4 sm:px-6 py-[9px] flex items-center justify-between bg-bg-card"
        >
          <h5 class="text-[18px] font-semibold tracking-tight">Details</h5>
          <div class="flex items-center gap-2">
            <button
              class="p-2 rounded-xl hover:bg-orchit-white/5 active:scale-[.98] cursor-pointer transition"
              @click="isExpanded = !isExpanded"
              :aria-label="isExpanded ? 'Collapse details' : 'Expand details'"
            >
              <i
                :class="[
                  'fa-solid',
                  isExpanded ? 'fa-compress' : 'fa-expand',
                  'text-lg',
                ]"
              ></i>
            </button>
            <button
              class="p-2 rounded-xl hover:bg-orchit-white/5 active:scale-[.98] cursor-pointer transition"
              @click="
                () => {
                  emit('close');
                  emit('closeSidePanel');
                }
              "
              aria-label="Close details"
            >
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>
        <!-- Body -->
        <div class="py-5 px-4 sm:px-6 flex flex-col gap-5 flex-grow">
          <!-- card type -->
          <template
            v-for="(item, index) in cardDetails?.variables"
            :key="item.slug || `var-${index}`"
          >
            <div
              v-if="item?.type === 'Select' && item.slug == 'card-type'"
              class="space-y-2 sm:col-span-1"
            >
              <div class="text-xs uppercase tracking-wider text-text-secondary">
                {{ item.title }}
              </div>
              <BaseSelectField
                :disabled="!canEditCard"
                size="sm"
                :options="item?.data.map((e: any) => ({ _id: e, title: e }))"
                placeholder="Select option"
                :allowCustom="false"
                :model-value="localVarValues[item.slug]"
                @update:modelValue="(val) => handleSelect(val, item.slug)"
              />
            </div>
          </template>
          <!-- Title row -->
          <div class="capitalize">
            <Transition name="fade-scale" mode="out-in">
              <input
                :disabled="!canEditCard"
                :title="
                  !canEditCard
                    ? 'You do not have permission to edit this card'
                    : ''
                "
                v-if="editingTitle"
                key="title-edit"
                ref="titleInput"
                v-model="localTitle"
                @keydown.enter.prevent="saveTitle"
                @keydown.esc.prevent="cancelEdit"
                class="w-full text-2xl font-semibold rounded-xl px-3 py-2 bg-orchit-white/5 border border-orchit-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
                type="text"
                aria-label="Edit title"
              />
              <h1
                v-else
                key="title-view"
                :class="canEditCard ? 'cursor-text' : 'cursor-not-allowed'"
                class="text-[20px] leading-[28px] font-semibold tracking-tight rounded-lg px-2 py-1 hover:bg-orchit-white/5 transition"
                @click="editTitle()"
                aria-label="Card title"
                :title="
                  !canEditCard
                    ? 'You do not have permission to edit this card'
                    : ''
                "
              >
                {{ localTitle || "Untitled" }}
              </h1>
            </Transition>
          </div>

          <!-- Description -->
          <div>
            <h3 class="mb-2 text-base font-semibold tracking-wide px-1">
              Description
            </h3>

            <Transition name="fade-scale" mode="out-in">
              <!-- view mode -->
              <div
                v-if="!editingDesc"
                key="desc-view"
                class="text-[15px] leading-6 text-text-secondary whitespace-pre-wrap rounded-xl px-4 py-3 border border-orchit-white/10 bg-orchit-white/5 hover:border-orchit-white/20 transition"
                :disabled="!canEditCard"
                :class="canEditCard ? 'cursor-text' : 'cursor-not-allowed'"
                @click="startEditDesc"
              >
                <div v-if="description" v-html="description"></div>
                <span v-else class="opacity-60"
                  >Click to add a description…</span
                >
              </div>

              <!-- edit mode -->
              <div
                v-else
                key="desc-edit"
                ref="descEditorWrap"
                class="rounded-xl overflow-hidden border border-orchit-white/10 shadow-sm"
              >
                <BaseRichTextEditor
                  v-model="description"
                  @focusOut="finishDescEdit"
                />
                
              </div>
            </Transition>
          </div>

          <!-- Tabs (segmented) -->
          <SwitchTab
            v-model="activeTab"
            :options="tabOptions"
            size="md"
            :beforeChange="handleTabPermission"
          />
          <!-- Sections -->
          <Transition name="section" mode="out-in">
            <!-- TAB: Details -->
            <section
              v-if="activeTab === 'details'"
              key="tab-details"
              class="space-y-6"
            >
              <!-- Meta tiles -->
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div
                  class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wider text-text-secondary"
                  >
                    Posted On
                  </div>
                  <div class="mt-1 font-medium">{{ dateISO }}</div>
                </div>
                <div
                  class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-4"
                >
                  <div
                    class="text-xs uppercase tracking-wider text-text-secondary"
                  >
                    ID
                  </div>
                  <div class="mt-1 font-medium">{{ details["card-code"] }}</div>
                </div>
              </div>

              <!-- Fields grid -->
              <div
                class="rounded-2xl border border-orchit-white/10 bg-orchit-white/5 p-4 grid grid-cols-1 gap-4"
              >
                <div class="space-y-2">
                  <div
                    class="text-xs uppercase tracking-wider text-text-secondary"
                  >
                    Lane
                  </div>
                  <BaseSelectField
                    :disabled="!canEditCard"
                    size="sm"
                    :options="laneOptions"
                    placeholder="Select lane"
                    :allowCustom="false"
                    :model-value="lane"
                    @update:modelValue="setLane"
                  />
                </div>
                <div class="space-y-2">
                  <div
                    class="text-xs uppercase tracking-wider text-text-secondary"
                  >
                    Assign
                  </div>
                  <AssigmentDropdown
                    :disabled="!canAssignCard"
                    @assign="(user) => assignHandle(user)"
                    :assigneeId="curentAssigne"
                    :seat="cardDetails.seat"
                  />
                </div>
                <template v-if="!pin">
                  <div class="space-y-2">
                    <div
                      class="text-xs uppercase tracking-wider text-text-secondary"
                    >
                      Start Date
                    </div>
                    <div
                      class="h-8 px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-orchit-white/10"
                    >
                      <i class="fa-regular fa-calendar"></i>
                      <DatePicker
                        :disabled="!canEditCard"
                        placeholder="Set start date"
                        class="w-full"
                        :model-value="form.startDate"
                        emit-as="ymd"
                        @update:modelValue="setStartDate"
                      />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div
                      class="text-xs uppercase tracking-wider text-text-secondary"
                    >
                      Target End
                    </div>
                    <div
                      class="h-8 px-3 flex items-center gap-2 rounded-lg bg-bg-input border transition-colors"
                      :class="
                        endDateError
                          ? 'border-red-500'
                          : 'border-orchit-white/10'
                      "
                    >
                      <i class="fa-regular fa-calendar"></i>
                      <DatePicker
                        :disabled="!canEditCard"
                        placeholder="Set end date"
                        class="w-full"
                        :model-value="form.endDate"
                        emit-as="ymd"
                        @update:modelValue="setEndDate"
                      />
                    </div>
                    <p v-if="endDateError" class="text-xs text-red-400 mt-1">
                      {{ endDateError }}
                    </p>
                  </div>
                </template>
                <template v-if="isPending">
                  <div
                    class="bg-bg-surface/40 w-full animate-pulse h-8 p-1"
                  ></div>
                  <div
                    class="bg-bg-surface/40 w-full animate-pulse h-8 p-1"
                  ></div>
                  <div
                    class="bg-bg-surface/40 w-full animate-pulse h-8 p-1"
                  ></div>
                  <div
                    class="bg-bg-surface/40 w-full animate-pulse h-6 p-1"
                  ></div>
                </template>
                
                <template
                  v-else-if="cardDetails?.variables"
                  v-for="(item, index) in cardDetails?.variables"
                  :key="item.slug || `var-${index}`"
                >
                  <div
                    v-if="item.type === 'Select' && item.slug !== 'card-type' && item.slug !=='ok' && item.slug !=='process'"
                    class="space-y-2 sm:col-span-1"
                  >
                    <div
                      class="text-xs uppercase tracking-wider text-text-secondary"
                    >
                      {{ item.title }}
                    </div>
                    <BaseSelectField
                      :disabled="!canEditCard"
                      size="sm"
                      :options="item?.data
                      .filter((e: any) => e !== 'ok' && e !== 'process')
                      .map((e: any) => ({ _id: e, title: e }))"
                      placeholder="Select option"
                      :allowCustom="false"
                      :model-value="localVarValues[item.slug]"
                      @update:modelValue="
                        (val: any) => handleSelect(val, item.slug)
                      "
                    />
                  </div>
                </template>
              </div>
            </section>
            <section v-else-if="activeTab === 'history'">
              <!-- History timeline -->
              <div>
                <h3 class="text-sm font-semibold tracking-wide mb-3">
                  History
                </h3>
                <ol
                  class="relative border-l border-orchit-white/10 pl-5 space-y-4 ml-1"
                >
                  <li
                    v-for="(h, i) in cardDetails?.history"
                    :key="i"
                    class="group"
                  >
                    <span
                      class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent/70 ring-4 ring-accent/10"
                    ></span>
                    <div
                      class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-3 hover:bg-orchit-white/7 transition"
                    >
                      <span class="font-semibold">{{
                        h.user.u_full_name
                      }}</span>
                      <span class="text-text-secondary"> changed </span>
                      <span class="font-semibold">{{ h.field_name }}</span>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            <!-- TAB: Comments -->
            <section
              v-else-if="activeTab === 'comments'"
              key="tab-comments"
              class="space-y-4"
            >
              <div
                v-for="c in comments ?? []"
                :key="c._id"
                class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 p-4 hover:bg-orchit-white/7 transition"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div
                    class="h-8 w-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold"
                  >
                    {{ initials(c.commented_by?.u_full_name) }}
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-medium">
                      {{ c.commented_by?.u_full_name }}
                    </div>
                    <div class="text-xs text-text-secondary">
                      {{ formatDateTime(c.created_at) }}
                    </div>
                  </div>
                  <div v-if="isMine(c)" class="flex items-center gap-2">
                    <button
                      v-if="editingId !== c._id"
                      :disabled="!canEditComment"
                      class="text-xs text-accent hover:underline"
                      @click="beginEdit(c)"
                    >
                      Edit
                    </button>
                    <button
                      :disabled="!canDeleteComment"
                      class="text-xs text-red-400 hover:underline"
                      @click="removeComment(c)"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <Transition name="fade" mode="out-in">
                  <p
                    v-if="editingId !== c._id"
                    :key="`c-view-${c._id}`"
                    class="text-[15px] leading-6"
                  >
                    {{ c.comment_text }}
                  </p>
                  <div v-else :key="`c-edit-${c._id}`" class="space-y-2">
                    <textarea
                      v-model="editText"
                      rows="3"
                      class="w-full p-3 rounded-lg bg-bg-input/80 border border-orchit-white/10 focus:ring-2 focus:ring-accent/40 outline-none"
                    />
                    <div class="flex items-center gap-2 justify-end">
                      <Button variant="secondary" size="sm" @click="cancelEdit"
                        >Cancel</Button
                      >
                      <Button
                        class="btn"
                        size="sm"
                        @click="saveEdit(c)"
                        :disabled="
                          !editText.trim() ||
                          isUpdatingComment ||
                          !canEditComment
                        "
                      >
                        {{ isUpdatingComment ? "Saving…" : "Save" }}
                      </Button>
                    </div>
                  </div>
                </Transition>

                <div
                  v-if="c?.attachments?.length"
                  class="mt-3 grid grid-cols-2 gap-2"
                >
                  <a
                    v-for="(file, index) in c.attachments"
                    :key="index"
                    :href="file.url"
                    target="_blank"
                    class="group flex items-center gap-2 rounded-lg border border-orchit-white/10 bg-orchit-white/5 px-2 py-1 hover:bg-orchit-white/10 transition"
                  >
                    <i
                      class="fa-regular fa-file text-text-secondary group-hover:text-text-primary transition"
                    ></i>
                    <span class="text-xs truncate">{{ file?.name }}</span>
                  </a>
                </div>
              </div>

              <!-- New comment -->
              <div
                class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 overflow-hidden"
              >
                <textarea
                  :disabled="!canCreateComment || !canEditComment"
                  v-model="newComment"
                  rows="3"
                  :class="
                    canCreateComment || canEditComment
                      ? 'cursor-text'
                      : 'cursor-not-allowed'
                  "
                  class="w-full p-3 bg-transparent outline-none text-sm"
                  placeholder="Write a comment"
                />
                <div
                  class="flex items-center w-full justify-between p-2 border-t border-orchit-white/10"
                >
                  <input
                    type="file"
                    multiple
                    @change="handleFileChange"
                    class="max-w-full text-ellipsis text-xs text-text-secondary file:mr-3 col-span-2 file:px-3 file:py-1.5 file:rounded-md file:border file:border-orchit-white/10 file:bg-orchit-white/10 hover:file:bg-orchit-white/15 file:text-text-primary transition inline w-fit"
                  />
                  <Button
                    variant="primary"
                    class="min-w-[70px]"
                    size="sm"
                    @click="postComment"
                    :disabled="
                      (!newComment.trim() && !commentAttachments.length) ||
                      !canCreateComment
                    "
                  >
                    {{ isPostingComment ? "Posting…" : "Post" }}
                  </Button>
                </div>
              </div>
            </section>

            <!-- TAB: Attachment -->
            <section v-else key="tab-attachments" class="space-y-3">
              <div class="text-xs text-text-secondary">
                Files attached to this {{ details?.type ?? "item" }}.
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div
                  v-for="file in attachments"
                  :key="file._id"
                  class="rounded-2xl overflow-hidden border border-orchit-white/10 bg-orchit-white/5 hover:bg-orchit-white/8 transition group"
                >
                  <div class="p-3">
                    <div
                      v-if="file.kind === 'image'"
                      class="rounded-lg overflow-hidden"
                    >
                      <img
                        :src="file.url"
                        class="w-full h-40 object-cover group-hover:scale-[1.02] transition"
                      />
                    </div>
                    <div
                      v-else-if="file.kind === 'video'"
                      class="rounded-lg overflow-hidden"
                    >
                      <video
                        :src="file.url"
                        controls
                        class="w-full h-40 object-cover"
                      ></video>
                    </div>
                    <div
                      v-else
                      class="h-40 rounded-lg bg-black/5 grid place-items-center"
                    >
                      <i
                        class="fa-regular fa-file text-3xl text-text-secondary"
                      ></i>
                    </div>
                    <div class="mt-3">
                      <div class="font-medium truncate">{{ file.name }}</div>
                      <div class="text-xs text-text-secondary capitalize">
                        {{ file.kind }}
                      </div>
                    </div>
                  </div>
                  <div class="p-3 pt-0">
                    <a
                      :href="file.url"
                      target="_blank"
                      rel="noopener"
                      class="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-accent text-orchit-white text-sm hover:opacity-90 transition"
                    >
                      <i class="fa-regular fa-arrow-up-right-from-square"></i>
                      View
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {
  computed,
  reactive,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  defineAsyncComponent,
} from "vue";
import { useLanes, useMoveCard } from "../../../queries/useSheets";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../../composables/useQueryParams";
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useProductCard,
} from "../../../queries/useProductCard";
import { useUserId } from "../../../services/user";
import { usePrivateUploadFile } from "../../../queries/useCommon";
import { useSidePanelStore } from "../../../stores/sidePanelStore";
const sidePanelStore = useSidePanelStore();
const BaseRichTextEditor = defineAsyncComponent({
  loader: () => import("../../../components/ui/BaseRichTextEditor.vue"),
  loadingComponent: {
    template:
      '<div class="h-20 w-full animate-pulse bg-neutral-700/30 rounded-lg"></div>',
  },
  delay: 200,
});
const BaseSelectField = defineAsyncComponent(
  () => import("../../../components/ui/BaseSelectField.vue"),
);
const DatePicker = defineAsyncComponent(() => import("./DatePicker.vue"));
const AssigmentDropdown = defineAsyncComponent(
  () => import("./AssigmentDropdown.vue"),
);
const Button = defineAsyncComponent(
  () => import("../../../components/ui/Button.vue"),
);
const SwitchTab = defineAsyncComponent(
  () => import("../../../components/ui/SwitchTab.vue"),
);

const isExpanded = ref(false);

import { usePermissions } from "../../../composables/usePermissions";
import { toast } from "vue-sonner";
const {
  canCreateComment,
  canEditComment,
  canViewComment,
  canDeleteComment,
  canEditCard,
  canViewAttachment,
  canAssignCard,
} = usePermissions();

const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();
const props = defineProps({
  pin: { type: Boolean, default: false },
  showPanel: { type: Boolean, default: true },
  details: { type: Object as () => any, default: () => ({}) },
});
const emit = defineEmits([
  "close",
  "closeSidePanel",
  "update:details",
  "comment:post",
  "priority:change",
  "ticketUpdated"
]);
const propsID = ref(props.details._id);
const {
  data: cardDetails,
  isPending,
  isFetching,
  refetch: refetchCardDetails,
} = useProductCard(propsID, {
  initialData: () => queryClient.getQueryData(["product-card", propsID.value]),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
});
console.log("card variables", cardDetails.value);

watch(props, () => {
  propsID.value = props.details._id;
});
watch(
  () => cardDetails.value,
  (card) => {
    console.log("card variables", cardDetails.value);
    if (!card) return;

    sidePanelStore.selectedCard = card;
    sidePanelStore.selectedCardTitle = card["card-title"];
    sidePanelStore.selectedCardId = card._id;
  },
  { immediate: true },
  
  
);
const activeTab = ref<"details" | "comments" | "attachment" | "history">(
  "details",
);
const tabOptions = [
  { label: "Details", value: "details" },
  { label: "Comments", value: "comments", disabled: canViewComment },
  { label: "History", value: "history" },
  { label: "Attachment", value: "attachment" },
];

const editingTitle = ref(false);
const localTitle = ref(
  cardDetails.value ? cardDetails.value["card-title"] : "",
);
const titleInput = ref<HTMLInputElement | null>(null);
function editTitle() {
  if (!canEditCard.value) return;

  sidePanelStore.saveTitle(localTitle.value);
  sidePanelStore.saveLocalId(cardDetails.value?._id);
  sidePanelStore.saveCardDetails(cardDetails.value);
  editingTitle.value = true;
  nextTick(() => titleInput.value?.focus());
}

watch(
  () => sidePanelStore.selectedCardTitle,
  (newTitle) => {
    if (!editingTitle.value && newTitle !== undefined) {
      localTitle.value = newTitle;
    }
  },
  { immediate: true },
);

function saveTitle() {
  const newTitle = localTitle.value.trim();
  if (!newTitle || newTitle === sidePanelStore.selectedCardTitle) {
    editingTitle.value = false;
    return;
  }

  moveCard.mutate({
    card_id: sidePanelStore.selectedCardId,
    variables: { "card-title": newTitle },
  });

  editingTitle.value = false;
}
const description = ref(
  cardDetails?.value ? cardDetails?.value["card-description"] : "",
);
watch(
  () => sidePanelStore.selectedCard?.["card-description"],
  (newDesc) => {
    if (
      newDesc &&
      sidePanelStore.selectedCard?._id === sidePanelStore.selectedCardId
    ) {
      sidePanelStore.selectedCard["card-description"] = newDesc;
      sidePanelStore.selectedCard = { ...sidePanelStore.selectedCard };
    }
  },
);
const editingDesc = ref(false);
const descEditorWrap = ref<HTMLElement | null>(null);

function focusProseMirror(container?: HTMLElement | null) {
  const pm = container?.querySelector?.(".ProseMirror") as HTMLElement | null;
  if (!pm) return;
  pm.focus();
  const sel = window.getSelection?.();
  const range = document.createRange();
  range.selectNodeContents(pm);
  range.collapse(false);
  sel?.removeAllRanges();
  sel?.addRange(range);
}
async function startEditDesc() {
  if (!canEditCard.value) return;
  editingDesc.value = true;
  await nextTick();
  focusProseMirror(descEditorWrap.value || undefined);
}
function finishDescEdit() {
  const newDescription = description.value?.trim();
  const prevDescription = cardDetails.value?.["card-description"] ?? "";

  if (!newDescription || newDescription === prevDescription) {
    editingDesc.value = false;
    return;
  }

  moveCard.mutate(
  {
    card_id: props.details._id,
    variables: { "card-description": newDescription },
  },
  {
    onSuccess: () => {
      emit("ticketUpdated", {
        cardId: props.details._id,
        updates: { "card-description": newDescription },
      });
    },
  }
);

  editingDesc.value = false;
}

function onDocMouseDown(e: MouseEvent) {
  if (!editingDesc.value) return;
  const target = e.target as Node;
  if (descEditorWrap.value?.contains(target)) return;
  finishDescEdit();
}
onMounted(() => document.addEventListener("mousedown", onDocMouseDown));
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onDocMouseDown),
);
const local = reactive({
  posted_on: props.details?.posted_on ?? props.details?.created_at ?? "",
});

const dateISO = computed({
  get: () =>
    local.posted_on ? new Date(local.posted_on).toISOString().slice(0, 10) : "",
  set: (v: string) => {
    local.posted_on = v ? new Date(v + "T00:00:00").toISOString() : "";
  },
});

const { data: lanes } = useLanes(workspaceId.value);
const lane = ref(
  cardDetails?.value ? cardDetails.value["workspace_lane_id"] : "",
);
watch([() => cardDetails.value, () => isFetching.value], () => {
  if (cardDetails?.value) {
    localTitle.value = cardDetails?.value["card-title"];
    description.value = cardDetails.value["card-description"];
    lane.value = cardDetails.value["workspace_lane_id"];
  }
});

const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  })),
);
function setLane(v: any) {
  lane.value = v;
  moveCard.mutate({
    card_id: props.details._id,
    workspace_lane_id: v,
  });
}
const form = ref<{ startDate: string | null; endDate: string | null }>({
  startDate: null,
  endDate: null,
});
watch(
  () => cardDetails.value,
  (v) => {
    form.value.startDate = v?.["start-date"] ?? null;
    form.value.endDate = v?.["end-date"] ?? null;
  },
  { immediate: true, deep: true },
);

const endDateError = computed(() =>
  form?.value.startDate &&
  form.value.endDate &&
  form.value.endDate < form.value.startDate
    ? "End date cannot be before start date"
    : "",
);
const setStartDate = (e: any) => {
  form.value.startDate = e ?? null;
  moveCard.mutate({
    card_id: props.details._id,
    variables: { "start-date": e },
  });
};

const setEndDate = (e: any) => {
  form.value.endDate = e ?? null;
  moveCard.mutate({
    card_id: props.details._id,
    variables: { "end-date": e },
  });
};
const curentAssigne = computed(() => cardDetails?.value.assigned_to);
const assignHandle = (user: any) => {
  moveCard.mutate({
    card_id: props.details._id,
    seat_id: user?._id,
    optimisticUser: user,
  });
};
const commentId = computed(() => props.details?._id);
const { data: commentsData } = useComments(commentId);
const comments = ref<any>(commentsData.value?.comments);
watch(
  () => commentsData.value,
  () => {
    comments.value = commentsData.value?.comments;
  },
);

const { mutate: createComment, isPending: isPostingComment } = useCreateComment(
  {
    onMutate: async (newCommentPayload: any) => {
      const cardId = props.details._id;
      await queryClient.cancelQueries({
        queryKey: ["product-comments", cardId],
      });
      await queryClient.cancelQueries({ queryKey: ["sheet-list"] });
      const previousComments = queryClient.getQueryData([
        "product-comments",
        cardId,
      ]);
      const previousLists = queryClient.getQueryData(["sheet-list"]);
      const optimisticComment = {
        _id: Date.now().toString(),
        comment_text: newCommentPayload.payload.comment_text,
        commented_by: { u_full_name: "You", _id: currentUserId.value },
        attachments: newCommentPayload.payload.attachments || [],
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(["product-comments", cardId], (old: any) => {
        return {
          ...old,
          comments: [...(old?.comments || []), optimisticComment],
        };
      });

      return { previousComments, previousLists };
    },
    onError: (err: any, variables: any, context: any) => {
      if (context?.previousComments)
        queryClient.setQueryData(
          ["product-comments", props.details._id],
          context.previousComments,
        );
      if (context?.previousLists)
        queryClient.setQueriesData(
          { queryKey: ["sheet-list"] },
          context.previousLists,
        );
      console.log(err, variables);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-comments", props.details._id],
      });
      queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
      queryClient.invalidateQueries({ queryKey: ["product-card"] });
    },
  },
);
const newComment = ref("");
const initials = (n?: string) =>
  (n ?? "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "";

const { data: currentUserId } = useUserId();
const isMine = (c: any) => c?.created_by?._id === currentUserId.value;

const editingId = ref<string | null>(null);
const editText = ref("");
const { mutate: updateComment, isPending: isUpdatingComment } =
  useUpdateComment({
    onSuccess: (updatedComment: any) => {
      const idx = comments.value.findIndex(
        (c: any) => c._id === updatedComment._id,
      );
      if (idx > -1) {
        comments.value[idx] = {
          ...comments.value[idx],
          comment_text: updatedComment.comment_text,
        };
      }
      editingId.value = null;
      editText.value = "";
      queryClient.invalidateQueries({ queryKey: ["product-card"] });
    },
  });

const { mutate: deleteComment } = useDeleteComment();

function beginEdit(c: any) {
  editingId.value = c._id;
  editText.value = c.comment_text ?? "";
}
function cancelEdit() {
  editingId.value = null;
  editText.value = "";
  editingTitle.value = false;
}
function saveEdit(c: any) {
  const text = editText.value.trim();
  if (!text) return;
  const idx = comments.value.findIndex((x: any) => x._id === c._id);
  const prev = idx > -1 ? { ...comments.value[idx] } : null;
  if (idx > -1)
    comments.value[idx] = { ...comments.value[idx], comment_text: text };
  updateComment(
    { id: c._id, payload: { comment_text: text } },
    {
      onError: () => {
        if (idx > -1 && prev) comments.value[idx] = prev;
      },
      onSuccess: (server: any) => {
        if (idx > -1) comments.value[idx] = server ?? comments.value[idx];
        cancelEdit();
        queryClient.invalidateQueries({ queryKey: ["product-card"] });
      },
    },
  );
}
function removeComment(c: any) {
  const idx = comments.value.findIndex((x: any) => x._id === c._id);
  const prev = idx > -1 ? comments.value[idx] : null;
  if (idx > -1) comments.value.splice(idx, 1);
  deleteComment(
    { id: c._id },
    {
      onError: () => {
        if (prev) comments.value.splice(idx, 0, prev);
      },
    },
  );
}
const attachments = computed(() => {
  return cardDetails.value?.attachments.map((f: any) => ({
    _id: f._id ?? f.id ?? crypto.randomUUID?.() ?? Math.random(),
    name: f.name ?? f.filename ?? "file",
    url: f.url,
    kind: (f.type ?? f.kind ?? "").toLowerCase().includes("image")
      ? "image"
      : (f.type ?? f.kind ?? "").toLowerCase().includes("video")
        ? "video"
        : "file",
  }));
});
const moveCard = useMoveCard({
  onMutate: async (newPayload: any) => {
    const { card_id, variables: updatedVariables } = newPayload;

    await queryClient.cancelQueries({ queryKey: ["product-card", card_id] });
    await queryClient.cancelQueries({ queryKey: ["sheet-list"] });

    const previousCard = queryClient.getQueryData(["product-card", card_id]);
    const previousLists = queryClient.getQueryData(["sheet-list"]);

    const updateCardLogic = (oldCard: any) => {
  if (!oldCard || oldCard._id !== card_id) return oldCard;

  const updatedCard = {
    ...oldCard,
    variables: Array.isArray(oldCard.variables)
      ? [...oldCard.variables]
      : [],
  };

  if (updatedVariables) {
    // existing behavior (keep this)
    Object.assign(updatedCard, updatedVariables);

    Object.entries(updatedVariables).forEach(([key, value]) => {
      // 1️⃣ variables array (sidebar)
      const idx = updatedCard.variables.findIndex(
        (v: any) => v.slug === key,
      );

      if (idx !== -1) {
        updatedCard.variables[idx] = {
          ...updatedCard.variables[idx],
          value,
        };
      } else {
        updatedCard.variables.push({ slug: key, value, type: "Text" });
      }
      if (key === "card-description") {
        // parent reads from flat object
        updatedCard["card-description"] = value;

        // ⚠️ if parent uses a different key, keep BOTH
        updatedCard.description = value;
      }
    });
  }

  if (newPayload.workspace_lane_id) {
    updatedCard.workspace_lane_id = newPayload.workspace_lane_id;
  }

  if (newPayload.optimisticUser) {
    updatedCard.seat = newPayload.optimisticUser;
    updatedCard.assigned_to = newPayload.optimisticUser;
  }

  return updatedCard;
};

    queryClient.setQueryData(["product-card", card_id], updateCardLogic);

    queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((column: any) => ({
        ...column,
        cards: column.cards?.map((card: any) =>
          card._id === card_id ? updateCardLogic(card) : card,
        ),
      }));
    });

    return { previousCard, previousLists };
  },
  onSuccess: (serverCard: any, variables: any) => {
    const cardId = variables.card_id;
    refetchCardDetails();
    // Update single card with authoritative server response
    if (serverCard) {
      queryClient.setQueryData(["product-card", cardId], serverCard);

      queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((column: any) => ({
          ...column,
          cards: column.cards?.map((card: any) =>
            card._id === cardId ? { ...card, ...serverCard } : card,
          ),
        }));
      });
      queryClient.invalidateQueries({
        queryKey: ["product-card", cardId],
      });
    }
  },
  onError: (_err: any, variables: any, context: any) => {
    if (!context) return;

    const cardId = variables.card_id;

    queryClient.setQueryData(["product-card", cardId], context.previousCard);
    queryClient.setQueriesData(
      { queryKey: ["sheet-list"] },
      context.previousLists,
    );
  },
  onSettled: (_data: any, _err: any, variables: any) => {
    const cardId = variables.card_id;

    queryClient.invalidateQueries({ queryKey: ["product-card", cardId] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
  },
});
const commentAttachments = ref<File[]>([]);
const { mutate: uploadFile } = usePrivateUploadFile({
  onSuccess: (data: any) => {
    commentAttachments.value = [data];
    queryClient.invalidateQueries({ queryKey: ["product-card"] });
  },
});
function handleFileChange(event: any) {
  const files = event.target.files;
  Array.from(files).forEach((file: any) => {
    const fd = new FormData();
    fd.append("file", file);
    uploadFile(fd);
  });
}
function postComment() {
  const comment_text = newComment.value.trim();
  if (!comment_text && !commentAttachments.value.length) return;

  const cardId = props.details._id;
  queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
    if (!Array.isArray(old)) return old;

    return old.map((column: any) => ({
      ...column,
      cards: column.cards.map((card: any) =>
        card._id === cardId
          ? {
              ...card,
              comment_count: (card.comment_count || 0) + 1,
            }
          : card,
      ),
    }));
  });
  createComment({
    id: cardId,
    payload: {
      comment_text,
      attachments: commentAttachments.value.map((file: any) => ({
        name: file.data.name,
        url: file.data.url,
      })),
    },
  });

  newComment.value = "";
  commentAttachments.value = [];
}

const localVarValues = reactive<Record<string, any>>({});
const initLocalVars = () => {
  if (cardDetails?.value?.variables) {
    const vars = cardDetails.value.variables ?? [];
    vars.forEach((v: any) => {
      if (!v || v.type !== "Select") return;
      const first =
        Array.isArray(v.data) && v.data.length
          ? (v.data[0]?.value ?? v.data[0]?._id ?? v.data[0])
          : undefined;
      localVarValues[v.slug] =
        v.value ?? localVarValues[v.slug] ?? first ?? null;
    });
  }
};

onMounted(initLocalVars);
watch(() => cardDetails.value, initLocalVars, { deep: true });

function handleSelect(val: any, slug: string) {
  localVarValues[slug] = val;
  const prev = (cardDetails.value?.variables ?? []).find(
    (v: any) => v.slug === slug,
  )?.value;
  if (prev === val) return;
  moveCard.mutate({
    card_id: props.details._id,
    variables: { [slug]: val },
  });
}

function handleTabPermission(targetTab: any) {
  if (targetTab === "comments" && !canViewComment.value) {
    toast.error("You do not have permission to view comments");
    return false;
  }
  if (targetTab === "attachment" && !canViewAttachment.value) {
    toast.error("You do not have permission to view attachments");
    return false;
  }
  return true;
}
</script>

<style scoped>
/* --- Transitions --- */
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.98);
  filter: blur(2px);
}

.panel-enter-active,
.panel-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    filter 200ms ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 140ms ease;
}

.section-enter-from,
.section-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.section-enter-active,
.section-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

/* Optional: thin scrollbar for this panel */
:global(.rich-scroll)::-webkit-scrollbar {
  width: 8px;
}

:global(.rich-scroll)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
}

:global(.rich-scroll)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.14);
}
</style>
