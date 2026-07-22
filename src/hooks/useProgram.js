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
  return { startDate: null, completedDays: [] }
}

export default function useProgram() {
  const [program, setProgram] = useState(() => get('program') || defaultProgram())

  const startProgram = useCallback(() => {
    const today = todayString()
    const updated = { startDate: today, completedDays: [] }
    set('program', updated)
    setProgram(updated)
  }, [])

  const getCurrentProgramDay = useCallback(() => {
    if (!program.startDate) return 0
    const diff = daysBetween(program.startDate, todayString())
    const day = Math.min(Math.max(diff + 1, 1), 28)
    return day
  }, [program.startDate])

  const markProgramDayDone = useCallback((day) => {
    const prev = get('program') || defaultProgram()
    if (prev.completedDays.includes(day)) return
    const completedDays = [...prev.completedDays, day]
    const updated = { ...prev, completedDays }
    set('program', updated)
    setProgram(updated)
  }, [])

  const refresh = useCallback(() => {
    const data = get('program') || defaultProgram()
    setProgram(data)
    return data
  }, [])

  return { program, startProgram, getCurrentProgramDay, markProgramDayDone, refresh }
}
