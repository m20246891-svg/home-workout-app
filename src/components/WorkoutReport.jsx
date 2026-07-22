import data from '../data/workouts.json'

export default function WorkoutReport({
  workout,
  steps,
  completedStepIndexes,
  totalExercises,
  onContinue,
  onClose,
}) {
  const completedCount = completedStepIndexes.length
  const pct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0
  const allDone = completedCount >= totalExercises

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-36">
          {/* Verdict header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{allDone ? '🎉' : '💪'}</div>
            <h1 className="text-2xl font-bold">
              {allDone ? 'Тренировка завершена' : 'Тренировка не завершена'}
            </h1>
            {workout && (
              <p className="text-sm text-gray-500 mt-1">{workout.title}</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                Выполнено {completedCount} из {totalExercises} упражнений
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Exercise list */}
          <div>
            {steps.map((step, idx) => {
              if (step.stepType !== 'exercise') return null

              const done = completedStepIndexes.includes(idx)
              const ex = data.exercises[step.exerciseId]
              const dosage =
                step.mode === 'timed'
                  ? `${step.durationSec} сек`
                  : `${step.reps} повт.`

              return (
                <div key={idx}>
                  {idx > 0 && steps[idx - 1]?.stepType === 'exercise' && (
                    <div className="border-t border-gray-100" />
                  )}
                  <div className="flex items-center gap-3 py-3">
                    {/* Status icon */}
                    {done ? (
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#16a34a" />
                        <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#d1d5db" />
                        <path d="M9 9l6 6m0-6l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}

                    {/* Exercise name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${done ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                        {ex?.name || step.exerciseId}
                      </p>
                    </div>

                    {/* Dosage */}
                    <span className={`text-xs flex-shrink-0 ${done ? 'text-gray-500' : 'text-gray-400'}`}>
                      {dosage}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sticky buttons — above tab bar */}
      <div className="fixed bottom-[50px] left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-4 py-4">
        {allDone ? (
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => onClose(true)}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Готово
            </button>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-2">
            <button
              onClick={onContinue}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Продолжить
            </button>
            <button
              onClick={() => onClose(false)}
              className="w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  )
}