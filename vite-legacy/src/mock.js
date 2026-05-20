// =============================================================
//  МОКОВЫЕ ДАННЫЕ — вся информация захардкожена здесь.
//  Когда появится бэкенд, заменить эти импорты на API-вызовы.
// =============================================================

// ── Текущий пользователь ────────────────────────────────────
export const user = {
  name: 'Алексей',
  email: 'alexey@example.com',
  avatar: null,          // URL аватара, пока нет — показываем инициал
  globalStreak: 14,      // дней активности подряд
  remindersEnabled: true,
  reminderTime: '08:30',
  telegramConnected: false,
}

// ── Категории привычек / целей ──────────────────────────────
export const categories = [
  { id: 1, name: 'Спорт',         icon: '🏃', color: '#3b82f6' },
  { id: 2, name: 'Здоровье',      icon: '💪', color: '#22c55e' },
  { id: 3, name: 'Образование',   icon: '📚', color: '#a855f7' },
  { id: 4, name: 'Продуктивность',icon: '⚡', color: '#f59e0b' },
  { id: 5, name: 'Отдых',         icon: '🧘', color: '#ec4899' },
  { id: 6, name: 'Финансы',       icon: '💰', color: '#14b8a6' },
]

// ── Привычки ────────────────────────────────────────────────
// frequency: 'daily' | [0..6]  (0 = воскресенье, 1 = понедельник …)
export const habits = [
  {
    id: 1,
    name: 'Утренняя зарядка',
    icon: '🏋️',
    color: '#3b82f6',
    category: 'Спорт',
    frequency: 'daily',
    completedToday: true,
    streak: 12,
    bestStreak: 21,
    rate30: 83,   // % выполнения за 30 дней
    totalDone: 74,
    archived: false,
  },
  {
    id: 2,
    name: 'Читать 30 минут',
    icon: '📖',
    color: '#a855f7',
    category: 'Образование',
    frequency: 'daily',
    completedToday: false,
    streak: 5,
    bestStreak: 18,
    rate30: 77,
    totalDone: 45,
    archived: false,
  },
  {
    id: 3,
    name: 'Пить 2 л воды',
    icon: '💧',
    color: '#22c55e',
    category: 'Здоровье',
    frequency: 'daily',
    completedToday: true,
    streak: 8,
    bestStreak: 15,
    rate30: 90,
    totalDone: 41,
    archived: false,
  },
  {
    id: 4,
    name: 'Медитация',
    icon: '🧘',
    color: '#ec4899',
    category: 'Отдых',
    frequency: 'daily',
    completedToday: false,
    streak: 3,
    bestStreak: 10,
    rate30: 60,
    totalDone: 18,
    archived: false,
  },
  {
    id: 5,
    name: 'Учить английский',
    icon: '🇬🇧',
    color: '#f59e0b',
    category: 'Образование',
    frequency: [1, 2, 3, 4, 5],  // Пн – Пт
    completedToday: false,
    streak: 4,
    bestStreak: 8,
    rate30: 70,
    totalDone: 14,
    archived: false,
  },
  {
    id: 6,
    name: 'Бег',
    icon: '🏃',
    color: '#14b8a6',
    category: 'Спорт',
    frequency: [1, 3, 5],  // Пн, Ср, Пт
    completedToday: false,
    streak: 2,
    bestStreak: 12,
    rate30: 67,
    totalDone: 33,
    archived: false,
  },
]

// ── Активность за 7 дней (для полосы на дашборде) ──────────
export const weeklyActivity = [
  { day: 'Пн', completed: 4, total: 5 },
  { day: 'Вт', completed: 5, total: 5 },
  { day: 'Ср', completed: 3, total: 6 },
  { day: 'Чт', completed: 6, total: 6 },
  { day: 'Пт', completed: 2, total: 6 },
  { day: 'Сб', completed: 4, total: 4 },
  { day: 'Вс', completed: 2, total: 4 }, // сегодня
]

// ── Тепловая карта за последние 4 недели (для деталей привычки) ──
// true = выполнено, false = пропущено, null = не запланировано
export function getHeatmap(habitId) {
  // Генерируем псевдо-случайные данные на основе id привычки
  const seed = habitId * 17
  return Array.from({ length: 28 }, (_, i) => {
    const r = Math.sin(seed + i) * 0.5 + 0.5
    return r > 0.25  // ~75% completion
  })
}

// ── Еженедельное выполнение (для графика на странице привычки) ──
export function getWeeklyCompletion(habitId) {
  const seed = habitId * 7
  return Array.from({ length: 12 }, (_, i) => {
    const base = 60 + Math.sin(seed + i) * 25
    return { week: `Н${i + 1}`, pct: Math.round(Math.max(20, Math.min(100, base))) }
  })
}

// ── Цели ────────────────────────────────────────────────────
export const goals = [
  {
    id: 1,
    name: 'Пробежать 100 км',
    description: 'Суммарный километраж за год',
    category: 'Спорт',
    type: 'numeric',
    targetValue: 100,
    currentValue: 47,
    unit: 'км',
    deadline: '2026-12-31',
    linkedHabitIds: [6],
  },
  {
    id: 2,
    name: 'Прочитать 20 книг',
    description: 'Список книг на 2026 год',
    category: 'Образование',
    type: 'numeric',
    targetValue: 20,
    currentValue: 8,
    unit: 'книг',
    deadline: '2026-12-31',
    linkedHabitIds: [2],
  },
  {
    id: 3,
    name: 'Выучить 500 слов',
    description: 'Английский словарный запас',
    category: 'Образование',
    type: 'numeric',
    targetValue: 500,
    currentValue: 210,
    unit: 'слов',
    deadline: '2026-09-01',
    linkedHabitIds: [5],
  },
  {
    id: 4,
    name: '90 дней без пропуска',
    description: 'Утренняя зарядка каждый день',
    category: 'Спорт',
    type: 'numeric',
    targetValue: 90,
    currentValue: 12,
    unit: 'дней',
    deadline: '2026-08-07',
    linkedHabitIds: [1],
  },
]

// ── История прогресса по целям ──────────────────────────────
export const goalProgressHistory = {
  1: [
    { date: '30 апр', value: 42, note: 'Пробежал 5 км' },
    { date: '2 мая',  value: 45, note: 'Утренняя пробежка 3 км' },
    { date: '8 мая',  value: 47, note: 'Пробежал 2 км' },
  ],
  2: [
    { date: '25 апр', value: 6,  note: 'Дочитал «Атомные привычки»' },
    { date: '7 мая',  value: 8,  note: '«Думай медленно, решай быстро»' },
  ],
  3: [
    { date: '1 апр',  value: 150, note: 'Урок 1–5' },
    { date: '20 апр', value: 180, note: 'Ещё 30 слов' },
    { date: '5 мая',  value: 210, note: 'Топик «Путешествия»' },
  ],
  4: [
    { date: '28 апр', value: 8,  note: '8 дней без пропуска' },
    { date: '9 мая',  value: 12, note: 'Серия продолжается!' },
  ],
}

// ── Данные для страницы статистики ──────────────────────────

// Выполнение по неделям (последние 8 недель)
export const statsWeekly = [
  { week: '24 мар', pct: 55 },
  { week: '31 мар', pct: 72 },
  { week: '7 апр',  pct: 68 },
  { week: '14 апр', pct: 80 },
  { week: '21 апр', pct: 75 },
  { week: '28 апр', pct: 83 },
  { week: '5 мая',  pct: 79 },
  { week: '12 мая', pct: 85 },
]

// Топ привычек по % выполнения
export const topHabits = habits
  .filter(h => !h.archived)
  .sort((a, b) => b.rate30 - a.rate30)

// Распределение по категориям
export const categoryStats = [
  { name: 'Спорт',          count: 2, color: '#3b82f6' },
  { name: 'Образование',    count: 2, color: '#a855f7' },
  { name: 'Здоровье',       count: 1, color: '#22c55e' },
  { name: 'Отдых',          count: 1, color: '#ec4899' },
]

// ── Цитаты дня ──────────────────────────────────────────────
export const quotes = [
  'Маленькие шаги каждый день приводят к большим переменам.',
  'Дисциплина — это мост между целями и достижениями.',
  'Привычки формируют характер, характер формирует судьбу.',
  'Не нужно быть великим, чтобы начать. Нужно начать, чтобы стать великим.',
  'Каждый день — новая возможность стать лучше.',
  'Успех — это сумма небольших усилий, повторяемых день за днём.',
  'Чтобы изменить жизнь, нужно изменить привычки.',
]

// Вспомогательные функции
export const getDaysLeft = (deadline) => {
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const getPct = (current, target) =>
  Math.min(Math.round((current / target) * 100), 100)

export const todayQuote = () =>
  quotes[new Date().getDay() % quotes.length]

// ═════════════════════════════════════════════════════════════
// Питание / КБЖУ (демо-дневник, данные живут здесь же)
// ═════════════════════════════════════════════════════════════

export const foodDatabase = [
  { id: 'food-1', name: 'Куриная грудка (варёная)', calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  { id: 'food-2', name: 'Яйцо куриное', calories: 155, protein: 13, fat: 11, carbs: 1.1 },
  { id: 'food-3', name: 'Лосось (запечённый)', calories: 208, protein: 20, fat: 13, carbs: 0 },
  { id: 'food-4', name: 'Говядина (тушёная)', calories: 218, protein: 26, fat: 12, carbs: 0 },
  { id: 'food-6', name: 'Творог 5%', calories: 121, protein: 17, fat: 5, carbs: 3 },
  { id: 'food-7', name: 'Рис (варёный)', calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  { id: 'food-8', name: 'Гречка (варёная)', calories: 110, protein: 4, fat: 1, carbs: 21 },
  { id: 'food-9', name: 'Овсянка на воде', calories: 88, protein: 3, fat: 1.5, carbs: 15 },
  { id: 'food-10', name: 'Хлеб цельнозерновой', calories: 247, protein: 9, fat: 3, carbs: 45 },
  { id: 'food-12', name: 'Молоко 2.5%', calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7 },
  { id: 'food-13', name: 'Греческий йогурт 2%', calories: 73, protein: 10, fat: 2, carbs: 4 },
  { id: 'food-15', name: 'Брокколи', calories: 34, protein: 2.8, fat: 0.4, carbs: 7 },
  { id: 'food-20', name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  { id: 'food-21', name: 'Банан', calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
]

export function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateShiftFromToday(deltaDays) {
  const dt = new Date()
  dt.setDate(dt.getDate() + deltaDays)
  return ymd(dt)
}

function buildMealEntry(id, foodId, dateStr, mealType, amountG) {
  const food = foodDatabase.find((f) => f.id === foodId)
  if (!food) throw new Error(`Unknown food ${foodId}`)
  const k = amountG / 100
  return {
    id,
    foodId,
    date: dateStr,
    mealType,
    amount: amountG,
    calories: Math.round(food.calories * k),
    protein: Math.round(food.protein * k * 10) / 10,
    fat: Math.round(food.fat * k * 10) / 10,
    carbs: Math.round(food.carbs * k * 10) / 10,
  }
}

/** Стартовые записи для дашборда и страницы питания (вчера / позавчера / сегодня относительно «сегодня» браузера) */
export function getInitialMealEntries() {
  const todayStr = dateShiftFromToday(0)
  const yesterdayStr = dateShiftFromToday(-1)
  const twoAgoStr = dateShiftFromToday(-2)
  return [
    buildMealEntry('me-1', 'food-9', yesterdayStr, 'breakfast', 200),
    buildMealEntry('me-3', 'food-1', yesterdayStr, 'lunch', 200),
    buildMealEntry('me-17', 'food-9', todayStr, 'breakfast', 200),
    buildMealEntry('me-18', 'food-13', todayStr, 'breakfast', 150),
    buildMealEntry('me-19', 'food-1', todayStr, 'lunch', 200),
    buildMealEntry('me-20', 'food-7', todayStr, 'lunch', 150),
    buildMealEntry('me-x1', 'food-21', twoAgoStr, 'snack', 120),
  ]
}

export const nutritionGoalsDefault = {
  calories: 2200,
  protein: 150,
  fat: 70,
  carbs: 250,
}

/** Один раз при загрузке модуля — общий старт для дашборда и дневника */
export const mealEntriesSeed = getInitialMealEntries()
