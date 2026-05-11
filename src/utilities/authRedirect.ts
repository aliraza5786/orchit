export function getMainDomainLoginUrl(redirectPath = '/dashboard'): string | null {
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const encoded = encodeURIComponent(redirectPath)

  if (hostname.endsWith('.streamed.space') && hostname !== 'streamed.space') {
    return `${protocol}//streamed.space/login?logout=true&redirect=${encoded}`
  }

  if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
    return `${protocol}//localhost/login?logout=true&redirect=${encoded}`
  }
  return null
}

export function isOnSubdomain(): boolean {
  const h = window.location.hostname
  return (
    (h.endsWith('.streamed.space') && h !== 'streamed.space') ||
    (h.endsWith('.localhost') && h !== 'localhost')
  )
}

export function redirectToLogin(router?: { replace: (to: any) => void }, redirectPath = '/dashboard'): boolean {
  const url = getMainDomainLoginUrl(redirectPath)
  if (url) {
    window.location.href = url
    return true
  }
  if (router) {
    router.replace({ name: 'Login' })
  }
  return false
}