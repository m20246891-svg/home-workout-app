// Инвентарь в 28-дневном плане: что нужно для дня и как убрать упражнения,
// если чего-то нет. Выбор «нет гантелей» — один на весь план.
// Стул не указываем: он есть в каждом доме.
import { get, set } from './storage'

// Какой инвентарь нужен упражнению. Коврик — желателен, но без него упражнение выполнимо.
const EXERCISE_GEAR = {
  'dumbbell-seated-overhead-press': 'dumbbells',
  'dumbbell-curl': 'dumbbells',
  'hand-plank': 'mat',
  'bodyweight-russian-twist': 'mat',
  supermans: 'mat',
}

export const GEAR = {
  dumbbells: { label: 'Гантели', icon: '🏋️', missingLabel: 'Нет гантелей', removable: true },
  mat: { label: 'Коврик', icon: '🧘', removable: false },
}
const ORDER = ['dumbbells', 'mat']

export const getMissingGear = () => (get('planSettings')?.missingGear || []).filter((g) => GEAR[g]?.removable)

export function setMissingGear(missing) {
  set('planSettings', { ...(get('planSettings') || {}), missingGear: missing })
}

const exercisesOf = (workout) =>
  (workout?.blocks || []).flatMap((b) => b.items.filter((i) => i.type === 'exercise').map((i) => i.exerciseId))

// Инвентарь тренировки в порядке важности.
export function workoutGear(workout) {
  const used = new Set(exercisesOf(workout).map((id) => EXERCISE_GEAR[id]).filter(Boolean))
  return ORDER.filter((g) => used.has(g))
}

// Тренировка без упражнений на недостающий инвентарь (и без отдыха сразу после них).
export function withoutGear(workout, missing = getMissingGear()) {
  if (!workout || !missing.length) return workout
  const blocks = workout.blocks
    .map((block) => {
      const items = []
      let skipRest = false
      for (const item of block.items) {
        if (item.type === 'exercise' && missing.includes(EXERCISE_GEAR[item.exerciseId])) {
          skipRest = true
          continue
        }
        if (item.type === 'rest' && skipRest) {
          skipRest = false
          continue
        }
        skipRest = false
        items.push(item)
      }
      return { ...block, items }
    })
    .filter((block) => block.items.some((i) => i.type === 'exercise'))
  return { ...workout, blocks }
}

// Примерная длительность тренировки в секундах (повторения — ~3 с на повтор).
function workoutSeconds(workout) {
  return (workout?.blocks || []).reduce(
    (sum, b) => sum + b.repeat * b.items.reduce((s, i) => s + (i.durationSec || (i.reps || 0) * 3), 0),
    0,
  )
}

// Во сколько раз тренировка стала короче — чтобы пересчитать минуты и калории на карточке.
export function gearRatio(workout, missing = getMissingGear()) {
  const full = workoutSeconds(workout)
  return full ? workoutSeconds(withoutGear(workout, missing)) / full : 1
}
