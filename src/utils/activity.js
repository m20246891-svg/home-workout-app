// Серия и календарь активности. Все даты — локальные строки YYYY-MM-DD.

export function localDate(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseDate(str) {
  return new Date(str + 'T00:00:00')
}

export function addDays(str, n) {
  const d = parseDate(str)
  d.setDate(d.getDate() + n)
  return localDate(d)
}

// Цели серии: следующая веха после текущей длины.
export const MILESTONES = [3, 7, 14, 21, 30, 60, 100, 180, 365]

export function nextMilestone(streak) {
  return MILESTONES.find((m) => m > streak) ?? streak + 30
}

export function prevMilestone(streak) {
  return [...MILESTONES].reverse().find((m) => m <= streak) ?? 0
}

// Серия считается по дням с завершённой тренировкой. Если сегодня ещё не тренировался,
// серия жива, пока вчерашний день выполнен.
export function computeStreak(completedDates = [], today = localDate()) {
  const set = new Set(completedDates)
  const doneToday = set.has(today)
  let cursor = doneToday ? today : addDays(today, -1)
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let run = 0
  let prev = null
  for (const d of [...set].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }

  let state = 'lost' // серия прервана или ещё не начата
  if (doneToday) state = 'done'
  else if (current > 0) state = 'atRisk' // нужно потренироваться сегодня

  return { current, best, doneToday, state }
}

export function pluralDays(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня'
  return 'дней'
}

// Статусы дней для календаря: done — выполнено, partial — начато, но не завершено,
// missed — пропуск (после начала занятий и до вчерашнего дня включительно).
export function dayStatuses({ completedDates = [], partialDates = [], trackingStart, today = localDate() }) {
  const done = new Set(completedDates)
  const partial = new Set(partialDates.filter((d) => !done.has(d)))
  return function statusOf(date) {
    if (done.has(date)) return 'done'
    if (partial.has(date)) return 'partial'
    if (trackingStart && date >= trackingStart && date < today) return 'missed'
    return null
  }
}

// Сетка месяца, неделя с понедельника; null — пустые клетки.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(localDate(new Date(year, month, d)))
  while (cells.length % 7) cells.push(null)
  return cells
}
