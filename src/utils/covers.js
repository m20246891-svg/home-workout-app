// Обложки дней программы (public/img/day-<тип>-<n>.webp) — по типу тренировки, с чередованием вариаций.
const VARIANTS = { full: 2, upper: 2, lower: 2, core: 2, final: 1 }

export function dayType(workoutId = '') {
  if (workoutId === 'full-body-final') return 'final'
  if (workoutId.startsWith('upper-body')) return 'upper'
  if (workoutId.startsWith('lower-body')) return 'lower'
  if (workoutId.startsWith('core')) return 'core'
  return 'full'
}

export function dayCover(day) {
  const type = dayType(day.workoutId)
  const n = (Math.floor((day.day - 1) / 4) % VARIANTS[type]) + 1
  return `/img/day-${type}-${n}.webp`
}

// «День 4 — Кор и кардио» → «Кор и кардио»
export function daySubtitle(day) {
  return day.title?.split('—')[1]?.trim() || ''
}

export const PLAN_COVER = '/img/plan-full-body.webp'
export const GENERATOR_COVER = '/img/generator-coach.webp'
