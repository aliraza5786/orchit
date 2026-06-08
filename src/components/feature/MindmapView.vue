<template>
  <div
    class="relative w-full h-full flex rounded-[6px] my-2 overflow-hidden mindmap-root"
    ref="rootEl"
    :data-dark="isDark ? 'true' : 'false'"
  >
    <div
      class="viewport flex-1 relative overflow-hidden"
      ref="viewportEl"
      @wheel.prevent="handleWheel"
      @mousedown="handleViewportMouseDown"
      @contextmenu.prevent="handleViewportContextMenu"
      @click="handleCanvasClick"
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
        <div v-if="allNodes.length === 0" class="canvas-placeholder">
          <i
            class="fa-solid fa-diagram-project fa-3x mb-3"
            style="color: #94a3b8"
          ></i>
          <h5 style="color: #64748b">No data to display</h5>
          <p style="color: #94a3b8; font-size: 13px">
            Add sheets and cards to see your mindmap
          </p>
        </div>
         <!-- ✦ Drag ghost indicator -->
        <div v-if="dragGhostStyle" class="drag-ghost" :style="dragGhostStyle">
          <i class="fa-solid fa-grip-vertical"></i>
          {{ draggingCard?.topic?.slice(0, 20) }}...
        </div>
        <svg
          class="connections-svg"
          :style="{ width: svgW + 'px', height: svgH + 'px' }"
          :viewBox="`0 0 ${svgW} ${svgH}`"
        >
          <defs></defs>
          <g v-for="e in visibleEdges" :key="e.id">
            <path
              :d="e.path"
              stroke="transparent"
              stroke-width="10"
              fill="none"
            />
            <path
              :d="e.path"
              :stroke="e.color || 'var(--primary-color)'"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              :stroke-dasharray="e.dashed ? '5 4' : 'none'"
              class="edge-path"
            />
          </g>
        </svg>
          <div
  v-for="node in allNodes"
  :key="node.id"
  class="mm-node-group"
  :style="nodeGroupStyle(node)"
  @mouseenter="hoveredNodeId = node.id"
  @mouseleave="hoveredNodeId = null"
>
  <!-- Collapse / expand toggle – shown only on hover -->
  <button
    v-if="
      (node.uniqueName === 'sheet' || node.uniqueName === 'List') &&
      node.children &&
      node.children.length > 0
    "
    class="collapse-toggle"
    :class="[
      { 'collapse-toggle--collapsed': isCollapsed(node.id) },
      { 'collapse-toggle--visible': hoveredNodeId === node.id },
    ]"
    :style="collapseToggleLocalStyle(node)"
    @click.stop="toggleCollapse(node.id)"
    :title="isCollapsed(node.id) ? 'Expand' : 'Collapse'"
  >
    <i :class="isCollapsed(node.id) ? 'fa-solid fa-plus' : 'fa-solid fa-minus'"></i>
  </button>

  <!-- The actual node card -->
  <div
    class="mm-node"
    :class="[
      `mm-node--${node.uniqueName}`,
      { 'mm-node--selected': selectedNodeId === node.id },
      { 'mm-node--multi-selected': selectedNodeIds.has(node.id) },
    ]"
    :style="nodeInlineStyle(node)"
    @mousedown.stop="handleNodeMouseDown($event, node.id)"
    @click.stop="handleNodeClick($event, node.id)"
    @contextmenu.stop.prevent="handleNodeContextMenu($event, node)"
    :draggable="node.uniqueName === 'card'"
    @dragstart.stop="handleCardDragStart($event, node)"
    @dragend.stop="handleCardDragEnd"
  >
    <!-- ROOT -->
    <template v-if="node.uniqueName === 'root'">
      <div class="node-root-inner">
        <img :src="localWorkspace.logo ?? dp" class="w-10 h-10 rounded-full" alt="logo" />
        <span class="node-root-title">{{ node.topic }}</span>
      </div>
    </template>

    <!-- SHEET -->
    <template v-else-if="node.uniqueName === 'sheet'">
      <div class="node-sheet-inner">
       <div class="node-sheet-header">
    <i class="fa-solid fa-table-columns node-sheet-icon"></i>
    <span class="node-sheet-title">
      {{ getNodeTitle(node?.topic) }}
    </span>
  </div>
        <div class="node-sheet-meta" v-if="node.children && !isCollapsed(node.id)">
          <span class="meta-pill">
            <i class="fa-solid fa-list me-1"></i>{{ node.children.length }} lists
          </span>
        </div>
        <div v-if="isCollapsed(node.id) && node.children?.length" class="node-collapsed-badge">
          <i class="fa-solid fa-layer-group me-1"></i>{{ node.children.length }} hidden
        </div>
        <a v-if="node.hyperLink" :href="node.hyperLink" target="_blank" class="node-link" @click.stop>
          <i class="fa-solid fa-link"></i>
        </a>
      </div>
    </template>

    <!-- LIST -->
    <template v-else-if="node.uniqueName === 'List'">
      <div
          class="node-list-inner"
          :class="{ 'node-list--drag-over': dragOverListId === node.id }"
          @dragover.prevent="handleListDragOver($event, node)"
          @dragleave="handleListDragLeave(node)"
          @drop.prevent="handleCardDrop($event, node)"
        >
        <div class="node-list-header">
          <div class="node-list-dot"></div>
          <span class="node-list-title">{{ node.topic }}</span>
        </div>
        <div class="node-list-count" v-if="node.children && !isCollapsed(node.id)">
          {{ node.children.length }} card{{ node.children.length !== 1 ? "s" : "" }}
        </div>
        <div v-if="isCollapsed(node.id) && node.children?.length" class="node-collapsed-badge">
          <i class="fa-solid fa-layer-group me-1"></i>{{ node.children.length }} hidden
        </div>
        <div v-if="creatingCardForListId === node.id" class="inline-create-card" @click.stop @mousedown.stop>
          <input
            v-model="newCardTitle"
            class="inline-card-input"
            placeholder="Card title…"
            @keydown.enter.prevent="submitInlineCard"
            @keydown.escape.prevent="cancelInlineCreation"
            @blur="() => { if (!newCardTitle.trim()) cancelInlineCreation(); }"
            autofocus
          />
          <div class="inline-card-actions">
            <button class="inline-btn inline-btn--confirm" :disabled="!newCardTitle.trim() || isCreatingCard" @click.stop="submitInlineCard(node?.topic)">
              <i v-if="isCreatingCard" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-check"></i>
            </button>
            <button class="inline-btn inline-btn--cancel" @click.stop="cancelInlineCreation">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        <button
          v-if="canCreateCard && !asTalent && creatingCardForListId !== node.id"
          class="list-add-card-btn"
          @click.stop="startInlineCardCreation(node)"
          title="Add card (Enter)"
        >
          <i class="fa-solid fa-plus"></i> Add card
        </button>
      </div>
    </template>

    <!-- CARD -->
    <template v-else-if="node.uniqueName === 'card'">
      <div class="node-card-wrapper">
        <div
          class="node-card-stripe"
          :style="{
            background:
              node.variables?.lane?.variables?.['lane-color'] ||
              node.style?.borderColor ||
              node.style?.color ||
              'var(--primary-color)',
          }"
        ></div>
        <div class="node-card-body">
          <div class="node-card-badges">
            <span v-if="node.variables?.['card-type']" class="card-badge card-badge--type">
              {{ node.variables["card-type"] || "General" }}
            </span>
            <span v-if="node.variables?.['card-status']" class="card-badge card-badge--status">
              {{ node.variables["card-status"] }}
            </span>
            <span v-if="node.variables?.priority" class="card-badge" :class="`card-badge--${node.variables.priority}`">
              <i class="fa-solid fa-flag" style="font-size: 8px"></i>
              {{ node.variables.priority }}
            </span>
          </div>
          <div class="node-card-title-block">
            <span class="node-card-title">
              {{ node.topic?.length > 30 ? node.topic.slice(0, 30) + '...' : node.topic }}
            </span>
          </div>
          <div class="node-card-actions-row" @click.stop @mousedown.stop>
            <button v-if="canCreateCard && !asTalent" class="nact nact--add" @click.stop="node.parent && createCardDirectly(node.parent, node)" title="Add sibling card">
              <i class="fa-solid fa-plus"></i>
            </button>
            <button v-if="canAssignCard && canEditCard && !asTalent" class="nact" @click.stop="openFormatSidebar(node.id)" title="Format">
              <i class="fa-solid fa-palette"></i>
            </button>
            <button class="nact nact--open" @click.stop="handleOpenNode(node)" title="Open card">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
            <button v-if="canDeleteCard" class="nact nact--danger" @click.stop="openDeleteModal(node)" title="Delete">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div><!-- end .mm-node -->
</div><!-- end .mm-node-group loop -->
        
      </div>

      <!-- ✦ controls panel -->
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
                ? 'fa-light fa-arrows-minimize'
                : 'fa-light fa-arrows-maximize'
            "
          ></i>
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
          title="Format sidebar"
        >
          <i class="fa-solid fa-sliders"></i>
        </button>
        <button
          v-if="selectedNodeIds.size > 1"
          class="ctrl-btn ctrl-btn--multi"
          @click="showMultiFormatPanel = !showMultiFormatPanel"
          :title="`Format ${selectedNodeIds.size} selected cards`"
        >
          <i class="fa-solid fa-object-group"></i>
          <span class="multi-count">{{ selectedNodeIds.size }}</span>
        </button>
        
      </div>

      <div class="canvas-stats">
        <span
          ><i class="fa-solid fa-circle-nodes me-1"></i
          >{{ allNodes.length }}</span
        >
        <span
          ><i class="fa-solid fa-bezier-curve me-1"></i
          >{{ visibleEdges.length }}</span
        >
      </div>
    </div>
    <!-- ✦ Shortcut hint toast -->
    <transition name="hint-fade">
      <div v-if="showShortcutHint" class="shortcut-hint">
        {{ lastShortcutLabel }}
      </div>
    </transition>

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
              style="color: var(--primary-color, #6e3b96)"
            ></i>
            <span>{{ selectedNodeId ? "Format Node" : "Map Theme" }}</span>
          </div>
          <button class="fs-close" @click="showFormatSidebar = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div v-if="!selectedNodeId" class="theme-panel">
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
              <i
                class="fa-solid fa-table-cells-large"
                style="font-size: 11px"
              ></i>
              Layout
            </button>
          </div>

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
                <div
                  class="color-swatch"
                  :style="{ background: customBgColor }"
                >
                  <input
                    type="color"
                    :value="customBgColor"
                    @input="
                      applyCustomBg(($event.target as HTMLInputElement).value)
                    "
                  />
                </div>
                <span class="bg-hex-label">#</span>
                <input
                  class="bg-hex-input"
                  :value="customBgColor.replace('#', '')"
                  maxlength="6"
                  placeholder="dedfe3"
                  @change="
                    applyCustomBg(
                      '#' + ($event.target as HTMLInputElement).value,
                    )
                  "
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
                      :style="{
                        background: theme.nodeColors.root,
                        color: theme.textColor,
                      }"
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
                        :style="{ background: theme.nodeColors.sheet }"
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
          </template>

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
                  :class="{ 'layout-card--active': layoutDirection === lv.id }"
                  :title="lv.name"
                  @click="setLayout(lv.id as LayoutDirection)"
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
                    v-if="layoutDirection === lv.id"
                    class="fa-solid fa-check layout-check"
                  ></i>
                </button>
              </div>
            </div>

            <div class="theme-hint">
              <i
                class="fa-solid fa-circle-info me-1"
                style="color: #94a3b8"
              ></i>
              <span>Click a layout to reorganise the map</span>
            </div>
          </template>
        </div>
        <div v-else class="fs-body">
          <div class="fs-node-name">
            <i
              class="fa-solid fa-circle-dot fs-node-icon"
              :class="`fs-icon--${selectedNode?.uniqueName}`"
            ></i>
            <span class="fs-node-label">{{
              selectedNode?.topic || "Node"
            }}</span>
            <span class="fs-node-type">{{ selectedNode?.uniqueName }}</span>
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

          <div class="fs-section space-y-2">
            <div class="fs-section-label">Colors</div>
            <div class="">
              <div class="fs-field mt-1">
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
              <div class="fs-field mt-1">
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

          <div class="fs-section space-y-2">
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
                  <option value="'Work Sans', sans-serif">Work Sans</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option
                    value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  >
                    System UI
                  </option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option
                    value="'Helvetica Neue', Helvetica, Arial, sans-serif"
                  >
                    Helvetica
                  </option>
                  <option value="'Times New Roman', serif">
                    Times New Roman
                  </option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="'Playfair Display', serif">
                    Playfair Display
                  </option>
                  <option value="'Merriweather', serif">Merriweather</option>
                  <option value="'Raleway', sans-serif">Raleway</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
                  <option value="'Ubuntu', sans-serif">Ubuntu</option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="'Dancing Script', cursive">
                    Dancing Script
                  </option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
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
                    'align-btn--active':
                      (activeFormatStyle as any).textAlign === align,
                  }"
                  @click="onStyleChangeDirect('text_align', align)"
                >
                  <i :class="`fa-solid fa-align-${align}`"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="fs-section space-y-2">
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
                :value="(activeFormatStyle as any).borderStyle || 'solid'"
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
                        ((activeFormatStyle as any).opacity ?? 1) * 100,
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
                  'shadow-btn--active':
                    (activeFormatStyle as any).boxShadow === s.value,
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
      </div>
    </transition>
    <!-- ✦ Multi-select format panel -->
    <transition name="slide-sidebar">
      <div v-if="showMultiFormatPanel && selectedNodeIds.size > 1" class="multi-format-panel">
        <div class="fs-header">
          <div class="fs-header-left">
            <i class="fa-solid fa-object-group" style="color: var(--primary-color)"></i>
            <span>{{ selectedNodeIds.size }} Cards Selected</span>
          </div>
          <button class="fs-close" @click="showMultiFormatPanel = false; clearMultiSelect()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="fs-body">
          <div class="fs-section">
            <div class="fs-section-label">Quick Presets</div>
            <div class="fs-presets">
              <button
                v-for="p in colorPresets"
                :key="p.bg"
                class="preset-swatch"
                :style="{ background: p.bg, borderColor: p.border }"
                :title="p.name"
                @click="applyMultiPreset(p)"
              ></button>
            </div>
          </div>
          <div class="fs-section space-y-2">
            <div class="fs-section-label">Colors</div>
            <div class="fs-field mt-1">
              <label>Background</label>
              <div class="color-row">
                <div class="color-swatch" :style="{ background: multiStyle.background || '#fff' }">
                  <input type="color" :value="multiStyle.background || '#ffffff'" @input="onMultiStyleChange('bg_color', $event)" />
                </div>
                <input class="color-hex" :value="multiStyle.background || ''" placeholder="#ffffff" readonly />
              </div>
            </div>
            <div class="fs-field mt-1">
              <label>Border Color</label>
              <div class="color-row">
                <div class="color-swatch" :style="{ background: multiStyle.borderColor || '#d9d9d9' }">
                  <input type="color" :value="multiStyle.borderColor || '#d9d9d9'" @input="onMultiStyleChange('border_color', $event)" />
                </div>
                <input class="color-hex" :value="multiStyle.borderColor || ''" placeholder="#d9d9d9" readonly />
              </div>
            </div>
          </div>
          <div class="fs-section space-y-2">
            <div class="fs-section-label">Typography</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Font Size</label>
                <div class="input-with-unit">
                  <input type="number" min="8" max="32" step="1" :value="parsePx(multiStyle.fontSize) || 13" @input="onMultiStyleChange('font_size', $event)" class="fs-input" />
                  <span class="unit">px</span>
                </div>
              </div>
              <div class="fs-field">
                <label>Weight</label>
                <select class="fs-select" :value="multiStyle.fontWeight || 'normal'" @change="onMultiStyleChange('font_weight', $event)">
                  <option value="300">Light</option>
                  <option value="normal">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
          </div>
          <div class="fs-section">
            <div class="fs-section-label">Shadow</div>
            <div class="shadow-presets">
              <button v-for="s in shadowPresets" :key="s.label" class="shadow-btn"
                :class="{ 'shadow-btn--active': (multiStyle as any).boxShadow === s.value }"
                :style="{ boxShadow: s.value || 'none' }"
                @click="onMultiStyleChangeDirect('box_shadow', s.value)">
                {{ s.label }}
              </button>
            </div>
          </div>
          <div class="fs-section" style="border:none;padding-bottom:0">
            <button class="fs-reset-btn" @click="resetMultiStyle">
              <i class="fa-solid fa-rotate me-1"></i> Reset all to default
            </button>
          </div>
        </div>
        <div class="fs-footer">
          <button class="fs-save-btn" :disabled="isSavingNodeStyle" @click="saveMultiStyle">
            <span v-if="isSavingNodeStyle" class="spinner"></span>
            <i v-else class="fa-solid fa-floppy-disk me-1"></i>
            {{ isSavingNodeStyle ? "Saving..." : `Save ${selectedNodeIds.size} Cards` }}
          </button>
        </div>
      </div>
    </transition>
    <!-- ✦ Search Spotlight -->
<transition name="search-drop">
  <div v-if="showSearch" class="search-overlay" @click.self="closeSearch">
    <div class="search-panel">
      <div class="search-header">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          class="search-input"
          placeholder="Search nodes, cards, lists…"
          @keydown.escape="closeSearch"
          @keydown.enter="searchResults[0] && jumpToNode(searchResults[0])"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="search-count" v-if="searchQuery">
          {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
        </span>
        <button class="search-close-btn" @click="closeSearch">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="search-results" v-if="searchResults.length">
        <button
          v-for="(node, i) in searchResults.slice(0, 12)"
          :key="node.id"
          class="search-result-item"
          @click="jumpToNode(node)"
        >
          <i
            class="search-result-icon"
            :class="{
              'fa-solid fa-circle-nodes': node.uniqueName === 'root',
              'fa-solid fa-table-columns': node.uniqueName === 'sheet',
              'fa-solid fa-list': node.uniqueName === 'List',
              'fa-solid fa-square-check': node.uniqueName === 'card',
            }"
          ></i>
          <div class="search-result-text">
            <span class="search-result-topic">{{ node.topic }}</span>
            <span class="search-result-type">{{ node.uniqueName }}</span>
          </div>
          <span v-if="i === 0" class="search-result-enter">
            <kbd>↵</kbd>
          </span>
        </button>
      </div>
      <div class="search-empty" v-else-if="searchQuery">
        <i class="fa-solid fa-ghost" style="color:#94a3b8;font-size:20px"></i>
        <span>No nodes match "{{ searchQuery }}"</span>
      </div>
      <div class="search-footer">
        <span><kbd>↵</kbd> Jump</span>
        <span><kbd>Esc</kbd> Close</span>
        <span><kbd>Ctrl K</kbd> Toggle</span>
      </div>
    </div>
  </div>
</transition>
<!-- ✦ Export Menu -->
<transition name="fade">
  <div v-if="showExportMenu" class="export-menu" @click.stop>
    <div class="export-menu-header">
      <i class="fa-solid fa-file-export" style="color:var(--primary-color)"></i>
      <span>Export Mindmap</span>
      <button class="fs-close" @click="showExportMenu = false">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <button class="export-item" @click="exportPNG" :disabled="isExporting">
      <div class="export-item-icon export-item-icon--png">
        <i class="fa-solid fa-image"></i>
      </div>
      <div class="export-item-info">
        <span class="export-item-name">PNG Image</span>
        <span class="export-item-desc">Transparent background, lossless</span>
      </div>
      <i v-if="isExporting" class="fa-solid fa-spinner fa-spin" style="color:var(--primary-color)"></i>
    </button>

    <button class="export-item" @click="exportJPEG" :disabled="isExporting">
      <div class="export-item-icon export-item-icon--jpg">
        <i class="fa-solid fa-file-image"></i>
      </div>
      <div class="export-item-info">
        <span class="export-item-name">JPEG / JPG</span>
        <span class="export-item-desc">Smaller file, white background</span>
      </div>
      <i v-if="isExporting" class="fa-solid fa-spinner fa-spin" style="color:var(--primary-color)"></i>
    </button>

    <button class="export-item" @click="exportPDF" :disabled="isExporting">
      <div class="export-item-icon export-item-icon--pdf">
        <i class="fa-solid fa-file-pdf"></i>
      </div>
      <div class="export-item-info">
        <span class="export-item-name">PDF Document</span>
        <span class="export-item-desc">Custom page size, print-ready</span>
      </div>
      <i v-if="isExporting" class="fa-solid fa-spinner fa-spin" style="color:var(--primary-color)"></i>
    </button>

    <button class="export-item" @click="exportSVG">
      <div class="export-item-icon export-item-icon--svg">
        <i class="fa-solid fa-bezier-curve"></i>
      </div>
      <div class="export-item-info">
        <span class="export-item-name">SVG Vector</span>
        <span class="export-item-desc">Scalable, editable graphic</span>
      </div>
    </button>

    <button class="export-item" @click="exportJSON">
      <div class="export-item-icon export-item-icon--json">
        <i class="fa-solid fa-code"></i>
      </div>
      <div class="export-item-info">
        <span class="export-item-name">JSON Data</span>
        <span class="export-item-desc">Full tree structure &amp; styles</span>
      </div>
    </button>
  </div>
</transition>

<!-- ✦ Shortcuts Panel -->
<transition name="slide-sidebar">
  <div v-if="showShortcutsPanel" class="shortcuts-panel" @click.stop>
    <div class="sp-header flex justify-between">
      <div class="flex gap-2 justify-center items-center">
        <i class="fa-solid fa-keyboard" style="color:var(--primary-color)"></i>
      <span>Keyboard Shortcuts</span>
      </div>
      <button class="fs-close" @click="showShortcutsPanel = false">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="sp-body">
      <div class="sp-group">
        <div class="sp-group-label">Navigation</div>
        <div class="sp-row"><kbd>Arrow Keys</kbd><span>Navigate nodes</span></div>
        <div class="sp-row"><kbd>F</kbd><span>Fit to screen</span></div>
        <div class="sp-row"><kbd>C</kbd><span>Center view</span></div>
        <div class="sp-row"><kbd>R</kbd><span>Reset zoom</span></div>
        <div class="sp-row"><kbd>G</kbd><span>Toggle fullscreen</span></div>
        <div class="sp-row"><kbd>+ / -</kbd><span>Zoom in / out</span></div>
        <div class="sp-row"><kbd>Scroll</kbd><span>Pan canvas</span></div>
        <div class="sp-row"><kbd>Ctrl + Scroll</kbd><span>Zoom</span></div>
        <div class="sp-row"><kbd>Right Click Drag</kbd><span>Pan canvas</span></div>
      </div>
      <div class="sp-group">
        <div class="sp-group-label">Cards</div>
        <div class="sp-row"><kbd>Enter</kbd><span>Add card below</span></div>
        <div class="sp-row"><kbd>Tab</kbd><span>Add card to list</span></div>
        <div class="sp-row"><kbd>Space</kbd><span>Open selected card</span></div>
        <div class="sp-row"><kbd>Del / Bksp</kbd><span>Delete card</span></div>
        <div class="sp-row"><kbd>Ctrl+D</kbd><span>Duplicate card</span></div>
        <div class="sp-row"><kbd>Ctrl+A</kbd><span>Select all cards</span></div>
        <div class="sp-row"><kbd>Shift+Click</kbd><span>Multi-select</span></div>
      </div>
      <div class="sp-group">
        <div class="sp-group-label">Style</div>
        <div class="sp-row"><kbd>Alt+Ctrl+C</kbd><span>Copy style</span></div>
        <div class="sp-row"><kbd>Alt+Ctrl+V</kbd><span>Paste style</span></div>
        <div class="sp-row"><kbd>Alt+Ctrl+0</kbd><span>Reset style</span></div>
      </div>
      <div class="sp-group">
        <div class="sp-group-label">View & History</div>
        <div class="sp-row"><kbd>Ctrl+K</kbd><span>Search / Spotlight</span></div>
        <div class="sp-row"><kbd>Ctrl+Z</kbd><span>Undo</span></div>
        <div class="sp-row"><kbd>Ctrl+Y</kbd><span>Redo</span></div>
        <div class="sp-row"><kbd>Ctrl+/</kbd><span>Collapse/Expand node</span></div>
        <div class="sp-row"><kbd>Alt+Ctrl+/</kbd><span>Collapse all</span></div>
        <div class="sp-row"><kbd>Alt+Ctrl+=</kbd><span>Expand all</span></div>
        <div class="sp-row"><kbd>H / ?</kbd><span>This shortcuts panel</span></div>
        <div class="sp-row"><kbd>Esc</kbd><span>Deselect / Close</span></div>
      </div>
    </div>
  </div>
</transition>

<div class="mm-toolbar " :class="{ 'mm-toolbar--sidebar-open': showFormatSidebar || showMultiFormatPanel }">
  <button
    class="ctrl-btn"
    :class="{ 'ctrl-btn--disabled': undoStack.length === 0 }"
    @click="undo"
    :title="`Undo (Ctrl+Z) — ${undoStack.length} steps`"
    :disabled="undoStack.length === 0"
  >
    <i class="fa-solid fa-rotate-left"></i>
  </button>
  <div class="mm-tool-divider"></div>
  <button
    class="ctrl-btn"
    :class="{ 'ctrl-btn--disabled': redoStack.length === 0 }"
    @click="redo"
    :title="`Redo (Ctrl+Y) — ${redoStack.length} steps`"
    :disabled="redoStack.length === 0"
  >
    <i class="fa-solid fa-rotate-right"></i>
  </button>
  <div class="mm-tool-divider"></div>
  <button class="mm-tool-btn" @click="openSearch" title="Search (Ctrl+K)">
    <i class="fa-solid fa-magnifying-glass"></i>
  </button>
  <div class="mm-tool-divider"></div>
  <div class="mm-tool-export-wrap">
    <button
      class="mm-tool-btn"
      :class="{ 'mm-tool-btn--active': showExportMenu }"
      @click.stop="showExportMenu = !showExportMenu; showShortcutsPanel = false"
      title="Export"
    >
      <i class="fa-solid fa-file-export"></i>
    </button>
  </div>
  <div class="mm-tool-divider"></div>
  <button
    class="mm-tool-btn"
    :class="{ 'mm-tool-btn--active': showShortcutsPanel }"
    @click="showShortcutsPanel = !showShortcutsPanel; showExportMenu = false"
    title="Shortcuts (H)"
  >
    <i class="fa-solid fa-keyboard"></i>
  </button>
</div>
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="ctxMenu.visible"
          class="card-ctx-menu"
          :class="{ 'card-ctx-menu--dark': isDark }"
          :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }"
          @click.stop
          @mousedown.stop
        >
          <div class="ctx-header">
            <i class="fa-solid fa-square-check ctx-header-icon"></i>
            <span class="ctx-header-title">{{ ctxMenuNode?.topic }}</span>
          </div>

          <button
            v-if="canCreateCard && !asTalent"
            class="ctx-item bg-primary-color"
            @click="ctxAddCard"
          >
            <i class="fa-solid fa-plus ctx-item-icon ctx-icon--add"></i>
            <span>Add card below</span>
            <kbd class="ctx-kbd">Enter</kbd>
          </button>

          <button
            v-if="canCreateCard && !asTalent"
            class="ctx-item"
            @click="ctxAddChildCard"
          >
            <i
              class="fa-solid fa-arrow-turn-down-right ctx-item-icon ctx-icon--add"
            ></i>
            <span>Add child card</span>
            <kbd class="ctx-kbd">Tab</kbd>
          </button>

          <button class="ctx-item" @click="ctxOpenCard">
            <i
              class="fa-solid fa-arrow-up-right-from-square ctx-item-icon ctx-icon--open"
            ></i>
            <span>Open card</span>
            <kbd class="ctx-kbd">Space</kbd>
          </button>

          <button v-if="canCreateCard" class="ctx-item" @click="ctxDuplicate">
            <i class="fa-solid fa-clone ctx-item-icon ctx-icon--duplicate"></i>
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
            @click="ctxDeleteCard"
          >
            <i class="fa-solid fa-trash-can ctx-item-icon"></i>
            <span>Delete card</span>
            <kbd class="ctx-kbd">Del</kbd>
          </button>
        </div>
      </transition>
    </Teleport>

    <div v-if="activeAddList" class="add-list-panel" @click.stop>
      <input
        autofocus
        v-model="newColumnLocal"
        placeholder="Add New list"
        @keyup.enter="emitAddColumn"
        class="add-list-input"
      />
      <p style="font-size: 11px; margin-top: 6px; color: #6b6b6e">
        You can add details while editing
      </p>
      <div
        style="display: flex; align-items: center; gap: 12px; margin-top: 10px"
      >
        <button @click="emitAddColumn" class="add-list-btn">
          {{ addingList ? "Adding..." : "Add list" }}
        </button>
        <i
          class="fa-solid fa-close"
          style="cursor: pointer; color: #6b6b6e"
          @click="emit('toggle-add-list')"
        ></i>
      </div>
    </div>
  </div>

  <div
    v-if="showHyperlinkModal && canAssignCard && canEditCard && canCreateCard"
    class="modal-backdrop"
  >
    <div class="modal-card">
      <h3 class="modal-title">Insert Web Link</h3>
      <input
        v-model="hyperlink"
        type="text"
        placeholder="Enter or paste a URL"
        class="modal-input"
      />
      <div class="modal-footer">
        <button @click="cancelHyperlink" class="modal-btn-cancel">
          Cancel
        </button>
        <button
          :disabled="!hyperlink"
          @click="confirmHyperlink"
          class="modal-btn-confirm"
          :class="{ disabled: !hyperlink }"
        >
          Insert
        </button>
      </div>
    </div>
  </div>
  <ConfirmDeleteModal
    v-model="showTicketDelete"
    title="Delete Ticket"
    itemLabel="Ticket"
    :itemName="ticketToDelete?.title"
    :requireMatchText="ticketToDelete?.title"
    confirmText="Delete Ticket"
    cancelText="Cancel"
    size="md"
    @confirm="handleDeleteTicket"
    @cancel="
      () => {
        showTicketDelete = false;
        ticketToDelete = null;
      }
    "
  />
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  toRaw,
  watchEffect,
  nextTick,
  onMounted,
  onBeforeUnmount,
  reactive,
} from "vue";
import { toast } from "vue-sonner";
import { useTheme } from "../../composables/useTheme";
import { useRoute } from "vue-router";
import ConfirmDeleteModal from "../../views/Product/modals/ConfirmDeleteModal.vue";
import { useWorkspaceStore } from "../../stores/workspace";
import dp from "../../assets/global/dummy.jpeg";
import { useThemeStore } from "../../stores/theme";
import { ReOrderCard} from "../../queries/useSheets.ts"
const props = defineProps<{
  listsData: any[];
  style?: object;
  selectedSheetId: string;
  selectedViewBy: string;
  workspaceId: string;
  selectedSheetTitle?: string;
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
  asTalent?: boolean;
  sheetId?: string;
  talentType?: string;
}>();

const emit = defineEmits<{
  (e: "select:ticket", card: any): void;
  (e: "delete:ticket", cardId: string): void;
  (
    e: "create:sheet",
    payload: {
      variables: Record<string, string>;
      workspace_id: string;
      workspace_module_id: string;
      is_ai_generated: boolean;
    },
  ): void;
  (e: "create:card", payload: any): void;
  (e: "update:card", payload: any): void;
  (e: "update:sheet", payload: any): void;
  (e: "reorder:card", payload: any): void;
  (e: "toggle-add-list"): void;
  (e: "add-column", value: string): void;
}>();

const { isDark } = useTheme();
const route = useRoute();
const themeStore = useThemeStore();
interface NodeStyle {
  background?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  textAlign?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  borderStyle?: string;
  padding?: string;
  opacity?: number;
  boxShadow?: string;
  hyperLink?: string;
}

interface MindNode {
  id: string;
  real_id?: string;
  sheet_id: string;
  seat_id?: string;
  listId?: string;
  topic: string;
  style: NodeStyle;
  _originalStyle: Record<string, any>;
  children: MindNode[];
  parent?: MindNode;
  isRoot?: boolean;
  uniqueName: "root" | "sheet" | "List" | "card";
  variables?: any;
  hyperLink?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
}

interface Edge {
  id: string;
  path: string;
  level: number;
  color: string;
  dashed: boolean;
}
const reOrderCard = ReOrderCard();
const nodeStore = reactive<Record<string, MindNode>>({});
const rootNodeId = ref<string>("");
// ✦ FIX: Separate collapse tracking from layout trigger
// collapseVersion only updates allNodes/visibleEdges (not watchEffect layout)
const collapseVersion = ref(0);
const hoveredNodeId = ref<string | null>(null);
const layoutTrigger = ref(0);
const collapsedIds = ref<string[]>([]);
const showTicketDelete = ref(false);
const ticketToDelete = ref<any>(null);
const workspaceStore = useWorkspaceStore();
const instancePrefix = `mm_${props.moduleId}_${Date.now()}`;
const localWorkspace = computed(() => workspaceStore.singleWorkspace);
const isFullscreen = ref(false);
const styleClipboard = ref<NodeStyle | null>(null);
const savedThemeDocId = ref<string | null>(null);
const showShortcutHint = ref(false);
const shortcutHintTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const lastShortcutLabel = ref("");
const activeFormatTab = ref<"theme" | "layout">("theme");
const isTreeMap = computed(() => layoutDirection.value === "tree-map");
const isCollapseLayout = ref(false)
// ── Multi-select ──────────────────────────────────────────────────────
const selectedNodeIds = ref<Set<string>>(new Set())
const showMultiFormatPanel = ref(false)
const multiStyle = ref<NodeStyle>({})
// ── Rubber-band selection ─────────────────────────────────────────────
const rubberBand = ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number } | null>(null)
const isRubberBanding = ref(false)
const rubberBandMoved = ref(false)
const rubberBandJustFinished = ref(false)
// ── Drag & Drop ───────────────────────────────────────────────────────
const draggingCard = ref<MindNode | null>(null)
const dragOverListId = ref<string | null>(null)
const dragGhostStyle = ref<Record<string, string> | null>(null)

// ── Right-click pan ───────────────────────────────────────────────────
const isRightPanning = ref(false)
const rightPanStart = ref({ x: 0, y: 0 })
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
  {
    id: "ocean",
    name: "Ocean",
    bg: "#e0f2fe",
    nodeColors: {
      root: "#38bdf8",
      sheet: "#38bdf8",
      list: "#38bdf8",
      card: "#38bdf8",
    },
    edgeColor: "#0284c7",
    textColor: "#0c4a6e",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "#dcfce7",
    nodeColors: {
      root: "#4ade80",
      sheet: "#4ade80",
      list: "#4ade80",
      card: "#4ade80",
    },
    edgeColor: "#15803d",
    textColor: "#14532d",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#fff7ed",
    nodeColors: {
      root: "#fb923c",
      sheet: "#fb923c",
      list: "#fb923c",
      card: "#fb923c",
    },
    edgeColor: "#c2410c",
    textColor: "#7c2d12",
  },
  {
    id: "rose",
    name: "Rose",
    bg: "#fff1f2",
    nodeColors: {
      root: "#fb7185",
      sheet: "#fb7185",
      list: "#fb7185",
      card: "#fb7185",
    },
    edgeColor: "#be123c",
    textColor: "#881337",
  },
  {
    id: "violet",
    name: "Violet",
    bg: "#f5f3ff",
    nodeColors: {
      root: "#a78bfa",
      sheet: "#a78bfa",
      list: "#a78bfa",
      card: "#a78bfa",
    },
    edgeColor: "#6d28d9",
    textColor: "#2e1065",
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "#0f172a",
    nodeColors: {
      root: "#334155",
      sheet: "#334155",
      list: "#334155",
      card: "#334155",
    },
    edgeColor: "#7c3aed",
    textColor: "#f1f5f9",
  },
  {
    id: "slate",
    name: "Slate",
    bg: "#f1f5f9",
    nodeColors: {
      root: "#64748b",
      sheet: "#64748b",
      list: "#64748b",
      card: "#64748b",
    },
    edgeColor: "#475569",
    textColor: "#0f172a",
  },
  {
    id: "amber",
    name: "Golden",
    bg: "#fffbeb",
    nodeColors: {
      root: "#fbbf24",
      sheet: "#fbbf24",
      list: "#fbbf24",
      card: "#fbbf24",
    },
    edgeColor: "#b45309",
    textColor: "#78350f",
  },
  {
    id: "teal",
    name: "Teal",
    bg: "#f0fdfa",
    nodeColors: {
      root: "#2dd4bf",
      sheet: "#2dd4bf",
      list: "#2dd4bf",
      card: "#2dd4bf",
    },
    edgeColor: "#0f766e",
    textColor: "#134e4a",
  },
  {
    id: "dark-purple",
    name: "Dark Purple",
    bg: "#1a0a2e",
    nodeColors: {
      root: "#4a2870",
      sheet: "#4a2870",
      list: "#4a2870",
      card: "#4a2870",
    },
    edgeColor: "#9333ea",
    textColor: "#e9d5ff",
  },
  {
    id: "nord",
    name: "Nord",
    bg: "#2e3440",
    nodeColors: {
      root: "#434c5e",
      sheet: "#434c5e",
      list: "#434c5e",
      card: "#434c5e",
    },
    edgeColor: "#88c0d0",
    textColor: "#eceff4",
  },
  {
    id: "lavender",
    name: "Lavender",
    bg: "#faf5ff",
    nodeColors: {
      root: "#e9d5ff",
      sheet: "#e9d5ff",
      list: "#e9d5ff",
      card: "#e9d5ff",
    },
    edgeColor: "#a855f7",
    textColor: "#4c1d95",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    bg: "#0a0a0a",
    nodeColors: {
      root: "#00ffff",
      sheet: "#00ffff",
      list: "#00ffff",
      card: "#00ffff",
    },
    edgeColor: "#facc15",
    textColor: "#e5e5e5",
  },
  {
    id: "mint",
    name: "Mint",
    bg: "#ecfdf5",
    nodeColors: {
      root: "#6ee7b7",
      sheet: "#6ee7b7",
      list: "#6ee7b7",
      card: "#6ee7b7",
    },
    edgeColor: "#059669",
    textColor: "#064e3b",
  },
  {
    id: "coral",
    name: "Coral",
    bg: "#fff5f5",
    nodeColors: {
      root: "#ffa8a8",
      sheet: "#ffa8a8",
      list: "#ffa8a8",
      card: "#ffa8a8",
    },
    edgeColor: "#fa5252",
    textColor: "#7f1d1d",
  },
  {
    id: "ice",
    name: "Ice",
    bg: "#f0f9ff",
    nodeColors: {
      root: "#bae6fd",
      sheet: "#bae6fd",
      list: "#bae6fd",
      card: "#bae6fd",
    },
    edgeColor: "#38bdf8",
    textColor: "#0c4a6e",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    bg: "#18181b",
    nodeColors: {
      root: "#3f3f46",
      sheet: "#3f3f46",
      list: "#3f3f46",
      card: "#3f3f46",
    },
    edgeColor: "#a1a1aa",
    textColor: "#fafafa",
  },
  {
    id: "peach",
    name: "Peach",
    bg: "#fff7ed",
    nodeColors: {
      root: "#fdba74",
      sheet: "#fdba74",
      list: "#fdba74",
      card: "#fdba74",
    },
    edgeColor: "#ea580c",
    textColor: "#7c2d12",
  },
  {
    id: "aqua",
    name: "Aqua",
    bg: "#ecfeff",
    nodeColors: {
      root: "#67e8f9",
      sheet: "#67e8f9",
      list: "#67e8f9",
      card: "#67e8f9",
    },
    edgeColor: "#0891b2",
    textColor: "#083344",
  },
  {
    id: "crimson",
    name: "Crimson",
    bg: "#fef2f2",
    nodeColors: {
      root: "#ef4444",
      sheet: "#ef4444",
      list: "#ef4444",
      card: "#ef4444",
    },
    edgeColor: "#991b1b",
    textColor: "#450a0a",
  },
  {
    id: "indigo",
    name: "Indigo",
    bg: "#eef2ff",
    nodeColors: {
      root: "#818cf8",
      sheet: "#818cf8",
      list: "#818cf8",
      card: "#818cf8",
    },
    edgeColor: "#4338ca",
    textColor: "#1e1b4b",
  },
  {
    id: "sand",
    name: "Sand",
    bg: "#fdf6e3",
    nodeColors: {
      root: "#e6ccb2",
      sheet: "#e6ccb2",
      list: "#e6ccb2",
      card: "#e6ccb2",
    },
    edgeColor: "#b08968",
    textColor: "#583101",
  },
  {
    id: "neon",
    name: "Neon",
    bg: "#050505",
    nodeColors: {
      root: "#00ffcc",
      sheet: "#00ffcc",
      list: "#00ffcc",
      card: "#00ffcc",
    },
    edgeColor: "#ff073a",
    textColor: "#eaffea",
  },
];

const BG_COLORS = [
  "#dedfe3",
  "#ffffff",
  "#f8fafc",
  "#f0f9ff",
  "#f0fdf4",
  "#fff7ed",
  "#fdf4ff",
  "#fff1f2",
  "#fffbeb",
  "#f1f5f9",
  "#0f172a",
  "#1a1a2e",
  "#0d1117",
  "#1e293b",
  "#2e3440",
  "#6fd0f9",
  "#fde68a",
  "#bbf7d0",
  "#fecdd3",
  "#ddd6fe",
];

const activeThemeId = ref<string>("default");
const activeCanvasBg =  ref("var(--bg-body)");
const recentlyUsedColors = ref<string[]>([]);
const activeEdgeColor = ref('var(--primary-color)')
const customBgColor = ref("#dedfe3");
async function persistTheme(stylePayload: Record<string, any>) {
  const { type, type_id } = resolveThemeContext();
  const userId = localStorage.getItem("user_id") ?? undefined;

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
    const theme = await themeStore.getMindmapThemeByWorkflow(
      props.workspaceId,
      type_id,
      type,
    );

    if (theme?._id) {
      savedThemeDocId.value = theme._id;
    }
  }
}

async function applyTheme(theme: MapTheme, persist = true) {
  activeThemeId.value = theme.id;
  activeCanvasBg.value = theme.bg;
  customBgColor.value = theme.bg.startsWith('var(') 
    ? getComputedVar(theme.bg.slice(4, -1), '#dedfe3')
    : theme.bg;
  
  const el = rootEl.value;
  if (!el) return;

  const resolveColor = (c: string) =>
    c.startsWith('var(') ? `var(${c.slice(4, -1)})` : c

  el.style.setProperty('--mm-bg',            resolveColor(theme.bg));
  el.style.setProperty('--mm-node-root-bg',  resolveColor(theme.nodeColors.root));
  el.style.setProperty('--mm-node-sheet-bg', resolveColor(theme.nodeColors.sheet));
  el.style.setProperty('--mm-node-list-bg',  resolveColor(theme.nodeColors.list));
  el.style.setProperty('--mm-node-card-bg',  resolveColor(theme.nodeColors.card));
  el.style.setProperty('--mm-edge-color',    resolveColor(theme.edgeColor));
  el.style.setProperty('--mm-text-color',    resolveColor(theme.textColor));

  activeEdgeColor.value = theme.edgeColor;

  if (!persist) return;

  const stylePayload = {
    mm_theme_id: theme.id,
    mm_bg: theme.bg,
    mm_edge_color: theme.edgeColor,
    mm_text_color: theme.textColor,
    mm_node_root: theme.nodeColors.root,
    mm_node_sheet: theme.nodeColors.sheet,
    mm_node_list: theme.nodeColors.list,
    mm_node_card: theme.nodeColors.card,
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
function applyStyleObject(style: Record<string, any>, persist = false) {
  if (!style?.mm_theme_id) return;

  if (style.mm_theme_id === "custom") {
    if (style.mm_bg) applyCustomBg(style.mm_bg, persist);
    return;
  }

  const found = THEMES.find((t) => t.id === style.mm_theme_id);
  if (found) {
    const restored: MapTheme = {
      ...found,
      bg: style.mm_bg ?? found.bg,
      edgeColor: style.mm_edge_color ?? found.edgeColor,
      textColor: style.mm_text_color ?? found.textColor,
      nodeColors: {
        root: style.mm_node_root ?? found.nodeColors.root,
        sheet: style.mm_node_sheet ?? found.nodeColors.sheet,
        list: style.mm_node_list ?? found.nodeColors.list,
        card: style.mm_node_card ?? found.nodeColors.card,
      },
    };
    applyTheme(restored, persist);
  } else if (style.mm_bg) {
    applyCustomBg(style.mm_bg, persist);
  }
}

async function loadSavedTheme() {
  try {
    const { type, type_id } = resolveThemeContext();
    const match = await themeStore.getMindmapThemeByWorkflow(
      props.workspaceId, type_id, type,
    );
    if (match?._id && match?.style) {
      savedThemeDocId.value = match._id;
      let tries = 0;
      while (!rootEl.value && tries < 20) {
        await nextTick();
        tries++;
      }
      if (rootEl.value) {
        applyStyleObject(match.style, false);
      }
      return;
    }
  } catch (err) {
    console.warn("Could not load theme from API:", err);
  }
  savedThemeDocId.value = null;
  await nextTick()
  if (rootEl.value) {
    applyDefaultTheme();
  }
}

watch(
  () => {
    const { type, type_id } = resolveThemeContext();
    return [type, type_id ?? undefined] as [string, string | undefined];
  },
  async (newVal, oldVal) => {
    const [type, type_id] = newVal;
    const [prevType, prevTypeId] = oldVal ?? [];
    if (type === prevType && type_id === prevTypeId) return;
    await loadSavedTheme();
  },
  { immediate: true },
);
const themeContext = computed(() => {
  const { type, type_id } = resolveThemeContext();
  return { type, type_id };
});
let themeRequestId = 0;

watch(
  themeContext,
  async (newCtx, oldCtx) => {
    if (newCtx.type === oldCtx?.type && newCtx.type_id === oldCtx?.type_id)
      return;

    const requestId = ++themeRequestId;

    try {
      await loadSavedTheme();
      if (requestId !== themeRequestId) return;
    } catch (err) {
      console.warn("Theme watcher load failed:", err);
    }
  },
  { immediate: true, deep: false },
);
function openDeleteModal(node: any) {
  ticketToDelete.value = node;
  showTicketDelete.value = true;
}
function handleDeleteTicket() {
  if (!ticketToDelete.value) return;
  emit(
    "delete:ticket",
    ticketToDelete.value.real_id || ticketToDelete.value.id,
  );
  showTicketDelete.value = false;
  ticketToDelete.value = null;
}
function isCollapsed(id: string): boolean {
  return collapsedIds.value.includes(id);
}
function collapseNode(id: string): void {
  if (!isCollapsed(id)) collapsedIds.value = [...collapsedIds.value, id];
}
function expandNode(id: string): void {
  collapsedIds.value = collapsedIds.value.filter((x) => x !== id);
}

const nodeMap = {
  get(id: string): MindNode | null {
    return nodeStore[id] ?? null;
  },
  set(id: string, node: MindNode): void {
    nodeStore[id] = node;
  },
  clear(): void {
    for (const k of Object.keys(nodeStore)) delete nodeStore[k];
  },
  has(id: string): boolean {
    return id in nodeStore;
  },
};

const viewportEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLDivElement | null>(null);

const zoom = ref(0.85);
const minZoom = 0.15;
const maxZoom = 3;
const zoomStep = 0.1;
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
// const panStart = ref({ x: 0, y: 0 });
const svgW = ref(8000);
const svgH = ref(8000);

const layoutDirection = ref<
  | "right"
  | "left"
  | "center"
  | "top"
  | "bottom"
  | "radial"
  | "zigzag"
  | "staggered"
  | "split-horizontal"
  | "ladder"
  | "fishbone"
  | "org-chart"
  | "timeline"
  | "tree-map"
  | "logic-left"
  | "logic-right"
>("right");
const nodeSides = new Map<string, "left" | "right">();

const draggedNodeId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });

const creatingCardForListId = ref<string | null>(null);
const newCardTitle = ref<string>("");
const isCreatingCard = ref(false);

const ctxMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  nodeId: null as string | null,
});
let ctxSkipNextClick = false;

const selectedNodeId = ref<string | null>(null);

const showFormatSidebar = ref(false);
const isSavingNodeStyle = ref(false);
const hyperlinkInput = ref("");

const showHyperlinkModal = ref(false);
const hyperlink = ref("");
const resolveCallback = ref<((l: string) => void) | null>(null);

const selectedListSheetId = ref<string>(props.selectedSheetId);
const sheetSelector = reactive<{
  visible: boolean;
  x: number;
  y: number;
  selectedSheetId: string;
  listNodeObj: MindNode | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  selectedSheetId: "",
  listNodeObj: null,
});
const showMustSelectMessage = ref(false);

const module_id = ref(localStorage.getItem("selectedModuleId") || "");
watch(
  () => props.moduleId,
  (v) => {
    if (v) module_id.value = v;
  },
  { immediate: true },
);

const newColumnLocal = ref(props.newColumn);
watch(
  () => props.newColumn,
  (v) => {
    newColumnLocal.value = v;
  },
);
function emitAddColumn() {
  const t = newColumnLocal.value.trim();
  if (t) emit("add-column", t);
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

const LAYOUT_VIEWS = [
  { id: "right", name: "Right", group: "mindmap" },
  { id: "left", name: "Left", group: "mindmap" },
  { id: "center", name: "Centered", group: "mindmap" },
  { id: "top", name: "Top down", group: "mindmap" },
  { id: "bottom", name: "Bottom up", group: "mindmap" },
  { id: "radial", name: "Radial", group: "mindmap" },
  { id: "zigzag", name: "Zigzag", group: "mindmap" },
  { id: "staggered", name: "Staggered", group: "mindmap" },
  { id: "split-horizontal", name: "Split Horizontal", group: "mindmap" },
  { id: "ladder", name: "Ladder", group: "mindmap" },
  { id: "logic-right", name: "Logic Right", group: "logic" },
  { id: "logic-left", name: "Logic Left", group: "logic" },
  { id: "fishbone", name: "Fishbone", group: "logic" },
  { id: "org-chart", name: "Org Chart", group: "structure" },
  { id: "timeline", name: "Timeline", group: "structure" },
  { id: "tree-map", name: "Tree Map", group: "structure" },
] as const;

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
          <rect x="2" y="2" width="30" height="22" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="32" y="2" width="26" height="22" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="2" y="24" width="18" height="18" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="20" y="24" width="20" height="18" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
          <rect x="40" y="24" width="18" height="18" rx="2" fill="var(--bg-surface)" stroke="var(--border)" stroke-width="1"/>
        </g>`,
      },
    ],
  },
];
function mapBackendStyle(style: any = {}): NodeStyle {
  const def = DEFAULT_BACKEND_STYLE;
  
  return {
    background: style.bg_color && style.bg_color !== def.bg_color 
      ? style.bg_color : undefined,
    color: style.color && style.color !== def.color 
      ? style.color : undefined,
    fontSize: style.font_size != null && style.font_size !== def.font_size 
      ? `${style.font_size}px` : undefined,
    fontWeight: style.font_weight && style.font_weight !== def.font_weight 
      ? style.font_weight : undefined,
    fontStyle: style.font_style && style.font_style !== def.font_style 
      ? style.font_style : undefined,
    fontFamily: style.font_family && style.font_family !== def.font_family 
      ? style.font_family : undefined,
    textAlign: style.text_align && style.text_align !== def.text_align 
      ? style.text_align : undefined,
    borderColor: style.border_color && style.border_color !== def.border_color 
      ? style.border_color : undefined,
    borderWidth: style.border_width != null && style.border_width !== def.border_width 
      ? `${style.border_width}px` : undefined,
    borderRadius: style.border_radius != null && style.border_radius !== def.border_radius 
      ? `${style.border_radius}px` : undefined,
    borderStyle: style.border_style && style.border_style !== def.border_style 
      ? style.border_style : undefined,
    padding: style.padding != null && style.padding !== def.padding 
      ? `${style.padding}px` : undefined,
    opacity: style.opacity != null && style.opacity !== def.opacity 
      ? style.opacity : undefined,
    boxShadow: style.box_shadow && style.box_shadow !== def.box_shadow 
      ? style.box_shadow : undefined,
    hyperLink: style.hyperLink || undefined,
  };
}
function resolveStyle<T>(ui: T | undefined, orig: T | undefined, def: T): T {
  return ui !== undefined ? ui : orig !== undefined ? orig : def;
}

function parsePx(val?: string): number {
  if (!val) return 0;
  return parseInt(val) || 0;
}

const colorPresets = [
  {
    name: "Brand",
    bg: "var(--primary-color)",
    border: "var(--secondary-color)",
    color: "#ffffff",
  },
  {
    name: "Secondary",
    bg: "var(--bg-surface)",
    border: "var(--border)",
    color: "var(--text-primary)",
  },
  { name: "Sky", bg: "#0ea5e9", border: "#0284c7", color: "#fff" },
  { name: "Emerald", bg: "#10b981", border: "#059669", color: "#fff" },
  { name: "Amber", bg: "#f59e0b", border: "#d97706", color: "#fff" },
  { name: "Rose", bg: "#f43f5e", border: "#e11d48", color: "#fff" },
  { name: "White", bg: "#ffffff", border: "#d9d9d9", color: "#2b2c30" },
  { name: "Dark", bg: "#2b2c30", border: "#0f172a", color: "#f5f5f5" },
];

const shadowPresets = [
  { label: "None", value: "" },
  { label: "Soft", value: "0 2px 8px rgba(0,0,0,.08)" },
  { label: "Medium", value: "0 4px 16px rgba(0,0,0,.14)" },
  { label: "Hard", value: "0 8px 24px rgba(0,0,0,.22)" },
  { label: "Inner", value: "inset 0 2px 6px rgba(0,0,0,.12)" },
  { label: "Glow", value: "0 0 0 3px var(--primary-color)" },
];

function applyPreset(p: { bg: string; border: string; color: string }) {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  node.style.background = p.bg;
  node.style.borderColor = p.border;
  node.style.color = p.color;
}

function resetNodeStyle() {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  node.style = mapBackendStyle(DEFAULT_BACKEND_STYLE);
  hyperlinkInput.value = "";
}

const NODE_W: Record<string, number> = {
  root: 220,
  sheet: 200,
  List: 180,
  card: 210,
};

function nodeHeight(node: MindNode): number {
  if (node.uniqueName === "card") {
    return 70;
  }
  if (node.uniqueName === "List") return 72;
  if (node.uniqueName === "sheet") return 66;
  if (node.uniqueName === "root") return 56;
  return 46;
}

const H_GAP = 80;
const V_GAP = 16;
const CARD_V_GAP = 44;

function getSubtreeWidth(node: MindNode, dir: string): number {
  const w = NODE_W[node.uniqueName] ?? 180;
  if (isCollapsed(node.id) || !node.children || node.children.length === 0) {
    return w;
  }
  const childWidths = node.children.map((c) => getSubtreeWidth(c, dir));
  const total =
    childWidths.reduce((a, b) => a + b, 0) + V_GAP * (node.children.length - 1);
  return Math.max(total, w);
}

function layoutTree(
  node: MindNode,
  x: number,
  y: number,
  dir?: string,
): number {
  const d = (dir ?? layoutDirection.value) as string;
  node.width = NODE_W[node.uniqueName] ?? 180;
  node.height = nodeHeight(node);

  if (isCollapsed(node.id) || !node.children || node.children.length === 0) {
    node.collapsed = isCollapsed(node.id);
    node.x = x;
    node.y = y;
    return node.height;
  }
  if (d === "center") {
    const kids = node.children;
    if (kids.length === 0) {
      node.x = x;
      node.y = y;
      return node.height;
    }

    if (node.uniqueName === "root" && kids.length === 1) {
      const sheet = kids[0];
      nodeSides.set(sheet.id, "right");
      sheet.width = NODE_W[sheet.uniqueName] ?? 180;
      sheet.height = nodeHeight(sheet);

      const lists = sheet.children || [];
      if (lists.length === 0) {
        const h = layoutTree(sheet, x + node.width + H_GAP, y, "right");
        node.x = x;
        node.y = sheet.y + sheet.height / 2 - node.height / 2;
        return h;
      }

      const rightLists: MindNode[] = [];
      const leftLists: MindNode[] = [];
      lists.forEach((l, i) => {
        if (i % 2 === 0) {
          nodeSides.set(l.id, "right");
          rightLists.push(l);
        } else {
          nodeSides.set(l.id, "left");
          leftLists.push(l);
        }
      });

      const sheetX = x + node.width + H_GAP;
      const sheetY = y;
      console.log(sheetY);
      let ry = y;
      for (const l of rightLists) {
        const cX = sheetX + sheet.width + H_GAP;
        const h = layoutTree(l, cX, ry, "right");
        ry += h + V_GAP;
      }
      let ly = y;
      for (const l of leftLists) {
        const cX = sheetX - H_GAP - (NODE_W[l.uniqueName] ?? 180);
        const h = layoutTree(l, cX, ly, "left");
        ly += h + V_GAP;
      }

      const allLists = [...rightLists, ...leftLists];
      const minLY = Math.min(...allLists.map((l) => l.y));
      const maxLY = Math.max(...allLists.map((l) => l.y + l.height));
      sheet.x = sheetX;
      sheet.y = minLY + (maxLY - minLY) / 2 - sheet.height / 2;

      node.x = x;
      node.y = sheet.y + sheet.height / 2 - node.height / 2;
      return maxLY - minLY;
    }

    if (node.uniqueName === "root" || node.uniqueName === "sheet") {
      const rightKids: MindNode[] = [];
      const leftKids: MindNode[] = [];
      kids.forEach((c, i) => {
        if (i % 2 === 0) {
          nodeSides.set(c.id, "right");
          rightKids.push(c);
        } else {
          nodeSides.set(c.id, "left");
          leftKids.push(c);
        }
      });

      let ry = y;
      for (const c of rightKids) {
        const cX = x + node.width + H_GAP;
        const h = layoutTree(c, cX, ry, "right");
        ry += h + V_GAP;
      }
      let ly = y;
      for (const c of leftKids) {
        const cX = x - H_GAP - (NODE_W[c.uniqueName] ?? 180);
        const h = layoutTree(c, cX, ly, "left");
        ly += h + V_GAP;
      }

      const allKids = [...rightKids, ...leftKids];
      const minY = Math.min(...allKids.map((c) => c.y));
      const maxY = Math.max(...allKids.map((c) => c.y + c.height));
      node.x = x;
      node.y = minY + (maxY - minY) / 2 - node.height / 2;
      return maxY - minY;
    }
  }

  if (d === "top" || d === "bottom") {
    const sign = d === "top" ? 1 : -1;
    const childGapH = V_GAP;
    const childWidths = node.children.map((c) => getSubtreeWidth(c, d));
    const totalW =
      childWidths.reduce((a, b) => a + b, 0) +
      childGapH * (node.children.length - 1);
    let childX = x + node.width / 2 - totalW / 2;
    const childY =
      sign > 0
        ? y + node.height + H_GAP
        : y - H_GAP - nodeHeight(node.children[0]);
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      nodeSides.set(child.id, "right");
      layoutTree(
        child,
        childX + childWidths[i] / 2 - child.width / 2,
        childY,
        d,
      );
      childX += childWidths[i] + childGapH;
    }
    node.x = x;
    node.y = y;
    return totalW;
  }

  if (d === "radial") {
    const radius = 320;
    const count = node.children.length;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      const cx =
        x +
        node.width / 2 +
        Math.cos(angle) * radius -
        (NODE_W[node.children[i].uniqueName] ?? 180) / 2;
      const cy =
        y +
        node.height / 2 +
        Math.sin(angle) * radius -
        nodeHeight(node.children[i]) / 2;
      nodeSides.set(node.children[i].id, cx >= x ? "right" : "left");
      layoutTree(node.children[i], cx, cy, "right");
    }
    node.x = x;
    node.y = y;
    return node.height;
  }

  if (d === "zigzag") {
    const colLeft = x + node.width + H_GAP;
    const colRight = x + node.width + H_GAP * 2 + (NODE_W.sheet ?? 180);
    let rowY = y;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const cx = i % 2 === 0 ? colLeft : colRight;
      nodeSides.set(child.id, "right");
      const h = layoutTree(child, cx, rowY, "right");
      rowY += h + V_GAP * 2;
    }
    node.x = x;
    node.y = y;
    return rowY - y;
  }

  if (d === "staggered") {
    const baseX = x + node.width + H_GAP;
    const staggerOffset = 40;
    let childY = y;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const cx = baseX + (i % 2 === 0 ? 0 : staggerOffset);
      nodeSides.set(child.id, "right");
      const h = layoutTree(child, cx, childY, "right");
      childY += h + V_GAP;
    }
    const firstY = node.children[0].y;
    const lastC = node.children[node.children.length - 1];
    node.x = x;
    node.y = firstY + (lastC.y + lastC.height - firstY) / 2 - node.height / 2;
    return childY - y;
  }

  if (d === "split-horizontal") {
    const topKids: MindNode[] = [];
    const bottomKids: MindNode[] = [];
    node.children.forEach((c, i) => {
      if (i % 2 === 0) topKids.push(c);
      else bottomKids.push(c);
    });

    const topGap = V_GAP;
    const topWidths = topKids.map((c) => NODE_W[c.uniqueName] ?? 180);
    const totalTopW =
      topWidths.reduce((a, b) => a + b, 0) + topGap * (topKids.length - 1);
    let tx = x + node.width / 2 - totalTopW / 2;
    const topY = y - H_GAP - nodeHeight(topKids[0] ?? node);
    for (let i = 0; i < topKids.length; i++) {
      nodeSides.set(topKids[i].id, "right");
      layoutTree(topKids[i], tx, topY, "right");
      tx += topWidths[i] + topGap;
    }

    const botWidths = bottomKids.map((c) => NODE_W[c.uniqueName] ?? 180);
    const totalBotW =
      botWidths.reduce((a, b) => a + b, 0) + topGap * (bottomKids.length - 1);
    let bx = x + node.width / 2 - totalBotW / 2;
    const botY = y + node.height + H_GAP;
    for (let i = 0; i < bottomKids.length; i++) {
      nodeSides.set(bottomKids[i].id, "right");
      layoutTree(bottomKids[i], bx, botY, "right");
      bx += botWidths[i] + topGap;
    }

    node.x = x;
    node.y = y;
    return node.height;
  }

  if (d === "ladder") {
    const ladderX = x + node.width + H_GAP;
    let runningY = y;
    for (const child of node.children) {
      nodeSides.set(child.id, "right");
      const h = layoutTree(child, ladderX, runningY, "right");
      runningY += h + V_GAP;
    }
    node.x = x;
    node.y = y;
    return runningY - y;
  }

  if (d === "logic-right") {
    const childX = x + node.width + 60;
    let runY = y;
    for (const child of node.children) {
      nodeSides.set(child.id, "right");
      child.width = NODE_W[child.uniqueName] ?? 180;
      child.height = nodeHeight(child);
      child.x = childX;
      child.y = runY;
      nodeMap.set(child.id, child);
      if (child.children?.length) {
        const gcX = childX + child.width + H_GAP;
        let gcY = runY;
        for (const gc of child.children) {
          nodeSides.set(gc.id, "right");
          const h = layoutTree(gc, gcX, gcY, "right");
          gcY += h + V_GAP;
        }
        const firstGcY = child.children[0].y + child.children[0].height / 2;
        const lastGc = child.children[child.children.length - 1];
        child.y =
          (firstGcY + lastGc.y + lastGc.height / 2) / 2 - child.height / 2;
        runY = gcY;
      } else {
        runY += child.height + V_GAP;
      }
    }
    const firstY = node.children[0].y + node.children[0].height / 2;
    const lastC = node.children[node.children.length - 1];
    const lastY = lastC.y + lastC.height / 2;
    node.x = x;
    node.y = (firstY + lastY) / 2 - node.height / 2;
    return runY - y;
  }

  if (d === "logic-left") {
    const childW = NODE_W.List ?? 180;
    const childX = x - H_GAP - childW;
    let runY = y;
    for (const child of node.children) {
      nodeSides.set(child.id, "left");
      child.width = NODE_W[child.uniqueName] ?? 180;
      child.height = nodeHeight(child);
      child.x = childX;
      child.y = runY;
      nodeMap.set(child.id, child);
      if (child.children?.length) {
        const gcW = NODE_W.card ?? 210;
        const gcX = childX - H_GAP - gcW;
        let gcY = runY;
        for (const gc of child.children) {
          nodeSides.set(gc.id, "left");
          const h = layoutTree(gc, gcX, gcY, "left");
          gcY += h + V_GAP;
        }
        const firstGcY = child.children[0].y + child.children[0].height / 2;
        const lastGc = child.children[child.children.length - 1];
        child.y =
          (firstGcY + lastGc.y + lastGc.height / 2) / 2 - child.height / 2;
        runY = gcY;
      } else {
        runY += child.height + V_GAP;
      }
    }
    const firstY = node.children[0].y + node.children[0].height / 2;
    const lastC = node.children[node.children.length - 1];
    const lastY = lastC.y + lastC.height / 2;
    node.x = x;
    node.y = (firstY + lastY) / 2 - node.height / 2;
    return runY - y;
  }
  if (d === "fishbone") {
    const SPINE_STEP = 240;
    const BRANCH_H = 150;
    const CARD_GAP = 12;
    const LIST_TO_CARD_GAP = 20;

    const allLists: MindNode[] = [];
    for (const sheet of node.children ?? []) {
      for (const list of sheet.children ?? []) {
        allLists.push(list);
      }
    }

    const listCount = allLists.length;
    const spineLen = (listCount + 1) * SPINE_STEP;
    const spineY = y;

    node.width = NODE_W[node.uniqueName] ?? 220;
    node.height = nodeHeight(node);
    node.x = x + spineLen;
    node.y = spineY - node.height / 2;
    nodeMap.set(node.id, node);

    for (const sheet of node.children ?? []) {
      sheet.width = NODE_W[sheet.uniqueName] ?? 200;
      sheet.height = nodeHeight(sheet);
      sheet.x = node.x - sheet.width - 24;
      sheet.y = spineY - sheet.height / 2;
      nodeSides.set(sheet.id, "right");
      nodeMap.set(sheet.id, sheet);
    }

    const topLists: MindNode[] = [];
    const bottomLists: MindNode[] = [];
    allLists.forEach((list, i) => {
      if (i % 2 === 0) topLists.push(list);
      else bottomLists.push(list);
    });

    topLists.forEach((list, i) => {
      const attachX = x + SPINE_STEP * (i + 1);
      list.width = NODE_W[list.uniqueName] ?? 180;
      list.height = nodeHeight(list);
      list.x = attachX - list.width / 2;
      list.y = spineY - BRANCH_H - list.height / 2;
      nodeSides.set(list.id, "right");
      nodeMap.set(list.id, list);

      const cards = list.children ?? [];
      let nextCardBottom = list.y - LIST_TO_CARD_GAP;
      cards.forEach((card) => {
        card.width = NODE_W[card.uniqueName] ?? 210;
        card.height = nodeHeight(card);
        card.x = list.x + list.width / 2 - card.width / 2;
        card.y = nextCardBottom - card.height;
        nextCardBottom = card.y - CARD_GAP;
        nodeSides.set(card.id, "right");
        nodeMap.set(card.id, card);
      });
    });

    bottomLists.forEach((list, i) => {
      const attachX = x + SPINE_STEP * (i + 1);
      list.width = NODE_W[list.uniqueName] ?? 180;
      list.height = nodeHeight(list);
      list.x = attachX - list.width / 2;
      list.y = spineY + BRANCH_H - list.height / 2;
      nodeSides.set(list.id, "right");
      nodeMap.set(list.id, list);

      const cards = list.children ?? [];
      let nextCardTop = list.y + list.height + LIST_TO_CARD_GAP;
      cards.forEach((card) => {
        card.width = NODE_W[card.uniqueName] ?? 210;
        card.height = nodeHeight(card);
        card.x = list.x + list.width / 2 - card.width / 2;
        card.y = nextCardTop;
        nextCardTop = card.y + card.height + CARD_GAP;
        nodeSides.set(card.id, "right");
        nodeMap.set(card.id, card);
      });
    });

    return spineLen + node.width;
  }

  if (d === "org-chart") {
    const childGapH = V_GAP * 2;
    const childWidths = node.children.map((c) => getSubtreeWidth(c, d));
    const totalW =
      childWidths.reduce((a, b) => a + b, 0) +
      childGapH * (node.children.length - 1);
    let childX = x + node.width / 2 - totalW / 2;
    const childY = y + node.height + H_GAP;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      nodeSides.set(child.id, "right");
      layoutTree(
        child,
        childX + childWidths[i] / 2 - child.width / 2,
        childY,
        d,
      );
      childX += childWidths[i] + childGapH;
    }
    node.x = x;
    node.y = y;
    return totalW;
  }

  if (d === "timeline") {
    const SPINE_Y = y;
    const LIST_W = NODE_W.List ?? 180;
    const CARD_W = NODE_W.card ?? 210;
    const LIST_COL_W = Math.max(LIST_W, CARD_W) + 24;
    const SHEET_PAD_X = 40;
    const SPINE_TO_LIST = 60;
    const LIST_GAP = 16;
    const sheetColWidths: number[] = node.children.map((sheet) => {
      const lists = sheet.children ?? [];
      const listsW =
        lists.length * LIST_COL_W + Math.max(0, lists.length - 1) * V_GAP;
      return Math.max(NODE_W[sheet.uniqueName] ?? 200, listsW) + SHEET_PAD_X;
    });

    node.width = NODE_W[node.uniqueName] ?? 220;
    node.height = nodeHeight(node);
    node.x = x;
    node.y = SPINE_Y - node.height / 2;
    nodeMap.set(node.id, node);

    let cursorX = x + node.width + H_GAP;

    for (let i = 0; i < node.children.length; i++) {
      const sheet = node.children[i];
      const colW = sheetColWidths[i];
      sheet.width = NODE_W[sheet.uniqueName] ?? 200;
      sheet.height = nodeHeight(sheet);

      sheet.x = cursorX + (colW - SHEET_PAD_X - sheet.width) / 2;
      sheet.y = SPINE_Y - sheet.height / 2;
      nodeSides.set(sheet.id, "right");
      nodeMap.set(sheet.id, sheet);

      const lists = sheet.children ?? [];

      const aboveLists = lists.filter((_, j) => j % 2 === 0);
      const belowLists = lists.filter((_, j) => j % 2 !== 0);

      let aboveCursorY = SPINE_Y - SPINE_TO_LIST;
      const aboveTotalW =
        aboveLists.length * LIST_COL_W +
        Math.max(0, aboveLists.length - 1) * V_GAP;
      let aboveStartX = sheet.x + sheet.width / 2 - aboveTotalW / 2;

      for (let j = 0; j < aboveLists.length; j++) {
        const list = aboveLists[j];
        list.width = LIST_W;
        list.height = nodeHeight(list);
        list.x = aboveStartX + j * (LIST_COL_W + V_GAP);
        list.y = aboveCursorY - list.height;
        nodeSides.set(list.id, "right");
        nodeMap.set(list.id, list);

        const cards = list.children ?? [];
        let cardY = list.y - LIST_GAP;
        for (let k = cards.length - 1; k >= 0; k--) {
          const card = cards[k];
          card.width = CARD_W;
          card.height = nodeHeight(card);
          card.x = list.x + (list.width - card.width) / 2;
          cardY -= card.height;
          card.y = cardY;
          cardY -= LIST_GAP;
          nodeSides.set(card.id, "right");
          nodeMap.set(card.id, card);
        }
      }

      const belowTotalW =
        belowLists.length * LIST_COL_W +
        Math.max(0, belowLists.length - 1) * V_GAP;
      let belowStartX = sheet.x + sheet.width / 2 - belowTotalW / 2;
      let belowCursorY = SPINE_Y + SPINE_TO_LIST;

      for (let j = 0; j < belowLists.length; j++) {
        const list = belowLists[j];
        list.width = LIST_W;
        list.height = nodeHeight(list);
        list.x = belowStartX + j * (LIST_COL_W + V_GAP);
        list.y = belowCursorY;
        nodeSides.set(list.id, "right");
        nodeMap.set(list.id, list);

        const cards = list.children ?? [];
        let cardY = list.y + list.height + LIST_GAP;
        for (let k = 0; k < cards.length; k++) {
          const card = cards[k];
          card.width = CARD_W;
          card.height = nodeHeight(card);
          card.x = list.x + (list.width - card.width) / 2;
          card.y = cardY;
          cardY += card.height + LIST_GAP;
          nodeSides.set(card.id, "right");
          nodeMap.set(card.id, card);
        }
      }

      cursorX += colW;
    }

    return cursorX - x;
  }
  if (d === "tree-map") {
    const COLS = 3;
    const TILE_W = 240;
    const TILE_PAD_X = 20;
    const TILE_PAD_Y = 24;
    const TILE_INNER = 10;
    const HDR_H = 40;
    const LIST_H = 28;
    const LIST_GAP = 4;
    const CARD_H = 60;
    const CARD_GAP = 4;
    const CARD_INDENT = 8;

    node.width = NODE_W[node.uniqueName] ?? 220;
    node.height = nodeHeight(node);
    node.x = x;
    node.y = y;
    nodeMap.set(node.id, node);

    const startX = x;
    const startY = y + node.height + TILE_PAD_Y * 2;

    const tileHeights: number[] = node.children.map((sheet) => {
      const lists = sheet.children ?? [];
      let h = HDR_H + TILE_INNER;
      for (const list of lists) {
        h += LIST_H + LIST_GAP;
        const cardCount = (list.children ?? []).length;
        if (cardCount > 0) {
          h += cardCount * (CARD_H + CARD_GAP) + TILE_INNER;
        }
      }
      h += TILE_INNER;
      return Math.max(h, 120);
    });

    for (let i = 0; i < node.children.length; i++) {
      const sheet = node.children[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const rowStart = row * COLS;
      const rowEnd = Math.min(rowStart + COLS, node.children.length);
      const rowH = Math.max(...tileHeights.slice(rowStart, rowEnd));

      let tileY = startY;
      for (let r = 0; r < row; r++) {
        const rStart = r * COLS;
        const rEnd = Math.min(rStart + COLS, node.children.length);
        const rH = Math.max(...tileHeights.slice(rStart, rEnd));
        tileY += rH + TILE_PAD_Y;
      }

      sheet.x = startX + col * (TILE_W + TILE_PAD_X);
      sheet.y = tileY;
      sheet.width = TILE_W;
      sheet.height = rowH;
      nodeSides.set(sheet.id, "right");
      nodeMap.set(sheet.id, sheet);

      const lists = sheet.children ?? [];
      let curY = sheet.y + HDR_H + TILE_INNER;

      for (const list of lists) {
        list.width = TILE_W - TILE_INNER * 2;
        list.height = LIST_H;
        list.x = sheet.x + TILE_INNER;
        list.y = curY;
        curY += LIST_H + LIST_GAP;
        nodeSides.set(list.id, "right");
        nodeMap.set(list.id, list);

        const cards = list.children ?? [];
        for (const card of cards) {
          card.width = TILE_W - TILE_INNER * 2 - CARD_INDENT;
          card.height = CARD_H;
          card.x = sheet.x + TILE_INNER + CARD_INDENT;
          card.y = curY;
          curY += CARD_H + CARD_GAP;
          nodeSides.set(card.id, "right");
          nodeMap.set(card.id, card);
        }
        if (cards.length > 0) curY += TILE_INNER;
      }
    }

    const totalRows = Math.ceil(node.children.length / COLS);
    let totalH = startY - y;
    for (let r = 0; r < totalRows; r++) {
      const rStart = r * COLS;
      const rEnd = Math.min(rStart + COLS, node.children.length);
      const rH = Math.max(...tileHeights.slice(rStart, rEnd));
      totalH += rH + TILE_PAD_Y;
    }
    return totalH;
  }

  let childY = y;
  let total = 0;
  for (const child of node.children) {
    nodeSides.set(child.id, d === "left" ? "left" : "right");
    const cX =
      d === "left"
        ? x - H_GAP - (NODE_W[child.uniqueName] ?? 180)
        : x + node.width + H_GAP;
    const h = layoutTree(child, cX, childY, d);
    const gap = child.uniqueName === "card" ? CARD_V_GAP : V_GAP;
    childY += h + gap;
    total += h + gap;
  }
  total -=
    node.children[node.children.length - 1].uniqueName === "card"
      ? CARD_V_GAP
      : V_GAP;

  const firstY = node.children[0].y;
  const lastY = node.children[node.children.length - 1].y;
  node.x = x;
  node.y =
    firstY +
    (lastY + node.children[node.children.length - 1].height - firstY) / 2 -
    node.height / 2;
  return Math.max(total, node.height);
}
type LayoutDirection = (typeof LAYOUT_VIEWS)[number]["id"];
function setLayout(dir: LayoutDirection) {
  layoutDirection.value = dir;

  const root = nodeMap.get(rootNodeId.value);
  if (!root) return;

  let startX = 60;
  let startY = 60;

  switch (dir) {
    case "right":
      startX = 60;
      startY = 60;
      break;
    case "left":
      startX = 4000 - NODE_W.root;
      startY = 60;
      break;
    case "center":
      startX = 2000 - NODE_W.root / 2;
      startY = 60;
      break;
    case "top":
      startX = 2000;
      startY = 60;
      break;
    case "bottom":
      startX = 2000;
      startY = 3000;
      break;
    case "logic-right":
    case "logic-left":
      startX = 2500 - NODE_W.root / 2;
      startY = 1500;
      break;
    case "fishbone":
      startX = 300;
      startY = 1400;
      break;
    case "org-chart":
      startX = 2000;
      startY = 200;
      break;
    case "timeline":
      startX = 200;
      startY = 1000;
      break;
    case "tree-map":
      startX = 400;
      startY = 400;
      break;
    case "radial":
    case "zigzag":
    case "staggered":
    case "split-horizontal":
    case "ladder":
      startX = 2500 - NODE_W.root / 2;
      startY = 1500;
      break;
  }

  nextTick(() => {
    layoutTree(root, startX, startY, dir);

    let minX = Infinity,
      maxX = -Infinity,
      maxY = 0;
    for (const n of flattenTree(root)) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }

    svgW.value = Math.max(maxX + 300, 5000);
    svgH.value = Math.max(maxY + 300, 3000);

    centerView();
  });
}
const sheetCardMap = ref<Record<string, any[]>>({});
function buildTree(sheets: any[]): MindNode {
  const root: MindNode = {
    id: `${instancePrefix}_root`,
    sheet_id: "",
    topic: localStorage.getItem("currentName") ?? "Mindmap",
    isRoot: true,
    children: [],
    style: {},
    _originalStyle: {},
    uniqueName: "root",
    x: 0,
    y: 0,
    width: NODE_W.root,
    height: 56,
    collapsed: false,
  };

  const varMap: Record<string, MindNode> = {};
  sheetCardMap.value = {};
  console.log("sheets data", sheets);
  
  sheets.forEach((sheet) => {
    const title =
      localStorage.getItem("selected_sheet_title") ||
      props.selectedSheetTitle ||
      localStorage.getItem("selectedSprintTitle") ||
      "Sheet";

    const link = sheet.style?.hyperLink || "";
    if (!varMap[title]) {
      varMap[title] = {
        id: `${instancePrefix}_sheet_${sheet._id}`,
        real_id: sheet._id,
        sheet_id: sheet?.sheet_id,
        topic: title,
        variables: sheet?.variables,
        children: [],
        style: mapBackendStyle(sheet?.style),
        _originalStyle: sheet?.style || {},
        uniqueName: "sheet",
        hyperLink: link,
        x: 0,
        y: 0,
        width: NODE_W.sheet,
        height: 66,
        collapsed: false,
      };
      root.children.push(varMap[title]);
    }

    const listTitle = sheet.title || sheet.variables?.["sheet-title"] || title;
    const safeTitle = (listTitle || "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const listNode: MindNode = {
      id: `${instancePrefix}_list_${sheet._id}_${safeTitle}_${sheet.sort_order ?? 0}`,
      sheet_id: sheet?.cards[0]?.sheet_id,
      topic: listTitle,
      children: [],
      style: mapBackendStyle(sheet?.style),
      _originalStyle: sheet?.style || {},
      uniqueName: "List",
      hyperLink: link,
      x: 0,
      y: 0,
      width: NODE_W.List,
      height: 72,
      collapsed: false,
    };

    sheetCardMap.value[sheet._id] = [];
    (sheet.cards || []).forEach((card: any, i: number) => {
      const cn: MindNode = {
        id: `${instancePrefix}_card_${card._id || i}`,
        real_id: card._id,
        sheet_id: sheet._id,
        seat_id: Array.isArray(card.seat_id)
          ? card.seat_id.map((s: any) => s._id || s)
          : card.seat_id,
        topic: card["card-title"],
        style: mapBackendStyle(card.style),
        _originalStyle: card.style || {},
        children: [],
        uniqueName: "card",
        hyperLink: card.style?.hyperLink || "",
        variables: {
          ...card.variables,
          ...card,
          "card-title": card["card-title"],
          lane: card.lane,
        },
        x: 0,
        y: 0,
        width: NODE_W.card,
        height: nodeHeight({ uniqueName: "card", variables: card } as any),
        collapsed: false,
      };
      cn.parent = listNode;
      listNode.children.push(cn);

      sheetCardMap.value[sheet._id].push(cn);
    });

    listNode.parent = varMap[title];
    varMap[title].children.push(listNode);
  });

  return root;
}

function assignParents(node: MindNode, parent?: MindNode) {
  if (parent) node.parent = parent;
  nodeMap.set(node.id, node);
  for (const c of node.children) assignParents(c, node);
}

function flattenTree(node: MindNode, out: MindNode[] = []): MindNode[] {
  out.push(node);
  node.children?.forEach((c) => flattenTree(c, out));
  return out;
}

const allNodes = computed<MindNode[]>(() => {
  void nodeStore;
  void collapseVersion.value;

  const root = nodeMap.get(rootNodeId.value);
  if (!root) return [];

  return flattenTree(root).filter((node) => {
    let p = node.parent;
    while (p) {
      if (isCollapsed(p.id)) return false;
      p = p.parent;
    }
    return true;
  });
});
function collapseButtonSide(node: MindNode): 'left' | 'right' | 'top' | 'bottom' {
  const dir = layoutDirection.value;
  if (dir === 'top' || dir === 'org-chart') return 'bottom';
  if (dir === 'bottom') return 'top';
  const side = nodeSides.get(node.id) ?? 'right';
  return side === 'left' ? 'left' : 'right';
}

// The group is positioned at node coords; node inside is at (0,0) relative to group
function nodeGroupStyle(node: MindNode): Record<string, string> {
  const BTN = 20; // button size
  const PAD = 6;  // space between node edge and button center
  // const dir = layoutDirection.value;
  const side = collapseButtonSide(node);
  const hasToggle =
    (node.uniqueName === 'sheet' || node.uniqueName === 'List') &&
    node.children &&
    node.children.length > 0;

  // Extra space so the button doesn't overflow the group bounding box
  const extra = hasToggle ? BTN / 2 + PAD : 0;

  let left = node.x;
  let top = node.y;
  let width = node.width;
  let height = node.height;

  if (hasToggle) {
    if (side === 'right') { width += extra; }
    else if (side === 'left') { left -= extra; width += extra; }
    else if (side === 'bottom') { height += extra; }
    else if (side === 'top') { top -= extra; height += extra; }
  }

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: '2',
    pointerEvents: 'auto',
  };
}

// Position of button *relative to the mm-node-group div*
function collapseToggleLocalStyle(node: MindNode): Record<string, string> {
  const BTN = 20;
  const side = collapseButtonSide(node);
  const hasToggle =
    (node.uniqueName === 'sheet' || node.uniqueName === 'List') &&
    node.children &&
    node.children.length > 0;
  if (!hasToggle) return { display: 'none' };

  // const PAD = 6;
  // const extra = BTN / 2 + PAD;

  let btnLeft = 0;
  let btnTop = 0;

  if (side === 'right') {
    btnLeft = node.width - BTN / 2;
    btnTop = node.height / 2 - BTN / 2;
  } else if (side === 'left') {
    btnLeft = 0;
    btnTop = node.height / 2 - BTN / 2;
  } else if (side === 'bottom') {
    btnLeft = node.width / 2 - BTN / 2;
    btnTop = node.height - BTN / 2;
  } else {
    btnLeft = node.width / 2 - BTN / 2;
    btnTop = 0;
  }

  return {
    position: 'absolute',
    left: `${btnLeft}px`,
    top: `${btnTop}px`,
    width: `${BTN}px`,
    height: `${BTN}px`,
    zIndex: '20',
  };
}
function nodeLevel(node: MindNode): number {
  let l = 0,
    cur: MindNode | undefined = node;
  while (cur?.parent) {
    l++;
    cur = cur.parent;
  }
  return l;
}
const currentEdgeColor = computed(() => activeEdgeColor.value)
const visibleEdges = computed<Edge[]>(() => {
  const root = nodeMap.get(rootNodeId.value);
  if (!root) return [];

  const edges: Edge[] = [];
  const vis = new Set(allNodes.value.map((n) => n.id));
  const dir = layoutDirection.value;

  for (const node of allNodes.value) {
    if (!node.children || isCollapsed(node.id)) continue;

    for (const child of node.children) {
      if (!vis.has(child.id)) continue;

      const nMidX = node.x + node.width / 2;
      const nMidY = node.y + node.height / 2;
      const cMidX = child.x + child.width / 2;
      const cMidY = child.y + child.height / 2;

      const nRight = node.x + node.width;
      const nLeft = node.x;
      const nTop = node.y;
      const nBottom = node.y + node.height;
      const cRight = child.x + child.width;
      const cLeft = child.x;
      const cTop = child.y;
      const cBottom = child.y + child.height;

      let path = "";

      if (dir === "tree-map") {
        if (child.width === 0 || child.height === 0) continue;
        if (node.uniqueName === "root") {
          const tx = child.x + 20;
          const ty = child.y;
          path = `M ${nMidX} ${nBottom} C ${nMidX} ${ty - 30} ${tx} ${ty - 30} ${tx} ${ty}`;
        } else {
          continue;
        }
      } else if (dir === "logic-right") {
        const bracketX = nRight + 30;
        path = `M ${nRight} ${nMidY} L ${bracketX} ${nMidY} L ${bracketX} ${cMidY} L ${cLeft} ${cMidY}`;
      } else if (dir === "logic-left") {
        const bracketX = nLeft - 30;
        path = `M ${nLeft} ${nMidY} L ${bracketX} ${nMidY} L ${bracketX} ${cMidY} L ${cRight} ${cMidY}`;
      } else if (dir === "fishbone") {
        const rootNode = nodeMap.get(rootNodeId.value);
        if (!rootNode) continue;
        const spineY = rootNode.y + rootNode.height / 2;

        if (node.uniqueName === "root") {
          path = `M ${nLeft} ${spineY} L ${cRight} ${spineY}`;
        } else if (node.uniqueName === "sheet") {
          const isAbove = cMidY < spineY;
          const attachX = cMidX;
          const toY = isAbove ? cBottom : cTop;
          path = `M ${attachX} ${spineY} L ${attachX} ${toY}`;
        } else if (node.uniqueName === "List") {
          const isAbove = cMidY < nMidY;
          const fromY = isAbove ? nTop : nBottom;
          const toY = isAbove ? cBottom : cTop;
          path = `M ${nMidX} ${fromY} L ${cMidX} ${toY}`;
        } else {
          continue;
        }
      } else if (dir === "timeline") {
        const spineY = node.y + node.height / 2;
        if (node.uniqueName === "root") {
          path = `M ${nRight} ${nMidY} L ${cLeft} ${cMidY}`;
        } else if (node.uniqueName === "sheet") {
          const isAbove = cMidY < spineY;
          const fromY = isAbove ? nTop : nBottom;
          const toY = isAbove ? cBottom : cTop;
          path = `M ${cMidX} ${fromY} L ${cMidX} ${toY}`;
        } else {
          const isAbove = cMidY < nMidY;
          const fromY = isAbove ? nTop : nBottom;
          const toY = isAbove ? cBottom : cTop;
          path = `M ${cMidX} ${fromY} L ${cMidX} ${toY}`;
        }
      } else if (dir === "org-chart") {
        const midY = nBottom + (cTop - nBottom) / 2;
        path = `M ${nMidX} ${nBottom} L ${nMidX} ${midY} L ${cMidX} ${midY} L ${cMidX} ${cTop}`;
      } else if (dir === "top") {
        const midY = nBottom + (cTop - nBottom) / 2;
        path = `M ${nMidX} ${nBottom} C ${nMidX} ${midY} ${cMidX} ${midY} ${cMidX} ${cTop}`;
      } else if (dir === "bottom") {
        const midY = nTop - (nTop - cBottom) / 2;
        path = `M ${nMidX} ${nTop} C ${nMidX} ${midY} ${cMidX} ${midY} ${cMidX} ${cBottom}`;
      } else if (dir === "left") {
        const midX = nLeft - (nLeft - cRight) / 2;
        path = `M ${nLeft} ${nMidY} C ${midX} ${nMidY} ${midX} ${cMidY} ${cRight} ${cMidY}`;
      } else if (dir === "radial") {
        const dx = cMidX - nMidX;
        const dy = cMidY - nMidY;
        const angle = Math.atan2(dy, dx);
        const cEdgeX = cMidX - Math.cos(angle) * (child.width / 2);
        const cEdgeY = cMidY - Math.sin(angle) * (child.height / 2);
        const nEdgeX = nMidX + Math.cos(angle) * (node.width / 2);
        const nEdgeY = nMidY + Math.sin(angle) * (node.height / 2);
        path = `M ${nEdgeX} ${nEdgeY} L ${cEdgeX} ${cEdgeY}`;
      } else {
        const side = nodeSides.get(child.id) ?? "right";
        if (side === "left") {
          const cpX = nLeft - (nLeft - cRight) / 2;
          path = `M ${nLeft} ${nMidY} C ${cpX} ${nMidY} ${cpX} ${cMidY} ${cRight} ${cMidY}`;
        } else {
          const cpX = nRight + (cLeft - nRight) / 2;
          path = `M ${nRight} ${nMidY} C ${cpX} ${nMidY} ${cpX} ${cMidY} ${cLeft} ${cMidY}`;
        }
      }

      if (!path) continue;

      edges.push({
        id: `${node.id}-${child.id}`,
        path,
        level: nodeLevel(node),
        color: currentEdgeColor.value,
        dashed: node.uniqueName === "List" && child.uniqueName === "card",
      });
    }
  }

  return edges;
});
// Replace the existing watchEffect block with this:
watch(
  layoutTrigger,
  () => {
    const root = nodeMap.get(rootNodeId.value);
    if (!root) return;

    const dir = layoutDirection.value;
    let startX = 60, startY = 60;
    if (dir === "left") { startX = 4000 - NODE_W.root; }
    else if (dir === "center") { startX = 2000 - NODE_W.root / 2; }
    else if (dir === "top") { startX = 2000; }
    else if (dir === "bottom") { startX = 2000; startY = 3000; }
    else if (dir === "logic-right" || dir === "logic-left") { startX = 2500 - NODE_W.root / 2; startY = 1500; }
    else if (dir === "fishbone") { startX = 300; startY = 1400; }
    else if (dir === "org-chart") { startX = 2000; startY = 200; }
    else if (dir === "timeline") { startX = 200; startY = 1000; }
    else if (dir === "tree-map") { startX = 400; startY = 400; }
    else if (["radial", "zigzag", "staggered", "split-horizontal", "ladder"].includes(dir)) {
      startX = 2500 - NODE_W.root / 2; startY = 1500;
    }
    layoutTree(root, startX, startY, dir);
  },
  { immediate: true }
)

function nodeInlineStyle(node: MindNode): Record<string, string> {
  const s = node.style || {};
  const ext = s as any;

  const base: Record<string, string> = {
    position: 'relative',
    left: 'unset',
    top: 'unset',
    width: `${node.width}px`,
    height: `${node.height}px`,
  };

  if (isTreeMap.value && node.uniqueName === "sheet") {
    base.borderRadius = "10px";
    base.border = "1.5px solid var(--border)";
    base.background = "var(--mm-node-sheet-bg, var(--bg-surface))";
    base.overflow = "visible";
    base.display = "block";
    base.padding = "0";
    base.boxSizing = "border-box";
    return base;
  }

  if (isTreeMap.value && node.uniqueName === "List") {
    if (node.width === 0) {
      base.display = "none";
      base.pointerEvents = "none";
      return base;
    }
    base.borderRadius = "4px";
    base.border = "none";
    base.background = "var(--mm-node-list-bg, var(--bg-surface))";
    base.boxShadow = "none";
    base.overflow = "hidden";
    base.display = "flex";
    base.alignItems = "center";
    base.padding = "0 8px";
    return base;
  }

  if (isTreeMap.value && node.uniqueName === "card") {
    if (node.width === 0) {
      base.display = "none";
      base.pointerEvents = "none";
      return base;
    }
    base.borderRadius = "6px";
    base.border = "1px solid var(--border)";
    base.background = "var(--mm-node-card-bg, var(--bg-card))";
    base.boxShadow = "0 1px 3px rgba(0,0,0,0.07)";
    base.overflow = "hidden";
    return base;
  }

  // Apply custom background if set, otherwise fall back to theme CSS var
  if (s.background !== undefined) {
    base.background = s.background
  } else {
    // Explicitly set the theme var so inline style doesn't leave it to chance
    const themeVarMap: Record<string, string> = {
      root:  'var(--mm-node-root-bg,  var(--primary-color))',
      sheet: 'var(--mm-node-sheet-bg, var(--bg-surface))',
      List:  'var(--mm-node-list-bg,  var(--bg-card))',
      card:  'var(--mm-node-card-bg,  var(--bg-card))',
    }
    base.background = themeVarMap[node.uniqueName] ?? 'var(--mm-node-card-bg, var(--bg-card))'
  }

  // Apply custom text color if set, otherwise use theme text color
  if (s.color !== undefined) {
    base.color = s.color
  } else {
    base.color = 'var(--mm-text-color, var(--text-primary))'
  }
  if (s.fontFamily) base.fontFamily = s.fontFamily;
  if (s.fontSize) base.fontSize = s.fontSize;
  if (s.fontWeight) base.fontWeight = s.fontWeight;
  if (s.fontStyle) base.fontStyle = s.fontStyle;
  if (ext.textAlign) base.textAlign = ext.textAlign;
  if (s.borderRadius) base.borderRadius = s.borderRadius;
  if (s.borderWidth && s.borderWidth !== "0px") {
    base.borderWidth = s.borderWidth;
    base.borderStyle = ext.borderStyle || "solid";
    base.borderColor = s.borderColor || "#d9d9d9";
  } else if (s.borderColor) {
    base.borderWidth = "1.5px";
    base.borderStyle = ext.borderStyle || "solid";
    base.borderColor = s.borderColor;
  }
  if (s.padding && node.uniqueName !== "card") base.padding = s.padding;
  if (s.padding && node.uniqueName === "card") base["--card-body-padding"] = s.padding;
  if (ext.opacity != null) base.opacity = String(ext.opacity);
  if (ext.boxShadow) base.boxShadow = ext.boxShadow;
  // Search highlight
  const q = searchQuery.value.trim()
  if (q && matchingNodeIds.value.has(node.id)) {
    base.outline = '2.5px solid #f59e0b'
    base.outlineOffset = '2px'
    base.boxShadow = '0 0 0 4px rgba(245,158,11,0.25), 0 4px 16px rgba(0,0,0,0.12)'
    base.zIndex = '15'
  } else if (q && !matchingNodeIds.value.has(node.id)) {
    base.opacity = String((parseFloat(base.opacity || '1')) * 0.35)
    base.filter = 'grayscale(40%)'
  }
  return base;
}
const activeFormatStyle = computed<NodeStyle>(() => {
  if (selectedNodeId.value) {
    const n = nodeMap.get(selectedNodeId.value);
    if (n?.style) return n.style;
  }
  return mapBackendStyle(DEFAULT_BACKEND_STYLE);
});

const selectedNode = computed<MindNode | null>(() =>
  selectedNodeId.value ? nodeMap.get(selectedNodeId.value) || null : null,
);

const isFirstLoad = ref(true);

watchEffect(() => {
  if (!props.listsData) return;
  nextTick(() => {
    const savedPanX = panX.value;
    const savedPanY = panY.value;
    const savedZoom = zoom.value;
    const wasFirstLoad = isFirstLoad.value;

    nodeMap.clear();
    const root = buildTree(props.listsData);
    assignParents(root);
    rootNodeId.value = root.id;
    layoutTree(root, 60, 60);
    let mx = 0,
      my = 0;
    for (const n of flattenTree(root)) {
      mx = Math.max(mx, n.x + n.width);
      my = Math.max(my, n.y + n.height);
    }
    svgW.value = Math.max(mx + 300, 3000);
    svgH.value = Math.max(my + 300, 3000);

    nextTick(() => {
      if (wasFirstLoad) {
        isFirstLoad.value = false;
        centerView();
      } else {
        panX.value = savedPanX;
        panY.value = savedPanY;
        zoom.value = savedZoom;
      }
    });
  });
});

function centerView() {
  const vp = viewportEl.value;
  if (!vp || allNodes.value.length === 0) return;
  const vW = vp.clientWidth;
  const vH = vp.clientHeight;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of allNodes.value) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const cX = (minX + maxX) / 2;
  const cY = (minY + maxY) / 2;
  panX.value = vW / 2 - cX * zoom.value;
  panY.value = vH / 2 - cY * zoom.value;
}

function fitToScreen() {
  const vp = viewportEl.value;
  if (!vp || allNodes.value.length === 0) return;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of allNodes.value) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const pad = 60;
  const scaleX = (vp.clientWidth - pad * 2) / (maxX - minX);
  const scaleY = (vp.clientHeight - pad * 2) / (maxY - minY);
  zoom.value = Math.max(minZoom, Math.min(maxZoom, Math.min(scaleX, scaleY)));
  panX.value = pad - minX * zoom.value;
  panY.value = pad - minY * zoom.value;
}

function handleResetView() {
  zoom.value = 0.85;
  nextTick(() => centerView());
}
function navigateNode(direction: "up" | "down" | "left" | "right") {
  if (!selectedNodeId.value) {
    const root = nodeMap.get(rootNodeId.value);
    if (root) selectedNodeId.value = root.id;
    return;
  }
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;

  if (direction === "right") {
    const visibleChildren = (node.children || []).filter((c) =>
      allNodes.value.some((n) => n.id === c.id),
    );
    if (visibleChildren.length > 0) {
      selectedNodeId.value = visibleChildren[0].id;
      scrollToNode(visibleChildren[0]);
    }
    return;
  }

  if (direction === "left") {
    if (node.parent) {
      selectedNodeId.value = node.parent.id;
      scrollToNode(node.parent);
    }
    return;
  }

  const parent = node.parent;
  if (!parent) return;
  const siblings = (parent.children || []).filter((c) =>
    allNodes.value.some((n) => n.id === c.id),
  );
  const idx = siblings.findIndex((s) => s.id === node.id);
  if (idx === -1) return;

  let targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0) targetIdx = siblings.length - 1;
  if (targetIdx >= siblings.length) targetIdx = 0;
  selectedNodeId.value = siblings[targetIdx].id;
  scrollToNode(siblings[targetIdx]);
}

function scrollToNode(node: MindNode) {
  const vp = viewportEl.value;
  if (!vp) return;
  const nx = node.x * zoom.value + panX.value;
  const ny = node.y * zoom.value + panY.value;
  const vW = vp.clientWidth;
  const vH = vp.clientHeight;
  const margin = 80;
  if (nx < margin || nx > vW - margin || ny < margin || ny > vH - margin) {
    panX.value = vW / 2 - (node.x + node.width / 2) * zoom.value;
    panY.value = vH / 2 - (node.y + node.height / 2) * zoom.value;
  }
}

async function duplicateNode(nodeId: string) {
  const node = nodeMap.get(nodeId);
  if (!node || node.uniqueName !== "card") return;
  const parent = node.parent;
  if (!parent) return;
  showHint("Duplicate");
  await _doCreateCard(
    node.topic + " (copy)",
    parent,
    node.sheet_id || props.selectedSheetId,
    true,
    node.variables?.["card-status"] ?? parent.topic,
  );
}

function copyStyle(nodeId: string) {
  const node = nodeMap.get(nodeId);
  if (!node) return;
  styleClipboard.value = { ...node.style };
  showHint("Style Copied");
  toast.success("Style copied");
}

function pasteStyle(nodeId: string) {
  if (!styleClipboard.value) {
    toast.info("No style in clipboard");
    return;
  }
  const node = nodeMap.get(nodeId);
  if (!node) return;
  node.style = { ...styleClipboard.value };
  showHint("Style Pasted");
  toast.success("Style pasted — click Save Style to persist");
}

function resetStyle(nodeId: string) {
  const node = nodeMap.get(nodeId);
  if (!node) return;
  node.style = mapBackendStyle(DEFAULT_BACKEND_STYLE);
  showHint("Style Reset");
  toast.success("Style reset");
}

function toggleCollapseSelected() {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node || !node.children?.length) return;
  toggleCollapse(selectedNodeId.value);
  showHint(isCollapsed(selectedNodeId.value) ? "Collapsed" : "Expanded");
}

function collapseAll() {
  const root = nodeMap.get(rootNodeId.value);
  if (!root) return;
  const all = flattenTree(root);
  for (const n of all) {
    if (n.children?.length && !isCollapsed(n.id)) {
      collapseNode(n.id);
      n.collapsed = true;
    }
  }
  collapseVersion.value++;
  showHint("All Collapsed");
}

function expandAll() {
  const root = nodeMap.get(rootNodeId.value);
  if (!root) return;
  const all = flattenTree(root);
  for (const n of all) {
    if (isCollapsed(n.id)) {
      expandNode(n.id);
      n.collapsed = false;
    }
  }
  collapseVersion.value++;
  showHint("All Expanded");
}
function _getLayoutStartX(): number {
  const dir = layoutDirection.value;
  if (dir === "left") return 4000 - NODE_W.root;
  if (dir === "center" || dir === "logic-right" || dir === "logic-left" ||
      ["radial", "zigzag", "staggered", "split-horizontal", "ladder"].includes(dir))
    return 2500 - NODE_W.root / 2;
  if (dir === "top" || dir === "bottom" || dir === "org-chart") return 2000;
  if (dir === "fishbone") return 300;
  if (dir === "timeline") return 200;
  if (dir === "tree-map") return 400;
  return 60;
}

function _getLayoutStartY(): number {
  const dir = layoutDirection.value;
  if (dir === "bottom") return 3000;
  if (dir === "logic-right" || dir === "logic-left" ||
      ["radial", "zigzag", "staggered", "split-horizontal", "ladder"].includes(dir))
    return 1500;
  if (dir === "fishbone") return 1400;
  if (dir === "org-chart") return 200;
  if (dir === "timeline") return 1000;
  if (dir === "tree-map") return 400;
  return 60;
}

function showHint(label: string) {
  lastShortcutLabel.value = label;
  showShortcutHint.value = true;
  if (shortcutHintTimer.value) clearTimeout(shortcutHintTimer.value);
  shortcutHintTimer.value = setTimeout(() => {
    showShortcutHint.value = false;
  }, 900);
}

function selectFirstNode() {
  const root = nodeMap.get(rootNodeId.value);
  if (root) {
    selectedNodeId.value = root.id;
    scrollToNode(root);
  }
}
function handleWheel(e: WheelEvent) {
  const vp = viewportEl.value;
  if (!vp) return;

  // Ctrl+wheel (or pinch gesture) = zoom
  if (e.ctrlKey || e.metaKey) {
    const rect = vp.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom.value + delta));
    const ratio = newZoom / zoom.value;
    panX.value = mouseX - (mouseX - panX.value) * ratio;
    panY.value = mouseY - (mouseY - panY.value) * ratio;
    zoom.value = newZoom;
    return;
  }

  // Plain wheel = pan (scroll)
  panX.value -= e.deltaX;
  panY.value -= e.deltaY;
}

function handleZoomIn() {
  const c = getCenter();
  zoomAt(c.x, c.y, zoomStep);
}
function handleZoomOut() {
  const c = getCenter();
  zoomAt(c.x, c.y, -zoomStep);
}

function getCenter() {
  const vp = viewportEl.value;
  if (!vp) return { x: 400, y: 300 };
  return { x: vp.clientWidth / 2, y: vp.clientHeight / 2 };
}

function zoomAt(cx: number, cy: number, delta: number) {
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom.value + delta));
  const ratio = newZoom / zoom.value;
  panX.value = cx - (cx - panX.value) * ratio;
  panY.value = cy - (cy - panY.value) * ratio;
  zoom.value = newZoom;
}


function handleViewportContextMenu(e: MouseEvent) {
  // Prevent default context menu when right-clicking on blank canvas
  if (e.target === viewportEl.value || e.target === canvasEl.value) {
    e.preventDefault()
  }
}
function handleGlobalMouseMove(e: MouseEvent) {
  if (isRightPanning.value) {
    panX.value = e.clientX - rightPanStart.value.x
    panY.value = e.clientY - rightPanStart.value.y
    return
  }

  if (draggedNodeId.value) {
    const x = (e.clientX - panX.value) / zoom.value - dragOffset.value.x
    const y = (e.clientY - panY.value) / zoom.value - dragOffset.value.y
    const n = nodeMap.get(draggedNodeId.value)
    if (n) { n.x = x; n.y = y }
    return
  }

  if (isRubberBanding.value && rubberBand.value) {
    const vp = viewportEl.value
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left - panX.value) / zoom.value
    const canvasY = (e.clientY - rect.top  - panY.value) / zoom.value
    const rb = rubberBand.value
    const dx = canvasX - rb.startX
    const dy = canvasY - rb.startY

    if (!rubberBandMoved.value && Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    rubberBandMoved.value = true

    rb.x = Math.min(canvasX, rb.startX)
    rb.y = Math.min(canvasY, rb.startY)
    rb.w = Math.abs(dx)
    rb.h = Math.abs(dy)

    const newSet = new Set<string>()
    for (const n of allNodes.value) {
      if (n.uniqueName !== 'card') continue
      if (
        n.x < rb.x + rb.w &&
        n.x + n.width  > rb.x &&
        n.y < rb.y + rb.h &&
        n.y + n.height > rb.y
      ) newSet.add(n.id)
    }
    selectedNodeIds.value = newSet
    if (newSet.size > 1) {
      selectedNodeId.value = null
      showMultiFormatPanel.value = false
    }
  }
}
function handleGlobalMouseUp(_e: MouseEvent) {
  isPanning.value      = false
  isRightPanning.value = false

  if (draggedNodeId.value) {
    pushHistory()
    draggedNodeId.value = null
    return
  }

  if (isRubberBanding.value) {
    isRubberBanding.value = false

    if (rubberBandMoved.value && rubberBand.value) {
      const rb = rubberBand.value
      const selected = new Set<string>()
      for (const n of allNodes.value) {
        if (n.uniqueName !== 'card') continue
        if (
          n.x            < rb.x + rb.w &&
          n.x + n.width  > rb.x &&
          n.y            < rb.y + rb.h &&
          n.y + n.height > rb.y
        ) selected.add(n.id)
      }

      if (selected.size === 1) {
        selectedNodeId.value   = [...selected][0]
        selectedNodeIds.value  = new Set()
        showMultiFormatPanel.value = false
      } else if (selected.size > 1) {
        selectedNodeIds.value  = selected
        selectedNodeId.value   = null
        showMultiFormatPanel.value = true
        showHint(`${selected.size} cards selected`)
      }

      // ✅ Mark that a real rubber-band drag just finished
      // handleCanvasClick fires next and must not clear this selection
      rubberBandJustFinished.value = true
    }

    rubberBand.value      = null
    rubberBandMoved.value = false  // reset AFTER setting rubberBandJustFinished
  }
}
function handleNodeMouseDown(e: MouseEvent, nodeId: string) {
  if (e.button === 2) {
    isRightPanning.value = true
    rightPanStart.value = { x: e.clientX - panX.value, y: e.clientY - panY.value }
    e.preventDefault()
    return
  }
  if (e.button !== 0) return

  const n = nodeMap.get(nodeId)
  if (!n) return

  // Cards: handle selection on mousedown, but do NOT start node-drag
  // (cards use HTML5 draggable for list-to-list reorder)
  if (n.uniqueName === 'card') {
    // Shift/Ctrl = additive multi-select
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const newSet = new Set(selectedNodeIds.value)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      selectedNodeIds.value = newSet
      selectedNodeId.value = null
      if (newSet.size > 1) showMultiFormatPanel.value = true
    } else {
      // Plain click — single select immediately
      clearMultiSelect()
      selectedNodeId.value = nodeId
      hyperlinkInput.value = n.hyperLink || n.style?.hyperLink || ''
    }
    // Do NOT preventDefault here — let HTML5 dragstart still fire
    e.stopPropagation() // stop viewport mousedown from starting rubber-band
    return
  }

  // Non-card nodes (sheet, list, root): start node drag
  draggedNodeId.value = nodeId
  const cx = (e.clientX - panX.value) / zoom.value
  const cy = (e.clientY - panY.value) / zoom.value
  dragOffset.value = { x: cx - n.x, y: cy - n.y }
  e.preventDefault()
  e.stopPropagation()
}
function handleNodeClick(e: MouseEvent, nodeId: string) {
  const node = nodeMap.get(nodeId)
  if (!node) return

  // Multi-select modifier clicks are already handled in mousedown
  if (e.shiftKey || e.ctrlKey || e.metaKey) return

  // For non-card nodes, just set selection
  if (node.uniqueName !== 'card') {
    selectedNodeId.value = nodeId
    hyperlinkInput.value = node.hyperLink || node.style?.hyperLink || ''
  }
  // Card single-select already done in mousedown — nothing extra needed
}
function handleViewportMouseDown(e: MouseEvent) {
  if (e.button === 2) {
    isRightPanning.value = true
    rightPanStart.value = { x: e.clientX - panX.value, y: e.clientY - panY.value }
    e.preventDefault()
    return
  }
  if (e.button !== 0) return

  // Only start rubber-band on bare canvas/viewport — not on any node
  const target = e.target as HTMLElement
  if (
    target !== viewportEl.value &&
    target !== canvasEl.value &&
    !target.classList.contains('connections-svg')
  ) return

  const vp = viewportEl.value!
  const rect = vp.getBoundingClientRect()
  const canvasX = (e.clientX - rect.left - panX.value) / zoom.value
  const canvasY = (e.clientY - rect.top  - panY.value) / zoom.value

  rubberBand.value = { startX: canvasX, startY: canvasY, x: canvasX, y: canvasY, w: 0, h: 0 }
  isRubberBanding.value = true
  rubberBandMoved.value = false
  isPanning.value = false
  e.preventDefault()
}
function clearMultiSelect() {
  selectedNodeIds.value = new Set()
  showMultiFormatPanel.value = false
  multiStyle.value = {}
}
function handleCanvasClick(e: MouseEvent) {
  // ✅ Consume the rubber-band flag — never deselect after a drag
  if (rubberBandJustFinished.value) {
    rubberBandJustFinished.value = false
    return
  }

  if (showExportMenu.value) { showExportMenu.value = false; return }
  if (showShortcutsPanel.value && !(e.target as HTMLElement).closest('.shortcuts-panel')) {
    showShortcutsPanel.value = false
  }
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement
    if (!target.closest('.card-ctx-menu')) closeCtxMenu()
    return
  }

  // Only deselect on truly blank canvas clicks
  if (e.target === viewportEl.value || e.target === canvasEl.value) {
    selectedNodeId.value  = null
    sheetSelector.visible = false
    clearMultiSelect()
  }
}
// ── Drag & Drop card between lists ────────────────────────────────────
function handleCardDragStart(e: DragEvent, node: MindNode) {
  if (node.uniqueName !== 'card') return
  draggingCard.value = node
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.id)
    // Suppress default ghost image
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }
}

function handleCardDragEnd() {
  draggingCard.value = null
  dragOverListId.value = null
  dragGhostStyle.value = null
}

function handleListDragOver(e: DragEvent, listNode: MindNode) {
  if (!draggingCard.value) return
  if (draggingCard.value.parent?.id === listNode.id) {
    dragOverListId.value = null
    return
  }
  e.preventDefault()
  dragOverListId.value = listNode.id
  // Update ghost position in canvas coords
  const vp = viewportEl.value
  if (vp) {
    const rect = vp.getBoundingClientRect()
    const x = (e.clientX - rect.left - panX.value) / zoom.value
    const y = (e.clientY - rect.top  - panY.value) / zoom.value
    dragGhostStyle.value = {
      left: `${x + 8}px`,
      top:  `${y + 8}px`,
    }
  }
}

function handleListDragLeave(listNode: MindNode) {
  if (dragOverListId.value === listNode.id) {
    dragOverListId.value = null
  }
}

async function handleCardDrop(e: DragEvent, targetListNode: MindNode) {
  e.preventDefault();
  const card = draggingCard.value;
  if (!card) return;
  const sourceList = card.parent;
  if (!sourceList || sourceList.id === targetListNode.id) {
    dragOverListId.value = null;
    draggingCard.value = null;
    return;
  }
  sourceList.children = sourceList.children.filter((c) => c.id !== card.id);

  // Add to target list
  card.parent = targetListNode;
  card.variables = { ...card.variables, "card-status": targetListNode.topic };
  targetListNode.children.push(card);
  nodeMap.set(card.id, card);

  // Build new_index as position in target list
  const newIndex = targetListNode.children.length - 1;
try {
  await reOrderCard.mutateAsync({
    payload: {
      workspace_id: props.workspaceId,
      card_id: card.real_id || card.id,
      group_value: targetListNode.topic,
      group_variable_id: props.selectedViewBy,
      new_index: newIndex,
      sheet_id:
        props.selectedSheetId === "all"
          ? card.variables?.sheet_id
          : props.selectedSheetId,
    },
  });
  pushHistory()
  toast.success("Ticket moved successfully");
} catch (err) {
  console.error("Failed to reorder card:", err);
  toast.error("Failed to move card");

  // Rollback: move card back to source list
  targetListNode.children = targetListNode.children.filter(
    (c) => c.id !== card.id
  );
  card.parent = sourceList;
  card.variables = { ...card.variables, "card-status": sourceList.topic };
  sourceList.children.push(card);
  nodeMap.set(card.id, card);
}

  // Also emit for parent component awareness (optional, non-blocking)
  emit("reorder:card", {
    card_id: card.real_id || card.id,
    from_list: sourceList.topic,
    to_list: targetListNode.topic,
    sheet_id: targetListNode.sheet_id || card.sheet_id,
    workspace_id: props.workspaceId,
    variables: card.variables,
  });

  // Re-layout preserving pan/zoom
  const savedPX = panX.value;
  const savedPY = panY.value;
  const savedZ = zoom.value;
  isCollapseLayout.value = true;
  const root = nodeMap.get(rootNodeId.value);
  if (root) {
    layoutTree(root, root.x, root.y, layoutDirection.value);
    let mx = 0,
      my = 0;
    for (const n of flattenTree(root)) {
      mx = Math.max(mx, n.x + n.width);
      my = Math.max(my, n.y + n.height);
    }
    svgW.value = Math.max(mx + 300, 3000);
    svgH.value = Math.max(my + 300, 3000);
  }
  nextTick(() => {
    panX.value = savedPX;
    panY.value = savedPY;
    zoom.value = savedZ;
    isCollapseLayout.value = false;
  });

  dragOverListId.value = null;
  draggingCard.value = null;
  dragGhostStyle.value = null;
}

// ── Multi-select style ────────────────────────────────────────────────
function applyMultiPreset(p: { bg: string; border: string; color: string }) {
  for (const id of selectedNodeIds.value) {
    const node = nodeMap.get(id)
    if (!node) continue
    node.style.background  = p.bg
    node.style.borderColor = p.border
    node.style.color       = p.color
  }
  multiStyle.value = { background: p.bg, borderColor: p.border, color: p.color }
}

function onMultiStyleChange(prop: string, event: Event) {
  const t = event.target as HTMLInputElement
  const value = t.type === 'number' ? Number(t.value) : t.value
  for (const id of selectedNodeIds.value) {
    const node = nodeMap.get(id)
    if (!node) continue
    if (!node.style) node.style = {}
    applyStyleProp(node.style, prop, value)
  }
  // Mirror into multiStyle for the panel UI
  applyStyleProp(multiStyle.value as any, prop, value)
}

function onMultiStyleChangeDirect(prop: string, value: string) {
  for (const id of selectedNodeIds.value) {
    const node = nodeMap.get(id)
    if (!node) continue
    if (!node.style) node.style = {}
    applyStyleProp(node.style, prop, value)
  }
  applyStyleProp(multiStyle.value as any, prop, value)
}

function resetMultiStyle() {
  for (const id of selectedNodeIds.value) {
    const node = nodeMap.get(id)
    if (!node) continue
    node.style = mapBackendStyle(DEFAULT_BACKEND_STYLE)
  }
  multiStyle.value = {}
}

async function saveMultiStyle() {
  if (isSavingNodeStyle.value) return
  isSavingNodeStyle.value = true
  try {
    pushHistory()

    // Build all payloads first — no emits yet
    const updates: Array<{ card_id: string; seat_id: any; style: Record<string, any> }> = []

    for (const id of selectedNodeIds.value) {
      const node = nodeMap.get(id)
      if (!node || node.uniqueName !== 'card') continue

      const plain = toRaw(node)
      const s    = plain.style || {}
      const orig = plain._originalStyle || {}

      const p = {
        bg_color:      resolveStyle(s.background,  orig.bg_color,     DEFAULT_BACKEND_STYLE.bg_color),
        color:         resolveStyle(s.color,        orig.color,        DEFAULT_BACKEND_STYLE.color),
        font_size:     resolveStyle(s.fontSize ? parseInt(s.fontSize) : undefined, orig.font_size, DEFAULT_BACKEND_STYLE.font_size),
        font_weight:   resolveStyle(s.fontWeight,   orig.font_weight,  DEFAULT_BACKEND_STYLE.font_weight),
        font_style:    resolveStyle(s.fontStyle,    orig.font_style,   DEFAULT_BACKEND_STYLE.font_style),
        font_family:   resolveStyle(s.fontFamily,   orig.font_family,  DEFAULT_BACKEND_STYLE.font_family),
        text_align:    resolveStyle((s as any).textAlign, orig.text_align, DEFAULT_BACKEND_STYLE.text_align),
        border_color:  resolveStyle(s.borderColor,  orig.border_color, DEFAULT_BACKEND_STYLE.border_color),
        border_width:  resolveStyle(s.borderWidth ? parseInt(s.borderWidth) : undefined, orig.border_width, DEFAULT_BACKEND_STYLE.border_width),
        border_radius: resolveStyle(s.borderRadius ? parseInt(s.borderRadius) : undefined, orig.border_radius, DEFAULT_BACKEND_STYLE.border_radius),
        border_style:  resolveStyle((s as any).borderStyle, orig.border_style, DEFAULT_BACKEND_STYLE.border_style),
        padding:       resolveStyle(s.padding ? parseInt(s.padding) : undefined, orig.padding, DEFAULT_BACKEND_STYLE.padding),
        opacity:       resolveStyle((s as any).opacity, orig.opacity, DEFAULT_BACKEND_STYLE.opacity),
        box_shadow:    resolveStyle((s as any).boxShadow, orig.box_shadow, DEFAULT_BACKEND_STYLE.box_shadow),
      }

      // Update local state immediately
      plain._originalStyle = { ...p }

      updates.push({
        card_id: plain.real_id || plain.id,
        seat_id: plain.seat_id,
        style: p,
      })
    }

    if (updates.length === 0) return

    // Single emit with all cards batched — parent handles one API call + one toast
    emit('update:card', {
      batch: true,
      cards: updates,
    })

  } catch (err) {
    console.error(err)
    toast.error('Failed to save styles')
  } finally {
    isSavingNodeStyle.value = false
  }
}
function handleOpenNode(node: MindNode) {
  emit("select:ticket", { ...node, _id: node.real_id || node.id });
}
function handleDeleteNode(nodeId: string) {
  const node = nodeMap.get(nodeId);
  emit("delete:ticket", node?.real_id || nodeId);
}
function toggleCollapse(nodeId: string) {
  const n = nodeMap.get(nodeId);
  if (!n) return;

  if (isCollapsed(nodeId)) {
    expandNode(nodeId);
    n.collapsed = false;
  } else {
    collapseNode(nodeId);
    n.collapsed = true;
  }

  // Just bump version — allNodes/visibleEdges will recompute
  // No layoutTree call, no pan/zoom save needed
  collapseVersion.value++;
}
function openFormatSidebar(nodeId: string) {
  selectedNodeId.value = nodeId;
  showFormatSidebar.value = true;
  const n = nodeMap.get(nodeId);
  hyperlinkInput.value = n?.hyperLink || n?.style?.hyperLink || "";
}

function onStyleChange(prop: string, event: Event) {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  if (!node.style) node.style = {};
  const t = event.target as HTMLInputElement;
  const value = t.type === "number" ? Number(t.value) : t.value;
  applyStyleProp(node.style, prop, value);
}

function onStyleChangeDirect(prop: string, value: string) {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  if (!node.style) node.style = {};
  applyStyleProp(node.style, prop, value);
}

function applyStyleProp(
  style: NodeStyle & Record<string, any>,
  prop: string,
  value: any,
) {
  const map: Record<string, () => void> = {
    bg_color: () => {
      style.background = value;
    },
    color: () => {
      style.color = value;
    },
    font_size: () => {
      style.fontSize = `${value}px`;
    },
    font_weight: () => {
      style.fontWeight = value;
    },
    font_style: () => {
      style.fontStyle = value;
    },
    font_family: () => {
      style.fontFamily = value;
    },
    text_align: () => {
      style.textAlign = value;
    },
    border_color: () => {
      style.borderColor = value;
    },
    border_width: () => {
      style.borderWidth = `${value}px`;
    },
    border_radius: () => {
      style.borderRadius = `${value}px`;
    },
    border_style: () => {
      style.borderStyle = value;
    },
    padding: () => {
      style.padding = `${value}px`;
    },
    opacity: () => {
      style.opacity = Number(value);
    },
    box_shadow: () => {
      style.boxShadow = value;
    },
  };
  map[prop]?.();
}

async function saveNodeStyle() {
  if (!selectedNodeId.value || isSavingNodeStyle.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  isSavingNodeStyle.value = true;
  try {
    const plain = toRaw(node);
    if (!plain._originalStyle) plain._originalStyle = {};
    const s = plain.style || {};
    const orig = plain._originalStyle;
    const p = {
      bg_color: resolveStyle(
        s.background,
        orig.bg_color,
        DEFAULT_BACKEND_STYLE.bg_color,
      ),
      color: resolveStyle(s.color, orig.color, DEFAULT_BACKEND_STYLE.color),
      font_size: resolveStyle(
        s.fontSize ? parseInt(s.fontSize) : undefined,
        orig.font_size,
        DEFAULT_BACKEND_STYLE.font_size,
      ),
      font_weight: resolveStyle(
        s.fontWeight,
        orig.font_weight,
        DEFAULT_BACKEND_STYLE.font_weight,
      ),
      font_style: resolveStyle(
        s.fontStyle,
        orig.font_style,
        DEFAULT_BACKEND_STYLE.font_style,
      ),
      font_family: resolveStyle(
        s.fontFamily,
        orig.font_family,
        DEFAULT_BACKEND_STYLE.font_family,
      ),
      text_align: resolveStyle(
        (s as any).textAlign,
        orig.text_align,
        DEFAULT_BACKEND_STYLE.text_align,
      ),
      border_color: resolveStyle(
        s.borderColor,
        orig.border_color,
        DEFAULT_BACKEND_STYLE.border_color,
      ),
      border_width: resolveStyle(
        s.borderWidth ? parseInt(s.borderWidth) : undefined,
        orig.border_width,
        DEFAULT_BACKEND_STYLE.border_width,
      ),
      border_radius: resolveStyle(
        s.borderRadius ? parseInt(s.borderRadius) : undefined,
        orig.border_radius,
        DEFAULT_BACKEND_STYLE.border_radius,
      ),
      border_style: resolveStyle(
        (s as any).borderStyle,
        orig.border_style,
        DEFAULT_BACKEND_STYLE.border_style,
      ),
      padding: resolveStyle(
        s.padding ? parseInt(s.padding) : undefined,
        orig.padding,
        DEFAULT_BACKEND_STYLE.padding,
      ),
      opacity: resolveStyle(
        (s as any).opacity,
        orig.opacity,
        DEFAULT_BACKEND_STYLE.opacity,
      ),
      box_shadow: resolveStyle(
        (s as any).boxShadow,
        orig.box_shadow,
        DEFAULT_BACKEND_STYLE.box_shadow,
      ),
      hyperLink: hyperlinkInput.value || plain.hyperLink || "",
    };
    plain._originalStyle = { ...p };
    plain.hyperLink = p.hyperLink;
    if (plain.uniqueName === "sheet") {
      emit("update:sheet", {
        sheet_id: plain.real_id || plain.sheet_id,
        workspace_id: props.workspaceId,
        workspace_module_id: props.moduleId,
        style: p,
      });
    } else {
      pushHistory()
      emit("update:card", {
        card_id: plain.real_id || plain.id,
        seat_id: plain.seat_id,
        style: p,
      });
    }
    toast.success("Style saved");
  } catch (err) {
    console.error(err);
    toast.error("Failed to save style");
  } finally {
    isSavingNodeStyle.value = false;
  }
}

function confirmHyperlink() {
  if (resolveCallback.value) resolveCallback.value(hyperlink.value);
  showHyperlinkModal.value = false;
}
function cancelHyperlink() {
  showHyperlinkModal.value = false;
}
async function _doCreateCard(
  title: string,
  listNode: MindNode,
  sheetId: string,
  directCreate = false,
  siblingStatus?: string,
) {
  isCreatingCard.value = true;
  try {
    const payload = createDefaultCardPayload(
      { topic: title },
      listNode,
      sheetId,
      directCreate,
      siblingStatus,
    );
    emit("create:card", payload);
    const tempId = `temp-card-${Date.now()}`;
    const h = nodeHeight({
      uniqueName: "card",
      variables: payload.variables,
    } as any);
    const tempCard: MindNode = {
      id: tempId,
      sheet_id: props.sheetId || sheetId,
      topic: title,
      style: {},
      _originalStyle: {},
      children: [],
      parent: listNode,
      uniqueName: "card",
      variables: payload.variables,
      x: 0,
      y: 0,
      width: 210,
      height: h,
      collapsed: false,
    };
    listNode.children.push(tempCard);
    nodeMap.set(tempId, tempCard);
    const root = nodeMap.get(rootNodeId.value);
    if (root) {
      const startX = _getLayoutStartX();
      const startY = _getLayoutStartY();
      layoutTree(root, startX, startY, layoutDirection.value);
    }
    selectedNodeId.value = tempId;
    // toast.success(`Card "${title}" created`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to create card");
  } finally {
    isCreatingCard.value = false;
  }
}

function createDefaultCardPayload(
  nodeObj: { topic: string },
  listNode: MindNode,
  sheetId?: string,
  directCreate = false,
  siblingStatus?: string,
) {
  console.log(directCreate);

  const now = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const isPlanRoute = route.path.includes("/plan");
  const status = siblingStatus ?? listNode.topic ?? "To Do";
  const resolvedSheetId = isPlanRoute
    ? props.sheetId ||
      props.selectedSheetId ||
      localStorage.getItem("selected_sheet_id") ||
      ""
    : (sheetId ?? props.selectedSheetId);

  const payload: any = {
    sheet_list_id: status,
    workspace_id: props.workspaceId,
    sheet_id: resolvedSheetId,
    variables: {
      "card-status": status,
      priority: "medium",
      process: null,
      "card-title": nodeObj.topic || "New Card",
      "card-description": "This is a default description",
      "start-date": startDate,
      "end-date": endDate,
    },
    createdAt: new Date().toISOString(),
  };
  if (route.path.includes("plan")) {
    payload.sprint_id = localStorage.getItem("activeSprintKey") || null;
  }
  return payload;
}

function startInlineCardCreation(listNode: MindNode) {
  creatingCardForListId.value = listNode.id;
  newCardTitle.value = "";
  if (listNode.collapsed) {
    listNode.collapsed = false;
    const root = nodeMap.get(rootNodeId.value);
    if (root) {
      layoutTree(root, _getLayoutStartX(), _getLayoutStartY(), layoutDirection.value);
    }
  }
  selectedNodeId.value = listNode.id;
}
function cancelInlineCreation() {
  creatingCardForListId.value = null;
  newCardTitle.value = "";
  isCreatingCard.value = false;
  nextTick(() => {
    viewportEl.value?.focus();
  });
}
async function submitInlineCard(topic: string) {
  const title = newCardTitle.value.trim();
  if (!title) return;

  const isPlanRoute = route.path.includes("/plan");

  const listId = isPlanRoute ? topic : creatingCardForListId.value || topic;
  const listNode = nodeMap.get(listId);
  if (!listId) return;
  if (isPlanRoute) {
    const listNode = nodeMap.get(creatingCardForListId.value!);
    const status = listNode?.topic ?? "To Do";
    await _doCreateCard(
      title,
      listNode!,
      props.sheetId ?? props.selectedSheetId ?? selectedNodeId.value,
      false,
      status,
    );
    cancelInlineCreation();
    return;
  }

  if (!listNode) return;

  if (!listNode.sheet_id) {
    if (!selectedListSheetId.value) {
      selectedNodeId.value = listNode.id;
      showMustSelectMessage.value = true;

      setTimeout(() => {
        showMustSelectMessage.value = false;
      }, 2500);

      return;
    }

    await _doCreateCard(title, listNode, selectedListSheetId.value);
    cancelInlineCreation();
    return;
  }

  const sheetId =
    listNode.sheet_id || selectedListSheetId.value || props.selectedSheetId;

  await _doCreateCard(title, listNode, sheetId);
  cancelInlineCreation();
}

const ctxMenuNode = computed<MindNode | null>(() =>
  ctxMenu.nodeId ? nodeMap.get(ctxMenu.nodeId) || null : null,
);

function handleNodeContextMenu(e: MouseEvent, node: MindNode) {
  if (node.uniqueName !== "card") return;
  e.preventDefault();
  e.stopPropagation();
  selectedNodeId.value = node.id;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 210;
  const menuH = 200;
  ctxMenu.x = Math.min(e.clientX, vw - menuW - 8);
  ctxMenu.y = Math.min(e.clientY, vh - menuH - 8);
  ctxMenu.nodeId = node.id;
  ctxMenu.visible = true;
  ctxSkipNextClick = true;
}

function closeCtxMenu() {
  ctxMenu.visible = false;
  ctxMenu.nodeId = null;
}

function ctxAddCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node || node.uniqueName !== "card") return;
  const listNode = node.parent;
  if (!listNode || listNode.uniqueName !== "List") return;
  nextTick(() => createCardDirectly(listNode, node));
}

function ctxOpenCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  nextTick(() => {
    if (node) handleOpenNode(node);
  });
}

function ctxFormatCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  nextTick(() => {
    if (node) openFormatSidebar(node.id);
  });
}

function ctxDeleteCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  nextTick(() => {
    if (node) handleDeleteNode(node.id);
  });
}
function ctxAddChildCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node) return;
  nextTick(() => {
    if (node.uniqueName === "card" && node.parent?.uniqueName === "List") {
      startInlineCardCreation(node.parent);
    } else if (node.uniqueName === "List") {
      startInlineCardCreation(node);
    }
  });
}

function ctxDuplicate() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node || node.uniqueName !== "card") return;
  nextTick(() => duplicateNode(node.id));
}

function ctxCopyStyle() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node) return;
  styleClipboard.value = { ...node.style };
  toast.success("Style copied");
}

function ctxPasteStyle() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node || !styleClipboard.value) return;
  node.style = { ...styleClipboard.value };
  toast.success("Style pasted — click Save Style to persist");
}

function ctxResetStyle() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node) return;
  node.style = mapBackendStyle(DEFAULT_BACKEND_STYLE);
  toast.success("Style reset");
}

async function createCardDirectly(listNode: MindNode, siblingNode?: MindNode) {
  if (isCreatingCard.value) return;
  const title = "New Card";
  const isPlanRoute = route.path.includes("/plan");
  if (isPlanRoute) {
    const status = listNode.topic ?? "To Do";
    await _doCreateCard(
      title,
      listNode,
      props.sheetId ?? props.selectedSheetId,
      true,
      status,
    );
    return;
  }
  const siblingStatus: string =
    siblingNode?.variables?.["card-status"] ?? listNode.topic ?? "To Do";

  if (!listNode.sheet_id) {
    if (!selectedListSheetId.value) {
      selectedNodeId.value = listNode.id;
      showMustSelectMessage.value = true;
      setTimeout(() => {
        showMustSelectMessage.value = false;
      }, 2500);
      return;
    }
    await _doCreateCard(
      title,
      listNode,
      selectedListSheetId.value,
      true,
      siblingStatus,
    );
    return;
  }

  const sheetId =
    listNode.sheet_id || selectedListSheetId.value || props.selectedSheetId;
  await _doCreateCard(title, listNode, sheetId, true, siblingStatus);
}
function handleKeyDown(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  const inInput =
    t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;

 if (e.key === "Escape") {
    if (showSearch.value)         { closeSearch(); return }
    if (showExportMenu.value)     { showExportMenu.value = false; return }
    if (showShortcutsPanel.value) { showShortcutsPanel.value = false; return }
    if (selectedNodeIds.value.size > 0) { clearMultiSelect(); return }
    if (creatingCardForListId.value)    { cancelInlineCreation(); return }
    return
  }

  // ── Ignore all other shortcuts when typing in an input ────────────
  if (inInput) return;

  const sel = selectedNodeId.value ? nodeMap.get(selectedNodeId.value) : null;

  // ... (rest of the key handlers unchanged)

  if (e.key === "ArrowRight") {
    e.preventDefault();
    navigateNode("right");
    return;
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    navigateNode("left");
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    navigateNode("up");
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    navigateNode("down");
    return;
  }

  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    if (e.key === "c" || e.key === "C") {
      centerView();
      showHint("Center");
      return;
    }
    if (e.key === "f" || e.key === "F") {
      fitToScreen();
      showHint("Fit");
      return;
    }
    if (e.key === "r" || e.key === "R") {
      handleResetView();
      showHint("Reset Zoom");
      return;
    }
    if (e.key === "g" || e.key === "G") {
      toggleFullscreen();
      return;
    }
    if (e.key === "+") {
      handleZoomIn();
      return;
    }
    if (e.key === "-") {
      handleZoomOut();
      return;
    }
  }

  if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
    e.preventDefault();
    handleZoomIn();
    return;
  }
  if (e.ctrlKey && e.key === "-") {
    e.preventDefault();
    handleZoomOut();
    return;
  }

  if (e.key === " " && sel?.uniqueName === "card") {
    e.preventDefault();
    handleOpenNode(sel);
    return;
  }

  if (e.key === "Tab" && !e.shiftKey && props.canCreateCard) {
    e.preventDefault();
    if (!sel) return;
    if (sel.uniqueName === "List") {
      startInlineCardCreation(sel);
    } else if (sel.uniqueName === "card" && sel.parent?.uniqueName === "List") {
      startInlineCardCreation(sel.parent);
    }
    return;
  }

  if (e.key === "Enter" && props.canCreateCard) {
    e.preventDefault();
    if (!sel) return;
    if (sel.uniqueName === "card" && sel.parent?.uniqueName === "List") {
      createCardDirectly(sel.parent, sel);
    } else if (sel.uniqueName === "List") {
      createCardDirectly(sel);
    }
    return;
  }

  if (
    (e.key === "Delete" || e.key === "Backspace") &&
    sel?.uniqueName === "card" &&
    props.canDeleteCard
  ) {
    e.preventDefault();
    openDeleteModal(sel);
    return;
  }

  if (e.ctrlKey && e.key === "d" && !e.altKey) {
    e.preventDefault();
    if (sel?.uniqueName === "card") duplicateNode(sel.id);
    return;
  }

  if (e.ctrlKey && e.key === "/") {
    e.preventDefault();
    toggleCollapseSelected();
    return;
  }

  if (e.altKey && e.ctrlKey && e.key === "/") {
    e.preventDefault();
    collapseAll();
    return;
  }

  if (e.altKey && e.ctrlKey && (e.key === "=" || e.key === "+")) {
    e.preventDefault();
    expandAll();
    return;
  }

  if (e.altKey && e.ctrlKey && e.key === "c") {
    e.preventDefault();
    if (sel) copyStyle(sel.id);
    return;
  }

  if (e.altKey && e.ctrlKey && e.key === "v") {
    e.preventDefault();
    if (sel) pasteStyle(sel.id);
    return;
  }

  if (e.altKey && e.ctrlKey && e.key === "0") {
    e.preventDefault();
    if (sel) resetStyle(sel.id);
    return;
  }

  if (e.ctrlKey && e.key === "a") {
    e.preventDefault()
    // Select ALL visible card nodes
    const cards = allNodes.value.filter(n => n.uniqueName === 'card')
    if (cards.length > 0) {
      selectedNodeIds.value = new Set(cards.map(c => c.id))
      showMultiFormatPanel.value = true
      selectedNodeId.value = null
      showHint(`${cards.length} cards selected`)
    } else {
      selectFirstNode()
    }
    return;
  }
  // Search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    openSearch()
    return
  }
  // Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
    return
  }
  // Redo
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
    return
  }
  // Shortcuts panel
  if (e.key === '?' || e.key === 'h' || e.key === 'H') {
    if (!inInput) {
      showShortcutsPanel.value = !showShortcutsPanel.value
      return
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
    if (!target.closest(".card-ctx-menu")) closeCtxMenu();
  }
}
async function toggleFullscreen() {
  const el = rootEl.value as HTMLElement | null;
  if (!el) return;

  if (!document.fullscreenElement) {
    try {
      await el.requestFullscreen();
    } catch (err) {
      console.warn("Fullscreen request denied:", err);
    }
  } else {
    await document.exitFullscreen();
  }
}
const rootEl = ref<HTMLElement | null>(null);
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  nextTick(() => centerView());
}
onMounted(async () => {
  document.addEventListener("mousemove", handleGlobalMouseMove);
  document.addEventListener("mouseup", handleGlobalMouseUp);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("contextmenu", () => {
    if (ctxMenu.visible) closeCtxMenu();
  });
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  await nextTick();
  await nextTick();
  await loadSavedTheme();
});
function getComputedVar(name: string, fallback: string): string {
  const el = document.documentElement
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

function applyDefaultTheme() {
  if (savedThemeDocId.value) return;

  const dark = isDark.value;
  const el = rootEl.value;
  if (!el) return;

  const bg      = dark ? '#1f1f1e' : getComputedVar('--bg-body', '#f4f4f4');
  const primary = getComputedVar('--primary-color', dark ? '#9356c5' : '#7d68c8');
  const surface = dark ? '#2c2c2b' : getComputedVar('--bg-surface', '#fefeff');
  const card    = dark ? '#2c2c2b' : getComputedVar('--bg-card', '#ffffff');
  const text    = dark ? '#f5f5f5' : getComputedVar('--text-primary', '#2b2c30');

  el.style.setProperty('--mm-bg',            bg);
  el.style.setProperty('--mm-node-root-bg',  dark ? '#2c2c2b' : primary);
  el.style.setProperty('--mm-node-sheet-bg', dark ? '#2c2c2b' : surface);
  el.style.setProperty('--mm-node-list-bg',  dark ? '#1f1f1e' : card);
  el.style.setProperty('--mm-node-card-bg',  dark ? '#2c2c2b' : card);
  el.style.setProperty('--mm-edge-color',    primary);
  el.style.setProperty('--mm-text-color',    text);

  activeEdgeColor.value = primary;
  activeThemeId.value   = 'default';
  activeCanvasBg.value  = bg;
  customBgColor.value   = dark ? '#1f1f1e' : '#dedfe3';
}
watch(isDark, async () => {
  await nextTick()
  if (savedThemeDocId.value) {
    await loadSavedTheme()
  } else {
    applyDefaultTheme()
  }
}, { immediate: false })
function resolveThemeContext(): { type: string; type_id: string | null } {
  const path = route.path;

  if (path.includes("/plan")) {
    return {
      type: "sprint",
      type_id: localStorage.getItem("activeSprintKey") ?? null,
    };
  }

  if (path.includes("/talent")) {
    return {
      type: props.talentType ?? "talent",
      type_id: null,
    };
  }

  return {
    type: "sheet",
    type_id:
      props.sheetId ||
      props.selectedSheetId ||
      localStorage.getItem("selected_sheet_id") ||
      null,
  };
}

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleGlobalMouseMove);
  document.removeEventListener("mouseup", handleGlobalMouseUp);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("click", handleGlobalClick);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
});
// new features
// ── Search / Spotlight ────────────────────────────────────────────────
const searchQuery = ref('')
const showSearch = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const matchingNodeIds = computed<Set<string>>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return new Set()
  const out = new Set<string>()
  for (const n of allNodes.value) {
    if (n.topic?.toLowerCase().includes(q)) out.add(n.id)
    if (n.variables?.['card-title']?.toLowerCase().includes(q)) out.add(n.id)
    if (n.variables?.['card-status']?.toLowerCase().includes(q)) out.add(n.id)
    if (n.variables?.['card-type']?.toLowerCase().includes(q)) out.add(n.id)
  }
  return out
})
const searchResults = computed<MindNode[]>(() => {
  if (!searchQuery.value.trim()) return []
  return allNodes.value.filter(n => matchingNodeIds.value.has(n.id))
})
function openSearch() {
  showSearch.value = true
  nextTick(() => searchInputRef.value?.focus())
}
function closeSearch() {
  showSearch.value = false
  searchQuery.value = ''
}
function jumpToNode(node: MindNode) {
  const vp = viewportEl.value
  if (!vp) return

  closeSearch()

  // Pan to center the node
  panX.value = vp.clientWidth / 2 - (node.x + node.width / 2) * zoom.value
  panY.value = vp.clientHeight / 2 - (node.y + node.height / 2) * zoom.value
  selectedNodeId.value = node.id

  // If it's a card, open it directly
  if (node.uniqueName === 'card') {
    nextTick(() => handleOpenNode(node))
  }

  showHint('Found: ' + (node.topic?.slice(0, 20) ?? ''))
}

// ── Undo / Redo ───────────────────────────────────────────────────────
interface HistorySnapshot { nodesJSON: string; panX: number; panY: number; zoom: number }
const undoStack = ref<HistorySnapshot[]>([])
const redoStack = ref<HistorySnapshot[]>([])
const MAX_HISTORY = 40
let _suppressSnapshot = false

function _captureSnapshot(): HistorySnapshot {
  const root = nodeMap.get(rootNodeId.value)
  const nodes = root ? flattenTree(root).map(n => ({
    id: n.id, x: n.x, y: n.y,
    style: JSON.parse(JSON.stringify(n.style || {})),
    collapsed: n.collapsed,
  })) : []
  return { nodesJSON: JSON.stringify(nodes), panX: panX.value, panY: panY.value, zoom: zoom.value }
}

function pushHistory() {
  if (_suppressSnapshot) return
  const snap = _captureSnapshot()
  undoStack.value.push(snap)
  if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
  redoStack.value = []
}

function _applySnapshot(snap: HistorySnapshot) {
  _suppressSnapshot = true
  try {
    const records: any[] = JSON.parse(snap.nodesJSON)
    for (const r of records) {
      const n = nodeMap.get(r.id)
      if (!n) continue
      n.x = r.x; n.y = r.y
      n.style = r.style
      n.collapsed = r.collapsed
      if (r.collapsed && !isCollapsed(r.id)) collapseNode(r.id)
      else if (!r.collapsed && isCollapsed(r.id)) expandNode(r.id)
    }
    collapseVersion.value++
    panX.value = snap.panX; panY.value = snap.panY; zoom.value = snap.zoom
  } finally {
    _suppressSnapshot = false
  }
}

function undo() {
  if (undoStack.value.length === 0) { showHint('Nothing to undo'); return }
  redoStack.value.push(_captureSnapshot())
  const snap = undoStack.value.pop()!
  _applySnapshot(snap)
  showHint('Undo')
}

function redo() {
  if (redoStack.value.length === 0) { showHint('Nothing to redo'); return }
  undoStack.value.push(_captureSnapshot())
  const snap = redoStack.value.pop()!
  _applySnapshot(snap)
  showHint('Redo')
}

// ── Shortcuts panel ───────────────────────────────────────────────────
const showShortcutsPanel = ref(false)
// ── Export ────────────────────────────────────────────────────────────
const isExporting = ref(false)
const showExportMenu = ref(false)

async function exportPNG() {
  if (isExporting.value) return
  isExporting.value = true
  showExportMenu.value = false
  try {
    await renderSVGToCanvas('png')
  } catch (e) {
    console.error('PNG export failed:', e)
    toast.error('PNG export failed')
  } finally {
    isExporting.value = false
  }
}

async function exportJPEG() {
  if (isExporting.value) return
  isExporting.value = true
  showExportMenu.value = false
  try {
    await renderSVGToCanvas('jpeg')
  } catch (e) {
    console.error('JPEG export failed:', e)
    toast.error('JPEG export failed')
  } finally {
    isExporting.value = false
  }
}

async function exportPDF() {
  if (isExporting.value) return
  isExporting.value = true
  showExportMenu.value = false
  try {
    await renderSVGToCanvas('pdf')
  } catch (e) {
    console.error('PDF export failed:', e)
    toast.error('PDF export failed')
  } finally {
    isExporting.value = false
  }
}

// Core renderer — builds the export SVG, draws it onto a canvas, then outputs the chosen format
async function renderSVGToCanvas(format: 'png' | 'jpeg' | 'jpg' | 'pdf') {
  const svgStr = buildExportSVG()
  const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url    = URL.createObjectURL(blob)

  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = async () => {
      try {
        const canvas  = document.createElement('canvas')
        const DPR     = 2 // retina quality
        canvas.width  = img.width  * DPR
        canvas.height = img.height * DPR
        const ctx     = canvas.getContext('2d')!
        ctx.scale(DPR, DPR)

        // For JPEG/PDF fill white background (JPEG has no transparency)
        if (format === 'jpeg' || format === 'jpg' || format === 'pdf') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, img.width, img.height)
        }

        ctx.drawImage(img, 0, 0, img.width, img.height)
        URL.revokeObjectURL(url)

        if (format === 'pdf') {
          // Dynamically load jsPDF
          const jsPDFModule = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js' as any)
          const { jsPDF } = jsPDFModule.default ?? jsPDFModule

          // Page size in mm — A4 landscape if wide, portrait if tall
          const pxToMm = (px: number) => px * 0.264583
          const mmW = pxToMm(img.width)
          const mmH = pxToMm(img.height)
          const orientation = mmW > mmH ? 'landscape' : 'portrait'

          const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: [mmW, mmH], // custom page size matching the mindmap
          })

          const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
          pdf.addImage(dataUrl, 'JPEG', 0, 0, mmW, mmH)
          pdf.save(`mindmap-${Date.now()}.pdf`)
          showHint('PDF Exported')

        } else {
          const mimeType = (format === 'jpeg' || format === 'jpg') ? 'image/jpeg' : 'image/png'
          const quality  = (format === 'jpeg' || format === 'jpg') ? 0.92 : undefined
          const dataUrl  = quality !== undefined
            ? canvas.toDataURL(mimeType, quality)
            : canvas.toDataURL(mimeType)

          const link      = document.createElement('a')
          link.download   = `mindmap-${Date.now()}.${format}`
          link.href       = dataUrl
          link.click()
          showHint(`${format.toUpperCase()} Exported`)
        }

        resolve()
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}


function buildExportSVG(): string {
  if (allNodes.value.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg"/>'

  const resolvedEdgeColor = (() => {
    const raw = activeEdgeColor.value
    if (!raw || raw.startsWith('var(')) return getComputedVar('--primary-color', '#7d68c8')
    return raw
  })()

  const bgColor = (() => {
    const raw = activeCanvasBg.value
    if (!raw || raw.startsWith('var(')) return getComputedVar('--bg-body', '#dedfe3')
    return raw
  })()

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of allNodes.value) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.width)
    maxY = Math.max(maxY, n.y + n.height)
  }

  const pad = 60
  const W = maxX - minX + pad * 2
  const H = maxY - minY + pad * 2
  const ox = minX - pad
  const oy = minY - pad

  const edgePaths = visibleEdges.value.map(e => {
    const strokeColor = (e.color && !e.color.startsWith('var(')) ? e.color : resolvedEdgeColor
    const dashAttr = e.dashed ? 'stroke-dasharray="5 4"' : ''
    return `<path d="${e.path}" stroke="${strokeColor}" stroke-width="1.5" fill="none" stroke-linecap="round" ${dashAttr} opacity="0.65"/>`
  }).join('\n    ')

  // Helper: wrap text into tspan lines given a max char width
  function wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      if ((current + ' ' + word).trim().length > maxChars) {
        if (current) lines.push(current.trim())
        current = word
      } else {
        current = (current + ' ' + word).trim()
      }
    }
    if (current) lines.push(current.trim())
    return lines
  }

  const nodeSVGs = allNodes.value.map(n => {
    const s = n.style || {}

    const bg = s.background
      || (n.uniqueName === 'root'  ? resolvedEdgeColor
        : n.uniqueName === 'sheet' ? '#ede9fb'
        : n.uniqueName === 'List'  ? '#f3f4f6'
        :                            '#ffffff')

    const textCol = s.color || (n.uniqueName === 'root' ? '#ffffff' : '#2b2c30')
    const br      = s.borderRadius ? parseInt(s.borderRadius) : (n.uniqueName === 'root' ? 28 : 8)
    const bw      = s.borderWidth  ? parseInt(s.borderWidth)  : 1.5
    const bc      = s.borderColor  || (n.uniqueName === 'root' ? resolvedEdgeColor : '#d9d9d9')

    // Font sizes per node type — larger for root so it's legible
    const fs = s.fontSize
      ? parseInt(s.fontSize)
      : n.uniqueName === 'root'  ? 14
      : n.uniqueName === 'sheet' ? 12
      : n.uniqueName === 'List'  ? 11
      : 11

    const fw = s.fontWeight || (n.uniqueName === 'root' ? '700' : n.uniqueName === 'sheet' ? '600' : '400')

    // For root: wrap text properly, never truncate
    if (n.uniqueName === 'root') {
      const fullTitle = n.topic || ''
      // Approx chars that fit per line based on node width and font size
      const maxChars = Math.floor((n.width - 56) / (fs * 0.62))
      const lines = wrapText(fullTitle, Math.max(maxChars, 10))
      const lineHeight = fs + 4
      const totalTextH = lines.length * lineHeight
      const startY = n.height / 2 - totalTextH / 2 + fs

      // Avatar circle placeholder (since we can't embed the logo image easily)
      const avatarR = 18
      const avatarCX = 30
      const avatarCY = n.height / 2

      const tspans = lines.map((line, i) =>
        `<tspan x="${avatarCX * 2 + 8 + (n.width - avatarCX * 2 - 8) / 2}" dy="${i === 0 ? 0 : lineHeight}">${
          line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        }</tspan>`
      ).join('')

      return `<g transform="translate(${n.x - ox},${n.y - oy})">
        <rect width="${n.width}" height="${n.height}" rx="${br}" ry="${br}" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/>
        <circle cx="${avatarCX}" cy="${avatarCY}" r="${avatarR}" fill="rgba(255,255,255,0.25)"/>
        <text text-anchor="middle" font-size="${fs}" font-weight="${fw}" fill="${textCol}" font-family="Lato,sans-serif"
          x="${avatarCX * 2 + 8 + (n.width - avatarCX * 2 - 8) / 2}" y="${startY}">
          ${tspans}
        </text>
      </g>`
    }

    // Sheet node — icon + title
    if (n.uniqueName === 'sheet') {
      const label = (n.topic || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      const childCount = n.children?.length ?? 0
      return `<g transform="translate(${n.x - ox},${n.y - oy})">
        <rect width="${n.width}" height="${n.height}" rx="${br}" ry="${br}" fill="${bg}" stroke="${resolvedEdgeColor}" stroke-width="1.5"/>
        <text x="14" y="${n.height / 2 - 5}" font-size="${fs}" font-weight="${fw}" fill="${textCol}" font-family="Lato,sans-serif">${label}</text>
        <text x="14" y="${n.height / 2 + fs + 1}" font-size="9" fill="${textCol}" opacity="0.55" font-family="Lato,sans-serif">${childCount} list${childCount !== 1 ? 's' : ''}</text>
      </g>`
    }

    // List node — dot + title + card count
    if (n.uniqueName === 'List') {
      const label = (n.topic || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      const cardCount = n.children?.length ?? 0
      return `<g transform="translate(${n.x - ox},${n.y - oy})">
        <rect width="${n.width}" height="${n.height}" rx="${br}" ry="${br}" fill="${bg}" stroke="#d9d9d9" stroke-width="1"/>
        <circle cx="14" cy="${n.height / 2}" r="4" fill="${resolvedEdgeColor}"/>
        <text x="24" y="${n.height / 2 - 4}" font-size="${fs}" font-weight="${fw}" fill="${textCol}" font-family="Lato,sans-serif">${label}</text>
        <text x="24" y="${n.height / 2 + fs}" font-size="9" fill="${textCol}" opacity="0.55" font-family="Lato,sans-serif">${cardCount} card${cardCount !== 1 ? 's' : ''}</text>
      </g>`
    }

    // Card node — colored stripe + title + badges
    const label = (n.topic || '').slice(0, 35).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    const stripeColor = n.variables?.lane?.variables?.['lane-color'] || s.borderColor || resolvedEdgeColor
    const status  = (n.variables?.['card-status'] || '').slice(0, 18).replace(/&/g,'&amp;')
    const cardType = (n.variables?.['card-type'] || '').slice(0, 14).replace(/&/g,'&amp;')

    return `<g transform="translate(${n.x - ox},${n.y - oy})">
      <rect width="${n.width}" height="${n.height}" rx="${br}" ry="${br}" fill="${bg}" stroke="${bc}" stroke-width="${bw}"/>
      <rect width="${n.width}" height="4" rx="2" ry="2" fill="${stripeColor}"/>
      ${cardType ? `<rect x="6" y="10" width="${cardType.length * 5.5 + 8}" height="13" rx="3" fill="rgba(125,104,200,0.1)"/>
      <text x="10" y="20" font-size="9" fill="#7d68c8" font-family="Lato,sans-serif">${cardType}</text>` : ''}
      ${status ? `<rect x="${cardType ? cardType.length * 5.5 + 20 : 6}" y="10" width="${status.length * 5.5 + 8}" height="13" rx="3" fill="rgba(125,104,200,0.15)"/>
      <text x="${cardType ? cardType.length * 5.5 + 24 : 10}" y="20" font-size="9" fill="#7d68c8" font-family="Lato,sans-serif">${status}</text>` : ''}
      <text x="8" y="${(cardType || status) ? 38 : 22}" font-size="${fs}" font-weight="${fw}" fill="${textCol}" font-family="Lato,sans-serif">${label}</text>
    </g>`
  }).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bgColor}"/>
  <g transform="translate(${-ox},${-oy})">
    ${edgePaths}
    ${nodeSVGs}
  </g>
</svg>`
}
function exportSVG() {
  showExportMenu.value = false
  const svgStr = buildExportSVG()
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  const link = document.createElement('a')
  link.download = `mindmap-${Date.now()}.svg`
  link.href = URL.createObjectURL(blob)
  link.click()
  showHint('SVG Exported')
}

function exportJSON() {
  showExportMenu.value = false
  const root = nodeMap.get(rootNodeId.value)
  if (!root) return
  function serializeNode(n: MindNode): any {
    return {
      id: n.real_id || n.id,
      topic: n.topic,
      type: n.uniqueName,
      style: n.style,
      variables: n.variables,
      hyperLink: n.hyperLink,
      children: (n.children || []).map(serializeNode),
    }
  }
  const data = { exportedAt: new Date().toISOString(), layout: layoutDirection.value, tree: serializeNode(root) }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `mindmap-${Date.now()}.json`
  link.href = URL.createObjectURL(blob)
  link.click()
  showHint('JSON Exported')
}
const getNodeTitle = (topic: string) =>
  route.path.includes('/talent') && topic === 'All sheet'
    ? localStorage.getItem('currentTalent') === 'agents'
      ? 'All Agents'
      : 'All Talent'
    : topic
</script>

<style scoped>
.mindmap-root {
  background: var(--mm-bg, var(--bg-surface, #dedfe3));
  font-family: "Lato", sans-serif;
}

.viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--mm-bg, var(--bg-surface, #dedfe3));
  background-image:
    linear-gradient(
      var(--mindmap-grid, rgba(0, 0, 0, 0.05)) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      var(--mindmap-grid, rgba(0, 0, 0, 0.05)) 1px,
      transparent 1px
    );
  background-size: 20px 20px;
}

.canvas-area {
  position: absolute;
  top: 0;
  left: 0;
}

:fullscreen .mindmap-root,
:-webkit-full-screen .mindmap-root {
  width: 100vw !important;
  height: 100vh !important;
}

.mindmap-root:fullscreen,
.mindmap-root:-webkit-full-screen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
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

.mm-node {
  position: absolute;
  z-index: 2;
  border: 1.5px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}
.mm-node:active {
  cursor: grabbing;
}
.mm-node:hover {
  box-shadow: 0 4px 16px rgba(125, 104, 200, 0.15);
}
.mm-node--selected {
  border-color: var(--primary-color) !important;
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--primary-color), transparent 75%),
    0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

:where(.mm-node--root) {
  background: var(--mm-node-root-bg, #f1eeff);
  color: var(--mm-text-color, #2b2c30);
}
:where(.mm-node--sheet) {
  background: var(--mm-node-sheet-bg, #ede9fb);
  color: var(--mm-text-color, #2b2c30);
}
:where(.mm-node--List) {
  background: var(--mm-node-list-bg, #f3f4f6);
  color: var(--mm-text-color, #2b2c30);
}
:where(.mm-node--card) {
  background: var(--mm-node-card-bg, var(--bg-card, #ffffff));
  color: var(--mm-text-color, var(--text-primary, #2b2c30));
}

.mm-node--root {
  border-radius: 28px;
  border-color: var(--primary-color);
}
.node-root-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 20px;
  background: var(--primary-color) !important;
}
.node-root-icon {
  font-size: 18px;
  opacity: 0.75;
  flex-shrink: 0;
  color: var(--primary-color, #6e3b96);
}
.node-root-title {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.mm-node--sheet {
  border-color: var(--primary-color);
  border-radius: 10px;
}
.node-sheet-inner {
  height: 100%;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.node-sheet-header {
  display: flex;
  align-items: center;
  gap: 7px;
}
.node-sheet-icon {
  color: var(--primary-color, #6e3b96);
  font-size: 13px;
  flex-shrink: 0;
}
.node-sheet-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-sheet-meta {
  display: flex;
  gap: 6px;
}
.meta-pill {
  font-size: 10px;
  color: inherit;
  opacity: 0.65;
  background: rgba(125, 104, 200, 0.1);
  border-radius: 20px;
  padding: 1px 8px;
}

.mm-node--List {
  border-color: var(--border, #d9d9d9);
  border-radius: 8px;
  overflow: visible;
}
.node-list-inner {
  height: 100%;
  padding: 8px 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.node-list-header {
  display: flex;
  align-items: center;
  gap: 7px;
}
.node-list-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  flex-shrink: 0;
}
.node-list-title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mm-node--card {
  height: auto !important;
  transition: all 0.2s ease;
}
.mm-node--card:hover {
  z-index: 10;
}
.node-card-stripe {
  height: 4px;
  flex-shrink: 0;
  border-radius: 6px 6px 0 0;
}

.node-card-body {
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  gap: 4px;
  background: var(--mm-node-card-bg, var(--bg-card, #ffffff));
}
.node-card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  min-height: 14px;
}

.card-badge {
  font-size: 9.5px;
  font-weight: 500;
  border-radius: 4px;
  padding: 1px 7px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.card-badge--type {
  background: rgba(125, 104, 200, 0.08);
  color: inherit;
  opacity: 0.75;
}
.card-badge--status {
  background: rgba(125, 104, 200, 0.12);
  color: var(--primary-color);
}
.card-badge--low     { background: #dcfce7; color: #16a34a; }
.card-badge--medium  { background: #fef9c3; color: #a16207; }
.card-badge--high    { background: #fee2e2; color: #dc2626; }
.card-badge--critical{ background: #2b2c30; color: #f5f5f5; }
.card-badge--process {
  background: rgba(125, 104, 200, 0.1);
  color: var(--primary-color);
}

.node-card-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.node-card-title {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.35;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;

  overflow: hidden;
  word-break: break-word;
}
.node-card-title--expanded {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}

.node-card-more-btn {
  margin-top: 3px;
  border: none;
  background: transparent;
  color: var(--primary-color);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  align-self: flex-start;
}
.node-card-more-btn:hover {
  opacity: 1;
  text-decoration: underline;
}
.node-card-actions-row {
  display: flex;
  align-items: center;
  gap: 4px;

  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid rgba(0,0,0,.06);

  opacity: 0;
  max-height: 0;

  overflow: hidden;

  transition:
    opacity .15s ease,
    max-height .15s ease,
    margin-top .15s ease;
}
.mm-node--card:hover .node-card-actions-row {
  opacity: 1;
  max-height: 40px;
}
.node-card-wrapper {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  height: 80%;
}

/* Dark mode */
.mindmap-root[data-dark="true"] .node-card-actions-row {
  background: var(--mm-node-card-bg, #2c2c2b);
  border-color: var(--primary-color);
  border-top-color: rgba(255, 255, 255, 0.08);
}
/* ── END CARD NODE FIXES ─────────────────────────────────────────────── */

.node-list-count {
  font-size: 10px;
  color: inherit;
  opacity: 0.6;
  padding-left: 15px;
}

.node-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.mm-node:hover .node-actions {
  opacity: 1;
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
  color: inherit;
  opacity: 0.65;
  flex-shrink: 0;
  transition:
    background 0.12s,
    opacity 0.12s,
    color 0.12s;
}
.nact:hover {
  background: rgba(125, 104, 200, 0.1);
  opacity: 1;
}
.nact--danger:hover {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.08) !important;
}
.nact--open:hover {
  color: var(--primary-color) !important;
}
.nact--add {
  background: var(--primary-color) !important;
  color: #ffffff !important;
  border-radius: 4px;
  height: 15px;
  width:15px;
  padding: 7px;
  font-size: 9px;
  opacity: 1 !important;
}
.nact--add:hover {
  opacity: 0.85 !important;
  background: var(--secondary-color, var(--primary-color)) !important;
  color: #ffffff !important;
}

.list-add-card-btn {
  display: none;
  width: 100%;
  margin-top: 4px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  background: rgba(var(--primary-color), 0.07);
  border: 1px dashed rgba(var(--primary-color), 0.3);
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.12s,
    border-color 0.12s;
  align-items: center;
  gap: 5px;
}
.list-add-card-btn i {
  font-size: 9px;
}
.mm-node--List:hover .list-add-card-btn {
  display: flex;
}
.list-add-card-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.inline-create-card {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  z-index: 10;
}
.inline-card-input {
  width: 100%;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary, #2b2c30);
  background: var(--bg-card, #fff);
  border: 1.5px solid var(--primary-color);
  border-radius: 5px;
  outline: none;
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 85%);
  box-sizing: border-box;
}
.inline-card-input::placeholder {
  color: var(--text-secondary, #6b6b6e);
  font-weight: normal;
}
.inline-card-actions {
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
  transition: background 0.12s;
}
.inline-btn--confirm {
  background: var(--primary-color);
  color: #fff;
}
.inline-btn--confirm:hover:not(:disabled) {
  background: var(--primary-color);
}
.inline-btn--confirm:disabled {
  background: var(--primary-color);
  cursor: not-allowed;
}
.inline-btn--cancel {
  background: var(--bg-surface, #dedfe3);
  color: var(--text-secondary, #6b6b6e);
}
.inline-btn--cancel:hover {
  background: var(--border, #d9d9d9);
}

.node-collapsed-badge {
  font-size: 9px;
  color: inherit;
  opacity: 0.6;
  margin-top: 2px;
}
.node-link {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 9px;
  color: inherit;
  text-decoration: none;
  opacity: 0.5;
}
.node-link:hover {
  opacity: 1;
}

.canvas-placeholder {
  position: absolute;
  top: 200px;
  left: 400px;
  transform: translate(-50%, 0);
  text-align: center;
  pointer-events: none;
}

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
  margin: 1px 0;
}
.zoom-label {
  font-size: 9px !important;
  font-weight: 700 !important;
  color: var(--text-secondary, #6b6b6e) !important;
  letter-spacing: 0.03em;
}

.canvas-stats {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-secondary, #6b6b6e);
  background: var(--bg-card, rgba(255, 255, 255, 0.9));
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 8px;
  padding: 4px 12px;
  z-index: 100;
  backdrop-filter: blur(6px);
}

.format-sidebar {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border, #d9d9d9);
  background: var(--bg-card, #fff);
  overflow: hidden;
  font-size: 13px !important;
  font-weight: normal !important;
  font-style: normal !important;
  font-family: "Lato", sans-serif !important;
  color: var(--text-primary, #2b2c30) !important;
  text-align: left !important;
  opacity: 1 !important;
}
.fs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  flex-shrink: 0;
}
.fs-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: var(--text-primary, #2b2c30) !important;
  font-style: normal !important;
  font-family: "Lato", sans-serif !important;
}
.fs-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-secondary, #6b6b6e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.fs-close:hover {
  background: var(--bg-surface, #dedfe3);
  color: var(--text-primary, #2b2c30);
}

.fs-node-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 6px;
  font-size: 13px !important;
  font-weight: normal !important;
  color: var(--text-primary, #2b2c30) !important;
  font-family: "Lato", sans-serif !important;
  font-style: normal !important;
  border-bottom: 1px solid var(--border, #d9d9d9);
}
.fs-node-icon {
  font-size: 10px;
  flex-shrink: 0;
}
.fs-icon--root { color: var(--primary-color); }
.fs-icon--sheet { color: var(--primary-color); }
.fs-icon--List { color: var(--primary-color); }
.fs-icon--card { color: var(--primary-color); }

.fs-node-label {
  flex: 1;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--text-primary, #2b2c30) !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fs-node-type {
  font-size: 9px !important;
  font-weight: 500 !important;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary, #6b6b6e) !important;
  background: var(--bg-surface, #dedfe3);
  border-radius: 4px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.fs-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary, #6b6b6e);
  font-size: 12px;
  text-align: center;
  line-height: 1.6;
}

.fs-body {
  flex: 1;
  overflow-y: auto;
}
.fs-body::-webkit-scrollbar {
  width: 5px;
}
.fs-body::-webkit-scrollbar-track {
  background: transparent;
}
.fs-body::-webkit-scrollbar-thumb {
  background: var(--border, #d9d9d9);
  border-radius: 3px;
}

.fs-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, #d9d9d9);
}
.fs-section-label {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, #6b6b6e) !important;
  margin-bottom: 8px;
  font-style: normal !important;
  font-family: "Lato", sans-serif !important;
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
}
.fs-field label {
  font-size: 10.5px !important;
  font-weight: 500 !important;
  color: var(--text-secondary, #6b6b6e) !important;
  font-style: normal !important;
}

.fs-input {
  width: 100%;
  padding: 4px 6px;
  background: var(--bg-surface, #dedfe3) !important;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 5px;
  font-size: 12px !important;
  color: var(--text-primary, #2b2c30) !important;
  font-weight: normal !important;
  font-style: normal !important;
  outline: none;
}
.fs-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 85%);
}

.fs-input-full {
  width: 100%;
  padding: 5px 8px;
  background: var(--bg-surface, #dedfe3) !important;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 5px;
  font-size: 12px !important;
  color: var(--text-primary, #2b2c30) !important;
  font-weight: normal !important;
  font-style: normal !important;
  outline: none;
  box-sizing: border-box;
}
.fs-input-full:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 85%);
}

.fs-select {
  width: 100%;
  padding: 4px 6px;
  background: var(--bg-surface, #dedfe3) !important;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 5px;
  font-size: 11.5px !important;
  color: var(--text-primary, #2b2c30) !important;
  font-weight: normal !important;
  font-style: normal !important;
  outline: none;
}
.fs-select:focus {
  border-color: var(--primary-color);
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}
.input-with-unit .fs-input {
  padding-right: 26px;
}
.unit {
  position: absolute;
  right: 6px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-secondary, #6b6b6e);
  pointer-events: none;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.color-swatch input[type="color"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
.color-hex {
  flex: 1;
  padding: 4px 6px;
  font-size: 11px;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 5px;
  color: var(--text-primary, #2b2c30);
  font-family: monospace;
}

.fs-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.preset-swatch {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  cursor: pointer;
  border: 2px solid transparent;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}
.preset-swatch:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-group-row {
  display: flex;
  gap: 4px;
}
.align-btn {
  flex: 1;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #6b6b6e);
  transition: all 0.12s;
}
.align-btn:hover,
.align-btn--active {
  background: var(--primary-color);
  color: var(--primary-color, #fff);
  border-color: var(--primary-color);
}

.shadow-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.shadow-btn {
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 5px;
  cursor: pointer;
  color: var(--text-primary, #2b2c30);
  transition: all 0.12s;
}
.shadow-btn:hover,
.shadow-btn--active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.fs-reset-btn {
  width: 100%;
  padding: 6px;
  font-size: 11px;
  color: var(--text-secondary, #6b6b6e);
  background: transparent;
  border: 1px dashed var(--border, #d9d9d9);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s;
}
.fs-reset-btn:hover {
  border-color: #f87171;
  color: #ef4444;
  background: #fef2f2;
}

.fs-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--border, #d9d9d9);
  flex-shrink: 0;
}
.fs-save-btn {
  width: 100%;
  padding: 8px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition:
    opacity 0.15s,
    box-shadow 0.15s;
}
.fs-save-btn:hover:not(:disabled) {
  background: var(--primary-color);
  box-shadow: 0 4px 12px
    color-mix(in srgb, var(--primary-color), transparent 65%);
}
.fs-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.list-sheet-picker {
  margin-top: 6px;
  background: var(--bg-surface, #dedfe3);
  border: 1px dashed rgba(125, 104, 200, 0.35);
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.list-sheet-picker-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px !important;
  font-weight: 600 !important;
  color: var(--primary-color) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.add-list-panel {
  position: absolute;
  top: 160px;
  left: 280px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 200;
  min-width: 320px;
}
.add-list-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 6px;
  outline: none;
  background: var(--bg-surface, #dedfe3);
  color: var(--text-primary, #2b2c30);
}
.add-list-input:focus {
  border-color: var(--primary-color);
}
.add-list-btn {
  padding: 6px 16px;
  background: var(--primary-color);
  color: var(--primary-color, #fff);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.add-list-btn:hover {
  background: var(--primary-color);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-card {
  background: var(--bg-card, #fff);
  border-radius: 14px;
  padding: 24px;
  width: 340px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--text-primary, #2b2c30);
}
.modal-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 7px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  background: var(--bg-surface, #dedfe3);
  color: var(--text-primary, #2b2c30);
}
.modal-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 85%);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.modal-btn-cancel {
  padding: 7px 16px;
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 7px;
  background: var(--bg-surface, #dedfe3);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary, #6b6b6e);
}
.modal-btn-confirm {
  padding: 7px 16px;
  background: var(--primary-color);
  color: var(--primary-color, #fff);
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.modal-btn-confirm:hover:not(.disabled) {
  background: var(--primary-color);
}
.modal-btn-confirm.disabled {
  background: color-mix(in srgb, var(--primary-color), transparent 60%);
  cursor: not-allowed;
}

.card-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 10px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 6px;
  min-width: 200px;
  font-size: 13px !important;
  font-weight: normal !important;
  font-style: normal !important;
  color: var(--text-primary, #2b2c30) !important;
  font-family: "Lato", sans-serif !important;
}
.ctx-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px 8px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  margin-bottom: 4px;
}
.ctx-header-icon {
  color: var(--primary-color);
  font-size: 12px;
  flex-shrink: 0;
}
.ctx-header-title {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: var(--text-primary, #2b2c30) !important;
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
  font-size: 12px !important;
  font-weight: 500 !important;
  color: var(--text-primary, #2b2c30) !important;
  transition: background 0.1s;
}
.ctx-item:hover {
  background: var(--bg-surface, #dedfe3);
}
.ctx-item--danger {
  color: #ef4444 !important;
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
.ctx-icon--add { color: #22c55e; }
.ctx-icon--open { color: var(--primary-color); }
.ctx-icon--format { color: var(--primary-color); }
.ctx-item--danger .ctx-item-icon { color: #ef4444; }

.ctx-kbd {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 9px !important;
  font-weight: 500 !important;
  color: var(--text-secondary, #6b6b6e) !important;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: monospace !important;
}
.ctx-divider {
  height: 1px;
  background: var(--border, #d9d9d9);
  margin: 4px 0;
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

.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
  transition:
    width 0.22s ease,
    opacity 0.22s ease;
}
.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  width: 0 !important;
  opacity: 0;
}

/* ── Dark mode ─────────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] {
  background: var(--bg-surface, #1a1a1a);
}
.mindmap-root[data-dark="true"] .viewport {
  background: var(--bg-surface, #1a1a1a);
  --mindmap-grid: rgba(255, 255, 255, 0.03);
  background-image:
    linear-gradient(var(--mindmap-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--mindmap-grid) 1px, transparent 1px);
  background-size: 20px 20px;
}

.mindmap-root[data-dark="true"] :where(.mm-node--root) {
  background: var(--bg-surface, #27272a);
  color: var(--text-primary, #f5f5f5);
}
.mindmap-root[data-dark="true"] :where(.mm-node--sheet) {
  background: var(--bg-card, #2b2c30);
  color: var(--text-secondary, #b0b0b0);
}
.mindmap-root[data-dark="true"] .mm-node--List {
  background: var(--mm-node-list-bg, #1f1f1e) !important;
  color: var(--mm-text-color, #b0b0b0) !important;
}
.mindmap-root[data-dark="true"] .mm-node--card {
  background: var(--mm-node-card-bg, #2c2c2b) !important;
  color: var(--mm-text-color, #f5f5f5) !important;
}
.mindmap-root[data-dark="true"] .mm-node--sheet {
  background: var(--mm-node-sheet-bg, #2c2c2b) !important;
  color: var(--mm-text-color, #b0b0b0) !important;
}
.mindmap-root[data-dark="true"] .mm-node--sheet {
  border-color: var(--border, #3e3e42);
}
.mindmap-root[data-dark="true"] .mm-node--List {
  border-color: var(--border, #3e3e42);
}
.mindmap-root[data-dark="true"] .mm-node--card {
  border-color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .mm-node {
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}
.mindmap-root[data-dark="true"] .mm-node:hover {
  box-shadow: 0 4px 20px rgba(147, 86, 197, 0.2);
}
.mindmap-root[data-dark="true"] .node-root-icon {
  color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .node-sheet-icon {
  color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .meta-pill {
  background: var(--bg-surface, rgba(147, 86, 197, 0.15));
}
.mindmap-root[data-dark="true"] .node-list-dot {
  background: var(--primary-color);
}
.mindmap-root[data-dark="true"] .card-badge--status {
  background: var(--bg-surface);
  color: var(--text-primary);
}
.mindmap-root[data-dark="true"] .card-badge--low {
  background: #052e16;
  color: #86efac;
}
.mindmap-root[data-dark="true"] .card-badge--medium {
  background: #422006;
  color: #fde68a;
}
.mindmap-root[data-dark="true"] .card-badge--high {
  background: #450a0a;
  color: #fca5a5;
}
.mindmap-root[data-dark="true"] .card-badge--critical {
  background: #f5f5f5;
  color: #2b2c30;
}
.mindmap-root[data-dark="true"] .card-badge--process {
  background: var(--bg-surface);
  color: var(--text-primary);
}
.mindmap-root[data-dark="true"] .card-badge--type {
  background: rgba(255, 255, 255, 0.07);
}
.mindmap-root[data-dark="true"] .card-link {
  color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .node-card-footer {
  border-color: rgba(255, 255, 255, 0.07);
}
.mindmap-root[data-dark="true"] .node-card-body {
  background: var(--mm-node-card-bg, #2c2c2b);
}
.mindmap-root[data-dark="true"] .node-card-actions-row {
  background: var(--mm-node-card-bg, #2c2c2b);
  border-color: var(--primary-color);
  border-top-color: rgba(255, 255, 255, 0.08);
}
.mindmap-root[data-dark="true"] .canvas-controls {
  background: var(--bg-card, #2b2c30);
  border-color: var(--border, #3e3e42);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
.mindmap-root[data-dark="true"] .ctrl-btn {
  border-color: var(--border, #3e3e42);
  color: var(--text-secondary, #b0b0b0);
}
.mindmap-root[data-dark="true"] .ctrl-btn:hover,
.mindmap-root[data-dark="true"] .ctrl-btn--active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .ctrl-divider {
  background: #3e3e42;
}
.mindmap-root[data-dark="true"] .zoom-label {
  color: #b0b0b0 !important;
}
.mindmap-root[data-dark="true"] .canvas-stats {
  background: rgba(13, 13, 13, 0.85);
  border-color: #3e3e42;
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .nact:hover {
  background: rgba(147, 86, 197, 0.15);
}
.mindmap-root[data-dark="true"] .inline-card-input {
  background: var(--bg-card, #2b2c30);
  color: var(--text-primary, #f5f5f5);
  border-color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .inline-card-input::placeholder {
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .inline-btn--confirm {
  background: var(--primary-color);
}
.mindmap-root[data-dark="true"] .inline-btn--cancel {
  background: var(--bg-surface, #1a1a1a);
  color: var(--text-secondary, #b0b0b0);
}
.mindmap-root[data-dark="true"] .inline-btn--cancel:hover {
  background: var(--border, #3e3e42);
}
.mindmap-root[data-dark="true"] .list-add-card-btn {
  color: #fff;
  background: var(--primary-color);
  border: 1px dashed var(--primary-color);
}
.mindmap-root[data-dark="true"] .format-sidebar {
  background: var(--bg-card, #2b2c30) !important;
  border-color: var(--border, #3e3e42) !important;
  color: var(--text-primary, #f5f5f5) !important;
}
.mindmap-root[data-dark="true"] .fs-header {
  border-color: var(--border, #3e3e42);
}
.mindmap-root[data-dark="true"] .fs-header-left {
  color: var(--text-primary, #f5f5f5) !important;
}
.mindmap-root[data-dark="true"] .fs-close {
  color: var(--text-secondary, #b0b0b0);
}
.mindmap-root[data-dark="true"] .fs-close:hover {
  background: var(--bg-surface, #3e3e42);
  color: var(--text-primary, #f5f5f5);
}
.mindmap-root[data-dark="true"] .fs-node-name {
  color: var(--text-primary, #f5f5f5) !important;
  border-color: var(--border, #3e3e42);
}
.mindmap-root[data-dark="true"] .fs-node-label {
  color: #f5f5f5 !important;
}
.mindmap-root[data-dark="true"] .fs-node-type {
  background: #3e3e42;
  color: #b0b0b0 !important;
}
.mindmap-root[data-dark="true"] .fs-empty {
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .fs-section {
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .fs-section-label {
  color: #b0b0b0 !important;
}
.mindmap-root[data-dark="true"] .fs-field label {
  color: #b0b0b0 !important;
}
.mindmap-root[data-dark="true"] .fs-input {
  background: var(--bg-surface, #1a1a1a) !important;
  border-color: var(--border, #3e3e42) !important;
  color: var(--text-primary, #f5f5f5) !important;
}
.mindmap-root[data-dark="true"] .fs-input-full {
  background: var(--bg-surface, #1a1a1a) !important;
  border-color: var(--border, #3e3e42) !important;
  color: var(--text-primary, #f5f5f5) !important;
}
.mindmap-root[data-dark="true"] .fs-select {
  background: var(--bg-surface, #1a1a1a) !important;
  border-color: var(--border, #3e3e42) !important;
  color: var(--text-primary, #f5f5f5) !important;
}
.mindmap-root[data-dark="true"] .color-hex {
  background: #1a1a1a;
  border-color: #3e3e42;
  color: #f5f5f5;
}
.mindmap-root[data-dark="true"] .align-btn {
  background: #1a1a1a;
  border-color: #3e3e42;
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .shadow-btn {
  background: #1a1a1a;
  border-color: #3e3e42;
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .fs-reset-btn {
  border-color: #3e3e42;
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .fs-reset-btn:hover {
  background: #450a0a;
  color: #f87171;
  border-color: #7f1d1d;
}
.mindmap-root[data-dark="true"] .fs-footer {
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .unit {
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .fs-body::-webkit-scrollbar-thumb {
  background: #3e3e42;
}

.card-ctx-menu--dark {
  background: var(--bg-card, #2b2c30) !important;
  border-color: var(--border, #3e3e42) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
  color: var(--text-primary, #f5f5f5) !important;
}
.card-ctx-menu--dark .ctx-header {
  border-color: #3e3e42;
}
.card-ctx-menu--dark .ctx-header-title {
  color: #f5f5f5 !important;
}
.card-ctx-menu--dark .ctx-item {
  color: #b0b0b0 !important;
}
.card-ctx-menu--dark .ctx-item:hover {
  background: #3e3e42;
}
.card-ctx-menu--dark .ctx-item--danger {
  color: #f87171 !important;
}
.card-ctx-menu--dark .ctx-item--danger:hover {
  background: #450a0a;
}
.card-ctx-menu--dark .ctx-divider {
  background: #3e3e42;
}
.card-ctx-menu--dark .ctx-kbd {
  background: #3e3e42;
  border-color: #3e3e42;
  color: #b0b0b0 !important;
}

.mindmap-root[data-dark="true"] .add-list-panel {
  background: var(--bg-card, #2b2c30);
  border-color: var(--border, #3e3e42);
}
.mindmap-root[data-dark="true"] .add-list-input {
  background: var(--bg-surface, #1a1a1a);
  border-color: var(--border, #3e3e42);
  color: var(--text-primary, #f5f5f5);
}

/* ── Shortcut hint ───────────────────────────────────────────────────── */
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

/* ── Shortcuts legend ────────────────────────────────────────────────── */
.shortcuts-legend {
  position: absolute;
  bottom: 20px;
  left: 66px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  z-index: 100;
  background: var(--bg-card, rgba(255, 255, 255, 0.88));
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 10px;
  padding: 8px 10px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}
.sl-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: var(--text-secondary, #6b6b6e);
}
.sl-row kbd {
  font-size: 9px;
  font-weight: 600;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: monospace;
  color: var(--text-primary, #2b2c30);
  white-space: nowrap;
}
.mindmap-root[data-dark="true"] .shortcuts-legend {
  background: rgba(27, 27, 32, 0.9);
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .sl-row kbd {
  background: #3e3e42;
  border-color: #555;
  color: #f5f5f5;
}

/* ── Theme Panel ─────────────────────────────────────────────────────── */
.theme-panel {
  flex: 1;
  overflow-y: auto;
}
.theme-panel::-webkit-scrollbar {
  width: 5px;
}
.theme-panel::-webkit-scrollbar-thumb {
  background: var(--border, #d9d9d9);
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
  transition:
    transform 0.1s,
    box-shadow 0.1s;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.bg-swatch:hover {
  transform: scale(1.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.bg-swatch--active {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 60%) !important;
}

.bg-custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 6px 8px;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 7px;
}
.bg-hex-label {
  font-size: 11px;
  color: var(--text-secondary, #6b6b6e);
  font-family: monospace;
}
.bg-hex-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11px;
  font-family: monospace;
  color: var(--text-primary, #2b2c30);
  min-width: 0;
}
.bg-opacity-label {
  font-size: 10px;
  color: var(--text-secondary, #6b6b6e);
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
}
.bg-recent {
  margin-top: 8px;
}
.bg-recent-label {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-secondary, #6b6b6e);
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
  border: 2px solid var(--border, #d9d9d9);
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 4px 5px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  overflow: hidden;
}
.theme-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 10px
    color-mix(in srgb, var(--primary-color), transparent 80%);
}
.theme-card--active {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 70%) !important;
}
.theme-preview {
  position: relative;
  width: 100%;
  height: 44px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
  color: var(--text-secondary, #6b6b6e);
  text-align: center;
  line-height: 1;
}
.theme-check {
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
  padding: 10px 12px 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--text-secondary, #94a3b8);
}

.mindmap-root[data-dark="true"] .bg-custom-row {
  background: var(--bg-surface, #1a1a1a);
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .bg-hex-input {
  color: #f5f5f5;
}
.mindmap-root[data-dark="true"] .bg-opacity-label {
  background: #3e3e42;
  border-color: #555;
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .bg-recent-label {
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .theme-card {
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .theme-name {
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .theme-panel::-webkit-scrollbar-thumb {
  background: #3e3e42;
}

/* ── Format sidebar tabs ─────────────────────────────────────────────── */
.fs-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border, #d9d9d9);
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
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: var(--text-secondary, #6b6b6e) !important;
  transition:
    color 0.15s,
    border-color 0.15s;
  margin-bottom: -1px;
}
.fs-tab:hover {
  color: var(--text-primary, #2b2c30) !important;
}
.fs-tab--active {
  color: var(--primary-color) !important;
  border-bottom-color: var(--primary-color);
}

/* ── Layout cards grid ───────────────────────────────────────────────── */
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
  border: 2px solid var(--border, #d9d9d9);
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
  box-shadow: 0 2px 10px
    color-mix(in srgb, var(--primary-color), transparent 80%);
}
.layout-card--active {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--primary-color), transparent 70%) !important;
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
  color: var(--text-secondary, #6b6b6e);
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

.mindmap-root[data-dark="true"] .fs-tabs {
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .fs-tab {
  color: #b0b0b0 !important;
}
.mindmap-root[data-dark="true"] .fs-tab:hover {
  color: #f5f5f5 !important;
}
.mindmap-root[data-dark="true"] .fs-tab--active {
  color: var(--primary-color) !important;
  border-bottom-color: var(--primary-color);
}
.mindmap-root[data-dark="true"] .layout-card {
  border-color: #3e3e42;
}
.mindmap-root[data-dark="true"] .layout-preview {
  background: #1a1a1a;
}
.mindmap-root[data-dark="true"] .layout-name {
  color: #b0b0b0;
}
.mindmap-root[data-dark="true"] .layout-check {
  background: #2b2c30;
  color: var(--primary-color);
}

.mm-node--root:not([style*="background"]) .node-root-inner {
  background: var(--mm-node-root-bg, var(--primary-color)) !important;
}
.mm-node--sheet:not([style*="background"]) {
  background: var(--mm-node-sheet-bg, var(--bg-surface)) !important;
}
.mm-node--List:not([style*="background"]) {
  background: var(--mm-node-list-bg, var(--bg-card)) !important;
}
.mm-node--card:not([style*="background"]) .node-card-body {
  background: var(--mm-node-card-bg, var(--bg-card)) !important;
}
/* ── Node group wrapper ─────────────────────────────────────────────── */
.mm-node-group {
  position: absolute;
  pointer-events: none; /* group itself doesn't capture - children do */
}
.mm-node-group > .mm-node {
  position: relative !important;
  left: unset !important;
  top: unset !important;
  pointer-events: auto;
  display: inline-block;
}

/* ── Collapse toggle (inside group, on node edge) ───────────────────── */
.collapse-toggle {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  background: var(--bg-card, #fff);
  color: var(--primary-color);
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  pointer-events: auto;
  /* Hidden by default, shown on group hover */
  opacity: 0;
  transform: scale(0.7);
  transition: opacity 0.18s ease, transform 0.18s ease, background 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.collapse-toggle--visible {
  opacity: 1;
  transform: scale(1);
}
.collapse-toggle:hover {
  background: var(--primary-color);
  color: #fff;
}
.mindmap-root[data-dark="true"] .collapse-toggle {
  background: var(--bg-card, #2b2c30);
}
/* ── Multi-select ────────────────────────────────────────────────────── */
.mm-node--multi-selected {
  border-color: var(--primary-color) !important;
  outline: 2px dashed var(--primary-color);
  outline-offset: 2px;
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--primary-color), transparent 70%),
    0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

.ctrl-btn--multi {
  position: relative;
  background: var(--primary-color) !important;
  color: #fff !important;
  border-color: var(--primary-color) !important;
}
.multi-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 4px;
  min-width: 14px;
  text-align: center;
  line-height: 1.4;
}

/* ── Multi-format panel ──────────────────────────────────────────────── */
.multi-format-panel {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border, #d9d9d9);
  background: var(--bg-card, #fff);
  overflow: hidden;
  font-size: 13px !important;
  font-family: "Lato", sans-serif !important;
  color: var(--text-primary, #2b2c30) !important;
}

/* ── Drag & Drop ─────────────────────────────────────────────────────── */
.node-list--drag-over {
  background: color-mix(in srgb, var(--primary-color), transparent 85%) !important;
  border-color: var(--primary-color) !important;
  border-style: dashed !important;
  transition: background 0.15s, border-color 0.15s;
}

.drag-ghost {
  position: absolute;
  background: var(--primary-color);
  color: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
  z-index: 9999;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.92;
}

/* Card dragging cursor */
.mm-node--card[draggable="true"] {
  cursor: grab;
}
.mm-node--card[draggable="true"]:active {
  cursor: grabbing;
  opacity: 0.7;
}

/* Right-click pan cursor hint on viewport */
.viewport {
  cursor: default;
}
/* ── Search Spotlight ────────────────────────────────────────────────── */
.search-overlay {
  position: absolute;
  inset: 0;
  z-index: 800;
  display: flex;
  justify-content: center;
  padding-top: 48px;
  pointer-events: none;
}
.search-panel {
  pointer-events: auto;
  width: 520px;
  max-width: calc(100vw - 48px);
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 420px;
}
.search-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  flex-shrink: 0;
}
.search-icon {
  color: var(--primary-color);
  font-size: 14px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 500;
  background: transparent;
  color: var(--text-primary, #2b2c30);
  font-family: 'Lato', sans-serif;
  min-width: 0;
}
.search-input::placeholder {
  color: var(--text-secondary, #94a3b8);
  font-weight: 400;
}
.search-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color), transparent 88%);
  border-radius: 20px;
  padding: 2px 8px;
  white-space: nowrap;
  flex-shrink: 0;
}
.search-close-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--bg-surface, #dedfe3);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary, #6b6b6e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  transition: background 0.12s;
}
.search-close-btn:hover {
  background: var(--border, #d9d9d9);
}
.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.search-results::-webkit-scrollbar { width: 5px; }
.search-results::-webkit-scrollbar-thumb { background: var(--border, #d9d9d9); border-radius: 3px; }
.search-result-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.search-result-item:hover {
  background: color-mix(in srgb, var(--primary-color), transparent 92%);
}
.search-result-icon {
  font-size: 13px;
  color: var(--primary-color);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.search-result-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.search-result-topic {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #2b2c30);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-result-type {
  font-size: 10px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 500;
  text-transform: capitalize;
}
.search-result-enter {
  flex-shrink: 0;
}
.search-result-enter kbd {
  font-size: 10px;
  background: var(--bg-surface, #dedfe3);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--text-secondary, #6b6b6e);
}
.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-secondary, #94a3b8);
  font-size: 13px;
}
.search-footer {
  display: flex;
  gap: 14px;
  padding: 8px 16px;
  border-top: 1px solid var(--border, #d9d9d9);
  background: var(--bg-surface, #f8fafc);
  flex-shrink: 0;
}
.search-footer span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 500;
}
.search-footer kbd {
  font-size: 9.5px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--text-primary, #2b2c30);
  font-family: monospace;
}
.search-drop-enter-active, .search-drop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.search-drop-enter-from, .search-drop-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}

/* Dark mode search */
.mindmap-root[data-dark="true"] .search-panel {
  background: var(--bg-card, #2b2c30);
  border-color: #3e3e42;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.mindmap-root[data-dark="true"] .search-header { border-color: #3e3e42; }
.mindmap-root[data-dark="true"] .search-input { color: #f5f5f5; }
.mindmap-root[data-dark="true"] .search-close-btn { background: #3e3e42; color: #b0b0b0; }
.mindmap-root[data-dark="true"] .search-result-item:hover { background: rgba(147,86,197,0.15); }
.mindmap-root[data-dark="true"] .search-result-topic { color: #f5f5f5; }
.mindmap-root[data-dark="true"] .search-result-enter kbd { background: #3e3e42; border-color: #555; color: #b0b0b0; }
.mindmap-root[data-dark="true"] .search-footer { background: #1a1a1a; border-color: #3e3e42; }
.mindmap-root[data-dark="true"] .search-footer kbd { background: #2b2c30; border-color: #555; }
.mindmap-root[data-dark="true"] .search-results::-webkit-scrollbar-thumb { background: #3e3e42; }

/* ── Export Menu ─────────────────────────────────────────────────────── */
.export-menu {
  position: absolute;
  top: 16px;
  right: 60px;
  z-index: 600;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14);
  width: 260px;
  overflow: hidden;
}
.export-menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #2b2c30);
}
.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border, #efefef);
}
.export-item:last-child { border-bottom: none; }
.export-item:hover:not(:disabled) { background: var(--bg-surface, #f8fafc); }
.export-item:disabled { opacity: 0.6; cursor: not-allowed; }
.export-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.export-item-icon--png { background: #fef3c7; color: #d97706; }
.export-item-icon--svg { background: #dbeafe; color: #2563eb; }
.export-item-icon--json { background: #d1fae5; color: #059669; }
.export-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.export-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary, #2b2c30); }
.export-item-desc { font-size: 10.5px; color: var(--text-secondary, #94a3b8); }

.mindmap-root[data-dark="true"] .export-menu {
  background: var(--bg-card, #2b2c30);
  border-color: #3e3e42;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
.mindmap-root[data-dark="true"] .export-menu-header { border-color: #3e3e42; color: #f5f5f5; }
.mindmap-root[data-dark="true"] .export-item { border-color: #3e3e42; }
.mindmap-root[data-dark="true"] .export-item:hover:not(:disabled) { background: #3e3e42; }
.mindmap-root[data-dark="true"] .export-item-name { color: #f5f5f5; }

/* ── Shortcuts Panel ─────────────────────────────────────────────────── */
.shortcuts-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 600;
  width: 320px;
  max-height: calc(100% - 80px);
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #d9d9d9);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #2b2c30);
  flex-shrink: 0;
}
.sp-body {
  overflow-y: auto;
  padding: 8px 0;
}
.sp-body::-webkit-scrollbar { width: 4px; }
.sp-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.sp-group {
  padding: 8px 14px;
  border-bottom: 1px solid var(--border, #efefef);
}
.sp-group:last-child { border-bottom: none; }
.sp-group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--primary-color);
  margin-bottom: 7px;
}
.sp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  font-size: 11.5px;
  color: var(--text-primary, #2b2c30);
}
.sp-row kbd {
  font-size: 9.5px;
  font-weight: 600;
  background: var(--bg-surface, #f3f4f6);
  border: 1px solid var(--border, #d9d9d9);
  border-bottom: 2px solid var(--border, #c9cacc);
  border-radius: 5px;
  padding: 2px 7px;
  font-family: monospace;
  color: var(--text-primary, #2b2c30);
  white-space: nowrap;
  flex-shrink: 0;
}
.sp-row span {
  color: var(--text-secondary, #6b6b6e);
  font-size: 11px;
  text-align: right;
}

.mindmap-root[data-dark="true"] .shortcuts-panel {
  background: var(--bg-card, #2b2c30);
  border-color: #3e3e42;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
.mindmap-root[data-dark="true"] .sp-header { border-color: #3e3e42; color: #f5f5f5; }
.mindmap-root[data-dark="true"] .sp-group { border-color: #3e3e42; }
.mindmap-root[data-dark="true"] .sp-row { color: #f5f5f5; }
.mindmap-root[data-dark="true"] .sp-row kbd { background: #3e3e42; border-color: #555; border-bottom-color: #222; color: #f5f5f5; }
.mindmap-root[data-dark="true"] .sp-row span { color: #b0b0b0; }
.mindmap-root[data-dark="true"] .sp-body::-webkit-scrollbar-thumb { background: #3e3e42; }

/* ── Undo/Redo controls ──────────────────────────────────────────────── */
.undo-redo-controls {
  position: absolute;
  top: 16px;
  left: 62px;
  display: flex;
  gap: 4px;
  z-index: 100;
}
.undo-redo-controls .ctrl-btn {
  position: relative;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.undo-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--primary-color);
  color: #fff;
  font-size: 7.5px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 3px;
  min-width: 12px;
  text-align: center;
  line-height: 1.4;
}
.ctrl-btn--disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

/* ── Toolbar (top-right) ─────────────────────────────────────────────── */
.mm-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 500;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 10px;
  padding: 5px 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: right 0.22s ease; /* ADD THIS */
}
.mm-tool-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary, #6b6b6e);
  transition: all 0.12s;
}
.mm-tool-btn:hover, .mm-tool-btn--active {
  background: var(--primary-color);
  color: #fff;
}
.mm-tool-divider {
  width: 1px;
  height: 18px;
  background: var(--border, #d9d9d9);
  flex-shrink: 0;
}
.mm-tool-export-wrap {
  position: relative;
}

.mindmap-root[data-dark="true"] .mm-toolbar {
  background: var(--bg-card, #2b2c30);
  border-color: #3e3e42;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.mindmap-root[data-dark="true"] .mm-tool-btn { color: #b0b0b0; }
.mindmap-root[data-dark="true"] .mm-tool-divider { background: #3e3e42; }
.mindmap-root[data-dark="true"] .undo-redo-controls .ctrl-btn {
  background: var(--bg-card, #2b2c30);
  border-color: #3e3e42;
}
/* Shift toolbar left when sidebar is open so it doesn't overlap */
.mm-toolbar--sidebar-open {
  right: calc(280px + 16px); /* sidebar width + original offset */
  transition: right 0.22s ease;
}

/* Also shift export menu anchor */
.mm-toolbar--sidebar-open ~ .export-menu,
.export-menu {
  right: auto; /* let it follow the toolbar */
}
</style>
