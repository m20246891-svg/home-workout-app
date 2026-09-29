// Вебхук бота: /start — приветствие с инструкцией, /stop и /remind — напоминания.
import { tg, saveUser, APP_URL, openAppButton, welcomeCaption, secretMatches, parseBody } from './_lib.js'

const WELCOME_IMAGE = `${APP_URL}/img/bot-welcome.jpg`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  // Telegram присылает секрет, заданный при setWebhook.
  if (!secretMatches(req.headers['x-telegram-bot-api-secret-token'], process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return res.status(401).end()
  }

  const update = parseBody(req)
  const msg = update?.message
  const text = msg?.text?.trim() || ''
  const chatId = msg?.chat?.id

  // Отвечаем Telegram всегда 200 — иначе он будет повторять апдейт.
  try {
    if (chatId && msg.chat.type === 'private') {
      const command = text.split(/[\s@]/)[0]

      if (command === '/start') {
        await saveUser(msg.from.id, {
          chatId,
          firstName: msg.from.first_name || '',
          subscribed: 1,
          startedAt: Date.now(),
        })
        await tg('sendPhoto', {
          chat_id: chatId,
          photo: WELCOME_IMAGE,
          caption: welcomeCaption(msg.from.first_name),
          parse_mode: 'HTML',
          reply_markup: openAppButton(),
        })
      } else if (command === '/stop') {
        await saveUser(msg.from.id, { chatId, subscribed: 0 })
        await tg('sendMessage', {
          chat_id: chatId,
          text: '🔕 Напоминания отключены. Включить снова — /remind',
        })
      } else if (command === '/remind') {
        await saveUser(msg.from.id, { chatId, subscribed: 1 })
        await tg('sendMessage', {
          chat_id: chatId,
          text: '🔔 Готово! Буду напоминать о тренировке каждый вечер.',
          reply_markup: openAppButton(),
        })
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: 'Все тренировки и питание — в приложении 👇',
          reply_markup: openAppButton(),
        })
      }
    }
  } catch (e) {
    console.error('telegram webhook error', e)
  }
  return res.status(200).json({ ok: true })
}
