import { useState, useEffect } from 'react'

export default function RestScreen({
  timer,
  onSkip,
  onAddTime,
  nextExercise,
  nextExerciseNum,
  totalExercises,
  nextDurationLabel,
  isEditing,
  onStartEdit,
  onFinishEdit,
  isLandscape,
}) {
  const [editValue, setEditValue] = useState(0)
  const [previewStage, setPreviewStage] = useState('mid') // 'mid' | 'regular' | 'placeholder'

  useEffect(() => {
    setPreviewStage('mid')
  }, [nextExercise?.exerciseId])

  const displayTime = () => {
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function handleStartEdit() {
    setEditValue(Math.max(5, Math.min(120, Math.ceil(timer / 5) * 5)))
    onStartEdit()
  }

  function handleFinishEdit() {
    onFinishEdit(editValue)
  }

  function adjustEdit(delta) {
    setEditValue((prev) => Math.max(5, Math.min(120, prev + delta)))
  }

  if (isLandscape) {
    return (
      <div className="fixed inset-0 bg-neutral-950">
        <div
          className="h-full flex flex-row gap-4 px-4 items-stretch"
          style={{
            paddingTop: '10rem',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* LEFT: next exercise preview card */}
          <div className="flex-1 min-w-0 bg-white/5 rounded-3xl p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-xs uppercase tracking-wide">
                Далее{nextExerciseNum ? ` · ${nextExerciseNum} из ${totalExercises}` : ''}
              </span>
              {nextDurationLabel && (
                <span className="text-white/60 text-sm">{nextDurationLabel}</span>
              )}
            </div>
            {nextExercise ? (
              <>
                <h3 className="text-white font-semibold text-lg truncate">
                  {nextExercise.name}
                </h3>
                <div className="flex-1 mt-3 rounded-2xl overflow-hidden min-h-0">
                  {previewStage !== 'placeholder' ? (
                    <img
                      src={
                        previewStage === 'mid'
                          ? `/exercises/${nextExercise.exerciseId}-mid.webp`
                          : `/exercises/${nextExercise.exerciseId}.webp`
                      }
                      alt={nextExercise.name || ''}
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (previewStage === 'mid') setPreviewStage('regular')
                        else setPreviewStage('placeholder')
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 bg-white/5 rounded-2xl mt-3" />
            )}
          </div>

          {/* RIGHT: rest column */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-5 text-white">
            <p className="text-white/50 font-semibold text-sm uppercase tracking-widest">
              Отдых
            </p>

            {isEditing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => adjustEdit(-5)}
                    className="w-11 h-11 rounded-full bg-white/15 text-white font-bold text-lg flex items-center justify-center hover:bg-white/25 transition-colors"
                    aria-label="Уменьшить"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-5xl tabular-nums w-24 text-center">
                    {editValue}
                  </span>
                  <span className="text-white/50 text-sm">сек</span>
                  <button
                    onClick={() => adjustEdit(5)}
                    className="w-11 h-11 rounded-full bg-white/15 text-white font-bold text-lg flex items-center justify-center hover:bg-white/25 transition-colors"
                    aria-label="Увеличить"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleFinishEdit}
                  className="px-6 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Готово
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-7xl tabular-nums">
                  {displayTime()}
                </span>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 text-white/60 text-sm hover:text-white/80 transition-colors mt-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Изменить
                </button>
              </div>
            )}

            <div className="flex flex-row gap-3 w-full max-w-sm">
              <button
                onClick={onAddTime}
                className="flex-1 h-12 rounded-full bg-white/10 text-white font-semibold text-base hover:bg-white/15 transition-colors"
              >
                +20 сек
              </button>
              <button
                onClick={onSkip}
                className="flex-1 h-12 rounded-full bg-white text-neutral-900 font-semibold text-base hover:bg-neutral-200 transition-colors"
              >
                Пропустить
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col">
      {/* Center block */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-white/50 font-semibold text-sm uppercase tracking-widest mb-6">
          Отдых
        </p>

        {isEditing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjustEdit(-5)}
                className="w-11 h-11 rounded-full bg-white/15 text-white font-bold text-lg flex items-center justify-center hover:bg-white/25 transition-colors"
                aria-label="Уменьшить"
              >
                −
              </button>
              <span className="text-white font-bold text-5xl tabular-nums w-24 text-center">
                {editValue}
              </span>
              <span className="text-white/50 text-sm">сек</span>
              <button
                onClick={() => adjustEdit(5)}
                className="w-11 h-11 rounded-full bg-white/15 text-white font-bold text-lg flex items-center justify-center hover:bg-white/25 transition-colors"
                aria-label="Увеличить"
              >
                +
              </button>
            </div>
            <button
              onClick={handleFinishEdit}
              className="px-6 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Готово
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-8xl tabular-nums">
              {displayTime()}
            </span>
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 text-white/60 text-sm hover:text-white/80 transition-colors mt-3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Изменить
            </button>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="px-5 mb-4 flex items-center gap-3">
        <button
          onClick={onAddTime}
          className="flex-1 h-12 rounded-full bg-white/10 text-white font-semibold text-base hover:bg-white/15 transition-colors"
        >
          +20 сек
        </button>
        <button
          onClick={onSkip}
          className="flex-1 h-12 rounded-full bg-white text-neutral-900 font-semibold text-base hover:bg-neutral-200 transition-colors"
        >
          Пропустить
        </button>
      </div>

      {/* Next exercise preview */}
      {nextExercise && (
        <div>
          <div className="flex items-center justify-between px-5 mb-2">
            <span className="text-white/50 text-xs uppercase tracking-wide">
              Далее · {nextExerciseNum} из {totalExercises}
            </span>
            {nextDurationLabel && (
              <span className="text-white/60 text-sm">{nextDurationLabel}</span>
            )}
          </div>
          <h3 className="text-white font-semibold text-lg px-5">
            {nextExercise.name}
          </h3>
          <div className="mt-3 h-48 rounded-t-3xl overflow-hidden">
            {previewStage !== 'placeholder' ? (
              <img
                src={
                  previewStage === 'mid'
                    ? `/exercises/${nextExercise.exerciseId}-mid.webp`
                    : `/exercises/${nextExercise.exerciseId}.webp`
                }
                alt={nextExercise.name || ''}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (previewStage === 'mid') {
                    setPreviewStage('regular')
                  } else {
                    setPreviewStage('placeholder')
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
