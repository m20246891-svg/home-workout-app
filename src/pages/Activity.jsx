import useLocalProgress from '../hooks/useLocalProgress'
import data from '../data/workouts.json'

function findWorkoutTitle(id) {
  for (const cat of data.categories) {
    const found = cat.workouts.find((w) => w.id === id)
    if (found) return found.title
  }
  return id
}

export default function Activity() {
  const { progress } = useLocalProgress()
  const completed = progress.completedWorkouts || []
  const sorted = [...completed].reverse()
  const total = completed.length

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Активность</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Тренировок</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Серия</p>
          <p className="text-3xl font-bold text-gray-900">
            {progress.streak || 0}
            <span className="text-lg ml-1">🔥</span>
          </p>
        </div>
      </div>

      {/* History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">История</h2>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Пока нет завершённых тренировок</p>
          <p className="text-gray-400 text-sm mt-1">Заверши свою первую тренировку!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, idx) => (
            <div
              key={`${entry.workoutId}-${entry.date}-${idx}`}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm text-gray-800 truncate mr-2">
                {findWorkoutTitle(entry.workoutId)}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{entry.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
