// Сборка базы блюд для раздела «Питание» из клубных меню (meal-planner).
// Запуск: node scripts/build-meals.mjs [путь к meal-planner/output]
// Результат: src/data/meals.json — упрощённая база без заготовок, фото и Notion.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.argv[2] || '/Users/maksimartemev/Documents/5. 6:1/meal-planner/output'
const OUT = join(root, 'src/data/meals.json')

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 }
const TYPES = { Завтрак: 'b', Обед: 'l', Ужин: 'd' }

// Категории списка покупок — как в клубном calculate-shopping.js.
const CATEGORIES = ['мясо/рыба', 'яйца/молочное', 'овощи/зелень', 'фрукты/ягоды', 'крупы/бобовые', 'масла/специи', 'прочее']
const CATEGORY_RULES = [
  ['мясо/рыба', ['кури', 'говяд', 'свин', 'индейк', 'креветк', 'тунец', 'треск', 'минта', 'форел', 'лосос', 'семг', 'горбуш', 'скумбр', 'рыбн', 'бёдр', 'хек', 'судак', 'кальмар', 'печень', 'фарш', 'фрикадел', 'голен', 'пангасиус']],
  ['яйца/молочное', ['яйц', 'молок', 'йогурт', 'творог', 'сыр', 'сметан', 'сливочн', 'кефир', 'ряженк', 'пармезан', 'моцарел', 'брынз', 'рикотт', 'сливк']],
  ['овощи/зелень', ['огур', 'помидор', 'черри', 'кабач', 'баклажан', 'капуст', 'картофел', 'морков', 'свёкл', 'свекл', 'тыкв', 'лук', 'чеснок', 'шпинат', 'авокадо', 'укроп', 'петрушк', 'базилик', 'зелен', 'перец болгар', 'стручков', 'гриб', 'шампиньон', 'салат', 'редис', 'брокколи', 'горошек', 'кукуруз', 'кинз', 'сельдер', 'томат', 'цукини', 'имбир', 'редьк', 'руккол']],
  ['фрукты/ягоды', ['персик', 'нектарин', 'черешн', 'абрикос', 'яблок', 'клубник', 'малин', 'смородин', 'вишн', 'слив', 'лимон', 'ягод', 'груш', 'банан', 'айва', 'виноград', 'изюм', 'чернослив', 'курага', 'клюкв', 'брусник', 'черник', 'апельсин', 'мандарин', 'крыжовник', 'голубик', 'манго']],
  ['крупы/бобовые', ['овсян', 'хлопья', 'рис', 'гречк', 'перловк', 'булгур', 'чиа', 'вермишел', 'пшен', 'ячнев', 'нут', 'макарон', 'кускус', 'чечевиц', 'фасоль', 'мук', 'хлеб', 'лаваш', 'манн', 'лапш']],
  ['масла/специи', ['масло', 'оливков', 'мёд', 'мед', 'соль', 'перец', 'розмарин', 'тмин', 'паприк', 'кориц', 'лавр', 'прованск', 'уксус', 'соус', 'горчиц', 'сахар', 'ванил', 'куркум', 'орегано', 'чили', 'тимьян', 'зира', 'разрыхл', 'какао', 'кунжут', 'мак']],
]

function categorize(name) {
  const lower = name.toLowerCase()
  if (lower.includes('фасоль') && lower.includes('стручков')) return 2
  if (/яйц|яйко/.test(lower)) return CATEGORIES.indexOf('яйца/молочное')
  for (const [cat, keys] of CATEGORY_RULES) {
    if (keys.some((k) => lower.includes(k))) return CATEGORIES.indexOf(cat)
  }
  return CATEGORIES.indexOf('прочее')
}

// Заготовки клуба: готовый продукт → что покупать и коэффициент «готовое → сырое/сухое».
const PREP = {
  'Куриная грудка запечённая': ['Куриная грудка (филе)', 1 / 0.75],
  'Куриное филе запечённое': ['Куриное филе', 1 / 0.75],
  'Куриные бёдра запечённые': ['Куриные бёдра', 1 / 0.75],
  'Индейка запечённая': ['Индейка (филе бедра)', 1 / 0.75],
  'Индейка тушёная в томатном соусе': ['Индейка (филе бедра)', 1 / 0.8],
  'Говядина тушёная': ['Говядина (мякоть)', 1 / 0.75],
  'Фрикадельки куриные запечённые': ['Фарш куриный', 1 / 0.85],
  'Фрикадельки из индейки запечённые': ['Фарш из индейки', 1 / 0.85],
  'Перловка варёная': ['Перловка', 1 / 2.75],
  'Рис варёный': ['Рис', 1 / 2.75],
  'Булгур варёный': ['Булгур', 1 / 2.75],
  'Гречка варёная': ['Гречка', 1 / 2.75],
  'Ячневая крупа варёная': ['Ячневая крупа', 1 / 2.75],
  'Пшено варёное': ['Пшено', 1 / 2.75],
  'Нут варёный': ['Нут', 1 / 2.75],
  'Макароны твёрдых сортов варёные': ['Макароны твёрдых сортов', 1 / 2.5],
  'Кускус варёный': ['Кускус', 1 / 2.5],
}

// Основной белок блюда — для разнообразия и правила «свинина не чаще раза в неделю».
const PROTEINS = [
  ['pork', /свин/],
  ['beef', /говяд/],
  ['liver', /печен/],
  ['turkey', /индейк/],
  ['chicken', /кур|цыпл|бёдр|голен/],
  ['fish', /рыб|минта|треск|хек|скумбр|лосос|форел|горбуш|тунец|семг|судак|кальмар|креветк|сельд/],
  ['curd', /творог|сырник|запеканк/],
  ['egg', /яйц|омлет|яичн|фриттат|шакшук/],
]

function proteinOf(dish) {
  const text = `${dish.name} ${dish.ingredients.slice(0, 3).map((i) => i.name).join(' ')}`.toLowerCase()
  return PROTEINS.find(([, re]) => re.test(text))?.[0] || 'other'
}

function slug(str) {
  let h = 0
  for (const ch of str) h = (Math.imul(h, 31) + ch.codePointAt(0)) | 0
  return (h >>> 0).toString(36)
}

const round = (n) => Math.round(n)

const dishes = []
let skipped = 0
for (const file of readdirSync(SRC).filter((f) => f.endsWith('-draft.json')).sort()) {
  const month = MONTHS[file.split('-')[0]]
  const menu = JSON.parse(readFileSync(join(SRC, file), 'utf8'))
  for (const d of menu.dishes) {
    // Блюда из остатков прошлого ужина вне недельного цикла теряют смысл.
    if (d.isPrepRemix || d.ingredients.some((i) => /остат/i.test(i.name))) {
      skipped++
      continue
    }
    const ing = d.ingredients.map((i) => {
      const isPrep = i.name.includes('(заготовка)')
      const name = i.name.replace(/\s*\(заготовка\)/, '').trim()
      const item = { n: name, g: round(i.grams), c: categorize(PREP[name]?.[0] || name) }
      if (isPrep && PREP[name]) {
        item.s = PREP[name][0]
        item.k = Math.round(PREP[name][1] * 1000) / 1000
      }
      return item
    })
    // В рецептах клуба встречаются отсылки к воскресным заготовкам — упрощаем формулировку.
    const steps = d.recipe.map((s) => s.replace(/\s*\(заготовк[аи][^)]*\)/gi, '').replace(/из заготовки/gi, 'готовый'))
    dishes.push({
      id: slug(d.name),
      t: TYPES[d.type],
      name: d.name,
      kcal: d.kbju.kcal,
      p: d.kbju.protein,
      f: d.kbju.fat,
      cb: d.kbju.carbs,
      w: d.weight,
      m: month,
      pr: proteinOf(d),
      ing,
      steps,
    })
  }
}

writeFileSync(OUT, JSON.stringify({ categories: CATEGORIES, dishes }))
const byType = dishes.reduce((acc, d) => ({ ...acc, [d.t]: (acc[d.t] || 0) + 1 }), {})
const byProtein = dishes.reduce((acc, d) => ({ ...acc, [d.pr]: (acc[d.pr] || 0) + 1 }), {})
console.log(`Блюд: ${dishes.length} (пропущено из остатков: ${skipped})`, byType)
console.log('По белку:', byProtein)
console.log(`→ ${OUT} (${(readFileSync(OUT).length / 1024).toFixed(0)} КБ)`)
