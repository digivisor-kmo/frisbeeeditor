/**
 * How big a token is drawn.
 *
 * The field is 100 metres wide and a phone is not, so a token cannot simply be
 * "one metre across": on a full field that is three pixels. It cannot be a
 * fixed number of pixels either, because then zooming in would grow the tokens
 * until they swallow the field.
 *
 * So the radius follows the zoom level but is clamped at both ends: readable on
 * a phone, never larger than a sensible chunk of the field. The hit area is
 * separate and always at least 44 px, per the mobile rule.
 */

/** Radius the token aims for on screen, in CSS pixels. */
export const TARGET_TOKEN_RADIUS_PX = 13

export const MIN_TOKEN_RADIUS_M = 0.8
export const MAX_TOKEN_RADIUS_M = 1.6

/** Apple and Android both put the minimum comfortable target at 44 px. */
export const MIN_TOUCH_TARGET_PX = 44

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Radius of the drawn token, in metres. */
export function tokenRadiusM(metresPerPixel: number): number {
  return clamp(TARGET_TOKEN_RADIUS_PX * metresPerPixel, MIN_TOKEN_RADIUS_M, MAX_TOKEN_RADIUS_M)
}

/**
 * Radius of the invisible circle that catches the tap. Never smaller than the
 * token, never smaller than half the minimum touch target.
 */
export function hitRadiusM(metresPerPixel: number): number {
  const minimum = (MIN_TOUCH_TARGET_PX / 2) * metresPerPixel
  return Math.max(tokenRadiusM(metresPerPixel), minimum)
}

/**
 * Font size for the letter inside a token, in metres.
 *
 * Two letters have to fit inside the same circle as one, so they step down.
 * Setting them all at one size is what makes MI look cramped next to H.
 */
export function tokenFontSizeM(radiusM: number, tekens = 1): number {
  const factor = tekens >= 3 ? 0.72 : tekens === 2 ? 0.92 : 1.15
  return radiusM * factor
}
