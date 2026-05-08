// utils/auth.ts
export function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 30
  const hostname = window.location.hostname
  let cookieString = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`

  if (hostname !== 'localhost') {
    const parts = hostname.split('.')
    const rootDomain = '.' + parts.slice(-2).join('.')
    cookieString += `; domain=${rootDomain}; Secure`
  }

  document.cookie = cookieString
}

export function clearAuthCookie() {
  const hostname = window.location.hostname
  if (hostname === 'localhost') {
    document.cookie = `auth_token=; path=/; max-age=0`
  } else {
    const parts = hostname.split('.')
    const rootDomain = '.' + parts.slice(-2).join('.')
    document.cookie = `auth_token=; domain=${rootDomain}; path=/; max-age=0`
  }
}