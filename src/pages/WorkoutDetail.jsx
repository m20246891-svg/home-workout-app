import { useParams, Link } from 'react-router-dom'
import data from '../data/workouts.json'

const levelLabels = { beginner: 'Новичок', intermediate: 'Средний', advanced: 'Продвинутый' }
const equipmentLabels = { none: 'Без инвентаря', dumbbells: 'Гантели', mat: 'Коврик' }

function formatDosage(item) {
  if (item.mode === 'timed') {
    const min = Math.floor(item.durationSec / 60)
    const sec = item.durationSec % 60
    if (min > 0) return `${min}:${String(sec).padStart(2, '0')} мин`
    return `${sec} сек`
  }
  return `${item.reps} повт.`
}

export default function WorkoutDetail() {
  const { id } = useParams()

  let workout = null
  for (const cat of data.categories) {
    const found = cat.workouts.find((w) => w.id === id)
    if (found) { workout = found; break }
  }

  if (!workout) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Тренировка не найдена</h1>
        <Link to="/workouts" className="text-blue-600 mt-2 inline-block">← Назад к тренировкам</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header image placeholder */}
      <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-end p-4">
        <h1 className="text-2xl font-bold text-white">{workout.title}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {workout.durationMin} мин
          </span>
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {levelLabels[workout.level]}
          </span>
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            {equipmentLabels[workout.equipment]}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm leading-relaxed">{workout.description}</p>

        {/* Blocks */}
        <div className="space-y-4">
          {workout.blocks.map((block) => (
            <div key={block.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-900">{block.name}</h3>
                {block.repeat > 1 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {block.repeat} круга
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {block.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    {item.type === 'rest' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="text-gray-500">Отдых</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{item.durationSec} сек</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-800">
                            {data.exercises[item.exerciseId]?.name || item.exerciseId}
                          </span>
                          <span className="text-gray-500 ml-1.5">{formatDosage(item)}</span>
                          {item.note && (
                            <span className="block text-gray-400 text-xs mt-0.5">{item.note}</span>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Start button */}
        <Link
          to={`/workout/${id}/play`}
          className="block w-full py-3.5 bg-blue-600 text-white text-center font-semibold rounded-xl text-base hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Начать
        </Link>
      </div>
    </div>
  )
}
