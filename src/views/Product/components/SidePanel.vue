<template>
  <Transition name="panel" appear>
    <div
      v-show="showPanel"
      :class="[
        'flex flex-col h-full overflow-y-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.1)] border border-orchit-white/5 overflow-hidden transition-all duration-300 ease-in-out',
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
          class="sticky top-0 z-10 border-b border-border px-3 sm:px-3 py-[9px] flex items-center justify-between bg-bg-card"
        >
          <h5 class="text-[18px] font-semibold tracking-tight">Details</h5>
          <div class="flex items-center gap-1">
            <button
              class="shrink-0 hidden sm:flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
              @click="isExpanded = !isExpanded"
              :aria-label="isExpanded ? 'Collapse details' : 'Expand details'"
            >
              <i
                :class="[
                  'fa-solid',
                  isExpanded ? 'fa-compress' : 'fa-expand',
                  'text-md',
                ]"
              ></i>
            </button>
            <button
              class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
              @click="
                () => {
                  emit('close');
                  emit('closeSidePanel');
                }
              "
              aria-label="Close details"
            >
              <i class="fa-solid fa-xmark text-md"></i>
            </button>
          </div>
        </div>
        <!-- Body -->
        <div class="py-3 px-3 flex flex-col gap-3 flex-grow">
          <!-- Sprint/Milestone Badge -->
          <div v-if="cardDetails?.sprint" class="flex items-center gap-2">
            <span
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all duration-300 border"
              :class="
                cardDetails.sprint.status === 'active'
                  ? 'bg-primary-color/15 text-primary-color border-primary-color/20'
                  : 'bg-orchit-white/5 text-text-secondary border-orchit-white/10'
              "
            >
              <i class="fa-solid fa-layer-group text-[10px]"></i>
              {{ cardDetails.sprint.title }}
              <span
                v-if="cardDetails.sprint.status === 'active'"
                class="flex h-2 w-2 relative"
              >
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(34,139,34)] opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 bg-[rgb(34,139,34)]"
                ></span>
              </span>
            </span>
          </div>
          <!-- card type -->
          <template
            v-for="(item, index) in cardDetails?.variables"
            :key="item.slug || `var-${index}`"
          >
            <div
              v-if="item?.type === 'Select' && item.slug == 'card-type'"
              class="space-y-1.5 sm:col-span-1"
            >
              <div class="text-xs uppercase tracking-wider text-text-secondary ">
                {{ item.title }}
              </div>
              <BaseSelectField
                :disabled="!canEditCard"
                size="md"
                :options="item?.data.map((e: any) => ({ _id: e, title: e }))"
                placeholder="Select option"
                :allowCustom="false"
                :model-value="localVarValues[item.slug]"
                @update:modelValue="
                  (val) => handleVariableUpdate(val, item.slug)
                "
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
                @blur="saveTitle"
                class="w-full text-[18px] font-semibold rounded-xl px-3 py-2 bg-orchit-white/5 border border-orchit-white/10 focus:outline-none focus:ring-2 focus:ring-primary-color/40 transition"
                type="text"
                aria-label="Edit title"
              />
              <h1
                v-else
                key="title-view"
                :class="canEditCard ? 'cursor-text' : 'cursor-not-allowed'"
                class="text-[18px] leading-[24px] break-words font-semibold tracking-tight rounded-lg px-2 py-1 hover:bg-orchit-white/5 transition"
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
          <div class="desc-section">
            <h3 class="mb-1 text-[11px] font-semibold uppercase tracking-widest text-text-secondary px-1">
              Description
            </h3>

            <Transition name="fade-scale" mode="out-in">
              <!-- ── VIEW MODE (Jira style: no border, subtle hover) ── -->
              <div
                v-if="!editingDesc"
                key="desc-view"
                class="group relative rounded-lg px-3 py-2.5 transition-all duration-150 max-h-[400px] overflow-y-auto scrollbar-visible"
                :class="[
                  canEditCard
                    ? 'cursor-text hover:bg-orchit-white/5 hover:ring-1 hover:ring-orchit-white/10'
                    : 'cursor-not-allowed opacity-60'
                ]"
                @click="startEditDesc"
              >
                <div
                  v-if="description"
                  v-html="description"
                  class="word-break desc-rendered text-[14px] leading-6 text-text-primary"
                ></div>
                <div v-else class="flex items-center gap-2 text-text-secondary">
                  <i class="fa-regular fa-pen-to-square text-[13px] opacity-50"></i>
                  <span class="text-[14px] italic opacity-60">Add a description…</span>
                </div>
                <!-- Jira-style edit hint badge -->
                <span
                  v-if="canEditCard && !description"
                  class="absolute bottom-2 right-2 text-[10px] text-text-secondary opacity-0 group-hover:opacity-60 transition-opacity"
                >Click to edit</span>
              </div>

              <!-- ── EDIT MODE ── -->
              <div
                v-else
                key="desc-edit"
                ref="descEditorWrap"
                class="rounded-lg overflow-hidden ring-2 ring-primary-color/40 border border-primary-color/25 shadow-sm"
              >
                <BaseRichTextEditor v-model="description" />

                <!-- Save / Cancel — Jira style -->
                <div class="flex items-center gap-2 px-3 py-2 border-t border-border bg-orchit-white/3">
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-md text-[13px] font-medium text-text-secondary bg-orchit-white/5 hover:bg-orchit-white/10 border border-orchit-white/10 transition-all active:scale-95"
                    @click="cancelDescEdit"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="px-4 py-1.5 rounded-md bg-primary-color text-[13px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"            
                    @click="finishDescEdit"
                  >
                    Save
                  </button>
                </div>
              </div>
            </Transition>
          </div>


          <!-- Tabs (segmented) -->
          <SwitchTab
            :inSpace="true"
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
                  <div class="mt-1 font-medium">
                    {{ details["card-code"] || cardDetails["card-code"] }}
                  </div>
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
                    Tab
                  </div>
                  <BaseSelectField
                    :disabled="!canEditCard"
                    size="md"
                    :options="laneOptions"
                    placeholder="Select tab"
                    :allowCustom="false"
                    :model-value="lane"
                    @update:modelValue="setLane"
                  />
                </div>
                <template v-if="!pin">
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
                      :seat="cardDetails?.seats || cardDetails?.seat"
                    />
                  </div>
                  <div class="space-y-2">
                    <div
                      class="text-xs uppercase tracking-wider text-text-secondary"
                    >
                      Start Date
                    </div>
                    <div
                      class="h-10 px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-orchit-white/10"
                    >
                      <i class="fa-regular fa-calendar"></i>
                      <DatePicker
                        :inSpace="true"
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
                      class="h-10 px-3 flex items-center gap-2 rounded-lg bg-bg-input border transition-colors"
                      :class="
                        endDateError
                          ? 'border-red-500'
                          : 'border-orchit-white/10'
                      "
                    >
                      <i class="fa-regular fa-calendar"></i>
                      <DatePicker
                        :inSpace="true"
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
                    v-if="
                      ![
                        'card-title',
                        'card-description',
                        'start-date',
                        'end-date',
                        'card-code',
                        'card-type',
                        'ok',
                        'process',
                      ].includes(item.slug)
                    "
                    class="space-y-2 sm:col-span-1"
                  >
                    <div class="flex items-center justify-between group h-5">
                      <div
                        class="text-xs uppercase tracking-wider text-text-secondary"
                      >
                        {{ item.title }}
                      </div>
                      <div
                        v-if="
                          ![
                            'priority',
                            'card status',
                            'card priority',
                          ].includes(item.title?.toLowerCase())
                        "
                        class="hidden group-hover:flex items-center gap-1"
                      >
                        <button
                          v-if="canEditCard"
                          @click="handleEditVar(item)"
                          class="text-text-secondary hover:text-primary-color transition-colors p-1"
                          title="Edit variable"
                        >
                          <i
                            class="fa-regular fa-pen-to-square text-[11px]"
                          ></i>
                        </button>
                        <button
                          v-if="canEditCard"
                          @click="handleDeleteVar(item)"
                          class="text-text-secondary hover:text-red-500 transition-colors p-1"
                          title="Delete variable"
                        >
                          <i class="fa-regular fa-trash-can text-[10px]"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Selection Types -->
                    <BaseSelectField
                      v-if="item.type === 'Select' || !item?.type && item?.data?.length"
                      :disabled="!canEditCard"
                      size="md"
                      :options="
                        item?.data?.map((e: any) => ({ _id: e, title: e }))
                      "
                      placeholder="Select option"
                      :allowCustom="false"
                      :model-value="localVarValues[item.slug]"
                      @update:modelValue="
                        (val: any) => handleVariableUpdate(val, item.slug)
                      "
                    />

                    <BaseMultiSelect
                      v-else-if="item.type === 'Multi Select'"
                      :disabled="!canEditCard"
                      size="md"
                      :options="
                        item?.data?.map((e: any) => ({ _id: e, title: e }))
                      "
                      placeholder="Select options"
                      :model-value="
                        Array.isArray(localVarValues[item.slug])
                          ? localVarValues[item.slug]
                          : localVarValues[item.slug]
                            ? [localVarValues[item.slug]]
                            : []
                      "
                      @update:modelValue="
                        (val: any) => handleVariableUpdate(val, item.slug)
                      "
                    />

                    <!-- Radio Type -->
                    <BaseRadioGroup
                      v-else-if="item.type === 'Radio'"
                      :disabled="!canEditCard"
                      :options="
                        item?.data?.map((e: any) => ({ _id: e, title: e }))
                      "
                      :model-value="localVarValues[item.slug]"
                      :name="item.slug"
                      @update:modelValue="
                        (val: any) => handleVariableUpdate(val, item.slug)
                      "
                    />

                    <!-- Checkbox Type -->
                    <BaseCheckboxGroup
                      v-else-if="item.type === 'Checkbox'"
                      :disabled="!canEditCard"
                      :options="
                        item?.data?.map((e: any) => ({ _id: e, title: e }))
                      "
                      :model-value="localVarValues[item.slug]"
                      @update:modelValue="
                        (val: any) => handleVariableUpdate(val, item.slug)
                      "
                    />

                    <!-- Textarea Type -->
                    <BaseTextAreaField
                      v-else-if="item.type === 'Textarea'"
                      :disabled="!canEditCard"
                      placeholder="Enter text..."
                      :model-value="localVarValues[item.slug]"
                      @update:modelValue="
                        (val: any) => (localVarValues[item.slug] = val)
                      "
                      @blur="
                        () =>
                          handleVariableUpdate(
                            localVarValues[item.slug],
                            item.slug,
                          )
                      "
                    />

                    <!-- Date & Time Types -->
                    <div
                      v-else-if="['Date', 'Date & Time'].includes(item.type)"
                      class="h-10 px-3 flex items-center gap-1 rounded-lg bg-bg-input border border-orchit-white/10"
                    >
                      <i class="fa-regular fa-calendar text-[14px]"></i>
                      <DatePicker
                        :inSpace="true"
                        :disabled="!canEditCard"
                        placeholder="Set date"
                        class="w-full"
                        :model-value="localVarValues[item.slug]"
                        emit-as="ymd"
                        @update:modelValue="
                          (val: any) => handleVariableUpdate(val, item.slug)
                        "
                      />
                    </div>

                    <!-- Time Type -->
                    <div
                      v-else-if="item.type === 'Time'"
                      class="h-10 px-3 flex items-center gap-1 rounded-lg bg-bg-input border border-orchit-white/10"
                    >
                      <i class="fa-regular fa-clock text-[14px]"></i>
                      <TimePicker
                        :disabled="!canEditCard"
                        placeholder="Set time"
                        class="w-full"
                        :model-value="localVarValues[item.slug]"
                        @update:modelValue="
                          (val: any) => handleVariableUpdate(val, item.slug)
                        "
                      />
                    </div>

                    <!-- File Upload -->
                    <FileUploader
                      v-else-if="item.type === 'File Upload'"
                      :disabled="!canEditCard"
                      label=""
                      :model-value="localVarValues[item.slug]"
                      @update:model-value="
                        (val: any) => handleVariableUpdate(val, item.slug)
                      "
                    />

                    <!-- Switch/Toggle -->
                    <div
                      v-else-if="item.type === 'Switch/Toggle'"
                      class="flex items-center gap-2 py-1"
                    >
                      <Checkbox
                        :disabled="!canEditCard"
                        :checked="!!localVarValues[item.slug]"
                        @change="
                          (e: any) =>
                            handleVariableUpdate(e.target.checked, item.slug)
                        "
                        label="Enable"
                      />
                    </div>

                    <!-- Person Type -->
                    <AssigmentDropdown
                      v-else-if="item.type === 'Person'"
                      :disabled="!canEditCard"
                      :seat="localVarValues[item.slug]"
                      @assign="
                        (users) => handleVariableUpdate(users, item.slug)
                      "
                    />

                    <!-- Range/Slider Type -->
                    <div
                      v-else-if="item.type === 'Range/Slider'"
                      class="space-y-1 py-1"
                    >
                      <div
                        class="flex justify-between text-[10px] text-text-secondary px-1"
                      >
                        <span>Min: {{ item.data?.[0] || 0 }}</span>
                        <span class="font-bold text-primary-color">{{
                          localVarValues[item.slug] ?? item.data?.[0] ?? 0
                        }}</span>
                        <span>Max: {{ item.data?.[1] || 100 }}</span>
                      </div>
                      <input
                        type="range"
                        :min="Number(item.data?.[0]) || 0"
                        :max="Number(item.data?.[1]) || 100"
                        :disabled="!canEditCard"
                        class="w-full h-1.5 bg-orchit-white/10 rounded-lg appearance-none cursor-pointer primary-color-primary-color"
                        :value="
                          localVarValues[item.slug] ?? item.data?.[0] ?? 0
                        "
                        @input="
                          (e: any) =>
                            handleVariableUpdate(
                              Number(e.target.value),
                              item.slug,
                            )
                        "
                      />
                    </div>

                    <!-- Default: TextField (covers Text, Number, Email, Password, Color Picker, Label, Icon, testii) -->
                    <BaseTextField
                      v-else
                      :disabled="!canEditCard || item.type === 'Label'"
                      :type="
                        item.type === 'Number'
                          ? 'number'
                          : item.type === 'Color Picker'
                            ? 'color'
                            : item.type === 'Email'
                              ? 'email'
                              : item.type === 'Password'
                                ? 'password'
                                : 'text'
                      "
                      placeholder="Enter value..."
                      :model-value="localVarValues[item.slug]"
                      @update:modelValue="
                        (val: any) => (localVarValues[item.slug] = val)
                      "
                      @blur="
                        () =>
                          handleVariableUpdate(
                            localVarValues[item.slug],
                            item.slug,
                          )
                      "
                    />
                  </div>
                </template>
              </div>
              <button
                @click="
                  () => {
                    isCreateVar = true;
                  }
                "
                class="w-full py-2 px-4 text-sm font-semibold text-white bg-primary-color rounded-lg border border-primary-color cursor-pointer active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                Add Custom Fields
              </button>
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
                      class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary-color/70 ring-4 ring-primary-color/10"
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
                    class="h-8 w-8 rounded-full bg-primary-color/15 text-primary-color flex items-center justify-center text-xs font-semibold"
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
                      :disabled="
                        !canEditComment ||
                        isUpdatingComment ||
                        isDeletingComment
                      "
                      class="text-xs text-primary-color hover:underline"
                      @click="beginEdit(c)"
                    >
                      Edit
                    </button>
                    <button
                      :disabled="
                        !canDeleteComment ||
                        isDeletingComment ||
                        isUpdatingComment
                      "
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
                    v-html="renderMentions(c.comment_text)"
                    @click="handleCommentClick"
                  ></p>
                  <div v-else :key="`c-edit-${c._id}`" class="space-y-2">
                    <div class="relative w-full">
                      <!-- overlay -->
                      <div
                        :ref="
                          (el) => {
                            if (el) overlays[c._id] = el as HTMLElement;
                          }
                        "
                        class="absolute inset-0 pointer-events-none p-3 whitespace-pre-wrap break-words overflow-hidden text-sm z-10 leading-normal font-sans"
                        aria-hidden="true"
                        style="
                          font-family:
                            Inter,
                            system-ui,
                            -apple-system,
                            sans-serif;
                          line-height: 1.5;
                          letter-spacing: normal;
                          font-weight: 400;
                          -webkit-font-smoothing: antialiased;
                        "
                        v-html="formatOverlay(editText)"
                      ></div>
                        <textarea
                          :ref="
                            (el) => {
                              if (el) editCommentTextareas[c._id] = el;
                            }
                          "
                          v-model="editText"
                          rows="3"
                          spellcheck="false"
                          @scroll="(e) => syncScroll(e, c._id)"
                          @input="(e) => handleCommentInput(e, c._id)"
                          @keydown="(e) => handleCommentKeydown(e, c._id)"
                          @blur="handleCommentBlur"
                          class="relative z-0 w-full p-3 rounded-lg bg-bg-input/80 border border-orchit-white/10 focus:ring-2 focus:ring-primary-color/40 outline-none text-sm leading-normal resize-none text-transparent caret-text-primary font-sans"
                          style="
                            font-family:
                              Inter,
                              system-ui,
                              -apple-system,
                              sans-serif;
                            line-height: 1.5;
                            letter-spacing: normal;
                            font-weight: 400;
                            -webkit-font-smoothing: antialiased;
                          "
                        />
                    </div>
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
                  v-if="
                    (editingId === c._id ? editAttachments : c.attachments)
                      ?.length
                  "
                  class="mt-3 grid grid-cols-2 gap-2"
                >
                  <div
                    v-for="(file, index) in editingId === c._id
                      ? editAttachments
                      : c.attachments"
                    :key="index"
                    class="group relative flex items-center gap-2 rounded-lg border border-orchit-white/10 bg-orchit-white/5 px-2 py-1 hover:bg-orchit-white/10 transition"
                  >
                    <a
                      :href="file.url"
                      target="_blank"
                      class="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <div v-if="file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)" class="w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-orchit-white/10">
                        <img :src="file.url" class="w-full h-full object-cover" />
                      </div>
                      <i v-else-if="file.name.match(/\.pdf$/i)" class="fa-regular fa-file-pdf text-[11px] text-red-400"></i>
                      <i v-else-if="file.name.match(/\.(doc|docx)$/i)" class="fa-regular fa-file-word text-[11px] text-blue-400"></i>
                      <i
                        v-else
                        class="fa-regular fa-file text-text-secondary group-hover:text-text-primary transition"
                      ></i>
                      <span class="text-xs truncate">{{ file?.name }}</span>
                    </a>
                    <button
                      v-if="editingId === c._id"
                      @click="removeEditAttachment(Number(index))"
                      class="text-red-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove attachment"
                    >
                      <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- New comment -->
              <div
                class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 overflow-hidden relative"
              >
                <div class="relative">
                  <div
                    :ref="
                      (el) => {
                        if (el) overlays['new'] = el as HTMLElement;
                      }
                    "
                    class="absolute inset-0 pointer-events-none p-3 whitespace-pre-wrap break-words overflow-hidden text-sm z-10 leading-normal font-sans"
                    aria-hidden="true"
                    style="
                      font-family:
                        Inter,
                        system-ui,
                        -apple-system,
                        sans-serif;
                      line-height: 1.5;
                      letter-spacing: normal;
                      font-weight: 400;
                      -webkit-font-smoothing: antialiased;
                    "
                    v-html="formatOverlay(newComment)"
                  ></div>
                  <textarea
                    ref="commentTextarea"
                    @paste="handlePaste"
                    :disabled="!canCreateComment"
                    v-model="newComment"
                    rows="3"
                    spellcheck="false"
                    @scroll="(e) => syncScroll(e, 'new')"
                    @input="(e) => handleCommentInput(e, 'new')"
                    @keydown="(e) => handleCommentKeydown(e, 'new')"
                    @blur="handleCommentBlur"
                    :class="
                      canCreateComment ? 'cursor-text' : 'cursor-not-allowed'
                    "
                    class="relative z-0 w-full p-3 bg-transparent outline-none text-sm leading-normal resize-none text-transparent caret-text-primary font-sans"
                    style="
                      font-family:
                        Inter,
                        system-ui,
                        -apple-system,
                        sans-serif;
                      line-height: 1.5;
                      letter-spacing: normal;
                      font-weight: 400;
                      -webkit-font-smoothing: antialiased;
                    "
                    placeholder="Write a comment"
                  />
                </div>
                <div
                  v-if="commentAttachments.length"
                  class="flex flex-wrap gap-2 p-2 px-3 border-t border-orchit-white/5 bg-orchit-white/2"
                >
                  <div
                    v-for="file in commentAttachments"
                    :key="file.id"
                    class="group flex items-center gap-2 px-2 py-1 rounded-lg bg-orchit-white/5 border border-orchit-white/10 text-[11px] text-text-secondary transition-all hover:border-orchit-white/20"
                  >
                    <div v-if="(file.previewUrl || file.data?.url) && file.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)" class="w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-orchit-white/10">
                      <img :src="file.previewUrl || file.data?.url" class="w-full h-full object-cover" />
                    </div>
                    <i v-else-if="file.name.match(/\.pdf$/i)" class="fa-regular fa-file-pdf text-[10px] text-red-400"></i>
                    <i v-else-if="file.name.match(/\.(doc|docx)$/i)" class="fa-regular fa-file-word text-[10px] text-blue-400"></i>
                    <i
                      v-else
                      class="fa-regular fa-file text-[10px]"
                    ></i>
                    <span class="truncate max-w-[120px]">{{ file.name }}</span>
                    <i
                      v-if="file.loading"
                      class="fa-solid fa-spinner animate-spin text-[10px] text-primary-color"
                    ></i>
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
                <div
                  class="flex items-center w-full justify-between p-2 border-t border-orchit-white/10"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    multiple
                    @change="handleFileChange"
                    class="text-ellipsis text-xs text-transparent file:mr-3 col-span-2 file:px-3 file:py-1.5 file:rounded-md file:border file:border-orchit-white/10 file:bg-orchit-white/10 hover:file:bg-orchit-white/15 file:text-text-primary transition inline-flex file:cursor-pointer max-w-[150px]"
                  />
                  <Button
                    :inSpace="true"
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
            <section v-else key="tab-attachments" class="space-y-6">
              <div class="flex items-center justify-between">
                <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Files attached to this {{ details?.type ?? "item" }}
                </div>
                <div class="text-[11px] text-text-secondary bg-orchit-white/5 px-2 py-0.5 rounded-full border border-orchit-white/10">
                  {{ attachments.length }} files
                </div>
              </div>

              <div v-if="attachments.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="file in attachments"
                  :key="file._id"
                  class="group relative flex flex-col flex-wrap rounded-xl border border-orchit-white/10 bg-orchit-white/5 hover:bg-orchit-white/8 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                >
                  <!-- Preview Area -->
                  <div class="aspect-[16/10] w-full relative rounded-t-xl overflow-hidden bg-bg-surface">
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
                        <i v-if="file.name.match(/\.pdf$/i)" class="fa-regular fa-file-pdf text-4xl text-red-400 opacity-80"></i>
                        <i v-else-if="file.name.match(/\.(doc|docx)$/i)" class="fa-regular fa-file-word text-4xl text-blue-400 opacity-80"></i>
                        <i v-else-if="file.name.match(/\.(xls|xlsx)$/i)" class="fa-regular fa-file-excel text-4xl text-green-400 opacity-80"></i>
                        <i v-else class="fa-regular fa-file-lines text-4xl text-text-secondary opacity-60"></i>
                      </div>
                    </div>

                    <!-- Type Badge -->
                    <div class="absolute top-3 left-3 px-2 py-1 bg-bg-body backdrop-blur-md rounded-lg text-[9px] font-bold text-text-primary uppercase tracking-tighter border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      {{ file.kind }}
                    </div>
                  </div>

                  <!-- Info Area -->
                  <div class="p-3.5 flex flex-col flex-1">
                    <div class="font-medium text-sm text-text-primary truncate mb-1" :title="file.name">
                      {{ file.name }}
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-2">
                      <div class="flex flex-col gap-0.5 min-w-0">
                        <span v-if="file.author" class="text-[10px] text-text-secondary truncate opacity-80">
                          By {{ file.author }}
                        </span>
                        <span v-if="file.date" class="text-[9px] text-text-secondary opacity-60">
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

              <!-- Empty State -->
              <div v-else class="py-12 flex flex-col items-center justify-center border border-dashed border-orchit-white/10 rounded-3xl bg-orchit-white/2">
                <div class="w-16 h-16 rounded-2xl bg-orchit-white/5 flex items-center justify-center mb-4">
                  <i class="fa-regular fa-folder-open text-2xl text-text-secondary opacity-40"></i>
                </div>
                <div class="text-sm font-medium text-text-primary">No attachments found</div>
                <div class="text-xs text-text-secondary mt-1">Files from comments will appear here</div>
              </div>
            </section>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>

  <CreateVariableModal
    v-model="isCreateVar"
    v-if="isCreateVar"
    @refetchCardDetails="refetchCardDetails"
    :sheetID="props?.sheetID ?? ''"
  />

  <EditVariableModal
    v-if="isEditVar"
    v-model="isEditVar"
    @refetchCardDetails="refetchCardDetails"
    @update-variable="handleVariableDefinitionUpdate"
    :variable="selectedVarToEdit"
    :cardId="props.details._id"
    :sheetID="props?.sheetID ?? ''"
  />
  <ConfirmModal
    v-model="showDeleteModal"
    title="Delete Variable"
    :itemLabel="'variable'"
    :itemName="selectedItem?.title"
    confirmText="Delete"
    cancelText="Cancel"
    :loading="isDeleting"
    @confirm="confirmDelete"
  />

  <teleport to="body">
    <div
      v-if="mentionContext.active"
      ref="mentionMenuRef"
      class="z-[9999] absolute rounded-md border border-border bg-bg-dropdown shadow-xl w-60 py-1"
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
            'flex items-center gap-3 px-4 py-2 cursor-pointer transition min-w-0',
            mentionContext.selectedIndex === Number(idx)
              ? 'bg-bg-dropdown-menu-hover'
              : 'hover:bg-bg-dropdown-menu-hover',
          ]"
        >
          <img
            v-if="u?.avatar?.src || u?.u_profile_image || u?.user?.avatar"
            :src="u?.avatar?.src ?? u?.u_profile_image ?? u?.user?.avatar"
            class="w-6 h-6 rounded-full object-cover border border-border"
            alt=""
          />
          <div
            v-else-if="(u.name || u.title || u.u_full_name) && u._id"
            class="w-6 min-w-[24px] aspect-square border-border border rounded-full text-[10px] font-semibold text-text-primary flex items-center justify-center pt-[1px]"
            :style="{
              backgroundColor: avatarColor({
                name: u.name || u.title || u.u_full_name,
                email: u.email,
                _id: u?._id,
              }),
            }"
          >
            {{ initials(u.name || u.title || u.u_full_name) }}
          </div>
          <div
            v-else
            class="w-6 min-w-[24px] h-6 bg-bg-body border border-border rounded-full flex justify-center items-center"
          >
            <i class="fa-regular fa-user text-xs"></i>
          </div>
          <div class="text-xs font-medium truncate flex-1">
            {{ u.name || u.title || u.u_full_name }}
          </div>
        </li>
        <li
          @mousedown.prevent="handleInviteClick"
          @mouseenter="
            mentionContext.selectedIndex = filteredMentionUsers.length
          "
          :class="[
            'flex items-center gap-3 px-4 py-3 cursor-pointer transition border-t border-border mt-1',
            mentionContext.selectedIndex === filteredMentionUsers.length
              ? 'bg-bg-dropdown-menu-hover'
              : 'hover:bg-bg-dropdown-menu-hover',
          ]"
        >
          <div
            class="h-6 w-6 rounded-full bg-primary-color/15 text-primary-color flex items-center justify-center"
          >
            <i class="fa-solid fa-user-plus text-[10px]"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-medium text-text-primary"
              >Invite to workspace</span
            >
            <span
              v-if="mentionContext.query"
              class="text-[10px] text-text-secondary"
              >Invite "{{ mentionContext.query }}"</span
            >
          </div>
        </li>
      </ul>
    </div>
  </teleport>

  <InviteUsersWithPermissions
    v-model="showInviteModal"
    v-if="showInviteModal"
    :defaultWorkspaceId="workspaceId"
  />

  <MentionProfileCard
    v-if="userPopover.show && userPopover.user && userPopover.target"
    :user="userPopover.user"
    :target="userPopover.target"
    @close="closeUserPopover"
  />
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
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
} from "@floating-ui/dom";
import {
  useLanes,
  useMoveCard,
  useDeleteVar,
  useUpdateVar,
} from "../../../queries/useSheets";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useWorkspacesRoles } from "../../../queries/useWorkspace";
import { avatarColor } from "../../../utilities/avatarColor";
import { useWorkspaceStore } from "../../../stores/workspace";
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
import {
  updateCardInStructure,
  updateCardOptimistically,
} from "../../../utilities/cacheSync";
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
const TimePicker = defineAsyncComponent(() => import("./TimePicker.vue"));
const AssigmentDropdown = defineAsyncComponent(
  () => import("./AssigmentDropdown.vue"),
);
const InviteUsersWithPermissions = defineAsyncComponent(
  () => import("../../Workspaces/Modals/InviteUsersWithPermissions.vue"),
);
const Button = defineAsyncComponent(
  () => import("../../../components/ui/Button.vue"),
);
const SwitchTab = defineAsyncComponent(
  () => import("../../../components/ui/SwitchTab.vue"),
);
const BaseTextField = defineAsyncComponent(
  () => import("../../../components/ui/BaseTextField.vue"),
);
const BaseTextAreaField = defineAsyncComponent(
  () => import("../../../components/ui/BaseTextAreaField.vue"),
);
const FileUploader = defineAsyncComponent(
  () => import("../../../components/ui/FileUploader.vue"),
);
const Checkbox = defineAsyncComponent(
  () => import("../../../components/ui/Checkbox.vue"),
);
const BaseRadioGroup = defineAsyncComponent(
  () => import("../../../components/ui/BaseRadioGroup.vue"),
);
const BaseCheckboxGroup = defineAsyncComponent(
  () => import("../../../components/ui/BaseCheckboxGroup.vue"),
);
const BaseMultiSelect = defineAsyncComponent(
  () => import("../../../components/ui/BaseMultiSelect.vue"),
);

const ConfirmModal = defineAsyncComponent(
  () => import("../modals/ConfirmDeleteModal.vue"),
);
const MentionProfileCard = defineAsyncComponent(
  () => import("./MentionProfileCard.vue"),
);

import CreateVariableModal from "../modals/CreateVariableModal.vue";
import EditVariableModal from "../modals/EditVariableModal.vue";
const isCreateVar = ref(false);
const isEditVar = ref(false);
const selectedVarToEdit = ref<any>(null);

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
const workspaceStore = useWorkspaceStore();
const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();
const props = defineProps({
  pin: { type: Boolean, default: false },
  showPanel: { type: Boolean, default: true },
  details: { type: Object as () => any, default: () => ({}) },
  sheetID: { type: String, required: false },
  moduleId: { type: String, required: false },
  moduleName: { type: String, required: false },
});
const emit = defineEmits([
  "close",
  "closeSidePanel",
  "update:details",
  "comment:post",
  "priority:change",
  "ticketUpdated",
]);
const propsID = ref(props.details._id);
const {
  data: cardDetails,
  isPending,
  isFetching,
  refetch: refetchCardDetails,
} = useProductCard(propsID);
onMounted(() => {
  if (props.showPanel) {
    workspaceStore.closeChatBotPanel();
  }
});
watch(
  () => props.details._id,
  (newId) => {
    if (newId && newId !== propsID.value) {
      propsID.value = newId;
    }
  },
);
watch(
  () => cardDetails.value,
  (card) => {
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
const description = ref("");
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
  // Snapshot the current saved value so Cancel can restore it
  descSnapshot.value = description.value;
  editingDesc.value = true;
  await nextTick();
  focusProseMirror(descEditorWrap.value || undefined);
}

const descSnapshot = ref("");

function cancelDescEdit() {
  // Restore to the snapshotted value (what was last saved)
  description.value = descSnapshot.value;
  editingDesc.value = false;
}

watch(
  () => cardDetails.value?.["card-description"],
  (val) => {
    if (!editingDesc.value) {
      description.value = val ?? "";
    }
  },
  { immediate: true },
);

function finishDescEdit() {
  const normalize = (html: string) => html.replace(/<p><\/p>/g, "").trim();

  const newDescription = normalize(description.value || "");
  const prevDescription = normalize(
    cardDetails.value?.["card-description"] || "",
  );

  if (newDescription !== prevDescription) {
    moveCard.mutate({
      card_id: props.details._id,
      variables: { "card-description": newDescription },
    });
  }

  editingDesc.value = false;
}
const local = reactive({
  posted_on:
    props.details?.posted_on ??
    props.details?.created_at ??
    props.details?.createdAt ??
    "",
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
  cardDetails?.value ? cardDetails.value["workspace_lane_id"] : "Main",
);
watch([() => cardDetails.value, () => isFetching.value], () => {
  if (cardDetails?.value) {
    localTitle.value = cardDetails?.value["card-title"];
    description.value = cardDetails.value["card-description"];
    lane.value = cardDetails.value["workspace_lane_id"] || "Main";
  }
});

const mainLaneOption = {
  _id: "Main",
  title: "Main",
};
const laneOptions = computed<any[]>(() => {
  const dynamicOptions = (lanes?.value ?? []).map((el: any) => ({
    ...el,
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  }));

  return [mainLaneOption, ...dynamicOptions];
});

function setLane(v: any) {
  lane.value = v;
  // If Main is selected, do not call API
  if (v === "Main") return;

  const selectedLaneObject = laneOptions.value.find((l: any) => l._id === v);

  moveCard.mutate({
    card_id: props.details._id,
    workspace_lane_id: v,
    lane: selectedLaneObject,
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
const curentAssigne = computed(
  () =>
    cardDetails?.value?.seat_id ||
    cardDetails?.value?.seats ||
    cardDetails?.value?.assigned_to,
);
const assignHandle = (users: any[]) => {
  const seat_ids = Array.isArray(users)
    ? users.map((u) => u?._id || u?.id).filter(Boolean)
    : [];
  moveCard.mutate({
    card_id: props.details._id,
    seat_id: seat_ids,
    optimisticUser: users,
  });
};

// --- Comments Logic ---
const commentId = computed(() => props.details?._id);
const { data: commentsData } = useComments(commentId);
const comments = ref<any>(commentsData.value?.comments);
watch(
  () => commentsData.value,
  () => {
    comments.value = commentsData.value?.comments;
  },
);

// --- Create Comment Logic with Optimistic Update ---
const { mutate: createComment, isPending: isPostingComment } = useCreateComment(
  {
    onMutate: async (newCommentPayload: any) => {
      const cardId = props.details._id;

      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: ["comments", cardId],
      });
      await queryClient.cancelQueries({ queryKey: ["sheet-list"] });

      // Save previous state
      const previousComments = queryClient.getQueryData(["comments", cardId]);
      const previousLists = queryClient.getQueriesData({
        queryKey: ["sheet-list"],
      });

      // Create optimistic comment
      const optimisticComment = {
        _id: Date.now().toString(),
        comment_text: newCommentPayload.payload.comment_text,
        commented_by: { u_full_name: "You", _id: currentUserId.value },
        attachments: newCommentPayload.payload.attachments || [],
        created_at: new Date().toISOString(),
      };

      // Update comments list
      queryClient.setQueryData(["comments", cardId], (old: any) => {
        return {
          ...old,
          comments: [...(old?.comments || []), optimisticComment],
        };
      });

      // Update comment count in sheet-list (THIS IS THE KEY FIX!)
      queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;

        return {
          ...old,
          data: old.data.map((column: any) => ({
            ...column,
            cards: column.cards?.map((card: any) =>
              card._id === cardId
                ? {
                    ...card,
                    comment_count: (card.comment_count || 0) + 1,
                  }
                : card,
            ),
          })),
        };
      });

      return { previousComments, previousLists };
    },
    onError: (err: any, variables: any, context: any) => {
      if (context?.previousComments)
        queryClient.setQueryData(
          ["comments", props.details._id],
          context.previousComments,
        );
      toast.error("Failed to post comment");
      if (context?.previousLists)
        queryClient.setQueriesData(
          { queryKey: ["sheet-list"] },
          context.previousLists,
        );
      console.log(err, variables);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", props.details._id],
      });
      queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
      queryClient.invalidateQueries({ queryKey: ["product-card"] });
      queryClient.invalidateQueries({ queryKey: ["cardDetail", propsID.value] });
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
    },
  },
);
const newComment = ref("");
const showInviteModal = ref(false);

// --- Edit Comment Logic ---
const { data: workspaceRoles } = useWorkspacesRoles(workspaceId);
const commentTextarea = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const editCommentTextareas = ref<{ [key: string]: any }>({});
const overlays = ref<{ [key: string]: HTMLElement }>({});

function syncScroll(e: Event, type: string) {
  const target = e.target as HTMLTextAreaElement;
  const overlay = overlays.value[type];
  if (overlay) {
    overlay.scrollTop = target.scrollTop;
    overlay.scrollLeft = target.scrollLeft;
  }
}
// --- Mention Logic ---
const mentionMenuRef = ref<HTMLElement | null>(null);
const mentionStyles = ref<any>({
  position: "fixed",
  top: "-999px",
  left: "-999px",
});
let cleanupMention: (() => void) | null = null;

const mentionContext = ref<{
  active: boolean;
  query: string;
  coords: { top: number; left: number };
  selectedIndex: number;
  startIndex: number;
  targetType: string;
}>({
  active: false,
  query: "",
  coords: { top: 0, left: 0 },
  selectedIndex: 0,
  startIndex: -1,
  targetType: "new",
});

const filteredMentionUsers = computed(() => {
  if (!workspaceRoles.value) return [];
  const q = mentionContext.value.query.toLowerCase().trim();
  if (!q) return workspaceRoles.value;
  return workspaceRoles.value.filter((u: any) => {
    const name = u.title || u.name || u.u_full_name || "";
    const email = u.email || "";
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });
});

// Core logic to detect "@" mentions and trigger the dropdown
function handleCommentInput(e: Event, type: string) {
  const target = e.target as HTMLTextAreaElement;
  const val = target.value;
  const cursor = target.selectionStart;

  const textBeforeCursor = val.slice(0, cursor);
  const atIndex = textBeforeCursor.lastIndexOf("@");

  if (atIndex !== -1) {
    const textAfterAt = textBeforeCursor.slice(atIndex + 1);

    // Logic: Only show if there's no space/newline after @,
    // and @ is at start or preceded by white space.
    if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : null;
      if (atIndex === 0 || charBeforeAt === " " || charBeforeAt === "\n") {
        mentionContext.value.active = true;
        mentionContext.value.query = textAfterAt;
        mentionContext.value.startIndex = atIndex;
        mentionContext.value.targetType = type;
        mentionContext.value.selectedIndex = 0;
        updateMentionPosition(target);
        return;
      }
    }
  }
  mentionContext.value.active = false;
}

const currentMentions = ref<any[]>([]);

const userPopover = ref<{
  show: boolean;
  user: any;
  target: HTMLElement | null;
}>({
  show: false,
  user: null,
  target: null,
});

// When user clicks on a mention in the comment text, show the profile popover
function handleCommentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.classList.contains("mention-highlight")) {
    const userId = target.getAttribute("data-user-id");
    if (!userId) return;

    const user = workspaceRoles.value?.find(
      (u: any) => u?._id === userId || u?.id === userId,
    );
    if (!user) return;

    userPopover.value.user = user;
    userPopover.value.target = target;
    userPopover.value.show = true;
  }
}

function closeUserPopover() {
  userPopover.value.show = false;
  userPopover.value.target = null;
}

function updateMentionPosition(textarea: HTMLTextAreaElement) {
  if (cleanupMention) {
    cleanupMention();
    cleanupMention = null;
  }

  const virtualElement = {
    getBoundingClientRect() {
      const rect = textarea.getBoundingClientRect();
      const div = document.createElement("div");
      const computedStyle = window.getComputedStyle(textarea);
      for (const prop of Array.from(computedStyle)) {
        div.style.setProperty(prop, computedStyle.getPropertyValue(prop));
      }
      div.style.position = "absolute";
      div.style.visibility = "hidden";
      div.style.whiteSpace = "pre-wrap";
      div.style.wordWrap = "break-word";
      div.style.width = computedStyle.width;
      div.style.height = computedStyle.height;

      const textBeforeCursor = textarea.value.substring(
        0,
        textarea.selectionStart,
      );
      div.textContent = textBeforeCursor;
      const span = document.createElement("span");
      span.textContent = ".";
      div.appendChild(span);
      document.body.appendChild(div);

      const spanTop = span.offsetTop;
      const spanLeft = span.offsetLeft;
      document.body.removeChild(div);

      // Return the precise coordinate of the cursor
      const top = rect.top + spanTop - textarea.scrollTop;
      const left = rect.left + spanLeft - textarea.scrollLeft;

      return {
        width: 0,
        height: 18, // approximate line height
        top,
        left,
        right: left,
        bottom: top + 18,
        x: left,
        y: top,
      } as DOMRect;
    },
  };

  nextTick(() => {
    if (mentionMenuRef.value) {
      cleanupMention = autoUpdate(virtualElement, mentionMenuRef.value, () => {
        if (!mentionMenuRef.value) return;
        computePosition(virtualElement, mentionMenuRef.value, {
          placement: "bottom-start",
          strategy: "fixed",
          middleware: [
            offset(6), // Professional tight gap
            flip(),
            shift({ padding: 10 }),
          ],
        }).then(({ x, y }) => {
          mentionStyles.value = {
            position: "fixed",
            left: `${x}px`,
            top: `${y}px`,
          };
        });
      });
    }
  });
}

// Ensure cleanup when mention active state changes or component unmounts
watch(
  () => mentionContext.value.active,
  (val) => {
    if (!val && cleanupMention) {
      cleanupMention();
      cleanupMention = null;
    }
  },
);

onBeforeUnmount(() => {
  if (cleanupMention) cleanupMention();
});

function handleCommentKeydown(e: KeyboardEvent, type: string) {
  if (!mentionContext.value.active) {
    if (e.key === "Backspace" || e.key === "Delete") {
      const textarea = e.target as HTMLTextAreaElement;
      const cursor = textarea.selectionStart;
      if (cursor !== textarea.selectionEnd) return;

      const val = type === "new" ? newComment.value : editText.value;
      const users = workspaceRoles.value || [];
      const userNames = users
        .flatMap((u: any) => [u.u_full_name, u.name, u.title])
        .filter(Boolean);
      userNames.sort((a: string, b: string) => b.length - a.length);

      for (const name of userNames) {
        const mention = `@${name}`;
        const index = val.lastIndexOf(mention, cursor - 1);

        if (index !== -1 && index + mention.length >= cursor) {
          e.preventDefault();
          const newVal =
            val.slice(0, index) + val.slice(index + mention.length);
          if (type === "new") newComment.value = newVal;
          else editText.value = newVal;
          textarea.value = newVal;
          textarea.setSelectionRange(index, index);
          return;
        }
      }
    }
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    mentionContext.value.selectedIndex =
      (mentionContext.value.selectedIndex + 1) %
      ((filteredMentionUsers.value.length || 0) + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    mentionContext.value.selectedIndex =
      (mentionContext.value.selectedIndex -
        1 +
        ((filteredMentionUsers.value.length || 0) + 1)) %
      ((filteredMentionUsers.value.length || 0) + 1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (
      mentionContext.value.selectedIndex === filteredMentionUsers.value.length
    ) {
      handleInviteClick();
    } else {
      const selected =
        filteredMentionUsers.value[mentionContext.value.selectedIndex];
      if (selected) insertMention(selected);
    }
  } else if (e.key === "Escape") {
    mentionContext.value.active = false;
  }
}

function handleCommentBlur() {
  setTimeout(() => {
    mentionContext.value.active = false;
  }, 150);
}

function insertMention(user: any) {
  const name = user.u_full_name || user.name || user.title;
  let currentVal = "";
  let targetElement: HTMLTextAreaElement | null = null;

  if (mentionContext.value.targetType === "new") {
    currentVal = newComment.value;
    targetElement = commentTextarea.value;
  } else {
    currentVal = editText.value;
    targetElement = editCommentTextareas.value[
      mentionContext.value.targetType
    ] as HTMLTextAreaElement;
  }

  if (!targetElement) return;

  const before = currentVal.slice(0, mentionContext.value.startIndex);
  const after = currentVal.slice(targetElement.selectionStart);

  const newVal = `${before}@${name} ${after}`;
  if (mentionContext.value.targetType === "new") {
    newComment.value = newVal;
  } else {
    editText.value = newVal;
  }

  // Track this mention metadata
  currentMentions.value.push({ name, id: user._id, email: user.email });

  mentionContext.value.active = false;
  const newPos = before.length + name.length + 1;

  nextTick(() => {
    if (targetElement) {
      targetElement.focus();
      targetElement.setSelectionRange(newPos, newPos);
    }
  });
}

function handleInviteClick() {
  mentionContext.value.active = false;
  showInviteModal.value = true;
}

function renderMentions(text: string) {
  if (!text) return "";
  return text.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="mention-highlight cursor-pointer hover:underline" data-user-id="$2">@$1</span>',
  );
}

function formatOverlay(text: string) {
  if (!text) return "";
  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const users = workspaceRoles.value || [];
  const userNames = users
    .flatMap((u: any) => [u.u_full_name, u.name, u.title])
    .filter(Boolean) as string[];

  if (userNames.length === 0) {
    return `<div class="text-text-primary whitespace-pre-wrap break-words">${escapedText.replace(/@([a-zA-Z0-9_.-]+)/g, '<strong class="mention-highlight">@$1</strong>')}</div>`;
  }

  userNames.sort((a, b) => b.length - a.length);
  const escapedNames = [...new Set(userNames)].map((n: string) =>
    n.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
  );
  const regex = new RegExp(
    `@(${escapedNames.join("|")}|[a-zA-Z0-9_.-]+)(?=\\s|[.,!?]|$)`,
    "gi",
  );

  const formatted = escapedText.replace(regex, (match) => {
    return `<strong class="mention-highlight">${match}</strong>`;
  });

  return `<div class="text-text-primary whitespace-pre-wrap break-words">${formatted}</div>`;
}
// ----------------------

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
const editAttachments = ref<any[]>([]);
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
      queryClient.invalidateQueries({ queryKey: ["cardDetail", propsID.value] });
      queryClient.invalidateQueries({
        queryKey: ["comments", props.details._id],
      });
      toast.success("Comment updated");
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });

function removeEditAttachment(index: number) {
  editAttachments.value.splice(index, 1);
}

//--------------- Delete Comment with Optimistic Update ---------------
const { mutate: deleteComment, isPending: isDeletingComment } =
  useDeleteComment({
    onMutate: async (variables: any) => {
      const cardId = props.details._id;
      const commentId = variables.id;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["comments", cardId] });
      await queryClient.cancelQueries({ queryKey: ["sheet-list"] });

      // Snapshot current state
      const previousLists = queryClient.getQueriesData({
        queryKey: ["sheet-list"],
      });
      const previousComments = queryClient.getQueryData(["comments", cardId]);

      // Optimistically remove comment from comments list
      queryClient.setQueryData(["comments", cardId], (old: any) => {
        if (!old?.comments) return old;
        return {
          ...old,
          comments: old.comments.filter((c: any) => c._id !== commentId),
        };
      });

      // Optimistically update comment count in sheet-list
      queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;

        return {
          ...old,
          data: old.data.map((column: any) => ({
            ...column,
            cards: column.cards?.map((card: any) =>
              card._id === cardId
                ? {
                    ...card,
                    comment_count: Math.max(0, (card.comment_count || 0) - 1),
                  }
                : card,
            ),
          })),
        };
      });

      return { previousLists, previousComments };
    },
    onError: (_err: any, _variables: any, context: any) => {
      if (context?.previousLists) {
        queryClient.setQueriesData(
          { queryKey: ["sheet-list"] },
          context.previousLists,
        );
      }
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", props.details._id],
          context.previousComments,
        );
      }
      toast.error("Failed to delete comment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", props.details._id],
      });
      queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
      queryClient.invalidateQueries({ queryKey: ["product-card"] });
      queryClient.invalidateQueries({ queryKey: ["cardDetail", propsID.value] });
    },
  });

function beginEdit(c: any) {
  editingId.value = c._id;
  currentMentions.value = [];

  let text = c.comment_text ?? "";
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const [_, name, id] = match;
    const user = workspaceRoles.value?.find(
      (u: any) => u._id === id || u.id === id,
    );
    currentMentions.value.push({
      name,
      id,
      email: user?.email || "",
    });
  }

  editText.value = text.replace(mentionRegex, "@$1");
  editAttachments.value = [...(c.attachments || [])];
}
function cancelEdit() {
  editingId.value = null;
  editText.value = "";
  editAttachments.value = [];
  editingTitle.value = false;
  currentMentions.value = [];
}
function saveEdit(c: any) {
  let text = editText.value.trim();
  if (!text) return;

  // Convert @Name to @[Name](ID) for payload
  const mentions: any[] = [];
  currentMentions.value.forEach((m) => {
    const mentionToken = `@${m.name}`;
    if (text.includes(mentionToken)) {
      text = text.replace(mentionToken, `@[${m.name}](${m.id})`);
      mentions.push({ id: m.id, name: m.name, email: m.email, type: "user" });
    }
  });

  const idx = comments.value.findIndex((x: any) => x._id === c._id);
  const prev = idx > -1 ? { ...comments.value[idx] } : null;
  if (idx > -1)
    comments.value[idx] = { ...comments.value[idx], comment_text: text };

  updateComment(
    {
      id: c._id,
      payload: {
        comment_text: text,
        mentions,
        module_name: props.moduleName,
        module_id: props.moduleId,
        attachments: editAttachments.value,
      },
    },
    {
      onError: () => {
        if (idx > -1 && prev) comments.value[idx] = prev;
      },
      onSuccess: (server: any) => {
        if (idx > -1) comments.value[idx] = server ?? comments.value[idx];
        cancelEdit();
        currentMentions.value = [];
        queryClient.invalidateQueries({ queryKey: ["product-card"] });
        queryClient.invalidateQueries({ queryKey: ["cardDetail", propsID.value] });
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
        toast.error("Failed to delete comment");
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["comments", props.details._id],
        });
        toast.success("Comment deleted");
      },
    },
  );
}
const attachments = computed(() => {
  const cardFiles = cardDetails.value?.attachments || [];
  const commentFiles = (cardDetails.value?.comments || []).flatMap((c: any) =>
    (c.attachments || []).map((a: any) => ({
      ...a,
      author: c.commented_by?.u_full_name,
      date: c.created_at,
    }))
  );

  const all = [...cardFiles, ...commentFiles];
  // Deduplicate by URL
  const unique = Array.from(new Map(all.map((item: any) => [item.url, item])).values());

  return unique.map((f: any) => ({
    _id: f._id ?? f.id ?? Math.random().toString(36).substr(2, 9),
    name: f.name ?? f.filename ?? "file",
    url: f.url,
    author: f.author,
    date: f.date,
    kind: f.url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? "image" :
          f.url.match(/\.(mp4|webm|ogg)$/i) ? "video" : "file"
  }));
});
const moveCard = useMoveCard({
  onMutate: async (newPayload: any) => {
    const { card_id, variables: updatedVariables } = newPayload;
    const cardId = String(card_id);
    const snapshots: { queryKey: any; data: any }[] = [];

    const boardKeys = [
      "sheet-list",
      "sprint-kanban",
      "table-cards-flat",
      "sprint-table-flat",
    ];
    const detailKeys = [
      ["cardDetail", cardId],
      ["product-card", cardId],
    ];

    const updates = { ...updatedVariables };
    if (newPayload.workspace_lane_id)
      updates.workspace_lane_id = newPayload.workspace_lane_id;
    if (newPayload.lane) updates.lane = newPayload.lane;
    if (newPayload.optimisticUser) {
      const users = Array.isArray(newPayload.optimisticUser)
        ? newPayload.optimisticUser
        : [newPayload.optimisticUser];
      updates.assigned_to = users;
      updates.seats = users;
      updates.seat_id = users.map((u: any) => u?._id || u?.id).filter(Boolean);
    }

    boardKeys.forEach((key) => {
      queryClient.setQueriesData(
        { queryKey: [key], exact: false },
        (oldData: any) => {
          if (!oldData) return oldData;
          snapshots.push({ queryKey: [key], data: oldData });
          return updateCardInStructure(oldData, cardId, updates);
        },
      );
    });

    detailKeys.forEach((key) => {
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old;
        snapshots.push({ queryKey: key, data: old });
        return updateCardOptimistically(old, cardId, updates);
      });
    });

    return { snapshots };
  },

  onSuccess: (serverCard: any, variables: any) => {
    const cardId = String(variables.card_id);
    if (serverCard) {
      const boardKeys = [
        "sheet-list",
        "sprint-kanban",
        "table-cards-flat",
        "sprint-table-flat",
      ];
      boardKeys.forEach((key) => {
        queryClient.setQueriesData(
          { queryKey: [key], exact: false },
          (old: any) => updateCardInStructure(old, cardId, serverCard),
        );
      });
      queryClient.setQueryData(["cardDetail", cardId], (old: any) => {
        if (!old) return serverCard;
        // Merge server response with existing data to prevent partial data from wiping out detail fields
        return { ...old, ...serverCard };
      });
    }
  },

  onError: (_err: any, _variables: any, context: any) => {
    if (context?.snapshots) {
      context.snapshots.forEach(({ queryKey, data }: any) => {
        queryClient.setQueryData(queryKey, data);
      });
    }
    toast.error("Failed to update card");
  },

  onSettled: (_data: any, _err: any, variables: any) => {
    const cardId = String(variables.card_id);
    queryClient.invalidateQueries({ queryKey: ["cardDetail", cardId] });
    [
      "sheet-list",
      "sprint-kanban",
      "table-cards-flat",
      "sprint-table-flat",
    ].forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  },
});
const commentAttachments = ref<any[]>([]);
const { mutate: uploadFile } = usePrivateUploadFile();

function removeAttachment(id: string) {
  commentAttachments.value = commentAttachments.value.filter(
    (a) => a.id !== id,
  );
}

function uploadSingleFile(file: File) {
  const tempId = Math.random().toString(36).substring(2, 9);
  const isImage = file.type.startsWith("image/");
  commentAttachments.value.push({
    id: tempId,
    name: file.name,
    loading: true,
    previewUrl: isImage ? URL.createObjectURL(file) : null,
  });

  const fd = new FormData();
  fd.append("file", file);

  uploadFile(fd, {
    onSuccess: (res: any) => {
      const item = commentAttachments.value.find((a) => a.id === tempId);
      if (item) {
        item.loading = false;
        item.data = res.data;
      }
      queryClient.invalidateQueries({ queryKey: ["cardDetail", propsID.value] });
    },
    onError: () => {
      removeAttachment(tempId);
      toast.error(`Failed to upload ${file.name}`);
    },
  });
}

function handleFileChange(event: any) {
  const files = event.target.files;
  Array.from(files).forEach((file: any) => uploadSingleFile(file));
}

function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      if (file) uploadSingleFile(file);
    }
  }
}
function postComment() {
  let comment_text = newComment.value.trim();
  if (!comment_text && !commentAttachments.value.length) return;

  const cardId = props.details._id;

  // Convert @Name to @[Name](ID) for payload
  const mentions: any[] = [];
  currentMentions.value.forEach((m) => {
    const mentionToken = `@${m.name}`;
    if (comment_text.includes(mentionToken)) {
      comment_text = comment_text.replace(
        mentionToken,
        `@[${m.name}](${m.id})`,
      );
      mentions.push({ id: m.id, name: m.name, email: m.email, type: "user" });
    }
  });

  // Call the mutation
  createComment({
    id: cardId,
    payload: {
      comment_text: comment_text,
      mentions,
      module_name: props.moduleName,
      module_id: props.moduleId,
      attachments: commentAttachments.value
        .filter((a) => !a.loading && a.data)
        .map((a: any) => ({
          name: a.data.name,
          url: a.data.url,
        })),
    },
  });

  // Clear input
  newComment.value = "";
  commentAttachments.value = [];
  currentMentions.value = [];
  if (fileInput.value) fileInput.value.value = "";
}
const localVarValues = reactive<Record<string, any>>({});
const initLocalVars = () => {
  if (cardDetails?.value?.variables) {
    const vars = cardDetails.value.variables ?? [];
    vars.forEach((v: any) => {
      if (!v) return;

      if (
        v.type === "Select" ||
        v.type === "Multi Select" ||
        v.type === "Radio" ||
        v.type === "Checkbox"
      ) {
        const first =
          Array.isArray(v.data) && v.data.length
            ? (v.data[0]?.value ?? v.data[0]?._id ?? v.data[0])
            : undefined;
        localVarValues[v.slug] =
          v.value ?? localVarValues[v.slug] ?? first ?? null;
      } else if (v.type === "Switch/Toggle") {
        localVarValues[v.slug] = !!v.value;
      } else {
        localVarValues[v.slug] = v.value ?? null;
      }
    });
  }
};
watch(
  () => cardDetails.value,
  (newDetails) => {
    if (newDetails?.variables) {
      newDetails.variables.forEach((variable: any) => {
        // This ensures the slug (e.g., 'card-type') is mapped to its value
        localVarValues[variable.slug] = variable.value;
      });
    }
  },
  { immediate: true },
);

onMounted(initLocalVars);
watch(() => cardDetails.value, initLocalVars, { deep: true });

function handleVariableUpdate(val: any, slug: string) {
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
const { mutate: deleteVar, isPending: isDeleting } = useDeleteVar();

const { mutate: updateVariable } = useUpdateVar();

/**
 * Helper to surgicaly update variable definitions across all card and board caches
 * This avoids repeating the same filtering/mapping logic.
 */
function broadUpdateVariables(transformer: (vars: any[]) => any[]) {
  const queryKeys = [["cardDetail"], ["product-card"]]; 


  // 1. Update card specific caches
  queryKeys.forEach((key) => {
    queryClient.setQueriesData({ queryKey: key }, (old: any) => {
      if (!old || !Array.isArray(old.variables)) return old;
      return { ...old, variables: transformer(old.variables) };
    });
  });

  // 2. Update the Board (sheet-list)
  queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
    if (!old || !Array.isArray(old.data)) return old;
    return {
      ...old,
      data: old.data.map((column: any) => ({
        ...column,
        cards: (column.cards || []).map((card: any) => {
          if (Array.isArray(card.variables)) {
            return { ...card, variables: transformer(card.variables) };
          }
          return card;
        }),
      })),
    };
  });
}

function handleVariableDefinitionUpdate({ id, payload }: any) {
  // Optimistic Definitions Update
  const updateTransformer = (vars: any[]) =>
    vars.map((v: any) => {
      if ((v.variable_id || v._id) === id) {
        return { ...v, title: payload.title, data: payload.data };
      }
      return v;
    });

  broadUpdateVariables(updateTransformer);

  // Update Global definitions list
  queryClient.setQueriesData(
    { queryKey: ["all-module-variables"] },
    (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((v: any) =>
        (v.variable_id || v._id) === id ? { ...v, ...payload } : v,
      );
    },
  );

  updateVariable(
    { id, payload },
    {
      onError: (err: any) => {
        console.error("Mutation failed:", err?.response ?? err);
        toast.error("Failed to update field definition");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["all-module-variables"] });
        queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
        queryClient.invalidateQueries({ queryKey: ["product-card"] });
        queryClient.invalidateQueries({ queryKey: ["cardDetail"] });
      },
    },
  );
}

const showDeleteModal = ref(false);
const selectedItem = ref<any>(null);

function handleDeleteVar(item: any) {
  selectedItem.value = item;
  showDeleteModal.value = true;
}

function confirmDelete() {
  if (!selectedItem.value) return;

  const itemToDelete = selectedItem.value;

  // Optimistic Deletion
  const deleteTransformer = (vars: any[]) =>
    vars.filter(
      (v: any) => (v.variable_id || v._id) !== itemToDelete.variable_id,
    );

  broadUpdateVariables(deleteTransformer);

  // Update Global list
  queryClient.setQueriesData(
    { queryKey: ["all-module-variables"] },
    (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.filter(
        (v: any) => (v.variable_id || v._id) !== itemToDelete.variable_id,
      );
    },
  );

  showDeleteModal.value = false;
  selectedItem.value = null;
  toast.success("Field deleted successfully");

  deleteVar(
    {
      id: itemToDelete.variable_id,
      module_id: props.moduleId ?? "",
    },
    {
      onError: () => {
        toast.error("Failed to delete field");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["product-card"] });
        queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
        queryClient.invalidateQueries({ queryKey: ["all-module-variables"] });
        queryClient.invalidateQueries({ queryKey: ["cardDetail"] });
      },
    },
  );
}

function handleEditVar(item: any) {
  selectedVarToEdit.value = item;
  isEditVar.value = true;
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
/* Mentions */
:global(.mention-highlight) {
  background-color: rgba(var(--primary-color-rgb, 99, 102, 241), 0.15);
  color: var(--primary-color, #6366f1);
  padding: 1px 0;
  border-radius: 4px;
  font-weight: 400; /* Must match textarea exactly to prevent width drift */
  box-shadow: 0 0 0 1px rgba(var(--primary-color-rgb, 99, 102, 241), 0.2);
  display: inline;
}
.word-break :deep(p) {
  overflow-wrap: break-word !important;
}

/* ─── File attachment links rendered via v-html in description view mode ─────── */
.word-break :deep(a.file-attachment-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.7rem;
  margin: 0.2rem 0;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  text-decoration: none !important;
  border: 1px solid rgba(124, 58, 237, 0.25);
  background: rgba(124, 58, 237, 0.07);
  color: #a78bfa;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.word-break :deep(a.file-attachment-link:hover) {
  background: rgba(124, 58, 237, 0.16);
  border-color: rgba(124, 58, 237, 0.45);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
}

.word-break :deep(a) {
  color: var(--color-text-primary, #6b7280) !important;
  text-decoration: underline !important;
}

.word-break :deep(img) {
  margin: 12px 0;
  border-radius: 8px;
  display: block;
  max-width: 100%;
}

</style>
