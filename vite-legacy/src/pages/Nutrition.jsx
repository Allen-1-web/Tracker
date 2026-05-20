// =============================================================
//  Nutrition.jsx — КБЖУ, дневник питания, рекомендации по рациону
// =============================================================
import React, { useMemo, useState } from 'react'
import { useNutrition } from '../NutritionContext'
import { ymd } from '../mock'

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_LABELS = {
  breakfast: '🌅 Завтрак',
  lunch: '☀️ Обед',
  dinner: '🌙 Ужин',
  snack: '🍎 Перекус',
}

const MEAL_SHORT = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
}

function ProgressBarThin({ pct, color, bg = 'bg-slate-100' }) {
  return (
    <div className={`w-full h-2.5 ${bg} rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function MacroRow({ label, cur, goal, unit, color, barBg }) {
  const pct = goal === 0 ? 0 : Math.min((cur / goal) * 100, 100)
  const over = cur > goal
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className={over ? 'text-red-500 font-semibold' : 'text-slate-500'}>
          {cur} / {goal} {unit}
        </span>
      </div>
      <ProgressBarThin pct={pct} color={over ? '#ef4444' : color} bg={barBg} />
      <p className="text-xs text-slate-400">
        {over ? `Превышено на ${(cur - goal).toFixed(1)} ${unit}` : `Осталось ${(goal - cur).toFixed(1)} ${unit}`}
      </p>
    </div>
  )
}

export default function Nutrition() {
  const { entries, goals, foodDatabase, addMealEntry, deleteMealEntry, updateNutritionGoals } =
    useNutrition()

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [amount, setAmount] = useState('100')
  const [mealType, setMealType] = useState('lunch')
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [goalForm, setGoalForm] = useState(goals)

  const dateStr = ymd(currentDate)
  const todayStr = ymd(new Date())

  const dayEntries = useMemo(() => entries.filter((e) => e.date === dateStr), [entries, dateStr])

  const totals = useMemo(
    () =>
      dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          carbs: acc.carbs + e.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      ),
    [dayEntries]
  )

  const calPct = goals.calories === 0 ? 0 : Math.round((totals.calories / goals.calories) * 100)

  const weekData = useMemo(() => {
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const ds = ymd(d)
      const label = d.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '')
      const calories = entries.filter((e) => e.date === ds).reduce((s, e) => s + e.calories, 0)
      out.push({ label: label.charAt(0).toUpperCase() + label.slice(1), calories, ds })
    }
    const maxC = Math.max(...out.map((o) => o.calories), goals.calories, 1)
    return out.map((o) => ({ ...o, pct: Math.round((o.calories / maxC) * 100) }))
  }, [entries, goals.calories])

  const filteredFoods = query.trim()
    ? foodDatabase.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const selected = foodDatabase.find((f) => f.id === selectedFoodId)

  let preview = null
  if (selected) {
    const g = parseFloat(amount, 10) || 0
    const k = g / 100
    preview = {
      calories: Math.round(selected.calories * k),
      protein: Math.round(selected.protein * k * 10) / 10,
      fat: Math.round(selected.fat * k * 10) / 10,
      carbs: Math.round(selected.carbs * k * 10) / 10,
    }
  }

  function handleAddFood() {
    if (!selected) return
    const g = parseFloat(amount, 10)
    if (!(g > 0)) return
    addMealEntry({ foodId: selected.id, date: dateStr, mealType, amount: g })
    setSelectedFoodId('')
    setQuery('')
    setAmount('100')
  }

  const recs = []
  const calRat = goals.calories ? totals.calories / goals.calories : 1
  if (calRat > 1.1)
    recs.push({ tone: 'red', icon: '⚠️', text: `Превышена норма калорий. Попробуйте меньше перекусов.` })
  else if (calRat >= 0.9 && dayEntries.length) recs.push({ tone: 'green', icon: '✅', text: 'Хорошо держите норму калорий!' })
  else if (calRat < 0.5 && dayEntries.length)
    recs.push({ tone: 'amber', icon: '🍽️', text: 'Съедено меньше половины нормы — не забывайте о полноценном питании.' })

  const pRat = goals.protein ? totals.protein / goals.protein : 1
  if (pRat < 0.6 && dayEntries.length)
    recs.push({ tone: 'blue', icon: '🥩', text: `Мало белка (${totals.protein.toFixed(0)}г из ${goals.protein}). Добавьте яйца, рыбу или творог.` })
  else if (pRat >= 1 && dayEntries.length) recs.push({ tone: 'green', icon: '💪', text: 'Цель по белку достигнута.' })

  if (!dayEntries.length && dateStr === todayStr)
    recs.push({
      tone: 'blue',
      icon: '📝',
      text: 'Добавьте первый приём — появится персональный разбор КБЖУ.',
    })

  const toneCls = {
    red: 'bg-red-50 border-red-100 text-red-900',
    green: 'bg-green-50 border-green-100 text-green-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Дата */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const d = new Date(currentDate)
              d.setDate(d.getDate() - 1)
              setCurrentDate(d)
            }}
            className="p-2 rounded-lg hover:bg-white border border-slate-100"
          >
            ‹
          </button>
          <span className="font-semibold text-slate-800 min-w-[10rem] text-center capitalize">
            {dateStr === todayStr
              ? 'Сегодня'
              : currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </span>
          <button
            type="button"
            disabled={dateStr >= todayStr}
            onClick={() => {
              const d = new Date(currentDate)
              d.setDate(d.getDate() + 1)
              setCurrentDate(d)
            }}
            className="p-2 rounded-lg hover:bg-white border border-slate-100 disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setGoalForm({ ...goals })
            setGoalsOpen(true)
          }}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        >
          Мои цели КБЖУ
        </button>
      </div>

      {/* Сводка */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={calPct > 100 ? '#ef4444' : '#6366f1'}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(calPct, 100) / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold">{totals.calories}</span>
            <span className="text-[10px] text-slate-400">ккал</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold text-slate-800 mb-1">Калории</p>
          <p className="text-sm text-slate-500">
            Цель {goals.calories} ккал · белки {totals.protein.toFixed(0)} г, жиры {totals.fat.toFixed(0)}
            г, углеводы {totals.carbs.toFixed(0)} г
          </p>
        </div>
      </div>

      {/* Макросы */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-5">
        <MacroRow label="Белки" cur={Math.round(totals.protein * 10) / 10} goal={goals.protein} unit="г" color="#ef4444" barBg="bg-red-50" />
        <MacroRow label="Жиры" cur={Math.round(totals.fat * 10) / 10} goal={goals.fat} unit="г" color="#eab308" barBg="bg-yellow-50" />
        <MacroRow label="Углеводы" cur={Math.round(totals.carbs * 10) / 10} goal={goals.carbs} unit="г" color="#2563eb" barBg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Добавить еду</h3>
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-3"
            placeholder="Поиск: курица, рис…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedFoodId('')
            }}
          />
          {filteredFoods.length > 0 && !selectedFoodId ? (
            <div className="border border-slate-200 rounded-lg max-h-52 overflow-auto mb-3">
              {filteredFoods.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFoodId(f.id)
                    setQuery(f.name)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${i ? 'border-t border-slate-100' : ''}`}
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="text-slate-400 text-xs ml-2">{f.calories} ккал / 100г</span>
                </button>
              ))}
            </div>
          ) : null}

          {selectedFoodId && selected ? (
            <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <p className="text-sm font-medium">{selected.name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Граммы</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full mt-0.5 px-2 py-1.5 rounded border border-slate-200 text-sm"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Приём пищи</label>
                  <div className="grid grid-cols-2 gap-1">
                    {MEAL_ORDER.map((mt) => (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => setMealType(mt)}
                        className={`text-xs py-1.5 rounded border ${
                          mealType === mt ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {MEAL_SHORT[mt]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {preview ? (
                <div className="grid grid-cols-4 gap-1 text-center text-xs bg-white rounded p-2 border border-slate-100">
                  <div><p className="text-slate-400">Ккал</p><p className="font-semibold">{preview.calories}</p></div>
                  <div><p className="text-slate-400">Б</p><p className="font-semibold">{preview.protein}</p></div>
                  <div><p className="text-slate-400">Ж</p><p className="font-semibold">{preview.fat}</p></div>
                  <div><p className="text-slate-400">У</p><p className="font-semibold">{preview.carbs}</p></div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleAddFood}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                + В дневник
              </button>
              <button
                type="button"
                className="w-full text-xs text-slate-500"
                onClick={() => {
                  setSelectedFoodId('')
                  setQuery('')
                }}
              >
                Отменить
              </button>
            </div>
          ) : !query.trim() ? (
            <p className="text-center text-sm text-slate-400 py-8">Введите название продукта</p>
          ) : null}
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Дневник</h3>
            {!!dayEntries.length && (
              <span className="text-xs text-slate-400">{totals.calories} ккал суммарно</span>
            )}
          </div>
          {!dayEntries.length ? (
            <p className="text-center text-slate-400 text-sm py-8">Нет записей за этот день</p>
          ) : (
            <div className="space-y-5">
              {MEAL_ORDER.map((mt) => {
                const group = dayEntries.filter((e) => e.mealType === mt)
                if (!group.length) return null
                const subtotal = group.reduce((s, e) => s + e.calories, 0)
                return (
                  <div key={mt}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-800">{MEAL_LABELS[mt]}</span>
                      <span className="text-xs text-slate-400">{subtotal} ккал</span>
                    </div>
                    <div className="space-y-1">
                      {group.map((e) => {
                        const fd = foodDatabase.find((x) => x.id === e.foodId)
                        return (
                          <div
                            key={e.id}
                            className="flex justify-between gap-3 items-start rounded-lg px-3 py-2 bg-slate-50 group border border-transparent hover:border-slate-100"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{fd?.name ?? 'Продукт'}</p>
                              <p className="text-xs text-slate-400">
                                {e.amount} г · Б {e.protein} Ж {e.fat} У {e.carbs}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold">{e.calories}</span>
                              <button type="button" className="text-slate-300 hover:text-red-500 opacity-70 group-hover:opacity-100" onClick={() => deleteMealEntry(e.id)}>
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Неделя + советы */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Калории за 7 дней</h3>
          <div className="flex items-end gap-2 h-40 px-2">
            {weekData.map((day) => (
              <div key={day.ds} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-md relative flex-1 flex items-end min-h-[4rem]">
                  <div className="w-full bg-indigo-500 rounded-md transition-all opacity-85" style={{ height: `${day.pct}%`, minHeight: day.calories ? 4 : 0 }} />
                </div>
                <span className="text-[10px] text-slate-400">{day.label}</span>
                <span className="text-[10px] text-slate-500 font-medium">{day.calories}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-slate-400 mt-2">Штрих — относительно максимума недели · цели: {goals.calories} ккал</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Рекомендации</h3>
          <div className="space-y-2">
            {(recs.length ? recs : [{ tone: 'green', icon: '🎯', text: 'Балансируйте приёмы по БЖУ в течение дня.' }]).map((r, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2.5 text-sm flex gap-2 ${toneCls[r.tone]}`}>
                <span>{r.icon}</span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модалка целей */}
      {goalsOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={() => setGoalsOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Дневные цели</h2>
            <div className="space-y-3">
              {['calories', 'protein', 'fat', 'carbs'].map((key) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 capitalize">{fieldLabel(key)}</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-200"
                    value={goalForm[key]}
                    onChange={(e) =>
                      setGoalForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium" onClick={() => setGoalsOpen(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                onClick={() => {
                  updateNutritionGoals(goalForm)
                  setGoalsOpen(false)
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function fieldLabel(key) {
  switch (key) {
    case 'calories':
      return 'Калории (ккал)'
    case 'protein':
      return 'Белки (г)'
    case 'fat':
      return 'Жиры (г)'
    case 'carbs':
      return 'Углеводы (г)'
    default:
      return key
  }
}
