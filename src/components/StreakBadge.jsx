import useLocalProgress from '../hooks/useLocalProgress'

export default function StreakBadge() {
  const { progress } = useLocalProgress()

  if (!progress.streak) return null

  return (
    <span className="inline-flex items-center gap-1 text-base">
      <span>🔥</span>
      <span className="font-semibold text-gray-900">{progress.streak}</span>
    </span>
  )
}
