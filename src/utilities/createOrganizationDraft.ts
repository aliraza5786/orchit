export const CREATE_ORG_DRAFT_KEY = 'onboarding_org_draft'
export const CREATE_ORG_PENDING_KEY = 'onboarding_from_create_org'
export const CREATE_ORG_ACTIVE_STEP_KEY = 'onboarding_org_active_step'
export const CREATE_ORG_SIGNUP_EMAIL_KEY = 'onboarding_org_signup_email'
export const CREATE_ORG_SIGNUP_TOKEN_KEY = 'onboarding_org_signup_token'
export const CREATE_ORG_SLUG_RETRY_RETURN_STEP_KEY = 'onboarding_org_slug_retry_return_step'

export type OrgDraft = {
  team: string
  industries: string[]
  companySize: string
  contactName: string
  contactEmail: string
  contactRole: string
  customDomain: string
  adminName?: string
  adminEmail?: string
}

export function saveOrgDraft(draft: OrgDraft): void {
  localStorage.setItem(CREATE_ORG_DRAFT_KEY, JSON.stringify(draft))
  localStorage.setItem('onboarding_selected_type', 'team')
}

export function patchOrgDraft(partial: Partial<OrgDraft>): void {
  const existing = getOrgDraftPartial()
  saveOrgDraft({ ...existing, ...partial } as OrgDraft)
}

export function getOrgDraftPartial(): Partial<OrgDraft> {
  try {
    const raw = localStorage.getItem(CREATE_ORG_DRAFT_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<OrgDraft>
  } catch {
    return {}
  }
}

export function getOrgDraft(): OrgDraft | null {
  try {
    const raw = localStorage.getItem(CREATE_ORG_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OrgDraft
    if (
      parsed?.team != null &&
      Array.isArray(parsed.industries) &&
      parsed.industries.length > 0 &&
      parsed.companySize &&
      parsed.contactName != null &&
      parsed.contactEmail &&
      parsed.contactRole &&
      typeof parsed.customDomain === 'string' &&
      parsed.customDomain.trim()
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export function hasOrgDraft(): boolean {
  return getOrgDraft() != null
}

export function saveOrgActiveStep(step: number): void {
  localStorage.setItem(CREATE_ORG_ACTIVE_STEP_KEY, String(step))
}

export function getOrgActiveStep(): number | null {
  const raw = localStorage.getItem(CREATE_ORG_ACTIVE_STEP_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

export function saveOrgSignupEmail(email: string): void {
  localStorage.setItem(CREATE_ORG_SIGNUP_EMAIL_KEY, email)
}

export function getOrgSignupEmail(): string {
  return localStorage.getItem(CREATE_ORG_SIGNUP_EMAIL_KEY) ?? ''
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

export function saveOrgSignupToken(token: string): void {
  sessionStorage.setItem(CREATE_ORG_SIGNUP_TOKEN_KEY, token)
}

export function getOrgSignupToken(): string {
  return sessionStorage.getItem(CREATE_ORG_SIGNUP_TOKEN_KEY) ?? ''
}

export function clearOrgSignupToken(): void {
  sessionStorage.removeItem(CREATE_ORG_SIGNUP_TOKEN_KEY)
}

export function saveCompanyCreateRetryReturnStep(step: number): void {
  localStorage.setItem(CREATE_ORG_SLUG_RETRY_RETURN_STEP_KEY, String(step))
}

export function getCompanyCreateRetryReturnStep(): number | null {
  const raw = localStorage.getItem(CREATE_ORG_SLUG_RETRY_RETURN_STEP_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

export function clearCompanyCreateRetryReturnStep(): void {
  localStorage.removeItem(CREATE_ORG_SLUG_RETRY_RETURN_STEP_KEY)
}

export function isCompanyCreateSlugRetryActive(): boolean {
  return getCompanyCreateRetryReturnStep() != null
}

export function clearOrgDraft(): void {
  localStorage.removeItem(CREATE_ORG_DRAFT_KEY)
  localStorage.removeItem(CREATE_ORG_ACTIVE_STEP_KEY)
  localStorage.removeItem(CREATE_ORG_SIGNUP_EMAIL_KEY)
  clearCompanyCreateRetryReturnStep()
  clearOrgSignupToken()
  clearCreateOrgPendingFlag()
}
