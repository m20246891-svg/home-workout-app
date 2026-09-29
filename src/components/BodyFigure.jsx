// Силуэт тела с подсветкой зоны фокуса (генератор, онбординг).
const BODY_HIGHLIGHT = {
  full: ['chest', 'abs', 'shoulders', 'arms', 'glutes', 'legs'],
  core: ['abs'],
  arms: ['arms', 'shoulders'],
  upper: ['chest', 'shoulders', 'arms', 'abs'],
  legs: ['legs'],
  glutes: ['glutes'],
}

export default function BodyFigure({ focus, selected, className = 'h-16 w-auto' }) {
  const hl = BODY_HIGHLIGHT[focus] || []
  const fill = (part) => (hl.includes(part) ? (selected ? 'var(--color-accent)' : '#374151') : '#D1D5DB')
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden="true">
      <circle cx="30" cy="9" r="6" fill="#D1D5DB" />
      <circle cx="16" cy="22" r="4.5" fill={fill('shoulders')} />
      <circle cx="44" cy="22" r="4.5" fill={fill('shoulders')} />
      <rect x="9.5" y="25" width="6" height="25" rx="3" fill={fill('arms')} />
      <rect x="44.5" y="25" width="6" height="25" rx="3" fill={fill('arms')} />
      <rect x="19" y="18" width="22" height="14" rx="4" fill={fill('chest')} />
      <rect x="21" y="33.5" width="18" height="16" rx="3" fill={fill('abs')} />
      <rect x="20" y="51" width="20" height="10" rx="4" fill={fill('glutes')} />
      <rect x="20" y="62.5" width="9" height="33" rx="4" fill={fill('legs')} />
      <rect x="31" y="62.5" width="9" height="33" rx="4" fill={fill('legs')} />
    </svg>
  )
}

export function CheckBadge() {
  return (
    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center ring-2 ring-white">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}
