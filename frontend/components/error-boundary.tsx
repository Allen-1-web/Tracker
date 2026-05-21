'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean; message: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Неизвестная ошибка' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="max-w-md space-y-2">
            <h1 className="text-lg font-semibold text-[var(--foreground)]">Страница не загрузилась</h1>
            <p className="text-sm text-[var(--muted-foreground)] break-words">
              {this.state.message?.trim()
                ? this.state.message
                : 'Произошла ошибка при отображении интерфейса.'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Перезагрузите вкладку или вернитесь назад и попробуйте снова.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: null })}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium hover:bg-[var(--accent)]"
          >
            Попробовать снова
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
