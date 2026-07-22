import { Link } from 'react-router-dom'
import useProgram from '../hooks/useProgram'
import data from '../data/workouts.json'

const program = data.program
const plan = (data.plans && data.plans[0]) || program

export default function Progress() {
  const { program: prog, startProgram, getCurrentAvailableDay, refresh } = useProgram()
  const availableDay = getCurrentAvailableDay()
  const hasStarted = !!prog.startDate
  const completedCount = prog.completedDays.length
  const dayProgress = prog.dayProgress || {}

  function handleStart() {
    startProgram()
    refresh()
  }

  if (!hasStarted) {
    return (
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{program.title}</h1>
        <p className="text-gray-500 mb-6">{program.subtitle}</p>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center">
          <div className="text-5xl mb-4">🏋️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            28 дней до результата
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Короткие, но интенсивные ежедневные тренировки помогут укрепить всё тело.
          </p>
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            Начать программу
          </button>
        </div>

        {/* Locked preview */}
        <div className="mt-6 space-y-2">
          {program.days.slice(0, 5).map((day) => (
            <div
              key={day.day}
              className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400">🔒</span>
                <span className="text-sm text-gray-500">{day.title}</span>
              </div>
              <span className="text-xs text-gray-400">{day.durationMin} мин</span>
            </div>
          ))}
          {program.days.length > 5 && (
            <p className="text-center text-xs text-gray-400 pt-1">и ещё {program.days.length - 5} дней...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{plan.title}</h1>
      <p className="text-gray-500 mb-4">{program.subtitle}</p>

      <p className="text-sm text-gray-600 mb-4">
        Выполнено <span className="font-semibold text-gray-900">{completedCount}</span> из{' '}
        <span className="font-semibold text-gray-900">{program.totalDays}</span>
      </p>

      <div className="space-y-3">
        {program.days.map((day, idx) => {
          const dayNum = day.day
          const isCompleted = prog.completedDays.includes(dayNum)
          const isAvailable = dayNum === availableDay && !isCompleted
          const isLocked = dayNum > availableDay && !isCompleted
          const lineAfter = idx < program.days.length - 1
          const kcal = day.kcal || Math.round(day.durationMin * 9.5)

          // Calculate progress percent
          let pct = 0
          const dp = dayProgress[String(dayNum)]
          if (isCompleted) {
            pct = 100
          } else if (dp && dp.totalExercises > 0) {
            pct = Math.round((dp.completedExercises.length / dp.totalExercises) * 100)
          }

          return (
            <div key={day.day} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center w-5 flex-shrink-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 mt-4 ${
                    isCompleted || isAvailable
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-300'
                  }`}
                />
                {lineAfter && (
                  <div
                    className={`w-0.5 flex-1 min-h-[4px] ${
                      isCompleted ? 'bg-gray-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Day card */}
              {isLocked ? (
                <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden opacity-50 cursor-not-allowed relative group">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-400">
                        День {dayNum}
                      </h3>
                      <span className="text-gray-300">🔒</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        ⏱ {day.durationMin} мин
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        🔥 {kcal} ккал
                      </span>
                    </div>
                    <div className="h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                      <span className="text-3xl opacity-30">🏋️</span>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow">
                        Завершите предыдущий день
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to={`/workout/${day.workoutId}/play`}
                  state={{ programDay: dayNum }}
                  className={`block flex-1 rounded-2xl border transition-colors relative ${
                    isAvailable
                      ? 'bg-white border-gray-300 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    {/* Day header */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        День {dayNum}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {pct > 0 && (
                          <span className={`text-xs font-medium ${pct >= 100 ? 'text-green-600' : 'text-neutral-500'}`}>
                            {pct}%
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-accent text-xl font-bold leading-none">✓</span>
                        )}
                      </div>
                    </div>

                    {/* Pills */}
                    <div className="flex gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        ⏱ {day.durationMin} мин
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        🔥 {kcal} ккал
                      </span>
                    </div>

                    {/* Cover slot */}
                    <div className="h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                      {day.coverImage ? (
                        <img src={day.coverImage} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-3xl opacity-50">🏋️</span>
                      )}
                    </div>

                    {/* Action button */}
                    <div
                      className={`w-full py-3.5 rounded-xl text-center transition-colors ${
                        isCompleted
                          ? 'bg-gray-100 text-gray-700 font-semibold text-sm'
                          : 'bg-primary text-white font-bold text-base'
                      }`}
                    >
                      {isCompleted ? 'Повторить' : 'Начать'}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
