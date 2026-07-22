import { useState, useCallback } from 'react'
import { get, set } from '../utils/storage'

function todayString() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function daysBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

function defaultProgram() {
  return { startDate: null, completedDays: [], dayProgress: {} }
}

export default function useProgram() {
  const [program, setProgram] = useState(() => get('program') || defaultProgram())

  const startProgram = useCallback(() => {
    const today = todayString()
    const updated = { startDate: today, completedDays: [], dayProgress: {} }
    set('program', updated)
    setProgram(updated)
  }, [])

  const getCurrentAvailableDay = useCallback(() => {
    if (!program.startDate) return 1
    const maxCompleted = program.completedDays.length > 0
      ? Math.max(...program.completedDays)
      : 0
    return Math.min(maxCompleted + 1, 28)
  }, [program.startDate, program.completedDays])

  const markProgramDayDone = useCallback((day) => {
    const prev = get('program') || defaultProgram()
    if (prev.completedDays.includes(day)) return
    const completedDays = [...prev.completedDays, day]
    // Remove partial progress for completed day
    const dayProgress = { ...(prev.dayProgress || {}) }
    delete dayProgress[String(day)]
    const updated = { ...prev, completedDays, dayProgress }
    set('program', updated)
    setProgram(updated)
  }, [])

  const saveDayProgress = useCallback((day, completedExercises, totalExercises) => {
    const prev = get('program') || defaultProgram()
    if (prev.completedDays.includes(day)) return // don't save if already completed
    const dayProgress = { ...(prev.dayProgress || {}) }
    dayProgress[String(day)] = { completedExercises, totalExercises }
    const updated = { ...prev, dayProgress }
    set('program', updated)
    setProgram(updated)
  }, [])

  const refresh = useCallback(() => {
    const data = get('program') || defaultProgram()
    setProgram(data)
    return data
  }, [])

  return { program, startProgram, getCurrentAvailableDay, markProgramDayDone, saveDayProgress, refresh }
}
