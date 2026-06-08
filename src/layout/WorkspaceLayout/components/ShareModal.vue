<template>
  <BaseModal :inSpace="inSpace" v-model="isOpen" size="md" modalClass="!py-0" :title="title">
    <p class="text-sm text-text-secondary p-6">
      Share this {{ resourceLabel }} with other users.
    </p>

    <!-- Body -->
    <div class="px-6 flex flex-col gap-4">
      <!-- Modules & Users — workspace only -->
      <div v-if="resourceType === 'workspace'">
        <div
          v-if="isModulesAndUsersPending"
          class="flex justify-center items-center py-4"
        >
          <i class="fa-solid fa-spinner animate-spin text-xl" :class="inSpace ? 'text-primary-color' : 'text-accent'"></i>
        </div>
        <template v-else-if="modules.length || companyUsers.length">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-text-primary">
              Modules & Users
            </h3>
            <label
              class="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none"
            >
              <input
                type="checkbox"
                :checked="
                  selectAllState.checked === selectAllState.total &&
                  selectAllState.total > 0
                "
                :indeterminate="selectAllState.indeterminate"
                class="w-3.5 h-3.5 cursor-pointer"
                @change="
                  toggleSelectAll(($event.target as HTMLInputElement).checked)
                "
              />
              Select all
            </label>
          </div>

          <div
            class="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar"
          >
            <!-- Modules -->
            <div
              v-for="mod in modules"
              :key="mod._id"
              class="border border-border rounded-md"
            >
              <div
                class="flex items-center gap-2 px-3 py-2 bg-bg-card cursor-pointer"
                @click="toggleModuleExpand(String(mod._id))"
              >
                <input
                  type="checkbox"
                  :checked="moduleCheckState(String(mod._id)).checked"
                  :indeterminate="
                    moduleCheckState(String(mod._id)).indeterminate
                  "
                  class="w-3.5 h-3.5 cursor-pointer shrink-0"
                  @click.stop
                  @change="
                    toggleModule(
                      String(mod._id),
                      ($event.target as HTMLInputElement).checked,
                    )
                  "
                />
                <i
                  class="fa-regular fa-folder text-text-secondary text-xs shrink-0"
                ></i>
                <span class="text-sm font-medium text-text-primary flex-1">
                  {{ mod.title || mod.name || "Untitled Module" }}
                </span>
                <span class="text-xs text-text-secondary mr-1">
                  {{ mod.sheets?.length ?? 0 }}
                  {{ mod.sheets?.length === 1 ? "sheet" : "sheets" }}
                </span>
                <i
                  class="fa-solid fa-chevron-down text-xs text-text-secondary transition-transform duration-150"
                  :class="{
                    'rotate-180': expandedModules.has(String(mod._id)),
                  }"
                ></i>
              </div>

              <div
                v-show="expandedModules.has(String(mod._id))"
                class="flex flex-col border-t border-border"
              >
                <label
                  v-for="(sheet, idx) in mod.sheets"
                  :key="sheet._id"
                  class="flex items-center gap-2 px-3 py-2 pl-8 cursor-pointer text-xs text-text-primary hover:bg-bg-card select-none"
                  :class="{ 'border-t border-border': (idx as number) > 0 }"
                >
                  <input
                    type="checkbox"
                    :checked="selectedSheets.has(String(sheet._id))"
                    class="w-3 h-3 cursor-pointer shrink-0"
                    @change="
                      toggleSheet(
                        String(mod._id),
                        String(sheet._id),
                        ($event.target as HTMLInputElement).checked,
                      )
                    "
                  />
                  <i
                    class="fa-regular fa-file-lines text-text-secondary shrink-0"
                  ></i>
                  {{
                    sheet.title || sheet.name || `Sheet ${(idx as number) + 1}`
                  }}
                </label>
              </div>
            </div>

            <!-- Company users -->
            <div
              v-for="user in shareableUsers"
              :key="user.user_id"
              class="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-bg-card"
            >
              <input
                type="checkbox"
                :checked="selectedUsers.has(String(user.user_id))"
                class="w-3.5 h-3.5 cursor-pointer shrink-0"
                @change="
                  toggleUser(
                    String(user.user_id),
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              />
              <img
                v-if="user.profile_image"
                :src="user.profile_image"
                class="w-6 h-6 rounded-full object-cover shrink-0"
              />
              <div
                v-else
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                :style="{
                  backgroundColor: generateAvatarColor(
                    user.user_id,
                    user.full_name,
                  ),
                }"
              >
                {{ getInitials(user.full_name) }}
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <span class="text-sm text-text-primary truncate">{{
                  user.full_name
                }}</span>
                <span class="text-xs text-text-secondary truncate">{{
                  user.email
                }}</span>
              </div>
              <BaseSelectField
                v-if="selectedUsers.has(String(user.user_id))"
                size="sm"
                variant="ghost"
                class="!w-35 border-none shadow-none !px-0"
                :options="accessRoles"
                placeholder="Role"
                v-model="selectedUserRoles[user.user_id]"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- ✅ Email invite section -->
      <div class="space-y-3">
        <label class="text-sm font-medium text-text-primary"
          >Invite by email</label
        >

        <!-- Input row -->
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <input
              ref="emailInputRef"
              v-model="emailInput"
              type="text"
              autocomplete="off"
              placeholder="Enter email address and press Enter or Add..."
              class="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg-input text-text-primary outline-none transition-all"
              :class="inSpace? 'focus:border-primary-color' : 'focus:border-accent '"
              @keydown="onEmailKeydown"
              @focus="onEmailInputFocus"
              @blur="onEmailInputBlur"
              @input="onEmailInput"
            />
            <p v-if="emailInputError" class="text-xs text-red-500 mt-1">
              {{ emailInputError }}
            </p>
          </div>

          <Teleport to="body">
            <div
              v-if="showSuggestions && filteredUserSuggestions.length > 0"
              class="fixed z-[9999] bg-bg-body border border-border rounded-lg shadow-lg overflow-hidden"
              :style="suggestionDropdownStyle"
            >
              <div class="max-h-60 overflow-y-auto custom-scrollbar">
                <div
                  v-for="(user, idx) in filteredUserSuggestions"
                  :key="user._id"
                  :class="[
                    'px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors',
                    highlightedSuggestionIndex === idx
                      ? 'bg-bg-hover'
                      : 'hover:bg-bg-hover',
                  ]"
                  @mousedown.prevent="selectUserSuggestion(user)"
                >
                  <img
                    v-if="user.profile_image"
                    :src="user.profile_image"
                    class="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <div
                    v-else
                    class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
                    :style="{
                      backgroundColor: generateAvatarColor(
                        user._id,
                        user.name || user.email,
                      ),
                    }"
                  >
                    {{ getInitials(user.name || user.email) }}
                  </div>
                  <div class="flex flex-col min-w-0 flex-1">
                    <span class="text-sm text-text-primary truncate">{{
                      user.name
                    }}</span>
                    <span class="text-xs text-text-secondary truncate">{{
                      user.email
                    }}</span>
                  </div>
                  <span
                    v-if="user.hasAccess"
                    class="text-[10px] text-text-secondary shrink-0"
                  >
                    Has access
                  </span>
                </div>
              </div>
            </div>
          </Teleport>
          <button
            type="button"
            class="h-9 px-4 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
            :style="{
              background: inSpace
              ? 'var(--primary-color)'
              : 'var(--accent)'
            }"
            @click="addEmail"
          >
            Add
          </button>
        </div>

        <!-- Per-email rows -->
        <template v-if="emailEntries.length > 0">
          <div class="text-xs text-text-secondary">
            {{ emailEntries.length }}
            {{ emailEntries.length === 1 ? "person" : "people" }} to invite
          </div>

          <div
            class="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar"
          >
            <div
              v-for="(entry, index) in emailEntries"
              :key="entry.email"
              class="flex items-center gap-3 px-3 py-2 rounded-lg border border-border"
              style="background: var(--bg-surface)"
            >
              <!-- Avatar -->
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 text-white"
                :style="{ background: avatarColorFromEmail(entry.email) }"
              >
                {{ entry.email.slice(0, 2).toUpperCase() }}
              </div>

              <!-- Email -->
              <span
                class="flex-1 text-sm text-text-primary truncate"
                :title="entry.email"
              >
                {{ entry.email }}
              </span>

              <!-- Role badge -->
               

              <!-- Role selector -->
              <BaseSelectField
                size="sm"
                variant="ghost"
                class="!w-45 shrink-0 border-none shadow-none !px-0"
                :options="accessRoles"
                placeholder="Set role"
                :model-value="entry.roleId"
                :error="!entry.roleId"
                @update:modelValue="
                  (val: string | number | null) =>
                    val !== null && setEntryRole(index, val)
                "
              />

              <!-- Remove -->
              <button
                type="button"
                class="w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors shrink-0"
                @click="removeEmailEntry(index)"
                title="Remove"
              >
                <i class="fa-solid fa-times text-xs" />
              </button>
            </div>
          </div>

          <!-- Warning: roles not all set -->
          <p
            v-if="emailEntries.some((e) => !e.roleId)"
            class="text-xs text-amber-500 flex items-center gap-1"
          >
            <i class="fa-solid fa-triangle-exclamation text-[10px]" />
            Please set a role for each person before sharing.
          </p>
        </template>
      </div>

      <!-- Job Role — module & sheet -->
      <BaseSelectField
        v-if="
          emailEntries.length > 0 &&
          (resourceType === 'module' || resourceType === 'sheet')
        "
        label="Job Role"
        :options="jobRoles"
        placeholder="Choose Job Role"
        v-model="form.workspace_role_id"
      />

      <!-- Sheets — module only -->
      <div
        v-if="
          emailEntries.length > 0 &&
          resourceType === 'module' &&
          moduleSheetOptions.length > 0
        "
        ref="moduleSheetsDropdownRef"
        class="relative"
      >
        <label class="text-sm font-medium text-text-primary mb-1 block">
          Module Sheets to share
        </label>
        <button
          type="button"
          class="w-full h-9.5 px-3 text-sm border border-border rounded-[6px] bg-bg-input text-text-primary flex items-center justify-between gap-2 outline-none transition-all"
          :class="inSpace ? 'focus:border-border' : 'focus:border-border'"
          @click="showModuleSheetsDropdown = !showModuleSheetsDropdown"
        >
          <span class="truncate text-left">{{ moduleSheetsDropdownLabel }}</span>
          <i
            class="fa-solid fa-chevron-down text-xs text-text-secondary shrink-0 transition-transform duration-150"
            :class="{ 'rotate-180': showModuleSheetsDropdown }"
          />
        </button>

        <div
          v-show="showModuleSheetsDropdown"
          class="absolute z-50 mt-1 w-full border border-border rounded-[6px] bg-bg-input shadow-lg overflow-hidden"
        >
          <div class="max-h-[200px] overflow-y-auto custom-scrollbar">
            <div
              class="flex items-center gap-2 px-3 py-2 border-b border-border cursor-pointer hover:bg-bg-body text-sm select-none sticky top-0 bg-bg-input"
              @click="
                toggleModuleShareSelectAll(
                  !moduleShareSelectAllState.allSelected,
                )
              "
            >
              <div class="shrink-0 pointer-events-none">
                <Checkbox
                  :inSpace="inSpace"
                  :checked="
                    moduleShareSelectAllState.allSelected ||
                    moduleShareSelectAllState.indeterminate
                  "
                  className="!mt-0"
                />
              </div>
              <span class="font-medium text-text-primary">Select all</span>
            </div>

            <div
              v-for="sheet in moduleSheetOptions"
              :key="sheet._id"
              class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-body text-sm text-text-primary select-none"
              @click="
                toggleModuleShareSheet(
                  String(sheet._id),
                  !isModuleSheetSelected(String(sheet._id)),
                )
              "
            >
              <div class="shrink-0 pointer-events-none">
                <Checkbox
                  :inSpace="inSpace"
                  :checked="isModuleSheetSelected(String(sheet._id))"
                  className="!mt-0"
                />
              </div>
              <i
                class="fa-regular fa-file-lines text-text-secondary text-xs shrink-0"
              />
              <span class="truncate">{{ sheet.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Note -->
      <BaseTextAreaField
        v-if="emailEntries.length > 0"
        label="Note"
        placeholder="Add a note (optional)..."
        :model-value="form.note"
        @update:modelValue="(v: string) => (form.note = v)"
      />

      <!-- People with access -->
      <div
        v-if="isLoadingSharedUsers"
        class="flex justify-center items-center py-6"
      >
        <i class="fa-solid fa-spinner animate-spin text-2xl" :class="inSpace ? 'text-primary-color' : 'text-accent'"></i>
      </div>
      <div
        v-else-if="sharedUsers?.length && emailEntries.length < 1"
        class="mt-2"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-text-primary">
            People with access
          </h3>
        </div>
        <div
          class="space-y-4 max-h-[320px] overflow-auto pr-1 custom-scrollbar"
        >
          <div
            v-for="item in sharedUsers"
            :key="item.user._id"
            class="flex items-center justify-between group min-w-[400px]"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="item.user.u_profile_image"
                :src="item.user.u_profile_image"
                class="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                :style="{
                  backgroundColor: generateAvatarColor(
                    item.user._id,
                    item.user.u_full_name || item.user.u_email,
                  ),
                }"
              >
                {{ getInitials(item.user.u_full_name || item.user.u_email) }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium text-text-primary truncate">
                  {{ item.user.u_full_name }}
                  {{ item.user._id === currentUserId ? "(you)" : "" }}
                </span>
                <span class="text-xs text-text-secondary truncate">{{
                  item.user.u_email
                }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="item.is_owner"
                class="text-xs text-text-secondary px-2"
                >Owner</span
              >
              <div v-else>
                <BaseSelectField
                  size="sm"
                  variant="ghost"
                  class="!w-35 border-none shadow-none !px-0"
                  :options="[
                    ...accessRoles,
                    {
                      _id: 'REMOVE_ACCESS',
                      title: 'Remove access',
                      isAction: true,
                      customClass: '!text-red-500 hover:!bg-red-50',
                    },
                  ]"
                  :model-value="item.workspace_access_role?._id || item.role"
                  @update:modelValue="
                    (val: string | number | null) =>
                      val &&
                      (val === 'REMOVE_ACCESS'
                        ? handleRemoveAccess(item)
                        : handleUpdateUserRole(item, val))
                  "
                />
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
      <Button :inSpace="true" variant="secondary" @click="cancel">Cancel</Button>
      <Button
        :inSpace="true"
        variant="primary"
        :disabled="!canSubmit || isSharing"
        @click="submit"
      >
        <i v-if="isSharing" class="fa-solid fa-spinner animate-spin mr-2"></i>
        {{ isSharing ? "Sharing…" : `Share ${resourceLabel}` }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { toast } from "vue-sonner";
import BaseModal from "../../../components/ui/BaseModal.vue";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import BaseTextAreaField from "../../../components/ui/BaseTextAreaField.vue";
// import EmailSearchChip from './EmailSearchChip.vue'
import Button from "../../../components/ui/Button.vue";
import Checkbox from "../../../components/ui/Checkbox.vue";
import {
  useShareResource,
  useSharedUsers,
  useUpdateShareRole,
  useRemoveShareAccess,
  useUsers,
  useWorkspaceModulesAndUsers,
} from "../../../queries/useWorkspace";
import { useRouteIds } from "../../../composables/useQueryParams";
import { getInitials, generateAvatarColor } from "../../../utilities"; 
import { useAgentStore } from "../../../stores/agentStore";
import { useWorkspaceRoles } from "../../../queries/usePeople";
import { useSheets } from "../../../queries/useSheets";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailEntry {
  email: string;
  roleId: string | number | null;
}

interface UserSuggestion {
  _id: string;
  name: string;
  email: string;
  profile_image?: string | null;
  hasAccess?: boolean;
}

interface ModuleSheetOption {
  _id: string;
  title: string;
}

// ─── Props / Emits ────────────────────────────────────────────────────────────
const currentUserId = localStorage.getItem("user_id");

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "shared"): void;
}>();

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    resourceId?: string;
    resourceType?: "module" | "workspace" | "sheet";
    title?: string;
    inSpace?: boolean;
  }>(),
  {
    modelValue: false,
    resourceType: "module",
    inSpace: false,
  },
);

// ─── Modal open state ─────────────────────────────────────────────────────────
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

// ─── Labels ───────────────────────────────────────────────────────────────────
const resourceLabel = computed(() => {
  if (props.resourceType === "workspace") return "workspace";
  if (props.resourceType === "sheet") return "sheet";
  return "module";
});
const title = computed(() => {
  if (props.title) return props.title;
  if (props.resourceType === "workspace") return "Workspace";
  if (props.resourceType === "sheet") return "Sheet";
  return "Module";
});

// ─── Queries setup ────────────────────────────────────────────────────────────
const { workspaceId } = useRouteIds();
const queryClient = useQueryClient(); 
const agentStore = useAgentStore();

const workspaceResourceId = computed(() =>
  props.resourceType === "workspace" ? (props.resourceId ?? "") : "",
);

const moduleResourceId = computed(() =>
  props.resourceType === "module" ? (props.resourceId ?? "") : "",
);

// ─── Modules & Users (workspace only) ────────────────────────────────────────
const { data: modulesAndUsersData, isPending: isModulesAndUsersPending } =
  useWorkspaceModulesAndUsers(workspaceResourceId);

const modules = computed(() => modulesAndUsersData.value?.modules ?? []);
const companyUsers = computed(
  () => modulesAndUsersData.value?.company_users ?? [],
);

const expandedModules = ref<Set<string>>(new Set());
const selectedModulesList = ref<Set<string>>(new Set());
const selectedSheets = ref<Set<string>>(new Set());
const selectedUsers = ref<Set<string>>(new Set());
const selectedUserRoles = ref<Record<string, string | number>>({});

function toggleModuleExpand(id: string) {
  const next = new Set(expandedModules.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expandedModules.value = next;
}

function toggleModule(moduleId: string, checked: boolean) {
  const mod = modules.value.find((m: any) => String(m._id) === moduleId);
  const nextMods = new Set(selectedModulesList.value);
  const nextSheets = new Set(selectedSheets.value);
  if (checked) {
    nextMods.add(moduleId);
    mod?.sheets?.forEach((s: any) => nextSheets.add(String(s._id)));
  } else {
    nextMods.delete(moduleId);
    mod?.sheets?.forEach((s: any) => nextSheets.delete(String(s._id)));
  }
  selectedModulesList.value = nextMods;
  selectedSheets.value = nextSheets;
}

function toggleSheet(moduleId: string, sheetId: string, checked: boolean) {
  const nextSheets = new Set(selectedSheets.value);
  checked ? nextSheets.add(sheetId) : nextSheets.delete(sheetId);
  selectedSheets.value = nextSheets;

  const mod = modules.value.find((m: any) => String(m._id) === moduleId);
  const allChecked = mod?.sheets?.every((s: any) =>
    nextSheets.has(String(s._id)),
  );
  const nextMods = new Set(selectedModulesList.value);
  allChecked ? nextMods.add(moduleId) : nextMods.delete(moduleId);
  selectedModulesList.value = nextMods;
}

function toggleUser(userId: string, checked: boolean) {
  const next = new Set(selectedUsers.value);
  if (checked) {
    next.add(userId);
    selectedUserRoles.value[userId] = "";
  } else {
    next.delete(userId);
    delete selectedUserRoles.value[userId];
  }
  selectedUsers.value = next;
}

function moduleCheckState(moduleId: string) {
  const mod = modules.value.find((m: any) => String(m._id) === moduleId);
  const sheets: any[] = mod?.sheets ?? [];
  const checkedCount = sheets.filter((s: any) =>
    selectedSheets.value.has(String(s._id)),
  ).length;
  return {
    checked: selectedModulesList.value.has(moduleId),
    indeterminate: checkedCount > 0 && checkedCount < sheets.length,
  };
}

const allCheckables = computed(() => {
  const modIds = modules.value.map((m: any) => String(m._id));
  const sheetIds = modules.value.flatMap(
    (m: any) => m.sheets?.map((s: any) => String(s._id)) ?? [],
  );
  const userIds = companyUsers.value.map((u: any) => String(u.user_id));
  return { modIds, sheetIds, userIds };
});

const selectAllState = computed(() => {
  const { modIds, sheetIds, userIds } = allCheckables.value;
  const total = modIds.length + sheetIds.length + userIds.length;
  const checked =
    modIds.filter((id: any) => selectedModulesList.value.has(id)).length +
    sheetIds.filter((id: any) => selectedSheets.value.has(id)).length +
    userIds.filter((id: any) => selectedUsers.value.has(id)).length;
  return { checked, total, indeterminate: checked > 0 && checked < total };
});

function toggleSelectAll(checked: boolean) {
  const { modIds, sheetIds, userIds } = allCheckables.value;
  if (checked) {
    selectedModulesList.value = new Set(modIds);
    selectedSheets.value = new Set(sheetIds);
    selectedUsers.value = new Set(userIds);
  } else {
    selectedModulesList.value = new Set();
    selectedSheets.value = new Set();
    selectedUsers.value = new Set();
  }
}

// ─── Email entries (per-email role) ──────────────────────────────────────────
const emailEntries = ref<EmailEntry[]>([]);
const emailInputRef = ref<HTMLInputElement | null>(null);
const emailInput = ref("");
const emailInputError = ref("");
const showSuggestions = ref(false);
const highlightedSuggestionIndex = ref(0);
const suggestionDropdownStyle = ref({
  top: "0px",
  left: "0px",
  width: "0px",
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function addEmail() {
  const val = emailInput.value.trim();
  if (!val) return;
  if (!EMAIL_RE.test(val)) {
    emailInputError.value = "Please enter a valid email address.";
    return;
  }
  if (isUserAlreadyShared(val)) {
    emailInputError.value = "This user already exists.";
    return;
  }
  if (emailEntries.value.some((e) => e.email === val)) {
    emailInputError.value = "This email has already been added.";
    return;
  }
  emailEntries.value.push({ email: val, roleId: null });
  emailInput.value = "";
  emailInputError.value = "";
  showSuggestions.value = false;
}

function removeEmailEntry(index: number) {
  emailEntries.value.splice(index, 1);
}

function setEntryRole(index: number, roleId: string | number) {
  emailEntries.value[index].roleId = roleId;
}

function updateSuggestionDropdownPosition() {
  const el = emailInputRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  suggestionDropdownStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
}

function onEmailInputFocus() {
  if (emailInput.value.trim()) {
    showSuggestions.value = true;
    nextTick(updateSuggestionDropdownPosition);
  }
}

function onEmailInput() {
  emailInputError.value = "";
  const hasQuery = emailInput.value.trim().length > 0;
  showSuggestions.value = hasQuery;
  if (hasQuery) {
    nextTick(updateSuggestionDropdownPosition);
  }
}

function onEmailInputBlur() {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

function isUserAlreadyShared(email: string) {
  const normalized = email.trim().toLowerCase();
  return sharedUsers.value.some(
    (item: any) => item.user?.u_email?.trim().toLowerCase() === normalized,
  );
}

function selectUserSuggestion(user: UserSuggestion) {
  if (String(user._id) === currentUserId) {
    emailInputError.value = "You cannot invite yourself.";
    return;
  }
  if (user.hasAccess || isUserAlreadyShared(user.email)) {
    emailInputError.value = "This user already exists.";
    return;
  }
  emailInput.value = user.email;
  emailInputError.value = "";
  addEmail();
  showSuggestions.value = false;
}

function onEmailKeydown(e: KeyboardEvent) {
  const suggestions = filteredUserSuggestions.value;

  if (e.key === "ArrowDown" && showSuggestions.value && suggestions.length > 0) {
    e.preventDefault();
    highlightedSuggestionIndex.value =
      (highlightedSuggestionIndex.value + 1) % suggestions.length;
    return;
  }

  if (e.key === "ArrowUp" && showSuggestions.value && suggestions.length > 0) {
    e.preventDefault();
    highlightedSuggestionIndex.value =
      (highlightedSuggestionIndex.value - 1 + suggestions.length) %
      suggestions.length;
    return;
  }

  if (e.key === "Escape") {
    showSuggestions.value = false;
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    if (showSuggestions.value && suggestions[highlightedSuggestionIndex.value]) {
      selectUserSuggestion(suggestions[highlightedSuggestionIndex.value]);
    } else {
      addEmail();
    }
  }
}

// ─── Avatar & role helpers ────────────────────────────────────────────────────
function avatarColorFromEmail(email: string): string {
  const colors = ["#534AB7", "#1D9E75", "#D85A30", "#D4537E", "#BA7517"];
  let hash = 0;
  for (let i = 0; i < email.length; i++)
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

function roleLabelById(id: string | number | null): string {
  if (!id) return "";
  return accessRoles.value.find((r: any) => r._id === id)?.title ?? "";
}

function roleBadgeClass(id: string | number | null): string {
  const label = roleLabelById(id).toLowerCase();
  if (label.includes("viewer"))
    return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
  if (label.includes("editor"))
    return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
  if (label.includes("admin"))
    return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
  return "bg-bg-surface text-text-secondary";
}

// ─── Module sheets (module share only) ───────────────────────────────────────
const { data: moduleSheetsData } = useSheets(
  {
    workspace_module_id: moduleResourceId,
    workspace_id: workspaceId,
  },
  { enabled: computed(() => !!moduleResourceId.value && isOpen.value) },
);

const moduleSheetOptions = computed<ModuleSheetOption[]>(() =>
  (moduleSheetsData.value ?? []).map((s: any) => ({
    _id: String(s._id),
    title:
      s.variables?.["sheet-title"] || s.title || s.name || "Untitled Sheet",
  })),
);

const moduleShareSheetIds = ref<Set<string>>(new Set());
const moduleSheetsInitialized = ref(false);
const showModuleSheetsDropdown = ref(false);
const moduleSheetsDropdownRef = ref<HTMLElement | null>(null);

function initModuleShareSheets() {
  moduleShareSheetIds.value = new Set(
    moduleSheetOptions.value.map((s) => String(s._id)),
  );
  moduleSheetsInitialized.value = true;
}

function isModuleSheetSelected(id: string) {
  return moduleShareSheetIds.value.has(id);
}

function toggleModuleShareSheet(id: string, checked: boolean) {
  const next = new Set(moduleShareSheetIds.value);
  if (checked) next.add(id);
  else next.delete(id);
  moduleShareSheetIds.value = next;
}

const moduleShareSelectAllState = computed(() => {
  const total = moduleSheetOptions.value.length;
  const checked = moduleSheetOptions.value.filter((s) =>
    moduleShareSheetIds.value.has(String(s._id)),
  ).length;
  return {
    checked,
    total,
    indeterminate: checked > 0 && checked < total,
    allSelected: checked === total && total > 0,
  };
});

function toggleModuleShareSelectAll(checked: boolean) {
  moduleShareSheetIds.value = checked
    ? new Set(moduleSheetOptions.value.map((s) => String(s._id)))
    : new Set();
}

const moduleSheetsDropdownLabel = computed(() => {
  const { checked, total, allSelected } = moduleShareSelectAllState.value;
  if (!total) return "No sheets";
  if (allSelected) return `All sheets (${total})`;
  if (checked === 0) return "Select sheets";
  return `${checked} of ${total} sheets selected`;
});

const moduleShareSheetsPayload = computed(() => {
  const allIds: string[] = moduleSheetOptions.value.map((s) =>
    String(s._id),
  );
  if (!allIds.length) return undefined;

  const selected = [...moduleShareSheetIds.value];
  if (!selected.length) return undefined;

  const allSelected =
    selected.length === allIds.length &&
    allIds.every((id: string) => moduleShareSheetIds.value.has(id));

  return allSelected ? undefined : selected;
});

function handleModuleSheetsClickOutside(e: MouseEvent) {
  if (!showModuleSheetsDropdown.value) return;
  const target = e.target as Node;
  if (moduleSheetsDropdownRef.value?.contains(target)) return;
  showModuleSheetsDropdown.value = false;
}

watch(isOpen, (open) => {
  if (!open) {
    showModuleSheetsDropdown.value = false;
    return;
  }
  moduleSheetsInitialized.value = false;
  if (props.resourceType === "module" && moduleSheetOptions.value.length) {
    initModuleShareSheets();
  }
});

watch(moduleSheetsData, (data) => {
  if (
    isOpen.value &&
    props.resourceType === "module" &&
    data?.length &&
    !moduleSheetsInitialized.value
  ) {
    initModuleShareSheets();
  }
});

watch(
  emailEntries,
  (entries) => {
    if (
      entries.length > 0 &&
      isOpen.value &&
      props.resourceType === "module" &&
      moduleSheetOptions.value.length &&
      !moduleSheetsInitialized.value
    ) {
      initModuleShareSheets();
    }
  },
  { deep: true },
);

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  workspace_role_id: null as string | number | null,
  note: "",
});

// ─── Validation ───────────────────────────────────────────────────────────────
const hasSelections = computed(
  () =>
    selectedModulesList.value.size > 0 ||
    selectedSheets.value.size > 0 ||
    selectedUsers.value.size > 0,
);

const canSubmit = computed(() => {
  const hasEmails = emailEntries.value.length > 0;
  const allHaveRoles = emailEntries.value.every((e) => !!e.roleId);
  const hasAnyTarget = hasEmails || hasSelections.value;
  if (!hasAnyTarget) return false;
  if (hasEmails && !allHaveRoles) return false;
  if (
    (props.resourceType === "module" || props.resourceType === "sheet") &&
    hasEmails &&
    !form.workspace_role_id
  )
    return false;
  if (
    props.resourceType === "module" &&
    hasEmails &&
    moduleSheetOptions.value.length > 0 &&
    moduleShareSheetIds.value.size === 0
  )
    return false;
  return true;
});

// ─── Users for autocomplete ───────────────────────────────────────────────────
const { data: allUsersData, refetch: refetchAllUsers } = useUsers();

const allUsers = computed(() => {
  const raw = allUsersData.value as any;
  const users = raw?.data?.users ?? raw?.users ?? [];
  return users
    .map((u: any) => ({
      _id: String(u._id ?? ""),
      name: (u.u_full_name || u.u_email || "").trim(),
      email: (u.u_email || "").trim(),
      profile_image: u.u_profile_image,
    }))
    .filter((u: UserSuggestion) => !!u.email);
});

watch(isOpen, (open) => {
  if (open) {
    refetchAllUsers();
    showSuggestions.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSuggestionDropdownPosition);
  window.removeEventListener("scroll", updateSuggestionDropdownPosition, true);
  document.removeEventListener("mousedown", handleModuleSheetsClickOutside);
});

// ─── Roles ────────────────────────────────────────────────────────────────────
onMounted(() => {
  const id = workspaceId.value || workspaceResourceId.value;
  if (id) agentStore.fetchAgentsRolesPermissions(id);
  window.addEventListener("resize", updateSuggestionDropdownPosition);
  window.addEventListener("scroll", updateSuggestionDropdownPosition, true);
  document.addEventListener("mousedown", handleModuleSheetsClickOutside);
});

const companyIdFromLS = localStorage.getItem("company_id");

const { data: workspaceRolesData } = useWorkspaceRoles(
  { company_id: companyIdFromLS, workspace_id: workspaceResourceId },
  { enabled: computed(() => !!workspaceResourceId.value) },
);

const accessRoles = computed(() => {
  const fromAgent = agentStore.agentsRolesPermissions?.access_roles;
  if (fromAgent?.length) {
    return fromAgent.map((r: any) => ({ _id: r._id, title: r.title }));
  }
  return (workspaceRolesData.value || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  }));
});

const jobRoles = computed(() =>
  (agentStore.agentsRolesPermissions.job_roles || []).map((r: any) => ({
    _id: r._id,
    title: r.title,
  })),
);

// ─── Shared users ─────────────────────────────────────────────────────────────
const { data: sharedUsersData, isLoading: isLoadingSharedUsers } =
  useSharedUsers({
    resource_type: props.resourceType,
    resource_id: props.resourceId || "",
    workspace_id: workspaceId.value,
  });
const sharedUsers = computed(() => sharedUsersData.value || []);

const sharedUserEmails = computed(() => {
  const emails = new Set<string>();
  for (const item of sharedUsers.value as any[]) {
    const email = item?.user?.u_email?.trim().toLowerCase();
    if (email) emails.add(email);
  }
  return emails;
});

const filteredUserSuggestions = computed(() => {
  const pendingEmails = new Set(
    emailEntries.value.map((e) => e.email.trim().toLowerCase()),
  );

  const available: UserSuggestion[] = allUsers.value
    .filter((u: UserSuggestion) => !pendingEmails.has(u.email.toLowerCase()))
    .map((u: UserSuggestion) => ({
      ...u,
      hasAccess: sharedUserEmails.value.has(u.email.toLowerCase()),
    }));

  const q = emailInput.value.trim().toLowerCase();
  if (!q) return [];

  return available
    .filter(
      (u: UserSuggestion) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
    .slice(0, 10);
});

watch(filteredUserSuggestions, () => {
  highlightedSuggestionIndex.value = 0;
});

const { mutate: updateRole } = useUpdateShareRole({
  type: props.resourceType,
  id: props.resourceId || "",
});

const { mutate: removeAccess } = useRemoveShareAccess({
  resource_type: props.resourceType,
  resource_id: props.resourceId || "",
});

function handleUpdateUserRole(item: any, newRole: string | number) {
  updateRole(
    {
      workspace_id: workspaceId.value,
      email: item.user.u_email,
      user_id: item.user._id,
      seat_id: item.seat_id || item._id,
      workspace_access_role_id: newRole,
    },
    {
      onSuccess: async () => {
        toast.success("Role updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["shared-users"] });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update role.");
      },
    },
  );
}

function handleRemoveAccess(item: any) {
  removeAccess(
    {
      workspace_id: workspaceId.value,
      email: item.user.u_email,
      user_id: item.user._id,
      invitation_id: item.invitation_id || item._id,
    },
    {
      onSuccess: async () => {
        toast.success("Access removed successfully");
        await queryClient.invalidateQueries({ queryKey: ["shared-users"] });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to remove access.");
      },
    },
  );
}

// ─── Selection payload ────────────────────────────────────────────────────────
const selectionPayload = computed(() => {
  const allModuleIds = modules.value.map((m: any) => String(m._id));
  const allSheetIds = modules.value.flatMap(
    (m: any) => m.sheets?.map((s: any) => String(s._id)) ?? [],
  );
  const selectedModuleIds = [...selectedModulesList.value];
  const selectedSheetIds = [...selectedSheets.value];
  const isAllModules =
    allModuleIds.length > 0 && selectedModuleIds.length === allModuleIds.length;
  const isAllSheets =
    allSheetIds.length > 0 && selectedSheetIds.length === allSheetIds.length;
  return {
    hasModules: selectedModuleIds.length > 0,
    hasSheets: selectedSheetIds.length > 0,
    modules: isAllModules ? "all" : selectedModuleIds,
    sheets: isAllSheets ? "all" : selectedSheetIds,
  };
});

// ─── Submit ───────────────────────────────────────────────────────────────────
const { mutate: shareResource, isPending: isSharing } = useShareResource();

function submit() {
  if (!canSubmit.value || isSharing.value) return;

  const usersPayload =
    selectedUsers.value.size > 0
      ? Array.from(selectedUsers.value).map((userId) => ({
          user_id: userId,
          workspace_access_role_id: selectedUserRoles.value[userId] || null,
        }))
      : undefined;

  shareResource(
    {
      workspace_id: workspaceId.value || workspaceResourceId.value,
      resource_type: props.resourceType,
      resource_id: props.resourceId,

      // ✅ Per-email role invites
      ...(emailEntries.value.length > 0 && {
        invites: emailEntries.value.map((e) => ({
          email: e.email,
          workspace_access_role_id: e.roleId,
        })),
      }),

      ...((props.resourceType === "module" ||
        props.resourceType === "sheet") && {
        workspace_role_id: form.workspace_role_id,
      }),

      ...(props.resourceType === "module" &&
        moduleShareSheetsPayload.value && {
          sheets: moduleShareSheetsPayload.value,
        }),

      ...(props.resourceType === "workspace" && {
        ...(selectionPayload.value.hasModules && {
          modules: selectionPayload.value.modules,
        }),
        ...(selectionPayload.value.hasSheets && {
          sheets: selectionPayload.value.sheets,
        }),
        ...(usersPayload && { users: usersPayload }),
        note: form.note || "",
      }),
    },
    {
      onSuccess: async () => {
        toast.success(`${title.value} shared successfully`);
        await queryClient.invalidateQueries({ queryKey: ["shared-users"] });
        emit("shared");
        reset();
        isOpen.value = false;
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            `Failed to share ${resourceLabel.value}.`,
        );
      },
    },
  );
}

// ─── Cancel / Reset ───────────────────────────────────────────────────────────
function cancel() {
  reset();
  isOpen.value = false;
}

function reset() {
  form.workspace_role_id = null;
  form.note = "";
  emailEntries.value = [];
  emailInput.value = "";
  emailInputError.value = "";
  showSuggestions.value = false;
  highlightedSuggestionIndex.value = 0;
  selectedModulesList.value = new Set();
  selectedSheets.value = new Set();
  selectedUsers.value = new Set();
  expandedModules.value = new Set();
  selectedUserRoles.value = {};
  moduleShareSheetIds.value = new Set();
  moduleSheetsInitialized.value = false;
  showModuleSheetsDropdown.value = false;
}
// const shareableUsers = computed(() =>
const shareableUsers = computed(() =>
  companyUsers.value.filter((u: any) => u.membership_role !== "owner"),
);
</script>
