// utils/tenant.ts  (new shared utility)
export function getCurrentTenant(): string | null {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  // abc.orchit.ai → "abc", orchit.ai → null
  if (parts.length > 2 && !hostname.startsWith('www.')) {
    return parts[0]
  }
  return null
}

export function isRootDomain(): boolean {
  return getCurrentTenant() === null
}