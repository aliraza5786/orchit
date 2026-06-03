<template>
  <div
    v-if="workspaceStore.showChatBotPanel"
    :class="[
      'flex h-full bg-bg-surface overflow-y-auto rounded-[6px] border border-border overflow-x-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl',
      isExpanded
        ? 'min-w-full max-w-full'
        : 'min-w-full max-w-[380px] sm:min-w-[380px]',
    ]"
    role="complementary"
    aria-label="Details panel"
  >
    <!-- ==================== LEFT: PREVIEW MODAL ==================== -->
    <div
      v-if="isExpanded && !showConfigPanel && hasPreviewData"
      class="flex-1 border-r border-border bg-bg-surface h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
    >
      <ChatBotPreviewModal
        @accept="acceptChanges"
        @decline="declineAgentGeneratedEntities"
        :title="contextTitle"
        :data="entities"
      />
    </div>

    <!-- ==================== LEFT: CONFIG PANEL ==================== -->
    <div
      v-if="isExpanded && showConfigPanel"
      class="flex-1 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden"
    >
      <!-- HEADER -->
      <div
        class="px-6 py-4 bg-gradient-to-b from-bg-card to-bg-card/80 border-b border-border"
      >
        <div class="flex items-center gap-2.5 mb-1">
          <div
            class="w-8 h-8 rounded-lg bg-primary-color/10 flex items-center justify-center"
          >
            <i class="fa-solid fa-sliders text-primary-color text-sm"></i>
          </div>
          <div>
            <h3
              class="text-base text-text-primary font-semibold tracking-tight"
            >
              Agent Setup & Controls
            </h3>
            <p class="text-text-secondary text-[12px] leading-snug">
              Configure modules, data sources & execution rules.
            </p>
          </div>
        </div>

        <!-- TABS — pill style -->
        <div
          class="mt-4 flex gap-1 border-b border-border pb-2 overflow-x-auto"
        >
          <button
            v-for="tab in configTabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex-1 min-w-0 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-primary-color text-white shadow-sm shadow-primary-color/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-body',
            ]"
          >
            <i :class="[tab.icon, 'mr-1 text-[10px]']"></i>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-y-auto flex flex-col">
        <div class="p-6 space-y-8">
          <!-- ================= PERSONA TAB ================= -->
          <div v-if="activeTab === 'persona'" class="space-y-5">
            <!-- Skeleton Loader -->
            <div v-if="isLoadingSettings" class="space-y-4">
              <div
                class="animate-pulse space-y-2"
                v-for="n in 4"
                :key="'skel-' + n"
              >
                <div class="h-4 w-1/3 bg-bg-body rounded-md"></div>
                <div class="h-10 w-full bg-bg-body rounded-lg"></div>
              </div>
              <div
                class="animate-pulse space-y-2 mt-2"
                v-for="n in 3"
                :key="'cap-skel-' + n"
              >
                <div class="h-4 w-2/5 bg-bg-body rounded-md"></div>
              </div>
              <div
                class="h-11 w-full bg-bg-body rounded-lg mt-4 animate-pulse"
              ></div>
            </div>

            <!-- Full Form -->
            <div v-else class="space-y-5">
              <!-- Agent Name -->
              <div class="space-y-1.5">
                <label
                  class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >Agent Name</label
                >
                <BaseTextField
                  v-model="agentConfig.name"
                  placeholder="Enter agent name..."
                />
              </div>

              <!-- Description -->
              <div class="space-y-1.5">
                <label
                  class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >Description</label
                >
                <BaseTextAreaField
                  v-model="agentConfig.description"
                  placeholder="Describe what this agent does..."
                />
              </div>

              <!-- Role Select -->
              <div class="space-y-1.5">
                <label
                  class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >Select Role</label
                >
                <BaseSelectField
                  size="md"
                  v-model="selectedRole"
                  :options="roleOptions"
                  placeholder="Select Role"
                />
              </div>

              <!-- Job Role Select -->
              <div class="space-y-1.5">
                <label
                  class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >Select Job Role</label
                >
                <BaseSelectField
                  size="md"
                  v-model="selectJobRole"
                  :options="jobOptions"
                  placeholder="Select Job Role"
                />
              </div>

              <!-- Level -->
              <div class="space-y-1.5" ref="levelRef">
                <label
                  class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >Level</label
                >
                <BaseSelectField
                  v-model="agentConfig.level"
                  :options="
                    availableAgentsLevels.map((l) => ({
                      _id: l.value,
                      title: l.title,
                    }))
                  "
                  placeholder="Select Level"
                />
              </div>

              <!-- Tag Inputs -->
              <TagInput
                v-model="agentConfig.responsibilities"
                label="Responsibilities"
              />
              <TagInput v-model="agentConfig.skills" label="Skills" />
              <TagInput
                v-model="agentConfig.competencies"
                label="Competencies"
              />
              <TagInput
                v-model="agentConfig.conditions_rules"
                label="Conditions / Rules"
              />

              <!-- Sheet selection -->
              <div
                class="flex gap-2.5 items-start"
                v-if="transformedData?.length"
              >
                <Checkbox
                  :checked="isSheet"
                  @change="
                    (e) => (isSheet = (e.target as HTMLInputElement).checked)
                  "
                  class="mt-0.5"
                  :inSpace="true"
                />
                <span class="text-sm text-text-primary leading-snug">
                  Enable to create the agent for a selected sheet instead of all
                  sheets
                </span>
              </div>

              <div class="space-y-1.5 w-full" ref="sheetRef" v-if="isSheet">
                <Dropdown
                  v-model="selected_sheet_id"
                  :options="transformedData"
                  customTitle="Select Sheet"
                  class="w-full block"
                  :inSpace="true"
                />
              </div>

              <!-- Capabilities -->
              <div class="space-y-3">
                <label
                  class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                  >Capabilities</label
                >
                <div class="grid gap-2">
                  <label
                    v-for="capability in availableCapabilities"
                    :key="capability.value"
                    class="flex items-center gap-3 px-3 py-2 rounded-md border border-border hover:border-primary-color/30 hover:bg-primary-color/4 transition-all cursor-pointer"
                  >
                    <Checkbox
                      :checked="
                        agentConfig.capabilities.includes(capability.value)
                      "
                      @change="
                        (e) => {
                          if ((e.target as HTMLInputElement).checked) {
                            agentConfig.capabilities.push(capability.value);
                          } else {
                            agentConfig.capabilities =
                              agentConfig.capabilities.filter(
                                (c) => c !== capability.value,
                              );
                          }
                        }
                      "
                      :inSpace="true"
                    />
                    <span class="text-sm text-text-primary">{{
                      capability.label
                    }}</span>
                  </label>
                </div>
              </div>

              <!-- Action Buttons -->
              <Button
                @click="submitPersona"
                v-if="!agentsData || !agentConfig?.id"
                :disabled="isLoading || !agentConfig.name || !agentConfig.role"
                variant="primary"
                :inSpace="true"
                block
                class="mt-2"
                :loading="isLoading"
              >
                {{ isLoading ? "Saving..." : "Save Agent" }}
              </Button>

              <div
                class="flex gap-3 w-full"
                v-if="agentsData && agentConfig?.id"
              >
                <Button
                  @click="deleteAgent(agentConfig.id)"
                  :disabled="
                    agentStore.isDeletingAgent ||
                    !agentConfig.name ||
                    !agentConfig.role
                  "
                  variant="danger"
                  appearance="outlined"
                  :inSpace="true"
                  class="flex-1"
                  :loading="agentStore.isDeletingAgent"
                >
                  <i
                    v-if="!agentStore.isDeletingAgent"
                    class="fa-regular fa-trash mr-1.5"
                  ></i>
                  {{ agentStore.isDeletingAgent ? "Deleting..." : "Delete" }}
                </Button>
                <Button
                  @click="updateAgent(agentConfig.id)"
                  :disabled="
                    agentStore.isUpdatingAgent ||
                    !agentConfig.name ||
                    !agentConfig.role
                  "
                  variant="primary"
                  :inSpace="true"
                  class="flex-1"
                  :loading="agentStore.isUpdatingAgent"
                >
                  {{
                    agentStore.isUpdatingAgent ? "Updating..." : "Update Agent"
                  }}
                </Button>
              </div>
            </div>
          </div>

          <!-- ================= KNOWLEDGE TAB ================= -->
          <div v-if="activeTab === 'knowledge'" class="space-y-5">
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                >Sources</label
              >
              <div class="flex flex-col mt-2 gap-2">
                <div
                  v-for="source in sourceList"
                  :key="source.value"
                  class="relative"
                  ref="refsMap[source.value]"
                >
                  <button
                    type="button"
                    @click="toggleSourceDropdown(source.value)"
                    class="w-full flex justify-between items-center border border-border bg-bg-input rounded-md px-4 py-2.5 text-sm hover:border-primary-color/30 transition-colors"
                  >
                    <span class="text-text-primary">{{ source.label }}</span>
                    <i
                      class="fa-regular fa-chevron-down text-text-secondary transition-transform duration-200 text-[10px]"
                      :class="{ 'rotate-180': openDropdowns[source.value] }"
                    ></i>
                  </button>
                  <transition name="dropdown">
                    <div
                      v-if="openDropdowns[source.value]"
                      class="absolute z-[999] mt-1 w-full rounded-md border border-border bg-bg-dropdown shadow-lg shadow-black/8 overflow-hidden"
                    >
                      <ul class="py-1 text-sm flex flex-col gap-0.5">
                        <li class="px-4 pt-2 pb-1">
                          <span
                            class="text-[10px] font-bold text-text-secondary uppercase tracking-wider"
                            >Permissions</span
                          >
                        </li>
                        <li
                          v-for="perm in permissionsMap[source.value]"
                          :key="perm.value"
                          class="px-4 py-2 cursor-pointer hover:bg-primary-color/6 flex items-center gap-2.5 transition-colors"
                        >
                          <Checkbox
                            :checked="
                              knowledgePermissions[
                                source.value as keyof typeof knowledgePermissions
                              ][
                                perm.value as keyof (typeof knowledgePermissions)['INTERNAL_TICKET']
                              ]
                            "
                            @change="
                              (e) => {
                                knowledgePermissions[
                                  source.value as keyof typeof knowledgePermissions
                                ][
                                  perm.value as keyof (typeof knowledgePermissions)['INTERNAL_TICKET']
                                ] = (e.target as HTMLInputElement).checked;
                              }
                            "
                            :inSpace="true"
                          />
                          <span class="text-text-primary">{{
                            getPermissionLabel(
                              source.value as keyof typeof knowledgePermissions,
                              perm.value,
                            )
                          }}</span>
                        </li>
                      </ul>
                    </div>
                  </transition>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                >Metadata (JSON)</label
              >
              <BaseTextAreaField
                v-model="knowledgeMetadataString"
                class="font-mono text-[12px]"
              />
            </div>

            <label
              class="flex items-center gap-3 px-3 py-2 rounded-md border border-border hover:border-primary-color/30 hover:bg-primary-color/4 transition-all cursor-pointer"
            >
              <Checkbox
                :checked="knowledgeConfig.is_active"
                @change="
                  (e) =>
                    (knowledgeConfig.is_active = (
                      e.target as HTMLInputElement
                    ).checked)
                "
                :inSpace="true"
              />
              <span class="text-sm text-text-primary">Active Source</span>
            </label>

            <Button
              @click="submitKnowledge"
              :disabled="isKnowledgeLoading || !moduleId || !moduleSelected"
              variant="primary"
              :inSpace="true"
              block
              class="mt-2"
              :loading="isKnowledgeLoading"
            >
              {{ isKnowledgeLoading ? "Saving..." : "Save Knowledge" }}
            </Button>
          </div>

          <!-- ================= TRAINING CONTENT TAB ================= -->
          <div v-if="activeTab === 'upload'" class="space-y-5">
            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                >Training Name</label
              >
              <BaseTextField v-model="uploadConfig.name" disabled />
            </div>

            <div class="space-y-1.5" ref="typeRef">
              <label
                class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                >Type</label
              >
              <BaseSelectField
                v-model="uploadConfig.type"
                :options="
                  availableUploadTypes.map((t) => ({
                    _id: t.value,
                    title: t.label,
                  }))
                "
                placeholder="Select Type"
              />
            </div>

            <div class="space-y-1.5">
              <label
                class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                >Training Text</label
              >
              <BaseTextAreaField
                v-model="uploadConfig.text"
                placeholder="Paste training content here..."
              />
            </div>

            <!-- File Upload Zone -->
            <div
              class="relative border border-dashed border-border bg-bg-input rounded-md px-4 py-6 text-center hover:border-primary-color/30 transition-all cursor-pointer"
              @click="triggerFileInput"
            >
              <i
                class="fa-solid fa-cloud-arrow-up text-2xl text-text-tertiary mb-2"
              ></i>
              <p class="text-sm text-text-secondary">
                Drag & drop files or
                <span class="text-primary-color font-medium">browse</span>
              </p>
              <p class="text-[11px] text-text-tertiary mt-1">
                Supports documents, text files, PDFs
              </p>
              <input
                ref="trainingFileInput"
                type="file"
                multiple
                @change="handleUploadFiles"
                class="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <!-- Uploaded files list -->
            <div v-if="uploadConfig.files.length" class="space-y-1.5">
              <div
                v-for="(file, i) in uploadConfig.files"
                :key="i"
                class="flex justify-between items-center text-sm border border-border rounded-md px-3 py-2 bg-bg-input group"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <i class="fa-solid fa-file text-primary-color/60 text-xs"></i>
                  <span class="truncate text-text-primary">{{
                    file.name
                  }}</span>
                </div>
                <button
                  @click="uploadConfig.files.splice(i, 1)"
                  class="text-text-tertiary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2"
                >
                  <i class="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            </div>

            <Button
              @click="submitTrainingContent"
              :disabled="
                !uploadConfig.name ||
                (uploadConfig.text === '' && uploadConfig.files.length === 0) ||
                isUploading
              "
              variant="primary"
              :inSpace="true"
              block
              class="mt-2"
              :loading="isUploading"
            >
              <i v-if="!isUploading" class="fa-solid fa-upload mr-1.5"></i>
              {{ isUploading ? "Uploading..." : "Upload Training Content" }}
            </Button>
          </div>

          <!-- ================= PROMPT FLOWS TAB ================= -->
          <div
            class="flex flex-col"
            style="height: calc(87vh - 100px)"
            v-if="activeTab === 'prompt'"
          >
            <div class="flex-1 overflow-y-auto space-y-2.5">
              <!-- Header -->
              <div class="flex items-center justify-between gap-3 px-1 py-1">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    id="select-all"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                    :inSpace="true"
                  />
                  <span
                    class="text-xs font-semibold text-text-primary uppercase tracking-wider"
                    >Select All</span
                  >
                </label>

                <div class="relative">
                  <i
                    class="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-[10px]"
                  ></i>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Filter prompts..."
                    class="pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-bg-input focus:border-primary-color/30 focus:ring-1 focus:ring-primary-color/10 outline-none transition-all w-40"
                  />
                </div>
              </div>

              <!-- Module accordions -->
              <div
                v-for="module in filteredModules"
                :key="module.module_title"
                class="border border-border rounded-md overflow-hidden bg-bg-surface"
              >
                <button
                  @click="toggleModule(module.module_title)"
                  class="w-full px-4 py-2.5 flex justify-between items-center hover:bg-primary-color/4 transition-colors"
                >
                  <span class="text-sm font-medium text-text-primary">
                    {{ module.module_title }}
                  </span>
                  <i
                    :class="[
                      'fa-solid fa-chevron-down text-[10px] text-text-secondary transition-transform duration-200',
                      openModules[module.module_title] ? 'rotate-180' : '',
                    ]"
                  ></i>
                </button>

                <div
                  v-show="openModules[module.module_title]"
                  class="border-t border-border bg-bg-surface"
                >
                  <label
                    v-for="action in module.granted_actions"
                    :key="action._id"
                    class="flex items-start gap-2.5 hover:bg-primary-color/4 px-4 py-2.5 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      :checked="action.is_selected"
                      @change="
                        (e) =>
                          (action.is_selected = (
                            e.target as HTMLInputElement
                          ).checked)
                      "
                      :id="action._id"
                      class="mt-0.5"
                      :inSpace="true"
                    />
                    <span class="text-sm text-text-primary select-none">{{
                      action.title
                    }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="pt-4 shrink-0">
              <Button
                @click="savePromptActions"
                :disabled="isSavingPrompt"
                variant="primary"
                :inSpace="true"
                block
                :loading="isSavingPrompt"
              >
                {{ isSavingPrompt ? "Saving..." : "Save Prompt" }}
              </Button>
            </div>
          </div>

          <!-- ================= SUGGESTED PROMPTS TAB ================= -->
          <div v-if="activeTab === 'suggested'" class="space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-semibold text-text-primary">
                  Suggested Prompts
                </h4>
                <p class="text-[11px] text-text-secondary mt-0.5">
                  Pre-configured prompts shown to users as quick actions.
                </p>
              </div>
              <button
                @click="addSuggestedPrompt"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary-color/30 bg-primary-color/8 text-primary-color text-xs font-medium hover:bg-primary-color/15 transition-all cursor-pointer"
              >
                <i class="fa-solid fa-plus text-[10px]"></i>
                Add
              </button>
            </div>

            <!-- Empty state -->
            <div
              v-if="!suggestedPrompts.length"
              class="flex flex-col items-center justify-center py-12 text-center"
            >
              <div
                class="w-14 h-14 rounded-2xl bg-primary-color/8 flex items-center justify-center mb-3"
              >
                <i class="fa-solid fa-lightbulb text-primary-color text-xl"></i>
              </div>
              <p class="text-sm font-semibold text-text-primary">
                Welcome back! Ask me anything
                <span v-if="selectedSource === 'all'">
                  about
                  <span class="text-primary-color">{{
                    contextTitle
                  }}</span></span
                >
                <span v-else>
                  using
                  <span class="text-primary-color">{{
                    activeSource.label
                  }}</span></span
                >.
              </p>
              <p class="text-[12px] text-text-tertiary">
                <span v-if="selectedSource === 'web'"
                  >Web search is active — I'll search the internet for
                  answers.</span
                >
                <span v-else-if="selectedSource === 'all'"
                  >Searching across your workspace, tasks, docs and more.</span
                >
                <span v-else
                  >Focused on {{ activeSource.label }} —
                  {{ activeSource.description?.toLowerCase() }}.</span
                >
              </p>
            </div>

            <!-- Prompt cards -->
            <div v-else class="space-y-2.5">
              <div
                v-for="(prompt, index) in suggestedPrompts"
                :key="index"
                class="group relative border border-border rounded-md p-3.5 bg-bg-surface hover:border-primary-color/30 hover:shadow-sm transition-all"
              >
                <!-- Category badge -->
                <div class="flex items-center gap-2 mb-2.5">
                  <div class="relative flex-1">
                    <i
                      class="fa-solid fa-tag absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-[10px]"
                    ></i>
                    <input
                      v-model="prompt.category"
                      placeholder="Category (e.g. Analysis, Report)"
                      class="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-md bg-bg-input focus:border-primary-color/30 outline-none transition-all font-medium text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
                  <button
                    @click="removeSuggestedPrompt(index)"
                    class="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/8 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <i class="fa-solid fa-trash text-[10px]"></i>
                  </button>
                </div>

                <!-- Label -->
                <BaseTextField
                  v-model="prompt.label"
                  placeholder="Button label (e.g. Summarize data)"
                  class="mb-2"
                />

                <!-- Prompt text -->
                <BaseTextAreaField
                  v-model="prompt.text"
                  placeholder="Full prompt text that will be sent..."
                />

                <!-- Toggle active -->
                <label
                  class="flex items-center gap-3 px-3 py-2 rounded-md border border-border hover:border-primary-color/30 hover:bg-primary-color/4 transition-all cursor-pointer mt-2.5"
                >
                  <Checkbox
                    :checked="prompt.is_active"
                    @change="
                      (e) =>
                        (prompt.is_active = (
                          e.target as HTMLInputElement
                        ).checked)
                    "
                    :inSpace="true"
                  />
                  <span class="text-sm text-text-primary">Active</span>
                </label>
              </div>
            </div>

            <!-- Save button -->
            <Button
              @click="saveSuggestedPrompts"
              :disabled="isSavingSuggested"
              variant="primary"
              :inSpace="true"
              block
              class="mt-2"
              :loading="isSavingSuggested"
            >
              <i
                v-if="!isSavingSuggested"
                class="fa-regular fa-floppy-disk mr-1.5"
              ></i>
              {{ isSavingSuggested ? "Saving..." : "Save Suggested Prompts" }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== RIGHT: CHAT PANEL ==================== -->
    <div
      :class="[
        'relative bg-bg-surface h-full min-h-0 flex flex-col overflow-x-hidden transition-all duration-300',
        isExpanded ? 'w-full md:w-[380px] sm:min-w-[380px] shrink-0 border-l border-border' : 'w-full',
      ]"
    >
      <!-- Chat Header -->
      <div
        class="flex items-center border-b border-border px-3.5 py-2.5 sticky top-0 bg-bg-surface z-30 gap-2"
      >
        <h5
          class="text-sm font-semibold flex items-center gap-1.5 min-w-0 flex-1"
        >
          <div class="w-7 h-7 rounded-full flex items-center justify-center">
            <i class="fa-solid fa-sparkles text-primary-color text-[14px]"></i>
          </div>
          <Dropdown
            :inSpace="true"
            v-model="selectedAgentId"
            :options="agentOptions"
            :custom-title="selectedAgentName"
            :actions="false"
            size="sm"
            variant="secondary"
            :isAgent="true"
            class="relative min-w-0 max-w-[150px]"
          >
            <template #more>
              <div
                @click="openConfigPanel"
                class="capitalize border-t border-border px-4 py-1.5 hover:bg-primary-color/8 cursor-pointer flex items-center gap-2 overflow-hidden overflow-ellipsis text-nowrap text-xs transition-colors"
              >
                <i class="fa-solid fa-plus text-primary-color text-[10px]"></i>
                Add new
              </div>
            </template>
          </Dropdown>
        </h5>

        <div class="flex items-center gap-1 shrink-0">
          <button
            class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
            @click="showHistoryPanel = !showHistoryPanel"
            title="Chat history"
          >
            <i class="fa-regular fa-clock-rotate-left text-[16px]"></i>
          </button>
          <button
            class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
            @click="startNewChat"
            title="New chat"
          >
            <i class="fa-regular fa-pen-to-square text-[16px]"></i>
          </button>
          <button
            v-if="!isExpanded"
            class="shrink-0 hidden sm:flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
            @click="expandPanel"
            title="Expand"
          >
            <i class="fa-solid fa-expand text-[16px]"></i>
          </button>
          <button
            v-else
            class="shrink-0 hidden sm:flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
            @click="compressPanel"
            title="Compress"
          >
            <i class="fa-solid fa-compress text-[16px]"></i>
          </button>
          <button
            class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
            @click="openConfigPanel"
            :title="showConfigPanel ? 'Preview Data' : 'Agent Configuration'"
          >
            <i class="fa-regular fa-gear text-[16px]"></i>
          </button>
          <button
            class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
            @click="closeHandler"
            title="Close"
          >
            <i class="fa-solid fa-xmark text-[16px]"></i>
          </button>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto min-h-0 p-4 space-y-3"
      >
        <!-- New skeleton loader -->
        <div
          v-if="agentStore.isLoadingHistory && !hasEverLoaded"
          class="flex flex-col gap-4 p-4"
        >
          <!-- Assistant bubble skeleton -->
          <div class="flex gap-2.5">
            <div
              class="w-7 h-7 rounded-full bg-bg-body animate-pulse shrink-0"
            ></div>
            <div class="flex flex-col gap-1.5 max-w-[75%]">
              <div
                class="h-9 w-52 bg-bg-body animate-pulse rounded-2xl rounded-tl-md"
              ></div>
              <div class="h-4 w-32 bg-bg-body animate-pulse rounded-full"></div>
            </div>
          </div>

          <!-- User bubble skeleton -->
          <div class="flex gap-2.5 flex-row-reverse">
            <div
              class="w-7 h-7 rounded-full bg-bg-body animate-pulse shrink-0"
            ></div>
            <div class="flex flex-col gap-1.5 items-end max-w-[75%]">
              <div
                class="h-9 w-44 bg-primary-color/20 animate-pulse rounded-2xl rounded-tr-md"
              ></div>
              <div class="h-4 w-20 bg-bg-body animate-pulse rounded-full"></div>
            </div>
          </div>

          <!-- Assistant bubble skeleton — longer -->
          <div class="flex gap-2.5">
            <div
              class="w-7 h-7 rounded-full bg-bg-body animate-pulse shrink-0"
            ></div>
            <div class="flex flex-col gap-1.5 max-w-[75%]">
              <div
                class="h-20 w-64 bg-bg-body animate-pulse rounded-2xl rounded-tl-md"
              ></div>
              <div class="h-4 w-24 bg-bg-body animate-pulse rounded-full"></div>
            </div>
          </div>

          <!-- User bubble skeleton -->
          <div class="flex gap-2.5 flex-row-reverse">
            <div
              class="w-7 h-7 rounded-full bg-bg-body animate-pulse shrink-0"
            ></div>
            <div class="flex flex-col gap-1.5 items-end max-w-[75%]">
              <div
                class="h-12 w-56 bg-primary-color/20 animate-pulse rounded-2xl rounded-tr-md"
              ></div>
              <div class="h-4 w-20 bg-bg-body animate-pulse rounded-full"></div>
            </div>
          </div>

          <!-- Assistant bubble skeleton -->
          <div class="flex gap-2.5">
            <div
              class="w-7 h-7 rounded-full bg-bg-body animate-pulse shrink-0"
            ></div>
            <div class="flex flex-col gap-1.5 max-w-[75%]">
              <div
                class="h-14 w-48 bg-bg-body animate-pulse rounded-2xl rounded-tl-md"
              ></div>
              <div class="h-4 w-28 bg-bg-body animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
        <template
          v-else-if="orderedMessages.length || isAiThinkingBubbleVisible"
        >
          <div
            v-for="msg in orderedMessages"
            :key="msg._id"
            class="flex gap-2.5 relative animate-fade-in group/msg"
            :class="msg.type === 'user' ? 'flex-row-reverse' : ''"
          >
            <!-- Avatar -->
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm"
              :class="
                msg.type === 'user'
                  ? 'bg-gradient-to-br from-primary-color/20 to-primary-color/5 border border-primary-color/20'
                  : 'bg-gradient-to-br from-primary-color/15 to-primary-color/5 border border-primary-color/15'
              "
            >
              <i
                v-if="msg.type === 'assistant'"
                class="fa-solid fa-robot text-primary-color text-[11px]"
              ></i>
              <span
                v-else-if="msg.type === 'user'"
                class="text-[9px] font-bold text-primary-color"
                >ME</span
              >
            </div>

            <!-- Bubble wrapper -->
            <div
              class="relative flex flex-col overflow-hidden"
              :class="
                msg.type === 'user'
                  ? 'max-w-[75%] w-fit ml-auto'
                  : 'max-w-[75%]'
              "
            >
              <!-- Empty assistant response -->
                <div
                  v-if="msg.type === 'assistant' && !msg.content"
                  class="px-3.5 py-2 rounded-2xl text-sm leading-relaxed bg-bg-body border border-border text-text-secondary rounded-tl-md wrap-break-word flex items-center gap-2"
                >
                  <i class="fa-regular fa-circle-stop text-text-tertiary text-[13px]"></i>
                  <span>Generation stopped</span>
                </div>

              <!-- Main bubble -->
              <div
                v-else
                class="px-3.5 py-2 rounded-2xl text-sm leading-relaxed relative min-w-0 wrap-break-word"
                :class="
                  msg.type === 'user'
                    ? 'bg-primary-color text-white rounded-tr-md shadow-sm shadow-primary-color/15 w-full'
                    : 'bg-bg-body border border-border text-text-primary rounded-tl-md'
                "
              >
                <!-- Message menu trigger -->
                <button
                  v-if="
                    activeSessionId && !(msg.metadata as MessageMetadata)?.temp
                  "
                  @click.stop="toggleMsgMenu(msg._id)"
                  class="absolute top-1.5 right-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 w-5 h-5 flex items-center justify-center rounded-md cursor-pointer"
                  :class="
                    msg.type === 'user'
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-black/5'
                  "
                >
                  <i class="fa-solid fa-ellipsis text-[9px]"></i>
                </button>

                <!-- Message content -->
                <p class="whitespace-pre-wrap pr-4" v-if="msg.content">
                  {{ msg.content }}
                </p>

                <!-- Attachments -->
                <div
                  v-if="msg.attachments && msg.attachments.length"
                  class="flex flex-wrap gap-1.5 mt-1.5"
                >
                  <div
                    v-for="(attachment, idx) in msg.attachments"
                    :key="idx"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]"
                    :class="
                      msg.type === 'user'
                        ? 'bg-white/15 text-white/90'
                        : 'border border-primary-color/20 bg-primary-color/5 text-text-primary'
                    "
                  >
                    <i
                      class="fa-solid"
                      :class="[
                        attachment.mimetype === 'application/pdf'
                          ? 'fa-file-pdf'
                          : 'fa-file-image',
                        msg.type === 'user'
                          ? 'text-white/80'
                          : 'text-primary-color',
                      ]"
                    ></i>
                    <span class="max-w-[100px] truncate">{{
                      attachment.filename || attachment.name
                    }}</span>
                  </div>
                </div>

                <!-- Interactive Preview Action Card -->
                <div
                  v-if="msg.type === 'assistant' && hasEntitiesForMessage(msg._id)"
                  class="mt-3 p-3 rounded-xl border border-primary-color/20 bg-primary-color/5 hover:bg-primary-color/10 transition duration-200 flex flex-col gap-2 shadow-sm"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-primary-color/15 flex items-center justify-center shrink-0">
                      <i class="fa-solid fa-sparkles text-primary-color text-xs"></i>
                    </div>
                    <span class="text-xs font-semibold text-text-primary">
                      {{ getMessageEntityTitle(msg._id) }}
                    </span>
                  </div>
                  <p class="text-[11px] text-text-secondary leading-snug">
                    {{ getMessageEntityDescription(msg._id) }}
                  </p>
                  <button
                    @click.stop="openPreviewFromMessage(msg._id)"
                    class="mt-1 w-full py-1.5 px-3 rounded-lg bg-primary-color hover:bg-primary-color-hover text-white text-xs font-medium transition duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <i class="fa-solid fa-expand text-[10px]"></i>
                    <span>Open Interactive Preview</span>
                  </button>
                </div>

                <!-- Timing pills + timestamp footer -->
                <div class="mt-1.5 flex flex-col gap-1">
                  <!-- Timing pills — assistant only, when metadata has timing -->
                  <div
                    v-if="false"
                    class="flex items-center gap-1.5 flex-wrap"
                  >
                    <span
                      v-if="msg.metadata?.think_ms"
                      class="inline-flex items-center gap-1 text-[10px] text-text-tertiary bg-bg-body border border-border px-2 py-0.5 rounded-full"
                    >
                      <i
                        class="fa-solid fa-brain text-primary-color text-[8px]"
                      ></i>
                      Thought {{ (msg.metadata.think_ms / 1000).toFixed(1) }}s
                    </span>
                    <span
                      v-if="msg.metadata?.total_ms"
                      class="inline-flex items-center gap-1 text-[10px] text-text-tertiary bg-bg-body border border-border px-2 py-0.5 rounded-full"
                    >
                      <i
                        class="fa-regular fa-clock text-primary-color text-[8px]"
                      ></i>
                      {{ (msg.metadata.total_ms / 1000).toFixed(1) }}s total
                    </span>
                  </div>

                  <!-- Timestamp row -->
                  <div
                    class="flex justify-end items-center gap-1.5 text-[10px]"
                    :class="
                      msg.type === 'user'
                        ? 'text-white/60'
                        : 'text-text-tertiary'
                    "
                  >
                    <span>{{ formatTimestamp(msg.timestamp) }}</span>
                    <i
                      v-if="msg.is_pinned"
                      class="fa-solid fa-thumbtack text-[9px]"
                      :class="
                        msg.type === 'user'
                          ? 'text-white/70'
                          : 'text-primary-color'
                      "
                      title="Pinned message"
                    ></i>
                    <span v-if="msg.type === 'user'">
                      <i
                        v-if="msg.metadata?.status === 'completed'"
                        class="fa-solid fa-check-double text-green-300"
                      ></i>
                      <i v-else class="fa-solid fa-check text-white/50"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Message dropdown menu -->
              <transition name="dropdown">
                <div
                  v-if="openMsgMenuId === msg._id"
                  class="absolute z-50 top-8 w-40 rounded-xl border border-border bg-bg-card shadow-lg shadow-black/8 py-1 overflow-hidden"
                  :class="msg.type === 'user' ? 'right-0' : 'right-0'"
                >
                  <button
                    @click.stop="
                      togglePinMessage(msg);
                      openMsgMenuId = null;
                    "
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-primary hover:bg-primary-color/8 hover:text-primary-color transition-colors cursor-pointer"
                  >
                    <i
                      class="text-[11px] w-3"
                      :class="
                        (msg as any).is_pinned
                          ? 'fa-solid fa-thumbtack text-primary-color'
                          : 'fa-regular fa-thumbtack text-text-secondary'
                      "
                    ></i>
                    <span>{{
                      (msg as any).is_pinned ? "Unpin message" : "Pin message"
                    }}</span>
                  </button>
                </div>
              </transition>

              <!-- Like, Dislike, Copy buttons for assistant messages -->
              <div
                v-if="
                  msg.type === 'assistant' && msg.content && activeSessionId
                "
                class="flex items-center gap-1.5 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150"
              >
                <button
                  @click.stop="toggleLike(msg._id)"
                  title="Like this response"
                  :class="[
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer',
                    likedMessages.has(msg._id)
                      ? 'text-primary-color bg-primary-color/8'
                      : 'text-text-secondary hover:text-primary-color hover:bg-primary-color/8',
                  ]"
                >
                  <i
                    :class="[
                      'text-[12px]',
                      likedMessages.has(msg._id)
                        ? 'fa-solid fa-thumbs-up'
                        : 'fa-regular fa-thumbs-up',
                    ]"
                  ></i>
                </button>
                <button
                  @click.stop="toggleDislike(msg._id)"
                  title="Dislike this response"
                  :class="[
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer',
                    dislikedMessages.has(msg._id)
                      ? 'text-red-500 bg-red-500/8'
                      : 'text-text-secondary hover:text-red-500 hover:bg-red-500/8',
                  ]"
                >
                  <i
                    :class="[
                      'text-[12px]',
                      dislikedMessages.has(msg._id)
                        ? 'fa-solid fa-thumbs-down'
                        : 'fa-regular fa-thumbs-down',
                    ]"
                  ></i>
                </button>
                <button
                  @click.stop="copyMessageToClipboard(msg.content)"
                  title="Copy message"
                  class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-text-secondary hover:text-primary-color hover:bg-primary-color/8 transition-colors cursor-pointer"
                >
                  <i class="fa-regular fa-copy text-[12px]"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- ===== Thinking bubble — only during thinking phase ===== -->
          <div
            v-if="showThinkingBubble"
            class="flex gap-2.5 relative animate-fade-in"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-primary-color/15 to-primary-color/5 border border-primary-color/15 shadow-sm"
            >
              <i class="fa-solid fa-robot text-primary-color text-[11px]"></i>
            </div>
            <div
              class="px-3.5 py-2.5 rounded-2xl rounded-tl-md max-w-[82%] text-sm border border-border bg-bg-body"
            >
              <div class="flex items-center gap-2 mb-1">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="text-[11px] font-medium text-text-primary"
                  >Thinking</span
                >
                <span class="text-[10px] text-text-tertiary tabular-nums">{{
                  elapsedLabel
                }}</span>
              </div>
              <!-- Phase detail -->
              <div
                v-if="streamingPhaseDetail"
                class="text-[11px] text-text-secondary italic mt-1"
              >
                {{ streamingPhaseDetail }}
              </div>
            </div>
          </div>

          <!-- ===== Streaming bubble — only when generating AND has content ===== -->
          <div
            v-if="showStreamingBubble"
            class="flex gap-2.5 relative animate-fade-in"
          >
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-primary-color/15 to-primary-color/5 border border-primary-color/15 shadow-sm"
            >
              <i class="fa-solid fa-robot text-primary-color text-[11px]"></i>
            </div>

            <div
              class="px-3.5 py-2.5 rounded-2xl rounded-tl-md w-full max-w-[82%] text-sm leading-relaxed border border-primary-color/20 bg-bg-body shadow-sm"
            >
              <!-- Status bar -->
              <div
                class="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border flex-wrap"
              >
                <!-- Thought time — appears once thinking phase ends -->
                <span
                  v-if="false"
                  class="inline-flex items-center gap-1 text-[10px] text-text-tertiary bg-bg-body border border-border px-2 py-0.5 rounded-full"
                >
                  <i
                    class="fa-solid fa-brain text-primary-color text-[8px]"
                  ></i>
                  Thought {{ ((streamingThinkMs || 0) / 1000).toFixed(1) }}s
                </span>

                <!-- Live writing indicator -->
                <span
                  class="inline-flex items-center gap-1.5 text-[10px] text-primary-color font-medium"
                >
                  <span class="relative flex h-1.5 w-1.5">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-color opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-color"
                    ></span>
                  </span>
                  Writing
                  <span class="text-text-tertiary font-normal tabular-nums">{{
                    elapsedLabel
                  }}</span>
                </span>

                <!-- Total time — appears once timing chunk arrives -->
                <span
                  v-if="false"
                  class="inline-flex items-center gap-1 text-[10px] text-text-tertiary bg-bg-body border border-border px-2 py-0.5 rounded-full"
                >
                  <i
                    class="fa-regular fa-clock text-primary-color text-[8px]"
                  ></i>
                  {{ ((streamingTotalMs || 0) / 1000).toFixed(1) }}s total
                </span>
              </div>

              <!-- Streaming text + cursor -->
              <p class="whitespace-pre-wrap text-text-primary leading-relaxed">
                {{ displayedContent
                }}<span
                  class="inline-block w-[2px] h-[13px] bg-primary-color ml-0.5 align-middle animate-pulse rounded-sm"
                ></span>
              </p>

              <!-- Timestamp -->
              <div
                class="flex justify-end text-[10px] text-text-tertiary mt-1.5"
              >
                <span>{{ formatTimestamp(new Date().toISOString()) }}</span>
              </div>
            </div>
          </div>

          <!-- ===== Phase Timeline — shows all streamed phase updates ===== -->
          <div
            v-if="false"
            class="flex gap-2.5 relative mt-2"
          >
            <div class="w-7 h-7 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div
                v-for="(phase, idx) in phaseHistory"
                :key="idx"
                class="text-[10px]"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="mt-1.5 w-2 h-2 rounded-full bg-primary-color flex-shrink-0"
                  ></div>
                  <div class="space-y-0.5">
                    <p class="font-semibold text-text-primary capitalize">
                      {{ phase.phase }}
                    </p>
                    <p v-if="phase.detail" class="text-text-secondary italic">
                      {{ phase.detail }}
                    </p>
                    <p class="text-text-tertiary">
                      {{
                        formatTimestamp(new Date(phase.timestamp).toISOString())
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- Empty state — rich suggestions like ClickUp AI -->
        <div
          v-else
          class="flex flex-col h-full overflow-y-auto px-1 py-3 space-y-5"
        >
          <!-- Greeting -->
          <div class="space-y-0.5 px-1">
            <p class="text-sm font-semibold text-text-primary">
              Welcome back! Ask me anything about
              <span class="text-primary-color">{{ contextTitle }}</span
              >.
            </p>
            <p class="text-[12px] text-text-tertiary">
              How can I help you today?
            </p>
          </div>

          <!-- Quick question prompts -->
          <div class="space-y-2" v-if="emptyStateQuickPrompts.length">
            <p
              class="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-1"
            >
              Ask about your workspace
            </p>
            <div class="space-y-1">
              <button
                v-for="prompt in emptyStateQuickPrompts"
                :key="prompt"
                @click="applyPromptAndSend(prompt)"
                class="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-primary-color/6 hover:text-primary-color transition-all group cursor-pointer"
              >
                <i
                  class="fa-solid fa-arrow-right text-[10px] text-text-tertiary group-hover:text-primary-color transition-colors shrink-0"
                ></i>
                <span
                  class="text-[13px] text-text-primary group-hover:text-primary-color transition-colors leading-snug"
                  >{{ prompt }}</span
                >
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-border"></div>

          <!-- Feature cards -->
          <div class="space-y-2" v-if="emptyStateFeatureCards.length">
            <p
              class="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-1"
            >
              Features
            </p>
            <div class="space-y-2">
              <button
                v-for="card in emptyStateFeatureCards"
                :key="card.title"
                @click="applyPromptAndSend(card.prompt)"
                class="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary-color/30 hover:bg-primary-color/4 transition-all group cursor-pointer"
              >
                <!-- Icon box -->
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  :class="card.iconBg"
                >
                  <i :class="[card.icon, card.iconColor, 'text-sm']"></i>
                </div>

                <!-- Text -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-[13px] font-medium text-text-primary group-hover:text-primary-color transition-colors leading-snug"
                    >
                      {{ card.title }}
                    </span>
                    <span
                      v-if="card.isNew"
                      class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary-color/10 text-primary-color border border-primary-color/20 shrink-0"
                    >
                      New
                    </span>
                  </div>
                  <p class="text-[11px] text-text-tertiary mt-0.5 leading-snug">
                    {{ card.description }}
                  </p>
                </div>

                <!-- Arrow -->
                <i
                  class="fa-solid fa-chevron-right text-[10px] text-text-tertiary group-hover:text-primary-color transition-colors shrink-0"
                ></i>
              </button>
            </div>
          </div>

          <!-- Suggested prompts from agent config (if any) -->
          <div class="space-y-2" v-if="activeSuggestedPrompts.length">
            <p
              class="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-1"
            >
              Agent prompts
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="sp in activeSuggestedPrompts"
                :key="sp.label"
                @click="applyPromptAndSend(sp.text)"
                class="px-3 py-1.5 rounded-full border border-primary-color/20 bg-primary-color/5 text-[11px] text-primary-color font-medium hover:bg-primary-color/12 hover:border-primary-color/35 transition-all cursor-pointer"
              >
                <i class="fa-solid fa-sparkles text-[9px] mr-1 opacity-70"></i>
                {{ sp.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="px-3 pt-3 pb-1.5 border-t border-border bg-bg-card">
        <!-- Breadcrumb -->
        <div
          v-if="contextTitle"
          class="mb-2.5 flex justify-between border-b border-border items-center gap-1.5 pb-2"
        >
          <nav class="flex items-center text-[11px] text-text-secondary gap-1">
            <div
              class="flex items-center font-medium text-text-primary"
              v-if="!moduleId"
            >
              <span>Workspace</span>
            </div>
            <i
              v-if="!moduleId"
              class="fa-solid fa-chevron-right text-[8px] text-text-tertiary"
            ></i>
            <div class="flex items-center font-medium text-text-primary">
              <span>{{ contextTitle }}</span>
            </div>
            <i
              v-if="moduleId"
              class="fa-solid fa-chevron-right text-[8px] text-text-tertiary"
            ></i>
            <div
              class="flex items-center font-medium text-text-primary"
              v-if="moduleId"
            >
              <span v-if="route?.path?.includes('peak')">Peak</span>
              <span v-else>{{
                moduleSelected && moduleSelected?.length > 20
                  ? moduleSelected?.slice(0, 20) + "..."
                  : moduleSelected
              }}</span>
            </div>
            <div v-if="moduleId" class="flex items-center gap-1">
              <i
                class="fa-solid fa-chevron-right text-[8px] text-text-tertiary"
              ></i>
              <span>{{ sheetNameRef }}</span>
            </div>
          </nav>
        </div>

        <!-- Chat Input Area -->
        <div
          class="flex flex-col gap-2.5"
          :class="{ 'neon-flow-border-chatbot': agentStore.isSending }"
        >
          <!-- Active suggested prompts (only when no messages yet) -->
          <div
            class="flex flex-wrap gap-1.5 px-1"
            v-if="activeSuggestedPrompts?.length && !orderedMessages.length"
          >
            <button
              v-for="sp in activeSuggestedPrompts.slice(0, 4)"
              :key="sp.label"
              @click="applyPromptAndSend(sp.text)"
              class="px-3 py-1.5 rounded-full border border-primary-color/20 bg-primary-color/5 text-[11px] text-primary-color font-medium hover:bg-primary-color/12 hover:border-primary-color/35 transition-all cursor-pointer"
            >
              <i class="fa-solid fa-sparkles text-[9px] mr-1"></i>
              {{ sp.label }}
            </button>
          </div>

          <!-- Main input container -->
          <div
            class="relative rounded-2xl border bg-bg-card transition-all duration-200"
            :class="
              isFocused
                ? 'border-primary-color/40 shadow-[0_0_0_3px_rgba(125,104,200,0.12)]'
                : 'border-border'
            "
          >
            <!-- Top row: source + web search toggle -->
            <div
              class="flex items-center gap-1.5 pb-0.5"
              :class="selectedFiles.length ? 'pt-1.5' : 'pt-2.5'"
            >
              <!-- Top row: source selector + web search toggle -->
              <div class="flex items-center gap-1.5 pt-1 px-1.5 pb-0.5">
                <!-- Source selector -->
                <div class="relative" ref="sourceDropdownRef">
                  <button
                    @click="showSourceDropdown = !showSourceDropdown"
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
                    :class="
                      selectedSource !== 'all'
                        ? 'text-primary-color bg-primary-color/8 border border-primary-color/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                    "
                  >
                    <i :class="[activeSource.icon, 'text-[10px]']"></i>
                    <span class="max-w-[90px] truncate">{{
                      activeSource.label
                    }}</span>
                    <i
                      class="fa-solid fa-chevron-down text-[7px] ml-0.5 transition-transform duration-200"
                      :class="showSourceDropdown ? 'rotate-180' : ''"
                    ></i>
                  </button>

                  <!-- Dropdown -->
                  <transition name="dropdown">
                    <div
                      v-if="showSourceDropdown"
                      class="absolute bottom-full mb-2 left-0 w-64 rounded-xl border border-border bg-bg-card shadow-lg shadow-black/8 z-50 overflow-hidden"
                    >
                      <!-- Search inside dropdown -->
                      <div class="px-3 pt-3 pb-2">
                        <div class="relative">
                          <i
                            class="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-[10px]"
                          ></i>
                          <input
                            type="text"
                            placeholder="Search sources..."
                            v-model="sourceSearch"
                            class="w-full pl-7 pr-3 py-1.5 text-xs border border-border rounded-lg bg-bg-body/80 focus:border-primary-color/40 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div class="max-h-72 overflow-y-auto pb-1">
                        <div
                          v-for="source in filteredSources"
                          :key="source.id"
                          @click="selectSource(source.id)"
                          class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary-color/6 transition-colors group"
                          :class="
                            selectedSource === source.id
                              ? 'bg-primary-color/8'
                              : ''
                          "
                        >
                          <!-- Icon -->
                          <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            :class="source.iconBg"
                          >
                            <i
                              :class="[
                                source.icon,
                                source.iconColor,
                                'text-[13px]',
                              ]"
                            ></i>
                          </div>

                          <!-- Label + description -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                              <span
                                class="text-[13px] font-medium text-text-primary leading-none"
                              >
                                {{ source.label }}
                              </span>
                              <span
                                v-if="source.badge"
                                class="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary-color/10 text-primary-color"
                              >
                                {{ source.badge }}
                              </span>
                            </div>
                            <p
                              class="text-[11px] text-text-tertiary mt-0.5 truncate"
                            >
                              {{ source.description }}
                            </p>
                          </div>

                          <!-- Check -->
                          <i
                            v-if="selectedSource === source.id"
                            class="fa-solid fa-check text-primary-color text-[11px] shrink-0"
                          ></i>
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>

                <!-- Web search active indicator -->
                <button
                  @click="toggleWebSearch"
                  class="flex items-center gap-1 px-1.5 py-1.5 rounded-full text-[11px] transition-all cursor-pointer"
                  :class="
                    webSearch
                      ? 'text-primary-color bg-primary-color/20 border border-primary-color/20'
                      : 'text-text-secondary hover:text-primary-color hover:bg-bg-primary-color/20'
                  "
                  title="Toggle web search"
                >
                  <i class="fa-solid fa-globe text-[10px]"></i>
                </button>
              </div>
            </div>
            <!-- FILE PREVIEWS — shown inside the box, above textarea -->
            <div
              v-if="selectedFiles.length"
              class="flex flex-wrap gap-2 px-3 pt-2.5 pb-1"
            >
              <div
                v-for="file in selectedFiles"
                :key="file.tempId"
                class="relative group shrink-0"
              >
                <!-- Image preview -->
                <div
                  v-if="file.type.startsWith('image/')"
                  class="w-16 h-16 rounded-xl border border-border overflow-hidden bg-bg-body"
                >
                  <img
                    :src="createObjectURL(file)"
                    class="w-full h-full object-cover"
                    alt="preview"
                  />
                </div>
                <!-- PDF / other file preview -->
                <div
                  v-else
                  class="h-12 px-3 rounded-xl border border-border bg-bg-body/80 flex items-center gap-2 max-w-[140px]"
                >
                  <i
                    class="fa-solid fa-file-pdf text-red-400 text-sm shrink-0"
                  ></i>
                  <span class="text-[11px] text-text-primary truncate">{{
                    file.name
                  }}</span>
                </div>

                <!-- Remove button -->
                <button
                  @click="removeFile(file.tempId!)"
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm z-10"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <!-- Saved Prompts Quick Bar -->
            <transition name="dropdown">
              <div
                v-if="showSavedPromptsBar && pinnedPrompts.length"
                class="rounded-xl border border-border/50 bg-bg-body/60 overflow-hidden mb-1"
              >
                <!-- Header -->
                <div
                  class="flex items-center justify-between px-3 py-2 border-b border-border"
                >
                  <span
                    class="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider"
                    >Saved Prompts</span
                  >
                  <button
                    @click="showSavedPromptsBar = false"
                    class="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded transition-colors cursor-pointer"
                  >
                    <i class="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </div>

                <!-- Recently used -->
                <div v-if="pinnedPrompts.length">
                  <p
                    class="px-3 pt-2 pb-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider"
                  >
                    Recently used
                  </p>
                  <div
                    v-for="pin in pinnedPrompts.slice(0, 2)"
                    :key="'bar-recent-' + pin.id"
                    @click="applySavedPrompt(pin.text)"
                    class="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-color/6 cursor-pointer transition-colors"
                  >
                    <i
                      class="fa-regular fa-file-lines text-text-tertiary text-[11px] shrink-0"
                    ></i>
                    <span
                      class="text-[13px] text-text-primary truncate flex-1"
                      >{{ pin.label }}</span
                    >
                  </div>
                </div>

                <!-- Private to me -->
                <div v-if="pinnedPrompts.length" class="border-t border-border">
                  <p
                    class="px-3 pt-2 pb-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider"
                  >
                    Private to me
                  </p>
                  <div
                    v-for="pin in pinnedPrompts"
                    :key="'bar-private-' + pin.id"
                    @click="applySavedPrompt(pin.text)"
                    class="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-color/6 cursor-pointer transition-colors"
                  >
                    <i
                      class="fa-regular fa-file-lines text-text-tertiary text-[11px] shrink-0"
                    ></i>
                    <span
                      class="text-[13px] text-text-primary truncate flex-1"
                      >{{ pin.label }}</span
                    >
                  </div>
                </div>

                <!-- Add new prompt -->
                <div class="border-t border-border">
                  <button
                    @click="openNewPromptModal()"
                    class="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-surface transition-colors text-left cursor-pointer"
                  >
                    <i
                      class="fa-solid fa-circle-plus text-text-tertiary text-[13px]"
                    ></i>
                    <span class="text-[13px] text-text-primary"
                      >Add new prompt</span
                    >
                  </button>
                </div>

                <!-- Footer -->
                <div class="border-t border-border px-3 py-2">
                  <p class="text-[11px] text-text-tertiary">
                    Tell AI what to do next
                  </p>
                </div>
              </div>
            </transition>
            <!-- Textarea -->
            <div class="px-4 py-1 relative">
              <textarea
                v-model="userMessage"
                ref="autoTextarea"
                rows="1"
                autofocus
                placeholder="Ask, create, search"
                class="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 resize-none outline-none leading-relaxed"
                @keydown="handleKeydown"
                @input="autoResize"
                @focus="isFocused = true"
                @blur="isFocused = false"
                @paste="handlePaste"
              ></textarea>
            </div>

            <!-- Bottom toolbar -->
            <div class="flex items-center justify-between px-3 pb-2.5 pt-0.5">
              <div class="relative" ref="plusDropdownRef">
                <!-- Plus button -->
                <button
                  @click="
                    showPlusMenu = !showPlusMenu;
                    showSavedPromptsMenu = false;
                  "
                  class="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary bg-primary-color/7 hover:text-primary-color hover:bg-primary-color/6 transition-all cursor-pointer"
                >
                  <i class="fa-regular fa-plus"></i>
                </button>

                <!-- Main plus dropdown -->
                <transition name="dropdown">
                  <div
                    v-if="showPlusMenu && !showSavedPromptsMenu"
                    class="absolute bottom-full mb-2 left-0 w-52 rounded-xl border border-border bg-bg-card shadow-lg shadow-black/8 z-50 overflow-hidden"
                  >
                    <div class="p-1">
                      <button
                        @click="
                          imageInput?.click();
                          showPlusMenu = false;
                        "
                        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-bg-surface transition-colors text-left"
                      >
                        <span
                          class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"
                        >
                          <i
                            class="fa-solid fa-image text-blue-500 text-[11px]"
                          ></i>
                        </span>
                        <div>
                          <div
                            class="text-[13px] font-medium text-text-primary leading-tight"
                          >
                            Upload image
                          </div>
                          <div class="text-[11px] text-text-secondary mt-0.5">
                            PNG, JPG, GIF, WEBP
                          </div>
                        </div>
                      </button>

                      <button
                        @click="
                          fileInput?.click();
                          showPlusMenu = false;
                        "
                        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-bg-surface transition-colors text-left"
                      >
                        <span
                          class="w-7 h-7 rounded-lg bg-bg-surface border border-border flex items-center justify-center shrink-0"
                        >
                          <i
                            class="fa-solid fa-paperclip text-text-secondary text-[11px]"
                          ></i>
                        </span>
                        <div>
                          <div
                            class="text-[13px] font-medium text-text-primary leading-tight"
                          >
                            Attach file
                          </div>
                          <div class="text-[11px] text-text-secondary mt-0.5">
                            PDF, DOCX, TXT...
                          </div>
                        </div>
                      </button>

                      <div class="h-px bg-border/40 mx-2.5 my-1"></div>

                      <button
                        @click="showSavedPromptsMenu = true"
                        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-bg-surface transition-colors text-left"
                      >
                        <span
                          class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0"
                        >
                          <i
                            class="fa-solid fa-star text-amber-500 text-[11px]"
                          ></i>
                        </span>
                        <div class="flex-1">
                          <div
                            class="text-[13px] font-medium text-text-primary leading-tight"
                          >
                            Saved prompts
                          </div>
                          <div class="text-[11px] text-text-secondary mt-0.5">
                            Insert a pinned prompt
                          </div>
                        </div>
                        <i
                          class="fa-solid fa-chevron-right text-[9px] text-text-tertiary"
                        ></i>
                      </button>
                    </div>
                  </div>
                </transition>

                <!-- Saved prompts panel (replaces main dropdown) -->
                <transition name="dropdown">
                  <div
                    v-if="showSavedPromptsMenu"
                    class="absolute bottom-full mb-2 left-0 w-56 rounded-xl border border-border bg-bg-card shadow-lg shadow-black/8 z-50 overflow-hidden"
                  >
                    <!-- Header -->
                    <div
                      class="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-border"
                    >
                      <button
                        @click="showSavedPromptsMenu = false"
                        class="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <i class="fa-solid fa-arrow-left text-[10px]"></i>
                      </button>
                      <span
                        class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
                        >Saved prompts</span
                      >
                    </div>

                    <div class="max-h-64 overflow-y-auto">
                      <!-- Recently used section -->
                      <div v-if="pinnedPrompts.length">
                        <div class="px-3 pt-2.5 pb-1">
                          <span
                            class="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider"
                            >Recently used</span
                          >
                        </div>
                        <div
                          v-for="pin in pinnedPrompts.slice(0, 2)"
                          :key="'recent-' + pin.id"
                          @click="applySavedPrompt(pin.text)"
                          class="flex items-center gap-2.5 px-3 py-2 hover:bg-bg-surface cursor-pointer transition-colors"
                        >
                          <i
                            class="fa-regular fa-file-lines text-text-tertiary text-[11px] shrink-0"
                          ></i>
                          <span
                            class="text-[13px] text-text-primary truncate"
                            >{{ pin.label }}</span
                          >
                        </div>
                      </div>

                      <!-- Private to me section -->
                      <div v-if="pinnedPrompts.length">
                        <div class="px-3 pt-2.5 pb-1">
                          <span
                            class="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider"
                            >Private to me</span
                          >
                        </div>
                        <div
                          v-for="pin in pinnedPrompts"
                          :key="'private-' + pin.id"
                          @click="applySavedPrompt(pin.text)"
                          class="flex items-center gap-2.5 px-3 py-2 hover:bg-bg-surface cursor-pointer transition-colors"
                        >
                          <i
                            class="fa-regular fa-file-lines text-text-tertiary text-[11px] shrink-0"
                          ></i>
                          <span
                            class="text-[13px] text-text-primary truncate"
                            >{{ pin.label }}</span
                          >
                        </div>
                      </div>

                      <!-- Empty state -->
                      <div
                        v-if="!pinnedPrompts.length"
                        class="px-3 py-4 text-center"
                      >
                        <p class="text-[12px] text-text-tertiary">
                          No saved prompts yet
                        </p>
                      </div>
                    </div>

                    <!-- Add new prompt -->
                    <div class="border-t border-border">
                      <button
                        @click="
                          showSavedPromptsMenu = true;
                          showNewPromptModal = true;
                        "
                        class="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-surface transition-colors text-left cursor-pointer"
                      >
                        <i
                          class="fa-solid fa-circle-plus text-text-tertiary text-[13px]"
                        ></i>
                        <span class="text-[13px] text-text-primary"
                          >Add new prompt</span
                        >
                      </button>
                    </div>

                    <!-- Footer hint -->
                    <div class="border-t border-border px-3 py-2">
                      <p class="text-[11px] text-text-tertiary">
                        Tell AI what to do next
                      </p>
                    </div>
                  </div>
                </transition>
              </div>
              <!-- File count badge + send -->
              <div class="flex items-center gap-2">
                <span
                  v-if="selectedFiles.length"
                  class="text-[11px] text-primary-color font-medium bg-primary-color/8 px-2 py-0.5 rounded-full border border-primary-color/15"
                >
                  {{ selectedFiles.length }} file{{
                    selectedFiles.length > 1 ? "s" : ""
                  }}
                </span>

                <button
                  v-if="agentStore.isAiTyping || isAiThinkingBubbleVisible || agentStore.isSending"
                  @click="stopGeneration"
                  class="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm shadow-red-500/25"
                  title="Stop generating"
                >
                 <i class="fa-solid fa-stop text-white text-[10px]"></i>
                </button>
                <button
                  v-else
                  @click="sendMessage"
                  :disabled="!userMessage.trim() && !selectedFiles.length"
                  class="w-9 h-9 rounded-full bg-primary-color flex items-center justify-center hover:bg-primary-color active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-primary-color/25"
                >
                  <i class="fa-solid fa-paper-plane text-white text-[11px]"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Hidden inputs -->
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            multiple
            accept="image/*,.pdf"
            @change="handleFileChange"
          />
          <input
            ref="imageInput"
            type="file"
            class="hidden"
            multiple
            accept="image/*"
            @change="handleFileChange"
          />
        </div>
        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          multiple
          accept="image/*,.pdf"
          @change="handleFileChange"
        />

        <!-- Pinned prompt chips -->
        <div
          v-if="pinnedPrompts.length"
          class="mt-2.5 relative flex items-center gap-1.5 flex-wrap"
          ref="Ref"
        >
          <template v-for="pin in pinnedPrompts.slice(0, 2)" :key="pin.id">
            <div class="relative group">
              <button
                class="truncate max-w-[90px] pr-5 cursor-pointer px-2.5 py-1 rounded-full border border-border bg-bg-body/80 text-[11px] text-text-secondary hover:border-primary-color/30 hover:text-primary-color transition-all duration-150"
                @click="applyPromptToInput(pin.text)"
              >
                {{ pin.label }}
              </button>
              <span
                @click.stop="unpinSingle(pin)"
                class="absolute right-1 top-2.5 -translate-y-1/2 text-red-500 hover:text-red-700 cursor-pointer opacity-0 group-hover:opacity-100 transition"
              >
                <i
                  class="fa-sharp fa-regular fa-thumbtack-slash text-[10px]"
                ></i>
              </span>
            </div>
          </template>

          <button
            @click="toggleDropdown"
            class="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-full border border-border bg-bg-body/80 text-[11px] text-text-secondary hover:border-primary-color/30 hover:text-primary-color transition-all duration-150"
          >
            <i
              class="fa-solid fa-thumbtack text-primary-color"
              style="font-size: 9px"
            ></i>
            Pinned
            <i
              :class="{
                'fa-chevron-up': isDropdownOpen,
                'fa-chevron-down': !isDropdownOpen,
              }"
              class="fa-solid ml-0.5 text-text-tertiary text-[9px] transition-transform"
            ></i>
          </button>

          <transition name="dropdown">
            <div
              v-if="isDropdownOpen"
              class="absolute bottom-full mb-1 left-0 w-56 bg-bg-card border border-border rounded-xl shadow-lg shadow-black/8 z-50 overflow-hidden"
            >
              <div
                class="flex justify-between items-center px-3 py-2 border-b border-border"
              >
                <span
                  class="text-[10px] font-bold text-text-tertiary uppercase tracking-wider"
                  >Pinned prompts</span
                >
              </div>
              <div class="max-h-60 overflow-y-auto">
                <button
                  v-for="pin in pinnedPrompts"
                  :key="pin.id"
                  class="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-primary-color/8 transition-colors text-[12px]"
                  @click="applyPromptToInput(pin.text)"
                >
                  <span class="truncate text-text-primary">{{
                    pin.label
                  }}</span>
                  <span
                    @click.stop="unpinSingle(pin)"
                    class="text-text-tertiary hover:text-red-500 cursor-pointer ml-2 transition-colors"
                  >
                    <i class="fa-solid fa-xmark text-[10px]"></i>
                  </span>
                </button>
              </div>
            </div>
          </transition>
        </div>

        <p
          class="text-[10px] text-text-tertiary text-center mt-2 mb-0.5 opacity-60"
        >
          AI can make mistakes. Please verify important information.
        </p>
      </div>

      <!-- ===== HISTORY PANEL OVERLAY ===== -->
      <transition name="slide-fade">
        <div
          v-if="showHistoryPanel"
          class="absolute inset-0 z-30 bg-bg-card flex flex-col rounded-xl"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-bg-card/95 backdrop-blur-sm"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-lg bg-primary-color/10 flex items-center justify-center"
              >
                <i
                  class="fa-regular fa-clock-rotate-left text-primary-color text-[11px]"
                ></i>
              </div>
              <h3 class="text-sm font-semibold text-text-primary">
                Chat History
              </h3>
            </div>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-body transition-colors cursor-pointer"
              @click="showHistoryPanel = false"
            >
              <i class="fa-solid fa-xmark text-text-secondary text-xs"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto min-h-0">
            <!-- Loading -->
            <div
              v-if="isLoadingSessions"
              class="flex items-center justify-center h-32"
            >
              <div class="flex flex-col items-center gap-2 text-text-secondary">
                <div class="chat-loader"></div>
                <span class="text-[11px]">Loading sessions...</span>
              </div>
            </div>

            <!-- Session detail view -->
            <div v-else-if="historyViewSession" class="flex flex-col h-full">
              <div
                class="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0 bg-bg-body/50"
              >
                <button
                  @click="historyViewSession = null"
                  class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-body transition-colors cursor-pointer shrink-0"
                >
                  <i
                    class="fa-solid fa-arrow-left text-text-secondary text-xs"
                  ></i>
                </button>
                <div v-if="!isRenamingSession" class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-text-primary truncate">
                    {{ historyViewSession.title || "Untitled conversation" }}
                  </p>
                </div>
                <input
                  v-else
                  v-model="renameValue"
                  @keydown.enter="confirmRename"
                  @keydown.escape="isRenamingSession = false"
                  ref="renameInput"
                  class="flex-1 text-xs bg-bg-body border border-primary-color/40 rounded-lg px-2.5 py-1 outline-none text-text-primary min-w-0 focus:ring-1 focus:ring-primary-color/15"
                  placeholder="Session name..."
                />
                <div class="flex items-center gap-0.5 shrink-0">
                  <button
                    @click="startRename"
                    class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary-color/10 transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <i
                      class="fa-regular fa-pen text-text-secondary text-[10px]"
                    ></i>
                  </button>
                  <button
                    @click="confirmDeleteSession(historyViewSession.session_id)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete session"
                  >
                    <i
                      class="fa-regular fa-trash text-text-secondary hover:text-red-500 text-[10px]"
                    ></i>
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto p-3 space-y-3">
                <div
                  v-if="isLoadingSessionMessages"
                  class="flex items-center justify-center h-20"
                >
                  <div class="chat-loader"></div>
                </div>
                <template v-else-if="historyViewMessages.length">
                  <div
                    v-for="msg in historyViewMessages"
                    :key="msg._id"
                    class="flex gap-2"
                    :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
                  >
                    <div
                      class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      :class="
                        msg.role === 'user'
                          ? 'bg-primary-color/10'
                          : 'bg-primary-color/10'
                      "
                    >
                      <i
                        v-if="msg.role === 'assistant'"
                        class="fa-solid fa-robot text-primary-color text-[8px]"
                      ></i>
                      <span
                        v-else
                        class="text-[7px] font-bold text-primary-color"
                        >ME</span
                      >
                    </div>
                    <div
                      class="px-2.5 py-1.5 rounded-xl max-w-[85%] text-[11px] leading-relaxed"
                      :class="
                        msg.role === 'user'
                          ? 'bg-primary-color text-white rounded-tr-md'
                          : 'bg-bg-body border border-border text-text-primary rounded-tl-md'
                      "
                    >
                      <p class="whitespace-pre-wrap">{{ msg.content }}</p>
                      <p
                        class="text-[9px] mt-0.5 text-right"
                        :class="
                          msg.role === 'user'
                            ? 'text-white/50'
                            : 'text-text-tertiary'
                        "
                      >
                        {{ formatTimestamp(msg.timestamp) }}
                      </p>
                    </div>
                  </div>
                </template>
                <p v-else class="text-xs text-text-secondary text-center mt-8">
                  No messages in this session
                </p>
              </div>
            </div>

            <!-- Sessions list -->
            <div v-else class="p-2 flex flex-col gap-0.5">
              <div
                v-for="session in sessionsList"
                :key="session.session_id"
                class="group relative px-3 py-2.5 rounded-xl border border-transparent hover:border-border hover:bg-bg-body/60 cursor-pointer transition-all duration-150"
                @click="openSession(session)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-sm text-text-primary font-medium truncate leading-snug"
                    >
                      {{ session.title || "Untitled conversation" }}
                    </p>
                    <p
                      v-if="session.last_message?.content"
                      class="text-[10px] text-text-tertiary mt-1 truncate"
                    >
                      {{ session.last_message.content }}
                    </p>
                  </div>
                  <div
                    class="relative opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    @click.stop
                  >
                    <button
                      @click.stop="toggleMenu(session.session_id)"
                      class="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-bg-body transition-colors"
                    >
                      <i
                        class="fa-solid fa-ellipsis text-text-tertiary text-xs"
                      ></i>
                    </button>
                    <transition name="dropdown">
                      <div
                        v-if="openMenuSessionId === session.session_id"
                        class="absolute right-0 mt-1 w-40 rounded-xl bg-bg-card shadow-lg shadow-black/8 border border-border z-50 py-1 overflow-hidden"
                      >
                        <button
                          @click.stop="
                            startRenameFromList(session);
                            closeMenu();
                          "
                          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-primary-color/8 hover:text-primary-color transition-colors"
                        >
                          <i class="fa-regular fa-pen text-[10px]"></i>
                          Rename
                        </button>
                        <div class="my-0.5 border-t border-border"></div>
                        <button
                          @click.stop="
                            confirmDeleteSession(session.session_id);
                            closeMenu();
                          "
                          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-500/8 transition-colors"
                        >
                          <i class="fa-regular fa-trash text-[10px]"></i>
                          Delete
                        </button>
                      </div>
                    </transition>
                  </div>
                </div>

                <div
                  v-if="renamingSessionId === session.session_id"
                  class="mt-1.5"
                  @click.stop
                >
                  <input
                    v-model="renameValue"
                    @keydown.enter="confirmRenameFromList(session.session_id)"
                    @keydown.escape="renamingSessionId = null"
                    @blur="confirmRenameFromList(session.session_id)"
                    :ref="
                      (el) => {
                        if (el)
                          listRenameInputs[session.session_id] =
                            el as HTMLInputElement;
                      }
                    "
                    class="w-full text-xs bg-bg-body border border-primary-color/40 rounded-lg px-2.5 py-1.5 outline-none text-text-primary focus:ring-1 focus:ring-primary-color/15"
                    placeholder="Session name..."
                  />
                </div>
              </div>

              <p
                v-if="!sessionsList.length"
                class="text-xs text-text-secondary text-center mt-8 px-4"
              >
                No previous conversations
              </p>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="
              !historyViewSession && !isLoadingSessions && totalSessionPages > 1
            "
            class="flex items-center justify-between px-4 py-2.5 border-t border-border shrink-0"
          >
            <button
              @click="changeSessionPage(currentSessionPage - 1)"
              :disabled="currentSessionPage === 1"
              class="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-primary-color disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <i class="fa-solid fa-chevron-left text-[9px]"></i>
              Prev
            </button>
            <span class="text-[11px] text-text-tertiary"
              >{{ currentSessionPage }} / {{ totalSessionPages }}</span
            >
            <button
              @click="changeSessionPage(currentSessionPage + 1)"
              :disabled="currentSessionPage === totalSessionPages"
              class="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-primary-color disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
              <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>

  <!-- ===== DELETE CONFIRMATION MODAL ===== -->
  <div
    v-if="showDeleteModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div
      class="w-full max-w-sm rounded-2xl bg-bg-card shadow-2xl p-6 border border-border"
    >
      <div class="flex items-start gap-3.5">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 shrink-0"
        >
          <i class="fa-regular fa-trash text-red-500"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-text-primary">
            Delete Session
          </h3>
          <p class="mt-1 text-sm text-text-secondary leading-snug">
            This action cannot be undone. This will permanently delete the
            session and all messages.
          </p>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button
          @click="handleDeleteCancel"
          class="rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:bg-bg-body transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleDeleteConfirmed"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm shadow-red-600/20"
        >
          Delete Session
        </button>
      </div>
    </div>
  </div>
  <!-- ===== NEW PROMPT MODAL ===== -->
  <transition name="fade">
    <div
      v-if="showNewPromptModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="closeNewPromptModal"
    >
      <div
        class="w-full max-w-xl rounded-2xl bg-bg-card shadow-2xl border border-border overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-border"
        >
          <h3 class="text-sm font-semibold text-text-primary">New Prompt</h3>
          <button
            @click="closeNewPromptModal"
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-body transition-colors cursor-pointer text-text-secondary"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-5 space-y-4">
          <!-- Title -->
          <div class="space-y-1.5">
            <label class="text-[13px] font-medium text-text-primary">
              Title <span class="text-red-500">*</span>
            </label>
            <BaseTextField
              v-model="newPromptForm.title"
              placeholder="Enter prompt title"
            />
          </div>

          <!-- Prompt text -->
          <div class="space-y-1.5">
            <label class="text-[13px] font-medium text-text-primary">
              Prompt <span class="text-red-500">*</span>
            </label>
            <BaseTextAreaField
              v-model="newPromptForm.text"
              placeholder="Write a prompt that you would like to save"
            />
          </div>

          <!-- Share with -->
          <div class="space-y-2">
            <label class="text-[13px] font-medium text-text-primary"
              >Share with:</label
            >
            <div class="space-y-2">
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  value="only_me"
                  v-model="newPromptForm.shareWith"
                  class="accent-primary-color w-4 h-4"
                />
                <span class="text-sm text-text-primary">Only Me</span>
              </label>
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  value="everyone"
                  v-model="newPromptForm.shareWith"
                  class="accent-primary-color w-4 h-4"
                />
                <span class="text-sm text-text-primary">Everyone</span>
              </label>
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  value="admins"
                  v-model="newPromptForm.shareWith"
                  class="accent-primary-color w-4 h-4"
                />
                <span class="text-sm text-text-primary">Admins</span>
              </label>
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  value="select_people"
                  v-model="newPromptForm.shareWith"
                  class="accent-primary-color w-4 h-4"
                />
                <span class="text-sm text-text-primary">Select people:</span>
                <div
                  v-if="newPromptForm.shareWith === 'select_people'"
                  class="w-7 h-7 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary-color/40 cursor-pointer transition-colors ml-1"
                >
                  <i
                    class="fa-solid fa-plus text-text-tertiary text-[10px]"
                  ></i>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border bg-bg-body/40"
        >
          <Button
            appearance="outlined"
            variant="gray"
            :inSpace="true"
            @click="closeNewPromptModal"
          >
            Close
          </Button>
          <Button
            variant="primary"
            :inSpace="true"
            @click="createNewPrompt"
            :disabled="
              !newPromptForm.title.trim() || !newPromptForm.text.trim()
            "
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onBeforeUnmount,
  nextTick,
  onMounted,
  reactive,
  toRaw,
} from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";
import { io, Socket } from "socket.io-client";
import { useWorkspaceStore } from "../../../stores/workspace";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useAgentStore } from "../../../stores/agentStore";
import ChatBotPreviewModal from "./ChatBotPreviewModal.vue";
import TagInput from "../../../components/ui/TagInput.vue";
import Dropdown from "../../../components/ui/Dropdown.vue";
import { onClickOutside } from "@vueuse/core";
import { toast } from "vue-sonner";
import { useSingleWorkspace } from "../../../queries/useWorkspace";
import { useAuthStore } from "../../../stores/auth";
import { useSheets, keys } from "../../../queries/useSheets";
import { useQueryClient } from "@tanstack/vue-query";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import BaseTextAreaField from "../../../components/ui/BaseTextAreaField.vue";
import Button from "../../../components/ui/Button.vue";
import Checkbox from "../../../components/ui/Checkbox.vue";
import { useWidgetStore } from "../../../stores/widgets";

// Types
interface MessageMetadata {
  status?: string;
  temp?: boolean;
  think_ms?: number | null;
  total_ms?: number | null;
}

// Stores
const workspaceStore = useWorkspaceStore();
const agentStore = useAgentStore();
const authStore = useAuthStore();
// Route
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const widgetStore = useWidgetStore();
const activeTab = ref<
  "persona" | "knowledge" | "upload" | "prompt" | "suggested"
>("persona");
const queryClient = useQueryClient();

// Config tabs definition
const configTabs = [
  { key: "persona" as const, label: "Agent", icon: "fa-solid fa-robot" },
  {
    key: "knowledge" as const,
    label: "Knowledge",
    icon: "fa-solid fa-database",
  },
  {
    key: "upload" as const,
    label: "Training",
    icon: "fa-solid fa-graduation-cap",
  },
  { key: "prompt" as const, label: "Prompts", icon: "fa-solid fa-terminal" },
  {
    key: "suggested" as const,
    label: "Suggested",
    icon: "fa-solid fa-lightbulb",
  },
];

// Refs
const isManuallyExpanded = ref(false);

const isExpanded = computed(() => {
  return isManuallyExpanded.value || showConfigPanel.value;
});
const showConfigPanel = ref(false);
const showAIPreview = ref(false);
const userMessage = ref("");
const socket = ref<Socket | null>(null);
const isSocketConnected = ref(false);
const socketURL = import.meta.env.VITE_SOCKET_IO_URL;
const isAiThinkingBubbleVisible = ref(false);
const autoTextarea = ref<HTMLTextAreaElement | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const pendingMessages = ref<any[]>([]);
const isSheet = ref(false);
const selectedAgentId = ref("");
const selectedRole = ref("");
const selectJobRole = ref("");
const showHistoryPanel = ref(false);
const isFocused = ref(false);
const activeSessionId = ref<string>("");
const activeSessionTitle = ref<string>("");
const streamingElapsedMs = ref(0);
const streamingElapsedTimer = ref<ReturnType<typeof setInterval> | null>(null);
const streamingPhaseLabel = ref("");
let elapsedTimerHandle: ReturnType<typeof setInterval> | null = null;
const agentsData = computed(() => agentStore.agentSettings.agent);
const agentModuleId = computed(() => agentStore.module_id);
const agentModuleName = computed(() => agentStore.moduleName);
const knowledgeData = computed(() => agentStore?.agentSettings?.knowledge);
const trainingFileInput = ref<HTMLInputElement | null>(null);
// After: const isAiThinkingBubbleVisible = ref(false);
const streamingContent = ref("");
const streamingPhase = ref<"thinking" | "generating" | "completed" | "">("");
const streamingThinkMs = ref<number | null>(null);
const streamingTotalMs = ref<number | null>(null);
const displayedContent = ref("");
const animationFrameId = ref<number | null>(null);
const streamingPhaseDetail = ref("");
const streamingPhaseTimestamp = ref<number | null>(null);
const phaseHistory = ref<
  Array<{ phase: string; detail: string; timestamp: number }>
>([]);
const webSearch = ref(false);
// const isRecording = ref(false);
const sourceSearch = ref("");
const agentsCreated = computed(() => agentStore.agentsCreated);
const showStreamingBubble = computed(
  () =>
    (streamingPhase.value === "generating" &&
      streamingContent.value.length > 0) ||
    (streamingPhase.value === "completed" &&
      displayedContent.value.length > 0 &&
      !orderedMessages.value.some(
        (m) => m.type === "assistant" && !(m.metadata as MessageMetadata)?.temp,
      )),
);
const showThinkingBubble = computed(
  () => isAiThinkingBubbleVisible.value && streamingPhase.value === "thinking",
);
const filteredSources = computed(() => {
  if (!sourceSearch.value.trim()) return availableSources.value;
  const q = sourceSearch.value.toLowerCase();
  return availableSources.value.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
});
const imageInput = ref<HTMLInputElement | null>(null);
// const toggleRecording = () => {
//   isRecording.value = !isRecording.value;
// };
const agentsRolesPermissions = computed(
  () => agentStore.agentsRolesPermissions,
);
const triggerFileInput = () => {
  trainingFileInput.value?.click();
};
const sheetNameRef = computed(() => agentStore.sheetTitle);
const sheetNameValue = ref(sheetNameRef.value);
const sheetIdRef = ref(agentStore.sheetId || "");
const isDropdownOpen = ref(false);
const Ref = ref<HTMLElement | null>(null);
const isMongoId = (val?: string) => !!val && /^[a-f\d]{24}$/i.test(val);
const pinnedAgentMessages = computed(() => {
  return agentStore.pinnedMessages;
});
function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}
const openMenuSessionId = ref<string | null>(null);
const sheetName = computed(() => {
  if (
    route.path.includes("peak") ||
    route.path.includes("people") ||
    route.path.includes("process") ||
    route.path.includes("plan")
  ) {
    return "";
  }
  return sheetNameRef.value || "";
});
const SESSION_KEY = "chatbot_ever_loaded";
const hasEverLoaded = ref(sessionStorage.getItem(SESSION_KEY) === "1");

watch(
  () => agentStore.isLoadingHistory,
  (loading) => {
    if (!loading && !hasEverLoaded.value) {
      hasEverLoaded.value = true;
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  },
);
const sheetId = computed(() => {
  if (
    route.path.includes("peak") ||
    route.path.includes("people") ||
    route.path.includes("process") ||
    route.path.includes("plan")
  ) {
    return "";
  }
  return sheetIdRef.value || "";
});

onMounted(() => {
  workspaceStore.initSelectedAgent();
});

const { data } = useSheets({
  workspace_id: workspaceId,
  workspace_module_id: moduleId,
});

const sheet_id = computed(() => (data.value ? data.value[0]?._id : ""));
const selected_sheet_id = ref<any>(
  localStorage.getItem("selected_sheet_id") || sheet_id.value,
);
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      if (workspaceStore.showChatBotPanel) {
        sheetIdRef.value = "";
        sheetNameValue.value = "";
        closeHandler();
      }
      activeSessionId.value = "";
      activeSessionTitle.value = "";
      agentStore.chatHistory = [];
      pendingMessages.value = [];
      localStorage.removeItem("activeSessionId");
      localStorage.removeItem("activeSessionTitle");
    }
  },
);

interface IconData {
  prefix: string;
  iconName: string;
}
interface DropdownOption {
  _id: string;
  title: string;
  icon: IconData;
  description: string;
}

const transformedData = computed<DropdownOption[]>(() => {
  return (data.value || []).map((item: any) => ({
    _id: item._id,
    title: item?.variables["sheet-title"],
    description: item?.variables["sheet-description"],
    icon: item["icon"],
    status: item?.generation_status,
  }));
});

const openSheet = ref(false);
const sheetRef = ref<HTMLElement | null>(null);

// const selectedSheetTitle = computed(() => {
//   const found = transformedData.value.find(
//     (sheet) => sheet._id === selected_sheet_id.value,
//   );
//   return found ? found.title : "Select sheet";
// });

// function selectSheet(id: string) {
//   selected_sheet_id.value = id;
//   openSheet.value = false;
// }

function handleClickOutsideSheet(event: MouseEvent) {
  if (sheetRef.value && !sheetRef.value.contains(event.target as Node)) {
    openSheet.value = false;
  }
}
function handleClickOutside(event: MouseEvent) {
  if (Ref.value && !Ref.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
}
onMounted(() => {
  document.addEventListener("click", handleClickOutsideSheet);
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutsideSheet);
  document.removeEventListener("click", handleClickOutside);
});

// Computed
const moduleSelected = computed(() => workspaceStore.selectedAgent);
const { refetch: refetchModules } = useSingleWorkspace(workspaceId.value);

const contextTitle = computed(() => {
  const routeName = (route.name as string)?.toLowerCase() || "workspace";
  if (routeName.includes("peak")) return "Peak";
  if (routeName.includes("plan")) return "Plan";
  if (routeName.includes("process")) return "Process";
  if (routeName.includes("people")) return "Talent";
  if (routeName.includes("more")) return "More";
  return "Workspace";
});
type BaseEntity = (typeof agentStore.createdEntities)[number];
type EntityWithResponse = BaseEntity & {
  response?: {
    items?: unknown[];
  };
  result?: {
    items?: unknown[];
  };
  payload?: {
    sheets?: unknown[];
  };
};

const entities = computed<EntityWithResponse[]>(
  () => agentStore.createdEntities,
);
const hasPreviewData = computed(() => {
  return entities.value?.some((e) => {
    const payloadItems = e?.payload?.sheets || [];
    const resultItems = e?.result?.items || [];
    const responseItems = e?.response?.items || [];

    return (
      (Array.isArray(payloadItems) && payloadItems.length > 0) ||
      (Array.isArray(resultItems) && resultItems.length > 0) ||
      (Array.isArray(responseItems) && responseItems.length > 0)
    );
  });
});

watch(hasPreviewData, (newVal) => {
  if (newVal) {
    isManuallyExpanded.value = true;
    showConfigPanel.value = false;
  }
});

const hasEntitiesForMessage = (msgId: string) => {
  return entities.value?.some((e) => {
    if (!e) return false;
    const msgObj = (e as any).agent_chat_message_id;
    if (typeof msgObj === "object" && msgObj !== null) {
      if ((msgObj as any)._id === msgId) return true;
      if (Array.isArray((msgObj as any).messages)) {
        return (msgObj as any).messages.some((m: any) => m?._id === msgId);
      }
    }
    return msgObj === msgId;
  });
};

const getMessageEntityTitle = (msgId: string) => {
  const entity = entities.value?.find((e) => {
    if (!e) return false;
    const msgObj = (e as any).agent_chat_message_id;
    if (typeof msgObj === "object" && msgObj !== null) {
      if ((msgObj as any)._id === msgId) return true;
      if (Array.isArray((msgObj as any).messages)) {
        return (msgObj as any).messages.some((m: any) => m?._id === msgId);
      }
    }
    return msgObj === msgId;
  });

  if (!entity) return "AI Suggestion";
  if ((entity as any).entity_type === "widget" || (entity as any).entity_type === "peak") return "AI Generated Widget";
  if ((entity as any).entity_type === "sprint") return "AI Suggested Sprint";
  if ((entity as any).action === "read") return "Fetched Workspace Items";
  return "AI Suggested Changes";
};

const getMessageEntityDescription = (msgId: string) => {
  const entity = entities.value?.find((e) => {
    if (!e) return false;
    const msgObj = (e as any).agent_chat_message_id;
    if (typeof msgObj === "object" && msgObj !== null) {
      if ((msgObj as any)._id === msgId) return true;
      if (Array.isArray((msgObj as any).messages)) {
        return (msgObj as any).messages.some((m: any) => m?._id === msgId);
      }
    }
    return msgObj === msgId;
  });

  if (!entity) return "Click below to review the interactive details.";
  if ((entity as any).entity_type === "widget" || (entity as any).entity_type === "peak") {
    return "AI has generated interactive dashboard widgets. Pin them to your Peak dashboard below.";
  }
  if ((entity as any).entity_type === "sprint") {
    return "AI has designed a new sprint schedule. Review the sprint metrics and child cards.";
  }
  if ((entity as any).action === "read") {
    const itemCount = (entity as any).result?.items?.length || 0;
    return `AI fetched ${itemCount} card${itemCount !== 1 ? "s" : ""} matching your query. Review and manage them here.`;
  }
  return "AI suggested layout or ticket changes. Review before applying to your workspace.";
};

const openPreviewFromMessage = (msgId: string) => {
  console.log(msgId);
  
  isManuallyExpanded.value = true;
  showConfigPanel.value = false;
};
const orderedMessages = computed(() => {
  const sessionMessages = Array.isArray(agentStore.chatHistory)
    ? agentStore.chatHistory
        .filter((s) =>
          activeSessionId.value
            ? s.session_id === activeSessionId.value
            : false,
        )
        .flatMap((s) => s.messages || [])
        .filter((msg) => msg.metadata?.status !== "thinking")
    : [];

  const historyIds = new Set(sessionMessages.map((m) => m._id));
  const uniquePending = pendingMessages.value.filter(
    (m) => !historyIds.has(m._id),
  );

  const all = [...sessionMessages, ...uniquePending].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // ← Remove duplicate assistant messages — keep the one with real _id (no 'assistant-' prefix)
  const seen = new Set<string>();
  return all.filter((msg) => {
    if (msg.type !== "assistant") return true;
    const key = msg.content?.slice(0, 50); // dedup by content prefix
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});
const pinnedPrompts = computed(() => {
  return (pinnedAgentMessages.value || []).map((item: any) => {
    const msg = item.message || {};
    const fullText = msg.content || "Pinned prompt";
    return {
      id: msg._id,
      text: fullText,
      label: fullText.length > 32 ? fullText.slice(0, 32) + "…" : fullText,
      msg,
      session_id: item.session_id,
    };
  });
});

function applyPromptToInput(text: string) {
  userMessage.value = text;
  nextTick(() => autoResize());
}

function clearActiveSession() {
  activeSessionId.value = "";
  activeSessionTitle.value = "";
  pendingMessages.value = [];
  agentStore.chatHistory = [];
}
async function startNewChat() {
  if (!selectedAgentId.value) {
    toast.error("Please select an agent first");
    return;
  }
  pendingMessages.value = [];
  agentStore.chatHistory = [];
  activeSessionId.value = "";
  activeSessionTitle.value = "";
  showHistoryPanel.value = false;
  streamingContent.value = "";
  streamingPhase.value = "";
  streamingThinkMs.value = null;
  streamingTotalMs.value = null;

  const payload = {
    agent_id: selectedAgentId.value,
    title: "New Chat",
    module_name:
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : moduleSelected.value || "",
    module_id:
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : moduleId.value || "",
    sheet_name:
      sheetName.value && !isMongoId(sheetName.value) ? sheetName.value : "",
    sheet_id: sheetId.value || "",
    lane_id: "Main",
  };

  console.log("Payload being sent:", payload);

  await agentStore.createSession(workspaceId.value, payload);

  localStorage.removeItem("activeSessionId");
  localStorage.removeItem("activeSessionTitle");
}
async function continueSession(session: any) {
  activeSessionId.value = session.session_id;
  activeSessionTitle.value = session.title || "Untitled conversation";
  localStorage.setItem("activeSessionId", session.session_id);
  localStorage.setItem(
    "activeSessionTitle",
    session.title || "Untitled conversation",
  );
  pendingMessages.value = [];
  agentStore.isLoadingHistory = true;

  try {
    const result = await agentStore.getSession(
      workspaceId.value,
      session.session_id,
    );
    const sessionData = result?.session ?? result;

    if (sessionData?.messages?.length) {
      agentStore.chatHistory = [
        {
          _id: sessionData._id ?? session.session_id,
          session_id: session.session_id,
          context: sessionData.context ?? {
            module_id: null,
            sheet_id: null,
            lane_id: null,
            card_id: null,
          },
          messages: sessionData.messages.map((m: any) => ({
            ...m,
            type: m.type ?? (m.role === "user" ? "user" : "assistant"),
          })),
        },
      ];
    }
  } catch (err) {
    console.error("Failed to load session messages:", err);
  } finally {
    agentStore.isLoadingHistory = false;
  }

  showHistoryPanel.value = false;
  historyViewSession.value = null;
  scrollToBottom();
}

// Auto resize textarea
const autoResize = () => {
  const el = autoTextarea.value;
  if (!el) return;
  el.style.height = "auto";
  const maxHeight = 5 * 24;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
};
onMounted(() => {
  nextTick(() => autoResize());
});
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && e.shiftKey) return;
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};

function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = messagesContainer.value;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  });
}

async function fetchPinnedMessages() {
  await agentStore.fetchPinnedMessages(workspaceId.value, {
    session_id: activeSessionId.value || undefined,
  });
}
watch(
  () => orderedMessages.value.length,
  () => {
    scrollToBottom();
  },
);

watch(
  () => isAiThinkingBubbleVisible.value,
  () => {
    scrollToBottom();
  },
);

// Socket
function initSocket() {
  const token = localStorage.getItem("token");
  if (!token || socket.value?.connected) return;

  socket.value = io(socketURL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.value.on("connect", () => {
    isSocketConnected.value = true;
    if (workspaceId.value) {
      socket.value?.emit("join-workspace", workspaceId.value);
    }
  });

  socket.value.on("disconnect", () => {
    isSocketConnected.value = false;
  });

  socket.value.on("realtime-update", async (data: any) => {
    if (data.type === "agent-response" || data.type === "message_complete") {
      isAiThinkingBubbleVisible.value = false;
      agentStore.isAiTyping = false;

      const useAgentModule =
        route.path.includes("talent") &&
        agentModuleId.value &&
        agentModuleName.value;

      agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        useAgentModule ? agentModuleName.value : moduleSelected.value,
        useAgentModule ? agentModuleId.value : moduleId.value,
        sheetName.value && !isMongoId(sheetName.value)
          ? sheetName.value
          : undefined,
        undefined,
        !!activeSessionId.value,
      );

      await agentStore.fetchCreatedEntities(
        workspaceId.value,
        authStore.userId ?? undefined,
        useAgentModule ? agentModuleName.value : moduleSelected.value,
        useAgentModule ? agentModuleId.value : moduleId.value,
      );

      scrollToBottom();
    }
  });

  socket.value.onAny((eventName, ...args) => {
    console.log("Socket event:", eventName, args);
  });
}

const fileInput = ref<HTMLInputElement | null>(null);

interface FileWithId extends File {
  tempId?: string;
  objectUrl?: string;
}

const selectedFiles = ref<FileWithId[]>([]);

const createObjectURL = (file: FileWithId): string => file.objectUrl || "";

const MAX_IMAGES = 5;

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (!files.length) return;

  const images = files.filter((f) => f.type.startsWith("image/"));
  const pdfs = files.filter((f) => f.type === "application/pdf");

  if (pdfs.length > 1) {
    toast.error("Only one PDF is allowed");
    return;
  }
  if (images.length > MAX_IMAGES) {
    toast.error(`Max ${MAX_IMAGES} images`);
    return;
  }
  if (pdfs.length === 1 && images.length > 0) {
    toast.error("Images or PDF, not both");
    return;
  }

  const filesWithId: FileWithId[] = files.map((f) => {
    const fw = f as FileWithId;
    fw.tempId = "temp-" + Date.now() + Math.random().toString(36).substr(2, 5);
    // Generate objectUrl for ALL files so preview works
    fw.objectUrl = URL.createObjectURL(f);
    return fw;
  });

  selectedFiles.value = [...selectedFiles.value, ...filesWithId];
  if (fileInput.value) fileInput.value.value = "";
  if ((imageInput as any).value) (imageInput as any).value.value = "";
};
const removeFile = (tempId: string) => {
  const fileToRemove = selectedFiles.value.find((f) => f.tempId === tempId);
  if (fileToRemove?.objectUrl) URL.revokeObjectURL(fileToRemove.objectUrl);
  selectedFiles.value = selectedFiles.value.filter((f) => f.tempId !== tempId);
};

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  const files: File[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    }
  }

  if (files.length > 0) {
    event.preventDefault(); // Prevent default paste behavior

    // Filter files based on type (same logic as handleFileChange)
    const images = files.filter((f) => f.type.startsWith("image/"));
    const pdfs = files.filter((f) => f.type === "application/pdf");

    if (pdfs.length > 1) {
      toast.error("Only one PDF is allowed");
      return;
    }
    if (images.length > MAX_IMAGES) {
      toast.error(`Max ${MAX_IMAGES} images`);
      return;
    }
    if (pdfs.length === 1 && images.length > 0) {
      toast.error("Images or PDF, not both");
      return;
    }

    const filesWithId: FileWithId[] = files.map((f) => {
      const fw = f as FileWithId;
      fw.tempId =
        "temp-" + Date.now() + Math.random().toString(36).substr(2, 5);
      fw.objectUrl = URL.createObjectURL(f);
      return fw;
    });

    selectedFiles.value = [...selectedFiles.value, ...filesWithId];
    toast.success(
      `${files.length} file${files.length > 1 ? "s" : ""} pasted from clipboard`,
    );
  }
};

const uploadFiles = async (): Promise<any[]> => {
  if (!selectedFiles.value.length) return [];
  try {
    const res = await agentStore.uploadAssistantFiles(selectedFiles.value);
    return res?.data?.files || [];
  } catch (err) {
    console.error("Upload error:", err);
    return [];
  }
};
async function sendMessage() {
  const message = userMessage.value?.trim();

  if (
    (!message && !selectedFiles.value.length) ||
    !workspaceId.value ||
    agentStore.isSending
  )
    return;

  const filesToSend = [...selectedFiles.value];
  let attachments: any[] = [];

  if (filesToSend.length) {
    attachments = await uploadFiles();
    filesToSend.forEach((f) => {
      if (f.objectUrl) URL.revokeObjectURL(f.objectUrl);
    });
    selectedFiles.value = [];
  }

  const finalMessage = message || "";
  userMessage.value = "";

  // Reset streaming state
  streamingContent.value = "";
  displayedContent.value = "";
  streamingPhase.value = "thinking";
  streamingThinkMs.value = null;
  streamingTotalMs.value = null;
  streamingPhaseDetail.value = "";
  streamingPhaseTimestamp.value = null;
  phaseHistory.value = [];
  isAiThinkingBubbleVisible.value = true;
  agentStore.isAiTyping = true;

  scrollToBottom();

  // Optimistic message
  const tempId = "temp-" + Date.now();
  const previewAttachments = filesToSend.map((f) => ({
    filename: f.name,
    mimetype: f.type,
    url: f.objectUrl,
  }));

  pendingMessages.value.push({
    _id: tempId,
    type: "user",
    content: finalMessage,
    timestamp: new Date().toISOString(),
    metadata: { status: "sending", temp: true },
    attachments: previewAttachments,
  });

  const sessionIdToUse =
    activeSessionId.value ||
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set session optimistically
  if (!activeSessionId.value) {
    activeSessionId.value = sessionIdToUse;

    activeSessionTitle.value =
      finalMessage.length > 40 ? finalMessage.slice(0, 40) + "…" : finalMessage;

    localStorage.setItem("activeSessionId", activeSessionId.value);
    localStorage.setItem("activeSessionTitle", activeSessionTitle.value);
  }

  let isSuccess = false;

  try {
    // 🔥 SEND MESSAGE
    await agentStore.sendMessage({
      workspace_id: workspaceId.value,
      user_id: authStore.userId || (localStorage.getItem("user_id") as string),
      message: finalMessage,
      agent_id: selectedAgentId.value as string,
      sheet_id: sheetIdRef.value as string,
      attachments,
      module_id:
        route.path.includes("talent") && agentModuleId.value
          ? agentModuleId.value
          : (moduleId.value as string),
      module_name:
        route.path.includes("talent") && agentModuleName.value
          ? agentModuleName.value
          : (moduleSelected.value as string),
      lane_id: workspaceStore.selectedLaneIds?.[0] ?? "",
      card_id: route.params.card_id as string,
      session_id: sessionIdToUse,
      stream: true,
      route_path: route.path,
    });

    // ✅ mark success ONLY if no error
    isSuccess = true;

    // Wait for typewriter animation
    await new Promise<void>((resolve) => {
      const fullText = agentStore.currentStreamText;

      if (!fullText || displayedContent.value.length >= fullText.length) {
        resolve();
        return;
      }

      const check = setInterval(() => {
        if (displayedContent.value.length >= fullText.length) {
          clearInterval(check);
          resolve();
        }
      }, 16);

      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 6000);
    });
  } catch (err: any) {
    toast.error(err?.message || "Something went wrong");
    pendingMessages.value = pendingMessages.value.filter(
      (m) => !(m.metadata as MessageMetadata)?.temp,
    );

    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;

    streamingContent.value = "";
    displayedContent.value = "";
    streamingPhase.value = "";
    streamingThinkMs.value = null;
    streamingTotalMs.value = null;
    streamingPhaseDetail.value = "";
    streamingPhaseTimestamp.value = null;
    phaseHistory.value = [];
  }
  if (isSuccess) {
    try {
      localStorage.setItem("activeSessionId", activeSessionId.value);
      localStorage.setItem("activeSessionTitle", activeSessionTitle.value);
      // Set displayed content to final text for the bubble
      displayedContent.value = agentStore.currentStreamText;
      // Build assistant message with timing metadata
      const assistantMsg = {
        _id: "assistant-" + Date.now(),
        type: "assistant" as const,
        content: agentStore.currentStreamText,
        timestamp: new Date().toISOString(),
        metadata: {
          status: "completed",
          think_ms: agentStore.streamThinkMs,
          total_ms: agentStore.streamTotalMs,
        },
      };

      // Find or create session in chatHistory
      const existingIdx = agentStore.chatHistory.findIndex(
        (s) => s.session_id === activeSessionId.value,
      );

      if (existingIdx !== -1) {
        // Promote optimistic user message + append assistant reply
        const session = agentStore.chatHistory[existingIdx];
        // Find the temp user message in pendingMessages
        const tempUserMsg = pendingMessages.value.find(
          (m) => (m.metadata as MessageMetadata)?.temp,
        );
        if (tempUserMsg) {
          // Add the confirmed user message to session
          session.messages.push({
            ...tempUserMsg,
            metadata: { status: "completed" },
          });
        }
        session.messages.push(assistantMsg);
      } else {
        // Brand new session
        const userMsg = pendingMessages.value.find(
          (m) => (m.metadata as MessageMetadata)?.temp,
        );
        agentStore.chatHistory.push({
          _id: activeSessionId.value,
          session_id: activeSessionId.value,
          context: {
            module_id: null,
            sheet_id: null,
            lane_id: null,
            card_id: null,
          },
          messages: [
            ...(userMsg
              ? [{ ...userMsg, metadata: { status: "completed" } }]
              : []),
            assistantMsg,
          ],
        });
      }

      // Clear pending — history now has the real messages
      pendingMessages.value = [];

      // Fetch entities (no flicker — doesn't touch chatHistory)
      await agentStore.fetchCreatedEntities(
        workspaceId.value,
        authStore.userId || (localStorage.getItem("user_id") as string),
        route.path.includes("talent") && agentModuleName.value
          ? (agentModuleName.value ?? undefined)
          : (moduleSelected.value ?? undefined),
        route.path.includes("talent") && agentModuleId.value
          ? (agentModuleId.value ?? undefined)
          : (moduleId.value ?? undefined),
      );
    } catch (err) {
      console.error("Post-success processing failed:", err);
    }
  }

  // Final cleanup — always runs
  pendingMessages.value = [];
  isAiThinkingBubbleVisible.value = false;
  agentStore.isAiTyping = false;
  agentStore.isSending = false;
  scrollToBottom();
}

const stopGeneration = () => {
  // Tell the store to abort — this cancels the fetch + resets stream state
  agentStore.stopStream();

  // Add a stopped message if we had content
  if (streamingContent.value || displayedContent.value) {
    const stoppedContent = displayedContent.value
      ? displayedContent.value + "\n\n*(Generation stopped)*"
      : "*(Generation stopped)*";

    const stoppedMsg = {
      _id: `stopped-${Date.now()}`,
      type: "assistant" as const,
      content: stoppedContent,
      timestamp: new Date().toISOString(),
      metadata: { status: "completed", temp: false },
    };

    const existingIdx = agentStore.chatHistory.findIndex(
      (s) => s.session_id === activeSessionId.value,
    );
    if (existingIdx !== -1) {
      agentStore.chatHistory[existingIdx].messages.push(stoppedMsg);
    } else {
      pendingMessages.value.push(stoppedMsg);
    }
  }

  // Stop animation frame
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  // Reset local state
  isAiThinkingBubbleVisible.value = false;
  pendingMessages.value = pendingMessages.value.filter(
    (m) => !(m.metadata as MessageMetadata)?.temp,
  );
  stopElapsedTimer();
  streamingContent.value = "";
  displayedContent.value = "";
  streamingPhase.value = "";
  streamingPhaseDetail.value = "";
  streamingThinkMs.value = null;
  streamingTotalMs.value = null;

  scrollToBottom();
};

// Accept / Decline
async function acceptChanges(payload: any) {
  try {
    await agentStore.acceptEntities(payload);
    await queryClient.invalidateQueries({
      queryKey: keys.sheets(moduleId.value, workspaceId.value),
    });
    await queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      moduleSelected.value ?? undefined,
      moduleId.value ?? undefined,
    );
    if (route.path?.includes("peak")) {
      await widgetStore.fetchWidgets(workspaceId.value);
    }
    if (route.path?.includes("plan")) {
      queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    }
    showAIPreview.value = false;
    toast.success("Entities has been accepted and applied to workspace");
  } catch (error) {
    console.error(error);
    toast.error("Failed to accept entities");
  }
}

async function declineAgentGeneratedEntities() {
  await agentStore.declineSuggestedEntities(
    workspaceId.value,
    entities.value?.[0]?.id,
  );
  showAIPreview.value = false;
  toast.success("Preview entities has been rejected and deleted");
  refetchModules();
  await agentStore.fetchCreatedEntities(
    workspaceId.value,
    authStore.userId ?? undefined,
    moduleSelected.value ?? undefined,
    moduleId.value ?? undefined,
  );
}

function closeHandler() {
  workspaceStore.toggleChatBotPanel();
}

const formatTimestamp = (ts?: string) => {
  if (!ts) return "";
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

// Lifecycle hooks
onMounted(() => {
  initSocket();
  if (workspaceId.value && workspaceStore.showChatBotPanel) {
    const savedSessionId = localStorage.getItem("activeSessionId");
    const savedSessionTitle = localStorage.getItem("activeSessionTitle");

    if (savedSessionId) {
      activeSessionId.value = savedSessionId;
      activeSessionTitle.value = savedSessionTitle || "";
    } else {
      agentStore.chatHistory = [];
      activeSessionId.value = "";
      activeSessionTitle.value = "";
    }
    if (savedSessionId) {
      activeSessionId.value = savedSessionId;
      activeSessionTitle.value = savedSessionTitle || "";

      agentStore.isLoadingHistory = true;
      agentStore
        .getSession(workspaceId.value, savedSessionId)
        .then((result) => {
          const sessionData = result?.session ?? result;
          if (sessionData?.messages?.length) {
            agentStore.chatHistory = [
              {
                _id: sessionData._id ?? savedSessionId,
                session_id: savedSessionId,
                context: sessionData.context ?? {
                  module_id: null,
                  sheet_id: null,
                  lane_id: null,
                  card_id: null,
                },
                messages: sessionData.messages.map((m: any) => ({
                  ...m,
                  type: m.type ?? (m.role === "user" ? "user" : "assistant"),
                })),
              },
            ];
          }
        })
        .catch((err) => console.error("Failed to restore session:", err))
        .finally(() => {
          agentStore.isLoadingHistory = false;
          scrollToBottom();
        });
    }
    agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : (moduleSelected.value ?? undefined),
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : (moduleId.value ?? undefined),
    );
if (agentStore.agentPassed) {
  // agentPassed watcher will handle everything — skip route-based fetch
} else {
  if (selectedAgentId.value) {
    loadAgentSettings();
  }
  if (!agentStore.agentPassed) {
  fetchAssignedAgents();
}
}
  }
  scrollToBottom();
});
// REPLACE WITH:
watch(
  [
    () => workspaceStore.showChatBotPanel,
    () => moduleSelected.value,
    () => selectedAgentId.value,
  ],
  async (
    [isOpen, _moduleSelected, newSelectedAgentId],
    [_oldIsOpen, _oldModuleSelected, oldSelectedAgentId],
  ) => {
    if (!workspaceId.value || !isOpen) return;

    // Skip if agentPassed watcher is actively handling a cross-module agent
    if (agentStore.agentPassed || isHandlingAgentPassed.value) return;

    if (!activeSessionId.value) {
      const savedSessionId = localStorage.getItem("activeSessionId");
      const savedSessionTitle = localStorage.getItem("activeSessionTitle");

      if (savedSessionId) {
        activeSessionId.value = savedSessionId;
        activeSessionTitle.value = savedSessionTitle || "";

        agentStore.isLoadingHistory = true;
        try {
          const result = await agentStore.getSession(
            workspaceId.value,
            savedSessionId,
          );
          const sessionData = result?.session ?? result;
          if (sessionData?.messages?.length) {
            agentStore.chatHistory = [
              {
                _id: sessionData._id ?? savedSessionId,
                session_id: savedSessionId,
                context: sessionData.context ?? {
                  module_id: null,
                  sheet_id: null,
                  lane_id: null,
                  card_id: null,
                },
                messages: sessionData.messages.map((m: any) => ({
                  ...m,
                  type: m.type ?? (m.role === "user" ? "user" : "assistant"),
                })),
              },
            ];
          }
        } catch (err) {
          console.error("Failed to restore session:", err);
          localStorage.removeItem("activeSessionId");
          localStorage.removeItem("activeSessionTitle");
        } finally {
          agentStore.isLoadingHistory = false;
          scrollToBottom();
        }
      }
    } else {
      agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        route.path.includes("talent") && agentModuleName.value
          ? agentModuleName.value
          : (moduleSelected.value ?? undefined),
        route.path.includes("talent") && agentModuleId.value
          ? agentModuleId.value
          : (moduleId.value ?? undefined),
        sheetName.value && !isMongoId(sheetName.value)
          ? sheetName.value
          : undefined,
        sheetId.value,
        !!activeSessionId.value,
      );
    }

    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : (moduleSelected.value ?? undefined),
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : (moduleId.value ?? undefined),
    );

    if (newSelectedAgentId !== oldSelectedAgentId) {
      await loadAgentSettings();
    }

    fetchAssignedAgents();
    scrollToBottom();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (workspaceId.value && socket.value) {
    socket.value.emit("leave-workspace", workspaceId.value);
  }
  socket.value?.removeAllListeners();
  socket.value?.disconnect();
  if (animFrameId !== null) cancelAnimationFrame(animFrameId);
  stopElapsedTimer();
});
onBeforeUnmount(() => {
  if (streamingElapsedTimer.value) clearInterval(streamingElapsedTimer.value);
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
  }
  streamingContent.value = "";
  displayedContent.value = "";
  streamingThinkMs.value = null;
  streamingTotalMs.value = null;
});
const openConfigPanel = () => {
  showConfigPanel.value = !showConfigPanel.value;
  if (showConfigPanel.value) {
    if (!selectedAgentId.value) {
      resetAgentConfig();
    } else {
      loadAgentSettings();
    }
  }
};

const expandPanel = () => {
  isManuallyExpanded.value = true;
  if (isExpanded.value && !hasPreviewData.value) {
    showConfigPanel.value = true;
  }
};

const compressPanel = () => {
  isManuallyExpanded.value = false;
  showConfigPanel.value = false;
};

const availableCapabilities = [
  { label: "Web Browsing", value: "webBrowsing" },
  { label: "Workspace Knowledge", value: "workspaceData" },
  { label: "Module knowledge", value: "module_knowledge" },
  { label: "Sheet knowledge", value: "sheet_knowledge" },
  { label: "Tickets knowledge", value: "tickets_knowledge" },
  {
    label: "Docs, images, screenshots, text, videos, notes knowledge",
    value: "accept_knowldge",
  },
  { label: "Prompt knowledge", value: "prompt_knowledge" },
];

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  role: string;
  system_prompt: string;
  level: "JUNIOR" | "MID" | "SENIOR" | "EXPERT" | "LEAD";
  responsibilities: string[];
  skills: string[];
  competencies: string[];
  capabilities: string[];
  conditions_rules: string[];
  actions: string[];
  module_actions: ModuleAction[];
}

const agentConfig = reactive<AgentConfig>({
  id: "",
  name: "",
  description: "",
  role: "",
  system_prompt: "",
  level: "MID",
  responsibilities: [],
  skills: [],
  competencies: [],
  capabilities: [],
  conditions_rules: [],
  actions: [],
  module_actions: [],
});

const openLevel = ref(false);
const levelRef = ref(null);

onClickOutside(levelRef, () => {
  openLevel.value = false;
});

const agentOptions = computed(() => {
  return (agentsCreated.value?.data?.agents || []).map((agent: any) => ({
    _id: agent._id,
    title: agent.name.includes(" ") ? agent.name : `${agent.name} agent`,
    description: agent.description,
    icon: {
      prefix: "fa-solid",
      iconName: `fa-circle ${
        isSocketConnected.value
          ? "bg-green-500 border text-green-500 rounded-full"
          : "text-red-500 border rounded-full bg-red-500"
      } text-[6px]`,
    },
  }));
});
const selectedAgentName = computed(() => {
  const agent = agentsCreated.value?.data?.agents?.find(
    (a: any) => a._id === selectedAgentId.value,
  );
  if (!agent?.name) return "Select Agent";
  return agent.name.length > 20 ? agent.name.slice(0, 20) + "..." : agent.name;
});
watch(
  () => agentsCreated.value?.data?.agents,
  (agents) => {
    if (!agents?.length) return;
    if (agentStore.agentPassed || isHandlingAgentPassed.value) return;

    if (!selectedAgentId.value) {
      selectedAgentId.value = agents[0]._id;
    } else {
      const stillExists = agents.some(
        (a: any) => a._id === selectedAgentId.value,
      );
      if (!stillExists) {
        selectedAgentId.value = agents[0]._id;
      }
    }
  },
  { immediate: true },
);
const isHandlingAgentPassed = ref(false);
watch(
  () => agentStore.agentPassed,
  async (passedAgent) => {
    if (!passedAgent?._id || !workspaceId.value) return;

    // Raise flag FIRST — before any state changes that trigger other watchers
    isHandlingAgentPassed.value = true;

    const passedModuleId = agentStore.module_id ?? undefined;
    const passedModuleName = agentStore.moduleName ?? undefined;

    // Inject agent immediately so dropdown shows correct name
    agentStore.agentsCreated = {
      data: {
        agents: [passedAgent],
      },
    };

    // Set ID — this triggers main watcher, but isHandlingAgentPassed blocks it
    selectedAgentId.value = passedAgent._id;

    // Now safe to clear agentPassed
    agentStore.agentPassed = null;

    // Fetch correct module agents
    await agentStore.fetchSavedAgents(
      workspaceId.value,
      passedModuleId,
      passedModuleName,
    );

    // Load settings with correct module context
    isLoadingSettings.value = true;
    await agentStore.fetchAgentSettings(
      workspaceId.value,
      passedModuleId,
      passedModuleName,
      passedAgent._id,
    );
    isLoadingSettings.value = false;
    webSearch.value =
      agentStore.agentSettings?.agent?.web_browsing_enabled ?? false;

    // Lower flag only after everything is done
    isHandlingAgentPassed.value = false;
    scrollToBottom();
  },
  { immediate: true },
);
const availableAgentsLevels = [
  { _id: "1", title: "Expert", value: "EXPERT" },
  { _id: "2", title: "Lead", value: "LEAD" },
  { _id: "3", title: "Senior", value: "SENIOR" },
  { _id: "4", title: "Mid", value: "MID" },
  { _id: "5", title: "Junior", value: "JUNIOR" },
];

// const selectedLevelLabel = computed(() => {
//   return (
//     availableAgentsLevels.find((l) => l.value === agentConfig.level)?.title ||
//     availableAgentsLevels[0].title
//   );
// });

// const selectLevel = (value: string) => {
//   agentConfig.level = value as any;
//   openLevel.value = false;
// };

const originalAgentConfig = ref<Partial<AgentConfig> | null>(null);
watch(
  () => agentsData.value,
  (agent) => {
    if (!agent) return;

    agentConfig.name = agent.name || "";
    agentConfig.id = agent._id || "";
    agentConfig.description = agent.description || "";
    agentConfig.role = agent.role || "";
    agentConfig.system_prompt = agent.system_prompt || "";
    agentConfig.level = agent.level || "MID";
    agentConfig.responsibilities = [...(agent.responsibilities || [])];
    agentConfig.skills = [...(agent.skills || [])];
    agentConfig.competencies = [...(agent.competencies || [])];
    agentConfig.capabilities = [...(agent.capabilities || [])];
    agentConfig.conditions_rules = [...(agent.conditions_rules || [])];

    if (agent.workspace_access_role_id) {
      selectedRole.value = agent.workspace_access_role_id;
    }
    if (agent.workspace_role_id) {
      selectJobRole.value = agent.workspace_role_id;
    }

    // Load suggested prompts from agent data
    if (agent.suggested_prompts?.length) {
      suggestedPrompts.value = agent.suggested_prompts.map((p: any) => ({
        label: p.label || "",
        text: p.text || "",
        category: p.category || "",
        is_active: p.is_active !== false,
      }));
    }

    originalAgentConfig.value = JSON.parse(
      JSON.stringify({
        name: agentConfig.name,
        description: agentConfig.description,
        role: agentConfig.role,
        level: agentConfig.level,
        responsibilities: agentConfig.responsibilities,
        skills: agentConfig.skills,
        competencies: agentConfig.competencies,
        capabilities: agentConfig.capabilities,
        conditions_rules: agentConfig.conditions_rules,
        workspace_role_id: selectJobRole.value,
        workspace_access_role_id: selectedRole.value,
      }),
    );
  },
  { immediate: true },
);
watch(
  () => selectedAgentId.value,
  async (newId, oldId) => {
    if (isHandlingAgentPassed.value) return; // agentPassed watcher handles this
    if (agentStore.agentPassed) return;
    if (newId && workspaceId.value && newId !== oldId) {
      await loadAgentSettings();
    }
  },
  { immediate: false },
);
interface KnowledgeConfig {
  module_id: string;
  module_name: string;
  sources: Record<
    | "INTERNAL_TICKET"
    | "INTERNAL_MODULE"
    | "INTERNAL_SHEET"
    | "WEB_SEARCH"
    | "PROMPT",
    boolean
  >;
  is_active: boolean;
  metadata: Record<string, any>;
}
interface KnowledgePayload {
  module_id: string;
  module_name: string;
  sources: Array<{ source_type: string }>;
  is_active: boolean;
  metadata: Record<string, any>;
}

interface KnowledgeItem {
  _id: string;
  name: string;
  description?: string | null;
  source_type:
    | "INTERNAL_TICKET"
    | "INTERNAL_MODULE"
    | "INTERNAL_SHEET"
    | "WEB_SEARCH"
    | "PROMPT";
  metadata: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string | null;
  is_trash?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  __v?: number;
}

const knowledgeConfig = reactive<KnowledgeConfig>({
  module_id: moduleId.value,
  module_name: moduleSelected.value,
  sources: {
    INTERNAL_TICKET: true,
    INTERNAL_MODULE: false,
    INTERNAL_SHEET: false,
    WEB_SEARCH: false,
    PROMPT: false,
  },
  is_active: true,
  metadata: {},
});

const knowledgePermissions = reactive<
  Record<
    | "INTERNAL_TICKET"
    | "INTERNAL_MODULE"
    | "INTERNAL_SHEET"
    | "WEB_SEARCH"
    | "PROMPT",
    {
      create: boolean;
      Edit: boolean;
      delete: boolean;
      view: boolean;
    }
  >
>({
  INTERNAL_TICKET: { create: false, Edit: false, delete: false, view: false },
  INTERNAL_MODULE: { create: false, Edit: false, delete: false, view: false },
  INTERNAL_SHEET: { create: false, Edit: false, delete: false, view: false },
  WEB_SEARCH: { create: false, Edit: false, delete: false, view: false },
  PROMPT: { create: false, Edit: false, delete: false, view: false },
});

const isKnowledgeLoading = ref(false);

const sourceList = [
  { label: "Internal Ticket", value: "INTERNAL_TICKET" },
  { label: "Internal Module", value: "INTERNAL_MODULE" },
  { label: "Internal Sheet", value: "INTERNAL_SHEET" },
  { label: "Web Search", value: "WEB_SEARCH" },
  { label: "Prompt", value: "PROMPT" },
];

const defaultPermissions = [
  { label: "Create", value: "create" },
  { label: "View", value: "view" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
];

const permissionsMap: Record<string, typeof defaultPermissions> = {
  INTERNAL_TICKET: defaultPermissions,
  INTERNAL_MODULE: defaultPermissions,
  INTERNAL_SHEET: defaultPermissions,
  WEB_SEARCH: defaultPermissions,
  PROMPT: defaultPermissions,
};

const openDropdowns = reactive<Record<string, boolean>>({
  INTERNAL_TICKET: false,
  INTERNAL_MODULE: false,
  INTERNAL_SHEET: false,
  WEB_SEARCH: false,
  PROMPT: false,
});

const refsMap: Record<string, Ref<HTMLElement | null>> = {
  INTERNAL_TICKET: ref(null),
  INTERNAL_MODULE: ref(null),
  INTERNAL_SHEET: ref(null),
  WEB_SEARCH: ref(null),
  PROMPT: ref(null),
};

function toggleSourceDropdown(source: string) {
  openDropdowns[source] = !openDropdowns[source];
}

function getPermissionLabel(
  source: keyof typeof knowledgePermissions,
  perm: string,
) {
  const createMap: Record<string, string> = {
    INTERNAL_TICKET: "Ticket",
    INTERNAL_MODULE: "Module",
    INTERNAL_SHEET: "Sheet",
    WEB_SEARCH: "Search",
    PROMPT: "Prompt",
  };
  if (perm === "create") return `Create ${createMap[source]}`;
  if (perm === "update") return `Update ${createMap[source]}`;
  if (perm === "delete") return `Delete ${createMap[source]}`;
  if (perm === "view") return `View ${createMap[source]}`;
  return perm;
}

const knowledgeMetadataString = computed({
  get: () => JSON.stringify(knowledgeConfig.metadata, null, 2),
  set: (val: string) => {
    try {
      knowledgeConfig.metadata = JSON.parse(val || "{}");
    } catch {
      console.warn("Invalid JSON metadata");
    }
  },
});

watch(
  [knowledgeData, () => moduleSelected.value],
  ([data, selectedModule]) => {
    if (data && data.length > 0) {
      const knowledgeForModule = data.filter(
        (k: KnowledgeItem) => k.metadata?.module_name === selectedModule,
      );
      if (knowledgeForModule.length > 0) {
        const firstItem = knowledgeForModule[0];
        knowledgeConfig.module_id =
          firstItem.metadata?.module_id || moduleId.value;
        knowledgeConfig.module_name =
          firstItem.metadata?.module_name || selectedModule || "";
        const defaultSources: KnowledgeConfig["sources"] = {
          INTERNAL_TICKET: false,
          INTERNAL_MODULE: false,
          INTERNAL_SHEET: false,
          WEB_SEARCH: false,
          PROMPT: false,
        };
        knowledgeForModule.forEach((item: KnowledgeItem) => {
          if (item.source_type in defaultSources) {
            defaultSources[
              item.source_type as keyof KnowledgeConfig["sources"]
            ] = true;
          }
        });
        knowledgeConfig.sources = defaultSources;
        knowledgeConfig.is_active = knowledgeForModule.every(
          (item: KnowledgeItem) => item.is_active,
        );
        knowledgeConfig.metadata = firstItem.metadata || {};
        return;
      }
    }
    knowledgeConfig.module_id = moduleId.value;
    knowledgeConfig.module_name = selectedModule || "";
    knowledgeConfig.sources = {
      INTERNAL_TICKET: true,
      INTERNAL_MODULE: false,
      INTERNAL_SHEET: false,
      WEB_SEARCH: false,
      PROMPT: false,
    };
    knowledgeConfig.is_active = true;
    knowledgeConfig.metadata = {};
  },
  { immediate: true },
);

const getSelectedSourcesArray = (
  sources: KnowledgeConfig["sources"],
): Array<keyof typeof sources> => {
  return Object.keys(sources).filter(
    (key) => sources[key as keyof typeof sources],
  ) as Array<keyof typeof sources>;
};

const submitKnowledge = async () => {
  if (!workspaceId.value) return;
  isKnowledgeLoading.value = true;
  try {
    const selectedSources = getSelectedSourcesArray(knowledgeConfig.sources);
    const payload: KnowledgePayload = {
      module_id: knowledgeConfig.module_id,
      module_name: knowledgeConfig.module_name,
      sources: selectedSources.map((source) => ({
        source_type: source,
        permissions: knowledgePermissions[source],
      })),
      is_active: knowledgeConfig.is_active,
      metadata: knowledgeConfig.metadata,
    };
    await agentStore.trainKnowledge(workspaceId.value, payload);
    toast.success("Knowledge trained successfully!");
    knowledgeConfig.module_id = "";
    knowledgeConfig.module_name = "";
    knowledgeConfig.metadata = {};
    knowledgeConfig.sources = {
      INTERNAL_TICKET: true,
      INTERNAL_MODULE: false,
      INTERNAL_SHEET: false,
      WEB_SEARCH: false,
      PROMPT: false,
    };
    knowledgeConfig.is_active = true;
  } catch (err) {
    console.error(err);
    toast.error("Failed to train knowledge");
  } finally {
    isKnowledgeLoading.value = false;
    loadAgentSettings();
  }
};

function handleSourceClickOutside(event: MouseEvent) {
  sourceList.forEach((source) => {
    const refEl = refsMap[source.value].value;
    if (refEl && !refEl.contains(event.target as Node)) {
      openDropdowns[source.value] = false;
    }
  });
}

onMounted(() => {
  document.addEventListener("click", handleSourceClickOutside);
  fetchPinnedMessages();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleSourceClickOutside);
});

/* ---------------- UPLOAD CONFIG ---------------- */
const availableUploadTypes = [
  { value: "TEXT" as UploadType, label: "Text Content" },
  { value: "URL" as UploadType, label: "URL/Link" },
  { value: "CMS_PAGE" as UploadType, label: "CMS Page" },
  { value: "MIXED" as UploadType, label: "Mixed Content" },
];

// const selectedTypeLabel = computed(() => {
//   const found = availableUploadTypes.find((t) => t.value === uploadConfig.type);
//   return found ? found.label : uploadConfig.type;
// });

// const selectType = (type: UploadType) => {
//   uploadConfig.type = type;
//   openType.value = false;
// };

const trainingData = computed(() => agentStore?.agentSettings?.training);

type UploadType =
  | "TEXT"
  | "URL"
  | "CMS_PAGE"
  | "MIXED"
  | "UPLOAD"
  | "INTERNAL_MODULE"
  | "INTERNAL_SHEET"
  | "INTERNAL_TICKET"
  | "WEB_SEARCH"
  | "PROMPT";

interface UploadConfig {
  name: string;
  text: string;
  type: UploadType;
  files: File[];
  module_id: string;
  module_name: string;
}

const uploadConfig = reactive<UploadConfig>({
  name: route.path.includes("peak") ? "Peak Agent" : moduleSelected.value,
  text: "",
  type: "TEXT",
  files: [],
  module_id: "",
  module_name: "",
});

const handleUploadFiles = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;
  const files = Array.from(target.files);
  uploadConfig.files.push(...files);
  target.value = "";
};

const isUploading = ref(false);

const submitTrainingContent = async () => {
  if (!workspaceId.value) return;
  if (
    !uploadConfig.name ||
    (uploadConfig.text === "" && uploadConfig.files.length === 0)
  ) {
    toast.error("Please provide a name and either text or files");
    return;
  }
  isUploading.value = true;
  try {
    await agentStore.uploadTrainingContent(workspaceId.value, {
      ...uploadConfig,
      module_id: moduleId.value || "",
      module_name: moduleSelected.value || "",
    });
    toast.success("Training content uploaded successfully!");
    uploadConfig.name = "";
    uploadConfig.text = "";
    uploadConfig.type = "TEXT";
    uploadConfig.files = [];
    uploadConfig.module_id = "";
    uploadConfig.module_name = "";
  } catch (err) {
    console.error(err);
    toast.error("Failed to upload training content");
  } finally {
    isUploading.value = false;
    loadAgentSettings();
  }
};

watch(
  [trainingData, () => moduleSelected.value],
  ([data, selectedModule]) => {
    if (data) {
      if (route.path?.includes("peak")) {
        uploadConfig.name = data.title || "Peak Agent";
      } else {
        uploadConfig.name = data.title || selectedModule;
      }
      uploadConfig.text = data.source_meta?.text || "";
      uploadConfig.type = (data.source_type as UploadType) || "TEXT";
      uploadConfig.module_id = moduleId.value || "";
      uploadConfig.module_name = selectedModule || "";
      uploadConfig.files = [];
    } else {
      if (route.path?.includes("peak")) {
        uploadConfig.name = "Peak Agent";
      } else {
        uploadConfig.name = selectedModule || "";
      }
      uploadConfig.text = "";
      uploadConfig.type = "TEXT";
      uploadConfig.module_id = moduleId.value || "";
      uploadConfig.module_name = selectedModule || "";
      uploadConfig.files = [];
    }
  },
  { immediate: true, deep: true },
);

const isLoading = ref(false);

const resetAgentConfig = () => {
  agentConfig.id = "";
  agentConfig.name = "";
  agentConfig.description = "";
  agentConfig.role = "";
  agentConfig.system_prompt = "";
  agentConfig.level = "MID";
  agentConfig.responsibilities = [];
  agentConfig.skills = [];
  agentConfig.competencies = [];
  agentConfig.capabilities = [];
  agentConfig.conditions_rules = [];
  selectedRole.value = "";
  selectJobRole.value = "";
};

const submitPersona = async () => {
  if (!workspaceId.value) {
    toast.error("Workspace ID is missing!");
    return;
  }
  if (!agentConfig.name || !agentConfig.role) {
    toast.error("Please fill in required fields!");
    return;
  }
  isLoading.value = true;
  try {
    const payload = {
      module_id: moduleId.value,
      module_name: moduleSelected.value,
      sheet_id: selected_sheet_id.value,
      sheet_name: moduleSelected.value,
      name: agentConfig.name,
      description: agentConfig.description,
      role: agentConfig.role,
      level: agentConfig.level,
      responsibilities: agentConfig.responsibilities,
      skills: agentConfig.skills,
      competencies: agentConfig.competencies,
      capabilities: agentConfig.capabilities,
      conditions_rules: agentConfig.conditions_rules,
      workspace_role_id: selectJobRole.value,
      workspace_access_role_id: selectedRole.value,
    };
    await agentStore.trainPersona(workspaceId.value, payload);
    isLoading.value = false;
    resetAgentConfig();
  } catch (err) {
    isLoading.value = false;
  } finally {
    await loadAgentSettings();
    await fetchAssignedAgents();
  }
};

const getChangedFields = (original: any, current: any) => {
  const changed: Record<string, any> = {};
  Object.keys(current).forEach((key) => {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      changed[key] = current[key];
    }
  });
  return changed;
};

const updateAgent = async (agent: string) => {
  if (!originalAgentConfig.value) return;
  const currentPayload = {
    name: agentConfig.name,
    description: agentConfig.description,
    role: agentConfig.role,
    level: agentConfig.level,
    responsibilities: agentConfig.responsibilities,
    skills: agentConfig.skills,
    competencies: agentConfig.competencies,
    capabilities: agentConfig.capabilities,
    conditions_rules: agentConfig.conditions_rules,
    workspace_role_id: selectJobRole.value,
    workspace_access_role_id: selectedRole.value,
    module_actions: agentConfig.module_actions,
  };
  const payload = getChangedFields(originalAgentConfig.value, currentPayload);
  if (!Object.keys(payload).length) return;
  await agentStore.updateSelectedAgent(workspaceId.value, payload, agent);
  await fetchAssignedAgents();
  await loadAgentSettings();
  await agentStore.fetchAgentsByRoleOrModule(workspaceId.value, "module");
};

const deleteAgent = async (agent: string) => {
  await agentStore.deleteSelectedAgent(workspaceId.value, agent);
  await fetchAssignedAgents();
  await loadAgentSettings();
  resetAgentConfig();
};

const isLoadingSettings = ref(false);

const selectedModule = computed(() =>
  route.path.includes("peak") ? "Peak" : moduleSelected.value,
);

const loadAgentSettings = async () => {
  isLoadingSettings.value = true;
  await agentStore.fetchAgentSettings(
    workspaceId.value,
    moduleId.value,
    selectedModule.value,
    selectedAgentId.value,
  );
  isLoadingSettings.value = false;
  webSearch.value = agentsData.value?.web_browsing_enabled ?? false;
};
async function fetchAssignedAgents() {
  await agentStore.fetchSavedAgents(
    workspaceId.value,
    moduleId.value,
    selectedModule.value,
  );
  // Selection is handled by the agentsCreated watcher — do not set selectedAgentId here
}
async function fetchAgentsRolesPermissions() {
  await agentStore.fetchAgentsRolesPermissions(workspaceId.value);
}
fetchAgentsRolesPermissions();

const roleOptions = computed(() => {
  let roles: any[] = [];
  roles = (agentsRolesPermissions.value?.access_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }));
  return roles;
});

const jobOptions = computed(() => {
  let roles: any[] = [];
  roles = (agentsRolesPermissions.value?.job_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }));
  return roles;
});

const unpinSingle = async (pin: any) => {
  const msg = pin.msg;
  if (!msg?._id) return;

  togglingPinId.value = msg._id;

  try {
    await agentStore.pinMessage(
      workspaceId.value,
      pin.session_id,
      msg._id,
      false,
    );

    toast.success("Message unpinned");

    await agentStore.fetchPinnedMessages(workspaceId.value, {
      agent_id: selectedAgentId.value,
    });
  } catch (err) {
    console.error(err);
    toast.error("Failed to unpin message");
  } finally {
    togglingPinId.value = null;
  }
};

// ── Sessions state ────────────────────────────────────────────────────────────
const isLoadingSessions = ref(false);
const isLoadingSessionMessages = ref(false);
const sessionsList = ref<any[]>([]);
const sessionsPagination = ref<{
  total: number;
  limit: number;
  skip: number;
} | null>(null);
const currentSessionPage = ref(1);

const historyViewSession = ref<any>(null);
const historyViewMessages = ref<any[]>([]);

const isRenamingSession = ref(false);
const renamingSessionId = ref<string | null>(null);
const renameValue = ref("");
const renameInput = ref<HTMLInputElement | null>(null);
const listRenameInputs: Record<string, HTMLInputElement> = {};

const totalSessionPages = computed(() => {
  if (!sessionsPagination.value) return 1;
  const { total, limit } = sessionsPagination.value;
  return Math.ceil(total / limit) || 1;
});

async function fetchSessions(page = 1) {
  if (!workspaceId.value) return;
  isLoadingSessions.value = true;
  try {
    const limit = 20;
    const result = await agentStore.fetchSessions(workspaceId.value, {
      agent_id: selectedAgentId.value || undefined,
      limit,
      skip: (page - 1) * limit,
    });
    sessionsList.value = result?.sessions ?? [];
    sessionsPagination.value = result?.pagination ?? null;
  } finally {
    isLoadingSessions.value = false;
  }
}

async function changeSessionPage(page: number) {
  if (page < 1 || page > totalSessionPages.value) return;
  currentSessionPage.value = page;
  await fetchSessions(page);
}

async function openSession(session: any) {
  continueSession(session);
}

function startRename() {
  renameValue.value = historyViewSession.value?.title || "";
  isRenamingSession.value = true;
  nextTick(() => renameInput.value?.focus());
}

async function confirmRename() {
  if (!historyViewSession.value || !renameValue.value.trim()) {
    isRenamingSession.value = false;
    return;
  }
  try {
    await agentStore.renameSession(
      workspaceId.value,
      historyViewSession.value.session_id,
      renameValue.value.trim(),
    );
    historyViewSession.value = {
      ...historyViewSession.value,
      title: renameValue.value.trim(),
    };
    const idx = sessionsList.value.findIndex(
      (s) => s.session_id === historyViewSession.value?.session_id,
    );
    if (idx !== -1)
      sessionsList.value[idx] = {
        ...sessionsList.value[idx],
        title: renameValue.value.trim(),
      };
    if (activeSessionId.value === historyViewSession.value.session_id) {
      activeSessionTitle.value = renameValue.value.trim();
    }
    toast.success("Chat renamed successfully");
  } catch {
    toast.error("Failed to rename chat");
  } finally {
    isRenamingSession.value = false;
  }
}

function startRenameFromList(session: any) {
  renameValue.value = session.title || "";
  renamingSessionId.value = session.session_id;
  nextTick(() => listRenameInputs[session.session_id]?.focus());
}

async function confirmRenameFromList(session_id: string) {
  if (!renameValue.value.trim()) {
    renamingSessionId.value = null;
    return;
  }
  try {
    await agentStore.renameSession(
      workspaceId.value,
      session_id,
      renameValue.value.trim(),
    );
    const idx = sessionsList.value.findIndex(
      (s) => s.session_id === session_id,
    );
    if (idx !== -1)
      sessionsList.value[idx] = {
        ...sessionsList.value[idx],
        title: renameValue.value.trim(),
      };
    if (activeSessionId.value === session_id) {
      activeSessionTitle.value = renameValue.value.trim();
    }
    toast.success("Chat renamed successfully");
  } catch {
    toast.error("Failed to rename chat");
  } finally {
    renamingSessionId.value = null;
  }
}

const showDeleteModal = ref(false);
const sessionToDelete = ref<string | null>(null);

function confirmDeleteSession(session_id: string) {
  sessionToDelete.value = session_id;
  showDeleteModal.value = true;
}

async function handleDeleteConfirmed() {
  if (!sessionToDelete.value) return;
  try {
    await agentStore.deleteSession(workspaceId.value, sessionToDelete.value);
    sessionsList.value = sessionsList.value.filter(
      (s) => s.session_id !== sessionToDelete.value,
    );
    if (historyViewSession.value?.session_id === sessionToDelete.value) {
      historyViewSession.value = null;
    }
    if (activeSessionId.value === sessionToDelete.value) {
      clearActiveSession();
      localStorage.removeItem("activeSessionId");
      localStorage.removeItem("activeSessionTitle");
    }
    toast.success("Chat deleted successfully");
  } catch {
    toast.error("Failed to delete chat");
  } finally {
    showDeleteModal.value = false;
    sessionToDelete.value = null;
  }
}

function handleDeleteCancel() {
  showDeleteModal.value = false;
  sessionToDelete.value = null;
}

watch(showHistoryPanel, (isOpen) => {
  if (isOpen) {
    historyViewSession.value = null;
    fetchSessions(1);
  } else {
    historyViewSession.value = null;
    isRenamingSession.value = false;
    renamingSessionId.value = null;
  }
});

function toggleMenu(sessionId: string) {
  openMenuSessionId.value =
    openMenuSessionId.value === sessionId ? null : sessionId;
}

function closeMenu() {
  openMenuSessionId.value = null;
}

onMounted(() => {
  window.addEventListener("click", closeMenu);
  document.addEventListener("click", handleMsgMenuClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", closeMenu);
  document.removeEventListener("click", handleMsgMenuClickOutside);
});
const togglingPinId = ref<string | null>(null);

async function togglePinMessage(msg: any) {
  if (!activeSessionId.value || !msg._id || togglingPinId.value === msg._id)
    return;
  const newPinState = !msg.is_pinned;
  togglingPinId.value = msg._id;
  try {
    await agentStore.pinMessage(
      workspaceId.value,
      activeSessionId.value,
      msg._id,
      newPinState,
    );
    toast.success(newPinState ? "Message pinned" : "Message unpinned");
  } catch {
    toast.error("Failed to update pin");
  } finally {
    togglingPinId.value = null;
  }
}
const openMsgMenuId = ref<string | null>(null);
function toggleMsgMenu(msgId: string) {
  openMsgMenuId.value = openMsgMenuId.value === msgId ? null : msgId;
}

function handleMsgMenuClickOutside() {
  if (openMsgMenuId.value) openMsgMenuId.value = null;
}

// Like/Dislike tracking
const likedMessages = ref<Set<string>>(new Set());
const dislikedMessages = ref<Set<string>>(new Set());

function toggleLike(msgId: string) {
  if (likedMessages.value.has(msgId)) {
    likedMessages.value.delete(msgId);
    toast.success("Like removed");
  } else {
    likedMessages.value.add(msgId);
    dislikedMessages.value.delete(msgId); // Remove dislike if exists
    toast.success("Message liked!");
  }
}

function toggleDislike(msgId: string) {
  if (dislikedMessages.value.has(msgId)) {
    dislikedMessages.value.delete(msgId);
    toast.success("Dislike removed");
  } else {
    dislikedMessages.value.add(msgId);
    likedMessages.value.delete(msgId); // Remove like if exists
    toast.success("Message disliked");
  }
}

async function copyMessageToClipboard(content: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } else {
      toast.error("Copy not supported");
    }
  } catch (err) {
    console.error("Failed to copy:", err);
    toast.error("Failed to copy message");
  }
}

type Action = {
  _id: string;
  title: string;
  slug: string;
  prompt?: string;
  is_selected: boolean;
};

type Module = {
  module_id: string | null;
  module_title: string;
  module_type: string;
  granted_actions: Action[];
};
const openModules = ref<Record<string, boolean>>({});
const toggleModule = (title: string) => {
  openModules.value[title] = !openModules.value[title];
};
const filteredModules = computed(() => {
  if (!searchQuery.value) return moduleActions.value;

  const query = searchQuery.value.toLowerCase();

  return moduleActions.value
    .map((module) => {
      const filteredActions = module.granted_actions.filter(
        (action) =>
          action.title.toLowerCase().includes(query) ||
          (action.prompt && action.prompt.toLowerCase().includes(query)),
      );

      return {
        ...module,
        granted_actions: filteredActions,
      };
    })
    .filter((module) => module.granted_actions.length > 0);
});

interface ModuleAction {
  module_id: string | null;
  module_title: string;
  module_type: string;
  granted_actions: string[];
}

const moduleActions = ref<Module[]>([]);
const searchQuery = ref("");

const allSelected = computed(() => {
  return (
    moduleActions.value.length > 0 &&
    moduleActions.value.every((module) =>
      module.granted_actions.every((action) => action.is_selected),
    )
  );
});

watch(
  () => agentsData.value?.module_actions,
  (val) => {
    moduleActions.value = val ? structuredClone(toRaw(val)) : [];
  },
  { immediate: true },
);
const toggleSelectAll = () => {
  const value = !allSelected.value;

  moduleActions.value.forEach((module) => {
    module.granted_actions.forEach((action) => {
      action.is_selected = value;
    });
  });
};

const isSavingPrompt = ref(false);
const savePromptActions = async () => {
  if (!workspaceId.value) return;

  isSavingPrompt.value = true;

  try {
    const modulesToSave: ModuleAction[] = moduleActions.value.map((module) => ({
      module_id: module.module_id,
      module_title: module.module_title,
      module_type: module.module_type,
      granted_actions: module.granted_actions
        .filter((action) => action.is_selected)
        .map((action) => action.slug),
    }));

    agentConfig.module_actions = modulesToSave;

    agentConfig.actions = moduleActions.value
      .flatMap((module) => module.granted_actions)
      .filter((action) => action.is_selected)
      .map((action) => action.slug);

    await updateAgent(agentConfig.id);

    if (searchQuery.value) searchQuery.value = "";
  } catch (err) {
    console.error(err);
    toast.error("Failed to save prompt actions");
  } finally {
    isSavingPrompt.value = false;
  }
};

// ── Suggested Prompts Tab ─────────────────────────────────────────────────────
interface SuggestedPrompt {
  label: string;
  text: string;
  category: string;
  is_active: boolean;
}

const suggestedPrompts = ref<SuggestedPrompt[]>([]);
const isSavingSuggested = ref(false);

const activeSuggestedPrompts = computed(() => {
  return suggestedPrompts.value.filter((p) => p.is_active && p.label && p.text);
});

function addSuggestedPrompt() {
  suggestedPrompts.value.push({
    label: "",
    text: "",
    category: "",
    is_active: true,
  });
}

function removeSuggestedPrompt(index: number) {
  suggestedPrompts.value.splice(index, 1);
}

const saveSuggestedPrompts = async () => {
  if (!workspaceId.value || !agentConfig.id) {
    toast.error("No agent selected");
    return;
  }

  isSavingSuggested.value = true;

  try {
    const payload = {
      suggested_prompts: suggestedPrompts.value.filter(
        (p) => p.label && p.text,
      ),
    };

    await agentStore.updateSelectedAgent(
      workspaceId.value,
      payload,
      agentConfig.id,
    );
    toast.success("Suggested prompts saved!");
    await loadAgentSettings();
  } catch (err) {
    console.error(err);
    toast.error("Failed to save suggested prompts");
  } finally {
    isSavingSuggested.value = false;
  }
};
// empty state
// ── Source selector ───────────────────────────────────────────────────────────
const showSourceDropdown = ref(false);
const sourceDropdownRef = ref<HTMLElement | null>(null);
const selectedSource = ref<string>("all");

const availableSources = computed(() => [
  {
    id: "all",
    label: "All sources",
    icon: "fa-solid fa-layer-group",
    iconBg: "bg-primary-color/10",
    iconColor: "text-primary-color",
    description: "Search across everything",
  },
  {
    id: "workspace",
    label: moduleSelected.value || "Workspace",
    sublabel: contextTitle.value,
    icon: "fa-solid fa-building",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    description: "Current workspace data",
    badge: "Current",
  },
  {
    id: "sheets",
    label: "Sheets",
    icon: "fa-solid fa-table",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    description: "Rows, columns, sheet data",
  },
  {
    id: "tickets",
    label: "Tasks & Tickets",
    icon: "fa-solid fa-ticket",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    description: "All tasks, issues, requests",
  },
  {
    id: "docs",
    label: "Docs",
    icon: "fa-solid fa-file-lines",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    description: "Documents and notes",
  },
  {
    id: "web",
    label: "Web search",
    icon: "fa-solid fa-globe",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    description: "Search the internet live",
  },
  {
    id: "training",
    label: "Training data",
    icon: "fa-solid fa-graduation-cap",
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    description: "Uploaded knowledge & prompts",
  },
]);

const activeSource = computed(
  () =>
    availableSources.value.find((s) => s.id === selectedSource.value) ??
    availableSources.value[0],
);

function selectSource(id: string) {
  selectedSource.value = id;
  showSourceDropdown.value = false;
  // Enable web search toggle automatically if web source picked
  if (id === "web") webSearch.value = true;
  else if (webSearch.value && id !== "all") webSearch.value = false;
}

onClickOutside(sourceDropdownRef, () => {
  showSourceDropdown.value = false;
});

// ── Module context detection ──────────────────────────────────────────────────
const moduleContext = computed(() => {
  const path = route.path.toLowerCase();
  const name = (route.name as string)?.toLowerCase() || "";

  if (path.includes("peak") || name.includes("peak")) return "peak";
  if (path.includes("talent") || name.includes("people")) return "talent";
  if (path.includes("plan") || name.includes("plan")) return "plan";
  if (path.includes("process") || name.includes("process")) return "process";
  if (path.includes("more") || name.includes("more")) return "more";
  return "workspace";
});

const emptyStateQuickPrompts = computed(() => {
  const mod = moduleSelected.value || contextTitle.value;
  const src = selectedSource.value;
  const ctx = moduleContext.value;

  // Per-module prompt maps
  const modulePrompts: Record<string, Record<string, string[]>> = {
    peak: {
      all: [
        `Give me a summary of all widgets in Peak`,
        `Which KPIs are underperforming?`,
        `What metrics need attention right now?`,
        `Show me trends across all Peak dashboards`,
      ],
      workspace: [
        `Summarize the Peak dashboard for ${mod}`,
        `Which widgets have the most activity?`,
        `Show me the top performing metrics`,
        `What data sources are connected to Peak?`,
      ],
      sheets: [
        `Which sheets are powering my Peak widgets?`,
        `Show me sheet data behind my KPI widgets`,
        `Find anomalies in the data feeding Peak`,
        `What are the top rows driving my dashboard?`,
      ],
      tickets: [
        `Which tasks are linked to Peak metrics?`,
        `Show overdue items affecting my KPIs`,
        `What open tickets are blocking peak performance?`,
        `Find tasks assigned to me related to metrics`,
      ],
      docs: [
        `Find docs related to my Peak setup`,
        `Summarize documentation for my dashboards`,
        `What decisions shaped the current Peak config?`,
        `Show notes about my KPI targets`,
      ],
      web: [
        `Search for best practices in dashboard design`,
        `Find benchmarks for my key metrics`,
        `Look up industry KPI standards`,
        `Search for data visualization best practices`,
      ],
      training: [
        `What does this agent know about my Peak setup?`,
        `Summarize the training data for Peak`,
        `What prompts are configured for Peak agent?`,
        `Show me what this agent knows about my KPIs`,
      ],
    },

    talent: {
      all: [
        `Summarize the current headcount in ${mod}`,
        `Which employees are due for a review?`,
        `Show me open positions and hiring status`,
        `What are the top performers this quarter?`,
      ],
      workspace: [
        `What's the latest update in talent management?`,
        `Show me all active employees in ${mod}`,
        `Who joined the team recently?`,
        `Give me a headcount report for ${mod}`,
      ],
      sheets: [
        `Summarize employee data from my sheets`,
        `Find any missing or incomplete employee records`,
        `What are the top entries by performance score?`,
        `Show me employees who haven't been updated recently`,
      ],
      tickets: [
        `What HR tasks are overdue?`,
        `Which onboarding tickets are open?`,
        `Show me highest priority HR requests`,
        `Find tickets with no assignee in talent`,
      ],
      docs: [
        `Summarize recent HR policies and documents`,
        `Find docs related to employee onboarding`,
        `Which HR documents haven't been updated?`,
        `What decisions are documented for talent?`,
      ],
      web: [
        `Search for best HR practices in ${mod}`,
        `Find latest trends in talent management`,
        `Look up industry salary benchmarks`,
        `Search for employee retention strategies`,
      ],
      training: [
        `What does this agent know about our talent data?`,
        `Summarize the HR agent's knowledge base`,
        `What prompts are configured for the talent agent?`,
        `Show me what this agent knows about employees`,
      ],
    },

    plan: {
      all: [
        `What sprints are currently active in ${mod}?`,
        `Which planned items are behind schedule?`,
        `Show me the roadmap for this quarter`,
        `What milestones are coming up soon?`,
      ],
      workspace: [
        `What's the current sprint status in ${mod}?`,
        `Show me all planned vs completed items`,
        `Who is responsible for upcoming milestones?`,
        `Give me a sprint progress report`,
      ],
      sheets: [
        `Summarize planning data from my sheets`,
        `Find items that are behind schedule`,
        `What are the top priorities by effort?`,
        `Show me items without deadlines`,
      ],
      tickets: [
        `What planned tickets are overdue?`,
        `Which sprint items are assigned to me?`,
        `Show me the highest priority backlog items`,
        `Find tickets not assigned to any sprint`,
      ],
      docs: [
        `Summarize the project planning documents`,
        `Find docs related to roadmap decisions`,
        `Which planning docs need updating?`,
        `What decisions shaped the current roadmap?`,
      ],
      web: [
        `Search for agile planning best practices`,
        `Find sprint estimation techniques`,
        `Look up roadmap planning frameworks`,
        `Search for OKR goal-setting methods`,
      ],
      training: [
        `What does this agent know about our planning?`,
        `Summarize the planning agent's knowledge base`,
        `What prompts are set up for the plan agent?`,
        `Show me what this agent knows about sprints`,
      ],
    },

    process: {
      all: [
        `What processes are currently active in ${mod}?`,
        `Which workflows have bottlenecks?`,
        `Show me process completion rates`,
        `What steps are taking the longest?`,
      ],
      workspace: [
        `What's the status of active processes in ${mod}?`,
        `Show me all running workflows`,
        `Which processes are blocked or stalled?`,
        `Give me a process efficiency report`,
      ],
      sheets: [
        `Summarize process data from my sheets`,
        `Find bottlenecks in my workflow data`,
        `What are the slowest process steps?`,
        `Show me processes with missing data`,
      ],
      tickets: [
        `What process tasks are overdue?`,
        `Which workflow tickets are assigned to me?`,
        `Show me blocked process tickets`,
        `Find tickets causing workflow delays`,
      ],
      docs: [
        `Summarize the process documentation`,
        `Find docs related to workflow design`,
        `Which process docs need updating?`,
        `What SOPs are documented for ${mod}?`,
      ],
      web: [
        `Search for workflow optimization strategies`,
        `Find process automation best practices`,
        `Look up business process improvement methods`,
        `Search for SOP writing templates`,
      ],
      training: [
        `What does this agent know about our processes?`,
        `Summarize the process agent's knowledge base`,
        `What prompts are configured for process agent?`,
        `Show me what this agent knows about workflows`,
      ],
    },

    workspace: {
      all: [
        `Summarize the current status of ${mod}`,
        `What tasks are overdue in ${mod}?`,
        `What is assigned to me?`,
        `Which items have the highest priority?`,
      ],
      workspace: [
        `What's the latest update in ${mod}?`,
        `Show me all open items in ${mod}`,
        `Who is working on what in ${mod}?`,
        `Give me a progress report for ${mod}`,
      ],
      sheets: [
        `Summarize the data in my sheets`,
        `Find any anomalies or outliers in my sheet data`,
        `What are the top entries by value?`,
        `Show me rows that haven't been updated recently`,
      ],
      tickets: [
        `What tasks are overdue?`,
        `Which tickets are assigned to me?`,
        `Show me the highest priority open tickets`,
        `Find tasks with no assignee`,
      ],
      docs: [
        `Summarize my recent documents`,
        `Find docs related to ${mod}`,
        `Which docs haven't been updated in a while?`,
        `What decisions are documented?`,
      ],
      web: [
        `What are the latest trends in project management?`,
        `Search for best practices in ${mod}`,
        `Find recent news about my industry`,
        `Look up tools similar to what we use`,
      ],
      training: [
        `What have I trained this agent on?`,
        `Summarize the agent's knowledge base`,
        `What prompts are configured for this agent?`,
        `Show me what this agent knows about ${mod}`,
      ],
    },
  };

  const promptsForModule = modulePrompts[ctx] ?? modulePrompts["workspace"];
  return (promptsForModule[src] ?? promptsForModule["all"]).slice(0, 4);
});

const emptyStateFeatureCards = computed(() => {
  const ctx = moduleContext.value;
  const src = selectedSource.value;
  const mod = moduleSelected.value || contextTitle.value;

  const cardsByModule: Record<string, any[]> = {
    peak: [
      {
        title: "Dashboard summary",
        description: "Get an AI overview of all your Peak widgets and KPIs.",
        prompt: `Summarize all widgets and KPIs in my Peak dashboard`,
        icon: "fa-solid fa-gauge-high",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        isNew: true,
        sources: ["all", "workspace"],
      },
      {
        title: "Underperforming metrics",
        description: "Spot KPIs that are falling below targets.",
        prompt: `Which metrics or KPIs are underperforming in Peak?`,
        icon: "fa-solid fa-arrow-trend-down",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        isNew: true,
        sources: ["all", "sheets", "workspace"],
      },
      {
        title: "Data anomalies",
        description: "Detect unusual patterns in your dashboard data.",
        prompt: `Find any anomalies or unexpected trends in my Peak data`,
        icon: "fa-solid fa-triangle-exclamation",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        isNew: false,
        sources: ["all", "sheets"],
      },
      {
        title: "Metric benchmarking",
        description: "Compare your KPIs against industry standards.",
        prompt: `Search for industry benchmarks to compare with my current KPIs`,
        icon: "fa-solid fa-ranking-star",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        isNew: true,
        sources: ["all", "web"],
      },
      {
        title: "Widget data deep dive",
        description: "Analyze the sheet data powering your widgets.",
        prompt: `Analyze the sheet data behind my Peak widgets in detail`,
        icon: "fa-solid fa-chart-bar",
        iconBg: "bg-teal-50",
        iconColor: "text-teal-500",
        isNew: false,
        sources: ["all", "sheets"],
      },
      {
        title: "Agent knowledge summary",
        description: "See what this agent knows about your dashboards.",
        prompt: `What does this agent know about my Peak dashboard setup?`,
        icon: "fa-solid fa-brain",
        iconBg: "bg-pink-50",
        iconColor: "text-pink-500",
        isNew: false,
        sources: ["all", "training"],
      },
    ],

    talent: [
      {
        title: "Headcount report",
        description: "Get a full overview of your team composition.",
        prompt: `Give me a complete headcount report for ${mod}`,
        icon: "fa-solid fa-users",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        isNew: true,
        sources: ["all", "workspace"],
      },
      {
        title: "Pending reviews",
        description: "Find employees due for performance reviews.",
        prompt: `Which employees are due or overdue for a performance review?`,
        icon: "fa-solid fa-star-half-stroke",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        isNew: true,
        sources: ["all", "workspace", "tickets"],
      },
      {
        title: "Open positions",
        description: "Summarize current hiring pipeline and open roles.",
        prompt: `Show me all open positions and the current hiring status`,
        icon: "fa-solid fa-briefcase",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        isNew: false,
        sources: ["all", "tickets"],
      },
      {
        title: "Onboarding status",
        description: "Check the progress of new hire onboarding.",
        prompt: `What is the onboarding status for recent new hires?`,
        icon: "fa-solid fa-person-walking-arrow-right",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        isNew: true,
        sources: ["all", "tickets", "workspace"],
      },
      {
        title: "Salary benchmarking",
        description: "Compare compensation against industry rates.",
        prompt: `Search for current salary benchmarks for roles in ${mod}`,
        icon: "fa-solid fa-sack-dollar",
        iconBg: "bg-sky-50",
        iconColor: "text-sky-500",
        isNew: false,
        sources: ["all", "web"],
      },
      {
        title: "HR policy summary",
        description: "Get a digest of your latest HR documents.",
        prompt: `Summarize the key HR policies and recent document updates`,
        icon: "fa-solid fa-file-shield",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
        isNew: false,
        sources: ["all", "docs"],
      },
    ],

    plan: [
      {
        title: "Sprint status",
        description: "Get the current status of all active sprints.",
        prompt: `Give me a full status report on all active sprints in ${mod}`,
        icon: "fa-solid fa-rocket",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        isNew: true,
        sources: ["all", "workspace", "tickets"],
      },
      {
        title: "Behind schedule items",
        description: "Find planned items that are running late.",
        prompt: `Which planned items or milestones are behind schedule?`,
        icon: "fa-solid fa-clock",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        isNew: true,
        sources: ["all", "tickets", "workspace"],
      },
      {
        title: "Roadmap overview",
        description: "Summarize upcoming milestones and delivery dates.",
        prompt: `Give me an overview of the roadmap and upcoming milestones for ${mod}`,
        icon: "fa-solid fa-map",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        isNew: false,
        sources: ["all", "workspace"],
      },
      {
        title: "Backlog grooming",
        description: "Identify unassigned or unprioritized backlog items.",
        prompt: `Find backlog tickets that are unassigned or not in any sprint`,
        icon: "fa-solid fa-list-check",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        isNew: false,
        sources: ["all", "tickets"],
      },
      {
        title: "Agile best practices",
        description: "Get tips on improving sprint planning.",
        prompt: `Search for agile sprint planning best practices and estimation techniques`,
        icon: "fa-solid fa-lightbulb",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        isNew: true,
        sources: ["all", "web"],
      },
      {
        title: "Planning docs summary",
        description: "Digest your roadmap and planning documents.",
        prompt: `Summarize all planning and roadmap documents for ${mod}`,
        icon: "fa-solid fa-file-lines",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
        isNew: false,
        sources: ["all", "docs"],
      },
    ],

    process: [
      {
        title: "Workflow bottlenecks",
        description: "Find steps causing delays in your processes.",
        prompt: `Which steps or stages in ${mod} are causing workflow bottlenecks?`,
        icon: "fa-solid fa-filter-circle-xmark",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        isNew: true,
        sources: ["all", "workspace", "tickets"],
      },
      {
        title: "Process completion rates",
        description: "See how efficiently workflows are being completed.",
        prompt: `Give me completion rates and efficiency metrics for processes in ${mod}`,
        icon: "fa-solid fa-chart-pie",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        isNew: true,
        sources: ["all", "workspace", "sheets"],
      },
      {
        title: "Stalled processes",
        description: "Locate workflows that haven't progressed recently.",
        prompt: `Which processes or workflows in ${mod} are stalled or stuck?`,
        icon: "fa-solid fa-pause",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        isNew: false,
        sources: ["all", "tickets", "workspace"],
      },
      {
        title: "SOP summary",
        description: "Get a digest of your standard operating procedures.",
        prompt: `Summarize all SOPs and process documentation for ${mod}`,
        icon: "fa-solid fa-book-open",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
        isNew: false,
        sources: ["all", "docs"],
      },
      {
        title: "Automation opportunities",
        description: "Find process steps that could be automated.",
        prompt: `Search for automation opportunities and best practices for workflows like ${mod}`,
        icon: "fa-solid fa-robot",
        iconBg: "bg-teal-50",
        iconColor: "text-teal-500",
        isNew: true,
        sources: ["all", "web"],
      },
      {
        title: "Process data analysis",
        description: "Surface insights from your workflow sheet data.",
        prompt: `Analyze the sheet data for ${mod} and highlight process inefficiencies`,
        icon: "fa-solid fa-magnifying-glass-chart",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        isNew: false,
        sources: ["all", "sheets"],
      },
    ],

    workspace: [
      {
        title: "Executive summary",
        description: "Generate a concise overview from your workspace data.",
        prompt: `Create an executive summary for ${mod}`,
        icon: "fa-solid fa-chart-line",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        isNew: true,
        sources: ["all", "workspace", "sheets"],
      },
      {
        title: "Project update",
        description: "Time-based status update across active items.",
        prompt: `Give me a project update for ${mod} this week`,
        icon: "fa-solid fa-calendar-check",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
        isNew: true,
        sources: ["all", "workspace", "tickets"],
      },
      {
        title: "Find duplicate tasks",
        description: "Identify and surface overlapping or redundant work.",
        prompt: `Find any duplicate or overlapping tasks in ${mod}`,
        icon: "fa-solid fa-copy",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        isNew: true,
        sources: ["all", "tickets"],
      },
      {
        title: "Find stuck tasks",
        description: "Locate items with no recent progress or updates.",
        prompt: `Which tasks in ${mod} are stuck or stagnant?`,
        icon: "fa-solid fa-triangle-exclamation",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        isNew: false,
        sources: ["all", "tickets", "workspace"],
      },
      {
        title: "Summarize documents",
        description: "Get a quick digest of your recent docs.",
        prompt: `Summarize the key points from my recent documents in ${mod}`,
        icon: "fa-solid fa-file-lines",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
        isNew: false,
        sources: ["all", "docs"],
      },
      {
        title: "Web research",
        description: "Find external context and latest information.",
        prompt: `Search the web for insights relevant to ${mod}`,
        icon: "fa-solid fa-globe",
        iconBg: "bg-sky-50",
        iconColor: "text-sky-500",
        isNew: true,
        sources: ["all", "web"],
      },
      {
        title: "Analyze sheet data",
        description: "Surface patterns and insights from your sheets.",
        prompt: `Analyze the data in my sheets for ${mod} and highlight key trends`,
        icon: "fa-solid fa-chart-bar",
        iconBg: "bg-teal-50",
        iconColor: "text-teal-500",
        isNew: false,
        sources: ["all", "sheets"],
      },
      {
        title: "Agent knowledge summary",
        description: "See what this agent has been trained on.",
        prompt: `Summarize what this agent knows and what it can help me with`,
        icon: "fa-solid fa-brain",
        iconBg: "bg-pink-50",
        iconColor: "text-pink-500",
        isNew: false,
        sources: ["all", "training"],
      },
    ],
  };

  const cards = cardsByModule[ctx] ?? cardsByModule["workspace"];
  return cards.filter((c) => c.sources.includes(src)).slice(0, 4);
});
// Clicks a suggestion, fills input AND immediately sends
async function applyPromptAndSend(text: string) {
  userMessage.value = text;
  await nextTick();
  autoResize();
  await sendMessage();
}
const showPlusMenu = ref(false);
const plusDropdownRef = ref<HTMLElement | null>(null);
const showSavedPromptsMenu = ref(false);
onClickOutside(plusDropdownRef, () => {
  showPlusMenu.value = false;
});
const applySavedPrompt = (text: string) => {
  userMessage.value = text;
  showSavedPromptsMenu.value = false;
  showPlusMenu.value = false;
  showSavedPromptsBar.value = false; // hide bar after selecting
  nextTick(() => {
    autoTextarea.value?.focus();
    autoResize();
  });
};
onMounted(() => {
  document.addEventListener("mousedown", (e: MouseEvent) => {
    if (
      plusDropdownRef.value &&
      !plusDropdownRef.value.contains(e.target as Node)
    ) {
      showPlusMenu.value = false;
      showSavedPromptsMenu.value = false;
    }
  });
});
// Add these refs near showPlusMenu
const showNewPromptModal = ref(false);
const newPromptForm = ref({
  title: "",
  text: "",
  shareWith: "only_me" as "only_me" | "everyone" | "admins" | "select_people",
});

const openNewPromptModal = () => {
  newPromptForm.value = { title: "", text: "", shareWith: "only_me" };
  showNewPromptModal.value = true;
  showSavedPromptsMenu.value = false;
  showPlusMenu.value = false;
};

const closeNewPromptModal = () => {
  showNewPromptModal.value = false;
};

const createNewPrompt = () => {
  if (!newPromptForm.value.title.trim() || !newPromptForm.value.text.trim())
    return;
  // Add to pinnedPrompts locally or call API
  // For now push to suggestedPrompts as dummy
  suggestedPrompts.value.push({
    label: newPromptForm.value.title,
    text: newPromptForm.value.text,
    category: newPromptForm.value.shareWith,
    is_active: true,
  });
  closeNewPromptModal();
};

// Show saved prompts bar above textarea
const showSavedPromptsBar = ref(false);
//toggle web search
const toggleWebSearch = async () => {
  if (!workspaceId.value || !selectedAgentId.value) return;
  const newValue = !webSearch.value;
  try {
    await agentStore.updateAgentWebBrowsing(
      workspaceId.value,
      selectedAgentId.value,
      { web_browsing_enabled: newValue },
    );
    await loadAgentSettings();
  } catch (err) {
    console.error("Toggle web search failed:", err);
  }
};
watch(
  () => agentStore.currentStreamText,
  (newText) => {
    if (!newText) return;
    isAiThinkingBubbleVisible.value = false;
    streamingContent.value = newText;
    animateStreamingContent(newText);
    scrollToBottom();
  },
);
watch(
  () => [agentStore.streamThinkMs, agentStore.streamTotalMs] as const,
  ([thinkMs, totalMs]) => {
    if (thinkMs !== null) streamingThinkMs.value = thinkMs;
    if (totalMs !== null) streamingTotalMs.value = totalMs;
  },
);
watch(
  () => agentStore.currentPhase,
  (phase) => {
    if (!phase) return;

    if (phase === "thinking") {
      // Reset everything, show only thinking bubble
      streamingContent.value = "";
      displayedContent.value = "";
      streamingThinkMs.value = null;
      streamingTotalMs.value = null;
      streamingPhase.value = "thinking";
      isAiThinkingBubbleVisible.value = true;
      streamingPhaseLabel.value = "Thinking";
      startElapsedTimer();
    }

    if (phase === "generating") {
      // Hide thinking bubble, streaming bubble will show once first chunk arrives
      isAiThinkingBubbleVisible.value = false;
      streamingPhase.value = "generating";
      streamingPhaseLabel.value = "Writing";
      startElapsedTimer();
    }

    if (phase === "completed") {
      isAiThinkingBubbleVisible.value = false;
      agentStore.isAiTyping = false;
      streamingPhase.value = "completed";
      streamingPhaseLabel.value = "Done";
      stopElapsedTimer();
      scrollToBottom();
    }
  },
);
watch(
  () => orderedMessages.value,
  (msgs) => {
    if (
      streamingPhase.value === "completed" &&
      msgs.some(
        (m) => m.type === "assistant" && !(m.metadata as MessageMetadata)?.temp,
      )
    ) {
      // Message confirmed in history — now safe to hide streaming bubble
      streamingPhase.value = "";
      streamingContent.value = "";
      displayedContent.value = "";
    }
  },
  { deep: false },
);

// Watch for phase detail and timestamp changes from store
watch(
  () =>
    [agentStore.currentPhaseDetail, agentStore.currentPhaseTimestamp] as const,
  ([detail, timestamp]) => {
    if (detail) streamingPhaseDetail.value = detail;
    if (timestamp !== null) streamingPhaseTimestamp.value = timestamp;
  },
);

// Watch for phase history updates from store
watch(
  () => agentStore.streamPhases,
  (phases) => {
    phaseHistory.value = phases;
  },
  { deep: true },
);
const elapsedLabel = computed(() => {
  const s = (streamingElapsedMs.value / 1000).toFixed(1);
  return `${s}s`;
});
function startElapsedTimer() {
  stopElapsedTimer();
  streamingElapsedMs.value = 0;
  elapsedTimerHandle = setInterval(() => {
    streamingElapsedMs.value += 100;
  }, 100);
}

function stopElapsedTimer() {
  if (elapsedTimerHandle) {
    clearInterval(elapsedTimerHandle);
    elapsedTimerHandle = null;
  }
}
watch(
  () => [agentStore.streamThinkMs, agentStore.streamTotalMs],
  ([thinkMs, totalMs]) => {
    if (thinkMs !== null) streamingThinkMs.value = thinkMs;
    if (totalMs !== null) streamingTotalMs.value = totalMs;
  },
);
// Replace animateStreamingContent entirely:
let animFrameId: number | null = null;
let animTargetText = "";

function animateStreamingContent(targetText: string) {
  animTargetText = targetText; // always update target, never restart loop

  // Only start the loop if it's not already running
  if (animFrameId !== null) return;

  const CHARS_PER_FRAME = 4;

  function step() {
    if (displayedContent.value.length >= animTargetText.length) {
      displayedContent.value = animTargetText;
      animFrameId = null;
      return;
    }

    const nextIndex = Math.min(
      displayedContent.value.length + CHARS_PER_FRAME,
      animTargetText.length,
    );
    displayedContent.value = animTargetText.slice(0, nextIndex);
    scrollToBottom();
    animFrameId = requestAnimationFrame(step);
  }

  animFrameId = requestAnimationFrame(step);
}
</script>

<style scoped>
.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}
.typing-dots span {
  width: 6px;
  height: 6px;
  background-color: var(--primary-color, #7c3aed);
  border-radius: 50%;
  opacity: 0.4;
  animation: typing-bounce 1.4s infinite ease-in-out;
}
.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}
.chat-loader {
  width: 28px;
  height: 28px;
  padding: 5px;
  border-radius: 9999px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary-color, #7c3aed);
  animation: chat-spin 0.8s linear infinite;
}
.slide-left-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.neon-flow-border-chatbot {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.neon-flow-border-chatbot::after {
  /* Crisp neon arc passing over the cut-out */
  content: "";
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: 20px;
  background: conic-gradient(
    from 45deg,
    transparent 0deg,
    transparent calc(var(--sweep) - 24deg),
    hsl(var(--glow-brand)) calc(var(--sweep) - 24deg),
    hsl(var(--glow-2)) calc(var(--sweep) - 12deg),
    hsl(var(--glow-3)) var(--sweep),
    hsl(var(--glow-2)) calc(var(--sweep) + 12deg),
    hsl(var(--glow-brand)) calc(var(--sweep) + 24deg),
    transparent calc(var(--sweep) + 24deg) 360deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  /* mix-blend-mode: screen; */
  animation: sweep var(--neon-speed, 4s) linear infinite;
  pointer-events: none;
  z-index: 2;
}
@keyframes chat-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.25s ease-out;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Slide-fade transition for history panel */
.slide-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
