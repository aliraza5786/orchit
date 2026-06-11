export type WorkspaceInviteAction = 'accepted' | 'rejected'
export type InviteType = 'workspace' | 'space'

const TOKEN_KEY = 'pending_workspace_invite_token'
const ACTION_KEY = 'pending_workspace_invite_action'
const PATH_KEY = 'pending_invite_return_path'
const TYPE_KEY = 'pending_invite_type'

const INVITE_PATH_RE = /^\/(workspace-invite|space-invite|company-invite)\/[^/?#]+/

export function isInvitePath(path: string): boolean {
  return INVITE_PATH_RE.test(path.split('?')[0])
}

export function parseInvitePath(path: string): { type: InviteType; token: string } | null {
  const clean = path.split('?')[0]
  const match = clean.match(/^\/(workspace-invite|space-invite|company-invite)\/([^/]+)/)
  if (!match) return null
  const type: InviteType = match[1] === 'workspace-invite' ? 'workspace' : 'space'
  return { type, token: decodeURIComponent(match[2]) }
}

export function getInvitePath(token: string, type: InviteType = 'workspace'): string {
  const segment = type === 'workspace' ? 'workspace-invite' : 'space-invite'
  return `/${segment}/${encodeURIComponent(token)}`
}

/** @deprecated Use getInvitePath */
export function getWorkspaceInvitePath(token: string): string {
  return getInvitePath(token, 'workspace')
}

/** Remember invite URL when user lands on an invite link (survives refresh and auth flows). */
export function savePendingInvitePath(path: string): void {
  const parsed = parseInvitePath(path)
  if (!parsed) return
  localStorage.setItem(PATH_KEY, getInvitePath(parsed.token, parsed.type))
  localStorage.setItem(TOKEN_KEY, parsed.token)
  localStorage.setItem(TYPE_KEY, parsed.type)
}

export function savePendingWorkspaceInvite(
  token: string,
  action: WorkspaceInviteAction,
  type: InviteType = 'workspace',
): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ACTION_KEY, action)
  localStorage.setItem(TYPE_KEY, type)
  localStorage.setItem(PATH_KEY, getInvitePath(token, type))
}

export function clearPendingWorkspaceInvite(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACTION_KEY)
  localStorage.removeItem(PATH_KEY)
  localStorage.removeItem(TYPE_KEY)
}

export function getPendingWorkspaceInvite(): {
  token: string
  action: WorkspaceInviteAction
  type: InviteType
} | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const action = localStorage.getItem(ACTION_KEY)
  if (!token || (action !== 'accepted' && action !== 'rejected')) return null
  const type = (localStorage.getItem(TYPE_KEY) as InviteType) || 'workspace'
  return { token, action, type }
}

/** Return saved invite URL for post-onboarding / post-login redirect. */
export function getPendingInviteRedirectPath(): string | null {
  const savedPath = localStorage.getItem(PATH_KEY)
  if (savedPath && isInvitePath(savedPath)) return savedPath.split('?')[0]

  const pending = getPendingWorkspaceInvite()
  if (!pending) return null
  return getInvitePath(pending.token, pending.type)
}

export function getPendingWorkspaceInviteRedirectPath(): string | null {
  return getPendingInviteRedirectPath()
}

export function hasPendingWorkspaceInvite(): boolean {
  return !!localStorage.getItem(PATH_KEY) || !!localStorage.getItem(TOKEN_KEY)
}
