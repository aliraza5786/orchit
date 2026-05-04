import { isRootDomain } from './tenant'

const COOKIE_KEY = 'auth_session'

function getAuthCookie(): { token?: string; company_id?: string; personal_mode?: boolean } | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith(COOKIE_KEY + '='))
      ?.split('=')[1]
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}

export function redirectToTenantIfNeeded(): boolean {
  // Only run on root domain
  if (!isRootDomain()) return false

  const session = getAuthCookie()

  // No session or personal mode → stay on root
  if (!session?.token) return false
  if (session?.personal_mode) return false

  // Get tenant slug from cookie company_id
  // You need a way to map company_id → subdomain slug
  const tenantSlug = localStorage.getItem('last_tenant_slug')

  if (!tenantSlug) return false

  const hostname = window.location.hostname  // orchit.ai
  const targetUrl = `https://${tenantSlug}.${hostname}${window.location.pathname}`

  console.log(`🔀 Redirecting to tenant: ${targetUrl}`)
  window.location.href = targetUrl
  return true
}