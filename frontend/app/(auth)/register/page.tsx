'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { registerFormSchema, type RegisterFormInput } from '@/lib/validation/auth-forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formFieldErrorClass } from '@/lib/utils'
import { useStore } from '@/lib/store'

export default function RegisterPage() {
  const router = useRouter()
  const signUp = useStore((s) => s.signUp)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authInfo, setAuthInfo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({ resolver: zodResolver(registerFormSchema) })

  const onSubmit = async (data: RegisterFormInput) => {
    setAuthError(null)
    setAuthInfo(null)
    const result = await signUp(
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.password
    )
    if (result.error) {
      setAuthError(result.error.message)
      return
    }
    if (result.needsEmailConfirmation) {
      setAuthInfo('Подтвердите email по ссылке из письма, затем войдите в аккаунт.')
      return
    }
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Создать аккаунт</h2>
      <p className="text-[var(--muted-foreground)] mb-8">Начни отслеживать привычки уже сегодня</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {authError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {authError}
          </p>
        )}
        {authInfo && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
            {authInfo}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input
            id="name"
            placeholder="Алексей"
            aria-invalid={!!errors.name}
            className={formFieldErrorClass(!!errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-[var(--destructive)]">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className={formFieldErrorClass(!!errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="Минимум 6 символов"
            aria-invalid={!!errors.password}
            className={formFieldErrorClass(!!errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
        </Button>
      </form>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
        Регистрируясь, вы принимаете{' '}
        <a href="#" className="text-[var(--primary)] hover:underline">условия использования</a>
      </p>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs text-[var(--muted-foreground)]">
          <span className="bg-[var(--background)] px-2">или</span>
        </div>
      </div>

      <Button variant="outline" className="w-full" type="button">
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Войти через Google
      </Button>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}
