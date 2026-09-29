import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { get, onChange } from '../utils/storage'
import UserAvatar from './UserAvatar'

// Иконки в едином стиле: заливка, скруглённые формы, 24×24.
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
)

const ProgressIcon = () => (
  <Icon>
    <rect x="3" y="13" width="4.5" height="8" rx="1.6" opacity="0.55" />
    <rect x="9.75" y="8.5" width="4.5" height="12.5" rx="1.6" opacity="0.8" />
    <rect x="16.5" y="3" width="4.5" height="18" rx="1.6" />
  </Icon>
)

const WorkoutsIcon = () => (
  <Icon>
    <rect x="1.5" y="8.5" width="2.8" height="7" rx="1.4" />
    <rect x="4.9" y="5" width="3.6" height="14" rx="1.8" />
    <rect x="8" y="10.6" width="8" height="2.8" rx="1.2" />
    <rect x="15.5" y="5" width="3.6" height="14" rx="1.8" />
    <rect x="19.7" y="8.5" width="2.8" height="7" rx="1.4" />
  </Icon>
)

const NutritionIcon = () => (
  <Icon>
    <path d="M8.2 10.5C7.4 7.6 8.9 4.9 11.8 4c.9 2.6-.1 5.1-2.3 6.5z" opacity="0.7" />
    <path d="M12.6 10.5c.6-3.2 3.3-5.1 6.5-4.6-.4 2.7-2.4 4.4-5 4.6z" opacity="0.7" />
    <path d="M2.5 12.2c0-.66.54-1.2 1.2-1.2h16.6c.66 0 1.2.54 1.2 1.2 0 3.9-2.6 7.2-6.2 8.3v.5c0 .55-.45 1-1 1H9.7c-.55 0-1-.45-1-1v-.5C5.1 19.4 2.5 16.1 2.5 12.2z" />
  </Icon>
)

const tabs = [
  { to: '/progress', label: 'Прогресс', icon: ProgressIcon },
  { to: '/workouts', label: 'Тренировки', icon: WorkoutsIcon },
  { to: '/nutrition', label: 'Питание', icon: NutritionIcon },
  { to: '/profile', label: 'Профиль', avatar: true },
]

export default function TabBar() {
  // Аватар обновляется сразу после смены фото в профиле.
  const [profile, setProfile] = useState(() => get('userProfile'))
  useEffect(() => onChange((data) => setProfile(data.userProfile ?? null)), [])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-lg px-2 pt-2 pb-1.5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="flex-1 flex flex-col items-center gap-1 select-none active:scale-95 transition-transform"
          >
            {({ isActive }) => (
              <>
                {tab.avatar ? (
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-accent' : ''}`}>
                    <UserAvatar profile={profile} className={`text-base ${isActive ? 'w-9 h-9 ring-2 ring-white' : 'w-8 h-8'}`} />
                  </span>
                ) : (
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-accent text-white shadow-md shadow-accent/30' : 'text-gray-400'
                    }`}
                  >
                    <tab.icon />
                  </span>
                )}
                <span className={`text-xs leading-none ${isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
