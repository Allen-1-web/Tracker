// =============================================================
//  Dashboard.jsx — главная страница после входа.
//  Показывает: приветствие, прогресс за сегодня, список
//  привычек-чекбоксов, полосу активности за 7 дней и
//  карточки активных целей.
// =============================================================
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  habits as initHabits,
  weeklyActivity,
  goals,
  user,
  todayQuote,
  getPct,
  getDaysLeft,
  ymd,
} from '../mock'
import { useNutrition } from '../NutritionContext'

// ── Переиспользуемые мелкие компоненты ──────────────────────

// Карточка-метрика (число + подпись)
function MetricCard({ value, label, icon, accent = 'indigo' }) {
  const bg = { indigo: 'bg-indigo-50', green: 'bg-green-50', orange: 'bg-orange-50' }
  const text = { indigo: 'text-indigo-600', green: 'text-green-600', orange: 'text-orange-500' }
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${bg[accent]}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${text[accent]}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// Прогресс-бар
function ProgressBar({ pct, color = '#6366f1', height = 'h-2' }) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── Полоса активности за 7 дней ─────────────────────────────
function WeeklyStrip() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Активность за 7 дней</h3>
      <div className="flex items-end gap-1.5">
        {weeklyActivity.map((d, i) => {
          const pct = d.total === 0 ? 0 : d.completed / d.total
          const isToday = i === weeklyActivity.length - 1
          // Цвет ячейки зависит от % выполнения
          const color = pct >= 0.8 ? '#22c55e' : pct >= 0.5 ? '#6366f1' : '#e2e8f0'
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              {/* Высота бара пропорциональна % */}
              <div className="w-full relative" style={{ height: 40 }}>
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-md transition-all ${
                    isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                  }`}
                  style={{ height: `${Math.max(pct * 100, 10)}%`, backgroundColor: color }}
                />
              </div>
              <span className={`text-xs ${isToday ? 'font-bold text-indigo-600' : 'text-slate-400'}`}>
                {d.day}
              </span>
              <span className="text-xs text-slate-400">{d.completed}/{d.total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Главный компонент дашборда ───────────────────────────────
export default function Dashboard() {
  const { entries, goals: nutritionGoalsState } = useNutrition()
  const [habitList, setHabitList] = useState(initHabits)

  const todayStr = ymd(new Date())
  const todayCalories = entries.filter((e) => e.date === todayStr).reduce((sum, e) => sum + e.calories, 0)

  // Привычки на сегодня (ежедневные + по дню недели)
  const todayDow = new Date().getDay()
  const todayHabits = habitList.filter(h => {
    if (h.archived) return false
    if (h.frequency === 'daily') return true
    return Array.isArray(h.frequency) && h.frequency.includes(todayDow)
  })

  const completed = todayHabits.filter(h => h.completedToday).length
  const total      = todayHabits.length
  const pctToday   = total === 0 ? 0 : Math.round((completed / total) * 100)

  // Переключить статус "выполнено сегодня"
  const toggleHabit = (id) =>
    setHabitList(prev =>
      prev.map(h => h.id === id ? { ...h, completedToday: !h.completedToday } : h)
    )

  const activeGoals = goals.filter(g => getPct(g.currentValue, g.targetValue) < 100)

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Приветствие + цитата ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Привет, {user.name}! 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1 italic">«{todayQuote()}»</p>
        </div>
        <Link
          to="/habits"
          className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Привычка
        </Link>
      </div>

      {/* ── Три метрики ── */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard value={`${completed}/${total}`} label="Привычек сегодня"  icon="✅" accent="indigo" />
        <MetricCard value={`${user.globalStreak} дн.`} label="Серия подряд"  icon="🔥" accent="orange" />
        <MetricCard value={`${pctToday}%`}          label="Выполнено сегодня" icon="📈" accent="green"  />
      </div>

      <Link to="/nutrition" className="block rounded-xl border border-slate-100 bg-white shadow-sm p-5 transition-colors hover:bg-emerald-50/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              🥗
            </div>
            <div>
              <p className="font-semibold text-slate-800">Питание и КБЖУ</p>
              <p className="text-sm text-slate-500">
                Сегодня: {todayCalories} / {nutritionGoalsState.calories} ккал · открыть дневник
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-indigo-600 shrink-0">Перейти →</span>
        </div>
      </Link>

      {/* ── Сетка: чеклист + активность ── */}
      <div className="grid grid-cols-5 gap-6">

        {/* Чеклист привычек на сегодня */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Сегодня</h3>
            <span className="text-xs text-slate-400">{completed}/{total} выполнено</span>
          </div>

          {/* Общий прогресс-бар */}
          <ProgressBar pct={pctToday} height="h-1.5" />
          <div className="mt-4 space-y-2">
            {todayHabits.map(h => (
              <div
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  h.completedToday
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                {/* Иконка привычки */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: h.color + '20' }}
                >
                  {h.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${h.completedToday ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {h.name}
                  </p>
                  <p className="text-xs text-slate-400">{h.category}</p>
                </div>

                {/* Чекбокс */}
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  h.completedToday
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-slate-300'
                }`}>
                  {h.completedToday && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Полоса активности */}
        <div className="col-span-2">
          <WeeklyStrip />
        </div>
      </div>

      {/* ── Активные цели ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Активные цели</h3>
          <Link to="/goals" className="text-xs text-indigo-600 hover:underline">Все цели →</Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1">
          {activeGoals.map(g => {
            const pct      = getPct(g.currentValue, g.targetValue)
            const daysLeft = getDaysLeft(g.deadline)
            return (
              <Link
                key={g.id}
                to={`/goals/${g.id}`}
                className="min-w-[200px] rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-semibold text-slate-700 mb-1 truncate">{g.name}</p>
                <p className="text-xs text-slate-400 mb-3">{g.category}</p>
                <ProgressBar pct={pct} color={pct >= 80 ? '#22c55e' : '#6366f1'} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-indigo-600">{pct}%</span>
                  <span className={`text-xs ${daysLeft < 30 ? 'text-orange-500' : 'text-slate-400'}`}>
                    {daysLeft > 0 ? `${daysLeft} дн.` : 'Просрочена'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}
