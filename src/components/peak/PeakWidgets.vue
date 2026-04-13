<template>
  <div class="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-5 px-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-[10px] bg-[var(--bg-lavender)] flex items-center justify-center text-[var(--accent)] text-base flex-shrink-0">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <div>
          <h1 class="text-lg font-bold text-[var(--text-primary)] m-0 leading-tight">Peak</h1>
          <p class="text-xs text-[var(--text-secondary)] m-0">Live workspace insights</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
          @click="fetchAllPinnedWidgetData"
          :disabled="store.isLoadingWidgets"
          title="Refresh all"
        >
          <i class="fa-solid fa-rotate" :class="{ 'fa-spin': store.isLoadingWidgets }"></i>
        </button>
        <button class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" @click="openAddModal">
          <i class="fa-solid fa-plus"></i>
          <span>Add Widget</span>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!store.isLoadingWidgets && store.pinnedWidgets.length === 0 && !store.pendingProposal"
      class="flex flex-col items-center justify-center py-16 px-6 text-center gap-3"
    >
      <div class="w-14 h-14 bg-[var(--bg-lavender)] rounded-2xl flex items-center justify-center text-[22px] text-[var(--accent)] mb-1">
        <i class="fa-solid fa-chart-pie"></i>
      </div>
      <h3 class="text-base font-bold text-[var(--text-primary)] m-0">No widgets yet</h3>
      <p class="text-[13px] text-[var(--text-secondary)] m-0 max-w-[300px]">Add widgets to track your workspace metrics in real time.</p>
      <button class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)]" @click="openAddModal">
        <i class="fa-solid fa-plus"></i> Add your first widget
      </button>
    </div>

    <!-- Pending agent proposal banner -->
    <div v-if="store.pendingProposal" class="flex items-center justify-between flex-wrap gap-3 bg-[var(--bg-lavender)] border border-[rgba(125,104,200,0.25)] rounded-[10px] p-3 px-4 mb-5">
      <div class="flex items-center gap-3">
        <div class="w-[34px] h-[34px] rounded-lg bg-[var(--accent)] text-white flex items-center justify-center text-sm flex-shrink-0">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <p class="text-[11px] text-[var(--text-secondary)] m-0">Agent suggested a widget</p>
          <p class="text-[13px] font-semibold text-[var(--text-primary)] m-0">{{ store.pendingProposal?.title }}</p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <button class="px-2.5 py-[5px] bg-transparent text-[var(--text-secondary)] border border-[var(--border)] rounded-md text-xs cursor-pointer transition-colors hover:bg-[var(--bg-surface)]" @click="store.clearPendingProposal()">Dismiss</button>
        <button class="inline-flex items-center gap-1.5 px-3 py-[5px] bg-[var(--accent)] text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed" @click="acceptProposal" :disabled="store.isSaving">
          <i class="fa-solid fa-thumbtack"></i> Pin to Peak
        </button>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="store.isLoadingWidgets" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
      <div v-for="i in 4" :key="i" class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col gap-2.5 pointer-events-none">
        <div class="h-3 bg-[var(--bg-surface)] rounded-md w-2/5 animate-pulse"></div>
        <div class="h-3 bg-[var(--bg-surface)] rounded-md w-4/5 animate-pulse"></div>
        <div class="h-12 bg-[var(--bg-surface)] rounded-lg mt-1 animate-pulse"></div>
      </div>
    </div>

    <!-- Widgets grid -->
    <div v-else-if="store.pinnedWidgets.length > 0" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
      <div
        v-for="widget in store.pinnedWidgets"
        :key="widget._id"
        class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden transition-all duration-150 relative group hover:border-[rgba(125,104,200,0.35)] hover:shadow-[0_4px_16px_rgba(125,104,200,0.1)]"
        :class="{ 'opacity-85': store.isWidgetDataLoading(widget._id) }"
      >
        <!-- Card header -->
        <div class="flex items-start gap-2.5 p-3.5 pb-2.5 border-b border-[var(--border)]">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            :style="{ background: widget.color ? widget.color + '18' : 'var(--bg-lavender)', color: widget.color || 'var(--accent)' }"
          >
            <span class="text-base leading-none">{{ widget.icon || "📊" }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-bold text-[var(--text-primary)] m-0 truncate">{{ widget.title }}</p>
            <p class="text-[10px] text-[var(--text-secondary)] mt-0.5 m-0 capitalize">{{ widget.query?.entity }} · {{ widget.query?.result_type }}</p>
          </div>
          <div class="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed" @click="refreshWidget(widget._id)" title="Refresh" :disabled="store.isWidgetDataLoading(widget._id)">
              <i class="fa-solid fa-rotate" :class="{ 'fa-spin': store.isWidgetDataLoading(widget._id) }"></i>
            </button>
            <button class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]" @click="openEditModal(widget)" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed" @click="confirmDelete(widget)" title="Delete" :disabled="store.isWidgetDeleting(widget._id)">
              <i class="fa-solid fa-trash" :class="{ 'fa-spin': store.isWidgetDeleting(widget._id) }"></i>
            </button>
          </div>
        </div>

        <!-- Card body -->
        <div class="flex-1 p-3.5">
          <template v-if="store.isWidgetDataLoading(widget._id)">
            <div class="flex items-center justify-center h-20 text-[var(--text-secondary)] text-lg">
              <i class="fa-solid fa-circle-notch fa-spin"></i>
            </div>
          </template>

          <template v-else-if="store.getWidgetData(widget._id)">
            <!-- LIST -->
            <template v-if="widget.query?.result_type === 'list'">
              <div>
                <div class="inline-block text-[10px] font-semibold px-2 py-0.5 bg-[var(--bg-lavender)] text-[var(--accent)] rounded-full mb-2">
                  {{ store.getWidgetData(widget._id)?.data?.total ?? 0 }} items
                </div>
                <ul class="list-none m-0 p-0 flex flex-col gap-[5px]">
                  <li v-for="(item, idx) in (store.getWidgetData(widget._id)?.data?.items ?? []).slice(0, 5)" :key="idx" class="flex items-center gap-[7px] text-xs text-[var(--text-primary)]">
                    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: widget.color || 'var(--accent)' }"></span>
                    <span class="flex-1 truncate">{{ item?.variables?.["card-title"] || item?.title || "Untitled" }}</span>
                    <span v-if="item?.variables?.['card-status']" class="text-[10px] px-1.5 py-0.5 bg-[var(--bg-surface)] rounded text-[var(--text-secondary)] flex-shrink-0">{{ item.variables["card-status"] }}</span>
                  </li>
                </ul>
                <p v-if="(store.getWidgetData(widget._id)?.data?.total ?? 0) > 5" class="text-[11px] text-[var(--text-secondary)] mt-1.5 mb-0 pl-3">
                  +{{ (store.getWidgetData(widget._id)?.data?.total ?? 0) - 5 }} more
                </p>
              </div>
            </template>

            <!-- COUNT -->
            <template v-else-if="widget.query?.result_type === 'count'">
              <div class="flex flex-col items-center justify-center py-3 gap-1">
                <p class="text-[40px] font-bold leading-none m-0" :style="{ color: widget.color || 'var(--accent)' }">
                  {{ (store.getWidgetData(widget._id)?.data?.value ?? 0).toLocaleString() }}
                </p>
                <p class="text-xs text-[var(--text-secondary)] m-0 text-center">{{ store.getWidgetData(widget._id)?.data?.label || widget.description }}</p>
              </div>
            </template>

            <!-- COMPUTED -->
            <template v-else-if="widget.query?.result_type === 'computed'">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-baseline gap-1.5">
                  <p class="text-[36px] font-bold leading-none m-0" :style="{ color: widget.color || 'var(--accent)' }">{{ store.getWidgetData(widget._id)?.data?.value ?? 0 }}</p>
                  <p class="text-sm text-[var(--text-secondary)] m-0">{{ store.getWidgetData(widget._id)?.data?.unit }}</p>
                </div>
                <p class="text-xs text-[var(--text-secondary)] m-0">{{ store.getWidgetData(widget._id)?.data?.label }}</p>
                <div v-if="store.getWidgetData(widget._id)?.data?.completed != null" class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300" :style="{ width: Math.round((store.getWidgetData(widget._id)?.data?.completed / store.getWidgetData(widget._id)?.data?.total) * 100) + '%', background: widget.color || 'var(--accent)' }"></div>
                  </div>
                  <span class="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">{{ store.getWidgetData(widget._id)?.data?.completed }}/{{ store.getWidgetData(widget._id)?.data?.total }}</span>
                </div>
              </div>
            </template>

            <!-- CHART -->
            <template v-else-if="widget.query?.result_type === 'chart'">
              <div>
                <div class="flex items-baseline gap-[5px] mb-2.5">
                  <span class="text-[22px] font-bold text-[var(--text-primary)]">{{ store.getWidgetData(widget._id)?.data?.total ?? 0 }}</span>
                  <span class="text-xs text-[var(--text-secondary)]">total</span>
                </div>
                <div class="flex flex-col gap-[7px]">
                  <div v-for="(series, idx) in store.getWidgetData(widget._id)?.data?.series ?? []" :key="idx" class="flex items-center gap-2">
                    <div class="text-[11px] text-[var(--text-secondary)] w-[72px] flex-shrink-0 truncate">{{ series.label }}</div>
                    <div class="flex-1 h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-300 min-w-1" :style="{ width: Math.round((Number(series.value) / (store.getWidgetData(widget._id)?.data?.total || 1)) * 100) + '%', background: widget.color || getChartColor(idx) }"></div>
                    </div>
                    <div class="text-[11px] font-semibold text-[var(--text-primary)] w-6 text-right flex-shrink-0">{{ series.value }}</div>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- No data -->
          <template v-else>
            <div class="flex items-center justify-center gap-1.5 h-20 text-xs text-[var(--text-secondary)]">
              <i class="fa-solid fa-circle-info"></i>
              <span>No data — click refresh</span>
            </div>
          </template>
        </div>

        <!-- Card footer -->
        <div class="flex items-center justify-between px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-surface)]">
          <span v-if="store.getWidgetData(widget._id)?.resolved_at" class="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
            <i class="fa-regular fa-clock"></i>
            {{ formatTime(store.getWidgetData(widget._id)?.resolved_at) }}
          </span>
          <span v-if="widget.refresh_interval > 0" class="text-[10px] text-[var(--text-secondary)]">Auto {{ widget.refresh_interval }}s</span>
        </div>
      </div>
    </div>

    <!-- ── Add/Edit Widget Modal ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" @click.self="closeModal">
          <div class="bg-[var(--bg-card)] rounded-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]">

            <!-- Modal header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <h2 class="text-[15px] font-bold text-[var(--text-primary)] m-0">
                {{ editingWidget ? "Edit Widget" : "Add Widget" }}
              </h2>
              <button class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]" @click="closeModal">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
               
            <!-- ── AI FIRST VIEW (shown when not in manual mode) ── -->
            <template v-if="!showManualForm">
              <div class="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

                <!-- AI Textarea -->
                <div class="bg-bg-card border border-[var(--border)] rounded-xl p-4 shadow-sm relative">
                  <textarea
                    v-model="aiPrompt"
                    rows="4"
                    placeholder="Ask Orchit AI to create a widget..."
                    class="w-full resize-none border-none outline-none text-[14px] text-[var(--text-primary)] placeholder-[var(--text-secondary)] bg-transparent leading-relaxed"
                    style="font-family: inherit;"
                  />
                  <div class="flex justify-end mt-2">
                    <button
                      class="w-9 h-9 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer border-none transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="generateWithAi"
                      :disabled="isAiGenerating || !aiPrompt.trim()"
                    >
                      <i v-if="isAiGenerating" class="fa-solid fa-spinner fa-spin text-sm"></i>
                      <i v-else class="fa-solid fa-microphone text-sm"></i>
                    </button>
                  </div>
                </div>

                <!-- Suggestions -->
                <div>
                  <p class="text-[13px] text-[var(--text-secondary)] text-center mb-3">Or try these examples:</p>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      v-for="suggestion in aiSuggestions"
                      :key="suggestion"
                      @click="aiPrompt = suggestion"
                      class="text-left px-3 py-3 rounded-xl border border-[var(--border)] text-[12px] text-[var(--text-secondary)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer leading-snug"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </div>

                <!-- Divider with OR -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-px bg-[var(--border)]"></div>
                  <span class="text-[12px] text-[var(--text-secondary)] font-medium">OR</span>
                  <div class="flex-1 h-px bg-[var(--border)]"></div>
                </div>

                <!-- Create Manually button -->
                <button
                  @click="showManualForm = true"
                  class="w-full py-3 rounded-xl bg-[var(--accent)] text-white text-[14px] font-semibold border-none cursor-pointer transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Create Widget Manually
                </button>
              </div>

              <!-- Footer for AI view -->
              <div class="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border)] flex-shrink-0">
                <button class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)]" @click="closeModal">Cancel</button>
                <button
                  class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="generateWithAi"
                  :disabled="isAiGenerating || !aiPrompt.trim()"
                >
                  <i v-if="isAiGenerating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-sparkles"></i>
                  <span>{{ isAiGenerating ? "Generating..." : "Generate widget" }}</span>
                </button>
              </div>
            </template>

            <!-- ── MANUAL FORM VIEW ── -->
            <template v-else>
              <!-- Back button row -->
              <div class="px-5 pt-3 flex-shrink-0" v-if="!editingWidget">
                <button @click="showManualForm = false" class="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer transition-colors p-0">
                  <i class="fa-solid fa-arrow-left text-[11px]"></i> Back
                </button>
              </div>

              <div class="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-3">
                <!-- Basic Info -->
                <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1">Basic Info</div>

                <div class="flex flex-col gap-[5px]">
                  <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Title <span class="text-red-500 ml-0.5">*</span></label>
                  <input v-model="form.title" type="text" placeholder="e.g. My Today Tasks" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(125,104,200,0.15)]" />
                </div>

                <div class="flex flex-col gap-[5px]">
                  <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Description</label>
                  <input v-model="form.description" type="text" placeholder="Optional description" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(125,104,200,0.15)]" />
                </div>

                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Icon (emoji)</label>
                    <input v-model="form.icon" type="text" placeholder="📋" maxlength="2" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]" />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Accent color</label>
                    <div class="flex items-center gap-2">
                      <input v-model="form.color" type="color" class="w-9 h-9 border border-[var(--border)] rounded-[7px] cursor-pointer p-0.5 bg-[var(--bg-input,#fff)] flex-shrink-0" />
                      <input v-model="form.color" type="text" placeholder="#7D68C8" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all flex-1 box-border focus:border-[var(--accent)]" />
                    </div>
                  </div>
                </div>

                <!-- Query -->
                <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1">Query</div>

                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Entity</label>
                    <select v-model="form.query.entity" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="cards">Cards</option>
                      <option value="sprints">Sprints</option>
                      <option value="sprint_backlog">Sprint Backlog</option>
                      <option value="token_usage">Token Usage</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Result type</label>
                    <select v-model="form.query.result_type" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="list">List</option>
                      <option value="count">Count</option>
                      <option value="computed">Computed</option>
                      <option value="chart">Chart</option>
                    </select>
                  </div>
                </div>

                <div class="flex gap-3 flex-wrap" v-if="form.query.result_type === 'chart'">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Chart type</label>
                    <select v-model="form.query.chart_type" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="bar">Bar</option>
                      <option value="pie">Pie</option>
                      <option value="donut">Donut</option>
                      <option value="line">Line</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Group by field</label>
                    <input v-model="form.query.group_by" type="text" placeholder="variables.card-status" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]" />
                  </div>
                </div>

                <div class="flex flex-col gap-[5px]" v-if="form.query.result_type === 'computed' && form.query.entity === 'sprints'">
                  <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Formula</label>
                  <select v-model="form.query.formula" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                    <option value="days_until_end">Days until end</option>
                    <option value="days_since_start">Days since start</option>
                    <option value="completion_percentage">Completion %</option>
                  </select>
                </div>

                <!-- Filters -->
                <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1">Filters</div>

                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Assigned to</label>
                    <select v-model="form.query.filters.assigned_to" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="">Anyone</option>
                      <option value="$ME">Me ($ME)</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Date filter</label>
                    <select v-model="form.query.filters.date_filter.value" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="">None</option>
                      <option value="today">Today</option>
                      <option value="this_week">This week</option>
                      <option value="this_month">This month</option>
                      <option value="next_7_days">Next 7 days</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div class="flex gap-3 flex-wrap" v-if="form.query.entity === 'cards'">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Status</label>
                    <input v-model="form.query.filters.status" type="text" placeholder="In Progress" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]" />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Priority</label>
                    <select v-model="form.query.filters.priority" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="">Any</option>
                      <option value="highest">Highest</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="lowest">Lowest</option>
                    </select>
                  </div>
                </div>

                <div class="flex gap-3 flex-wrap" v-if="form.query.entity === 'sprints' || form.query.entity === 'sprint_backlog'">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Sprint status</label>
                    <select v-model="form.query.filters.sprint_status" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="">Any</option>
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <!-- Display -->
                <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1">Display</div>

                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Limit (list)</label>
                    <input v-model.number="form.query.limit" type="number" min="1" max="100" placeholder="20" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]" />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Auto-refresh (seconds)</label>
                    <input v-model.number="form.refresh_interval" type="number" min="0" placeholder="300" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]" />
                  </div>
                </div>

                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Sort by</label>
                    <input v-model="form.query.sort_by" type="text" placeholder="created_at" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]" />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]">Sort order</label>
                    <select v-model="form.query.sort_order" class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]">
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>

                <div class="flex flex-col gap-[5px]">
                  <label class="flex items-center gap-2 text-[13px] text-[var(--text-primary)] cursor-pointer font-normal">
                    <input type="checkbox" v-model="form.is_pinned" class="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
                    Pin widget to dashboard
                  </label>
                </div>
              </div>

              <!-- Manual form footer -->
              <div class="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border)] flex-shrink-0">
                <button class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)]" @click="closeModal">Cancel</button>
                <button
                  class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="saveWidget"
                  :disabled="store.isSaving || !form.title.trim()"
                >
                  <i v-if="store.isSaving" class="fa-solid fa-spinner fa-spin"></i>
                  <span>{{ editingWidget ? "Save changes" : "Create widget" }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" @click.self="showDeleteModal = false">
          <div class="bg-[var(--bg-card)] rounded-2xl w-full max-w-[380px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <h2 class="text-[15px] font-bold text-[var(--text-primary)] m-0">Delete widget</h2>
              <button class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]" @click="showDeleteModal = false">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="px-5 py-4 overflow-y-auto flex-1">
              <p class="text-[13px] text-[var(--text-primary)] leading-relaxed m-0">
                Are you sure you want to delete <strong>{{ widgetToDelete?.title }}</strong>? This cannot be undone.
              </p>
            </div>
            <div class="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border)] flex-shrink-0">
              <button class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)]" @click="showDeleteModal = false">Cancel</button>
              <button
                class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-red-500 text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="deleteWidget"
                :disabled="!!widgetToDelete && store.isWidgetDeleting(widgetToDelete._id)"
              >
                <i v-if="!!widgetToDelete && store.isWidgetDeleting(widgetToDelete._id)" class="fa-solid fa-spinner fa-spin"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useWidgetStore } from "../../stores/widgets";
import { useAgentStore } from "../../stores/agentStore";
import { useAuthStore } from "../../stores/auth";
import { useRouteIds } from "../../composables/useQueryParams";
const { workspaceId } = useRouteIds();
type Entity = "cards" | "sprints" | "sprint_backlog" | "token_usage";
type ResultType = "list" | "count" | "computed" | "chart";
type ChartType = "bar" | "pie" | "donut" | "line";
type SortOrder = "asc" | "desc";
type Priority = "" | "highest" | "high" | "medium" | "low" | "lowest";
type SprintStatus = "" | "planning" | "active" | "completed" | "cancelled";
type DateFilterValue = "" | "today" | "this_week" | "this_month" | "next_7_days" | "overdue";
type Formula = "days_until_end" | "days_since_start" | "completion_percentage";

interface WidgetForm {
  title: string;
  description: string;
  icon: string;
  color: string;
  is_pinned: boolean;
  refresh_interval: number;
  query: {
    entity: Entity;
    result_type: ResultType;
    chart_type: ChartType;
    formula: Formula;
    group_by: string;
    sort_by: string;
    sort_order: SortOrder;
    limit: number;
    filters: {
      assigned_to: string;
      status: string;
      priority: Priority;
      sprint_status: SprintStatus;
      date_filter: { type: "relative"; value: DateFilterValue };
    };
  };
}

interface Widget {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  is_pinned: boolean;
  is_preview?: boolean;
  pin_order?: number;
  refresh_interval: number;
  query?: {
    entity?: string; result_type?: string; chart_type?: string; formula?: string;
    group_by?: string; sort_by?: string; sort_order?: string; limit?: number;
    aggregation?: string;
    filters?: { assigned_to?: string; status?: string; priority?: string; sprint_status?: string; date_filter?: { type?: string; value?: string } };
  };
}

const props = defineProps<{ workspaceId: string }>();
const store = useWidgetStore();

const showModal = ref(false);
const showDeleteModal = ref(false);
const showManualForm = ref(false);
const editingWidget = ref<Widget | null>(null);
const widgetToDelete = ref<Widget | null>(null);
const authStore = useAuthStore()
const aiPrompt = ref('');
const isAiGenerating = ref(false);
const agentStore = useAgentStore();
const agentsCreated = computed(() => agentStore.agentsCreated);
const aiSuggestions = [
  'A widget where all tasks and projects start...',
  'A widget for tasks that are actively being worked on...',
  'A widget where finished tasks and projects are...',
  'This is a new widget used for the purpose of the...',
  'High priority cards assigned to me this week',
  'Active sprint completion percentage',
];

const defaultForm = (): WidgetForm => ({
  title: "", description: "", icon: "📊", color: "#7D68C8", is_pinned: true, refresh_interval: 300,
  query: {
    entity: "cards", result_type: "list", chart_type: "bar", formula: "days_until_end",
    group_by: "", sort_by: "created_at", sort_order: "desc", limit: 20,
    filters: { assigned_to: "$ME", status: "", priority: "", sprint_status: "", date_filter: { type: "relative", value: "today" } },
  },
});

const form = ref<WidgetForm>(defaultForm());
const refreshTimers = ref<Record<string, ReturnType<typeof setInterval>>>({});

function setupAutoRefresh(widget: Widget): void {
  if (!widget.refresh_interval || widget.refresh_interval <= 0) return;
  clearWidgetTimer(widget._id);
  refreshTimers.value[widget._id] = setInterval(() => { store.fetchWidgetData(widget._id); }, widget.refresh_interval * 1000);
}
function clearWidgetTimer(id: string): void {
  if (refreshTimers.value[id]) { clearInterval(refreshTimers.value[id]); delete refreshTimers.value[id]; }
}

async function fetchAssignedAgents() {
  await agentStore.fetchSavedAgents(
    workspaceId.value,
    "peak",
  );
}
onMounted(async () => {
  await store.fetchWidgets(props.workspaceId);
  await store.fetchAllPinnedWidgetData();
  await fetchAssignedAgents();
  
  store.pinnedWidgets.forEach((w: Widget) => setupAutoRefresh(w));
});
onBeforeUnmount(() => { Object.keys(refreshTimers.value).forEach(clearWidgetTimer); });

async function fetchAllPinnedWidgetData(): Promise<void> { await store.fetchAllPinnedWidgetData(); }
async function refreshWidget(id: string): Promise<void> { await store.refreshWidget(id); }

function openAddModal(): void {
  editingWidget.value = null;
  form.value = defaultForm();
  showManualForm.value = false;
  aiPrompt.value = '';
  showModal.value = true;
}

function openEditModal(widget: Widget): void {
  editingWidget.value = widget;
  showManualForm.value = true; // edit always goes straight to form
  form.value = {
    title: widget.title, description: widget.description ?? "", icon: widget.icon ?? "📊",
    color: widget.color ?? "#7D68C8", is_pinned: widget.is_pinned, refresh_interval: widget.refresh_interval ?? 300,
    query: {
      entity: (widget.query?.entity as Entity) ?? "cards", result_type: (widget.query?.result_type as ResultType) ?? "list",
      chart_type: (widget.query?.chart_type as ChartType) ?? "bar", formula: (widget.query?.formula as Formula) ?? "days_until_end",
      group_by: widget.query?.group_by ?? "", sort_by: widget.query?.sort_by ?? "created_at",
      sort_order: (widget.query?.sort_order as SortOrder) ?? "desc", limit: widget.query?.limit ?? 20,
      filters: {
        assigned_to: widget.query?.filters?.assigned_to ?? "$ME", status: widget.query?.filters?.status ?? "",
        priority: (widget.query?.filters?.priority as Priority) ?? "",
        sprint_status: (widget.query?.filters?.sprint_status as SprintStatus) ?? "",
        date_filter: { type: "relative", value: (widget.query?.filters?.date_filter?.value as DateFilterValue) ?? "today" },
      },
    },
  };
  showModal.value = true;
}

function closeModal(): void { showModal.value = false; editingWidget.value = null; }

watch(showModal, (val) => { if (!val) { showManualForm.value = false; aiPrompt.value = ''; } });

function buildQueryPayload(): Record<string, unknown> {
  const f = form.value;
  const cleanFilters: Record<string, unknown> = {};
  if (f.query.filters.assigned_to) cleanFilters.assigned_to = f.query.filters.assigned_to;
  if (f.query.filters.status) cleanFilters.status = f.query.filters.status;
  if (f.query.filters.priority) cleanFilters.priority = f.query.filters.priority;
  if (f.query.filters.sprint_status) cleanFilters.sprint_status = f.query.filters.sprint_status;
  if (f.query.filters.date_filter.value) {
    cleanFilters.date_field = "variables.start-date";
    cleanFilters.date_filter = { type: "relative", value: f.query.filters.date_filter.value };
  }
  const query: Record<string, unknown> = {
    entity: f.query.entity, result_type: f.query.result_type, filters: cleanFilters,
    sort_by: f.query.sort_by || undefined, sort_order: f.query.sort_order || undefined, limit: f.query.limit || 20,
  };
  if (f.query.result_type === "chart") { query.chart_type = f.query.chart_type; query.group_by = f.query.group_by; query.aggregation = "count"; }
  if (f.query.result_type === "computed") { query.formula = f.query.formula; }
  return query;
}

async function saveWidget(): Promise<void> {
  const f = form.value;
  const queryPayload = buildQueryPayload();
  if (editingWidget.value) {
    const updates: Record<string, unknown> = { title: f.title, description: f.description || null, icon: f.icon, color: f.color, is_pinned: f.is_pinned, refresh_interval: f.refresh_interval, query: queryPayload };
    const updated: Widget | null = await store.updateWidgetViaAgent(props.workspaceId, editingWidget.value._id, updates);
    if (updated) { clearWidgetTimer(editingWidget.value._id); setupAutoRefresh(updated); await store.fetchWidgetData(updated._id); }
  } else {
    const created: Widget | null = await store.createWidget(props.workspaceId, { title: f.title, description: f.description || null, icon: f.icon, color: f.color, is_pinned: f.is_pinned, refresh_interval: f.refresh_interval, query: queryPayload });
    if (created) { setupAutoRefresh(created); await store.fetchWidgetData(created._id); }
  }
  closeModal();
}

async function acceptProposal(): Promise<void> {
  const proposal = store.pendingProposal;
  if (!proposal) return;
  const created: Widget | null = await store.createWidget(props.workspaceId, { title: proposal.title ?? "Agent Widget", description: proposal.description ?? null, icon: proposal.icon ?? "📊", color: proposal.color ?? "#7D68C8", is_pinned: true, refresh_interval: proposal.refresh_interval ?? 300, query: proposal.query ?? {} });
  if (created) { setupAutoRefresh(created); await store.fetchWidgetData(created._id); }
}

function confirmDelete(widget: Widget): void { widgetToDelete.value = widget; showDeleteModal.value = true; }
async function deleteWidget(): Promise<void> {
  if (!widgetToDelete.value) return;
  clearWidgetTimer(widgetToDelete.value._id);
  await store.deleteWidget(widgetToDelete.value._id);
  showDeleteModal.value = false;
  widgetToDelete.value = null;
}

async function generateWithAi(): Promise<void> {
  if (!aiPrompt.value.trim()) return;

  isAiGenerating.value = true;

  try {
    const sessionIdToUse = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await agentStore.sendMessage({
      workspace_id: props.workspaceId,
      user_id: authStore.userId as string,
      message: aiPrompt.value,
      agent_id:  agentsCreated.value?.data?.agents[0]?._id as string,
      module_name:"peak",
      session_id: sessionIdToUse,
      stream: true,
    });

    // optionally refresh widgets after AI response
    await store.fetchAllPinnedWidgetData();
    agentStore.fetchChatHistory(
        workspaceId.value,
        authStore.userId ?? undefined,
        "peak"
      ),
      agentStore.fetchCreatedEntities(
        workspaceId.value,
        authStore.userId ?? undefined,
        "peak"
      ),
    // reset UI
    aiPrompt.value = "";
  } catch (err) {
    console.error(err);
  } finally {
    isAiGenerating.value = false;
  }
}

const CHART_COLORS = ["#7D68C8", "#6e3b96", "#9356c5", "#a78bfa", "#c4b5fd"];
function getChartColor(idx: string | number): string { return CHART_COLORS[Number(idx) % CHART_COLORS.length]; }
function formatTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (max-width: 600px) {
  .peak-root {
    padding: 14px 12px;
  }
}
</style>