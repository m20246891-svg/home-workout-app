import { Link } from 'react-router-dom'

const levelLabels = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
}

const levelColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
}

const equipmentLabels = {
  none: 'Без инвентаря',
  dumbbells: 'Гантели',
  mat: 'Коврик',
}

export default function WorkoutCard({ workout }) {
  return (
    <Link
      to={`/workout/${workout.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate">
            {workout.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {workout.description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[workout.level]}`}>
          {levelLabels[workout.level]}
        </span>
        <span className="inline-flex items-center text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {workout.durationMin} мин
        </span>
        <span className="inline-flex items-center text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {equipmentLabels[workout.equipment] || workout.equipment}
        </span>
      </div>
    </Link>
  )
}
