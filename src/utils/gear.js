// Инвентарь в 28-дневном плане: что нужно для дня и чем заменить упражнения,
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

// Замена без инвентаря — из упражнений, для которых есть анимация и озвучка.
const SUBSTITUTES = {
  'dumbbell-seated-overhead-press': 'hand-plank', // плечи держат вес тела
  'dumbbell-curl': 'supermans', // спина — ближайшая замена тянущему движению
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

// Тренировка без недостающего инвентаря: упражнение заменяем, а если замены нет —
// убираем его вместе с отдыхом сразу после него.
export function withoutGear(workout, missing = getMissingGear()) {
  if (!workout || !missing.length) return workout
  const blocks = workout.blocks
    .map((block) => {
      const items = []
      let skipRest = false
      for (const item of block.items) {
        if (item.type === 'exercise' && missing.includes(EXERCISE_GEAR[item.exerciseId])) {
          const substitute = SUBSTITUTES[item.exerciseId]
          if (substitute) {
            items.push({ ...item, exerciseId: substitute })
            skipRest = false
          } else {
            skipRest = true
          }
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

// Во сколько раз тренировка стала короче (если упражнения убраны без замены) — чтобы пересчитать минуты и калории на карточке.
export function gearRatio(workout, missing = getMissingGear()) {
  const full = workoutSeconds(workout)
  return full ? workoutSeconds(withoutGear(workout, missing)) / full : 1
}
