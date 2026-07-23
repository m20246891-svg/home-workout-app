const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function localDateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildWeekDates() {
  const now = new Date()
  const jsDay = now.getDay() // Sun=0..Sat=6
  const monIndex = (jsDay + 6) % 7 // Mon=0..Sun=6
  const monday = new Date(now)
  monday.setDate(now.getDate() - monIndex)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return localDateString(d)
  })
}

export default function WorkoutReport({
  streak,
  completedDates,
  onRestart,
  onClose,
}) {
  const weekDates = buildWeekDates()
  const now = new Date()
  const todayIndex = (now.getDay() + 6) % 7
  const dates = Array.isArray(completedDates) ? completedDates : []

  const isFirst = streak <= 1
  const streakDigit = Math.max(1, streak)

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white overflow-y-auto">
      <div
        className="min-h-full flex flex-col items-center max-w-md mx-auto px-6 pt-12"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Flame + streak digit */}
        <div className="relative flex items-center justify-center" style={{ width: 132, height: 132 }}>
          <svg width="132" height="132" viewBox="0 0 24 24" fill="url(#flameGrad)">
            <defs>
              <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          <span className="absolute text-white font-bold text-4xl tabular-nums" style={{ transform: 'translateY(6px)' }}>
            {streakDigit}
          </span>
        </div>

        {/* Title + subtitle */}
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <h1 className="text-white font-bold text-3xl leading-tight max-w-xs">
            {isFirst ? (
              <>
                <span className="text-amber-600">Первый день</span> позади
              </>
            ) : (
              <>
                <span className="text-amber-600">{streak} дней</span> подряд
              </>
            )}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            {isFirst
              ? 'Отличное начало — так держать.'
              : 'Ты в ударе, не сбавляй темп.'}
          </p>
        </div>

        {/* Weekly grid */}
        <div className="mt-8 w-full max-w-sm bg-white/5 rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-2 items-center">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={`lbl-${i}`}
                className={`text-center text-xs ${i === todayIndex ? 'text-amber-600 font-semibold' : 'text-white/40'}`}
              >
                {label}
              </div>
            ))}
            {weekDates.map((dateStr, i) => {
              const done = dates.includes(dateStr) || i === todayIndex
              return (
                <div key={`d-${i}`} className="flex items-center justify-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      done ? 'bg-amber-600' : 'bg-white/10'
                    }`}
                  >
                    {done && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-dashed border-white/10 my-3" />

          <p className="text-white/50 text-xs text-center leading-relaxed">
            Занимайся каждый день — и серия не обнулится.
          </p>
        </div>

        {/* Buttons — bottom */}
        <div className="mt-auto pt-8 w-full flex flex-col gap-3">
          <button
            onClick={onClose}
            className="h-14 rounded-full bg-white text-neutral-900 font-semibold text-base hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
          >
            Готово
          </button>
          <button
            onClick={onRestart}
            className="h-14 rounded-full bg-white/10 text-white font-semibold text-base hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
          >
            Повторить тренировку
          </button>
        </div>
      </div>
    </div>
  )
}
