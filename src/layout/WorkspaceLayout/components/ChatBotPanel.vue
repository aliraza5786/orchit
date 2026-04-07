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
      class="w-2/3 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
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
      class="w-2/3 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
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
              <div class="animate-pulse space-y-2">
                <div class="h-5 w-1/3 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>
              <div class="animate-pulse space-y-2">
                <div class="h-5 w-1/4 bg-card rounded"></div>
                <div class="h-24 w-full bg-card rounded"></div>
              </div>
              <div class="animate-pulse space-y-2">
                <div class="h-5 w-1/5 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>
              <div class="animate-pulse space-y-2 relative">
                <div class="h-5 w-1/6 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>
              <div v-for="n in 3" :key="'array-skel-' + n" class="space-y-2">
                <div class="h-5 w-1/6 bg-card rounded"></div>
                <div class="h-10 w-full bg-card rounded"></div>
              </div>
              <div class="space-y-2">
                <div
                  v-for="n in 3"
                  :key="'cap-skel-' + n"
                  class="h-4 w-2/5 bg-card rounded"
                ></div>
              </div>
              <div class="h-10 w-full bg-card rounded mt-4"></div>
            </div>

            <!-- Full Form -->
            <div v-else class="space-y-6">
              <div class="space-y-1">
                <label class="text-sm text-text-primary">Agent Name</label>
                <input
                  v-model="agentConfig.name"
                  class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                />
              </div>
              <div class="space-y-1">
                <label class="text-sm text-text-primary">Description</label>
                <textarea
                  v-model="agentConfig.description"
                  rows="4"
                  class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                />
              </div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-base font-medium text-text-primary block">Select Role</span>
              </div>
              <BaseSelectField
                size="md"
                v-model="selectedRole"
                :options="roleOptions"
                placeholder="Select Role"
              />
              <div class="flex items-center justify-between mb-1 mt-2">
                <span class="text-base font-medium text-text-primary block">Select Job Role</span>
              </div>
              <BaseSelectField
                size="md"
                v-model="selectJobRole"
                :options="jobOptions"
                placeholder="Select Job Role"
              />
              <div class="space-y-1 relative" ref="levelRef">
                <label class="text-sm text-text-primary">Level</label>
                <button
                  type="button"
                  @click="openLevel = !openLevel"
                  class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
                >
                  <span>{{ selectedLevelLabel }}</span>
                  <svg class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div v-if="openLevel" class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg">
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
              <TagInput v-model="agentConfig.responsibilities" label="Responsibilities" />
              <TagInput v-model="agentConfig.skills" label="Skills" />
              <TagInput v-model="agentConfig.competencies" label="Competencies" />
              <TagInput v-model="agentConfig.conditions_rules" label="Conditions / Rules" />
              <div class="flex gap-2" v-if="transformedData?.length">
                <input type="checkbox" class="h-4 w-4 rounded border-border" v-model="isSheet" />
                <span class="text-sm text-text-primary">Enable to create the agent for a selected sheet instead of all sheets</span>
              </div>
              <div class="space-y-1 relative w-full" ref="sheetRef" v-if="isSheet">
                <button
                  type="button"
                  @click="openSheet = !openSheet"
                  class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
                >
                  <span>{{ selectedSheetTitle }}</span>
                  <svg class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div v-if="openSheet" class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg">
                  <ul class="py-1 text-sm max-h-60 overflow-auto">
                    <li
                      v-for="sheet in transformedData"
                      :key="sheet._id"
                      @click="selectSheet(sheet._id)"
                      class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover"
                    >
                      <div class="font-medium">{{ sheet.title }}</div>
                      <div v-if="sheet.description" class="text-xs text-text-secondary">{{ sheet.description }}</div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="space-y-3">
                <label class="text-sm text-text-primary">Capabilities</label>
                <div v-for="capability in availableCapabilities" :key="capability.value" class="flex items-center gap-3 mt-2">
                  <input type="checkbox" :value="capability.value" v-model="agentConfig.capabilities" class="h-4 w-4 rounded border-border" />
                  <span class="text-sm text-text-primary">{{ capability.label }}</span>
                </div>
              </div>
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
                  :disabled="agentStore.isDeletingAgent || !agentConfig.name || !agentConfig.role"
                  class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-red-600 text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isLoading">Deleting...</span>
                  <span v-else>Delete Agent</span>
                </button>
                <button
                  @click="updateAgent(agentConfig.id)"
                  v-if="agentsData && agentConfig?.id"
                  :disabled="agentStore.isUpdatingAgent || !agentConfig.name || !agentConfig.role"
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
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Sources</label>
              <div class="flex flex-col mt-2 gap-2">
                <div v-for="source in sourceList" :key="source.value" class="relative" ref="refsMap[source.value]">
                  <button
                    type="button"
                    @click="toggleSourceDropdown(source.value)"
                    class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"
                  >
                    <span>{{ source.label }}</span>
                    <i
                      class="fa-regular fa-chevron-down text-text-secondary transition-transform duration-200"
                      :class="{ 'rotate-180': openDropdowns[source.value] }"
                    ></i>
                  </button>
                  <div v-if="openDropdowns[source.value]" class="absolute z-[999] mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg">
                    <ul class="py-1 text-sm flex flex-col gap-1">
                      <label for="permissions" class="px-3 pt-2 font-semibold">Permissions</label>
                      <li
                        v-for="perm in permissionsMap[source.value]"
                        :key="perm.value"
                        class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          v-model="knowledgePermissions[source.value as keyof typeof knowledgePermissions][perm.value as keyof (typeof knowledgePermissions)['INTERNAL_TICKET']]"
                          class="h-4 w-4 rounded border-border"
                        />
                        <span>{{ getPermissionLabel(source.value as keyof typeof knowledgePermissions, perm.value) }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Metadata (JSON)</label>
              <textarea v-model="knowledgeMetadataString" rows="4" class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm" />
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" v-model="knowledgeConfig.is_active" />
              <span class="text-sm text-text-primary">Active Source</span>
            </div>
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
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Training Name</label>
              <input v-model="uploadConfig.name" disabled class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm" />
            </div>
            <div class="space-y-1 relative" ref="typeRef">
              <label class="text-sm text-text-primary">Type</label>
              <button
                type="button"
                @click="openType = !openType"
                class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
              >
                <span>{{ selectedTypeLabel }}</span>
                <svg class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div v-if="openType" class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg">
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
            <div class="space-y-1">
              <label class="text-sm text-text-primary">Training Text</label>
              <textarea v-model="uploadConfig.text" rows="4" class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm" />
            </div>
            <input type="file" multiple @change="handleUploadFiles" class="w-full border-2 border-dashed border-border bg-bg-body rounded-lg px-4 py-3 text-sm" />
            <div v-for="(file, i) in uploadConfig.files" :key="i" class="flex justify-between text-sm border border-border rounded-lg px-3 py-2">
              <span>{{ file.name }}</span>
              <button @click="uploadConfig.files.splice(i, 1)" class="text-red-500">Remove</button>
            </div>
            <button
              @click="submitTrainingContent"
              :disabled="!uploadConfig.name || (uploadConfig.text === '' && uploadConfig.files.length === 0) || isUploading"
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
      :class="isExpanded && (showConfigPanel || entities?.length) ? 'w-1/3' : 'w-full'"
      class="border-r border-border bg-bg-card h-full min-h-0 flex flex-col py-2 overflow-x-hidden"
    >
      <div class="flex items-center border-b border-border px-5 py-2 sticky top-0 bg-bg-card z-30 gap-2">
        <h5 class="text-[16px] font-medium flex items-center gap-2 min-w-0 flex-1">
          <i class="fa-solid fa-sparkles text-accent shrink-0"></i>
          <Dropdown
            v-model="selectedAgentId"
            :options="agentOptions"
            :custom-title="selectedAgentName"
            :actions="false"
            size="md"
            variant="secondary"
            class="relative min-w-0 max-w-[160px]"
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
          <!-- History Button -->
          <button
            class="cursor-pointer p-1 rounded backdrop-blur-2xl transition-all duration-75 hover:text-accent"
            @click="showHistoryPanel = !showHistoryPanel"
            title="Chat history"
          >
            <i class="fa-regular fa-clock-rotate-left"></i>
          </button>

          <!-- New Chat Button -->
          <button
            class="cursor-pointer p-1 rounded backdrop-blur-2xl transition-all duration-75 hover:text-accent"
            @click="showNewChatConfirm = !showNewChatConfirm"
            title="New chat"
          >
            <i class="fa-regular fa-pen-to-square"></i>
          </button>

          <!-- Expand / Compress -->
          <i v-if="!isExpanded" class="fa-solid fa-expand cursor-pointer p-1 rounded backdrop-blur-2xl transition-all duration-75 hover:text-accent" @click="expandPanel" title="Expand"></i>
          <i v-else class="fa-solid cursor-pointer transition-colors fa-compress" @click="compressPanel" title="Compress"></i>

          <button
            class="cursor-pointer p-1 rounded backdrop-blur-2xl transition-all duration-75 hover:text-accent"
            @click="openConfigPanel"
            :title="showConfigPanel ? 'Preview Data' : 'Agent Configuration'"
          >
            <i class="fa-regular fa-ellipsis-vertical"></i>
          </button>

          <i class="cursor-pointer p-1 rounded backdrop-blur-2xl transition-all duration-75 hover:text-accent fa-solid fa-close " @click="closeHandler"></i>
        </div>
      </div>

      <!-- Chat Area -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        <div v-if="agentStore.isLoadingHistory" class="absolute inset-0 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3 text-text-secondary">
            <div class="chat-loader"></div>
            <span class="text-xs">Loading conversation...</span>
          </div>
        </div>

        <template v-else-if="orderedMessages.length || isAiThinkingBubbleVisible">
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
              <i v-if="msg.type === 'assistant'" class="fa-solid fa-robot text-accent text-sm"></i>
              <div v-else-if="msg.type === 'user'" class="text-xs font-semibold text-accent">ME</div>
            </div>
            <div
              class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border relative"
              :class="msg.type === 'user' ? 'bg-accent/10 border-accent/20 rounded-tr-none' : 'bg-bg-body border-border rounded-tl-none'"
            >
              <p class="whitespace-pre-wrap" v-if="msg.content">{{ msg.content }}</p>
              <div v-if="msg.attachments && msg.attachments.length" class="flex flex-wrap gap-1.5 mt-1">
                <div
                  v-for="(attachment, idx) in msg.attachments"
                  :key="idx"
                  class="flex items-center gap-1.5 px-2 py-1 rounded-md border border-accent/20 bg-accent/5 text-xs text-text-primary"
                >
                  <i class="fa-solid text-accent" :class="attachment.mimetype === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'"></i>
                  <span class="max-w-[120px] truncate">{{ attachment.filename || attachment.name }}</span>
                </div>
              </div>
              <div class="flex justify-end items-center gap-1 text-[10px] text-text-secondary mt-0.5">
                <span>{{ formatTimestamp(msg.timestamp) }}</span>
                <span v-if="msg.type === 'user'">
                  <i v-if="msg.metadata?.status === 'completed'" class="fa-solid fa-check-double text-green-500"></i>
                  <i v-else class="fa-solid fa-check text-text-secondary"></i>
                </span>
              </div>
            </div>
          </div>

          <div v-if="isAiThinkingBubbleVisible" class="flex gap-2 relative animate-fade-in">
            <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-accent/10">
              <i class="fa-solid fa-robot text-accent text-sm"></i>
            </div>
            <div class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border bg-bg-body border-border rounded-tl-none">
              <div class="flex items-center gap-1">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="text-xs text-text-secondary ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="flex flex-col items-center justify-center h-full text-text-secondary">
          <i class="fa-solid fa-comments text-4xl mb-2 opacity-50"></i>
          <p class="text-sm">No messages yet. Start a conversation!</p>
        </div>
      </div>

      <div class="px-3 pt-3 pb-1 border-t border-border bg-bg-card mt-1.5">
        <!-- Breadcrumb -->
        <div v-if="contextTitle" class="mb-3 flex justify-between border-b border-border items-center gap-1.5">
          <nav class="flex items-center text-xs text-text-secondary gap-1 mb-2">
            <div class="flex items-center font-medium text-text-primary" v-if="!moduleId">
              <span>Workspace</span>
            </div>
            <span v-if="!moduleId"><i class="fa-solid fa-chevron-right text-xs"></i></span>
            <div class="flex items-center font-medium text-text-primary">
              <span>{{ contextTitle }}</span>
            </div>
            <span v-if="moduleId"><i class="fa-solid fa-chevron-right text-xs"></i></span>
            <div class="flex items-center font-medium text-text-primary" v-if="moduleId">
              <span v-if="route?.path?.includes('peak')">Peak</span>
              <span v-else>{{ moduleSelected && moduleSelected?.length > 20 ? moduleSelected?.slice(0, 20) + '...' : moduleSelected }}</span>
            </div>
            <div v-if="moduleId" class="flex">
              <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
              <div class="flex items-center gap-1"><span>{{ sheetNameRef }}</span></div>
            </div>
          </nav>
        </div>

        <!-- Active session indicator -->
        <div v-if="activeSessionId && activeSessionTitle" class="mb-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/5 border border-accent/20">
          <i class="fa-solid fa-message-lines text-accent text-[10px]"></i>
          <span class="text-[11px] text-accent font-medium truncate max-w-[200px]">{{ activeSessionTitle }}</span>
          <button
            @click="clearActiveSession"
            class="ml-auto text-[10px] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
            title="Start new chat"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- New chat confirm banner -->
        <div
          v-if="showNewChatConfirm"
          class="mb-2.5 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-accent/25 bg-accent/5"
        >
          <p class="text-xs text-text-secondary">Start a new conversation? Current chat will be saved in history.</p>
          <div class="flex gap-2 shrink-0">
            <button
              @click="startNewChat"
              class="text-[11px] px-3 py-1 rounded-lg bg-accent text-white cursor-pointer hover:bg-accent-dark transition-colors"
            >Start</button>
            <button
              @click="showNewChatConfirm = false"
              class="text-[11px] px-3 py-1 rounded-lg border border-border text-text-secondary cursor-pointer hover:bg-bg-body transition-colors"
            >Cancel</button>
          </div>
        </div>

        <!-- Input card -->
        <div
          class="border border-border rounded-2xl bg-bg-body overflow-hidden transition-all duration-200"
          :class="{ 'border-accent/50': isFocused }"
        >
          <!-- Uploaded file previews -->
          <div v-if="selectedFiles.length" class="flex flex-wrap gap-2 px-3 pt-3">
            <template v-for="file in selectedFiles" :key="file.tempId">
              <div class="relative w-11 h-11 rounded-lg overflow-hidden border border-border bg-bg-surface flex items-center justify-center">
                <img
                  v-if="file && typeof file.type === 'string' && file.type.startsWith('image/')"
                  :src="createObjectURL(file)"
                  class="w-full h-full object-cover"
                  alt="preview"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-semibold text-text-secondary bg-bg-body">PDF</div>
                <button
                  type="button"
                  @click="removeFile(file.tempId!)"
                  class="absolute top-0.5 right-0.5 w-3.5 h-3.5 text-white text-[8px] bg-red-500 rounded-full flex items-center justify-center hover:bg-red-700"
                >&times;</button>
              </div>
            </template>
          </div>

          <!-- Textarea -->
          <div class="px-3 pt-3 pb-1">
            <textarea
              v-model="userMessage"
              placeholder="Ask anything about your workspace…"
              ref="autoTextarea"
              rows="2"
              class="w-full resize-none bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary leading-relaxed"
              :disabled="agentStore.isSending"
              @keydown="handleKeydown"
              @input="autoResize"
              @focus="isFocused = true"
              @blur="isFocused = false"
            ></textarea>
          </div>

          <!-- Toolbar row -->
          <div class="flex items-center justify-between px-2.5 pb-2.5">
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="triggerFileInput"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border text-[11.5px] text-text-secondary hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
              >
                <i class="fa-solid fa-paperclip text-[10px]"></i>
                Attach
              </button>
            </div>
            <button
              @click="sendMessage"
              :disabled="(!userMessage.trim() && !selectedFiles.length) || agentStore.isSending"
              class="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <i class="fa-solid text-white text-xs" :class="agentStore.isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
            </button>
          </div>
        </div>

        <!-- Hidden file input -->
        <input ref="fileInput" type="file" class="hidden" multiple accept="image/*,.pdf" @change="handleFileChange" />

        <!-- Pinned prompt chips -->
        <div v-if="pinnedPrompts.length" class="mt-3 relative flex items-center gap-2">
  <!-- First two pinned prompts as mini tabs -->
  <template v-for="pin in pinnedPrompts.slice(0, 2)" :key="pin.id">
    <button
      class="truncate max-w-[80px] cursor-pointer px-2 py-1 rounded-full border border-border bg-bg-card text-[12px] text-text-secondary hover:border-accent/50 hover:text-accent transition-all duration-150"
      @click="applyPromptToInput(pin.text)"
    >
      {{ pin.label }}
    </button>
  </template>

  <!-- Dropdown trigger button -->
  <button
    @click="toggleDropdown"
    class="flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-full border border-border bg-bg-card text-[12px] text-text-secondary hover:border-accent/50 hover:text-accent transition-all duration-150"
  >
    <i class="fa-solid fa-thumbtack text-accent" style="font-size:10px;"></i>
    Pinned Prompts
    <i
      :class="{'fa-chevron-up': isDropdownOpen, 'fa-chevron-down': !isDropdownOpen}"
      class="fa-solid ml-1 text-text-tertiary text-[10px] transition-transform"
    ></i>
  </button>

  <!-- Dropdown for all pinned prompts -->
  <div
    v-if="isDropdownOpen"
    class="absolute mt-1 w-56 bg-bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden"
  >
    <div class="flex justify-between items-center px-3 py-2 border-b border-border">
      <span class="text-[11px] text-text-tertiary">Pinned prompts</span>
      <button
        @click="unpinAll"
        :disabled="isUnpinningAll"
        class="text-[11px] text-text-tertiary hover:text-red-500 transition-colors disabled:opacity-40"
      >
        {{ isUnpinningAll ? 'Clearing…' : 'Clear all' }}
      </button>
    </div>

    <div class="max-h-60 overflow-y-auto">
      <button
        v-for="pin in pinnedPrompts"
        :key="pin.id"
        class="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-accent/10 transition-colors text-[12px]"
        @click="applyPromptToInput(pin.text)"
      >
        <span class="truncate">{{ pin.label }}</span>
        <span
          @click.stop="unpinSinglePrompt(pin.id)"
          class="text-red-500 hover:text-red-700 cursor-pointer ml-2"
        >
          <i class="fa-solid fa-xmark text-[10px]"></i>
        </span>
      </button>
    </div>
  </div>
</div>

        <p class="text-[11px] text-text-tertiary text-center mt-2.5 mb-1">
          AI can make mistakes. Please verify important information.
        </p>
      </div>

      <transition name="slide-fade">
        <div v-if="showHistoryPanel" class="absolute inset-0 z-30 bg-bg-card flex flex-col rounded-[6px]">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div class="flex items-center gap-2">
              <i class="fa-regular fa-clock-rotate-left text-accent text-sm"></i>
              <h3 class="text-sm font-semibold text-text-primary">Chat History</h3>
            </div>
            <button
              class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-bg-surface transition-colors cursor-pointer"
              @click="showHistoryPanel = false"
            >
              <i class="fa-solid fa-close text-text-secondary text-xs"></i>
            </button>
          </div>

          <!-- Session list or session messages view -->
          <div class="flex-1 overflow-y-auto min-h-0">
            <!-- Loading state -->
            <div v-if="isLoadingSessions" class="flex items-center justify-center h-32">
              <div class="flex flex-col items-center gap-2 text-text-secondary">
                <div class="chat-loader"></div>
                <span class="text-[11px]">Loading sessions...</span>
              </div>
            </div>

            <!-- Active session view (messages preview) -->
            <div v-else-if="historyViewSession" class="flex flex-col h-full">
              <!-- Back + session title bar -->
              <div class="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0 bg-bg-body">
                <button
                  @click="historyViewSession = null"
                  class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-bg-surface transition-colors cursor-pointer shrink-0"
                >
                  <i class="fa-solid fa-arrow-left text-text-secondary text-xs"></i>
                </button>
                <div v-if="!isRenamingSession" class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-text-primary truncate">
                    {{ historyViewSession.title || 'Untitled conversation' }}
                  </p>
                </div>
                <input
                  v-else
                  v-model="renameValue"
                  @keydown.enter="confirmRename"
                  @keydown.escape="isRenamingSession = false"
                  @blur="confirmRename"
                  ref="renameInput"
                  class="flex-1 text-xs bg-bg-body border border-accent/40 rounded px-2 py-0.5 outline-none text-text-primary min-w-0"
                  placeholder="Session name..."
                />
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    @click="startRename"
                    class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-bg-surface transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <i class="fa-regular fa-pen text-text-secondary text-[10px]"></i>
                  </button>
                  <button
                    @click="confirmDeleteSession(historyViewSession.session_id)"
                    class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete session"
                  >
                    <i class="fa-regular fa-trash text-text-secondary hover:text-red-500 text-[10px]"></i>
                  </button>
                </div>
              </div>

              <!-- Messages preview -->
              <div class="flex-1 overflow-y-auto p-3 space-y-3">
                <div v-if="isLoadingSessionMessages" class="flex items-center justify-center h-20">
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
                      :class="msg.role === 'user' ? 'bg-bg-surface' : 'bg-accent/10'"
                    >
                      <i v-if="msg.role === 'assistant'" class="fa-solid fa-robot text-accent text-[9px]"></i>
                      <span v-else class="text-[8px] font-semibold text-accent">ME</span>
                    </div>
                    <div
                      class="px-2.5 py-1.5 rounded-lg max-w-[85%] text-[11px] leading-relaxed border"
                      :class="msg.role === 'user' ? 'bg-accent/10 border-accent/20 rounded-tr-none' : 'bg-bg-body border-border rounded-tl-none'"
                    >
                      <p class="whitespace-pre-wrap text-text-primary">{{ msg.content }}</p>
                      <p class="text-[9px] text-text-tertiary mt-0.5 text-right">{{ formatTimestamp(msg.timestamp) }}</p>
                    </div>
                  </div>
                </template>
                <p v-else class="text-xs text-text-secondary text-center mt-8">No messages in this session</p>
              </div>

              <!-- Continue in this session button -->
              <div class="px-3 py-3 border-t border-border shrink-0">
                <button
                  @click="continueSession(historyViewSession)"
                  class="w-full px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-dark transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <i class="fa-solid fa-reply"></i>
                  Continue this conversation
                </button>
              </div>
            </div>

            <!-- Sessions list -->
            <div v-else class="p-2 flex flex-col gap-1">
              <div
                v-for="session in sessionsList"
                :key="session.session_id"
                class="group relative px-3 py-2 rounded-lg border border-transparent hover:border-border hover:bg-bg-surface cursor-pointer transition-all duration-150"
                @click="openSession(session)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-text-primary font-medium truncate leading-snug">
                      {{ session.title || 'Untitled conversation' }}
                    </p>
                    <p v-if="session.last_message?.content" class="text-[10px] text-text-secondary mt-1 truncate opacity-70">
                      {{ session.last_message.content }}
                    </p>
                  </div>
                  <div class="relative opacity-0 group-hover:opacity-100 transition-opacity shrink-0" @click.stop>
                    <button
                      @click.stop="toggleMenu(session.session_id)"
                      class="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-colors"
                    >
                      <i class="fa-solid fa-ellipsis text-text-tertiary text-xs"></i>
                    </button>
                    <div
                      v-if="openMenuSessionId === session.session_id"
                      class="absolute right-0 mt-1 w-40 rounded-lg bg-white shadow-lg border border-border z-50 py-1"
                    >
                      <button
                        @click.stop="startRenameFromList(session); closeMenu()"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-gray-100"
                      >
                        <i class="fa-regular fa-pen"></i>
                        Rename
                      </button>
                      <div class="my-1 border-t border-gray-200"></div>
                      <button
                        @click.stop="confirmDeleteSession(session.session_id); closeMenu()"
                        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <i class="fa-regular fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Inline rename input (list level) -->
                <div v-if="renamingSessionId === session.session_id" class="mt-1.5" @click.stop>
                  <input
                    v-model="renameValue"
                    @keydown.enter="confirmRenameFromList(session.session_id)"
                    @keydown.escape="renamingSessionId = null"
                    @blur="confirmRenameFromList(session.session_id)"
                    :ref="el => { if (el) listRenameInputs[session.session_id] = el as HTMLInputElement }"
                    class="w-full text-xs bg-bg-body border border-accent/40 rounded px-2 py-1 outline-none text-text-primary"
                    placeholder="Session name..."
                  />
                </div>
              </div>

              <p v-if="!sessionsList.length" class="text-xs text-text-secondary text-center mt-8 px-4">
                No previous conversations
              </p>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="!historyViewSession && !isLoadingSessions && totalSessionPages > 1"
            class="flex items-center justify-between px-4 py-2.5 border-t border-border shrink-0"
          >
            <button
              @click="changeSessionPage(currentSessionPage - 1)"
              :disabled="currentSessionPage === 1"
              class="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <i class="fa-solid fa-chevron-left text-[9px]"></i>
              Prev
            </button>
            <span class="text-[11px] text-text-secondary">{{ currentSessionPage }} / {{ totalSessionPages }}</span>
            <button
              @click="changeSessionPage(currentSessionPage + 1)"
              :disabled="currentSessionPage === totalSessionPages"
              class="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
              <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>

  <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="w-full max-w-sm rounded-xl bg-white shadow-xl p-5">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7v10m6-10v10M10 11h4" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-gray-900">Delete Session</h3>
          <p class="mt-1 text-sm text-gray-500">This action cannot be undone. This will permanently delete the session.</p>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button @click="handleDeleteCancel" class="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
        <button @click="handleDeleteConfirmed" class="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">Delete Session</button>
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
import { useQueryClient } from "@tanstack/vue-query";
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
const selectedRole = ref("");
const selectJobRole = ref("");
const showHistoryPanel = ref(false);
const showNewChatConfirm = ref(false);
const isFocused = ref(false);

// ── Session tracking ──────────────────────────────────────────────────────────
// activeSessionId: the session currently being used for chat (send messages into)
// activeSessionTitle: display name of the active session
const activeSessionId = ref<string>("");
const activeSessionTitle = ref<string>("");

const agentsData = computed(() => agentStore.agentSettings.agent);
const agentPassedData = computed(() => agentStore.agentPassed);
const agentModuleId = computed(() => agentStore.module_id);
const agentModuleName = computed(() => agentStore.moduleName);
const knowledgeData = computed(() => agentStore?.agentSettings?.knowledge);
const agentsRolesPermissions = computed(() => agentStore.agentsRolesPermissions);

const sheetNameRef = computed(() => agentStore.sheetTitle);
const sheetNameValue = ref(sheetNameRef.value);
const sheetIdRef = ref(agentStore.sheetId || "");
const isDropdownOpen = ref(false);

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

const isTalentRoute = computed(() => route.path?.includes("talent"));

watch(
  [isTalentRoute, agentPassedData],
  ([isTalent, agentData]) => {
    if (isTalent && agentData?._id) {
      selectedAgentId.value = agentData._id;
    }
  },
  { immediate: true },
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
  if (routeName.includes("people")) return "Talent";
  if (routeName.includes("more")) return "More";
  return "Workspace";
});

const entities = computed(() => agentStore.createdEntities);

// ── orderedMessages: built from store history + pending (for the active session) ──
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

// ── Pinned entities state ─────────────────────────────────────────────────────
const pinnedPrompts = computed(() => {
  return (entities.value || [])
    .filter((e: any) => e.ispined)
    .map((e: any) => {
      const userMsg = e.agent_chat_message_id?.messages?.find(
        (m: any) => m.type === "user",
      );
      const fullText = userMsg?.content || "Pinned prompt";
      const label =
        fullText.length > 32 ? fullText.slice(0, 32) + "…" : fullText;
      return {
        id: e.id ?? e._id,
        text: fullText,
        label,
        time: formatTimestamp(e.created_at),
        context: e.module_name || "Workspace",
      };
    });
});

function applyPromptToInput(text: string) {
  userMessage.value = text;
  nextTick(() => autoResize());
}

function unpinSinglePrompt(id: string) {
  unpinSingle(id);
}

// ── Clear active session (go back to "new chat" mode) ────────────────────────
function clearActiveSession() {
  activeSessionId.value = "";
  activeSessionTitle.value = "";
  pendingMessages.value = [];
  agentStore.chatHistory = [];
}

// ── Start new chat: create a fresh session ────────────────────────────────────
async function startNewChat() {
  try {
    pendingMessages.value = [];
    agentStore.chatHistory = [];
    const newSession = await agentStore.createSession(workspaceId.value, {
      agent_id: selectedAgentId.value,
      module_id: agentStore.module_id ?? undefined,
      module_name: agentStore.moduleName ?? undefined,
      sheet_id: agentStore.sheetId ?? undefined,
      sheet_name: agentStore.sheetTitle ?? undefined,
    });

    if (newSession) {
      activeSessionId.value = newSession.session_id;
      activeSessionTitle.value = newSession.title || "New conversation";

      // Keep sessions list in sync
      if (sessionsList.value) {
        sessionsList.value = [newSession, ...sessionsList.value];
      }
    }

    showNewChatConfirm.value = false;
  } catch (err) {
    console.error("Failed to start new chat:", err);
  }
}

// ── Continue a session from history ──────────────────────────────────────────
async function continueSession(session: any) {
  // Set it as the active session for sending messages
  activeSessionId.value = session.session_id;
  activeSessionTitle.value = session.title || "Untitled conversation";

  // Load its messages into the main chat area via store history
  pendingMessages.value = [];
  agentStore.isLoadingHistory = true;
  try {
    const data = await agentStore.getSession(workspaceId.value, session.session_id);
    // Map history panel message format (role) to chat area format (type)
    if (data?.messages) {
      agentStore.chatHistory = [
  {
    _id: data._id ?? session._id ?? session.session_id,
    session_id: session.session_id,
    context: data.context ?? {
      module_id: null,
      sheet_id: null,
      lane_id: null,
      card_id: null,
    },
    messages: data.messages.map((m: any) => ({
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

  // Close history panel
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
        !!activeSessionId.value
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

const isMongoId = (val?: string) => !!val && /^[a-f\d]{24}$/i.test(val);
const fileInput = ref<HTMLInputElement | null>(null);

interface FileWithId extends File {
  tempId?: string;
  objectUrl?: string;
}

const selectedFiles = ref<FileWithId[]>([]);

const createObjectURL = (file: FileWithId): string => file.objectUrl || "";

const MAX_IMAGES = 5;

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (!files.length) return;

  const images = files.filter((f) => f.type.startsWith("image/"));
  const pdfs = files.filter((f) => f.type === "application/pdf");

  if (pdfs.length > 1) {
    alert("Only one PDF is allowed");
    return;
  }
  if (images.length > MAX_IMAGES) {
    alert(`You can upload up to ${MAX_IMAGES} images`);
    return;
  }
  if (pdfs.length === 1 && images.length > 0) {
    alert("You can upload either images or a single PDF, not both");
    return;
  }

  const filesWithId: FileWithId[] = files.map((f) => {
    const fileWithId = f as FileWithId;
    fileWithId.tempId =
      "temp-" + Date.now() + Math.random().toString(36).substr(2, 5);
    fileWithId.objectUrl = f.type.startsWith("image/")
      ? URL.createObjectURL(f)
      : "";
    return fileWithId;
  });

  selectedFiles.value = [...selectedFiles.value, ...filesWithId];
  if (fileInput.value) fileInput.value.value = "";
};

const removeFile = (tempId: string) => {
  const fileToRemove = selectedFiles.value.find((f) => f.tempId === tempId);
  if (fileToRemove?.objectUrl) URL.revokeObjectURL(fileToRemove.objectUrl);
  selectedFiles.value = selectedFiles.value.filter((f) => f.tempId !== tempId);
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

// ── Send message — uses activeSessionId if set, otherwise generates a new one ──
async function sendMessage() {
  const message = userMessage.value?.trim();
  if (
    (!message && !selectedFiles.value.length) ||
    !workspaceId.value ||
    agentStore.isSending
  )
    return;

  let attachments: any[] = [];

  if (selectedFiles.value.length) {
    attachments = await uploadFiles();
    selectedFiles.value.forEach((f) => {
      if ((f as any).previewUrl) URL.revokeObjectURL((f as any).previewUrl);
    });
    selectedFiles.value = [];
  }

  const finalMessage = message || "";
  userMessage.value = "";
  isAiThinkingBubbleVisible.value = true;
  agentStore.isSending = true;
  agentStore.isAiTyping = true;
  scrollToBottom();

  const tempId = "temp-" + Date.now();
  pendingMessages.value.push({
    _id: tempId,
    type: "user",
    content: finalMessage,
    timestamp: new Date().toISOString(),
    metadata: { status: "sending", temp: true },
    attachments: attachments.length
      ? attachments.map((f: any) => ({
          filename: f.filename || f.name,
          mimetype: f.mimetype || f.type,
          url: f.url || f.objectUrl,
        }))
      : selectedFiles.value.map((f) => ({
          filename: f.name,
          mimetype: f.type,
          url: f.objectUrl,
        })),
  });

  // Use existing activeSessionId if we're continuing a session; otherwise let
  // the server assign / create a session (pass the generated id as before).
  const sessionIdToUse = activeSessionId.value || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await agentStore.sendMessage({
      workspace_id: workspaceId.value,
      user_id: authStore.userId as string,
      message: finalMessage,
      agent_id: selectedAgentId.value as string,
      sheet_id: sheetIdRef.value as string,
      attachments: attachments,
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
    });

    // If this was the first message (no prior activeSessionId), track the session
    if (!activeSessionId.value) {
      activeSessionId.value = sessionIdToUse;
      activeSessionTitle.value = finalMessage.length > 40 ? finalMessage.slice(0, 40) + "…" : finalMessage;
    }

    await Promise.all([
      agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        route.path.includes("talent") && agentModuleName.value
          ? agentModuleName.value
          : moduleSelected.value ?? undefined,
        route.path.includes("talent") && agentModuleId.value
          ? agentModuleId.value
          : moduleId.value ?? undefined,
        sheetName.value && !isMongoId(sheetName.value)
          ? sheetName.value
          : undefined,
        sheetId.value,
        !!activeSessionId.value
      ),
      agentStore.fetchCreatedEntities(
        workspaceId.value,
        authStore.userId ?? undefined,
        route.path.includes("talent") && agentModuleName.value
          ? agentModuleName.value
          : moduleSelected.value ?? undefined,
        route.path.includes("talent") && agentModuleId.value
          ? agentModuleId.value
          : moduleId.value ?? undefined,
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
      queryKey: keys.sheets(moduleId.value, workspaceId.value),
    });
    await queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      moduleSelected.value ?? undefined,
      moduleId.value ?? undefined,
    );
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
    // First load: clear history so it starts as a fresh new chat
    agentStore.chatHistory = [];
    activeSessionId.value = "";
    activeSessionTitle.value = "";

    agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : moduleSelected.value ?? undefined,
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : moduleId.value ?? undefined,
    );

    if (selectedAgentId.value) {
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
    () => selectedAgentId.value,
  ],
  async (
    [isOpen, _moduleSelected, newSelectedAgentId],
    [_oldIsOpen, _oldModuleSelected, oldSelectedAgentId],
  ) => {
    if (!workspaceId.value || !isOpen) return;

    // Only reload history if we have an active session to restore
    if (activeSessionId.value) {
      agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        route.path.includes("talent") && agentModuleName.value
          ? agentModuleName.value
          : moduleSelected.value ?? undefined,
        route.path.includes("talent") && agentModuleId.value
          ? agentModuleId.value
          : moduleId.value ?? undefined,
        sheetName.value && !isMongoId(sheetName.value)
          ? sheetName.value
          : undefined,
        sheetId.value,
        !!activeSessionId.value
      );
    }

    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : moduleSelected.value ?? undefined,
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : moduleId.value ?? undefined,
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

const expandPanel = () => { isExpanded.value = true; };
const compressPanel = () => { isExpanded.value = false; };

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
});

const openLevel = ref(false);
const levelRef = ref(null);

onClickOutside(levelRef, () => {
  openLevel.value = false;
});

const agentsCreated = computed(() => agentStore.agentsCreated);

type Agent = {
  _id: string;
  name: string;
  description: string;
  level?: string;
  is_active?: boolean;
  model?: string;
  role?: string;
};

const agentOptions = computed(() => {
  const base = (agentsCreated.value?.data?.agents || []).map((agent: any) => ({
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
  const passedAgent = agentPassedData.value;
  if (
    isTalentRoute.value &&
    passedAgent &&
    !base.find((a: Agent) => a._id === passedAgent._id)
  ) {
    base.unshift({
      _id: passedAgent._id,
      title: passedAgent.name,
      description: passedAgent.description,
      icon: {
        prefix: "fa-solid",
        iconName: "fa-circle text-green-500 text-[6px]",
      },
    });
  }
  return base;
});

const selectedAgentName = computed(() => {
  if (isTalentRoute.value && agentPassedData.value?.name) {
    return agentPassedData.value.name;
  }
  const agent = agentsCreated.value?.data?.agents?.find(
    (a: any) => a._id === selectedAgentId.value,
  );
  return agent?.name || "Select Agent";
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
        }),
      );
    }
  },
  { immediate: true },
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

const selectedTypeLabel = computed(() => {
  const found = availableUploadTypes.find((t) => t.value === uploadConfig.type);
  return found ? found.label : uploadConfig.type;
});

const selectType = (type: UploadType) => {
  uploadConfig.type = type;
  openType.value = false;
};

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
  };
  const payload = getChangedFields(originalAgentConfig.value, currentPayload);
  if (!Object.keys(payload).length) return;
  await agentStore.updateSelectedAgent(workspaceId.value, payload, agent);
  await fetchAssignedAgents();
  await loadAgentSettings();
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
};

async function fetchAssignedAgents() {
  await agentStore.fetchSavedAgents(
    workspaceId.value,
    moduleId.value,
    selectedModule.value,
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

// ── Unpin state ───────────────────────────────────────────────────────────────
const isUnpinningAll = ref(false);
const unpinningId = ref<string | null>(null);

const unpinAll = async () => {
  isUnpinningAll.value = true;
  try {
    await agentStore.unpinStructure({ workspace_id: workspaceId.value });
    toast.success("All pinned suggestions have been unpinned");
    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : moduleSelected.value ?? undefined,
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : moduleId.value ?? undefined,
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to unpin all suggestions");
  } finally {
    isUnpinningAll.value = false;
  }
};

const unpinSingle = async (logId: string) => {
  unpinningId.value = logId;
  try {
    await agentStore.unpinStructure({
      workspace_id: workspaceId.value,
      log_id: logId,
    });
    toast.success("Suggestion unpinned");
    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      route.path.includes("talent") && agentModuleName.value
        ? agentModuleName.value
        : moduleSelected.value ?? undefined,
      route.path.includes("talent") && agentModuleId.value
        ? agentModuleId.value
        : moduleId.value ?? undefined,
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to unpin suggestion");
  } finally {
    unpinningId.value = null;
  }
};

// ── Sessions state ────────────────────────────────────────────────────────────
const isLoadingSessions = ref(false);
const isLoadingSessionMessages = ref(false);
const sessionsList = ref<any[]>([]);
const sessionsPagination = ref<{ total: number; limit: number; skip: number } | null>(null);
const currentSessionPage = ref(1);

// historyViewSession: session being previewed inside the history panel (NOT the active chat session)
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

// openSession: opens a session in the history panel for preview only
async function openSession(session: any) {
  historyViewSession.value = session;
  isLoadingSessionMessages.value = true;
  historyViewMessages.value = [];
  try {
    const data = await agentStore.getSession(workspaceId.value, session.session_id);
    historyViewMessages.value = data?.messages ?? [];
  } finally {
    isLoadingSessionMessages.value = false;
  }
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
    // Update active session title if it's the same session
    if (activeSessionId.value === historyViewSession.value.session_id) {
      activeSessionTitle.value = renameValue.value.trim();
    }
    toast.success("Session renamed");
  } catch {
    toast.error("Failed to rename session");
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
    const idx = sessionsList.value.findIndex((s) => s.session_id === session_id);
    if (idx !== -1)
      sessionsList.value[idx] = {
        ...sessionsList.value[idx],
        title: renameValue.value.trim(),
      };
    // Update active session title if it's the same session
    if (activeSessionId.value === session_id) {
      activeSessionTitle.value = renameValue.value.trim();
    }
    toast.success("Session renamed");
  } catch {
    toast.error("Failed to rename session");
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
    // If deleted session was the active chat session, clear it
    if (activeSessionId.value === sessionToDelete.value) {
      clearActiveSession();
    }
    toast.success("Session deleted");
  } catch {
    toast.error("Failed to delete session");
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
});

onBeforeUnmount(() => {
  window.removeEventListener("click", closeMenu);
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