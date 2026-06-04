/**
 * Доменные ошибки бота. Все наследуют BotError → стабильный `code` для логов/метрик.
 * Throw-ить в presentation-слое нельзя — там используются обычные user-facing reply'ы.
 */

export type BotErrorCode =
  | 'unauthenticated'
  | 'account_not_linked'
  | 'invalid_link_token'
  | 'link_token_expired'
  | 'link_token_used'
  | 'chat_already_linked'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'rate_limited'
  | 'tg_blocked_by_user'
  | 'tg_api_error'
  | 'quiet_hours'
  | 'internal'

export class BotError extends Error {
  readonly code: BotErrorCode
  readonly status: number
  override readonly cause: unknown

  constructor(code: BotErrorCode, message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message)
    this.name = 'BotError'
    this.code = code
    this.status = options.status ?? defaultStatus(code)
    this.cause = options.cause
  }
}

export function isBotError(value: unknown): value is BotError {
  return value instanceof BotError
}

function defaultStatus(code: BotErrorCode): number {
  switch (code) {
    case 'unauthenticated':
    case 'account_not_linked':
      return 401
    case 'forbidden':
      return 403
    case 'not_found':
      return 404
    case 'validation':
    case 'invalid_link_token':
    case 'link_token_expired':
    case 'link_token_used':
    case 'chat_already_linked':
      return 400
    case 'rate_limited':
      return 429
    case 'quiet_hours':
    case 'tg_blocked_by_user':
      return 200
    case 'tg_api_error':
    case 'internal':
    default:
      return 500
  }
}
