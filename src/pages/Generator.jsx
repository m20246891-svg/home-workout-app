import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import data from '../data/workouts.json'
import {
  MOODS,
  FOCUSES,
  LEVELS,
  GEAR_LABELS,
  DURATION_MIN,
  DURATION_MAX,
  defaultSettings,
  saveSettings,
  generateWorkout,
  saveGeneratedWorkout,
  getTodayGeneratedWorkout,
  workoutStats,
} from '../utils/generator'
import BodyFigure, { CheckBadge } from '../components/BodyFigure'

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function newSeed() {
  return Math.floor(Math.random() * 2147483647)
}

function formatClock(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function pluralRounds(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'круг'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'круга'
  return 'кругов'
}

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="p-1 -ml-1 text-gray-700 cursor-pointer" aria-label="Назад">
      <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}

function LevelIcon({ level }) {
  const count = LEVELS.findIndex((l) => l.id === level) + 1
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <path
          key={i}
          d={`M12 ${4 + i * 4}l8 4-8 4-8-4z`}
          fill="currentColor"
          opacity={1 - (count - 1 - i) * 0.3}
          transform={`translate(0 ${(3 - count) * 2})`}
        />
      ))}
    </svg>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function ExerciseThumb({ exerciseId }) {
  const mid = `/exercises/${exerciseId}-mid.webp`
  const regular = `/exercises/${exerciseId}.webp`
  return (
    <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
      <img
        src={mid}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          if (e.currentTarget.src.endsWith('-mid.webp')) e.currentTarget.src = regular
          else e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

// ── Шаг 1: самочувствие ─────────────────────────────────────────────────────
function MoodStep({ mood, onSelect, onClose }) {
  const now = new Date()
  return (
    <div className="px-4 pt-4 pb-6 min-h-full flex flex-col">
      <div className="flex items-center justify-between">
        <BackButton onClick={onClose} />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Генератор тренировок</span>
        <span className="w-8" />
      </div>

      <div className="text-center mt-8 mb-8">
        <p className="text-base font-semibold text-gray-500">{MONTHS[now.getMonth()]}</p>
        <p className="text-7xl font-bold text-gray-900 leading-none mt-1">{now.getDate()}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-6 max-w-xs mx-auto leading-tight">
          Как ты себя чувствуешь сегодня?
        </h1>
        <p className="text-sm text-gray-500 mt-2">Подберём тренировку под твоё состояние</p>
      </div>

      <div className="space-y-3 max-w-sm w-full mx-auto">
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`w-full py-4 px-5 rounded-2xl border-2 text-left transition-colors ${
              mood === m.id
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="block font-semibold text-gray-900">{m.label}</span>
            <span className="block text-sm text-gray-500 mt-0.5">{m.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Шаг 2: настройки ────────────────────────────────────────────────────────
function SettingsStep({ mood, settings, onChange, onBack, onCreate }) {
  const moodLabel = MOODS.find((m) => m.id === mood)?.label
  const pct = ((settings.durationMin - DURATION_MIN) / (DURATION_MAX - DURATION_MIN)) * 100

  return (
    <>
      <div className="px-4 pt-4 pb-40">
        <div className="flex items-center gap-3 mb-4">
          <BackButton onClick={onBack} />
          <h1 className="text-xl font-bold text-gray-900">Генератор тренировок</h1>
        </div>

        {/* Hero */}
        <div className="rounded-2xl bg-primary text-white p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Свой план на сегодня</p>
          <p className="text-2xl font-bold mt-1 leading-tight">Персональная тренировка</p>
          <button
            onClick={onBack}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/80 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/15"
          >
            {moodLabel}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 14.536 9 15l.464-3.536z" />
            </svg>
          </button>
        </div>

        {/* Длительность */}
        <section className="mb-7">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Длительность</h2>
            <p className="text-gray-900">
              <span className="text-3xl font-bold">{settings.durationMin}</span>
              <span className="text-sm text-gray-500 ml-1">мин</span>
            </p>
          </div>
          <input
            type="range"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={5}
            value={settings.durationMin}
            onChange={(e) => onChange({ durationMin: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-gray-900"
            style={{ background: `linear-gradient(to right, #0A0A0A ${pct}%, #E5E7EB ${pct}%)` }}
            aria-label="Длительность тренировки"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{DURATION_MIN} мин</span>
            <span>{DURATION_MAX} мин</span>
          </div>
        </section>

        <div className="border-t border-gray-100 mb-6" />

        {/* Область */}
        <section className="mb-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Область внимания</h2>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {FOCUSES.map((f) => {
              const selected = settings.focus === f.id
              return (
                <button key={f.id} onClick={() => onChange({ focus: f.id })} className="flex flex-col items-center gap-2">
                  <span
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                      selected ? 'bg-gray-50 ring-2 ring-gray-900' : 'bg-gray-100'
                    }`}
                  >
                    <BodyFigure focus={f.id} selected={selected} />
                    {selected && <CheckBadge />}
                  </span>
                  <span className={`text-sm text-center ${selected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {f.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="border-t border-gray-100 mb-6" />

        {/* Уровень */}
        <section className="mb-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Уровень</h2>
          <div className="grid grid-cols-3 gap-3">
            {LEVELS.map((l) => {
              const selected = settings.level === l.id
              return (
                <button key={l.id} onClick={() => onChange({ level: l.id })} className="flex flex-col items-center gap-2">
                  <span
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                      selected ? 'bg-gray-50 ring-2 ring-gray-900 text-gray-900' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <LevelIcon level={l.id} />
                    {selected && <CheckBadge />}
                  </span>
                  <span className={`text-sm ${selected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{l.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="border-t border-gray-100 mb-2" />

        {/* Переключатели */}
        <section className="divide-y divide-gray-100">
          {[
            { key: 'warmup', icon: '🤸', title: 'Разминка', sub: '+2 мин · перед тренировкой' },
            { key: 'cooldown', icon: '🧘', title: 'Заминка', sub: '+2 мин · спокойный темп после' },
            { key: 'dumbbells', icon: '🏋️', title: 'Есть гантели', sub: 'Добавим жим и сгибания' },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-3 py-4">
              <span className="text-2xl w-8 text-center" aria-hidden="true">{row.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{row.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{row.sub}</p>
              </div>
              <Toggle
                label={row.title}
                checked={settings[row.key]}
                onChange={(v) => onChange({ [row.key]: v })}
              />
            </div>
          ))}
        </section>
      </div>

      <div className="fixed bottom-[50px] left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onCreate}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            Создать для меня
          </button>
        </div>
      </div>
    </>
  )
}

// ── Шаг 3: генерация ────────────────────────────────────────────────────────
const GENERATING_MS = 1800
const GENERATING_HINTS = ['Учитываем самочувствие', 'Подбираем упражнения', 'Считаем нагрузку']

function GeneratingStep({ onDone }) {
  const [pct, setPct] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / GENERATING_MS)
      setPct(Math.round((1 - Math.pow(1 - p, 2)) * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else timeout = setTimeout(() => onDoneRef.current(), 250)
    }
    let timeout
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
    }
  }, [])

  const r = 52
  const c = 2 * Math.PI * r
  const hint = GENERATING_HINTS[Math.min(GENERATING_HINTS.length - 1, Math.floor(pct / 34))]

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 max-w-xs leading-tight">Собираем твою личную тренировку…</h1>
      <div className="relative w-44 h-44 mt-10">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none" stroke="#0A0A0A" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gray-900">{pct}%</span>
      </div>
      <p className="text-sm text-gray-500 mt-8">{hint}</p>
    </div>
  )
}

// ── Шаг 4: результат ────────────────────────────────────────────────────────
function ResultStep({ workout, onBack, onSettings, onRegenerate, onStart }) {
  const stats = useMemo(() => workoutStats(workout), [workout])
  const reasons = workout.generated?.reasons || []

  return (
    <>
      <div className="px-4 pt-4 pb-44">
        <div className="flex items-center gap-3 mb-4">
          <BackButton onClick={onBack} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{workout.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{workout.description}</p>

        {/* Статистика */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 mt-5 mb-6">
          {[
            [stats.exerciseCount, 'Упражнений'],
            [`${stats.minutes} мин`, 'Время'],
            [`≈ ${stats.kcal}`, 'Ккал'],
          ].map(([value, label], i) => (
            <div key={label} className={i === 0 ? 'pr-3' : 'px-3'}>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Почему так */}
        {reasons.length > 0 && (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Подобрано под тебя</p>
            <ul className="space-y-1.5">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-accent font-bold">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Инвентарь */}
        {stats.gear.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Понадобится</p>
            <div className="flex flex-wrap gap-2">
              {stats.gear.map((g) => (
                <span key={g} className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                  {GEAR_LABELS[g]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Блоки */}
        <div className="space-y-6">
          {workout.blocks.map((block) => {
            const exercises = block.items.filter((it) => it.type === 'exercise')
            return (
              <section key={block.id}>
                <div className="flex items-baseline gap-1.5">
                  <h2 className="text-lg font-bold text-gray-900">{block.name}</h2>
                  <span className="text-gray-400">({exercises.length * block.repeat})</span>
                </div>
                {block.repeat > 1 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {block.repeat} {pluralRounds(block.repeat)} × {exercises.length} упражнений
                  </p>
                )}
                <div className="relative mt-3">
                  <span className="absolute left-[27px] top-4 bottom-4 w-px bg-gray-200" aria-hidden="true" />
                  <ul className="space-y-3 relative">
                    {exercises.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <ExerciseThumb exerciseId={item.exerciseId} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {data.exercises[item.exerciseId]?.name || item.exerciseId}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatClock(item.durationSec)}
                            {item.note && <span className="text-gray-400"> · {item.note}</span>}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-[50px] left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-4 pt-3 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onSettings}
              className="flex flex-col items-center justify-center w-16 text-gray-700 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-[11px] font-medium mt-0.5">Настройки</span>
            </button>
            <button
              onClick={onStart}
              className="flex-1 py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Начать
            </button>
          </div>
          <button
            onClick={onRegenerate}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 py-2 mt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Не устраивает? Подобрать другую
          </button>
        </div>
      </div>
    </>
  )
}

// ── Экран генератора ────────────────────────────────────────────────────────
export default function Generator() {
  const navigate = useNavigate()
  const location = useLocation()
  const existing = location.state?.fresh ? null : getTodayGeneratedWorkout()

  const [step, setStep] = useState(existing ? 'result' : 'mood') // mood | settings | generating | result
  const [mood, setMood] = useState(existing?.generated?.mood || null)
  const [settings, setSettings] = useState(() => existing?.generated?.settings || defaultSettings())
  const [workout, setWorkout] = useState(existing)
  const [pending, setPending] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  function updateSettings(patch) {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }

  function create() {
    const w = generateWorkout({ mood: mood || 'normal', settings, seed: newSeed() })
    setPending(w)
    setStep('generating')
  }

  function finishGenerating() {
    saveGeneratedWorkout(pending)
    setWorkout(pending)
    setPending(null)
    setStep('result')
  }

  if (step === 'mood') {
    return (
      <MoodStep
        mood={mood}
        onClose={() => navigate('/workouts')}
        onSelect={(m) => {
          setMood(m)
          setStep('settings')
        }}
      />
    )
  }

  if (step === 'settings') {
    return (
      <SettingsStep
        mood={mood}
        settings={settings}
        onChange={updateSettings}
        onBack={() => setStep('mood')}
        onCreate={create}
      />
    )
  }

  if (step === 'generating') {
    return <GeneratingStep onDone={finishGenerating} />
  }

  return (
    <ResultStep
      workout={workout}
      onBack={() => navigate('/workouts')}
      onSettings={() => setStep('settings')}
      onRegenerate={create}
      onStart={() => navigate(`/workout/${workout.id}/play`)}
    />
  )
}
