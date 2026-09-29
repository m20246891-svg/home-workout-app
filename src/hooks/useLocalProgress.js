import { useState, useCallback } from 'react'
import { get, set } from '../utils/storage'
import { localDate, computeStreak, earnFreeze } from '../utils/activity'

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function defaultProgress() {
  return {
    completedWorkouts: [],
    streak: 0,
    lastCompletedDate: null,
    completedDates: [],
    frozenDates: [],
    startedDates: [],
    partialWorkouts: [],
    onboarding: null,
  }
}

// Ударный режим всегда пересчитываем по датам: сохранённое значение устаревает, если был пропуск.
function withStreak(p) {
  const data = { ...defaultProgress(), ...p }
  return { ...data, streak: computeStreak(data.completedDates, localDate(), data.frozenDates).current }
}

function load() {
  return withStreak(get('progress') || {})
}

export default function useLocalProgress() {
  const [progress, setProgress] = useState(load)

  const save = useCallback((next) => {
    const data = withStreak(next)
    set('progress', data)
    setProgress(data)
    return data
  }, [])

  const addCompletedWorkout = useCallback((workoutId, title) => {
    const prev = load()
    const today = localDate()
    const completedWorkouts = [...prev.completedWorkouts, { workoutId, title, date: todayString(), localDate: today }]
    const firstToday = !prev.completedDates.includes(today)
    const completedDates = firstToday ? [...prev.completedDates, today] : prev.completedDates
    let next = { ...prev, completedWorkouts, completedDates, lastCompletedDate: today }
    if (firstToday) next = earnFreeze(next, computeStreak(completedDates, today, prev.frozenDates).current)
    return save(next)
  }, [save])

  // Тренировка начата, но брошена — для жёлтых дней в календаре.
  const addPartialWorkout = useCallback((workoutId, title, percent) => {
    const prev = load()
    const entry = { workoutId, title, percent, localDate: localDate() }
    return save({ ...prev, partialWorkouts: [...prev.partialWorkouts, entry] })
  }, [save])

  // Тренировка началась — день сразу жёлтый в календаре (зелёным станет после завершения).
  const markStarted = useCallback(() => {
    const prev = load()
    const today = localDate()
    if (prev.startedDates.includes(today)) return prev
    return save({ ...prev, startedDates: [...prev.startedDates, today] })
  }, [save])

  const refresh = useCallback(() => {
    const data = load()
    setProgress(data)
    return data
  }, [])

  const resetProgress = useCallback(() => {
    save(defaultProgress())
  }, [save])

  return { progress, addCompletedWorkout, addPartialWorkout, markStarted, refresh, resetProgress }
}
