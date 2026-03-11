<template>
  <div
    v-if="workspaceStore.showChatBotPanel"
    :class="[
      'flex h-full overflow-y-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] border border-border overflow-x-hidden transition-all duration-300 ease-in-out',
      isExpanded
        ? 'min-w-full max-w-full'
        : 'min-w-full max-w-[380px] sm:min-w-[380px]',
    ]"
    role="complementary"
    aria-label="Details panel"
  >
    <div
      v-if="isExpanded && !showConfigPanel && entities?.length"
      class="w-1/2 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
    >
      <ChatBotPreviewModal
        @accept="acceptChanges"
        @decline="declineAgentGeneratedEntities"
        :title="contextTitle"
        :data="entities"
      />
    </div>
    <!-- CONFIG PANEL -->
    <div
      v-if="isExpanded && showConfigPanel"
      class="w-1/2 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
    >
      <!-- HEADER -->
      <div class="px-6 py-2.5 bg-bg-card border-b border-border">
        <h3 class="text-lg text-text-primary font-semibold">
          Agent Setup & Controls
        </h3>
        <p class="text-text-secondary text-[13px]">
          Configure agent modules, data sources, capabilities, and execution
          rules within your workspace.
        </p>
        <!-- TABS -->
        <div class="px-6 flex justify-center gap-6 text-sm pb-2">
          <button
            @click="activeTab = 'persona'"
            :class="
              activeTab === 'persona'
                ? 'pt-3 border-b-2 border-accent text-accent font-bold'
                : 'pt-3 text-text-primary font-bold'
            "
          >
            Configure Agent
          </button>

          <button
            @click="activeTab = 'knowledge'"
            :class="
              activeTab === 'knowledge'
                ? 'pt-3 border-b-2 border-accent text-accent font-bold'
                : 'pt-3 text-text-primary font-bold'
            "
          >
            Knowledge Sources
          </button>

          <button
            @click="activeTab = 'upload'"
            :class="
              activeTab === 'upload'
                ? 'pt-3 border-b-2 border-accent text-accent font-bold'
                : 'pt-3 text-text-primary font-bold'
            "
          >
            Training Content
          </button>
        </div>
      </div>
      <!-- BODY -->
      <div class="flex-1 overflow-y-auto flex flex-col">
        <div class="p-6 space-y-8">
          <!-- ================= PERSONA TAB ================= -->
          <div v-if="activeTab === 'persona'" class="space-y-6">
            <!-- Skeleton Loader -->
            <div v-if="isLoadingSettings" class="space-y-4">
              <!-- Agent Name -->
              <div class="animate-pulse space-y-2">
                <div class="h-5 w-1/3 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>

              <!-- Description -->
              <div class="animate-pulse space-y-2">
                <div class="h-5 w-1/4 bg-card rounded"></div>
                <div class="h-24 w-full bg-card rounded"></div>
              </div>

              <!-- Role -->
              <div class="animate-pulse space-y-2">
                <div class="h-5 w-1/5 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>

              <!-- Level Dropdown -->
              <div class="animate-pulse space-y-2 relative">
                <div class="h-5 w-1/6 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>

              <!-- Array Sections -->
              <div v-for="n in 3" :key="'array-skel-' + n" class="space-y-2">
                <div class="h-5 w-1/6 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>

              <!-- Capabilities -->
              <div class="space-y-2">
                <div
                  v-for="n in 3"
                  :key="'cap-skel-' + n"
                  class="h-4 w-2/5 bg-card rounded"
                ></div>
              </div>

              <!-- Buttons -->
              <div class="h-10 w-full bg-card rounded mt-4"></div>
            </div>

            <!-- Full Form -->
            <div v-else class="space-y-6">
              <!-- Agent Name -->
              <div class="space-y-1">
                <label class="text-sm text-text-primary">Agent Name</label>
                <input
                  v-model="agentConfig.name"
                  class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                />
              </div>

              <!-- Description -->
              <div class="space-y-1">
                <label class="text-sm text-text-primary">Description</label>
                <textarea
                  v-model="agentConfig.description"
                  rows="4"
                  class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                />
              </div>

              <!-- Role -->
              <div class="space-y-1">
                <label class="text-sm text-text-primary">Role</label>
                <input
                  v-model="agentConfig.role"
                  class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                />
              </div>

              <!-- Level Dropdown -->
              <div class="space-y-1 relative" ref="levelRef">
                <label class="text-sm text-text-primary">Level</label>
                <button
                  type="button"
                  @click="openLevel = !openLevel"
                  class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                >
                  <span>{{ selectedLevelLabel }}</span>
                  <svg
                    class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  v-if="openLevel"
                  class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg"
                >
                  <ul class="py-1 text-sm">
                    <li
                      v-for="level in availableAgentsLevels"
                      :key="level.value"
                      @click="selectLevel(level.value)"
                      class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover"
                    >
                      {{ level.title }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Array Sections Reused -->
              <!-- Replace old code with: -->
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
              <div class="flex gap-2" v-if="transformedData?.length">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-border"
                  v-model="isSheet"
                />
                <span class="text-sm text-text-primary"
                  >Enable to create the agent for a selected sheet instead of
                  all sheets</span
                >
              </div>
              <div
                class="space-y-1 relative w-full"
                ref="sheetRef"
                v-if="isSheet"
              >
                <!-- Trigger -->
                <button
                  type="button"
                  @click="openSheet = !openSheet"
                  class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
                >
                  <span>{{ selectedSheetTitle }}</span>

                  <svg
                    class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <!-- Dropdown -->
                <div
                  v-if="openSheet"
                  class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg"
                >
                  <ul class="py-1 text-sm max-h-60 overflow-auto">
                    <li
                      v-for="sheet in transformedData"
                      :key="sheet._id"
                      @click="selectSheet(sheet._id)"
                      class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover"
                    >
                      <div class="font-medium">
                        {{ sheet.title }}
                      </div>

                      <div
                        v-if="sheet.description"
                        class="text-xs text-text-secondary"
                      >
                        {{ sheet.description }}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Capabilities -->
              <div class="space-y-3">
                <label class="text-sm text-text-primary">Capabilities</label>
                <div
                  v-for="capability in availableCapabilities"
                  :key="capability.value"
                  class="flex items-center gap-3 mt-2"
                >
                  <input
                    type="checkbox"
                    :value="capability.value"
                    v-model="agentConfig.capabilities"
                    class="h-4 w-4 rounded border-border"
                  />
                  <span class="text-sm text-text-primary">{{
                    capability.label
                  }}</span>
                </div>
              </div>
               <div class="flex items-center justify-between mb-1">
             <span class="text-base font-medium text-text-primary block">Select Role</span>
          </div>
          <BaseSelectField
            size="sm"
            v-model="selectedRole"
            :options="roleOptions"
            placeholder="Select Role"
          />
          <div class="flex items-center justify-between mb-1 mt-2">
             <span class="text-base font-medium text-text-primary block">Select Job Role</span>
          </div>
           <BaseSelectField
            size="sm"
            v-model="selectJobRole"
            :options="jobOptions"
            placeholder="Select Job Role"
          />
              <!-- Buttons -->
              <button
                @click="submitPersona"
                v-if="!agentsData || !agentConfig?.id"
                :disabled="isLoading || !agentConfig.name || !agentConfig.role"
                class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isLoading">Saving...</span>
                <span v-else>Save Agent</span>
              </button>

              <div class="flex gap-4">
                <button
                  @click="deleteAgent(agentConfig.id)"
                  v-if="agentsData && agentConfig?.id"
                  :disabled="
                    agentStore.isDeletingAgent || !agentConfig.name || !agentConfig.role
                  "
                  class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-red-600 text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isLoading">Deleting...</span>
                  <span v-else>Delete Agent</span>
                </button>
                <button
                  @click="updateAgent(agentConfig.id)"
                  v-if="agentsData && agentConfig?.id"
                  :disabled="
                    agentStore.isUpdatingAgent || !agentConfig.name || !agentConfig.role
                  "
                  class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isLoading">Updating...</span>
                  <span v-else>Update Agent</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ================= KNOWLEDGE TAB ================= -->
          <div v-if="activeTab === 'knowledge'" class="space-y-6">
            <!-- Sources -->
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Sources</label>

              <div class="flex flex-col mt-2 gap-2">
                <div
                  v-for="source in sourceList"
                  :key="source.value"
                  class="relative"
                  ref="refsMap[source.value]"
                >
                  <!-- Dropdown Trigger -->
                  <button
                    type="button"
                    @click="toggleSourceDropdown(source.value)"
                    class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
                  >
                    <span>
                      {{ source.label }}
                    </span>
                    <i
                      class="fa-regular fa-chevron-down text-text-secondary transition-transform duration-200"
                      :class="{ 'rotate-180': openDropdowns[source.value] }"
                    ></i>
                  </button>

                  <!-- Dropdown Menu -->
                  <div
                    v-if="openDropdowns[source.value]"
                    class="absolute z-[999] mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg"
                  >
                    <ul class="py-1 text-sm flex flex-col gap-1">
                      <label for="permissions" class="px-3 pt-2 font-semibold"
                        >Permissions</label
                      >
                      <li
                        v-for="perm in permissionsMap[source.value]"
                        :key="perm.value"
                        class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          v-model="
                            knowledgePermissions[
                              source.value as keyof typeof knowledgePermissions
                            ][
                              perm.value as keyof (typeof knowledgePermissions)['INTERNAL_TICKET']
                            ]
                          "
                          class="h-4 w-4 rounded border-border"
                        />
                        <span>{{
                          getPermissionLabel(
                            source.value as keyof typeof knowledgePermissions,
                            perm.value,
                          )
                        }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Metadata (JSON)</label>
              <textarea
                v-model="knowledgeMetadataString"
                rows="4"
                class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
              />
            </div>

            <!-- Active Checkbox -->
            <div class="flex items-center gap-3">
              <input type="checkbox" v-model="knowledgeConfig.is_active" />
              <span class="text-sm text-text-primary">Active Source</span>
            </div>

            <!-- Submit Button -->
            <button
              @click="submitKnowledge"
              :disabled="isKnowledgeLoading || !moduleId || !moduleSelected"
              class="w-full mt-4 px-4 py-2.5 text-sm rounded-lg cursor-pointer text-white bg-accent hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span v-if="isKnowledgeLoading">Saving...</span>
              <span v-else>Save Knowledge</span>
            </button>
          </div>

          <!-- ================= TRAINING CONTENT TAB ================= -->
          <div v-if="activeTab === 'upload'" class="space-y-6">
            <!-- Training Name -->
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Training Name</label>
              <input
                v-model="uploadConfig.name"
                disabled
                class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
              />
            </div>

            <!-- Type -->
            <div class="space-y-1 relative" ref="typeRef">
              <label class="text-sm text-text-primary">Type</label>
              <button
                type="button"
                @click="openType = !openType"
                class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
              >
                <span>{{ selectedTypeLabel }}</span>
                <svg
                  class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                v-if="openType"
                class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg"
              >
                <ul class="py-1 text-sm">
                  <li
                    v-for="type in availableUploadTypes"
                    :key="type.value"
                    @click="selectType(type.value)"
                    class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover"
                  >
                    {{ type.label }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Training Text -->
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Training Text</label>
              <textarea
                v-model="uploadConfig.text"
                rows="4"
                class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
              />
            </div>

            <!-- File Upload -->
            <input
              type="file"
              multiple
              @change="handleUploadFiles"
              class="w-full border-2 border-dashed border-border bg-bg-body rounded-lg px-4 py-3 text-sm"
            />

            <!-- Uploaded Files List -->
            <div
              v-for="(file, i) in uploadConfig.files"
              :key="i"
              class="flex justify-between text-sm border border-border rounded-lg px-3 py-2"
            >
              <span>{{ file.name }}</span>
              <button
                @click="uploadConfig.files.splice(i, 1)"
                class="text-red-500"
              >
                Remove
              </button>
            </div>

            <!-- Save / Upload Button -->
            <button
              @click="submitTrainingContent"
              :disabled="
                !uploadConfig.name ||
                (uploadConfig.text === '' && uploadConfig.files.length === 0) ||
                isUploading
              "
              class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isUploading">Uploading...</span>
              <span v-else>Upload Training Content</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- CHAT PANEL WRAPPER -->
    <div
      :class="
        isExpanded && (showConfigPanel || entities?.length)
          ? 'w-1/2 me-3'
          : 'w-full'
      "
      class="border-r border-border bg-bg-card h-full min-h-0 flex flex-col py-2 overflow-x-hidden"
    >
      <!-- Header -->
      <div
        class="flex justify-between items-center border-b border-border px-5 py-2 sticky top-0 bg-bg-card z-30 overflow-x-hidden"
      >
        <h5 class="text-[16px] font-medium flex items-center gap-2">
          <i class="fa-solid fa-sparkles text-accent"></i>
          <Dropdown
          v-model="selectedAgentId"
          :options="agentOptions"
          :custom-title="selectedAgentName"
          :actions="false"
          size="md"
          variant="secondary"
          class="relative w-60"
        >
          <template #more>
            <div
              @click="openConfigPanel"
              class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
            >
              <i class="fa-solid fa-plus"></i> Add new
            </div>
          </template>
        </Dropdown>
        </h5>
        <div class="flex items-center gap-3 shrink-0">
          <!-- Expand Icon -->
          <i
            v-if="!isExpanded"
            class="fa-solid cursor-pointer transition-colors fa-expand"
            @click="expandPanel"
            title="Expand"
          ></i>

          <!-- Compress Icon -->
          <i
            v-else
            class="fa-solid cursor-pointer transition-colors fa-compress"
            @click="compressPanel"
            title="Compress"
          ></i>

          <button
            class="cursor-pointer"
            @click="openConfigPanel"
            :title="showConfigPanel ? 'Preview Data' : 'Agent Configuration'"
          >
            <i class="fa-regular fa-ellipsis-vertical"></i>
          </button>

          <i
            class="cursor-pointer text-text-primary fa-solid fa-close transition-colors"
            @click="closeHandler"
          ></i>
        </div>
      </div>
      <!-- Chat Area (UNCHANGED) -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto min-h-0 p-4 space-y-4"
      >
        <div
          v-if="agentStore.isLoadingHistory"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="flex flex-col items-center gap-3 text-text-secondary">
            <div class="chat-loader"></div>
            <span class="text-xs">Loading conversation...</span>
          </div>
        </div>
        <!-- KEEPING YOUR FULL ORIGINAL CHAT CONTENT EXACTLY SAME -->
        <template
          v-else-if="orderedMessages.length || isAiThinkingBubbleVisible"
        >
          <div
            v-for="msg in orderedMessages"
            :key="msg._id"
            class="flex gap-2 relative animate-fade-in"
            :class="msg.type === 'user' ? 'flex-row-reverse' : ''"
          >
            <div
              class="w-6 h-6 rounded-full p-1.5 flex items-center justify-center shrink-0"
              :class="msg.type === 'user' ? 'bg-bg-surface' : 'bg-accent/10'"
            >
              <i
                v-if="msg.type === 'assistant'"
                class="fa-solid fa-robot text-accent text-sm"
              ></i>
              <div
                v-else-if="msg.type === 'user'"
                class="text-xs font-semibold text-accent"
              >
                ME
              </div>
            </div>

            <div
              class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border relative"
              :class="
                msg.type === 'user'
                  ? 'bg-accent/10 border-accent/20 rounded-tr-none'
                  : 'bg-bg-body border-border rounded-tl-none'
              "
            >
              <p class="whitespace-pre-wrap">{{ msg.content }}</p>
              <div
                class="flex justify-end items-center gap-1 text-[10px] text-text-secondary mt-0.5"
              >
                <span>{{ formatTimestamp(msg.timestamp) }}</span>
                <span v-if="msg.type === 'user'">
                  <i
                    v-if="msg.metadata?.status === 'completed'"
                    class="fa-solid fa-check-double text-green-500"
                  ></i>
                  <i v-else class="fa-solid fa-check text-text-secondary"></i>
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="isAiThinkingBubbleVisible"
            class="flex gap-2 relative animate-fade-in"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-accent/10"
            >
              <i class="fa-solid fa-robot text-accent text-sm"></i>
            </div>
            <div
              class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border bg-bg-body border-border rounded-tl-none"
            >
              <div class="flex items-center gap-1">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="text-xs text-text-secondary ml-2">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        </template>

        <div
          v-else
          class="flex flex-col items-center justify-center h-full text-text-secondary"
        >
          <i class="fa-solid fa-comments text-4xl mb-2 opacity-50"></i>
          <p class="text-sm">No messages yet. Start a conversation!</p>
        </div>
      </div>
      <div class="px-4 py-2 border-t border-border bg-bg-card">
        <div
          v-if="contextTitle"
          class="mb-2 flex justify-between items-center gap-1.5"
        >
          <nav class="flex items-center text-xs text-text-secondary gap-1">
            <div
              class="flex items-center font-medium text-text-primary"
              v-if="!moduleId"
            >
              <span>Workspace</span>
            </div>
            <span v-if="!moduleId"
              ><i class="fa-solid fa-chevron-right text-xs"></i
            ></span>
            <div class="flex items-center font-medium text-text-primary">
              <span>{{ contextTitle }}</span>
            </div>
            <span v-if="moduleId"
              ><i class="fa-solid fa-chevron-right text-xs"></i
            ></span>
            <div
              class="flex items-center font-medium text-text-primary"
              v-if="moduleId"
            >
              <span v-if="route?.path?.includes('peak')"> Peak </span>
              <span v-else>
                {{
                  moduleSelected && moduleSelected?.length > 20
                    ? moduleSelected?.slice(0, 20) + "..."
                    : moduleSelected
                }}
              </span>
            </div>
            <div v-if="moduleId" class="flex">
              <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
              <div class="flex items-center gap-1"><span>Sheets</span></div>
              <!-- <span><i class="fa-solid fa-chevron-right text-xs"></i></span> -->
              <!-- <div class="flex items-center gap-1"><span>Cards</span></div> -->
            </div>
          </nav>
        </div>
        <div class="relative">
          <textarea
            ref="autoTextarea"
            v-model="userMessage"
            placeholder="Ask anything..."
            rows="1"
            class="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-bg-body focus:outline-none focus:border-accent resize-none text-sm transition-colors overflow-y-auto"
            @keydown="handleKeydown"
            @input="autoResize"
            :disabled="agentStore.isSending"
          ></textarea>
          <button
            @click="sendMessage()"
            :disabled="!userMessage.trim() || agentStore.isSending"
            class="absolute right-2 bottom-2 p-1.5 text-accent hover:text-accent-hover transition-colors rounded-lg hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i
              class="fa-solid"
              :class="
                agentStore.isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'
              "
            ></i>
          </button>
        </div>

        <p class="text-[13px] text-text-secondary text-center mt-2">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  </div>
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
import { useQueryClient } from '@tanstack/vue-query';
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
// Stores
const workspaceStore = useWorkspaceStore();
const agentStore = useAgentStore();
const authStore = useAuthStore();
// Route
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const activeTab = ref<"persona" | "knowledge" | "upload">("persona");
const queryClient = useQueryClient();
// Refs
const isExpanded = ref(false);
const showConfigPanel = ref(false);
const showFetchedData = ref(false);
const showAIPreview = ref(false);
const userMessage = ref("");
const socket = ref<Socket | null>(null);
const isSocketConnected = ref(false);
const socketURL = import.meta.env.VITE_SOCKET_IO_URL;
const isAiThinkingBubbleVisible = ref(false);
const autoTextarea = ref<HTMLTextAreaElement | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const pendingMessages = ref<any[]>([]);
const openType = ref(false);
const isSheet = ref(false);
const selectedAgentId = ref("");
const selectedRole = ref("")
const selectJobRole = ref("")
const agentsData = computed(() => {
  return agentStore.agentSettings.agent;
});
const knowledgeData = computed(() => {
  return agentStore?.agentSettings?.knowledge;
});
const agentsRolesPermissions = computed(() =>{
  return agentStore.agentsRolesPermissions;
})
const sheetNameRef = ref(agentStore.sheetTitle || "");
const sheetIdRef = ref(agentStore.sheetId || "");
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
        sheetNameRef.value = "";

        closeHandler();
      }
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
// Define the `transformedData` computed property
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

const selectedSheetTitle = computed(() => {
  const found = transformedData.value.find(
    (sheet) => sheet._id === selected_sheet_id.value,
  );
  return found ? found.title : "Select sheet";
});

function selectSheet(id: string) {
  selected_sheet_id.value = id;
  openSheet.value = false;
}

function handleClickOutsideSheet(event: MouseEvent) {
  if (sheetRef.value && !sheetRef.value.contains(event.target as Node)) {
    openSheet.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutsideSheet);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutsideSheet);
});

// Computed
const moduleSelected = computed(() => workspaceStore.selectedAgent);
const { refetch: refetchModules } = useSingleWorkspace(workspaceId.value);
const contextTitle = computed(() => {
  const routeName = (route.name as string)?.toLowerCase() || "workspace";
  if (routeName.includes("peak")) return "Peak";
  if (routeName.includes("plan")) return "Plan";
  if (routeName.includes("process")) return "Process";
  if (routeName.includes("people")) return "People";
  if (routeName.includes("more")) return "More";
  return "Workspace";
});

const entities = computed(() => agentStore.createdEntities);
const orderedMessages = computed(() => {
  const historyMessages = Array.isArray(agentStore.chatHistory)
    ? agentStore.chatHistory
        .flatMap((s) => s.messages || [])
        .filter((msg) => msg.metadata?.status !== "thinking")
    : [];

  return [...historyMessages, ...pendingMessages.value].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
});

// Auto resize textarea
const autoResize = () => {
  const el = autoTextarea.value;
  if (!el) return;

  el.style.height = "auto";

  const maxHeight = 5 * 24;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";

  el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
};
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && e.shiftKey) {
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};

// Scroll messages
function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = messagesContainer.value;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  });
}

// Watchers
watch(
  () => orderedMessages.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && isAiThinkingBubbleVisible.value) {
      const lastMessage =
        orderedMessages.value[orderedMessages.value.length - 1];
      if (lastMessage?.type === "assistant") {
        isAiThinkingBubbleVisible.value = false;
        agentStore.isAiTyping = false;
      }
    }
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
      agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        moduleSelected.value ?? undefined,
        moduleId.value ?? undefined,
        sheetName.value && !isMongoId(sheetName.value)
          ? sheetName.value
          : undefined,
        // sheetId.value
      );

      await agentStore.fetchCreatedEntities(
        workspaceId.value,
        authStore.userId ?? undefined,
        moduleSelected.value ?? undefined,
        moduleId.value ?? undefined,
      );
      scrollToBottom();
    }
  });

  socket.value.onAny((eventName, ...args) => {
    console.log("Socket event:", eventName, args);
  });
}
const isMongoId = (val?: string) => !!val && /^[a-f\d]{24}$/i.test(val);

// Send Message
async function sendMessage() {
  const message = userMessage.value?.trim();
  if (!message || !workspaceId.value || agentStore.isSending) return;

  userMessage.value = "";
  isAiThinkingBubbleVisible.value = true;
  agentStore.isSending = true;
  agentStore.isAiTyping = true;

  scrollToBottom();
  const tempId = "temp-" + Date.now();

  pendingMessages.value.push({
    _id: tempId,
    type: "user",
    content: message,
    timestamp: new Date().toISOString(),
    metadata: { status: "sending", temp: true },
  });

  try {
    await agentStore.sendMessage({
      workspace_id: workspaceId.value,
      user_id: authStore.userId as string,
      message,
      module_id: moduleId.value as string,
      module_name: moduleSelected.value as string,
      lane_id: route.params.lane_id as string,
      sheet_id: route.params.sheet_id as string,
      card_id: route.params.card_id as string,
      session_id: route.params.session_id as string,
    });

    await Promise.all([
      agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        moduleSelected.value ?? undefined,
        moduleId.value ?? undefined,
        sheetName.value && !isMongoId(sheetName.value)
          ? sheetName.value
          : undefined,
        sheetId.value,
      ),
      agentStore.fetchCreatedEntities(
        workspaceId.value,
        authStore.userId ?? undefined,
        moduleSelected.value ?? undefined,
        moduleId.value ?? undefined,
      ),
      (isExpanded.value = true),
      (showConfigPanel.value = false),
    ]);
    pendingMessages.value = [];
    scrollToBottom();
    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;
  } catch (err) {
    console.error("Error sending message:", err);
    pendingMessages.value = pendingMessages.value.filter(
      (m) => !m.metadata?.temp,
    );

    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;
  } finally {
    agentStore.isSending = false;
  }
}

// Accept / Decline
async function acceptChanges(payload: any) {
  try {
    await agentStore.acceptEntities(payload);
    await queryClient.invalidateQueries({
      queryKey: keys.sheets(
        moduleId.value,
        workspaceId.value
      ),
    });
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

// Close handler
function closeHandler() {
  workspaceStore.toggleChatBotPanel();
}

// Format timestamp
const formatTimestamp = (ts?: string) => {
  if (!ts) return "";
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

// Lifecycle hooks
onMounted(() => {
  initSocket();
  if (workspaceId.value && workspaceStore.showChatBotPanel) {
    agentStore.fetchChatHistory(
      workspaceId.value,
      authStore.userId ?? undefined,
      moduleSelected.value ?? undefined,
      moduleId.value ?? undefined,
      sheetName.value && !isMongoId(sheetName.value)
        ? sheetName.value
        : undefined,
      sheetId.value,
    );

    agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      moduleSelected.value ?? undefined,
      moduleId.value ?? undefined,
    );
    if(selectedAgentId.value){
     loadAgentSettings();
    }
    
    fetchAssignedAgents();
  }
  scrollToBottom();
});
watch(
  [
    () => workspaceStore.showChatBotPanel,
    () => moduleSelected.value,
    () => selectedAgentId.value, // ✅ added
  ],
  async (
    [isOpen, _moduleSelected, selectedAgentId],
    [_oldIsOpen, _oldModuleSelected, oldSelectedAgentId],
  ) => {
    if (!workspaceId.value || !isOpen) return;

    agentStore.fetchChatHistory(
      workspaceId.value,
      authStore.userId ?? undefined,
      moduleSelected.value ?? undefined,
      moduleId.value ?? undefined,
      sheetName.value && !isMongoId(sheetName.value)
        ? sheetName.value
        : undefined,
      sheetId.value,
    );

    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      moduleSelected.value ?? undefined,
      moduleId.value ?? undefined,
    );

    // ✅ call ONLY when selectedAgentId changes
    if (selectedAgentId !== oldSelectedAgentId) {
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
});

// Config panel functions
const openConfigPanel = () => {
  if (!isExpanded.value) {
    isExpanded.value = true;
    showConfigPanel.value = true;
    resetAgentConfig();
  } else if (isExpanded.value) {
    showConfigPanel.value = !showConfigPanel.value;
    showFetchedData.value = true;
    resetAgentConfig();
  }
};
const expandPanel = () => {
  isExpanded.value = true;
};
const compressPanel = () => {
  isExpanded.value = false;
};
// List of capabilities to show as checkboxes
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
  id:string;
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
}

const agentConfig = reactive<AgentConfig>({
  id:"",
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
});

const openLevel = ref(false);
const levelRef = ref(null);

onClickOutside(levelRef, () => {
  openLevel.value = false;
});
const agentsCreated = computed(() => {
  return agentStore.agentsCreated;
});

const agentOptions = computed(() =>
  (agentsCreated.value?.data?.agents || []).map((agent: any) => ({
    _id: agent._id,
    title: agent.name,
    description: agent.description,
 icon: { 
  prefix: 'fa-solid',
  iconName: `fa-circle ${isSocketConnected.value ? 'bg-green-500 border text-green-500 rounded-full' : 'text-red-500 border rounded-full bg-red-500 rounded-full'} text-[6px]`,
},
  }))
);
const selectedAgentName = computed(() => {
  const agent = agentsCreated.value?.data?.agents?.find(
    (a:any) => a._id === selectedAgentId.value
  );
  return agent?.name || 'Select Agent';
});
watch(
  () => agentsCreated.value?.data?.agents,
  (agents) => {
    if (agents?.length && !selectedAgentId.value) {
      selectedAgentId.value = agents[0]._id;
    }
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
const selectedLevelLabel = computed(() => {
  return (
    availableAgentsLevels.find((l) => l.value === agentConfig.level)?.title ||
    availableAgentsLevels[0].title
  );
});
const selectLevel = (value: string) => {
  agentConfig.level = value as any;
  openLevel.value = false;
};
const originalAgentConfig = ref<Partial<AgentConfig> | null>(null);
watch(
  [() => agentsData.value, () => moduleSelected.value],
  ([agent]) => {    
    if (agent) {
      agentConfig.name = agent.name || "Peak Agent";
      agentConfig.id = agent?._id || "";
      agentConfig.description = agent.description || "";
      agentConfig.role = agent.role || "";
      agentConfig.system_prompt = agent.system_prompt || "";
      agentConfig.level = agent.level || "MID";
      agentConfig.responsibilities = [...(agent.responsibilities || [])];
      agentConfig.skills = [...(agent.skills || [])];
      agentConfig.competencies = [...(agent.competencies || [])];
      agentConfig.capabilities = [...(agent.capabilities || [])];
      agentConfig.conditions_rules = [...(agent.conditions_rules || [])];

      // ✅ Save snapshot safely
      originalAgentConfig.value = JSON.parse(JSON.stringify({
        name: agentConfig.name,
        description: agentConfig.description,
        role: agentConfig.role,
        level: agentConfig.level,
        responsibilities: agentConfig.responsibilities,
        skills: agentConfig.skills,
        competencies: agentConfig.competencies,
        capabilities: agentConfig.capabilities,
        conditions_rules: agentConfig.conditions_rules,
      }));
    }
  },
  { immediate: true }
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

// ---------------------------
// REACTIVE STATE
// ---------------------------
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

// ---------------------------
// SOURCES + PERMISSIONS FOR DROPDOWNS
// ---------------------------
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

// Dropdown open state
const openDropdowns = reactive<Record<string, boolean>>({
  INTERNAL_TICKET: false,
  INTERNAL_MODULE: false,
  INTERNAL_SHEET: false,
  WEB_SEARCH: false,
  PROMPT: false,
});

// Refs for click-outside handling
const refsMap: Record<string, Ref<HTMLElement | null>> = {
  INTERNAL_TICKET: ref(null),
  INTERNAL_MODULE: ref(null),
  INTERNAL_SHEET: ref(null),
  WEB_SEARCH: ref(null),
  PROMPT: ref(null),
};

// Toggle dropdown
function toggleSourceDropdown(source: string) {
  openDropdowns[source] = !openDropdowns[source];
}
function getPermissionLabel(
  source: keyof typeof knowledgePermissions,
  perm: string,
) {
  // Map for "create" actions
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

// ---------------------------
// WATCHER: UPDATE CONFIG WHEN MODULE OR DATA CHANGES
// ---------------------------
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

    // Reset defaults if no data
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

// ---------------------------
// HELPER: GET SELECTED SOURCES ARRAY
// ---------------------------
const getSelectedSourcesArray = (
  sources: KnowledgeConfig["sources"],
): Array<keyof typeof sources> => {
  return Object.keys(sources).filter(
    (key) => sources[key as keyof typeof sources],
  ) as Array<keyof typeof sources>;
};

// ---------------------------
// SUBMIT
// ---------------------------
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

    // Reset after save
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

// ---------------------------
// CLICK OUTSIDE HANDLER FOR DROPDOWNS
// ---------------------------
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
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleSourceClickOutside);
});
/* ---------------- UPLOAD CONFIG ---------------- */
// Define type options with labels
const availableUploadTypes = [
  { value: "TEXT" as UploadType, label: "Text Content" },
  { value: "URL" as UploadType, label: "URL/Link" },
  { value: "CMS_PAGE" as UploadType, label: "CMS Page" },
  { value: "MIXED" as UploadType, label: "Mixed Content" },
];

// Computed property for selected type label
const selectedTypeLabel = computed(() => {
  const found = availableUploadTypes.find((t) => t.value === uploadConfig.type);
  return found ? found.label : uploadConfig.type;
});

// Update select function
const selectType = (type: UploadType) => {
  uploadConfig.type = type;
  openType.value = false;
};
const trainingData = computed(() => {
  return agentStore?.agentSettings?.training;
});
// Allowed types for training content
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

// Updated UploadConfig interface
interface UploadConfig {
  name: string;
  text: string;
  type: UploadType;
  files: File[];
  module_id: string;
  module_name: string;
}
// Reactive object with default values
const uploadConfig = reactive<UploadConfig>({
  name: route.path.includes("peak") ? "Peak Agent" : moduleSelected.value,
  text: "",
  type: "TEXT",
  files: [],
  module_id: "",
  module_name: "",
});

// File upload handler
const handleUploadFiles = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  const files = Array.from(target.files);
  uploadConfig.files.push(...files);

  // reset input so same file can be re-uploaded
  target.value = "";
};

// Loading state
const isUploading = ref(false);

// Submit function
const submitTrainingContent = async () => {
  if (!workspaceId.value) return;

  // Validate
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

    // Reset form
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
      // Reset when no data
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
  agentConfig.id ="";
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
// create new Agent
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
      workspace_role_id: selectedRole.value,
      workspace_access_role_id: selectJobRole.value,
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
    workspace_role_id: selectedRole.value,
    workspace_access_role_id: selectJobRole.value,
  };

  const payload = getChangedFields(
    originalAgentConfig.value,
    currentPayload
  );

  if (!Object.keys(payload).length) return;

  await agentStore.updateSelectedAgent(
    workspaceId.value,
    payload,
    agent
  );
   await fetchAssignedAgents();
   await loadAgentSettings();
};
const deleteAgent = async (agent:string) =>{
    await agentStore.deleteSelectedAgent(workspaceId.value, agent);
    await fetchAssignedAgents();
    await loadAgentSettings();
    resetAgentConfig();
}
// Get the agent if created
const isLoadingSettings = ref(false);
const selectedModule = computed(() => {
  return route.path.includes("peak") ? "Peak" : moduleSelected.value;
});
const loadAgentSettings = async () => {
  isLoadingSettings.value = true;
  await agentStore.fetchAgentSettings(
    workspaceId.value,
    moduleId.value,
    selectedModule.value,
    selectedAgentId.value
  );
  isLoadingSettings.value = false;
};

async function fetchAssignedAgents() {
  await agentStore.fetchSavedAgents(
    workspaceId.value,
    moduleId.value,
    selectedModule.value,
    // "module",
    // moduleId.value,
  );
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
  background-color: #7d68c8;
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
  border: 3px solid #d9d9d9;
  border-top-color: #7d68c8;
  animation: chat-spin 0.8s linear infinite;
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
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
