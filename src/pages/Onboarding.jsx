import { useState } from 'react'
import { get } from '../utils/storage'
import BodyFigure, { CheckBadge } from '../components/BodyFigure'
import { WheelPicker, Ruler } from '../components/Pickers'
import {
  GOAL_OPTIONS,
  ZONE_OPTIONS,
  PUSHUP_OPTIONS,
  EQUIPMENT_OPTIONS,
  TIME_OPTIONS,
  GENDER_OPTIONS,
  BODY_NOW_OPTIONS,
  BODY_GOAL_STEPS,
  bodyImage,
  calcBmi,
  bmiCategory,
  ageFromYear,
  ageGroupTitle,
  insightText,
  getPreferences,
  completeOnboarding,
} from '../utils/preferences'

const STEPS = [
  'welcome',
  'gender', 'goal', 'bodyNow', 'bodyGoal', 'zones', 'level', 'equipment', 'time',
  'birthYear', 'height', 'weight', 'targetWeight', 'insight', 'about',
  'ready',
]
// Шаги с прогресс-баром — всё между приветствием и финалом.
const PROGRESS_STEPS = STEPS.slice(1, -1)

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 70 }, (_, i) => THIS_YEAR - 80 + i) // возраст 11–80

const DEFAULTS = {
  male: { heightCm: 178, weightKg: 80 },
  female: { heightCm: 165, weightKg: 62 },
}

function labelOf(options, value) {
  return options.find((o) => o.value === value)?.label
}

function initialAnswers() {
  const has = !!get('onboarding')
  const prefs = has ? getPreferences() : {}
  const profile = get('userProfile') || {}
  const gender = prefs.gender || profile.gender || null
  return {
    gender,
    goal: prefs.goal ?? null,
    bodyNow: prefs.bodyNow ?? null,
    bodyGoal: prefs.bodyGoal ?? 3,
    zones: prefs.zones ?? [],
    level: prefs.level ?? null,
    equipment: prefs.equipment ?? [],
    timeMin: prefs.timeMin ?? null,
    birthYear: prefs.birthYear ?? THIS_YEAR - 30,
    heightCm: prefs.heightCm ?? null,
    weightKg: prefs.weightKg ?? null,
    targetWeightKg: prefs.targetWeightKg ?? null,
    name: profile.name || '',
  }
}

// ── Мелкие компоненты ───────────────────────────────────────────────────────
function OptionCard({ selected, onClick, title, hint, multi }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-4 px-5 rounded-2xl border-2 text-left flex items-center gap-3 transition-colors ${
        selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-gray-900">{title}</span>
        {hint && <span className="block text-sm text-gray-500 mt-0.5">{hint}</span>}
      </span>
      {multi && (
        <span
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selected ? 'bg-primary border-gray-900 text-white' : 'border-gray-300'
          }`}
        >
          {selected && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      )}
    </button>
  )
}

function Question({ title, subtitle, children }) {
  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full pt-6">
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      <div className="mt-6 flex-1 flex flex-col">{children}</div>
    </div>
  )
}

function InfoCard({ icon = '💡', title, children }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <div className="flex gap-3">
        <span className="text-lg leading-none mt-0.5" aria-hidden="true">{icon}</span>
        <div className="min-w-0 text-sm text-gray-600">
          {title && <p className="font-semibold text-gray-900 mb-1">{title}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

function BigValue({ value, unit, sub }) {
  return (
    <div className="text-center">
      <p className="text-gray-900">
        <span className="text-6xl font-bold tabular-nums">{value}</span>
        <span className="text-lg text-gray-500 ml-1.5">{unit}</span>
      </p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="p-1 -ml-1 text-gray-700" aria-label="Назад">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
    >
      {children}
    </button>
  )
}

// ── Онбординг ───────────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [a, setA] = useState(initialAnswers)

  const current = STEPS[step]
  const progressIdx = PROGRESS_STEPS.indexOf(current)
  const gender = a.gender || 'male'
  const heightCm = a.heightCm ?? DEFAULTS[gender].heightCm
  const weightKg = a.weightKg ?? DEFAULTS[gender].weightKg
  const targetWeightKg = a.targetWeightKg ?? weightKg
  const bmi = calcBmi(weightKg, heightCm)

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))
  const set = (patch) => setA((prev) => ({ ...prev, ...patch }))

  // Одиночный выбор: сохраняем и сразу дальше.
  function pick(key, value) {
    set({ [key]: value })
    setTimeout(next, 150)
  }

  function toggle(key, value, exclusive) {
    setA((prev) => {
      const list = prev[key]
      if (list.includes(value)) return { ...prev, [key]: list.filter((v) => v !== value) }
      if (value === exclusive) return { ...prev, [key]: [value] }
      return { ...prev, [key]: [...list.filter((v) => v !== exclusive), value] }
    })
  }

  function finish() {
    completeOnboarding(
      {
        gender,
        goal: a.goal,
        bodyNow: a.bodyNow,
        bodyGoal: a.bodyGoal,
        zones: a.zones.length ? a.zones : ['full'],
        level: a.level,
        equipment: a.equipment.length ? a.equipment : ['none'],
        timeMin: a.timeMin,
        birthYear: a.birthYear,
        heightCm,
        weightKg,
        targetWeightKg,
      },
      { name: a.name.trim(), gender, age: String(ageFromYear(a.birthYear) ?? '') },
    )
    onComplete?.()
  }

  // ── Приветствие ──
  if (current === 'welcome') {
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 pb-8">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">Тренировки дома</p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mt-2">
            Тренировки, которые подстраиваются под тебя
          </h1>
          <ul className="mt-8 space-y-4">
            {[
              ['⚡', 'Тренировка на каждый день', 'С учётом самочувствия и цели'],
              ['⏱', 'От 5 до 30 минут', 'Без зала и сложного инвентаря'],
              ['📅', '28-дневная программа', 'Плавный рост нагрузки'],
            ].map(([icon, title, sub]) => (
              <li key={title} className="flex gap-4 items-start">
                <span className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">
                  {icon}
                </span>
                <span>
                  <span className="block font-semibold text-gray-900">{title}</span>
                  <span className="block text-sm text-gray-500 mt-0.5">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="max-w-sm mx-auto w-full">
          <PrimaryButton onClick={next}>Начать</PrimaryButton>
          <p className="text-center text-xs text-gray-400 mt-3">Займёт около двух минут</p>
        </div>
      </div>
    )
  }

  // ── Финал ──
  if (current === 'ready') {
    const summary = [
      ['Цель', labelOf(GOAL_OPTIONS, a.goal)],
      ['Желаемая форма', BODY_GOAL_STEPS[gender][a.bodyGoal - 1]?.label],
      ['Зоны', (a.zones.length ? a.zones : ['full']).map((z) => labelOf(ZONE_OPTIONS, z)).join(', ')],
      ['Отжиманий подряд', labelOf(PUSHUP_OPTIONS, a.level)],
      ['Рост и вес', `${heightCm} см · ${weightKg} кг`],
      ['Цель по весу', `${targetWeightKg} кг`],
      ['Время', labelOf(TIME_OPTIONS, a.timeMin)],
    ]
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 pb-8">
        <div className="pt-4">
          <BackButton onClick={back} />
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <span className="text-5xl" aria-hidden="true">🎯</span>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mt-4">
            {a.name.trim() ? `${a.name.trim()}, всё готово!` : 'Всё готово!'}
          </h1>
          <p className="text-gray-500 mt-2">
            Теперь подберём тренировку на сегодня — осталось сказать, как ты себя чувствуешь.
          </p>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mt-6 space-y-2.5">
            {summary.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-sm mx-auto w-full">
          <PrimaryButton onClick={finish}>Получить тренировку на сегодня</PrimaryButton>
        </div>
      </div>
    )
  }

  // ── Кнопка «Далее» для шагов без автоперехода ──
  const nextDisabled = {
    zones: a.zones.length === 0,
    equipment: a.equipment.length === 0,
  }[current]
  const needsNext = ['bodyGoal', 'zones', 'equipment', 'birthYear', 'height', 'weight', 'targetWeight', 'insight', 'about'].includes(current)

  // ── Вопросы ──
  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      <div className="flex items-center gap-4 pt-4">
        <BackButton onClick={back} />
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((progressIdx + 1) / PROGRESS_STEPS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-10 text-right tabular-nums">{progressIdx + 1}/{PROGRESS_STEPS.length}</span>
      </div>

      {current === 'gender' && (
        <Question title="Укажи свой пол" subtitle="Подберём примеры и нагрузку под тебя">
          <div className="grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => pick('gender', o.value)}
                className={`rounded-2xl border-2 overflow-hidden text-left transition-colors ${
                  a.gender === o.value ? 'border-gray-900' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src={bodyImage('now', o.value, 'average')} alt="" className="w-full aspect-square object-cover bg-gray-100" />
                <span className="block px-4 py-3 font-semibold text-gray-900">{o.label}</span>
              </button>
            ))}
          </div>
        </Question>
      )}

      {current === 'goal' && (
        <Question title="Какая твоя цель?" subtitle="От неё зависит темп и длительность отдыха">
          <div className="space-y-3">
            {GOAL_OPTIONS.map((o) => (
              <OptionCard key={o.value} title={o.label} selected={a.goal === o.value} onClick={() => pick('goal', o.value)} />
            ))}
          </div>
        </Question>
      )}

      {current === 'bodyNow' && (
        <Question title={<>Какая у тебя <span className="text-accent">сейчас</span> форма тела?</>}>
          <div className="space-y-3">
            {BODY_NOW_OPTIONS[gender].map((o) => {
              const selected = a.bodyNow === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick('bodyNow', o.value)}
                  className={`w-full flex items-center rounded-2xl border-2 overflow-hidden text-left transition-colors ${
                    selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="flex-1 px-5 font-semibold text-gray-900">{o.label}</span>
                  <img src={bodyImage('now', gender, o.value)} alt="" className="w-24 h-24 object-cover object-top bg-gray-100" />
                </button>
              )
            })}
          </div>
        </Question>
      )}

      {current === 'bodyGoal' && (() => {
        const steps = BODY_GOAL_STEPS[gender]
        const s = steps[a.bodyGoal - 1]
        return (
          <Question title={<>Какую форму тела ты <span className="text-accent">хочешь</span>?</>}>
            <div className="relative mx-auto w-60 h-60 rounded-3xl overflow-hidden bg-gray-100">
              {steps.map((_, i) => (
                <img
                  key={i}
                  src={bodyImage('goal', gender, i + 1)}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${
                    a.bodyGoal === i + 1 ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-lg font-bold text-gray-900 mt-4">{s.label}</p>
            <input
              type="range"
              min={1}
              max={steps.length}
              step={1}
              value={a.bodyGoal}
              onChange={(e) => set({ bodyGoal: Number(e.target.value) })}
              className="w-full mt-3 accent-gray-900 cursor-pointer"
              aria-label="Желаемая форма тела"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{steps[0].label}</span>
              <span>{steps[steps.length - 1].label}</span>
            </div>
            <div className="mt-5">
              <InfoCard icon="🎯" title={`Целевой уровень жира: ${s.fat}`}>
                Отличная цель! Постепенно она достижима — даже если ты только начинаешь.
              </InfoCard>
            </div>
          </Question>
        )
      })()}

      {current === 'zones' && (
        <Question title="Какие зоны хочешь проработать?" subtitle="Можно выбрать несколько">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {ZONE_OPTIONS.map((z) => {
              const selected = a.zones.includes(z.value)
              return (
                <button key={z.value} type="button" onClick={() => toggle('zones', z.value)} className="flex flex-col items-center gap-2">
                  <span
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                      selected ? 'bg-gray-50 ring-2 ring-gray-900' : 'bg-gray-100'
                    }`}
                  >
                    <BodyFigure focus={z.value} selected={selected} />
                    {selected && <CheckBadge />}
                  </span>
                  <span className={`text-sm text-center ${selected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{z.label}</span>
                </button>
              )
            })}
          </div>
        </Question>
      )}

      {current === 'level' && (
        <Question title="Сколько отжиманий сделаешь подряд?" subtitle="Классические, с прямым корпусом. Так мы поймём твой уровень">
          <div className="space-y-3">
            {PUSHUP_OPTIONS.map((o) => (
              <OptionCard key={o.value} title={o.label} hint={o.hint} selected={a.level === o.value} onClick={() => pick('level', o.value)} />
            ))}
          </div>
        </Question>
      )}

      {current === 'equipment' && (
        <Question title="Что есть дома?" subtitle="Можно выбрать несколько">
          <div className="space-y-3">
            {EQUIPMENT_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                multi
                title={o.label}
                selected={a.equipment.includes(o.value)}
                onClick={() => toggle('equipment', o.value, 'none')}
              />
            ))}
          </div>
        </Question>
      )}

      {current === 'time' && (
        <Question title="Сколько времени готов уделять?" subtitle="Длительность можно менять перед каждой тренировкой">
          <div className="space-y-3">
            {TIME_OPTIONS.map((o) => (
              <OptionCard key={o.value} title={o.label} selected={a.timeMin === o.value} onClick={() => pick('timeMin', o.value)} />
            ))}
          </div>
        </Question>
      )}

      {current === 'birthYear' && (
        <Question title="Укажи год рождения">
          <InfoCard>Так мы адаптируем нагрузку под возможности организма и сделаем тренировки безопасными.</InfoCard>
          <div className="mt-6">
            <WheelPicker values={YEARS} value={a.birthYear} onChange={(v) => set({ birthYear: v })} />
          </div>
        </Question>
      )}

      {current === 'height' && (
        <Question title="Укажи свой рост">
          <InfoCard>Рассчитаем индекс массы тела и подберём тренировки, которые подходят именно тебе.</InfoCard>
          <div className="flex items-center justify-between mt-8 pl-4">
            <BigValue value={heightCm} unit="см" />
            <Ruler vertical min={120} max={220} value={heightCm} onChange={(v) => set({ heightCm: v })} />
          </div>
        </Question>
      )}

      {current === 'weight' && (() => {
        const cat = bmiCategory(bmi)
        return (
          <Question title={<>Сколько ты <span className="text-accent">сейчас</span> весишь?</>}>
            <div className="mt-4">
              <BigValue value={weightKg} unit="кг" />
              <div className="mt-4 -mx-6">
                <Ruler min={35} max={200} value={weightKg} onChange={(v) => set({ weightKg: v })} />
              </div>
            </div>
            <div className="mt-6">
              <InfoCard icon="📊" title="Твой индекс массы тела">
                <p>
                  <span className={`text-2xl font-bold ${cat.tone}`}>{bmi.toFixed(1)}</span>
                  <span className="ml-2 font-medium text-gray-900">{cat.label}</span>
                </p>
                <p className="mt-1">{cat.hint}</p>
              </InfoCard>
            </div>
          </Question>
        )
      })()}

      {current === 'targetWeight' && (() => {
        const diff = targetWeightKg - weightKg
        const pct = Math.abs((diff / weightKg) * 100).toFixed(1)
        return (
          <Question title={<>Какой вес ты <span className="text-accent">хочешь</span>?</>}>
            <div className="mt-4">
              <BigValue value={targetWeightKg} unit="кг" sub={`сейчас ${weightKg} кг`} />
              <div className="mt-4 -mx-6">
                <Ruler min={35} max={200} value={targetWeightKg} onChange={(v) => set({ targetWeightKg: v })} />
              </div>
            </div>
            <div className="mt-6">
              {diff < 0 ? (
                <InfoCard icon="🏆" title={`Ты сбросишь ${pct}% массы тела`}>
                  <p>Даже умеренное снижение веса даёт заметный эффект:</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>— снижается нагрузка на сердце и суставы;</li>
                    <li>— прибавляется энергии в течение дня.</li>
                  </ul>
                </InfoCard>
              ) : diff > 0 ? (
                <InfoCard icon="💪" title={`Ты наберёшь ${pct}% массы`}>
                  Сделаем упор на силовые упражнения, чтобы прибавка шла за счёт мышц.
                </InfoCard>
              ) : (
                <InfoCard icon="✨" title="Сохраняем вес">
                  Будем улучшать форму и рельеф без изменения веса.
                </InfoCard>
              )}
            </div>
          </Question>
        )
      })()}

      {current === 'insight' && (() => {
        const cat = bmiCategory(bmi)
        return (
          <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full text-center">
            <img src={`/img/mascot-${gender}.webp`} alt="" className="w-56 h-56 object-contain" />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">{ageGroupTitle(gender, a.birthYear)}</h1>
            <p className="text-gray-600 mt-3 leading-relaxed">{insightText({ bmi, goal: a.goal })}</p>
            {cat && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm">
                <span className="text-gray-500">Твой ИМТ</span>
                <span className={`font-bold ${cat.tone}`}>{bmi.toFixed(1)}</span>
              </p>
            )}
          </div>
        )
      })()}

      {current === 'about' && (
        <Question title="Как тебя зовут?" subtitle="Будем обращаться по имени">
          <input
            type="text"
            value={a.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Имя"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
          />
        </Question>
      )}

      <div className="max-w-sm mx-auto w-full py-6">
        {needsNext && (
          <div className="space-y-2">
            <PrimaryButton onClick={next} disabled={nextDisabled}>Далее</PrimaryButton>
            {current === 'about' && (
              <button
                onClick={() => {
                  set({ name: '' })
                  next()
                }}
                className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Пропустить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
