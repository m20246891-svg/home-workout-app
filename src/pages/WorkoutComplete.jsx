import { useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import useLocalProgress from '../hooks/useLocalProgress'
import data from '../data/workouts.json'

function findWorkout(id) {
  for (const cat of data.categories) {
    const found = cat.workouts.find((w) => w.id === id)
    if (found) return found
  }
  return null
}

export default function WorkoutComplete() {
  const { id } = useParams()
  const { progress, addCompletedWorkout } = useLocalProgress()
  const saved = useRef(false)

  const workout = findWorkout(id)

  useEffect(() => {
    if (!saved.current) {
      saved.current = true
      addCompletedWorkout(id)
    }
  }, [id, addCompletedWorkout])

  const totalCompleted = progress.completedWorkouts?.length || 0
  const isFirst = totalCompleted === 1

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white px-6">
      {/* Confetti area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-2">Тренировка завершена!</h1>
        {workout && (
          <p className="text-lg text-gray-300 mb-2">{workout.title}</p>
        )}
        <p className="text-gray-400 mb-2">Отличная работа. Продолжай в том же духе!</p>

        {/* First workout badge */}
        {isFirst && (
          <div className="mt-4 mb-4 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-xl px-4 py-2">
            <span>🏅</span>
            <span className="font-semibold text-sm">Первая тренировка!</span>
          </div>
        )}

        {/* Streak */}
        {progress.streak > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xl">
            <span>🔥</span>
            <span className="font-semibold">Серия: {progress.streak} {progress.streak === 1 ? 'день' : 'дней'}</span>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="pb-8">
        <Link
          to="/workouts"
          className="block w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base text-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
