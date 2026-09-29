// Общий код серверных функций бота (Vercel Functions, Node.js).
// Переменные окружения (Vercel → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN      — токен бота из @BotFather
//   TELEGRAM_WEBHOOK_SECRET — любая длинная случайная строка (защита вебхука)
//   CRON_SECRET             — защита ежедневной рассылки (Vercel передаёт его сам)
//   KV_REST_API_URL / KV_REST_API_TOKEN (или UPSTASH_REDIS_REST_URL / _TOKEN) — Upstash Redis
import crypto from 'node:crypto'

export const APP_URL = process.env.APP_URL || 'https://home-workout-app-eta.vercel.app'
const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN

// ── Telegram Bot API ────────────────────────────────────────────────────────
export async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!data.ok) {
    const err = new Error(`${method}: ${data.description || res.status}`)
    err.code = data.error_code
    throw err
  }
  return data.result
}

// ── Upstash Redis (REST) ────────────────────────────────────────────────────
function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Redis не настроен: нет KV_REST_API_URL / KV_REST_API_TOKEN')
  return { url, token }
}

export async function redis(...command) {
  const { url, token } = redisConfig()
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const data = await res.json()
  if (data.error) throw new Error(`redis ${command[0]}: ${data.error}`)
  return data.result
}

// Пользователь бота: users — множество id, user:<id> — хеш с полями.
export async function saveUser(id, fields) {
  const flat = Object.entries(fields).flatMap(([k, v]) => [k, String(v)])
  await redis('SADD', 'users', String(id))
  if (flat.length) await redis('HSET', `user:${id}`, ...flat)
}

export async function getUser(id) {
  const arr = await redis('HGETALL', `user:${id}`)
  if (!arr || !arr.length) return null
  const obj = {}
  for (let i = 0; i < arr.length; i += 2) obj[arr[i]] = arr[i + 1]
  return obj
}

// ── Проверка initData Mini App (подпись Telegram) ───────────────────────────
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function verifyInitData(initData, maxAgeSec = 7 * 24 * 3600) {
  if (!initData || !TOKEN()) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')
  const checkString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN()).digest()
  const expected = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  if (expected.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return null
  const authDate = Number(params.get('auth_date'))
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null
  try {
    return JSON.parse(params.get('user'))
  } catch {
    return null
  }
}

// ── Даты ────────────────────────────────────────────────────────────────────
// Локальная дата пользователя по его смещению (как Date#getTimezoneOffset, в минутах).
export function localDateFor(tzOffsetMin = -180, now = Date.now()) {
  return new Date(now - Number(tzOffsetMin) * 60000).toISOString().slice(0, 10)
}

export function pluralDays(n) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'день'
  if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return 'дня'
  return 'дней'
}

// ── Тексты ──────────────────────────────────────────────────────────────────
export const openAppButton = (text = '🚀 Открыть приложение', path = '/') => ({
  inline_keyboard: [[{ text, web_app: { url: `${APP_URL}${path}` } }]],
})

export function welcomeCaption(firstName) {
  const hi = firstName ? `👋 Привет, ${firstName}!` : '👋 Привет!'
  return [
    `${hi} Я — Workout Home, твой домашний тренер.`,
    '',
    '<b>Как начать:</b>',
    '1️⃣ Нажми «Открыть приложение» под этим сообщением — или кнопку «Тренировки» слева внизу',
    '2️⃣ Ответь на несколько вопросов — это 2 минуты',
    '3️⃣ Получи тренировку на сегодня под своё самочувствие',
    '',
    'Внутри: ⚡ генератор тренировок, 📅 план на 28 дней, 🥗 рацион питания на месяц.',
    '',
    '🔔 Каждый вечер напомню о тренировке, чтобы серия не сгорела. Отключить — /stop',
  ].join('\n')
}

// Напоминание: разные фразы, чтобы не надоедали.
const AT_RISK = [
  (n) => `🔥 Серия ${n} ${pluralDays(n)} под угрозой! Сегодня ещё не было тренировки — хватит и 10 минут.`,
  (n) => `🔥 ${n} ${pluralDays(n)} подряд — не останавливайся. Короткая тренировка сохранит серию.`,
  (n) => `⏳ День почти прошёл, а серия ${n} ${pluralDays(n)} ждёт продолжения. Успеешь за 10 минут!`,
]
const NO_STREAK = [
  () => '💪 Время тренировки! 10 минут сегодня — и начнётся новая серия.',
  () => '⚡ Короткая тренировка дома — лучший способ закончить день. Начнём серию?',
  () => '🏠 Никакого зала: 10 минут дома, и первый день серии твой.',
]

export function reminderText(streak, dayNumber = 0) {
  const list = streak > 0 ? AT_RISK : NO_STREAK
  return list[dayNumber % list.length](streak)
}
