import type { Side, TokenColor } from '@/lib/diagram/schema'

interface Paint {
  fill: string
  text: string
}

const PALETTE: Record<Exclude<TokenColor, 'standaard'>, Paint> = {
  geel: { fill: 'var(--token-geel)', text: 'var(--token-donker)' },
  paars: { fill: 'var(--token-paars)', text: 'var(--token-licht)' },
  wit: { fill: 'var(--token-wit)', text: 'var(--token-donker)' },
  grijs: { fill: 'var(--token-grijs)', text: 'var(--token-donker)' },
}

export function paintFor(color: TokenColor, side: Side): Paint {
  if (color !== 'standaard') return PALETTE[color]
  return side === 'offense'
    ? { fill: 'var(--team-a)', text: 'var(--team-a-contrast)' }
    : { fill: 'var(--team-b)', text: 'var(--team-b-contrast)' }
}

/**
 * A cone in its default colour is white; the palette colours apply to it just
 * like they do to a token. Without this the colour picker on a cone changed the
 * data and nothing on the field.
 */
export function coneFill(color: TokenColor): string {
  return color === 'standaard' ? 'var(--token-wit)' : PALETTE[color].fill
}
