import data from '../data/workouts.json'
import { get, set } from './storage'

// Генератор персональной тренировки дня.
// Работает по правилам (без сервера): состояние + цель + уровень + область + инвентарь
// → тренировка в том же формате, что и тренировки программы (blocks/items).

const STORAGE_KEY = 'generatedWorkout'
export const GENERATED_PREFIX = 'gen-'

const EACH_LEG = 'на каждую ногу'
const EACH_SIDE = 'на каждую сторону'

// Справочник для подбора: только MoveKit-упражнения.
// zone — что тренирует, intensity 1–3, kcal — ккал в минуту работы.
const POOL = {
  'bodyweight-squat': { zones: ['legs', 'glutes'], intensity: 2, kcal: 8 },
  'jump-squats': { zones: ['legs', 'glutes', 'cardio'], intensity: 3, kcal: 11 },
  'forward-lunge': { zones: ['legs', 'glutes'], intensity: 2, kcal: 8, note: EACH_LEG },
  'push-up': { zones: ['chest', 'arms'], intensity: 2, kcal: 8 },
  'bench-dips': { zones: ['arms'], intensity: 2, kcal: 7, gear: 'chair' },
  'hand-plank': { zones: ['core'], intensity: 1, kcal: 5, gear: 'mat' },
  'bodyweight-russian-twist': { zones: ['core'], intensity: 1, kcal: 6, gear: 'mat' },
  'supermans': { zones: ['back', 'core', 'glutes'], intensity: 1, kcal: 5, gear: 'mat' },
  'bodyweight-hip-abduction': { zones: ['glutes'], intensity: 1, kcal: 5, gear: 'mat', note: EACH_SIDE },
  'bodyweight-donkey-calf-raise': { zones: ['legs'], intensity: 1, kcal: 5, gear: 'step' },
  'dumbbell-seated-overhead-press': { zones: ['shoulders', 'arms'], intensity: 2, kcal: 7, gear: 'dumbbells' },
  'dumbbell-curl': { zones: ['arms'], intensity: 1, kcal: 6, gear: 'dumbbells' },
}
const REST_KCAL = 3

export const MOODS = [
  { id: 'great', label: 'Я в отличном состоянии', hint: 'Добавим интенсивности' },
  { id: 'tired', label: 'Устал, хочу лёгких движений', hint: 'Без прыжков, больше отдыха' },
  { id: 'stressed', label: 'В стрессе, нужно расслабиться', hint: 'Спокойный темп, кор и спина' },
  { id: 'normal', label: 'Ничего особенного', hint: 'Обычная тренировка' },
]

export const FOCUSES = [
  { id: 'full', label: 'Всё тело', zones: null },
  { id: 'core', label: 'Пресс', zones: ['core', 'back'] },
  { id: 'arms', label: 'Руки', zones: ['arms', 'shoulders'] },
  { id: 'upper', label: 'Верх тела', zones: ['chest', 'arms', 'shoulders', 'back', 'core'] },
  { id: 'legs', label: 'Ноги', zones: ['legs'] },
  { id: 'glutes', label: 'Ягодицы', zones: ['glutes'] },
]

export const LEVELS = [
  { id: 'beginner', label: 'Новичок' },
  { id: 'intermediate', label: 'Средний' },
  { id: 'advanced', label: 'Продвинутый' },
]

export const GEAR_LABELS = {
  mat: 'Коврик',
  chair: 'Стул',
  step: 'Ступенька',
  dumbbells: 'Гантели',
}

const LEVEL_BASE = {
  beginner: { work: 30, rest: 20, perRound: 4 },
  intermediate: { work: 40, rest: 15, perRound: 5 },
  advanced: { work: 45, rest: 15, perRound: 5 },
}

export const DURATION_MIN = 5
export const DURATION_MAX = 30

// Детерминированный ГСЧ, чтобы «Не устраивает?» давал новую, но воспроизводимую подборку.
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(arr, rnd) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function ex(exerciseId, durationSec) {
  const item = { type: 'exercise', exerciseId, mode: 'timed', durationSec }
  if (POOL[exerciseId].note) item.note = POOL[exerciseId].note
  return item
}

function rest(durationSec) {
  return { type: 'rest', durationSec }
}

export function localDateString(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function defaultSettings() {
  const onboarding = get('onboarding') || {}
  const saved = get('generatorSettings') || {}
  return {
    durationMin: 15,
    focus: 'full',
    level: onboarding.level || 'beginner',
    warmup: true,
    cooldown: true,
    dumbbells: onboarding.equipment === 'dumbbells',
    ...saved,
  }
}

export function saveSettings(settings) {
  set('generatorSettings', settings)
}

const MIN_PER_ROUND = 3
// Чем добирать круг, если в выбранной зоне мало упражнений (например, «Руки» без гантелей).
const FALLBACK_ZONES = {
  arms: ['chest', 'core'],
  core: ['back', 'glutes'],
  legs: ['glutes'],
  glutes: ['legs'],
}

function pickMain({ focus, dumbbells, allowJumps, wantJumps, calm, count }, rnd) {
  const focusZones = FOCUSES.find((f) => f.id === focus)?.zones
  const available = (id) => {
    const p = POOL[id]
    if (p.gear === 'dumbbells' && !dumbbells) return false
    if (!allowJumps && p.intensity === 3) return false
    return true
  }
  const inZones = (zones) => (id) => !zones || POOL[id].zones.some((z) => zones.includes(z))

  let ids = Object.keys(POOL).filter((id) => available(id) && inZones(focusZones)(id))

  if (calm) {
    // Спокойный режим: сначала упражнения низкой интенсивности.
    const light = ids.filter((id) => POOL[id].intensity === 1)
    if (light.length >= MIN_PER_ROUND) ids = light
  }

  const shuffled = shuffle(ids, rnd)
  const picked = []
  const add = (id) => {
    if (id && !picked.includes(id) && picked.length < count) picked.push(id)
  }

  // Кардио-упражнение, когда оно уместно (отличное состояние или цель «похудеть»).
  if (wantJumps) add(shuffled.find((id) => POOL[id].intensity === 3))

  if (focus === 'full') {
    // Всё тело: гарантируем ноги, верх и кор в каждом круге.
    add(shuffled.find((id) => POOL[id].zones.includes('legs') && !picked.includes(id)))
    add(shuffled.find((id) => POOL[id].zones.some((z) => ['chest', 'arms', 'shoulders'].includes(z))))
    add(shuffled.find((id) => POOL[id].zones.includes('core')))
  }
  shuffled.forEach(add)

  if (picked.length < MIN_PER_ROUND) {
    const extra = shuffle(Object.keys(POOL).filter((id) =>
      available(id) && inZones(FALLBACK_ZONES[focus])(id) && (!calm || POOL[id].intensity < 3)), rnd)
    for (const id of extra) {
      if (picked.length >= MIN_PER_ROUND) break
      add(id)
    }
  }
  return picked
}

// Для похудения ставим кардио ближе к концу круга, чтобы держать пульс;
// в остальных случаях разводим одинаковые зоны подальше друг от друга.
function orderForFlow(ids, goal, allowJumps) {
  const jumps = ids.filter((id) => POOL[id].intensity === 3)
  const rest_ = ids.filter((id) => POOL[id].intensity !== 3)
  const ordered = []
  const byZone = [...rest_]
  while (byZone.length) {
    const prev = ordered[ordered.length - 1]
    const idx = byZone.findIndex((id) => !prev || POOL[id].zones[0] !== POOL[prev].zones[0])
    ordered.push(...byZone.splice(idx === -1 ? 0 : idx, 1))
  }
  if (goal === 'lose-weight' && allowJumps) return [...ordered, ...jumps]
  const mid = Math.ceil(ordered.length / 2)
  return [...ordered.slice(0, mid), ...jumps, ...ordered.slice(mid)]
}

function buildWarmup(focus, calm) {
  const upperFocus = ['arms', 'upper'].includes(focus)
  const items = calm
    ? [ex('bodyweight-squat', 30), rest(10), ex('supermans', 25), rest(10), ex('hand-plank', 20)]
    : upperFocus
      ? [ex('push-up', 20), rest(10), ex('bodyweight-squat', 30), rest(10), ex('supermans', 25)]
      : [ex('bodyweight-squat', 30), rest(10), ex('forward-lunge', 25), rest(10), ex('push-up', 20)]
  return { id: 'warmup', name: 'Разминка', repeat: 1, items: [...items, rest(15)] }
}

function buildCooldown() {
  return {
    id: 'cooldown',
    name: 'Заминка',
    repeat: 1,
    items: [
      ex('supermans', 30), rest(10),
      ex('bodyweight-hip-abduction', 30), rest(10),
      ex('bodyweight-donkey-calf-raise', 30),
    ],
  }
}

export function workoutStats(workout) {
  let totalSec = 0
  let kcal = 0
  let exerciseCount = 0
  const gear = new Set()
  for (const block of workout.blocks) {
    for (const item of block.items) {
      const sec = item.durationSec * block.repeat
      totalSec += sec
      if (item.type === 'exercise') {
        const p = POOL[item.exerciseId]
        exerciseCount += block.repeat
        kcal += ((p?.kcal ?? 6) * sec) / 60
        if (p?.gear) gear.add(p.gear)
      } else {
        kcal += (REST_KCAL * sec) / 60
      }
    }
  }
  return {
    totalSec,
    minutes: Math.max(1, Math.round(totalSec / 60)),
    kcal: Math.round(kcal / 5) * 5,
    exerciseCount,
    gear: ['mat', 'chair', 'step', 'dumbbells'].filter((g) => gear.has(g)),
  }
}

export function generateWorkout({ mood, settings, seed }) {
  const onboarding = get('onboarding') || {}
  const goal = onboarding.goal || 'keep-fit'
  const rnd = mulberry32(seed)
  const reasons = []

  const levelIdx = LEVELS.findIndex((l) => l.id === settings.level)
  let effectiveLevel = settings.level
  const base = { ...LEVEL_BASE[settings.level] }
  let allowJumps = true
  let calm = false

  if (mood === 'great') {
    base.work += 5
    base.rest = Math.max(10, base.rest - 5)
    reasons.push('Ты в форме — интервалы длиннее, отдых короче')
  } else if (mood === 'tired') {
    if (levelIdx > 0) effectiveLevel = LEVELS[levelIdx - 1].id
    const lighter = LEVEL_BASE[effectiveLevel]
    base.work = lighter.work - 5
    base.rest = lighter.rest + 10
    base.perRound = Math.min(base.perRound, 4)
    allowJumps = false
    reasons.push('Ты устал — без прыжков и с увеличенным отдыхом')
  } else if (mood === 'stressed') {
    base.rest += 10
    allowJumps = false
    calm = true
    reasons.push('Снимаем стресс — спокойный темп, упор на кор и спину')
  }

  if (goal === 'lose-weight' && allowJumps) {
    base.rest = Math.max(10, base.rest - 5)
    reasons.push('Цель «похудеть» — меньше отдыха, кардио в конце круга')
  } else if (goal === 'gain-strength') {
    base.work += 5
    reasons.push('Цель «сила» — дольше под нагрузкой')
  }

  if (!settings.dumbbells && ['arms', 'upper'].includes(settings.focus)) {
    reasons.push('Без гантелей — работаем с весом тела и стулом')
  }

  const mainIds = orderForFlow(pickMain({
    focus: settings.focus,
    dumbbells: settings.dumbbells,
    allowJumps,
    wantJumps: allowJumps && (mood === 'great' || goal === 'lose-weight'),
    calm,
    count: base.perRound,
  }, rnd), goal, allowJumps)

  const mainItems = []
  mainIds.forEach((id, i) => {
    mainItems.push(ex(id, base.work))
    mainItems.push(rest(i === mainIds.length - 1 ? base.rest + 10 : base.rest))
  })
  const roundSec = mainItems.reduce((s, it) => s + it.durationSec, 0)
  const rounds = Math.max(1, Math.round((settings.durationMin * 60) / roundSec))

  const blocks = []
  if (settings.warmup) blocks.push(buildWarmup(settings.focus, calm || mood === 'tired'))
  blocks.push({ id: 'main', name: 'Тренировка', repeat: rounds, items: mainItems })
  if (settings.cooldown) blocks.push(buildCooldown())

  const focusLabel = FOCUSES.find((f) => f.id === settings.focus)?.label
  const levelLabel = LEVELS.find((l) => l.id === effectiveLevel)?.label
  const today = localDateString()

  const workout = {
    id: `${GENERATED_PREFIX}${today}-${seed}`,
    title: `${focusLabel} · ${levelLabel}`,
    level: effectiveLevel,
    equipment: settings.dumbbells && mainIds.some((id) => POOL[id].gear === 'dumbbells') ? 'dumbbells' : 'none',
    description: 'Персональная тренировка на сегодня',
    generated: { date: today, mood, settings, seed, reasons },
    blocks,
  }
  const stats = workoutStats(workout)
  workout.durationMin = stats.minutes
  workout.kcal = stats.kcal
  return workout
}

export function saveGeneratedWorkout(workout) {
  set(STORAGE_KEY, workout)
}

export function getGeneratedWorkout(id) {
  const w = get(STORAGE_KEY)
  if (!w) return null
  if (id && w.id !== id) return null
  return w
}

export function getTodayGeneratedWorkout() {
  const w = get(STORAGE_KEY)
  return w && w.generated?.date === localDateString() ? w : null
}

// Поиск тренировки: каталог + сгенерированная тренировка дня.
export function findAnyWorkout(id) {
  for (const cat of data.categories) {
    const found = cat.workouts.find((w) => w.id === id)
    if (found) return found
  }
  if (id?.startsWith(GENERATED_PREFIX)) return getGeneratedWorkout(id)
  return null
}
