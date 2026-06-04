/** Минимальный fetch-хелпер для client components (JSON API). */
export async function apiJson<T>(
  url: string,
  init: RequestInit,
  parser?: (raw: unknown) => T,
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })
  const raw: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof raw === 'object' && raw && 'message' in raw && typeof raw.message === 'string'
        ? raw.message
        : `HTTP ${res.status}`
    throw new Error(message)
  }
  return parser ? parser(raw) : (raw as T)
}
