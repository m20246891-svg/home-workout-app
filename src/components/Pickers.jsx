import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Барабан (год рождения): вертикальный список со snap к центру.
const WHEEL_ITEM = 52
const WHEEL_VISIBLE = 5

export function WheelPicker({ values, value, onChange }) {
  const ref = useRef(null)
  const idx = Math.max(0, values.indexOf(value))
  const timer = useRef(null)

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * WHEEL_ITEM
    // только при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll() {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const i = Math.round(ref.current.scrollTop / WHEEL_ITEM)
      const v = values[Math.min(values.length - 1, Math.max(0, i))]
      if (v !== value) onChange(v)
    }, 60)
  }

  const pad = ((WHEEL_VISIBLE - 1) / 2) * WHEEL_ITEM
  return (
    <div className="relative" style={{ height: WHEEL_ITEM * WHEEL_VISIBLE }}>
      <div
        className="absolute left-0 right-0 rounded-2xl bg-gray-100 ring-2 ring-gray-900 pointer-events-none"
        style={{ top: pad, height: WHEEL_ITEM }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="relative h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
        style={{ paddingTop: pad, paddingBottom: pad }}
      >
        {values.map((v, i) => {
          const dist = Math.abs(i - idx)
          return (
            <button
              key={v}
              type="button"
              onClick={() => ref.current.scrollTo({ top: i * WHEEL_ITEM, behavior: 'smooth' })}
              className={`w-full snap-center flex items-center justify-center transition-colors ${
                dist === 0 ? 'text-2xl font-bold text-gray-900' : dist === 1 ? 'text-xl text-gray-400' : 'text-lg text-gray-300'
              }`}
              style={{ height: WHEEL_ITEM }}
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Линейка (рост, вес): прокрутка со snap к делениям, центральная метка — текущее значение.
const TICK = 12 // px на одно деление

export function Ruler({ min, max, value, onChange, vertical = false, labelEvery = 5 }) {
  const ref = useRef(null)
  const [size, setSize] = useState(0)
  const timer = useRef(null)
  const count = max - min + 1

  const positioned = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setSize(vertical ? el.clientHeight : el.clientWidth)
  }, [vertical])

  // Начальная прокрутка — только после того, как применились отступы (size > 0).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !size || positioned.current) return
    positioned.current = true
    // Вертикальная линейка: большие значения сверху.
    const offset = vertical ? (max - value) * TICK : (value - min) * TICK
    if (vertical) el.scrollTop = offset
    else el.scrollLeft = offset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  function handleScroll() {
    if (!positioned.current) return
    const el = ref.current
    const pos = vertical ? el.scrollTop : el.scrollLeft
    const i = Math.round(pos / TICK)
    const v = vertical ? max - i : min + i
    const clamped = Math.min(max, Math.max(min, v))
    if (clamped !== value) onChange(clamped)
    clearTimeout(timer.current)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const pad = size / 2 - TICK / 2
  const ticks = Array.from({ length: count }, (_, i) => (vertical ? max - i : min + i))

  if (vertical) {
    return (
      <div className="relative h-72 w-28">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-900 z-10 pointer-events-none" />
        <div
          ref={ref}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
          style={{ paddingTop: pad, paddingBottom: pad }}
        >
          {ticks.map((t) => {
            const major = t % labelEvery === 0
            return (
              <div key={t} className="snap-center flex items-center justify-end gap-2" style={{ height: TICK }}>
                {major && t % (labelEvery * 2) === 0 && <span className="text-xs text-gray-400">{t}</span>}
                <span className={`h-px ${major ? 'w-8 bg-gray-400' : 'w-4 bg-gray-300'}`} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-20">
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-900 z-10 pointer-events-none" />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-x-auto snap-x snap-mandatory no-scrollbar flex"
        style={{ paddingLeft: pad, paddingRight: pad }}
      >
        {ticks.map((t) => {
          const major = t % labelEvery === 0
          return (
            <div key={t} className="snap-center flex-shrink-0 flex flex-col items-center justify-start" style={{ width: TICK }}>
              <span className={`w-px ${major ? 'h-8 bg-gray-400' : 'h-4 bg-gray-300'}`} />
              {major && t % (labelEvery * 2) === 0 && <span className="text-xs text-gray-400 mt-1.5">{t}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
