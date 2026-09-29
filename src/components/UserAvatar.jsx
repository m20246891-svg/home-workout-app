import { useState } from 'react'

const ANIMAL_EMOJIS = [
  '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐰', '🐻', '🐸',
  '🐵', '🦉', '🐺', '🐹', '🐷', '🐮', '🦝', '🐭', '🐧', '🦄',
  '🐙', '🦋', '🐞', '🐳',
]

export function getAnimalEmoji(seed) {
  const idx = Math.abs(typeof seed === 'number' ? seed : String(seed ?? '').length) % ANIMAL_EMOJIS.length
  return ANIMAL_EMOJIS[idx]
}

// Какую картинку показывать: своё фото → фото из Telegram → эмодзи-животное.
export function avatarSource(profile) {
  if (profile?.avatarPhoto) return { kind: 'photo', src: profile.avatarPhoto }
  if (profile?.tgPhotoUrl) return { kind: 'telegram', src: profile.tgPhotoUrl }
  return { kind: 'emoji' }
}

export default function UserAvatar({ profile, className = 'w-10 h-10 text-lg' }) {
  const [broken, setBroken] = useState(false)
  const source = avatarSource(profile)
  const showImage = source.kind !== 'emoji' && !broken

  return (
    <span className={`rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {showImage ? (
        <img src={source.src} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span>{getAnimalEmoji(profile?.avatarSeed)}</span>
      )}
    </span>
  )
}
