import { computeStreak, nextMilestone, prevMilestone, pluralDays, localDate, addDays, parseDate } from '../utils/activity'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const MESSAGES = {
  done: { title: 'Серия продлена!', text: 'Отличная работа. Возвращайся завтра, чтобы не прерывать серию.' },
  atRisk: { title: 'Не дай серии сгореть', text: 'Сегодня ещё нет тренировки — хватит даже короткой на 5 минут.' },
  lost: { title: 'Начни новую серию', text: 'Одна тренировка сегодня — и отсчёт пошёл. Главное — регулярность.' },
}

// Трекер серии: текущая серия, неделя, прогресс до следующей цели и рекорд.
export default function StreakCard({ completedDates }) {
  const today = localDate()
  const { current, best, state } = computeStreak(completedDates, today)
  const goal = nextMilestone(current)
  const from = prevMilestone(current)
  const pct = Math.round(((current - from) / (goal - from)) * 100)
  const done = new Set(completedDates)

  // Текущая неделя с понедельника.
  const monday = addDays(today, -((parseDate(today).getDay() + 6) % 7))
  const week = WEEKDAYS.map((label, i) => ({ label, date: addDays(monday, i) }))

  const msg = MESSAGES[state]
  const flameOn = state !== 'lost'

  return (
    <div className="rounded-3xl bg-primary text-white p-5 mb-4 overflow-hidden relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Серия</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums">{current}</span>
            <span className="text-lg text-white/70">{pluralDays(current)} подряд</span>
          </p>
        </div>
        <span
          className={`text-5xl leading-none transition ${flameOn ? '' : 'grayscale opacity-40'} ${state === 'atRisk' ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        >
          🔥
        </span>
      </div>

      <p className={`mt-3 font-semibold ${state === 'atRisk' ? 'text-accent' : 'text-white'}`}>{msg.title}</p>
      <p className="text-sm text-white/60 mt-0.5">{msg.text}</p>

      {/* Неделя */}
      <div className="grid grid-cols-7 gap-1.5 mt-5">
        {week.map(({ label, date }) => {
          const isDone = done.has(date)
          const isToday = date === today
          const isFuture = date > today
          return (
            <div key={date} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] ${isToday ? 'text-white font-semibold' : 'text-white/40'}`}>{label}</span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isDone
                    ? 'bg-accent text-primary'
                    : isToday
                      ? 'border-2 border-dashed border-accent'
                      : isFuture
                        ? 'bg-white/5'
                        : 'bg-white/10'
                }`}
              >
                {isDone ? '🔥' : ''}
              </span>
            </div>
          )
        })}
      </div>

      {/* До следующей цели */}
      <div className="mt-5">
        <div className="flex justify-between text-xs text-white/60 mb-1.5">
          <span>Следующая цель — {goal} {pluralDays(goal)}</span>
          <span className="tabular-nums">{current}/{goal}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.max(pct, current ? 4 : 0)}%` }} />
        </div>
      </div>

      <p className="text-xs text-white/50 mt-3">
        Рекорд: <span className="text-white font-semibold">{best} {pluralDays(best)}</span>
      </p>
    </div>
  )
}
