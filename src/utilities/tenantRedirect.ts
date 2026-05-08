export function getCurrentTenant(): string | null {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  if (parts.length > 2 && !hostname.startsWith('www.')) return parts[0]
  return null
}

export function isRootDomain(): boolean {
  return getCurrentTenant() === null
}

export function isLocalhost(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h.endsWith('.localhost')
}

export function buildTenantUrl(
  slug: string,
  path: string = '/dashboard',
  params: Record<string, string> = {}
): string {
  const qs = new URLSearchParams(params).toString()

  if (isLocalhost()) {
    // Dev: build a proper subdomain URL so sessionStorage guard stays per-origin
    const port = window.location.port ? `:${window.location.port}` : ''
    return `http://${slug}.localhost${port}${path}${qs ? '?' + qs : ''}`
  }

  const base = `https://${slug}.orchit.ai`
  return `${base}${path}${qs ? '?' + qs : ''}`
}

export function buildRootUrl(
  path: string = '/dashboard',
  params: Record<string, string> = {}
): string {
  const qs = new URLSearchParams(params).toString()

  if (isLocalhost()) {
    const port = window.location.port ? `:${window.location.port}` : ''
    return `http://localhost${port}${path}${qs ? '?' + qs : ''}`
  }

  return `https://orchit.ai${path}${qs ? '?' + qs : ''}`
}

/**
 * Extract the subdomain slug from any domain_link.
 * Works for:
 *   "https://tech-studio.orchit.ai"   → "tech-studio"   (production)
 *   "https://tech-studio.localhost"   → "tech-studio"   (local dev)
 *   "tech-studio.orchit.ai"           → "tech-studio"   (no scheme)
 *
 * Returns null for bare domains like "orchit.ai" or "localhost" (root hosts).
 */
export function slugFromDomainLink(domainLink: string): string | null {
  if (!domainLink) return null
  try {
    const normalized = /^https?:\/\//i.test(domainLink)
      ? domainLink
      : `https://${domainLink}`
    const hostname = new URL(normalized).hostname   // e.g. "tech-studio.orchit.ai"
    const parts    = hostname.split('.')
    // Need at least 2 parts AND the first part is not "www"
    if (parts.length >= 2 && parts[0] !== 'www') return parts[0]
    return null
  } catch {
    return null
  }
}
