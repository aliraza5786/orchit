<template>
  <BaseModal v-model="isOpen" size="md" modalClass="!py-0">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-body pb-4 mb-4"
    >
      <h2 class="text-xl font-semibold">Invite Users</h2>
      <p class="text-sm text-text-secondary mt-1">
        Add emails, and pick a permission.
      </p>
    </div>

    <!-- Body -->
    <div class="px-6 flex flex-col gap-4">
      <!-- Emails -->
      <BaseEmailChip
        class="w-full"
        label="User emails"
        v-model="form.emails"
        :error="!!emailError"
        :message="emailError || 'Press Enter after each email'"
        showName
        @invalid="onEmailsInvalid"
        @add="onEmailsAdd"
      />

       <!-- Workspace Team Roles -->
       <BaseSelectField
        size="md"
        label="Team Role"
        :options="workspaceTeamRoleOptions"
        placeholder="Choose team role"
        :model-value="form.role_id"
        @update:modelValue="(val) => (form.role_id = val)"
      />

     

      <!-- Role (depends on workspace) -->
      <BaseSelectField
        size="md"
        label="Workspace Role"
        :options="roleOptions"
        placeholder="Choose workspace role"
        :model-value="form.workspace_access_role_id"
        @update:modelValue="onRoleChange"
        :disabled="!form.workspace_id"
        :message="roleError"
        :error="!!roleError"
      />
      

      <!-- SHOW PERMISSIONS OF SELECTED ROLE -->
      <div v-if="selectedRoleData" class="w-full mt-2">
        <h2 class="text-base font-medium mb-1 flex items-center text-text-primary">
          Permissions
        </h2>

        <div
          v-for="category in selectedRoleData?.permission_categories"
          :key="category?.category"
          class="border border-border mb-2 rounded-lg overflow-hidden bg-bg-surface/30"
        >
          <!-- Category Header -->
          <button
            @click="togglePermissionCategory(category?.category)"
            class="w-full px-3 py-2 flex justify-between items-center hover:bg-bg-surface transition"
          >
            <span class="text-sm font-medium text-text-primary">
              {{ category?.category_title }}
            </span>

            <i
              :class="[
                'fa-solid fa-chevron-down text-xs text-text-secondary transition-transform',
                openPermissions[category?.category] ? 'rotate-180' : '',
              ]"
            ></i>
          </button>

          <!-- Permission List -->
          <div
            v-if="openPermissions[category?.category]"
            class="px-3 py-2 space-y-2 border-t border-border bg-bg-card"
          >
            <div
              v-for="perm in category?.permissions"
              :key="perm._id"
              class="flex items-start gap-2"
            >
              <input
                type="checkbox"
                v-model="selectedPermissions"
                :value="perm._id"
                @change="handlePermissionUpdate"
                class="h-4 w-4 mt-0.5 rounded border-border accent-accent cursor-pointer flex-shrink-0"
              />

              <div>
                <p class="text-xs font-medium text-text-primary">
                  {{ perm.title }}
                </p>
                <p class="text-[11px] text-text-secondary leading-tight">
                  {{ perm.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex justify-end gap-2 p-6 mt-6 sticky bottom-0 bg-bg-body border-t border-border"
    >
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button
        variant="primary"
        :disabled="!canSubmit || inviting"
        @click="submit"
      >
        {{ inviting ? "Inviting…" : "Send Invites" }}
      </Button>
    </div>
  </BaseModal>
</template>

<!-- File: src/components/modals/InviteUsersModal.vue -->
<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import type { Ref } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { toast } from "vue-sonner";
import {
  useWorkspaces,
  useSingleWorkspaceCompany,
} from "../../../queries/useWorkspace";
import BaseModal from "../../../components/ui/BaseModal.vue";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import BaseEmailChip from "../../../components/ui/BaseEmailChip.vue";
import Button from "../../../components/ui/Button.vue"; 
import { useCompanyId } from "../../../services/user";
import {
  useWorkspaceRoles,
  useWorkspaceTeamRoles,
  useCreateTeamMember
} from "../../../queries/usePeople";
import { useUpdatePermissions } from "../../../queries/usePackages";

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "invited", payload: any): void;
}>();

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    defaultWorkspaceId?: string | number;
  }>(),
  { modelValue: false }
);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const queryClient = useQueryClient();
const { data: workspaces } = useWorkspaces(1, 100);

type SelectValue = string | number | null;
const form = reactive({
  workspace_id: null as SelectValue,
  role_id: null as SelectValue,
  emails: [] as string[],
  additional_seats: 1,
  workspace_access_role_id: null as SelectValue,
});

watch(
  () => props.defaultWorkspaceId,
  (id) => {
    if (id) {
      form.workspace_id = id as SelectValue;
      // Reset role when workspace changes to avoid sticking to a role from another workspace
      form.role_id = null;
    }
  },
  { immediate: true }
);

// --- Roles Loading Logic ---
const workspaceIdRef = computed(() => form.workspace_id ?? undefined) as Ref<
  string | number
>;

// workspace team roles
const { data: workspaceTeamRoles } = useWorkspaceTeamRoles(workspaceIdRef, {
  enabled: computed(() => !!form.workspace_id),
});
const workspaceTeamRoleOptions = computed(() => {
  return (workspaceTeamRoles.value || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }));
});

watch(workspaceTeamRoles, (opts) => {
  console.log(opts, "workspace roles.......");
});

const { data: workspaceData } = useSingleWorkspaceCompany(workspaceIdRef, {
  enabled: computed(() => !!form.workspace_id),
});

const newCompanyId = computed(() => workspaceData.value?.company_id ?? null); 
const { data: workspaceRoles, refetch: refetchWorkspaceRoles } = useWorkspaceRoles(
  {
    company_id: newCompanyId,
    workspace_id: workspaceIdRef
  },
  {
    enabled: computed(() => !!newCompanyId.value && !!workspaceIdRef.value),
  }
);
watch(workspaceIdRef, () => {
  if (workspaceIdRef.value) {
    refetchWorkspaceRoles();
  }
});

const roleOptions = computed(() => {
  return (workspaceRoles.value || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }));
});

// Select default role if available and none selected
watch(roleOptions, (opts) => {
  if (opts && opts.length > 0 && !form.role_id) {
    // Optional: Select first role by default?
    // form.role_id = opts[0]._id;
  }
});

// Permissions Display Logic
const selectedRoleData = computed(() => {
  if (!workspaceRoles.value || !form.workspace_access_role_id) return null;
  return workspaceRoles.value.find(
    (r: any) => r._id === form.workspace_access_role_id
  );
});


const openPermissions = ref<Record<string, boolean>>({});
const selectedPermissions = ref<string[]>([]);
const { mutate: updatePermissions } = useUpdatePermissions();

function togglePermissionCategory(category: string) {
  openPermissions.value[category] = !openPermissions.value[category];
}

watch(
  selectedRoleData,
  (role) => {
    if (!role) {
      selectedPermissions.value = [];
      return;
    }
    const enabledPermissions: string[] = [];
    role.permission_categories.forEach((category: any) => {
      category.permissions.forEach((perm: any) => {
        if (perm.enabled) enabledPermissions.push(perm._id);
      });
    });
    selectedPermissions.value = enabledPermissions;
  },
  { immediate: true }
);

function onRoleChange(val: any) {
  form.workspace_access_role_id = val;
}

function handlePermissionUpdate() {
  if (!selectedRoleData.value?._id) return;

  updatePermissions(
    {
      roleId: selectedRoleData.value._id,
      payload: {
        title: selectedRoleData.value.title,
        description: selectedRoleData.value.description,
        is_admin: selectedRoleData.value.is_admin,
        is_editor: selectedRoleData.value.is_editor,
        is_viewer: selectedRoleData.value.is_viewer,
        permission_ids: selectedPermissions.value,
      },
    },
    {
      onSuccess: () => {
        toast.success("Permissions updated successfully");
        queryClient.invalidateQueries({ queryKey: ["workspace-roles"] });
      },
      onError: (err: any) => {
        console.error("Failed to update permissions", err);
        toast.error("Failed to update permissions");
      },
    }
  );
}

const roleError = computed(() =>
  !form.workspace_access_role_id ? "Role is required" : ""
);
const invalidEmails = computed<string[]>(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return form.emails.filter((e) => !re.test(e));
});
const emailError = computed(() =>
  invalidEmails.value.length ? `Invalid: ${invalidEmails.value.join(", ")}` : ""
);
const canSubmit = computed(
  () =>
    !!form.workspace_id &&
    !!form.role_id &&
    !!form.workspace_access_role_id &&
    form.emails.length > 0 &&
    invalidEmails.value.length === 0
);

// to track seleted role
const selectedRole = computed(() => {
  return workspaceRoles.value?.find((r: any) => r._id === form.workspace_access_role_id) || null;
});

 

function onEmailsInvalid(_bad: string[]) {}
function onEmailsAdd() {}
const { mutate: invitePeople, isPending: inviting } = useCreateTeamMember();
const { data: company_id } = useCompanyId();
function submit() {
  if (!canSubmit.value || inviting.value) return;
    const users = form.emails.map(email => ({
    name: inferName(email),
    email,
  }));
  invitePeople(
    {
      id: form.role_id,
      payload: {  
        users,
        workspace_id: form.workspace_id,
        workspace_access_role_id: form.workspace_access_role_id,
        role_id: form.role_id, // role id 
        additional_seats: 1,
      },
    },
    {
      onSuccess: (res: any) => {
        if (res?.failedInvites?.length) {
          toast.error(res.failedInvites[0]?.error ?? "Some invites failed");
        } else {
          toast.success("Invitations sent");
        }
        queryClient.invalidateQueries({ queryKey: ["all-users"] });
        queryClient.invalidateQueries({ queryKey: ['people-lists'] });
        queryClient.invalidateQueries({ queryKey: ['workspaceRoles'] });
        emit("invited", res);
        reset();
        isOpen.value = false;
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to send invitations.";
        toast.error(msg);
      },
    }
  );
}

function cancel() {
  reset();
  isOpen.value = false;
}

function reset() {
  form.role_id = null;
  form.emails = [];
  // keep workspace_id for convenience
}

function inferName(email: string) {
  const local = (email.split("@")[0] || "").split("+")[0];
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean);
  return parts.length
    ? parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ")
    : email;
}
</script>
