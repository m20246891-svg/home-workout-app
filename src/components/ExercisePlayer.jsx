import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getExerciseImageUrl } from '../utils/coverImage'

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

const RING_RADIUS = 24
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function ExercisePlayer({
  exercise,
  exerciseIndex,
  totalExercises,
  timer,
  isPaused,
  isTimed,
  isLandscape,
  canPrev,
  isPanelCollapsed,
  onPause,
  onNext,
  onPrev,
}) {
  const [mediaStage, setMediaStage] = useState('mp4')
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    setMediaStage('mp4')
  }, [exercise.exerciseId])

  const displayTime = () => {
    if (!isTimed) return null
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const progress = isTimed && exercise.durationSec > 0
    ? (exercise.durationSec - timer) / exercise.durationSec
    : 0

  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(progress, 1))

  function handleOpenInstructions() {
    if (!isPaused) {
      onPause()
    }
    setShowInstructions(true)
  }

  function handleCloseInstructions() {
    setShowInstructions(false)
  }

  const renderMedia = () => {
    const baseClass = 'absolute inset-0 w-full h-full object-contain'

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
            className={baseClass}
            onError={() => setMediaStage('gif')}
          />
        )
      case 'gif':
        return (
          <img
            src={`/exercises/${exercise.exerciseId}.gif`}
            alt=""
            className={baseClass}
            onError={() => setMediaStage('image')}
          />
        )
      case 'image':
        return (
          <img
            src={getExerciseImageUrl(exercise.exerciseId, exercise.name)}
            alt=""
            className={baseClass}
            onError={() => setMediaStage('none')}
          />
        )
      default:
        return null
    }
  }

  const ringSvg = (
    <svg
      width={52}
      height={52}
      viewBox="0 0 52 52"
      className="absolute inset-0"
    >
      <circle
        cx={26}
        cy={26}
        r={RING_RADIUS}
        fill="none"
        stroke="white"
        strokeWidth={2}
        opacity={0.25}
      />
      {isTimed && (
        <circle
          cx={26}
          cy={26}
          r={RING_RADIUS}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={ringOffset}
          transform="rotate(-90 26 26)"
          className="transition-all duration-300"
        />
      )}
    </svg>
  )

  const playPauseIcon = isPaused ? (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="7,4 20,12 7,20" />
    </svg>
  ) : (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="5" height="14" rx="1" />
      <rect x="14" y="5" width="5" height="14" rx="1" />
    </svg>
  )

  const skipIcon = (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 18,12 5,20" />
      <rect x="18" y="5" width="2.5" height="14" rx="0.5" />
    </svg>
  )

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Media area — fills remaining space */}
      <div className="flex-1 relative bg-white overflow-hidden min-h-0">
        {mediaStage !== 'none' && renderMedia()}

        {/* Landscape HUD — side arrows + bottom bar, siblings of the single video node */}
        {isLandscape && (
          <>
            {canPrev && (
              <button
                onClick={onPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full text-neutral-700 hover:bg-neutral-900/5 transition-colors"
                aria-label="Предыдущее"
              >
                <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full text-neutral-700 hover:bg-neutral-900/5 transition-colors"
              aria-label="Дальше"
            >
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div
              className="absolute bottom-0 inset-x-0 z-20 px-4 pt-4 flex items-end justify-between gap-4"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                  <svg width={52} height={52} viewBox="0 0 52 52" className="absolute inset-0">
                    <circle cx={26} cy={26} r={RING_RADIUS} fill="none" stroke="#171717" strokeWidth={2} opacity={0.2} />
                    {isTimed && (
                      <circle
                        cx={26}
                        cy={26}
                        r={RING_RADIUS}
                        fill="none"
                        stroke="#171717"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={ringOffset}
                        transform="rotate(-90 26 26)"
                        className="transition-all duration-300"
                      />
                    )}
                  </svg>
                  <button
                    onClick={onPause}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-900 z-10"
                    aria-label={isPaused ? 'Продолжить' : 'Пауза'}
                  >
                    {isPaused ? (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="7,4 20,12 7,20" />
                      </svg>
                    ) : (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                        <rect x="5" y="5" width="5" height="14" rx="1" />
                        <rect x="14" y="5" width="5" height="14" rx="1" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-900 font-semibold text-base truncate">{exercise.name}</span>
                    <button
                      onClick={handleOpenInstructions}
                      className="w-[18px] h-[18px] rounded-full bg-neutral-900/10 flex items-center justify-center text-neutral-800 text-[9px] font-bold flex-shrink-0"
                      aria-label="Инструкция"
                    >
                      ?
                    </button>
                  </div>
                  <div className="text-neutral-600 text-xs mt-0.5">
                    {exerciseIndex} из {totalExercises}
                  </div>
                </div>
              </div>
              <span className="text-neutral-900 font-bold text-4xl tabular-nums flex-shrink-0 leading-none">
                {isTimed ? displayTime() : (exercise.reps || '—')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Expanded: dark bottom panel (current design from stage 2) */}
      {!isLandscape && !isPanelCollapsed && (
        <div
          className="bg-neutral-950 text-white rounded-t-3xl px-5 pt-5 -mt-4 relative z-10"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Row 1: exercise name + ? button */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="text-white font-bold text-lg">{exercise.name}</h2>
            <button
              onClick={handleOpenInstructions}
              className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-white/80 text-[10px] font-bold flex-shrink-0"
              aria-label="Инструкция"
            >
              ?
            </button>
          </div>

          {/* Row 2: large timer / reps */}
          <div className="text-center mb-4">
            {isTimed ? (
              <span className="text-7xl font-bold text-white tabular-nums">{displayTime()}</span>
            ) : (
              <span className="text-7xl font-bold text-white">{exercise.reps || '—'}</span>
            )}
          </div>

          {/* Row 3: controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPause}
              className="relative flex-1 h-14 rounded-full bg-white overflow-hidden flex items-center justify-center"
              aria-label={isPaused ? 'Продолжить' : 'Пауза'}
            >
              {isTimed && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-neutral-300 transition-all duration-300"
                  style={{ width: `${Math.min(progress * 100, 100)}%` }}
                />
              )}
              <span className="relative z-10 text-neutral-900">
                {playPauseIcon}
              </span>
            </button>
            <button
              onClick={onNext}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0"
              aria-label="Дальше"
            >
              {skipIcon}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed: compact overlay bar at the bottom */}
      {!isLandscape && isPanelCollapsed && (
        <div
          className="absolute left-4 right-4 z-20 bg-neutral-950/85 backdrop-blur-md rounded-2xl px-3 py-3 flex items-center gap-3"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Play/pause with progress ring */}
          <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
            {ringSvg}
            <button
              onClick={onPause}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-900 z-10"
              aria-label={isPaused ? 'Продолжить' : 'Пауза'}
            >
              {isPaused ? (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="7,4 20,12 7,20" />
                </svg>
              ) : (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                  <rect x="5" y="5" width="5" height="14" rx="1" />
                  <rect x="14" y="5" width="5" height="14" rx="1" />
                </svg>
              )}
            </button>
          </div>

          {/* Name + ? button */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm truncate">{exercise.name}</span>
            <button
              onClick={handleOpenInstructions}
              className="w-[18px] h-[18px] rounded-full bg-white/15 flex items-center justify-center text-white/80 text-[9px] font-bold flex-shrink-0"
              aria-label="Инструкция"
            >
              ?
            </button>
          </div>

          {/* Timer / reps */}
          <span className="text-white font-bold tabular-nums text-base flex-shrink-0">
            {isTimed ? displayTime() : (exercise.reps || '—')}
          </span>

          {/* Skip */}
          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0"
            aria-label="Дальше"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,4 18,12 5,20" />
              <rect x="18" y="5" width="2.5" height="14" rx="0.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Instructions modal via portal */}
      {showInstructions &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={handleCloseInstructions}
          >
            <div
              className="bg-white rounded-2xl p-5 max-w-sm w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-neutral-900 font-bold text-lg mb-3">{exercise.name}</h3>

              {exercise.instructions ? (
                <div className="text-neutral-700 text-sm leading-relaxed mb-4">
                  {Array.isArray(exercise.instructions) ? (
                    <ol className="list-decimal pl-4 space-y-1">
                      {exercise.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    typeof exercise.instructions === 'string' ? (
                      exercise.instructions.split('\n').map((p, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{p}</p>
                      ))
                    ) : (
                      <p>{exercise.instructions}</p>
                    )
                  )}
                </div>
              ) : (
                <p className="text-neutral-400 text-sm mb-4">Инструкция отсутствует</p>
              )}

              {exercise.primaryMuscles?.length > 0 && (
                <p className="text-neutral-500 text-sm mb-4">
                  Работают мышцы:{' '}
                  {exercise.primaryMuscles.map((m) => muscleLabels[m] || m).join(', ')}
                </p>
              )}

              <button
                onClick={handleCloseInstructions}
                className="w-full py-3 rounded-full bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
