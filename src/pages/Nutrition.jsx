import { useState, useEffect, useMemo, useRef } from 'react'
import { get, set } from '../utils/storage'
import { GOAL_OPTIONS, GENDER_OPTIONS, getPreferences, savePreferences } from '../utils/preferences'
import { localDate, parseDate } from '../utils/activity'
import {
  PLAN_DAYS,
  loadMeals,
  nutritionInputs,
  calcTargets,
  getPlan,
  savePlan,
  generatePlan,
  planDayIndex,
  refreshInfo,
  dayMenu,
  shoppingList,
} from '../utils/nutrition'

const COVER = '/img/nutrition-cover.webp'
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function humanDate(str) {
  const d = parseDate(str)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

function pluralDays(n) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'день'
  if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return 'дня'
  return 'дней'
}

function Macro({ label, value, unit = 'г' }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-lg font-bold tabular-nums">
        {value}
        <span className="text-xs font-medium text-white/60 ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

function TargetsCard({ targets, subtitle, onEdit }) {
  return (
    <div className="rounded-3xl bg-primary text-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Твоя норма в день</p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/15 rounded-full px-3 py-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 14.536 9 15l.464-3.536z" />
            </svg>
            Изменить данные
          </button>
        )}
      </div>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums">{targets.kcal}</span>
        <span className="text-white/70">ккал</span>
      </p>
      {subtitle && <p className="text-sm text-white/60 mt-1">{subtitle}</p>}
      <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
        <Macro label="Белки" value={targets.protein} />
        <Macro label="Жиры" value={targets.fat} />
        <Macro label="Углеводы" value={targets.carbs} />
      </div>
    </div>
  )
}

// ── Нет данных для расчёта нормы ─────────────────────────────────────────────
function DataForm({ inputs, onSaved, onCancel }) {
  const [form, setForm] = useState({
    gender: inputs.gender || '',
    age: inputs.age || '',
    heightCm: inputs.heightCm || '',
    weightKg: inputs.weightKg || '',
    goal: inputs.goal || 'keep-fit',
  })
  const ready = form.gender && form.age > 10 && form.heightCm > 100 && form.weightKg > 30

  function save() {
    const prefs = getPreferences()
    savePreferences({
      ...prefs,
      gender: form.gender,
      goal: form.goal,
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      birthYear: new Date().getFullYear() - Number(form.age),
    })
    const profile = get('userProfile') || {}
    set('userProfile', { ...profile, gender: form.gender, age: String(form.age) })
    onSaved()
  }

  const field = (key, label, unit) => (
    <label className="block">
      <span className="block text-sm text-gray-500 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-base text-gray-900 focus:outline-none focus:border-gray-400"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">{unit}</span>
      </div>
    </label>
  )

  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-900">{onCancel ? 'Мои данные' : 'Расскажи о себе'}</h2>
      <p className="text-sm text-gray-500 mt-1">
        {onCancel
          ? 'Данные из онбординга. После сохранения норма и порции пересчитаются, блюда останутся те же.'
          : 'Нужно, чтобы рассчитать калории и белок именно для тебя. Что уже известно из онбординга — подставлено.'}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {GENDER_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setForm((f) => ({ ...f, gender: o.value }))}
            className={`py-3 rounded-xl text-sm font-medium ${form.gender === o.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {field('age', 'Возраст', 'лет')}
        {field('heightCm', 'Рост', 'см')}
        {field('weightKg', 'Вес', 'кг')}
      </div>
      <p className="text-sm text-gray-500 mt-4 mb-2">Цель</p>
      <div className="flex flex-wrap gap-2">
        {GOAL_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setForm((f) => ({ ...f, goal: o.value }))}
            className={`px-4 py-2 rounded-full text-sm font-medium ${form.goal === o.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button
        onClick={save}
        disabled={!ready}
        className="w-full mt-5 py-3.5 rounded-xl bg-primary text-white font-semibold disabled:bg-gray-200 disabled:text-gray-400"
      >
        {onCancel ? 'Сохранить' : 'Рассчитать норму'}
      </button>
      {onCancel && (
        <button onClick={onCancel} className="w-full mt-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800">
          Отмена
        </button>
      )}
    </div>
  )
}

// ── Карточка приёма пищи ────────────────────────────────────────────────────
function MealCard({ type, dish }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-4 flex gap-3" aria-expanded={open}>
        <span className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
          {type.icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">{type.label}</span>
          <span className="block font-semibold text-gray-900 leading-snug mt-0.5">{dish.name}</span>
          <span className="block text-sm text-gray-900 font-medium mt-1">
            {dish.kcal} ккал <span className="text-gray-400 font-normal">· {dish.w} г</span>
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            Белки {dish.p} г · Жиры {dish.f} г · Углеводы {dish.cb} г
          </span>
        </span>
        <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-3 mb-2">Ингредиенты</p>
          <ul className="space-y-1">
            {dish.ing.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-700">{i.n}</span>
                <span className="text-gray-500 tabular-nums flex-shrink-0">{i.g <= 3 && i.c === 5 ? 'по вкусу' : `${i.g} г`}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-4 mb-2">Приготовление</p>
          <ol className="space-y-2">
            {dish.steps.map((s, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ── Лента дней ──────────────────────────────────────────────────────────────
function DayStrip({ plan, today, selected, onSelect }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.querySelector(`[data-day="${selected}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [selected])
  return (
    <div ref={ref} className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
      {plan.days.map((_, i) => {
        const isSel = i === selected
        const isToday = i === today
        const isPast = i < today
        return (
          <button
            key={i}
            data-day={i}
            onClick={() => onSelect(i)}
            className={`flex-shrink-0 w-12 h-14 rounded-2xl flex flex-col items-center justify-center transition-colors ${
              isSel ? 'bg-primary text-white' : isPast ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 text-gray-800'
            } ${isToday && !isSel ? 'ring-2 ring-accent' : ''}`}
          >
            <span className={`text-[10px] ${isSel ? 'text-white/60' : 'text-gray-400'}`}>день</span>
            <span className="text-base font-bold tabular-nums leading-none">{i + 1}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Список покупок ──────────────────────────────────────────────────────────
function Shopping({ plan, meals, targets, week }) {
  const list = useMemo(() => shoppingList(plan, week, meals, targets), [plan, week, meals, targets])
  const storageKey = `${plan.createdAt}:${week}`
  const [checked, setChecked] = useState(() => new Set(get('mealShopping')?.[storageKey] || []))

  function toggle(name) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      const all = get('mealShopping') || {}
      set('mealShopping', { [storageKey]: [...next], ...Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(plan.createdAt) && k !== storageKey)) })
      return next
    })
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        Покупки на дни {list.from + 1}–{list.to} · отмечай, что уже купил
      </p>
      <div className="space-y-5">
        {list.groups.map((g) => (
          <section key={g.label}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{g.label}</h3>
            <ul className="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {g.items.map((item) => {
                const done = checked.has(item.name)
                return (
                  <li key={item.name}>
                    <button onClick={() => toggle(item.name)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          done ? 'bg-primary border-gray-900 text-white' : 'border-gray-300'
                        }`}
                      >
                        {done && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`flex-1 text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.name}</span>
                      <span className="text-sm text-gray-500 tabular-nums">{item.amount}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

// ── Экран ───────────────────────────────────────────────────────────────────
export default function Nutrition() {
  const [meals, setMeals] = useState(null)
  const [version, setVersion] = useState(0) // перечитать данные после сохранения формы
  const [plan, setPlan] = useState(getPlan)
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState('menu')
  const [editing, setEditing] = useState(false)
  const today = localDate()

  const inputs = useMemo(nutritionInputs, [version])
  const targets = useMemo(() => calcTargets(inputs), [inputs])

  const todayIdx = plan ? Math.min(planDayIndex(plan, today), PLAN_DAYS - 1) : 0
  const [selected, setSelected] = useState(todayIdx)

  useEffect(() => {
    loadMeals().then(setMeals)
  }, [])

  function create() {
    if (!meals) return
    setGenerating(true)
    // Короткая пауза — чтобы было видно, что рацион собирается.
    setTimeout(() => {
      const next = generatePlan(meals)
      savePlan(next)
      setPlan(next)
      setSelected(0)
      setTab('menu')
      setGenerating(false)
      window.scrollTo(0, 0)
    }, 900)
  }

  const header = (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-gray-900">Питание</h1>
      <p className="text-sm text-gray-500 mt-0.5">Рацион на 30 дней из меню нашего клуба</p>
    </div>
  )

  if (generating) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full border-4 border-gray-100 border-t-primary animate-spin" />
        <p className="text-xl font-bold text-gray-900 mt-6">Составляем твой рацион…</p>
        <p className="text-sm text-gray-500 mt-1">Подбираем 90 блюд под твою норму</p>
      </div>
    )
  }

  // Нет данных для расчёта нормы.
  if (!targets) {
    return (
      <div className="px-4 pt-4 pb-6">
        {header}
        <DataForm inputs={inputs} onSaved={() => setVersion((v) => v + 1)} />
      </div>
    )
  }

  const goalLabel = GOAL_OPTIONS.find((g) => g.value === inputs.goal)?.label

  if (editing) {
    return (
      <div className="px-4 pt-4 pb-6">
        {header}
        <DataForm
          inputs={inputs}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setVersion((v) => v + 1)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  // Рациона ещё нет.
  if (!plan) {
    return (
      <div className="px-4 pt-4 pb-6">
        {header}
        <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white mb-4">
          <img src={COVER} alt="" className="w-full h-44 object-cover" />
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900">Рацион на 30 дней</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>🍳 3 приёма пищи в день — простые блюда из обычного магазина</li>
              <li>⚖️ Порции пересчитаны под твою норму калорий и белка</li>
              <li>🛒 Список покупок на каждую неделю</li>
              <li>🔄 Через 30 дней — новый рацион</li>
            </ul>
          </div>
        </div>
        <TargetsCard targets={targets} onEdit={() => setEditing(true)} subtitle={`Цель: ${goalLabel?.toLowerCase()} · ${inputs.weightKg} кг, ${inputs.heightCm} см`} />
        <button
          onClick={create}
          disabled={!meals}
          className="w-full mt-4 py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
        >
          Составить рацион
        </button>
      </div>
    )
  }

  const menu = meals ? dayMenu(plan, selected, meals, targets) : null
  const refresh = refreshInfo(plan, today)
  const week = Math.floor(selected / 7)

  return (
    <div className="px-4 pt-4 pb-6">
      {header}

      <TargetsCard targets={targets} onEdit={() => setEditing(true)} subtitle={`Цель: ${goalLabel?.toLowerCase()} · ${inputs.weightKg} кг · день ${todayIdx + 1} из ${PLAN_DAYS}`} />

      {/* Меню / Покупки */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 mt-5 mb-4">
        {[['menu', 'Меню'], ['shop', 'Покупки']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <DayStrip plan={plan} today={todayIdx} selected={selected} onSelect={setSelected} />

      <div className="mt-4">
        {!meals ? (
          <p className="text-center text-sm text-gray-400 py-10">Загружаем меню…</p>
        ) : tab === 'menu' ? (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                День {selected + 1}
                {selected === todayIdx && <span className="ml-2 text-sm font-semibold text-accent-dark">сегодня</span>}
              </h2>
              <p className="text-sm text-gray-500 tabular-nums">{menu.total.kcal} ккал</p>
            </div>
            <div className="space-y-3">
              {menu.items.map(({ type, dish }) => (
                <MealCard key={`${selected}-${type.id}`} type={type} dish={dish} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[['Белки', menu.total.p, targets.protein], ['Жиры', menu.total.f, targets.fat], ['Углеводы', menu.total.cb, targets.carbs]].map(([label, v, t]) => (
                <div key={label} className="rounded-xl bg-gray-50 py-2">
                  <p className="text-[11px] text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">
                    {v} <span className="text-gray-400 font-normal">/ {t} г</span>
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Shopping key={week} plan={plan} meals={meals} targets={targets} week={week} />
        )}
      </div>

      {/* Обновление рациона — раз в 30 дней */}
      <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-sm text-gray-600">
          Рацион составлен {humanDate(plan.createdAt)}.{' '}
          {refresh.canRefresh
            ? 'Прошло 30 дней — можно получить новый.'
            : `Новый будет доступен ${humanDate(refresh.availableOn)} — через ${refresh.daysLeft} ${pluralDays(refresh.daysLeft)}.`}
        </p>
        <button
          onClick={create}
          disabled={!refresh.canRefresh}
          className="w-full mt-3 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:bg-gray-200 disabled:text-gray-400"
        >
          {refresh.canRefresh ? 'Обновить рацион' : `🔒 Обновить через ${refresh.daysLeft} ${pluralDays(refresh.daysLeft)}`}
        </button>
      </div>
    </div>
  )
}
