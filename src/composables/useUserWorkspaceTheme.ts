import { ref } from "vue";
import { useThemeStore } from "../stores/theme";
import { useAuthStore } from "../stores/auth";
import { useWorkspaceStore } from "../stores/workspace";
import {
  applyThemeVariables,
  buildBrandModeThemeColors,
  darkColors,
  lightColors,
  resolveThemeColorsFromPreference,
} from "../utilities/themeUtils";

export const WORKSPACE_THEME_TYPE = "workspace-theme";

export interface UserWorkspaceThemeStyle {
  themeColors: any;
  selectedIndex?: number;
  customHex?: string;
}

/** In-memory preference for the active workspace (never read from shared workspace variables). */
const activeUserTheme = ref<UserWorkspaceThemeStyle | null>(null);
const activeThemeDocId = ref<string | null>(null);
let loadRequestId = 0;

function getLocalStorageKey(workspaceId: string | number, userId: string): string {
  return `orchit-ws-theme:${workspaceId}:${userId}`;
}

/** Resolve current user id from storage, auth store, or profile payload. */
export function resolveUserId(): string | null {
  const authStore = useAuthStore();
  const fromStorage = localStorage.getItem("user_id");
  const fromStore = authStore.userId;
  const fromProfile =
    authStore.user?.data?._id ??
    authStore.user?._id ??
    authStore.user?.data?.id ??
    authStore.user?.id;

  const userId = fromStorage || fromStore || fromProfile || null;
  if (userId && !fromStorage) {
    localStorage.setItem("user_id", userId);
  }
  return userId;
}

function readLocalTheme(
  workspaceId: string | number,
  userId: string,
): UserWorkspaceThemeStyle | null {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(workspaceId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.themeColors?.value ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalTheme(
  workspaceId: string | number,
  userId: string,
  style: UserWorkspaceThemeStyle | null,
) {
  const key = getLocalStorageKey(workspaceId, userId);
  if (!style) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(style));
}

/** Apply theme colors to CSS vars + workspace store (user override or workspace default). */
export function applyWorkspaceThemeColors(
  themeColors: any | null,
  workspaceVariables: any,
  isDark: boolean,
) {
  const workspaceStore = useWorkspaceStore();

  if (!themeColors || !themeColors.value) {
    const brandColor = workspaceVariables?.["workspace-color"];
    workspaceStore.setBackground("var(--bg-body)");
    if (brandColor) {
      applyThemeVariables(
        { "primary-color": brandColor, "secondary-color": "" },
        isDark,
      );
      workspaceStore.setThemeColors(buildBrandModeThemeColors(brandColor));
    } else {
      applyThemeVariables((isDark ? darkColors : lightColors)[0], isDark);
      workspaceStore.setThemeColors(null);
    }
    return;
  }

  const variant = isDark ? themeColors.darkVariant : themeColors.lightVariant;
  const resolvedColors = variant
    ? {
        ...variant,
        color: themeColors.color,
        lightVariant: themeColors.lightVariant,
        darkVariant: themeColors.darkVariant,
      }
    : themeColors;

  applyThemeVariables(resolvedColors, isDark);
  workspaceStore.setBackground(resolvedColors.value ?? "var(--bg-body)");
  workspaceStore.setThemeColors(resolvedColors);
}

/** Apply the current user's saved preference (or workspace brand default). */
export function applyActiveUserTheme(workspaceVariables: any, isDark: boolean) {
  const resolved = resolveThemeColorsFromPreference(
    activeUserTheme.value,
    isDark,
  );
  applyWorkspaceThemeColors(resolved, workspaceVariables, isDark);
}

function readLegacyWorkspaceTheme(
  variables: any,
  userId: string,
): UserWorkspaceThemeStyle | null {
  if (!variables) return null;
  const flatKey = `user-theme-colors-${userId}`;
  const legacy = variables[flatKey] ?? variables["user-theme-colors"]?.[userId];
  return legacy?.themeColors?.value ? legacy : null;
}

/** Load preference from localStorage + API — never from shared workspace variables. */
export async function loadUserThemePreference(
  workspaceId: string | number | null | undefined,
  workspaceVariables?: any,
): Promise<UserWorkspaceThemeStyle | null> {
  const requestId = ++loadRequestId;
  const userId = resolveUserId();

  if (!workspaceId || !userId) {
    activeUserTheme.value = null;
    activeThemeDocId.value = null;
    return null;
  }

  let style = readLocalTheme(workspaceId, userId);

  // One-time migration from legacy shared workspace variable (current user only)
  if (!style && workspaceVariables) {
    const legacy = readLegacyWorkspaceTheme(workspaceVariables, userId);
    if (legacy) {
      style = legacy;
      writeLocalTheme(workspaceId, userId, legacy);
      // Re-save privately so future loads don't depend on shared workspace vars
      saveUserThemePreference(workspaceId, legacy).catch(() => {});
    }
  }

  if (!style) {
    try {
      const themeStore = useThemeStore();
      const match = await themeStore.getUserWorkspaceTheme(String(workspaceId), userId);
      if (requestId !== loadRequestId) return activeUserTheme.value;

      if (match?._id && match?.style?.themeColors?.value) {
        activeThemeDocId.value = match._id;
        style = match.style;
        writeLocalTheme(workspaceId, userId, style);
      } else {
        activeThemeDocId.value = null;
      }
    } catch {
      if (requestId !== loadRequestId) return activeUserTheme.value;
      activeThemeDocId.value = null;
    }
  }

  if (requestId !== loadRequestId) return activeUserTheme.value;

  activeUserTheme.value = style;
  return style;
}

/** Persist user theme privately — localStorage + per-user API doc (NOT shared workspace variables). */
export async function saveUserThemePreference(
  workspaceId: string | number,
  style: UserWorkspaceThemeStyle | null,
): Promise<boolean> {
  const userId = resolveUserId();
  if (!userId || !workspaceId) return false;

  const themeStore = useThemeStore();

  if (style?.themeColors?.value) {
    writeLocalTheme(workspaceId, userId, style);
    activeUserTheme.value = style;

    const payload = {
      workspace_id: workspaceId,
      type: WORKSPACE_THEME_TYPE,
      type_id: String(workspaceId),
      style,
      created_by: userId,
    };

    try {
      if (activeThemeDocId.value) {
        await themeStore.updateUserWorkspaceTheme(activeThemeDocId.value, payload);
      } else {
        await themeStore.saveUserWorkspaceTheme(payload);
        const match = await themeStore.getUserWorkspaceTheme(String(workspaceId), userId);
        if (match?._id) activeThemeDocId.value = match._id;
      }
      return true;
    } catch (err) {
      console.error("Failed to save user workspace theme:", err);
      return false;
    }
  }

  writeLocalTheme(workspaceId, userId, null);
  activeUserTheme.value = null;

  if (activeThemeDocId.value) {
    try {
      await themeStore.deleteUserWorkspaceTheme(activeThemeDocId.value);
    } catch {
      /* local state already cleared */
    }
    activeThemeDocId.value = null;
  }

  return true;
}

export function resetActiveUserThemeState() {
  loadRequestId++;
  activeUserTheme.value = null;
  activeThemeDocId.value = null;
}

export function useUserWorkspaceTheme() {
  return {
    activeUserTheme,
    loadUserThemePreference,
    saveUserThemePreference,
    applyActiveUserTheme,
    resetActiveUserThemeState,
    resolveUserId,
  };
}
