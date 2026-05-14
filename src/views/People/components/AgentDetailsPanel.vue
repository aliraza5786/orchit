<template>
  <div
    :class="`max-w-[358px] bg-bg-surface  rounded-[6px] overflow-y-auto overflow-x-hidden relative ${
      props.showAgentPanel
        ? '!translate-x-0 w-full h-full min-w-full sm:min-w-[380px] overflow-y-auto'
        : '!translate-x-100 w-0 h-0'
    } transition-all`"
  >
    <!-- Header -->
    <div
      class="pt-[15px] pb-[15px] flex justify-between items-center border-b border-border px-3 sticky top-0 bg-bg-surface z-1"
    >
      <h5 class="text-[16px] font-medium">Agent Configuration</h5>
      <i
        class="cursor-pointer text-text-primary fa-solid fa-close"
        @click="$emit('close')"
      />
    </div>
    <!-- Body -->
    <div class="py-3 px-3">
      <SwitchTab :inSpace="true" v-model="activeTab" class="mb-2" :options="tabOptions" />
      <!-- Title -->
       <!-- {{ updateAgentData }} -->
      <section v-if="activeTab == 'configure'">
        <div class="space-y-6">
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
          <div class="flex items-center justify-between mb-1">
            <span class="text-base font-medium text-text-primary block"
              >Select Role</span
            >
          </div>
          <BaseSelectField
            size="md"
            :model-value="selectedRole"
            :options="roleOptions"
            placeholder="Select Role"
            :disabled="!canEditUser" 
            :loading="agentStore.isLoadingRoles"
          />
          <div class="flex items-center justify-between mb-1 mt-2">
            <span class="text-base font-medium text-text-primary block"
              >Select Job Role</span
            >
          </div>
          <BaseSelectField
            size="md"
            v-model="selectJobRole"
            :options="jobOptions"
            placeholder="Select Job Role"
          />
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
          <TagInput v-model="agentConfig.competencies" label="Competencies" />
          <TagInput
            v-model="agentConfig.conditions_rules"
            label="Conditions / Rules"
          />
          <TagInput
            v-model="agentConfig.modules"
            label="Modules/Permissions"
          />
          <div class="flex gap-2" v-if="transformedData?.length">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-border"
              v-model="isSheet"
            />
            <span class="text-sm text-text-primary"
              >Enable to create the agent for a selected sheet instead of all
              sheets</span
            >
          </div>
          <div class="space-y-1 relative w-full" ref="sheetRef" v-if="isSheet">
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
          <!-- Buttons -->
          <button
            @click="submitPersona"
            v-if="!isEditMode"
            :disabled="isLoading || !agentConfig.name"
            class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-primary-color text-white rounded-lg   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Saving...</span>
            <span v-else>Save Agent</span>
          </button>

          <div class="flex gap-4">
            <button
              @click="deleteAgent(agentConfig.id)"
              v-if="isEditMode"
              :disabled="agentStore.isDeletingAgent || !agentConfig.name"
              class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-red-600 text-white rounded-lg  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Deleting...</span>
              <span v-else>Delete Agent</span>
            </button>
            <button
              @click="updateAgent(agentConfig.id)"
              v-if="isEditMode"
              :disabled="agentStore.isUpdatingAgent || !agentConfig.name"
              class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-primary-color text-white rounded-lg  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Updating...</span>
              <span v-else>Update Agent</span>
            </button>
          </div>
        </div>
      </section>
      <!-- knowledge based -->
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
          :disabled="isKnowledgeLoading || !moduleSelected"
          class="w-full mt-4 px-4 py-2.5 text-sm rounded-lg cursor-pointer text-white bg-primary-color hover:bg-primary-color transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="isKnowledgeLoading">Saving...</span>
          <span v-else>Save Knowledge</span>
        </button>
      </div>
      <div v-if="activeTab === 'training'" class="space-y-6">
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
          <button @click="uploadConfig.files.splice(i, 1)" class="text-red-500">
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
          class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-primary-color text-white rounded-lg hover:bg-primary-color transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isUploading">Uploading...</span>
          <span v-else>Upload Training Content</span>
        </button>
      </div>
      <div class="flex flex-col" style="height: calc(87vh - 100px);" v-if="activeTab === 'prompt'">

  <div class="flex-1 overflow-y-auto p-4 space-y-3">

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 px-2 py-2">
      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          id="select-all"
          :checked="allSelected"
          @change="toggleSelectAll"
          class="h-4 w-4 rounded border-border cursor-pointer"
        />
        <label for="select-all" class="text-sm font-medium">
          Select All
        </label>
      </div>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter prompts..."
        class="px-3 py-1 text-sm border border-border rounded-lg"
      />
    </div>
      <div
  v-for="module in filteredModules"
  :key="module.module_title"
  class="border border-border rounded-lg overflow-hidden bg-bg-surface/30"
>
  <!-- Header -->
  <button
    @click="toggleModule(module.module_title)"
    class="w-full px-3 py-2 flex justify-between items-center hover:bg-bg-surface transition"
  >
    <span class="text-sm font-medium text-text-primary">
      {{ module.module_title }}
    </span>

    <i
      :class="[
        'fa-solid fa-chevron-down text-xs text-text-secondary transition-transform',
        openModules[module.module_title] ? 'rotate-180' : ''
      ]"
    ></i>
  </button>

  <!-- Content -->
  <div
    v-show="openModules[module.module_title]"
    class="py-2 space-y-1 border-t border-border bg-bg-input"
  >
    <div
      v-for="action in module.granted_actions"
      :key="action._id"
      class="flex items-start gap-2 hover:bg-bg-body px-3 py-2"
    >
      <div class="flex items-center h-5">
        <input
          type="checkbox"
          v-model="action.is_selected"
          :id="action._id"
          class="h-4 w-4 rounded border-border accent-primary-color cursor-pointer"
        />
      </div>

      <div class="ml-2 text-sm">
        <label
          :for="action._id"
          class="font-medium text-text-primary cursor-pointer select-none"
        >
          {{ action.title }}
        </label>

        <!-- <p v-if="action.prompt" class="text-xs text-text-secondary">
          {{ action.prompt }}
        </p> -->
      </div>
    </div>
  </div>
</div>

  </div>
  <div class="p-4 bg-bg-card border-t border-border shrink-0">
  <button
    @click="savePromptActions"
    :disabled="isSavingPrompt"
    class="w-full px-4 py-2.5 text-sm bg-primary-color text-white rounded-lg hover:bg-primary-color transition disabled:opacity-50"
  >
    <span v-if="isSavingPrompt">Saving...</span>
    <span v-else>Save Prompt</span>
  </button>
</div>
</div>
    </div>

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
     <AddCustomRoleModal
      v-if="showAddRoleModal"
      :show="showAddRoleModal"
      :workspaceId="workspaceId"
      :companyId="newCompanyId"
      @close="showAddRoleModal = false"
    />
    <ManagePermissionsModal
      v-if="showManagePermissionsModal"
      :show="showManagePermissionsModal"
      :companyId="newCompanyId"
      :initialRoleId="selectedRole"
      @close="showManagePermissionsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, defineAsyncComponent, onMounted, nextTick } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useAgentStore } from "../../../stores/agentStore";
import { useDeletePeopleVarDef } from "../../../queries/usePeople";
import AddCustomRoleModal from "../modals/AddCustomRoleModal.vue";
import { usePermissions } from "../../../composables/usePermissions";
const SwitchTab = defineAsyncComponent(
  () => import("../../../components/ui/SwitchTab.vue"),
);
const BaseSelectField = defineAsyncComponent(
  () => import("../../../components/ui/BaseSelectField.vue"),
);

const ConfirmModal = defineAsyncComponent(
  () => import("../../Product/modals/ConfirmDeleteModal.vue"),
);
import TagInput from "../../../components/ui/TagInput.vue";
import { toast } from "vue-sonner";
import { useSidePanelStore } from "../../../stores/sidePanelStore";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useSheets } from "../../../queries/useSheets";
import { useWorkspaceStore } from "../../../stores/workspace";
import { useRoute } from "vue-router";
import { useSingleWorkspaceCompany } from '../../../queries/useWorkspace'
import ManagePermissionsModal from "../modals/ManagePermissionsModal.vue";
const { workspaceId, moduleId } = useRouteIds();
const workspaceStore = useWorkspaceStore();
const sidePanelStore = useSidePanelStore();
const localVarValues = reactive<any>({});
const showDeleteModal = ref(false);
const selectedItem = ref<any>(null);
const agentStore = useAgentStore();
const selectJobRole = ref("");
const openLevel = ref(false);
const isSheet = ref(false);
const openSheet = ref(false);
const route = useRoute();
const activeTab = ref<"configure" | "knowledge" | "training" | "prompt">("configure");
const showAddRoleModal = ref(false);
const cardDetails = computed(() => sidePanelStore.selectedCardPeople);
const { canEditUser} = usePermissions();
const showManagePermissionsModal = ref(false);
const searchQuery = ref('')
type Action = {
  _id: string
  title: string
  slug: string
  prompt?: string
  is_selected: boolean
}

type Module = {
  module_id: string | null
  module_title: string
  module_type: string
  granted_actions: Action[]
}

const updateAgentData = computed(() => {
  return sidePanelStore.selectedCardPeople;
});
const openModules = ref<Record<string, boolean>>({})
const toggleModule = (title: string) => {
  openModules.value[title] = !openModules.value[title]
}
const filteredModules = computed(() => {
  if (!searchQuery.value) return moduleActions.value

  const query = searchQuery.value.toLowerCase()

  return moduleActions.value
    .map(module => {
      const filteredActions = module.granted_actions.filter(action =>
        action.title.toLowerCase().includes(query) ||
        (action.prompt && action.prompt.toLowerCase().includes(query))
      )

      return {
        ...module,
        granted_actions: filteredActions
      }
    })
    .filter(module => module.granted_actions.length > 0)
})
const tabOptions = [
  { label: "Agent Configure", value: "configure" },
  { label: "Knowledge Based", value: "knowledge" },
  { label: "Training", value: "training" },
  { label: "Prompt Flows", value: "prompt" },
];

interface ModuleAction {
  module_id: string | null;
  module_title: string;
  module_type: string;
  granted_actions: string[]; // only slugs when saving to backend
}

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  level: "JUNIOR" | "MID" | "SENIOR" | "EXPERT" | "LEAD";
  responsibilities: string[];
  skills: string[];
  competencies: string[];
  capabilities: string[];
  conditions_rules: string[];
  actions: string[];
  modules: string[];
  module_actions: ModuleAction[]; // <-- added for modules
}

const agentConfig = reactive<AgentConfig>({
  id: "",
  name: "",
  description: "",
  system_prompt: "",
  level: "MID",
  responsibilities: [],
  skills: [],
  competencies: [],
  capabilities: [],
  conditions_rules: [],
  actions: [],
  modules:[],
   module_actions: []
});
const availableAgentsLevels = [
  { _id: "1", title: "Expert", value: "EXPERT" },
  { _id: "2", title: "Lead", value: "LEAD" },
  { _id: "3", title: "Senior", value: "SENIOR" },
  { _id: "4", title: "Mid", value: "MID" },
  { _id: "5", title: "Junior", value: "JUNIOR" },
];
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
const props = defineProps({
  showAgentPanel: { type: Boolean, required: true },
});
const { data: workspaceData } = useSingleWorkspaceCompany(workspaceId, {
  enabled: computed(() => !!workspaceId.value), //reactive
});
const newCompanyId = computed(() => workspaceData.value?.company_id ?? null);
const isEditMode = computed(() => !!agentConfig.id);
watch(
  () => updateAgentData.value,
  (val) => {
    if (val?.module_id) {
      resetAgentConfig();
    }
  },
);

function selectSheet(id: string) {
  selected_sheet_id.value = id;
  openSheet.value = false;
}
const localTitle = ref(cardDetails.value?.title ?? "");
const lane = ref(cardDetails.value?._id ?? "");
const agentsRolesPermissions = computed(() => {
  return agentStore.agentsRolesPermissions;
});
const { data } = useSheets({
  workspace_id: workspaceId,
  workspace_module_id: moduleId,
});
const moduleSelected = computed(() => workspaceStore.selectedAgent);
// Watch for prop updates if details change
watch(
  () => cardDetails.value?.title,
  (val) => {
    localTitle.value = val;
    lane.value = cardDetails.value?._id;
  },
);
const selectedLevelLabel = computed(() => {
  return (
    availableAgentsLevels.find((l) => l.value === agentConfig.level)?.title ||
    availableAgentsLevels[0].title
  );
});
const description = ref(cardDetails.value?.description ?? "");

watch(
  () => cardDetails.value,
  () => {
    description.value = cardDetails.value?.description ?? "";
  },
);
watch(
  () => cardDetails.value,
  () => {
    // clear previous values
    Object.keys(localVarValues).forEach((key) => delete localVarValues[key]);
    if (cardDetails.value?.variable_values) {
      cardDetails.value.variable_values.forEach((v: any) => {
        localVarValues[v.module_variable_id] = v.value;
      });
    }
  },
  { immediate: true },
);
const emit = defineEmits([
  "close",
  "update:details",
  "comment:post",
  "priority:change",
  "persona-updated",
]);

const form = ref<any>({
  startDate: "",
  endDate: "",
});

const startDate = computed(() => cardDetails.value || null);
watch(startDate, (newVal) => {
  form.value = {
    ...form.value,
    startDate: newVal,
  };
});

const queryClient = useQueryClient();
const selectedRole = ref(cardDetails.value?.workspace_access_role_id ?? "");

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

  // Add the "Add New Role" option at the end
  roles.push({
    _id: "ADD_NEW_ROLE",
    title: "➕ Add New Role",
    customClass:
      "text-primary-color font-medium sticky bottom-0 hover:bg-bg-dropdown-menu-hover transition-all duration-150 bg-bg-dropdown border-t border-border w-full",
    isAction: true,
  },
  {
    _id: "MANAGE_PERMISSIONS",
    title: "🛠 Manage Permissions",
    customClass:
      "text-primary-color font-medium sticky bottom-0 hover:bg-bg-dropdown-menu-hover transition-all duration-150 bg-bg-dropdown border-t border-border w-full",
    isAction: true,
  },
);

  return roles;
});
// update agent

const jobOptions = computed(() => {
  let roles: any[] = [];
  roles = (agentsRolesPermissions.value?.job_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }));
  return roles;
});
const selectLevel = (value: string) => {
  agentConfig.level = value as any;
  openLevel.value = false;
};
const isMounted = ref(false);

onMounted(() => {
  nextTick(() => {
    isMounted.value = true;
  });
});

watch(
  () => cardDetails.value?._id,
  () => {
    selectJobRole.value = cardDetails.value?.workspace_role_id ?? "";
  },
  { immediate: true },
);
// Watcher 2
watch(
  () => cardDetails.value?._id,
  () => {
    selectedRole.value = cardDetails.value?.workspace_access_role_id ?? "";
  },
  { immediate: true },
);
watch(
  () => updateAgentData.value,
  (agent) => {
    if (!agent) return;
    agentConfig.id = agent._id;
    agentConfig.name = agent.name;
    agentConfig.description = agent.description;
    agentConfig.system_prompt = agent.system_prompt;
    agentConfig.level = agent.level;
    agentConfig.responsibilities = [...(agent.responsibilities || [])];
    agentConfig.skills = [...(agent.skills || [])];
    agentConfig.competencies = [...(agent.competencies || [])];
    agentConfig.capabilities = [...(agent.capabilities || [])];
    agentConfig.conditions_rules = [...(agent.conditions_rules || [])];
  },
  { immediate: true }
);
const { mutate: deleteVarDef, isPending: isDeleting } = useDeletePeopleVarDef();

function confirmDelete() {
  if (!selectedItem.value) return;
  deleteVarDef(
    {
      id: selectedItem.value._id,
    },
    {
      onSuccess: () => {
        toast.success("Variable deleted successfully");
        showDeleteModal.value = false;
        refetchCardDetails();
      },
      onError: () => {
        toast.error("Failed to delete variable");
      },
    },
  );
}

function refetchCardDetails() {
  queryClient.invalidateQueries({ queryKey: ["people-var"] });
  queryClient.invalidateQueries({ queryKey: ["people-lists"] });
}
const isLoading = ref(false);
const sheet_id = computed(() => (data.value ? data.value[0]?._id : ""));
const selected_sheet_id = ref<any>(
  localStorage.getItem("selected_sheet_id") || sheet_id.value,
);
const resetAgentConfig = () => {
  agentConfig.id = "";
  agentConfig.name = "";
  agentConfig.description = "";
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
  if (!agentConfig.name || !selectedRole.value) {
    toast.error("Please fill in required fields!");
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      module_id: updateAgentData.value?.module_id,
      module_name: updateAgentData.value?.title,
      sheet_id: selected_sheet_id.value,
      sheet_name: moduleSelected.value,
      name: agentConfig.name,
      description: agentConfig.description,
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
    emit("persona-updated");
  } catch (err) {
    isLoading.value = false;
  } finally {
    await loadAgentSettings();
    await fetchAssignedAgents();
  }
};

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
const selectedSheetTitle = computed(() => {
  const found = transformedData.value.find(
    (sheet) => sheet._id === selected_sheet_id.value,
  );
  return found ? found.title : "Select sheet";
});
const isLoadingSettings = ref(false);
const selectedAgentId = ref("");
const selectedModule = computed(() => {
  return route.path.includes("peak") ? "Peak" : moduleSelected.value;
});
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
    // "module",
    // moduleId.value,
  );
}
const updateAgent = async (agentId: string) => {
  if (!agentId) return;

  try {
    // Build payload with all agent data, including module actions
    const currentPayload = {
      name: agentConfig.name,
      description: agentConfig.description,
      system_prompt: agentConfig.system_prompt,
      level: agentConfig.level,
      responsibilities: agentConfig.responsibilities,
      skills: agentConfig.skills,
      competencies: agentConfig.competencies,
      capabilities: agentConfig.capabilities,
      conditions_rules: agentConfig.conditions_rules,
      actions: agentConfig.actions,               // flat selected actions
      module_actions: agentConfig.module_actions, // selected module actions
      modules: agentConfig.modules,
      workspace_role_id: selectJobRole.value,
      workspace_access_role_id: selectedRole.value,
    };

    // Call store to update agent
    await agentStore.updateSelectedAgent(workspaceId.value, currentPayload, agentId);

    // Refresh data after update
    await fetchAssignedAgents();
    await loadAgentSettings();

    // Notify parent/component
    emit("persona-updated");

  } catch (err) {
    console.error("Failed to update agent:", err);
    toast.error("Failed to update agent");
  }
};
const deleteAgent = async (agent: string) => {
  await agentStore.deleteSelectedAgent(workspaceId.value, agent);
  await fetchAssignedAgents();
  await loadAgentSettings();
  resetAgentConfig();
  emit("persona-updated");
};
// knowledge based
const isKnowledgeLoading = ref(false);
const sourceList = [
  { label: "Internal Ticket", value: "INTERNAL_TICKET" },
  { label: "Internal Module", value: "INTERNAL_MODULE" },
  { label: "Internal Sheet", value: "INTERNAL_SHEET" },
  { label: "Web Search", value: "WEB_SEARCH" },
  { label: "Prompt", value: "PROMPT" },
];
// Dropdown open state
const openDropdowns = reactive<Record<string, boolean>>({
  INTERNAL_TICKET: false,
  INTERNAL_MODULE: false,
  INTERNAL_SHEET: false,
  WEB_SEARCH: false,
  PROMPT: false,
});
function toggleSourceDropdown(source: string) {
  openDropdowns[source] = !openDropdowns[source];
}
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
// training content
const openType = ref(false);
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
const availableUploadTypes = [
  { value: "TEXT" as UploadType, label: "Text Content" },
  { value: "URL" as UploadType, label: "URL/Link" },
  { value: "CMS_PAGE" as UploadType, label: "CMS Page" },
  { value: "MIXED" as UploadType, label: "Mixed Content" },
];
// Loading state
const isUploading = ref(false);
const selectedTypeLabel = computed(() => {
  const found = availableUploadTypes.find((t) => t.value === uploadConfig.type);
  return found ? found.label : uploadConfig.type;
});
const selectType = (type: UploadType) => {
  uploadConfig.type = type;
  openType.value = false;
};
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

const moduleActions = ref<Module[]>([])

const allSelected = computed(() => {
  return moduleActions.value.length > 0 &&
    moduleActions.value.every(module =>
      module.granted_actions.every(action => action.is_selected)
    )
})
import { toRaw } from 'vue'

watch(
  () => updateAgentData.value.module_actions,
  (val) => {
    moduleActions.value = val
      ? structuredClone(toRaw(val))
      : []
  },
  { immediate: true }
)
const toggleSelectAll = () => {
  const value = !allSelected.value

  moduleActions.value.forEach(module => {
    module.granted_actions.forEach(action => {
      action.is_selected = value
    })
  })
}

const isSavingPrompt = ref(false);
const savePromptActions = async () => {
  if (!workspaceId.value) return;

  isSavingPrompt.value = true;

  try {
    // Convert moduleActions.value to simple structure for backend
    const modulesToSave: ModuleAction[] = moduleActions.value.map(module => ({
      module_id: module.module_id,
      module_title: module.module_title,
      module_type: module.module_type,
      granted_actions: module.granted_actions
        .filter(action => action.is_selected)
        .map(action => action.slug) // only slugs
    }));

    agentConfig.module_actions = modulesToSave;

    // Also flatten all selected actions if needed
    agentConfig.actions = moduleActions.value
      .flatMap(module => module.granted_actions)
      .filter(action => action.is_selected)
      .map(action => action.slug);

    await updateAgent(agentConfig.id);

    emit("persona-updated");

    if (searchQuery.value) searchQuery.value = "";

  } catch (err) {
    console.error(err);
    toast.error("Failed to save prompt actions");
  } finally {
    isSavingPrompt.value = false;
  }
};
</script>

<style scoped>
.custom-select {
  width: 100%;
  height: 32px; /* same as size="sm" */
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--border, #d1d5db);
  background-color: var(--bg-input, #fff);
  color: var(--text-primary, #111);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image: url("data:image/svg+xml;utf8,<svg fill='%23888' height='20' viewBox='0 0 20 20' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M6 8l4 4 4-4'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.custom-select:focus {
  border: 1px solid var(--border, #d1d5db);
  box-shadow: 0;
}

.custom-select option {
  background: var(--bg-input, white);
  color: var(--text-primary, #111);
  border: 0;
}
</style>
