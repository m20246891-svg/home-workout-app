export default function ExercisePlayer({
  exercise,
  exerciseIndex,
  totalExercises,
  timer,
  isPaused,
  isTimed,
  onPause,
  onNext,
}) {
  const displayTime = () => {
    if (!isTimed) return null
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-400">
          Упражнение {exerciseIndex} из {totalExercises}
        </span>
        <span className="text-sm text-gray-400">{isTimed ? displayTime() : `${exercise.reps} повторений`}</span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Exercise name */}
        <h2 className="text-2xl font-bold mb-2">{exercise.name}</h2>

        {/* Timer or rep count */}
        {isTimed ? (
          <div className="text-7xl font-bold tabular-nums my-8">{displayTime()}</div>
        ) : (
          <div className="text-6xl font-bold my-8">{exercise.reps}</div>
        )}

        {/* Note if present */}
        {exercise.note && (
          <p className="text-base text-blue-300 mb-4">{exercise.note}</p>
        )}

        {/* Instructions */}
        <p className="text-sm text-gray-300 leading-relaxed max-w-md">{exercise.instructions}</p>
      </div>

      {/* Bottom controls */}
      <div className="px-4 pb-8 space-y-3">
        {isTimed && (
          <button
            onClick={onPause}
            className="w-full py-3.5 rounded-xl border border-gray-600 text-white font-semibold text-base hover:bg-gray-800 transition-colors"
          >
            {isPaused ? 'Продолжить' : 'Пауза'}
          </button>
        )}
        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          {isTimed ? 'Дальше' : 'Готово'}
        </button>
      </div>
    </div>
  )
}
