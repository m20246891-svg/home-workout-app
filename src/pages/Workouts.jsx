import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import UserAvatar from '../components/UserAvatar'
import { get } from '../utils/storage'
import StreakBadge from '../components/StreakBadge'
import PlanDetail from '../components/PlanDetail'
import data from '../data/workouts.json'
import { getTodayGeneratedWorkout } from '../utils/generator'
import { GENERATOR_COVER, PLAN_COVER } from '../utils/covers'

function GeneratorCard() {
  const navigate = useNavigate()
  const today = getTodayGeneratedWorkout()

  return (
    <div className="relative -mx-2 mb-6 rounded-3xl bg-primary text-white overflow-hidden">
      <img src={GENERATOR_COVER} alt="" className="absolute inset-y-0 -right-[14%] h-full w-[62%] object-cover object-[50%_20%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-transparent" />

      <div className="relative p-5 pr-28">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Умный подбор
        </p>
        <h2 className="text-2xl font-bold mt-1.5 leading-tight">
          {today ? 'Твоя тренировка на сегодня' : 'Генератор тренировок'}
        </h2>
        <p className="text-sm text-white/70 mt-1.5">
          {today
            ? `${today.title} · ${today.durationMin} мин · ≈ ${today.kcal} ккал`
            : 'Персональный план на каждый день — по самочувствию, цели и свободному времени'}
        </p>
      </div>

      <div className="relative px-5 pb-5">
        {today ? (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/generator')}
              className="flex-1 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              Открыть
            </button>
            <button
              onClick={() => navigate('/generator', { state: { fresh: true } })}
              className="flex-1 py-3 rounded-xl bg-white/10 backdrop-blur text-white font-semibold text-sm hover:bg-white/15 transition-colors"
            >
              Создать новую
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/generator', { state: { fresh: true } })}
            className="w-full py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Создать тренировку
          </button>
        )}
      </div>
    </div>
  )
}

export default function Workouts() {
  const plans = data.plans || []
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const profile = get('userProfile')

  if (selectedPlanId) {
    return (
      <PlanDetail
        planId={selectedPlanId}
        onBack={() => setSelectedPlanId(null)}
      />
    )
  }

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/profile" aria-label="Профиль">
            <UserAvatar profile={profile} className="w-11 h-11 text-xl" />
          </Link>
          <div className="min-w-0">
            {profile?.name && <p className="text-sm text-gray-500 truncate">Привет, {profile.name}!</p>}
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Тренировки</h1>
          </div>
        </div>
        <StreakBadge />
      </div>

      <GeneratorCard />

      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Планы</h2>

      {/* Plans */}
      {plans.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Нет доступных планов</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className="w-full text-left rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Cover */}
              <div className="relative h-36 bg-gray-100">
                <img src={PLAN_COVER} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 text-gray-900 px-2.5 py-1 rounded-full">
                  {plan.totalDays} дней · дома
                </span>
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
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
