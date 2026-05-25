/** Generic / personal email providers (not company domains). */
export const GENERIC_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'live.com', 'msn.com', 'aol.com', 'protonmail.com', 'mail.com',
  'zoho.com', 'yandex.com', 'inbox.com', 'gmx.com', 'fastmail.com',
  'tutanota.com', 'hey.com', 'pm.me', 'googlemail.com',
])

export function getEmailFromUserData(userData: Record<string, unknown> | null | undefined): string {
  if (!userData) return ''
  const email = userData.u_email ?? userData.email
  return typeof email === 'string' ? email : ''
}

export function getEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return ''
  return email.split('@')[1].toLowerCase().trim()
}

/** Company domain email (e.g. user@streamedinc.com), not gmail/yahoo/etc. */
export function isCompanyEmail(email: string): boolean {
  const domain = getEmailDomain(email)
  if (!domain) return false
  return !GENERIC_EMAIL_PROVIDERS.has(domain)
}

export function isCompanyUser(userData: Record<string, unknown> | null | undefined): boolean {
  return isCompanyEmail(getEmailFromUserData(userData))
}

export function hasHeardAboutUs(userData: Record<string, unknown> | null | undefined): boolean {
  const heard = userData?.heard_about_us
  if (Array.isArray(heard)) return heard.length > 0
  if (heard != null && heard !== '') return true
  return false
}

export function hasCompanySetup(userData: Record<string, unknown> | null | undefined): boolean {
  if (!userData) return false
  if (userData.active_company_id) return true
  const activeCompany = userData.active_company as { _id?: string } | undefined
  if (activeCompany?._id) return true
  const companiesList = userData.companies_list
  if (Array.isArray(companiesList) && companiesList.length > 0) return true
  const companies = userData.companies as { _id?: string } | undefined
  if (companies?._id) return true
  return false
}

/** Whether onboarding is finished for this user (company vs personal rules). */
export function isOnboardingComplete(userData: Record<string, unknown> | null | undefined): boolean {
  if (!userData) return false
  if (isCompanyUser(userData)) return hasCompanySetup(userData)
  return hasHeardAboutUs(userData)
}

export function shouldRedirectToAssociatedOrg(userData: Record<string, unknown> | null | undefined): boolean {
  const associatedCompany = userData?.associated_company as { _id?: string } | undefined
  if (!associatedCompany?._id) return false
  const hasActiveCompany = !!userData?.active_company_id
  const hasWorkspaces = Array.isArray(userData?.workspaces) && userData.workspaces.length > 0
  return !hasActiveCompany && !hasWorkspaces && !hasCompanySetup(userData)
}

export type PostAuthRedirectOptions = {
  /** True for sign-in; skips /associated-organization and sends users with an associated org to the dashboard. */
  isLogin?: boolean
}

/** After verify-email-pre-login: `verified === true` means account already exists (login). */
export function isExistingAccountFromPreLogin(
  preLoginResponse: Record<string, unknown> | null | undefined,
): boolean {
  if (!preLoginResponse) return false
  const verified =
    (preLoginResponse.data as { verified?: boolean } | undefined)?.verified ??
    preLoginResponse.verified
  return verified === true
}

/** Prime CreateProfile personal vs company paths (same rules as manual signup). */
export function primeOnboardingTypeForEmail(email: string): void {
  if (isCompanyEmail(email)) {
    localStorage.setItem('onboarding_selected_type', 'team')
  } else {
    localStorage.setItem('onboarding_selected_type', 'personal')
  }
}

/** Post-auth path after bootstrap (excludes invite/intent/query overrides). */
export function getPostAuthRedirectPath(
  userData: Record<string, unknown> | null | undefined,
  options?: PostAuthRedirectOptions,
): '/dashboard' | '/onboarding' | '/associated-organization' {
  const associatedCompany = userData?.associated_company as { _id?: string } | undefined
  const hasAssociated = !!associatedCompany?._id

  if (options?.isLogin) {
    if (hasAssociated || isOnboardingComplete(userData)) {
      return '/dashboard'
    }
    return '/onboarding'
  }

  if (shouldRedirectToAssociatedOrg(userData)) {
    return '/associated-organization'
  }
  if (isOnboardingComplete(userData)) {
    return '/dashboard'
  }
  return '/onboarding'
}

export const ONBOARDING_STORAGE_KEYS = [
  'onboarding_active_step', 'onboarding_dns_input', 'onboarding_has_custom_domain',
  'onboarding_company_id', 'onboarding_site_name', 'onboarding_site_slug',
  'onboarding_super_admin_otp_sent', 'onboarding_super_admin_user_id',
  'onboarding_super_admin_email_prefix', 'onboarding_super_admin_name',
  'onboarding_domain_phase', 'onboarding_current_domain', 'onboarding_current_instructions',
  'onboarding_selected_verification_method',
  'onboarding_org_draft', 'onboarding_from_create_org',
] as const

export function clearOnboardingStorageKeys(): void {
  ONBOARDING_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
}
