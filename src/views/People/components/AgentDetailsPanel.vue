<template>
  <div
    :class="`max-w-[358px] bg-bg-card  rounded-lg overflow-y-auto overflow-x-hidden relative ${
      props.showAgentPanel
        ? '!translate-x-0 w-full h-full min-w-full sm:min-w-[380px] overflow-y-auto'
        : '!translate-x-100 w-0 h-0'
    } transition-all`"
  >
    <!-- Header -->
    <div
      class="pt-[17px] pb-[18px] flex justify-between items-center border-b border-border px-5 sticky top-0 bg-bg-card z-1"
    >
      <h5 class="text-[16px] font-medium">Agent Profile</h5>
      <i
  class="cursor-pointer text-text-primary fa-solid fa-close"
  @click="$emit('close')"
/>
    </div>

    <!-- Body -->
    <div class="py-4 px-5">
      <SwitchTab v-model="activeTab" class="mb-2" :options="tabOptions" />
      <!-- Title -->
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
      </section>

      <section v-if="activeTab == 'knowledge'" class="mt-3">
        <span class="text-base text-text-primary">Worked On</span>
        <ul
          v-if="cardDetails?.assigned_cards?.length > 0"
          class="border border-border space-y-1 p-2.5 mt-1 rounded-lg"
        >
          <li
            class="p-2"
            v-for="(item, index) in cardDetails?.assigned_cards"
            :key="index"
          >
            <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
            <p class="text-xs text-text-secondary">
              Design Project . Olivia Updated on April 9, 2025
            </p>
          </li>
        </ul>
      </section>
      <section v-if="activeTab == 'training'" class="mt-3">
        <span class="text-base text-text-primary">history</span>
        <ul
          v-if="cardDetails?.assignment_history?.length > 0"
          class="border border-border space-y-1 p-2.5 mt-1 rounded-lg"
        >
          <li
            class="p-2"
            v-for="(item, index) in cardDetails?.assignment_history"
            :key="index"
          >
            <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
            <p class="text-xs text-text-secondary">
              Design Project . Olivia Updated on April 9, 2025
            </p>
          </li>
        </ul>
      </section> 

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
  </div>  
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, defineAsyncComponent } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useAgentStore } from "../../../stores/agentStore";
import {  useDeletePeopleVarDef } from "../../../queries/usePeople";
const SwitchTab = defineAsyncComponent(() =>
  import("../../../components/ui/SwitchTab.vue")
);
const BaseSelectField = defineAsyncComponent(() =>
  import("../../../components/ui/BaseSelectField.vue")
);

const ConfirmModal = defineAsyncComponent(() =>
  import("../../Product/modals/ConfirmDeleteModal.vue")
);
import TagInput from "../../../components/ui/TagInput.vue";
import { toast } from "vue-sonner";
import { useSidePanelStore } from "../../../stores/sidePanelStore";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useSheets } from "../../../queries/useSheets";
import { useWorkspaceStore } from "../../../stores/workspace";
import { useRoute } from "vue-router";
const { workspaceId, moduleId } = useRouteIds()
const workspaceStore = useWorkspaceStore()
const sidePanelStore = useSidePanelStore(); 
const localVarValues = reactive<any>({});
const showDeleteModal = ref(false);
const selectedItem = ref<any>(null);
const agentStore = useAgentStore()
const selectJobRole = ref("")
const openLevel = ref(false);
const isSheet = ref(false);
const openSheet = ref(false);
const route = useRoute()
const activeTab = ref<"configure" | "knowledge" | "training">("configure");
const cardDetails = computed(() => sidePanelStore.selectedCardPeople);
const agentsData = computed(() => {
  return agentStore.agentSettings.agent;
});
const tabOptions = [
  { label: "Agent Configure", value: "configure" },
  { label: "Knowledge Based", value: "knowledge" },
  { label: "Training", value: "training" },
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
function selectSheet(id: string) {
  selected_sheet_id.value = id;
  openSheet.value = false;
}
const localTitle = ref(cardDetails.value?.title ?? "");
const lane = ref(cardDetails.value?._id ?? "");
const agentsRolesPermissions = computed(() =>{
  return agentStore.agentsRolesPermissions;
})
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
  }
);
const selectedLevelLabel = computed(() => {
  return (
    availableAgentsLevels.find((l) => l.value === agentConfig.level)?.title ||
    availableAgentsLevels[0].title
  );
});
const description = ref(cardDetails.value?.description ?? "");
console.log("card details data", cardDetails.value);

watch(
  () => cardDetails.value,
  () => {
    description.value = cardDetails.value?.description ?? "";
  }
);

watch(
  () => cardDetails.value,
  () => {
    // clear previous values
    Object.keys(localVarValues).forEach(key => delete localVarValues[key]);
    console.log(cardDetails.value, 'crdd')
    if (cardDetails.value?.variable_values) {
      cardDetails.value.variable_values.forEach((v: any) => {
        localVarValues[v.module_variable_id] = v.value;
      });
    }
  },
  { immediate: true }
);
const emit = defineEmits([
  "close",
  "update:details",
  "comment:post",
  "priority:change",
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
const selectLevel = (value: string) => {
  agentConfig.level = value as any;
  openLevel.value = false;
};
watch(
  () => cardDetails.value?.workspace_access_role_id,
  (newRoleId) => {
    selectedRole.value = newRoleId ?? "";
  }
);
watch(
  () => cardDetails.value?._id,
  () => {
    selectedRole.value = cardDetails.value?.workspace_access_role_id ?? "";
  },
  { immediate: true }
);

const { mutate: deleteVarDef, isPending: isDeleting } = useDeletePeopleVarDef();

function confirmDelete() {
  if (!selectedItem.value) return;
  deleteVarDef({
    id: selectedItem.value._id
  }, {
    onSuccess: () => {
      toast.success("Variable deleted successfully");
      showDeleteModal.value = false;
      refetchCardDetails();
    },
    onError: () => {
      toast.error("Failed to delete variable");
    }
  });
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
const originalAgentConfig = ref<Partial<AgentConfig> | null>(null);
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
