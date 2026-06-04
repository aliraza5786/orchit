<template>
  <div class="w-full text-center space-y-3">
    <h2 class="text-[24px] font-medium text-text-primary tracking-tight m-0">
      {{ ai ? "Modules & Sheets" : "Create Modules & Sheets" }}
    </h2>
    <p class="text-sm text-text-secondary mb-0 max-w-[520px] mx-auto leading-relaxed">
      {{
        ai
          ? "Review and customize the modules and sheets for your workspace"
          : "Add modules and sheets to organize your workspace"
      }}
    </p>
  </div>

  <div class="flex flex-col items-start gap-4 w-full min-w-0 max-w-full pb-[90px] sm:pb-[60px]">
    <div
      v-for="(mod, modIdx) in form.modules"
      :key="moduleKey(mod, modIdx)"
      :ref="(el) => setModuleRef(modIdx, el)"
      class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-bg-surface"
    >
      <!-- Module row -->
      <div
        v-if="editingModuleIndex !== modIdx"
        class="relative flex justify-between gap-4 lg:gap-5 items-center w-full min-w-0 p-4"
      >
        <div class="flex gap-3 flex-1 min-w-0">
          <div
            class="w-9 h-9 shrink-0 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-primary"
          >
            <i
              v-if="mod.variables['module-icon']"
              :class="[
                mod.variables['module-icon'].prefix,
                mod.variables['module-icon'].iconName,
              ]"
            />
            <i v-else class="fa-solid fa-cube text-text-secondary" />
          </div>
          <div class="flex flex-col gap-1 min-w-0 text-start">
            <h3 class="font-medium capitalize text-sm text-text-primary">
              {{ mod.variables["module-title"] || "Untitled module" }}
            </h3>
            <p class="text-[11px] text-text-secondary line-clamp-1">
              {{ mod.variables["module-description"] }}
            </p>
            <span class="text-[11px] text-text-secondary">
              {{ mod.sheets?.length || 0 }} sheet{{
                (mod.sheets?.length || 0) === 1 ? "" : "s"
              }}
            </span>
          </div>
        </div>
        <div class="flex gap-4 items-center shrink-0">
          <button
            type="button"
            class="w-5 h-5 text-base aspect-square flex justify-center items-center rounded cursor-pointer text-text-secondary hover:text-accent transition-colors"
            title="Edit module"
            @click="editModule(mod, modIdx)"
          >
            <i class="fa-solid fa-edit text-[16px]"></i>
          </button>
          <button
            type="button"
            class="w-5 h-5 text-base aspect-square flex justify-center items-center rounded cursor-pointer text-text-secondary hover:text-red-400 transition-colors"
            title="Remove module"
            @click="removeModule(modIdx)"
          >
            <i class="fa-regular fa-trash text-[16px]"></i>
          </button>
          <button
            type="button"
            class="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            :aria-expanded="expandedModules.has(modIdx)"
            @click="toggleExpanded(modIdx)"
          >
            <i
              class="fa-solid text-xs"
              :class="
                expandedModules.has(modIdx) ? 'fa-chevron-up' : 'fa-chevron-down'
              "
            />
          </button>
        </div>
      </div>

      <!-- Inline module edit (StepTwo form style) -->
      <div
        v-else
        class="w-full min-w-0 max-w-full overflow-hidden px-4 pt-4"
      >
        <h1 class="text-lg text-text-primary mb-3 font-semibold">Update Module</h1>
        <div class="space-y-4 mb-4">
          <div class="min-w-0 max-w-full overflow-hidden">
            <IconPicker
              v-model="newModule['module-icon']"
              :relevantIcons="projectManagementModuleIcons"
            />
            <p class="text-[11px] text-text-secondary mt-2 m-0">
              Search {{ projectManagementModuleIcons.length }} project-management icons (teams, planning, analytics, folders…)
            </p>
          </div>
          <BaseTextField
            label="Module name"
            placeholder="Module name"
            size="lg"
            v-model="newModule['module-title']"
            :error="!!moduleTitleError"
            :message="moduleTitleError"
            @blur="moduleTouched.title = true"
          />
          <BaseTextAreaField
            v-model="newModule['module-description']"
            label="Description"
            placeholder="What this module covers"
            :error="!!moduleDescError"
            :message="moduleDescError"
            @blur="moduleTouched.description = true"
          />
        </div>
        <div class="flex flex-wrap gap-2 mt-4 justify-end border-t border-border py-4">
          <Button size="md" variant="primary" @click="handleUpdateModule()">
            Update Module
          </Button>
          <Button size="md" variant="secondary" @click="handleCancelModule">
            Cancel
          </Button>
        </div>
      </div>

      <!-- Sheets under module -->
      <div
        v-if="expandedModules.has(modIdx) && editingModuleIndex !== modIdx"
        class="w-full min-w-0 max-w-full overflow-hidden px-4 pb-4 pt-3 space-y-2 box-border border-t border-border"
      >
        <p class="text-[11px] font-medium text-text-secondary m-0">
          Sheets
        </p>

        <template v-for="(sheet, sheetIdx) in mod.sheets || []" :key="sheetKey(sheet, sheetIdx)">
          <!-- Sheet row -->
          <div
            v-if="!isSheetEditing(modIdx, sheetIdx)"
            class="rounded-lg flex justify-between gap-3 items-center w-full min-w-0 max-w-full p-3 transition-all bg-bg-card border border-border box-border"
          >
            <div class="flex gap-3 flex-1 min-w-0">
              <div
                class="w-8 h-8 shrink-0 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-primary text-sm"
              >
                <i
                  v-if="sheet.variables['sheet-icon']"
                  :class="[
                    sheet.variables['sheet-icon'].prefix,
                    sheet.variables['sheet-icon'].iconName,
                  ]"
                />
                <i v-else class="fa-solid fa-table text-text-secondary" />
              </div>
              <div class="flex flex-col gap-1 min-w-0 text-start">
                <h4 class="font-medium text-sm text-text-primary m-0">
                  {{ sheet.variables["sheet-title"] }}
                </h4>
                <p class="text-[11px] text-text-secondary line-clamp-1 m-0">
                  {{ sheet.variables["sheet-description"] }}
                </p>
              </div>
            </div>
            <div class="flex gap-4 items-center shrink-0">
              <button
                type="button"
                class="w-5 h-5 text-base aspect-square flex justify-center items-center rounded cursor-pointer text-text-secondary hover:text-accent transition-colors"
                @click="editSheet(modIdx, sheet, sheetIdx)"
              >
                <i class="fa-solid fa-edit text-[16px]"></i>
              </button>
              <button
                type="button"
                class="w-5 h-5 text-base aspect-square flex justify-center items-center rounded cursor-pointer text-text-secondary hover:text-red-400 transition-colors"
                @click="removeSheet(modIdx, sheetIdx)"
              >
                <i class="fa-regular fa-trash text-[16px]"></i>
              </button>
            </div>
          </div>

          <!-- Inline sheet edit -->
          <div
            v-else
            class="w-full min-w-0 max-w-full overflow-hidden box-border rounded-lg border border-border bg-bg-card px-4 pt-4"
          >
            <h1 class="text-lg text-text-primary mb-3 font-semibold">Update Sheet</h1>
            <div class="space-y-4 mb-4">
              <div class="min-w-0 max-w-full overflow-hidden">
                <IconPicker
                  v-model="newSheet['sheet-icon']"
                  :relevantIcons="projectManagementSheetIcons"
                />
                <p class="text-[11px] text-text-secondary mt-2 m-0">
                  Search {{ projectManagementSheetIcons.length }} icons for boards, lists, calendars, tasks, and files
                </p>
              </div>
              <BaseTextField
                label="Sheet name"
                placeholder="Sheet name"
                size="lg"
                v-model="newSheet['sheet-title']"
                :error="!!sheetTitleError"
                :message="sheetTitleError"
                @blur="sheetTouched.title = true"
              />
              <BaseTextAreaField
                v-model="newSheet['sheet-description']"
                label="Description"
                placeholder="What this sheet is for"
                :error="!!sheetDescError"
                :message="sheetDescError"
                @blur="sheetTouched.description = true"
              />
              <BaseTextField
                label="To-do hint (optional)"
                placeholder="e.g. Collect new tasks"
                size="lg"
                v-model="newSheet['to-do']"
              />
            </div>
            <div class="flex flex-wrap gap-2 mt-4 justify-end border-t border-border py-4">
              <Button size="md" variant="primary" @click="saveSheet(modIdx)">
                Update Sheet
              </Button>
              <Button size="md" variant="secondary" @click="cancelSheetForm">
                Cancel
              </Button>
            </div>
          </div>
        </template>

        <!-- Add sheet form -->
        <div
          v-if="isAddingSheet(modIdx)"
          class="w-full min-w-0 max-w-full overflow-hidden box-border rounded-lg border border-border bg-bg-card px-4 pt-4"
        >
          <h1 class="text-lg text-text-primary mb-3 font-semibold">Add Sheet</h1>
          <div class="space-y-4 mb-4 min-w-0 max-w-full">
            <div class="min-w-0 max-w-full overflow-hidden">
              <IconPicker
                v-model="newSheet['sheet-icon']"
                :relevantIcons="projectManagementSheetIcons"
              />
              <p class="text-[11px] text-text-secondary mt-2 m-0">
                Search {{ projectManagementSheetIcons.length }} icons for boards, lists, calendars, tasks, and files
              </p>
            </div>
            <BaseTextField
              label="Sheet name"
              placeholder="Sheet name"
              size="lg"
              v-model="newSheet['sheet-title']"
              :error="!!sheetTitleError"
              :message="sheetTitleError"
              @blur="sheetTouched.title = true"
            />
            <BaseTextAreaField
              v-model="newSheet['sheet-description']"
              label="Description"
              placeholder="What this sheet is for"
              :error="!!sheetDescError"
              :message="sheetDescError"
              @blur="sheetTouched.description = true"
            />
            <BaseTextField
              label="To-do hint (optional)"
              placeholder="e.g. Collect new tasks"
              size="lg"
              v-model="newSheet['to-do']"
            />
          </div>
          <div class="flex flex-wrap gap-2 mt-4 justify-end border-t border-border py-4">
            <Button size="md" variant="primary" @click="saveSheet(modIdx)">
              Add Sheet
            </Button>
            <Button size="md" variant="secondary" @click="cancelSheetForm">
              Cancel
            </Button>
          </div>
        </div>

        <label
          v-else-if="addingSheetFor !== modIdx"
          class="rounded-lg w-full min-w-0 max-w-full relative p-3 cursor-pointer transition-all bg-bg-card border border-border block box-border"
          @click="startAddSheet(modIdx)"
        >
          <div class="flex gap-2 items-center justify-center">
            <div class="p-2 bg-accent rounded-full">
              <img class="w-2.5" src="../../../assets/icons/whitePlus.svg" alt="" />
            </div>
            <span class="font-medium text-sm text-text-primary">Add Sheet</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Add module -->
    <label
      v-if="!isAddingNewModule"
      class="rounded-lg w-full relative p-4 cursor-pointer transition-all bg-bg-surface border border-border"
      @click="handleAddModuleClick"
    >
      <div class="flex gap-2 items-center justify-center">
        <div class="p-2.5 bg-accent rounded-full">
          <img class="w-3" src="../../../assets/icons/whitePlus.svg" alt="" />
        </div>
        <div class="flex flex-col justify-center">
          <h3 class="font-medium capitalize text-sm text-text-primary">Add Module</h3>
          <p class="text-[11px] text-text-secondary mt-1 line-clamp-1">
            Create a module, then add sheets inside it
          </p>
        </div>
      </div>
    </label>

    <div
      v-else
      class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-bg-surface px-4 pt-4 box-border"
    >
      <h1 class="text-lg text-text-primary mb-3 font-semibold">Add Module</h1>
      <div class="space-y-4 mb-4 min-w-0 max-w-full">
        <div class="min-w-0 max-w-full overflow-hidden">
          <IconPicker
            v-model="newModule['module-icon']"
            :relevantIcons="projectManagementModuleIcons"
          />
          <p class="text-[11px] text-text-secondary mt-2 m-0">
            Search {{ projectManagementModuleIcons.length }} project-management icons (teams, planning, analytics, folders…)
          </p>
        </div>
        <BaseTextField
          label="Module name"
          placeholder="Module name"
          size="lg"
          v-model="newModule['module-title']"
          :error="!!moduleTitleError"
          :message="moduleTitleError"
          @blur="moduleTouched.title = true"
        />
        <BaseTextAreaField
          v-model="newModule['module-description']"
          label="Description"
          placeholder="What this module covers"
          :error="!!moduleDescError"
          :message="moduleDescError"
          @blur="moduleTouched.description = true"
        />
      </div>
      <div class="flex gap-2 mt-4 justify-end border-t border-border bg-bg-surface py-4">
        <Button size="md" variant="primary" @click="handleAddModule()">
          Add Module
        </Button>
        <Button size="md" variant="secondary" @click="handleCancelModule">
          Cancel
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick, type ComponentPublicInstance } from "vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import Button from "../../../components/ui/Button.vue";
import BaseTextAreaField from "../../../components/ui/BaseTextAreaField.vue";
import IconPicker, { type IconPrefix, type IconValue } from "../../Product/components/IconPicker.vue";
import { useWorkspaceStore } from "../../../stores/workspace";
import {
  projectManagementModuleIcons,
  projectManagementSheetIcons,
} from "../../../data/primeIconsNames";

defineProps<{ ai: boolean }>();

function toIconValue(raw: unknown): IconValue {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { prefix?: string; iconName?: string };
  if (!o.iconName?.trim()) return null;
  const prefix: IconPrefix =
    o.prefix === "fa" || o.prefix === "fa-regular" || o.prefix === "fa-solid"
      ? o.prefix
      : "fa-regular";
  return { prefix, iconName: o.iconName };
}

type UiSheet = {
  variables: {
    "sheet-title": string;
    "sheet-description": string;
    "sheet-icon": IconValue;
    "to-do"?: string;
    id?: string;
  };
};

type UiModule = {
  variables: {
    "module-title": string;
    "module-description": string;
    "module-icon": IconValue;
    id?: string;
  };
  sheets: UiSheet[];
};

const workspaceStore = useWorkspaceStore();
const form = ref<{ modules: UiModule[] }>({
  modules: normalizeModules(workspaceStore.workspace?.modules),
});

const editingModuleIndex = ref(-1);
const isAddingNewModule = ref(false);
const expandedModules = ref(new Set<number>());
const addingSheetFor = ref<number | null>(null);
const sheetEditMode = ref(false);
const editingSheetIndex = ref(-1);

const moduleRefs = new Map<number, HTMLElement>();

function resolveEl(el: Element | ComponentPublicInstance | null): HTMLElement | undefined {
  if (!el) return undefined;
  if (el instanceof HTMLElement) return el;
  const root = (el as ComponentPublicInstance).$el;
  return root instanceof HTMLElement ? root : undefined;
}

function setModuleRef(modIdx: number, el: Element | ComponentPublicInstance | null) {
  const node = resolveEl(el);
  if (node) moduleRefs.set(modIdx, node);
  else moduleRefs.delete(modIdx);
}

function scrollToEl(el: HTMLElement | undefined) {
  if (!el) return;
  nextTick(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }));
}

const emptyModule = () => ({
  id: "",
  "module-title": "",
  "module-description": "",
  "module-icon": null as IconValue,
});

const emptySheet = () => ({
  id: "",
  "sheet-title": "",
  "sheet-description": "",
  "sheet-icon": null as IconValue,
  "to-do": "",
});

const newModule = ref(emptyModule());
const newSheet = ref(emptySheet());

const moduleTouched = reactive({ title: false, description: false });
const sheetTouched = reactive({ title: false, description: false });

const moduleTitleError = computed(() => {
  if (!moduleTouched.title) return "";
  const v = (newModule.value["module-title"] || "").trim();
  if (!v) return "Module name is required";
  if (v.length < 2) return "Module name must be at least 2 characters";
  return "";
});

const moduleDescError = computed(() =>
  !moduleTouched.description
    ? ""
    : (newModule.value["module-description"] || "").trim()
      ? ""
      : "Description is required",
);

const sheetTitleError = computed(() => {
  if (!sheetTouched.title) return "";
  const v = (newSheet.value["sheet-title"] || "").trim();
  if (!v) return "Sheet name is required";
  return "";
});

const sheetDescError = computed(() =>
  !sheetTouched.description
    ? ""
    : (newSheet.value["sheet-description"] || "").trim()
      ? ""
      : "Description is required",
);

function normalizeModules(raw: unknown): UiModule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((m: any, i: number) => ({
    variables: {
      id: m?.variables?.id || `module-${i + 1}`,
      "module-title": m?.variables?.["module-title"] || "",
      "module-description": m?.variables?.["module-description"] || "",
      "module-icon": toIconValue(m?.variables?.["module-icon"]),
    },
    sheets: (m?.sheets || []).map((s: any, j: number) => ({
      variables: {
        id: s?.variables?.id || `sheet-${i + 1}-${j + 1}`,
        "sheet-title": s?.variables?.["sheet-title"] || "",
        "sheet-description": s?.variables?.["sheet-description"] || "",
        "sheet-icon": toIconValue(s?.variables?.["sheet-icon"]),
        "to-do": s?.variables?.["to-do"] || "",
      },
    })),
  }));
}

function moduleKey(mod: UiModule, idx: number) {
  return mod.variables.id || `mod-${idx}`;
}

function sheetKey(sheet: UiSheet, idx: number) {
  return sheet.variables.id || `sheet-${idx}`;
}

function isSheetEditing(modIdx: number, sheetIdx: number) {
  return addingSheetFor.value === modIdx && sheetEditMode.value && editingSheetIndex.value === sheetIdx;
}

function isAddingSheet(modIdx: number) {
  return addingSheetFor.value === modIdx && !sheetEditMode.value;
}

function toggleExpanded(modIdx: number) {
  const next = new Set(expandedModules.value);
  if (next.has(modIdx)) next.delete(modIdx);
  else next.add(modIdx);
  expandedModules.value = next;
}

function closeAllForms() {
  editingModuleIndex.value = -1;
  isAddingNewModule.value = false;
  addingSheetFor.value = null;
  sheetEditMode.value = false;
  editingSheetIndex.value = -1;
  newModule.value = emptyModule();
  newSheet.value = emptySheet();
  moduleTouched.title = false;
  moduleTouched.description = false;
  sheetTouched.title = false;
  sheetTouched.description = false;
}

function handleAddModuleClick() {
  closeAllForms();
  isAddingNewModule.value = true;
}

function handleCancelModule() {
  closeAllForms();
}

function validateModuleForm() {
  moduleTouched.title = true;
  moduleTouched.description = true;
  if (!newModule.value["module-icon"]) return false;
  return !moduleTitleError.value && !moduleDescError.value;
}

function validateSheetForm() {
  sheetTouched.title = true;
  sheetTouched.description = true;
  if (!newSheet.value["sheet-icon"]) return false;
  return !sheetTitleError.value && !sheetDescError.value;
}

function handleAddModule() {
  if (!validateModuleForm()) return;
  const id = `module-${form.value.modules.length + 1}`;
  form.value.modules.push({
    variables: { ...newModule.value, id },
    sheets: [],
  });
  const newIdx = form.value.modules.length - 1;
  expandedModules.value = new Set([...expandedModules.value, newIdx]);
  closeAllForms();
  scrollToEl(moduleRefs.get(newIdx));
}

function handleUpdateModule() {
  if (!validateModuleForm() || editingModuleIndex.value < 0) return;
  const idx = editingModuleIndex.value;
  const existing = form.value.modules[idx];
  form.value.modules[idx] = {
    ...existing,
    variables: { ...newModule.value, id: existing.variables.id },
  };
  closeAllForms();
}

function editModule(mod: UiModule, modIdx: number) {
  closeAllForms();
  newModule.value = {
    id: mod.variables.id || "",
    "module-title": mod.variables["module-title"],
    "module-description": mod.variables["module-description"],
    "module-icon": toIconValue(mod.variables["module-icon"]),
  };
  editingModuleIndex.value = modIdx;
  expandedModules.value = new Set([...expandedModules.value, modIdx]);
  scrollToEl(moduleRefs.get(modIdx));
}

function removeModule(modIdx: number) {
  if (editingModuleIndex.value === modIdx) closeAllForms();
  form.value.modules.splice(modIdx, 1);
  expandedModules.value = new Set(
    [...expandedModules.value]
      .filter((i) => i !== modIdx)
      .map((i) => (i > modIdx ? i - 1 : i)),
  );
}

function startAddSheet(modIdx: number) {
  closeAllForms();
  addingSheetFor.value = modIdx;
  newSheet.value = emptySheet();
  expandedModules.value = new Set([...expandedModules.value, modIdx]);
  scrollToEl(moduleRefs.get(modIdx));
}

function cancelSheetForm() {
  addingSheetFor.value = null;
  sheetEditMode.value = false;
  editingSheetIndex.value = -1;
  newSheet.value = emptySheet();
  sheetTouched.title = false;
  sheetTouched.description = false;
}

function saveSheet(modIdx: number) {
  if (!validateSheetForm()) return;
  const mod = form.value.modules[modIdx];
  if (!mod.sheets) mod.sheets = [];
  const sheetVars = { ...newSheet.value };
  if (sheetEditMode.value && editingSheetIndex.value >= 0) {
    const existing = mod.sheets[editingSheetIndex.value];
    mod.sheets[editingSheetIndex.value] = {
      variables: { ...sheetVars, id: existing.variables.id },
    };
  } else {
    mod.sheets.push({
      variables: { ...sheetVars, id: `sheet-${modIdx + 1}-${mod.sheets.length + 1}` },
    });
  }
  cancelSheetForm();
}

function editSheet(modIdx: number, sheet: UiSheet, sheetIdx: number) {
  closeAllForms();
  addingSheetFor.value = modIdx;
  sheetEditMode.value = true;
  editingSheetIndex.value = sheetIdx;
  newSheet.value = {
    id: sheet.variables.id || "",
    "sheet-title": sheet.variables["sheet-title"],
    "sheet-description": sheet.variables["sheet-description"],
    "sheet-icon": toIconValue(sheet.variables["sheet-icon"]),
    "to-do": sheet.variables["to-do"] || "",
  };
  expandedModules.value = new Set([...expandedModules.value, modIdx]);
  scrollToEl(moduleRefs.get(modIdx));
}

function removeSheet(modIdx: number, sheetIdx: number) {
  if (isSheetEditing(modIdx, sheetIdx)) cancelSheetForm();
  form.value.modules[modIdx]?.sheets?.splice(sheetIdx, 1);
}

function saveToStoreHandler() {
  workspaceStore.setWorkspace({
    ...workspaceStore.workspace,
    variables: { ...workspaceStore.workspace?.variables },
    modules: form.value.modules.map((m) => ({
      variables: { ...m.variables },
      sheets: (m.sheets || []).map((s) => ({ variables: { ...s.variables } })),
    })),
  });
}

function continueHandler(): void {
  closeAllForms();
  saveToStoreHandler();
  emit("next");
}

defineExpose({ continueHandler });
const emit = defineEmits(["next"]);

onMounted(() => {
  form.value.modules = normalizeModules(workspaceStore.workspace?.modules);
});
</script>
