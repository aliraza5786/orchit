<template>
  <div
    :class="[
      'max-w-[358px] flex-grow rounded-[6px] border border-border overflow-y-auto overflow-x-hidden relative transition-all',
      'text-text-primary bg-bg-surface',
      workspaceStore.showSettingPanel
        ? 'translate-x-0 min-w-full sm:min-w-[380px] w-full h-full'
        : 'translate-x-100 !max-w-0 h-0',
    ]"
  >
    <!-- Header -->
    <div
      class="flex justify-between items-center border-b border-border px-3 pt-2.5 pb-2 sticky top-0 z-10 bg-bg-surface"
    >
      <h5 class="text-[16px] font-medium">Space Details</h5>
      <div
        class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
      >
        <i class="text-text-primary fa-solid fa-close" @click="closeHandler"></i>
      </div>
    </div>

    <div class="flex px-3 py-3 flex-col">
      <!-- Workspace Identity -->
      <div class="flex items-center justify-between w-full gap-2">
        <div class="flex items-center gap-3.5 min-w-0">
          <!-- Logo + hover overlay -->
          <div class="relative group">
            <img
              :src="logoPreview || workspace.logo || dummy"
              class="w-12 h-12 min-w-12 object-cover aspect-square rounded-lg border border-border"
              alt="workspace logo"
            />
            <button
              type="button"
              class="absolute inset-0 rounded-lg bg-bg-dropdown opacity-0 group-hover:opacity-100 transition grid place-items-center text-text-primary text-xs"
              :disabled="isUploadingLogo"
              @click="triggerLogoPicker"
              aria-label="Change logo"
            >
              <div class="flex items-center justify-center gap-1.5">
                <span
                  v-if="isUploadingLogo"
                  class="inline-block h-5 w-5 rounded-full border-2 border-border border-t-text-primary animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                ></span>
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </button>
            <input ref="logoInputRef" type="file" accept="image/*" class="hidden" @change="onLogoPicked" />
          </div>

          <!-- Title (click to edit) -->
          <div class="min-w-0">
            <template v-if="!isEditingTitle">
              <h3
                class="text-lg font-medium truncate cursor-text text-text-primary"
                @click="startEditTitle"
                v-tooltip="'Click to rename'"
              >
                {{ editableTitle }}
              </h3>
            </template>
            <template v-else>
              <input
                ref="titleInputRef"
                v-model="editableTitle"
                class="px-2 py-1 rounded-md border border-border bg-g-input text-text-primary text-xl font-medium outline-none min-w-[120px] max-w-[220px]"
                @keydown.enter.prevent="saveTitle"
                @keydown.esc.prevent="cancelEditTitle"
                @blur="saveTitle"
              />
            </template>
            <p class="text-xs text-text-secondary mt-0.5" v-if="workspace?.created_at">
              Created at {{ formatDateTime(workspace.created_at) }}
            </p>
          </div>
        </div>

        <!-- Workspace Color (brand color) Picker -->
        <div class="shrink-0">
          <label
            class="cursor-pointer block w-8 h-8 rounded-full shadow-sm border border-border/20 overflow-hidden relative"
            :style="{ backgroundColor: editableWorkspaceColor }"
            v-tooltip="'Change workspace color'"
          >
            <input
              type="color"
              v-model="editableWorkspaceColor"
              @change="saveWorkspaceColor"
              class="opacity-0 absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div v-if="switchState === 'details'" class="space-y-3 w-full">
        <!-- Appearance: Light / Dark / System -->
        <div class="mt-5">
          <h3 class="text-sm font-medium text-text-secondary mb-2">Appearance</h3>
          <div class="p-1 bg-bg-body border border-border/40 rounded-full flex items-center gap-1">
            <button
              type="button"
              @click="setTheme('light')"
              class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-sm font-medium transition-all"
              :class="theme === 'light' ? 'bg-primary-color text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'"
            >
              <i v-if="theme === 'light'" class="fa-solid fa-check text-xs"></i>
              <i v-else class="fa-regular fa-sun"></i>
              <span>Light</span>
            </button>
            <button
              type="button"
              @click="setTheme('dark')"
              class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-sm font-medium transition-all"
              :class="theme === 'dark' ? 'bg-primary-color text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'"
            >
              <i v-if="theme === 'dark'" class="fa-solid fa-check text-xs"></i>
              <i v-else class="fa-regular fa-moon"></i>
              <span>Dark</span>
            </button>
            <button
              type="button"
              @click="setTheme('system')"
              class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-sm font-medium transition-all"
              :class="theme === 'system' ? 'bg-primary-color text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'"
            >
              <i v-if="theme === 'system'" class="fa-solid fa-check text-xs"></i>
              <i v-else class="fa-solid fa-desktop"></i>
              <span>Device</span>
            </button>
          </div>
        </div>

        <!-- Members list -->
        <div class="mt-4 space-y-3">
          <div v-for="user in people" :key="user._id || user.id" class="flex items-center justify-between py-2.5">
            <div class="flex items-start gap-3 w-full">
              <div class="w-9 h-9 aspect-square rounded-full flex items-center justify-center bg-bg-surface text-text-primary font-semibold">
                {{ getInitials(user?.name) }}
              </div>
              <div class="w-full">
                <div class="flex justify-between w-full items-start">
                  <div>
                    <div class="text-sm font-medium text-text-secondary capitalize">{{ user.name }}</div>
                    <div class="text-xs text-text-secondary">{{ user.email }}</div>
                  </div>
                  <div class="space-x-2 flex items-center">
                    <span
                      v-if="user.status != 'accepted'"
                      :class="['rounded-lg px-2 mt-1 inline-flex justify-center items-center py-0.5 text-xs', statusStyle(user.status)]"
                    >
                      {{ user.status }}
                    </span>
                    <DropMenu :items="getMenuItems(user)">
                      <template #trigger>
                        <i class="fa-solid fa-ellipsis cursor-pointer"></i>
                      </template>
                    </DropMenu>
                  </div>
                </div>
                <div v-if="user.role === 'Owner'" class="text-sm text-text-secondary font-medium">
                  {{ user.role }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-t border-border" />

        <!-- Color Palette + Brand Toggle -->
        <div class="space-y-6 rounded-xl w-full max-w-md">
          <div> 
            <div class="grid grid-cols-4 gap-4">
              <!-- Preset palette swatches -->
              <button
                v-for="(color, index) in currentPalette"
                :key="index"
                type="button"
                class="w-16 h-16 rounded-2xl cursor-pointer border-2  flex items-center justify-center relative transition-all hover:scale-105 active:scale-95 bg-bg-body "
                :class="isSwatchSelected(index) ? 'border-primary-color' : 'border-transparent'"
                @click="handleSwatchClick(index)"
                aria-label="Select color"
              >
                <div class="w-12 h-12 rounded-full overflow-hidden relative shadow-sm border border-border">
                  <div class="absolute inset-0 h-1/2 w-full top-0" :style="{ backgroundColor: color.value }"></div>
                  <div class="absolute h-1/2 w-1/2 bottom-0 left-0" :style="{ backgroundColor: color['primary-color'] }"></div>
                  <div class="absolute h-1/2 w-1/2 bottom-0 right-0 bg-bg-surface"></div>
                </div>
                <div
                  v-if="isSwatchSelected(index)"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-bg-card z-20 shadow-sm"
                  :style="{ backgroundColor: isDark ? '#b8f397' : '#386a20' }"
                >
                  <i class="fa-solid fa-check text-[10px]" :class="isDark ? 'text-black' : 'text-white'"></i>
                </div>
              </button>

              <!-- Custom Color Picker -->
              <div
                @click="triggerColorPicker"
                class="relative w-16 h-16 rounded-2xl border-2 flex items-center justify-center bg-bg-body/50 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
                :class="isCustomColorActive ? 'border-primary-color' : 'border-transparent'"
              >
                <input
                  ref="customColorInput"
                  type="color"
                  :value="customHex"
                  @input="handleCustomColor($event)"
                  class="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                />
                <div class="w-12 h-12 rounded-full border-2 border-dashed border-text-secondary/40 flex items-center justify-center group-hover:border-primary-color transition-colors">
                  <i class="fa-solid fa-eye-dropper text-text-secondary group-hover:text-primary-color"></i>
                </div>
                <div
                  v-if="isCustomColorActive"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-bg-card z-20 shadow-sm pointer-events-none"
                  :style="{ backgroundColor: isDark ? '#b8f397' : '#386a20' }"
                >
                  <i class="fa-solid fa-check text-[10px]" :class="isDark ? 'text-black' : 'text-white'"></i>
                </div>
              </div>
            </div>
          </div>

          <hr class="border-t border-border/60" />

          <!-- Follow Brand Colors Toggle -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-text-primary">Follow brand colors</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" :checked="isBrandMode" class="sr-only peer" @change="handleBrandToggle" />
              <div
                class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-color"
              ></div>
            </label>
          </div>

          <hr class="border-t border-border/60" />

          <!-- Storage -->
          <div v-if="workspace.usage_stats?.storage">
            <h3 class="text-sm font-medium text-text-secondary mb-2">Workspace Storage</h3>
            <div class="bg-bg-body border border-border/40 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden group">
              <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center gap-2.5">
                  <div class="p-2 bg-primary-color/10 rounded-lg text-primary-color group-hover:scale-110 transition-transform duration-300">
                    <i class="fa-regular fa-cloud text-lg"></i>
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-text-primary block">Storage</span>
                    <span class="text-xs text-text-secondary">
                      {{ workspace.usage_stats.storage.used_mb?.toFixed(2) }} MB used
                    </span>
                  </div>
                </div>
                <div v-if="workspace.usage_stats.storage.total_allowed_mb !== 'unlimited'" class="text-right">
                  <span class="text-sm font-bold text-text-primary">{{ Math.round(storagePercentage) }}%</span>
                  <span class="text-[10px] text-text-secondary block uppercase tracking-wider font-bold">Capacity</span>
                </div>
                <div
                  v-else
                  class="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20"
                >
                  <i class="fa-solid fa-infinity text-xs"></i>
                  <span class="text-[10px] font-bold uppercase tracking-wider">Unlimited</span>
                </div>
              </div>
              <div class="relative h-2.5 w-full bg-border/40 rounded-full overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer-fast"></div>
                <div
                  v-if="workspace.usage_stats.storage.total_allowed_mb !== 'unlimited'"
                  class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-color to-primary-color rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(125,104,200,0.3)]"
                  :style="{ width: `${storagePercentage}%` }"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
                </div>
                <div
                  v-else
                  class="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-primary-color/40 via-primary-color to-primary-color/40 rounded-full animate-shimmer-slow"
                  style="background-size: 200% 100%"
                ></div>
              </div>
              <div
                v-if="workspace.usage_stats.storage.total_allowed_mb !== 'unlimited'"
                class="flex justify-between items-center text-[11px] font-medium text-text-secondary relative z-10"
              >
                <span>0 MB</span>
                <span class="px-1.5 py-0.5 bg-bg-surface rounded text-text-primary">
                  {{ workspace.usage_stats.storage.total_allowed_mb }} MB Limit
                </span>
              </div>
              <div v-else class="text-[11px] font-medium text-text-secondary italic">
                * Your workspace has no storage limits.
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div>
            <div class="bg-bg-body rounded-xl p-4 space-y-3">
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-text-primary">Delete Workspace</h4>
                  <p class="text-xs text-text-secondary mt-1">
                    Permanently delete this workspace and all of its data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="w-full px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="openDeleteModal"
                :disabled="!isAdmin"
                :class="isAdmin? 'cursor-pointer':'cursor-not-allowed'"

              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Logs -->
      <ActivityTimeline v-else />
    </div>
  </div>

  <!-- Delete Workspace Confirmation Modal -->
  <ConfirmDeleteModal
    v-model="showDeleteModal"
    title="Delete Workspace"
    :item-label="'workspace'"
    :item-name="displayTitle"
    :require-match-text="displayTitle"
    :loading="isDeletingWorkspace"
    confirm-text="Delete Workspace"
    size="lg"
    @confirm="handleDeleteWorkspace"
    @cancel="showDeleteModal = false"
  >
    <template #message>
      <p class="text-sm text-text-secondary">
        This action cannot be undone. This will permanently delete the workspace
        <span class="font-semibold text-text-primary">{{ displayTitle }}</span>
        and all of its data, including:
      </p>
      <ul class="mt-2 text-sm text-text-secondary list-disc list-inside space-y-1">
        <li>All tasks and cards</li>
        <li>All team members and permissions</li>
        <li>All files and attachments</li>
        <li>All workspace settings</li>
      </ul>
    </template>
  </ConfirmDeleteModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import ActivityTimeline from "./ActivityTimeline.vue";
import { useWorkspaceStore } from "../../../stores/workspace";
import { getInitials } from "../../../utilities";
import { formatDateTime } from "../../../utilities/FormatDate";
import {
  useDeleteInvitedPeople,
  useDeleteWorkspace,
  useInvitePeople,
  useUpdateWorkspaceDetail,
  useWorkspacesRoles,
} from "../../../queries/useWorkspace";
import { usePermissions } from "../../../composables/usePermissions";
const { canInviteUser, canEditUser } = usePermissions();
import DropMenu from "../../../components/ui/DropMenu.vue";
import { useQueryClient } from "@tanstack/vue-query";
import { toast } from "vue-sonner";
import { useTheme } from "../../../composables/useTheme";
import dummy from "../../../assets/global/dummy.jpeg";
import { useRouteIds } from "../../../composables/useQueryParams";
import { usePrivateUploadFile } from "../../../queries/useCommon";
import ConfirmDeleteModal from "../../../views/Product/modals/ConfirmDeleteModal.vue";
import { useRouter } from "vue-router";
import {
  lightColors,
  darkColors,
  applyThemeVariables,
  generateThemeFromColor,
  buildBrandModeThemeColors, 
  getPaletteIndex,
  getPresetByIndex,
} from "../../../utilities/themeUtils";
const {isAdmin} = usePermissions();

// ─── Setup ────────────────────────────────────────────────────────────────────

const queryClient = useQueryClient();
const router = useRouter();
const { workspaceId } = useRouteIds();
const { theme, setTheme, isDark } = useTheme();
const props = defineProps<{ workspace: any }>();

const workspaceStore = useWorkspaceStore();
const { data: roles } = useWorkspacesRoles(props.workspace._id);
const { mutate: updateWS } = useUpdateWorkspaceDetail({
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  },
});

const switchState = ref<"details" | "active-logs">("details");

// ─── Palette ──────────────────────────────────────────────────────────────────

const currentPalette = computed(() => (isDark.value ? darkColors : lightColors));

// Seed store.themeColors from props on mount if the store doesn't have it yet.
// Ensures the brand-mode computed has data before any user interaction.
if (!workspaceStore.themeColors && props.workspace?.variables?.themeColors) {
  workspaceStore.setThemeColors(props.workspace.variables.themeColors);
}

// ─── Brand Mode Detection ─────────────────────────────────────────────────────
// Read from workspaceStore.themeColors — this is updated synchronously on every
// action (handleSwatchClick, handleBrandToggle, etc.) so the UI reacts instantly,
// without waiting for props to propagate back from the parent.

const isBrandMode = computed(() => {
  const tc = workspaceStore.themeColors;
  return !tc || !tc.value;
});

// ─── Selected palette index (-1 = none / custom / brand mode) ─────────────────
// Index-based so the same visual position is preserved when switching light↔dark.

const selectedIndex = ref<number>(-1);
const customHex = ref<string>("");

// Seed from store on mount, then keep in sync as store changes
// (e.g. route switch loads a different workspace)
watch(
  () => workspaceStore.themeColors,
  (tc) => {
    if (!tc || !tc.value) {
      selectedIndex.value = -1;
      customHex.value = "";
      return;
    }
    const idx = getPaletteIndex(tc.value, isDark.value);
    if (idx !== -1) {
      selectedIndex.value = idx;
      customHex.value = "";
    } else {
      selectedIndex.value = -1;
      customHex.value = tc.color ?? "";
    }
  },
  { immediate: true }
);

// ─── Computed swatch active states ───────────────────────────────────────────

function isSwatchSelected(index: number): boolean {
  return !isBrandMode.value && selectedIndex.value === index;
}

const isCustomColorActive = computed(
  () => !isBrandMode.value && selectedIndex.value === -1 && !!customHex.value
);

// ─── Brand color swatch (the round color picker in the header) ────────────────

const editableWorkspaceColor = ref<string>(
  props.workspace?.variables?.["workspace-color"] ?? "#7D68C8"
);

watch(
  () => props.workspace?.variables?.["workspace-color"],
  (v) => { if (v) editableWorkspaceColor.value = v; }
);

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Apply brand mode:
 * - themeColors has no .value → getWorkspaceBackground returns var(--bg-body)
 * - primary-color driven by workspace-color
 */
function activateBrandMode() {
  const brandColor = editableWorkspaceColor.value;
  const themeColors = buildBrandModeThemeColors(brandColor);

  applyThemeVariables({ "primary-color": brandColor, "secondary-color": themeColors["secondary-color"] }, isDark.value);
  workspaceStore.setBackground("var(--bg-body)");
  workspaceStore.setThemeColors(themeColors);

  const variables = {
    ...props.workspace?.variables,
    themeColors,
    theme: "",
  };

  workspaceStore.updateSingleWorkspaceLocal({ variables });
  updateWS({ workspace_id: workspaceId.value, variables });
}

/**
 * Apply a palette preset by index.
 */
function activatePresetByIndex(index: number) {
  const preset = currentPalette.value[index];
  if (!preset) return;

  const themeColors = {
    "primary-color": preset["primary-color"],
    "secondary-color": preset["secondary-color"],
    value: preset.value,
    color: preset.color,
  };

  applyThemeVariables(themeColors, isDark.value);
  workspaceStore.setBackground(preset.value);
  workspaceStore.setThemeColors(themeColors);

  const variables = {
    ...props.workspace?.variables,
    themeColors,
    theme: "",
  };

  workspaceStore.updateSingleWorkspaceLocal({ variables });
  updateWS({ workspace_id: workspaceId.value, variables });
}

/**
 * Apply a custom hex color (not in palette).
 * Generates light/dark variants for all theme properties.
 */
function activateCustomColor(hex: string) {
  // Generate for BOTH modes so we can store both and switch seamlessly
  const lightTheme = generateThemeFromColor(hex, false);
  const darkTheme  = generateThemeFromColor(hex, true);

  const themeColors = {
    ...(isDark.value ? darkTheme : lightTheme),
    // Store both variants so mode-switch can pick the right one
    lightVariant: lightTheme,
    darkVariant: darkTheme,
    color: hex,
  };

  applyThemeVariables(themeColors, isDark.value);
  workspaceStore.setBackground(themeColors.value);
  workspaceStore.setThemeColors(themeColors);

  const variables = {
    ...props.workspace?.variables,
    themeColors,
    theme: "",
  };

  workspaceStore.updateSingleWorkspaceLocal({ variables });
  updateWS({ workspace_id: workspaceId.value, variables });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** User clicks a palette swatch */
function handleSwatchClick(index: number) {
  selectedIndex.value = index;
  customHex.value = "";
  activatePresetByIndex(index);
}

/** User toggles the brand-mode checkbox */
function handleBrandToggle() {
  if (isBrandMode.value) {
    // Currently brand mode → turn OFF → select first preset
    selectedIndex.value = 0;
    customHex.value = "";
    activatePresetByIndex(0);
  } else {
    // Currently color scheme → turn ON → deselect swatch, activate brand mode
    selectedIndex.value = -1;
    customHex.value = "";
    activateBrandMode();
  }
}

/** User picks a custom color from the color input */
function handleCustomColor(event: Event) {
  const hex = (event.target as HTMLInputElement).value;
  selectedIndex.value = -1;
  customHex.value = hex;
  activateCustomColor(hex);
}

/** Save workspace brand color (the round swatch) */
function saveWorkspaceColor() {
  const c = editableWorkspaceColor.value;

  workspaceStore.updateSingleWorkspaceLocal({
    variables: { "workspace-color": c },
  });
  updateWS({
    workspace_id: workspaceId.value,
    variables: { "workspace-color": c },
  });

  // If brand mode is active, re-apply so primary-color updates immediately
  if (isBrandMode.value) {
    activateBrandMode();
  }
}

// ─── Mode Switch (light ↔ dark ↔ system) ─────────────────────────────────────
// When the user switches appearance mode:
//   • Brand mode → re-apply brand mode for new palette
//   • Preset index → find same index in new palette and apply
//   • Custom hex → re-generate light/dark variants for the same hex

watch(isDark, (dark) => {
  if (isBrandMode.value) {
    activateBrandMode();
    return;
  }

  const tc = props.workspace?.variables?.themeColors;

  if (selectedIndex.value !== -1) {
    // Preserve selection by index across palettes
    const preset = getPresetByIndex(selectedIndex.value, dark);
    if (preset) {
      const themeColors = {
        "primary-color": preset["primary-color"],
        "secondary-color": preset["secondary-color"],
        value: preset.value,
        color: preset.color,
      };
      applyThemeVariables(themeColors, dark);
      workspaceStore.setBackground(preset.value);
      workspaceStore.setThemeColors(themeColors);

      const variables = { ...props.workspace?.variables, themeColors, theme: "" };
      workspaceStore.updateSingleWorkspaceLocal({ variables });
      updateWS({ workspace_id: workspaceId.value, variables });
    }
    return;
  }

  // Custom color — use stored variant if available, else re-generate
  const hex = customHex.value || tc?.color;
  if (hex) {
    const variant = dark ? tc?.darkVariant : tc?.lightVariant;
    if (variant) {
      const themeColors = { ...variant, lightVariant: tc?.lightVariant, darkVariant: tc?.darkVariant, color: hex };
      applyThemeVariables(themeColors, dark);
      workspaceStore.setBackground(themeColors.value);
      workspaceStore.setThemeColors(themeColors);

      const variables = { ...props.workspace?.variables, themeColors, theme: "" };
      workspaceStore.updateSingleWorkspaceLocal({ variables });
      updateWS({ workspace_id: workspaceId.value, variables });
    } else {
      activateCustomColor(hex);
    }
  }
});

// ─── Custom color input ref ───────────────────────────────────────────────────

const customColorInput = ref<HTMLInputElement | null>(null);
function triggerColorPicker() { customColorInput.value?.click(); }

// ─── Title edit ───────────────────────────────────────────────────────────────

const people = computed(() => props.workspace?.people ?? []);
const displayTitle = computed(() => props.workspace?.variables?.title ?? "Workspace");
const isEditingTitle = ref(false);
const editableTitle = ref(displayTitle.value);
const titleInputRef = ref<HTMLInputElement | null>(null);

watch(displayTitle, (t) => {
  if (!isEditingTitle.value) editableTitle.value = t;
});

function startEditTitle() {
  isEditingTitle.value = true;
  nextTick(() => titleInputRef.value?.focus());
}
function cancelEditTitle() {
  isEditingTitle.value = false;
  editableTitle.value = displayTitle.value;
}
function saveTitle() {
  const t = editableTitle.value?.trim();
  if (!t || t === displayTitle.value) { isEditingTitle.value = false; return; }
  isEditingTitle.value = false;
  workspaceStore.updateSingleWorkspaceLocal({ variables: { title: editableTitle.value } });
  updateWS({ workspace_id: workspaceId.value, variables: { title: editableTitle.value } });
}

// ─── Logo upload ──────────────────────────────────────────────────────────────

const logoInputRef = ref<HTMLInputElement | null>(null);
const isUploadingLogo = ref(false);
const logoPreview = ref<string>("");

function triggerLogoPicker() { logoInputRef.value?.click(); }

const { mutate } = usePrivateUploadFile({
  onSuccess: (data: any) => {
    isUploadingLogo.value = false;
    const url: string | undefined = data?.data?.url;
    if (!url) { toast.error("Upload succeeded but no URL was returned."); return; }
    updateWS({ workspace_id: workspaceId.value, logo: url });
  },
  onError: () => {
    isUploadingLogo.value = false;
    toast.error("File upload failed. Please try again.");
  },
});

async function onLogoPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input?.files?.length) {
    const fd = new FormData();
    fd.append("file", input.files[0]);
    isUploadingLogo.value = true;
    mutate(fd);
  }
}

// ─── Invite ───────────────────────────────────────────────────────────────────

const inviteEmails = ref<string[]>([]);
const emailError = ref<string>("");
const inviteRole = ref<string>("");
const { mutate: invitePeople } = useInvitePeople();
const deleteUser = useDeleteInvitedPeople({
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
});

watch(roles, (val) => {
  if (Array.isArray(val) && val.length && !inviteRole.value) {
    inviteRole.value = val[0]._id;
  }
}, { immediate: true });

const canInvite = computed(
  () => canInviteUser.value && inviteEmails.value.length > 0 && !emailError.value && !!inviteRole.value
);

function extractNameFromEmail(email: string) {
  const local = (email.split("@")[0] || "").split("+")[0];
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean);
  if (!parts.length) return email;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}

function sendInvites() {
  if (!canInvite.value || !canInviteUser.value) return;
  const tmFeature = workspaceStore.getFeature("team_members");
  if (tmFeature) {
    const { current } = tmFeature.usage;
    const { limit } = tmFeature.limits;
    if (limit > 0 && current + inviteEmails.value.length > limit) {
      workspaceStore.setLimitExccedModal(true);
      return;
    }
  }
  invitePeople(
    {
      workspace_id: props.workspace._id,
      emails: inviteEmails.value.map((e) => ({ name: extractNameFromEmail(e), email: e })),
    },
    {
      onSuccess: (data: any) => {
        if (data?.failed) toast.error(data?.failedInvites[0]?.error);
        else toast.success("Invite sent successfully");
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        inviteEmails.value = [];
        emailError.value = "";
      },
      onError: (err: any) => {
        emailError.value = err?.response?.data?.message || err?.message || "Failed to send invitations.";
      },
    }
  );
}

// ─── Member helpers ───────────────────────────────────────────────────────────

const statusStyle = (status: string) => {
  switch (status) {
    case "pending":  return "bg-amber-600 text-white";
    case "accepted": return "bg-blue-600 text-white";
    case "rejected": return "bg-red-600 text-white";
    default:         return "bg-gray-500 text-white";
  }
};

function getMenuItems(user: any) {
  const items: any[] = [
    { label: "Remove User", danger: true, action: () => handleRemoveUser(user) },
  ];
  if (user.status !== "accepted") {
    items.push({
      label: "Reinvite",
      action: () => { inviteEmails.value = [user.email]; sendInvites(); },
    });
  }
  return items;
}

function handleRemoveUser(user: any) {
  if (!canEditUser.value) return;
  deleteUser.mutate({ id: user.id });
}

// ─── Close ────────────────────────────────────────────────────────────────────

function closeHandler() { workspaceStore.toggleSettingPanel(); }

// ─── Delete workspace ─────────────────────────────────────────────────────────

const showDeleteModal = ref(false);
const isDeletingWorkspace = ref(false);

const { mutate: deleteWorkspace } = useDeleteWorkspace({
  onSuccess: () => {
    toast.success("Workspace deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    showDeleteModal.value = false;
    workspaceStore.toggleSettingPanel();
    router.push("/");
  },
  onError: (err: any) => {
    isDeletingWorkspace.value = false;
    toast.error(err?.response?.data?.message || err?.message || "Failed to delete workspace");
  },
});

function openDeleteModal() { showDeleteModal.value = true; }

function handleDeleteWorkspace() {
  isDeletingWorkspace.value = true;
  deleteWorkspace({ id: props.workspace._id });
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const storagePercentage = computed(() => {
  const s = props.workspace?.usage_stats?.storage;
  if (!s) return 0;
  if (s.total_allowed_mb === "unlimited") return 0;
  const total = Number(s.total_allowed_mb);
  if (!total || isNaN(total)) return 0;
  return Math.min(((Number(s.used_mb) || 0) / total) * 100, 100);
});
</script>

<style scoped>
@keyframes shimmer-slow {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes shimmer-fast {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer-slow { animation: shimmer-slow 8s linear infinite; }
.animate-shimmer-fast { animation: shimmer-fast 2s infinite; }
</style>