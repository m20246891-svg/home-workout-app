import { useState, useCallback } from 'react'
import { get, set } from '../utils/storage'

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function localTodayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function recalculateStreak(prevProgress, today) {
  if (!prevProgress.lastCompletedDate) return 1

  const last = new Date(prevProgress.lastCompletedDate + 'T00:00:00')
  const now = new Date(today + 'T00:00:00')
  const diff = Math.round((now - last) / (1000 * 60 * 60 * 24))

  if (diff === 0) return prevProgress.streak
  if (diff === 1) return prevProgress.streak + 1
  return 1
}

function defaultProgress() {
  return { completedWorkouts: [], streak: 0, lastCompletedDate: null, completedDates: [], onboarding: null }
}

export default function useLocalProgress() {
  const [progress, setProgress] = useState(() => {
    return get('progress') || defaultProgress()
  })

  const addCompletedWorkout = useCallback((workoutId) => {
    const today = todayString()
    const localToday = localTodayString()
    const prev = get('progress') || defaultProgress()

    const completedWorkouts = [...(prev.completedWorkouts || []), { workoutId, date: today }]
    const streak = recalculateStreak(prev, today)
    const prevDates = Array.isArray(prev.completedDates) ? prev.completedDates : []
    const completedDates = prevDates.includes(localToday)
      ? prevDates
      : [...prevDates, localToday]
    const newProgress = { ...prev, completedWorkouts, streak, lastCompletedDate: today, completedDates }

    set('progress', newProgress)
    setProgress(newProgress)
    return newProgress
  }, [])

  const refresh = useCallback(() => {
    const data = get('progress') || defaultProgress()
    setProgress(data)
    return data
  }, [])

  const resetProgress = useCallback(() => {
    set('progress', defaultProgress())
    setProgress(defaultProgress())
  }, [])

  return { progress, addCompletedWorkout, refresh, resetProgress }
}
