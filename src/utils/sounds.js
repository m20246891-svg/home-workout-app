// Звуки тренировки: колокольчик в начале подхода и отдыха, короткие сигналы перед концом таймера.
// Синтезируются через Web Audio — без аудиофайлов.
import { get, set } from './storage'

let ctx = null

function audio() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

// Браузеры (особенно iOS и Telegram) включают звук только после касания экрана.
// Разблокируем контекст на первом касании — обычно это кнопка «Начать».
export function installAudioUnlock() {
  const unlock = () => {
    const c = audio()
    if (!c) return
    if (c.state === 'suspended') c.resume()
    // Короткий беззвучный буфер окончательно «будит» звук на iOS.
    const src = c.createBufferSource()
    src.buffer = c.createBuffer(1, 1, 22050)
    src.connect(c.destination)
    src.start(0)
  }
  for (const ev of ['pointerdown', 'touchend', 'keydown']) {
    document.addEventListener(ev, unlock, { passive: true })
  }
}

export const isSoundOn = () => get('soundOn') !== false
export const setSoundOn = (on) => set('soundOn', on)

function tone(c, { freq, start, duration, volume, type = 'sine' }) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

function ready() {
  if (!isSoundOn()) return null
  const c = audio()
  if (!c) return null
  if (c.state === 'suspended') c.resume()
  return c
}

// Звонкий колокольчик: основной тон и негармонические обертоны с долгим затуханием.
export function playBell() {
  const c = ready()
  if (!c) return
  const t = c.currentTime + 0.01
  const base = 1318 // ми 6-й октавы
  tone(c, { freq: base, start: t, duration: 1.6, volume: 0.35 })
  tone(c, { freq: base * 2.76, start: t, duration: 0.9, volume: 0.12 })
  tone(c, { freq: base * 5.4, start: t, duration: 0.45, volume: 0.05 })
  tone(c, { freq: base * 0.5, start: t, duration: 1.2, volume: 0.08 })
}

// Короткий сигнал обратного отсчёта.
export function playBeep() {
  const c = ready()
  if (!c) return
  tone(c, { freq: 1000, start: c.currentTime + 0.01, duration: 0.16, volume: 0.25, type: 'triangle' })
}
