import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initTelegram } from './utils/telegram'
import { startCloudSync } from './utils/cloudSync'
import './index.css'

initTelegram()

// В Telegram сначала подтягиваем прогресс из облака, потом рисуем приложение.
startCloudSync().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
