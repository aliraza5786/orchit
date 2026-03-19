<template>
  <div class="relative w-full h-full flex overflow-hidden mindmap-root" ref="rootEl" :data-dark="isDark ? 'true' : 'false'">

    <!-- ── Viewport (clips the infinite canvas) ──────────────────────────── -->
    <div
      class="viewport flex-1 relative overflow-hidden"
      ref="viewportEl"
      @wheel.prevent="handleWheel"
      @mousedown="handleViewportMouseDown"
      @click="handleCanvasClick"
      @contextmenu.prevent
    >
      <!-- ── Infinite canvas (pan + zoom transform) ─────────────────────── -->
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
        <div v-if="allNodes.length === 0" class="canvas-placeholder">
          <i class="fa-solid fa-diagram-project fa-3x mb-3" style="color:#94a3b8"></i>
          <h5 style="color:#64748b">No data to display</h5>
          <p style="color:#94a3b8;font-size:13px">Add sheets and cards to see your mindmap</p>
        </div>

        <!-- ── SVG connection layer ──────────────────────────────────────── -->
        <svg
          class="connections-svg"
          :style="{ width: svgW + 'px', height: svgH + 'px' }"
          :viewBox="`0 0 ${svgW} ${svgH}`"
        >
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" :fill="isDark ? '#475569' : '#94a3b8'" />
            </marker>
          </defs>
          <g v-for="e in visibleEdges" :key="e.id">
            <!-- hit area -->
            <path :d="e.path" stroke="transparent" stroke-width="10" fill="none" />
            <!-- visible -->
            <path
              :d="e.path"
              :stroke="edgeColor(e.level)"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              marker-end="url(#arr)"
              class="edge-path"
            />
          </g>
        </svg>

        <!-- ── Nodes ─────────────────────────────────────────────────────── -->
        <div
          v-for="node in allNodes"
          :key="node.id"
          class="mm-node"
          :class="[
            `mm-node--${node.uniqueName}`,
            { 'mm-node--selected': selectedNodeId === node.id },
          ]"
          :style="nodeInlineStyle(node)"
          @mousedown.stop="handleNodeMouseDown($event, node.id)"
          @click.stop="handleNodeClick(node.id)"
          @contextmenu.stop.prevent="handleNodeContextMenu($event, node)"
        >
          <!-- ── ROOT node ────────────────────────────────────────────────── -->
          <template v-if="node.uniqueName === 'root'">
            <div class="node-root-inner">
              <i class="fa-solid fa-brain node-root-icon"></i>
              <span class="node-root-title">{{ node.topic }}</span>
            </div>
          </template>

          <!-- ── SHEET node ──────────────────────────────────────────────── -->
          <template v-else-if="node.uniqueName === 'sheet'">
            <div class="node-sheet-inner">
              <div class="node-sheet-header">
                <i class="fa-solid fa-table-columns node-sheet-icon"></i>
                <span class="node-sheet-title">{{ node.topic }}</span>
                <div class="node-actions">
                  <button
                    v-if="node.children && node.children.length > 0"
                    class="nact" @click.stop="toggleCollapse(node.id)"
                    :title="isCollapsed(node.id) ? 'Expand' : 'Collapse'"
                  >
                    <i :class="isCollapsed(node.id) ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down'"></i>
                  </button>
                </div>
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

          <!-- ── LIST node ───────────────────────────────────────────────── -->
          <template v-else-if="node.uniqueName === 'List'">
            <div class="node-list-inner">
              <div class="node-list-header">
                <div class="node-list-dot"></div>
                <span class="node-list-title">{{ node.topic }}</span>
                <div class="node-actions">
                  <button
                    v-if="node.children && node.children.length > 0"
                    class="nact" @click.stop="toggleCollapse(node.id)"
                    :title="isCollapsed(node.id) ? 'Expand' : 'Collapse'"
                  >
                    <i :class="isCollapsed(node.id) ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down'"></i>
                  </button>
                </div>
              </div>
              <div class="node-list-count" v-if="node.children && !isCollapsed(node.id)">
                {{ node.children.length }} card{{ node.children.length !== 1 ? 's' : '' }}
              </div>
              <div v-if="isCollapsed(node.id) && node.children?.length" class="node-collapsed-badge">
                <i class="fa-solid fa-layer-group me-1"></i>{{ node.children.length }} hidden
              </div>

              <!-- ── Inline card creation input ─────────────────────────── -->
              <div
                v-if="creatingCardForListId === node.id && !isPlanRoute"
                class="inline-create-card"
                @click.stop
                @mousedown.stop
              >
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
                  <button
                    class="inline-btn inline-btn--confirm"
                    :disabled="!newCardTitle.trim() || isCreatingCard"
                    @click.stop="submitInlineCard"
                  >
                    <i v-if="isCreatingCard" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-check"></i>
                  </button>
                  <button class="inline-btn inline-btn--cancel" @click.stop="cancelInlineCreation">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>

              <!-- "Add card" trigger shown on hover when not already creating -->
              <button
                v-if="canCreateCard && creatingCardForListId !== node.id && !isPlanRoute"
                class="list-add-card-btn"
                @click.stop="startInlineCardCreation(node)"
                title="Add card (Enter)"
              >
                <i class="fa-solid fa-plus"></i> Add card
              </button>
            </div>
          </template>

          <!-- ── CARD node ───────────────────────────────────────────────── -->
          <template v-else-if="node.uniqueName === 'card'">
            <div class="node-card-inner">
          <!-- Card top stripe — uses borderColor if set, otherwise accent default -->
              <div
                class="node-card-stripe"
                :style="{ background: node.style?.borderColor || node.style?.color || '#6366f1' }"
              ></div>

              <!-- Card body -->
              <div class="node-card-body">
                <!-- Header row -->
                <div class="node-card-header">
                  <span class="node-card-title">{{ node.topic }}</span>
                  <div class="node-actions">
                    <button
                      v-if="canCreateCard && node.parent?.uniqueName === 'List' && !isPlanRoute"
                      class="nact nact--add" @click.stop="node.parent && startInlineCardCreation(node.parent)"
                      title="Add sibling card (Enter)"
                    ><i class="fa-solid fa-plus"></i></button>
                    <button
                      v-if="canAssignCard && canEditCard"
                      class="nact" @click.stop="openFormatSidebar(node.id)" title="Format"
                    ><i class="fa-solid fa-palette"></i></button>
                    <button class="nact nact--open" @click.stop="handleOpenNode(node)" title="Open card">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </button>
                    <button
                      v-if="canDeleteCard"
                      class="nact nact--danger" @click.stop="handleDeleteNode(node.id)" title="Delete"
                    ><i class="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>

                <!-- Status + Priority row -->
                <div class="node-card-tags">
                  <span
                    v-if="node.variables?.['card-status']"
                    class="card-tag card-tag--status"
                  >{{ node.variables['card-status'] }}</span>
                  <span
                    v-if="node.variables?.priority"
                    class="card-tag"
                    :class="`card-tag--${node.variables.priority}`"
                  >
                    <i class="fa-solid fa-flag me-1" style="font-size:9px"></i>
                    {{ node.variables.priority }}
                  </span>
                  <span
                    v-if="node.variables?.process != null"
                    class="card-tag card-tag--process"
                  >{{ node.variables.process }}%</span>
                </div>

                <!-- Dates row -->
                <div
                  v-if="node.variables?.['start-date'] || node.variables?.['end-date']"
                  class="node-card-dates"
                >
                  <i class="fa-regular fa-calendar" style="font-size:9px;opacity:.6"></i>
                  <span v-if="node.variables['start-date']">{{ formatDate(node.variables['start-date']) }}</span>
                  <span v-if="node.variables['start-date'] && node.variables['end-date']" style="opacity:.4">→</span>
                  <span v-if="node.variables['end-date']">{{ formatDate(node.variables['end-date']) }}</span>
                </div>

                <!-- Description snippet -->
                <div
                  v-if="node.variables?.['card-description']"
                  class="node-card-desc"
                >{{ node.variables['card-description'] }}</div>

                <!-- Footer: hyperlink + seat_id -->
                <div class="node-card-footer">
                  <a v-if="node.hyperLink" :href="node.hyperLink" target="_blank" class="card-link" @click.stop>
                    <i class="fa-solid fa-link"></i> Link
                  </a>
                  <span v-if="node.seat_id" class="card-seat">
                    <i class="fa-solid fa-fingerprint" style="font-size:9px;opacity:.5"></i>
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div><!-- /canvas-area -->

      <!-- ── Canvas Controls ────────────────────────────────────────────── -->
      <div class="canvas-controls">
        <button class="ctrl-btn" @click="handleZoomIn" title="Zoom In (+)">
          <i class="fa-solid fa-plus"></i>
        </button>
        <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
        <button class="ctrl-btn" @click="handleZoomOut" title="Zoom Out (-)">
          <i class="fa-solid fa-minus"></i>
        </button>
        <div class="ctrl-divider"></div>
        <button class="ctrl-btn" :class="{ 'ctrl-btn--active': layoutDirection === 'right' }" @click="setLayout('right')" title="Layout: Left to Right"><i class="fa-solid fa-arrow-right"></i></button>
        <button class="ctrl-btn" :class="{ 'ctrl-btn--active': layoutDirection === 'left' }" @click="setLayout('left')" title="Layout: Right to Left"><i class="fa-solid fa-arrow-left"></i></button>
        <button class="ctrl-btn" :class="{ 'ctrl-btn--active': layoutDirection === 'center' }" @click="setLayout('center')" title="Layout: Centered"><i class="fa-solid fa-arrows-left-right"></i></button>
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
      </div>

      <!-- Stats -->
      <div class="canvas-stats">
        <span><i class="fa-solid fa-circle-nodes me-1"></i>{{ allNodes.length }}</span>
        <span><i class="fa-solid fa-bezier-curve me-1"></i>{{ visibleEdges.length }}</span>
      </div>
    </div><!-- /viewport -->

    <!-- ── Format Sidebar ────────────────────────────────────────────────── -->
    <transition name="slide-sidebar">
      <div
        v-if="showFormatSidebar && canAssignCard && canEditCard && canCreateCard"
        class="format-sidebar"
      >
        <!-- Header -->
        <div class="fs-header">
          <div class="fs-header-left">
            <i class="fa-solid fa-sliders" style="color:var(--accent,#6366f1)"></i>
            <span>Format Node</span>
          </div>
          <button class="fs-close" @click="showFormatSidebar = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- No selection hint -->
        <div v-if="!selectedNodeId" class="fs-empty">
          <i class="fa-solid fa-arrow-pointer fa-xl" style="color:#cbd5e1;margin-bottom:8px"></i>
          <p>Click any node<br>to format it</p>
        </div>

        <div v-else class="fs-body">

          <!-- ── Selected node name (plain, no style inheritance) ────────── -->
          <div class="fs-node-name">
            <i class="fa-solid fa-circle-dot fs-node-icon" :class="`fs-icon--${selectedNode?.uniqueName}`"></i>
            <span class="fs-node-label">{{ selectedNode?.topic || 'Node' }}</span>
            <span class="fs-node-type">{{ selectedNode?.uniqueName }}</span>
          </div>

          <!-- ── Quick presets ─────────────────────────────────────────── -->
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

          <!-- ── Colors ────────────────────────────────────────────────── -->
          <div class="fs-section">
            <div class="fs-section-label">Colors</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Background</label>
                <div class="color-row">
                  <div class="color-swatch" :style="{ background: activeFormatStyle.background || '#fff' }">
                    <input type="color" :value="activeFormatStyle.background || '#ffffff'"
                      @input="onStyleChange('bg_color', $event)" />
                  </div>
                  <input class="color-hex" :value="activeFormatStyle.background || ''"
                    placeholder="#ffffff" readonly />
                </div>
              </div>
              <div class="fs-field">
                <label>Text</label>
                <div class="color-row">
                  <div class="color-swatch" :style="{ background: activeFormatStyle.color || '#000' }">
                    <input type="color" :value="activeFormatStyle.color || '#000000'"
                      @input="onStyleChange('color', $event)" />
                  </div>
                  <input class="color-hex" :value="activeFormatStyle.color || ''"
                    placeholder="#000000" readonly />
                </div>
              </div>
            </div>
            <!-- Border color -->
            <div class="fs-field">
              <label>Border Color</label>
              <div class="color-row">
                <div class="color-swatch" :style="{ background: activeFormatStyle.borderColor || '#e2e8f0' }">
                  <input type="color" :value="activeFormatStyle.borderColor || '#e2e8f0'"
                    @input="onStyleChange('border_color', $event)" />
                </div>
                <input class="color-hex" :value="activeFormatStyle.borderColor || ''"
                  placeholder="#e2e8f0" readonly />
              </div>
            </div>
          </div>

          <!-- ── Typography ────────────────────────────────────────────── -->
          <div class="fs-section">
            <div class="fs-section-label">Typography</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Font Size</label>
                <div class="input-with-unit">
                  <input
                    type="number" min="8" max="32" step="1"
                    :value="parsePx(activeFormatStyle.fontSize) || 14"
                    @input="onStyleChange('font_size', $event)"
                    class="fs-input"
                  />
                  <span class="unit">px</span>
                </div>
              </div>
              <div class="fs-field">
                <label>Weight</label>
                <select class="fs-select" :value="activeFormatStyle.fontWeight || 'normal'" @change="onStyleChange('font_weight', $event)">
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
                <select class="fs-select" :value="activeFormatStyle.fontFamily || 'inherit'" @change="onStyleChange('font_family', $event)">
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
                <select class="fs-select" :value="activeFormatStyle.fontStyle || 'normal'" @change="onStyleChange('font_style', $event)">
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
                  v-for="align in ['left','center','right']"
                  :key="align"
                  class="align-btn"
                  :class="{ 'align-btn--active': (activeFormatStyle as any).textAlign === align }"
                  @click="onStyleChangeDirect('text_align', align)"
                >
                  <i :class="`fa-solid fa-align-${align}`"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- ── Border & Shape ────────────────────────────────────────── -->
          <div class="fs-section">
            <div class="fs-section-label">Border & Shape</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Border Width</label>
                <div class="input-with-unit">
                  <input
                    type="number" min="0" max="16" step="1"
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
                    type="number" min="0" max="50" step="1"
                    :value="parsePx(activeFormatStyle.borderRadius) || 0"
                    @input="onStyleChange('border_radius', $event)"
                    class="fs-input"
                  />
                  <span class="unit">px</span>
                </div>
              </div>
            </div>
            <!-- Border style -->
            <div class="fs-field">
              <label>Border Style</label>
              <select class="fs-select" :value="(activeFormatStyle as any).borderStyle || 'solid'" @change="onStyleChangeDirect('border_style', ($event.target as HTMLSelectElement).value)">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <!-- ── Spacing & Opacity ─────────────────────────────────────── -->
          <div class="fs-section">
            <div class="fs-section-label">Spacing & Visibility</div>
            <div class="fs-row">
              <div class="fs-field">
                <label>Padding</label>
                <div class="input-with-unit">
                  <input
                    type="number" min="0" max="40" step="2"
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
                    type="number" min="10" max="100" step="5"
                    :value="Math.round(((activeFormatStyle as any).opacity ?? 1) * 100)"
                    @input="onStyleChangeDirect('opacity', String(Number((($event.target as HTMLInputElement).value)) / 100))"
                    class="fs-input"
                  />
                  <span class="unit">%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Shadow ────────────────────────────────────────────────── -->
          <div class="fs-section">
            <div class="fs-section-label">Shadow</div>
            <div class="shadow-presets">
              <button
                v-for="s in shadowPresets"
                :key="s.label"
                class="shadow-btn"
                :class="{ 'shadow-btn--active': (activeFormatStyle as any).boxShadow === s.value }"
                :style="{ boxShadow: s.value || 'none' }"
                @click="onStyleChangeDirect('box_shadow', s.value)"
              >{{ s.label }}</button>
            </div>
          </div>

          <!-- ── Hyperlink ─────────────────────────────────────────────── -->
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

          <!-- ── Reset ─────────────────────────────────────────────────── -->
          <div class="fs-section" style="border:none;padding-bottom:0">
            <button class="fs-reset-btn" @click="resetNodeStyle">
              <i class="fa-solid fa-rotate me-1"></i> Reset to default
            </button>
          </div>
        </div><!-- /fs-body -->

        <!-- Save -->
        <div class="fs-footer">
          <button
            class="fs-save-btn"
            :disabled="isSavingNodeStyle || !selectedNodeId"
            @click="saveNodeStyle"
          >
            <span v-if="isSavingNodeStyle" class="spinner"></span>
            <i v-else class="fa-solid fa-floppy-disk me-1"></i>
            {{ isSavingNodeStyle ? 'Saving...' : 'Save Style' }}
          </button>
        </div>
      </div>
    </transition>

    <!-- ── Card right-click context menu ───────────────────────────────────── -->
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
          <!-- Card info header -->
          <div class="ctx-header">
            <i class="fa-solid fa-square-check ctx-header-icon"></i>
            <span class="ctx-header-title">{{ ctxMenuNode?.topic }}</span>
          </div>

          <!-- Add sibling -->
          <button
            v-if="canCreateCard && !isPlanRoute"
            class="ctx-item"
            @click="ctxAddCard"
          >
            <i class="fa-solid fa-plus ctx-item-icon ctx-icon--add"></i>
            <span>Add card below</span>
            <kbd class="ctx-kbd">Enter</kbd>
          </button>

          <!-- Open / view -->
          <button class="ctx-item" @click="ctxOpenCard">
            <i class="fa-solid fa-arrow-up-right-from-square ctx-item-icon ctx-icon--open"></i>
            <span>Open card</span>
          </button>

          <!-- Format -->
          <button
            v-if="canAssignCard && canEditCard"
            class="ctx-item"
            @click="ctxFormatCard"
          >
            <i class="fa-solid fa-palette ctx-item-icon ctx-icon--format"></i>
            <span>Format</span>
          </button>

          <div class="ctx-divider"></div>

          <!-- Delete -->
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

    <!-- Sheet selector moved inside List node (plan route only) -->

    <!-- ── Add List Input ─────────────────────────────────────────────────── -->
    <div
      v-if="activeAddList"
      class="add-list-panel"
      @click.stop
    >
      <input
        autofocus
        v-model="newColumnLocal"
        placeholder="Add New list"
        @keyup.enter="emitAddColumn"
        class="add-list-input"
      />
      <p style="font-size:11px;margin-top:6px;color:#64748b">You can add details while editing</p>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <button @click="emitAddColumn" class="add-list-btn">
          {{ addingList ? 'Adding...' : 'Add list' }}
        </button>
        <i class="fa-solid fa-close" style="cursor:pointer;color:#94a3b8" @click="emit('toggle-add-list')"></i>
      </div>
    </div>
  </div>

  <!-- ── Hyperlink Modal ──────────────────────────────────────────────────── -->
  <div
    v-if="showHyperlinkModal && canAssignCard && canEditCard && canCreateCard"
    class="modal-backdrop"
  >
    <div class="modal-card">
      <h3 class="modal-title">Insert Web Link</h3>
      <input v-model="hyperlink" type="text" placeholder="Enter or paste a URL" class="modal-input" />
      <div class="modal-footer">
        <button @click="cancelHyperlink" class="modal-btn-cancel">Cancel</button>
        <button :disabled="!hyperlink" @click="confirmHyperlink" class="modal-btn-confirm" :class="{ disabled: !hyperlink }">Insert</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, watch, toRaw, watchEffect, nextTick,
  onMounted, onBeforeUnmount, reactive,
} from "vue";
import { toast } from "vue-sonner";
import { useTheme } from "../../composables/useTheme";
import { useRoute } from "vue-router";

// ── Props / Emits ─────────────────────────────────────────────────────────────
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

// ── Theme ─────────────────────────────────────────────────────────────────────
const { isDark } = useTheme();
const route = useRoute();

// ── Interfaces ────────────────────────────────────────────────────────────────
interface NodeStyle {
  background?: string; color?: string;
  fontSize?: string; fontWeight?: string; fontStyle?: string; fontFamily?: string;
  textAlign?: string;
  borderColor?: string; borderWidth?: string; borderRadius?: string; borderStyle?: string;
  padding?: string;
  opacity?: number;
  boxShadow?: string;
  hyperLink?: string;
}

interface MindNode {
  id: string; sheet_id: string; seat_id?: string;
  topic: string;
  style: NodeStyle; _originalStyle: Record<string, any>;
  children: MindNode[]; parent?: MindNode;
  isRoot?: boolean;
  uniqueName: "root" | "sheet" | "List" | "card";
  variables?: any; hyperLink?: string;
  // layout
  x: number; y: number; width: number; height: number;
  collapsed: boolean;
}

interface Edge { id: string; path: string; level: number; }

// ── Registry ──────────────────────────────────────────────────────────────────
// reactive() gives deep tracking: mutating node.style.fontSize will
// immediately re-render any template binding that reads it.
// ref<Map> does NOT track nested property mutations — that was the bug.
const nodeStore = reactive<Record<string, MindNode>>({});
const rootNodeId = ref<string>("");
// Incremented on every collapse toggle to force allNodes recomputation
const collapseVersion = ref(0);
// Plain ref array of collapsed node IDs — Vue 3 fully tracks ref reassignment
const collapsedIds = ref<string[]>([]);
// Helpers that mirror Set API used throughout
function isCollapsed(id: string): boolean { return collapsedIds.value.includes(id); }
function collapseNode(id: string): void   { if (!isCollapsed(id)) collapsedIds.value = [...collapsedIds.value, id]; }
function expandNode(id: string): void     { collapsedIds.value = collapsedIds.value.filter(x => x !== id); }

// Drop-in shim that matches every Map call used in this file
const nodeMap = {
  get(id: string): MindNode | null { return nodeStore[id] ?? null; },
  set(id: string, node: MindNode): void { nodeStore[id] = node; },
  clear(): void { for (const k of Object.keys(nodeStore)) delete nodeStore[k]; },
  has(id: string): boolean { return id in nodeStore; },
};

// ── Viewport / pan / zoom ─────────────────────────────────────────────────────
const rootEl      = ref<HTMLElement | null>(null);
const viewportEl  = ref<HTMLElement | null>(null);
const canvasEl    = ref<HTMLDivElement | null>(null);

const zoom    = ref(0.85);
const minZoom = 0.15;
const maxZoom = 3;
const zoomStep = 0.1;
const panX = ref(0);
const panY = ref(0);
const isPanning    = ref(false);
const panStart     = ref({ x: 0, y: 0 });
const svgW = ref(8000);
const svgH = ref(8000);

// ── Layout direction: "right" | "left" | "center" ────────────────────────────
// ── Layout direction ─────────────────────────────────────────────────────────
const layoutDirection = ref<"right" | "left" | "center">("right");
// Stores which side each node is on (for center layout edge drawing)
// Kept outside nodeStore to avoid Vue reactivity tracking issues with late-added props
const nodeSides = new Map<string, "left" | "right">();

// ── Drag ──────────────────────────────────────────────────────────────────────
const draggedNodeId = ref<string | null>(null);
const dragOffset    = ref({ x: 0, y: 0 });

// ── Inline card creation ──────────────────────────────────────────────────────
const creatingCardForListId = ref<string | null>(null);  // which List node is active
const newCardTitle          = ref<string>("");
const isCreatingCard        = ref(false);

// ── Right-click context menu ──────────────────────────────────────────────────
const ctxMenu = reactive({
  visible:  false,
  x:        0,
  y:        0,
  nodeId:   null as string | null,
});
// Skip the very next global click after opening (same event propagation)
let ctxSkipNextClick = false;

// ── Selection ─────────────────────────────────────────────────────────────────
const selectedNodeId = ref<string | null>(null);

// ── Format sidebar ────────────────────────────────────────────────────────────
const showFormatSidebar = ref(false);
const isSavingNodeStyle = ref(false);
const hyperlinkInput    = ref("");
// inlineCardInput removed — autofocus attr handles focus

// ── Hyperlink modal ───────────────────────────────────────────────────────────
const showHyperlinkModal = ref(false);
const hyperlink = ref("");
const resolveCallback = ref<((l: string) => void) | null>(null);

// ── Sheet selector ────────────────────────────────────────────────────────────
const selectedListSheetId = ref<string>(props.selectedSheetId);
const sheetSelector = reactive({
  visible: false, x: 0, y: 0, selectedSheetId: "", listNodeObj: null as MindNode | null,
});
const showMustSelectMessage = ref(false);

// ── Pending card creation (plan route — sheet must be selected first) ─────────
// Stores the listNode + title waiting for a sheet to be picked before emit
const pendingCard = reactive<{
  listNode: MindNode | null;
  title:    string;
  mode:     "direct" | "inline"; // direct = Enter/ctx, inline = typed title
}>({ listNode: null, title: "", mode: "direct" });

const module_id = ref(localStorage.getItem("selectedModuleId") || "");
watch(() => props.moduleId, (v) => { if (v) module_id.value = v; }, { immediate: true });
const isPlanRoute = computed(() => route.path.includes("plan"));


// ── Add-list ──────────────────────────────────────────────────────────────────
const newColumnLocal = ref(props.newColumn);
watch(() => props.newColumn, (v) => { newColumnLocal.value = v; });
function emitAddColumn() {
  const t = newColumnLocal.value.trim();
  if (t) emit("add-column", t);
}

// ── Style defaults ────────────────────────────────────────────────────────────
const DEFAULT_BACKEND_STYLE = {
  bg_color: "#ffffff", color: "#1e293b",
  font_size: 13, font_weight: "normal", font_style: "normal",
  font_family: "inherit", text_align: "left",
  border_color: "#e2e8f0", border_width: 0, border_radius: 8,
  border_style: "solid", padding: 12, opacity: 1, box_shadow: "",
};

function mapBackendStyle(style: any = {}): NodeStyle {
  return {
    background:   style.bg_color,
    color:        style.color,
    fontSize:     style.font_size    != null ? `${style.font_size}px`    : undefined,
    fontWeight:   style.font_weight,
    fontStyle:    style.font_style,
    fontFamily:   style.font_family,
    textAlign:    style.text_align,
    borderColor:  style.border_color,
    borderWidth:  style.border_width  != null ? `${style.border_width}px`  : undefined,
    borderRadius: style.border_radius != null ? `${style.border_radius}px` : undefined,
    borderStyle:  style.border_style,
    padding:      style.padding       != null ? `${style.padding}px`       : undefined,
    opacity:      style.opacity,
    boxShadow:    style.box_shadow,
    hyperLink:    style.hyperLink || undefined,
  };
}

function resolveStyle<T>(ui: T | undefined, orig: T | undefined, def: T): T {
  return ui !== undefined ? ui : orig !== undefined ? orig : def;
}

function parsePx(val?: string): number {
  if (!val) return 0;
  return parseInt(val) || 0;
}

// ── Color presets ─────────────────────────────────────────────────────────────
const colorPresets = [
  { name: "Indigo",  bg: "#6366f1", border: "#4f46e5", color: "#fff" },
  { name: "Sky",     bg: "#0ea5e9", border: "#0284c7", color: "#fff" },
  { name: "Emerald", bg: "#10b981", border: "#059669", color: "#fff" },
  { name: "Amber",   bg: "#f59e0b", border: "#d97706", color: "#fff" },
  { name: "Rose",    bg: "#f43f5e", border: "#e11d48", color: "#fff" },
  { name: "Slate",   bg: "#64748b", border: "#475569", color: "#fff" },
  { name: "White",   bg: "#ffffff", border: "#e2e8f0", color: "#1e293b" },
  { name: "Dark",    bg: "#1e293b", border: "#0f172a", color: "#f1f5f9" },
];

const shadowPresets = [
  { label: "None",   value: "" },
  { label: "Soft",   value: "0 2px 8px rgba(0,0,0,.08)" },
  { label: "Medium", value: "0 4px 16px rgba(0,0,0,.14)" },
  { label: "Hard",   value: "0 8px 24px rgba(0,0,0,.22)" },
  { label: "Inner",  value: "inset 0 2px 6px rgba(0,0,0,.12)" },
  { label: "Glow",   value: "0 0 0 3px rgba(99,102,241,.4)" },
];

function applyPreset(p: { bg: string; border: string; color: string }) {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  node.style.background   = p.bg;
  node.style.borderColor  = p.border;
  node.style.color        = p.color;
}

function resetNodeStyle() {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  node.style = mapBackendStyle(DEFAULT_BACKEND_STYLE);
  hyperlinkInput.value = "";
}

// ── Node dimensions ───────────────────────────────────────────────────────────
const NODE_W: Record<string, number> = {
  root: 220, sheet: 200, List: 180, card: 200,
};

/** Compute dynamic height for card nodes (more content = taller) */
function nodeHeight(node: MindNode): number {
  if (node.uniqueName === "card") {
    let h = 80; // base: title + stripe
    const v = node.variables || {};
    if (v["card-status"] || v.priority || v.process != null) h += 24;
    if (v["start-date"] || v["end-date"]) h += 20;
    if (v["card-description"]) h += 28;
    if (node.hyperLink || node.seat_id) h += 18;
    return h;
  }
  if (node.uniqueName === "List")  return 72;  // extra room for "+ Add card" button
  if (node.uniqueName === "sheet") return 66;
  if (node.uniqueName === "root")  return 56;
  return 46;
}

const H_GAP = 80;
const V_GAP = 16;

// ── Layout engine (right / left / center) ─────────────────────────────────────
// Returns the total vertical height consumed by the subtree
function layoutTree(node: MindNode, x: number, y: number, dir?: "right"|"left"|"center"): number {
  const d = dir ?? layoutDirection.value;
  node.width  = NODE_W[node.uniqueName] ?? 180;
  node.height = nodeHeight(node);

  if (isCollapsed(node.id) || !node.children || node.children.length === 0) {
    node.collapsed = isCollapsed(node.id);
    node.x = x; node.y = y;
    return node.height;
  }

  // ── CENTER layout: root in middle, children alternate left/right ─────────────
  if (d === "center" && node.uniqueName === "root") {
    // Split children: even indices → right, odd indices → left (alternating)
    const rightKids: MindNode[] = [];
    const leftKids:  MindNode[] = [];
    node.children.forEach((c, i) => {
      if (i % 2 === 0) { nodeSides.set(c.id, "right"); rightKids.push(c); }
      else             { nodeSides.set(c.id, "left");  leftKids.push(c);  }
    });

    // Layout right side — children go right, accumulate from y downward
    let ry = y;
    for (const c of rightKids) {
      const cX = x + node.width + H_GAP;
      const h  = layoutTree(c, cX, ry, "right");
      ry += h + V_GAP;
    }

    // Layout left side — children go left, accumulate from y downward
    let ly = y;
    for (const c of leftKids) {
      const cX = x - H_GAP - (NODE_W[c.uniqueName] ?? 180);
      const h  = layoutTree(c, cX, ly, "left");
      ly += h + V_GAP;
    }

    // Centre root over the union of all children
    const allKids = [...rightKids, ...leftKids];
    if (allKids.length === 0) { node.x = x; node.y = y; return node.height; }
    const minY = Math.min(...allKids.map(c => c.y));
    const maxY = Math.max(...allKids.map(c => c.y + c.height));
    node.x = x;
    node.y = minY + (maxY - minY) / 2 - node.height / 2;
    return maxY - minY;
  }

  // ── RIGHT or LEFT layout ──────────────────────────────────────────────────────
  let childY = y; let total = 0;
  for (const child of node.children) {
    nodeSides.set(child.id, d === "left" ? "left" : "right");
    const cX = d === "left"
      ? x - H_GAP - (NODE_W[child.uniqueName] ?? 180)
      : x + node.width + H_GAP;
    const h = layoutTree(child, cX, childY, d);
    childY += h + V_GAP;
    total  += h + V_GAP;
  }
  total -= V_GAP;

  const firstY = node.children[0].y;
  const lastY  = node.children[node.children.length - 1].y;
  node.x = x;
  node.y = firstY + (lastY + node.children[node.children.length - 1].height - firstY) / 2 - node.height / 2;
  return Math.max(total, node.height);
}

function setLayout(dir: "right"|"left"|"center") {
  layoutDirection.value = dir;
  const root = nodeMap.get(rootNodeId.value);
  if (!root) return;
  // Place root at a position that gives enough canvas space on both sides
  const startX = dir === "left"   ? 4000 - NODE_W.root
               : dir === "center" ? 2500 - NODE_W.root / 2
               : 60;
  layoutTree(root, startX, 60, dir);
  // Recalc SVG to cover all nodes (including left-side nodes for center/left)
  let minX = Infinity, maxX = -Infinity, maxY = 0;
  for (const n of flattenVisible(root)) {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  // SVG origin is 0,0 — left nodes have x < startX which is fine; just ensure width
  svgW.value = Math.max(maxX + 300, 5000);
  svgH.value = Math.max(maxY + 300, 3000);
  nextTick(() => centerView());
}

// ── Build tree ────────────────────────────────────────────────────────────────
function buildTree(sheets: any[]): MindNode {
  const root: MindNode = {
    id: "root", sheet_id: "",
    topic: localStorage.getItem("currentName") ?? "Mindmap",
    isRoot: true, children: [], style: {}, _originalStyle: {},
    uniqueName: "root", x: 0, y: 0,
    width: NODE_W.root, height: 56, collapsed: false,
  };
  if (!Array.isArray(sheets)) return root;

  const varMap: Record<string, MindNode> = {};
  sheets.forEach((sheet) => {
    const title = sheet.variables?.["sheet-title"] || localStorage.getItem("selectedSprintTitle") || "Sheet";
    const link  = sheet.style?.hyperLink || "";
    if (!varMap[title]) {
      // Sheet node id uses a prefix so it never collides with any list node id
      varMap[title] = {
        id: `sheet_group_${sheet._id}`, sheet_id: sheet._id, topic: title,
        variables: sheet?.variables, children: [],
        style: mapBackendStyle(sheet?.style), _originalStyle: sheet?.style || {},
        uniqueName: "sheet", hyperLink: link,
        x: 0, y: 0, width: NODE_W.sheet, height: 66, collapsed: false,
      };
      root.children.push(varMap[title]);
    }
    // sheet.title is the actual list name (e.g. "approved", "pending")
    // Each item in listsData is a list with its own _id — use that directly.
    const listTitle = sheet.title || sheet.variables?.["sheet-title"] || title;
    // Make a truly unique ID: combine the sheet _id with the list title + sort_order
    // so even if multiple lists share the same parent sheet _id, they collapse independently
    const safeTitle = (listTitle || "").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const listUniqueId = `list_${sheet._id}_${safeTitle}_${sheet.sort_order ?? 0}`;
    const listNode: MindNode = {
      id: listUniqueId, sheet_id: sheet._id,
      topic: listTitle,
      children: [], style: mapBackendStyle(sheet?.style),
      _originalStyle: sheet?.style || {},
      uniqueName: "List", hyperLink: link,
      x: 0, y: 0, width: NODE_W.List, height: 72, collapsed: false,
    };
    (sheet.cards || []).forEach((card: any, i: number) => {
      const cn: MindNode = {
        id: card._id || `card-${i}`, sheet_id: card?.sheet_id, seat_id: card.seat_id,
        topic: card["card-title"],
        style: mapBackendStyle(card.style), _originalStyle: card.style || {},
        children: [], uniqueName: "card", hyperLink: card.style?.hyperLink || "",
        variables: { ...card.variables, ...card, "card-title": card["card-title"] },
        x: 0, y: 0, width: NODE_W.card, height: nodeHeight({ uniqueName: "card", variables: card } as any),
        collapsed: false,
      };
      cn.parent = listNode;
      listNode.children.push(cn);
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

function flattenVisible(node: MindNode, out: MindNode[] = []): MindNode[] {
  out.push(node);
  if (!isCollapsed(node.id) && node.children)
    for (const c of node.children) flattenVisible(c, out);
  return out;
}

// ── Computed nodes / edges ────────────────────────────────────────────────────
const allNodes = computed<MindNode[]>(() => {
  void nodeStore;
  void collapseVersion.value;
  // collapsedIds is a reactive Set — Vue tracks .has() calls on it
  const root = nodeMap.get(rootNodeId.value);
  return root ? flattenVisible(root) : [];
});

function nodeLevel(node: MindNode): number {
  let l = 0, cur: MindNode | undefined = node;
  while (cur?.parent) { l++; cur = cur.parent; }
  return l;
}

const visibleEdges = computed<Edge[]>(() => {
  const edges: Edge[] = [];
  const vis = new Set(allNodes.value.map((n) => n.id));
  for (const node of allNodes.value) {
    if (!node.children || isCollapsed(node.id)) continue;
    for (const child of node.children) {
      if (!vis.has(child.id)) continue;
      // For left-side nodes: source = parent left edge, target = child right edge
      const isLeft = nodeSides.get(child.id) === "left";
      const x1 = isLeft ? node.x                : node.x + node.width;
      const y1 = node.y + node.height / 2;
      const x2 = isLeft ? child.x + child.width : child.x;
      const y2 = child.y + child.height / 2;
      const mx = (x1 + x2) / 2;
      edges.push({
        id: `${node.id}-${child.id}`,
        path: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
        level: nodeLevel(node),
      });
    }
  }
  return edges;
});

function edgeColor(level: number): string {
  const colors = isDark.value
    ? ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b"]
    : ["#a5b4fc", "#7dd3fc", "#6ee7b7", "#fcd34d"];
  return colors[level % colors.length];
}

// ── Node inline styles ────────────────────────────────────────────────────────
// ALL user-set style properties must reach the node element here.
// Child elements use `color: inherit` so text color cascades automatically.
function nodeInlineStyle(node: MindNode): Record<string, string> {
  const s   = node.style || {};
  const ext = s as any;

  const base: Record<string, string> = {
    left:   `${node.x}px`,
    top:    `${node.y}px`,
    width:  `${node.width}px`,
    height: `${node.height}px`,
  };

  // ── Background ──────────────────────────────────────────────────────────────
  // Only override the CSS-class default if the user has actually set a value
  if (s.background)              base.background  = s.background;

  // ── Text color — cascade to all children via `color: inherit` ───────────────
  if (s.color)                   base.color       = s.color;

  // ── Typography ──────────────────────────────────────────────────────────────
  if (s.fontFamily)              base.fontFamily  = s.fontFamily;
  if (s.fontSize)                base.fontSize    = s.fontSize;
  if (s.fontWeight)              base.fontWeight  = s.fontWeight;
  if (s.fontStyle)               base.fontStyle   = s.fontStyle;
  if (ext.textAlign)             base.textAlign   = ext.textAlign;

  // ── Border ──────────────────────────────────────────────────────────────────
  if (s.borderRadius)            base.borderRadius = s.borderRadius;
  // Always apply border together so none of the three properties goes missing
  if (s.borderWidth && s.borderWidth !== "0px") {
    base.borderWidth = s.borderWidth;
    base.borderStyle = ext.borderStyle  || "solid";
    base.borderColor = s.borderColor    || "#e2e8f0";
  } else if (s.borderColor) {
    // User may set border color even without explicit width — keep it visible
    base.borderWidth = "1.5px";
    base.borderStyle = ext.borderStyle  || "solid";
    base.borderColor = s.borderColor;
  }

  // ── Spacing & visibility ────────────────────────────────────────────────────
  // For card nodes: padding goes on the body div, not the outer wrapper
  // (the stripe sits at the top of the wrapper and must not be indented).
  // We pass it as a CSS custom property and pick it up in .node-card-body.
  if (s.padding && node.uniqueName !== "card") base.padding = s.padding;
  if (s.padding && node.uniqueName === "card")  base["--card-body-padding"] = s.padding;
  if (ext.opacity != null)       base.opacity     = String(ext.opacity);
  if (ext.boxShadow)             base.boxShadow   = ext.boxShadow;

  return base;
}

// ── Active format style ───────────────────────────────────────────────────────
const activeFormatStyle = computed<NodeStyle>(() => {
  if (selectedNodeId.value) {
    const n = nodeMap.get(selectedNodeId.value);
    if (n?.style) return n.style;
  }
  return mapBackendStyle(DEFAULT_BACKEND_STYLE);
});

const selectedNode = computed<MindNode | null>(() =>
  selectedNodeId.value ? (nodeMap.get(selectedNodeId.value) || null) : null
);


// ── watchEffect: rebuild on data change ──────────────────────────────────────
watchEffect(() => {
  if (!props.listsData) return;
  nextTick(() => {
    nodeMap.clear();
    const root = buildTree(props.listsData);
    assignParents(root);
    rootNodeId.value = root.id;
    layoutTree(root, 60, 60);
    // Recalc SVG extents
    let mx = 0, my = 0;
    for (const n of flattenVisible(root)) {
      mx = Math.max(mx, n.x + n.width);
      my = Math.max(my, n.y + n.height);
    }
    svgW.value = Math.max(mx + 300, 3000);
    svgH.value = Math.max(my + 300, 3000);
    // Auto-center on first build
    nextTick(() => centerView());
  });
});

// ── Center / fit ─────────────────────────────────────────────────────────────
function centerView() {
  const vp = viewportEl.value;
  if (!vp || allNodes.value.length === 0) return;
  const vW = vp.clientWidth;
  const vH = vp.clientHeight;
  // find bounding box of all nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of allNodes.value) {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
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
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of allNodes.value) {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const pad = 60;
  const scaleX = (vp.clientWidth  - pad * 2) / (maxX - minX);
  const scaleY = (vp.clientHeight - pad * 2) / (maxY - minY);
  zoom.value = Math.max(minZoom, Math.min(maxZoom, Math.min(scaleX, scaleY)));
  panX.value = pad - minX * zoom.value;
  panY.value = pad - minY * zoom.value;
}

function handleResetView() {
  zoom.value = 0.85;
  nextTick(() => centerView());
}

// ── Zoom ──────────────────────────────────────────────────────────────────────
function handleWheel(e: WheelEvent) {
  const vp = viewportEl.value;
  if (!vp) return;
  const rect  = vp.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const delta  = e.deltaY > 0 ? -zoomStep : zoomStep;
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom.value + delta));
  // Zoom towards mouse pointer
  const ratio = newZoom / zoom.value;
  panX.value = mouseX - (mouseX - panX.value) * ratio;
  panY.value = mouseY - (mouseY - panY.value) * ratio;
  zoom.value = newZoom;
}

function handleZoomIn()  { const c = getCenter(); zoomAt(c.x, c.y, zoomStep);  }
function handleZoomOut() { const c = getCenter(); zoomAt(c.x, c.y, -zoomStep); }

function getCenter() {
  const vp = viewportEl.value;
  if (!vp) return { x: 400, y: 300 };
  return { x: vp.clientWidth / 2, y: vp.clientHeight / 2 };
}

function zoomAt(cx: number, cy: number, delta: number) {
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom.value + delta));
  const ratio   = newZoom / zoom.value;
  panX.value    = cx - (cx - panX.value) * ratio;
  panY.value    = cy - (cy - panY.value) * ratio;
  zoom.value    = newZoom;
}

// ── Pan (left-click drag on viewport background) ──────────────────────────────
function handleViewportMouseDown(e: MouseEvent) {
  // Only pan when clicking directly on viewport/canvas (not a node)
  if (e.target !== viewportEl.value && e.target !== canvasEl.value) return;
  if (e.button !== 0) return;
  isPanning.value = true;
  panStart.value  = { x: e.clientX - panX.value, y: e.clientY - panY.value };
  e.preventDefault();
}

function handleGlobalMouseMove(e: MouseEvent) {
  // Node drag
  if (draggedNodeId.value) {
    const x = (e.clientX - panX.value) / zoom.value - dragOffset.value.x;
    const y = (e.clientY - panY.value) / zoom.value - dragOffset.value.y;
    const n = nodeMap.get(draggedNodeId.value);
    if (n) { n.x = x; n.y = y; }
    return;
  }
  // Pan
  if (!isPanning.value) return;
  panX.value = e.clientX - panStart.value.x;
  panY.value = e.clientY - panStart.value.y;
}

function handleGlobalMouseUp() {
  isPanning.value     = false;
  draggedNodeId.value = null;
}

// ── Node drag ─────────────────────────────────────────────────────────────────
function handleNodeMouseDown(e: MouseEvent, nodeId: string) {
  const n = nodeMap.get(nodeId);
  if (!n) return;
  draggedNodeId.value = nodeId;
  const cx = (e.clientX - panX.value) / zoom.value;
  const cy = (e.clientY - panY.value) / zoom.value;
  dragOffset.value = { x: cx - n.x, y: cy - n.y };
  e.preventDefault();
  e.stopPropagation();
}

// ── Node click ────────────────────────────────────────────────────────────────
function handleNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId;
  const node = nodeMap.get(nodeId);
  if (!node) return;
  // The sheet picker is now embedded inside the List node and shows automatically
  // when isPlanRoute && selectedNodeId === node.id — no external popover needed.
  hyperlinkInput.value = node.hyperLink || node.style?.hyperLink || "";
}

function handleCanvasClick(e: MouseEvent) {
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement;
    if (!target.closest(".card-ctx-menu")) closeCtxMenu();
    return;
  }
  if (e.target === viewportEl.value || e.target === canvasEl.value) {
    selectedNodeId.value  = null;
    sheetSelector.visible = false;
  }
}

function handleOpenNode(node: MindNode) { emit("select:ticket", node); }
function handleDeleteNode(nodeId: string) { emit("delete:ticket", nodeId); }

function toggleCollapse(nodeId: string) {
  const n = nodeMap.get(nodeId);
  if (!n) return;
  // Toggle in the reactive Set (guaranteed Vue tracking)
  if (isCollapsed(nodeId)) {
    expandNode(nodeId);
    n.collapsed = false;
  } else {
    collapseNode(nodeId);
    n.collapsed = true;
  }
  collapseVersion.value++;
  const root = nodeMap.get(rootNodeId.value);
  if (root) layoutTree(root, 60, 60);
}

// ── Format sidebar ────────────────────────────────────────────────────────────
function openFormatSidebar(nodeId: string) {
  selectedNodeId.value    = nodeId;
  showFormatSidebar.value = true;
  const n = nodeMap.get(nodeId);
  hyperlinkInput.value = n?.hyperLink || n?.style?.hyperLink || "";
}

function onStyleChange(prop: string, event: Event) {
  if (!selectedNodeId.value) return;
  const node = nodeMap.get(selectedNodeId.value);
  if (!node) return;
  if (!node.style) node.style = {};
  const t     = event.target as HTMLInputElement;
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

function applyStyleProp(style: NodeStyle & Record<string, any>, prop: string, value: any) {
  const map: Record<string, () => void> = {
    bg_color:      () => { style.background   = value; },
    color:         () => { style.color        = value; },
    font_size:     () => { style.fontSize     = `${value}px`; },
    font_weight:   () => { style.fontWeight   = value; },
    font_style:    () => { style.fontStyle    = value; },
    font_family:   () => { style.fontFamily   = value; },
    text_align:    () => { style.textAlign    = value; },
    border_color:  () => { style.borderColor  = value; },
    border_width:  () => { style.borderWidth  = `${value}px`; },
    border_radius: () => { style.borderRadius = `${value}px`; },
    border_style:  () => { style.borderStyle  = value; },
    padding:       () => { style.padding      = `${value}px`; },
    opacity:       () => { style.opacity      = Number(value); },
    box_shadow:    () => { style.boxShadow    = value; },
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
    const s    = plain.style   || {};
    const orig = plain._originalStyle;
    const p = {
      bg_color:      resolveStyle(s.background,   orig.bg_color,      DEFAULT_BACKEND_STYLE.bg_color),
      color:         resolveStyle(s.color,         orig.color,         DEFAULT_BACKEND_STYLE.color),
      font_size:     resolveStyle(s.fontSize ? parseInt(s.fontSize) : undefined, orig.font_size, DEFAULT_BACKEND_STYLE.font_size),
      font_weight:   resolveStyle(s.fontWeight,    orig.font_weight,   DEFAULT_BACKEND_STYLE.font_weight),
      font_style:    resolveStyle(s.fontStyle,     orig.font_style,    DEFAULT_BACKEND_STYLE.font_style),
      font_family:   resolveStyle(s.fontFamily,    orig.font_family,   DEFAULT_BACKEND_STYLE.font_family),
      text_align:    resolveStyle((s as any).textAlign,   orig.text_align,    DEFAULT_BACKEND_STYLE.text_align),
      border_color:  resolveStyle(s.borderColor,   orig.border_color,  DEFAULT_BACKEND_STYLE.border_color),
      border_width:  resolveStyle(s.borderWidth  ? parseInt(s.borderWidth)  : undefined, orig.border_width,  DEFAULT_BACKEND_STYLE.border_width),
      border_radius: resolveStyle(s.borderRadius ? parseInt(s.borderRadius) : undefined, orig.border_radius, DEFAULT_BACKEND_STYLE.border_radius),
      border_style:  resolveStyle((s as any).borderStyle, orig.border_style,  DEFAULT_BACKEND_STYLE.border_style),
      padding:       resolveStyle(s.padding ? parseInt(s.padding) : undefined, orig.padding, DEFAULT_BACKEND_STYLE.padding),
      opacity:       resolveStyle((s as any).opacity, orig.opacity, DEFAULT_BACKEND_STYLE.opacity),
      box_shadow:    resolveStyle((s as any).boxShadow, orig.box_shadow, DEFAULT_BACKEND_STYLE.box_shadow),
      hyperLink:     hyperlinkInput.value || plain.hyperLink || "",
    };
    plain._originalStyle = { ...p };
    plain.hyperLink      = p.hyperLink;
    if (plain.uniqueName === "sheet") {
      emit("update:sheet", { sheet_id: plain.id, workspace_id: props.workspaceId, workspace_module_id: props.moduleId, style: p });
    } else {
      emit("update:card",  { card_id: plain.id, seat_id: plain.seat_id, style: p });
    }
    toast.success("Style saved");
  } catch (err) {
    console.error(err);
    toast.error("Failed to save style");
  } finally {
    isSavingNodeStyle.value = false;
  }
}

// ── Hyperlink modal ───────────────────────────────────────────────────────────
function openHyperlinkModal(cb: (l: string) => void) {
  hyperlink.value = ""; showHyperlinkModal.value = true; resolveCallback.value = cb;
}
function confirmHyperlink() {
  if (resolveCallback.value) resolveCallback.value(hyperlink.value);
  showHyperlinkModal.value = false;
}
function cancelHyperlink() { showHyperlinkModal.value = false; }

// ── Sheet selector ────────────────────────────────────────────────────────────

/** Position the picker relative to the List node's DOM element (mirrors reference). */
function positionAndOpenSheetSelector(node: MindNode) {
  // Try to find the node's rendered DOM element by its id
  const el = document.getElementById(node.id) as HTMLElement | null;
  if (el) {
    const rect = el.getBoundingClientRect();
    sheetSelector.x = Math.min(rect.left, window.innerWidth - 260);
    sheetSelector.y = Math.min(rect.bottom + 6, window.innerHeight - 200);
  } else {
    // Fallback: right side of viewport
    sheetSelector.x = Math.max(20, window.innerWidth - 280);
    sheetSelector.y = 80;
  }
  sheetSelector.selectedSheetId = selectedListSheetId.value || props.selectedSheetId || "";
  sheetSelector.listNodeObj     = node;
  showMustSelectMessage.value   = false;
  sheetSelector.visible         = true;
}

/** Open picker as prerequisite before creating a card (Enter / ctx / inline). */
function openPlanSheetPicker(listNode: MindNode, title: string, mode: "direct" | "inline") {
  pendingCard.listNode = listNode;
  pendingCard.title    = title;
  pendingCard.mode     = mode;
  positionAndOpenSheetSelector(listNode);
}

/** Called when user picks a sheet from the plan-route picker.
 *  If there's a pending card (Enter / ctx / inline flow) → create it.
 *  If the picker was opened by clicking a List node (info mode) → just store the sheet. */
async function onPlanSheetSelected(sheetId: string) {
  if (!sheetId) {
    showMustSelectMessage.value = true;
    setTimeout(() => { showMustSelectMessage.value = false; }, 2500);
    return;
  }
  selectedListSheetId.value         = sheetId;
  sheetSelector.selectedSheetId     = sheetId;

  const { listNode, title, mode } = pendingCard;

  // No pending card — user just clicked a List node to pre-select the sheet
  if (!listNode) {
    closeSheetSelector();
    return;
  }

  // Pending card: create it with the selected sheet
  pendingCard.listNode = null;
  closeSheetSelector();

  if (mode === "inline") {
    await _doCreateCard(title, listNode, sheetId);
    cancelInlineCreation();
  } else {
    await _doCreateCard(title, listNode, sheetId);
  }
}

/** Core card creation logic — shared by both direct and inline flows */
async function _doCreateCard(title: string, listNode: MindNode, sheetId: string) {
  isCreatingCard.value = true;
  try {
    const payload = createDefaultCardPayload({ topic: title }, listNode, sheetId);
    emit("create:card", payload);
    const tempId = `temp-card-${Date.now()}`;
    const h = nodeHeight({ uniqueName: "card", variables: payload.variables } as any);
    const tempCard: MindNode = {
      id: tempId, sheet_id: sheetId, topic: title,
      style: {}, _originalStyle: {},
      children: [], parent: listNode, uniqueName: "card",
      variables: payload.variables,
      x: 0, y: 0, width: 200, height: h, collapsed: false,
    };
    listNode.children.push(tempCard);
    nodeMap.set(tempId, tempCard);
    const root = nodeMap.get(rootNodeId.value);
    if (root) layoutTree(root, 60, 60);
    selectedNodeId.value = tempId;
    toast.success(`Card "${title}" created`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to create card");
  } finally {
    isCreatingCard.value = false;
  }
}

function closeSheetSelector() {
  sheetSelector.visible = false;
  sheetSelector.listNodeObj = null;
  showMustSelectMessage.value = false;
  // Also clear any pending card if user dismissed without selecting
  if (pendingCard.listNode) {
    pendingCard.listNode = null;
    pendingCard.title    = "";
  }
}

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(d?: string): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return d; }
}

// ── Card creation helpers ────────────────────────────────────────────────────
// Matches the exact reference payload shape from MindmapView (original)
function createDefaultCardPayload(nodeObj: { topic: string }, listNode: MindNode, sheetId?: string) {
  const now       = new Date();
  const startDate = now.toISOString().split("T")[0];
  const endDate   = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const payload: any = {
    sheet_list_id: listNode.topic || "To Do",
    workspace_id:  props.workspaceId,
    sheet_id:      sheetId ?? props.selectedSheetId,
    variables: {
      "card-status":      "To Do",
      priority:           "medium",
      process:            null,
      "card-title":       nodeObj.topic || "New Card",
      "card-description": "This is a default description",
      "start-date":       startDate,
      "end-date":         endDate,
    },
    createdAt: new Date().toISOString(),
  };
  if (route.path.includes("plan")) {
    payload.sprint_id = localStorage.getItem("activeSprintId") || null;
  }
  return payload;
}

/** Start inline creation for the List parent of the currently selected card */
function startInlineCardCreation(listNode: MindNode) {
  creatingCardForListId.value = listNode.id;
  newCardTitle.value          = "";
  // expand the list if collapsed
  if (listNode.collapsed) {
    listNode.collapsed = false;
    const root = nodeMap.get(rootNodeId.value);
    if (root) layoutTree(root, 60, 60);
  }
  // select the list so it's visually active
  selectedNodeId.value = listNode.id;
  // autofocus attr on the input handles focusing
}

function cancelInlineCreation() {
  creatingCardForListId.value = null;
  newCardTitle.value          = "";
  isCreatingCard.value        = false;
  // Return focus to viewport so keyboard shortcuts keep working
  nextTick(() => { viewportEl.value?.focus(); });
}

async function submitInlineCard() {
  const title = newCardTitle.value.trim();
  if (!title || isCreatingCard.value) return;

  const listId = creatingCardForListId.value;
  if (!listId) return;
  const listNode = nodeMap.get(listId);
  if (!listNode) return;

  // On plan routes: use embedded picker, which is already visible when list is selected
  if (isPlanRoute.value && !listNode.sheet_id) {
    if (!selectedListSheetId.value) {
      selectedNodeId.value = listNode.id;
      showMustSelectMessage.value = true;
      setTimeout(() => { showMustSelectMessage.value = false; }, 2500);
      return;
    }
    await _doCreateCard(title, listNode, selectedListSheetId.value);
    cancelInlineCreation();
    return;
  }

  const sheetId = listNode.sheet_id || selectedListSheetId.value || props.selectedSheetId;
  await _doCreateCard(title, listNode, sheetId);
  cancelInlineCreation();
}

// ── Context menu ─────────────────────────────────────────────────────────────
const ctxMenuNode = computed<MindNode | null>(() =>
  ctxMenu.nodeId ? (nodeMap.get(ctxMenu.nodeId) || null) : null
);

function handleNodeContextMenu(e: MouseEvent, node: MindNode) {
  // Only show context menu for card nodes
  if (node.uniqueName !== "card") return;
  e.preventDefault();
  e.stopPropagation();
  selectedNodeId.value = node.id;
  // Position near cursor, keep inside viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 210;
  const menuH = 200;
  ctxMenu.x       = Math.min(e.clientX, vw - menuW - 8);
  ctxMenu.y       = Math.min(e.clientY, vh - menuH - 8);
  ctxMenu.nodeId  = node.id;
  ctxMenu.visible = true;
  // Skip the immediately-following global click so the menu doesn't close
  ctxSkipNextClick = true;
}

function closeCtxMenu() {
  ctxMenu.visible = false;
  ctxMenu.nodeId  = null;
}

function ctxAddCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  if (!node || node.uniqueName !== "card") return;
  const listNode = node.parent;
  if (!listNode || listNode.uniqueName !== "List") return;
  // Short delay so menu closes before async work begins
  nextTick(() => createCardDirectly(listNode));
}

function ctxOpenCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  nextTick(() => { if (node) handleOpenNode(node); });
}

function ctxFormatCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  nextTick(() => { if (node) openFormatSidebar(node.id); });
}

function ctxDeleteCard() {
  const node = ctxMenuNode.value;
  closeCtxMenu();
  nextTick(() => { if (node) handleDeleteNode(node.id); });
}

// ── Direct card creation (Enter key / ctx menu — straight to API) ───────────
async function createCardDirectly(listNode: MindNode) {
  if (isCreatingCard.value) return;
  const title = "New Card";

  // On plan routes: sheet must be selected via embedded picker inside the List node
  if (isPlanRoute.value && !listNode.sheet_id) {
    if (!selectedListSheetId.value) {
      selectedNodeId.value = listNode.id;  // show the embedded picker
      showMustSelectMessage.value = true;
      setTimeout(() => { showMustSelectMessage.value = false; }, 2500);
      return;
    }
    await _doCreateCard(title, listNode, selectedListSheetId.value);
    return;
  }

  const sheetId = listNode.sheet_id || selectedListSheetId.value || props.selectedSheetId;
  await _doCreateCard(title, listNode, sheetId);
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
function handleKeyDown(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
  if (e.key === "Escape")  {
    if (ctxMenu.visible) { closeCtxMenu(); return; }
    selectedNodeId.value = null; sheetSelector.visible = false;
  }
  if (e.key === "c" || e.key === "C") centerView();
  if (e.key === "f" || e.key === "F") fitToScreen();
  if (e.key === "r" || e.key === "R") handleResetView();
  if (e.key === "+" || (e.ctrlKey && e.key === "=")) { e.preventDefault(); handleZoomIn(); }
  if (e.key === "-" || (e.ctrlKey && e.key === "-")) { e.preventDefault(); handleZoomOut(); }
  if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId.value) {
    const n = nodeMap.get(selectedNodeId.value);
    if (n?.uniqueName === "card" && props.canDeleteCard) handleDeleteNode(selectedNodeId.value);
  }
  // Enter on a selected card → directly create a sibling card via API (non-plan only)
  if (e.key === "Enter" && selectedNodeId.value && props.canCreateCard && !isPlanRoute.value) {
    e.preventDefault();
    const n = nodeMap.get(selectedNodeId.value);
    if (n?.uniqueName === "card" && n.parent?.uniqueName === "List") {
      createCardDirectly(n.parent);
    }
    // Enter on a List node → directly create a card in it
    if (n?.uniqueName === "List") {
      createCardDirectly(n);
    }
  }
  // Escape cancels inline creation (for the hover "+" flow)
  if (e.key === "Escape" && creatingCardForListId.value) {
    cancelInlineCreation();
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
function handleGlobalClick(e: MouseEvent) {
  // Skip the first click right after opening (it's the same mouseup from right-click)
  if (ctxSkipNextClick) { ctxSkipNextClick = false; return; }
  // Close context menu if click lands outside it
  if (ctxMenu.visible) {
    const target = e.target as HTMLElement;
    if (!target.closest(".card-ctx-menu")) closeCtxMenu();
  }
}

onMounted(() => {
  document.addEventListener("mousemove", handleGlobalMouseMove);
  document.addEventListener("mouseup",   handleGlobalMouseUp);
  document.addEventListener("keydown",   handleKeyDown);
  document.addEventListener("click",     handleGlobalClick);
  document.addEventListener("contextmenu", () => { if (ctxMenu.visible) closeCtxMenu(); });
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleGlobalMouseMove);
  document.removeEventListener("mouseup",   handleGlobalMouseUp);
  document.removeEventListener("keydown",   handleKeyDown);
  document.removeEventListener("click",     handleGlobalClick);
});
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────────── */
.mindmap-root {
  background: var(--bg-surface, #f8fafc);
  font-family: inherit;
}

/* ── Viewport ──────────────────────────────────────────────────────────────── */
.viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-surface, #f8fafc);
  background-image:
    linear-gradient(var(--mindmap-grid, rgba(0,0,0,.06)) 1px, transparent 1px),
    linear-gradient(90deg, var(--mindmap-grid, rgba(0,0,0,.06)) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* ── Canvas ────────────────────────────────────────────────────────────────── */
.canvas-area {
  position: absolute;
  top: 0; left: 0;
}

/* ── SVG connections ───────────────────────────────────────────────────────── */
.connections-svg {
  position: absolute;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}
.edge-path {
  opacity: 0.6;
  transition: opacity 0.2s;
}

/* ── Base node ─────────────────────────────────────────────────────────────── */
.mm-node {
  position: absolute;
  z-index: 2;
  border: 1.5px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0,0,0,.1);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.mm-node:active { cursor: grabbing; }
.mm-node:hover  { box-shadow: 0 4px 16px rgba(0,0,0,.16); }
.mm-node--selected {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 2px rgba(99,102,241,.3), 0 4px 16px rgba(0,0,0,.18) !important;
}

/* ── Node type background DEFAULTS (low specificity so inline style always wins) ── */
/* Using :where() gives specificity of 0, ensuring inline style overrides it      */
/* Pastel palette matching the reference custom mindmap screenshot                  */
:where(.mm-node--root)  { background: #e8f4f0; color: #1a3a30; }
:where(.mm-node--sheet) { background: #eef6ee; color: #1a3a1a; }
:where(.mm-node--List)  { background: #fef8ee; color: #3a2a0a; }
:where(.mm-node--card)  { background: var(--bg-card, #ffffff); color: var(--text-primary, #1a1a3a); }

/* ── ROOT ──────────────────────────────────────────────────────────────────── */
.mm-node--root {
  border-radius: 28px;
  border-color: #c5ddd7;
}
.node-root-inner {
  height: 100%;
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 0 20px;
}
.node-root-icon { font-size: 18px; opacity: 0.75; flex-shrink: 0; }
.node-root-title {
  color: inherit;
  font-size: 15px; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── SHEET ─────────────────────────────────────────────────────────────────── */
.mm-node--sheet {
  border-color: #c6e6c6;
  border-radius: 10px;
}
.node-sheet-inner { height: 100%; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.node-sheet-header { display: flex; align-items: center; gap: 7px; }
.node-sheet-icon { color: #2d7a2d; font-size: 13px; flex-shrink: 0; }
.node-sheet-title { flex:1; font-size: 13px; font-weight: 600; color: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.node-sheet-meta { display: flex; gap: 6px; }
.meta-pill {
  font-size: 10px; color: inherit; opacity: 0.65;
  background: rgba(0,0,0,.07); border-radius: 20px;
  padding: 1px 8px;
}

/* ── LIST ──────────────────────────────────────────────────────────────────── */
.mm-node--List {
  border-color: #f5dfa0;
  border-radius: 8px;
  overflow: visible;  /* allow inline card input to pop out below */
}
.node-list-inner { height: 100%; padding: 8px 12px 6px; display: flex; flex-direction: column; gap: 3px; }
.node-list-header { display: flex; align-items: center; gap: 7px; }
.node-list-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #d4a017; flex-shrink: 0;
}
.node-list-title { flex:1; font-size: 12px; font-weight: 600; color: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* node-list-count defined once below with the card section */

/* ── CARD ──────────────────────────────────────────────────────────────────── */
.mm-node--card {
  border-color: #d4d4f8;
  border-radius: 8px;
}
.node-card-inner { height: 100%; display: flex; flex-direction: column; }
.node-card-stripe {
  height: 4px; flex-shrink: 0;
  border-radius: 6px 6px 0 0;
}
.node-card-body {
  flex: 1; padding: var(--card-body-padding, 6px 10px 6px);
  display: flex; flex-direction: column; gap: 4px;
  overflow: hidden;
  /* Note: when user sets padding via format sidebar it applies to .mm-node wrapper,
     so the stripe + body layout is unaffected */
}
.node-card-header {
  display: flex; align-items: flex-start; gap: 4px;
}
.node-card-title {
  flex: 1;
  font-size: 12px; font-weight: 600;
  color: inherit;          /* inherits from nodeInlineStyle color */
  line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-clamp: 2;
  overflow: hidden;
}
.node-card-tags {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.card-tag {
  font-size: 9.5px; font-weight: 500;
  border-radius: 4px; padding: 1px 6px;
  white-space: nowrap;
}
.card-tag--status  { background: #ede9fe; color: #7c3aed; }
.card-tag--low     { background: #dcfce7; color: #16a34a; }
.card-tag--medium  { background: #fef9c3; color: #a16207; }
.card-tag--high    { background: #fee2e2; color: #dc2626; }
.card-tag--critical{ background: #1e293b; color: #f1f5f9; }
.card-tag--process { background: #e0f2fe; color: #0369a1; }

.node-card-dates {
  display: flex; align-items: center; gap: 4px;
  font-size: 9.5px; color: inherit; opacity: 0.65;
}
.node-card-desc {
  font-size: 10.5px; color: inherit; opacity: 0.7; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-clamp: 2;
  overflow: hidden;
}
.node-list-count { font-size: 10px; color: inherit; opacity: 0.6; padding-left: 15px; }
.node-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto;
}
.card-link {
  font-size: 9.5px; color: #6366f1; text-decoration: none;
  display: flex; align-items: center; gap: 3px;
}
.card-link:hover { text-decoration: underline; }
.card-seat { opacity: .4; }

/* ── Shared node utilities ─────────────────────────────────────────────────── */
.node-actions {
  display: flex; gap: 2px; margin-left: auto; flex-shrink: 0;
  opacity: 0; transition: opacity 0.15s;
}
.mm-node:hover .node-actions { opacity: 1; }
.nact {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  border-radius: 4px; font-size: 10px;
  color: inherit; opacity: 0.65;
  transition: background 0.12s, opacity 0.12s;
}
.nact:hover { background: rgba(0,0,0,.07); opacity: 1; }
.nact--danger:hover { color: #ef4444 !important; }
.nact--open:hover   { color: #6366f1 !important; }
.nact--add:hover    { color: #22c55e !important; }

/* ── List node: add card button ────────────────────────────────────────────── */
.list-add-card-btn {
  display: none;
  width: 100%; margin-top: 4px;
  padding: 3px 8px;
  font-size: 10px; font-weight: 500;
  color: #6366f1; background: rgba(99,102,241,.07);
  border: 1px dashed rgba(99,102,241,.3); border-radius: 5px;
  cursor: pointer; text-align: left;
  transition: background 0.12s, border-color 0.12s;
  align-items: center; gap: 5px;
}
.list-add-card-btn i { font-size: 9px; }
.mm-node--List:hover .list-add-card-btn { display: flex; }
.list-add-card-btn:hover {
  background: rgba(99,102,241,.14); border-color: rgba(99,102,241,.5);
}

/* ── Inline card creation ──────────────────────────────────────────────────── */
.inline-create-card {
  margin-top: 6px;
  display: flex; flex-direction: column; gap: 4px;
  /* overflow visible so it pops out of the node boundary */
  position: relative; z-index: 10;
}
.inline-card-input {
  width: 100%; padding: 5px 8px;
  font-size: 11px; font-weight: 500;
  color: var(--text-primary, #1e293b);
  background: var(--bg-card, #fff);
  border: 1.5px solid #6366f1; border-radius: 5px;
  outline: none; box-shadow: 0 0 0 2px rgba(99,102,241,.15);
  box-sizing: border-box;
}
.inline-card-input::placeholder { color: #94a3b8; font-weight: normal; }
.inline-card-actions {
  display: flex; gap: 4px; justify-content: flex-end;
}
.inline-btn {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 4px; cursor: pointer; font-size: 10px;
  transition: background 0.12s;
}
.inline-btn--confirm {
  background: #6366f1; color: #fff;
}
.inline-btn--confirm:hover:not(:disabled) { background: #4f46e5; }
.inline-btn--confirm:disabled { background: #a5b4fc; cursor: not-allowed; }
.inline-btn--cancel {
  background: var(--bg-surface, #f1f5f9); color: var(--text-secondary, #64748b);
}
.inline-btn--cancel:hover { background: var(--border, #e2e8f0); }

.node-collapsed-badge {
  font-size: 9px; color: inherit; opacity: 0.6;
  margin-top: 2px;
}
.node-link {
  position: absolute; top: 4px; right: 4px;
  font-size: 9px; color: inherit; text-decoration: none; opacity: 0.5;
}
.node-link:hover { opacity: 1; }

/* ── Empty state ───────────────────────────────────────────────────────────── */
.canvas-placeholder {
  position: absolute; top: 200px; left: 400px;
  transform: translate(-50%, 0);
  text-align: center; pointer-events: none;
}

/* ── Canvas controls ───────────────────────────────────────────────────────── */
.canvas-controls {
  position: absolute; top: 16px; left: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  z-index: 100;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px; padding: 8px 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
}
.ctrl-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 6px; background: transparent; cursor: pointer;
  font-size: 12px; color: var(--text-secondary, #64748b);
  transition: all 0.15s;
}
.ctrl-btn:hover, .ctrl-btn--active {
  background: var(--accent, #6366f1); color: #fff;
  border-color: var(--accent, #6366f1);
}
.ctrl-divider { width: 20px; height: 1px; background: var(--border, #e2e8f0); margin: 1px 0; }
.zoom-label { font-size: 9px !important; font-weight: 700 !important; color: var(--text-secondary, #94a3b8) !important; letter-spacing: .03em; }

.canvas-stats {
  position: absolute; bottom: 20px; right: 20px;
  display: flex; gap: 12px;
  font-size: 11px; color: var(--text-secondary, #94a3b8);
  background: var(--bg-card, rgba(255,255,255,.9));
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px; padding: 4px 12px;
  z-index: 100; backdrop-filter: blur(6px);
}

/* ── Format sidebar ────────────────────────────────────────────────────────── */
.format-sidebar {
  width: 280px; min-width: 280px;
  display: flex; flex-direction: column;
  border-left: 1px solid var(--border, #e2e8f0);
  background: var(--bg-card, #fff);
  overflow: hidden;
  /* Hard reset — prevents any inherited font/color from leaking in from the canvas */
  font-size: 13px !important;
  font-weight: normal !important;
  font-style: normal !important;
  font-family: inherit !important;
  color: var(--text-primary, #1e293b) !important;
  text-align: left !important;
  opacity: 1 !important;
}
.fs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--border, #f1f5f9);
  flex-shrink: 0;
}
.fs-header-left { display: flex; align-items: center; gap: 8px; font-size: 13px !important; font-weight: 600 !important; color: var(--text-primary, #1e293b) !important; font-style: normal !important; font-family: inherit !important; }
.fs-close {
  width: 24px; height: 24px; border: none; background: transparent; cursor: pointer;
  border-radius: 4px; color: var(--text-secondary, #94a3b8);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.fs-close:hover { background: var(--bg-surface, #f1f5f9); color: var(--text-primary, #1e293b); }

.fs-node-name {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px 6px;
  /* Hard reset — no inherited styles from nodes */
  font-size: 13px !important;
  font-weight: normal !important;
  color: var(--text-primary, #1e293b) !important;
  font-family: inherit !important;
  font-style: normal !important;
  border-bottom: 1px solid var(--border, #f1f5f9);
}
.fs-node-icon { font-size: 10px; flex-shrink: 0; }
.fs-icon--root  { color: #6366f1; }
.fs-icon--sheet { color: #3b82f6; }
.fs-icon--List  { color: #22c55e; }
.fs-icon--card  { color: #f59e0b; }
.fs-node-label {
  flex: 1; font-size: 12px !important; font-weight: 600 !important;
  color: var(--text-primary, #1e293b) !important;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fs-node-type {
  font-size: 9px !important; font-weight: 500 !important;
  text-transform: uppercase; letter-spacing: .06em;
  color: #94a3b8 !important;
  background: #f1f5f9; border-radius: 4px; padding: 1px 6px;
  flex-shrink: 0;
}

.fs-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.6;
}

.fs-body { flex: 1; overflow-y: auto; }
.fs-body::-webkit-scrollbar { width: 5px; }
.fs-body::-webkit-scrollbar-track { background: transparent; }
.fs-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }


.fs-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, #f1f5f9);
}
.fs-section-label {
  font-size: 9.5px !important; font-weight: 700 !important; text-transform: uppercase;
  letter-spacing: .07em; color: #94a3b8 !important; margin-bottom: 8px;
  font-style: normal !important; font-family: inherit !important;
}
.fs-row { display: flex; gap: 8px; }
.fs-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.fs-field label { font-size: 10.5px !important; font-weight: 500 !important; color: #64748b !important; font-style: normal !important; }

.fs-input {
  width: 100%; padding: 4px 6px;
  background: var(--bg-surface, #f8fafc) !important;
  border: 1px solid var(--border, #e2e8f0); border-radius: 5px;
  font-size: 12px !important; color: var(--text-primary, #1e293b) !important;
  font-weight: normal !important; font-style: normal !important;
  outline: none;
}
.fs-input:focus { border-color: var(--accent, #6366f1); box-shadow: 0 0 0 2px rgba(99,102,241,.15); }

.fs-input-full {
  width: 100%; padding: 5px 8px;
  background: var(--bg-surface, #f8fafc) !important;
  border: 1px solid var(--border, #e2e8f0); border-radius: 5px;
  font-size: 12px !important; color: var(--text-primary, #1e293b) !important;
  font-weight: normal !important; font-style: normal !important;
  outline: none; box-sizing: border-box;
}
.fs-input-full:focus { border-color: var(--accent, #6366f1); box-shadow: 0 0 0 2px rgba(99,102,241,.15); }

.fs-select {
  width: 100%; padding: 4px 6px;
  background: var(--bg-surface, #f8fafc) !important;
  border: 1px solid var(--border, #e2e8f0); border-radius: 5px;
  font-size: 11.5px !important; color: var(--text-primary, #1e293b) !important;
  font-weight: normal !important; font-style: normal !important;
  outline: none;
}
.fs-select:focus { border-color: var(--accent, #6366f1); }

.input-with-unit {
  position: relative; display: flex; align-items: center;
}
.input-with-unit .fs-input { padding-right: 26px; }
.unit {
  position: absolute; right: 6px;
  font-size: 9.5px; font-weight: 600; color: #94a3b8; pointer-events: none;
}

/* Color pickers */
.color-row { display: flex; align-items: center; gap: 6px; }
.color-swatch {
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  position: relative; cursor: pointer;
  border: 1px solid rgba(0,0,0,.1);
  overflow: hidden;
}
.color-swatch input[type="color"] {
  position: absolute; inset: 0; opacity: 0; cursor: pointer;
  width: 100%; height: 100%;
}
.color-hex {
  flex: 1; padding: 4px 6px; font-size: 11px;
  background: var(--bg-surface, #f8fafc);
  border: 1px solid var(--border, #e2e8f0); border-radius: 5px;
  color: var(--text-primary, #1e293b); font-family: monospace;
}

/* Presets */
.fs-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.preset-swatch {
  width: 22px; height: 22px; border-radius: 5px; cursor: pointer;
  border: 2px solid transparent; transition: transform 0.1s, box-shadow 0.1s;
}
.preset-swatch:hover { transform: scale(1.2); box-shadow: 0 2px 8px rgba(0,0,0,.2); }

/* Text align */
.btn-group-row { display: flex; gap: 4px; }
.align-btn {
  flex: 1; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-surface, #f8fafc); border: 1px solid var(--border, #e2e8f0);
  border-radius: 5px; cursor: pointer; font-size: 12px; color: #64748b;
  transition: all 0.12s;
}
.align-btn:hover, .align-btn--active {
  background: var(--accent, #6366f1); color: #fff; border-color: var(--accent, #6366f1);
}

/* Shadow presets */
.shadow-presets { display: flex; flex-wrap: wrap; gap: 5px; }
.shadow-btn {
  padding: 3px 10px; font-size: 10.5px; font-weight: 500;
  background: var(--bg-surface, #f8fafc); border: 1px solid var(--border, #e2e8f0);
  border-radius: 5px; cursor: pointer; color: #475569;
  transition: all 0.12s;
}
.shadow-btn:hover, .shadow-btn--active {
  background: var(--accent, #6366f1); color: #fff; border-color: var(--accent, #6366f1);
}

.fs-reset-btn {
  width: 100%; padding: 6px; font-size: 11px; color: #94a3b8;
  background: transparent; border: 1px dashed #e2e8f0; border-radius: 6px;
  cursor: pointer; transition: all 0.12s;
}
.fs-reset-btn:hover { border-color: #f87171; color: #ef4444; background: #fef2f2; }

.fs-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--border, #f1f5f9);
  flex-shrink: 0;
}
.fs-save-btn {
  width: 100%; padding: 8px;
  background: var(--accent, #6366f1); color: #fff;
  border: none; border-radius: 7px; cursor: pointer;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity 0.15s, box-shadow 0.15s;
}
.fs-save-btn:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(99,102,241,.4); }
.fs-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Embedded sheet picker (plan route, inside List node) ──────────────────── */
.list-sheet-picker {
  margin-top: 6px;
  background: var(--bg-surface, #f8fafc);
  border: 1px dashed rgba(99,102,241,.35);
  border-radius: 6px;
  padding: 6px 8px;
  display: flex; flex-direction: column; gap: 5px;
}
.list-sheet-picker-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 9.5px !important; font-weight: 600 !important;
  color: #6366f1 !important; text-transform: uppercase; letter-spacing: .05em;
}
.list-sheet-picker-selected {
  margin-left: auto;
  font-size: 9px !important; font-weight: 500 !important;
  color: #22c55e !important;
  max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.list-sheet-picker-error {
  font-size: 9px !important; color: #ef4444 !important;
  display: flex; align-items: center; gap: 3px; margin: 0;
}

/* ── Add list panel ────────────────────────────────────────────────────────── */
.add-list-panel {
  position: absolute; top: 160px; left: 280px;
  background: var(--bg-body, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 10px; padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  z-index: 200; min-width: 320px;
}
.add-list-input {
  width: 100%; padding: 8px 12px; font-size: 13px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 6px; outline: none;
  background: var(--bg-surface, #f8fafc);
  color: var(--text-primary, #1e293b);
}
.add-list-input:focus { border-color: var(--accent, #6366f1); }
.add-list-btn {
  padding: 6px 16px; background: var(--accent, #6366f1);
  color: #fff; border: none; border-radius: 6px;
  cursor: pointer; font-size: 13px; font-weight: 500;
}

/* ── Hyperlink modal ───────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.3); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-card {
  background: #fff; border-radius: 14px; padding: 24px; width: 340px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.modal-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; color: #1e293b; }
.modal-input {
  width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0;
  border-radius: 7px; font-size: 13px; outline: none; box-sizing: border-box;
}
.modal-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.modal-btn-cancel {
  padding: 7px 16px; border: 1px solid #e2e8f0; border-radius: 7px;
  background: #f1f5f9; cursor: pointer; font-size: 13px; color: #475569;
}
.modal-btn-confirm {
  padding: 7px 16px; background: #6366f1; color: #fff;
  border: none; border-radius: 7px; cursor: pointer; font-size: 13px; font-weight: 600;
}
.modal-btn-confirm.disabled { background: #a5b4fc; cursor: not-allowed; }

/* ── Card context menu ─────────────────────────────────────────────────────── */
.card-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-card, #fff);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.08);
  padding: 6px;
  min-width: 200px;
  /* Full isolation — no inherited node styles */
  font-size: 13px !important;
  font-weight: normal !important;
  font-style: normal !important;
  color: #1e293b !important;
  font-family: inherit !important;
}
.ctx-header {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 10px 8px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 4px;
}
.ctx-header-icon {
  color: #6366f1; font-size: 12px; flex-shrink: 0;
}
.ctx-header-title {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 150px;
}
.ctx-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 7px 10px;
  background: transparent; border: none; border-radius: 6px;
  cursor: pointer; text-align: left;
  font-size: 12px !important; font-weight: 500 !important;
  color: #374151 !important;
  transition: background 0.1s;
}
.ctx-item:hover { background: #f8fafc; }
.ctx-item--danger { color: #ef4444 !important; }
.ctx-item--danger:hover { background: #fef2f2; }
.ctx-item-icon {
  font-size: 11px; width: 14px; text-align: center; flex-shrink: 0;
}
.ctx-icon--add    { color: #22c55e; }
.ctx-icon--open   { color: #6366f1; }
.ctx-icon--format { color: #f59e0b; }
.ctx-item--danger .ctx-item-icon { color: #ef4444; }
.ctx-kbd {
  margin-left: auto; flex-shrink: 0;
  font-size: 9px !important; font-weight: 500 !important;
  color: #94a3b8 !important;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  border-radius: 3px; padding: 1px 5px;
  font-family: monospace !important;
}
.ctx-divider {
  height: 1px; background: #f1f5f9; margin: 4px 0;
}

/* ── Transitions ───────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

.slide-sidebar-enter-active, .slide-sidebar-leave-active { transition: width 0.22s ease, opacity 0.22s ease; }
.slide-sidebar-enter-from, .slide-sidebar-leave-to { width: 0 !important; opacity: 0; }

/* ═══════════════════════════════════════════════════════════════════════════
   DARK MODE — triggered by [data-dark="true"] on .mindmap-root
   Every light value has a dark counterpart here. No JS inline styles needed.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Canvas background ───────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] { background: var(--bg-surface, #0f172a); }
.mindmap-root[data-dark="true"] .viewport {
  background: var(--bg-surface, #0f172a);
  --mindmap-grid: rgba(255,255,255,.04);
  background-image:
    linear-gradient(var(--mindmap-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--mindmap-grid) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* ── Node defaults (low specificity via :where so user inline styles win) ── */
.mindmap-root[data-dark="true"] :where(.mm-node--root)  { background: #1e3a2f; color: #a7f3d0; }
.mindmap-root[data-dark="true"] :where(.mm-node--sheet) { background: #1a2e1a; color: #86efac; }
.mindmap-root[data-dark="true"] :where(.mm-node--List)  { background: #2a2000; color: #fde68a; }
.mindmap-root[data-dark="true"] :where(.mm-node--card)  { background: var(--bg-card, #1e1b4b); color: var(--text-primary, #c7d2fe); }

/* ── Node borders ───────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .mm-node--root  { border-color: #2d6a52; }
.mindmap-root[data-dark="true"] .mm-node--sheet { border-color: #2d5a2d; }
.mindmap-root[data-dark="true"] .mm-node--List  { border-color: #6b4e00; }
.mindmap-root[data-dark="true"] .mm-node--card  { border-color: #3730a3; }
.mindmap-root[data-dark="true"] .mm-node        { box-shadow: 0 1px 6px rgba(0,0,0,.5); }
.mindmap-root[data-dark="true"] .mm-node:hover  { box-shadow: 0 4px 20px rgba(0,0,0,.6); }

/* ── Sheet node internals ───────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .node-sheet-icon { color: #4ade80; }
.mindmap-root[data-dark="true"] .meta-pill       { background: rgba(255,255,255,.08); }

/* ── List node internals ────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .node-list-dot { background: #ca8a04; }

/* ── Card node internals ────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .card-tag--status  { background: #3b0764; color: #d8b4fe; }
.mindmap-root[data-dark="true"] .card-tag--low     { background: #052e16; color: #86efac; }
.mindmap-root[data-dark="true"] .card-tag--medium  { background: #422006; color: #fde68a; }
.mindmap-root[data-dark="true"] .card-tag--high    { background: #450a0a; color: #fca5a5; }
.mindmap-root[data-dark="true"] .card-tag--critical{ background: #f1f5f9; color: #1e293b; }
.mindmap-root[data-dark="true"] .card-tag--process { background: #0c4a6e; color: #7dd3fc; }
.mindmap-root[data-dark="true"] .card-link         { color: #818cf8; }

/* ── Canvas controls ────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .canvas-controls {
  background: var(--bg-card, #1e293b);
  border-color: var(--border, #334155);
  box-shadow: 0 4px 16px rgba(0,0,0,.5);
}
.mindmap-root[data-dark="true"] .ctrl-btn {
  border-color: var(--border, #334155);
  color: var(--text-secondary, #94a3b8);
}
.mindmap-root[data-dark="true"] .ctrl-btn:hover,
.mindmap-root[data-dark="true"] .ctrl-btn--active {
  background: #6366f1; color: #fff; border-color: #6366f1;
}
.mindmap-root[data-dark="true"] .ctrl-divider { background: #334155; }
.mindmap-root[data-dark="true"] .zoom-label   { color: #64748b !important; }

/* ── Canvas stats ────────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .canvas-stats {
  background: rgba(15,23,42,.85);
  border-color: #334155;
  color: #64748b;
}

/* ── Nact buttons ────────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .nact:hover { background: rgba(255,255,255,.1); }

/* ── Inline card input ───────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .inline-card-input {
  background: var(--bg-card, #1e293b);
  color: var(--text-primary, #e2e8f0);
  border-color: #6366f1;
}
.mindmap-root[data-dark="true"] .inline-card-input::placeholder { color: #475569; }
.mindmap-root[data-dark="true"] .inline-btn--cancel {
  background: var(--bg-surface, #334155); color: var(--text-secondary, #94a3b8);
}
.mindmap-root[data-dark="true"] .inline-btn--cancel:hover { background: var(--border, #475569); }
.mindmap-root[data-dark="true"] .list-add-card-btn {
  color: #818cf8;
  background: rgba(99,102,241,.12);
  border-color: rgba(99,102,241,.3);
}

/* ── Format sidebar ──────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .format-sidebar {
  background: var(--bg-card, #1e293b) !important;
  border-color: var(--border, #334155) !important;
  color: var(--text-primary, #e2e8f0) !important;
}
.mindmap-root[data-dark="true"] .fs-header        { border-color: #334155; }
.mindmap-root[data-dark="true"] .fs-header-left   { color: #e2e8f0 !important; }
.mindmap-root[data-dark="true"] .fs-close         { color: #64748b; }
.mindmap-root[data-dark="true"] .fs-close:hover   { background: #334155; color: #e2e8f0; }
.mindmap-root[data-dark="true"] .fs-node-name     { color: #e2e8f0 !important; border-color: #334155; }
.mindmap-root[data-dark="true"] .fs-node-label    { color: #e2e8f0 !important; }
.mindmap-root[data-dark="true"] .fs-node-type     { background: #334155; color: #64748b !important; }
.mindmap-root[data-dark="true"] .fs-empty         { color: #475569; }
.mindmap-root[data-dark="true"] .fs-section       { border-color: #334155; }
.mindmap-root[data-dark="true"] .fs-section-label { color: #475569 !important; }
.mindmap-root[data-dark="true"] .fs-field label   { color: #64748b !important; }
.mindmap-root[data-dark="true"] .fs-input {
  background: var(--bg-surface, #0f172a) !important;
  border-color: var(--border, #334155) !important;
  color: var(--text-primary, #e2e8f0) !important;
}
.mindmap-root[data-dark="true"] .fs-input-full {
  background: var(--bg-surface, #0f172a) !important;
  border-color: var(--border, #334155) !important;
  color: var(--text-primary, #e2e8f0) !important;
}
.mindmap-root[data-dark="true"] .fs-select {
  background: var(--bg-surface, #0f172a) !important;
  border-color: var(--border, #334155) !important;
  color: var(--text-primary, #e2e8f0) !important;
}
.mindmap-root[data-dark="true"] .color-hex  { background: #0f172a; border-color: #334155; color: #e2e8f0; }
.mindmap-root[data-dark="true"] .align-btn  { background: #0f172a; border-color: #334155; color: #64748b; }
.mindmap-root[data-dark="true"] .shadow-btn { background: #0f172a; border-color: #334155; color: #94a3b8; }
.mindmap-root[data-dark="true"] .fs-reset-btn { border-color: #334155; color: #475569; }
.mindmap-root[data-dark="true"] .fs-reset-btn:hover { background: #450a0a; color: #f87171; border-color: #7f1d1d; }
.mindmap-root[data-dark="true"] .fs-footer    { border-color: #334155; }
.mindmap-root[data-dark="true"] .unit         { color: #475569; }

/* ── Context menu ────────────────────────────────────────────────────────── */
.card-ctx-menu--dark {
  background: var(--bg-card, #1e293b) !important;
  border-color: var(--border, #334155) !important;
  box-shadow: 0 8px 32px rgba(0,0,0,.5) !important;
  color: var(--text-primary, #e2e8f0) !important;
}
.card-ctx-menu--dark .ctx-header        { border-color: #334155; }
.card-ctx-menu--dark .ctx-header-title  { color: #e2e8f0 !important; }
.card-ctx-menu--dark .ctx-item          { color: #cbd5e1 !important; }
.card-ctx-menu--dark .ctx-item:hover    { background: #334155; }
.card-ctx-menu--dark .ctx-item--danger  { color: #f87171 !important; }
.card-ctx-menu--dark .ctx-item--danger:hover { background: #450a0a; }
.card-ctx-menu--dark .ctx-divider       { background: #334155; }
.card-ctx-menu--dark .ctx-kbd           { background: #334155; border-color: #475569; color: #64748b !important; }

/* ── Sheet selector popover ──────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .sheet-selector-popover {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
}
.mindmap-root[data-dark="true"] .sheet-selector-label { color: #475569; }

/* ── Add list panel ──────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .add-list-panel {
  background: #1e293b;
  border-color: #334155;
}
.mindmap-root[data-dark="true"] .add-list-input {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

/* ── Scrollbar (dark) ────────────────────────────────────────────────────── */
.mindmap-root[data-dark="true"] .fs-body::-webkit-scrollbar-thumb { background: #334155; }

</style>