import { isCompanyUser } from './onboardingRedirect'

function getPrimaryDomain(): string {
  return import.meta.env.VITE_PRIMARY_DOMAIN || window.location.hostname
}

/** Base64url encode (matches finish-profile / onboarding cross-domain auth). */
export function encodeAuthParam(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')
}

/** Unwrap `{ status, message, data }` profile response or return the inner user record. */
export function normalizeProfileUserData(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!raw) return null
  const inner = raw.data as Record<string, unknown> | undefined
  if (inner && (inner._id != null || inner.u_email != null)) return inner
  if (raw._id != null || raw.u_email != null) return raw
  return raw
}

type CompanyProfileSlice = { _id?: string; domain_link?: string }

/** Active company's tenant URL from profile (`active_company.domain_link`). */
export function getActiveCompanyDomainLink(
  userData: Record<string, unknown> | null | undefined,
): string {
  const profile = normalizeProfileUserData(userData)
  if (!profile) return ''

  const activeCompanyId = getActiveCompanyIdFromProfile(profile)
  const activeCompany = profile.active_company as CompanyProfileSlice | undefined

  if (activeCompany?.domain_link) {
    if (!activeCompanyId || activeCompany._id === activeCompanyId) {
      return activeCompany.domain_link.trim()
    }
  }

  if (activeCompanyId) {
    const list = profile.companies_list as CompanyProfileSlice[] | undefined
    if (Array.isArray(list)) {
      const fromList = list.find(
        (c) => c?._id === activeCompanyId && c?.domain_link,
      )
      if (fromList?.domain_link) return fromList.domain_link.trim()
    }

    const companies = profile.companies as CompanyProfileSlice | undefined
    if (companies?._id === activeCompanyId && companies.domain_link) {
      return companies.domain_link.trim()
    }
  }

  return ''
}

/** @deprecated Use getActiveCompanyDomainLink */
export function getDomainLinkFromProfile(
  userData: Record<string, unknown> | null | undefined,
): string {
  return getActiveCompanyDomainLink(userData)
}

export function getActiveCompanyIdFromProfile(
  userData: Record<string, unknown> | null | undefined,
): string {
  const profile = normalizeProfileUserData(userData)
  if (!profile) return ''
  if (typeof profile.active_company_id === 'string') return profile.active_company_id
  const activeCompany = profile.active_company as { _id?: string } | undefined
  return activeCompany?._id ?? ''
}

export function buildCompanyDomainUrl(options: {
  domainLink: string
  path?: string
  theme: string
  /** Raw JWT — encoded into `_auth` */
  token?: string
  /** Pre-encoded `_auth` from router query */
  encodedAuth?: string
  companyId?: string
  encodedCompanyId?: string
  extraQuery?: Record<string, string>
}): string {
  const {
    domainLink,
    path = '/dashboard',
    theme,
    token,
    encodedAuth,
    companyId,
    encodedCompanyId,
    extraQuery,
  } = options

  const params = new URLSearchParams()
  params.set('theme', theme)
  if (encodedAuth) params.set('_auth', encodedAuth)
  else if (token) params.set('_auth', encodeAuthParam(token))
  if (encodedCompanyId) params.set('_cid', encodedCompanyId)
  else if (companyId) params.set('_cid', encodeAuthParam(companyId))
  if (extraQuery) {
    Object.entries(extraQuery).forEach(([key, value]) => {
      if (value != null && value !== '') params.set(key, value)
    })
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = domainLink.replace(/\/$/, '')
  return `${base}${normalizedPath}?${params.toString()}`
}

export function buildCompanyDomainDashboardUrl(options: {
  domainLink: string
  token: string
  theme: string
  companyId?: string
  extraQuery?: Record<string, string>
}): string {
  return buildCompanyDomainUrl({
    domainLink: options.domainLink,
    path: '/dashboard',
    theme: options.theme,
    token: options.token,
    companyId: options.companyId,
    extraQuery: options.extraQuery,
  })
}

/**
 * After login, company-email users with a tenant domain_link go to that subdomain's dashboard.
 * Personal/generic emails stay on the current origin (/dashboard). Returns true if navigated away.
 */
export function tryRedirectToCompanyDomainDashboard(
  userData: Record<string, unknown> | null | undefined,
  options?: {
    token?: string
    theme?: string
    extraQuery?: Record<string, string>
  },
): boolean {
  const profile = normalizeProfileUserData(userData)
  if (!profile || !isCompanyUser(profile)) return false

  const domainLink = getActiveCompanyDomainLink(profile)
  if (!domainLink) return false

  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false

  const token = options?.token ?? localStorage.getItem('token') ?? ''
  if (!token) return false

  const theme = options?.theme ?? localStorage.getItem('theme') ?? 'light'
  const companyId = getActiveCompanyIdFromProfile(profile)
  if (companyId) localStorage.setItem('company_id', companyId)

  window.location.href = buildCompanyDomainDashboardUrl({
    domainLink,
    token,
    theme,
    companyId: companyId || undefined,
    extraQuery: options?.extraQuery,
  })
  return true
}

export function isOnSubdomain(): boolean {
  const primary = getPrimaryDomain()
  const current = window.location.hostname

  if (current === primary) return false

  // Generic subdomain check: current host ends with ".{primary}"
  return current.endsWith(`.${primary}`)
}

export function getMainDomainLoginUrl(redirectPath = '/dashboard'): string | null {
  if (!isOnSubdomain()) return null
  const primary = getPrimaryDomain()
  const protocol = window.location.protocol
  const encoded = encodeURIComponent(redirectPath)
  return `${protocol}//${primary}/login?logout=true&redirect=${encoded}`
}

/** Build the login URL (main domain when on a tenant subdomain). */
export function getLoginPageUrl(redirectAfterLogin?: string): string {
  const protocol = window.location.protocol
  const primary = getPrimaryDomain()
  const onTenantHost = isOnSubdomain()
  const base = onTenantHost
    ? `${protocol}//${primary}/login`
    : `${window.location.origin}/login`

  const params = new URLSearchParams({ logout: 'true' })
  if (
    redirectAfterLogin &&
    redirectAfterLogin !== '/login' &&
    !redirectAfterLogin.startsWith('/login?')
  ) {
    params.set('redirect', redirectAfterLogin)
  }
  return `${base}?${params.toString()}`
}

export function redirectToLogin(
  _router?: { replace: (to: any) => void },
  redirectAfterLogin?: string,
): boolean {
  window.location.href = getLoginPageUrl(redirectAfterLogin)
  return true
}

export function getPersonalDashboardUrl(theme?: string): string {
  const primary = getPrimaryDomain()
  const protocol = window.location.protocol
  // ← tell the receiving page this is a personal mode switch
  let url = `${protocol}//${primary}/dashboard?personal_mode=true`
  if (theme) url += `&theme=${theme}`
  return url
}