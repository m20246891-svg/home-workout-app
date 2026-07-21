import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import data from '../data/workouts.json'
import ExercisePlayer from '../components/ExercisePlayer'
import RestScreen from '../components/RestScreen'

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

function findWorkout(id) {
  for (const cat of data.categories) {
    const found = cat.workouts.find((w) => w.id === id)
    if (found) return found
  }
  return null
}

export default function WorkoutPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const workout = findWorkout(id)

  const [{ steps, exerciseCount }, _] = useState(
    () => workout ? flattenSteps(workout.blocks) : { steps: [], exerciseCount: 0 }
  )

  const [phase, setPhase] = useState('countdown') // countdown | playing | complete
  const [countdown, setCountdown] = useState(3)
  const [stepIndex, setStepIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const currentStep = steps[stepIndex]
  const exerciseIndex = steps.slice(0, stepIndex + 1).filter((s) => s.stepType === 'exercise').length

  // Timer interval
  const intervalRef = useRef(null)

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
    if (phase !== 'playing' || isPaused || timer <= 0) return
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
  }, [phase, isPaused, timer, clearTimer])

  // Auto-advance when timed exercise or rest timer runs out
  useEffect(() => {
    if (phase !== 'playing' || timer > 0) return
    if (currentStep?.stepType === 'rest') {
      advanceToNext()
    } else if (currentStep?.stepType === 'exercise' && currentStep.mode === 'timed') {
      advanceToNext()
    }
  }, [timer, phase])

  function advanceToNext() {
    clearTimer()
    setIsPaused(false)
    const nextIdx = stepIndex + 1
    if (nextIdx >= steps.length) {
      setPhase('complete')
    } else {
      setStepIndex(nextIdx)
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

  function handleExit() {
    setShowExitModal(false)
    navigate(`/workout/${id}`)
  }

  function handleAddTime() {
    setTimer((prev) => prev + 20)
  }

  // Navigate to complete page
  useEffect(() => {
    if (phase === 'complete') {
      navigate(`/workout/${id}/complete`, { replace: true })
    }
  }, [phase, navigate, id])

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

  // Rest step
  if (currentStep?.stepType === 'rest') {
    const nextExerciseIdx = steps.slice(stepIndex + 1).findIndex((s) => s.stepType === 'exercise')
    const nextExercise = nextExerciseIdx !== -1
      ? data.exercises[steps[stepIndex + 1 + nextExerciseIdx].exerciseId]
      : null

    return (
      <>
        <RestScreen
          timer={timer}
          onSkip={advanceToNext}
          onAddTime={handleAddTime}
          nextExerciseName={nextExercise?.name || null}
        />
        {/* Exit button */}
        <button
          onClick={() => setShowExitModal(true)}
          className="fixed top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
        >
          ✕
        </button>
        {showExitModal && <ExitModal onConfirm={handleExit} onCancel={() => setShowExitModal(false)} />}
      </>
    )
  }

  // Exercise step
  if (currentStep?.stepType === 'exercise') {
    const exercise = data.exercises[currentStep.exerciseId]
    const isTimed = currentStep.mode === 'timed'

    return (
      <>
        <ExercisePlayer
          exercise={{ ...exercise, ...currentStep }}
          exerciseIndex={exerciseIndex}
          totalExercises={exerciseCount}
          timer={timer}
          isPaused={isPaused}
          isTimed={isTimed}
          onPause={handlePause}
          onNext={advanceToNext}
        />
        {/* Exit button */}
        <button
          onClick={() => setShowExitModal(true)}
          className="fixed top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
        >
          ✕
        </button>
        {showExitModal && <ExitModal onConfirm={handleExit} onCancel={() => setShowExitModal(false)} />}
      </>
    )
  }

  return null
}

function ExitModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Завершить тренировку?</h3>
        <p className="text-sm text-gray-500 mb-6">Весь прогресс в этой тренировке будет потерян.</p>
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Выйти
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  )
}
