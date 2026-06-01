const DRAFT_KEY = "createWorkspaceDraft";

export type WorkspaceDraftMeta = {
  currentStep?: number;
  isAI?: boolean;
};

type WorkspaceDraftPayload = {
  workspace: unknown;
  meta: WorkspaceDraftMeta;
};

export function saveCreateWorkspaceDraft(
  workspace: unknown,
  meta?: WorkspaceDraftMeta,
) {
  if (!workspace) return;
  const existing = loadCreateWorkspaceDraft();
  const payload: WorkspaceDraftPayload = {
    workspace,
    meta: { ...existing?.meta, ...meta },
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function loadCreateWorkspaceDraft(): WorkspaceDraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceDraftPayload;
    if (!parsed?.workspace) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCreateWorkspaceDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
