// Диагностика настройки бота: заданы ли переменные и работает ли база.
// Доступ только с CRON_SECRET: curl -H "Authorization: Bearer $CRON_SECRET" …/api/health
import { redis, isCronAuthorized } from './_lib.js'

export default async function handler(req, res) {
  if (!isCronAuthorized(req)) return res.status(401).end()
  let db = 'ok'
  try {
    await redis('PING')
  } catch {
    db = 'error'
  }
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    botToken: !!process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
    cronSecret: !!process.env.CRON_SECRET,
    redis: db,
    env: process.env.VERCEL_ENV || null,
  })
}
