// Ежедневное напоминание (Vercel Cron, см. vercel.json).
// Пишем тем, кто подписан, сегодня ещё не тренировался и заходил за последние 14 дней.
import { tg, redis, isCronAuthorized, getUser, saveUser, localDateFor, reminderText, openAppButton } from '../_lib.js'

const ACTIVE_DAYS = 14
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default async function handler(req, res) {
  if (!isCronAuthorized(req)) return res.status(401).end()

  const ids = (await redis('SMEMBERS', 'users')) || []
  const dayNumber = Math.floor(Date.now() / 86400000)
  const stats = { total: ids.length, sent: 0, skipped: 0, blocked: 0, failed: 0 }

  for (const id of ids) {
    const u = await getUser(id)
    if (!u || u.subscribed !== '1' || !u.chatId) {
      stats.skipped++
      continue
    }
    const lastActive = Number(u.lastSeen || u.startedAt || 0)
    const today = localDateFor(u.tzOffset ?? -180)
    if (u.lastDone === today || Date.now() - lastActive > ACTIVE_DAYS * 86400000 || u.lastReminded === today) {
      stats.skipped++
      continue
    }
    // Серия жива, только если последняя тренировка была вчера.
    const yesterday = localDateFor(u.tzOffset ?? -180, Date.now() - 86400000)
    const streak = u.lastDone === yesterday ? Number(u.streak) || 0 : 0

    try {
      await tg('sendMessage', {
        chat_id: u.chatId,
        text: reminderText(streak, dayNumber),
        reply_markup: openAppButton(streak > 0 ? '🔥 Сохранить серию' : '💪 Начать тренировку', '/workouts'),
      })
      await saveUser(id, { lastReminded: today })
      stats.sent++
    } catch (e) {
      // 403 — пользователь заблокировал бота: больше не пишем.
      if (e.code === 403) {
        await saveUser(id, { subscribed: 0 })
        stats.blocked++
      } else {
        console.error('remind error', id, e.message)
        stats.failed++
      }
    }
    await sleep(40) // лимит Telegram ~30 сообщений в секунду
  }

  console.log('remind', stats)
  return res.status(200).json(stats)
}
