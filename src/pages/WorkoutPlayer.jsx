import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import data from '../data/workouts.json'
import { findAnyWorkout } from '../utils/generator'
import { withoutGear } from '../utils/gear'
import { IN_TELEGRAM, haptic, setClosingConfirmation } from '../utils/telegram'
import { playBell, playBeep, playVoice, stopVoice, isSoundOn, setSoundOn } from '../utils/sounds'
import voiceMap from '../data/voice.json'
import ExercisePlayer from '../components/ExercisePlayer'
import RestScreen from '../components/RestScreen'
import WorkoutReport from '../components/WorkoutReport'
import useLocalProgress from '../hooks/useLocalProgress'
import useProgram from '../hooks/useProgram'

function flattenSteps(blocks) {
  const steps = []
  let exerciseCount = 0
  for (const block of blocks) {
    for (let r = 0; r < block.repeat; r++) {
      for (const item of block.items) {
        if (item.type === 'exercise') {
          exerciseCount++
          steps.push({ ...item, stepType: 'exercise' })
        } else {
          steps.push({ ...item, stepType: 'rest' })
        }
      }
    }
  }
  return { steps, exerciseCount }
}

export default function WorkoutPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const programDay = location.state?.programDay
  // В 28-дневном плане убираем упражнения на инвентарь, которого у человека нет.
  const found = findAnyWorkout(id)
  const workout = programDay ? withoutGear(found) : found
  const { progress, addCompletedWorkout, addPartialWorkout, markStarted } = useLocalProgress()
  const { markProgramDayDone, saveDayProgress } = useProgram()

  const [{ steps, exerciseCount }, _] = useState(
    () => workout ? flattenSteps(workout.blocks) : { steps: [], exerciseCount: 0 }
  )

  const [phase, setPhase] = useState('countdown') // countdown | playing | exitSurvey | workoutReport
  const [countdown, setCountdown] = useState(3)
  const [stepIndex, setStepIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [completedStepIndexes, setCompletedStepIndexes] = useState([])
  const [sessionElapsed, setSessionElapsed] = useState(0)
  const [isEditingRest, setIsEditingRest] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const wasPlayingRef = useRef(false)
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(orientation: landscape)')
    const handler = (e) => setIsLandscape(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Как только тренировка пошла — отмечаем день начатым.
  const startedRef = useRef(false)
  useEffect(() => {
    if (phase !== 'playing' || startedRef.current) return
    startedRef.current = true
    markStarted()
  }, [phase, markStarted])

  const toggleOrientation = useCallback(() => setIsLandscape((v) => !v), [])

  // В Telegram: спрашивать подтверждение, если тренировку закрывают свайпом или крестиком.
  useEffect(() => {
    setClosingConfirmation(true)
    return () => setClosingConfirmation(false)
  }, [])

  useEffect(() => {
    if (phase === 'workoutReport') setClosingConfirmation(false)
  }, [phase])

  const currentStep = steps[stepIndex]
  const exerciseIndex = steps.slice(0, stepIndex + 1).filter((s) => s.stepType === 'exercise').length

  // Timer interval
  const intervalRef = useRef(null)
  const sessionTimerRef = useRef(null)
  const playerContainerRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown' || countdown <= 0) return
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [phase, countdown, clearTimer])

  // Advance from countdown to playing
  useEffect(() => {
    if (phase === 'countdown' && countdown === 0) {
      setPhase('playing')
      const step = steps[0]
      if (step?.stepType === 'exercise' && step.mode === 'timed') {
        setTimer(step.durationSec)
      } else if (step?.stepType === 'rest') {
        setTimer(step.durationSec)
      } else {
        setTimer(0)
      }
    }
  }, [phase, countdown, steps])

  // Exercise/rest timer
  useEffect(() => {
    if (phase !== 'playing' || isPaused || isEditingRest || isExitModalOpen || timer <= 0) return
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [phase, isPaused, isEditingRest, isExitModalOpen, timer, clearTimer])

  // Звуки: колокольчик в начале подхода и отдыха; перед концом таймера —
  // 5 сигналов у упражнения на время и 3 у отдыха (по одному в секунду).
  // Голос: на старте упражнения — название и техника, на отдыхе — какое упражнение следующее.
  const [soundOn, setSoundOnState] = useState(isSoundOn)
  const toggleSound = () => {
    if (soundOn) stopVoice()
    setSoundOn(!soundOn)
    setSoundOnState(!soundOn)
  }
  const voiceSrc = (exerciseId, prefix = '') => (voiceMap[exerciseId] ? `/voice/${prefix}${voiceMap[exerciseId]}.m4a` : null)
  useEffect(() => stopVoice, [])
  useEffect(() => {
    if (isPaused || isExitModalOpen || phase !== 'playing') stopVoice()
  }, [isPaused, isExitModalOpen, phase])
  const soundRef = useRef({ step: -1, timer: null })
  useEffect(() => {
    if (phase !== 'playing' || !currentStep) return
    const last = soundRef.current
    soundRef.current = { step: stepIndex, timer }
    if (last.step !== stepIndex) {
      playBell()
      if (currentStep.stepType === 'exercise') {
        playVoice(voiceSrc(currentStep.exerciseId))
      } else {
        const next = steps.slice(stepIndex + 1).find((s) => s.stepType === 'exercise')
        playVoice(next && voiceSrc(next.exerciseId, 'next-'))
      }
      return
    }
    // Сигнал — только когда таймер тикнул на секунду вниз (не после паузы или правки отдыха).
    if (timer !== last.timer - 1 || timer <= 0) return
    const beeps = currentStep.stepType === 'rest' ? 3 : currentStep.mode === 'timed' ? 5 : 0
    if (timer <= beeps) playBeep()
  }, [phase, stepIndex, timer, currentStep, steps])

  // Session elapsed timer
  useEffect(() => {
    if (phase !== 'playing' || isPaused || isExitModalOpen) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
      return
    }
    sessionTimerRef.current = setInterval(() => {
      setSessionElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }
  }, [phase, isPaused, isExitModalOpen])

  // Auto-advance when timed exercise or rest timer runs out
  useEffect(() => {
    if (phase !== 'playing' || isExitModalOpen || timer > 0) return
    if (currentStep?.stepType === 'rest') {
      advanceToNext()
    } else if (currentStep?.stepType === 'exercise' && currentStep.mode === 'timed') {
      advanceToNext()
    }
  }, [timer, phase, isExitModalOpen])

  function advanceToNext() {
    clearTimer()
    setIsPaused(false)

    // Mark current exercise as completed (dedup for StrictMode double-fire)
    if (currentStep?.stepType === 'exercise') {
      setCompletedStepIndexes((prev) => {
        if (prev.includes(stepIndex)) return prev
        const next = [...prev, stepIndex]
        if (programDay) {
          saveDayProgress(programDay, next, exerciseCount)
        }
        return next
      })
    }

    const nextIdx = stepIndex + 1
    if (nextIdx >= steps.length) {
      if (programDay) {
        markProgramDayDone(programDay)
      }
      addCompletedWorkout(id, workout?.title)
      haptic.success()
      setPhase('workoutReport')
    } else {
      setStepIndex(nextIdx)
      haptic.step()
      const nextStep = steps[nextIdx]
      if (nextStep.stepType === 'exercise' && nextStep.mode === 'timed') {
        setTimer(nextStep.durationSec)
      } else if (nextStep.stepType === 'rest') {
        setTimer(nextStep.durationSec)
      } else {
        setTimer(0)
      }
    }
  }

  function handlePause() {
    setIsPaused((p) => !p)
  }

  function handlePrev() {
    if (stepIndex === 0) return
    clearTimer()
    setIsPaused(false)
    const prevIdx = stepIndex - 1
    setStepIndex(prevIdx)
    const prevStep = steps[prevIdx]
    if (prevStep.stepType === 'exercise' && prevStep.mode === 'timed') {
      setTimer(prevStep.durationSec)
    } else if (prevStep.stepType === 'rest') {
      setTimer(prevStep.durationSec)
    } else {
      setTimer(0)
    }
  }

  function openExitModal() {
    if (currentStep?.stepType === 'exercise') {
      wasPlayingRef.current = !isPaused
      setIsPaused(true)
    } else {
      wasPlayingRef.current = !isEditingRest
    }
    setIsExitModalOpen(true)
  }

  function handleContinueSession() {
    if (currentStep?.stepType === 'exercise' && wasPlayingRef.current) {
      setIsPaused(false)
    }
    setIsExitModalOpen(false)
  }

  const resetSession = useCallback(() => {
    clearTimer()
    setIsPaused(false)
    setIsEditingRest(false)
    setCompletedStepIndexes([])
    setSessionElapsed(0)
    setStepIndex(0)
    const step = steps[0]
    if (step?.stepType === 'exercise' && step.mode === 'timed') {
      setTimer(step.durationSec)
    } else if (step?.stepType === 'rest') {
      setTimer(step.durationSec)
    } else {
      setTimer(0)
    }
  }, [clearTimer, steps])

  function handleRestartSession() {
    resetSession()
    setIsExitModalOpen(false)
  }

  function handleRestartFromReport() {
    resetSession()
    setPhase('playing')
  }

  function handleFinishAndExit() {
    setIsExitModalOpen(false)
    setPhase('exitSurvey')
  }

  function handleReturnFromSurvey() {
    if (currentStep?.stepType === 'exercise' && wasPlayingRef.current) {
      setIsPaused(false)
    }
    setPhase('playing')
  }

  function recordExitReason(reason) {
    if (!reason) return
    try {
      const raw = localStorage.getItem('exitReasons')
      const arr = raw ? JSON.parse(raw) : []
      arr.push({
        reason,
        dayId: id,
        programDay: programDay ?? null,
        percent: exerciseCount > 0
          ? Math.round((completedStepIndexes.length / exerciseCount) * 100)
          : 0,
        ts: Date.now(),
      })
      localStorage.setItem('exitReasons', JSON.stringify(arr))
    } catch {
      // localStorage unavailable — silently skip
    }
  }

  function handleExitWithReason(reason) {
    recordExitReason(reason)
    // Начатая, но брошенная тренировка — жёлтый день в календаре профиля.
    if (sessionElapsed > 0 || completedStepIndexes.length > 0) {
      const percent = exerciseCount > 0 ? Math.round((completedStepIndexes.length / exerciseCount) * 100) : 0
      addPartialWorkout(id, workout?.title, percent)
    }
    navigate('/progress', { replace: true })
  }

  useEffect(() => {
    if (!isExitModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') handleContinueSession()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isExitModalOpen])

  useEffect(() => {
    if (phase !== 'exitSurvey') return
    const onKey = (e) => {
      if (e.key === 'Escape') handleReturnFromSurvey()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  function handleAddTime() {
    setTimer((prev) => prev + 20)
  }

  function handleStartEditRest() {
    setIsEditingRest(true)
  }

  function handleFinishEditRest(newSeconds) {
    setTimer(newSeconds)
    setIsEditingRest(false)
  }

  function handleCloseReport() {
    navigate('/progress', { replace: true })
  }

  function handleFullscreen() {
    if (!playerContainerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      playerContainerRef.current.requestFullscreen()
    }
  }

  function formatSessionTime() {
    const min = Math.floor(sessionElapsed / 60)
    const sec = sessionElapsed % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  // Segment progress computation
  const currentExZeroBased = exerciseIndex - 1
  let currentSegmentFill = 0
  if (currentStep?.stepType === 'exercise') {
    if (currentStep?.mode === 'timed' && currentStep.durationSec > 0) {
      currentSegmentFill = (currentStep.durationSec - timer) / currentStep.durationSec
    } else {
      currentSegmentFill = 1
    }
  } else if (currentStep?.stepType === 'rest') {
    currentSegmentFill = 1
  }

  if (!workout) {
    return (
      <div className="p-4 text-gray-900 bg-white min-h-screen flex items-center justify-center">
        <p>Тренировка не найдена</p>
      </div>
    )
  }

  // Countdown phase
  if (phase === 'countdown') {
    return (
      <div className="flex flex-col min-h-screen bg-white text-gray-900 items-center justify-center">
        <p className="text-2xl text-gray-500 mb-4">Приготовьтесь</p>
        <div className="text-9xl font-bold">{countdown}</div>
      </div>
    )
  }

  // Exit-survey (retention) phase
  if (phase === 'exitSurvey') {
    const reasons = [
      'Техника упражнений была непонятна',
      'Нагрузка показалась слишком лёгкой',
      'Нагрузка оказалась слишком высокой',
      'Хотелось посмотреть тренировку до начала',
    ]
    return (
      <div className="fixed inset-0 z-50 bg-neutral-950 text-white overflow-y-auto">
        <div
          className="min-h-full flex flex-col max-w-md mx-auto px-6"
          style={{
            paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            onClick={handleReturnFromSurvey}
            className="self-start flex items-center gap-2 py-2 -ml-2 text-white/80 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 rounded-full"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="font-semibold text-base">Продолжить тренировку</span>
          </button>

          <div className="flex-1 flex flex-col justify-center items-center text-center gap-5 py-8">
            <h1 className="text-white font-bold text-3xl leading-tight max-w-xs">
              Точно завершить тренировку?
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              Подскажите причину — так мы поймём, что улучшить.
            </p>

            <div className="w-full max-w-sm flex flex-col gap-3 mt-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => handleExitWithReason(r)}
                  className="w-full rounded-full bg-white/10 text-white font-medium py-4 px-5 text-center hover:bg-white/[0.13] active:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
                >
                  {r}
                </button>
              ))}

              <div className="w-full h-px bg-white/10 my-1" />

              <button
                onClick={() => handleExitWithReason(null)}
                className="w-full rounded-full bg-white/10 text-white font-semibold py-4 hover:bg-white/[0.13] active:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Report phase
  if (phase === 'workoutReport') {
    return (
      <WorkoutReport
        streak={progress.streak || 0}
        completedDates={progress.completedDates || []}
        onRestart={handleRestartFromReport}
        onClose={handleCloseReport}
      />
    )
  }

  // Playing phase — shared overlay header for exercise and rest
  const isRest = currentStep?.stepType === 'rest'

  // Next exercise for rest preview
  const nextExStepIndex = steps.slice(stepIndex + 1).findIndex((s) => s.stepType === 'exercise')
  const nextExStep = nextExStepIndex !== -1 ? steps[stepIndex + 1 + nextExStepIndex] : null
  const nextExData = nextExStep ? { ...data.exercises[nextExStep.exerciseId], exerciseId: nextExStep.exerciseId } : null
  const nextExNum = isRest ? exerciseIndex + 1 : null
  const nextDurationLabel = nextExStep?.mode === 'timed'
    ? `${nextExStep.durationSec} сек`
    : nextExStep?.reps
      ? `${nextExStep.reps} повт.`
      : ''

  return (
    <div ref={playerContainerRef} className={`fixed inset-0 z-10 ${isRest ? 'bg-neutral-950' : 'bg-white'}`}>
      {isRest ? (
        <RestScreen
          timer={timer}
          onSkip={advanceToNext}
          onAddTime={handleAddTime}
          nextExercise={nextExData}
          nextExerciseNum={nextExNum}
          totalExercises={exerciseCount}
          nextDurationLabel={nextDurationLabel}
          isEditing={isEditingRest}
          onStartEdit={handleStartEditRest}
          onFinishEdit={handleFinishEditRest}
          isLandscape={isLandscape}
        />
      ) : (
        <ExercisePlayer
          exercise={{ ...data.exercises[currentStep.exerciseId], ...currentStep }}
          exerciseIndex={exerciseIndex}
          totalExercises={exerciseCount}
          timer={timer}
          isPaused={isPaused}
          isTimed={currentStep.mode === 'timed'}
          isLandscape={isLandscape}
          canPrev={stepIndex > 0}
          isPanelCollapsed={isPanelCollapsed}
          onPause={handlePause}
          onNext={advanceToNext}
          onPrev={handlePrev}
        />
      )}

      {/* Overlay header — context-aware palette */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-12 px-4">
        {/* Segment progress bar */}
        <div className="flex gap-1 pb-2">
          {Array.from({ length: exerciseCount }).map((_, i) => {
            const isPast = i < currentExZeroBased
            const isCurrent = i === currentExZeroBased
            const fill = isPast ? 100 : isCurrent ? currentSegmentFill * 100 : 0
            return (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full overflow-hidden ${isRest ? 'bg-white/20' : 'bg-neutral-300'}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isRest ? 'bg-white' : 'bg-neutral-900'}`}
                  style={{ width: `${Math.max(0, Math.min(100, fill))}%` }}
                />
              </div>
            )
          })}
        </div>

        {/* Header row */}
        <div className="relative flex items-center justify-between py-2">
          <button
            onClick={openExitModal}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 ${
              isRest
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'bg-neutral-200/70 text-neutral-800 hover:bg-neutral-300/70'
            }`}
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {!isLandscape && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className={`font-semibold text-sm whitespace-nowrap ${isRest ? 'text-white' : 'text-neutral-900'}`}>
                Упражнение {Math.max(exerciseIndex, 1)} из {exerciseCount}
              </span>
              <span className={`text-xs tabular-nums ${isRest ? 'text-white/60' : 'text-neutral-700'}`}>
                {formatSessionTime()}
              </span>
            </div>
          )}

          <div className="absolute right-0 top-2 flex flex-col items-center gap-2">
            <button
              onClick={handleFullscreen}
              className={`${IN_TELEGRAM ? 'hidden' : ''} w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 ${
                isRest
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-neutral-200/70 text-neutral-800 hover:bg-neutral-300/70'
              }`}
              aria-label="На весь экран"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
            <button
              onClick={toggleOrientation}
              className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 ${
                isRest
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-neutral-200/70 text-neutral-800 hover:bg-neutral-300/70'
              }`}
              aria-label={isLandscape ? 'Вернуть вертикальный вид' : 'Горизонтальный вид'}
            >
              {isLandscape ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="9" width="15" height="8" rx="1.6" />
                  <circle cx="6" cy="13" r="0.7" fill="currentColor" stroke="none" />
                  <path d="M14 5 A6 6 0 0 1 21 8" />
                  <polyline points="17 3 21 8 16 8" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="7" y="3.5" width="8" height="15" rx="1.6" />
                  <circle cx="11" cy="16" r="0.7" fill="currentColor" stroke="none" />
                  <path d="M19 10 A6 6 0 0 1 16 17" />
                  <polyline points="21 14 16 17 15 12" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleSound}
              className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 ${
                isRest
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-neutral-200/70 text-neutral-800 hover:bg-neutral-300/70'
              }`}
              aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
              aria-pressed={soundOn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
                {soundOn ? (
                  <>
                    <path d="M15.5 9a4 4 0 0 1 0 6" />
                    <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                  </>
                ) : (
                  <>
                    <line x1="16" y1="9.5" x2="21" y2="14.5" />
                    <line x1="21" y1="9.5" x2="16" y2="14.5" />
                  </>
                )}
              </svg>
            </button>
            {!isRest && !isLandscape && (
              <button
                onClick={() => setIsPanelCollapsed((v) => !v)}
                className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 ${
                  isRest
                    ? 'bg-white/15 text-white hover:bg-white/25'
                    : 'bg-neutral-200/70 text-neutral-800 hover:bg-neutral-300/70'
                }`}
                aria-label={isPanelCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
              >
                {isPanelCollapsed ? (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ) : (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isExitModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center px-6">
            <div className="w-full max-w-xs flex flex-col items-center gap-6 text-center">
              <h2 className="text-white font-bold text-2xl leading-tight">
                Вы уже проделали большую работу
              </h2>

              <div className="flex flex-col items-center gap-1">
                <p className="text-white/70 text-base">
                  Выполнено <span className="text-amber-600 font-bold">
                    {exerciseCount > 0 ? Math.round((completedStepIndexes.length / exerciseCount) * 100) : 0}%
                  </span>
                </p>
                <p className="text-white/70 text-base">
                  Осталось упражнений:{' '}
                  <span className="text-amber-600 font-bold">
                    {Math.max(0, exerciseCount - completedStepIndexes.length)}
                  </span>
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  onClick={handleContinueSession}
                  className="h-14 rounded-full bg-white text-neutral-900 font-semibold text-base hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
                >
                  Продолжить тренировку
                </button>
                <button
                  onClick={handleRestartSession}
                  className="h-14 rounded-full bg-white/10 text-white font-semibold text-base hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
                >
                  Начать сначала
                </button>
                <button
                  onClick={handleFinishAndExit}
                  className="py-3 text-white/60 font-medium text-base hover:text-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 rounded-full"
                >
                  Завершить и выйти
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
