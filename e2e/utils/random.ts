/** Email без `+` и `_` — Supabase Auth часто отклоняет `example.com` и нестандартный local-part. */
export function uniqueEmail(prefix = 'e2e'): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}.${ts}.${rand}@mailinator.com`
}

export function uniqueName(prefix = 'E2E'): string {
  const rand = Math.random().toString(16).slice(2, 6)
  return `${prefix} ${rand}`
}

