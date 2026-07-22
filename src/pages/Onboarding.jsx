import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { set } from '../utils/storage'

const steps = [
  {
    key: 'goal',
    title: 'Какая твоя цель?',
    options: [
      { value: 'lose-weight', label: 'Похудеть' },
      { value: 'keep-fit', label: 'Поддерживать форму' },
      { value: 'gain-strength', label: 'Набрать силу' },
    ],
  },
  {
    key: 'level',
    title: 'Твой уровень подготовки?',
    options: [
      { value: 'beginner', label: 'Новичок' },
      { value: 'intermediate', label: 'Средний' },
      { value: 'advanced', label: 'Продвинутый' },
    ],
  },
  {
    key: 'equipment',
    title: 'Какой у тебя инвентарь?',
    options: [
      { value: 'none', label: 'Нет инвентаря' },
      { value: 'dumbbells', label: 'Есть гантели' },
      { value: 'mat', label: 'Есть коврик' },
    ],
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const navigate = useNavigate()

  const current = steps[step]
  const isLast = step === steps.length - 1

  function handleSelect(value) {
    const updated = { ...answers, [current.key]: value }
    setAnswers(updated)

    if (isLast) {
      set('onboarding', updated)
      onComplete?.()
      navigate('/workouts', { replace: true })
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? 'bg-primary w-6' : i < step ? 'bg-gray-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
          {current.title}
        </h1>

        <div className="space-y-3">
          {current.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="w-full py-4 px-6 rounded-2xl border-2 border-gray-200 bg-white text-gray-800 font-medium text-base text-left hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="pb-8 text-center text-sm text-gray-400">
        Шаг {step + 1} из {steps.length}
      </div>
    </div>
  )
}
