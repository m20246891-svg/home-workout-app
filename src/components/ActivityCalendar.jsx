import { useState } from 'react'
import { localDate, monthGrid, dayStatuses, parseDate } from '../utils/activity'

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const STATUS = {
  done: { cell: 'bg-emerald-500 text-white', dot: 'bg-emerald-500', label: 'Выполнено' },
  partial: { cell: 'bg-amber-400 text-gray-900', dot: 'bg-amber-400', label: 'Не завершено' },
  missed: { cell: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Пропущено' },
}

function humanDate(str) {
  const d = parseDate(str)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

// Календарь активности: зелёный — выполнено, жёлтый — начато и брошено, красный — пропуск.
export default function ActivityCalendar({ completedDates, partialDates, trackingStart, entriesByDate }) {
  const today = localDate()
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState(today)

  const statusOf = dayStatuses({ completedDates, partialDates, trackingStart, today })
  const cells = monthGrid(view.y, view.m)

  const shift = (delta) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth()

  // Итоги месяца.
  const monthDates = cells.filter(Boolean)
  const counts = { done: 0, partial: 0, missed: 0 }
  for (const d of monthDates) {
    const s = statusOf(d)
    if (s) counts[s]++
  }

  const selectedStatus = statusOf(selected)
  const entries = entriesByDate[selected] || []

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
      {/* Заголовок месяца */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-1)} className="p-2 -ml-2 text-gray-600 hover:text-gray-900" aria-label="Предыдущий месяц">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="font-semibold text-gray-900">{MONTHS[view.m]} {view.y}</p>
        <button
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900 disabled:text-gray-200"
          aria-label="Следующий месяц"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Сетка */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[11px] font-medium text-gray-400 pb-1">{w}</span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />
          const status = statusOf(date)
          const isToday = date === today
          const isFuture = date > today
          const isSelected = date === selected
          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => setSelected(date)}
              className={`aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition ${
                status ? STATUS[status].cell : isFuture ? 'text-gray-300' : 'text-gray-700 bg-gray-50'
              } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''} ${isSelected && !isToday ? 'ring-2 ring-gray-300 ring-offset-1' : ''}`}
            >
              {parseDate(date).getDate()}
            </button>
          )
        })}
      </div>

      {/* Легенда и итоги месяца */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {Object.entries(STATUS).map(([key, s]) => (
          <div key={key} className="rounded-xl bg-gray-50 px-2.5 py-2">
            <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              {s.label}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-0.5 tabular-nums">{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Выбранный день */}
      <div className="border-t border-gray-100 mt-4 pt-3">
        <p className="text-sm font-semibold text-gray-900">
          {selected === today ? 'Сегодня' : humanDate(selected)}
          {selectedStatus && (
            <span className="ml-2 text-xs font-medium text-gray-500">· {STATUS[selectedStatus].label}</span>
          )}
        </p>
        {entries.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {entries.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${e.done ? STATUS.done.dot : STATUS.partial.dot}`} />
                  <span className="truncate text-gray-800">{e.title}</span>
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">{e.done ? 'готово' : `${e.percent ?? 0}%`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 mt-1">
            {selectedStatus === 'missed' ? 'В этот день тренировки не было' : selected === today ? 'Сегодня ещё нет тренировок' : 'Нет тренировок'}
          </p>
        )}
      </div>
    </div>
  )
}
