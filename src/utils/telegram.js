// Интеграция с Telegram Mini App. Вне Telegram все функции — безопасные заглушки.
// SDK подключается в index.html (telegram-web-app.js); внутри Telegram у него есть initData.

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

export const IN_TELEGRAM = Boolean(tg && tg.initData)

const supports = (version) => IN_TELEGRAM && tg.isVersionAtLeast?.(version)

export function initTelegram() {
  if (!IN_TELEGRAM) return
  tg.ready()
  tg.expand()
  // Приложение светлое — красим шапку и фон Telegram в тон, независимо от темы пользователя.
  if (supports('6.1')) {
    tg.setHeaderColor('#ffffff')
    tg.setBackgroundColor('#ffffff')
  }
  if (supports('7.10')) tg.setBottomBarColor('#ffffff')
  // Свайп вниз не должен закрывать приложение посреди тренировки.
  if (supports('7.7')) tg.disableVerticalSwipes()
  document.documentElement.classList.add('in-telegram')
}

// Имя из профиля Telegram — подставляем в онбординг.
export function telegramUser() {
  return IN_TELEGRAM ? tg.initDataUnsafe?.user ?? null : null
}

// Имя и фото из Telegram → профиль приложения. Имя подставляем, только если пользователь
// его ещё не ввёл сам; ссылку на фото обновляем при каждом входе (фото в Telegram могут сменить).
export function syncTelegramProfile(get, set) {
  const user = telegramUser()
  if (!user) return
  const profile = get('userProfile') || {}
  const next = { ...profile }
  if (!profile.name && user.first_name) next.name = user.first_name
  next.tgPhotoUrl = user.photo_url || null
  if (next.name !== profile.name || next.tgPhotoUrl !== profile.tgPhotoUrl) {
    if (next.avatarSeed == null) next.avatarSeed = Math.floor(Math.random() * 2147483647)
    set('userProfile', next)
  }
}

// Системная кнопка «Назад» в шапке Telegram.
export function setBackButton(onClick) {
  if (!supports('6.1')) return () => {}
  if (!onClick) {
    tg.BackButton.hide()
    return () => {}
  }
  tg.BackButton.onClick(onClick)
  tg.BackButton.show()
  return () => {
    tg.BackButton.offClick(onClick)
    tg.BackButton.hide()
  }
}

// Подтверждение закрытия — пока идёт тренировка.
export function setClosingConfirmation(enabled) {
  if (!supports('6.2')) return
  if (enabled) tg.enableClosingConfirmation()
  else tg.disableClosingConfirmation()
}

export const haptic = {
  tap() {
    if (supports('6.1')) tg.HapticFeedback.impactOccurred('light')
  },
  step() {
    if (supports('6.1')) tg.HapticFeedback.impactOccurred('medium')
  },
  success() {
    if (supports('6.1')) tg.HapticFeedback.notificationOccurred('success')
  },
}

// ── CloudStorage: прогресс хранится в аккаунте Telegram ─────────────────────
// Значение ключа — до 4096 символов, поэтому данные режем на куски.
const CHUNK = 4000
const META_KEY = 'hw_meta'
const chunkKey = (i) => `hw_${i}`

function cloud(method, ...args) {
  return new Promise((resolve, reject) => {
    tg.CloudStorage[method](...args, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

export const CLOUD_AVAILABLE = supports('6.9')

export async function cloudLoad() {
  const metaRaw = await cloud('getItem', META_KEY)
  if (!metaRaw) return null
  const meta = JSON.parse(metaRaw)
  const keys = Array.from({ length: meta.n }, (_, i) => chunkKey(i))
  const parts = await cloud('getItems', keys)
  const json = keys.map((k) => parts[k] ?? '').join('')
  return { updatedAt: meta.updatedAt, data: JSON.parse(json) }
}

export async function cloudSave(data, updatedAt) {
  const json = JSON.stringify(data)
  const n = Math.ceil(json.length / CHUNK) || 1
  for (let i = 0; i < n; i++) {
    await cloud('setItem', chunkKey(i), json.slice(i * CHUNK, (i + 1) * CHUNK))
  }
  await cloud('setItem', META_KEY, JSON.stringify({ n, updatedAt }))
}
