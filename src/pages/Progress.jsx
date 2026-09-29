import { useState } from 'react'
import { Link } from 'react-router-dom'
import useProgram from '../hooks/useProgram'
import data from '../data/workouts.json'
import { dayCover, daySubtitle, PLAN_COVER } from '../utils/covers'
import { scaleKcal } from '../utils/generator'
import { GEAR, workoutGear, gearRatio, getMissingGear, setMissingGear } from '../utils/gear'

const program = data.program
const plan = (data.plans && data.plans[0]) || program
const WORKOUTS = Object.fromEntries(data.categories.flatMap((c) => c.workouts.map((w) => [w.id, w])))

// Минуты и калории дня с учётом убранных упражнений.
function dayStats(day, missing) {
  const ratio = gearRatio(WORKOUTS[day.workoutId], missing)
  const min = Math.max(1, Math.round(day.durationMin * ratio))
  const kcal = Math.round(scaleKcal(day.kcal || Math.round(day.durationMin * 9.5)) * ratio)
  return { min, kcal }
}

// Инвентарь дня: зачёркнут, если его нет и упражнения на него убраны.
function GearLine({ day, missing, className = '' }) {
  const gear = workoutGear(WORKOUTS[day.workoutId])
  if (!gear.length) return null
  return (
    <p className={`text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5 ${className}`}>
      {gear.map((g) => (
        <span key={g} className={missing.includes(g) ? 'line-through text-gray-300' : ''}>
          {GEAR[g].icon} {GEAR[g].label}
        </span>
      ))}
    </p>
  )
}

const STAGES = [
  'Начни здоровую привычку',
  'Набираем ритм',
  'Новый уровень',
  'Финишная прямая',
]

function Meta({ day, missing, className = '' }) {
  const { min, kcal } = dayStats(day, missing)
  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      {min} мин <span className="text-gray-300 mx-1">|</span> {kcal} ккал
    </p>
  )
}

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

// Пройденный день: компактная карточка с фото и галочкой.
function DoneCard({ day, missing }) {
  return (
    <Link
      to={`/workout/${day.workoutId}/play`}
      state={{ programDay: day.day }}
      className="flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-3 pl-4 hover:border-gray-200 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
          <CheckIcon className="w-3.5 h-3.5" /> Выполнено
        </p>
        <p className="text-xl font-bold text-gray-400 mt-0.5">День {day.day}</p>
        <Meta day={day} missing={missing} className="text-gray-400" />
      </div>
      <div className="relative w-28 h-20 flex-shrink-0">
        <img src={dayCover(day)} alt="" className="w-full h-full object-cover rounded-xl opacity-70" />
        <span className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white/70">
          <CheckIcon />
        </span>
      </div>
    </Link>
  )
}

// Текущий день: большая карточка с фото и кнопкой.
function CurrentCard({ day, pct, missing, onToggleGear }) {
  const { min, kcal } = dayStats(day, missing)
  const gear = workoutGear(WORKOUTS[day.workoutId])
  return (
    <div className="rounded-3xl bg-white border border-gray-200 shadow-lg overflow-hidden">
      <div className="relative h-40">
        <img src={dayCover(day)} alt="" className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wider bg-accent text-primary px-2.5 py-1 rounded-full">
          Сегодня
        </span>
      </div>
      <div className="p-5 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-3xl font-bold text-gray-900">День {day.day}</h3>
          <p className="text-sm font-medium text-gray-500 text-right">{daySubtitle(day)}</p>
        </div>
        <div className="flex gap-2 mt-3">
          <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
            ⏱ {min} мин
          </span>
          <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
            🔥 {kcal} ккал
          </span>
        </div>
        {gear.length > 0 && (
          <div className="mt-4 rounded-2xl bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Понадобится</p>
            <GearLine day={day} missing={missing} className="mt-1 text-sm text-gray-700" />
            {gear.some((g) => GEAR[g].removable) && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-200 space-y-2">
                {gear
                  .filter((g) => GEAR[g].removable)
                  .map((g) => (
                    <label key={g} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={missing.includes(g)}
                        onChange={() => onToggleGear(g)}
                        className="w-5 h-5 rounded accent-primary"
                      />
                      {GEAR[g].missingLabel}
                    </label>
                  ))}
                <p className="text-xs text-gray-400">Упражнения с гантелями уберём из всех дней плана</p>
              </div>
            )}
          </div>
        )}
        {pct > 0 && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">Пройдено {pct}%</p>
          </div>
        )}
        <Link
          to={`/workout/${day.workoutId}/play`}
          state={{ programDay: day.day }}
          className="block w-full mt-5 py-3.5 rounded-xl bg-primary text-white text-center font-bold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
        >
          {pct > 0 ? 'Продолжить' : 'Начать'}
        </Link>
      </div>
    </div>
  )
}

// Закрытый день.
function LockedCard({ day, missing }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 pl-4" aria-disabled="true">
      <div className="flex-1 min-w-0">
        <p className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
          <LockIcon /> {daySubtitle(day)}
        </p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">День {day.day}</p>
        <Meta day={day} missing={missing} />
        <GearLine day={day} missing={missing} className="mt-1" />
      </div>
      <img src={dayCover(day)} alt="" className="w-28 h-20 object-cover rounded-xl flex-shrink-0 grayscale opacity-50" />
    </div>
  )
}

function StageHeader({ index, days, completedDays }) {
  const done = days.filter((d) => completedDays.includes(d.day)).length
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-base font-bold text-gray-900 min-w-0">
        <span className="text-gray-400 font-semibold">Неделя {index + 1}:</span> {STAGES[index]}
      </h2>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="grid grid-cols-4 gap-0.5">
          {days.map((d) => (
            <span
              key={d.day}
              className={`w-2 h-2 rounded-[2px] ${completedDays.includes(d.day) ? 'bg-primary' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-500 tabular-nums">{done}/{days.length}</span>
      </div>
    </div>
  )
}

export default function Progress() {
  const { program: prog, startProgram, getCurrentAvailableDay, refresh } = useProgram()
  const availableDay = getCurrentAvailableDay()
  const hasStarted = !!prog.startDate
  const completedDays = prog.completedDays
  const completedCount = completedDays.length
  const dayProgress = prog.dayProgress || {}
  // Нет гантелей — один выбор на весь план.
  const [missing, setMissing] = useState(getMissingGear)
  const toggleGear = (g) => {
    const next = missing.includes(g) ? missing.filter((x) => x !== g) : [...missing, g]
    setMissingGear(next)
    setMissing(next)
  }

  function handleStart() {
    startProgram()
    refresh()
  }

  const header = (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{program.totalDays}-дневный план</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{plan.title}</h1>
    </div>
  )

  if (!hasStarted) {
    return (
      <div className="px-4 pt-4 pb-6">
        {header}
        <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <img src={PLAN_COVER} alt="" className="w-full h-48 object-cover" />
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900">28 дней до результата</h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Короткие ежедневные тренировки дома: нагрузка растёт каждую неделю — от 8 до 21 минуты.
            </p>
            <button
              onClick={handleStart}
              className="w-full mt-5 py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Начать программу
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <StageHeader index={0} days={program.days.slice(0, 7)} completedDays={[]} />
          {program.days.slice(0, 3).map((day) => (
            <LockedCard key={day.day} day={day} missing={missing} />
          ))}
          <p className="text-center text-xs text-gray-400 pt-1">и ещё {program.days.length - 3} дней</p>
        </div>
      </div>
    )
  }

  const weeks = [0, 1, 2, 3].map((w) => program.days.slice(w * 7, w * 7 + 7))

  return (
    <div className="px-4 pt-4 pb-6">
      {header}

      {/* Общий прогресс */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-500">Выполнено</span>
          <span className="font-semibold text-gray-900 tabular-nums">{completedCount} из {program.totalDays}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${(completedCount / program.totalDays) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-8">
        {weeks.map((days, w) => (
          <section key={w}>
            <StageHeader index={w} days={days} completedDays={completedDays} />
            <div className="relative">
              {/* Лента */}
              <span className="absolute left-[7px] top-4 bottom-4 border-l-2 border-dashed border-gray-200" aria-hidden="true" />
              <div className="space-y-3">
                {days.map((day) => {
                  const n = day.day
                  const isCompleted = completedDays.includes(n)
                  const isCurrent = n === availableDay && !isCompleted
                  const dp = dayProgress[String(n)]
                  const pct = dp && dp.totalExercises > 0
                    ? Math.round((dp.completedExercises.length / dp.totalExercises) * 100)
                    : 0
                  return (
                    <div key={n} className="relative flex items-center gap-3">
                      <span
                        className={`relative z-10 flex-shrink-0 rounded-full ${
                          isCurrent
                            ? 'w-4 h-4 bg-accent ring-4 ring-accent-soft'
                            : isCompleted
                              ? 'w-4 h-4 bg-primary'
                              : 'w-4 h-4 bg-white border-2 border-gray-300'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        {isCompleted ? (
                          <DoneCard day={day} missing={missing} />
                        ) : isCurrent ? (
                          <CurrentCard day={day} pct={pct} missing={missing} onToggleGear={toggleGear} />
                        ) : (
                          <LockedCard day={day} missing={missing} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
