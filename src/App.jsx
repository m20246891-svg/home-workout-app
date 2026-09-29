import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { get } from './utils/storage'
import { IN_TELEGRAM, setBackButton } from './utils/telegram'
import TabBar from './components/TabBar'
import Onboarding from './pages/Onboarding'
import Workouts from './pages/Workouts'
import Generator from './pages/Generator'
import WorkoutDetail from './pages/WorkoutDetail'
import WorkoutPlayer from './pages/WorkoutPlayer'
import WorkoutComplete from './pages/WorkoutComplete'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import Nutrition from './pages/Nutrition'

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const hideTabBar = location.pathname.includes('/play') || location.pathname.includes('/complete')

  useEffect(() => {
    const data = get('onboarding')
    setOnboardingDone(!!data)
  }, [])

  // Системная кнопка «Назад» Telegram — на вложенных экранах (плеер закрывается своей кнопкой).
  const path = location.pathname
  const showTgBack = IN_TELEGRAM && (path === '/generator' || /^\/workout\/[^/]+$/.test(path))
  useEffect(() => {
    if (!showTgBack) return setBackButton(null)
    return setBackButton(() => {
      if (window.history.length > 1) navigate(-1)
      else navigate('/workouts', { replace: true })
    })
  }, [showTgBack, path, navigate])

  if (onboardingDone === null) return null

  // /onboarding — повторное прохождение из профиля.
  if (!onboardingDone || location.pathname === '/onboarding') {
    return (
      <Onboarding
        onComplete={() => {
          setOnboardingDone(true)
          navigate('/generator', { replace: true, state: { fresh: true } })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className={`flex-1 ${hideTabBar ? '' : 'pb-16'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/progress" replace />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/workout/:id" element={<WorkoutDetail />} />
          <Route path="/workout/:id/play" element={<WorkoutPlayer />} />
          <Route path="/workout/:id/complete" element={<WorkoutComplete />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  )
}
