// Первичная настройка бота (запускается один раз и после смены адреса приложения).
// Нужны в .env.local: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET (те же, что в Vercel).
//   node scripts/setup-bot.mjs
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = join(root, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const APP_URL = process.env.APP_URL || 'https://home-workout-app-eta.vercel.app'
if (!TOKEN || !SECRET) {
  console.error('Нужны TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET в .env.local')
  process.exit(1)
}

async function call(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  console.log(`${data.ok ? '✓' : '✗'} ${method}${data.ok ? '' : ': ' + data.description}`)
  if (!data.ok) process.exitCode = 1
  return data.result
}

const me = await call('getMe')
console.log(`  бот: @${me?.username}`)

await call('setWebhook', {
  url: `${APP_URL}/api/telegram`,
  secret_token: SECRET,
  allowed_updates: ['message'],
  drop_pending_updates: true,
})

await call('setMyCommands', {
  commands: [
    { command: 'start', description: 'Как начать и открыть приложение' },
    { command: 'remind', description: 'Включить вечерние напоминания' },
    { command: 'stop', description: 'Отключить напоминания' },
  ],
})

// Кнопка слева от поля ввода (сейчас «Open App»).
await call('setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'Тренировки', web_app: { url: APP_URL } },
})

// Текст в пустом чате до нажатия «Старт» (до 512 символов).
await call('setMyDescription', {
  description: [
    '🏋️ Тренировки дома, которые подстраиваются под тебя.',
    '',
    '⚡ Генератор тренировок под самочувствие и цель',
    '📅 План на 28 дней — от 8 до 21 минуты в день',
    '🥗 Рацион питания на месяц',
    '🔥 Серии и напоминания, чтобы не бросить',
    '',
    'Нажми «Старт» 👇',
  ].join('\n'),
})

// Короткое описание в профиле бота (до 120 символов).
await call('setMyShortDescription', {
  short_description: 'Домашние тренировки и питание: генератор тренировок, план на 28 дней, рацион на месяц.',
})

const info = await call('getWebhookInfo')
console.log(`  вебхук: ${info?.url} · ожидает: ${info?.pending_update_count}${info?.last_error_message ? ' · ошибка: ' + info.last_error_message : ''}`)
