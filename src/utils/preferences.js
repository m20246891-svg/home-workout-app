import { get, set, remove } from './storage'

// Ответы онбординга: общие варианты для онбординга, профиля и генератора.

export const GOAL_OPTIONS = [
  { value: 'lose-weight', label: 'Похудеть' },
  { value: 'keep-fit', label: 'Поддерживать форму' },
  { value: 'gain-strength', label: 'Набрать силу' },
]

// id совпадают с областями генератора (FOCUSES).
export const ZONE_OPTIONS = [
  { value: 'full', label: 'Всё тело' },
  { value: 'core', label: 'Пресс' },
  { value: 'arms', label: 'Руки' },
  { value: 'upper', label: 'Верх тела' },
  { value: 'legs', label: 'Ноги' },
  { value: 'glutes', label: 'Ягодицы' },
]

export const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
]

// Уровень через поведенческий вопрос — так точнее, чем самооценка.
export const PUSHUP_OPTIONS = [
  { value: 'beginner', label: '0–5', hint: 'Начнём с простого' },
  { value: 'intermediate', label: '6–15', hint: 'Хорошая база' },
  { value: 'advanced', label: 'Больше 15', hint: 'Готов к нагрузке' },
]

export const EQUIPMENT_OPTIONS = [
  { value: 'none', label: 'Ничего нет' },
  { value: 'mat', label: 'Коврик' },
  { value: 'chair', label: 'Стул' },
  { value: 'dumbbells', label: 'Гантели' },
]

export const TIME_OPTIONS = [
  { value: 10, label: '5–10 мин' },
  { value: 15, label: '10–20 мин' },
  { value: 25, label: '20–30 мин' },
]

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
]

// Формы тела: картинки в public/img/body-now-<пол>-<id>.webp и body-goal-<пол>-<n>.webp.
export const BODY_NOW_OPTIONS = {
  male: [
    { value: 'average', label: 'Средняя' },
    { value: 'soft', label: 'Полноватая' },
    { value: 'slim', label: 'Худощавая' },
    { value: 'muscular', label: 'Мускулистая' },
  ],
  female: [
    { value: 'average', label: 'Средняя' },
    { value: 'soft', label: 'Полноватая' },
    { value: 'slim', label: 'Худощавая' },
    { value: 'toned', label: 'Подтянутая' },
  ],
}

// Желаемая форма: 5 ступеней слайдера, fat — ориентир по проценту жира.
export const BODY_GOAL_STEPS = {
  male: [
    { label: 'Стройное', fat: '10–12%' },
    { label: 'Подтянутое', fat: '12–14%' },
    { label: 'Атлетичное', fat: '13–15%' },
    { label: 'Массивное', fat: '10–13%' },
    { label: 'Мощное', fat: '18–22%' },
  ],
  female: [
    { label: 'Стройное', fat: '18–20%' },
    { label: 'Подтянутое', fat: '20–22%' },
    { label: 'Атлетичное', fat: '18–21%' },
    { label: 'Рельефное', fat: '15–18%' },
    { label: 'Фигуристое', fat: '24–28%' },
  ],
}

export function bodyImage(kind, gender, id) {
  return `/img/body-${kind}-${gender === 'female' ? 'female' : 'male'}-${id}.webp`
}

export function calcBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  return weightKg / (heightCm / 100) ** 2
}

export function bmiCategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return { id: 'low', label: 'Ниже нормы', tone: 'text-sky-600', hint: 'Сделаем упор на силу и набор мышц' }
  if (bmi < 25) return { id: 'normal', label: 'Норма', tone: 'text-emerald-600', hint: 'У тебя отличная база — будем её укреплять' }
  if (bmi < 30) return { id: 'over', label: 'Выше нормы', tone: 'text-accent-dark', hint: 'Сочетание кардио и силы поможет прийти в форму' }
  return { id: 'high', label: 'Значительно выше нормы', tone: 'text-red-600', hint: 'Начнём мягко и без ударной нагрузки на суставы' }
}

export function ageFromYear(birthYear) {
  return birthYear ? new Date().getFullYear() - birthYear : null
}

// «Для мужчин 30-х лет» — подпись для персонального экрана.
export function ageGroupTitle(gender, birthYear) {
  const age = ageFromYear(birthYear)
  if (!age) return 'Для тебя'
  const decade = Math.max(10, Math.floor(age / 10) * 10)
  const who = gender === 'female' ? 'женщин' : 'мужчин'
  return `Для ${who} ${decade}-х лет`
}

export function insightText({ bmi, goal }) {
  const cat = bmiCategory(bmi)
  const range = cat
    ? { low: 'ИМТ ниже 18.5', normal: 'ИМТ 18.5–24.9', over: 'ИМТ 25–29.9', high: 'ИМТ от 30' }[cat.id]
    : ''
  const plan = {
    'lose-weight': 'регулярные короткие тренировки, где кардио сочетается с силовыми упражнениями, — так уходит лишний жир и сохраняются мышцы.',
    'gain-strength': 'силовые упражнения с постепенным ростом нагрузки и достаточным отдыхом между подходами.',
    'keep-fit': 'сбалансированные тренировки на всё тело 3–5 раз в неделю — это держит тонус и энергию.',
  }[goal] || 'регулярные тренировки на всё тело с плавным ростом нагрузки.'
  return range ? `При ${range} лучше всего работают ${plan}` : `Лучше всего работают ${plan}`
}

// Раньше equipment был строкой ('none' | 'dumbbells' | 'mat'), теперь — массив.
export function normalizeEquipment(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value) return [value]
  return []
}

export function getPreferences() {
  const raw = get('onboarding') || {}
  return {
    ...raw,
    equipment: normalizeEquipment(raw.equipment),
    zones: Array.isArray(raw.zones) ? raw.zones : [],
  }
}

export function savePreferences(prefs) {
  set('onboarding', prefs)
}

// Область генератора по умолчанию: «Всё тело», если выбрано, иначе первая выбранная зона.
export function defaultFocus(zones) {
  if (!zones?.length || zones.includes('full')) return 'full'
  return zones[0]
}

export function completeOnboarding(answers, profile) {
  const prevPrefs = get('onboarding') || {}
  const now = new Date().toISOString()
  // firstCompletedAt — первое прохождение: с него календарь считает пропуски (повторный онбординг его не сдвигает).
  savePreferences({ ...answers, completedAt: now, firstCompletedAt: prevPrefs.firstCompletedAt || prevPrefs.completedAt || now })
  // Новые ответы важнее старых ручных настроек генератора.
  remove('generatorSettings')

  const prev = get('userProfile') || {}
  set('userProfile', {
    name: '',
    age: '',
    gender: '',
    avatarSeed: Math.floor(Math.random() * 2147483647),
    ...prev,
    ...Object.fromEntries(Object.entries(profile || {}).filter(([, v]) => v !== '' && v != null)),
  })
}
