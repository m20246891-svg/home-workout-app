// Диагностика настройки бота: какие переменные видит сервер и работает ли база.
// Значения не раскрываются — только отпечаток (первые 8 символов SHA-256) для сверки.
import crypto from 'node:crypto'
import { redis } from './_lib.js'

const fp = (v) => (v ? crypto.createHash('sha256').update(v).digest('hex').slice(0, 8) : null)

export default async function handler(req, res) {
  let db = 'ok'
  try {
    await redis('PING')
  } catch (e) {
    db = e.message
  }
  res.status(200).json({
    botToken: fp(process.env.TELEGRAM_BOT_TOKEN),
    webhookSecret: fp(process.env.TELEGRAM_WEBHOOK_SECRET),
    cronSecret: fp(process.env.CRON_SECRET),
    redis: db,
    env: process.env.VERCEL_ENV || null,
  })
}
