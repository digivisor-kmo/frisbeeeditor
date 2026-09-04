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

/**
 * The star of a favourite. Filled when it is on, outline when it is off.
 *
 * The filled one drops almost all of its stroke: a 1.9 pixel outline around a
 * filled star rounds its points away and the whole thing reads as a blob.
 */
export function SterIcon({ size = 20, gevuld = false }: IconProps & { gevuld?: boolean }) {
  return (
    <svg
      {...base(size)}
      fill={gevuld ? 'currentColor' : 'none'}
      strokeWidth={gevuld ? 0.7 : 1.75}
      strokeLinejoin="round"
    >
      <path d="M12 3.4l2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.92l-5.3 2.79 1.01-5.9-4.29-4.18 5.93-.86z" />
    </svg>
  )
}

/** The select tool: a pointer. */
export function CursorIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5.5 3.4 18 11.2l-5.4 1.2-2.4 5.1z" />
    </svg>
  )
}

/** The player tool: head and shoulders. */
export function SpelerIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8.4" r="3.4" />
      <path d="M5.6 19.4c0-3.2 2.9-5.2 6.4-5.2s6.4 2 6.4 5.2" />
    </svg>
  )
}

/** The cone tool: a cone on its base. */
export function PionIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 4.2 17.2 17H6.8z" />
      <path d="M4 19.6h16" />
    </svg>
  )
}

export function OngedaanIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4.5 8.2h9.1a5.4 5.4 0 0 1 0 10.8H7.6" />
      <path d="M8 4.4 4.2 8.2 8 12" />
    </svg>
  )
}

export function OpnieuwIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M19.5 8.2h-9.1a5.4 5.4 0 0 0 0 10.8h6" />
      <path d="M16 4.4l3.8 3.8L16 12" />
    </svg>
  )
}

export function PlusIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </svg>
  )
}

/** The settings panel: three sliders. */
export function SchuivenIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 7.5h4.2M12.6 7.5H20M4 16.5h7.4M15.8 16.5H20" />
      <circle cx="10.4" cy="7.5" r="2.2" />
      <circle cx="13.6" cy="16.5" r="2.2" />
    </svg>
  )
}

export function SpeelIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none">
      <path d="M7.5 5.1 18.2 12 7.5 18.9z" />
    </svg>
  )
}

export function PauzeIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none">
      <rect x="7.4" y="5.4" width="3.4" height="13.2" rx="1.2" />
      <rect x="13.2" y="5.4" width="3.4" height="13.2" rx="1.2" />
    </svg>
  )
}

export function TerugIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14.5 5 8 12l6.5 7" />
    </svg>
  )
}

export function VerderIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9.5 5 16 12l-6.5 7" />
    </svg>
  )
}

export function KopieIcon({ size = 17 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="8.6" y="8.6" width="11" height="11" rx="2.4" />
      <path d="M15.4 5.4H6.8a2.4 2.4 0 0 0-2.4 2.4v8.6" />
    </svg>
  )
}

export function PersoonIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5.4 19.6c0-3.3 3-5.4 6.6-5.4s6.6 2.1 6.6 5.4" />
    </svg>
  )
}

export function UitIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14.6 6.4V4.8H5.2v14.4h9.4v-1.6" />
      <path d="M10.4 12h8.4M15.8 8.8 19 12l-3.2 3.2" />
    </svg>
  )
}

export function DeelIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="17.4" cy="5.8" r="2.8" />
      <circle cx="6.6" cy="12" r="2.8" />
      <circle cx="17.4" cy="18.2" r="2.8" />
      <path d="M9.05 10.6 15 7.2M9.05 13.4 15 16.8" />
    </svg>
  )
}

export function ZoekIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="10.6" cy="10.6" r="6.4" />
      <path d="M15.4 15.4 20 20" />
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


/** A juke: the same line, but wavy. */

/** A throw: a dashed line with an open point. */

/*
 * The three arrows a player can draw. They have to be told apart at twenty
 * pixels, so each one carries the shape of the thing it means: a cut runs
 * straight, a juke wobbles, a throw flies dashed with an open head.
 */
export function CutIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4.5 18.5 17 6" />
      <path d="M10.6 5.6H18v7.4" fill="none" />
    </svg>
  )
}

export function JukeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 17.6c2.6 0 2.6-4.4 5.2-4.4s2.6 4.4 5.2 4.4c1.7 0 2.3-1.9 3.1-3.2" />
      <path d="M15.2 11.2 18.4 13l-1.1 3.4" />
    </svg>
  )
}

export function ThrowIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 16.5c4-6.5 9.5-9 14-9.6" strokeDasharray="3 2.6" />
      <path d="M14.2 3.4 18.6 6.7l-2.9 3.9" />
    </svg>
  )
}
