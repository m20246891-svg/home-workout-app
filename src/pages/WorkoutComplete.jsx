import { useEffect, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import useLocalProgress from '../hooks/useLocalProgress'
import useProgram from '../hooks/useProgram'
import { findAnyWorkout } from '../utils/generator'

export default function WorkoutComplete() {
  const { id } = useParams()
  const location = useLocation()
  const { progress, addCompletedWorkout } = useLocalProgress()
  const { markProgramDayDone } = useProgram()
  const saved = useRef(false)

  const programDay = location.state?.programDay

  const workout = findAnyWorkout(id)

  useEffect(() => {
    if (!saved.current) {
      saved.current = true
      addCompletedWorkout(id, workout?.title)
      if (programDay) {
        markProgramDayDone(programDay)
      }
    }
  }, [id, workout, addCompletedWorkout, markProgramDayDone, programDay])

  const totalCompleted = progress.completedWorkouts?.length || 0
  const isFirst = totalCompleted === 1

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 px-6">
      {/* Confetti area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-2">Тренировка завершена!</h1>
        {workout && (
          <p className="text-lg text-gray-500 mb-2">{workout.title}</p>
        )}
        {programDay && (
          <p className="text-sm text-gray-600 mb-2">День {programDay} программы отмечен ✓</p>
        )}
        <p className="text-gray-400 mb-2">Отличная работа. Продолжай в том же духе!</p>

        {/* First workout badge */}
        {isFirst && (
          <div className="mt-4 mb-4 inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-xl px-4 py-2">
            <span>🏅</span>
            <span className="font-semibold text-sm">Первая тренировка!</span>
          </div>
        )}

        {/* Streak */}
        {progress.streak > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xl text-gray-900">
            <span>🔥</span>
            <span className="font-semibold">Серия: {progress.streak} {progress.streak === 1 ? 'день' : 'дней'}</span>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="pb-8 space-y-2">
        {programDay && (
          <Link
            to="/progress"
            className="block w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-base text-center hover:bg-gray-100 transition-colors"
          >
            ← К программе
          </Link>
        )}
        <Link
          to="/workouts"
          className="block w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base text-center hover:bg-gray-800 active:bg-gray-700 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
