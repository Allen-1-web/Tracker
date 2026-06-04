'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Copy, ExternalLink, Loader2, Send, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { finalizeClientApiError } from '@/lib/auth/apply-api-error'
import {
  linkResponseSchema,
  telegramStatusSchema,
  type LinkResponse,
  type TelegramStatus,
} from '@/lib/validation/telegram'

type FetchState = 'idle' | 'loading' | 'error'

async function api<T>(
  url: string,
  init: RequestInit,
  parser: (raw: unknown) => T,
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })
  const raw = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof raw === 'object' && raw && 'message' in raw && typeof raw.message === 'string'
        ? raw.message
        : `HTTP ${res.status}`
    throw new Error(message)
  }
  return parser(raw)
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function TelegramConnect(): React.JSX.Element {
  const [statusState, setStatusState] = useState<FetchState>('loading')
  const [status, setStatus] = useState<TelegramStatus | null>(null)

  const [link, setLink] = useState<LinkResponse | null>(null)
  const [linkState, setLinkState] = useState<FetchState>('idle')
  const [now, setNow] = useState(() => Date.now())

  const [unlinkState, setUnlinkState] = useState<FetchState>('idle')
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const expiresAtMs = useMemo(
    () => (link ? Date.parse(link.expiresAt) : null),
    [link],
  )
  const remainingMs = expiresAtMs != null ? expiresAtMs - now : null
  const linkExpired = remainingMs != null && remainingMs <= 0

  const showError = useCallback((err: unknown) => {
    const api = finalizeClientApiError(err)
    setErrorMessage(api.message)
  }, [])

  const refreshStatus = useCallback(async () => {
    setStatusState('loading')
    try {
      const data = await api<TelegramStatus>(
        '/api/telegram/status',
        { method: 'GET' },
        (raw) => telegramStatusSchema.parse(raw),
      )
      setStatus(data)
      setStatusState('idle')
      setErrorMessage(null)
    } catch (err) {
      setStatusState('error')
      showError(err)
    }
  }, [showError])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    if (!link || linkExpired) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [link, linkExpired])

  const handleGenerateLink = async () => {
    setLinkState('loading')
    setLink(null)
    setCopied(false)
    setErrorMessage(null)
    try {
      const data = await api<LinkResponse>(
        '/api/telegram/link',
        { method: 'POST' },
        (raw) => linkResponseSchema.parse(raw),
      )
      setLink(data)
      setNow(Date.now())
      setLinkState('idle')
    } catch (err) {
      setLinkState('error')
      showError(err)
    }
  }

  const handleUnlink = async () => {
    setUnlinkState('loading')
    setErrorMessage(null)
    try {
      await api<{ removed: boolean }>(
        '/api/telegram/unlink',
        { method: 'DELETE' },
        (raw) => raw as { removed: boolean },
      )
      setLink(null)
      await refreshStatus()
      setUnlinkState('idle')
    } catch (err) {
      setUnlinkState('error')
      showError(err)
    }
  }

  const handleCopy = async () => {
    if (!link?.deepLink) return
    try {
      await navigator.clipboard.writeText(link.deepLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // если clipboard недоступен — ничего страшного, пользователь скопирует руками
    }
  }

  // poll status пока висит свежий токен — чтобы поймать момент link
  useEffect(() => {
    if (!link || linkExpired || status?.connected) return
    const id = window.setInterval(() => {
      void refreshStatus()
    }, 3000)
    return () => window.clearInterval(id)
  }, [link, linkExpired, status?.connected, refreshStatus])

  const errorBanner = errorMessage ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--destructive)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{errorMessage}</span>
    </div>
  ) : null

  if (statusState === 'loading' && !status) {
    return (
      <div className="space-y-3">
        {errorBanner}
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка статуса…
        </div>
      </div>
    )
  }

  if (status?.connected) {
    return (
      <div className="space-y-3">
        {errorBanner}
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/40 dark:bg-green-950/40">
          <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            ✅
          </span>
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Telegram подключён
            </p>
            {status.username && (
              <p className="text-xs text-green-700 dark:text-green-300">
                @{status.username}
                {status.timezone ? ` · ${status.timezone}` : ''}
              </p>
            )}
            {status.linkedAt && (
              <p className="text-[11px] text-green-700/80 dark:text-green-300/80">
                связан {new Date(status.linkedAt).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
        </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleUnlink()}
            disabled={unlinkState === 'loading'}
          >
            {unlinkState === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="h-4 w-4" />
            )}
            Отвязать
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errorBanner}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-4 text-sm">
        <p className="mb-2 font-medium">Как подключить:</p>
        <ol className="ml-4 list-decimal space-y-1 text-[var(--muted-foreground)]">
          <li>Нажмите «Сгенерировать ссылку».</li>
          <li>Откройте полученную ссылку — она запустит чат с ботом.</li>
          <li>В Telegram нажмите <strong>«Запустить»</strong> / <strong>Start</strong>.</li>
          <li>Бот подтвердит связку — этот раздел автоматически обновится.</li>
        </ol>
      </div>

      {!link || linkExpired ? (
        <Button
          onClick={() => void handleGenerateLink()}
          disabled={linkState === 'loading'}
          className="w-full sm:w-auto"
        >
          {linkState === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {linkExpired ? 'Сгенерировать новую ссылку' : 'Сгенерировать ссылку'}
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-[var(--border)] p-3">
          <div className="flex items-center justify-between gap-2">
            <code className="flex-1 truncate rounded bg-[var(--muted)] px-2 py-1 text-xs">
              {link.deepLink}
            </code>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => void handleCopy()}
              aria-label="Скопировать ссылку"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" type="button" asChild>
              <a
                href={link.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Открыть Telegram"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть
              </a>
            </Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Ссылка действует {remainingMs != null && remainingMs > 0
              ? `ещё ${formatRemaining(remainingMs)}`
              : 'истекла — нажмите кнопку выше для новой'}
            . Используется один раз.
          </p>
        </div>
      )}
    </div>
  )
}
