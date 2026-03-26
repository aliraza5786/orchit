<template>
  <div
    class="relative w-full h-full flex overflow-hidden pin-mindmap-root"
    ref="rootEl"
    :data-dark="isDark ? 'true' : 'false'"
  >
    <!-- ─── VIEWPORT ──────────────────────────────────────────────────────── -->
    <div
      class="viewport flex-1 relative overflow-hidden"
      ref="viewportEl"
      @wheel.prevent="handleWheel"
      @mousedown="handleViewportMouseDown"
      @click="handleCanvasClick"
      @contextmenu.prevent
    >
      <!-- ─── CANVAS ──────────────────────────────────────────────────────── -->
      <div
        ref="canvasEl"
        class="canvas-area"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          cursor: isPanning ? 'grabbing' : 'grab',
          willChange: 'transform',
        }"
      >
        <!-- Empty state -->
        <div
          v-if="!listsData || listsData.length === 0"
          class="canvas-placeholder"
        >
          <i
            class="fa-solid fa-diagram-project fa-3x mb-3"
            style="color: #94a3b8"
          ></i>
          <h5 style="color: #64748b">No pins to display</h5>
          <p style="color: #94a3b8; font-size: 13px">
            Add sheets and cards to see your pin map
          </p>
        </div>

        <!-- ─── SVG CONNECTIONS ──────────────────────────────────────────── -->
        <svg
          class="connections-svg"
          :style="{ width: svgW + 'px', height: svgH + 'px' }"
          :viewBox="`0 0 ${svgW} ${svgH}`"
        >
          <defs>
            <marker
              id="pin-arr"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path
                d="M2 1L8 5L2 9"
                fill="none"
                stroke="#6e3b96"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </marker>
          </defs>
          <g v-for="edge in visibleEdges" :key="edge.id">
            <path
              :d="edge.path"
              stroke="transparent"
              stroke-width="10"
              fill="none"
            />
            <path
              :d="edge.path"
              fill="none"
              :stroke="edge.color"
              stroke-width="1.5"
              stroke-linecap="round"
              :stroke-dasharray="edge.dashed ? '5 4' : 'none'"
              class="edge-path"
            />
          </g>
        </svg>

        <!-- ─── ROOT NODE ────────────────────────────────────────────────── -->
        <div
          v-if="rootNode"
          class="pm-node pm-node--root"
          :class="{ 'pm-node--selected': selectedNodeId === '__root__' }"
          :style="{
            left: rootNode.x + 'px',
            top: rootNode.y + 'px',
            width: rootNode.w + 'px',
            height: rootNode.h + 'px',
            ...(nodeStyles['__root__'] || {}),
          }"
          @mousedown.stop="startDrag($event, '__root__')"
          @click.stop="selectedNodeId = '__root__'"
        >
          <div class="root-inner">
            <img
              :src="localWorkspace.logo ?? dp"
              class="w-10 h-10 rounded-full"
              alt="logo"
            />
            <span class="root-title">{{ workspaceName }}</span>
          </div>
        </div>

        <!-- ─── SHEET + CARD NODES ───────────────────────────────────────── -->
        <template v-for="sheet in allSheets" :key="sheet._id">
          <!-- Sheet node -->
          <div
            class="pm-node pm-node--sheet mt-3"
            :class="{ 'pm-node--selected': selectedNodeId === sheet._id }"
            :style="nodeStyle(sheet)"
            @mousedown.stop="startDrag($event, sheet._id)"
            @click.stop="handleSheetClick(sheet)"
            @contextmenu.stop.prevent="openCtxMenu($event, 'sheet', sheet)"
          >
            <div class="sheet-inner" :style="sheetBodyStyle(sheet)">
              <div class="sheet-header">
                <i class="fa-solid fa-table-columns node-sheet-icon"></i>
                <div class="sheet-info">
                  <span class="sheet-title">{{
                    sheet.title || sheet.variables?.["sheet-title"] || "Sheet"
                  }}</span>
                  <span class="sheet-meta"
                    >{{ (sheet.cards || []).length }} card{{
                      (sheet.cards || []).length !== 1 ? "s" : ""
                    }}</span
                  >
                </div>
                <button
                  v-if="(sheet.cards || []).length > 0"
                  class="collapse-btn"
                  @click.stop="toggleCollapse(sheet._id)"
                  :title="isCollapsed(sheet._id) ? 'Expand' : 'Collapse'"
                >
                  <i
                    :class="
                      isCollapsed(sheet._id)
                        ? 'fa-solid fa-chevron-right'
                        : 'fa-solid fa-chevron-down'
                    "
                  ></i>
                </button>
              </div>
              <div
                v-if="isCollapsed(sheet._id) && (sheet.cards || []).length"
                class="collapsed-badge"
              >
                <i class="fa-solid fa-layer-group me-1"></i
                >{{ sheet.cards.length }} hidden
              </div>
              <!-- Inline add-card -->
              <div
                v-if="creatingForSheetId === sheet._id && canCreateCard"
                class="inline-create"
                @click.stop
                @mousedown.stop
              >
                <input
                  v-model="newCardTitle"
                  class="inline-input"
                  placeholder="Card title…"
                  autofocus
                  @keydown.enter.prevent="submitInlineCard"
                  @keydown.escape.prevent="cancelInlineCreate"
                  @blur="
                    () => {
                      if (!newCardTitle.trim()) cancelInlineCreate();
                    }
                  "
                />
                <div class="inline-actions">
                  <button
                    class="inline-btn inline-btn--ok"
                    :disabled="!newCardTitle.trim() || isCreating"
                    @click.stop="submitInlineCard"
                  >
                    <i
                      v-if="isCreating"
                      class="fa-solid fa-spinner fa-spin"
                    ></i>
                    <i v-else class="fa-solid fa-check"></i>
                  </button>
                  <button
                    class="inline-btn inline-btn--cancel"
                    @click.stop="cancelInlineCreate"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              <!-- Add card button -->
              <button
                v-else-if="canCreateCard && creatingForSheetId !== sheet._id"
                class="add-card-btn"
                @click.stop="startInlineCreate(sheet._id, sheet)"
              >
                <i class="fa-solid fa-plus"></i> Add card
              </button>
            </div>
          </div>

          <!-- Card nodes (children of this sheet) -->
          <template v-if="!isCollapsed(sheet._id)">
            <div
              v-for="card in sheet.cards || []"
              :key="card._id"
              class="pm-node pm-node--card"
              :class="{ 'pm-node--selected': selectedNodeId === card._id }"
              :style="cardNodeStyle(card)"
              @mousedown.stop="startDrag($event, card._id)"
              @click.stop="handleCardClick(card)"
              @contextmenu.stop.prevent="openCtxMenu($event, 'card', card)"
            >
              <div
                class="card-stripe"
                :style="{ background: getLaneColor(card) }"
              ></div>
              <div class="card-body" :style="cardBodyStyle(card)">
                <div class="card-badges">
                  <span v-if="card['card-type']" class="badge badge--type">{{
                    card["card-type"]
                  }}</span>
                  <span
                    v-if="card['card-status']"
                    class="badge badge--status"
                    >{{ card["card-status"] }}</span
                  >
                </div>
                <!-- Title -->
                <p class="card-title">{{ card["card-title"] || "Untitled" }}</p>
                <!-- Description -->
                <p
                  v-if="card['card-description']"
                  class="card-desc"
                  v-html="card['card-description']"
                ></p>
                <!-- Footer: dates + seats -->
                <div class="card-footer">
                  <div
                    class="card-dates"
                    v-if="card['start-date'] || card['end-date']"
                  >
                    <i
                      class="fa-regular fa-calendar"
                      style="font-size: 9px; opacity: 0.6"
                    ></i>
                    <span v-if="card['start-date']">{{
                      fmtDate(card["start-date"])
                    }}</span>
                    <span
                      v-if="card['start-date'] && card['end-date']"
                      class="date-sep"
                      >→</span
                    >
                    <span v-if="card['end-date']">{{
                      fmtDate(card["end-date"])
                    }}</span>
                  </div>
                  <div class="card-seats">
                    <div
                      v-for="seat in (card.seats || []).slice(0, 3)"
                      :key="seat._id"
                      class="seat-avatar"
                      :title="seat.title"
                    >
                      {{ seat.title?.charAt(0)?.toUpperCase() || "?" }}
                    </div>
                  </div>
                </div>
                <!-- Action row (visible on hover) -->
                <div class="card-actions" v-if="!isReadOnly">
                  <button
                    class="nact nact--open"
                    @click.stop="emit('select:ticket', card)"
                    title="Open card"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  </button>
                  <button
                    v-if="canCreateCard"
                    class="nact nact--add"
                    @click.stop="createCardDirectly(card.sheet_id)"
                    title="Add sibling card"
                  >
                    <i class="fa-solid fa-plus"></i>
                  </button>
                  <button
                    v-if="canAssignCard && canEditCard"
                    class="nact"
                    @click.stop="openFormatSidebar(card._id)"
                    title="Format"
                  >
                    <i class="fa-solid fa-palette"></i>
                  </button>
                  <button
                    v-if="canDeleteCard"
                    class="nact nact--danger"
                    @click.stop="emit('delete:ticket', card._id)"
                    title="Delete"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- ─── CONTROLS ─────────────────────────────────────────────────────── -->
      <div class="canvas-controls">
        <button class="ctrl-btn" @click="handleZoomIn" title="Zoom In (+)">
          <i class="fa-solid fa-plus"></i>
        </button>
        <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
        <button class="ctrl-btn" @click="handleZoomOut" title="Zoom Out (-)">
          <i class="fa-solid fa-minus"></i>
        </button>
        <div class="ctrl-divider"></div>
        <button
          class="ctrl-btn"
          :class="{ 'ctrl-btn--active': layout === 'right' }"
          @click="setLayout('right')"
          title="Left to Right"
        >
          <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button
          class="ctrl-btn"
          :class="{ 'ctrl-btn--active': layout === 'left' }"
          @click="setLayout('left')"
          title="Right to Left"
        >
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <button
          class="ctrl-btn"
          :class="{ 'ctrl-btn--active': layout === 'center' }"
          @click="setLayout('center')"
          title="Centered"
        >
          <i class="fa-solid fa-arrows-left-right"></i>
        </button>
        <div class="ctrl-divider"></div>
        <button class="ctrl-btn" @click="centerView" title="Reset view (C)">
          <i class="fa-solid fa-compress"></i>
        </button>
        <button class="ctrl-btn" @click="fitToScreen" title="Fit to screen (F)">
          <i class="fa-solid fa-expand"></i>
        </button>
      </div>

      <!-- ─── STATS ─────────────────────────────────────────────────────────── -->
      <div class="canvas-stats">
        <span
          ><i class="fa-solid fa-layer-group me-1"></i
          >{{ allSheets.length }} sheets</span
        >
        <span
          ><i class="fa-solid fa-square-check me-1"></i
          >{{ totalCards }} cards</span
        >
      </div>
    </div>

    <!-- ─── CONTEXT MENU ─────────────────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="ctxMenu.visible"
          class="pin-ctx-menu"
          :class="{ 'pin-ctx-menu--dark': isDark }"
          :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }"
          @click.stop
          @mousedown.stop
        >
          <div class="ctx-header">
            <i class="fa-solid fa-thumbtack ctx-header-icon"></i>
            <span class="ctx-header-title">{{ ctxMenu.nodeTitle }}</span>
          </div>

          <template v-if="ctxMenu.nodeType === 'card'">
            <button class="ctx-item" @click="ctxOpen">
              <i
                class="fa-solid fa-arrow-up-right-from-square ctx-item-icon ctx-icon--open"
              ></i>
              <span>Open card</span>
            </button>
            <button
              v-if="canAssignCard && canEditCard"
              class="ctx-item"
              @click="ctxFormatCard"
            >
              <i
                class="fa-solid fa-palette ctx-item-icon"
                style="color: #7d68c8"
              ></i>
              <span>Format</span>
            </button>
            <button v-if="canCreateCard" class="ctx-item" @click="ctxAddCard">
              <i class="fa-solid fa-plus ctx-item-icon ctx-icon--add"></i>
              <span>Add card to sheet</span>
              <kbd class="ctx-kbd">Enter</kbd>
            </button>
            <div class="ctx-divider"></div>
            <button
              v-if="canDeleteCard"
              class="ctx-item ctx-item--danger"
              @click="ctxDelete"
            >
              <i class="fa-solid fa-trash-can ctx-item-icon"></i>
              <span>Delete card</span>
              <kbd class="ctx-kbd">Del</kbd>
            </button>
          </template>

          <template v-else-if="ctxMenu.nodeType === 'sheet'">
            <button
              v-if="canCreateCard"
              class="ctx-item"
              @click="ctxAddCardToSheet"
            >
              <i class="fa-solid fa-plus ctx-item-icon ctx-icon--add"></i>
              <span>Add card</span>
            </button>
            <button
              class="ctx-item"
              @click="
                () => {
                  toggleCollapse(ctxMenu.nodeId);
                  closeCtxMenu();
                }
              "
            >
              <i
                class="fa-solid fa-layer-group ctx-item-icon"
                style="color: #7d68c8"
              ></i>
              <span>{{
                isCollapsed(ctxMenu.nodeId) ? "Expand" : "Collapse"
              }}</span>
            </button>
          </template>
        </div>
      </transition>
    </Teleport>

    <!-- ─── FORMAT SIDEBAR ───────────────────────────────────────────────── -->
    <transition name="slide-sidebar">
      <div
        v-if="
          showFormatSidebar && canAssignCard && canEditCard && canCreateCard
        "
        class="format-sidebar"
      >
        <div class="fs-header">
          <div class="fs-header-left">
            <i
              class="fa-solid fa-sliders"
              style="color: var(--accent, #6e3b96)"
            ></i>
            <span>Format Node</span>
          </div>
          <button class="fs-close" @click="showFormatSidebar = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div v-if="!selectedNodeId" class="fs-empty">
          <i
            class="fa-solid fa-arrow-pointer fa-xl"
            style="color: #cbd5e1; margin-bottom: 8px"
          ></i>
          <p>Click any node<br />to format it</p>
        </div>

        <div v-else class="fs-body">
          <div class="fs-node-name">
            <i class="fa-solid fa-circle-dot fs-node-icon"></i>
            <span class="fs-node-label">{{ selectedNodeLabel }}</span>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Quick Presets</div>
            <div class="fs-presets">
              <button
                v-for="p in colorPresets"
                :key="p.bg"
                class="preset-swatch"
                :style="{ background: p.bg, borderColor: p.border }"
                :title="p.name"
                @click="applyPreset(p)"
              ></button>
            </div>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Colors</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Background</label>
                <div class="color-row">
                  <div
                    class="color-swatch"
                    :style="{
                      background: activeFormatStyle.background || '#fff',
                    }"
                  >
                    <input
                      type="color"
                      :value="activeFormatStyle.background || '#ffffff'"
                      @input="onStyleChange('bg_color', $event)"
                    />
                  </div>
                  <input
                    class="color-hex"
                    :value="activeFormatStyle.background || ''"
                    placeholder="#ffffff"
                    readonly
                  />
                </div>
              </div>
              <div class="fs-field">
                <label>Text</label>
                <div class="color-row">
                  <div
                    class="color-swatch"
                    :style="{ background: activeFormatStyle.color || '#000' }"
                  >
                    <input
                      type="color"
                      :value="activeFormatStyle.color || '#000000'"
                      @input="onStyleChange('color', $event)"
                    />
                  </div>
                  <input
                    class="color-hex"
                    :value="activeFormatStyle.color || ''"
                    placeholder="#000000"
                    readonly
                  />
                </div>
              </div>
            </div>
            <div class="fs-field">
              <label>Border Color</label>
              <div class="color-row">
                <div
                  class="color-swatch"
                  :style="{
                    background: activeFormatStyle.borderColor || '#d9d9d9',
                  }"
                >
                  <input
                    type="color"
                    :value="activeFormatStyle.borderColor || '#d9d9d9'"
                    @input="onStyleChange('border_color', $event)"
                  />
                </div>
                <input
                  class="color-hex"
                  :value="activeFormatStyle.borderColor || ''"
                  placeholder="#d9d9d9"
                  readonly
                />
              </div>
            </div>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Typography</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Font Size</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    min="8"
                    max="32"
                    step="1"
                    :value="parsePx(activeFormatStyle.fontSize) || 14"
                    @input="onStyleChange('font_size', $event)"
                    class="fs-input"
                  />
                  <span class="unit">px</span>
                </div>
              </div>
              <div class="fs-field">
                <label>Weight</label>
                <select
                  class="fs-select"
                  :value="activeFormatStyle.fontWeight || 'normal'"
                  @change="onStyleChange('font_weight', $event)"
                >
                  <option value="300">Light</option>
                  <option value="normal">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="bold">Bold</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
            </div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Font Family</label>
                <select
                  class="fs-select"
                  :value="activeFormatStyle.fontFamily || 'inherit'"
                  @change="onStyleChange('font_family', $event)"
                >
                  <option value="inherit">Default</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="'Segoe UI', sans-serif">Segoe UI</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'DM Sans', sans-serif">DM Sans</option>
                  <option value="monospace">Monospace</option>
                  <option value="serif">Serif</option>
                </select>
              </div>
              <div class="fs-field">
                <label>Style</label>
                <select
                  class="fs-select"
                  :value="activeFormatStyle.fontStyle || 'normal'"
                  @change="onStyleChange('font_style', $event)"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </div>
            </div>
            <div class="fs-field">
              <label>Text Align</label>
              <div class="btn-group-row">
                <button
                  v-for="align in ['left', 'center', 'right']"
                  :key="align"
                  class="align-btn"
                  :class="{
                    'align-btn--active': activeFormatStyle.textAlign === align,
                  }"
                  @click="onStyleChangeDirect('text_align', align)"
                >
                  <i :class="`fa-solid fa-align-${align}`"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Border & Shape</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Border Width</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="1"
                    :value="parsePx(activeFormatStyle.borderWidth) || 0"
                    @input="onStyleChange('border_width', $event)"
                    class="fs-input"
                  />
                  <span class="unit">px</span>
                </div>
              </div>
              <div class="fs-field">
                <label>Border Radius</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    :value="parsePx(activeFormatStyle.borderRadius) || 0"
                    @input="onStyleChange('border_radius', $event)"
                    class="fs-input"
                  />
                  <span class="unit">px</span>
                </div>
              </div>
            </div>
            <div class="fs-field">
              <label>Border Style</label>
              <select
                class="fs-select"
                :value="activeFormatStyle.borderStyle || 'solid'"
                @change="
                  onStyleChangeDirect(
                    'border_style',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Spacing & Visibility</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Padding</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="2"
                    :value="parsePx(activeFormatStyle.padding) || 0"
                    @input="onStyleChange('padding', $event)"
                    class="fs-input"
                  />
                  <span class="unit">px</span>
                </div>
              </div>
              <div class="fs-field">
                <label>Opacity</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="5"
                    :value="
                      Math.round(
                        ((activeFormatStyle.opacity as number) ?? 1) * 100,
                      )
                    "
                    @input="
                      onStyleChangeDirect(
                        'opacity',
                        String(
                          Number(($event.target as HTMLInputElement).value) /
                            100,
                        ),
                      )
                    "
                    class="fs-input"
                  />
                  <span class="unit">%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Shadow</div>
            <div class="shadow-presets">
              <button
                v-for="s in shadowPresets"
                :key="s.label"
                class="shadow-btn"
                :class="{
                  'shadow-btn--active': activeFormatStyle.boxShadow === s.value,
                }"
                :style="{ boxShadow: s.value || 'none' }"
                @click="onStyleChangeDirect('box_shadow', s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <div class="fs-section">
            <div class="fs-section-label">Hyperlink</div>
            <div class="fs-field">
              <input
                v-model="hyperlinkInput"
                type="text"
                placeholder="https://..."
                class="fs-input-full"
              />
            </div>
          </div>

          <div class="fs-section" style="border: none; padding-bottom: 0">
            <button class="fs-reset-btn" @click="resetNodeStyle">
              <i class="fa-solid fa-rotate me-1"></i> Reset to default
            </button>
          </div>
        </div>

        <div class="fs-footer">
          <button
            class="fs-save-btn"
            :disabled="isSavingNodeStyle || !selectedNodeId"
            @click="saveNodeStyle"
          >
            <span v-if="isSavingNodeStyle" class="spinner"></span>
            <i v-else class="fa-solid fa-floppy-disk me-1"></i>
            {{ isSavingNodeStyle ? "Saving..." : "Save Style" }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  reactive,
} from "vue";
import { useTheme } from "../../../composables/useTheme";
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "../../../stores/workspace";
import dp from "../../../assets/global/dummy.jpeg";

// ─── Props & Emits ──────────────────────────────────────────────────────────
const props = defineProps<{
  listsData: any[];
  workspaceId: string;
  moduleId: string;
  canCreateCard?: boolean;
  canDeleteCard?: boolean;
  canEditCard?: boolean;
  isReadOnly?: boolean;
  canAssignCard: boolean;
  canCreateSheet: boolean;
  canCreateVariable: boolean;
  canEditSheet: boolean;
}>();

const emit = defineEmits<{
  (e: "select:ticket", card: any): void;
  (e: "delete:ticket", cardId: string): void;
  (e: "create:card", payload: any): void;
  (e: "update:card", payload: any): void;
  (e: "update:sheet", payload: any): void;
}>();

const { isDark } = useTheme();

// ─── Layout constants ───────────────────────────────────────────────────────
const ROOT_W = 200;
const ROOT_H = 52;
const SHEET_W = 210;
const SHEET_H = 80;
const CARD_W = 230;
const H_GAP = 80;
const V_GAP = 14;

// ─── Viewport state ─────────────────────────────────────────────────────────
const viewportEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLDivElement | null>(null);
const zoom = ref(0.85);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const svgW = ref(6000);
const svgH = ref(6000);
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const workspaceStore = useWorkspaceStore();
const localWorkspace = computed(() => workspaceStore.singleWorkspace);
const workspaceName = ref(localStorage.getItem("currentName"));

// ─── Layout direction ───────────────────────────────────────────────────────
type Direction = "right" | "left" | "center";
const layout = ref<Direction>("right");

// ─── Positions map ──────────────────────────────────────────────────────────
interface Pos {
  x: number;
  y: number;
  w: number;
  h: number;
}
const positions = reactive<Record<string, Pos>>({});

// ─── Collapse state ──────────────────────────────────────────────────────────
const collapsedIds = ref<string[]>([]);
const isCollapsed = (id: string) => collapsedIds.value.includes(id);
const toggleCollapse = (id: string) => {
  if (isCollapsed(id)) {
    collapsedIds.value = collapsedIds.value.filter((x) => x !== id);
  } else {
    collapsedIds.value = [...collapsedIds.value, id];
  }
  nextTick(runLayout);
};

// ─── Selection ───────────────────────────────────────────────────────────────
const selectedNodeId = ref<string | null>(null);

// ─── Format sidebar state ────────────────────────────────────────────────────
const showFormatSidebar = ref(false);
const hyperlinkInput = ref("");
const isSavingNodeStyle = ref(false);

// Per-node style store keyed by node id
const nodeStyles = reactive<Record<string, Record<string, any>>>({});

// Active style for the currently selected node
const activeFormatStyle = computed<Record<string, any>>(() => {
  if (!selectedNodeId.value) return {};
  return nodeStyles[selectedNodeId.value] || {};
});

// Label shown in the sidebar header for the selected node
const selectedNodeLabel = computed<string>(() => {
  if (!selectedNodeId.value) return "";
  if (selectedNodeId.value === "__root__") return workspaceName.value || "Root";
  for (const sheet of allSheets.value) {
    if (sheet._id === selectedNodeId.value) {
      return sheet.title || sheet.variables?.["sheet-title"] || "Sheet";
    }
    const card = (sheet.cards || []).find(
      (c: any) => c._id === selectedNodeId.value,
    );
    if (card) return card["card-title"] || "Card";
  }
  return selectedNodeId.value;
});

// Color presets for quick styling
const colorPresets = [
  { name: "Lavender", bg: "#f1eeff", border: "#c4b8f0" },
  { name: "Rose", bg: "#fff1f2", border: "#fecdd3" },
  { name: "Sky", bg: "#f0f9ff", border: "#bae6fd" },
  { name: "Mint", bg: "#f0fdf4", border: "#bbf7d0" },
  { name: "Amber", bg: "#fffbeb", border: "#fde68a" },
  { name: "Slate", bg: "#f8fafc", border: "#cbd5e1" },
  { name: "Indigo", bg: "#eef2ff", border: "#c7d2fe" },
  { name: "Pink", bg: "#fdf4ff", border: "#f0abfc" },
];

// Shadow presets
const shadowPresets = [
  { label: "None", value: "" },
  { label: "Soft", value: "0 2px 8px rgba(0,0,0,0.10)" },
  { label: "Medium", value: "0 4px 16px rgba(0,0,0,0.14)" },
  { label: "Strong", value: "0 8px 32px rgba(0,0,0,0.20)" },
  { label: "Purple", value: "0 4px 20px rgba(125,104,200,0.35)" },
];

// ─── Format sidebar helpers ──────────────────────────────────────────────────
function parsePx(val: string | undefined): number {
  if (!val) return 0;
  return parseInt(String(val).replace("px", ""), 10) || 0;
}

function ensureNodeStyle(id: string) {
  if (!nodeStyles[id]) nodeStyles[id] = {};
}

function openFormatSidebar(nodeId: string) {
  selectedNodeId.value = nodeId;
  showFormatSidebar.value = true;
  ensureNodeStyle(nodeId);
  hyperlinkInput.value = nodeStyles[nodeId]?.hyperLink || "";
}

function applyPreset(p: { bg: string; border: string; name: string }) {
  if (!selectedNodeId.value) return;
  ensureNodeStyle(selectedNodeId.value);
  const s = nodeStyles[selectedNodeId.value];
  s.background = p.bg;
  s.borderColor = p.border;
}

function onStyleChange(key: string, event: Event) {
  if (!selectedNodeId.value) return;
  ensureNodeStyle(selectedNodeId.value);
  const target = event.target as HTMLInputElement;
  const s = nodeStyles[selectedNodeId.value];
  const val = target.value;

  const keyMap: Record<string, string> = {
    bg_color: "background",
    color: "color",
    border_color: "borderColor",
    font_size: "fontSize",
    font_weight: "fontWeight",
    font_style: "fontStyle",
    font_family: "fontFamily",
    border_width: "borderWidth",
    border_radius: "borderRadius",
    padding: "padding",
  };

  const cssKey = keyMap[key] || key;

  if (["font_size", "border_width", "border_radius", "padding"].includes(key)) {
    s[cssKey] = val + "px";
  } else {
    s[cssKey] = val;
  }
}

function onStyleChangeDirect(key: string, value: string) {
  if (!selectedNodeId.value) return;
  ensureNodeStyle(selectedNodeId.value);
  const s = nodeStyles[selectedNodeId.value];

  const keyMap: Record<string, string> = {
    text_align: "textAlign",
    border_style: "borderStyle",
    box_shadow: "boxShadow",
    opacity: "opacity",
  };

  const cssKey = keyMap[key] || key;

  if (key === "opacity") {
    s[cssKey] = parseFloat(value);
  } else {
    s[cssKey] = value;
  }
}

function resetNodeStyle() {
  if (!selectedNodeId.value) return;
  nodeStyles[selectedNodeId.value] = {};
  hyperlinkInput.value = "";
}

const DEFAULT_BACKEND_STYLE = {
  bg_color: "#ffffff",
  color: "#2b2c30",
  font_size: 13,
  font_weight: "normal",
  font_style: "normal",
  font_family: "inherit",
  text_align: "left",
  border_color: "#d9d9d9",
  border_width: 0,
  border_radius: 8,
  border_style: "solid",
  padding: 12,
  opacity: 1,
  box_shadow: "",
};

function resolveStyle<T>(ui: T | undefined, orig: T | undefined, def: T): T {
  return ui !== undefined ? ui : orig !== undefined ? orig : def;
}

async function saveNodeStyle() {
  if (!selectedNodeId.value || isSavingNodeStyle.value) return;
  isSavingNodeStyle.value = true;
  try {
    ensureNodeStyle(selectedNodeId.value);
    nodeStyles[selectedNodeId.value].hyperLink = hyperlinkInput.value;

    const id = selectedNodeId.value;
    const s = nodeStyles[id] || {};
    const isSheet = allSheets.value.some((sh: any) => sh._id === id);
    const card = !isSheet
      ? allSheets.value
          .flatMap((sh: any) => sh.cards || [])
          .find((c: any) => c._id === id)
      : null;
    const origStyle = isSheet
      ? allSheets.value.find((sh: any) => sh._id === id)?.style || {}
      : card?.style || {};

    const p = {
      bg_color: resolveStyle(
        s.background,
        origStyle.bg_color,
        DEFAULT_BACKEND_STYLE.bg_color,
      ),
      color: resolveStyle(
        s.color,
        origStyle.color,
        DEFAULT_BACKEND_STYLE.color,
      ),
      font_size: resolveStyle(
        s.fontSize ? parseInt(s.fontSize) : undefined,
        origStyle.font_size,
        DEFAULT_BACKEND_STYLE.font_size,
      ),
      font_weight: resolveStyle(
        s.fontWeight,
        origStyle.font_weight,
        DEFAULT_BACKEND_STYLE.font_weight,
      ),
      font_style: resolveStyle(
        s.fontStyle,
        origStyle.font_style,
        DEFAULT_BACKEND_STYLE.font_style,
      ),
      font_family: resolveStyle(
        s.fontFamily,
        origStyle.font_family,
        DEFAULT_BACKEND_STYLE.font_family,
      ),
      text_align: resolveStyle(
        s.textAlign,
        origStyle.text_align,
        DEFAULT_BACKEND_STYLE.text_align,
      ),
      border_color: resolveStyle(
        s.borderColor,
        origStyle.border_color,
        DEFAULT_BACKEND_STYLE.border_color,
      ),
      border_width: resolveStyle(
        s.borderWidth ? parseInt(s.borderWidth) : undefined,
        origStyle.border_width,
        DEFAULT_BACKEND_STYLE.border_width,
      ),
      border_radius: resolveStyle(
        s.borderRadius ? parseInt(s.borderRadius) : undefined,
        origStyle.border_radius,
        DEFAULT_BACKEND_STYLE.border_radius,
      ),
      border_style: resolveStyle(
        s.borderStyle,
        origStyle.border_style,
        DEFAULT_BACKEND_STYLE.border_style,
      ),
      padding: resolveStyle(
        s.padding ? parseInt(s.padding) : undefined,
        origStyle.padding,
        DEFAULT_BACKEND_STYLE.padding,
      ),
      opacity: resolveStyle(
        s.opacity,
        origStyle.opacity,
        DEFAULT_BACKEND_STYLE.opacity,
      ),
      box_shadow: resolveStyle(
        s.boxShadow,
        origStyle.box_shadow,
        DEFAULT_BACKEND_STYLE.box_shadow,
      ),
      hyperLink: hyperlinkInput.value || "",
    };

    if (isSheet) {
      emit("update:sheet", {
        sheet_id: id,
        workspace_id: props.workspaceId,
        workspace_module_id: props.moduleId,
        style: p,
      });
    } else {
      const seatIds = Array.isArray(card?.seat_id)
        ? card.seat_id.map((s: any) => s._id || s)
        : card?.seat_id;
      emit("update:card", { card_id: id, seat_id: seatIds, style: p });
    }
    toast.success("Style saved");
  } catch {
    toast.error("Failed to save style");
  } finally {
    isSavingNodeStyle.value = false;
  }
}

// ─── Inline card creation ─────────────────────────────────────────────────
const creatingForSheetId = ref<string | null>(null);
const creatingForSheet = ref<any>(null);
const newCardTitle = ref("");
const isCreating = ref(false);

function startInlineCreate(sheetId: string, sheet?: any) {
  creatingForSheetId.value = sheetId;
  creatingForSheet.value =
    sheet ?? props.listsData.find((s) => s._id === sheetId) ?? null;
  newCardTitle.value = "";
  if (isCollapsed(sheetId)) {
    collapsedIds.value = collapsedIds.value.filter((x) => x !== sheetId);
    nextTick(runLayout);
  }
}

function cancelInlineCreate() {
  creatingForSheetId.value = null;
  creatingForSheet.value = null;
  newCardTitle.value = "";
  isCreating.value = false;
}

async function submitInlineCard() {
  const title = newCardTitle.value.trim();
  if (!title || isCreating.value) return;
  const sheetId = creatingForSheetId.value;
  if (!sheetId) return;
  const sheet =
    creatingForSheet.value ?? props.listsData.find((s) => s._id === sheetId);
  if (!sheet) return;

  const sheetTitle = sheet.variables?.["sheet-title"] || sheet.title || "To Do";
  const status = sheetTitle || "To Do";

  isCreating.value = true;
  try {
    const now = new Date();
    const startDate = now.toISOString().split("T")[0];
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const payload = {
      sheet_list_id: status,
      workspace_id: props.workspaceId,
      sheet_id: sheetId,
      variables: {
        "card-status": status,
        priority: "medium",
        process: null,
        "card-title": title,
        "card-description": "This is a default description",
        "start-date": startDate,
        "end-date": endDate,
      },
      createdAt: new Date().toISOString(),
    };
    emit("create:card", payload);
    toast.success(`Card "${title}" created`);
    cancelInlineCreate();
  } catch {
    toast.error("Failed to create card");
  } finally {
    isCreating.value = false;
  }
}

async function createCardDirectly(sheetId: string) {
  if (isCreating.value) return;
  const sheet = props.listsData.find((s) => s._id === sheetId);
  if (!sheet) return;
  isCreating.value = true;
  try {
    const now = new Date();
    const startDate = now.toISOString().split("T")[0];
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const sheetTitle =
      sheet.title || sheet.variables?.["sheet-title"] || "To Do";
    const payload = {
      sheet_list_id: sheetTitle,
      workspace_id: props.workspaceId,
      sheet_id: sheetId,
      variables: {
        "card-status": sheetTitle,
        priority: "medium",
        process: null,
        "card-title": "New Card",
        "card-description": "This is a default description",
        "start-date": startDate,
        "end-date": endDate,
      },
      createdAt: new Date().toISOString(),
    };
    emit("create:card", payload);
    toast.success("Card created");
  } catch {
    toast.error("Failed to create card");
  } finally {
    isCreating.value = false;
  }
}

// ─── Dragging ────────────────────────────────────────────────────────────────
const dragId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });

function startDrag(e: MouseEvent, id: string) {
  const p = positions[id];
  if (!p) return;
  dragId.value = id;
  const cx = (e.clientX - panX.value) / zoom.value;
  const cy = (e.clientY - panY.value) / zoom.value;
  dragOffset.value = { x: cx - p.x, y: cy - p.y };
  e.preventDefault();
}

// ─── Context menu ─────────────────────────────────────────────────────────
const ctxMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  nodeType: "" as "card" | "sheet" | "",
  nodeId: "",
  nodeTitle: "",
  data: null as any,
});
let ctxSkipNextClick = false;

function openCtxMenu(e: MouseEvent, type: "card" | "sheet", data: any) {
  e.preventDefault();
  e.stopPropagation();
  selectedNodeId.value = data._id;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctxMenu.x = Math.min(e.clientX, vw - 220);
  ctxMenu.y = Math.min(e.clientY, vh - 200);
  ctxMenu.nodeType = type;
  ctxMenu.nodeId = data._id;
  ctxMenu.nodeTitle =
    type === "card"
      ? data["card-title"] || "Card"
      : data.title || data.variables?.["sheet-title"] || "Sheet";
  ctxMenu.data = data;
  ctxMenu.visible = true;
  ctxSkipNextClick = true;
}

function closeCtxMenu() {
  ctxMenu.visible = false;
  ctxMenu.data = null;
}

function ctxOpen() {
  const d = ctxMenu.data;
  closeCtxMenu();
  if (d) emit("select:ticket", d);
}

// FIX: open format sidebar from context menu using the stored node id
function ctxFormatCard() {
  const id = ctxMenu.nodeId;
  closeCtxMenu();
  if (id) nextTick(() => openFormatSidebar(id));
}

function ctxAddCard() {
  const d = ctxMenu.data;
  closeCtxMenu();
  if (d?.sheet_id) nextTick(() => createCardDirectly(d.sheet_id));
}

function ctxAddCardToSheet() {
  const id = ctxMenu.nodeId;
  closeCtxMenu();
  nextTick(() => startInlineCreate(id));
}

function ctxDelete() {
  const d = ctxMenu.data;
  closeCtxMenu();
  if (d) emit("delete:ticket", d._id);
}

// ─── Computed helpers ────────────────────────────────────────────────────────
const allSheets = computed(() => props.listsData || []);
const totalCards = computed(() =>
  allSheets.value.reduce((acc, s) => acc + (s.cards?.length || 0), 0),
);

function getLaneColor(card: any): string {
  return card.lane?.variables?.["lane-color"] || "#7D68C8";
}

function fmtDate(d: string): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

// ─── Root node ───────────────────────────────────────────────────────────────
const rootNode = computed(() => {
  const p = positions["__root__"];
  if (!p) return null;
  return { ...p };
});

// ─── Card height calculator ──────────────────────────────────────────────────
function cardHeight(card: any): number {
  let h = 96;
  if (card["card-type"] || card["card-status"]) h += 20;
  if (card["card-description"]) h += 28;
  if (card["start-date"] || card["end-date"]) h += 20;
  return h;
}

function computeSheetH(sheet: any): number {
  return creatingForSheetId.value === sheet._id ? SHEET_H + 52 : SHEET_H;
}

function runLayout() {
  const sheets = allSheets.value;
  const dir = layout.value;

  const ROOT_X = dir === "left" ? 3200 : dir === "center" ? 2000 : 60;

  const sheetBlocks = sheets.map((sheet) => {
    const sh = computeSheetH(sheet);
    const collapsed = isCollapsed(sheet._id);
    const cards = collapsed ? [] : sheet.cards || [];
    const cardHeights = cards.map(cardHeight);
    const totalCardsH =
      cardHeights.reduce((a: any, b: any) => a + b, 0) +
      Math.max(0, cards.length - 1) * V_GAP;
    const blockH = Math.max(sh, totalCardsH);
    return { sheet, sh, cards, cardHeights, totalCardsH, blockH };
  });

  const totalH =
    sheetBlocks.reduce((a, b) => a + b.blockH, 0) +
    Math.max(0, sheets.length - 1) * (V_GAP * 3);
  const rootY = Math.max(60, totalH / 2 - ROOT_H / 2 + 40);

  positions["__root__"] = { x: ROOT_X, y: rootY, w: ROOT_W, h: ROOT_H };

  let currentY = 40;

  const rightSheets: typeof sheetBlocks = [];
  const leftSheets: typeof sheetBlocks = [];

  if (dir === "center") {
    sheetBlocks.forEach((b, i) => {
      if (i % 2 === 0) rightSheets.push(b);
      else leftSheets.push(b);
    });
  }

  function placeSheetBlock(
    block: (typeof sheetBlocks)[0],
    side: "left" | "right",
    sy: number,
  ) {
    const { sheet, sh, cards, cardHeights, totalCardsH, blockH } = block;

    const sheetX =
      side === "left"
        ? positions["__root__"].x - H_GAP - SHEET_W
        : positions["__root__"].x + ROOT_W + H_GAP;

    const sheetY = sy + blockH / 2 - sh / 2;
    positions[sheet._id] = { x: sheetX, y: sheetY, w: SHEET_W, h: sh };

    const cardX =
      side === "left" ? sheetX - H_GAP - CARD_W : sheetX + SHEET_W + H_GAP;

    const cardsStartY = sy + blockH / 2 - totalCardsH / 2;
    let cy = cardsStartY;

    cards.forEach((card: any, idx: number) => {
      const ch = cardHeights[idx];
      positions[card._id] = { x: cardX, y: cy, w: CARD_W, h: ch };
      cy += ch + V_GAP;
    });
  }

  if (dir === "center") {
    let ry = 40;
    rightSheets.forEach((block) => {
      placeSheetBlock(block, "right", ry);
      ry += block.blockH + V_GAP * 3;
    });
    let ly = 40;
    leftSheets.forEach((block) => {
      placeSheetBlock(block, "left", ly);
      ly += block.blockH + V_GAP * 3;
    });
    const allYs = Object.values(positions).map((p) => p.y);
    const allBottoms = Object.values(positions).map((p) => p.y + p.h);
    const midY = (Math.min(...allYs) + Math.max(...allBottoms)) / 2;
    positions["__root__"].y = midY - ROOT_H / 2;
  } else {
    const side = dir === "left" ? "left" : "right";
    sheetBlocks.forEach((block) => {
      placeSheetBlock(block, side, currentY);
      currentY += block.blockH + V_GAP * 3;
    });
    const sheetYs = sheets.map((s) => positions[s._id]?.y ?? 0);
    const sheetBots = sheets.map(
      (s) => (positions[s._id]?.y ?? 0) + (positions[s._id]?.h ?? 0),
    );
    if (sheetYs.length) {
      const mid = (Math.min(...sheetYs) + Math.max(...sheetBots)) / 2;
      positions["__root__"].y = mid - ROOT_H / 2;
    }
  }

  const allX = Object.values(positions).map((p) => p.x + p.w);
  const allY = Object.values(positions).map((p) => p.y + p.h);
  svgW.value = Math.max(Math.max(...allX) + 300, 3000);
  svgH.value = Math.max(Math.max(...allY) + 300, 3000);
}

// ─── Edges ──────────────────────────────────────────────────────────────────
interface Edge {
  id: string;
  path: string;
  color: string;
  dashed: boolean;
}

const visibleEdges = computed<Edge[]>(() => {
  const edges: Edge[] = [];
  const root = positions["__root__"];
  if (!root) return edges;

  allSheets.value.forEach((sheet) => {
    const sp = positions[sheet._id];
    if (!sp) return;

    const rootIsLeft = sp.x < root.x;
    const rx = rootIsLeft ? root.x : root.x + root.w;
    const ry = root.y + root.h / 2;
    const sx = rootIsLeft ? sp.x + sp.w : sp.x;
    const sy = sp.y + sp.h / 2;
    const mx = (rx + sx) / 2;
    edges.push({
      id: `root-${sheet._id}`,
      path: `M ${rx} ${ry} C ${mx} ${ry}, ${mx} ${sy}, ${sx} ${sy}`,
      color: "#7D68C8",
      dashed: false,
    });

    if (!isCollapsed(sheet._id)) {
      (sheet.cards || []).forEach((card: any) => {
        const cp = positions[card._id];
        if (!cp) return;
        const cardIsLeft = cp.x < sp.x;
        const ex1 = cardIsLeft ? sp.x : sp.x + sp.w;
        const ey1 = sp.y + sp.h / 2;
        const ex2 = cardIsLeft ? cp.x + cp.w : cp.x;
        const ey2 = cp.y + cp.h / 2;
        const emx = (ex1 + ex2) / 2;
        edges.push({
          id: `${sheet._id}-${card._id}`,
          path: `M ${ex1} ${ey1} C ${emx} ${ey1}, ${emx} ${ey2}, ${ex2} ${ey2}`,
          color: getLaneColor(card),
          dashed: true,
        });
      });
    }
  });

  return edges;
});

// ─── Node style helpers ─────────────────────────────────────────────────────

// Keys that apply to the outer node wrapper (box, border, shadow)
const WRAPPER_STYLE_KEYS = [
  "background",
  "borderColor",
  "borderWidth",
  "borderRadius",
  "borderStyle",
  "boxShadow",
  "opacity",
];

// Keys that apply to the inner text/body container (typography, spacing)
const BODY_STYLE_KEYS = [
  "color",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "fontStyle",
  "textAlign",
  "padding",
];

function pickStyles(
  source: Record<string, any>,
  keys: string[],
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of keys) {
    if (source[k] !== undefined && source[k] !== "") out[k] = source[k];
  }
  return out;
}

function nodeStyle(item: any): Record<string, any> {
  const p = positions[item._id];
  if (!p) return {};
  const custom = nodeStyles[item._id] || {};
  return {
    left: `${p.x}px`,
    top: `${p.y}px`,
    width: `${p.w}px`,
    ...pickStyles(custom, WRAPPER_STYLE_KEYS),
  };
}

function cardNodeStyle(card: any): Record<string, any> {
  const p = positions[card._id];
  if (!p) return {};
  const custom = nodeStyles[card._id] || {};
  return {
    left: `${p.x}px`,
    top: `${p.y}px`,
    width: `${p.w}px`,
    minHeight: `${p.h}px`,
    ...pickStyles(custom, WRAPPER_STYLE_KEYS),
  };
}

// Returns typography/spacing styles for the inner .card-body div
function cardBodyStyle(card: any): Record<string, any> {
  const custom = nodeStyles[card._id] || {};
  return pickStyles(custom, BODY_STYLE_KEYS);
}

// Returns typography/spacing styles for the inner .sheet-inner div
function sheetBodyStyle(sheet: any): Record<string, any> {
  const custom = nodeStyles[sheet._id] || {};
  return pickStyles(custom, BODY_STYLE_KEYS);
}

// ─── Event handlers ─────────────────────────────────────────────────────────
function handleSheetClick(sheet: any) {
  selectedNodeId.value = sheet._id;
}

function handleCardClick(card: any) {
  selectedNodeId.value = card._id;
  emit("select:ticket", card);
}

function handleCanvasClick(e: MouseEvent) {
  if (ctxSkipNextClick) {
    ctxSkipNextClick = false;
    return;
  }
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement;
    if (!target.closest(".pin-ctx-menu")) closeCtxMenu();
    return;
  }
  if (e.target === viewportEl.value || e.target === canvasEl.value) {
    selectedNodeId.value = null;
  }
}

// ─── Pan & zoom ──────────────────────────────────────────────────────────────
function handleWheel(e: WheelEvent) {
  const vp = viewportEl.value;
  if (!vp) return;
  const rect = vp.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta));
  const ratio = newZoom / zoom.value;
  panX.value = mx - (mx - panX.value) * ratio;
  panY.value = my - (my - panY.value) * ratio;
  zoom.value = newZoom;
}

function handleViewportMouseDown(e: MouseEvent) {
  if (e.target !== viewportEl.value && e.target !== canvasEl.value) return;
  if (e.button !== 0) return;
  isPanning.value = true;
  panStart.value = { x: e.clientX - panX.value, y: e.clientY - panY.value };
  e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
  if (dragId.value) {
    const p = positions[dragId.value];
    if (p) {
      const cx = (e.clientX - panX.value) / zoom.value;
      const cy = (e.clientY - panY.value) / zoom.value;
      p.x = cx - dragOffset.value.x;
      p.y = cy - dragOffset.value.y;
    }
    return;
  }
  if (!isPanning.value) return;
  panX.value = e.clientX - panStart.value.x;
  panY.value = e.clientY - panStart.value.y;
}

function onMouseUp() {
  isPanning.value = false;
  dragId.value = null;
}

function handleZoomIn() {
  const c = getCenter();
  zoomAt(c.x, c.y, ZOOM_STEP);
}
function handleZoomOut() {
  const c = getCenter();
  zoomAt(c.x, c.y, -ZOOM_STEP);
}
function getCenter() {
  const vp = viewportEl.value;
  return vp
    ? { x: vp.clientWidth / 2, y: vp.clientHeight / 2 }
    : { x: 400, y: 300 };
}
function zoomAt(cx: number, cy: number, delta: number) {
  const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta));
  const ratio = nz / zoom.value;
  panX.value = cx - (cx - panX.value) * ratio;
  panY.value = cy - (cy - panY.value) * ratio;
  zoom.value = nz;
}

function centerView() {
  const vp = viewportEl.value;
  if (!vp) return;
  const vals = Object.values(positions);
  if (!vals.length) return;
  const minX = Math.min(...vals.map((p) => p.x));
  const maxX = Math.max(...vals.map((p) => p.x + p.w));
  const minY = Math.min(...vals.map((p) => p.y));
  const maxY = Math.max(...vals.map((p) => p.y + p.h));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  panX.value = vp.clientWidth / 2 - cx * zoom.value;
  panY.value = vp.clientHeight / 2 - cy * zoom.value;
}

function fitToScreen() {
  const vp = viewportEl.value;
  if (!vp) return;
  const vals = Object.values(positions);
  if (!vals.length) return;
  const minX = Math.min(...vals.map((p) => p.x));
  const maxX = Math.max(...vals.map((p) => p.x + p.w));
  const minY = Math.min(...vals.map((p) => p.y));
  const maxY = Math.max(...vals.map((p) => p.y + p.h));
  const pad = 60;
  const scaleX = (vp.clientWidth - pad * 2) / (maxX - minX);
  const scaleY = (vp.clientHeight - pad * 2) / (maxY - minY);
  zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));
  panX.value = pad - minX * zoom.value;
  panY.value = pad - minY * zoom.value;
}

function setLayout(dir: Direction) {
  layout.value = dir;
  nextTick(() => {
    runLayout();
    nextTick(centerView);
  });
}

// ─── Keyboard shortcuts ──────────────────────────────────────────────────────
function handleKeyDown(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
    return;

  if (e.key === "Escape") {
    if (ctxMenu.visible) {
      closeCtxMenu();
      return;
    }
    cancelInlineCreate();
    selectedNodeId.value = null;
  }
  if (e.key === "c" || e.key === "C") centerView();
  if (e.key === "f" || e.key === "F") fitToScreen();
  if (e.key === "+") handleZoomIn();
  if (e.key === "-") handleZoomOut();
  if (
    (e.key === "Delete" || e.key === "Backspace") &&
    selectedNodeId.value &&
    props.canDeleteCard
  ) {
    const isCard = allSheets.value.some((s) =>
      (s.cards || []).some((c: any) => c._id === selectedNodeId.value),
    );
    if (isCard) emit("delete:ticket", selectedNodeId.value);
  }
  if (e.key === "Enter" && selectedNodeId.value && props.canCreateCard) {
    for (const sheet of allSheets.value) {
      const hit = (sheet.cards || []).find(
        (c: any) => c._id === selectedNodeId.value,
      );
      if (hit) {
        createCardDirectly(sheet._id);
        break;
      }
      if (sheet._id === selectedNodeId.value) {
        startInlineCreate(sheet._id);
        break;
      }
    }
  }
}

function handleGlobalClick(e: MouseEvent) {
  if (ctxSkipNextClick) {
    ctxSkipNextClick = false;
    return;
  }
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement;
    if (!target.closest(".pin-ctx-menu")) closeCtxMenu();
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleGlobalClick);

  nextTick(() => {
    runLayout();
    nextTick(centerView);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("click", handleGlobalClick);
});

watch(
  () => props.listsData,
  (newVal) => {
    if (!newVal || !newVal.length) return;
    nextTick(() => {
      runLayout();
      nextTick(centerView);
    });
  },
  { deep: true },
);

watch(
  () => [collapsedIds.value, creatingForSheetId.value],
  () => nextTick(runLayout),
  { deep: true },
);
</script>

<style scoped>
/* ── Allow inline format styles to override default node borders ─────────── */
.pm-node[style*="border"] {
  border-width: revert;
  border-style: revert;
  border-color: revert;
}

/* ── Root container ─────────────────────────────────────────────────────── */
.pin-mindmap-root {
  background: var(--bg-surface, #dedfe3);
  font-family: "Lato", sans-serif;
  width: 100%;
  height: 100%;
}

/* ── Viewport / Canvas ─────────────────────────────────────────────────── */
.viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-surface, #dedfe3);
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

.canvas-area {
  position: absolute;
  top: 0;
  left: 0;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.edge-path {
  opacity: 0.65;
  transition: opacity 0.2s;
}

.canvas-placeholder {
  position: absolute;
  top: 200px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
}

/* ── Generic node ──────────────────────────────────────────────────────── */
.pm-node {
  position: absolute;
  z-index: 2;
  border-radius: 10px;
  border: 1.5px solid transparent;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}
.pm-node:active {
  cursor: grabbing;
}
.pm-node:hover {
  box-shadow: 0 4px 16px rgba(125, 104, 200, 0.18);
}
.pm-node--selected {
  border-color: #7d68c8 !important;
  box-shadow:
    0 0 0 2px rgba(125, 104, 200, 0.25),
    0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

/* ── Root node ─────────────────────────────────────────────────────────── */
.pm-node--root {
  background: #f1eeff;
  border-color: #c4b8f0;
  border-radius: 26px;
}
.root-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
}
.root-icon {
  color: #7d68c8;
  font-size: 16px;
}
.root-title {
  font-size: 14px;
  font-weight: 700;
  color: #2b2c30;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Sheet node ────────────────────────────────────────────────────────── */
.pm-node--sheet {
  background: #ede9fb;
  border-color: #b8a8e8;
  overflow: visible;
}
.sheet-inner {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sheet-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sheet-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(125, 104, 200, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #7d68c8;
  font-size: 12px;
}
.sheet-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.sheet-title {
  font-size: 12px;
  font-weight: 700;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sheet-meta {
  font-size: 9.5px;
  color: #6b6b6e;
  font-weight: 500;
}
.collapse-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 9px;
  color: #6b6b6e;
  flex-shrink: 0;
  transition: background 0.12s;
}
.collapse-btn:hover {
  background: rgba(125, 104, 200, 0.12);
  color: #7d68c8;
}
.collapsed-badge {
  font-size: 9px;
  color: #6b6b6e;
  padding-left: 2px;
}
.add-card-btn {
  display: none;
  width: 100%;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 500;
  color: #7d68c8;
  background: rgba(125, 104, 200, 0.07);
  border: 1px dashed rgba(125, 104, 200, 0.3);
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  align-items: center;
  gap: 4px;
  transition: background 0.12s;
}
.add-card-btn i {
  font-size: 9px;
}
.pm-node--sheet:hover .add-card-btn {
  display: flex;
}
.add-card-btn:hover {
  background: rgba(125, 104, 200, 0.14);
  border-color: rgba(125, 104, 200, 0.5);
}

/* ── Inline card creation ──────────────────────────────────────────────── */
.inline-create {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}
.inline-input {
  width: 100%;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 500;
  border: 1.5px solid #7d68c8;
  border-radius: 5px;
  outline: none;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(125, 104, 200, 0.15);
  box-sizing: border-box;
  color: #2b2c30;
}
.inline-input::placeholder {
  color: #6b6b6e;
  font-weight: normal;
}
.inline-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.inline-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}
.inline-btn--ok {
  background: #7d68c8;
  color: #fff;
}
.inline-btn--ok:hover:not(:disabled) {
  background: #6e3b96;
}
.inline-btn--ok:disabled {
  background: rgba(125, 104, 200, 0.4);
  cursor: not-allowed;
}
.inline-btn--cancel {
  background: #dedfe3;
  color: #6b6b6e;
}
.inline-btn--cancel:hover {
  background: #d9d9d9;
}

/* ── Card node ─────────────────────────────────────────────────────────── */
.pm-node--card {
  background: #fff;
  border-color: #c4b8f0;
  display: flex;
  flex-direction: column;
}
.card-stripe {
  height: 4px;
  flex-shrink: 0;
  border-radius: 8px 8px 0 0;
}
.card-body {
  flex: 1;
  padding: 8px 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.card-code {
  font-size: 9px;
  font-weight: 600;
  font-family: monospace;
  color: #6b6b6e;
  letter-spacing: 0.03em;
}
.priority-badge {
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  padding: 1px 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.priority--high {
  background: #fee2e2;
  color: #dc2626;
}
.priority--medium {
  background: #fef3c7;
  color: #d97706;
}
.priority--low {
  background: #dcfce7;
  color: #16a34a;
}
.priority--critical {
  background: #2b2c30;
  color: #f5f5f5;
}

.card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.badge {
  font-size: 9px;
  font-weight: 500;
  border-radius: 3px;
  padding: 1px 6px;
}
.badge--type {
  background: rgba(125, 104, 200, 0.08);
  color: #6b6b6e;
}
.badge--status {
  background: rgba(125, 104, 200, 0.12);
  color: #7d68c8;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  margin: 0;
}
.card-desc {
  font-size: 10.5px;
  color: inherit;
  opacity: 0.75;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  margin: 0;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 5px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: auto;
}
.card-dates {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  color: #6b6b6e;
}
.date-sep {
  opacity: 0.4;
}
.card-seats {
  display: flex;
}
.seat-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #c4b8f0;
  color: #6e3b96;
  font-size: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -4px;
  border: 1.5px solid #fff;
  flex-shrink: 0;
}
.seat-avatar:first-child {
  margin-left: 0;
}

/* ── Card hover actions ─────────────────────────────────────────────────── */
.card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  opacity: 0;
  height: 0;
  overflow: hidden;
  transition:
    opacity 0.15s,
    height 0.15s;
}
.pm-node--card:hover .card-actions {
  opacity: 1;
  height: 26px;
}
.nact {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 10px;
  color: #6b6b6e;
  transition: background 0.12s;
}
.nact:hover {
  background: rgba(125, 104, 200, 0.1);
  color: #7d68c8;
}
.nact--danger:hover {
  color: #ef4444 !important;
}
.nact--open:hover {
  color: #7d68c8 !important;
}
.nact--add:hover {
  color: #22c55e !important;
}

/* ── Controls ───────────────────────────────────────────────────────────── */
.canvas-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  z-index: 100;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 12px;
  padding: 8px 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.ctrl-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #6b6b6e);
  transition: all 0.15s;
}
.ctrl-btn:hover,
.ctrl-btn--active {
  background: #7d68c8;
  color: #fff;
  border-color: #7d68c8;
}
.ctrl-divider {
  width: 20px;
  height: 1px;
  background: var(--border, #d9d9d9);
}
.zoom-label {
  font-size: 9px !important;
  font-weight: 700;
  color: #6b6b6e;
  letter-spacing: 0.03em;
}

/* ── Stats ──────────────────────────────────────────────────────────────── */
.canvas-stats {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #6b6b6e;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 8px;
  padding: 4px 12px;
  z-index: 100;
  backdrop-filter: blur(6px);
}

/* ── Context menu ───────────────────────────────────────────────────────── */
.pin-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 6px;
  min-width: 200px;
  font-size: 13px;
  color: #2b2c30;
  font-family: "Lato", sans-serif;
}
.ctx-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px 8px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 4px;
}
.ctx-header-icon {
  color: #7d68c8;
  font-size: 11px;
}
.ctx-header-title {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}
.ctx-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #2b2c30;
  transition: background 0.1s;
}
.ctx-item:hover {
  background: #f1f5f9;
}
.ctx-item--danger {
  color: #ef4444;
}
.ctx-item--danger:hover {
  background: #fef2f2;
}
.ctx-item-icon {
  font-size: 11px;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.ctx-icon--add {
  color: #22c55e;
}
.ctx-icon--open {
  color: #7d68c8;
}
.ctx-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}
.ctx-kbd {
  margin-left: auto;
  font-size: 9px;
  font-weight: 500;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  padding: 1px 5px;
  color: #6b6b6e;
  font-family: monospace;
}

/* ── Context menu dark ─────────────────────────────────────────────────── */
.pin-ctx-menu--dark {
  background: #1e293b !important;
  border-color: #334155 !important;
  color: #f1f5f9 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
}
.pin-ctx-menu--dark .ctx-header {
  border-color: #334155;
}
.pin-ctx-menu--dark .ctx-header-title {
  color: #f1f5f9;
}
.pin-ctx-menu--dark .ctx-item {
  color: #cbd5e1;
}
.pin-ctx-menu--dark .ctx-item:hover {
  background: #334155;
}
.pin-ctx-menu--dark .ctx-item--danger {
  color: #f87171;
}
.pin-ctx-menu--dark .ctx-item--danger:hover {
  background: #450a0a;
}
.pin-ctx-menu--dark .ctx-divider {
  background: #334155;
}
.pin-ctx-menu--dark .ctx-kbd {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

/* ── Format Sidebar ─────────────────────────────────────────────────────── */
.format-sidebar {
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: var(--bg-card, #fff);
  border-left: 1px solid var(--border, #e2e8f0);
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.06);
}
.fs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  flex-shrink: 0;
}
.fs-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #2b2c30;
}
.fs-close {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 12px;
  color: #6b6b6e;
  transition: background 0.12s;
}
.fs-close:hover {
  background: #f1f5f9;
  color: #2b2c30;
}
.fs-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  gap: 4px;
  padding: 24px;
}
.fs-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.fs-node-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  margin-bottom: 4px;
}
.fs-node-icon {
  font-size: 11px;
  color: #7d68c8;
}
.fs-node-label {
  font-size: 12px;
  font-weight: 600;
  color: #2b2c30;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fs-node-type {
  font-size: 9px;
  font-weight: 500;
  background: rgba(125, 104, 200, 0.1);
  color: #7d68c8;
  border-radius: 3px;
  padding: 1px 6px;
}
.fs-section {
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.fs-section-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.fs-row {
  display: flex;
  gap: 8px;
}
.fs-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}
.fs-field label {
  font-size: 10px;
  font-weight: 600;
  color: #6b6b6e;
}
.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.color-swatch {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.color-swatch input[type="color"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}
.color-hex {
  flex: 1;
  font-size: 10px;
  font-family: monospace;
  padding: 4px 6px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 4px;
  background: #f8fafc;
  color: #2b2c30;
  min-width: 0;
}
.fs-input {
  width: 100%;
  padding: 5px 7px;
  font-size: 11px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 5px;
  background: #f8fafc;
  color: #2b2c30;
  outline: none;
  transition: border-color 0.12s;
  box-sizing: border-box;
}
.fs-input:focus {
  border-color: #7d68c8;
  background: #fff;
}
.fs-input-full {
  width: 100%;
  padding: 6px 8px;
  font-size: 11px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 5px;
  background: #f8fafc;
  color: #2b2c30;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.12s;
}
.fs-input-full:focus {
  border-color: #7d68c8;
  background: #fff;
}
.fs-select {
  width: 100%;
  padding: 5px 7px;
  font-size: 11px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 5px;
  background: #f8fafc;
  color: #2b2c30;
  outline: none;
  cursor: pointer;
  transition: border-color 0.12s;
}
.fs-select:focus {
  border-color: #7d68c8;
}
.input-with-unit {
  display: flex;
  align-items: center;
  gap: 4px;
}
.input-with-unit .fs-input {
  flex: 1;
}
.unit {
  font-size: 10px;
  color: #94a3b8;
  flex-shrink: 0;
}
.btn-group-row {
  display: flex;
  gap: 4px;
}
.align-btn {
  flex: 1;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 5px;
  background: #f8fafc;
  color: #6b6b6e;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.12s;
}
.align-btn:hover,
.align-btn--active {
  background: #7d68c8;
  color: #fff;
  border-color: #7d68c8;
}
.fs-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.preset-swatch {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  border: 2px solid;
  cursor: pointer;
  transition:
    transform 0.12s,
    box-shadow 0.12s;
  padding: 0;
}
.preset-swatch:hover {
  transform: scale(1.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.shadow-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.shadow-btn {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 500;
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  color: #2b2c30;
  transition:
    border-color 0.12s,
    background 0.12s;
}
.shadow-btn:hover,
.shadow-btn--active {
  border-color: #7d68c8;
  background: rgba(125, 104, 200, 0.07);
  color: #7d68c8;
}
.fs-reset-btn {
  width: 100%;
  padding: 7px;
  font-size: 11px;
  font-weight: 500;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}
.fs-reset-btn:hover {
  background: #fee2e2;
}
.fs-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--border, #e2e8f0);
  flex-shrink: 0;
}
.fs-save-btn {
  width: 100%;
  padding: 9px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #7d68c8;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s;
}
.fs-save-btn:hover:not(:disabled) {
  background: #6e3b96;
}
.fs-save-btn:disabled {
  background: rgba(125, 104, 200, 0.45);
  cursor: not-allowed;
}
.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Slide sidebar transition ───────────────────────────────────────────── */
.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}
.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ── Fade transition ────────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Dark mode ──────────────────────────────────────────────────────────── */
.pin-mindmap-root[data-dark="true"] .viewport {
  background: #0f172a;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}
.pin-mindmap-root[data-dark="true"] .pm-node--root {
  background: #27272a;
  color: #c4b8f0;
}
.pin-mindmap-root[data-dark="true"] .pm-node--sheet {
  background: #1e293b;
  border-color: #334155;
}
.pin-mindmap-root[data-dark="true"] .pm-node--card {
  background: #1e293b;
  border-color: #4a3d8c;
}
.pin-mindmap-root[data-dark="true"] .sheet-title {
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .sheet-meta {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .card-title {
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .card-desc {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .card-code {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .card-footer {
  border-color: rgba(255, 255, 255, 0.07);
}
.pin-mindmap-root[data-dark="true"] .card-actions {
  border-color: rgba(255, 255, 255, 0.06);
}
.pin-mindmap-root[data-dark="true"] .seat-avatar {
  background: #334155;
  color: #c4b8f0;
  border-color: #1e293b;
}
.pin-mindmap-root[data-dark="true"] .collapse-btn {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .collapsed-badge {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .inline-input {
  background: #1e293b;
  color: #f1f5f9;
  border-color: #7d68c8;
}
.pin-mindmap-root[data-dark="true"] .inline-btn--cancel {
  background: #334155;
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .add-card-btn {
  color: #9356c5;
  background: rgba(147, 86, 197, 0.12);
  border-color: rgba(147, 86, 197, 0.3);
}
.pin-mindmap-root[data-dark="true"] .root-title {
  color: #c4b8f0;
}
.pin-mindmap-root[data-dark="true"] .canvas-controls {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
.pin-mindmap-root[data-dark="true"] .ctrl-btn {
  border-color: #334155;
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .ctrl-divider {
  background: #334155;
}
.pin-mindmap-root[data-dark="true"] .zoom-label {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .canvas-stats {
  background: rgba(15, 23, 42, 0.85);
  border-color: #334155;
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .nact {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .nact:hover {
  background: rgba(147, 86, 197, 0.15);
}
.pin-mindmap-root[data-dark="true"] .sheet-icon-wrap {
  background: rgba(147, 86, 197, 0.15);
}
.pin-mindmap-root[data-dark="true"] .badge--type {
  background: rgba(255, 255, 255, 0.07);
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .badge--status {
  background: rgba(147, 86, 197, 0.2);
  color: #c4b8f0;
}
.pin-mindmap-root[data-dark="true"] .format-sidebar {
  background: #1e293b;
  border-color: #334155;
}
.pin-mindmap-root[data-dark="true"] .fs-header {
  border-color: #334155;
}
.pin-mindmap-root[data-dark="true"] .fs-header-left {
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .fs-close:hover {
  background: #334155;
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .fs-node-label {
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .fs-section {
  border-color: rgba(255, 255, 255, 0.06);
}
.pin-mindmap-root[data-dark="true"] .fs-field label {
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .fs-input,
.pin-mindmap-root[data-dark="true"] .fs-select,
.pin-mindmap-root[data-dark="true"] .fs-input-full,
.pin-mindmap-root[data-dark="true"] .color-hex {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .align-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}
.pin-mindmap-root[data-dark="true"] .shadow-btn {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
.pin-mindmap-root[data-dark="true"] .fs-footer {
  border-color: #334155;
}
.pin-mindmap-root[data-dark="true"] .fs-reset-btn {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
