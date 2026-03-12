<template>
  <div class="relative w-full h-full flex overflow-hidden">

    <div
      ref="mindMapRef"
      class="flex-1 h-full overflow-hidden rounded-md relative mindmap-container"
      style="height: 600px; width: 100%"
    ></div>
    <!-- ── Sheet selector — opens when a List node is clicked, closes on selection ── -->
    <Teleport to="body">
      <transition name="fade">
        
        <div
          v-if="sheetSelector.visible"
          class="sheet-selector-popover"
          :style="{ top: sheetSelector.y + 'px', left: sheetSelector.x + 'px' }"
          @click.stop
        >
        <div class="flex justify-end -mt-2 text-xs cursor-pointer">
          <button @click="sheetSelector.visible =false"><i class="fa-solid fa-xmark cursor-pointer"></i></button>
        </div>
          <p class="sheet-selector-label">Select sheet for new cards</p>
          <p v-if="showMustSelectMessage" class="text-xs text-red-500 mb-2 flex items-center gap-1">
    <i class="fa-solid fa-circle-exclamation"></i>
    Please select a sheet first to add a card.
  </p>
          <BaseSelectField
            size="md"
            label="Select Sheet"
            placeholder="Select Sheet"
            :options="sheetOptions"
            :model-value="sheetSelector.selectedSheetId"
            :allowCustom="false"
            @update:modelValue="(val: string | number | null) => {
            selectedListSheetId = String(val ?? '');
            sheetSelector.selectedSheetId = String(val ?? '');
            // Always confirm on selection — works for both 'info' and 'required' modes
            if (sheetSelectorMode === 'required') {
              confirmSheetSelection();
            } else {
              closeSheetSelector();
            }
          }"
          />
        </div>
      </transition>
    </Teleport>

    <!-- Format sidebar -->
    <div
      v-if="showFormatSidebar && canAssignCard && canEditCard && canCreateCard"
      class="format-sidebar h-full py-4 px-4 w-[320px] border-l bg-bg-card overflow-x-hidden overflow-y-auto flex flex-col"
    >
      <div class="flex items-center justify-between pb-3 mb-4 border-b">
        <h3 class="text-sm font-semibold text-secondary">Format Node</h3>
        <button @click="showFormatSidebar = false" class="text-gray-400 hover:text-gray-700">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="format-content space-y-6">
        <div>
          <h4 class="text-xs font-semibold text-secondary uppercase mb-3">Colors</h4>
          <div class="format-group mb-3">
            <label class="block text-xs text-secondary mb-1">Background</label>
            <div class="flex items-center gap-2">
              <div class="h-10 w-10 rounded-md border cursor-pointer relative" :style="{ backgroundColor: activeFormatStyle.background }">
                <input type="color" :value="activeFormatStyle.background" class="absolute inset-0 opacity-0 cursor-pointer" @input="onStyleChange('bg_color', $event)" style="pointer-events: all" />
              </div>
              <input :value="activeFormatStyle.background" placeholder="#3b82f6" class="flex-1 px-2 py-1 border rounded text-sm bg-bg-surface" readonly />
            </div>
          </div>
          <div class="format-group mb-3">
            <label class="block text-xs text-secondary mb-1">Text</label>
            <div class="flex items-center gap-2">
              <div class="h-10 w-10 rounded-md border cursor-pointer relative" :style="{ backgroundColor: activeFormatStyle.color }">
                <input type="color" :value="activeFormatStyle.color" class="absolute inset-0 opacity-0 cursor-pointer" @input="onStyleChange('color', $event)" style="pointer-events: all" />
              </div>
              <input :value="activeFormatStyle.color" placeholder="#3b82f6" class="flex-1 px-2 py-1 border rounded text-sm bg-bg-surface" readonly />
            </div>
          </div>
        </div>
        <div>
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-xs text-secondary mb-1">Weight</label>
              <select class="w-full h-8 border rounded px-2 text-sm" :value="activeFormatStyle.fontWeight" @change="onStyleChange('font_weight', $event)">
                <option value="lighter">Light</option>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="bolder">Extra Bold</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 pt-4">
        <button
          class="w-full cursor-pointer bg-gradient-to-tr from-accent to-accent-hover text-white flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium hover:shadow-md disabled:opacity-60"
          :disabled="isSavingNodeStyle"
          @click="saveNodeStyle"
        >
          <span v-if="isSavingNodeStyle" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isSavingNodeStyle ? "Updating..." : "Update" }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Hyperlink modal -->
  <div v-if="showHyperlinkModal && canAssignCard && canEditCard && canCreateCard" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-xl w-80">
      <h3 class="text-lg font-semibold mb-4">Insert Web Link</h3>
      <input v-model="hyperlink" type="text" placeholder="Enter or paste a URL" class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <div class="flex justify-end gap-2 mt-4">
        <button @click="cancelHyperlink" class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
        <button :disabled="!hyperlink" @click="confirmHyperlink" :class="['px-4 py-2 rounded-md text-white', hyperlink ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed']">Insert</button>
      </div>
    </div>
  </div>

  <!-- Add list -->
  <div v-if="activeAddList" class="absolute top-40 left-70 bg-bg-body rounded-lg p-4 shadow-lg z-100 min-w-[328px] border" @click.stop>
    <input autofocus v-model="newColumn" placeholder="Add New list" @keyup.enter="emitAddColumn" class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent bg-bg-surface" />
    <p class="text-xs mt-1.5">You can add details while editing</p>
    <div class="flex items-center mt-3 gap-3">
      <button @click="emitAddColumn" class="px-3 py-1 bg-accent cursor-pointer text-white rounded text-sm">
        {{ addingList ? "Adding..." : "Add list" }}
      </button>
      <i class="fa-solid fa-close cursor-pointer" @click="emit('toggle-add-list')"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, watch, toRaw, watchEffect, nextTick, onBeforeUnmount, reactive,
} from "vue";
import MindElixir from "mind-elixir";
import { toast } from "vue-sonner";
import { useTheme } from "../../composables/useTheme";
import { request } from "../../libs/api";
import BaseSelectField from "../ui/BaseSelectField.vue";
import { useSheets } from "../../queries/useSheets";
import { useRoute } from "vue-router";
const props = defineProps<{
  listsData: any[];
  selectedSheetId: string;
  selectedViewBy: string;
  workspaceId: string;
  moduleId: string;
  addingList: boolean;
  activeAddList: boolean;
  newColumn: string;
  canCreateCard: boolean;
  canEditCard: boolean;
  canDeleteCard: boolean;
  canAssignCard: boolean;
  canCreateSheet: boolean;
  canCreateVariable: boolean;
  canEditSheet: boolean;
}>();

const emit = defineEmits<{
  (e: "select:ticket", card: any): void;
  (e: "delete:ticket", cardId: string): void;
  (e: "create:sheet", payload: { variables: Record<string, string>; workspace_id: string; workspace_module_id: string; is_ai_generated: boolean }): void;
  (e: "create:card", payload: any): void;
  (e: "update:card", payload: any): void;
  (e: "update:sheet", payload: any): void;
  (e: "reorder:card", payload: any): void;
  (e: "toggle-add-list"): void;
  (e: "add-column", value: string): void;
}>();

const { isDark } = useTheme();
const mindMapRef = ref<HTMLElement | null>(null);
const mindMapInstance = ref<any>(null);
const selectedMindNode = ref<any>(null);
const showFormatSidebar = ref(false);
const showHyperlinkModal = ref(false);
const hyperlink = ref("");
const isSavingNodeStyle = ref(false);
const resolveCallback = ref<((link: string) => void) | null>(null);
const route = useRoute();
const selectedListSheetId = ref<string>(props.selectedSheetId);

// ── Sheet selector popover state ──────────────────────────────────────────────
const sheetSelector = reactive({
  visible: false,
  x: 0,
  y: 0,
  selectedSheetId: "",
  listNodeObj: null as any,
});

const module_id = ref(localStorage.getItem("selectedModuleId") || "");
const { data } = useSheets({
  workspace_id: props.workspaceId,
  workspace_module_id: module_id,
});

interface DropdownOption { _id: string; title: string; }

const transformedData = computed<DropdownOption[]>(() =>
  (data.value || []).map((item: any) => ({
    _id: item._id,
    title: item?.variables?.["sheet-title"] ?? item._id,
  }))
);

const sheetOptions = computed(() =>
  transformedData.value.map(sheet => ({ _id: sheet._id, title: sheet.title }))
);

function positionAndOpenSelector(nodeObj: any, mode: 'info' | 'required' = 'info') {
  const el = (
    mindMapRef.value?.querySelector(`[nodeid="${nodeObj.id}"]`) ??
    mindMapRef.value?.querySelector(`me-wrapper[nodeid="${nodeObj.id}"]`) ??
    mindMapRef.value?.querySelector(`[data-nodeid="${nodeObj.id}"]`) ??
    document.getElementById(nodeObj.id)
  ) as HTMLElement | null;

  if (el) {
    const rect = el.getBoundingClientRect();
    sheetSelector.x = Math.min(rect.left, window.innerWidth - 260);
    sheetSelector.y = Math.min(rect.bottom + 6, window.innerHeight - 160);
  } else {
    const mapRect = mindMapRef.value?.getBoundingClientRect();
    sheetSelector.x = (mapRect?.left ?? 100) + (mapRect?.width ?? 400) / 2 - 110;
    sheetSelector.y = (mapRect?.top ?? 100) + (mapRect?.height ?? 400) / 2 - 80;
  }

  // Pre-select whatever was chosen last (or the prop fallback)
  sheetSelector.selectedSheetId = selectedListSheetId.value || nodeObj.sheet_id || props.selectedSheetId || "";
  sheetSelector.listNodeObj = nodeObj;
  sheetSelectorMode.value = mode;
  sheetSelector.visible = true;
}
function confirmSheetSelection() {
  closeSheetSelector();
  if (pendingAddChildResolve.value) {
    pendingAddChildResolve.value(true); 
    pendingAddChildResolve.value = null;
  }
}
const showMustSelectMessage = ref(false);

function closeSheetSelector() {
  // If a child add is pending, don't close — just show the message
  if (pendingAddChildResolve.value) {
    setTimeout(() => { showMustSelectMessage.value = false; }, 2500);
    return;
  }
  sheetSelector.visible = false;
  sheetSelector.listNodeObj = null;
}

// ── Interfaces ────────────────────────────────────────────────────────────────
interface MindNodeStyle {
  background?: string; color?: string; fontSize?: string; fontWeight?: string;
  fontStyle?: string; fontFamily?: string; borderColor?: string;
  borderWidth?: string; borderRadius?: string; padding?: string; hyperLink?: string;
}
interface MindNode {
  id: string; sheet_id: string; seat_id?: string; topic: string;
  style: MindNodeStyle; _originalStyle: Record<string, any>;
  children: MindNode[]; parent?: MindNode; isRoot?: boolean;
  unique_name?: string; variables?: any; hyperLink?: string;
}

const DEFAULT_BACKEND_STYLE = {
  bg_color: "#ffffff", color: "#000000", font_size: 14, font_weight: "normal",
  font_style: "normal", font_family: "Inter", border_color: "#cccccc",
  border_width: 0, border_radius: 0, padding: 0,
};

const activeFormatStyle = computed<MindNodeStyle>(() => {
  if (selectedMindNode.value?.nodeObj?.style) return selectedMindNode.value.nodeObj.style;
  return mapBackendStyleToMindElixir(DEFAULT_BACKEND_STYLE);
});

function mapBackendStyleToMindElixir(style: any = {}): MindNodeStyle {
  return {
    background: style.bg_color, color: style.color,
    fontSize: style.font_size != null ? `${style.font_size}px` : undefined,
    fontWeight: style.font_weight, fontStyle: style.font_style, fontFamily: style.font_family,
    borderColor: style.border_color,
    borderWidth: style.border_width != null ? `${style.border_width}px` : undefined,
    borderRadius: style.border_radius != null ? `${style.border_radius}px` : undefined,
    padding: style.padding != null ? `${style.padding}px` : undefined,
    hyperLink: style.hyperLink || undefined,
  };
}

function applyNodeStyle(nodeObj: any, element?: HTMLElement) {
  if (!nodeObj || !element || !nodeObj.style) return;
  const topic = element.querySelector(".topic, tpc") as HTMLElement | null;
  const nodeWrapper = (element.querySelector(".node") as HTMLElement | null) ?? element;
  const s = nodeObj.style;
  if (s.background) nodeWrapper.style.background = s.background;
  if (s.color && topic) topic.style.color = s.color;
  if (topic) {
    if (s.fontSize) topic.style.fontSize = s.fontSize;
    if (s.fontFamily) topic.style.fontFamily = s.fontFamily;
    if (s.fontWeight) topic.style.fontWeight = s.fontWeight;
    if (s.fontStyle) topic.style.fontStyle = s.fontStyle;
  }
  if (s.borderColor) nodeWrapper.style.borderColor = s.borderColor;
  if (s.borderWidth) nodeWrapper.style.borderWidth = s.borderWidth;
  if (s.borderRadius) nodeWrapper.style.borderRadius = s.borderRadius;
  if (s.padding) nodeWrapper.style.padding = s.padding;
}

function resolveStyle<T>(ui: T | undefined, orig: T | undefined, def: T): T {
  return ui !== undefined ? ui : orig !== undefined ? orig : def;
}

function onStyleChange(prop: string, event: Event) {
  if (!selectedMindNode.value?.nodeObj) return;
  const node = selectedMindNode.value.nodeObj;
  if (!node.style) node.style = {};
  const target = event.target as HTMLInputElement;
  const value = target.type === "number" ? Number(target.value) : target.value;
  const map: Record<string, () => void> = {
    bg_color:      () => { node.style.background   = value; },
    color:         () => { node.style.color        = value; },
    font_size:     () => { node.style.fontSize     = `${value}px`; },
    font_weight:   () => { node.style.fontWeight   = value; },
    font_style:    () => { node.style.fontStyle    = value; },
    font_family:   () => { node.style.fontFamily   = value; },
    border_color:  () => { node.style.borderColor  = value; },
    border_width:  () => { node.style.borderWidth  = `${value}px`; },
    border_radius: () => { node.style.borderRadius = `${value}px`; },
    padding:       () => { node.style.padding      = `${value}px`; },
  };
  map[prop]?.();
  const el = document.getElementById(node.id);
  if (el) applyNodeStyle(node, el);
}

async function saveNodeStyle() {
  const node = selectedMindNode.value?.nodeObj;
  if (!node || isSavingNodeStyle.value) return;
  isSavingNodeStyle.value = true;
  try {
    const plainNode = toRaw(node);
    if (!plainNode._originalStyle) plainNode._originalStyle = {};
    const style = plainNode.style || {};
    const orig = plainNode._originalStyle;
    const p = {
      bg_color:      resolveStyle(style.background, orig.bg_color, DEFAULT_BACKEND_STYLE.bg_color),
      color:         resolveStyle(style.color, orig.color, DEFAULT_BACKEND_STYLE.color),
      font_size:     resolveStyle(style.fontSize ? parseInt(style.fontSize) : undefined, orig.font_size, DEFAULT_BACKEND_STYLE.font_size),
      font_weight:   resolveStyle(style.fontWeight, orig.font_weight, DEFAULT_BACKEND_STYLE.font_weight),
      font_style:    resolveStyle(style.fontStyle, orig.font_style, DEFAULT_BACKEND_STYLE.font_style),
      font_family:   resolveStyle(style.fontFamily, orig.font_family, DEFAULT_BACKEND_STYLE.font_family),
      border_color:  resolveStyle(style.borderColor, orig.border_color, DEFAULT_BACKEND_STYLE.border_color),
      border_width:  resolveStyle(style.borderWidth ? parseInt(style.borderWidth) : undefined, orig.border_width, DEFAULT_BACKEND_STYLE.border_width),
      border_radius: resolveStyle(style.borderRadius ? parseInt(style.borderRadius) : undefined, orig.border_radius, DEFAULT_BACKEND_STYLE.border_radius),
      padding:       resolveStyle(style.padding ? parseInt(style.padding) : undefined, orig.padding, DEFAULT_BACKEND_STYLE.padding),
      hyperLink: hyperlink.value || plainNode.hyperLink || "",
    };
    plainNode._originalStyle = { ...p };
    if (plainNode.unique_name === "sheet") {
      emit("update:sheet", { sheet_id: plainNode.id, workspace_id: props.workspaceId, workspace_module_id: props.moduleId, style: p });
    } else {
      emit("update:card", { card_id: plainNode.id, seat_id: plainNode.seat_id, style: p });
    }
  } finally {
    isSavingNodeStyle.value = false;
  }
}

function openHyperlinkModal(cb: (link: string) => void) {
  hyperlink.value = ""; showHyperlinkModal.value = true; resolveCallback.value = cb;
}
function confirmHyperlink() {
  if (resolveCallback.value) resolveCallback.value(hyperlink.value);
  showHyperlinkModal.value = false;
}
function cancelHyperlink() { showHyperlinkModal.value = false; }

// ── Build mind map ────────────────────────────────────────────────────────────
function buildMindMapDataAllSheets(sheetsData: any[]): MindNode {
  const root: MindNode = {
    id: "root", sheet_id: "", topic: localStorage.getItem("currentName") ?? "",
    isRoot: true, children: [], style: {}, _originalStyle: {}, unique_name: "root",
  };
  if (!Array.isArray(sheetsData)) return root;
  const variablesMap: Record<string, MindNode> = {};

  sheetsData.forEach((sheet) => {
    const title = sheet.variables?.["sheet-title"] || localStorage.getItem("selectedSprintTitle");
    const link = sheet.style?.hyperLink || "";
    if (!variablesMap[title]) {
      variablesMap[title] = {
        id: sheet._id, sheet_id: "", topic: title, variables: sheet?.variables,
        children: [], style: sheet?.style, _originalStyle: sheet?.style || {},
        unique_name: "sheet", hyperLink: link,
      };
      root.children.push(variablesMap[title]);
    }
    const listNode: MindNode = {
      id: sheet?._id,
      sheet_id: sheet?._id,  // ✅ sheet_id stored on List node
      topic: sheet.title, children: [],
      style: mapBackendStyleToMindElixir(sheet?.style),
      _originalStyle: sheet.style || {}, unique_name: "List", hyperLink: link,
    };
    (sheet.cards || []).forEach((card: any, i: number) => {
      listNode.children.push({
        id: card._id || `card-${i}`, sheet_id: card?.sheet_id, seat_id: card.seat_id,
        topic: card["card-title"], style: mapBackendStyleToMindElixir(card.style),
        _originalStyle: card.style || {}, children: [], unique_name: "card",
        hyperLink: card.style?.hyperLink || "",
      });
    });
    variablesMap[title].children.push(listNode);
  });
  return root;
}

async function handleReorderCard(payload: {
  workspace_id: string; card_id: string; group_value: string;
  group_variable_id: string; new_index: number; sheet_id: string;
}) {
  try {
    await request({ url: "workspace/cards/group-card-order", method: "PATCH", data: payload });
    emit("reorder:card", payload);
  } catch (e) { console.error("Failed to reorder card:", e); }
}

function createDefaultCardPayload(nodeObj: any, sheet: any, sheet_id?: string) {
  const now = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const payload: any = {
    sheet_list_id: sheet?.topic || "To Do",
    workspace_id: props.workspaceId,
    sheet_id: sheet_id ?? props.selectedSheetId,
    variables: {
      "card-status": sheet?.topic || "To Do",
      priority: "medium",
      process: null,
      "card-title": nodeObj.topic || "New Card",
      "card-description": "",
      "start-date": startDate,
      "end-date": endDate,
    },
    createdAt: new Date().toISOString(),
  };

  if (route.path.includes("plan")) {
    payload.sprint_id = localStorage.getItem("activeSprintId") || null;
  }

  return payload;
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
let toolbarObserver: MutationObserver | null = null;
function injectToolbarButton() {
  const toolbar = mindMapRef.value?.querySelector(".mind-elixir-toolbar.rb") as HTMLElement;
  if (!toolbar || toolbar.querySelector(".open-sidebar-btn")) return;
  const btn = document.createElement("button");
  btn.className = "open-sidebar-btn me-toolbar-btn ms-2";
  btn.title = "Open Formatting Sidebar";
  btn.innerHTML = `<i class="fa-solid fa-sidebar"></i>`;
  btn.addEventListener("click", () => { showFormatSidebar.value = !showFormatSidebar.value; });
  toolbar.appendChild(btn);
}
function setupToolbarObserver() {
  toolbarObserver?.disconnect(); toolbarObserver = null;
  const container = mindMapRef.value?.querySelector(".mind-elixir-toolbar.rb")?.parentElement;
  if (!container) return;
  toolbarObserver = new MutationObserver(() => injectToolbarButton());
  toolbarObserver.observe(container, { childList: true, subtree: true });
  injectToolbarButton();
}

const contextMenuExtendOptions: any[] = [];
if (props.canEditCard || props.canEditSheet) {
  contextMenuExtendOptions.push({
    name: "Update Node",
    onclick: () => {
      showFormatSidebar.value = false;
      const node = selectedMindNode.value?.nodeObj;
      if (node) emit("select:ticket", node);
    },
  });
  contextMenuExtendOptions.push({
    name: "Add Hyperlink",
    onclick: () => { openHyperlinkModal(async () => { await saveNodeStyle(); }); },
  });
}
const pendingAddChildResolve = ref<((val: boolean) => void) | null>(null);
const sheetSelectorMode = ref<'info' | 'required'>('info');
// ── Main watchEffect ──────────────────────────────────────────────────────────
watchEffect(() => {
  if (!mindMapRef.value || !props.listsData) return;

  nextTick(() => {
    const rootNode = buildMindMapDataAllSheets(props.listsData);
    if (mindMapInstance.value) { mindMapInstance.value.destroy?.(); mindMapInstance.value = null; }

    const temporaryNodeIds = new Set<string>();
    const temporaryNodeSheetIds = new Map<string, string>();
    const temporaryNodeParents = new Map<string, any>();
    const savedNodeIds = new Set<string>();
    const createdSheetNodeIds = new Set<string>();

    const instance = new MindElixir({
      el: mindMapRef.value as HTMLElement,
      theme: isDark.value ? MindElixir.DARK_THEME : MindElixir.THEME,
      draggable: true, contextMenu: true, toolBar: true,
      keypress: true, locale: "en", overflowHidden: false,
      contextMenuOption: {
        Update: props.canEditCard && props.canEditSheet && props.canCreateCard,
        extend: contextMenuExtendOptions,
      },
      before: {
  addChild(el: any, obj: any) {
    console.log(el , obj);
    
    const currentNode = (this as any).currentNode?.nodeObj;
    if (currentNode?.unique_name === "card") return false;

    // If parent is a List node, block until sheet is selected
    if (currentNode?.unique_name === "List" && props.canCreateCard) {
      selectedListSheetId.value = currentNode.sheet_id || props.selectedSheetId;
      nextTick(() => positionAndOpenSelector(currentNode, 'required'));

      // Return a Promise — MindElixir will wait for it
      return new Promise<boolean>((resolve) => {
        toast.error("Please select sheet first.")
        showMustSelectMessage.value=true;
        pendingAddChildResolve.value = resolve;
      });
    }

    return true;
  },
  insertSibling(el: any, obj: any) {
    console.log(el , obj);
    return (this as any).currentNode?.nodeObj?.parent?.unique_name !== "card";
  },
},
    });

    mindMapInstance.value = instance;
    instance.init({ nodeData: rootNode });
    nextTick(() => { setTimeout(() => instance.toCenter(), 300); });
    nextTick(() => { setupToolbarObserver(); });

    // ── selectNode: if List → open sheet selector so user can pre-select sheet ──
    instance.bus.addListener("selectNode", (nodeObj: any) => {
      if (!nodeObj) return;
      selectedMindNode.value = { nodeObj };

      if (nodeObj.unique_name === "List" && props.canCreateCard) {
        // Update selectedListSheetId to the sheet_id stored on this List node
        // so even without opening the dropdown, we have a sane default
        selectedListSheetId.value = nodeObj.sheet_id || props.selectedSheetId;
        nextTick(() => positionAndOpenSelector(nodeObj));
      } else {
        closeSheetSelector();
      }
    });

    instance.bus.addListener("renderNode" as any, (event: any) => {
      if (!event?.nodeObj || !event?.element) return;
      applyNodeStyle(event.nodeObj, event.element as HTMLElement);
    });

    const getSheetParent = (node: any): any => {
      let cur = node;
      while (cur) { if (cur.unique_name === "sheet") return cur; cur = cur.parent; }
      return null;
    };

    instance.bus.addListener("operation", async (data: any) => {
      if (!data) { toast.error("You do not have permission to perform this action."); return; }

      if (["moveNode", "moveNodeBefore", "moveNodeAfter"].includes(data.name)) {
        if (!props.canEditCard) return;
        const { obj: dragged, target } = data;
        if (!dragged || dragged.unique_name !== "card" || !target) return;
        const sourceList = dragged._originalParent || dragged.parent;
        if (!sourceList || sourceList.unique_name !== "List") return;
        const targetList = target.unique_name === "List" ? target : target.parent;
        if (!targetList || targetList.unique_name !== "List") return;
        const targetSheet = getSheetParent(targetList);
        if (!targetSheet) return;
        const newIndex = targetList.children.findIndex((c: any) => c.id === dragged.id);
        if (newIndex === -1) return;
        dragged._originalParent = targetList;
        await handleReorderCard({
          workspace_id: props.workspaceId, card_id: dragged.id,
          group_value: targetList.topic, group_variable_id: props.selectedViewBy,
          new_index: newIndex, sheet_id: targetSheet.id,
        });
        return;
      }

      if (data.name === "removeNode") {
        const n = data.obj;
        if (!n?.id || n.unique_name !== "card" || !props.canDeleteCard) return;
        emit("delete:ticket", n.id);
        return;
      }

      if (data.name === "addChild" || data.name === "insertSibling") {
        const newNode = data.obj;
        if (!newNode?.id) return;
        if (newNode.unique_name === "sheet" && !props.canCreateSheet) return;
        if (newNode.unique_name === "List" && !props.canCreateVariable) return;
        if (newNode.unique_name === "card" && !props.canCreateCard) return;

        temporaryNodeIds.add(newNode.id);

        const parentNode = newNode.parent;
        if (parentNode?.unique_name === "List") {
          temporaryNodeParents.set(newNode.id, parentNode);
          // ✅ Use the user-selected sheet id (from the dropdown) as priority,
          //    then fall back to the sheet_id stored on the List node itself
          const sheetId = selectedListSheetId.value
            || parentNode.sheet_id
            || getSheetParent(parentNode)?.id
            || "";
          if (sheetId) temporaryNodeSheetIds.set(newNode.id, sheetId);
        }
        return;
      }

      if (data.name === "finishEdit") {
        const edited = data.obj;
        if (!edited?.id) return;
        if (!temporaryNodeIds.has(edited.id) || savedNodeIds.has(edited.id)) return;

        temporaryNodeIds.delete(edited.id);
        savedNodeIds.add(edited.id);
        const parentNode = temporaryNodeParents.get(edited.id) ?? edited.parent;
        if (!parentNode || !("unique_name" in parentNode)) { savedNodeIds.delete(edited.id); return; }

        // Create Sheet
        if (parentNode.unique_name === "root" && !createdSheetNodeIds.has(edited.id)) {
          if (!props.canCreateSheet) { savedNodeIds.delete(edited.id); return; }
          createdSheetNodeIds.add(edited.id);
          try {
            emit("create:sheet", {
              variables: { "sheet-title": edited.topic ?? "New Sheet", "sheet-description": "This is custom description" },
              is_ai_generated: false, workspace_id: props.workspaceId, workspace_module_id: props.moduleId,
            });
          } catch (err) {
            console.error(err); savedNodeIds.delete(edited.id); createdSheetNodeIds.delete(edited.id);
          }
          return;
        }

        // Create Card under a List
        if (parentNode.unique_name === "List") {
          if (!props.canCreateCard) { savedNodeIds.delete(edited.id); return; }

          const cachedSheetId = temporaryNodeSheetIds.get(edited.id);
          temporaryNodeSheetIds.delete(edited.id);
          temporaryNodeParents.delete(edited.id);

          // Use cached → selectedListSheetId → List's own sheet_id → prop fallback
          const resolvedSheetId = cachedSheetId
            || selectedListSheetId.value
            || parentNode.sheet_id
            || props.selectedSheetId;

          try {
            const payload = createDefaultCardPayload(
              { topic: edited.topic ?? "New Card" },
              parentNode,
              resolvedSheetId,
            );
            if (payload.variables) payload.variables["card-description"] = "This is a default description";
            emit("create:card", payload);
          } catch (err) {
            console.error(err); savedNodeIds.delete(edited.id);
          }
          return;
        }

        if (parentNode.unique_name === "sheet" && !props.canCreateVariable) return;
      }
    });
  });
});

watch(isDark, () => {
  if (!mindMapInstance.value) return;
  mindMapInstance.value.changeTheme(isDark.value ? MindElixir.DARK_THEME : MindElixir.THEME);
}, { immediate: true });

const newColumn = ref(props.newColumn);
watch(() => props.newColumn, (v) => { newColumn.value = v; });
function emitAddColumn() { const t = newColumn.value.trim(); if (t) emit("add-column", t); }

onBeforeUnmount(() => {
  toolbarObserver?.disconnect();
  mindMapInstance.value?.destroy?.();
});
</script>

<style scoped>
.mindmap-container { --bgcolor: #ffffff; }

.sheet-selector-popover {
  position: fixed;
  z-index: 9999;
  background: var(--bg-card, #fff);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.13);
  padding: 12px;
  min-width: 240px;
}
.sheet-selector-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  padding: 0 2px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }

.format-sidebar {
  width: 350px; border-left: 1px solid #e0e0e0;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  display: flex; flex-direction: column; overflow-y: auto;
}
.format-content { flex: 1; overflow-y: auto; padding: 1rem; }
.format-group { margin-bottom: 1.25rem; }
.format-group label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; }
.format-group input, .format-group select {
  width: 100%; padding: 0.5rem;
  background: var(--bg-surface, #252525); border: 1px solid var(--border, #333);
  border-radius: 4px; color: var(--text-primary, #fff); font-size: 0.875rem; transition: all 0.2s;
}
.format-group input:focus, .format-group select:focus {
  outline: none; border-color: var(--accent, #4a9eff);
  box-shadow: 0 0 0 2px rgba(74,158,255,0.2);
}

:deep(.mind-elixir-toolbar.rb) {
  bottom: 20px; left: 20px; display: flex; align-items: center; gap: 2px; width: 15rem;
}
:deep(.mind-elixir-toolbar.rb > *) {
  display: flex; align-items: center; justify-content: center;
  width: 40px; padding: 5px; cursor: pointer; transition: background-color 0.2s, color 0.2s;
}
:deep(.mind-elixir-toolbar.lt > *) { cursor: pointer; }
:deep(.mind-elixir-toolbar.rb > *:hover), :deep(.mind-elixir-toolbar.lt > *:hover) {
  color: #7d68c8; border: 1px solid #7d68c8; border-radius: 5px;
}
.me-toolbar-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.me-toolbar-btn:hover { background: rgba(0,0,0,0.08); }
</style>