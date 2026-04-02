import { defineStore } from "pinia";
import api from "../libs/api";
import { toast } from "vue-sonner";
const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const useThemeStore = defineStore("theme", {
  state: () => ({
    isSavingTheme: false,
    isLoadingtheme: false,
    isUpdatingTheme: false,
    isDeletingTheme: false,
    allSavedThemes: [] as any[],
    selectedTheme: null as any,
  }),

  actions: {
    // CREATE
    async saveMindmapTheme(payload: any) {
      this.isSavingTheme = true;
      try {
        await api.request({
          url: `${baseUrl}mindmap-styles`,
          method: "POST",
          data: payload,
        });
        toast.success("Mindmap theme saved successfully");
      } catch (err) {
        toast.error("Failed to save mindmap theme");
      } finally {
        this.isSavingTheme = false;
      }
    },
    async getMindmapThemeByWorkflow(
      workspaceId: string,
      typeId: any,
      type?: string,
    ) {
      this.isLoadingtheme = true;
      try {
        const params: Record<string, any> = {
          workspace_id: workspaceId,
        };

        // Only send type_id if it has a value
        if (typeId !== null && typeId !== undefined) {
          params.type_id = typeId;
        }

        const res = await api.request({
          url: `${baseUrl}mindmap-styles`,
          method: "GET",
          params,
        });

        const themes = res?.data?.data || [];
        this.allSavedThemes = themes;
        let match = null;
        if (type) {
          match =
            themes.find((t: any) => {
              const typeMatch = t.type === type;
              const typeIdMatch =
                typeId === null
                  ? t.type_id === null || t.type_id === undefined
                  : t.type_id === typeId;
              return typeMatch && typeIdMatch;
            }) ?? null;
        } else {
          match = themes[0] ?? null;
        }

        this.selectedTheme = match;
        return match;
      } catch (err) {
        toast.error("Failed to fetch theme");
        return null;
      } finally {
        this.isLoadingtheme = false;
      }
    },
    // ✅ UPDATE
    async updateMindmapTheme(id: string, payload: any) {
      this.isUpdatingTheme = true;
      try {
        await api.request({
          url: `${baseUrl}mindmap-styles/${id}`,
          method: "PUT",
          data: payload,
        });
        toast.success("Mindmap theme updated successfully");
      } catch (err) {
        toast.error("Failed to update theme");
      } finally {
        this.isUpdatingTheme = false;
      }
    },

    // ✅ DELETE
    async deleteMindmapTheme(id: string) {
      this.isDeletingTheme = true;
      try {
        await api.request({
          url: `${baseUrl}mindmap-styles/${id}`,
          method: "DELETE",
        });

        // Optional: remove from local state instantly
        this.allSavedThemes = this.allSavedThemes.filter(
          (theme: any) => theme.id !== id,
        );

        toast.success("Mindmap theme deleted successfully");
      } catch (err) {
        toast.error("Failed to delete theme");
      } finally {
        this.isDeletingTheme = false;
      }
    },
  },
});
