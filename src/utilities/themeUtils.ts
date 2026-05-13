// ─── Theme Utilities ──────────────────────────────────────────────────────────
// Single source of truth for all theme/color logic.

// ─── Palette Definitions ──────────────────────────────────────────────────────

export const lightColors = [
  {
    color: "#386a20",
    value: "#F0F4EC",
    "primary-color": "#386a20",
    "secondary-color": "#b8f397",
  },
  {
    color: "#0061a4",
    value: "#F0F4F9",
    "primary-color": "#0061a4",
    "secondary-color": "#d1e4ff",
  },
  {
    color: "#6750a4",
    value: "#F5F2F8",
    "primary-color": "#6750a4",
    "secondary-color": "#eaddff",
  },
  {
    color: "#984061",
    value: "#F9F1F2",
    "primary-color": "#984061",
    "secondary-color": "#ffd9e2",
  },
  {
    color: "#006a6a",
    value: "#EBF5F4",
    "primary-color": "#006a6a",
    "secondary-color": "#80f2f2",
  },
  {
    color: "#7a5900",
    value: "#FAF3E5",
    "primary-color": "#7a5900",
    "secondary-color": "#ffdf9e",
  },
  {
    color: "#445e91",
    value: "#F2F4F6",
    "primary-color": "#445e91",
    "secondary-color": "#d8e2ff",
  },
  {
    color: "#006d3a",
    value: "#EFF6F1",
    "primary-color": "#006d3a",
    "secondary-color": "#95f7b5",
  },
  {
    color: "#625b71",
    value: "#F3F2F4",
    "primary-color": "#625b71",
    "secondary-color": "#e8def8",
  },
  {
    color: "#1EA0DC",
    value: "#F0F8FE",
    "primary-color": "#00668b",
    "secondary-color": "#c2e8ff",
  },
  {
    color: "#7d68c8",
    value: "#F5F3FE",
    "primary-color": "#7d68c8",
    "secondary-color": "#c4b5fd",
  },
  {
    color: "#dc2626",
    value: "#FEF2F1",
    "primary-color": "#dc2626",
    "secondary-color": "#fecaca",
  },
  {
    color: "#2563eb",
    value: "#EFF6FE",
    "primary-color": "#2563eb",
    "secondary-color": "#bfdbfe",
  },
  {
    color: "#059669",
    value: "#ECFDF4",
    "primary-color": "#059669",
    "secondary-color": "#a7f3d0",
  },
  {
    color: "#d97706",
    value: "#FFFBEA",
    "primary-color": "#d97706",
    "secondary-color": "#fde68a",
  },
];

export const darkColors = [
  {
    color: "#b8f397",
    value: "#1a1c18",
    "primary-color": "#386a20",
    "secondary-color": "#42493d",
  },
  {
    color: "#d1e4ff",
    value: "#1a1c19",
    "primary-color": "#0061a4",
    "secondary-color": "#43474e",
  },
  {
    color: "#eaddff",
    value: "#1c1b18",
    "primary-color": "#6750a4",
    "secondary-color": "#49454f",
  },
  {
    color: "#ffd9e2",
    value: "#201a18",
    "primary-color": "#984061",
    "secondary-color": "#524346",
  },
  {
    color: "#80f2f2",
    value: "#191c18",
    "primary-color": "#006a6a",
    "secondary-color": "#3f4948",
  },
  {
    color: "#ffdf9e",
    value: "#1f1b18",
    "primary-color": "#7a5900",
    "secondary-color": "#4e4639",
  },
  {
    color: "#d8e2ff",
    value: "#1b1b18",
    "primary-color": "#445e91",
    "secondary-color": "#44474e",
  },
  {
    color: "#95f7b5",
    value: "#191c19",
    "primary-color": "#006d3a",
    "secondary-color": "#404943",
  },
  {
    color: "#e8def8",
    value: "#1c1b19",
    "primary-color": "#625b71",
    "secondary-color": "#49454e",
  },
  {
    color: "#c2e8ff",
    value: "#191c1f",
    "primary-color": "#00668b",
    "secondary-color": "#41484d",
  },
  {
    color: "#c4b5fd",
    value: "#1e1b18",
    "primary-color": "#7d68c8",
    "secondary-color": "#4c1d95",
  },
  {
    color: "#fecaca",
    value: "#450a08",
    "primary-color": "#dc2626",
    "secondary-color": "#7f1d1d",
  },
  {
    color: "#bfdbfe",
    value: "#04041bff",
    "primary-color": "#2563eb",
    "secondary-color": "#1e3a8a",
  },
  {
    color: "#a7f3d0",
    value: "#011707ff",
    "primary-color": "#1d614cff",
    "secondary-color": "#065f46",
  },
  {
    color: "#5f552eff",
    value: "#250e03ff",
    "primary-color": "#d97706",
    "secondary-color": "#78350f",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha = 0.3): string {
  if (!hex || typeof hex !== "string") return hex;
  let h = hex.trim();
  if (!h.startsWith("#")) return h;
  if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (h.length === 9) h = h.slice(0, 7);
  if (h.length !== 7) return hex;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(h1: string, h2: string, p: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(h1);
  const [r2, g2, b2] = parse(h2);
  const r = Math.round(r1 * (1 - p) + r2 * p);
  const g = Math.round(g1 * (1 - p) + g2 * p);
  const b = Math.round(b1 * (1 - p) + b2 * p);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Get the current value of a CSS variable from :root */
export function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

// ─── Theme Generation ─────────────────────────────────────────────────────────

/**
 * Given any hex color, generate a full theme object for light or dark mode.
 * Used for custom colors (not in preset palette).
 */
export function generateThemeFromColor(
  hex: string,
  isDark: boolean,
): {
  "primary-color": string;
  "secondary-color": string;
  value: string;
  color: string;
} {
  if (isDark) {
    return {
      "primary-color": hex,
      "secondary-color": mixHex(hex, "#000000", 0.6),
      value: mixHex(hex, "#000000", 0.98),
      color: hex,
    };
  }
  return {
    "primary-color": hex,
    "secondary-color": mixHex(hex, "#ffffff", 0.7),
    value: mixHex(hex, "#ffffff", 0.97),
    color: hex,
  };
}

/**
 * Get theme colors for a preset palette value (the bg hex like "#F0F4EC").
 * Falls back to first preset if not found.
 */
export function getThemeColors(
  colorValue: string,
  isDark: boolean,
): {
  "primary-color": string;
  "secondary-color": string;
  value: string;
  color: string;
} {
  const palette = isDark ? darkColors : lightColors;
  const preset = palette.find(
    (c) => c.value === colorValue || c.color === colorValue,
  );
  if (preset) {
    return {
      "primary-color": preset["primary-color"],
      "secondary-color": preset["secondary-color"],
      value: preset.value,
      color: preset.color,
    };
  }
  // Unknown color — treat as custom
  return generateThemeFromColor(colorValue, isDark);
}

/**
 * Get the palette index (0-based) of a color value/color field.
 * Returns -1 if not a preset.
 */
export function getPaletteIndex(colorValue: string, isDark: boolean): number {
  const palette = isDark ? darkColors : lightColors;
  return palette.findIndex(
    (c) => c.value === colorValue || c.color === colorValue,
  );
}

/**
 * Get the same-index preset from the target palette.
 * Used when switching light↔dark to preserve the user's selection index.
 */
export function getPresetByIndex(
  index: number,
  isDark: boolean,
): (typeof lightColors)[0] | null {
  const palette = isDark ? darkColors : lightColors;
  return palette[index] ?? null;
}

// ─── CSS Variable Application ─────────────────────────────────────────────────

/**
 * Apply --primary-color and --secondary-color to :root.
 * Accepts either a themeColors object or a raw hex string.
 */
export function applyThemeVariables(
  colorValue:
    | { "primary-color"?: string; "secondary-color"?: string; color?: string }
    | string,
  isDark: boolean,
): void {
  const root = document.documentElement;

  if (colorValue && typeof colorValue === "object") {
    if (colorValue["primary-color"]) {
      root.style.setProperty("--primary-color", colorValue["primary-color"]);
      if (colorValue["secondary-color"]) {
        root.style.setProperty(
          "--secondary-color",
          colorValue["secondary-color"],
        );
      }
      return;
    }
    if (colorValue.color) {
      applyThemeVariables(colorValue.color, isDark);
      return;
    }
    return;
  }

  if (typeof colorValue === "string") {
    const palette = isDark ? darkColors : lightColors;
    const preset = palette.find(
      (c) => c.value === colorValue || c.color === colorValue,
    );
    if (preset) {
      root.style.setProperty("--primary-color", preset["primary-color"]);
      root.style.setProperty("--secondary-color", preset["secondary-color"]);
      return;
    }
    if (colorValue.startsWith("#")) {
      const generated = generateThemeFromColor(colorValue, isDark);
      root.style.setProperty("--primary-color", generated["primary-color"]);
      root.style.setProperty("--secondary-color", generated["secondary-color"]);
      return;
    }
  }

  // Fallback to first preset
  const fallback = (isDark ? darkColors : lightColors)[0];
  root.style.setProperty("--primary-color", fallback["primary-color"]);
  root.style.setProperty("--secondary-color", fallback["secondary-color"]);
}

// ─── Background Resolver ──────────────────────────────────────────────────────

/**
 * Determines the CSS background value for the workspace layout.
 *
 * Priority:
 *  1. Image theme  → url(...)
 *  2. Brand mode   → var(--bg-body)   [themeColors is null OR themeColors has no .value]
 *  3. Color scheme → themeColors.value (tinted bg hex)
 *  4. Fallback     → var(--bg-body)
 */
export function getWorkspaceBackground(
  variables: any,
  _isDark: boolean,
): string {
  if (!variables) return "var(--bg-body)";

  // 1. Image theme
  if (variables.theme) return `url(${variables.theme})`;

  const themeColors = variables.themeColors;

  // 2. Brand mode: no themeColors stored, or themeColors has no .value (brand-mode marker)
  if (!themeColors || !themeColors.value) return "var(--bg-body)";

  // 3. Color scheme
  return themeColors.value;
}

// ─── Brand Mode ThemeColors Builder ──────────────────────────────────────────

/**
 * Build the themeColors object for brand mode.
 * color = current --bg-body CSS var value (so getWorkspaceBackground detects brand mode),
 * primary-color = workspace color.
 * No .value field → signals brand mode in getWorkspaceBackground.
 */
export function buildBrandModeThemeColors(workspaceColor: string): {
  "primary-color": string;
  "secondary-color": string;
  color: string;
} {
  const bgBody = getCSSVar("--bg-body");
  return {
    color: bgBody,
    "primary-color": workspaceColor,
    "secondary-color": "",
  };
}
