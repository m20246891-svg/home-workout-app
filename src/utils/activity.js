// Ударный режим и календарь активности. Все даты — локальные строки YYYY-MM-DD.

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

// Цели ударного режима: следующая веха после текущей длины.
export const MILESTONES = [3, 7, 14, 21, 30, 60, 100, 180, 365]

export function nextMilestone(streak) {
  return MILESTONES.find((m) => m > streak) ?? streak + 30
}

export function prevMilestone(streak) {
  return [...MILESTONES].reverse().find((m) => m <= streak) ?? 0
}

// Ударный режим считается по дням с завершённой тренировкой. Замороженные дни
// (пропуск, прикрытый заморозкой) не рвут режим, но и не прибавляют к нему.
// Если сегодня ещё не тренировался, режим жив, пока вчерашний день выполнен или заморожен.
export function computeStreak(completedDates = [], today = localDate(), frozenDates = []) {
  const done = new Set(completedDates)
  const frozen = new Set(frozenDates)
  const kept = (d) => done.has(d) || frozen.has(d)
  const doneToday = done.has(today)
  let cursor = doneToday ? today : addDays(today, -1)
  let current = 0
  while (kept(cursor)) {
    if (done.has(cursor)) current++
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let run = 0
  let prev = null
  for (const d of [...new Set([...done, ...frozen])].sort()) {
    if (!(prev && addDays(prev, 1) === d)) run = 0
    if (done.has(d)) run++
    best = Math.max(best, run)
    prev = d
  }

  let state = 'lost' // режим прерван или ещё не начат
  if (doneToday) state = 'done'
  else if (current > 0) state = 'atRisk' // нужно потренироваться сегодня
  const frozenYesterday = !doneToday && frozen.has(addDays(today, -1))

  return { current, best, doneToday, state, frozenYesterday }
}

// ── Заморозки ударного режима (как в Duolingo) ──────────────────────────────
// Одна есть с самого начала, максимум две; ещё одна — за каждые 7 дней подряд.
export const MAX_FREEZES = 2
export const FREEZE_EVERY = 7

export const freezesOf = (progress) => progress?.streakFreezes ?? 1

// Прикрывает пропущенные дни заморозками — если их хватает на весь пропуск.
// Возвращает тот же объект, если ничего не изменилось.
export function applyFreezes(progress, today = localDate()) {
  const completed = progress?.completedDates || []
  const frozenDates = progress?.frozenDates || []
  const last = [...completed, ...frozenDates].filter((d) => d < today).sort().pop()
  const yesterday = addDays(today, -1)
  if (!last || last >= yesterday) return progress

  const gap = []
  for (let d = addDays(last, 1); d <= yesterday; d = addDays(d, 1)) gap.push(d)
  const freezes = freezesOf(progress)
  if (gap.length > freezes) return progress // заморозок не хватило — режим сгорел

  return { ...progress, frozenDates: [...frozenDates, ...gap], streakFreezes: freezes - gap.length }
}

// После тренировки: каждые 7 дней режима — новая заморозка (если есть место).
export function earnFreeze(progress, streak) {
  const freezes = freezesOf(progress)
  if (streak > 0 && streak % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) {
    return { ...progress, streakFreezes: freezes + 1 }
  }
  return progress
}

export function pluralDays(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня'
  return 'дней'
}

// Статусы дней для календаря: done — выполнено, partial — начато, но не завершено,
// frozen — пропуск, прикрытый заморозкой; missed — пропуск (после начала занятий и до вчерашнего дня).
export function dayStatuses({ completedDates = [], partialDates = [], frozenDates = [], trackingStart, today = localDate() }) {
  const done = new Set(completedDates)
  const frozen = new Set(frozenDates)
  const partial = new Set(partialDates.filter((d) => !done.has(d)))
  return function statusOf(date) {
    if (done.has(date)) return 'done'
    if (partial.has(date)) return 'partial'
    if (frozen.has(date)) return 'frozen'
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
