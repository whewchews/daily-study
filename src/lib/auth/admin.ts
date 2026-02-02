const normalizeList = (value?: string | null) =>
  (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

const ADMIN_EMAILS = normalizeList(process.env.NEXT_PUBLIC_ADMIN_EMAILS)

export interface AdminIdentifiers {
  email?: string | null
}

export function isAdminUser({ email }: AdminIdentifiers): boolean {
  const normalizedEmail = email?.trim().toLowerCase()
  if (normalizedEmail && ADMIN_EMAILS.includes(normalizedEmail)) {
    return true
  }

  return false
}
