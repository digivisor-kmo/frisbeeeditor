import { describe, expect, it } from 'vitest'
import {
  hitRadiusM,
  MAX_TOKEN_RADIUS_M,
  MIN_TOKEN_RADIUS_M,
  MIN_TOUCH_TARGET_PX,
  tokenRadiusM,
} from './scale'

/** metres per pixel for a view of `metres` wide rendered in `pixels`. */
const mpp = (metres: number, pixels: number) => metres / pixels

describe('tokengrootte', () => {
  it('blijft binnen de grenzen, hoe ver je ook uit- of inzoomt', () => {
    expect(tokenRadiusM(mpp(106, 320))).toBeLessThanOrEqual(MAX_TOKEN_RADIUS_M)
    expect(tokenRadiusM(mpp(10, 1200))).toBeGreaterThanOrEqual(MIN_TOKEN_RADIUS_M)
  })

  it('is op een laptop met het volledige veld ongeveer 26 px breed', () => {
    const metresPerPixel = mpp(106, 900)
    const diameterPx = (tokenRadiusM(metresPerPixel) * 2) / metresPerPixel
    expect(diameterPx).toBeGreaterThan(22)
    expect(diameterPx).toBeLessThan(32)
  })

  it('is op een telefoon met het halve veld ook ongeveer 26 px breed', () => {
    const metresPerPixel = mpp(43, 360)
    const diameterPx = (tokenRadiusM(metresPerPixel) * 2) / metresPerPixel
    expect(diameterPx).toBeGreaterThan(22)
    expect(diameterPx).toBeLessThan(32)
  })
})

describe('raakvlak', () => {
  it('is nooit kleiner dan 44 px, ook niet als het token piepklein is', () => {
    for (const metresPerPixel of [mpp(106, 320), mpp(43, 360), mpp(106, 1400), mpp(10, 1200)]) {
      const diameterPx = (hitRadiusM(metresPerPixel) * 2) / metresPerPixel
      expect(diameterPx).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX - 0.001)
    }
  })

  it('is nooit kleiner dan het token zelf', () => {
    for (const metresPerPixel of [mpp(106, 320), mpp(43, 360), mpp(10, 1200)]) {
      expect(hitRadiusM(metresPerPixel)).toBeGreaterThanOrEqual(tokenRadiusM(metresPerPixel))
    }
  })
})
