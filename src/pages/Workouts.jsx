import StreakBadge from '../components/StreakBadge'
import { Link } from 'react-router-dom'
import data from '../data/workouts.json'

export default function Workouts() {
  const plans = data.plans || []

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Тренировки</h1>
        <StreakBadge />
      </div>

      {/* Plans */}
      {plans.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Нет доступных планов</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              to="/progress"
              className="block rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Cover */}
              <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-5xl opacity-70">🏋️</span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-base text-gray-900 truncate">
                  {plan.title}
                </h3>
                {plan.description && (
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ~{plan.durationMin} мин/день
                  </span>
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {plan.totalDays} дней
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
