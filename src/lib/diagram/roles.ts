import { DEFENSE_ROLES, OFFENSE_ROLES, type PlayerRole, type Side } from './schema'

export const ROLE_LABELS: Record<PlayerRole, string> = {
  handler: 'Handler',
  cutter: 'Cutter',
  deep: 'Deep',
  wing: 'Wing',
  popper: 'Popper',
  hybride: 'Hybride',
  crasher: 'Crasher',
  cup: 'Cup',
  mark: 'Mark',
  mid: 'Mid',
  'short-deep': 'Short deep',
  'deep-deep': 'Deep deep',
}

/** What appears inside the token. Kept to three characters so it stays readable. */
export const ROLE_ABBREV: Record<PlayerRole, string> = {
  handler: 'H',
  cutter: 'C',
  deep: 'D',
  wing: 'W',
  popper: 'P',
  hybride: 'HY',
  crasher: 'CR',
  cup: 'CU',
  mark: 'M',
  mid: 'MI',
  'short-deep': 'SD',
  'deep-deep': 'DD',
}

export function rolesFor(side: Side): readonly PlayerRole[] {
  return side === 'offense' ? OFFENSE_ROLES : DEFENSE_ROLES
}

/**
 * The order the next placed player takes. Offense follows the standard seven of
 * a vertical stack; defense starts at the mark and fills up from there.
 */
export const OFFENSE_ROTATION: readonly PlayerRole[] = [
  'handler',
  'handler',
  'handler',
  'cutter',
  'cutter',
  'deep',
  'wing',
]

export const DEFENSE_ROTATION: readonly PlayerRole[] = [
  'mark',
  'mid',
  'mid',
  'mid',
  'mid',
  'short-deep',
  'deep-deep',
]

export function rotationFor(side: Side): readonly PlayerRole[] {
  return side === 'offense' ? OFFENSE_ROTATION : DEFENSE_ROTATION
}

/** The role the next player of this side gets, given how many already stand there. */
export function nextRole(side: Side, alreadyPlaced: number): PlayerRole {
  const rotation = rotationFor(side)
  return rotation[alreadyPlaced % rotation.length]!
}
