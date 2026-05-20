// =============================================================
//  Habits.jsx — список привычек + детальная страница.
//  URL /habits         → список
//  URL /habits/:id     → детальный просмотр
//  Один файл обрабатывает оба случая через useParams.
// =============================================================
import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  habits as allHabits,
  getHeatmap,
  getWeeklyCompletion,
} from '../mock'

// ── Прогресс-бар ─────────────────────────────────────────────
function Bar({ pct, color = '#6366f1', h = 'h-2' }) {
  return (
    <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${h} rounded-full`} style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

// ── Бейдж стрика ─────────────────────────────────────────────
function StreakBadge({ n }) {
  if (!n) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
      🔥 {n}
    </span>
  )
}

// ── Тепловая карта (4 недели × 7 дней) ──────────────────────
function Heatmap({ data, color }) {
  const weeks = []
  for (let i = 0; i < 4; i++) weeks.push(data.slice(i * 7, i * 7 + 7))
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="flex gap-1">
      {/* Подписи дней */}
      <div className="flex flex-col gap-1 mr-1 pt-5">
        {days.map(d => (
          <div key={d} className="h-4 flex items-center">
            <span className="text-[9px] text-slate-400 w-5 text-right">{d}</span>
          </div>
        ))}
      </div>
      {/* Ячейки */}
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          <span className="text-[9px] text-slate-400 text-center mb-1">Н{wi + 1}</span>
          {week.map((done, di) => (
            <div
              key={di}
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: done ? color : '#e2e8f0' }}
              title={done ? 'Выполнено' : 'Пропущено'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Столбчатый график (12 недель) ────────────────────────────
function WeeklyBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.pct), 1)
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${(d.pct / max) * 100}%`, backgroundColor: d.pct >= 80 ? '#22c55e' : color }}
          />
          {/* Подпись через каждые 3 колонки */}
          {i % 3 === 0 && (
            <span className="text-[9px] text-slate-400">{d.week}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Модальное окно добавления привычки ──────────────────────
function AddHabitModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', icon: '🏋️', category: 'Спорт', color: '#6366f1' })
  const ICONS = ['🏋️','📖','💧','🧘','🏃','🎸','✍️','🌿','💊','🚶','🍎','💰']

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  return (
    /* Тёмный оверлей */
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Новая привычка</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
            <input
              name="name" value={form.name} onChange={handle}
              placeholder="Например: Утренняя зарядка"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setForm(p => ({ ...p, icon: ic }))}
                  className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${
                    form.icon === ic ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'
                  }`}
                >{ic}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
            <select
              name="category" value={form.category} onChange={handle}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {['Спорт','Здоровье','Образование','Продуктивность','Отдых','Финансы'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Отмена
          </button>
          <button
            onClick={() => { if (form.name.trim()) { onAdd(form); onClose() } }}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Детальный вид одной привычки ─────────────────────────────
function HabitDetail({ habit, onBack }) {
  const heatmap = getHeatmap(habit.id)
  const weekly  = getWeeklyCompletion(habit.id)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Шапка */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          ← Назад
        </button>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: habit.color + '20' }}
        >{habit.icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{habit.name}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: habit.color + '20', color: habit.color }}>
            {habit.category}
          </span>
        </div>
      </div>

      {/* Статистика — 4 карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '🔥', label: 'Текущий стрик',  value: `${habit.streak} дн.`     },
          { icon: '🏆', label: 'Лучший стрик',   value: `${habit.bestStreak} дн.`  },
          { icon: '📊', label: 'За 30 дней',     value: `${habit.rate30}%`         },
          { icon: '✅', label: 'Всего выполнено', value: habit.totalDone            },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Тепловая карта */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Активность за 4 недели</h3>
        <Heatmap data={heatmap} color={habit.color} />
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-slate-400">Меньше</span>
          {['#e2e8f0', habit.color + '40', habit.color + '80', habit.color].map((c, i) => (
            <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-slate-400">Больше</span>
        </div>
      </div>

      {/* График по неделям */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Выполнение по неделям, %</h3>
        <WeeklyBarChart data={weekly} color={habit.color} />
      </div>

      {/* Кнопка «Отметить» */}
      {!habit.completedToday && (
        <button className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
          ✓ Отметить как выполненную сегодня
        </button>
      )}
      {habit.completedToday && (
        <div className="text-center py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium">
          ✓ Сегодня уже выполнено!
        </div>
      )}
    </div>
  )
}

// ── Список привычек ──────────────────────────────────────────
function HabitList({ habits, onAdd }) {
  const [filter, setFilter] = useState('active')  // all | active | archived
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [habitList, setHabitList] = useState(habits)

  const filtered = habitList.filter(h => {
    if (filter === 'active'   && h.archived)  return false
    if (filter === 'archived' && !h.archived) return false
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addHabit = (form) => {
    setHabitList(prev => [...prev, {
      ...form,
      id: Date.now(),
      completedToday: false,
      streak: 0, bestStreak: 0, rate30: 0, totalDone: 0,
      archived: false, frequency: 'daily',
    }])
  }

  const TABS = [
    { key: 'all',      label: 'Все'      },
    { key: 'active',   label: 'Активные' },
    { key: 'archived', label: 'Архив'    },
  ]

  return (
    <div className="max-w-4xl space-y-5">
      {/* Панель управления */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Табы-фильтры */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                filter === t.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Поиск */}
          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* Кнопка добавить */}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Привычка
          </button>
        </div>
      </div>

      {/* Счётчик */}
      <p className="text-sm text-slate-400">
        {habitList.filter(h => !h.archived).length} активных ·{' '}
        {habitList.filter(h => !h.archived && h.completedToday).length} выполнено сегодня
      </p>

      {/* Сетка карточек */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-medium">{search ? 'Ничего не найдено' : 'Привычек нет'}</p>
          <p className="text-sm mt-1">
            {!search && <button onClick={() => setShowModal(true)} className="text-indigo-600 hover:underline">Добавить первую →</button>}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(h => (
            <Link key={h.id} to={`/habits/${h.id}`}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow block">

              <div className="flex items-start gap-3 mb-3">
                {/* Цветная иконка */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: h.color + '20' }}
                >{h.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{h.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: h.color + '15', color: h.color }}>
                    {h.category}
                  </span>
                </div>
                {/* Иконка состояния */}
                {h.completedToday
                  ? <span className="text-green-500 text-lg">✓</span>
                  : <span className="text-slate-200 text-lg">○</span>
                }
              </div>

              <Bar pct={h.rate30} color={h.color} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">{h.rate30}% за 30 дней</span>
                <StreakBadge n={h.streak} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <AddHabitModal onClose={() => setShowModal(false)} onAdd={addHabit} />}
    </div>
  )
}

// ── Точка входа компонента ───────────────────────────────────
export default function Habits() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Если есть :id в URL — показываем детали
  if (id) {
    const habit = allHabits.find(h => h.id === Number(id))
    if (!habit) return <p className="text-slate-500">Привычка не найдена</p>
    return <HabitDetail habit={habit} onBack={() => navigate('/habits')} />
  }

  return <HabitList habits={allHabits} />
}
