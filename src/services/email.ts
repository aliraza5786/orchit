export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export const isValidEmail = (email: string): boolean => EMAIL_RE.test(email)

export const normalizeEmail = (email: string): string => email.trim().replace(/[;,]+$/, '').replace(/\s+/g, '')

export const parseEmailsFromText = (text: string): string[] =>
  text.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean)

export const buildSuggestions = (input: string, knownDomains: string[]): string[] => {
  const raw = input.trim()
  if (!raw) return []

  if (!raw.includes('@')) {
    return knownDomains.slice(0, 8).map((d) => `${raw}@${d}`)
  }

  const at = raw.indexOf('@')
  const user = raw.slice(0, at)
  const partial = raw.slice(at + 1).toLowerCase()
  return knownDomains.filter((d) => d.startsWith(partial)).slice(0, 8).map((d) => `${user}@${d}`)
}

export const enforceCapacity = (role:any) => {
  while (role.people.length > role.max_num_people) {
    const removed = role.people.pop()!
    const chipIdx = role.emailChips.findIndex((c:any) => c.valid && c.value.toLowerCase() === removed.email.toLowerCase())
    if (chipIdx !== -1) role.emailChips.splice(chipIdx, 1)
  }
  role.capacityWarning = role.people.length >= role.max_num_people
}

export const saveToLocalStorage = (workspace: any) => {
  localStorage.setItem('workspace', JSON.stringify(workspace))
}

export const invalidInput = (role: any): boolean => {
  const t = (role.emailInput || '').trim()
  return t.includes('@') && !isValidEmail(t)
}
