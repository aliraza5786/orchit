
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

          <!-- Permissions Body -->
          <div v-if="selectedRoleId && selectedRoleData" class="mt-2">

            <!-- Admin notice -->
            <div
              v-if="selectedRoleData.is_admin"
              class="border border-border rounded-lg px-4 py-6 text-center text-sm text-text-secondary bg-bg-surface/30"
            >
              Administrator roles have full access by default and cannot be restricted.
            </div>

            <template v-else>
              <!-- Permission summary badge -->
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-text-primary">Permissions</h3>
                <span class="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                  {{ selectedPermissionIds.length }} selected
                </span>
              </div>

              <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom_scroll_bar">
                <div
                  v-for="category in selectedRoleData.permission_categories"
                  :key="category.category"
                  class="border border-border rounded-lg overflow-hidden bg-bg-surface/30"
                >
                  <!-- Category Header -->
                  <button
                    @click="toggleCategory(category.category)"
                    class="w-full px-3 py-2.5 flex justify-between items-center hover:bg-bg-surface transition"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-text-primary">{{ category.category_title }}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-bg-input text-text-secondary">
                        {{ countEnabled(category) }}
                      </span>
                    </div>
                    <i
                      :class="[
                        'fa-solid fa-chevron-down text-xs text-text-secondary transition-transform duration-200',
                        openCategories[category.category] ? 'rotate-180' : '',
                      ]"
                    ></i>
                  </button>

                  <!-- Regular Permission List (non-module-management) -->
                  <div
                    v-show="openCategories[category.category]"
                    v-if="category.category !== 'module_management'"
                    class="py-2 space-y-0.5 border-t border-border bg-bg-input"
                  >
                    <label
                      v-for="perm in category.permissions"
                      :key="perm._id"
                      :for="`perm-${perm._id}`"
                      class="flex items-start gap-3 hover:bg-bg-body px-3 py-2 cursor-pointer"
                    >
                      <div class="flex items-center h-5 mt-0.5">
                        <input
                          type="checkbox"
                          :id="`perm-${perm._id}`"
                          :value="perm._id"
                          v-model="selectedPermissionIds"
                          class="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                        />
                      </div>
                      <div class="text-sm flex-1 min-w-0">
                        <div class="font-medium text-text-primary">{{ perm.title }}</div>
                        <div class="text-xs text-text-secondary mt-0.5">{{ perm.description }}</div>
                      </div>
                    </label>
                  </div>

                  <!-- Module Management — split into base + per-module grid -->
                  <div
                    v-show="openCategories[category.category]"
                    v-else
                    class="border-t border-border bg-bg-input"
                  >
                    <!-- Base module permissions -->
                    <div class="px-3 pt-3 pb-1">
                      <p class="text-[10px] uppercase tracking-wider text-text-secondary mb-2 font-medium">General</p>
                      <div class="space-y-0.5">
                        <label
                          v-for="perm in baseModulePermissions(category.permissions)"
                          :key="perm._id"
                          :for="`perm-${perm._id}`"
                          class="flex items-start gap-3 hover:bg-bg-body rounded px-2 py-1.5 cursor-pointer"
                        >
                          <div class="flex items-center h-5 mt-0.5">
                            <input
                              type="checkbox"
                              :id="`perm-${perm._id}`"
                              :value="perm._id"
                              v-model="selectedPermissionIds"
                              class="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                            />
                          </div>
                          <div class="text-sm flex-1">
                            <div class="font-medium text-text-primary">{{ perm.title }}</div>
                            <div class="text-xs text-text-secondary">{{ perm.description }}</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <!-- Per-module nested collapsibles -->
                    <div
                      v-if="moduleRows(category.permissions).length > 0"
                      class="px-3 pb-3 pt-2"
                    >
                      <p class="text-[10px] uppercase tracking-wider text-text-secondary mb-2 font-medium">Per-Module Access</p>

                      <div class="space-y-1">
                        <div
                          v-for="row in moduleRows(category.permissions)"
                          :key="row.moduleId"
                          class="border border-border/60 rounded-md overflow-hidden"
                        >
                          <!-- Module collapse header -->
                          <button
                            type="button"
                            @click="toggleModule(row.moduleId)"
                            class="w-full flex items-center justify-between px-3 py-2 bg-bg-surface hover:bg-bg-body transition text-left"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-xs font-medium text-text-primary">{{ row.moduleName }}</span>
                              <!-- mini enabled badge -->
                              <span class="text-[9px] px-1.5 py-0.5 rounded bg-bg-input text-text-secondary">
                                {{ countModuleEnabled(row) }}/4
                              </span>
                            </div>
                            <i
                              :class="[
                                'fa-solid fa-chevron-down text-[10px] text-text-secondary transition-transform duration-200',
                                openModules[row.moduleId] ? 'rotate-180' : ''
                              ]"
                            ></i>
                          </button>

                          <!-- Module permissions inside -->
                          <div
                            v-show="openModules[row.moduleId]"
                            class="border-t border-border/60 bg-bg-input px-3 py-2 space-y-1.5"
                          >
                            <template v-for="action in ['view', 'create', 'update', 'delete']" :key="action">
                              <label
                                v-if="row[action]"
                                :for="`mod-${action}-${row.moduleId}`"
                                class="flex gap-2.5 hover:bg-bg-body rounded px-2 py-1.5 cursor-pointer"
                              > 
                                <input
                                  type="checkbox"
                                  :id="`mod-${action}-${row.moduleId}`"
                                  :value="row[action]._id"
                                  v-model="selectedPermissionIds"
                                  class="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                                 />
                                <div class="flex flex-col gap-2"> 
                                 <span class="text-xs font-medium text-text-primary capitalize">
                                  <!-- {{ actionLabel(action) }} -->
                                   {{ row[action].title }}
                                 </span>
                                  <span class="text-xs text-text-secondary ml-1">
                                  {{ row[action].description }}
                                  </span>
                                </div> 
                               
                              </label>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Loading -->
          <div v-else-if="selectedRoleId && !selectedRoleData" class="flex justify-center py-4">
            <BaseSpinner />
          </div>

          <!-- Empty -->
          <div v-else class="flex justify-center py-4 text-sm text-text-secondary">
            Select a role above to view and edit its permissions.
          </div>

        </div>

        <!-- Footer -->
        <div class="bg-bg-body px-6 py-4 border-t border-border flex justify-end gap-2">
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
import { ref, computed, watch, watchEffect } from 'vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseSelectField from '../../../components/ui/BaseSelectField.vue';
import Button from '../../../components/ui/Button.vue';
import BaseSpinner from '../../../components/ui/BaseSpinner.vue';
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
const openModules = ref<Record<string, boolean>>({});

const { data: workspaceRoles, isLoading: isLoadingRoles } = useWorkspaceRoles({
  company_id: computed(() => props.companyId),
  workspace_id: workspaceId
}, {
  enabled: computed(() => !!workspaceId.value),
});

const roleOptions = computed(() =>
  (workspaceRoles.value || []).map((r: any) => ({ _id: r._id, title: r.title }))
);

const selectedRoleData = computed(() => {
  if (!workspaceRoles.value || !selectedRoleId.value) return null;
  return workspaceRoles.value.find((r: any) => r._id === selectedRoleId.value);
});

// ── Helpers ──────────────────────────────────────────────────────────────
/** Returns true if a permission _id is module-specific (compound id with 24-char module suffix) */
function isModuleSpecific(perm: any): boolean {
  const parts = perm._id.split('_');
  return parts.length === 2 && parts[1].length === 24;
}

/** For Module Management: returns only generic (non-module-specific) permissions */
function baseModulePermissions(permissions: any[]): any[] {
  return permissions.filter(p => !isModuleSpecific(p));
}

// ── Types ────────────────────────────────────────────────────────────────
interface ModuleRow {
  moduleId: string;
  moduleName: string;
  view: any;
  create: any;
  update: any;
  delete: any;
  [key: string]: any; // allows string indexing e.g. row[action]
}

/**
 * For Module Management: groups module-specific permissions by module ID.
 * Returns one row per module with { moduleId, moduleName, view, create, update, delete }
 */
function moduleRows(permissions: any[]): ModuleRow[] {
  const moduleMap = new Map<string, any>();
  const modules = selectedRoleData.value?.workspace_modules ?? [];

  permissions.filter(isModuleSpecific).forEach(perm => {
    const moduleId = perm._id.split('_')[1];
    if (!moduleMap.has(moduleId)) {
      // Find the module name from workspace_modules, fallback to parsing the title
      const moduleObj = modules.find((m: any) => m._id === moduleId);
      const moduleName =
        moduleObj?.title ||
        moduleObj?.variables?.['module-title'] ||
        extractModuleName(perm.title);

      moduleMap.set(moduleId, {
        moduleId,
        moduleName,
        view: null,
        create: null,
        update: null,
        delete: null,
      });
    }

    const row = moduleMap.get(moduleId);
    const action = (perm.action || '').toLowerCase();
    if (action === 'view_all' || action === 'view') row.view = perm;
    else if (action === 'create') row.create = perm;
    else if (action === 'update') row.update = perm;
    else if (action === 'delete') row.delete = perm;
  });

  return Array.from(moduleMap.values());
}

/** Strips the action verb prefix from module-specific permission titles e.g. "Create Pin" → "Pin" */
function extractModuleName(title: string): string {
  return title.replace(/^(Create|Delete|Edit|View|Manage)\s+/i, '').trim();
}

/** Count how many permissions in a category are currently selected */
function countEnabled(category: any): string {
  const total = category.permissions.length;
  const checked = category.permissions.filter((p: any) =>
    selectedPermissionIds.value.includes(p._id)
  ).length;
  return `${checked}/${total}`;
}

// ── Watchers ──────────────────────────────────────────────────────────────
watch(selectedRoleData, (role) => {
  if (!role) {
    selectedPermissionIds.value = [];
    openCategories.value = {};
    return;
  }

  // Pre-check all enabled permissions
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

function toggleModule(moduleId: string) {
  openModules.value[moduleId] = !openModules.value[moduleId];
}

// function actionLabel(action: string): string {
//   const map: Record<string, string> = {
//     view: 'View',
//     create: 'Create',
//     update: 'Edit',
//     delete: 'Delete',
//   };
//   return map[action] ?? action;
// }

function countModuleEnabled(row: ModuleRow): number {
  return (['view', 'create', 'update', 'delete'] as const).filter(
    (a) => row[a] && selectedPermissionIds.value.includes(row[a]._id)
  ).length;
}

// ── Save ──────────────────────────────────────────────────────────────────
const { mutate: updatePermissions, isPending: isUpdating } = useUpdatePermissions();

function handleUpdate() {
  if (!selectedRoleData.value) return;

  const allPermissions: any[] = [];
  selectedRoleData.value.permission_categories.forEach((cat: any) => {
    cat.permissions.forEach((p: any) => allPermissions.push(p));
  });

  const formatted = formatPermissionsPayload(allPermissions, selectedPermissionIds.value);

  watchEffect(()=>{
     console.log(allPermissions, "all permissions ids")
     console.log(formatted, "formatted permissions ids")
  })

  updatePermissions(
    {
      roleId: selectedRoleData.value._id,
      payload: {
        title: selectedRoleData.value.title,
        description: selectedRoleData.value.description,
        is_admin: selectedRoleData.value.is_admin,
        is_editor: selectedRoleData.value.is_editor,
        is_viewer: selectedRoleData.value.is_viewer,
        permission_ids: formatted.permission_ids,
        module_permissions: formatted.module_permissions,
        workspace_id: workspaceId.value,
      },
    },
    {
      onSuccess: () => {
        toast.success('Permissions updated successfully');
        queryClient.invalidateQueries({ queryKey: ['workspace-roles'] });
        emit('close');
      },
      onError: (err: any) => {
        console.error(err);
        toast.error('Failed to update permissions');
      },
    }
  );
}
</script>
