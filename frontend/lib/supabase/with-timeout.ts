/** Таймаут для Supabase Auth / middleware — чтобы UI не зависал при недоступной БД. */
export const SUPABASE_AUTH_REQUEST_TIMEOUT_MS = 12_000

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}
