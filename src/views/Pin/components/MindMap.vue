<template>
  <div
    class="relative w-full h-full flex overflow-hidden pin-mindmap-root rounded-[6px]"
    ref="rootEl"
    :data-dark="isDark ? 'true' : 'false'"
  >
    <div
      class="viewport flex-1 relative overflow-hidden"
      ref="viewportEl"
      @wheel.prevent="handleWheel"
      @mousedown="handleViewportMouseDown"
      @click="handleCanvasClick"
      @contextmenu.prevent
    >
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
                stroke="var(--primary-color, var(--primary-color))"
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

        <!-- Root node -->
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

        <!-- ── Sheets + their cards ── -->
        <template
          v-for="(sheet, sheetIdx) in allSheets"
          :key="sheetUniqueKey(sheet, sheetIdx)"
        >
          <div
            class="pm-node pm-node--sheet mt-3"
            :class="{
              'pm-node--selected':
                selectedNodeId === sheetUniqueKey(sheet, sheetIdx),
            }"
            :style="nodeStyle(sheet, sheetIdx)"
            @mousedown.stop="startDrag($event, sheetUniqueKey(sheet, sheetIdx))"
            @click.stop="handleSheetClick(sheet, sheetIdx)"
            @contextmenu.stop.prevent="
              openCtxMenu($event, 'sheet', sheet, sheetIdx)
            "
          >
            <div class="sheet-inner" :style="sheetBodyStyle(sheet, sheetIdx)">
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
                  @click.stop="toggleCollapse(sheetUniqueKey(sheet, sheetIdx))"
                  :title="
                    isCollapsed(sheetUniqueKey(sheet, sheetIdx))
                      ? 'Expand'
                      : 'Collapse'
                  "
                >
                  <i
                    :class="
                      isCollapsed(sheetUniqueKey(sheet, sheetIdx))
                        ? 'fa-solid fa-chevron-right'
                        : 'fa-solid fa-chevron-down'
                    "
                  ></i>
                </button>
              </div>
              <div
                v-if="
                  isCollapsed(sheetUniqueKey(sheet, sheetIdx)) &&
                  (sheet.cards || []).length
                "
                class="collapsed-badge"
              >
                <i class="fa-solid fa-layer-group me-1"></i
                >{{ sheet.cards.length }} hidden
              </div>
              <div
                v-if="
                  creatingForKey === sheetUniqueKey(sheet, sheetIdx) &&
                  canCreateCard
                "
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
              <button
                v-else-if="
                  canCreateCard &&
                  creatingForKey !== sheetUniqueKey(sheet, sheetIdx)
                "
                class="add-card-btn"
                @click.stop="
                  startInlineCreate(sheetUniqueKey(sheet, sheetIdx), sheet)
                "
              >
                <i class="fa-solid fa-plus"></i> Add card
              </button>
            </div>
          </div>

          <!-- Cards for this sheet -->
          <template v-if="!isCollapsed(sheetUniqueKey(sheet, sheetIdx))">
            <div
              v-for="card in sheet.cards || []"
              :key="card._id"
              class="pm-node pm-node--card"
              :class="{ 'pm-node--selected': selectedNodeId === card._id }"
              :style="cardNodeStyle(card)"
              @mousedown.stop="startDrag($event, card._id)"
              @click.stop="handleCardClick(card)"
              @contextmenu.stop.prevent="
                openCtxMenu($event, 'card', card, sheetIdx)
              "
            >
              <div
                class="card-stripe"
                :style="{ background: getLaneColor(card) }"
              ></div>
              <div class="card-body" :style="cardBodyStyle(card)">
                <div class="card-badges gap-1.5">
                  <span v-if="card['card-type']" class="badge badge--type">{{
                    card["card-type"]
                  }}</span>
                  <span
                    v-if="card['card-status']"
                    class="badge badge--status"
                    >{{ card["card-status"] }}</span
                  >
                  <span
                    v-if="card.priority"
                    class="badge"
                    :class="`badge--${card.priority}`"
                  >
                    <i class="fa-solid fa-flag" style="font-size: 8px"></i>
                    {{ card.priority }}
                  </span>
                </div>
                <div class="relative inline-block group">
                  <p class="card-title">
                    {{ card["card-title"] || "Untitled" }}
                  </p>
                  <div
                    v-if="(card['card-title'] || '').length > 30"
                    class="absolute -right-32 z-100 -top-6 mt-1 hidden group-hover:block bg-white text-gray-800 text-xs px-2 py-1 rounded shadow border"
                  >
                    {{ card["card-title"] }}
                  </div>
                </div>
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
                    @click.stop="createCardDirectly(card.sheet_id, card._id)"
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

      <!-- Controls panel (layout buttons removed — now live in the format sidebar) -->
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
          :class="{ 'ctrl-btn--active': isFullscreen }"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Exit Fullscreen (Esc / G)' : 'Fullscreen (G)'"
        >
          <i
            :class="
              isFullscreen
                ? 'fa-solid fa-compress-arrows-alt'
                : 'fa-solid fa-expand-arrows-alt'
            "
          ></i>
        </button>
        <button class="ctrl-btn" @click="centerView" title="Center view (C)">
          <i class="fa-solid fa-compress"></i>
        </button>
        <button class="ctrl-btn" @click="fitToScreen" title="Fit to screen (F)">
          <i class="fa-solid fa-expand"></i>
        </button>
        <button
          class="ctrl-btn"
          @click="handleResetView"
          title="Reset zoom (R)"
        >
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <div class="ctrl-divider"></div>
        <button
          v-if="canAssignCard && canEditCard && canCreateCard"
          class="ctrl-btn"
          :class="{ 'ctrl-btn--active': showFormatSidebar }"
          @click="showFormatSidebar = !showFormatSidebar"
          title="Theme & Format"
        >
          <i class="fa-solid fa-sliders"></i>
        </button>
      </div>

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

      <transition name="hint-fade">
        <div v-if="showShortcutHint" class="shortcut-hint">
          {{ lastShortcutLabel }}
        </div>
      </transition>
    </div>

    <!-- Context Menu -->
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
              <kbd class="ctx-kbd">Space</kbd>
            </button>
            <button v-if="canCreateCard" class="ctx-item" @click="ctxAddCard">
              <i class="fa-solid fa-plus ctx-item-icon ctx-icon--add"></i>
              <span>Add card below</span>
              <kbd class="ctx-kbd">Enter</kbd>
            </button>
            <button v-if="canCreateCard" class="ctx-item" @click="ctxDuplicate">
              <i
                class="fa-solid fa-clone ctx-item-icon ctx-icon--duplicate"
              ></i>
              <span>Duplicate</span>
              <kbd class="ctx-kbd">Ctrl+D</kbd>
            </button>
            <div class="ctx-divider"></div>
            <button
              v-if="canAssignCard && canEditCard"
              class="ctx-item"
              @click="ctxFormatCard"
            >
              <i class="fa-solid fa-palette ctx-item-icon ctx-icon--format"></i>
              <span>Format</span>
            </button>
            <button
              v-if="canAssignCard && canEditCard"
              class="ctx-item"
              @click="ctxCopyStyle"
            >
              <i
                class="fa-solid fa-paintbrush ctx-item-icon ctx-icon--copy-style"
              ></i>
              <span>Copy style</span>
              <kbd class="ctx-kbd">Alt+Ctrl+C</kbd>
            </button>
            <button
              v-if="canAssignCard && canEditCard && styleClipboard"
              class="ctx-item"
              @click="ctxPasteStyle"
            >
              <i
                class="fa-solid fa-paste ctx-item-icon ctx-icon--paste-style"
              ></i>
              <span>Paste style</span>
              <kbd class="ctx-kbd">Alt+Ctrl+V</kbd>
            </button>
            <button
              v-if="canAssignCard && canEditCard"
              class="ctx-item"
              @click="ctxResetStyle"
            >
              <i
                class="fa-solid fa-rotate-left ctx-item-icon ctx-icon--reset-style"
              ></i>
              <span>Reset style</span>
              <kbd class="ctx-kbd">Alt+Ctrl+0</kbd>
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
              <kbd class="ctx-kbd">Enter</kbd>
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
                style="color: var(--primary-color)"
              ></i>
              <span>{{
                isCollapsed(ctxMenu.nodeId) ? "Expand" : "Collapse"
              }}</span>
              <kbd class="ctx-kbd">Ctrl+/</kbd>
            </button>
            <button
              class="ctx-item"
              @click="
                () => {
                  collapseAll();
                  closeCtxMenu();
                }
              "
            >
              <i
                class="fa-solid fa-layer-group ctx-item-icon"
                style="color: #f59e0b"
              ></i>
              <span>Collapse all</span>
              <kbd class="ctx-kbd">Alt+Ctrl+/</kbd>
            </button>
            <button
              class="ctx-item"
              @click="
                () => {
                  expandAll();
                  closeCtxMenu();
                }
              "
            >
              <i
                class="fa-solid fa-expand ctx-item-icon"
                style="color: #22c55e"
              ></i>
              <span>Expand all</span>
              <kbd class="ctx-kbd">Alt+Ctrl+=</kbd>
            </button>
          </template>
        </div>
      </transition>
    </Teleport>

    <!-- Format Sidebar -->
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
              :class="
                selectedNodeId ? 'fa-solid fa-sliders' : 'fa-solid fa-palette'
              "
              style="color: var(--primary-color, var(--primary-color))"
            ></i>
            <span>{{ selectedNodeId ? "Format Node" : "Map Theme" }}</span>
          </div>
          <button class="fs-close" @click="showFormatSidebar = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Theme panel (no node selected) -->
        <div v-if="!selectedNodeId" class="theme-panel">

          <!-- Tab bar -->
          <div class="fs-tabs">
            <button
              class="fs-tab"
              :class="{ 'fs-tab--active': activeFormatTab === 'theme' }"
              @click="activeFormatTab = 'theme'"
            >
              <i class="fa-solid fa-palette" style="font-size: 11px"></i>
              Theme
            </button>
            <button
              class="fs-tab"
              :class="{ 'fs-tab--active': activeFormatTab === 'layout' }"
              @click="activeFormatTab = 'layout'"
            >
              <i class="fa-solid fa-table-cells-large" style="font-size: 11px"></i>
              Layout
            </button>
          </div>

          <!-- ── THEME TAB ── -->
          <template v-if="activeFormatTab === 'theme'">
            <div class="fs-section">
              <div class="fs-section-label">Canvas Background</div>
              <div class="bg-color-grid">
                <button
                  v-for="color in BG_COLORS"
                  :key="color"
                  class="bg-swatch"
                  :class="{ 'bg-swatch--active': activeCanvasBg === color }"
                  :style="{ background: color }"
                  :title="color"
                  @click="applyCustomBg(color)"
                ></button>
              </div>
              <div class="bg-custom-row">
                <div class="color-swatch" :style="{ background: customBgColor }">
                  <input
                    type="color"
                    :value="customBgColor"
                    @input="applyCustomBg(($event.target as HTMLInputElement).value)"
                  />
                </div>
                <span class="bg-hex-label">#</span>
                <input
                  class="bg-hex-input"
                  :value="customBgColor.replace('#', '')"
                  maxlength="6"
                  placeholder="dedfe3"
                  @change="applyCustomBg('#' + ($event.target as HTMLInputElement).value)"
                />
                <span class="bg-opacity-label">100%</span>
              </div>
              <div v-if="recentlyUsedColors.length" class="bg-recent">
                <div class="bg-recent-label">Recently Used</div>
                <div class="bg-color-grid">
                  <button
                    v-for="color in recentlyUsedColors"
                    :key="color"
                    class="bg-swatch"
                    :class="{ 'bg-swatch--active': activeCanvasBg === color }"
                    :style="{ background: color }"
                    @click="applyCustomBg(color)"
                  ></button>
                </div>
              </div>
            </div>

            <div class="fs-section">
              <div class="fs-section-label">Color Theme</div>
              <div class="theme-grid">
                <button
                  v-for="theme in THEMES"
                  :key="theme.id"
                  class="theme-card"
                  :class="{ 'theme-card--active': activeThemeId === theme.id }"
                  :title="theme.name"
                  @click="applyTheme(theme)"
                >
                  <div class="theme-preview" :style="{ background: theme.bg }">
                    <div
                      class="tp-center"
                      :style="{ background: theme.nodeColors.root }"
                    ></div>
                    <div class="tp-branches">
                      <div
                        class="tp-branch"
                        :style="{ background: theme.nodeColors.sheet }"
                      ></div>
                      <div
                        class="tp-branch"
                        :style="{ background: theme.nodeColors.sheet }"
                      ></div>
                      <div
                        class="tp-branch"
                        :style="{ background: theme.nodeColors.card }"
                      ></div>
                    </div>
                    <svg class="tp-lines" viewBox="0 0 60 40">
                      <line
                        x1="22"
                        y1="20"
                        x2="38"
                        y2="8"
                        :stroke="theme.edgeColor"
                        stroke-width="1.5"
                      />
                      <line
                        x1="22"
                        y1="20"
                        x2="38"
                        y2="20"
                        :stroke="theme.edgeColor"
                        stroke-width="1.5"
                      />
                      <line
                        x1="22"
                        y1="20"
                        x2="38"
                        y2="32"
                        :stroke="theme.edgeColor"
                        stroke-width="1.5"
                      />
                    </svg>
                  </div>
                  <span class="theme-name">{{ theme.name }}</span>
                  <i
                    v-if="activeThemeId === theme.id"
                    class="fa-solid fa-check theme-check"
                  ></i>
                </button>
              </div>
            </div>

            <div class="theme-hint">
              <i class="fa-solid fa-circle-info me-1" style="color: #94a3b8"></i>
              <span>Click a node to format it individually</span>
            </div>
          </template>

          <!-- ── LAYOUT TAB ── -->
          <template v-else>
            <div
              v-for="group in LAYOUT_GROUPS"
              :key="group.label"
              class="fs-section"
            >
              <div class="fs-section-label">{{ group.label }}</div>
              <div class="layout-grid">
                <button
                  v-for="lv in group.views"
                  :key="lv.id"
                  class="layout-card"
                  :class="{ 'layout-card--active': layout === lv.id }"
                  :title="lv.name"
                  @click="setLayout(lv.id as Direction)"
                >
                  <div class="layout-preview">
                    <svg
                      viewBox="0 0 60 44"
                      width="60"
                      height="44"
                      v-html="lv.svg"
                    ></svg>
                  </div>
                  <span class="layout-name">{{ lv.name }}</span>
                  <i
                    v-if="layout === lv.id"
                    class="fa-solid fa-check layout-check"
                  ></i>
                </button>
              </div>
            </div>

            <div class="theme-hint">
              <i class="fa-solid fa-circle-info me-1" style="color: #94a3b8"></i>
              <span>Click a layout to reorganise the map</span>
            </div>
          </template>
        </div>

        <!-- Node format panel (node selected) -->
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
            <div class="fs-field mt-1">
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
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Lato', sans-serif">Lato</option>
                  <option value="'Nunito', sans-serif">Nunito</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
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

        <div class="fs-footer" v-if="selectedNodeId">
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

        <!-- Save Theme footer shown only on theme tab with no node selected -->
        <!-- <div
          v-if="!selectedNodeId && activeFormatTab === 'theme'"
          class="fs-footer"
        >
          <button class="fs-save-btn" @click="saveTheme">
            <i class="fa-solid fa-floppy-disk me-1"></i>
            Save Theme
          </button>
        </div> -->
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
import { useThemeStore } from "../../../stores/theme";
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

// ── Node dimensions ──────────────────────────────────────────────────────
const ROOT_W = 200;
const ROOT_H = 52;
const SHEET_W = 210;
const SHEET_H = 80;
const CARD_W = 230;
const H_GAP = 80;
const V_GAP = 14;

// ── Refs ─────────────────────────────────────────────────────────────────
const rootEl = ref<HTMLElement | null>(null);
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
const themeStore = useThemeStore();
const workspaceStore = useWorkspaceStore();
const localWorkspace = computed(() => workspaceStore.singleWorkspace);
const workspaceName = ref(localStorage.getItem("currentName"));

const isFullscreen = ref(false);
const styleClipboard = ref<Record<string, any> | null>(null);
const showShortcutHint = ref(false);
const lastShortcutLabel = ref("");
const shortcutHintTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const lastCreatedFromCardId = ref<string | null>(null);

// ── Format tab ────────────────────────────────────────────────────────────
const activeFormatTab = ref<"theme" | "layout">("theme");

// ── Hint ─────────────────────────────────────────────────────────────────
function showHint(label: string) {
  lastShortcutLabel.value = label;
  showShortcutHint.value = true;
  if (shortcutHintTimer.value) clearTimeout(shortcutHintTimer.value);
  shortcutHintTimer.value = setTimeout(() => {
    showShortcutHint.value = false;
  }, 900);
}

// ── Unique key per sheet ─────────────────────────────────────────────────
function sheetUniqueKey(sheet: any, idx: number): string {
  const title = (sheet.title || sheet.variables?.["sheet-title"] || "sheet")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `sheet__${title}__${idx}`;
}

// ── Themes ───────────────────────────────────────────────────────────────
interface MapTheme {
  id: string;
  name: string;
  bg: string;
  nodeColors: { root: string; sheet: string; list: string; card: string };
  edgeColor: string;
  textColor: string;
}

const THEMES: MapTheme[] = [
  {
    id: "default",
    name: "Default",
    bg: "var(--bg-body)",
    nodeColors: {
      root: "var(--primary-color)",
      sheet: "var(--bg-surface)",
      list: "var(--bg-card)",
      card: "var(--bg-card)",
    },
    edgeColor: "var(--primary-color)",
    textColor: "var(--text-primary)",
  },
  // {
  //   id: "default",
  //   name: "Default",
  //   bg: "#dedfe3",
  //   nodeColors: {
  //     root: "#f1eeff",
  //     sheet: "#ede9fb",
  //     list: "#f3f4f6",
  //     card: "#ffffff",
  //   },
  //   edgeColor: "#7D68C8",
  //   textColor: "#2b2c30",
  // },
  {
    id: "ocean",
    name: "Ocean",
    bg: "#e0f2fe",
    nodeColors: { root: "#0ea5e9", sheet: "#38bdf8", list: "#e0f2fe", card: "#f0f9ff" },
    edgeColor: "#0284c7",
    textColor: "#0c4a6e",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "#dcfce7",
    nodeColors: { root: "#16a34a", sheet: "#4ade80", list: "#dcfce7", card: "#f0fdf4" },
    edgeColor: "#15803d",
    textColor: "#14532d",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#fff7ed",
    nodeColors: { root: "#ea580c", sheet: "#fb923c", list: "#fff7ed", card: "#ffffff" },
    edgeColor: "#c2410c",
    textColor: "#7c2d12",
  },
  {
    id: "rose",
    name: "Rose",
    bg: "#fff1f2",
    nodeColors: { root: "#e11d48", sheet: "#fb7185", list: "#fff1f2", card: "#ffffff" },
    edgeColor: "#be123c",
    textColor: "#881337",
  },
  {
    id: "violet",
    name: "Violet",
    bg: "#f5f3ff",
    nodeColors: { root: "#7c3aed", sheet: "#a78bfa", list: "#f5f3ff", card: "#ffffff" },
    edgeColor: "#6d28d9",
    textColor: "#2e1065",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "#0f172a",
    nodeColors: { root: "#1e293b", sheet: "#334155", list: "#1e293b", card: "#1e293b" },
    edgeColor: "#7c3aed",
    textColor: "#f1f5f9",
  },
  {
    id: "slate",
    name: "Slate",
    bg: "#f1f5f9",
    nodeColors: { root: "#334155", sheet: "#64748b", list: "#f1f5f9", card: "#ffffff" },
    edgeColor: "#475569",
    textColor: "#0f172a",
  },
  {
    id: "amber",
    name: "Golden",
    bg: "#fffbeb",
    nodeColors: { root: "#d97706", sheet: "#fbbf24", list: "#fffbeb", card: "#ffffff" },
    edgeColor: "#b45309",
    textColor: "#78350f",
  },
  {
    id: "teal",
    name: "Teal",
    bg: "#f0fdfa",
    nodeColors: { root: "#0d9488", sheet: "#2dd4bf", list: "#f0fdfa", card: "#ffffff" },
    edgeColor: "#0f766e",
    textColor: "#134e4a",
  },
  {
    id: "dark-purple",
    name: "Dark Purple",
    bg: "#1a0a2e",
    nodeColors: { root: "#2d1b4e", sheet: "#4a2870", list: "#2d1b4e", card: "#2d1b4e" },
    edgeColor: "#9333ea",
    textColor: "#e9d5ff",
  },
  {
    id: "nord",
    name: "Nord",
    bg: "#2e3440",
    nodeColors: { root: "#3b4252", sheet: "#434c5e", list: "#3b4252", card: "#3b4252" },
    edgeColor: "#88c0d0",
    textColor: "#eceff4",
  },
  {
    id: "lavender",
    name: "Lavender",
    bg: "#faf5ff",
    nodeColors: { root: "#c084fc", sheet: "#e9d5ff", list: "#faf5ff", card: "#ffffff" },
    edgeColor: "#a855f7",
    textColor: "#4c1d95",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    bg: "#0a0a0a",
    nodeColors: { root: "#ff00ff", sheet: "#00ffff", list: "#111111", card: "#1a1a1a" },
    edgeColor: "#facc15",
    textColor: "#e5e5e5",
  },
  {
    id: "mint",
    name: "Mint",
    bg: "#ecfdf5",
    nodeColors: { root: "#10b981", sheet: "#6ee7b7", list: "#ecfdf5", card: "#ffffff" },
    edgeColor: "#059669",
    textColor: "#064e3b",
  },
  {
    id: "coral",
    name: "Coral",
    bg: "#fff5f5",
    nodeColors: { root: "#ff6b6b", sheet: "#ffa8a8", list: "#fff5f5", card: "#ffffff" },
    edgeColor: "#fa5252",
    textColor: "#7f1d1d",
  },
  {
    id: "ice",
    name: "Ice",
    bg: "#f0f9ff",
    nodeColors: { root: "#7dd3fc", sheet: "#bae6fd", list: "#f0f9ff", card: "#ffffff" },
    edgeColor: "#38bdf8",
    textColor: "#0c4a6e",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    bg: "#18181b",
    nodeColors: { root: "#27272a", sheet: "#3f3f46", list: "#27272a", card: "#27272a" },
    edgeColor: "#a1a1aa",
    textColor: "#fafafa",
  },
  {
    id: "peach",
    name: "Peach",
    bg: "#fff7ed",
    nodeColors: { root: "#fb923c", sheet: "#fdba74", list: "#fff7ed", card: "#ffffff" },
    edgeColor: "#ea580c",
    textColor: "#7c2d12",
  },
  {
    id: "aqua",
    name: "Aqua",
    bg: "#ecfeff",
    nodeColors: { root: "#06b6d4", sheet: "#67e8f9", list: "#ecfeff", card: "#ffffff" },
    edgeColor: "#0891b2",
    textColor: "#083344",
  },
  {
    id: "crimson",
    name: "Crimson",
    bg: "#fef2f2",
    nodeColors: { root: "#b91c1c", sheet: "#ef4444", list: "#fef2f2", card: "#ffffff" },
    edgeColor: "#991b1b",
    textColor: "#450a0a",
  },
  {
    id: "indigo",
    name: "Indigo",
    bg: "#eef2ff",
    nodeColors: { root: "#4f46e5", sheet: "#818cf8", list: "#eef2ff", card: "#ffffff" },
    edgeColor: "#4338ca",
    textColor: "#1e1b4b",
  },
  {
    id: "sand",
    name: "Sand",
    bg: "#fdf6e3",
    nodeColors: { root: "#d4a373", sheet: "#e6ccb2", list: "#fdf6e3", card: "#ffffff" },
    edgeColor: "#b08968",
    textColor: "#583101",
  },
  {
    id: "neon",
    name: "Neon",
    bg: "#050505",
    nodeColors: { root: "#39ff14", sheet: "#00ffcc", list: "#0a0a0a", card: "#111111" },
    edgeColor: "#ff073a",
    textColor: "#eaffea",
  },
];

const BG_COLORS = [
  "#dedfe3", "#ffffff", "#f8fafc", "#f0f9ff", "#f0fdf4", "#fff7ed",
  "#fdf4ff", "#fff1f2", "#fffbeb", "#f1f5f9", "#0f172a", "#1a1a2e",
  "#0d1117", "#1e293b", "#2e3440", "#6fd0f9", "#fde68a", "#bbf7d0",
  "#fecdd3", "#ddd6fe",
];

const activeThemeId = ref("default");
const activeCanvasBg = ref("var(--bg-body)");
const recentlyUsedColors = ref<string[]>([]);
const customBgColor = ref("#dedfe3");
const savedThemeDocId = ref<string | null>(null);
  async function persistTheme(stylePayload: Record<string, any>) {
  const userId = localStorage.getItem("user_id") ?? undefined;
  const type_id = props.workspaceId; // pin mindmap has no sprint/sheet context
  const type = "pin";

  const payload = {
    workspace_id: props.workspaceId,
    type,
    type_id,
    style: stylePayload,
    created_by: userId,
  };

  if (savedThemeDocId.value) {
    await themeStore.updateMindmapTheme(savedThemeDocId.value, payload);
  } else {
    await themeStore.saveMindmapTheme(payload);
    const match = await themeStore.getMindmapThemeByWorkflow(
      props.workspaceId,
      type_id,
      type
    );
    if (match?._id) savedThemeDocId.value = match._id;
  }
}
async function applyTheme(theme: MapTheme, persist = true) {
  activeThemeId.value = theme.id;
  activeCanvasBg.value = theme.bg;
  customBgColor.value = theme.bg;
  const el = rootEl.value;
  if (!el) return;
  el.style.setProperty("--mm-bg", theme.bg);
  el.style.setProperty("--mm-node-root-bg", theme.nodeColors.root);
  el.style.setProperty("--mm-node-sheet-bg", theme.nodeColors.sheet);
  el.style.setProperty("--mm-node-list-bg", theme.nodeColors.list);
  el.style.setProperty("--mm-node-card-bg", theme.nodeColors.card);
  el.style.setProperty("--mm-edge-color", theme.edgeColor);
  el.style.setProperty("--mm-text-color", theme.textColor);
  if (!persist) return;

  const stylePayload = {
    mm_theme_id:   theme.id,
    mm_bg:         theme.bg,
    mm_edge_color: theme.edgeColor,
    mm_text_color: theme.textColor,
    mm_node_root:  theme.nodeColors.root,
    mm_node_sheet: theme.nodeColors.sheet,
    mm_node_list:  theme.nodeColors.list,
    mm_node_card:  theme.nodeColors.card,
  };

  await persistTheme(stylePayload);
}

async function applyCustomBg(color: string, persist = true) {
  activeCanvasBg.value = color;
  customBgColor.value = color;
  activeThemeId.value = "custom";
  const el = rootEl.value;
  if (!el) return;
  el.style.setProperty("--mm-bg", color);
  if (!recentlyUsedColors.value.includes(color)) {
    recentlyUsedColors.value = [color, ...recentlyUsedColors.value].slice(0, 7);
  }
  if (!persist) return;
  await persistTheme({ mm_theme_id: "custom", mm_bg: color });
}

async function loadSavedTheme() {
  try {
    const type = "pin";
    const type_id = props.workspaceId;

    const match = await themeStore.getMindmapThemeByWorkflow(
      props.workspaceId,
      type_id,
      type
    );

    if (match) {
      savedThemeDocId.value = match._id ?? null;

      // Ensure rootEl is mounted before applying CSS vars
      let attempts = 0;
      while (!rootEl.value && attempts < 10) {
        await nextTick();
        attempts++;
      }
      if (!rootEl.value) await new Promise(resolve => setTimeout(resolve, 100));

      applyStyleObject(match.style);
      return;
    }
  } catch (err) {
    console.warn("Could not load theme from API, falling back", err);
  }

  // Fallback: read from listsData style
  const style = props.listsData?.[0]?.style;
  if (style?.mm_theme_id) applyStyleObject(style);
}
function applyStyleObject(style: Record<string, any>) {
  if (!style?.mm_theme_id) return;

  if (style.mm_theme_id === "custom") {
    if (style.mm_bg) applyCustomBg(style.mm_bg, false);
    return;
  }

  const found = THEMES.find((t) => t.id === style.mm_theme_id);
  if (found) {
    const restored: MapTheme = {
      ...found,
      bg:        style.mm_bg         ?? found.bg,
      edgeColor: style.mm_edge_color ?? found.edgeColor,
      textColor: style.mm_text_color ?? found.textColor,
      nodeColors: {
        root:  style.mm_node_root  ?? found.nodeColors.root,
        sheet: style.mm_node_sheet ?? found.nodeColors.sheet,
        list:  style.mm_node_list  ?? found.nodeColors.list,
        card:  style.mm_node_card  ?? found.nodeColors.card,
      },
    };
    applyTheme(restored, false);
  } else if (style.mm_bg) {
    applyCustomBg(style.mm_bg, false);
  }
}
// ── Layout Groups ─────────────────────────────────────────────────────────
const LAYOUT_GROUPS = [
  {
    label: "Mind Map",
    views: [
      {
        id: "right",
        name: "Right",
        svg: `<g>
          <rect x="4" y="18" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="32" y="6" width="22" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="32" y="18" width="22" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="32" y="30" width="22" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M18 22 C25 22 25 9 32 9" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M18 22 C25 22 25 21 32 21" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M18 22 C25 22 25 33 32 33" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "left",
        name: "Left",
        svg: `<g>
          <rect x="42" y="18" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="6" y="6" width="22" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="6" y="18" width="22" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="6" y="30" width="22" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M42 22 C35 22 35 9 28 9" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M42 22 C35 22 35 21 28 21" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M42 22 C35 22 35 33 28 33" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "center",
        name: "Centered",
        svg: `<g>
          <rect x="23" y="18" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="6" width="16" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="18" width="16" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="31" width="16" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="42" y="6" width="16" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="42" y="18" width="16" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="42" y="31" width="16" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M23 22 C15 22 15 9 18 9" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M23 22 C15 22 15 21 18 21" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M23 22 C15 22 15 34 18 34" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M37 22 C45 22 45 9 42 9" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M37 22 C45 22 45 21 42 21" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M37 22 C45 22 45 34 42 34" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "top",
        name: "Top down",
        svg: `<g>
          <rect x="23" y="4" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="4" y="28" width="14" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="23" y="28" width="14" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="42" y="28" width="14" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M30 12 C30 20 11 20 11 28" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M30 12 C30 20 30 20 30 28" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M30 12 C30 20 49 20 49 28" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "bottom",
        name: "Bottom up",
        svg: `<g>
          <rect x="23" y="30" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="4" y="8" width="14" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="23" y="8" width="14" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="42" y="8" width="14" height="7" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M30 30 C30 22 11 22 11 15" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M30 30 C30 22 30 22 30 15" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M30 30 C30 22 49 22 49 15" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "radial",
        name: "Radial",
        svg: `<g>
          <rect x="23" y="18" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="23" y="2" width="14" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="23" y="38" width="14" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="18" width="14" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="44" y="18" width="14" height="6" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M30 22 C30 14 30 10 30 8" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M30 22 C30 30 30 36 30 38" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M23 22 C16 22 14 22 16 21" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M37 22 C44 22 46 22 44 21" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
    ],
  },
  {
    label: "Logic Chart",
    views: [
      {
        id: "logic-right",
        name: "Logic Right",
        svg: `<g>
          <rect x="2" y="18" width="16" height="8" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="30" y="6" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="30" y="16" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="30" y="26" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="30" y="36" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M18 22 L22 22 L22 9 L30 9" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M22 22 L22 19 L30 19" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M22 22 L22 29 L30 29" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M22 22 L22 39 L30 39" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "logic-left",
        name: "Logic Left",
        svg: `<g>
          <rect x="42" y="18" width="16" height="8" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="6" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="16" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="26" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="36" width="28" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <path d="M42 22 L38 22 L38 9 L30 9" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M38 22 L38 19 L30 19" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M38 22 L38 29 L30 29" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
          <path d="M38 22 L38 39 L30 39" fill="none" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "fishbone",
        name: "Fishbone",
        svg: `<g>
          <rect x="36" y="19" width="20" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <line x1="4" y1="22" x2="36" y2="22" stroke="var(--primary-color)" stroke-width="1.5"/>
          <line x1="10" y1="22" x2="18" y2="10" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="22" y1="22" x2="30" y2="10" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="10" y1="22" x2="18" y2="34" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="22" y1="22" x2="30" y2="34" stroke="var(--primary-color)" stroke-width="1"/>
          <rect x="14" y="5" width="12" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="26" y="5" width="12" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="14" y="33" width="12" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="26" y="33" width="12" height="6" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
        </g>`,
      },
    ],
  },
  {
    label: "Structure",
    views: [
      {
        id: "org-chart",
        name: "Org Chart",
        svg: `<g>
          <rect x="22" y="2" width="16" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="4" y="22" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="23" y="22" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="42" y="22" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <line x1="30" y1="10" x2="30" y2="15" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="11" y1="15" x2="49" y2="15" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="11" y1="15" x2="11" y2="22" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="30" y1="15" x2="30" y2="22" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="49" y1="15" x2="49" y2="22" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "timeline",
        name: "Timeline",
        svg: `<g>
          <line x1="4" y1="22" x2="56" y2="22" stroke="var(--primary-color)" stroke-width="1.5"/>
          <circle cx="12" cy="22" r="2.5" fill="var(--primary-color)"/>
          <circle cx="30" cy="22" r="2.5" fill="var(--primary-color)"/>
          <circle cx="48" cy="22" r="2.5" fill="var(--primary-color)"/>
          <rect x="5" y="8" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="23" y="28" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="41" y="8" width="14" height="8" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <line x1="12" y1="19" x2="12" y2="16" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="30" y1="25" x2="30" y2="28" stroke="var(--primary-color)" stroke-width="1"/>
          <line x1="48" y1="19" x2="48" y2="16" stroke="var(--primary-color)" stroke-width="1"/>
        </g>`,
      },
      {
        id: "tree-map",
        name: "Tree Map",
        svg: `<g>
          <rect x="2" y="2" width="56" height="40" rx="2" fill="none" stroke="var(--border)" stroke-width="1"/>
          <rect x="6" y="6" width="24" height="14" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="32" y="6" width="22" height="14" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="6" y="22" width="48" height="16" rx="1" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
        </g>`,
      },
    ],
  },
];

// ── Fullscreen ───────────────────────────────────────────────────────────
async function toggleFullscreen() {
  const el = rootEl.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    try { await el.requestFullscreen(); } catch (err) { console.warn("Fullscreen denied:", err); }
  } else {
    await document.exitFullscreen();
  }
}
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  nextTick(() => centerView());
}

// ── Direction type ────────────────────────────────────────────────────────
type Direction =
  | "right" | "left" | "center" | "top" | "bottom"
  | "radial"
  | "logic-right" | "logic-left"
  | "fishbone"
  | "org-chart"
  | "timeline"
  | "tree-map";

const layout = ref<Direction>("right");

interface Pos { x: number; y: number; w: number; h: number; }
const positions = reactive<Record<string, Pos>>({});

// ── Collapse ──────────────────────────────────────────────────────────────
const collapsedIds = ref<string[]>([]);
const isCollapsed = (id: string) => collapsedIds.value.includes(id);
const toggleCollapse = (id: string) => {
  if (isCollapsed(id)) collapsedIds.value = collapsedIds.value.filter((x) => x !== id);
  else collapsedIds.value = [...collapsedIds.value, id];
  nextTick(runLayout);
};
function collapseAll() {
  const keys = allSheets.value.map((s: any, i: number) => sheetUniqueKey(s, i));
  collapsedIds.value = [...new Set([...collapsedIds.value, ...keys])];
  nextTick(runLayout);
  showHint("All Collapsed");
}
function expandAll() {
  collapsedIds.value = [];
  nextTick(runLayout);
  showHint("All Expanded");
}

// ── Selection / Format sidebar ────────────────────────────────────────────
const selectedNodeId = ref<string | null>(null);
const showFormatSidebar = ref(false);
const hyperlinkInput = ref("");
const isSavingNodeStyle = ref(false);
const nodeStyles = reactive<Record<string, Record<string, any>>>({});

const activeFormatStyle = computed<Record<string, any>>(() => {
  if (!selectedNodeId.value) return {};
  return nodeStyles[selectedNodeId.value] || {};
});

const selectedNodeLabel = computed<string>(() => {
  if (!selectedNodeId.value) return "";
  if (selectedNodeId.value === "__root__") return workspaceName.value || "Root";
  const sheetIdx = allSheets.value.findIndex(
    (_: any, i: number) => sheetUniqueKey(allSheets.value[i], i) === selectedNodeId.value,
  );
  if (sheetIdx !== -1) {
    const s = allSheets.value[sheetIdx];
    return s.title || s.variables?.["sheet-title"] || "Sheet";
  }
  for (const sheet of allSheets.value) {
    const card = (sheet.cards || []).find((c: any) => c._id === selectedNodeId.value);
    if (card) return card["card-title"] || "Card";
  }
  return selectedNodeId.value;
});

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

const shadowPresets = [
  { label: "None", value: "" },
  { label: "Soft", value: "0 2px 8px rgba(0,0,0,0.10)" },
  { label: "Medium", value: "0 4px 16px rgba(0,0,0,0.14)" },
  { label: "Strong", value: "0 8px 32px rgba(0,0,0,0.20)" },
  { label: "Purple", value: "0 4px 20px rgba(125,104,200,0.35)" },
];

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
    bg_color: "background", color: "color", border_color: "borderColor",
    font_size: "fontSize", font_weight: "fontWeight", font_style: "fontStyle",
    font_family: "fontFamily", border_width: "borderWidth",
    border_radius: "borderRadius", padding: "padding",
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
    text_align: "textAlign", border_style: "borderStyle",
    box_shadow: "boxShadow", opacity: "opacity",
  };
  const cssKey = keyMap[key] || key;
  if (key === "opacity") s[cssKey] = parseFloat(value);
  else s[cssKey] = value;
}
function resetNodeStyle() {
  if (!selectedNodeId.value) return;
  nodeStyles[selectedNodeId.value] = {};
  hyperlinkInput.value = "";
}
function copyNodeStyle(nodeId: string) {
  const s = nodeStyles[nodeId];
  styleClipboard.value = s ? { ...s } : {};
  showHint("Style Copied");
  toast.success("Style copied");
}
function pasteNodeStyle(nodeId: string) {
  if (!styleClipboard.value) { toast.info("No style in clipboard"); return; }
  ensureNodeStyle(nodeId);
  Object.assign(nodeStyles[nodeId], styleClipboard.value);
  showHint("Style Pasted");
  toast.success("Style pasted — click Save Style to persist");
}
function resetStyleById(nodeId: string) {
  nodeStyles[nodeId] = {};
  showHint("Style Reset");
  toast.success("Style reset");
}

const DEFAULT_BACKEND_STYLE = {
  bg_color: "#ffffff", color: "#2b2c30", font_size: 13,
  font_weight: "normal", font_style: "normal", font_family: "inherit",
  text_align: "left", border_color: "#d9d9d9", border_width: 0,
  border_radius: 8, border_style: "solid", padding: 12, opacity: 1, box_shadow: "",
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
    const sheetIdx = allSheets.value.findIndex(
      (_: any, i: number) => sheetUniqueKey(allSheets.value[i], i) === id,
    );
    const isSheet = sheetIdx !== -1;
    const card = !isSheet
      ? allSheets.value.flatMap((sh: any) => sh.cards || []).find((c: any) => c._id === id)
      : null;
    const sheetObj = isSheet ? allSheets.value[sheetIdx] : null;
    const origStyle = isSheet ? sheetObj?.style || {} : card?.style || {};

    const p = {
      bg_color: resolveStyle(s.background, origStyle.bg_color, DEFAULT_BACKEND_STYLE.bg_color),
      color: resolveStyle(s.color, origStyle.color, DEFAULT_BACKEND_STYLE.color),
      font_size: resolveStyle(s.fontSize ? parseInt(s.fontSize) : undefined, origStyle.font_size, DEFAULT_BACKEND_STYLE.font_size),
      font_weight: resolveStyle(s.fontWeight, origStyle.font_weight, DEFAULT_BACKEND_STYLE.font_weight),
      font_style: resolveStyle(s.fontStyle, origStyle.font_style, DEFAULT_BACKEND_STYLE.font_style),
      font_family: resolveStyle(s.fontFamily, origStyle.font_family, DEFAULT_BACKEND_STYLE.font_family),
      text_align: resolveStyle(s.textAlign, origStyle.text_align, DEFAULT_BACKEND_STYLE.text_align),
      border_color: resolveStyle(s.borderColor, origStyle.border_color, DEFAULT_BACKEND_STYLE.border_color),
      border_width: resolveStyle(s.borderWidth ? parseInt(s.borderWidth) : undefined, origStyle.border_width, DEFAULT_BACKEND_STYLE.border_width),
      border_radius: resolveStyle(s.borderRadius ? parseInt(s.borderRadius) : undefined, origStyle.border_radius, DEFAULT_BACKEND_STYLE.border_radius),
      border_style: resolveStyle(s.borderStyle, origStyle.border_style, DEFAULT_BACKEND_STYLE.border_style),
      padding: resolveStyle(s.padding ? parseInt(s.padding) : undefined, origStyle.padding, DEFAULT_BACKEND_STYLE.padding),
      opacity: resolveStyle(s.opacity, origStyle.opacity, DEFAULT_BACKEND_STYLE.opacity),
      box_shadow: resolveStyle(s.boxShadow, origStyle.box_shadow, DEFAULT_BACKEND_STYLE.box_shadow),
      hyperLink: hyperlinkInput.value || "",
    };

    if (isSheet && sheetObj) {
      emit("update:sheet", {
        sheet_id: sheetObj._id,
        workspace_id: props.workspaceId,
        workspace_module_id: props.moduleId,
        style: p,
      });
    } else if (card) {
      const seatIds = Array.isArray(card.seat_id)
        ? card.seat_id.map((s: any) => s._id || s)
        : card.seat_id;
      emit("update:card", { card_id: id, seat_id: seatIds, style: p });
    }
    toast.success("Style saved");
  } catch {
    toast.error("Failed to save style");
  } finally {
    isSavingNodeStyle.value = false;
  }
}

// ── Inline card creation ──────────────────────────────────────────────────
const creatingForKey = ref<string | null>(null);
const creatingForSheet = ref<any>(null);
const newCardTitle = ref("");
const isCreating = ref(false);

function startInlineCreate(key: string, sheet?: any) {
  creatingForKey.value = key;
  creatingForSheet.value = sheet ?? null;
  newCardTitle.value = "";
  if (isCollapsed(key)) {
    collapsedIds.value = collapsedIds.value.filter((x) => x !== key);
    nextTick(runLayout);
  }
}
function cancelInlineCreate() {
  creatingForKey.value = null;
  creatingForSheet.value = null;
  newCardTitle.value = "";
  isCreating.value = false;
}
async function submitInlineCard() {
  const title = newCardTitle.value.trim();
  if (!title || isCreating.value) return;
  const sheet = creatingForSheet.value;
  if (!sheet) return;
  const sheetTitle = sheet.title || sheet.variables?.["sheet-title"] || "To Do";
  isCreating.value = true;
  try {
    const now = new Date();
    const startDate = now.toISOString().split("T")[0];
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    emit("create:card", {
      sheet_list_id: sheetTitle,
      workspace_id: props.workspaceId,
      sheet_id: sheet._id,
      variables: {
        "card-status": sheetTitle, priority: "medium", process: null,
        "card-title": title, "card-description": "This is a default description",
        "start-date": startDate, "end-date": endDate,
      },
      createdAt: new Date().toISOString(),
    });
    toast.success(`Card "${title}" created`);
    cancelInlineCreate();
  } catch {
    toast.error("Failed to create card");
  } finally {
    isCreating.value = false;
  }
}
async function createCardDirectly(sheetId: string, fromCardId?: string) {
  if (isCreating.value) return;
  const sheet = props.listsData.find((s) => s._id === sheetId);
  if (!sheet) return;
  isCreating.value = true;
  lastCreatedFromCardId.value = fromCardId ?? null;
  try {
    const now = new Date();
    const startDate = now.toISOString().split("T")[0];
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const sheetTitle = sheet.title || sheet.variables?.["sheet-title"] || "To Do";
    emit("create:card", {
      sheet_list_id: sheetTitle,
      workspace_id: props.workspaceId,
      sheet_id: sheetId,
      variables: {
        "card-status": sheetTitle, priority: "medium", process: null,
        "card-title": "New Card", "card-description": "This is a default description",
        "start-date": startDate, "end-date": endDate,
      },
      createdAt: new Date().toISOString(),
    });
    toast.success("Card created");
  } catch {
    toast.error("Failed to create card");
  } finally {
    isCreating.value = false;
  }
}
async function duplicateCard(card: any) {
  if (isCreating.value) return;
  const sheet = props.listsData.find((s: any) => s._id === card.sheet_id);
  if (!sheet) return;
  isCreating.value = true;
  try {
    const now = new Date();
    emit("create:card", {
      sheet_list_id: card["card-status"] || sheet.title || "To Do",
      workspace_id: props.workspaceId,
      sheet_id: card.sheet_id,
      variables: {
        "card-status": card["card-status"] || "To Do", priority: card.priority || "medium",
        process: null, "card-title": (card["card-title"] || "Card") + " (copy)",
        "card-description": card["card-description"] || "",
        "start-date": now.toISOString().split("T")[0],
        "end-date": new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0],
      },
      createdAt: now.toISOString(),
    });
    showHint("Duplicated");
    toast.success("Card duplicated");
  } catch {
    toast.error("Failed to duplicate");
  } finally {
    isCreating.value = false;
  }
}

// ── Drag ──────────────────────────────────────────────────────────────────
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

// ── Context menu ──────────────────────────────────────────────────────────
const ctxMenu = reactive({
  visible: false, x: 0, y: 0,
  nodeType: "" as "card" | "sheet" | "",
  nodeId: "", nodeTitle: "",
  data: null as any, sheetIdx: -1,
});
let ctxSkipNextClick = false;

function openCtxMenu(e: MouseEvent, type: "card" | "sheet", data: any, sheetIdx: number) {
  e.preventDefault(); e.stopPropagation();
  const nodeId = type === "sheet" ? sheetUniqueKey(data, sheetIdx) : data._id;
  selectedNodeId.value = nodeId;
  const vw = window.innerWidth, vh = window.innerHeight;
  ctxMenu.x = Math.min(e.clientX, vw - 220);
  ctxMenu.y = Math.min(e.clientY, vh - 260);
  ctxMenu.nodeType = type;
  ctxMenu.nodeId = nodeId;
  ctxMenu.sheetIdx = sheetIdx;
  ctxMenu.nodeTitle = type === "card"
    ? data["card-title"] || "Card"
    : data.title || data.variables?.["sheet-title"] || "Sheet";
  ctxMenu.data = data;
  ctxMenu.visible = true;
  ctxSkipNextClick = true;
}
function closeCtxMenu() { ctxMenu.visible = false; ctxMenu.data = null; ctxMenu.sheetIdx = -1; }
function ctxOpen() { const d = ctxMenu.data; closeCtxMenu(); if (d) emit("select:ticket", d); }
function ctxFormatCard() { const id = ctxMenu.nodeId; closeCtxMenu(); if (id) nextTick(() => openFormatSidebar(id)); }
function ctxAddCard() { const d = ctxMenu.data; closeCtxMenu(); if (d?.sheet_id) nextTick(() => createCardDirectly(d.sheet_id)); }
function ctxAddCardToSheet() { const key = ctxMenu.nodeId; const sheet = ctxMenu.data; closeCtxMenu(); nextTick(() => startInlineCreate(key, sheet)); }
function ctxDelete() { const d = ctxMenu.data; closeCtxMenu(); if (d) emit("delete:ticket", d._id); }
function ctxDuplicate() { const d = ctxMenu.data; closeCtxMenu(); if (d) nextTick(() => duplicateCard(d)); }
function ctxCopyStyle() { const id = ctxMenu.nodeId; closeCtxMenu(); if (id) copyNodeStyle(id); }
function ctxPasteStyle() { const id = ctxMenu.nodeId; closeCtxMenu(); if (id) pasteNodeStyle(id); }
function ctxResetStyle() { const id = ctxMenu.nodeId; closeCtxMenu(); if (id) resetStyleById(id); }

// ── Data ──────────────────────────────────────────────────────────────────
const allSheets = computed(() => props.listsData || []);
const totalCards = computed(() =>
  allSheets.value.reduce((acc: number, s: any) => acc + (s.cards?.length || 0), 0),
);

function getLaneColor(card: any): string {
  return (
    card.lane?.variables?.["lane-color"] ||
    card?.variables?.lane?.variables?.["lane-color"] ||
    "var(--primary-color)"
  );
}

const rootNode = computed(() => {
  const p = positions["__root__"];
  if (!p) return null;
  return { ...p };
});

function cardHeight(card: any): number {
  let h = 70;
  if (card["card-type"] || card["card-status"] || card.priority) h += 20;
  return h;
}

function computeSheetH(sheet: any, key: string): number {
  console.log(sheet);
  
  return creatingForKey.value === key ? SHEET_H + 52 : SHEET_H;
}

// ── Master layout dispatcher ───────────────────────────────────────────────
function runLayout() {
  switch (layout.value) {
    case "right":
    case "left":
    case "center":
    case "top":
    case "bottom":
      runStandardLayout();
      break;
    case "radial":
      runRadialLayout();
      break;
    case "logic-right":
      runLogicLayout("right");
      break;
    case "logic-left":
      runLogicLayout("left");
      break;
    case "fishbone":
      runFishboneLayout();
      break;
    case "org-chart":
      runOrgChartLayout();
      break;
    case "timeline":
      runTimelineLayout();
      break;
    case "tree-map":
      runTreeMapLayout();
      break;
  }

  const allX = Object.values(positions).map((p) => p.x + p.w);
  const allY = Object.values(positions).map((p) => p.y + p.h);
  svgW.value = Math.max(Math.max(...allX, 0) + 300, 3000);
  svgH.value = Math.max(Math.max(...allY, 0) + 300, 3000);
}

// ── 1. Standard layout (right/left/center/top/bottom) ─────────────────────
function runStandardLayout() {
  const sheets = allSheets.value;
  const dir = layout.value as "right" | "left" | "center" | "top" | "bottom";
  const isVertical = dir === "top" || dir === "bottom";

  const ROOT_X = dir === "left" ? 3200 : dir === "center" ? 2000 : dir === "right" ? 60 : 2000;
  const ROOT_Y_BASE = dir === "top" ? 60 : dir === "bottom" ? 3200 : null;

  const sheetBlocks = sheets.map((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const sh = computeSheetH(sheet, key);
    const collapsed = isCollapsed(key);
    const cards = collapsed ? [] : sheet.cards || [];
    const cardHeights = cards.map(cardHeight);
    const CARD_H_GAP = 20;
    const totalCardsH =
      cardHeights.reduce((a: number, b: number) => a + b, 0) +
      Math.max(0, cards.length - 1) * V_GAP;
    const totalRowW =
      cards.length > 0
        ? cards.length * CARD_W + Math.max(0, cards.length - 1) * CARD_H_GAP
        : SHEET_W;
    const colW = Math.max(SHEET_W, totalRowW);
    const blockH = Math.max(sh, totalCardsH);
    return { sheet, key, sh, cards, cardHeights, totalCardsH, blockH, colW };
  });

  const totalH =
    sheetBlocks.reduce((a: number, b: any) => a + b.blockH, 0) +
    Math.max(0, sheets.length - 1) * (V_GAP * 3);

  if (isVertical) {
    const totalW =
      sheetBlocks.reduce((a: number, b: any) => a + b.colW, 0) +
      Math.max(0, sheetBlocks.length - 1) * (H_GAP * 2);
    const rootX = Math.max(60, totalW / 2 - ROOT_W / 2 + 40);
    positions["__root__"] = { x: rootX, y: ROOT_Y_BASE!, w: ROOT_W, h: ROOT_H };
  } else {
    const rootY = Math.max(60, totalH / 2 - ROOT_H / 2 + 40);
    positions["__root__"] = { x: ROOT_X, y: rootY, w: ROOT_W, h: ROOT_H };
  }

  let currentY = 40;
  const rightSheets: typeof sheetBlocks = [];
  const leftSheets: typeof sheetBlocks = [];
  if (dir === "center") {
    sheetBlocks.forEach((b: any, i: number) => {
      if (i % 2 === 0) rightSheets.push(b); else leftSheets.push(b);
    });
  }

  function placeSheetBlock(block: (typeof sheetBlocks)[0], side: "left" | "right" | "top" | "bottom", offset: number) {
    const { key, sh, cards, cardHeights, totalCardsH, blockH } = block;
    const root = positions["__root__"];
    let sheetX = 0, sheetY = 0;
    if (side === "left" || side === "right") {
      sheetX = side === "left" ? root.x - H_GAP - SHEET_W : root.x + ROOT_W + H_GAP;
      sheetY = offset + blockH / 2 - sh / 2;
    } else {
      sheetX = offset;
      sheetY = side === "top" ? root.y - H_GAP - sh : root.y + ROOT_H + H_GAP;
    }
    positions[key] = { x: sheetX, y: sheetY, w: SHEET_W, h: sh };

    if (side === "left" || side === "right") {
      const cardX = side === "left" ? sheetX - H_GAP - CARD_W : sheetX + SHEET_W + H_GAP;
      let cy = offset + blockH / 2 - totalCardsH / 2;
      cards.forEach((card: any, idx: number) => {
        const ch = cardHeights[idx];
        positions[card._id] = { x: cardX, y: cy, w: CARD_W, h: ch };
        cy += ch + V_GAP;
      });
    } else {
      const CARD_H_GAP = 20;
      const totalRowW = cards.length * CARD_W + Math.max(0, cards.length - 1) * CARD_H_GAP;
      let cx = sheetX + SHEET_W / 2 - totalRowW / 2;
      const maxCardH = cardHeights.length ? Math.max(...cardHeights) : 70;
      const cardY = side === "top" ? sheetY - H_GAP - maxCardH : sheetY + sh + H_GAP;
      cards.forEach((card: any, idx: number) => {
        positions[card._id] = { x: cx, y: cardY, w: CARD_W, h: cardHeights[idx] };
        cx += CARD_W + CARD_H_GAP;
      });
    }
  }

  if (dir === "center") {
    let ry = 40;
    rightSheets.forEach((b: any) => { placeSheetBlock(b, "right", ry); ry += b.blockH + V_GAP * 3; });
    let ly = 40;
    leftSheets.forEach((b: any) => { placeSheetBlock(b, "left", ly); ly += b.blockH + V_GAP * 3; });
    const allYs = Object.values(positions).map((p) => p.y);
    const allBots = Object.values(positions).map((p) => p.y + p.h);
    positions["__root__"].y = (Math.min(...allYs) + Math.max(...allBots)) / 2 - ROOT_H / 2;
  } else if (dir === "top" || dir === "bottom") {
    let cx = 40;
    sheetBlocks.forEach((block: any) => {
      placeSheetBlock(block, dir, cx + block.colW / 2 - SHEET_W / 2);
      cx += block.colW + H_GAP * 2;
    });
    const xs = sheetBlocks.map((b: any) => positions[b.key]?.x ?? 0);
    const rights = sheetBlocks.map((b: any) => { const p = positions[b.key]; return p ? p.x + p.w : 0; });
    if (xs.length) positions["__root__"].x = (Math.min(...xs) + Math.max(...rights)) / 2 - ROOT_W / 2;
  } else {
    const side = dir === "left" ? "left" : "right";
    sheetBlocks.forEach((block: any) => { placeSheetBlock(block, side, currentY); currentY += block.blockH + V_GAP * 3; });
    const ys = sheets.map((_: any, i: number) => positions[sheetUniqueKey(sheets[i], i)]?.y ?? 0);
    const bots = sheets.map((_: any, i: number) => { const p = positions[sheetUniqueKey(sheets[i], i)]; return p ? p.y + p.h : 0; });
    if (ys.length) positions["__root__"].y = (Math.min(...ys) + Math.max(...bots)) / 2 - ROOT_H / 2;
  }
}

// ── 2. Radial layout ───────────────────────────────────────────────────────
function runRadialLayout() {
  const sheets = allSheets.value;
  const CX = 1800, CY = 1600;
  const sheetR = 380, cardR = 680;
  const total = sheets.length;

  positions["__root__"] = { x: CX - ROOT_W / 2, y: CY - ROOT_H / 2, w: ROOT_W, h: ROOT_H };

  sheets.forEach((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const angle = (2 * Math.PI * i) / total - Math.PI / 2;
    const sh = computeSheetH(sheet, key);
    positions[key] = {
      x: CX + sheetR * Math.cos(angle) - SHEET_W / 2,
      y: CY + sheetR * Math.sin(angle) - sh / 2,
      w: SHEET_W, h: sh,
    };
    if (isCollapsed(key)) return;
    const cards = sheet.cards || [];
    const spread = Math.min(Math.PI / 2, cards.length * 0.3);
    cards.forEach((card: any, j: number) => {
      const ch = cardHeight(card);
      const cardAngle = cards.length === 1 ? angle
        : angle - spread / 2 + (spread / (cards.length - 1)) * j;
      positions[card._id] = {
        x: CX + cardR * Math.cos(cardAngle) - CARD_W / 2,
        y: CY + cardR * Math.sin(cardAngle) - ch / 2,
        w: CARD_W, h: ch,
      };
    });
  });
}

// ── 3. Logic layout (logic-right / logic-left) ────────────────────────────
function runLogicLayout(side: "right" | "left") {
  const sheets = allSheets.value;
  const SPINE_GAP = 60, SHEET_GAP = 80, CARD_GAP = 80, ROW_GAP = 18;

  const blocks = sheets.map((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const sh = computeSheetH(sheet, key);
    const cards = isCollapsed(key) ? [] : sheet.cards || [];
    const totalCardsH =
      cards.reduce((a: number, c: any) => a + cardHeight(c), 0) +
      Math.max(0, cards.length - 1) * ROW_GAP;
    return { sheet, key, sh, cards, blockH: Math.max(sh, totalCardsH) };
  });

  const totalH =
    blocks.reduce((a: number, b: any) => a + b.blockH, 0) +
    Math.max(0, blocks.length - 1) * (ROW_GAP * 2);

  const rootX = side === "right" ? 200 : 3000;
  const rootY = Math.max(60, totalH / 2 - ROOT_H / 2 + 40);
  positions["__root__"] = { x: rootX, y: rootY, w: ROOT_W, h: ROOT_H };

  const spineX = side === "right" ? rootX + ROOT_W + SPINE_GAP : rootX - SPINE_GAP;
  const sheetX = side === "right" ? spineX + SHEET_GAP : spineX - SHEET_W - SHEET_GAP;
  const cardX = side === "right" ? sheetX + SHEET_W + CARD_GAP : sheetX - CARD_W - CARD_GAP;

  let currentY = 40;
  blocks.forEach(({ key, sh, cards, blockH }: any) => {
    positions[key] = { x: sheetX, y: currentY + blockH / 2 - sh / 2, w: SHEET_W, h: sh };
    const totalCardsH = cards.reduce((a: number, c: any) => a + cardHeight(c), 0) + Math.max(0, cards.length - 1) * ROW_GAP;
    let cy = currentY + blockH / 2 - totalCardsH / 2;
    cards.forEach((card: any) => {
      const ch = cardHeight(card);
      positions[card._id] = { x: cardX, y: cy, w: CARD_W, h: ch };
      cy += ch + ROW_GAP;
    });
    currentY += blockH + ROW_GAP * 2;
  });

  const ys = blocks.map((b: any) => positions[b.key]?.y ?? 0);
  const bots = blocks.map((b: any) => { const p = positions[b.key]; return p ? p.y + p.h : 0; });
  if (ys.length) positions["__root__"].y = (Math.min(...ys) + Math.max(...bots)) / 2 - ROOT_H / 2;
}

// ── 4. Fishbone (Ishikawa) layout ──────────────────────────────────────────
function runFishboneLayout() {
  const sheets = allSheets.value;
  const topSheets: any[] = [], bottomSheets: any[] = [];
  sheets.forEach((s: any, i: number) => {
    if (i % 2 === 0) topSheets.push({ sheet: s, origIdx: i });
    else bottomSheets.push({ sheet: s, origIdx: i });
  });

  const count = Math.max(topSheets.length, bottomSheets.length);
  const SPINE_LEN = Math.max(600, count * 220 + 100);
  const SPINE_Y = 1600;
  const SPINE_START_X = 300;
  const SPINE_END_X = SPINE_START_X + SPINE_LEN;
  const BRANCH_GAP = 220;
  const BRANCH_LEN = 180;
  const angleRad = (45 * Math.PI) / 180;
  const dx = Math.cos(angleRad) * BRANCH_LEN;
  const dy = Math.sin(angleRad) * BRANCH_LEN;

  positions["__root__"] = { x: SPINE_END_X + 20, y: SPINE_Y - ROOT_H / 2, w: ROOT_W, h: ROOT_H };

  function placeBranch(item: { sheet: any; origIdx: number }, attachX: number, isTop: boolean) {
    const { sheet, origIdx } = item;
    const key = sheetUniqueKey(sheet, origIdx);
    const sh = computeSheetH(sheet, key);
    const tipX = attachX - dx;
    const tipY = isTop ? SPINE_Y - dy : SPINE_Y + dy;
    positions[key] = { x: tipX - SHEET_W / 2, y: tipY - sh / 2, w: SHEET_W, h: sh };

    if (isCollapsed(key)) return;
    const cards = sheet.cards || [];
    cards.forEach((card: any, ci: number) => {
      const ch = cardHeight(card);
      const t = (ci + 1) / (cards.length + 1);
      const bx = attachX - dx * t;
      const by = isTop ? SPINE_Y - dy * t : SPINE_Y + dy * t;
      const subOffset = 80 + ci * (ch + 10);
      positions[card._id] = {
        x: bx - CARD_W / 2,
        y: isTop ? by - subOffset - ch : by + subOffset,
        w: CARD_W, h: ch,
      };
    });
  }

  topSheets.forEach((item: any, i: number) => placeBranch(item, SPINE_END_X - BRANCH_GAP * (i + 1), true));
  bottomSheets.forEach((item: any, i: number) => placeBranch(item, SPINE_END_X - BRANCH_GAP * (i + 1), false));
}

// ── 5. Org Chart layout ────────────────────────────────────────────────────
function runOrgChartLayout() {
  const sheets = allSheets.value;
  const H_SPACING = 60, V_SPACING = 80;
  const CARD_H_GAP = 20;

  const columns = sheets.map((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const cards = isCollapsed(key) ? [] : sheet.cards || [];
    const rowW = cards.length > 0
      ? cards.length * CARD_W + (cards.length - 1) * CARD_H_GAP
      : 0;
    return { sheet, key, cards, colW: Math.max(SHEET_W, rowW) };
  });

  const totalW =
    columns.reduce((a: number, c: any) => a + c.colW, 0) +
    Math.max(0, columns.length - 1) * H_SPACING;

  const startX = Math.max(100, 2000 - totalW / 2);
  const rootY = 100;
  positions["__root__"] = { x: startX + totalW / 2 - ROOT_W / 2, y: rootY, w: ROOT_W, h: ROOT_H };

  const sheetY = rootY + ROOT_H + V_SPACING;
  let cx = startX;

  columns.forEach(({ key, sheet, cards, colW }: any) => {
    const sh = computeSheetH(sheet, key);
    positions[key] = { x: cx + colW / 2 - SHEET_W / 2, y: sheetY, w: SHEET_W, h: sh };

    if (cards.length > 0) {
      const totalRowW = cards.length * CARD_W + (cards.length - 1) * CARD_H_GAP;
      let cardX = cx + colW / 2 - totalRowW / 2;
      const cardY = sheetY + sh + V_SPACING;
      cards.forEach((card: any) => {
        positions[card._id] = { x: cardX, y: cardY, w: CARD_W, h: cardHeight(card) };
        cardX += CARD_W + CARD_H_GAP;
      });
    }
    cx += colW + H_SPACING;
  });
}

// ── 6. Timeline layout ─────────────────────────────────────────────────────
function runTimelineLayout() {
  const sheets = allSheets.value;
  const SPINE_Y = 1500;
  const START_X = 300;
  const SLOT_W = Math.max(SHEET_W + 80, 320);
  const ABOVE_Y = SPINE_Y - SHEET_H - 100;
  const BELOW_Y = SPINE_Y + 60;

  positions["__root__"] = { x: START_X - ROOT_W - 60, y: SPINE_Y - ROOT_H / 2, w: ROOT_W, h: ROOT_H };

  sheets.forEach((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const sh = computeSheetH(sheet, key);
    const isAbove = i % 2 === 0;
    const slotCX = START_X + i * SLOT_W + SLOT_W / 2;
    const sheetX = slotCX - SHEET_W / 2;
    const sheetY = isAbove ? ABOVE_Y : BELOW_Y;
    positions[key] = { x: sheetX, y: sheetY, w: SHEET_W, h: sh };

    if (isCollapsed(key)) return;
    const cards = sheet.cards || [];
    let cardY = isAbove ? sheetY - 24 : sheetY + sh + 24;
    cards.forEach((card: any) => {
      const ch = cardHeight(card);
      if (isAbove) {
        cardY -= ch;
        positions[card._id] = { x: sheetX, y: cardY, w: CARD_W, h: ch };
        cardY -= V_GAP;
      } else {
        positions[card._id] = { x: sheetX, y: cardY, w: CARD_W, h: ch };
        cardY += ch + V_GAP;
      }
    });
  });
}

// ── 7. Tree Map layout ─────────────────────────────────────────────────────
function runTreeMapLayout() {
  const sheets = allSheets.value;
  const BOX_X = 200, BOX_Y = 300;
  const BOX_W = Math.max(1200, sheets.length * 280);
  const BOX_H = 700;
  console.log(BOX_H);
  
  const PAD = 8;

  positions["__root__"] = {
    x: BOX_X + BOX_W / 2 - ROOT_W / 2,
    y: BOX_Y - ROOT_H - 60,
    w: ROOT_W, h: ROOT_H,
  };
  if (!sheets.length) return;

  const weights = sheets.map((s: any) => Math.max(1, (s.cards || []).length));
  const totalW = weights.reduce((a: number, b: number) => a + b, 0);
  let cx = BOX_X;

  sheets.forEach((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const ratio = weights[i] / totalW;
    const tileW = Math.max(SHEET_W + PAD * 2, BOX_W * ratio);

    positions[key] = { x: cx + PAD, y: BOX_Y + PAD, w: tileW - PAD * 2, h: SHEET_H };

    if (!isCollapsed(key)) {
      const cards = sheet.cards || [];
      const innerW = tileW - PAD * 4;
      const cols = Math.max(1, Math.floor(innerW / (CARD_W + PAD)));
      cards.forEach((card: any, ci: number) => {
        const ch = cardHeight(card);
        const col = ci % cols;
        const row = Math.floor(ci / cols);
        positions[card._id] = {
          x: cx + PAD * 2 + col * (CARD_W + PAD),
          y: BOX_Y + SHEET_H + PAD * 3 + row * (ch + PAD),
          w: CARD_W, h: ch,
        };
      });
    }
    cx += tileW;
  });
}

// ── Edges ─────────────────────────────────────────────────────────────────
interface Edge { id: string; path: string; color: string; dashed: boolean; }

const visibleEdges = computed<Edge[]>(() => {
  const edges: Edge[] = [];
  const root = positions["__root__"];
  if (!root) return edges;
  const dir = layout.value;

  // Fishbone spine
  if (dir === "fishbone") {
    edges.push({
      id: "__spine__",
      path: `M 300 ${root.y + root.h / 2} L ${root.x} ${root.y + root.h / 2}`,
      color: "var(--primary-color)",
      dashed: false,
    });
  }

  // Timeline spine
  if (dir === "timeline") {
    const spineY = root.y + root.h / 2;
    const last = allSheets.value[allSheets.value.length - 1];
    const lastKey = last ? sheetUniqueKey(last, allSheets.value.length - 1) : null;
    const lastP = lastKey ? positions[lastKey] : null;
    const endX = lastP ? lastP.x + lastP.w + 80 : root.x + 1200;
    edges.push({
      id: "__timeline_spine__",
      path: `M ${root.x + root.w} ${spineY} L ${endX} ${spineY}`,
      color: "var(--primary-color)",
      dashed: false,
    });
  }

  allSheets.value.forEach((sheet: any, i: number) => {
    const key = sheetUniqueKey(sheet, i);
    const sp = positions[key];
    if (!sp) return;

    // ── Root → Sheet ─────────────────────────────────────────────────────
    let rootEdgePath = "";
    if (dir === "org-chart") {
      const rx = root.x + root.w / 2, ry = root.y + root.h;
      const midY = ry + (sp.y - ry) / 2;
      const sx = sp.x + sp.w / 2;
      rootEdgePath = `M ${rx} ${ry} L ${rx} ${midY} L ${sx} ${midY} L ${sx} ${sp.y}`;
    } else if (dir === "timeline") {
      const spineY = root.y + root.h / 2;
      const sx = sp.x + sp.w / 2;
      const sy = sp.y > spineY ? sp.y : sp.y + sp.h;
      rootEdgePath = `M ${sx} ${spineY} L ${sx} ${sy}`;
    } else if (dir === "fishbone") {
      const spineY = root.y + root.h / 2;
      rootEdgePath = `M ${sp.x + sp.w / 2 + (sp.x < root.x ? dx : -dx)} ${spineY} L ${sp.x + sp.w / 2} ${sp.y + sp.h / 2}`;
    } else if (dir === "logic-right") {
      const rx = root.x + root.w, ry = root.y + root.h / 2;
      const spineX = root.x + root.w + 60;
      const sy = sp.y + sp.h / 2;
      rootEdgePath = `M ${rx} ${ry} L ${spineX} ${ry} L ${spineX} ${sy} L ${sp.x} ${sy}`;
    } else if (dir === "logic-left") {
      const rx = root.x, ry = root.y + root.h / 2;
      const spineX = root.x - 60;
      const sy = sp.y + sp.h / 2;
      rootEdgePath = `M ${rx} ${ry} L ${spineX} ${ry} L ${spineX} ${sy} L ${sp.x + sp.w} ${sy}`;
    } else if (dir === "radial") {
      const rx = root.x + root.w / 2, ry = root.y + root.h / 2;
      rootEdgePath = `M ${rx} ${ry} L ${sp.x + sp.w / 2} ${sp.y + sp.h / 2}`;
    } else if (dir === "tree-map") {
      const rx = root.x + root.w / 2, ry = root.y + root.h;
      const sx = sp.x + sp.w / 2, sy = sp.y;
      rootEdgePath = `M ${rx} ${ry} L ${sx} ${sy}`;
    } else {
      // Standard curved
      const isVertical = dir === "top" || dir === "bottom";
      if (isVertical) {
        const sheetBelow = sp.y > root.y;
        const rx = root.x + root.w / 2, ry = sheetBelow ? root.y + root.h : root.y;
        const sx = sp.x + sp.w / 2, sy = sheetBelow ? sp.y : sp.y + sp.h;
        const my = (ry + sy) / 2;
        rootEdgePath = `M ${rx} ${ry} C ${rx} ${my}, ${sx} ${my}, ${sx} ${sy}`;
      } else {
        const rootIsLeft = sp.x > root.x;
        const rx = rootIsLeft ? root.x + root.w : root.x, ry = root.y + root.h / 2;
        const sx = rootIsLeft ? sp.x : sp.x + sp.w, sy = sp.y + sp.h / 2;
        const mx = (rx + sx) / 2;
        rootEdgePath = `M ${rx} ${ry} C ${mx} ${ry}, ${mx} ${sy}, ${sx} ${sy}`;
      }
    }

    edges.push({ id: `root-${key}`, path: rootEdgePath, color: "var(--primary-color)", dashed: false });

    // ── Sheet → Cards ────────────────────────────────────────────────────
    if (!isCollapsed(key)) {
      (sheet.cards || []).forEach((card: any) => {
        const cp = positions[card._id];
        if (!cp) return;
        const color = getLaneColor(card);
        let cardEdgePath = "";

        if (dir === "org-chart" || dir === "tree-map") {
          const sx = sp.x + sp.w / 2, sy = sp.y + sp.h;
          const cx2 = cp.x + cp.w / 2, cy2 = cp.y;
          const my = (sy + cy2) / 2;
          cardEdgePath = `M ${sx} ${sy} C ${sx} ${my}, ${cx2} ${my}, ${cx2} ${cy2}`;
        } else if (dir === "timeline") {
          const sx = sp.x + sp.w / 2;
          const isAbove = sp.y < 1500;
          const sy = isAbove ? sp.y : sp.y + sp.h;
          const cy2 = isAbove ? cp.y + cp.h : cp.y;
          cardEdgePath = `M ${sx} ${sy} L ${cp.x + cp.w / 2} ${cy2}`;
        } else if (dir === "fishbone") {
          cardEdgePath = `M ${sp.x + sp.w / 2} ${sp.y + sp.h / 2} L ${cp.x + cp.w / 2} ${cp.y + cp.h / 2}`;
        } else if (dir === "logic-right") {
          const ex1 = sp.x + sp.w, ey1 = sp.y + sp.h / 2;
          const ex2 = cp.x, ey2 = cp.y + cp.h / 2;
          const mx = (ex1 + ex2) / 2;
          cardEdgePath = `M ${ex1} ${ey1} C ${mx} ${ey1}, ${mx} ${ey2}, ${ex2} ${ey2}`;
        } else if (dir === "logic-left") {
          const ex1 = sp.x, ey1 = sp.y + sp.h / 2;
          const ex2 = cp.x + cp.w, ey2 = cp.y + cp.h / 2;
          const mx = (ex1 + ex2) / 2;
          cardEdgePath = `M ${ex1} ${ey1} C ${mx} ${ey1}, ${mx} ${ey2}, ${ex2} ${ey2}`;
        } else if (dir === "radial") {
          cardEdgePath = `M ${sp.x + sp.w / 2} ${sp.y + sp.h / 2} L ${cp.x + cp.w / 2} ${cp.y + cp.h / 2}`;
        } else {
          const isVertical = dir === "top" || dir === "bottom";
          if (isVertical) {
            const cardBelow = cp.y > sp.y;
            const ex1 = sp.x + sp.w / 2, ey1 = cardBelow ? sp.y + sp.h : sp.y;
            const ex2 = cp.x + cp.w / 2, ey2 = cardBelow ? cp.y : cp.y + cp.h;
            const my = (ey1 + ey2) / 2;
            cardEdgePath = `M ${ex1} ${ey1} C ${ex1} ${my}, ${ex2} ${my}, ${ex2} ${ey2}`;
          } else {
            const cardIsLeft = cp.x < sp.x;
            const ex1 = cardIsLeft ? sp.x : sp.x + sp.w, ey1 = sp.y + sp.h / 2;
            const ex2 = cardIsLeft ? cp.x + cp.w : cp.x, ey2 = cp.y + cp.h / 2;
            const mx = (ex1 + ex2) / 2;
            cardEdgePath = `M ${ex1} ${ey1} C ${mx} ${ey1}, ${mx} ${ey2}, ${ex2} ${ey2}`;
          }
        }
        edges.push({ id: `${key}-${card._id}`, path: cardEdgePath, color, dashed: true });
      });
    }
  });

  return edges;
});

// ── dx/dy for fishbone edge helper ────────────────────────────────────────
const dx = Math.cos((45 * Math.PI) / 180) * 180;
const dy = Math.sin((45 * Math.PI) / 180) * 180;
console.log(dy);

// ── Style helpers ─────────────────────────────────────────────────────────
const WRAPPER_STYLE_KEYS = ["background","borderColor","borderWidth","borderRadius","borderStyle","boxShadow","opacity"];
const BODY_STYLE_KEYS = ["color","fontSize","fontWeight","fontFamily","fontStyle","textAlign","padding"];

function pickStyles(source: Record<string, any>, keys: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of keys) { if (source[k] !== undefined && source[k] !== "") out[k] = source[k]; }
  return out;
}
function nodeStyle(sheet: any, idx: number): Record<string, any> {
  const key = sheetUniqueKey(sheet, idx);
  const p = positions[key];
  if (!p) return {};
  const custom = nodeStyles[key] || {};
  return { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, ...pickStyles(custom, WRAPPER_STYLE_KEYS) };
}
function cardNodeStyle(card: any): Record<string, any> {
  const p = positions[card._id];
  if (!p) return {};
  const custom = nodeStyles[card._id] || {};
  return { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, minHeight: `${p.h}px`, ...pickStyles(custom, WRAPPER_STYLE_KEYS) };
}
function cardBodyStyle(card: any): Record<string, any> {
  return pickStyles(nodeStyles[card._id] || {}, BODY_STYLE_KEYS);
}
function sheetBodyStyle(sheet: any, idx: number): Record<string, any> {
  return pickStyles(nodeStyles[sheetUniqueKey(sheet, idx)] || {}, BODY_STYLE_KEYS);
}

// ── Click handlers ────────────────────────────────────────────────────────
function handleSheetClick(sheet: any, idx: number) { selectedNodeId.value = sheetUniqueKey(sheet, idx); }
function handleCardClick(card: any) { selectedNodeId.value = card._id; emit("select:ticket", card); }
function handleCanvasClick(e: MouseEvent) {
  if (ctxSkipNextClick) { ctxSkipNextClick = false; return; }
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement;
    if (!target.closest(".pin-ctx-menu")) closeCtxMenu();
    return;
  }
  if (e.target === viewportEl.value || e.target === canvasEl.value) selectedNodeId.value = null;
}

// ── Wheel / pan / zoom ────────────────────────────────────────────────────
function handleWheel(e: WheelEvent) {
  const vp = viewportEl.value;
  if (!vp) return;
  const rect = vp.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
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
      p.x = (e.clientX - panX.value) / zoom.value - dragOffset.value.x;
      p.y = (e.clientY - panY.value) / zoom.value - dragOffset.value.y;
    }
    return;
  }
  if (!isPanning.value) return;
  panX.value = e.clientX - panStart.value.x;
  panY.value = e.clientY - panStart.value.y;
}
function onMouseUp() { isPanning.value = false; dragId.value = null; }
function handleZoomIn() { const c = getCenter(); zoomAt(c.x, c.y, ZOOM_STEP); }
function handleZoomOut() { const c = getCenter(); zoomAt(c.x, c.y, -ZOOM_STEP); }
function getCenter() {
  const vp = viewportEl.value;
  return vp ? { x: vp.clientWidth / 2, y: vp.clientHeight / 2 } : { x: 400, y: 300 };
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
  panX.value = vp.clientWidth / 2 - ((minX + maxX) / 2) * zoom.value;
  panY.value = vp.clientHeight / 2 - ((minY + maxY) / 2) * zoom.value;
}
function fitToScreen() {
  const vp = viewportEl.value;
  if (!vp) return;
  const vals = Object.values(positions);
  if (!vals.length) return;
  const minX = Math.min(...vals.map((p) => p.x)), maxX = Math.max(...vals.map((p) => p.x + p.w));
  const minY = Math.min(...vals.map((p) => p.y)), maxY = Math.max(...vals.map((p) => p.y + p.h));
  const pad = 60;
  const scaleX = (vp.clientWidth - pad * 2) / (maxX - minX);
  const scaleY = (vp.clientHeight - pad * 2) / (maxY - minY);
  zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));
  panX.value = pad - minX * zoom.value;
  panY.value = pad - minY * zoom.value;
}
function handleResetView() { zoom.value = 0.85; nextTick(() => centerView()); }

function setLayout(dir: Direction) {
  layout.value = dir;
  nextTick(() => { runLayout(); nextTick(centerView); });
}

// ── Navigation (arrow keys) ───────────────────────────────────────────────
function navigateNode(direction: "up" | "down" | "left" | "right") {
  if (!selectedNodeId.value) { selectedNodeId.value = "__root__"; return; }
  const id = selectedNodeId.value;
  if (id === "__root__") {
    if (direction === "right" && allSheets.value.length)
      selectedNodeId.value = sheetUniqueKey(allSheets.value[0], 0);
    return;
  }
  const sheetIdx = allSheets.value.findIndex(
    (_: any, i: number) => sheetUniqueKey(allSheets.value[i], i) === id,
  );
  if (sheetIdx !== -1) {
    if (direction === "left") { selectedNodeId.value = "__root__"; return; }
    if (direction === "up" && sheetIdx > 0) { selectedNodeId.value = sheetUniqueKey(allSheets.value[sheetIdx - 1], sheetIdx - 1); return; }
    if (direction === "down" && sheetIdx < allSheets.value.length - 1) { selectedNodeId.value = sheetUniqueKey(allSheets.value[sheetIdx + 1], sheetIdx + 1); return; }
    if (direction === "right") {
      const cards = allSheets.value[sheetIdx].cards || [];
      if (cards.length && !isCollapsed(id)) { selectedNodeId.value = cards[0]._id; return; }
    }
    return;
  }
  for (const [i, sheet] of allSheets.value.entries()) {
    const cards = sheet.cards || [];
    const cardIdx = cards.findIndex((c: any) => c._id === id);
    if (cardIdx !== -1) {
      if (direction === "left") { selectedNodeId.value = sheetUniqueKey(sheet, i); return; }
      if (direction === "up" && cardIdx > 0) { selectedNodeId.value = cards[cardIdx - 1]._id; return; }
      if (direction === "down" && cardIdx < cards.length - 1) { selectedNodeId.value = cards[cardIdx + 1]._id; return; }
      return;
    }
  }
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
function handleKeyDown(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;

  if (e.key === "Escape") {
    if (creatingForKey.value) { cancelInlineCreate(); return; }
    if (ctxMenu.visible) { closeCtxMenu(); return; }
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    selectedNodeId.value = null; return;
  }
  if (inInput) return;
  if (e.key === "ArrowRight") { e.preventDefault(); navigateNode("right"); return; }
  if (e.key === "ArrowLeft") { e.preventDefault(); navigateNode("left"); return; }
  if (e.key === "ArrowUp") { e.preventDefault(); navigateNode("up"); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); navigateNode("down"); return; }
  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    if (e.key === "c" || e.key === "C") { centerView(); showHint("Center"); return; }
    if (e.key === "f" || e.key === "F") { fitToScreen(); showHint("Fit"); return; }
    if (e.key === "r" || e.key === "R") { handleResetView(); showHint("Reset Zoom"); return; }
    if (e.key === "g" || e.key === "G") { toggleFullscreen(); return; }
    if (e.key === "+") { handleZoomIn(); return; }
    if (e.key === "-") { handleZoomOut(); return; }
  }
  if (e.ctrlKey && (e.key === "=" || e.key === "+")) { e.preventDefault(); handleZoomIn(); return; }
  if (e.ctrlKey && e.key === "-") { e.preventDefault(); handleZoomOut(); return; }

  const sel = selectedNodeId.value;
  if (e.key === " " && sel) {
    e.preventDefault();
    const card = allSheets.value.flatMap((s: any) => s.cards || []).find((c: any) => c._id === sel);
    if (card) emit("select:ticket", card);
    return;
  }
  if (e.key === "Tab" && !e.shiftKey && props.canCreateCard) {
    e.preventDefault();
    if (!sel) return;
    const sIdx = allSheets.value.findIndex((_: any, i: number) => sheetUniqueKey(allSheets.value[i], i) === sel);
    if (sIdx !== -1) startInlineCreate(sel, allSheets.value[sIdx]);
    else {
      for (const [i, s] of allSheets.value.entries()) {
        if ((s.cards || []).some((c: any) => c._id === sel)) { startInlineCreate(sheetUniqueKey(s, i), s); break; }
      }
    }
    return;
  }
  if (e.key === "Enter" && sel && props.canCreateCard) {
    e.preventDefault();
    const sIdx = allSheets.value.findIndex((_: any, i: number) => sheetUniqueKey(allSheets.value[i], i) === sel);
    if (sIdx !== -1) startInlineCreate(sel, allSheets.value[sIdx]);
    else {
      for (const [, sheet] of allSheets.value.entries()) {
        const hit = (sheet.cards || []).find((c: any) => c._id === sel);
        if (hit) { createCardDirectly(sheet._id); break; }
      }
    }
    return;
  }
  if ((e.key === "Delete" || e.key === "Backspace") && sel && props.canDeleteCard) {
    e.preventDefault();
    if (allSheets.value.some((s: any) => (s.cards || []).some((c: any) => c._id === sel)))
      emit("delete:ticket", sel);
    return;
  }
  if (e.ctrlKey && e.key === "d" && !e.altKey && sel) {
    e.preventDefault();
    const card = allSheets.value.flatMap((s: any) => s.cards || []).find((c: any) => c._id === sel);
    if (card) duplicateCard(card);
    return;
  }
  if (e.ctrlKey && e.key === "/" && !e.altKey) {
    e.preventDefault();
    if (sel) {
      const isSheetKey = allSheets.value.some((_: any, i: number) => sheetUniqueKey(allSheets.value[i], i) === sel);
      if (isSheetKey) { toggleCollapse(sel); showHint(isCollapsed(sel) ? "Collapsed" : "Expanded"); }
    }
    return;
  }
  if (e.altKey && e.ctrlKey && e.key === "/") { e.preventDefault(); collapseAll(); return; }
  if (e.altKey && e.ctrlKey && (e.key === "=" || e.key === "+")) { e.preventDefault(); expandAll(); return; }
  if (e.altKey && e.ctrlKey && e.key === "c") { e.preventDefault(); if (sel) copyNodeStyle(sel); return; }
  if (e.altKey && e.ctrlKey && e.key === "v") { e.preventDefault(); if (sel) pasteNodeStyle(sel); return; }
  if (e.altKey && e.ctrlKey && e.key === "0") { e.preventDefault(); if (sel) resetStyleById(sel); return; }
  if (e.ctrlKey && e.key === "a") { e.preventDefault(); selectedNodeId.value = "__root__"; return; }
}

function handleGlobalClick(e: MouseEvent) {
  if (ctxSkipNextClick) { ctxSkipNextClick = false; return; }
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement;
    if (!target.closest(".pin-ctx-menu")) closeCtxMenu();
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  nextTick(() => {
    runLayout();
    nextTick(() => { centerView(); loadSavedTheme(); });
    loadSavedTheme();
  });
});
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("click", handleGlobalClick);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  if (shortcutHintTimer.value) clearTimeout(shortcutHintTimer.value);
});

function patchNewCardPositions(newCardIds: string[], listsData: any[]) {
  const dir = layout.value;
  const isVertical = dir === "top" || dir === "bottom";
  const CARD_H_GAP = 20;

  newCardIds.forEach((cardId) => {
    let foundCard: any = null, foundSheet: any = null, foundSheetIdx = -1;
    for (let i = 0; i < listsData.length; i++) {
      const sheet = listsData[i];
      const card = (sheet.cards || []).find((c: any) => c._id === cardId);
      if (card) { foundCard = card; foundSheet = sheet; foundSheetIdx = i; break; }
    }
    if (!foundCard || !foundSheet) return;

    const sheetKey = sheetUniqueKey(foundSheet, foundSheetIdx);
    const sheetPos = positions[sheetKey];
    if (!sheetPos) return;

    const sh = computeSheetH(foundSheet, sheetKey);
    const allCards = foundSheet.cards || [];
    const cardIndex = allCards.findIndex((c: any) => c._id === cardId);

    if (isVertical) {
      const totalRowW = allCards.length * CARD_W + Math.max(0, allCards.length - 1) * CARD_H_GAP;
      let cx2 = sheetPos.x + sheetPos.w / 2 - totalRowW / 2;
      const cardY = dir === "top"
        ? sheetPos.y - 60 - cardHeight(foundCard)
        : sheetPos.y + sh + 60;
      allCards.forEach((card: any) => {
        const ch = cardHeight(card);
        positions[card._id] = { x: cx2, y: cardY, w: CARD_W, h: ch };
        cx2 += CARD_W + CARD_H_GAP;
      });
    } else {
      const cardX = dir === "left"
        ? sheetPos.x - 80 - CARD_W
        : dir === "right"
        ? sheetPos.x + SHEET_W + 80
        : foundSheetIdx % 2 === 0
        ? sheetPos.x + SHEET_W + 80
        : sheetPos.x - 80 - CARD_W;

      const siblingId = lastCreatedFromCardId.value;
      const siblingPos = siblingId ? positions[siblingId] : null;
      let cy: number;
      if (siblingPos) cy = siblingPos.y + siblingPos.h + V_GAP;
      else if (cardIndex > 0) {
        const prevPos = positions[allCards[cardIndex - 1]._id];
        cy = prevPos ? prevPos.y + prevPos.h + V_GAP : sheetPos.y;
      } else cy = sheetPos.y;

      const ch = cardHeight(foundCard);
      positions[cardId] = { x: cardX, y: cy, w: CARD_W, h: ch };
      for (let i = cardIndex + 1; i < allCards.length; i++) {
        const nextPos = positions[allCards[i]._id];
        const prevPos = positions[allCards[i - 1]._id];
        if (!nextPos || !prevPos) continue;
        const minY = prevPos.y + cardHeight(allCards[i - 1]) + V_GAP;
        if (nextPos.y < minY) nextPos.y = minY;
      }
      lastCreatedFromCardId.value = null;
    }
  });

  const allX = Object.values(positions).map((p) => p.x + p.w);
  const allY = Object.values(positions).map((p) => p.y + p.h);
  svgW.value = Math.max(Math.max(...allX) + 300, 3000);
  svgH.value = Math.max(Math.max(...allY) + 300, 3000);
}

watch(
  () => props.listsData,
  (newVal, oldVal) => {
    if (!newVal || !newVal.length) return;
    const existingPositionIds = new Set(Object.keys(positions));
    const newCardIds = new Set<string>();
    newVal.forEach((sheet: any) => (sheet.cards || []).forEach((card: any) => newCardIds.add(card._id)));
    const oldCardIds = new Set<string>();
    (oldVal || []).forEach((sheet: any) => (sheet.cards || []).forEach((card: any) => oldCardIds.add(card._id)));
    const addedCardIds = [...newCardIds].filter((id) => !oldCardIds.has(id));
    const removedCardIds = [...oldCardIds].filter((id) => !newCardIds.has(id));
    const sheetsUnchanged = (oldVal || []).length === newVal.length;

    if (sheetsUnchanged && removedCardIds.length === 0 && addedCardIds.length > 0) {
      nextTick(() => patchNewCardPositions(addedCardIds, newVal));
      return;
    }
    nextTick(() => {
      runLayout();
      if (existingPositionIds.size === 0) nextTick(centerView);
    });
  },
  { deep: true },
);

watch(
  () => [collapsedIds.value, creatingForKey.value],
  () => nextTick(runLayout),
  { deep: true },
);
</script>

<style scoped>
.pin-mindmap-root {
  background: var(--mm-bg, var(--bg-surface, #dedfe3));
  font-family: "Lato", sans-serif;
  width: 100%;
  height: 100%;
}

.pin-mindmap-root:fullscreen,
.pin-mindmap-root:-webkit-full-screen {
  width: 100vw !important;
  height: 100vh !important;
}

.viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--mm-bg, var(--bg-surface, #dedfe3));
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

/* ── Nodes ─────────────────────────────────────────────────────── */
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
  border-color: var(--primary-color) !important;
  box-shadow:
    0 0 0 2px rgba(125, 104, 200, 0.25),
    0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

/* Root */
.pm-node--root {
  background: var(--primary-color, #f1eeff);
  border-color: var(--primary-color);
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
.root-title {
  font-size: 14px;
  font-weight: 700;
  color:  #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sheet */
.pm-node--sheet {
  background: var(--mm-node-sheet-bg, #ede9fb);
  border-color: var(--color-primary-color);
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
.node-sheet-icon {
  color: var(--primary-color);
  font-size: 12px;
  flex-shrink: 0;
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
  color: var(--mm-text-color, inherit);
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
  color: var(--primary-color);
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
  color: #fff;
  background: var(--primary-color);
  border-color:  var(--primary-color);
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
  color: #fff;
  background: var(--primary-color);
  border-color:  var(--primary-color);
}

/* Inline create */
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
  border: 1.5px solid var(--primary-color);
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
  background: var(--primary-color);
  color: #fff;
}
.inline-btn--ok:hover:not(:disabled) {
  background: var(--primary-color, var(--primary-color));
}
.inline-btn--ok:disabled {
  background:  var(--primary-color);
  cursor: not-allowed;
}
.inline-btn--cancel {
  background: #dedfe3;
  color: #6b6b6e;
}
.inline-btn--cancel:hover {
  background: #d9d9d9;
}

/* Card */
.pm-node--card {
  background: var(--mm-node-card-bg, #fff);
  border-color: var(--primary-color);
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
  overflow: visible;
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
  color: var(--primary-color);
}
.badge--low {
  background: #dcfce7;
  color: #16a34a;
}
.badge--medium {
  background: #fef9c3;
  color: #a16207;
}
.badge--high {
  background: #fee2e2;
  color: #dc2626;
}
.badge--critical {
  background: #2b2c30;
  color: #f5f5f5;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--mm-text-color, inherit);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  margin: 0;
}

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
  color: var(--primary-color);
}
.nact--danger:hover {
  color: #ef4444 !important;
}
.nact--open:hover {
  color: var(--primary-color) !important;
}
.nact--add:hover {
  color: #22c55e !important;
}

/* ── Controls ───────────────────────────────────────────────────── */
.canvas-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  z-index: 100;
  background: var(--mm-node-card-bg, var(--bg-card, #ffffff));
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
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
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

/* ── Shortcut hint ──────────────────────────────────────────────── */
.shortcut-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 20, 60, 0.85);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  z-index: 500;
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(6px);
  letter-spacing: 0.03em;
}
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}

/* ── Context menu ───────────────────────────────────────────────── */
.pin-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 6px;
  min-width: 210px;
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
  color: var(--primary-color);
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
  color: var(--primary-color);
}
.ctx-icon--duplicate {
  color: #0ea5e9;
}
.ctx-icon--format {
  color: var(--primary-color);
}
.ctx-icon--copy-style {
  color: #a855f7;
}
.ctx-icon--paste-style {
  color: #6366f1;
}
.ctx-icon--reset-style {
  color: #94a3b8;
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

/* ── Format sidebar ─────────────────────────────────────────────── */
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

/* ── Sidebar tabs ──────────────────────────────────────────────── */
.fs-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border, #e2e8f0);
  flex-shrink: 0;
  padding: 0 4px;
}
.fs-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 4px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 600;
  color: #6b6b6e;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}
.fs-tab:hover {
  color: #2b2c30;
}
.fs-tab--active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

/* Theme panel */
.theme-panel {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.theme-panel::-webkit-scrollbar {
  width: 5px;
}
.theme-panel::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.bg-color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}
.bg-swatch {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}
.bg-swatch:hover {
  transform: scale(1.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.bg-swatch--active {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color), transparent 60%) !important;
}

.bg-custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 6px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
}
.bg-hex-label {
  font-size: 11px;
  color: #6b6b6e;
  font-family: monospace;
}
.bg-hex-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11px;
  font-family: monospace;
  color: #2b2c30;
  min-width: 0;
}
.bg-opacity-label {
  font-size: 10px;
  color: #6b6b6e;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1px 5px;
}

.bg-recent {
  margin-top: 8px;
}
.bg-recent-label {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  margin-bottom: 6px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}
.theme-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 4px 5px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.theme-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--primary-color), transparent 80%);
}
.theme-card--active {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color), transparent 70%) !important;
}
.theme-preview {
  position: relative;
  width: 100%;
  height: 44px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  padding: 4px;
  overflow: hidden;
}
.tp-center {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 4px;
  z-index: 2;
}
.tp-branches {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-left: auto;
  margin-right: 4px;
  z-index: 2;
}
.tp-branch {
  width: 20px;
  height: 7px;
  border-radius: 3px;
}
.tp-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.theme-name {
  font-size: 9.5px;
  font-weight: 600;
  color: #6b6b6e;
  text-align: center;
}
.theme-check {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 8px;
  color: var(--primary-color, var(--primary-color));
  background: white;
  border-radius: 50%;
  padding: 1px;
}

/* ── Layout grid ──────────────────────────────────────────────── */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}
.layout-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 4px 5px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  overflow: hidden;
}
.layout-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--primary-color), transparent 80%);
}
.layout-card--active {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color), transparent 70%) !important;
}
.layout-preview {
  width: 100%;
  background: var(--bg-surface, #f3f4f6);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 2px;
  overflow: hidden;
}
.layout-preview svg {
  display: block;
}
.layout-name {
  font-size: 9.5px;
  font-weight: 600;
  color: #6b6b6e;
  text-align: center;
  line-height: 1;
}
.layout-check {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 8px;
  color: var(--primary-color);
  background: white;
  border-radius: 50%;
  padding: 1px;
}

.theme-hint {
  padding: 10px 14px 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: #94a3b8;
}

/* Node format panel */
.fs-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.fs-body::-webkit-scrollbar {
  width: 5px;
}
.fs-body::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
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
  color: var(--primary-color);
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
.fs-section {
  padding: 10px 14px;
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
  border-color: var(--primary-color);
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
  border-color: var(--primary-color);
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
  border-color: var(--primary-color);
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
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
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
  border-color: var(--primary-color);
  background: rgba(125, 104, 200, 0.07);
  color: var(--primary-color);
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
  background: var(--primary-color);
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
  background: var(--primary-color);
}
.fs-save-btn:disabled {
  background: color-mix(in srgb, var(--primary-color), transparent 55%);
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

/* ── Transitions ────────────────────────────────────────────────── */
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

/* ── Dark mode ──────────────────────────────────────────────────── */
.pin-mindmap-root[data-dark="true"] .viewport {
  background: var(--bg-body, #2b2c30);
  background-image:
    linear-gradient(var(--border, rgba(255, 255, 255, 0.03)) 1px, transparent 1px),
    linear-gradient(90deg, var(--border, rgba(255, 255, 255, 0.03)) 1px, transparent 1px);
  background-size: 20px 20px;
}
.pin-mindmap-root[data-dark="true"] .pm-node--root {
  background: var(--bg-surface, #2b2c30);
  color: var(--text-primary, var(--text-primary));
}
.pin-mindmap-root[data-dark="true"] .pm-node--sheet {
  background: var(--bg-surface, #2b2c30);
  border-color: var(--border, #3e3e42);
}
.pin-mindmap-root[data-dark="true"] .pm-node--card {
  background: var(--bg-surface, #2b2c30);
  border-color: var(--border, #3e3e42);
}
.pin-mindmap-root[data-dark="true"] .sheet-title {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .sheet-meta {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .card-title {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .card-actions {
  border-color: rgba(255, 255, 255, 0.06);
}
.pin-mindmap-root[data-dark="true"] .collapse-btn {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .collapsed-badge {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .inline-input {
  background: #1e293b;
  color: var(--text-primary);
  border-color: var(--primary-color);
}
.pin-mindmap-root[data-dark="true"] .inline-btn--cancel {
  background: var(--border);
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .add-card-btn {
  color: #fff;
  background: var(--primary-color);
  border-color:  var(--primary-color);
}
.pin-mindmap-root[data-dark="true"] .root-title {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .canvas-controls {
  background: #2b2c30;
  border-color: var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
.pin-mindmap-root[data-dark="true"] .ctrl-btn {
  border-color: var(--border);
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .ctrl-divider {
  background: var(--border);
}
.pin-mindmap-root[data-dark="true"] .zoom-label {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .canvas-stats {
  background: rgba(15, 23, 42, 0.85);
  border-color: var(--border);
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .nact {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .nact:hover {
  background: rgba(147, 86, 197, 0.15);
}
.pin-mindmap-root[data-dark="true"] .badge--type {
  background: rgba(255, 255, 255, 0.07);
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .badge--status {
  background: var(--bg-surface);
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .format-sidebar {
  background: #3e3e42;
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .fs-header {
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .fs-header-left {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .fs-close:hover {
  background: var(--border);
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .fs-tabs {
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .fs-tab {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .fs-tab:hover {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .fs-tab--active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}
.pin-mindmap-root[data-dark="true"] .fs-node-label {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .fs-section {
  border-color: rgba(255, 255, 255, 0.06);
}
.pin-mindmap-root[data-dark="true"] .fs-field label {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .fs-input,
.pin-mindmap-root[data-dark="true"] .fs-select,
.pin-mindmap-root[data-dark="true"] .fs-input-full,
.pin-mindmap-root[data-dark="true"] .color-hex {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .align-btn {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .shadow-btn {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .fs-footer {
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .fs-reset-btn {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
}
.pin-mindmap-root[data-dark="true"] .theme-panel::-webkit-scrollbar-thumb {
  background: var(--border);
}
.pin-mindmap-root[data-dark="true"] .bg-custom-row {
  background: var(--bg-card);
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .bg-hex-input {
  color: var(--text-primary);
}
.pin-mindmap-root[data-dark="true"] .bg-opacity-label {
  background: var(--border);
  border-color: #475569;
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .bg-recent-label {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .theme-card {
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .theme-name {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .theme-check {
  background: #1e293b;
}
.pin-mindmap-root[data-dark="true"] .fs-section-label {
  color: #64748b;
}
.pin-mindmap-root[data-dark="true"] .theme-hint {
  color: #64748b;
}
.pin-mindmap-root[data-dark="true"] .fs-node-name {
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .layout-card {
  border-color: var(--border);
}
.pin-mindmap-root[data-dark="true"] .layout-preview {
  background: var(--bg-card);
}
.pin-mindmap-root[data-dark="true"] .layout-name {
  color: var(--text-secondary);
}
.pin-mindmap-root[data-dark="true"] .layout-check {
  background: #1e293b;
  color: var(--primary-color);
}
</style>