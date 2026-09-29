import { useState, useEffect } from 'react'
import useLocalProgress from '../hooks/useLocalProgress'
import useProgram from '../hooks/useProgram'
import { useNavigate } from 'react-router-dom'
import { get, set, remove } from '../utils/storage'
import {
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
  ZONE_OPTIONS,
  EQUIPMENT_OPTIONS,
  TIME_OPTIONS,
  GENDER_OPTIONS,
  getPreferences,
  savePreferences,
} from '../utils/preferences'
import data from '../data/workouts.json'

function findWorkoutTitle(id) {
  for (const cat of data.categories) {
    const found = cat.workouts.find((w) => w.id === id)
    if (found) return found.title
  }
  return id
}

const animalEmojis = [
  '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐰', '🐻', '🐸',
  '🐵', '🦉', '🐺', '🐹', '🐷', '🐮', '🦝', '🐭', '🐧', '🦄',
  '🐙', '🦋', '🐞', '🐳',
]

function getAnimalEmoji(seed) {
  const idx = Math.abs(typeof seed === 'number' ? seed : String(seed).length) % animalEmojis.length
  return animalEmojis[idx]
}

const optionGroups = [
  { key: 'goal', label: 'Цель', options: GOAL_OPTIONS },
  { key: 'level', label: 'Уровень', options: LEVEL_OPTIONS },
  { key: 'zones', label: 'Зоны', options: ZONE_OPTIONS, multi: true },
  { key: 'equipment', label: 'Инвентарь', options: EQUIPMENT_OPTIONS, multi: true, exclusive: 'none' },
  { key: 'timeMin', label: 'Время на тренировку', options: TIME_OPTIONS },
]

export default function Profile() {
  const { progress, resetProgress } = useLocalProgress()
  const { program: prog } = useProgram()
  const navigate = useNavigate()
  const [onboarding, setOnboarding] = useState(getPreferences)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const [userProfile, setUserProfile] = useState(() => {
    const saved = get('userProfile')
    if (saved) return saved
    const fresh = { name: '', age: '', gender: '', avatarSeed: Math.floor(Math.random() * 2147483647) }
    set('userProfile', fresh)
    return fresh
  })

  useEffect(() => {
    set('userProfile', userProfile)
  }, [userProfile])

  const avatarEmoji = getAnimalEmoji(userProfile.avatarSeed)

  function handleChange(group, value) {
    let nextValue = value
    if (group.multi) {
      const list = onboarding[group.key] || []
      if (list.includes(value)) nextValue = list.length > 1 ? list.filter((v) => v !== value) : list
      else if (value === group.exclusive) nextValue = [value]
      else nextValue = [...list.filter((v) => v !== group.exclusive), value]
    }
    const updated = { ...onboarding, [group.key]: nextValue }
    setOnboarding(updated)
    savePreferences(updated)
    // Генератор возьмёт свежие настройки из профиля.
    remove('generatorSettings')
  }

  function handleReset() {
    resetProgress()
    setShowResetConfirm(false)
  }

  function handleProfileChange(field, value) {
    setUserProfile((prev) => ({ ...prev, [field]: value }))
  }

  function handleShuffleAvatar() {
    setUserProfile((prev) => ({ ...prev, avatarSeed: Math.floor(Math.random() * 2147483647) }))
  }

  const completed = progress.completedWorkouts || []
  const sorted = [...completed].reverse()
  const total = completed.length

  function PillGroup({ label, options, value, onChange }) {
    return (
      <div>
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <div className="flex flex-wrap gap-2.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                (Array.isArray(value) ? value.includes(opt.value) : value === opt.value)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  function SectionCard({ children, className = '' }) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-4 mb-4 ${className}`}>
        {children}
      </div>
    )
  }

  function SectionHeader({ children }) {
    return <h2 className="text-lg font-semibold text-gray-900 mb-4">{children}</h2>
  }

  function EmptyState({ message, submessage }) {
    return (
      <div className="text-center py-6 mb-4 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-400">{message}</p>
        {submessage && <p className="text-gray-400 text-sm mt-1">{submessage}</p>}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Профиль</h1>

      {/* User profile card */}
      <SectionCard>
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-100 ring-2 ring-gray-200 flex items-center justify-center text-2xl">
              <span>{avatarEmoji}</span>
            </div>
            <button
              onClick={handleShuffleAvatar}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Перемешать
            </button>
          </div>

          {/* Fields */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Имя</p>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            {/* Age */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Возраст</p>
              <input
                type="number"
                value={userProfile.age}
                onChange={(e) => handleProfileChange('age', e.target.value)}
                placeholder="0"
                min="0"
                max="150"
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            {/* Gender */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Пол</p>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleProfileChange('gender', opt.value)}
                    className={`w-full px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      userProfile.gender === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Onboarding answers */}
      <SectionCard>
        <SectionHeader>Мои настройки</SectionHeader>
        <div className="space-y-4">
          {optionGroups.map((group) => (
            <PillGroup
              key={group.key}
              label={group.label}
              options={group.options}
              value={onboarding[group.key]}
              onChange={(val) => handleChange(group, val)}
            />
          ))}
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="w-full mt-5 py-3 rounded-xl bg-gray-100 text-gray-800 font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          Пройти онбординг заново
        </button>
      </SectionCard>

      {/* Stats cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Статистика</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between">
          <p className="text-sm text-gray-500 mb-1">Тренировок</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between">
          <p className="text-sm text-gray-500 mb-1">Серия</p>
          <p className="text-3xl font-bold text-gray-900">
            {progress.streak || 0}
            <span className="text-lg ml-1">🔥</span>
          </p>
        </div>
      </div>

      {/* History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">История</h2>

      {sorted.length === 0 ? (
        <EmptyState message="Пока нет завершённых тренировок" submessage="Заверши свою первую тренировку!" />
      ) : (
        <div className="space-y-2 mb-4">
          {sorted.map((entry, idx) => (
            <div
              key={`${entry.workoutId}-${entry.date}-${idx}`}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm text-gray-800 truncate mr-2">
                {findWorkoutTitle(entry.workoutId)}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{entry.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* Completed programs */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Пройденные планы</h2>

      {!prog.startDate || prog.completedDays.length < data.program.totalDays ? (
        <EmptyState message="Пока нет пройденных планов" />
      ) : (
        <div className="space-y-2 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex-shrink-0 text-base">🏆</span>
              <span className="text-sm text-gray-800 truncate">
                {data.program.title}
              </span>
            </div>
            <span className="text-xs text-accent font-medium whitespace-nowrap flex-shrink-0 ml-2">
              {data.program.totalDays} / {data.program.totalDays}
            </span>
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={() => setShowResetConfirm(true)}
        className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
      >
        Сбросить прогресс
      </button>

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Сбросить прогресс?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Будут удалены все завершённые тренировки и серия. Настройки останутся.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Сбросить
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
