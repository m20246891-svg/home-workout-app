import { Link } from 'react-router-dom'
import useProgram from '../hooks/useProgram'
import data from '../data/workouts.json'

const program = data.program

export default function Progress() {
  const { program: prog, startProgram, getCurrentProgramDay, refresh } = useProgram()
  const currentDay = getCurrentProgramDay()
  const hasStarted = !!prog.startDate
  const completedCount = prog.completedDays.length

  function handleStart() {
    startProgram()
    refresh()
  }

  if (!hasStarted) {
    return (
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{program.title}</h1>
        <p className="text-gray-500 mb-6">{program.subtitle}</p>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 text-center">
          <div className="text-5xl mb-4">🏋️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            28 дней до результата
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Короткие, но интенсивные ежедневные тренировки помогут укрепить всё тело.
          </p>
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition-colors"
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{program.title}</h1>
      <p className="text-gray-500 mb-4">{program.subtitle}</p>

      <p className="text-sm text-gray-600 mb-4">
        Выполнено <span className="font-semibold text-gray-900">{completedCount}</span> из{' '}
        <span className="font-semibold text-gray-900">{program.totalDays}</span>
      </p>

      <div className="space-y-2">
        {program.days.map((day, idx) => {
          const isCompleted = prog.completedDays.includes(day.day)
          const isCurrentDay = day.day === currentDay
          const isFuture = day.day > currentDay
          const isPast = day.day < currentDay
          const isAvailable = !isFuture && !isCompleted
          const lineAfter = idx < program.days.length - 1

          return (
            <div key={day.day} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center w-5 flex-shrink-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 mt-3.5 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500'
                      : isCurrentDay
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                />
                {lineAfter && (
                  <div
                    className={`w-0.5 flex-1 min-h-[4px] ${
                      isCompleted ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Day card */}
              {isFuture ? (
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between opacity-50 mb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">🔒</span>
                    <span className="text-sm text-gray-500">{day.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{day.durationMin} мин</span>
                </div>
              ) : (
                <Link
                  to={`/workout/${day.workoutId}/play`}
                  state={{ programDay: day.day }}
                  className={`flex-1 rounded-xl px-4 py-3 flex items-center justify-between border transition-colors ${
                    isCurrentDay && !isCompleted
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : isCompleted
                      ? 'bg-white border-gray-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isCompleted ? (
                      <span className="text-green-600 flex-shrink-0">✓</span>
                    ) : (
                      <span className="text-blue-600 font-semibold flex-shrink-0">{day.day}</span>
                    )}
                    <span
                      className={`text-sm truncate ${
                        isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {day.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{day.durationMin} мин</span>
                    {isCompleted && (
                      <span className="text-xs text-green-600 font-medium">Повторить</span>
                    )}
                    {isAvailable && (
                      <span className="text-xs text-blue-600 font-medium">
                        {isCurrentDay ? 'Начать' : 'Начать'}
                      </span>
                    )}
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
