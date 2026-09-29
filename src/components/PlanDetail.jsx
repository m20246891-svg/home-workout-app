import { useNavigate } from 'react-router-dom'
import data from '../data/workouts.json'
import { PLAN_COVER } from '../utils/covers'

const muscleLabels = {
  Glutes: 'Ягодицы',
  Quadriceps: 'Квадрицепсы',
  Core: 'Пресс',
  Chest: 'Грудь',
  Shoulders: 'Плечи',
  Biceps: 'Бицепсы',
  Triceps: 'Трицепсы',
  Calves: 'Икры',
}

const equipmentLabels = {
  none: 'Без инвентаря',
  dumbbells: 'Гантели',
  mat: 'Коврик',
}

const levelLabels = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
}

function findWorkout(workoutId) {
  for (const cat of data.categories) {
    for (const w of cat.workouts) {
      if (w.id === workoutId) return w
    }
  }
  return null
}

function getFirstExerciseId(workout) {
  for (const block of workout.blocks || []) {
    for (const item of block.items || []) {
      if (item.type === 'exercise') return item.exerciseId
    }
  }
  return null
}

function calcWorkoutDuration(workout) {
  let total = 0
  for (const block of workout.blocks || []) {
    const repeat = block.repeat || 1
    let blockSec = 0
    for (const item of block.items || []) {
      if (item.type === 'exercise') {
        const ex = data.exercises[item.exerciseId]
        blockSec += ex?.durationSec || item.durationSec || 0
      } else if (item.type === 'rest') {
        blockSec += item.durationSec || 0
      }
    }
    total += blockSec * repeat
  }
  return total
}

function formatDuration(totalSec) {
  if (!totalSec) return null
  const min = Math.ceil(totalSec / 60)
  return `~${min} мин`
}

function collectPlanChips(days) {
  const equipSet = new Set()
  const muscleCount = {}

  for (const day of days) {
    const workout = findWorkout(day.workoutId)
    if (!workout) continue
    if (workout.equipment && equipmentLabels[workout.equipment]) {
      equipSet.add(workout.equipment)
    }
    for (const block of workout.blocks || []) {
      for (const item of block.items || []) {
        if (item.type !== 'exercise') continue
        const ex = data.exercises[item.exerciseId]
        if (!ex?.primaryMuscles) continue
        ;(ex.primaryMuscles || []).forEach((m) => {
          muscleCount[m] = (muscleCount[m] || 0) + 1
        })
      }
    }
  }

  const equipChips = [...equipSet].map((e) => equipmentLabels[e])
  const topMuscles = Object.entries(muscleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => muscleLabels[m])
    .filter(Boolean)

  return { equipChips, topMuscles }
}

function isMoveKitDay(workout) {
  if (!workout) return false
  const firstId = getFirstExerciseId(workout)
  if (!firstId) return false
  const ex = data.exercises[firstId]
  return ex && ex.primaryMuscles !== undefined
}

function getDayDescription(workout) {
  if (!workout) return null
  if (workout.description) return workout.description
  const level = levelLabels[workout.level]
  const equip = workout.equipment === 'none' ? 'без инвентаря' : null
  return [level, equip].filter(Boolean).join(' · ')
}

export default function PlanDetail({ planId, onBack }) {
  const navigate = useNavigate()
  const plan = (data.plans || []).find((p) => p.id === planId)
  const program = data.program
  if (!plan || !program) return null

  const days = program.days || []
  const { equipChips, topMuscles } = collectPlanChips(days)

  function handleStart() {
    navigate('/progress')
    onBack()
  }

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button type="button" onClick={onBack} className="p-1 -ml-1 text-gray-700 cursor-pointer">
          <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{plan.title}</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-36">
          {/* Cover block */}
          <img src={PLAN_COVER} alt="" className="w-full h-44 rounded-2xl object-cover mb-4 bg-gray-100" />

          <h2 className="text-2xl font-bold mb-1">{plan.title}</h2>
          {plan.description && (
            <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
          )}

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
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

          {/* Chips — equipment */}
          {equipChips.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Оборудование</p>
              <div className="flex flex-wrap gap-2">
                {equipChips.map((e) => (
                  <span
                    key={e}
                    className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chips — focus / muscles */}
          {topMuscles.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Фокус</p>
              <div className="flex flex-wrap gap-2">
                {topMuscles.map((m) => (
                  <span
                    key={m}
                    className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider before training list */}
          <div className="border-t border-gray-100 mb-4" />

          {/* Training list */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Тренировки</p>
          <div>
            {days.map((day, idx) => {
              const workout = findWorkout(day.workoutId)
              const hasMoveKit = isMoveKitDay(workout)

              if (!hasMoveKit) {
                return (
                  <div key={day.day}>
                    {idx > 0 && <div className="border-t border-gray-100" />}
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-400">
                          {String(day.day).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">День {day.day}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Тренировка скоро появится</p>
                      </div>
                    </div>
                  </div>
                )
              }

              const firstExId = getFirstExerciseId(workout)
              const midSrc = firstExId ? `/exercises/${firstExId}-mid.webp` : null
              const regularSrc = firstExId ? `/exercises/${firstExId}.webp` : null
              const duration = formatDuration(calcWorkoutDuration(workout))
              const desc = getDayDescription(workout)

              return (
                <div key={day.day}>
                  {idx > 0 && <div className="border-t border-gray-100" />}
                  <div className="flex items-center gap-3 py-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                      {midSrc ? (
                        <img
                          src={midSrc}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (e.currentTarget.src === midSrc) {
                              e.currentTarget.src = regularSrc
                            } else {
                              e.currentTarget.style.display = 'none'
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg">🏋️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {day.title || workout.title || `День ${day.day}`}
                      </p>
                      {desc && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
                      )}
                    </div>
                    {duration && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{duration}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Start button — fixed over tab bar */}
      <div className="fixed bottom-[50px] left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            Начать
          </button>
        </div>
      </div>
    </div>
  )
}