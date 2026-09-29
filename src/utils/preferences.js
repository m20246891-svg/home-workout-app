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
  savePreferences({ ...answers, completedAt: new Date().toISOString() })
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
