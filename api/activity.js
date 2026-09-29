// Приложение в Telegram сообщает серию и дату последней тренировки —
// чтобы вечером не напоминать тем, кто уже потренировался.
import { verifyInitData, saveUser } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

  const user = verifyInitData(body.initData)
  if (!user?.id) return res.status(401).json({ ok: false })

  const streak = Math.max(0, Math.min(10000, Number(body.streak) || 0))
  const lastDone = /^\d{4}-\d{2}-\d{2}$/.test(body.lastDone || '') ? body.lastDone : ''
  const tzOffset = Math.max(-840, Math.min(840, Number(body.tzOffset) || 0))

  try {
    await saveUser(user.id, {
      chatId: user.id, // в личке с ботом chat.id совпадает с user.id
      firstName: user.first_name || '',
      streak,
      lastDone,
      tzOffset,
      lastSeen: Date.now(),
    })
  } catch (e) {
    console.error('activity error', e)
    return res.status(500).json({ ok: false })
  }
  return res.status(200).json({ ok: true })
}
