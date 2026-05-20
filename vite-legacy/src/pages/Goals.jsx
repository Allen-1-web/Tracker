// =============================================================
//  Goals.jsx — список целей + детальная страница.
//  URL /goals      → список с фильтрами и CRUD
//  URL /goals/:id  → детальный вид с прогрессом
// =============================================================
import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  goals as initGoals,
  goalProgressHistory,
  habits,
  getPct,
  getDaysLeft,
} from '../mock'

// ── Прогресс-бар ─────────────────────────────────────────────
function Bar({ pct, color = '#6366f1', h = 'h-2.5' }) {
  const barColor = pct >= 100 ? '#22c55e' : color
  return (
    <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${h} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
    </div>
  )
}

// ── Модальное окно добавления цели ──────────────────────────
function AddGoalModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Спорт',
    targetValue: '', unit: '', deadline: '',
  })
  const h = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Новая цель</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
            <input name="name" value={form.name} onChange={h}
              placeholder="Прочитать 20 книг"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
            <input name="description" value={form.description} onChange={h}
              placeholder="Необязательно"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Цель</label>
              <input name="targetValue" type="number" value={form.targetValue} onChange={h}
                placeholder="100"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Единица</label>
              <input name="unit" value={form.unit} onChange={h}
                placeholder="км, книг..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
              <select name="category" value={form.category} onChange={h}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {['Спорт','Здоровье','Образование','Продуктивность','Отдых'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дедлайн</label>
              <input name="deadline" type="date" value={form.deadline} onChange={h}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Отмена
          </button>
          <button
            onClick={() => {
              if (form.name.trim() && form.targetValue && form.deadline) {
                onAdd(form); onClose()
              }
            }}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Детальный вид цели ────────────────────────────────────────
function GoalDetail({ goal, onBack }) {
  const [currentValue, setCurrentValue] = useState(goal.currentValue)
  const [newProgress, setNewProgress]   = useState('')
  const [note, setNote]                 = useState('')
  // Локальная история (мок + новые записи)
  const [history, setHistory] = useState(goalProgressHistory[goal.id] ?? [])

  const pct      = getPct(currentValue, goal.targetValue)
  const daysLeft = getDaysLeft(goal.deadline)
  const isDone   = pct >= 100
  const isOverdue = daysLeft < 0

  // Связанные привычки
  const linked = habits.filter(h => goal.linkedHabitIds.includes(h.id))

  // Добавить запись прогресса
  const addProgress = () => {
    const val = Number(newProgress)
    if (!val) return
    setCurrentValue(val)
    setHistory(prev => [
      ...prev,
      { date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), value: val, note },
    ])
    setNewProgress(''); setNote('')
  }

  // Простой SVG-линейный график прогресса
  const points = history.map((e, i) => ({ x: i, y: e.value }))
  const maxY   = Math.max(...points.map(p => p.y), goal.targetValue, 1)
  const W = 400, H = 100, PAD = 10
  const toX = i  => PAD + (i  / Math.max(points.length - 1, 1)) * (W - 2 * PAD)
  const toY = v  => PAD + (1 - v / maxY) * (H - 2 * PAD)

  const svgPath = points.length > 1
    ? 'M ' + points.map(p => `${toX(p.x)},${toY(p.y)}`).join(' L ')
    : ''

  return (
    <div className="max-w-3xl space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">← Назад</button>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-2xl">🎯</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800">{goal.name}</h2>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
              {goal.category}
            </span>
            <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : isDone ? 'text-green-600' : 'text-slate-400'}`}>
              {isDone ? '✅ Выполнено!' : isOverdue ? `Просрочена на ${Math.abs(daysLeft)} дн.` : `${daysLeft} дней осталось`}
            </span>
          </div>
        </div>
      </div>

      {/* Большой прогресс */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-4xl font-bold text-slate-800">
              {currentValue}
              <span className="text-lg text-slate-400 ml-1">{goal.unit}</span>
            </p>
            <p className="text-sm text-slate-400">из {goal.targetValue} {goal.unit}</p>
          </div>
          <p className={`text-3xl font-bold ${isDone ? 'text-green-600' : 'text-indigo-600'}`}>{pct}%</p>
        </div>
        <Bar pct={pct} h="h-4" />
      </div>

      {/* Форма добавления прогресса */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Добавить прогресс</h3>
        <div className="flex gap-2">
          <input
            type="number" value={newProgress} onChange={e => setNewProgress(e.target.value)}
            placeholder={`Новое значение (${goal.unit})`}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Заметка"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={addProgress}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            + Добавить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* График прогресса */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Прогресс по времени</h3>
          {svgPath ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              {/* Линия цели */}
              <line x1={PAD} y1={toY(goal.targetValue)} x2={W - PAD} y2={toY(goal.targetValue)}
                stroke="#22c55e" strokeWidth="1" strokeDasharray="4,3" />
              <text x={W - PAD - 2} y={toY(goal.targetValue) - 3}
                fontSize="8" fill="#22c55e" textAnchor="end">Цель</text>
              {/* Линия прогресса */}
              <path d={svgPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Точки */}
              {points.map((p, i) => (
                <circle key={i} cx={toX(p.x)} cy={toY(p.y)} r="3" fill="#6366f1" />
              ))}
            </svg>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Нет данных о прогрессе</p>
          )}
        </div>

        {/* Связанные привычки */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Связанные привычки</h3>
          {linked.length === 0
            ? <p className="text-xs text-slate-400">Нет связанных привычек</p>
            : linked.map(h => (
              <Link key={h.id} to={`/habits/${h.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: h.color + '20' }}>{h.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{h.name}</p>
                  <p className="text-[10px] text-slate-400">🔥 {h.streak} дней</p>
                </div>
              </Link>
            ))
          }
        </div>
      </div>

      {/* Лента прогресса */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">История прогресса</h3>
        {history.length === 0
          ? <p className="text-sm text-slate-400 text-center py-4">Нет записей</p>
          : [...history].reverse().map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs">↑</div>
              <div className="flex-1">
                {e.note && <p className="text-sm text-slate-700">{e.note}</p>}
                <p className="text-xs text-slate-400">{e.date}</p>
              </div>
              <span className="text-sm font-semibold text-indigo-600">{e.value} {goal.unit}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ── Список целей ─────────────────────────────────────────────
function GoalList() {
  const [goalList, setGoalList] = useState(initGoals)
  const [filter, setFilter]     = useState('all')
  const [showModal, setShowModal] = useState(false)

  const filtered = goalList.filter(g => {
    const pct   = getPct(g.currentValue, g.targetValue)
    const left  = getDaysLeft(g.deadline)
    if (filter === 'active')    return pct < 100 && left >= 0
    if (filter === 'completed') return pct >= 100
    if (filter === 'overdue')   return left < 0 && pct < 100
    return true
  })

  const addGoal = form => {
    setGoalList(prev => [...prev, {
      ...form,
      id: Date.now(),
      targetValue: Number(form.targetValue),
      currentValue: 0,
      linkedHabitIds: [],
      type: 'numeric',
    }])
  }

  const TABS = [
    { key: 'all',       label: 'Все'        },
    { key: 'active',    label: 'В процессе' },
    { key: 'completed', label: 'Выполнены'  },
    { key: 'overdue',   label: 'Просрочены' },
  ]

  return (
    <div className="max-w-4xl space-y-5">
      {/* Панель управления */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                filter === t.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + Добавить цель
        </button>
      </div>

      <p className="text-sm text-slate-400">
        {goalList.length} целей · {goalList.filter(g => getPct(g.currentValue, g.targetValue) >= 100).length} выполнено
      </p>

      {/* Сетка карточек */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium">Целей нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => {
            const pct      = getPct(g.currentValue, g.targetValue)
            const daysLeft = getDaysLeft(g.deadline)
            const isDone   = pct >= 100
            const isLate   = daysLeft < 0 && !isDone

            return (
              <Link key={g.id} to={`/goals/${g.id}`}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow block">

                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">🎯</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 line-clamp-2">{g.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {g.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">
                      {g.currentValue}/{g.targetValue} {g.unit}
                    </span>
                    <span className={`font-bold ${isDone ? 'text-green-600' : 'text-indigo-600'}`}>{pct}%</span>
                  </div>
                  <Bar pct={pct} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={isLate ? 'text-red-500 font-medium' : isDone ? 'text-green-600 font-medium' : 'text-slate-400'}>
                    {isDone ? '✅ Выполнено' : isLate ? `Просрочена на ${Math.abs(daysLeft)} дн.` : `${daysLeft} дней осталось`}
                  </span>
                  {/* Иконки связанных привычек */}
                  {g.linkedHabitIds?.length > 0 && (
                    <span className="flex gap-0.5">
                      {g.linkedHabitIds.map(hid => {
                        const h = habits.find(x => x.id === hid)
                        return h ? <span key={hid}>{h.icon}</span> : null
                      })}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && <AddGoalModal onClose={() => setShowModal(false)} onAdd={addGoal} />}
    </div>
  )
}

// ── Точка входа ──────────────────────────────────────────────
export default function Goals() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (id) {
    const goal = initGoals.find(g => g.id === Number(id))
    if (!goal) return <p className="text-slate-500">Цель не найдена</p>
    return <GoalDetail goal={goal} onBack={() => navigate('/goals')} />
  }

  return <GoalList />
}
