import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initTelegram, syncTelegramProfile } from './utils/telegram'
import { get, set } from './utils/storage'
import { startCloudSync } from './utils/cloudSync'
import { startBotSync } from './utils/botSync'
import { applyFreezes } from './utils/activity'
import './index.css'

initTelegram()

// Пропущенные дни прикрываем заморозками — при запуске и при возврате в приложение.
function applyStoredFreezes() {
  const progress = get('progress')
  const next = progress && applyFreezes(progress)
  if (next && next !== progress) set('progress', next)
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') applyStoredFreezes()
})

// В Telegram сначала подтягиваем прогресс из облака, потом рисуем приложение.
startCloudSync().finally(() => {
  syncTelegramProfile(get, set)
  applyStoredFreezes()
  startBotSync()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
