// =============================================================
//  Stats.jsx — страница аналитики.
//  Показывает: ключевые метрики, еженедельный график (SVG),
//  топ/слабые привычки, распределение по категориям.
//  Все графики — чистый SVG, без внешних библиотек.
// =============================================================
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { topHabits, statsWeekly, categoryStats, user } from '../mock'

// ── Вертикальный столбчатый график (SVG) ────────────────────
function BarChart({ data }) {
  const W = 520, H = 120, PAD = { top: 10, bottom: 20, left: 30, right: 5 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom
  const barW   = innerW / data.length
  const maxVal = 100  // всегда 100%

  // Горизонтальные направляющие (0%, 50%, 100%)
  const guides = [0, 50, 100]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Направляющие */}
      {guides.map(v => {
        const y = PAD.top + innerH * (1 - v / maxVal)
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD.left - 3} y={y + 3}
              fontSize="8" fill="#94a3b8" textAnchor="end">{v}%</text>
          </g>
        )
      })}

      {/* Столбцы */}
      {data.map((d, i) => {
        const barH = (d.pct / maxVal) * innerH
        const x    = PAD.left + i * barW + barW * 0.15
        const y    = PAD.top  + innerH - barH
        const color = d.pct >= 80 ? '#22c55e' : d.pct >= 60 ? '#6366f1' : '#f59e0b'
        const isLast = i === data.length - 1

        return (
          <g key={i}>
            {/* Столбец */}
            <rect x={x} y={y} width={barW * 0.7} height={barH}
              rx="3" fill={color}
              opacity={isLast ? 1 : 0.75} />
            {/* Значение над столбцом */}
            {d.pct > 0 && (
              <text x={x + barW * 0.35} y={y - 3}
                fontSize="8" fill={color} textAnchor="middle">{d.pct}%</text>
            )}
            {/* Подпись (каждые 2 недели) */}
            {i % 2 === 0 && (
              <text x={x + barW * 0.35} y={H - 2}
                fontSize="7.5" fill="#94a3b8" textAnchor="middle">{d.week}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Горизонтальный бар (для рейтинга привычек) ───────────────
function HorizBar({ pct, color, height = 6 }) {
  return (
    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

// ── Круговая «пончиковая» диаграмма (SVG) ───────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const R = 40, CX = 55, CY = 55    // радиус и центр

  let angle = -Math.PI / 2  // начинаем сверху

  const slices = data.map(d => {
    const sweep = (d.count / total) * 2 * Math.PI
    const x1 = CX + R * Math.cos(angle)
    const y1 = CY + R * Math.sin(angle)
    angle += sweep
    const x2 = CX + R * Math.cos(angle)
    const y2 = CY + R * Math.sin(angle)
    const large = sweep > Math.PI ? 1 : 0
    return {
      ...d,
      path: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`,
      pct: Math.round((d.count / total) * 100),
    }
  })

  return (
    <div className="flex items-center gap-4">
      {/* SVG пончик */}
      <svg viewBox="0 0 110 110" className="w-24 h-24 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} />
        ))}
        {/* Белое отверстие */}
        <circle cx={CX} cy={CY} r={R * 0.55} fill="white" />
        {/* Итого в центре */}
        <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize="12" fontWeight="bold" fill="#1e293b">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle"
          fontSize="6" fill="#94a3b8">привычек</text>
      </svg>

      {/* Легенда */}
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-600">{s.name}</span>
            <span className="text-xs text-slate-400 ml-auto">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Главный компонент статистики ─────────────────────────────
export default function Stats() {
  // Переключатель периода (пока декоративный — данные одни)
  const [period, setPeriod] = useState('30')

  const avgRate = Math.round(
    topHabits.reduce((s, h) => s + h.rate30, 0) / topHabits.length
  )

  const PERIODS = [
    { key: '7',   label: 'Неделя' },
    { key: '30',  label: 'Месяц'  },
    { key: '90',  label: '3 мес.' },
    { key: '365', label: 'Год'    },
  ]

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Заголовок + период ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Аналитика</h2>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                period === p.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Три ключевые метрики ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '🔥', val: `${user.globalStreak} дн.`,         label: 'Серия активности' },
          { icon: '📊', val: `${avgRate}%`,                       label: 'Средний % за 30 дней' },
          { icon: '✅', val: topHabits.filter(h => !h.archived).length, label: 'Активных привычек' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-3xl mb-1">{m.icon}</p>
            <p className="text-2xl font-bold text-slate-800">{m.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* ── Еженедельный график ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Выполнение по неделям
        </h3>
        <BarChart data={statsWeekly} />
        <div className="flex gap-3 mt-3 text-xs text-slate-400 justify-end">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-green-500 inline-block" /> ≥ 80%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-indigo-500 inline-block" /> 60–79%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" /> &lt; 60%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* ── Топ привычек ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">🏆 Лучшие привычки</h3>
          <div className="space-y-3">
            {topHabits.slice(0, 4).map((h, i) => (
              <Link key={h.id} to={`/habits/${h.id}`}
                className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors">
                <span className="text-slate-400 text-sm w-4">#{i + 1}</span>
                <span className="text-base">{h.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{h.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <HorizBar pct={h.rate30} color={h.color} />
                    <span className="text-xs text-green-600 font-semibold shrink-0">{h.rate30}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Слабые привычки ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">⚠️ Требуют внимания</h3>
          <div className="space-y-3">
            {[...topHabits].reverse().slice(0, 4).map(h => (
              <Link key={h.id} to={`/habits/${h.id}`}
                className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors">
                <span className="text-base">{h.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{h.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <HorizBar pct={h.rate30} color="#f59e0b" />
                    <span className="text-xs text-amber-500 font-semibold shrink-0">{h.rate30}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Категории ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Привычки по категориям</h3>
        <DonutChart data={categoryStats} />
      </div>

      {/* ── Быстрые ссылки на привычки ── */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
        <p className="text-sm font-semibold text-indigo-800 mb-3">Быстрый переход</p>
        <div className="flex flex-wrap gap-2">
          {topHabits.map(h => (
            <Link key={h.id} to={`/habits/${h.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-indigo-100 text-xs font-medium text-slate-700 hover:shadow-sm transition-shadow">
              {h.icon} {h.name}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
