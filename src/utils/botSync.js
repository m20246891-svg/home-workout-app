// Сообщаем боту ударный режим, заморозки и дату последней тренировки — для вечерних напоминаний.
// Работает только внутри Telegram: на сервере данные проверяются по подписи initData.
import { get, onChange } from './storage'
import { IN_TELEGRAM } from './telegram'
import { computeStreak, freezesOf } from './activity'

let lastSent = ''

function report() {
  const progress = get('progress') || {}
  const dates = progress.completedDates || []
  const frozen = progress.frozenDates || []
  const payload = {
    streak: computeStreak(dates, undefined, frozen).current,
    // Последний день, когда режим держался (тренировка или заморозка).
    lastDone: [...dates, ...frozen].sort().pop() || '',
    freezes: freezesOf(progress),
    tzOffset: new Date().getTimezoneOffset(),
  }
  const key = JSON.stringify(payload)
  if (key === lastSent) return
  lastSent = key
  fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, initData: window.Telegram.WebApp.initData }),
    keepalive: true,
  }).catch(() => {
    lastSent = ''
  })
}

export function startBotSync() {
  if (!IN_TELEGRAM) return
  report()
  let timer
  onChange(() => {
    clearTimeout(timer)
    timer = setTimeout(report, 1000)
  })
}
