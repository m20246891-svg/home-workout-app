import { useState } from 'react'
import { get } from '../utils/storage'
import BodyFigure, { CheckBadge } from '../components/BodyFigure'
import {
  GOAL_OPTIONS,
  ZONE_OPTIONS,
  PUSHUP_OPTIONS,
  EQUIPMENT_OPTIONS,
  TIME_OPTIONS,
  GENDER_OPTIONS,
  getPreferences,
  completeOnboarding,
} from '../utils/preferences'

// Шаги-вопросы между приветствием и финалом (для прогресс-бара).
const QUESTION_STEPS = ['goal', 'zones', 'level', 'equipment', 'time', 'about']
const STEPS = ['welcome', ...QUESTION_STEPS, 'ready']

function labelOf(options, value) {
  return options.find((o) => o.value === value)?.label
}

function initialAnswers() {
  const prefs = get('onboarding') ? getPreferences() : {}
  return {
    goal: prefs.goal ?? null,
    zones: prefs.zones ?? [],
    level: prefs.level ?? null,
    equipment: prefs.equipment ?? [],
    timeMin: prefs.timeMin ?? null,
  }
}

function initialProfile() {
  const p = get('userProfile') || {}
  return { name: p.name || '', age: p.age || '', gender: p.gender || '' }
}

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
      <div className="mt-7">{children}</div>
    </div>
  )
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [profile, setProfile] = useState(initialProfile)

  const current = STEPS[step]
  const questionIdx = QUESTION_STEPS.indexOf(current)

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  // Одиночный выбор: сохраняем и сразу дальше.
  function pick(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }))
    setTimeout(next, 150)
  }

  function toggle(key, value, exclusive) {
    setAnswers((a) => {
      const list = a[key]
      if (list.includes(value)) return { ...a, [key]: list.filter((v) => v !== value) }
      if (value === exclusive) return { ...a, [key]: [value] }
      return { ...a, [key]: [...list.filter((v) => v !== exclusive), value] }
    })
  }

  function finish() {
    completeOnboarding(
      {
        goal: answers.goal,
        zones: answers.zones.length ? answers.zones : ['full'],
        level: answers.level,
        equipment: answers.equipment.length ? answers.equipment : ['none'],
        timeMin: answers.timeMin,
      },
      profile,
    )
    onComplete?.()
  }

  // Кнопка внизу для шагов с множественным выбором и формой.
  let footer = null
  if (current === 'zones' || current === 'equipment') {
    const empty = answers[current].length === 0
    footer = (
      <button
        onClick={next}
        disabled={empty}
        className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
      >
        Далее
      </button>
    )
  } else if (current === 'about') {
    footer = (
      <div className="space-y-2">
        <button
          onClick={next}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
        >
          Далее
        </button>
        <button
          onClick={() => {
            setProfile(initialProfile())
            next()
          }}
          className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          Пропустить
        </button>
      </div>
    )
  }

  // ── Приветствие ──
  if (current === 'welcome') {
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 pb-8">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Тренировки дома</p>
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
          <button
            onClick={next}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            Начать
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">Займёт меньше минуты</p>
        </div>
      </div>
    )
  }

  // ── Финал ──
  if (current === 'ready') {
    const summary = [
      ['Цель', labelOf(GOAL_OPTIONS, answers.goal)],
      ['Зоны', (answers.zones.length ? answers.zones : ['full']).map((z) => labelOf(ZONE_OPTIONS, z)).join(', ')],
      ['Отжиманий подряд', labelOf(PUSHUP_OPTIONS, answers.level)],
      ['Инвентарь', (answers.equipment.length ? answers.equipment : ['none']).map((e) => labelOf(EQUIPMENT_OPTIONS, e)).join(', ')],
      ['Время', labelOf(TIME_OPTIONS, answers.timeMin)],
    ]
    return (
      <div className="min-h-screen bg-white flex flex-col px-6 pb-8">
        <div className="pt-4">
          <button type="button" onClick={back} className="p-1 -ml-1 text-gray-700" aria-label="Назад">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <span className="text-5xl" aria-hidden="true">🎯</span>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mt-4">
            {profile.name ? `${profile.name}, всё готово!` : 'Всё готово!'}
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
          <button
            onClick={finish}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            Получить тренировку на сегодня
          </button>
        </div>
      </div>
    )
  }

  // ── Вопросы ──
  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      {/* Назад + прогресс */}
      <div className="flex items-center gap-4 pt-4">
        <button type="button" onClick={back} className="p-1 -ml-1 text-gray-700" aria-label="Назад">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((questionIdx + 1) / QUESTION_STEPS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-8 text-right">{questionIdx + 1}/{QUESTION_STEPS.length}</span>
      </div>

      {current === 'goal' && (
        <Question title="Какая твоя цель?" subtitle="От неё зависит темп и длительность отдыха">
          <div className="space-y-3">
            {GOAL_OPTIONS.map((o) => (
              <OptionCard key={o.value} title={o.label} selected={answers.goal === o.value} onClick={() => pick('goal', o.value)} />
            ))}
          </div>
        </Question>
      )}

      {current === 'zones' && (
        <Question title="Какие зоны хочешь проработать?" subtitle="Можно выбрать несколько">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {ZONE_OPTIONS.map((z) => {
              const selected = answers.zones.includes(z.value)
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
              <OptionCard key={o.value} title={o.label} hint={o.hint} selected={answers.level === o.value} onClick={() => pick('level', o.value)} />
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
                selected={answers.equipment.includes(o.value)}
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
              <OptionCard key={o.value} title={o.label} selected={answers.timeMin === o.value} onClick={() => pick('timeMin', o.value)} />
            ))}
          </div>
        </Question>
      )}

      {current === 'about' && (
        <Question title="Расскажи о себе" subtitle="Чтобы обращаться по имени и точнее считать калории">
          <div className="space-y-5">
            <label className="block">
              <span className="block text-sm text-gray-500 mb-1.5">Имя</span>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Как тебя зовут?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-gray-500 mb-1.5">Возраст</span>
              <input
                type="number"
                inputMode="numeric"
                min="10"
                max="100"
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                placeholder="Лет"
                className="w-32 px-4 py-3 rounded-xl border border-gray-200 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
            </label>
            <div>
              <span className="block text-sm text-gray-500 mb-1.5">Пол</span>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, gender: o.value }))}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      profile.gender === o.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Question>
      )}

      <div className="max-w-sm mx-auto w-full py-6">{footer}</div>
    </div>
  )
}
