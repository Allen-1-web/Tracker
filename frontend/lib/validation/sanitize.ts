const DANGEROUS_PATTERNS = [
  /<script\b/i,
  /<\/script>/i,
  /<iframe\b/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
]

/** Удаляет HTML-теги и опасные фрагменты из пользовательского ввода. */
export function sanitizeText(input: string): string {
  let s = input.replace(/<[^>]*>/g, '')
  for (const pattern of DANGEROUS_PATTERNS) {
    s = s.replace(pattern, '')
  }
  return s.replace(/\s+/g, ' ').trim()
}

export function containsDangerousMarkup(input: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(input))
}
