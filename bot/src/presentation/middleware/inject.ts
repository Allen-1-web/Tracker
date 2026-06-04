import type { Middleware } from 'grammy'
import type { Container } from '../../app/container.js'
import type { AppContext } from '../context.js'

/**
 * Кладёт DI-контейнер и логгер в каждое обновление.
 * Должен подключаться ПЕРВЫМ в цепочке middleware.
 */
export function injectContainer(container: Container): Middleware<AppContext> {
  return async (ctx, next) => {
    ctx.container = container
    ctx.log = container.log.child({
      chat_id: ctx.chat?.id,
      from_id: ctx.from?.id,
    })
    ctx.linkedUser = null
    await next()
  }
}
