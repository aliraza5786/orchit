export function getCurrentTenant(): string | null {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  if (parts.length > 2 && !hostname.startsWith('www.')) return parts[0]
  return null
}

export function isRootDomain(): boolean {
  return getCurrentTenant() === null
}

// tenantUrl.ts
export function isLocalhost(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h.endsWith('.localhost')
}

export function buildTenantUrl(
  slug: string,
  path: string = '/dashboard',
  params: Record<string, string> = {}
): string {
  if (isLocalhost()) {
    // Stay on the same origin — tenant is tracked via state/cookie, not subdomain
    const qs = new URLSearchParams(params).toString()
    return `${window.location.origin}${path}${qs ? '?' + qs : ''}`
  }

  const base = `https://${slug}.orchit.ai`
  const qs = new URLSearchParams(params).toString()
  return `${base}${path}${qs ? '?' + qs : ''}`
}

export function buildRootUrl(
  path: string = '/dashboard',
  params: Record<string, string> = {}
): string {
  if (isLocalhost()) {
    const qs = new URLSearchParams(params).toString()
    return `${window.location.origin}${path}${qs ? '?' + qs : ''}`
  }

  const qs = new URLSearchParams(params).toString()
  return `https://orchit.ai${path}${qs ? '?' + qs : ''}`
}

export function slugFromDomainLink(domainLink: string): string | null {
  if (!domainLink) return null
  try {
    // Normalise — add scheme if missing so URL() can parse it
    const normalized = /^https?:\/\//i.test(domainLink)
      ? domainLink
      : `https://${domainLink}`
    const hostname = new URL(normalized).hostname          // "acme.orchit.ai"
    const parts = hostname.split('.')
    if (parts.length > 2 && !hostname.startsWith('www.')) return parts[0]
    return null
  } catch {
    return null
  }
}
