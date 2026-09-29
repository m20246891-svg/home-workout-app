const APP_KEY = 'home-workout-app'

// Подписчики на изменения (облачная синхронизация в Telegram).
const listeners = new Set()

export function onChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function readAll() {
  try {
    const raw = localStorage.getItem(APP_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Полная замена данных (восстановление из облака) — без уведомления подписчиков.
export function writeAll(data) {
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

function commit(data) {
  data._updatedAt = Date.now()
  localStorage.setItem(APP_KEY, JSON.stringify(data))
  listeners.forEach((fn) => fn(data))
}

export function get(key) {
  try {
    const raw = localStorage.getItem(APP_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data[key] ?? null
  } catch {
    return null
  }
}

export function set(key, value) {
  try {
    const data = readAll()
    data[key] = value
    commit(data)
    return true
  } catch {
    return false
  }
}

export function remove(key) {
  try {
    const raw = localStorage.getItem(APP_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    delete data[key]
    commit(data)
    return true
  } catch {
    return false
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(APP_KEY)
    return true
  } catch {
    return false
  }
}
