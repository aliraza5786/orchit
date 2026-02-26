<template>
  <div class="relative w-full h-full flex overflow-hidden">
    <div
      ref="mindMapRef"
      class="flex-1 h-full overflow-hidden rounded-md relative mindmap-container"
      style="height: 600px; width: 100%"
    ></div>
    <div
      v-if="showFormatSidebar && canAssignCard && canEditCard && canCreateCard"
      class="format-sidebar h-full py-4 px-4 w-[320px] border-l bg-bg-card overflow-x-hidden overflow-y-auto flex flex-col"
    >
      <div class="flex items-center justify-between pb-3 mb-4 border-b">
        <h3 class="text-sm font-semibold text-secondary">Format Node</h3>
        <button
          @click="showFormatSidebar = false"
          class="text-gray-400 hover:text-gray-700"
        >
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="format-content space-y-6">
        <div>
          <h4 class="text-xs font-semibold text-secondary uppercase mb-3">
            Colors
          </h4>
          <div class="format-group mb-3">
            <label class="block text-xs text-secondary mb-1">Background</label>
            <div class="flex items-center gap-2">
              <div
                class="h-10 w-10 rounded-md border cursor-pointer relative"
                :style="{ backgroundColor: activeFormatStyle.background }"
              >
                <input
                  type="color"
                  :value="activeFormatStyle.background"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @input="onStyleChange('bg_color', $event)"
                  style="pointer-events: all"
                />
              </div>
              <input
                :value="activeFormatStyle.background"
                placeholder="#3b82f6"
                class="flex-1 px-2 py-1 border rounded text-sm bg-bg-surface"
                readonly
              />
            </div>
          </div>
          <div class="format-group mb-3">
            <label class="block text-xs text-secondary mb-1">Text</label>
            <div class="flex items-center gap-2">
              <div
                class="h-10 w-10 rounded-md border cursor-pointer relative"
                :style="{ backgroundColor: activeFormatStyle.color }"
              >
                <input
                  type="color"
                  :value="activeFormatStyle.color"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @input="onStyleChange('color', $event)"
                  style="pointer-events: all"
                />
              </div>
              <input
                :value="activeFormatStyle.color"
                placeholder="#3b82f6"
                class="flex-1 px-2 py-1 border rounded text-sm bg-bg-surface"
                readonly
              />
            </div>
          </div>
        </div>
        <div>
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-xs text-secondary mb-1">Weight</label>
              <select
                class="w-full h-8 border rounded px-2 text-sm"
                :value="activeFormatStyle.fontWeight"
                @change="onStyleChange('font_weight', $event)"
              >
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
          <span
            v-if="isSavingNodeStyle"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></span>
          <span>{{ isSavingNodeStyle ? "Updating..." : "Update" }}</span>
        </button>
      </div>
    </div>
  </div>
  <div
    v-if="showHyperlinkModal && canAssignCard && canEditCard && canCreateCard"
    class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-xl w-80">
      <h3 class="text-lg font-semibold mb-4">Insert Web Link</h3>
      <input
        v-model="hyperlink"
        type="text"
        placeholder="Enter or paste a URL"
        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div class="flex justify-end gap-2 mt-4">
        <button
          @click="cancelHyperlink"
          class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          :disabled="!hyperlink"
          @click="confirmHyperlink"
          :class="[
            'px-4 py-2 rounded-md text-white',
            hyperlink
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-blue-300 cursor-not-allowed',
          ]"
        >
          Insert
        </button>
      </div>
    </div>
  </div>
  <div
    v-if="activeAddList"
    class="absolute top-40 left-70 bg-bg-body rounded-lg p-4 shadow-lg z-100 min-w-[328px] border"
    @click.stop
  >
    <input
      autofocus
      v-model="newColumn"
      placeholder="Add New list"
      @keyup.enter="emitAddColumn"
      class="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent bg-bg-surface"
    />
    <p class="text-xs mt-1.5">You can add details while editing</p>
    <div class="flex items-center mt-3 gap-3">
      <button
        @click="emitAddColumn"
        class="px-3 py-1 bg-accent cursor-pointer text-white rounded text-sm"
      >
        {{ addingList ? "Adding..." : "Add list" }}
      </button>
      <i
        class="fa-solid fa-close cursor-pointer"
        @click="emit('toggle-add-list')"
      ></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  toRaw,
  watchEffect,
  nextTick,
  onBeforeUnmount,
} from "vue";
import MindElixir from "mind-elixir";
import { toast } from "vue-sonner";
import { useTheme } from "../../composables/useTheme";
import { request } from "../../libs/api";
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
interface MindNodeStyle {
  background?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  hyperLink?: string;
}

interface MindNode {
  id: string;
  seat_id?: string;
  topic: string;
  style: MindNodeStyle;
  _originalStyle: Record<string, any>;
  children: MindNode[];
  parent?: MindNode;
  isRoot?: boolean;
  unique_name?: string;
  variables?: any;
  hyperLink?: string;
}
const DEFAULT_BACKEND_STYLE = {
  bg_color: "#ffffff",
  color: "#000000",
  font_size: 14,
  font_weight: "normal",
  font_style: "normal",
  font_family: "Inter",
  border_color: "#cccccc",
  border_width: 0,
  border_radius: 0,
  padding: 0,
};
const activeFormatStyle = computed<MindNodeStyle>(() => {
  if (selectedMindNode.value?.nodeObj?.style) {
    return selectedMindNode.value.nodeObj.style;
  }
  return mapBackendStyleToMindElixir(DEFAULT_BACKEND_STYLE);
});

function mapBackendStyleToMindElixir(style: any = {}): MindNodeStyle {
  return {
    background: style.bg_color,
    color: style.color,
    fontSize: style.font_size != null ? `${style.font_size}px` : undefined,
    fontWeight: style.font_weight,
    fontStyle: style.font_style,
    fontFamily: style.font_family,
    borderColor: style.border_color,
    borderWidth: style.border_width != null ? `${style.border_width}px` : undefined,
    borderRadius: style.border_radius != null ? `${style.border_radius}px` : undefined,
    padding: style.padding != null ? `${style.padding}px` : undefined,
    hyperLink: style.hyperLink || undefined,
  };
}

function applyNodeStyle(nodeObj: any, element?: HTMLElement) {
  if (!nodeObj || !element || !nodeObj.style) return;

  const topic = element.querySelector(".topic") as HTMLElement | null;
  const nodeWrapper = (element.querySelector(".node") as HTMLElement | null) ?? element;
  const style = nodeObj.style;

  if (style.background) nodeWrapper.style.background = style.background;
  if (style.color && topic) topic.style.color = style.color;

  if (topic) {
    if (style.fontSize) topic.style.fontSize = style.fontSize;
    if (style.fontFamily) topic.style.fontFamily = style.fontFamily;
    if (style.fontWeight) topic.style.fontWeight = style.fontWeight;
    if (style.fontStyle) topic.style.fontStyle = style.fontStyle;
  }

  if (style.borderColor) nodeWrapper.style.borderColor = style.borderColor;
  if (style.borderWidth) nodeWrapper.style.borderWidth = style.borderWidth;
  if (style.borderRadius) nodeWrapper.style.borderRadius = style.borderRadius;
  if (style.padding) nodeWrapper.style.padding = style.padding;
}

function resolveStyle<T>(uiValue: T | undefined, originalValue: T | undefined, defaultValue: T): T {
  return uiValue !== undefined ? uiValue : originalValue !== undefined ? originalValue : defaultValue;
}

function onStyleChange(prop: string, event: Event) {
  if (!selectedMindNode.value?.nodeObj) return;

  const node = selectedMindNode.value.nodeObj;
  if (!node.style) node.style = {};

  const target = event.target as HTMLInputElement;
  const value = target.type === "number" ? Number(target.value) : target.value;

  switch (prop) {
    case "bg_color":      node.style.background = value;               break;
    case "color":         node.style.color = value;                    break;
    case "font_size":     node.style.fontSize = `${value}px`;         break;
    case "font_weight":   node.style.fontWeight = value;               break;
    case "font_style":    node.style.fontStyle = value;                break;
    case "font_family":   node.style.fontFamily = value;               break;
    case "border_color":  node.style.borderColor = value;              break;
    case "border_width":  node.style.borderWidth = `${value}px`;      break;
    case "border_radius": node.style.borderRadius = `${value}px`;     break;
    case "padding":       node.style.padding = `${value}px`;          break;
  }

  const nodeElement = document.getElementById(node.id);
  if (nodeElement) applyNodeStyle(node, nodeElement);
}

async function saveNodeStyle() {
  const node = selectedMindNode.value?.nodeObj;
  if (!node || isSavingNodeStyle.value) return;

  isSavingNodeStyle.value = true;

  try {
    const plainNode = toRaw(node);
    if (!plainNode._originalStyle) plainNode._originalStyle = {};

    const style = plainNode.style || {};
    const original = plainNode._originalStyle;

    const mergedStylePayload = {
      bg_color: resolveStyle(style.background, original.bg_color, DEFAULT_BACKEND_STYLE.bg_color),
      color: resolveStyle(style.color, original.color, DEFAULT_BACKEND_STYLE.color),
      font_size: resolveStyle(style.fontSize ? parseInt(style.fontSize) : undefined, original.font_size, DEFAULT_BACKEND_STYLE.font_size),
      font_weight: resolveStyle(style.fontWeight, original.font_weight, DEFAULT_BACKEND_STYLE.font_weight),
      font_style: resolveStyle(style.fontStyle, original.font_style, DEFAULT_BACKEND_STYLE.font_style),
      font_family: resolveStyle(style.fontFamily, original.font_family, DEFAULT_BACKEND_STYLE.font_family),
      border_color: resolveStyle(style.borderColor, original.border_color, DEFAULT_BACKEND_STYLE.border_color),
      border_width: resolveStyle(style.borderWidth ? parseInt(style.borderWidth) : undefined, original.border_width, DEFAULT_BACKEND_STYLE.border_width),
      border_radius: resolveStyle(style.borderRadius ? parseInt(style.borderRadius) : undefined, original.border_radius, DEFAULT_BACKEND_STYLE.border_radius),
      padding: resolveStyle(style.padding ? parseInt(style.padding) : undefined, original.padding, DEFAULT_BACKEND_STYLE.padding),
      hyperLink: hyperlink.value || plainNode.hyperLink || "",
    };

    plainNode._originalStyle = { ...mergedStylePayload };

    if (plainNode.unique_name === "sheet") {
      emit("update:sheet", {
        sheet_id: plainNode.id,
        workspace_id: props.workspaceId,
        workspace_module_id: props.moduleId,
        style: mergedStylePayload,
      });
    } else {
      emit("update:card", {
        card_id: plainNode.id,
        seat_id: plainNode.seat_id,
        style: mergedStylePayload,
      });
    }
  } finally {
    isSavingNodeStyle.value = false;
  }
}
function openHyperlinkModal(callback: (link: string) => void) {
  hyperlink.value = "";
  showHyperlinkModal.value = true;
  resolveCallback.value = callback;
}

function confirmHyperlink() {
  if (resolveCallback.value) resolveCallback.value(hyperlink.value);
  showHyperlinkModal.value = false;
}

function cancelHyperlink() {
  showHyperlinkModal.value = false;
}

function buildMindMapDataAllSheets(sheetsData: any[]): MindNode {
  const root: MindNode = {
    id: "root",
    topic: localStorage.getItem("currentName") ?? "",
    isRoot: true,
    children: [],
    style: {},
    _originalStyle: {},
    unique_name: "root",
  };

  if (!Array.isArray(sheetsData)) return root;

  const variablesMap: Record<string, MindNode> = {};

  sheetsData.forEach((sheet) => {
    const title = sheet.variables?.["sheet-title"] || "Untitled";
    const link = sheet.style?.hyperLink || "";

    if (!variablesMap[title]) {
      variablesMap[title] = {
        id: sheet._id,
        topic: title,
        variables: sheet?.variables,
        children: [],
        style: sheet?.style,
        _originalStyle: sheet?.style || {},
        unique_name: "sheet",
        hyperLink: link || "",
      };
      root.children.push(variablesMap[title]);
    }

    const listNode: MindNode = {
      id: sheet?._id,
      topic: sheet.title,
      children: [],
      style: mapBackendStyleToMindElixir(sheet?.style),
      _originalStyle: sheet.style || {},
      unique_name: "List",
      hyperLink: link || "",
    };

    (sheet.cards || []).forEach((card: any, cardIdx: number) => {
      const cardLink = card.style?.hyperLink || "";
      const cardNode: MindNode = {
        id: card._id || `card-${cardIdx}`,
        seat_id: card.seat_id,
        topic: card["card-title"],
        style: mapBackendStyleToMindElixir(card.style),
        _originalStyle: card.style || {},
        children: [],
        unique_name: "card",
        hyperLink: cardLink || "",
      };
      listNode.children.push(cardNode);
    });

    variablesMap[title].children.push(listNode);
  });

  return root;
}
async function handleReorderCard(payload: {
  workspace_id: string;
  card_id: string;
  group_value: string;
  group_variable_id: string;
  new_index: number;
  sheet_id: string;
}) {
  try {
    await request({
      url: "workspace/cards/group-card-order",
      method: "PATCH",
      data: payload,
    });
    emit("reorder:card", payload);
  } catch (error) {
    console.error("Failed to reorder card:", error);
  }
}
function createDefaultCardPayload(nodeObj: any, sheet: any) {
  const now = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return {
    sheet_list_id: sheet?.topic || "In Progress",
    workspace_id: props.workspaceId,
    sheet_id: props.selectedSheetId,
    workspace_lane_id: nodeObj?.workspace_lane_id || null,
    variables: {
      "card-status": sheet?.topic || "In Progress",
      "card-type": "General",
      priority: "medium",
      process: null,
      "card-title": nodeObj.topic || "New Card",
      "card-description": "",
      "start-date": startDate,
      "end-date": endDate,
    },
    createdAt: new Date().toISOString(),
  };
}
let toolbarObserver: MutationObserver | null = null;

function injectToolbarButton() {
  const toolbar = mindMapRef.value?.querySelector(".mind-elixir-toolbar.rb") as HTMLElement;
  if (!toolbar) return;
  if (toolbar.querySelector(".open-sidebar-btn")) return;

  const btn = document.createElement("button");
  btn.className = "open-sidebar-btn me-toolbar-btn ms-2";
  btn.title = "Open Formatting Sidebar";
  btn.innerHTML = `<i class="fa-solid fa-sidebar"></i>`;
  btn.addEventListener("click", () => {
    showFormatSidebar.value = !showFormatSidebar.value;
  });
  toolbar.appendChild(btn);
}

function setupToolbarObserver() {
  if (toolbarObserver) {
    toolbarObserver.disconnect();
    toolbarObserver = null;
  }

  const toolbarContainer = mindMapRef.value?.querySelector(".mind-elixir-toolbar.rb")?.parentElement;
  if (!toolbarContainer) return;

  toolbarObserver = new MutationObserver(() => {
    injectToolbarButton();
  });
  toolbarObserver.observe(toolbarContainer, { childList: true, subtree: true });
  injectToolbarButton();
}

const contextMenuExtendOptions: any[] = [];

if (props.canEditCard || props.canEditSheet) {
  contextMenuExtendOptions.push({
    name: "Update Node",
    onclick: () => {
      if (showFormatSidebar.value) showFormatSidebar.value = false;
      const node = selectedMindNode.value?.nodeObj;
      if (!node) return;
      emit("select:ticket", node);
    },
  });

  contextMenuExtendOptions.push({
    name: "Add Hyperlink",
    onclick: () => {
      openHyperlinkModal(async () => {
        await saveNodeStyle();
      });
    },
  });
}
watchEffect(() => {
  if (!mindMapRef.value || !props.listsData) return;

  nextTick(() => {
    const rootNode = buildMindMapDataAllSheets(props.listsData);

    if (mindMapInstance.value) {
      mindMapInstance.value.destroy?.();
      mindMapInstance.value = null;
    }

    const temporaryNodeIds = new Set<string>();
    const savedNodeIds = new Set<string>();
    const createdSheetNodeIds = new Set<string>();

    const instance = new MindElixir({
      el: mindMapRef.value as HTMLElement,
      theme: isDark.value ? MindElixir.DARK_THEME : MindElixir.THEME,
      draggable: true,
      contextMenu: true,
      toolBar: true,
      keypress: true,
      locale: "en",
      overflowHidden: false,
      contextMenuOption: {
        Update: props.canEditCard && props.canEditSheet && props.canCreateCard,
        extend: contextMenuExtendOptions,
      },
    });

    mindMapInstance.value = instance;
    instance.init({ nodeData: rootNode });

    nextTick(() => {
      setTimeout(() => instance.toCenter(), 300);
    });

    nextTick(() => {
      setupToolbarObserver();
    });

    instance.bus.addListener("selectNode", (nodeObj: any) => {
      if (!nodeObj) return;
      selectedMindNode.value = { nodeObj };
    });

    instance.bus.addListener("renderNode" as any, (event: any) => {
      if (!event?.nodeObj || !event?.element) return;
      applyNodeStyle(event.nodeObj, event.element as HTMLElement);
    });

    const getSheetParent = (node: any): any => {
      let current = node;
      while (current) {
        if (current.unique_name === "sheet") return current;
        current = current.parent;
      }
      return null;
    };

    instance.bus.addListener("operation", async (data: any) => {
      if (!data && props.canCreateCard && props.canEditCard && props.canCreateSheet) {
        toast.error("You do not have permission to perform this action.");
        return;
      }
      if (data.name === "moveNode" || data.name === "moveNodeBefore" || data.name === "moveNodeAfter") {
        if (!props.canEditCard) return;

        const draggedNode = data.obj;
        const targetNode = data.target;

        if (!draggedNode || draggedNode.unique_name !== "card") return;
        if (!targetNode) return;

        const sourceList = draggedNode._originalParent || draggedNode.parent;
        if (!sourceList || sourceList.unique_name !== "List") return;

        const targetList = targetNode.unique_name === "List" ? targetNode : targetNode.parent;
        if (!targetList || targetList.unique_name !== "List") return;

        const targetSheet = getSheetParent(targetList);
        if (!targetSheet) return;

        const newIndex = targetList.children.findIndex((c: any) => c.id === draggedNode.id);
        if (newIndex === -1) return;

        draggedNode._originalParent = targetList;

        await handleReorderCard({
          workspace_id: props.workspaceId,
          card_id: draggedNode.id,
          group_value: targetList.topic,
          group_variable_id: props.selectedViewBy,
          new_index: newIndex,
          sheet_id: targetSheet.id,
        });
        return;
      }

      // ── Remove card ──────────────────────────────────────────────
      if (data.name === "removeNode") {
        const removedNode = data.obj;
        if (!removedNode || !removedNode.id) return;
        if (removedNode.unique_name !== "card") return;
        if (!props.canDeleteCard) return;

        emit("delete:ticket", removedNode.id);
        return;
      }

      // ── Add child / sibling (track temporary ids) ────────────────
      if (data.name === "addChild" || data.name === "insertSibling") {
        const newNode = data.obj;
        if (!newNode || !newNode.id) return;

        if (newNode.unique_name === "sheet" && !props.canCreateSheet) return;
        if (newNode.unique_name === "List" && !props.canCreateVariable) return;
        if (newNode.unique_name === "card" && !props.canCreateCard) return;

        temporaryNodeIds.add(newNode.id);
        return;
      }

      // ── Finish edit — persist to backend ────────────────────────
      if (data.name === "finishEdit") {
        const editedNode = data.obj;
        if (!editedNode || !editedNode.id) return;

        const isTemporaryNode = temporaryNodeIds.has(editedNode.id);
        const isAlreadySaved = savedNodeIds.has(editedNode.id);

        if (!isTemporaryNode && !isAlreadySaved) return;
        if (isAlreadySaved) return;

        if (isTemporaryNode) {
          temporaryNodeIds.delete(editedNode.id);
          savedNodeIds.add(editedNode.id);

          const parentNode = editedNode.parent;
          if (!parentNode || !("unique_name" in parentNode)) {
            savedNodeIds.delete(editedNode.id);
            return;
          }

          // Create Sheet
          if (parentNode.unique_name === "root" && !createdSheetNodeIds.has(editedNode.id)) {
            if (!props.canCreateSheet) {
              savedNodeIds.delete(editedNode.id);
              return;
            }
            createdSheetNodeIds.add(editedNode.id);
            try {
              emit("create:sheet", {
                variables: {
                  "sheet-title": editedNode.topic ?? "New Sheet",
                  "sheet-description": "This is custom description",
                },
                is_ai_generated: false,
                workspace_id: props.workspaceId,
                workspace_module_id: props.moduleId,
              });
            } catch (err) {
              console.error("Error creating workspace sheet:", err);
              savedNodeIds.delete(editedNode.id);
              createdSheetNodeIds.delete(editedNode.id);
            }
            return;
          }

          // Create Card under a List
          if (parentNode.unique_name === "List") {
            if (!props.canCreateCard) {
              savedNodeIds.delete(editedNode.id);
              return;
            }
            try {
              const payload = createDefaultCardPayload(
                { topic: editedNode.topic ?? "New Card", id: editedNode.id },
                parentNode,
              );
              if (payload.variables) {
                payload.variables["card-description"] = "This is a default description";
              }
              emit("create:card", payload);
            } catch (err) {
              console.error("Error creating card:", err);
              savedNodeIds.delete(editedNode.id);
            }
            return;
          }

          // Create List under a Sheet
          if (parentNode.unique_name === "sheet") {
            if (!props.canCreateVariable) return;
            // Extend here if list-creation via mindmap is needed
            return;
          }
        }
      }
    });
  });
});

// ─── Theme Watch ──────────────────────────────────────────────────────────────
watch(
  isDark,
  () => {
    if (!mindMapInstance.value) return;
    mindMapInstance.value.changeTheme(isDark.value ? MindElixir.DARK_THEME : MindElixir.THEME);
  },
  { immediate: true },
);

// ─── Add List helpers (forwarded from parent via props) ───────────────────────
const newColumn = ref(props.newColumn);
watch(() => props.newColumn, (v) => { newColumn.value = v; });

function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) return;
  emit("add-column", t);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
onBeforeUnmount(() => {
  toolbarObserver?.disconnect();
  mindMapInstance.value?.destroy?.();
});
</script>

<style scoped>
.mindmap-container {
  --bgcolor: #ffffff;
}

.format-sidebar {
  width: 350px;
  border-left: 1px solid #e0e0e0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.format-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.format-group {
  margin-bottom: 1.25rem;
}

.format-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #fff);
}

.format-group input,
.format-group select {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-surface, #252525);
  border: 1px solid var(--border, #333);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.format-group input:focus,
.format-group select:focus {
  outline: none;
  border-color: var(--accent, #4a9eff);
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

/* Toolbar */
:deep(.mind-elixir-toolbar.rb) {
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 2px;
  width: 15rem;
}

:deep(.mind-elixir-toolbar.rb > *) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  padding: 5px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

:deep(.mind-elixir-toolbar.lt > *) {
  cursor: pointer;
}

:deep(.mind-elixir-toolbar.rb > *:hover),
:deep(.mind-elixir-toolbar.lt > *:hover) {
  color: #7d68c8;
  border: 1px solid #7d68c8;
  border-radius: 5px;
}

.me-toolbar-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.me-toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}
</style>