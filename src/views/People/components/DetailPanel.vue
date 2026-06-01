<template>
  <div
    :class="`max-w-[358px] bg-bg-surface rounded-[6px] border border-border overflow-y-auto overflow-x-hidden relative ${
      props.showPanel
        ? '!translate-x-0 w-full h-full min-w-full sm:min-w-[380px] overflow-y-auto'
        : '!translate-x-100 w-0 h-0'
    } transition-all`"
  >
    <!-- Header -->
    <div
      class="pt-[10.5px] pb-[10px] flex justify-between items-center border-b border-border px-3 sticky top-0 bg-bg-surface z-1"
    >
      <h5 class="text-[16px] font-medium">Profile</h5>
      <button
        class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
        @click="$emit('close')"
        aria-label="Close panel"
      >
        <i class="fa-solid fa-xmark text-[16px]"></i>
      </button>
    </div>

    <!-- Body -->
    <div class="py-3 px-3">
      <div class="bg-bg-surface/50 p-2 rounded-lg flex gap-2 items-center">
        <img
          v-if="cardDetails?.avatar"
          :src="cardDetails?.avatar"
          class="w-10 h-10 rounded-full"
          alt="avartar"
        />

        <div
          v-else
          class="min-w-10 max-h-10 aspect-square bg-bg-body flex justify-center items-center rounded-full text-white text-sm font-semibold"
          :style="{
            backgroundColor:
              cardDetails?.name || cardDetails?.email
                ? avatarColor({ email: cardDetails?.email })
                : '',
          }"
        >
          <template v-if="cardDetails?.name">{{
            getInitials(cardDetails.name)
          }}</template>
          <template v-else-if="cardDetails?.email">{{
            getEmailInitials(cardDetails.email)
          }}</template>
          <i v-else class="fa-solid fa-user text-text-primary"></i>
        </div>
        <div>
          <h1 class="text-base font-medium text-text-primary cursor-pointer">
            {{ cardDetails?.name ?? cardDetails?.title }}
          </h1>
          <p class="text-sm font-medium text-text-secondary cursor-pointer">
            {{ cardDetails?.email }}
          </p>
        </div>
      </div>
      <SwitchTab
        :inSpace="true"
        v-model="activeTab"
        class="my-2"
        :options="tabOptions"
      />

      <div class="flex flex-col mt-2">
        <h1 class="text-base font-medium text-text-primary cursor-pointer">
          Task Progress
        </h1>
        <ProgressBar
          class="mt-2"
          :progress="progressPercentage"
          fillColor="bg-primary-color "
          :indeterminate="true"
        />
        <span class="text-sm text-text-secondary mt-2">
          Completed {{ completedTasks }} tasks out of {{ totalTasks }}</span
        >
      </div>
      <!-- Title -->
      <section v-if="activeTab == 'details'">
        <div class="mb-3 capitalize mt-3">
          <template v-if="editingTitle">
            <input
              ref="titleInput"
              v-model="localTitle"
              @blur="saveTitle"
              @keydown.enter.prevent="saveTitle"
              @keydown.esc.prevent="cancelEdit"
              class="border border-border rounded px-2 py-1 w-full text-xl font-medium"
              type="text"
            />
          </template>
          <template v-else>
            <h1
              class="text-xl font-medium text-text-primary cursor-pointer"
              @click="editTitle"
            >
              {{ localTitle }}
            </h1>
          </template>
        </div>
        <!-- work space  -->
        <div class="mt-5 mb-4 relstive">
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-xs uppercase tracking-wider text-text-secondary block mb-1"
              >Select Role</span
            >
          </div>
          <BaseSelectField
            size="md"
            :model-value="selectedRole"
            :options="roleOptions"
            placeholder="Select Role"
            @click.stop="handleRoleClick"
            @update:modelValue="handleRoleChange"
            :disabled="!canEditUser"
            :loading="isLoadingWorkspaceRoles"
          />
          <div
            v-if="cardDetails?.slug?.includes('agent')"
            class="flex items-center justify-between mb-1 mt-3"
          >
            <span class="text-base font-medium text-text-primary block"
              >Select Job Role</span
            >
          </div>
          <BaseSelectField
            v-if="cardDetails?.slug?.includes('agent')"
            size="md"
            :model-value="selectJobRole"
            :options="jobOptions"
            placeholder="Select Job Role"
            @click.stop="handleRoleClick"
            @update:modelValue="handleRoleChange"
            :disabled="!canEditUser"
            :loading="isLoadingWorkspaceRoles"
          />
        </div>
        <div class="space-y-4">
          <div
            v-if="canViewVariable"
            v-for="(item, index) in peopleVar"
            :key="item._id || index"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between group h-5 capitalize">
              <div class="text-xs uppercase tracking-wider text-text-secondary">
                {{ item.title }}
              </div>
              <div v-if="canEditUser" class="flex items-center gap-1">
                <button
                  v-if="canEditVariable"
                  @click="handleEditVar(item)"
                  class="text-text-secondary hover:text-primary-color transition-colors p-1"
                  title="Edit variable"
                >
                  <i class="fa-regular fa-pen-to-square text-[11px]"></i>
                </button>
                <button
                  v-if="canDeleteVariable"
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
              v-if="item.variable_type_id?.title === 'Select'"
              size="md"
              :model-value="localVarValues[item._id]"
              :placeholder="`Select ${item.title}`"
              @click.stop
              :defaultValue="getDefaultValue(item?._id)"
              :options="item?.data?.map((e: any) => ({ _id: e, title: e }))"
              :cardId="cardDetails?._id"
              :disabled="!canEditUser"
              @update:modelValue="(val: any) => handleSelect(val, item._id)"
            />

            <BaseMultiSelect
              v-else-if="item.variable_type_id?.title === 'Multi Select'"
              :disabled="!canEditUser"
              size="md"
              :options="item?.data?.map((e: any) => ({ _id: e, title: e }))"
              :placeholder="`Select ${item.title}`"
              :model-value="
                Array.isArray(localVarValues[item._id])
                  ? localVarValues[item._id]
                  : localVarValues[item._id]
                    ? [localVarValues[item._id]]
                    : []
              "
              @update:modelValue="(val: any) => handleSelect(val, item._id)"
            />

            <!-- Radio Type -->
            <BaseRadioGroup
              v-else-if="item.variable_type_id?.title === 'Radio'"
              :disabled="!canEditUser"
              :options="item?.data?.map((e: any) => ({ _id: e, title: e }))"
              :model-value="localVarValues[item._id]"
              :name="item._id"
              @update:modelValue="(val: any) => handleSelect(val, item._id)"
            />

            <!-- Checkbox Type -->
            <BaseCheckboxGroup
              v-else-if="item.variable_type_id?.title === 'Checkbox'"
              :disabled="!canEditUser"
              :options="item?.data?.map((e: any) => ({ _id: e, title: e }))"
              :model-value="localVarValues[item._id]"
              @update:modelValue="(val: any) => handleSelect(val, item._id)"
            />

            <!-- Textarea Type -->
            <BaseTextAreaField
              v-else-if="item.variable_type_id?.title === 'Textarea'"
              :disabled="!canEditUser"
              placeholder="Enter text..."
              :model-value="localVarValues[item._id]"
              @update:modelValue="
                (val: any) => (localVarValues[item._id] = val)
              "
              @blur="() => handleSelect(localVarValues[item._id], item._id)"
            />

            <!-- Date & Time Types -->
            <div
              v-else-if="
                ['Date', 'Date & Time'].includes(item.variable_type_id?.title)
              "
              class="h-10 px-3 flex items-center gap-1 rounded-lg bg-bg-input border border-border"
            >
              <i class="fa-regular fa-calendar text-[14px]"></i>
              <DatePicker
                :inSpace="true"
                :disabled="!canEditUser"
                placeholder="Set date"
                class="w-full"
                size="md"
                :model-value="localVarValues[item._id]"
                emit-as="ymd"
                @update:modelValue="(val: any) => handleSelect(val, item._id)"
              />
            </div>

            <!-- Time Type -->
            <div
              v-else-if="item.variable_type_id?.title === 'Time'"
              class="h-10 px-3 flex items-center gap-1 rounded-lg bg-bg-input border border-border"
            >
              <i class="fa-regular fa-clock text-[14px]"></i>
              <TimePicker
                :disabled="!canEditUser"
                placeholder="Set time"
                class="w-full"
                size="md"
                :model-value="localVarValues[item._id]"
                @update:modelValue="(val: any) => handleSelect(val, item._id)"
              />
            </div>

            <!-- File Upload -->
            <FileUploader
              v-else-if="item.variable_type_id?.title === 'File Upload'"
              :disabled="!canEditUser"
              label=""
              :model-value="localVarValues[item._id]"
              @update:model-value="(val: any) => handleSelect(val, item._id)"
            />

            <!-- Switch/Toggle -->
            <div
              v-else-if="item.variable_type_id?.title === 'Switch/Toggle'"
              class="flex items-center gap-2 py-1"
            >
              <Checkbox
                :disabled="!canEditUser"
                :checked="!!localVarValues[item._id]"
                @change="(e: any) => handleSelect(e.target.checked, item._id)"
                label="Enable"
              />
            </div>

            <!-- Person Type -->
            <AssigmentDropdown
              v-else-if="item.variable_type_id?.title === 'Person'"
              :disabled="!canEditUser"
              :seat="localVarValues[item._id]"
              @assign="(users: any) => handleSelect(users, item._id)"
            />

            <!-- Range/Slider Type -->
            <div
              v-else-if="item.variable_type_id?.title === 'Range/Slider'"
              class="space-y-1 py-1"
            >
              <div
                class="flex justify-between text-[10px] text-text-secondary px-1"
              >
                <span>Min: {{ item.data?.[0] || 0 }}</span>
                <span class="font-bold text-primary-color">{{
                  localVarValues[item._id] ?? item.data?.[0] ?? 0
                }}</span>
                <span>Max: {{ item.data?.[1] || 100 }}</span>
              </div>
              <input
                type="range"
                :min="Number(item.data?.[0]) || 0"
                :max="Number(item.data?.[1]) || 100"
                :disabled="!canEditUser"
                class="w-full h-1.5 bg-bg-input rounded-lg appearance-none cursor-pointer accent-primary-color"
                :value="localVarValues[item._id] ?? item.data?.[0] ?? 0"
                @input="
                  (e: any) => handleSelect(Number(e.target.value), item._id)
                "
              />
            </div>

            <!-- Default: TextField -->
            <BaseTextField
              v-else
              :disabled="
                !canEditUser || item.variable_type_id?.title === 'Label'
              "
              :type="
                item.variable_type_id?.title === 'Number'
                  ? 'number'
                  : item.variable_type_id?.title === 'Color Picker'
                    ? 'color'
                    : item.variable_type_id?.title === 'Email'
                      ? 'email'
                      : item.variable_type_id?.title === 'Password'
                        ? 'password'
                        : 'text'
              "
              placeholder="Enter value..."
              :model-value="localVarValues[item._id]"
              @update:modelValue="
                (val: any) => (localVarValues[item._id] = val)
              "
              @blur="() => handleSelect(localVarValues[item._id], item._id)"
            />
          </div>
        </div>
        <button
          @click="canCreateVariable && (isCreateVar = true)"
          :disabled="!canCreateVariable"
          :class="[
            'w-full mt-6 py-2 px-4 text-sm font-semibold text-white bg-primary-color rounded-lg border border-primary-color flex items-center justify-center gap-2 transition-all duration-150',
            canCreateVariable
              ? 'cursor-pointer active:scale-95'
              : 'cursor-not-allowed opacity-90',
          ]"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          Add Custom Fields
        </button>
      </section>

      <section v-if="activeTab == 'tasks'" class="mt-3">
        <span class="text-base text-text-primary">Worked On</span>
        <ul
          v-if="hasAssignedTasks"
          class="border border-border space-y-1 p-2.5 mt-1 rounded-lg"
        >
          <li
            class="p-2"
            v-for="(item, index) in assignedTasks"
            :key="item?._id ?? index"
          >
            <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
            <p class="text-xs text-text-secondary">
              Design Project . Olivia Updated on April 9, 2025
            </p>
          </li>
        </ul>
        <EmptyState
          v-else
          icon="fa-regular fa-clipboard-list"
          title="No tasks yet"
          description="Tasks this person is assigned to will show up here."
          container-class="px-2 py-10"
        />
      </section>
      <section v-if="activeTab == 'history'" class="mt-3">
        <span class="text-base text-text-primary">History</span>
        <ul
          v-if="hasHistoryItems"
          class="border border-border space-y-1 p-2.5 mt-1 rounded-lg"
        >
          <li
            class="p-2"
            v-for="(item, index) in historyList"
            :key="item?._id ?? index"
          >
            <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
            <p class="text-xs text-text-secondary">
              Design Project . Olivia Updated on April 9, 2025
            </p>
          </li>
        </ul>
        <EmptyState
          v-else
          icon="fa-regular fa-clock-rotate-left"
          title="No history yet"
          description="Role changes and assignment activity for this person will appear here."
          container-class="px-2 py-10"
        />
      </section>
    </div>
    <AddCustomRoleModal
      v-if="showAddRoleModal"
      :show="showAddRoleModal"
      :workspaceId="workspaceId"
      :companyId="newCompanyId"
      :inSpace="true"
      @close="showAddRoleModal = false"
    />

    <CreateVariableModal
      v-model="isCreateVar"
      v-if="isCreateVar"
      @refetchCardDetails="refetchCardDetails"
      sheetID=""
    />

    <EditVariableModal
      v-if="isEditVar"
      v-model="isEditVar"
      @refetchCardDetails="refetchCardDetails"
      @update-variable="handleVariableDefinitionUpdate"
      :variable="selectedVarToEdit"
      :cardId="cardDetails?._id"
      sheetID=""
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

    <ManagePermissionsModal
      :inSpace="true"
      v-if="showManagePermissionsModal"
      :show="showManagePermissionsModal"
      :companyId="newCompanyId"
      :initialRoleId="selectedRole"
      @close="showManagePermissionsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, defineAsyncComponent } from "vue";
import { useMoveCard } from "../../../queries/useSheets";
import { nextTick } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useAgentStore } from "../../../stores/agentStore";
import {
  usePeopleVar,
  useUpdatePeopleVarDef,
  useDeletePeopleVarDef,
} from "../../../queries/usePeople";
const ProgressBar = defineAsyncComponent(
  () => import("../../../components/ui/ProgressBar.vue"),
);
const SwitchTab = defineAsyncComponent(
  () => import("../../../components/ui/SwitchTab.vue"),
);
const BaseSelectField = defineAsyncComponent(
  () => import("../../../components/ui/BaseSelectField.vue"),
);
const Checkbox = defineAsyncComponent(
  () => import("../../../components/ui/Checkbox.vue"),
);
const BaseMultiSelect = defineAsyncComponent(
  () => import("../../../components/ui/BaseMultiSelect.vue"),
);
const BaseRadioGroup = defineAsyncComponent(
  () => import("../../../components/ui/BaseRadioGroup.vue"),
);
const BaseCheckboxGroup = defineAsyncComponent(
  () => import("../../../components/ui/BaseCheckboxGroup.vue"),
);
const BaseTextAreaField = defineAsyncComponent(
  () => import("../../../components/ui/BaseTextAreaField.vue"),
);
const FileUploader = defineAsyncComponent(
  () => import("../../../components/ui/FileUploader.vue"),
);
const BaseTextField = defineAsyncComponent(
  () => import("../../../components/ui/BaseTextField.vue"),
);
const AssigmentDropdown = defineAsyncComponent(
  () => import("../../Product/components/AssigmentDropdown.vue"),
);
const DatePicker = defineAsyncComponent(
  () => import("../../Product/components/DatePicker.vue"),
);
const TimePicker = defineAsyncComponent(
  () => import("../../Product/components/TimePicker.vue"),
);
const CreateVariableModal = defineAsyncComponent(
  () => import("../modals/PeopleCreateVariableModal.vue"),
);
const EditVariableModal = defineAsyncComponent(
  () => import("../modals/PeopleEditVariableModal.vue"),
);
const ConfirmModal = defineAsyncComponent(
  () => import("../../Product/modals/ConfirmDeleteModal.vue"),
);
const ManagePermissionsModal = defineAsyncComponent(
  () => import("../modals/ManagePermissionsModal.vue"),
);
const EmptyState = defineAsyncComponent(
  () => import("../../../components/ui/EmptyState.vue"),
);
import { getInitials } from "../../../utilities";
import { avatarColor } from "../../../utilities/avatarColor";

function getEmailInitials(email: string): string {
  const local = email.split("@")[0] || "";
  return local.slice(0, 2).toUpperCase();
}
import { useWorkspaceStore } from "../../../stores/workspace";

// workspace roles
import { useWorkspaceRoles, useAssignRole } from "../../../queries/usePeople";
import { toast } from "vue-sonner";
import { useSidePanelStore } from "../../../stores/sidePanelStore";
import { usePermissions } from "../../../composables/usePermissions";
import { useRouteIds } from "../../../composables/useQueryParams";
const { workspaceId } = useRouteIds();
const {
  canEditUser,
  canCreateVariable,
  canViewVariable,
  canEditVariable,
  canDeleteVariable,
} = usePermissions();
const sidePanelStore = useSidePanelStore();
const localVarValues = reactive<any>({});
const isCreateVar = ref(false);
const isEditVar = ref(false);
const showManagePermissionsModal = ref(false);
const showDeleteModal = ref(false);
const selectedVarToEdit = ref<any>(null);
const selectedItem = ref<any>(null);
const agentStore = useAgentStore();
const selectJobRole = ref("");
const activeTab = ref<"details" | "tasks" | "history">("details");
const cardDetails = computed(() => sidePanelStore.selectedCardPeople);
const tabOptions = [
  { label: "Details", value: "details" },
  { label: "Tasks", value: "tasks" },
  { label: "History", value: "history" },
];
const { data: peopleVar } = usePeopleVar(workspaceId.value);
const props = defineProps({
  showPanel: { type: Boolean, required: true },
});

const editingTitle = ref(false);
const localTitle = ref(cardDetails.value?.title ?? "");
const lane = ref(cardDetails.value?._id ?? "");
const agentsRolesPermissions = computed(() => {
  return agentStore.agentsRolesPermissions;
});
// Watch for prop updates if details change
watch(
  () => cardDetails.value?.title,
  (val) => {
    localTitle.value = val;
    lane.value = cardDetails.value?._id;
  },
);

const description = ref(cardDetails.value?.description ?? "");
console.log("card details data", cardDetails.value);

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
  "role-assigned",
  "refetch-people",
  "update-variable",
]);

const titleInput = ref<HTMLInputElement | null>(null);

function editTitle() {
  editingTitle.value = true;
  nextTick(() => {
    titleInput.value?.focus();
    titleInput.value?.select();
  });
}

function saveTitle() {
  if (!localTitle.value.trim()) {
    localTitle.value = cardDetails.value?.title ?? "";
  }

  // Update the backend
  moveCard.mutate({
    card_id: cardDetails.value._id,
    variables: {
      "card-title": localTitle.value.trim(),
    },
  });

  editingTitle.value = false;
}

function cancelEdit() {
  localTitle.value = cardDetails.value?.title ?? "";
  editingTitle.value = false;
}

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
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["get-sheets"],
    });
    queryClient.invalidateQueries({
      queryKey: ["sheet-list"],
    });
    queryClient.invalidateQueries({
      queryKey: ["roles"],
    });
  },
});
const handleSelect = (val: any, slug: any) => {
  localVarValues[slug] = val;
  emit("update-variable", cardDetails.value, slug, val);
};

function getDefaultValue(id: any) {
  if (cardDetails.value?.variable_values) {
    const sbn = cardDetails.value?.variable_values.filter(
      (e: any) => e.module_variable_id == id,
    );
    return sbn[0]?.value;
  }
}

// workspace roles
const workspaceStore = useWorkspaceStore();
const newCompanyId = computed(
  () => workspaceStore.singleWorkspace?.company_id ?? null,
);
const { data: workspaceRoles, isLoading: isLoadingWorkspaceRoles } =
  useWorkspaceRoles(
    {
      company_id: newCompanyId,
      workspace_id: workspaceId,
    },
    {
      enabled: computed(() => !!workspaceId.value),
    },
  );
const selectedRole = ref(cardDetails.value?.workspace_access_role_id ?? "");

// Mutation
const { mutate: assignRole } = useAssignRole({
  onSuccess: () => {
    toast.success("Role assigned successfully!");
    // Optionally refetch people or roles
    queryClient.invalidateQueries({ queryKey: ["people-lists"] });
    queryClient.invalidateQueries({ queryKey: ["people"] });
    emit("role-assigned");
  },
  onError: (err: any) => {
    toast.error(err.message || "Failed to assign role.");
  },
});

async function fetchAgentsRolesPermissions() {
  await agentStore.fetchAgentsRolesPermissions(workspaceId.value);
}
fetchAgentsRolesPermissions();
const roleOptions = computed(() => {
  let roles: any[] = [];

  if (cardDetails.value?.slug?.includes("agent")) {
    roles = (agentsRolesPermissions.value?.access_roles || []).map(
      (r: any) => ({
        _id: r._id,
        title: r.title,
      }),
    );
  } else {
    roles = (workspaceRoles.value || []).map((r: any) => ({
      _id: r._id,
      title: r.title,
    }));
  }

  roles.push(
    {
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
const jobOptions = computed(() => {
  let roles: any[] = [];

  if (cardDetails.value?.slug?.includes("agent")) {
    roles = (agentsRolesPermissions.value?.job_roles || []).map((r: any) => ({
      _id: r._id,
      title: r.title,
    }));
  }

  roles.push({
    _id: "ADD_NEW_ROLE",
    title: "+ Add New Job Role",
    customClass:
      "text-primary-color font-medium sticky bottom-0 hover:bg-bg-dropdown-menu-hover transition-all duration-150 bg-bg-dropdown border-t border-border w-full",
    isAction: true,
  });

  return roles;
});

watch(
  () => cardDetails.value?.workspace_access_role_id,
  (newRoleId) => {
    selectedRole.value = newRoleId ?? "";
  },
);
watch(
  () => cardDetails.value?._id,
  () => {
    selectedRole.value = cardDetails.value?.workspace_access_role_id ?? "";
  },
  { immediate: true },
);

function handleRoleClick() {
  if (!canEditUser) {
    toast.error("You have no permission to edit user details");
  }
}

function handleRoleChange(newRole: any) {
  if (!canEditUser) {
    toast.error("You have no permission to edit user details");
    return;
  }

  if (newRole === "ADD_NEW_ROLE") {
    showAddRoleModal.value = true;
    return;
  }

  if (newRole === "MANAGE_PERMISSIONS") {
    showManagePermissionsModal.value = true;
    return;
  }

  if (cardDetails.value?.workspace_access_role_id === newRole) return;

  selectedRole.value = newRole;

  // Optimistic update
  sidePanelStore.updatePeopleRoleOptimistic(newRole);

  assignRole({
    id: cardDetails.value?._id!,
    workspace_access_role_id: newRole,
  });
}

// Permissions Display Logic removed as it is now in ManagePermissionsModal

// Add Role Modal
const showAddRoleModal = ref(false);
const AddCustomRoleModal = defineAsyncComponent(
  () => import("../modals/AddCustomRoleModal.vue"),
);

const completedTasks = computed(() => {
  return cardDetails.value?.assigned_cards_status_counts?.["Done"] ?? 0;
});

const totalTasks = computed(() => {
  return cardDetails.value?.assigned_cards_count ?? 0;
});

const progressPercentage = computed(() => {
  if (!totalTasks.value) return 0;
  return Math.round((completedTasks.value / totalTasks.value) * 100);
});

const assignedTasks = computed(() => cardDetails.value?.assigned_cards ?? []);

const historyList = computed(() => {
  const history = cardDetails.value?.assignment_history;
  if (Array.isArray(history)) return history;
  if (history?.history && Array.isArray(history.history)) return history.history;
  return [];
});

const hasAssignedTasks = computed(() => assignedTasks.value.length > 0);

const hasHistoryItems = computed(() => historyList.value.length > 0);

const { mutate: deleteVarDef, isPending: isDeleting } = useDeletePeopleVarDef();
const { mutate: updateVarDef } = useUpdatePeopleVarDef();

function handleEditVar(item: any) {
  selectedVarToEdit.value = item;
  isEditVar.value = true;
}

function handleDeleteVar(item: any) {
  selectedItem.value = item;
  showDeleteModal.value = true;
}

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
      onError: (err: any) => {
        toast.error(err.message || "Failed to delete variable");
      },
    },
  );
}

function refetchCardDetails() {
  queryClient.invalidateQueries({ queryKey: ["people-var"] });
  queryClient.invalidateQueries({ queryKey: ["people-lists"] });
}

function handleVariableDefinitionUpdate({ id, payload }: any) {
  updateVarDef(
    { id, payload },
    {
      onSuccess: () => {
        toast.success("Field updated successfully");
        refetchCardDetails();
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update field");
      },
    },
  );
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
