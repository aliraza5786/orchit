export const CREATE_ORG_DRAFT_KEY = 'onboarding_org_draft'
export const CREATE_ORG_PENDING_KEY = 'onboarding_from_create_org'

export type OrgDraft = {
  team: string
  role: string
  companySize: string
}

export function saveOrgDraft(draft: OrgDraft): void {
  localStorage.setItem(CREATE_ORG_DRAFT_KEY, JSON.stringify(draft))
  localStorage.setItem('onboarding_selected_type', 'team')
}

export function getOrgDraft(): OrgDraft | null {
  try {
    const raw = localStorage.getItem(CREATE_ORG_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OrgDraft
    if (parsed?.team != null && parsed.role && parsed.companySize) return parsed
  } catch {
    /* ignore invalid JSON */
  }
  return null
}

export function hasOrgDraft(): boolean {
  return getOrgDraft() != null
}

export function markCreateOrgPendingOnboarding(): void {
  localStorage.setItem(CREATE_ORG_PENDING_KEY, 'true')
}

export function hasCreateOrgPendingOnboarding(): boolean {
  return localStorage.getItem(CREATE_ORG_PENDING_KEY) === 'true'
}

export function clearCreateOrgPendingFlag(): void {
  localStorage.removeItem(CREATE_ORG_PENDING_KEY)
}

export function clearOrgDraft(): void {
  localStorage.removeItem(CREATE_ORG_DRAFT_KEY)
  clearCreateOrgPendingFlag()
}
