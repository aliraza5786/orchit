<template>
  <div class="rounded-lg">
    <!-- Header -->
    <div
      class="flex items-center justify-between mb-6 flex-wrap gap-3 bg-card px-5 py-2 rounded-md border border-border"
    >
      <div class="text-lg font-semibold text-text-primary">Peak Widgets</div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
          @click="fetchAllPinnedWidgetData"
          :disabled="store.isLoadingWidgets"
          title="Refresh all"
        >
          <i
            class="fa-solid fa-rotate"
            :class="{ 'fa-spin': store.isLoadingWidgets }"
          ></i>
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          @click="openAddModal"
        >
          <i class="fa-solid fa-plus"></i>
          <span>Add Widget</span>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="
        !store.isLoadingWidgets &&
        store.pinnedWidgets.length === 0 &&
        !store.pendingProposal
      "
      class="flex flex-col items-center justify-center py-16 px-6 text-center gap-3 bg-bg-card rounded-md border border-border"
    >
      <div
        class="w-14 h-14 bg-[var(--bg-lavender)] rounded-2xl flex items-center justify-center text-[22px] text-[var(--accent)] mb-1"
      >
        <i class="fa-solid fa-chart-pie"></i>
      </div>
      <h3 class="text-base font-bold text-[var(--text-primary)] m-0">
        No widgets yet
      </h3>
      <p class="text-[13px] text-[var(--text-secondary)] m-0 max-w-[300px]">
        Add widgets to track your workspace metrics in real time.
      </p>
      <button
        class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)]"
        @click="openAddModal"
      >
        <i class="fa-solid fa-plus"></i> Add your first widget
      </button>
    </div>

    <!-- Pending agent proposal banner -->
    <div
      v-if="store.pendingProposal"
      class="flex items-center justify-between flex-wrap gap-3 bg-[var(--bg-lavender)] border border-[rgba(125,104,200,0.25)] rounded-[10px] p-3 px-4 mb-5"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-[34px] h-[34px] rounded-lg bg-[var(--accent)] text-white flex items-center justify-center text-sm flex-shrink-0"
        >
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <p class="text-[11px] text-[var(--text-secondary)] m-0">
            Agent suggested a widget
          </p>
          <p class="text-[13px] font-semibold text-[var(--text-primary)] m-0">
            {{ store.pendingProposal?.title }}
          </p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <button
          class="px-2.5 py-[5px] bg-transparent text-[var(--text-secondary)] border border-[var(--border)] rounded-md text-xs cursor-pointer transition-colors hover:bg-[var(--bg-surface)]"
          @click="store.clearPendingProposal()"
        >
          Dismiss
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-[5px] bg-[var(--accent)] text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          @click="acceptProposal"
          :disabled="store.isSaving"
        >
          <i class="fa-solid fa-thumbtack"></i> Pin to Peak
        </button>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div
      v-if="store.isLoadingWidgets"
      class="grid gap-4"
      style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col gap-2.5 pointer-events-none"
      >
        <div
          class="h-3 bg-[var(--bg-surface)] rounded-md w-2/5 animate-pulse"
        ></div>
        <div
          class="h-3 bg-[var(--bg-surface)] rounded-md w-4/5 animate-pulse"
        ></div>
        <div
          class="h-12 bg-[var(--bg-surface)] rounded-lg mt-1 animate-pulse"
        ></div>
      </div>
    </div>

    <!-- Widgets grid: 1/3 + 2/3 flex layout -->
    <div
      v-else-if="store.pinnedWidgets.length > 0"
      class="flex gap-4 items-stretch flex-wrap"
    >
      <div
        v-for="(widget, widgetIndex) in store.pinnedWidgets"
        :key="widget._id"
        class="bg-card border border-border rounded-lg flex flex-col overflow-hidden transition-all duration-200 relative group"
        :class="[
          widgetIndex === 0
            ? 'flex-[1_1_30%] min-w-[240px]'
            : widgetIndex === 1
              ? 'flex-[2_1_55%] min-w-[320px]'
              : 'flex-[1_1_40%] min-w-[260px]',
              
          store.isWidgetDataLoading(widget._id) ? 'opacity-75' : '',
        ]"
      >
        <!-- Colored top accent bar -->
        <div
          class="h-[3px] w-full flex-shrink-0"
          :style="{ background: widget.color || 'var(--accent)' }"
        ></div>

        <!-- Card header -->
        <div
          class="flex items-start gap-3 px-4 pt-4 pb-3 border-b border-[var(--border)]"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-105"
            :style="{
              background: widget.color
                ? widget.color + '15'
                : 'var(--bg-lavender)',
              color: widget.color || 'var(--accent)',
            }"
          >
            <template v-if="isFaIcon(widget.icon)">
              <i
                :class="`fa-solid fa-${widget.icon}`"
                style="font-size: 15px"
              ></i>
            </template>
            <template v-else-if="widget.icon === 'bubble_chart'">
              <span style="font-size: 17px; line-height: 1">{{ "📊" }}</span>
            </template>
            <template v-else-if="widget.icon === 'chart-bubble'">
              <span style="font-size: 17px; line-height: 1">{{ "📊" }}</span>
            </template>
            <template v-else>
              <span style="font-size: 17px; line-height: 1">{{
                widget.icon || "📊"
              }}</span>
            </template>
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-[14px] font-bold text-[var(--text-primary)] m-0 truncate leading-snug"
            >
              {{ widget.title }}
            </p>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                class="inline-flex items-center text-[10px] font-semibold px-2 py-[2px] rounded-full capitalize"
                :style="{
                  background: widget.color
                    ? widget.color + '15'
                    : 'var(--bg-lavender)',
                  color: widget.color || 'var(--accent)',
                }"
              >
                {{ widget.query?.entity?.replace("_", " ") }}
              </span>
              <span class="text-[10px] text-[var(--text-secondary)] capitalize">
                {{ widget.query?.result_type }}
                <template
                  v-if="
                    widget.query?.result_type === 'chart' &&
                    widget.query?.chart_type
                  "
                  >· {{ widget.query.chart_type }}</template
                >
              </span>
            </div>
          </div>
          <div class="flex gap-0.5 flex-shrink-0">
            <button
              class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-lg text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
              @click="refreshWidget(widget._id)"
              title="Refresh"
              :disabled="store.isWidgetDataLoading(widget._id)"
            >
              <i
                class="fa-solid fa-rotate"
                :class="{ 'fa-spin': store.isWidgetDataLoading(widget._id) }"
              ></i>
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-lg text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              @click="openEditModal(widget)"
              title="Edit"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-lg text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
              @click="confirmDelete(widget)"
              title="Delete"
              :disabled="store.isWidgetDeleting(widget._id)"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Card body -->
        <div class="flex-1 px-4 py-4 flex flex-col">
          <!-- Loading state -->
          <template v-if="store.isWidgetDataLoading(widget._id)">
            <div class="flex-1 flex flex-col gap-3 animate-pulse">
              <div class="h-3 bg-[var(--bg-surface)] rounded-md w-1/3"></div>
              <div
                class="flex-1 bg-[var(--bg-surface)] rounded-xl min-h-[120px]"
              ></div>
            </div>
          </template>

          <template v-else-if="resolveWidgetData(widget)">
            <template v-if="widget.query?.result_type === 'list'">
              <div class="flex flex-col gap-2 flex-1 overflow-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full"
                    :style="{
                      background: widget.color
                        ? widget.color + '15'
                        : 'var(--bg-lavender)',
                      color: widget.color || 'var(--accent)',
                    }"
                  >
                    {{ resolveWidgetData(widget)?.data?.total ?? 0 }} total
                  </span>
                </div>

                <!-- Table -->
                <div
                  class="overflow-auto flex-1 rounded-lg border border-[var(--border)]"
                >
                  <table class="w-full border-collapse text-[12px]">
                    <thead>
                      <tr class="border-b border-[var(--border)]">
                        <th
                          class="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap"
                          :style="{
                            background: widget.color
                              ? widget.color + '10'
                              : 'var(--bg-surface)',
                          }"
                        >
                          #
                        </th>
                        <th
                          class="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap"
                          :style="{
                            background: widget.color
                              ? widget.color + '10'
                              : 'var(--bg-surface)',
                          }"
                        >
                          Title
                        </th>
                        <th
                          class="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap"
                          :style="{
                            background: widget.color
                              ? widget.color + '10'
                              : 'var(--bg-surface)',
                          }"
                        >
                          Status
                        </th>
                        <th
                          class="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap"
                          :style="{
                            background: widget.color
                              ? widget.color + '10'
                              : 'var(--bg-surface)',
                          }"
                        >
                          Priority
                        </th>
                        <th
                          class="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--text-secondary)] whitespace-nowrap"
                          :style="{
                            background: widget.color
                              ? widget.color + '10'
                              : 'var(--bg-surface)',
                          }"
                        >
                          Due
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, idx) in (
                          resolveWidgetData(widget)?.data?.items ?? []
                        ).slice(0, 6)"
                        :key="idx"
                        class="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-lavender)] transition-colors duration-100 cursor-default"
                      >
                        <!-- Index -->
                        <td
                          class="px-3 py-2 text-[var(--text-secondary)] w-6 whitespace-nowrap"
                        >
                          {{ idx + 1 }}
                        </td>

                        <!-- Title + Code -->
                        <td
                          class="px-3 py-2 font-medium text-[var(--text-primary)] max-w-[160px]"
                        >
                          <div class="flex items-center gap-2">
                            <span
                              class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              :style="{
                                background: widget.color || 'var(--accent)',
                              }"
                            ></span>
                            <div class="flex flex-col min-w-0">
                              <span class="truncate">{{
                                item.variables?.["card-title"] ||
                                item.title ||
                                "Untitled"
                              }}</span>
                              <span
                                v-if="item.variables?.['card-code']"
                                class="text-[10px] text-[var(--text-secondary)]"
                              >
                                {{ item.variables["card-code"] }}
                              </span>
                            </div>
                          </div>
                        </td>

                        <!-- Status -->
                        <td class="px-3 py-2 whitespace-nowrap">
                          <span
                            v-if="item.variables?.['card-status']"
                            class="text-[10px] px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-[var(--text-secondary)]"
                            >{{ item.variables["card-status"] }}</span
                          >
                          <span
                            v-else
                            class="text-[var(--text-secondary)] text-[10px]"
                            >—</span
                          >
                        </td>

                        <!-- Priority — key is 'priority' not 'card-priority' -->
                        <td class="px-3 py-2 whitespace-nowrap">
                          <span
                            v-if="item.variables?.['priority']"
                            class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                            :style="{
                              background:
                                item.variables['priority'] === 'highest'
                                  ? '#fee2e2'
                                  : item.variables['priority'] === 'high'
                                    ? '#ffedd5'
                                    : item.variables['priority'] === 'medium'
                                      ? '#fef9c3'
                                      : item.variables['priority'] === 'low'
                                        ? '#dcfce7'
                                        : item.variables['priority'] ===
                                            'lowest'
                                          ? '#f0fdf4'
                                          : 'var(--bg-surface)',
                              color:
                                item.variables['priority'] === 'highest'
                                  ? '#ef4444'
                                  : item.variables['priority'] === 'high'
                                    ? '#f97316'
                                    : item.variables['priority'] === 'medium'
                                      ? '#ca8a04'
                                      : item.variables['priority'] === 'low'
                                        ? '#16a34a'
                                        : item.variables['priority'] ===
                                            'lowest'
                                          ? '#15803d'
                                          : 'var(--text-secondary)',
                            }"
                            >{{ item.variables["priority"] }}</span
                          >
                          <span
                            v-else
                            class="text-[var(--text-secondary)] text-[10px]"
                            >—</span
                          >
                        </td>

                        <!-- Due date from 'end-date' -->
                        <td
                          class="px-3 py-2 whitespace-nowrap text-[var(--text-secondary)]"
                        >
                          <span v-if="item.variables?.['end-date']">
                            {{
                              new Date(
                                item.variables["end-date"],
                              ).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })
                            }}
                          </span>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- More items -->
                <p
                  v-if="(resolveWidgetData(widget)?.data?.total ?? 0) > 6"
                  class="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-0 pl-1"
                >
                  +{{ (resolveWidgetData(widget)?.data?.total ?? 0) - 6 }} more
                  items
                </p>
              </div>
            </template>
            <!-- COUNT -->
            <template v-else-if="widget.query?.result_type === 'count'">
              <div
                class="flex-1 flex flex-col items-center justify-center py-6 gap-2"
              >
                <div
                  class="w-20 h-20 rounded-2xl flex items-center justify-center mb-1"
                  :style="{
                    background: widget.color
                      ? widget.color + '12'
                      : 'var(--bg-lavender)',
                  }"
                >
                  <p
                    class="text-[38px] font-bold leading-none m-0"
                    :style="{ color: widget.color || 'var(--accent)' }"
                  >
                    {{
                      (
                        resolveWidgetData(widget)?.data?.value ?? 0
                      ).toLocaleString()
                    }}
                  </p>
                </div>
                <p
                  class="text-[12px] text-[var(--text-secondary)] m-0 text-center max-w-[160px] leading-relaxed"
                >
                  {{
                    resolveWidgetData(widget)?.data?.label || widget.description
                  }}
                </p>
              </div>
            </template>

            <!-- COMPUTED -->
            <template v-else-if="widget.query?.result_type === 'computed'">
              <div class="flex-1 flex flex-col justify-center gap-3">
                <div class="flex items-baseline gap-2">
                  <p
                    class="text-[42px] font-bold leading-none m-0"
                    :style="{ color: widget.color || 'var(--accent)' }"
                  >
                    {{ resolveWidgetData(widget)?.data?.value ?? 0 }}
                  </p>
                  <p class="text-sm text-[var(--text-secondary)] m-0">
                    {{ resolveWidgetData(widget)?.data?.unit }}
                  </p>
                </div>
                <p class="text-[12px] text-[var(--text-secondary)] m-0">
                  {{ resolveWidgetData(widget)?.data?.label }}
                </p>
                <div
                  v-if="resolveWidgetData(widget)?.data?.completed != null"
                  class="flex flex-col gap-1.5 mt-1"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-[11px] text-[var(--text-secondary)]"
                      >Progress</span
                    >
                    <!-- FIX: ?? guards prevent division-by-undefined NaN -->
                    <span
                      class="text-[11px] font-semibold text-[var(--text-primary)]"
                    >
                      {{
                        Math.round(
                          ((resolveWidgetData(widget)?.data?.completed ?? 0) /
                            (resolveWidgetData(widget)?.data?.total ?? 1)) *
                            100,
                        )
                      }}%
                    </span>
                  </div>
                  <div
                    class="w-full h-2.5 bg-[var(--bg-surface)] rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :style="{
                        width:
                          Math.round(
                            ((resolveWidgetData(widget)?.data?.completed ?? 0) /
                              (resolveWidgetData(widget)?.data?.total ?? 1)) *
                              100,
                          ) + '%',
                        background: widget.color || 'var(--accent)',
                      }"
                    ></div>
                  </div>
                  <span class="text-[11px] text-[var(--text-secondary)]">
                    {{ resolveWidgetData(widget)?.data?.completed }} of
                    {{ resolveWidgetData(widget)?.data?.total }} complete
                  </span>
                </div>
              </div>
            </template>

            <!-- CHART -->
            <template v-else-if="widget.query?.result_type === 'chart'">
              <!-- PIE / DONUT -->
              <template
                v-if="
                  widget.query?.chart_type === 'pie' ||
                  widget.query?.chart_type === 'donut'
                "
              >
                <!-- Empty state -->
                <div
                  v-if="!resolveWidgetData(widget)?.data?.series?.length"
                  class="flex-1 flex flex-col items-center justify-center gap-3 py-8"
                >
                  <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                    <circle
                      cx="44"
                      cy="44"
                      r="32"
                      stroke="var(--bg-surface)"
                      stroke-width="16"
                      fill="none"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r="32"
                      stroke="var(--border)"
                      stroke-width="16"
                      fill="none"
                      stroke-dasharray="8 5"
                    />
                  </svg>
                  <div class="text-center">
                    <p
                      class="text-[13px] font-semibold text-[var(--text-primary)] m-0"
                    >
                      No data
                    </p>
                    <p
                      class="text-[11px] text-[var(--text-secondary)] m-0 mt-0.5"
                    >
                      Nothing found for this period
                    </p>
                  </div>
                </div>

                <!-- Filled pie -->
                <template v-else>
                  <div class="flex items-center gap-1 mb-3">
                    <span
                      class="text-[26px] font-bold text-[var(--text-primary)]"
                      >{{ resolveWidgetData(widget)?.data?.total ?? 0 }}</span
                    >
                    <span class="text-[12px] text-[var(--text-secondary)] mt-1"
                      >total</span
                    >
                  </div>
                  <div class="flex items-center gap-5 flex-1">
                    <!-- FIX: buildPieSegments called with radius=48 — now matches updated 3-param signature -->
                    <svg
                      width="130"
                      height="130"
                      viewBox="0 0 130 130"
                      class="flex-shrink-0"
                    >
                      <circle
                        cx="65"
                        cy="65"
                        r="48"
                        fill="none"
                        stroke="var(--bg-surface)"
                        stroke-width="22"
                      />
                      <template
                        v-for="(seg, _si) in buildPieSegments(
                          resolveWidgetData(widget)?.data?.series,
                          resolveWidgetData(widget)?.data?.total,
                          48,
                        )"
                        :key="_si"
                      >
                        <circle
                          cx="65"
                          cy="65"
                          r="48"
                          fill="none"
                          :stroke="seg.color"
                          stroke-width="22"
                          stroke-linecap="round"
                          :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                          :stroke-dashoffset="seg.offset"
                          transform="rotate(-90 65 65)"
                          style="transition: stroke-dasharray 0.4s ease"
                        />
                      </template>
                      <text
                        x="65"
                        y="61"
                        text-anchor="middle"
                        font-size="19"
                        font-weight="700"
                        fill="var(--text-primary)"
                        style="font-family: inherit"
                      >
                        {{ resolveWidgetData(widget)?.data?.total }}
                      </text>
                      <text
                        x="65"
                        y="77"
                        text-anchor="middle"
                        font-size="10"
                        fill="var(--text-secondary)"
                        style="font-family: inherit"
                      >
                        {{
                          widget.query?.chart_type === "donut" ? "total" : ""
                        }}
                      </text>
                    </svg>
                    <!-- Legend -->
                    <div class="flex flex-col gap-2 flex-1 min-w-0">
                      <div
                        v-for="(series, idx) in (
                          resolveWidgetData(widget)?.data?.series ?? []
                        ).slice(0, 7)"
                        :key="idx"
                        class="flex items-center gap-2"
                      >
                        <span
                          class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          :style="{
                            background: getPieColor(idx, widget.color),
                          }"
                        ></span>
                        <span
                          class="text-[12px] text-[var(--text-secondary)] truncate flex-1"
                          >{{ series.label || "Unknown" }}</span
                        >
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            class="text-[12px] font-bold text-[var(--text-primary)]"
                            >{{ series.value }}</span
                          >
                          <!-- FIX: ?? 1 guards against divide-by-zero/undefined -->
                          <span
                            class="text-[10px] text-[var(--text-secondary)]"
                          >
                            {{
                              Math.round(
                                (Number(series.value) /
                                  (resolveWidgetData(widget)?.data?.total ??
                                    1)) *
                                  100,
                              )
                            }}%
                          </span>
                        </div>
                      </div>
                      <p
                        v-if="
                          (resolveWidgetData(widget)?.data?.series ?? [])
                            .length > 7
                        "
                        class="text-[11px] text-[var(--text-secondary)] m-0 pl-4"
                      >
                        +{{
                          (resolveWidgetData(widget)?.data?.series ?? [])
                            .length - 7
                        }}
                        more
                      </p>
                    </div>
                  </div>
                </template>
              </template>

              <!-- BAR / LINE -->
              <!-- BAR / LINE -->
              <template v-else>
                <div class="flex items-center gap-1 mb-4">
                  <span
                    class="text-[26px] font-bold text-[var(--text-primary)]"
                    >{{ resolveWidgetData(widget)?.data?.total ?? 0 }}</span
                  >
                  <span class="text-[12px] text-[var(--text-secondary)] mt-1"
                    >total</span
                  >
                </div>
                <!-- LINE CHART -->
                <template v-if="widget.query?.chart_type === 'line'">
                  <div
                    class="flex flex-col w-full flex-1"
                    style="min-height: 160px"
                  >
                    <div class="flex flex-1 min-h-0">
                      <!-- Y-axis labels -->
                      <div
                        class="flex flex-col justify-between flex-shrink-0 pr-2 text-right"
                        style="width: 36px"
                      >
                        <span
                          v-for="tick in buildYTicks(
                            resolveWidgetData(widget)?.data?.series,
                          )"
                          :key="tick"
                          class="text-[10px] leading-none"
                          style="color: var(--text-secondary)"
                          >{{ tick }}</span
                        >
                      </div>

                      <!-- SVG wrapper — uses ResizeObserver via v-chart-size directive -->
                      <div
                        class="flex-1 relative min-w-0"
                        :ref="(el) => registerChartRef(widget._id, el as any)"
                      >
                        <svg
                          v-if="chartSizes[widget._id]"
                          :width="chartSizes[widget._id].w"
                          :height="chartSizes[widget._id].h"
                          style="display: block; overflow: visible"
                        >
                          <defs>
                            <linearGradient
                              :id="`grad-${widget._id}`"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                :stop-color="widget.color || 'var(--accent)'"
                                stop-opacity="0.3"
                              />
                              <stop
                                offset="100%"
                                :stop-color="widget.color || 'var(--accent)'"
                                stop-opacity="0.02"
                              />
                            </linearGradient>
                          </defs>

                          <template
                            v-if="
                              resolveWidgetData(widget)?.data?.series?.length
                            "
                          >
                            <!-- Gridlines -->
                            <line
                              v-for="(_, gi) in buildYTicks(
                                resolveWidgetData(widget)?.data?.series,
                              )"
                              :key="`grid-${gi}`"
                              x1="0"
                              :y1="
                                getPixelGridY(
                                  widget._id,
                                  resolveWidgetData(widget)?.data?.series,
                                  gi,
                                )
                              "
                              :x2="chartSizes[widget._id].w"
                              :y2="
                                getPixelGridY(
                                  widget._id,
                                  resolveWidgetData(widget)?.data?.series,
                                  gi,
                                )
                              "
                              stroke="var(--border)"
                              stroke-width="1"
                              stroke-dasharray="3 3"
                            />

                            <!-- Area fill -->
                            <path
                              :d="
                                getPixelAreaPath(
                                  widget._id,
                                  resolveWidgetData(widget)?.data?.series,
                                )
                              "
                              :fill="`url(#grad-${widget._id})`"
                            />

                            <!-- Line -->
                            <path
                              :d="
                                getPixelLinePath(
                                  widget._id,
                                  resolveWidgetData(widget)?.data?.series,
                                )
                              "
                              fill="none"
                              :stroke="widget.color || 'var(--accent)'"
                              stroke-width="2"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                            />

                            <!-- Dots -->
                            <circle
                              v-for="(pt, pi) in getPixelPoints(
                                widget._id,
                                resolveWidgetData(widget)?.data?.series,
                              )"
                              :key="`dot-${pi}`"
                              :cx="pt.x"
                              :cy="pt.y"
                              r="4"
                              :fill="widget.color || 'var(--accent)'"
                              stroke="var(--bg-card)"
                              stroke-width="2"
                            />
                          </template>
                        </svg>
                      </div>
                    </div>

                    <!-- X-axis labels -->
                    <div class="flex mt-2" style="padding-left: 36px">
                      <span
                        v-for="(s, i) in resolveWidgetData(widget)?.data
                          ?.series ?? []"
                        :key="i"
                        class="text-[10px] truncate text-center"
                        style="flex: 1 1 0; color: var(--text-secondary)"
                        >{{ s.label }}</span
                      >
                    </div>
                  </div>
                </template>
                <template v-else-if="widget.query?.chart_type === 'bar'">
                  <div
                    class="flex-1 relative"
                    style="min-height: 180px"
                    :ref="
                      (el) => registerChartRef(widget._id as string, el as any)
                    "
                  >
                    <svg
                      v-if="getChartSize(widget._id as string)"
                      :width="getChartSize(widget._id as string)?.w"
                      :height="getChartSize(widget._id as string)?.h"
                    >
                      <g>
                        <rect
                          v-for="(point, i) in getSeries(widget)"
                          :key="i"
                          :x="
                            i *
                            (getChartSize(widget._id as string)!.w /
                              getSeries(widget).length)
                          "
                          :y="
                            getBarY(
                              point,
                              widget._id as string,
                              getSeries(widget),
                            )
                          "
                          :width="
                            (getChartSize(widget._id as string)!.w /
                              getSeries(widget).length) *
                            0.7
                          "
                          :height="
                            getBarHeight(
                              point,
                              widget._id as string,
                              getSeries(widget),
                            )
                          "
                          :fill="getBarColor(i)"
                          @mouseenter="
                            (e) => {
                                const box = (e.target as SVGRectElement).getBoundingClientRect()

                                hoveredBar = {
                                  label: point.label,
                                  value: point.value,
                                  x: box.left + box.width / 2,
                                  y: box.top,
                                }
                            }
                          "
                          @mouseleave="hoveredBar = null"
                        />
                      </g>
                    </svg>
                    <div
                      v-if="hoveredBar"
                      class="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded shadow"
                      :style="{
                        left: 160 + 'px',
                        top:50 + 'px',
                        transform:
                          hoveredBar.x > (getChartSize(widget._id as string)?.w - 60)
                            ? 'translateX(-100%)'
                            : 'translateX(-50%)'
                      }"
                    >
                      {{ hoveredBar.label }}: {{ hoveredBar.value }}
                    </div>
                  </div>
                </template>
                <template v-else-if="widget.query?.chart_type === 'bubble'">
                  <div class="flex flex-col gap-2 flex-1 justify-center">
                    <div
                      v-for="(series, idx) in resolveWidgetData(widget)?.data
                        ?.series ?? []"
                      :key="idx"
                      class="flex items-center gap-3"
                    >
                      <span
                        class="text-[12px] text-[var(--text-secondary)] truncate flex-1 pr-2"
                        >{{ series.label }}</span
                      >
                      <span
                        class="rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                        :style="{
                          width:
                            Math.max(
                              24,
                              Math.round(
                                (Number(series.value) /
                                  (resolveWidgetData(widget)?.data?.total ??
                                    1)) *
                                  80,
                              ),
                            ) + 'px',
                          height:
                            Math.max(
                              24,
                              Math.round(
                                (Number(series.value) /
                                  (resolveWidgetData(widget)?.data?.total ??
                                    1)) *
                                  80,
                              ),
                            ) + 'px',
                          background: getPieColor(idx, widget.color),
                          fontSize:
                            Math.max(
                              10,
                              Math.round(
                                (Number(series.value) /
                                  (resolveWidgetData(widget)?.data?.total ??
                                    1)) *
                                  24,
                              ),
                            ) + 'px',
                        }"
                        >{{ series.value }}</span
                      >
                    </div>
                  </div>
                </template>
                <!-- BAR CHART (existing) -->
                <template v-else>
                  <div class="flex flex-col gap-3 flex-1">
                    <div
                      v-for="(series, idx) in resolveWidgetData(widget)?.data
                        ?.series ?? []"
                      :key="idx"
                      class="flex flex-col gap-1"
                    >
                      <div class="flex items-center justify-between">
                        <span
                          class="text-[12px] text-[var(--text-secondary)] truncate flex-1 pr-2"
                          >{{ series.label }}</span
                        >
                        <span
                          class="text-[12px] font-bold text-[var(--text-primary)] flex-shrink-0"
                          >{{ series.value }}</span
                        >
                      </div>
                      <div
                        class="w-full h-3 bg-[var(--bg-surface)] rounded-full overflow-hidden"
                      >
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :style="{
                            width:
                              Math.round(
                                (Number(series.value) /
                                  (resolveWidgetData(widget)?.data?.total ??
                                    1)) *
                                  100,
                              ) + '%',
                            background: widget.color || getChartColor(idx),
                            minWidth: '4px',
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </template>

          <!-- No data -->
          <template v-else>
            <div
              class="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center"
            >
              <div
                class="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] mb-1"
              >
                <i class="fa-solid fa-circle-info text-sm"></i>
              </div>
              <p class="text-[12px] text-[var(--text-secondary)] m-0">
                No data yet
              </p>
              <button
                class="text-[11px] text-[var(--accent)] bg-transparent border-none cursor-pointer p-0 hover:underline"
                @click="refreshWidget(widget._id)"
              >
                Click to refresh
              </button>
            </div>
          </template>
        </div>

        <!-- Card footer -->
        <div
          class="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-surface)]"
        >
          <span
            v-if="resolveWidgetData(widget)?.resolved_at || widget.updated_at"
            class="text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5"
          >
            <i class="fa-regular fa-clock"></i>
            Updated
            {{
              formatTime(
                resolveWidgetData(widget)?.resolved_at || widget.updated_at,
              )
            }}
          </span>
          <div class="flex items-center gap-2 ml-auto">
            <span
              v-if="widget.refresh_interval > 0"
              class="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)]"
            >
              <i class="fa-solid fa-arrows-rotate text-[9px]"></i>
              {{ widget.refresh_interval }}s
            </span>
            <span
              v-if="widget.is_pinned"
              class="inline-flex items-center gap-1 text-[10px]"
              :style="{ color: widget.color || 'var(--accent)' }"
            >
              <i class="fa-solid fa-thumbtack text-[9px]"></i>
              Pinned
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Add/Edit Widget Modal ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div
          v-if="showModal"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          @click.self="closeModal"
        >
          <div
            class="bg-[var(--bg-card)] rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          >
            <div
              class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0"
            >
              <h2 class="text-[15px] font-bold text-[var(--text-primary)] m-0">
                {{ editingWidget ? "Edit Widget" : "Add Widget" }}
              </h2>
              <button
                class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                @click="closeModal"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- AI FIRST VIEW -->
            <template v-if="modalMode === 'create'">
              <div class="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
                <div
                  class="bg-bg-card border border-[var(--border)] rounded-xl p-4 shadow-sm relative"
                >
                  <textarea
                    v-model="aiPrompt"
                    rows="4"
                    placeholder="Ask Orchit AI to create a widget..."
                    class="w-full resize-none border-none outline-none text-[14px] text-[var(--text-primary)] placeholder-[var(--text-secondary)] bg-transparent leading-relaxed"
                    style="font-family: inherit"
                    @keydown.enter.prevent="generateWithAi"
                    @keydown.shift.enter.stop
                  />
                  <div class="flex justify-end mt-2">
                    <button
                      class="w-9 h-9 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer border-none transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="generateWithAi"
                      title="Generate with AI"
                      :disabled="isAiGenerating || !aiPrompt.trim()"
                    >
                      <i
                    class="fa-solid text-accent-text text-[11px]"
                    :class="
                      agentStore.isSending
                        ? 'fa-spinner fa-spin'
                        : 'fa-paper-plane'
                    "
                  ></i>
                    </button>
                  </div>
                </div>
                <!-- recent messages -->
                   <div
  v-if="chatHistory.length"
  class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3"
>
  <p class="text-[12px] font-semibold text-[var(--text-secondary)] mb-3">
    Recent  Messages
  </p>

  <div class="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1">
    <div
      v-for="msg in chatHistory"
      :key="msg._id"
      class="flex"
      :class="msg.type === 'user' ? 'justify-end' : 'justify-start'"
    >
      <!-- Bubble -->
      <div
        class="max-w-[85%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm whitespace-pre-wrap"
        :class="msg.type === 'user'
          ? 'bg-[var(--accent)] text-white rounded-br-sm'
          : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'"
      >
        <!-- Label -->
        <div
          class="text-[10px] uppercase tracking-wide mb-1 opacity-70"
          :class="msg.type === 'user' ? 'text-white/70' : 'text-[var(--text-secondary)]'"
        >
          {{ msg.type }}
        </div>

        <!-- Content -->
        <div class="whitespace-pre-wrap break-words">
          {{ msg.content }}
        </div>
      </div>
    </div>
  </div>
</div>
                <div>
                  <p
                    class="text-[13px] text-[var(--text-secondary)] text-center mb-3"
                  >
                    Or try these examples:
                  </p>
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
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-px bg-[var(--border)]"></div>
                  <span
                    class="text-[12px] text-[var(--text-secondary)] font-medium"
                    >OR</span
                  >
                  <div class="flex-1 h-px bg-[var(--border)]"></div>
                </div>
                <button
                :disabled="isDisabled"
                @click="
                  showManualForm = true;
                  modalMode = 'manual';
                "
                class="w-full py-3 rounded-xl bg-[var(--accent)] text-white text-[14px] font-semibold border-none cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Widget Manually
              </button>
              </div>
            </template>
            <template v-else-if="modalMode === 'preview'">
              <div class="flex flex-col h-full">
                <!-- HEADER -->
                <div
                  class="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center"
                >
                  <h2 class="text-[15px] font-bold">Preview Results</h2>

                  <button @click="modalMode = 'create'">Back</button>
                </div>

                <!-- BODY -->
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                  <!-- READ MODE -->
                  <template v-if="previewData[0]?.action === 'read'">
                    <div v-if="previewData[0]?.result?.items?.length">
                      <div
                        v-for="item in previewData[0].result.items"
                        :key="item.id || item._id"
                        class="p-3 border rounded-lg"
                      >
                        {{ item.title || item["card-title"] }}
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-500">
                      No data found
                    </div>
                  </template>

                  <!-- WIDGET MODE -->
                  <template
                    v-else-if="previewData[0]?.entity_type === 'widget'"
                  >
                    <div
                      v-for="(w, i) in previewData"
                      :key="i"
                      class="border border-border rounded-lg p-4"
                    >
                      <p class="font-semibold">{{ w.payload?.title }}</p>
                      <iframe
                        v-if="w.payload?.html"
                        :srcdoc="w.payload.html"
                        class="w-full h-[300px]"
                      />
                    </div>
                  </template>

                  <!-- CREATE MODE -->
                  <template v-else>
                    <div
                      v-for="(item, i) in previewData"
                      :key="i"
                      class="p-3 border rounded-lg"
                    >
                      {{ item.payload?.title || "New Item" }}
                    </div>
                  </template>
                </div>

                <!-- FOOTER -->
                <div class="px-5 py-4 border-t flex justify-end gap-2">
                  <button
                    @click="declinePreview"
                    class="px-4 py-2 text-sm rounded-md cursor-pointer border border-border text-text-primary hover:bg-bg-body transition"
                  >
                    Cancel
                  </button>

                  <button
                    class="px-4 py-2 text-sm rounded-md bg-accent cursor-pointer text-white hover:bg-accent-hover transition disabled:opacity-50 flex items-center gap-2 justify-cente"
                    @click="acceptPreview"
                    :disabled="agentStore.isAcceptingEntities"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </template>
            <!-- MANUAL FORM VIEW -->
            <template v-else-if="modalMode === 'manual'">
              <div class="px-5 pt-3 flex-shrink-0" v-if="showManualForm">
                <button
                  @click="
                    showManualForm = false;
                    modalMode = 'create';
                  "
                  class="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer transition-colors p-0"
                >
                  <i class="fa-solid fa-arrow-left text-[11px]"></i> Back
                </button>
              </div>
              <div class="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-3">
                <div
                  class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1"
                >
                  Basic Info
                </div>
                <div class="flex flex-col gap-[5px]">
                  <label
                    class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                    >Title <span class="text-red-500 ml-0.5">*</span></label
                  >
                  <input
                    v-model="form.title"
                    type="text"
                    placeholder="e.g. My Today Tasks"
                    class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(125,104,200,0.15)]"
                  />
                </div>
                <div class="flex flex-col gap-[5px]">
                  <label
                    class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                    >Description</label
                  >
                  <input
                    v-model="form.description"
                    type="text"
                    placeholder="Optional description"
                    class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(125,104,200,0.15)]"
                  />
                </div>
                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Icon (emoji or FA name)</label
                    >
                    <input
                      v-model="form.icon"
                      type="text"
                      placeholder="📋 or calendar-alt"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]"
                    />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Accent color</label
                    >
                    <div class="flex items-center gap-2">
                      <input
                        v-model="form.color"
                        type="color"
                        class="w-9 h-9 border border-[var(--border)] rounded-[7px] cursor-pointer p-0.5 bg-[var(--bg-input,#fff)] flex-shrink-0"
                      />
                      <input
                        v-model="form.color"
                        type="text"
                        placeholder="#7D68C8"
                        class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all flex-1 box-border focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1"
                >
                  Query
                </div>
                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Entity</label
                    >
                    <select
                      v-model="form.query.entity"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="cards">Cards</option>
                      <option value="sprints">Sprints</option>
                      <option value="sprint_backlog">Sprint Backlog</option>
                      <option value="token_usage">Token Usage</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Result type</label
                    >
                    <select
                      v-model="form.query.result_type"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="list">List</option>
                      <option value="count">Count</option>
                      <option value="computed">Computed</option>
                      <option value="chart">Chart</option>
                    </select>
                  </div>
                </div>
                <div
                  class="flex gap-3 flex-wrap"
                  v-if="form.query.result_type === 'chart'"
                >
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Chart type</label
                    >
                    <select
                      v-model="form.query.chart_type"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="bar">Bar</option>
                      <option value="pie">Pie</option>
                      <option value="donut">Donut</option>
                      <option value="line">Line</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Group by field</label
                    >
                    <input
                      v-model="form.query.group_by"
                      type="text"
                      placeholder="variables.card-status"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
                <div
                  class="flex flex-col gap-[5px]"
                  v-if="
                    form.query.result_type === 'computed' &&
                    form.query.entity === 'sprints'
                  "
                >
                  <label
                    class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                    >Formula</label
                  >
                  <select
                    v-model="form.query.formula"
                    class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                  >
                    <option value="days_until_end">Days until end</option>
                    <option value="days_since_start">Days since start</option>
                    <option value="completion_percentage">Completion %</option>
                  </select>
                </div>
                <div
                  class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1"
                >
                  Filters
                </div>
                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Assigned to</label
                    >
                    <select
                      v-model="form.query.filters.assigned_to"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="">Anyone</option>
                      <option value="$ME">Me ($ME)</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Date filter</label
                    >
                    <select
                      v-model="form.query.filters.date_filter.value"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="">None</option>
                      <option value="today">Today</option>
                      <option value="this_week">This week</option>
                      <option value="this_month">This month</option>
                      <option value="next_7_days">Next 7 days</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
                <div
                  class="flex gap-3 flex-wrap"
                  v-if="form.query.entity === 'cards'"
                >
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Status</label
                    >
                    <input
                      v-model="form.query.filters.status"
                      type="text"
                      placeholder="In Progress"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]"
                    />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Priority</label
                    >
                    <select
                      v-model="form.query.filters.priority"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="">Any</option>
                      <option value="highest">Highest</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="lowest">Lowest</option>
                    </select>
                  </div>
                </div>
                <div
                  class="flex gap-3 flex-wrap"
                  v-if="
                    form.query.entity === 'sprints' ||
                    form.query.entity === 'sprint_backlog'
                  "
                >
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Sprint status</label
                    >
                    <select
                      v-model="form.query.filters.sprint_status"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="">Any</option>
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div
                  class="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--accent)] pb-0.5 border-b border-[var(--border)] mt-1"
                >
                  Display
                </div>
                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Limit (list)</label
                    >
                    <input
                      v-model.number="form.query.limit"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="20"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]"
                    />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Auto-refresh (seconds)</label
                    >
                    <input
                      v-model.number="form.refresh_interval"
                      type="number"
                      min="0"
                      placeholder="300"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
                <div class="flex gap-3 flex-wrap">
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Sort by</label
                    >
                    <input
                      v-model="form.query.sort_by"
                      type="text"
                      placeholder="created_at"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full box-border focus:border-[var(--accent)]"
                    />
                  </div>
                  <div class="flex flex-col gap-[5px] flex-1 min-w-[140px]">
                    <label
                      class="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em]"
                      >Sort order</label
                    >
                    <select
                      v-model="form.query.sort_order"
                      class="px-2.5 py-[7px] bg-[var(--bg-input,#fff)] border border-[var(--border-input,#d9d9d9)] rounded-[7px] text-[13px] text-[var(--text-primary)] outline-none transition-all w-full cursor-pointer focus:border-[var(--accent)]"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
                <div class="flex flex-col gap-[5px]">
                  <label
                    class="flex items-center gap-2 text-[13px] text-[var(--text-primary)] cursor-pointer font-normal"
                  >
                    <input
                      type="checkbox"
                      v-model="form.is_pinned"
                      class="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                    />
                    Pin widget to dashboard
                  </label>
                </div>
              </div>
              <div
                class="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border)] flex-shrink-0"
              >
                <button
                  class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)]"
                  @click="closeModal"
                >
                  Cancel
                </button>
                <button
                  class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--accent)] text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="saveWidget"
                  :disabled="store.isSaving || !form.title.trim()"
                >
                  <i
                    v-if="store.isSaving"
                    class="fa-solid fa-spinner fa-spin"
                  ></i>
                  <span>{{
                    editingWidget ? "Save changes" : "Create widget"
                  }}</span>
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
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          @click.self="showDeleteModal = false"
        >
          <div
            class="bg-[var(--bg-card)] rounded-2xl w-full max-w-[380px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          >
            <div
              class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0"
            >
              <h2 class="text-[15px] font-bold text-[var(--text-primary)] m-0">
                Delete widget
              </h2>
              <button
                class="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                @click="showDeleteModal = false"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="px-5 py-4 overflow-y-auto flex-1">
              <p
                class="text-[13px] text-[var(--text-primary)] leading-relaxed m-0"
              >
                Are you sure you want to delete
                <strong>{{ widgetToDelete?.title }}</strong
                >? This cannot be undone.
              </p>
            </div>
            <div
              class="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border)] flex-shrink-0"
            >
              <button
                class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-surface)]"
                @click="showDeleteModal = false"
              >
                Cancel
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-red-500 text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="deleteWidget"
                :disabled="
                  !!widgetToDelete && store.isWidgetDeleting(widgetToDelete._id)
                "
              >
                <i
                  v-if="
                    !!widgetToDelete &&
                    store.isWidgetDeleting(widgetToDelete._id)
                  "
                  class="fa-solid fa-spinner fa-spin"
                ></i>
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
type DateFilterValue =
  | ""
  | "today"
  | "this_week"
  | "this_month"
  | "next_7_days"
  | "overdue";
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

// FIX 1: Dedicated WidgetItem interface so variables is Record<string,string>
// — eliminates "can't index type '{}'" errors on variables['card-title'] etc.
interface WidgetItem {
  title?: string;
  variables?: Record<string, string>;
  [key: string]: unknown;
}

// FIX 2: items now WidgetItem[] instead of Array<Record<string,unknown>>
interface WidgetData {
  chart_type?: string;
  series?: Array<{ value: number | string; label: string }>;
  total?: number;
  group_by?: string;
  value?: number;
  label?: string;
  unit?: string;
  completed?: number;
  items?: WidgetItem[];
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
  updated_at?: string;
  created_at?: string;
  data?: WidgetData;
  query?: {
    entity?: string;
    result_type?: string;
    chart_type?: string;
    formula?: string;
    group_by?: string;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    aggregation?: string;
    filters?: {
      assigned_to?: string | null;
      status?: string | null;
      priority?: string | null;
      sprint_status?: string | null;
      date_filter?: {
        type?: string | null;
        value?: string | null;
        start?: string | null;
        end?: string | null;
      };
    };
  };
}

const props = defineProps<{ workspaceId: string }>();
const store = useWidgetStore();
const authStore = useAuthStore();
const agentStore = useAgentStore();
// change the type
const modalMode = ref<"create" | "preview" | "manual">("create");
const showModal = ref(false);
const showDeleteModal = ref(false);
const showManualForm = ref(false);
const editingWidget = ref<Widget | null>(null);
const widgetToDelete = ref<Widget | null>(null);
const aiPrompt = ref("");
const isAiGenerating = ref(false);
const agentsCreated = computed(() => agentStore.agentsCreated);
const entities = computed(() => agentStore.createdEntities);
type CardItem = {
  id?: string;
  _id?: string;
  title?: string;
  "card-title"?: string;
};

type WidgetPayload = {
  title?: string;
  html?: string;
  widgets?: any[];
  [key: string]: any;
};

type PreviewItem = {
  action: string;
  entity_type: string;
  workspace_id: string;
  payload: WidgetPayload;
  result: {
    items: CardItem[];
    sheets: any[];
  };
};
const chatHistory = computed(() => {
  return (agentStore.chatHistory[0]?.messages || []).slice(0, 6);
});
const previewData = computed<PreviewItem[]>(() => {
  return (entities.value || []).map((e: any) => ({
    action: e.action ?? "read",
    entity_type: e.entity_type ?? "",
    workspace_id: workspaceId.value,

    payload: {
      ...(e.payload ?? {}),
      workspace_id: workspaceId.value,
    },

    result: {
      items: e.response?.items ?? [],
      sheets: e.response?.sheets ?? [],
    },
  }));
});
const aiSuggestions = [
  "A widget where all tasks and projects start...",
  "A widget for tasks that are actively being worked on...",
  "A widget where finished tasks and projects are...",
  "This is a new widget used for the purpose of the...",
  "High priority cards assigned to me this week",
  "Active sprint completion percentage",
];

const defaultForm = (): WidgetForm => ({
  title: "",
  description: "",
  icon: "📊",
  color: "#7D68C8",
  is_pinned: true,
  refresh_interval: 300,
  query: {
    entity: "cards",
    result_type: "list",
    chart_type: "bar",
    formula: "days_until_end",
    group_by: "",
    sort_by: "created_at",
    sort_order: "desc",
    limit: 20,
    filters: {
      assigned_to: "$ME",
      status: "",
      priority: "",
      sprint_status: "",
      date_filter: { type: "relative", value: "today" },
    },
  },
});

const form = ref<WidgetForm>(defaultForm());
const refreshTimers = ref<Record<string, ReturnType<typeof setInterval>>>({});

// ─── Pie color palette ──────────────────────────────────────────────────────
const PIE_COLORS = [
  "#7D68C8",
  "#00BFFF",
  "#ff851b",
  "#6e3b96",
  "#1D9E75",
  "#D85A30",
  "#378ADD",
  "#BA7517",
  "#E24B4A",
  "#9F5CC0",
];

function getPieColor(idx: number, widgetColor?: string): string {
  if (idx === 0 && widgetColor) return widgetColor;
  return PIE_COLORS[idx % PIE_COLORS.length];
}

const CHART_COLORS = ["#7D68C8", "#6e3b96", "#9356c5", "#a78bfa", "#c4b5fd"];
function getChartColor(idx: string | number): string {
  return CHART_COLORS[Number(idx) % CHART_COLORS.length];
}

// ─── Resolve widget data ────────────────────────────────────────────────────
function resolveWidgetData(
  widget: Widget,
): { data?: WidgetData; resolved_at?: string } | null {
  const storeData = store.getWidgetData(widget._id);
  if (storeData) return storeData;
  if (widget.data) return { data: widget.data };
  return null;
}

// ─── FA icon detection ──────────────────────────────────────────────────────
function isFaIcon(icon?: string): boolean {
  if (!icon) return false;
  return /^[a-z0-9-]+$/.test(icon);
}

// ─── Pie segment types ──────────────────────────────────────────────────────
interface PieSegment {
  color: string;
  dash: number;
  gap: number;
  offset: number;
}

// FIX 3: Added `radius` parameter (default 30) so the template call with
// radius=48 matches the function signature — was previously only 2 params.
function buildPieSegments(
  series: Array<{ value: number | string; label: string }> | undefined,
  total: number | undefined,
  radius: number = 30,
): PieSegment[] {
  if (!series?.length || !total) return [];
  const circ = 2 * Math.PI * radius;
  const segments: PieSegment[] = [];
  let cumulative = 0;
  series.forEach((s, idx) => {
    const val = Number(s.value);
    const fraction = val / total;
    const dash = fraction * circ;
    const gap = circ - dash;
    const offset = circ - cumulative * circ;
    segments.push({ color: getPieColor(idx), dash, gap, offset });
    cumulative += fraction;
  });
  return segments;
}

function clearWidgetTimer(id: string): void {
  if (refreshTimers.value[id]) {
    clearInterval(refreshTimers.value[id]);
    delete refreshTimers.value[id];
  }
}

async function fetchAssignedAgents(): Promise<void> {
  await agentStore.fetchSavedAgents(workspaceId.value, "peak");
}

onMounted(async () => {
  await store.fetchWidgets(props.workspaceId);
  await store.fetchWidgets(workspaceId.value);
  await fetchAssignedAgents();
});

onBeforeUnmount(() => {
  Object.keys(refreshTimers.value).forEach(clearWidgetTimer);
});

async function fetchAllPinnedWidgetData(): Promise<void> {
  await store.fetchWidgets(workspaceId.value);
}
async function refreshWidget(id: string): Promise<void> {
  await store.refreshWidget(id);
}

// ─── Modal helpers ──────────────────────────────────────────────────────────
function openAddModal(): void {
  editingWidget.value = null;
  form.value = defaultForm();
  showManualForm.value = false;
  aiPrompt.value = "";
  modalMode.value = "create";
  showModal.value = true;
}

function openEditModal(widget: Widget): void {
  editingWidget.value = widget;
  showManualForm.value = true;
  form.value = {
    title: widget.title,
    description: widget.description ?? "",
    icon: widget.icon ?? "📊",
    color: widget.color ?? "#7D68C8",
    is_pinned: widget.is_pinned,
    refresh_interval: widget.refresh_interval ?? 300,
    query: {
      entity: (widget.query?.entity as Entity) ?? "cards",
      result_type: (widget.query?.result_type as ResultType) ?? "list",
      chart_type: (widget.query?.chart_type as ChartType) ?? "bar",
      formula: (widget.query?.formula as Formula) ?? "days_until_end",
      group_by: widget.query?.group_by ?? "",
      sort_by: widget.query?.sort_by ?? "created_at",
      sort_order: (widget.query?.sort_order as SortOrder) ?? "desc",
      limit: widget.query?.limit ?? 20,
      filters: {
        assigned_to: widget.query?.filters?.assigned_to ?? "$ME",
        status: widget.query?.filters?.status ?? "",
        priority: (widget.query?.filters?.priority as Priority) ?? "",
        sprint_status:
          (widget.query?.filters?.sprint_status as SprintStatus) ?? "",
        date_filter: {
          type: "relative",
          value:
            (widget.query?.filters?.date_filter?.value as DateFilterValue) ??
            "today",
        },
      },
    },
  };
  showModal.value = true;
}

function closeModal(): void {
  showModal.value = false;
  editingWidget.value = null;
}

watch(showModal, (val) => {
  if (!val) {
    showManualForm.value = false;
    aiPrompt.value = "";
    modalMode.value = "create";
  }
});

function buildQueryPayload(): Record<string, unknown> {
  const f = form.value;
  const cleanFilters: Record<string, unknown> = {};
  if (f.query.filters.assigned_to)
    cleanFilters.assigned_to = f.query.filters.assigned_to;
  if (f.query.filters.status) cleanFilters.status = f.query.filters.status;
  if (f.query.filters.priority)
    cleanFilters.priority = f.query.filters.priority;
  if (f.query.filters.sprint_status)
    cleanFilters.sprint_status = f.query.filters.sprint_status;
  if (f.query.filters.date_filter.value) {
    cleanFilters.date_field = "variables.start-date";
    cleanFilters.date_filter = {
      type: "relative",
      value: f.query.filters.date_filter.value,
    };
  }
  const query: Record<string, unknown> = {
    entity: f.query.entity,
    result_type: f.query.result_type,
    filters: cleanFilters,
    sort_by: f.query.sort_by || undefined,
    sort_order: f.query.sort_order || undefined,
    limit: f.query.limit || 20,
  };
  if (f.query.result_type === "chart") {
    query.chart_type = f.query.chart_type;
    query.group_by = f.query.group_by;
    query.aggregation = "count";
  }
  if (f.query.result_type === "computed") {
    query.formula = f.query.formula;
  }
  return query;
}

async function saveWidget(): Promise<void> {
  const f = form.value;
  const queryPayload = buildQueryPayload();
  if (editingWidget.value) {
    const updates: Record<string, unknown> = {
      title: f.title,
      description: f.description || null,
      icon: f.icon,
      color: f.color,
      is_pinned: f.is_pinned,
      refresh_interval: f.refresh_interval,
      query: queryPayload,
    };
    const updated: Widget | null = await store.updateWidgetViaAgent(
      props.workspaceId,
      editingWidget.value._id,
      updates,
    );
    if (updated) {
      clearWidgetTimer(editingWidget.value._id);
      await store.fetchWidgets(updated._id);
    }
  }
  closeModal();
}

async function acceptProposal(): Promise<void> {
  const proposal = store.pendingProposal;
  if (!proposal) return;
  const created: Widget | null = await store.createWidget(props.workspaceId, {
    title: proposal.title ?? "Agent Widget",
    description: proposal.description ?? null,
    icon: proposal.icon ?? "📊",
    color: proposal.color ?? "#7D68C8",
    is_pinned: true,
    refresh_interval: proposal.refresh_interval ?? 300,
    query: proposal.query ?? {},
  });
  if (created) {
    await store.fetchWidgets(created._id);
  }
}

function confirmDelete(widget: Widget): void {
  widgetToDelete.value = widget;
  showDeleteModal.value = true;
}

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
    const sessionIdToUse = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await agentStore.sendMessage({
      workspace_id: workspaceId.value,
      user_id: authStore.userId as string,
      message: aiPrompt.value,
      agent_id: agentsCreated.value?.data?.agents[0]?._id as string,
      module_name: "peak",
      session_id: sessionIdToUse,
      stream: true,
    });

    // Refresh data first
    await store.fetchWidgets(workspaceId.value);
    await agentStore.fetchChatHistory(
      workspaceId.value,
      authStore.userId ?? undefined,
      "peak",
    );
    await agentStore.fetchCreatedEntities(
      workspaceId.value,
      authStore.userId ?? undefined,
      "peak",
    ); // ← AWAIT THIS

    aiPrompt.value = "";

    // Switch to preview AFTER entities are fetched, keep modal open
    if (entities.value?.length) {
      showModal.value = true; // ← ensure modal stays open
      modalMode.value = "preview"; // ← switch view
    }
  } catch (err) {
    console.error(err);
  } finally {
    isAiGenerating.value = false;
  }
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
const acceptPreview = async () => {
  const mapped = (entities.value || []).map((e: any) => ({
    action: "widget",
    workspace_id: workspaceId.value ?? null,
    widget: {
      _id: e._id,
      ...(e.payload ?? {}),
      workspace_id: workspaceId.value ?? null,
    },
  }));

  await agentStore.acceptEntities({
    action: "widget",
    workspace_id: workspaceId.value ?? null,
    entities: mapped,
  });
  await store.fetchWidgets(workspaceId.value)
  modalMode.value = "create";
  closeModal();
};
const declinePreview = async () => {
  await agentStore.declineSuggestedEntities(
    workspaceId.value,
    entities.value?.[0]?.id,
  );

  modalMode.value = "create";
};

function getSeriesMax(
  series: Array<{ value: number | string }> | undefined,
): number {
  if (!series?.length) return 1;
  return Math.max(...series.map((s) => Number(s.value)), 1);
}

function buildYTicks(
  series: Array<{ value: number | string; label: string }> | undefined,
): string[] {
  if (!series?.length) return [];
  const maxVal = getSeriesMax(series);
  return [maxVal, Math.round((maxVal * 2) / 3), Math.round(maxVal / 3), 0].map(
    (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)),
  );
}

const chartSizes = ref<Record<string, { w: number; h: number }>>({});
const chartObservers = new Map<string, ResizeObserver>();
function registerChartRef(id: string, el: Element | null) {
  if (!el) {
    chartObservers.get(id)?.disconnect();
    chartObservers.delete(id);
    return;
  }
  if (chartObservers.has(id)) return; // already observing

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      chartSizes.value[id] = {
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      };
    }
  });
  ro.observe(el);
  chartObservers.set(id, ro);
}
onBeforeUnmount(() => {
  chartObservers.forEach((ro) => ro.disconnect());
  chartObservers.clear();
  Object.keys(refreshTimers.value).forEach(clearWidgetTimer);
});

// ─── Pixel chart helpers ─────────────────────────────────────────────────────
const LINE_PAD_X = 10;
const LINE_PAD_TOP = 12;
const LINE_PAD_BOTTOM = 12;

interface PixelPoint {
  x: number;
  y: number;
}

function getPixelPoints(
  id: string,
  series: Array<{ value: number | string; label: string }> | undefined,
): PixelPoint[] {
  const size = chartSizes.value[id];
  if (!size || !series?.length) return [];

  const maxVal = getSeriesMax(series);
  const W = size.w - LINE_PAD_X * 2;
  const H = size.h - LINE_PAD_TOP - LINE_PAD_BOTTOM;
  const step = series.length > 1 ? W / (series.length - 1) : W / 2;

  return series.map((s, i) => ({
    x: LINE_PAD_X + i * step,
    y: LINE_PAD_TOP + H * (1 - Number(s.value) / maxVal),
  }));
}

function getPixelLinePath(
  id: string,
  series: Array<{ value: number | string; label: string }> | undefined,
): string {
  const pts = getPixelPoints(id, series);
  if (!pts.length) return "";
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function getPixelAreaPath(
  id: string,
  series: Array<{ value: number | string; label: string }> | undefined,
): string {
  const size = chartSizes.value[id];
  const pts = getPixelPoints(id, series);
  if (!pts.length || !size) return "";
  const baseline = size.h - LINE_PAD_BOTTOM;
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  return `${line} L${pts[pts.length - 1].x.toFixed(1)},${baseline} L${pts[0].x.toFixed(1)},${baseline} Z`;
}

function getPixelGridY(
  id: string,
  series: Array<{ value: number | string; label: string }> | undefined,
  tickIndex: number,
): number {
  const size = chartSizes.value[id];
  if (!size || !series?.length) return 0;
  const maxVal = getSeriesMax(series);
  const ticks = [
    maxVal,
    Math.round((maxVal * 2) / 3),
    Math.round(maxVal / 3),
    0,
  ];
  const val = ticks[tickIndex] ?? 0;
  const H = size.h - LINE_PAD_TOP - LINE_PAD_BOTTOM;
  return LINE_PAD_TOP + H * (1 - val / maxVal);
}
// bar chart setup
type ChartPoint = {
  label: string;
  value: number;
};

type WidgetChartData = {
  series: ChartPoint[];
};
const getSeries = (widget: any): ChartPoint[] => {
  const data = resolveWidgetData(widget)?.data as WidgetChartData | undefined;
  return data?.series ?? [];
};
const getMax = (series: ChartPoint[]) => {
  return Math.max(...series.map((s) => s.value), 1);
};

const getBarHeight = (
  point: ChartPoint,
  widgetId: string,
  series: ChartPoint[],
) => {
  const size = chartSizes.value[widgetId];
  if (!size) return 0;

  return (point.value / getMax(series)) * size.h;
};

const getBarY = (point: ChartPoint, widgetId: string, series: ChartPoint[]) => {
  const size = chartSizes.value[widgetId];
  if (!size) return 0;

  return size.h - getBarHeight(point, widgetId, series);
};
const getChartSize = (id: string) => {
  return chartSizes.value[id];
};
const barColors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

const getBarColor = (i: number) => {
  return barColors[i % barColors.length];
};
const hoveredBar = ref<null | {
  label: string;
  value: number;
  x: number;
  y: number;
}>(null);
const isDisabled = computed(() => {
  return aiPrompt.value.trim().length > 0
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition:
    opacity 0.18s,
    transform 0.18s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
