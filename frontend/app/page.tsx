import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Tracker</h1>
      <p className="text-[var(--muted-foreground)] text-center max-w-md">
        Помогает держать ежедневные привычки
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="text-[var(--primary)] underline">
          Войти
        </Link>
        <Link href="/register" className="text-[var(--primary)] underline">
          Регистрация
        </Link>
      </div>
    </main>
  )
}
