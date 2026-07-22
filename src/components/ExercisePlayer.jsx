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
  const [mediaStage, setMediaStage] = useState('mp4')

  useEffect(() => {
    setMediaStage('mp4')
  }, [exercise.exerciseId])

  const displayTime = () => {
    if (!isTimed) return null
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  const renderMedia = () => {
    switch (mediaStage) {
      case 'mp4':
        return (
          <video
            src={`/exercises/${exercise.exerciseId}.mp4`}
            poster={`/exercises/${exercise.exerciseId}.webp`}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
            onError={() => setMediaStage('gif')}
          />
        )
      case 'gif':
        return (
          <img
            src={`/exercises/${exercise.exerciseId}.gif`}
            alt=""
            className="w-full h-auto"
            onError={() => setMediaStage('image')}
          />
        )
      case 'image':
        return (
          <img
            src={getExerciseImageUrl(exercise.exerciseId, exercise.name)}
            alt=""
            className="w-full h-auto"
            onError={() => setMediaStage('none')}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-500">
          Упражнение {exerciseIndex} из {totalExercises}
        </span>
        <span className="text-sm text-gray-500">{isTimed ? displayTime() : `${exercise.reps} повторений`}</span>
      </div>

      {/* Media — natural size, no letterbox */}
      <div className="w-full">
        {mediaStage !== 'none' && renderMedia()}
      </div>

      {/* Content — fills remaining space below video */}
      <div className="px-6 pt-3 pb-1 text-center flex-1 flex flex-col overflow-hidden">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>

        {isTimed ? (
          <div className="text-5xl font-bold tabular-nums my-2">{displayTime()}</div>
        ) : (
          <div className="text-4xl font-bold my-2">{exercise.reps}</div>
        )}

        {exercise.note && (
          <p className="text-base text-gray-500 mb-3">{exercise.note}</p>
        )}

        <div className="flex-1 overflow-y-auto pb-3">
          <p className="text-sm text-gray-500 leading-relaxed">{exercise.instructions}</p>
        </div>
      </div>

      {/* Bottom controls — always visible */}
      <div className="px-4 pb-6 pt-2 space-y-3">
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
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
        >
          {isTimed ? 'Дальше' : 'Готово'}
        </button>
      </div>
    </div>
  )
}
