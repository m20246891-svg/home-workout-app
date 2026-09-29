// Раздел «Питание»: норма КБЖУ, рацион на 30 дней из клубной базы блюд, порции и покупки.
// Всё считается локально — без сети и внешних API.
import { get, set } from './storage'
import { getPreferences, ageFromYear } from './preferences'
import { localDate, addDays, parseDate } from './activity'

const PLAN_KEY = 'mealPlan'
export const PLAN_DAYS = 30
export const MEAL_TYPES = [
  { id: 'b', label: 'Завтрак', icon: '🌅', share: 0.27 },
  { id: 'l', label: 'Обед', icon: '🥗', share: 0.37 },
  { id: 'd', label: 'Ужин', icon: '🍽️', share: 0.36 },
]

// База блюд грузится лениво — только когда открыт раздел «Питание».
let mealsPromise
export function loadMeals() {
  mealsPromise ||= import('../data/meals.json').then((m) => {
    const data = m.default
    return { ...data, byId: Object.fromEntries(data.dishes.map((d) => [d.id, d])) }
  })
  return mealsPromise
}

// ── Норма ───────────────────────────────────────────────────────────────────
const GOAL_FACTOR = { 'lose-weight': 0.85, 'keep-fit': 1, 'gain-strength': 1.1 }
const PROTEIN_PER_KG = { 'lose-weight': 2, 'keep-fit': 1.6, 'gain-strength': 1.8 }
// Домашние тренировки 3–5 раз в неделю — лёгкая/умеренная активность.
const ACTIVITY = 1.4

export function nutritionInputs() {
  const prefs = getPreferences()
  const profile = get('userProfile') || {}
  const gender = prefs.gender || profile.gender || null
  const age = ageFromYear(prefs.birthYear) || Number(profile.age) || null
  return {
    gender,
    age,
    heightCm: Number(prefs.heightCm) || null,
    weightKg: Number(prefs.weightKg) || null,
    goal: prefs.goal || 'keep-fit',
  }
}

export function calcTargets({ gender, age, heightCm, weightKg, goal }) {
  if (!gender || !age || !heightCm || !weightKg) return null
  // Формула Миффлина — Сан Жеора.
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'female' ? -161 : 5)
  const tdee = bmr * ACTIVITY
  const floor = gender === 'female' ? 1200 : 1500
  const kcal = Math.max(floor, Math.round((tdee * (GOAL_FACTOR[goal] ?? 1)) / 50) * 50)

  // При лишнем весе белок считаем от веса при ИМТ 25, иначе норма завышается.
  const bmi = weightKg / (heightCm / 100) ** 2
  const refWeight = bmi > 27 ? 25 * (heightCm / 100) ** 2 : weightKg
  const protein = Math.round(refWeight * (PROTEIN_PER_KG[goal] ?? 1.6))
  const fat = Math.round((kcal * 0.3) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, fat, carbs, bmr: Math.round(bmr), tdee: Math.round(tdee) }
}

// ── Порции ──────────────────────────────────────────────────────────────────
const MIN_SCALE = 0.6
const MAX_SCALE = 1.8

function roundGrams(g) {
  if (g < 10) return Math.max(1, Math.round(g))
  return Math.round(g / 5) * 5
}

// Блюдо, пересчитанное под калорийность приёма пищи.
export function scaleDish(dish, mealKcal) {
  const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, mealKcal / dish.kcal))
  return {
    ...dish,
    scale: k,
    kcal: Math.round(dish.kcal * k),
    p: Math.round(dish.p * k),
    f: Math.round(dish.f * k),
    cb: Math.round(dish.cb * k),
    w: roundGrams(dish.w * k),
    // Соль и специи в граммах до 3 г не масштабируем — «по вкусу».
    ing: dish.ing.map((i) => ({ ...i, g: i.g <= 3 ? i.g : roundGrams(i.g * k) })),
  }
}

export function dayMenu(plan, dayIndex, meals, targets) {
  const ids = plan.days[dayIndex]
  if (!ids) return null
  const items = MEAL_TYPES.map((type, i) => {
    const dish = meals.byId[ids[i]]
    if (!dish) return null
    return { type, dish: targets ? scaleDish(dish, targets.kcal * type.share) : dish }
  }).filter(Boolean)
  const total = items.reduce(
    (acc, { dish }) => ({ kcal: acc.kcal + dish.kcal, p: acc.p + dish.p, f: acc.f + dish.f, cb: acc.cb + dish.cb }),
    { kcal: 0, p: 0, f: 0, cb: 0 },
  )
  return { items, total }
}

// ── Составление рациона ─────────────────────────────────────────────────────
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

// Сезонность: блюда текущего месяца в приоритете, соседних — чуть реже.
function seasonWeight(dishMonth, month) {
  const dist = Math.min(Math.abs(dishMonth - month), 12 - Math.abs(dishMonth - month))
  return dist === 0 ? 3 : dist === 1 ? 2 : 1
}

function weightedPick(pool, weightOf, rnd) {
  const weights = pool.map(weightOf)
  const total = weights.reduce((a, b) => a + b, 0)
  if (!total) return null
  let r = rnd() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export function generatePlan(meals, { seed = Date.now(), start = localDate() } = {}) {
  const rnd = mulberry32(seed)
  const month = parseDate(start).getMonth() + 1
  const used = new Set()
  const days = []

  for (let day = 0; day < PLAN_DAYS; day++) {
    // Свинина — не чаще раза в неделю (правило клуба).
    const weekStart = day - (day % 7)
    const porkThisWeek = days.slice(weekStart, day).flat().some((id) => meals.byId[id].pr === 'pork')
    const prevDinner = days[day - 1] ? meals.byId[days[day - 1][2]] : null
    const picked = []

    for (const type of MEAL_TYPES) {
      const taken = picked.map((id) => meals.byId[id])
      const eligible = (d) =>
        d.t === type.id &&
        !used.has(d.id) &&
        !(d.pr === 'pork' && (porkThisWeek || taken.some((x) => x.pr === 'pork'))) &&
        // Обед и ужин одного дня — с разным основным белком; ужины подряд — тоже.
        !(type.id !== 'b' && d.pr !== 'other' && taken.some((x) => x.t !== 'b' && x.pr === d.pr)) &&
        !(type.id === 'd' && prevDinner && d.pr !== 'other' && prevDinner.pr === d.pr)
      let pool = meals.dishes.filter(eligible)
      // Если ограничения слишком строгие — ослабляем, но без повторов блюд.
      if (!pool.length) pool = meals.dishes.filter((d) => d.t === type.id && !used.has(d.id))
      if (!pool.length) pool = meals.dishes.filter((d) => d.t === type.id)
      const dish = weightedPick(pool, (d) => seasonWeight(d.m, month), rnd)
      used.add(dish.id)
      picked.push(dish.id)
    }
    days.push(picked)
  }
  return { version: 1, createdAt: start, seed, days }
}

// ── Хранение и 30-дневный цикл ──────────────────────────────────────────────
export function getPlan() {
  return get(PLAN_KEY)
}

export function savePlan(plan) {
  set(PLAN_KEY, plan)
}

export function planDayIndex(plan, today = localDate()) {
  const diff = Math.round((parseDate(today) - parseDate(plan.createdAt)) / 86400000)
  return Math.max(0, diff)
}

// Обновить рацион можно, когда прошли все 30 дней.
export function refreshInfo(plan, today = localDate()) {
  const elapsed = planDayIndex(plan, today)
  const daysLeft = Math.max(0, PLAN_DAYS - elapsed)
  return { canRefresh: daysLeft === 0, daysLeft, availableOn: addDays(plan.createdAt, PLAN_DAYS) }
}

// ── Список покупок на неделю ────────────────────────────────────────────────
const ALIASES = {
  яйцо: 'Яйца',
  яйца: 'Яйца',
  'яйцо куриное': 'Яйца',
  'яйца куриные': 'Яйца',
  помидор: 'Помидоры',
  помидоры: 'Помидоры',
  огурец: 'Огурец',
  'огурец свежий': 'Огурец',
  'масло растительное для жарки': 'Масло растительное',
  'куриное филе': 'Куриная грудка',
}
const EGG_GRAMS = 55

function shopName(ing) {
  const base = (ing.s || ing.n).replace(/\s*\([^)]*\)/g, '').trim()
  return ALIASES[base.toLowerCase()] || base
}

export function shoppingList(plan, weekIndex, meals, targets) {
  const from = weekIndex * 7
  const to = Math.min(PLAN_DAYS, from + 7)
  const map = new Map()
  for (let day = from; day < to; day++) {
    const menu = dayMenu(plan, day, meals, targets)
    if (!menu) continue
    for (const { dish } of menu.items) {
      for (const ing of dish.ing) {
        if (/^вода/i.test(ing.n)) continue
        const name = shopName(ing)
        const grams = ing.k ? ing.g * ing.k : ing.g
        const key = name.toLowerCase()
        const prev = map.get(key) || { name, grams: 0, c: ing.c }
        prev.grams += grams
        map.set(key, prev)
      }
    }
  }
  const groups = meals.categories.map((label, c) => ({
    label,
    items: [...map.values()]
      .filter((x) => x.c === c)
      .sort((a, b) => b.grams - a.grams)
      .map((x) => ({ ...x, amount: formatAmount(x) })),
  }))
  return { from, to, groups: groups.filter((g) => g.items.length) }
}

function formatAmount({ name, grams, c }) {
  if (name === 'Яйца') return `${Math.max(1, Math.round(grams / EGG_GRAMS))} шт`
  if (c === 5 && (grams < 30 || /соль|перец молот|специ/i.test(name))) return 'по вкусу'
  if (grams >= 1000) return `${(Math.round(grams / 100) / 10).toString().replace('.', ',')} кг`
  return `${Math.max(5, Math.round(grams / 10) * 10)} г`
}
