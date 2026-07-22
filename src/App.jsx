import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { get } from './utils/storage'
import TabBar from './components/TabBar'
import Onboarding from './pages/Onboarding'
import Workouts from './pages/Workouts'
import WorkoutDetail from './pages/WorkoutDetail'
import WorkoutPlayer from './pages/WorkoutPlayer'
import WorkoutComplete from './pages/WorkoutComplete'
import Progress from './pages/Progress'
import Profile from './pages/Profile'

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(null)
  const location = useLocation()
  const hideTabBar = location.pathname.includes('/play') || location.pathname.includes('/complete')

  useEffect(() => {
    const data = get('onboarding')
    setOnboardingDone(!!data)
  }, [])

  if (onboardingDone === null) return null

  if (!onboardingDone) {
    return <Onboarding onComplete={() => setOnboardingDone(true)} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className={`flex-1 ${hideTabBar ? '' : 'pb-16'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/progress" replace />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workout/:id" element={<WorkoutDetail />} />
          <Route path="/workout/:id/play" element={<WorkoutPlayer />} />
          <Route path="/workout/:id/complete" element={<WorkoutComplete />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  )
}
