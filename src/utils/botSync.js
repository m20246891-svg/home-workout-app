// Сообщаем боту серию и дату последней тренировки — для вечерних напоминаний.
// Работает только внутри Telegram: на сервере данные проверяются по подписи initData.
import { get, onChange } from './storage'
import { IN_TELEGRAM } from './telegram'
import { computeStreak } from './activity'

let lastSent = ''

function report() {
  const progress = get('progress') || {}
  const dates = progress.completedDates || []
  const payload = {
    streak: computeStreak(dates).current,
    lastDone: [...dates].sort().pop() || '',
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
