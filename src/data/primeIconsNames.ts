export const primeIcons = [
  // Basics
  "home","user","gear","calendar","magnifying-glass","bell","check","xmark",
  "plus","minus","trash","pen","circle-info","circle-question","lock",
  "unlock","star","heart","bookmark","camera","cloud","download",
  "upload","eye","envelope","file","globe","key","map","power-off",
  "pen-to-square","floppy-disk","print","users","bars","mobile-screen","tablet-screen-button","laptop",
  "desktop","clock","clipboard","flag","comment","comments","share-nodes",

  // Social
  "github","twitter","facebook","linkedin","google","instagram","youtube",

  // Status / UI
  "shield","trophy","wrench","screwdriver-wrench","rocket","book","location-dot","wifi",
  "battery-full","battery-half","battery-empty","volume-high","volume-low",
  "volume-xmark","signal","gift","car","truck","bicycle","plane","ship",

  // Shapes & indicators
  "circle","square","circle-check","circle-xmark",
  "circle-exclamation","circle-question","circle-info",

  // Media controls
  "play","pause","stop","forward","backward",
  "forward-step","backward-step","rotate-left","rotate-right",
  "circle-play","circle-pause","circle-stop",

  // Arrows
  "arrow-right","arrow-left","arrow-up","arrow-down",
  "arrow-rotate-left","arrow-rotate-right",
  "chevron-left","chevron-right","chevron-up","chevron-down",
  "caret-left","caret-right","caret-up","caret-down",
  "angles-left","angles-right","angles-up","angles-down",

  // Tables / layout
  "table","table-cells","table-cells-large","table-list","columns",

  // ── PROJECT MANAGEMENT ──────────────────────────────────────────────────

  // Project planning
  "list-check","diagram-project","sitemap","briefcase","clipboard-check",
  "clock-rotate-left","arrows-rotate","layer-group","bullseye",
  "flag-checkered","note-sticky","code-branch","road-barrier","route",
  "bars-progress","calendar-days","calendar-check","calendar-xmark",
  "calendar-plus","calendar-minus","calendar-week",

  // Tasks & workflow
  "list","list-ul","list-ol","check-double","square-check",
  "hourglass","hourglass-half","hourglass-start","hourglass-end",
  "rotate","stopwatch","timer","inbox","tray","filter","sort","shuffle",
  "arrow-up-wide-short","arrow-down-wide-short","arrows-sort",

  // Team & people
  "user-group","user-plus","user-minus","user-check","user-xmark",
  "user-tie","user-gear","user-shield","user-clock","people-group",
  "people-arrows","person-running","person-chalkboard",
  "id-card","id-badge","address-card","address-book","ring-person",

  // Communication
  "comment-dots","comment-check","comment-slash","message",
  "envelope-open","paper-plane","at","reply","reply-all",
  "bell-slash","bell-concierge","phone","phone-slash","phone-volume",
  "walkie-talkie","satellite-dish","rss","megaphone","video","video-slash","headset","tower-broadcast",

  // Files & documents
  "file-lines","file-pen","file-check","file-circle-check",
  "file-circle-plus","file-circle-minus","file-circle-xmark","file-circle-exclamation",
  "file-code","file-csv","file-pdf","file-image","file-video","file-audio","file-zipper",
  "file-export","file-import","files",
  "folder","folder-open","folder-plus","folder-minus","folder-tree","folders",
  "copy","paste","cloud-arrow-up","cloud-arrow-down",

  // Charts & analytics
  "chart-bar","chart-column","chart-line","chart-area","chart-pie",
  "chart-simple","chart-gantt","chart-scatter",
  "arrows-to-dot","circle-nodes","network-wired",
  "magnifying-glass-chart","magnifying-glass-plus","magnifying-glass-minus",
  "square-poll-vertical","square-poll-horizontal",
  "database","server","hard-drive","microchip","memory",

  // Status & priority
  "circle-notch","spinner","triangle-exclamation","octagon-exclamation",
  "star-half","star-half-stroke","thumbs-up","thumbs-down",
  "fire","fire-flame-curved","bolt","ban","shield-check","shield-xmark",
  "tag","tags","exclamation","question","info",

  // Development & code
  "code","code-branch","code-compare","code-commit","code-merge",
  "code-fork","terminal","laptop-code","brackets-curly","brackets-square",
  "bug","bug-slash","hammer","toolbox","cube","cubes",
  "object-group","object-ungroup","puzzle-piece","robot","gears",

  // Finance & resources
  "dollar-sign","euro-sign","sterling-sign","money-bill","money-bill-wave",
  "money-bills","coins","piggy-bank","wallet","credit-card","receipt",
  "file-invoice-dollar","percent","calculator","scale-balanced","scale-unbalanced",

  // Productivity & actions
  "pen-fancy","pen-ruler","pen-clip","pencil","highlighter","eraser","scissors",
  "link","link-slash","paperclip","thumbtack",
  "trash-arrow-up","trash-can","box-archive",
  "undo","redo","add","note-medical","bookmark-slash",

  // Layout & navigation
  "expand","compress","maximize","minimize",
  "ellipsis","ellipsis-vertical","grip","grip-vertical","grip-lines",
  "eye-slash","sidebar","arrow-up-right-from-square",

  // ────────────────────────────────────────────────────────────────────────

  // Charts (original)
  "chart-bar","chart-pie","chart-line","chart-area",

  // Misc
  "handshake","bug","pen-fancy","paintbrush","marker",
  "ruler-combined","vector-square","photo-film",
  "clapperboard","warehouse","shop",

  // Health / misc
  "heart-pulse","cloud-sun"
];

/** Dedupe helper for icon name lists */
function dedupeIcons(names: string[]): string[] {
  return [...new Set(names)];
}

const primeIconSet = new Set(primeIcons);

function pmIcons(names: string[]): string[] {
  return dedupeIcons(names).filter((n) => primeIconSet.has(n));
}

/** Icons suited for workspace modules (areas / boards / teams) */
export const projectManagementModuleIcons = pmIcons([
  "diagram-project", "sitemap", "briefcase", "clipboard-check", "layer-group",
  "bullseye", "flag-checkered", "note-sticky", "code-branch", "route",
  "bars-progress", "road-barrier", "cubes", "cube", "object-group",
  "puzzle-piece", "rocket", "gears", "toolbox", "hammer",
  "user-group", "users", "people-group", "user-tie", "user-gear",
  "user-shield", "user-clock", "person-chalkboard", "handshake",
  "chart-bar", "chart-column", "chart-line", "chart-area", "chart-pie",
  "chart-simple", "chart-gantt", "chart-scatter", "square-poll-vertical",
  "magnifying-glass-chart", "network-wired", "circle-nodes",
  "folder", "folder-open", "folder-tree", "folders", "files",
  "database", "server", "cloud", "globe", "shield", "shield-check",
  "calendar", "calendar-days", "calendar-check", "calendar-week",
  "clock", "clock-rotate-left", "stopwatch", "hourglass",
  "home", "warehouse", "shop", "car", "truck",
  "inbox", "envelope", "comments", "comment-dots", "video", "headset",
  "book", "bookmark", "tag", "tags", "trophy", "flag", "fire", "bolt",
  "list-check", "clipboard", "pen-ruler", "pen-fancy", "paintbrush",
  "table", "table-cells", "columns", "bars", "ellipsis", "grip",
  "filter", "sort", "arrows-rotate", "rotate", "shuffle",
  "dollar-sign", "calculator", "receipt", "scale-balanced",
  "laptop-code", "terminal", "code", "bug", "robot", "microchip",
  "circle-info", "circle-question", "star", "heart", "eye", "gear",
  "pen-to-square", "floppy-disk", "share-nodes", "link", "paperclip",
  "box-archive", "trash-can", "plus", "check", "check-double",
]);

/** Icons suited for sheets (views, lists, boards, task tables) */
export const projectManagementSheetIcons = pmIcons([
  "table", "table-cells", "table-cells-large", "table-list", "columns",
  "list", "list-ul", "list-ol", "list-check", "square-check",
  "clipboard", "clipboard-check", "clipboard-list", "note-sticky",
  "inbox", "tray", "filter", "sort", "shuffle",
  "arrow-up-wide-short", "arrow-down-wide-short", "arrows-sort",
  "calendar", "calendar-days", "calendar-check", "calendar-xmark",
  "calendar-plus", "calendar-minus", "calendar-week",
  "clock", "clock-rotate-left", "stopwatch", "timer",
  "hourglass", "hourglass-half", "hourglass-start", "hourglass-end",
  "chart-bar", "chart-column", "chart-line", "chart-area", "chart-pie",
  "chart-simple", "chart-gantt", "chart-scatter",
  "square-poll-vertical", "square-poll-horizontal", "bars-progress",
  "file", "file-lines", "file-pen", "file-check", "file-circle-check",
  "file-circle-plus", "file-export", "file-import", "file-code", "file-csv",
  "folder", "folder-open", "folder-tree", "copy", "paste",
  "diagram-project", "sitemap", "code-branch", "route", "bullseye",
  "flag", "flag-checkered", "bookmark", "tag", "tags",
  "pen", "pen-to-square", "pencil", "highlighter", "eraser",
  "comment", "comments", "comment-dots", "message", "at", "reply",
  "user", "user-check", "user-plus", "user-clock", "users",
  "check", "check-double", "circle-check", "xmark", "ban",
  "magnifying-glass", "magnifying-glass-plus", "magnifying-glass-minus",
  "eye", "eye-slash", "link", "paperclip", "thumbtack",
  "bolt", "fire", "star", "triangle-exclamation", "circle-exclamation",
  "spinner", "circle-notch", "rotate", "arrows-rotate", "undo", "redo",
  "plus", "minus", "trash", "trash-can", "box-archive",
  "grip", "grip-vertical", "grip-lines", "ellipsis", "ellipsis-vertical",
  "expand", "compress", "maximize", "minimize",
  "database", "server", "cloud", "cloud-arrow-up", "cloud-arrow-down",
  "columns", "layer-group", "object-group", "cubes",
]);