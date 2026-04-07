import { defineStore } from "pinia";
import api from "../libs/api";

export const useWidgetStore = defineStore("widgets", {
  state: () => ({
    widgets: [] as any[],
    widgetDataCache: {} as Record<string, any>,
    pendingProposal: null as any,
    isLoadingWidgets: false,
    isLoadingData: {} as Record<string, boolean>,
    isSaving: false,
    isDeleting: {} as Record<string, boolean>,
    error: null as string | null,
  }),

  getters: {
    pinnedWidgets: (state) =>
      [...state.widgets]
        .filter((w) => w.is_pinned && !w.is_preview)
        .sort((a, b) => a.pin_order - b.pin_order),

    previewWidgets: (state) =>
      state.widgets.filter((w) => w.is_preview),

    allWidgets: (state) =>
      state.widgets.filter((w) => !w.is_preview),

    getWidgetById: (state) => (id: string) =>
      state.widgets.find((w) => w._id === id) ?? null,

    getWidgetData: (state) => (id: string) =>
      state.widgetDataCache[id] ?? null,

    isWidgetDataLoading: (state) => (id: string) =>
      state.isLoadingData[id] ?? false,

    isWidgetDeleting: (state) => (id: string) =>
      state.isDeleting[id] ?? false,

    hasPendingProposal: (state) =>
      !!state.pendingProposal,
  },

  actions: {
    async fetchWidgets(workspace_id: string, pinned_only = false) {
      this.isLoadingWidgets = true;
      this.error = null;
      try {
        const params: Record<string, string> = { workspace_id };
        if (pinned_only) params.pinned_only = "true";

        const res = await api.get("widgets", { params });
        this.widgets = res.data?.data?.widgets ?? [];
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to fetch widgets";
        console.error("fetchWidgets:", err);
      } finally {
        this.isLoadingWidgets = false;
      }
    },

    async fetchWidget(widget_id: string) {
      this.error = null;
      try {
        const res = await api.get(`widgets/${widget_id}`);
        const widget = res.data?.data?.widget ?? res.data?.data;

        const idx = this.widgets.findIndex((w) => w._id === widget_id);
        if (idx !== -1) {
          this.widgets[idx] = widget;
        } else {
          this.widgets.push(widget);
        }
        return widget;
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to fetch widget";
        console.error("fetchWidget:", err);
        return null;
      }
    },

    async fetchWidgetData(widget_id: string) {
      this.isLoadingData[widget_id] = true;
      this.error = null;
      try {
        const res = await api.get(`widgets/${widget_id}/data`);
        const data = res.data?.data;
        this.widgetDataCache[widget_id] = data;
        return data;
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to fetch widget data";
        console.error("fetchWidgetData:", err);
        return null;
      } finally {
        this.isLoadingData[widget_id] = false;
      }
    },

    async fetchAllPinnedWidgetData() {
      if (!this.pinnedWidgets.length) return;
      await Promise.allSettled(
        this.pinnedWidgets.map((w: any) => this.fetchWidgetData(w._id))
      );
    },

    async updateWidget(widget_id: string, updates: Record<string, any>) {
      this.isSaving = true;
      this.error = null;
      try {
        const res = await api.patch(`widgets/${widget_id}`, updates);
        const updated = res.data?.data?.widget ?? res.data?.data;

        const idx = this.widgets.findIndex((w) => w._id === widget_id);
        if (idx !== -1) {
          this.widgets[idx] = updated;
        }
        return updated;
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to update widget";
        console.error("updateWidget:", err);
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async reorderWidgets(items: { widget_id: string; pin_order: number }[]) {
      this.error = null;
      items.forEach(({ widget_id, pin_order }) => {
        const idx = this.widgets.findIndex((w) => w._id === widget_id);
        if (idx !== -1) this.widgets[idx].pin_order = pin_order;
      });
      try {
        await api.patch("widgets/reorder", { items });
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to reorder widgets";
        console.error("reorderWidgets:", err);
        const workspace_id = this.widgets[0]?.workspace_id;
        if (workspace_id) await this.fetchWidgets(workspace_id);
      }
    },

    async deleteWidget(widget_id: string) {
      this.isDeleting[widget_id] = true;
      this.error = null;
      try {
        await api.delete(`widgets/${widget_id}`);
        this.widgets = this.widgets.filter((w) => w._id !== widget_id);
        delete this.widgetDataCache[widget_id];
        return true;
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to delete widget";
        console.error("deleteWidget:", err);
        return false;
      } finally {
        this.isDeleting[widget_id] = false;
      }
    },

    // ── CREATE widget via agent-chat endpoint ──────────────────────────────
    async createWidget(
      workspace_id: string,
      widgetFields: {
        title: string;
        description?: string | null;
        icon?: string;
        color?: string;
        is_pinned?: boolean;
        refresh_interval?: number;
        query: Record<string, any>;
      }
    ) {
      this.isSaving = true;
      this.error = null;
      try {
        const payload = {
          workspace_id,
          widget_data: {
            type: "create_widget",
            title: widgetFields.title,
            description: widgetFields.description ?? null,
            icon: widgetFields.icon ?? "📊",
            color: widgetFields.color ?? "#7D68C8",
            is_pinned: widgetFields.is_pinned ?? true,
            refresh_interval: widgetFields.refresh_interval ?? 300,
            query: widgetFields.query,
          },
        };

        const res = await api.post("agent-chat/accept-structure", payload);
        const widget = res.data?.data?.widget;
        if (widget) {
          this.widgets.push(widget);
        }
        this.pendingProposal = null;
        return widget ?? null;
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to create widget";
        console.error("createWidget:", err);
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    // ── UPDATE widget via agent-chat endpoint ─────────────────────────────
    async updateWidgetViaAgent(
      workspace_id: string,
      widget_id: string,
      updates: Record<string, any>
    ) {
      this.isSaving = true;
      this.error = null;
      try {
        const payload = {
          workspace_id,
          widget_data: {
            type: "update_widget",
            widget_id,
            updates,
          },
        };

        const res = await api.post("agent-chat/accept-structure", payload);
        const updated = res.data?.data?.widget ?? res.data?.data;

        if (updated) {
          const idx = this.widgets.findIndex((w) => w._id === widget_id);
          if (idx !== -1) {
            this.widgets[idx] = updated;
          }
        }
        return updated ?? null;
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? "Failed to update widget";
        console.error("updateWidgetViaAgent:", err);
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    setPendingProposal(proposal: any) {
      this.pendingProposal = proposal;
    },

    clearPendingProposal() {
      this.pendingProposal = null;
    },

    async refreshWidget(widget_id: string) {
      return this.fetchWidgetData(widget_id);
    },

    clearWidgetData(widget_id: string) {
      delete this.widgetDataCache[widget_id];
    },

    resetStore() {
      this.widgets = [];
      this.widgetDataCache = {};
      this.pendingProposal = null;
      this.isLoadingWidgets = false;
      this.isLoadingData = {};
      this.isSaving = false;
      this.isDeleting = {};
      this.error = null;
    },
  },
});