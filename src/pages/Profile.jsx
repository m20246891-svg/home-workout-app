import { useState } from 'react'
import useLocalProgress from '../hooks/useLocalProgress'
import { get, set } from '../utils/storage'

const goalOptions = [
  { value: 'lose-weight', label: 'Похудеть' },
  { value: 'keep-fit', label: 'Поддерживать форму' },
  { value: 'gain-strength', label: 'Набрать силу' },
]

const levelOptions = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
]

const equipmentOptions = [
  { value: 'none', label: 'Нет инвентаря' },
  { value: 'dumbbells', label: 'Гантели' },
  { value: 'mat', label: 'Коврик' },
]

const optionGroups = [
  { key: 'goal', label: 'Цель', options: goalOptions },
  { key: 'level', label: 'Уровень', options: levelOptions },
  { key: 'equipment', label: 'Инвентарь', options: equipmentOptions },
]

export default function Profile() {
  const { progress, resetProgress } = useLocalProgress()
  const [onboarding, setOnboarding] = useState(() => get('onboarding') || {})
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  function handleChange(key, value) {
    const updated = { ...onboarding, [key]: value }
    setOnboarding(updated)
    set('onboarding', updated)
  }

  function handleReset() {
    resetProgress()
    setShowResetConfirm(false)
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Профиль</h1>

      {/* Onboarding answers */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Мои настройки</h2>

        <div className="space-y-4">
          {optionGroups.map((group) => (
            <div key={group.key}>
              <p className="text-sm text-gray-500 mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleChange(group.key, opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      onboarding[group.key] === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Статистика</h2>
        <div className="space-y-1 text-sm text-gray-600">
          <p>Всего тренировок: <span className="font-semibold text-gray-900">{progress.completedWorkouts?.length || 0}</span></p>
          <p>Текущая серия: <span className="font-semibold text-gray-900">{progress.streak || 0} 🔥</span></p>
        </div>
      </div>

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
