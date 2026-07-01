import { GrammyError, HttpError } from 'grammy'
import type { ErrorHandler } from 'grammy'
import { BotError, isBotError } from '../../domain/errors.js'
import { captureException } from '../../instrumentation/sentry.js'
import type { AppContext } from '../context.js'

/**
 * Глобальный error handler. Подключается через bot.catch().
 *
 * - BotError → user-facing ответ (текст уже подготовлен в .message)
 * - GrammyError / HttpError → пишем в лог, отвечаем нейтральным сообщением
 * - Прочее → 'Что-то пошло не так'
 */
export function makeErrorHandler(): ErrorHandler<AppContext> {
  return async (errCtx) => {
    const { ctx, error } = errCtx
    const log = ctx.log ?? console
    const meta = {
      update_id: ctx.update.update_id,
      chat_id: ctx.chat?.id,
      from_id: ctx.from?.id,
    }

    if (isBotError(error)) {
      log.warn?.({ ...meta, code: error.code }, `bot-error: ${error.code}`)
      await safeReply(ctx, friendly(error))
      return
    }
    if (error instanceof GrammyError) {
      log.error?.({ ...meta, err: error }, 'telegram-api-error')
      captureException(error, meta)
      // если бот не может писать (заблокирован) — молча
      if (error.error_code === 403) return
      await safeReply(ctx, 'Telegram API недоступен. Попробуйте ещё раз.')
      return
    }
    if (error instanceof HttpError) {
      log.error?.({ ...meta, err: error }, 'telegram-network-error')
      captureException(error, meta)
      return
    }
    log.error?.({ ...meta, err: error }, 'unhandled-error')
    captureException(error, meta)
    await safeReply(ctx, 'Что-то пошло не так. Попробуйте позже.')
  }
}

function friendly(err: BotError): string {
  switch (err.code) {
    case 'account_not_linked':
      return (
        '🔌 Аккаунт не подключён.\n\n' +
        'Откройте веб-приложение → «Настройки» → «Telegram-бот» → ' +
        '«Сгенерировать ссылку» и перейдите по ней.'
      )
    case 'invalid_link_token':
      return '🚫 Неверная ссылка. Сгенерируйте новую в «Настройках».'
    case 'link_token_expired':
      return '⏳ Ссылка истекла. Сгенерируйте новую в «Настройках».'
    case 'link_token_used':
      return '🔁 Эта ссылка уже использована. Сгенерируйте новую в «Настройках».'
    case 'chat_already_linked':
      return err.message
    case 'not_found':
      return err.message || 'Не найдено.'
    case 'rate_limited':
      return '⏱ Слишком много запросов. Попробуйте через минуту.'
    default:
      if (err.message.includes('habit_logs.log_date')) {
        return (
          '⚠️ База данных устарела: нет колонки habit_logs.log_date.\n\n' +
          'Supabase → SQL Editor → выполните файл backend/supabase/migrations/20260524c_habit_logs_log_date.sql'
        )
      }
      return err.message || 'Что-то пошло не так.'
  }
}

async function safeReply(ctx: AppContext, text: string): Promise<void> {
  try {
    await ctx.reply(text)
  } catch {
    // если не получилось ответить — не валим процесс
  }
}
