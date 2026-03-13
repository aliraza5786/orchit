
<template>
  <Teleport to="body">
    <BaseModal
      :modelValue="show"
      @update:modelValue="(val) => !val && $emit('close')"
      title="Manage Role Permissions"
    >
      <div class="my-4">

        <!-- Scrollable Body -->
        <div class="px-6 py-4 space-y-4">

          <!-- Role Selector -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Select Role</label>
            <BaseSelectField
              size="md"
              v-model="selectedRoleId"
              :options="roleOptions"
              placeholder="Choose a role to manage"
              :loading="isLoadingRoles"
            />
          </div>

          <!-- Permissions -->
          <div v-if="selectedRoleId && selectedRoleData" class="mt-2">
            <h3 class="text-sm font-medium text-text-primary mb-3">Permissions</h3>

            <div v-if="!selectedRoleData.is_admin" class="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom_scroll_bar">
              <div
                v-for="category in selectedRoleData.permission_categories"
                :key="category.category"
                class="border border-border rounded-lg overflow-hidden bg-bg-surface/30"
              >
                <!-- Category Header -->
                <button
                  @click="toggleCategory(category.category)"
                  class="w-full px-3 py-2 flex justify-between items-center hover:bg-bg-surface transition"
                >
                  <span class="text-sm font-medium text-text-primary">{{ category.category_title }}</span>
                  <i
                    :class="[
                      'fa-solid fa-chevron-down text-xs text-text-secondary transition-transform',
                      openCategories[category.category] ? 'rotate-180' : '',
                    ]"
                  ></i>
                </button>

                <!-- Permission List -->
                <div
                  v-show="openCategories[category.category]"
                  class="py-2 space-y-1 border-t border-border bg-bg-input"
                >
                  <div
                    v-for="perm in category.permissions"
                    :key="perm._id"
                    class="flex items-start gap-2 hover:bg-bg-body px-3 py-2"
                  >
                    <div class="flex items-center h-5">
                      <input
                        type="checkbox"
                        :id="perm._id"
                        :value="perm._id"
                        v-model="selectedPermissionIds"
                        class="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                      />
                    </div>
                    <div class="ml-2 text-sm">
                      <label :for="perm._id" class="font-medium text-text-primary cursor-pointer select-none">
                        {{ perm.title }}
                      </label>
                      <p class="text-xs text-text-secondary">{{ perm.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="border border-border rounded-lg px-4 py-6 text-center text-sm text-text-secondary bg-bg-surface/30">
              Administrator roles have full access by default and cannot be restricted.
            </div>
          </div>

          <!-- Loading state while role data is loading -->
          <div v-else-if="selectedRoleId && !selectedRoleData" class="flex justify-center py-4">
            <Loader />
          </div>

          <!-- Empty state when no role selected -->
          <div v-else class="flex justify-center py-4 text-sm text-text-secondary">
            Select a role above to view and edit its permissions.
          </div>

        </div>

        <!-- Footer -->
        <div class="bg-bg-body px-6 py-6 border-t border-border flex justify-end gap-2 text-right">
          <Button variant="secondary" @click="$emit('close')">Cancel</Button>
          <Button
            @click="handleUpdate"
            :disabled="!selectedRoleId || isUpdating || selectedRoleData?.is_admin"
            :loading="isUpdating"
          >
            Save Changes
          </Button>
        </div>

      </div>
    </BaseModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseSelectField from '../../../components/ui/BaseSelectField.vue';
import Button from '../../../components/ui/Button.vue';
import Loader from '../../../components/ui/Loader.vue';
import { useWorkspaceRoles } from '../../../queries/usePeople';
import { useUpdatePermissions } from '../../../queries/usePackages';
import { formatPermissionsPayload } from '../../../utilities/permissionUtils';
import { toast } from 'vue-sonner';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouteIds } from '../../../composables/useQueryParams';

const props = defineProps<{
  show: boolean;
  companyId: string | null;
  initialRoleId?: string;
}>();

const emit = defineEmits(['close']);

const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();

const selectedRoleId = ref(props.initialRoleId || '');
const selectedPermissionIds = ref<string[]>([]);
const openCategories = ref<Record<string, boolean>>({});

const { data: workspaceRoles, isLoading: isLoadingRoles } = useWorkspaceRoles({
  company_id: computed(() => props.companyId),
  workspace_id: workspaceId
}, {
  enabled: computed(() => !!props.companyId)
});

const roleOptions = computed(() => {
  return (workspaceRoles.value || []).map((r: any) => ({
    _id: r._id,
    title: r.title
  }));
});

const selectedRoleData = computed(() => {
  if (!workspaceRoles.value || !selectedRoleId.value) return null;
  return workspaceRoles.value.find((r: any) => r._id === selectedRoleId.value);
});

watch(selectedRoleData, (role) => {
  if (!role) {
    selectedPermissionIds.value = [];
    openCategories.value = {};
    return;
  }

  // Load currently enabled permissions for the selected role
  const enabled: string[] = [];
  role.permission_categories?.forEach((category: any) => {
    category.permissions.forEach((perm: any) => {
      if (perm.enabled) enabled.push(perm._id);
    });
  });
  selectedPermissionIds.value = enabled;

  // Auto-open first category
  openCategories.value = {};
  if (role.permission_categories?.[0]) {
    openCategories.value[role.permission_categories[0].category] = true;
  }
}, { immediate: true });

function toggleCategory(category: string) {
  openCategories.value[category] = !openCategories.value[category];
}

const { mutate: updatePermissions, isPending: isUpdating } = useUpdatePermissions();

function handleUpdate() {
  if (!selectedRoleData.value) return;

  const allPermissions: any[] = [];
  selectedRoleData.value.permission_categories.forEach((cat: any) => {
    cat.permissions.forEach((p: any) => allPermissions.push(p));
  });

  const formatted = formatPermissionsPayload(allPermissions, selectedPermissionIds.value);

  updatePermissions({
    roleId: selectedRoleData.value._id,
    payload: {
      title: selectedRoleData.value.title,
      description: selectedRoleData.value.description,
      is_admin: selectedRoleData.value.is_admin,
      is_editor: selectedRoleData.value.is_editor,
      is_viewer: selectedRoleData.value.is_viewer,
      permission_ids: formatted.permission_ids,
      module_permissions: formatted.module_permissions,
      workspace_id: workspaceId.value
    }
  }, {
    onSuccess: () => {
      toast.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['workspace-roles'] });
      emit('close');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to update permissions');
    }
  });
}
</script>
