import { useState, useEffect } from 'react'
import { getExerciseImageUrl } from '../utils/coverImage'

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
  const [mediaStage, setMediaStage] = useState('gif')

  useEffect(() => {
    setMediaStage('gif')
  }, [exercise.exerciseId])

  const displayTime = () => {
    if (!isTimed) return null
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  const renderMedia = () => {
    switch (mediaStage) {
      case 'gif':
        return (
          <img
            src={`/exercises-local/${exercise.exerciseId}.gif`}
            alt=""
            className="w-full h-48 rounded-xl object-contain bg-white"
            onError={() => setMediaStage('mp4')}
          />
        )
      case 'mp4':
        return (
          <video
            src={`/exercises/${exercise.exerciseId}.mp4`}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-48 rounded-xl object-cover bg-gray-100"
            onError={() => setMediaStage('image')}
          />
        )
      case 'image':
        return (
          <img
            src={getExerciseImageUrl(exercise.exerciseId, exercise.name)}
            alt=""
            className="w-full h-48 rounded-xl object-cover bg-gray-100"
            onError={() => setMediaStage('none')}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-500">
          Упражнение {exerciseIndex} из {totalExercises}
        </span>
        <span className="text-sm text-gray-500">{isTimed ? displayTime() : `${exercise.reps} повторений`}</span>
      </div>

      {/* Media area — GIF > MP4 > image > none */}
      {mediaStage !== 'none' && (
        <div className="px-4 pb-2">
          {renderMedia()}
        </div>
      )}

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
          <p className="text-base text-blue-600 mb-4">{exercise.note}</p>
        )}

        {/* Instructions */}
        <p className="text-sm text-gray-500 leading-relaxed max-w-md">{exercise.instructions}</p>
      </div>

      {/* Bottom controls */}
      <div className="px-4 pb-8 space-y-3">
        {isTimed && (
          <button
            onClick={onPause}
            className="w-full py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-base hover:bg-gray-100 transition-colors"
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
