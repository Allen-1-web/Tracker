// =============================================================
//  App.jsx — корневой компонент: роутинг + постоянный Layout
//  (Sidebar + Topbar). Все страницы рендерятся в <main>.
// =============================================================
import React from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Habits    from './pages/Habits'
import Goals     from './pages/Goals'
import Stats     from './pages/Stats'
import Nutrition from './pages/Nutrition'

// ── Иконки (inline SVG, чтобы не тянуть библиотеку) ─────────
const Icon = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  habits: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  goals: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
    </svg>
  ),
  stats: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  nutrition: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 2l-2.3 2.3a3 3 0 000 4.2l1.8 1.8a3 3 0 004.2 0L22 8M15 15L3.3 3.3a4.2 4.2 0 000 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15m-.5-1.5l3 3M12 8l8 8" />
    </svg>
  ),
  zap: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

// ── Заголовок страницы по текущему URL ──────────────────────
const pageTitles = {
  '/dashboard': 'Дашборд',
  '/habits':    'Привычки',
  '/goals':     'Цели',
  '/nutrition': 'Питание',
  '/stats':     'Статистика',
}

// ── Пункт бокового меню ─────────────────────────────────────
function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      // NavLink добавляет класс active когда URL совпадает
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

// ── Сайдбар (фиксированный, 256 px) ─────────────────────────
function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-30">

      {/* Логотип */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          {Icon.zap}
        </div>
        <div>
          <p className="font-bold text-slate-800 leading-none">HabitFlow</p>
          <p className="text-xs text-slate-400 mt-0.5">Трекер привычек</p>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem to="/dashboard" icon={Icon.dashboard} label="Дашборд"   />
        <NavItem to="/habits"    icon={Icon.habits}    label="Привычки"   />
        <NavItem to="/goals"     icon={Icon.goals}     label="Цели"       />
        <NavItem to="/nutrition" icon={Icon.nutrition} label="Питание" />
        <NavItem to="/stats"     icon={Icon.stats}     label="Статистика" />
      </nav>

      {/* Мини-профиль внизу сайдбара */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
            А
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">Алексей</p>
            <p className="text-xs text-slate-400 truncate">alexey@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Верхняя панель (sticky) ──────────────────────────────────
function Topbar() {
  const { pathname } = useLocation()
  // Получаем заголовок по базовому пути (игнорируем /habits/3 → /habits)
  const base = '/' + pathname.split('/')[1]
  const title = pageTitles[base] ?? 'HabitFlow'

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-3">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-400 capitalize">{today}</p>
      </div>
      {/* Иконка уведомления (декоративная) */}
      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Красная точка — есть уведомление */}
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500" />
      </button>
    </header>
  )
}

// ── Корневой компонент ───────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Основной контент сдвинут вправо на ширину сайдбара */}
      <div className="ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6">
          <Routes>
            {/* Редирект с корня на дашборд */}
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            {/* /habits и /habits/:id обрабатывает один компонент */}
            <Route path="/habits"      element={<Habits />} />
            <Route path="/habits/:id"  element={<Habits />} />
            {/* /goals и /goals/:id */}
            <Route path="/goals"       element={<Goals />} />
            <Route path="/goals/:id"   element={<Goals />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/stats"       element={<Stats />} />
            {/* Любой другой URL → редирект */}
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
