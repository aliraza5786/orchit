export type WorkspaceInviteAction = 'accepted' | 'rejected'

const TOKEN_KEY = 'pending_workspace_invite_token'
const ACTION_KEY = 'pending_workspace_invite_action'

export function getWorkspaceInvitePath(token: string): string {
  return `/workspace-invite/${encodeURIComponent(token)}`
}

export function savePendingWorkspaceInvite(token: string, action: WorkspaceInviteAction): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ACTION_KEY, action)
}

export function clearPendingWorkspaceInvite(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACTION_KEY)
}

export function getPendingWorkspaceInvite(): {
  token: string
  action: WorkspaceInviteAction
} | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const action = localStorage.getItem(ACTION_KEY)
  if (!token || (action !== 'accepted' && action !== 'rejected')) return null
  return { token, action }
}

export function getPendingWorkspaceInviteRedirectPath(): string | null {
  const pending = getPendingWorkspaceInvite()
  return pending ? getWorkspaceInvitePath(pending.token) : null
}

export function hasPendingWorkspaceInvite(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}
