// ✅ Add this once to a shared utility (e.g. src/utilities/session.ts)
export function getAuthSession(): { token?: string; company_id?: string; personal_mode?: boolean } | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_session='))
      ?.split('=')[1]
    return raw ? JSON.parse(decodeURIComponent(raw)) : null
  } catch { return null }
}

export function getSessionCompanyId(): string | null {
  const session = getAuthSession()
  if (session?.personal_mode) return null
  return session?.company_id ?? localStorage.getItem('company_id') ?? null
}

export function isPersonalMode(): boolean {
  const session = getAuthSession()
  return session?.personal_mode === true
}