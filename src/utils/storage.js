const APP_KEY = 'home-workout-app'

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
    const raw = localStorage.getItem(APP_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[key] = value
    localStorage.setItem(APP_KEY, JSON.stringify(data))
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
    localStorage.setItem(APP_KEY, JSON.stringify(data))
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
