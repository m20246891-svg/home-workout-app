import { useState } from 'react'
import WorkoutCard from '../components/WorkoutCard'
import StreakBadge from '../components/StreakBadge'
import data from '../data/workouts.json'

const levels = [
  { value: 'all', label: 'Все' },
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
]

export default function Workouts() {
  const [activeLevel, setActiveLevel] = useState('all')

  const filteredCategories = data.categories.map((cat) => ({
    ...cat,
    workouts:
      activeLevel === 'all'
        ? cat.workouts
        : cat.workouts.filter((w) => w.level === activeLevel),
  })).filter((cat) => cat.workouts.length > 0)

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Тренировки</h1>
        <StreakBadge />
      </div>

      {/* Level filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 scrollbar-hide">
        {levels.map((l) => (
          <button
            key={l.value}
            onClick={() => setActiveLevel(l.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeLevel === l.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {filteredCategories.map((cat) => (
        <section key={cat.id} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{cat.name}</h2>
          <div className="space-y-3">
            {cat.workouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
