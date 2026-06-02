<template>
  <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" title="Task Details" class="!pt-0 hide-parent-close">


    <div v-if="isLoading || isFetching" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>

    <template v-else-if="cardDetails">
      <!-- <div
        class="sticky top-1 z-1 backdrop-blur border-b border-orchit-white/5 px-6 py-2 flex justify-between">
        <h5 id="modal-title" class="text-lg font-semibold tracking-tight">Task Details</h5>
        <button
            class="cursor-pointer right-4 text-text-secondary hover:text-text-primary text-xl"
            @click="closeModal"
          >
          <img src="../../../assets/icons/cross.svg"
          alt="">
        </button>

      </div> -->

      <div class="flex-1 overflow-y-auto py-6 px-6">
        <div class="flex flex-col gap-5">
          <div class="capitalize">
            <Transition name="fade-scale" mode="out-in">
              <input v-if="editingTitle" key="title-edit" ref="titleInput" v-model="localTitle" @blur="saveTitle"
                @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelEdit" class="w-full text-2xl font-semibold rounded-xl px-3 py-2 bg-orchit-white/5 border border-orchit-white/10
                             focus:outline-none focus:ring-2 focus:ring-accent/40 transition" type="text"
                aria-label="Edit title" />
              <h1 v-else key="title-view" class="text-2xl font-semibold tracking-tight rounded-lg px-2 py-1 transition cursor-text hover:bg-orchit-white/5"
                 @click="editTitle()" aria-label="Card title">
                {{ localTitle || 'Untitled' }}
              </h1>
            </Transition>
          </div>

          <div>
            <h3 class="mb-2 text-base font-semibold tracking-wide px-1">Description</h3>
            <Transition name="fade-scale" mode="out-in">
              <div v-if="!editingDesc" key="desc-view" class="text-[15px] leading-6 text-text-secondary whitespace-pre-wrap cursor-text
                             rounded-xl px-4 py-3 border border-orchit-white/10 bg-orchit-white/5
                             hover:border-orchit-white/20 transition" @click="startEditDesc">
                <div v-if="description" v-html="description"></div>
                <span v-else class="opacity-60">Click to add a description…</span>
              </div>
              <div v-else key="desc-edit" ref="descEditorWrap"
                class="rounded-xl overflow-hidden border border-orchit-white/10 shadow-sm">
                <BaseRichTextEditor v-model="description" @focusOut="finishDescEdit" />
              </div>
            </Transition>
          </div>

          <SwitchTab v-model="activeTab" :options="tabOptions" size="md" />

          <Transition name="section" mode="out-in">
            <section v-if="activeTab === 'details'" key="tab-details" class="space-y-6">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-4">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">Posted On</div>
                  <div class="mt-1 font-medium">{{ dateISO }}</div>
                </div>
                <div class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-4">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">ID</div>
                  <div class="mt-1 font-medium">{{ details['card-code'] }}</div>
                </div>
              </div>

              <div
                class="rounded-2xl border border-orchit-white/10 bg-orchit-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">Tab</div>
                   <BaseSelectField size="md" :options="laneOptions" placeholder="Select lane" :allowCustom="false"
                     :model-value="lane" @update:modelValue="setLane" :loading="isLanesLoading" />
                </div>
                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">Assign</div>
                  <AssigmentDropdown  :name="true" :workspaceId="cardDetails.workspace_id" @assign="assignHandle"
                    :assigneeId="curentAssigne" :seat="cardDetails?.seats || cardDetails?.seat" />
                </div>
                <template v-if="!pin">
                  <div class="space-y-2">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Start Date</div>
                    <div class="px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-orchit-white/10">
                      <i class="fa-regular fa-calendar"></i>
                      <DatePicker size="md" placeholder="Set start date" class="w-full" :model-value="form.startDate"
                        emit-as="ymd" @update:modelValue="setStartDate" :min-date="today" />
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Target End</div>
                    <div class="px-3 flex items-center gap-2 rounded-lg bg-bg-input border transition-colors"
                      :class="endDateError ? 'border-red-500' : 'border-orchit-white/10'">
                      <i class="fa-regular fa-calendar"></i>
                      <DatePicker  size="md" placeholder="Set end date" class="w-full" :model-value="form.endDate" emit-as="ymd"
                        @update:modelValue="setEndDate" :min-date="form.startDate || today" />
                    </div>
                    <p v-if="endDateError" class="text-xs text-red-400 mt-1">{{ endDateError }}</p>
                  </div>
                </template>
                <template v-if="cardDetails?.variables" v-for="(item, index) in cardDetails?.variables"
                          :key="item.slug || `var-${index}`">
                  <div
                    v-if="item?.type === 'Select' &&
                          item?.slug !== 'process' &&
                          item?.slug !== 'ok' &&
                          item?.slug !== 'resources'"
                    class="space-y-2 sm:col-span-1"
                  >
                    <div class="text-xs uppercase tracking-wider text-text-secondary">
                      {{ item.title }}
                    </div>

                    <BaseSelectField
                      size="md"
                      :options="
                        item?.data
                          .filter((e: string) => e !== 'process' && e !== 'ok' && e !== 'resources')
                          .map((e: string) => ({ _id: e, title: e }))
                      "
                      placeholder="Select option"
                      :allowCustom="false"
                      :model-value="localVarValues[item.slug]"
                      @update:modelValue="(val: any) => handleSelect(val, item.slug)"
                    />
                  </div>
                </template>
              </div>
            </section>

            <section v-else-if="activeTab === 'history'" key="tab-history">
              <div>
                <h3 class="text-sm font-semibold tracking-wide mb-3">History</h3>
                <ol v-if="details.history?.length" class="relative border-l border-orchit-white/10 pl-5 space-y-4 ml-1">
                  <li v-for="(h, i) in details.history" :key="i" class="group">
                    <span
                      class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent/70 ring-4 ring-accent/10"></span>
                    <div
                      class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-3 hover:bg-orchit-white/7 transition">
                      <span class="font-semibold">{{ h.user.u_full_name }}</span>
                      <span class="text-text-secondary"> changed </span>
                      <span class="font-semibold">{{ h.field_name }}</span>
                    </div>
                  </li>
                </ol>
                <div
                  v-else
                  class="py-10 flex flex-col items-center justify-center border border-dashed border-orchit-white/10 rounded-2xl bg-orchit-white/2"
                >
                  <div class="w-14 h-14 rounded-xl bg-orchit-white/5 flex items-center justify-center mb-3">
                    <i class="fa-regular fa-clock-rotate-left text-xl text-text-secondary opacity-50"></i>
                  </div>
                  <div class="text-sm font-medium text-text-primary">No history yet</div>
                  <div class="text-xs text-text-secondary mt-1">Task activity will appear here</div>
                </div>
              </div>
            </section>

            <section v-else-if="activeTab === 'comments'" key="tab-comments" class="space-y-4">
              <div v-for="c in (comments ?? [])" :key="c._id"
                class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 p-4 hover:bg-orchit-white/7 transition">
                <div class="flex items-center gap-3 mb-2">
                  <div
                    class="h-8 w-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                    {{ initials(c.created_by?.u_full_name || c.commented_by?.u_full_name) }}
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-medium">{{ c.created_by?.u_full_name || c.commented_by?.u_full_name }}</div>
                    <div class="text-xs text-text-secondary">{{ formatDateTime(c.created_at) }}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button v-if="editingId !== c._id" class="text-xs text-accent hover:underline"
                      @click="beginEdit(c)">Edit</button>
                    <button class="text-xs text-red-400 hover:underline" @click="removeComment(c)">Delete</button>
                  </div>
                </div>
                <Transition name="fade" mode="out-in">
                  <p
                    v-if="editingId !== c._id"
                    :key="`c-view-${c._id}`"
                    class="text-[15px] leading-6"
                    v-html="renderMentions(c.comment_text)"
                  ></p>
                  <div v-else :key="`c-edit-${c._id}`" class="space-y-2">
                    <div class="relative w-full">
                      <div
                        :ref="(el) => { if (el) overlays[c._id] = el as HTMLElement }"
                        class="absolute inset-0 pointer-events-none p-3 whitespace-pre-wrap break-words overflow-hidden text-sm z-10 leading-normal font-sans"
                        aria-hidden="true"
                        style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.5; letter-spacing: normal; font-weight: 400; -webkit-font-smoothing: antialiased;"
                        v-html="formatOverlay(editText)"
                      ></div>
                      <textarea
                        :ref="(el) => { if (el) editCommentTextareas[c._id] = el as HTMLTextAreaElement }"
                        v-model="editText"
                        rows="3"
                        spellcheck="false"
                        @scroll="(e) => syncScroll(e, c._id)"
                        @input="(e) => handleCommentInput(e, c._id)"
                        @keydown="(e) => handleCommentKeydown(e, c._id)"
                        @blur="handleCommentBlur"
                        class="relative z-0 w-full p-3 rounded-lg bg-bg-input/80 border border-orchit-white/10 focus:ring-2 focus:ring-accent/40 outline-none text-sm leading-normal resize-none text-transparent caret-text-primary font-sans"
                        style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.5; letter-spacing: normal; font-weight: 400; -webkit-font-smoothing: antialiased;"
                      />
                    </div>
                    <div class="flex items-center gap-2 justify-end">
                      <Button variant="secondary" size="sm" @click="cancelEdit">Cancel</Button>
                      <Button class="btn" size="sm" @click="saveEdit(c)"
                        :disabled="!editText.trim() || isUpdatingComment">
                        {{ isUpdatingComment ? 'Saving…' : 'Save' }}
                      </Button>
                    </div>
                  </div>
                </Transition>
                <div
                  v-if="
                    (editingId === c._id ? editAttachments : c.attachments)?.length
                  "
                  class="mt-3 grid grid-cols-2 gap-2"
                >
                  <a
                    v-for="(file, index) in editingId === c._id ? editAttachments : c.attachments"
                    :key="index"
                    :href="file.url"
                    target="_blank"
                    class="group relative flex items-center gap-2 rounded-lg border border-orchit-white/10 bg-orchit-white/5 px-2 py-1 hover:bg-orchit-white/10 transition"
                  >
                    <div
                      v-if="file.name?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)"
                      class="w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-orchit-white/10"
                    >
                      <img :src="file.url" class="w-full h-full object-cover" />
                    </div>
                    <i
                      v-else-if="file.name?.match(/\.pdf$/i)"
                      class="fa-regular fa-file-pdf text-[11px] text-red-400"
                    ></i>
                    <i
                      v-else-if="file.name?.match(/\.(doc|docx)$/i)"
                      class="fa-regular fa-file-word text-[11px] text-blue-400"
                    ></i>
                    <i
                      v-else
                      class="fa-regular fa-file text-text-secondary group-hover:text-text-primary transition"
                    ></i>
                    <span class="text-xs truncate">{{ file?.name }}</span>
                    <button
                      v-if="editingId === c._id"
                      @click.prevent="removeEditAttachment(Number(index))"
                      class="text-red-400 hover:text-red-500 p-1 transition-colors ml-auto"
                      title="Remove attachment"
                    >
                      <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </a>
                </div>
              </div>

              <div class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 overflow-hidden">
                <div class="relative">
                  <div
                    :ref="(el) => { if (el) overlays['new'] = el as HTMLElement }"
                    class="absolute inset-0 pointer-events-none p-3 whitespace-pre-wrap break-words overflow-hidden text-sm z-10 leading-normal font-sans"
                    aria-hidden="true"
                    style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.5; letter-spacing: normal; font-weight: 400; -webkit-font-smoothing: antialiased;"
                    v-html="formatOverlay(newComment)"
                  ></div>
                  <textarea
                    ref="commentTextarea"
                    v-model="newComment"
                    rows="3"
                    spellcheck="false"
                    @scroll="(e) => syncScroll(e, 'new')"
                    @input="(e) => handleCommentInput(e, 'new')"
                    @keydown="(e) => handleCommentKeydown(e, 'new')"
                    @blur="handleCommentBlur"
                    class="relative z-0 w-full p-3 bg-transparent outline-none text-sm leading-normal resize-none text-transparent caret-text-primary font-sans"
                    style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.5; letter-spacing: normal; font-weight: 400; -webkit-font-smoothing: antialiased;"
                    placeholder="Write a comment"
                  />
                </div>
                <div
                  v-if="commentAttachments.length"
                  class="flex flex-wrap gap-2 p-2 px-3 border-t border-orchit-white/10 bg-orchit-white/2"
                >
                  <div
                    v-for="file in commentAttachments"
                    :key="file.id"
                    class="group flex items-center gap-2 px-2 py-1 rounded-lg bg-orchit-white/5 border border-orchit-white/10 text-[11px] text-text-secondary transition-all hover:border-orchit-white/20"
                  >
                    <div
                      v-if="(file.previewUrl || file.data?.url) && file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)"
                      class="w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-orchit-white/10"
                    >
                      <img :src="file.previewUrl || file.data?.url" class="w-full h-full object-cover" />
                    </div>
                    <i v-else-if="file.name.match(/\.pdf$/i)" class="fa-regular fa-file-pdf text-[10px] text-red-400"></i>
                    <i v-else-if="file.name.match(/\.(doc|docx)$/i)" class="fa-regular fa-file-word text-[10px] text-blue-400"></i>
                    <i v-else class="fa-regular fa-file text-[10px]"></i>
                    <span class="truncate max-w-[120px]">{{ file.name }}</span>
                    <i v-if="file.loading" class="fa-solid fa-spinner animate-spin text-[10px] text-accent"></i>
                    <button
                      v-else
                      @click="removeAttachment(file.id)"
                      class="hover:text-red-400 transition-colors p-0.5"
                      title="Remove attachment"
                    >
                      <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between p-2 border-t border-orchit-white/10">
                  <input
                    ref="fileInput"
                    type="file"
                    multiple
                    @change="handleFileChange"
                    class="text-ellipsis text-xs text-transparent file:mr-3 col-span-2 file:px-3 file:py-1.5 file:rounded-md file:border file:border-orchit-white/10 file:bg-orchit-white/10 hover:file:bg-orchit-white/15 file:text-text-primary transition inline-flex file:cursor-pointer max-w-[150px]"
                  />
                  <Button variant="primary" size="sm" @click="postComment"
                    :disabled="!newComment.trim() && !commentAttachments.length">
                    {{ isPostingComment ? 'Posting…' : 'Post' }}
                  </Button>
                </div>
              </div>
            </section>

            <section v-else key="tab-attachments" class="space-y-6">
              <div class="flex items-center justify-between">
                <div
                  class="text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  Files attached to this {{ details?.type ?? "item" }}
                </div>
                <div
                  class="text-[11px] text-text-secondary bg-orchit-white/5 px-2 py-0.5 rounded-full border border-border"
                >
                  {{ attachments.length }} files
                </div>
              </div>

              <div
                v-if="attachments.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div
                  v-for="file in attachments"
                  :key="file._id"
                  class="group relative flex flex-col rounded-xl border border-border bg-orchit-white/5 hover:bg-orchit-white/8 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                >
                  <div
                    class="aspect-[16/10] w-full relative rounded-t-xl overflow-hidden bg-bg-surface"
                  >
                    <img
                      v-if="file.kind === 'image'"
                      :src="file.url"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <video
                      v-else-if="file.kind === 'video'"
                      :src="file.url"
                      class="w-full h-full object-cover"
                    ></video>
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center bg-bg-surface"
                    >
                      <div class="relative">
                        <i
                          v-if="file.name.match(/\.pdf$/i)"
                          class="fa-regular fa-file-pdf text-4xl text-red-400 opacity-80"
                        ></i>
                        <i
                          v-else-if="file.name.match(/\.(doc|docx)$/i)"
                          class="fa-regular fa-file-word text-4xl text-blue-400 opacity-80"
                        ></i>
                        <i
                          v-else-if="file.name.match(/\.(xls|xlsx)$/i)"
                          class="fa-regular fa-file-excel text-4xl text-green-400 opacity-80"
                        ></i>
                        <i
                          v-else
                          class="fa-regular fa-file-lines text-4xl text-text-secondary opacity-60"
                        ></i>
                      </div>
                    </div>

                    <div
                      class="absolute top-3 left-3 px-2 py-1 bg-bg-body backdrop-blur-md rounded-lg text-[9px] font-bold text-text-primary uppercase tracking-tighter border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {{ file.kind }}
                    </div>
                  </div>

                  <div class="p-3.5 flex flex-col flex-1 min-w-0">
                    <div
                      class="font-medium text-sm text-text-primary truncate mb-1"
                      :title="file.name"
                    >
                      {{ file.name }}
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-2">
                      <div class="flex flex-col gap-0.5 min-w-0">
                        <span
                          v-if="file.author"
                          class="text-[10px] text-text-secondary truncate opacity-80"
                        >
                          By {{ file.author }}
                        </span>
                        <span
                          v-if="file.date"
                          class="text-[9px] text-text-secondary opacity-60"
                        >
                          {{ new Date(file.date).toLocaleDateString() }}
                        </span>
                      </div>
                      <a
                        :href="file.url"
                        target="_blank"
                        rel="noopener"
                        class="flex items-center justify-center w-8 h-8 rounded-[6px] bg-primary-color/10 hover:bg-primary-color text-primary-color hover:text-white transition-all duration-200 border border-primary-color/20"
                        title="View Full File"
                      >
                        <i class="fa-regular fa-external-link text-xs"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-3xl bg-orchit-white/2"
              >
                <div
                  class="w-16 h-16 rounded-2xl bg-orchit-white/5 flex items-center justify-center mb-4"
                >
                  <i
                    class="fa-regular fa-folder-open text-2xl text-text-secondary opacity-40"
                  ></i>
                </div>
                <div class="text-sm font-medium text-text-primary">
                  No attachments found
                </div>
                <div class="text-xs text-text-secondary mt-1">
                  Files from comments will appear here
                </div>
              </div>
            </section>
          </Transition>
        </div>
      </div>
    </template>


  </BaseModal>
  <teleport to="body">
    <div
      v-if="mentionContext.active"
      ref="mentionMenuRef"
      class="z-[9999] fixed rounded-md border border-orchit-white/10 bg-bg-dropdown shadow-xl w-60 py-1"
      :style="mentionStyles"
      @mousedown.prevent
    >
      <ul class="max-h-60 overflow-auto">
        <li
          v-for="(u, idx) in filteredMentionUsers"
          :key="u._id || idx"
          @mousedown.prevent="insertMention(u)"
          @mouseenter="mentionContext.selectedIndex = Number(idx)"
          :class="[
            'flex items-center gap-3 px-3 py-2 cursor-pointer transition min-w-0',
            mentionContext.selectedIndex === Number(idx)
              ? 'bg-bg-dropdown-menu-hover'
              : 'hover:bg-bg-dropdown-menu-hover',
          ]"
        >
          <div class="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-semibold">
            {{ initials(u.u_full_name || u.name || u.title) }}
          </div>
          <div class="text-xs font-medium truncate flex-1">
            {{ u.u_full_name || u.name || u.title }}
          </div>
        </li>
        <li
          @mousedown.prevent="mentionContext.active = false"
          :class="[
            'flex items-center gap-3 px-3 py-2 transition border-t border-orchit-white/10 mt-1',
          ]"
        >
          <div class="h-6 w-6 rounded-full bg-accent/15 text-accent flex items-center justify-center">
            <i class="fa-solid fa-at text-[10px]"></i>
          </div>
          <div class="text-[11px] text-text-secondary">Type to filter workspace users</div>
        </li>
      </ul>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import { useLanes, useMoveCard } from '../../../queries/useSheets'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import DatePicker from '../../../views/Product/components/DatePicker.vue'
import AssigmentDropdown from '../../../views/Product/components/AssigmentDropdown.vue'
import { useQueryClient } from '@tanstack/vue-query'
// import { useRouteIds } from '../../../composables/useQueryParams'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment, useProductCard } from '../../../queries/useProductCard'
import Button from '../../../components/ui/Button.vue'
import { usePrivateUploadFile } from '../../../queries/useCommon'
import SwitchTab from '../../../components/ui/SwitchTab.vue'
import { toast } from 'vue-sonner'
import { useWorkspacesRoles } from '../../../queries/useWorkspace'
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom'


// const { workspaceId } = useRouteIds()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cardId: { type: String, default: '' },
  pin: { type: Boolean, default: false }
})


const emit = defineEmits(['update:modelValue', 'close'])
const card_Id = ref(props.cardId);

const { data: cardDetails, isLoading, isFetching, refetch } = useProductCard(card_Id)

const details = computed(() => cardDetails.value || {})

const activeTab = ref<'details' | 'comments' | 'attachment' | 'history'>('details')
const tabOptions = [
  { label: 'Details', value: 'details' },
  { label: 'Comments', value: 'comments' },
  { label: 'History', value: 'history' },
  { label: 'Attachment', value: 'attachment' },
]

const editingTitle = ref(false)
const localTitle = ref('')
watch(() => details.value?.['card-title'], (val) => { localTitle.value = val || '' }, { immediate: true })

const titleInput = ref<HTMLInputElement | null>(null)
function editTitle() {
  editingTitle.value = true
  nextTick(() => { titleInput.value?.focus(); titleInput.value?.select() })
}

function saveTitle() { 
  if (!localTitle.value.trim()) localTitle.value = details.value?.['card-title'] ?? ''
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, variables: { 'card-title': localTitle.value.trim() } })
  }
  editingTitle.value = false
}

const description = ref('')
watch(() => details.value?.['card-description'], (val) => { description.value = val || '' }, { immediate: true })

const editingDesc = ref(false)
const descEditorWrap = ref<HTMLElement | null>(null)

function focusProseMirror(container?: HTMLElement | null) {
  const pm = container?.querySelector?.('.ProseMirror') as HTMLElement | null
  if (!pm) return
  pm.focus()
  const sel = window.getSelection?.()
  const range = document.createRange()
  range.selectNodeContents(pm)
  range.collapse(false)
  sel?.removeAllRanges()
  sel?.addRange(range)
}

async function startEditDesc() {
  editingDesc.value = true
  await nextTick()
  focusProseMirror(descEditorWrap.value || undefined)
}

function finishDescEdit(attachmentsFromEditor?: any[]) {
  if (details.value._id) {
    moveCard.mutate({
      card_id: details.value._id,
      attachments: attachmentsFromEditor ?? [],
      variables: { 'card-description': description.value }
    })
  }
  editingDesc.value = false
}

function onDocMouseDown(e: MouseEvent) {
  if (!editingDesc.value) return
  const target = e.target as Node
  if (descEditorWrap.value?.contains(target)) return
  finishDescEdit()
}

onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))

const local = reactive({
  posted_on: '',
})
const ws_id = ref('')

watch(() => details.value, (val) => {
  if (val) {
    local.posted_on = val.posted_on ?? val.created_at ?? new Date().toISOString()
    ws_id.value = val?.workspace_id
  }
}, { immediate: true })

const dateISO = computed({
  get: () => local.posted_on ? new Date(local.posted_on).toISOString().slice(0, 10) : '',
  set: (v: string) => { local.posted_on = new Date(v + 'T00:00:00').toISOString() }
})
const { data: lanes, isPending: isLanesLoading } = useLanes(computed(() => cardDetails.value?.workspace_id))
const lane = ref( 
  cardDetails?.value ? cardDetails.value["workspace_lane_id"] : "Main",
);

watch(() => cardDetails.value, (newCard) => {
  lane.value = newCard?.workspace_lane_id || 'Main';
}, { immediate: true });
 

const mainLaneOption = {
  _id: 'Main',
  title: 'Main',
};
const laneOptions = computed<any[]>(() => {
  const dynamicOptions =
    (lanes?.value ?? []).map((el: any) => ({
      _id: el._id,
      title: el?.variables?.['lane-title'] ?? String(el._id),
    }));

  return [mainLaneOption, ...dynamicOptions];
});

function setLane(v: any) { 
  lane.value = v
  // If Main is selected, do not call API
  if (v === "Main") return;
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, 'workspace_lane_id': v })
  }
}

const form = ref<any>({ startDate: null, endDate: null })
watch(() => [details.value?.['start-date'], details.value?.['end-date']], ([start, end]) => {
  form.value = { startDate: start || null, endDate: end || null }
}, { immediate: true })

const endDateError = computed(() =>
  (form?.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate)
    ? 'End date cannot be before start date'
    : ''
)

const today = new Date().toISOString().split('T')[0]
const setStartDate = (e: any) => { 
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, variables: { 'start-date': e } })
  }
}

const setEndDate = (e: any) => { 
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, variables: { 'end-date': e } })
  }
}

const curentAssigne = computed(() => details.value?.seat_id || details.value?.assigned_to)
const assignHandle = (users: any[]) => {
  if (details.value._id) {
    const seat_ids = Array.isArray(users) ? users.map(u => u?._id || u?.id).filter(Boolean) : []
    moveCard.mutate({ card_id: details.value._id, seat_id: seat_ids })
  }
}

const comments = ref<any>([])
const commentId = computed(() => props.cardId)
const { data: commentsData, refetch: refetchComments } = useComments(commentId, {
  enabled: computed(() => !!props.cardId && props.modelValue)
})
watch(() => commentsData.value, (val) => { 
  comments.value = val?.comments || [] 
}, { immediate: true })

const { mutate: createComment, isPending: isPostingComment } = useCreateComment({
  onSuccess: (data: any) => {
    newComment.value = ''
    commentAttachments.value = []
    currentMentions.value = []
    if (fileInput.value) fileInput.value.value = ''
    comments.value = [...comments.value, data]
    queryClient.invalidateQueries({ queryKey: ["comments", commentId.value] })
    toast.success('Comment posted successfully')
  },
  onError: (err: any) => {
    console.error('Failed to post comment:', err)
    toast.error('Failed to post comment')
  }
})

const newComment = ref('')
const initials = (n?: string) => (n ?? '').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const formatDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString() : ''
const fileInput = ref<HTMLInputElement | null>(null)
const commentTextarea = ref<HTMLTextAreaElement | null>(null)
const editCommentTextareas = ref<Record<string, HTMLTextAreaElement>>({})
const overlays = ref<Record<string, HTMLElement>>({})
const mentionMenuRef = ref<HTMLElement | null>(null)
const mentionStyles = ref<any>({
  position: 'fixed',
  top: '-999px',
  left: '-999px',
})
const mentionContext = ref<{
  active: boolean
  query: string
  selectedIndex: number
  startIndex: number
  targetType: string
}>({
  active: false,
  query: '',
  selectedIndex: 0,
  startIndex: -1,
  targetType: 'new',
})
const currentMentions = ref<any[]>([])
let cleanupMention: (() => void) | null = null
const { data: workspaceRoles } = useWorkspacesRoles(computed(() => details.value?.workspace_id))
const filteredMentionUsers = computed(() => {
  if (!workspaceRoles.value) return []
  const q = mentionContext.value.query.toLowerCase().trim()
  if (!q) return workspaceRoles.value
  return workspaceRoles.value.filter((u: any) => {
    const name = u.title || u.name || u.u_full_name || ''
    const email = u.email || ''
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
  })
})

const editingId = ref<string | null>(null)
const editText = ref('')
const editAttachments = ref<any[]>([])
const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment()
const { mutate: deleteComment } = useDeleteComment()

function beginEdit(c: any) {
  editingId.value = c._id
  currentMentions.value = []
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const rawText = c.comment_text ?? ''
  let match
  while ((match = mentionRegex.exec(rawText)) !== null) {
    const [, name, id] = match
    const user = workspaceRoles.value?.find((u: any) => u._id === id || u.id === id)
    currentMentions.value.push({ name, id, email: user?.email || '' })
  }
  editText.value = rawText.replace(mentionRegex, '@$1')
  editAttachments.value = [...(c.attachments || [])]
}

function syncScroll(e: Event, type: string) {
  const target = e.target as HTMLTextAreaElement
  const overlay = overlays.value[type]
  if (overlay) {
    overlay.scrollTop = target.scrollTop
    overlay.scrollLeft = target.scrollLeft
  }
}
function cancelEdit() {
  editingId.value = null
  editText.value = ''
  editAttachments.value = []
  editingTitle.value = false
}

function removeEditAttachment(index: number) {
  editAttachments.value.splice(index, 1)
}
watch(
  () => mentionContext.value.active,
  (val) => {
    if (!val && cleanupMention) {
      cleanupMention()
      cleanupMention = null
    }
  },
)

function renderMentions(text: string) {
  if (!text) return ''
  return text.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="mention-highlight">@$1</span>',
  )
}

function formatOverlay(text: string) {
  if (!text) return ''
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const users = workspaceRoles.value || []
  const userNames = users
    .flatMap((u: any) => [u.u_full_name, u.name, u.title])
    .filter(Boolean) as string[]

  if (userNames.length === 0) {
    return `<div class="text-text-primary whitespace-pre-wrap break-words">${escapedText.replace(/@([a-zA-Z0-9_.-]+)/g, '<strong class="mention-highlight">@$1</strong>')}</div>`
  }

  userNames.sort((a, b) => b.length - a.length)
  const escapedNames = [...new Set(userNames)].map((n: string) =>
    n.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
  )
  const regex = new RegExp(
    `@(${escapedNames.join('|')}|[a-zA-Z0-9_.-]+)(?=\\s|[.,!?]|$)`,
    'gi',
  )
  const formatted = escapedText.replace(
    regex,
    (match) => `<strong class="mention-highlight">${match}</strong>`,
  )

  return `<div class="text-text-primary whitespace-pre-wrap break-words">${formatted}</div>`
}

function updateMentionPosition(textarea: HTMLTextAreaElement) {
  if (cleanupMention) {
    cleanupMention()
    cleanupMention = null
  }
  const virtualElement = {
    getBoundingClientRect() {
      const rect = textarea.getBoundingClientRect()
      const div = document.createElement('div')
      const computedStyle = window.getComputedStyle(textarea)
      for (const prop of Array.from(computedStyle)) {
        div.style.setProperty(prop, computedStyle.getPropertyValue(prop))
      }
      div.style.position = 'absolute'
      div.style.visibility = 'hidden'
      div.style.whiteSpace = 'pre-wrap'
      div.style.wordWrap = 'break-word'
      div.style.width = computedStyle.width
      div.textContent = textarea.value.substring(0, textarea.selectionStart)
      const span = document.createElement('span')
      span.textContent = '.'
      div.appendChild(span)
      document.body.appendChild(div)
      const spanTop = span.offsetTop
      const spanLeft = span.offsetLeft
      document.body.removeChild(div)
      const top = rect.top + spanTop - textarea.scrollTop
      const left = rect.left + spanLeft - textarea.scrollLeft
      return {
        width: 0,
        height: 18,
        top,
        left,
        right: left,
        bottom: top + 18,
        x: left,
        y: top,
      } as DOMRect
    },
  }
  nextTick(() => {
    if (mentionMenuRef.value) {
      cleanupMention = autoUpdate(virtualElement, mentionMenuRef.value as HTMLElement, () => {
        if (!mentionMenuRef.value) return
        computePosition(virtualElement, mentionMenuRef.value as HTMLElement, {
          placement: 'bottom-start',
          strategy: 'fixed',
          middleware: [offset(6), flip(), shift({ padding: 10 })],
        }).then(({ x, y }) => {
          mentionStyles.value = { position: 'fixed', left: `${x}px`, top: `${y}px` }
        })
      })
    }
  })
}

function handleCommentInput(e: Event, type: string) {
  const target = e.target as HTMLTextAreaElement
  const val = target.value
  const cursor = target.selectionStart
  const textBeforeCursor = val.slice(0, cursor)
  const atIndex = textBeforeCursor.lastIndexOf('@')
  if (atIndex !== -1) {
    const textAfterAt = textBeforeCursor.slice(atIndex + 1)
    if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : null
      if (atIndex === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') {
        mentionContext.value.active = true
        mentionContext.value.query = textAfterAt
        mentionContext.value.startIndex = atIndex
        mentionContext.value.targetType = type
        mentionContext.value.selectedIndex = 0
        updateMentionPosition(target)
        return
      }
    }
  }
  mentionContext.value.active = false
}

function insertMention(user: any) {
  const name = user.u_full_name || user.name || user.title
  let currentVal = ''
  let targetElement: HTMLTextAreaElement | null = null
  if (mentionContext.value.targetType === 'new') {
    currentVal = newComment.value
    targetElement = commentTextarea.value
  } else {
    currentVal = editText.value
    targetElement = editCommentTextareas.value[mentionContext.value.targetType] || null
  }
  if (!targetElement) return
  const before = currentVal.slice(0, mentionContext.value.startIndex)
  const after = currentVal.slice(targetElement.selectionStart)
  const newVal = `${before}@${name} ${after}`
  if (mentionContext.value.targetType === 'new') newComment.value = newVal
  else editText.value = newVal
  currentMentions.value.push({ name, id: user._id, email: user.email })
  mentionContext.value.active = false
  const newPos = before.length + name.length + 2
  nextTick(() => {
    targetElement?.focus()
    targetElement?.setSelectionRange(newPos, newPos)
  })
}

function handleCommentKeydown(e: KeyboardEvent, type: string) {
  if (!mentionContext.value.active) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const textarea = e.target as HTMLTextAreaElement
      const cursor = textarea.selectionStart
      if (cursor !== textarea.selectionEnd) return

      const val = type === 'new' ? newComment.value : editText.value
      const users = workspaceRoles.value || []
      const userNames = users
        .flatMap((u: any) => [u.u_full_name, u.name, u.title])
        .filter(Boolean)
      userNames.sort((a: string, b: string) => b.length - a.length)

      for (const name of userNames) {
        const mention = `@${name}`
        const index = val.lastIndexOf(mention, cursor - 1)
        if (index !== -1 && index + mention.length >= cursor) {
          e.preventDefault()
          const newVal = val.slice(0, index) + val.slice(index + mention.length)
          if (type === 'new') newComment.value = newVal
          else editText.value = newVal
          textarea.value = newVal
          textarea.setSelectionRange(index, index)
          return
        }
      }
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    mentionContext.value.selectedIndex =
      (mentionContext.value.selectedIndex + 1) % (filteredMentionUsers.value.length || 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mentionContext.value.selectedIndex =
      (mentionContext.value.selectedIndex - 1 + (filteredMentionUsers.value.length || 1)) %
      (filteredMentionUsers.value.length || 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = filteredMentionUsers.value[mentionContext.value.selectedIndex]
    if (selected) insertMention(selected)
  } else if (e.key === 'Escape') {
    mentionContext.value.active = false
  }
}

function handleCommentBlur() {
  setTimeout(() => {
    mentionContext.value.active = false
  }, 150)
}

function saveEdit(c: any) {
  let text = editText.value.trim()
  if (!text) return
  const mentions: any[] = []
  currentMentions.value.forEach((m) => {
    const mentionToken = `@${m.name}`
    if (text.includes(mentionToken)) {
      text = text.replace(mentionToken, `@[${m.name}](${m.id})`)
      mentions.push({ id: m.id, name: m.name, email: m.email, type: 'user' })
    }
  })

  updateComment(
    { id: c._id, payload: { comment_text: text, mentions, attachments: editAttachments.value } },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['comments', commentId.value]
        })
        cancelEdit()
        toast.success('Comment updated')
      },
      onError: () => {
        toast.error('Failed to update comment')
      }
    }
  )
}


function removeComment(c: any) {
  deleteComment(
    { id: c._id },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['comments', commentId.value]
        })
        toast.success('Comment deleted')
      },
      onError: () => {
        toast.error('Failed to delete comment')
      }
    }
  )
}

const attachments = computed(() => {
  const cardFiles = details.value?.attachments || []
  const commentFiles = (comments.value || []).flatMap((c: any) =>
    (c.attachments || []).map((a: any) => ({
      ...a,
      author: c.created_by?.u_full_name || c.commented_by?.u_full_name,
      date: c.created_at
    }))
  )

  const all = [...cardFiles, ...commentFiles]
  const unique = Array.from(new Map(all.map((item: any) => [item.url, item])).values())

  return unique.map((f: any) => ({
    _id: f._id ?? f.id ?? Math.random(),
    name: f.name ?? f.filename ?? 'file',
    url: f.url,
    author: f.author,
    date: f.date,
    kind: f.url?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)
      ? 'image'
      : f.url?.match(/\.(mp4|webm|ogg)$/i)
        ? 'video'
        : 'file'
  }))
})

const queryClient = useQueryClient()
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['backlog-list'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    // queryClient.invalidateQueries({ queryKey: ['product-card', props.cardId] })
    queryClient.invalidateQueries({ queryKey: ['sprint-cards'] })
  }
})

const commentAttachments = ref<any[]>([])
const { mutate: uploadFile } = usePrivateUploadFile()

function removeAttachment(id: string) {
  commentAttachments.value = commentAttachments.value.filter((a) => a.id !== id)
}

function uploadSingleFile(file: File) {
  const tempId = Math.random().toString(36).substring(2, 9)
  const isImage = file.type.startsWith('image/')
  commentAttachments.value.push({
    id: tempId,
    name: file.name,
    loading: true,
    previewUrl: isImage ? URL.createObjectURL(file) : null
  })

  const fd = new FormData()
  fd.append('file', file)

  uploadFile(fd, {
    onSuccess: (res: any) => {
      const item = commentAttachments.value.find((a) => a.id === tempId)
      if (item) {
        item.loading = false
        item.data = res.data
      }
    },
    onError: () => {
      removeAttachment(tempId)
      toast.error(`Failed to upload ${file.name}`)
    }
  })
}

function handleFileChange(event: any) {
  const files = event.target.files
  Array.from(files).forEach((file: any) => uploadSingleFile(file))
}

function postComment() {
  let comment_text = newComment.value.trim()
  const mentions: any[] = []
  currentMentions.value.forEach((m) => {
    const mentionToken = `@${m.name}`
    if (comment_text.includes(mentionToken)) {
      comment_text = comment_text.replace(mentionToken, `@[${m.name}](${m.id})`)
      mentions.push({ id: m.id, name: m.name, email: m.email, type: 'user' })
    }
  })
  if (!comment_text && !commentAttachments.value.length) return
  if (details.value._id) {
    createComment({
      id: details.value._id,
      payload: {
        comment_text,
        mentions,
        attachments: commentAttachments.value
          .filter((a) => !a.loading && a.data)
          .map((a: any) => ({
            name: a.data.name,
            url: a.data.url
          }))
      }
    })
  }
}

const localVarValues = reactive<Record<string, any>>({})

const initLocalVars = () => {
  if (cardDetails?.value?.variables) {
    const vars = cardDetails.value.variables ?? []
    vars.forEach((v: any) => {
      if (!v || v.type !== 'Select') return
      const first = Array.isArray(v.data) && v.data.length ? v.data[0]?.value ?? v.data[0]?._id ?? v.data[0] : undefined
      localVarValues[v.slug] = v.value ?? localVarValues[v.slug] ?? first ?? null
    })
  }
}

onMounted(initLocalVars)
watch(() => cardDetails.value, initLocalVars, { deep: true })

function handleSelect(val: any, slug: string) {
  localVarValues[slug] = val
  const prev = (cardDetails.value?.variables ?? []).find((v: any) => v.slug === slug)?.value
  if (prev === val) return
  if (details.value._id) {
    moveCard.mutate({
      card_id: details.value._id,
      variables: { [slug]: val },
    })
  }
}

function closeModal() {
  emit('update:modelValue', false)
  emit('close')
  activeTab.value = 'details'
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    closeModal()
  }
}

watch(() => props.cardId, (newCardId) => {
  if (newCardId) {
    card_Id.value = newCardId;
    refetch()
  }
})



watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  if (props.modelValue) {
    document.body.style.overflow = 'hidden'
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
watch(activeTab, (tab) => {
  if (tab === 'comments' && props.modelValue) {
    refetchComments()
  }
})
onBeforeUnmount(() => {
  if (cleanupMention) cleanupMention()
})
</script>

<style scoped>
.hide-parent-close :deep(button.absolute.top-4.right-4) {
  display: none;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from>div:last-child,
.modal-leave-to>div:last-child {
  transform: scale(0.95) translateY(-20px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active>div:last-child,
.modal-leave-active>div:last-child {
  transition: transform 200ms ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.98);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
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
  transition: opacity 160ms ease, transform 160ms ease;
}
:global(.mention-highlight) {
  background-color: color-mix(in srgb, var(--color-accent, #6366f1) 15%, transparent);
  color: var(--color-accent, #6366f1);
  padding: 1px 0;
  border-radius: 4px;
  font-weight: 400;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent, #6366f1) 20%, transparent);
  display: inline;
}
</style>