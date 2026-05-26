'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { loginFormSchema, type LoginFormInput } from '@/lib/validation/auth-forms'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formFieldErrorClass } from '@/lib/utils'
import { useStore } from '@/lib/store'

function isAuthRoute(path: string) {
  return (
    path === '/login' ||
    path === '/register' ||
    path.startsWith('/login/') ||
    path.startsWith('/register/')
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signIn = useStore((s) => s.signIn)
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({ resolver: zodResolver(loginFormSchema) })

  const onSubmit = async (data: LoginFormInput) => {
    setAuthError(null)
    const result = await signIn(data.email.trim().toLowerCase(), data.password)
    if (result.error) {
      setAuthError(result.error.message)
      return
    }
    const next = searchParams.get('next')
    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') && !isAuthRoute(next)
        ? next
        : '/dashboard'
    router.push(safeNext)
    router.refresh()
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-2">С возвращением!</h2>
      <p className="text-[var(--muted-foreground)] mb-8">Войдите в свой аккаунт</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {authError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {authError}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            data-testid="auth-login-email"
            aria-invalid={!!errors.email}
            className={formFieldErrorClass(!!errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <a href="#" className="text-xs text-[var(--primary)] hover:underline">
              Забыли пароль?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            data-testid="auth-login-password"
            aria-invalid={!!errors.password}
            className={formFieldErrorClass(!!errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="auth-login-submit">
          {isSubmitting ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-[var(--primary)] font-medium hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted-foreground)]">Загрузка...</p>}>
      <LoginForm />
    </Suspense>
  )
}
