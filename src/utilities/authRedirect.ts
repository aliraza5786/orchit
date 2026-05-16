function getPrimaryDomain(): string {
  return import.meta.env.VITE_PRIMARY_DOMAIN || window.location.hostname
}

export function isOnSubdomain(): boolean {
  const primary = getPrimaryDomain()
  const current = window.location.hostname
  return current !== primary && (
    current.endsWith('.streamed.space') ||
    current.endsWith('.localhost')
  )
}

export function getMainDomainLoginUrl(redirectPath = '/dashboard'): string | null {
  if (!isOnSubdomain()) return null
  const primary = getPrimaryDomain()
  const protocol = window.location.protocol
  const encoded = encodeURIComponent(redirectPath)
  return `${protocol}//${primary}/login?logout=true&redirect=${encoded}`
}

export function redirectToLogin(
  router?: { replace: (to: any) => void },
  redirectPath = '/'  // ← was '/dashboard', change default to '/'
): boolean {
  const url = getMainDomainLoginUrl(redirectPath)
  if (url) {
    window.location.href = url
    return true
  }
  router?.replace({ name: 'Login' })
  return false
}

export function getPersonalDashboardUrl(theme?: string): string {
  const primary = getPrimaryDomain()
  const protocol = window.location.protocol
  // ← tell the receiving page this is a personal mode switch
  let url = `${protocol}//${primary}/dashboard?personal_mode=true`
  if (theme) url += `&theme=${theme}`
  return url
}