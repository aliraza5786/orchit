
<template>
  <Teleport to="body">
    <BaseModal
      :modelValue="show"
      @update:modelValue="(val) => !val && $emit('close')"
      class=""
    >
      <div class="-my-6">
        <!-- Header -->
        <div class="bg-bg-body px-6 py-4 border-b border-border">
           <h2 class="text-xl font-medium text-text-primary">Add Custom Role</h2>
        </div>

        <!-- Scrollable Body -->
        <div class="px-6 py-4 space-y-4">
          <!-- Basic Info -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Role Title</label>
            <BaseTextField
              v-model="form.title"
              placeholder="e.g. Content Editor"
              @update:modelValue="generateSlug"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Slug</label>
            <BaseTextField
              v-model="form.slug"
              placeholder="e.g. content-editor"
              disabled
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Description</label>
            <BaseTextAreaField
              v-model="form.description"
              placeholder="Describe the role's responsibilities..."
              rows="3"
            />
          </div>

          <!-- Permissions -->
          <div v-if="permissionsData" class="mt-6">
            <h3 class="text-sm font-medium text-text-primary mb-3">Permissions</h3>
            <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom_scroll_bar">
              <div
                v-for="category in permissionsData"
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
                  class=" py-2 space-y-1 border-t border-border bg-bg-input "
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
          </div>
          <div v-else class="flex justify-center py-4">
            <Loader />
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-bg-body px-6 py-6 border-t border-border flex justify-end gap-2 text-right">
          <Button variant="secondary" @click="$emit('close')">Cancel</Button>
          <Button 
              @click="handleSubmit" 
              :disabled="isPending || !form.title"
              :loading="isPending"
          >
              Create Role
          </Button>
        </div>
      </div>
    </BaseModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseTextField from '../../../components/ui/BaseTextField.vue';
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue';
import Button from '../../../components/ui/Button.vue';
import Loader from '../../../components/ui/Loader.vue';
import { useAllPermissions, useCreateRole } from '../../../queries/usePeople';
import { useRouteIds } from '../../../composables/useQueryParams';
import { toast } from 'vue-sonner';
import { useQueryClient } from '@tanstack/vue-query';

const props = defineProps<{
  show: boolean;
  workspaceId: string;
  companyId: string;
}>();

const emit = defineEmits(['close']);

const { workspaceId } = useRouteIds();
const queryClient = useQueryClient();

// Form State
const form = reactive({
  title: '',
  slug: '',
  description: '',
});

const selectedPermissionIds = ref<string[]>([]);
const openCategories = ref<Record<string, boolean>>({});

// Fetch Permissions
const { data: rawPermissionsData } = useAllPermissions({
  scope: computed(() => 'workspace'),
  workspace_id: computed(() => props.workspaceId || workspaceId.value),
});

const permissionsData = computed(() => {
  if (!rawPermissionsData.value) return null;
  // Handle the nested structure: data.permissions_grouped[0].categories
  const grouped = rawPermissionsData.value.permissions_grouped || rawPermissionsData.value.data?.permissions_grouped;
  if (Array.isArray(grouped) && grouped.length > 0) {
      return grouped[0].categories;
  }
  return rawPermissionsData.value; // Fallback if structure is already flat or different
});

// Create Mutation
const { mutate: createRole, isPending } = useCreateRole({
  onSuccess: () => {
    toast.success('Role created successfully');
    queryClient.invalidateQueries({ queryKey: ['workspace-roles'] });
    emit('close');
    // Reset form
    form.title = '';
    form.slug = '';
    form.description = '';
    selectedPermissionIds.value = [];
  },
  onError: (err: any) => {
    console.error(err);
    toast.error(err.response?.data?.message || 'Failed to create role');
  },
});

// Helpers
function generateSlug(val: string) {
  form.slug = val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toggleCategory(category: string) {
  openCategories.value[category] = !openCategories.value[category];
}

function handleSubmit() {
    if (!permissionsData.value) return;
    
    // Flatten all available permissions to lookup details
    const allPerms: any[] = [];
    permissionsData.value.forEach((cat: any) => {
        cat.permissions.forEach((p: any) => allPerms.push(p));
    });

    const { permission_ids, module_permissions } = formatPermissionsPayload(
        allPerms,
        selectedPermissionIds.value
    );

    const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        company_id: props.companyId,
        workspace_id: props.workspaceId || workspaceId.value,
        permission_ids: permission_ids,
        module_permissions: module_permissions
    };

    createRole({ payload });
}

// Import the utility
import { formatPermissionsPayload } from '../../../utilities/permissionUtils';

</script>
