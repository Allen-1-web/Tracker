import type { Context } from 'grammy'
import type { Container } from '../app/container.js'
import type { LinkedUser } from '../domain/user.js'
import type { AppLogger } from '../infrastructure/logger.js'

/**
 * Расширенный grammY-контекст: добавляем DI-контейнер, логгер и (если есть) текущую связку.
 * Заполняется в первой middleware (bot.use(...)).
 */
export interface AppContextFlavor {
  container: Container
  log: AppLogger
  /** Заполняется auth middleware на защищённых командах. */
  linkedUser: LinkedUser | null
}

export type AppContext = Context & AppContextFlavor
