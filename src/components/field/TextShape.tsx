import { memo } from 'react'
import { coneFill } from './tokens/colors'
import { TEXT_SIZES_M } from '@/lib/diagram/zones'
import type { TextBlock } from '@/lib/diagram/schema'
import { metresToUnits, toSvg, type FieldView } from '@/lib/field/geometry'

interface Props {
  blok: TextBlock
  view: FieldView
  selected: boolean
  hitRadiusM: number
}

/** Roughly how many characters fit on a line before it gets hard to place. */
const PER_REGEL = 22
const MAX_REGELS = 4

/**
 * Breaks a note into lines on word boundaries.
 *
 * A note is meant to be short, but somebody will paste a sentence into it one
 * day, and a single line of that runs straight off the pitch and out of the
 * PNG. Breaking it is cheaper than policing what people type.
 */
export function regelsVan(tekst: string): string[] {
  const regels: string[] = []
  for (const stuk of tekst.split('\n')) {
    let regel = ''
    for (const woord of stuk.split(/\s+/).filter(Boolean)) {
      if (regel.length === 0) regel = woord
      else if (regel.length + 1 + woord.length <= PER_REGEL) regel += ` ${woord}`
      else {
        regels.push(regel)
        regel = woord
      }
    }
    regels.push(regel)
  }
  return regels.filter((r) => r.length > 0).slice(0, MAX_REGELS)
}

const ANKER = { links: 'start', midden: 'middle', rechts: 'end' } as const

function TextShapeBasis({ blok, view, selected, hitRadiusM }: Props) {
  const p = toSvg(blok.pos, view)
  const hoogte = metresToUnits(TEXT_SIZES_M[blok.size])
  const regels = regelsVan(blok.content)
  const regelafstand = hoogte * 1.18
  const eerste = p.y - ((regels.length - 1) * regelafstand) / 2
  const verf = coneFill(blok.color)

  const breedste = Math.max(...regels.map((r) => r.length), 1)
  // A rough box: SVG cannot measure text without laying it out, and a note is
  // grabbed by roughly where it looks, not to the pixel.
  const breedte = Math.max(breedste * hoogte * 0.55, metresToUnits(hitRadiusM * 2))
  const kaderHoogte = regels.length * regelafstand + hoogte * 0.4
  const anker = ANKER[blok.align]
  const x =
    anker === 'start' ? p.x : anker === 'end' ? p.x - breedte : p.x - breedte / 2

  return (
    <g data-entity-id={blok.id}>
      {selected && (
        <rect
          x={x - hoogte * 0.3}
          y={eerste - hoogte - hoogte * 0.1}
          width={breedte + hoogte * 0.6}
          height={kaderHoogte}
          rx={hoogte * 0.3}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={hoogte * 0.07}
          pointerEvents="none"
        />
      )}

      <text
        x={p.x}
        y={eerste}
        textAnchor={anker}
        fontSize={hoogte}
        fontWeight={blok.weight === 'halfvet' ? 700 : 500}
        fill={verf}
        stroke="var(--zone-halo)"
        strokeWidth={hoogte * 0.16}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {regels.map((regel, index) => (
          <tspan key={index} x={p.x} dy={index === 0 ? 0 : regelafstand}>
            {regel}
          </tspan>
        ))}
      </text>

      <rect
        data-part="tekst"
        x={x - hoogte * 0.3}
        y={eerste - hoogte - hoogte * 0.1}
        width={breedte + hoogte * 0.6}
        height={kaderHoogte}
        fill="transparent"
      />
    </g>
  )
}

export const TextShape = memo(TextShapeBasis)
