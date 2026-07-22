export default function RestScreen({
  timer,
  onSkip,
  onAddTime,
  nextExerciseName,
}) {
  const displayTime = () => {
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-2xl font-semibold text-gray-500 mb-4">Отдых</h2>
        <div className="text-8xl font-bold tabular-nums mb-8">{displayTime()}</div>

        {nextExerciseName && (
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Следующее:</p>
            <p className="text-lg font-medium text-gray-900">{nextExerciseName}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-8 space-y-3">
        <button
          onClick={onAddTime}
          className="w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
        >
          +20 сек
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
        >
          Пропустить
        </button>
      </div>
    </div>
  )
}
