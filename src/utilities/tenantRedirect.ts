import { isRootDomain } from './tenant'

const COOKIE_KEY = 'auth_session'

function getAuthCookie(): { 
  token?: string
  company_id?: string
  personal_mode?: boolean 
} | null {
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
  if (!isRootDomain()) return false

  const session = getAuthCookie()
  if (!session?.token) return false
  if (session?.personal_mode) return false

  const tenantSlug = localStorage.getItem('last_tenant_slug')
  if (!tenantSlug) return false

  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost'

  // ✅ Fix: build URL correctly for both environments
  const targetBase = isLocalhost
    ? `http://${tenantSlug}.localhost:${window.location.port || 3000}`
    : `https://${tenantSlug}.orchit.ai`   // hardcode, not .${hostname} which loses port on local

  const targetUrl = targetBase + window.location.pathname + window.location.search

  console.log('🔀 Redirecting to tenant:', targetUrl)
  window.location.href = targetUrl
  return true
}