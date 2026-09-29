import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initTelegram, syncTelegramProfile } from './utils/telegram'
import { get, set } from './utils/storage'
import { startCloudSync } from './utils/cloudSync'
import './index.css'

initTelegram()

// В Telegram сначала подтягиваем прогресс из облака, потом рисуем приложение.
startCloudSync().finally(() => {
  syncTelegramProfile(get, set)
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
