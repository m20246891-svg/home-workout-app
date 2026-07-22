import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/progress', label: 'Прогресс' },
  { to: '/workouts', label: 'Тренировки' },
  { to: '/profile', label: 'Профиль' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 border-t-2 border-blue-600 -mt-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
