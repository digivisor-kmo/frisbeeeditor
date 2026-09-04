interface IconProps {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** The disc, seen from the side. */
export function DiscIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx="12" cy="12" rx="9" ry="4.6" />
      <path d="M3 12c0 1.6 4 2.9 9 2.9s9-1.3 9-2.9" />
    </svg>
  )
}

export function GearIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
    </svg>
  )
}

export function TrashIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.4 20h9.2l.9-13.5" />
      <path d="M10.2 10v6.4M13.8 10v6.4" />
    </svg>
  )
}

/** The star of a favourite. Filled when it is on, outline when it is off. */
export function SterIcon({ size = 20, gevuld = false }: IconProps & { gevuld?: boolean }) {
  return (
    <svg {...base(size)} fill={gevuld ? 'currentColor' : 'none'}>
      <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.85z" />
    </svg>
  )
}

export function PaletteIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="9.2" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.2" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15.4" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** A cut: a straight line with a solid point. */
export function CutIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 18 L15 7" />
      <path d="M10.5 6.2 L16.5 5.5 L15.8 11.5 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** A juke: the same line, but wavy. */
export function JukeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 18c2-2 0-4.5 2-6.5s4 0 5.5-2" />
      <path d="M10.5 6.6 L16.5 5.5 L15.4 11.5 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** A throw: a dashed line with an open point. */
export function ThrowIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 18 L14.5 7.5" strokeDasharray="3 2.6" />
      <path d="M11 6.5 L16 5.5 L15 10.5" />
    </svg>
  )
}
