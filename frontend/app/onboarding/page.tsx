'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { findCategoryByName } from '@/lib/categories'
import { useStore } from '@/lib/store'
import { formFieldErrorClass } from '@/lib/utils'
import { onboardingGoalStepSchema, onboardingHabitStepSchema } from '@/lib/validation/goals'

const STEP_LABELS = ['Привычка', 'Цель', 'Telegram']

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i < current
                ? 'bg-green-500 text-white'
                : i === current
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-xs ${i === current ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
            {STEP_LABELS[i]}
          </span>
          {i < total - 1 && <div className={`h-0.5 w-8 ${i < current ? 'bg-green-500' : 'bg-[var(--border)]'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { addHabit, addGoal, categories, authReady, session, dataStatus } = useStore()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!authReady) return
    if (!session) router.replace('/login')
  }, [authReady, session, router])

  // Habit form state
  const [habitName, setHabitName] = useState('')
  const [habitIcon, setHabitIcon] = useState('🏋️')
  const [habitCategoryId, setHabitCategoryId] = useState('')

  // Goal form state
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalUnit, setGoalUnit] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')

  const [habitFieldErrors, setHabitFieldErrors] = useState<Record<string, string>>({})
  const [goalFieldErrors, setGoalFieldErrors] = useState<Record<string, string>>({})

  const handleAddHabit = async () => {
    setHabitFieldErrors({})
    const parsed = onboardingHabitStepSchema.safeParse({
      name: habitName.trim(),
      categoryId: habitCategoryId,
      icon: habitIcon,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]
        if (typeof k === 'string' && !next[k]) next[k] = issue.message
      }
      setHabitFieldErrors(next)
      return
    }
    const habitCat = categories.find((c) => c.id === habitCategoryId)
    const ok = await addHabit({
      name: habitName.trim(),
      icon: habitIcon,
      color: '#6366f1',
      categoryId: habitCategoryId,
      category: habitCat?.name ?? '',
      frequency: 'daily',
      isArchived: false,
    })
    if (ok) setStep(1)
  }

  const handleAddGoal = async () => {
    setGoalFieldErrors({})
    const parsed = onboardingGoalStepSchema.safeParse({
      name: goalName.trim(),
      target: goalTarget,
      deadline: goalDeadline,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]
        if (typeof k === 'string' && !next[k]) next[k] = issue.message
      }
      setGoalFieldErrors(next)
      return
    }
    const n = Number(goalTarget.replace(',', '.'))
    const goalCat =
      findCategoryByName(categories, 'Продуктивность') ?? categories[0]
    if (!goalCat) {
      setGoalFieldErrors({ deadline: 'Сначала нужны категории — обновите страницу' })
      return
    }
    await addGoal({
      name: goalName.trim(),
      type: 'numeric',
      targetValue: n,
      currentValue: 0,
      unit: goalUnit,
      categoryId: goalCat.id,
      category: goalCat.name,
      deadline: new Date(goalDeadline),
      linkedHabitIds: [],
    })
    setStep(2)
  }

  const handleFinish = () => {
    router.push('/dashboard')
  }

  const ICONS = ['🏋️', '📖', '💧', '🧘', '🏃', '🎸', '✍️', '🌿', '💊', '🚶']

  if (!authReady || !session || dataStatus !== 'ready') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <p className="text-[var(--muted-foreground)]">Загрузка...</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4"
      data-testid="onboarding-root"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">Tracker</span>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={3} />

        {/* Step content */}
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">

          {/* Step 1: Add habit */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Добавь первую привычку</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Начни с одной простой привычки — это уже большой шаг!
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input
                  data-testid="onboarding-habit-name"
                  placeholder="Например: Утренняя зарядка"
                  value={habitName}
                  onChange={(e) => {
                    setHabitName(e.target.value)
                    setHabitFieldErrors((p) => {
                      const { name: _, ...rest } = p
                      return rest
                    })
                  }}
                  aria-invalid={!!habitFieldErrors.name}
                  className={formFieldErrorClass(!!habitFieldErrors.name)}
                />
                {habitFieldErrors.name && (
                  <p className="text-xs text-[var(--destructive)]">{habitFieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Иконка</Label>
                <div
                  className={
                    habitFieldErrors.icon
                      ? `rounded-lg p-0.5 ${formFieldErrorClass(true)}`
                      : 'rounded-lg p-0.5'
                  }
                >
                  <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        setHabitIcon(icon)
                        setHabitFieldErrors((p) => {
                          const { icon: _, ...rest } = p
                          return rest
                        })
                      }}
                      className={`text-xl p-2 rounded-lg border-2 transition-colors ${
                        habitIcon === icon ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                </div>
                {habitFieldErrors.icon && (
                  <p className="text-xs text-[var(--destructive)]">{habitFieldErrors.icon}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Категория</Label>
                <Select
                  value={habitCategoryId}
                  onValueChange={(v) => {
                    setHabitCategoryId(v)
                    setHabitFieldErrors((p) => {
                      const { categoryId: _, ...rest } = p
                      return rest
                    })
                  }}
                >
                  <SelectTrigger
                    aria-invalid={!!habitFieldErrors.categoryId}
                    className={formFieldErrorClass(!!habitFieldErrors.categoryId)}
                    data-testid="onboarding-habit-category-trigger"
                  >
                    <SelectValue placeholder="Выберите..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {habitFieldErrors.categoryId && (
                  <p className="text-xs text-[var(--destructive)]">{habitFieldErrors.categoryId}</p>
                )}
              </div>

              <Button type="button" onClick={handleAddHabit} className="w-full" data-testid="onboarding-habit-next">
                Добавить и продолжить <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          )}

          {/* Step 2: Add goal */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Поставь первую цель</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Цели помогают видеть финиш. Можно пропустить.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Цель</Label>
                <Input
                  placeholder="Например: Прочитать 20 книг"
                  value={goalName}
                  onChange={(e) => {
                    setGoalName(e.target.value)
                    setGoalFieldErrors((p) => {
                      const { name: _, ...rest } = p
                      return rest
                    })
                  }}
                  aria-invalid={!!goalFieldErrors.name}
                  className={formFieldErrorClass(!!goalFieldErrors.name)}
                />
                {goalFieldErrors.name && (
                  <p className="text-xs text-[var(--destructive)]">{goalFieldErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Целевое значение</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="20"
                    value={goalTarget}
                    onChange={(e) => {
                      setGoalTarget(e.target.value)
                      setGoalFieldErrors((p) => {
                        const { target: _, ...rest } = p
                        return rest
                      })
                    }}
                    aria-invalid={!!goalFieldErrors.target}
                    className={formFieldErrorClass(!!goalFieldErrors.target)}
                  />
                  {goalFieldErrors.target && (
                    <p className="text-xs text-[var(--destructive)]">{goalFieldErrors.target}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Единица</Label>
                  <Input placeholder="книг" value={goalUnit} onChange={(e) => setGoalUnit(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Дедлайн</Label>
                <Input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => {
                    setGoalDeadline(e.target.value)
                    setGoalFieldErrors((p) => {
                      const { deadline: _, ...rest } = p
                      return rest
                    })
                  }}
                  aria-invalid={!!goalFieldErrors.deadline}
                  className={formFieldErrorClass(!!goalFieldErrors.deadline)}
                />
                {goalFieldErrors.deadline && (
                  <p className="text-xs text-[var(--destructive)]">{goalFieldErrors.deadline}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                  data-testid="onboarding-goal-skip"
                >
                  Пропустить
                </Button>
                <Button type="button" onClick={handleAddGoal} className="flex-1">
                  Добавить <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Telegram */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Подключи Telegram</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Получай напоминания о привычках прямо в мессенджер.
                </p>
              </div>

              <div className="rounded-xl bg-[var(--muted)]/60 p-4 space-y-3">
                <p className="text-sm font-semibold">Инструкция:</p>
                <ol className="text-sm text-[var(--muted-foreground)] space-y-2 list-decimal ml-4">
                  <li>Откройте Telegram</li>
                  <li>Найдите бота <strong className="text-[var(--foreground)]">@{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot'}</strong></li>
                  <li>Нажмите <strong className="text-[var(--foreground)]">Start</strong></li>
                  <li>Введите команду <code className="bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 rounded text-xs">/connect</code></li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleFinish} className="flex-1">
                  Пропустить
                </Button>
                <Button onClick={handleFinish} className="flex-1" data-testid="onboarding-telegram-finish">
                  Готово! 🎉
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
