import type { Point } from '@/lib/field/geometry'

/**
 * Curves through points that lie ON the line.
 *
 * A path is stored as the points the user actually sees and drags: the start,
 * any bend points, and the end. The cubic Bezier control points are derived
 * here with Catmull-Rom and never stored. That is the only model a trainer
 * drawing a cut around a defender can reason about.
 */

export interface Bezier {
  p0: Point
  c1: Point
  c2: Point
  p1: Point
}

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k })

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Catmull-Rom to cubic Bezier. The curve runs exactly through every input
 * point; the tangent at each point follows its two neighbours.
 */
export function toBezier(points: readonly Point[]): Bezier[] {
  if (points.length < 2) return []

  const segments: Bezier[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!
    const p1 = points[i + 1]!
    // At the ends there is no neighbour, so mirror the segment itself. That
    // keeps a two-point path an exactly uniform straight line instead of one
    // that speeds up in the middle.
    const before = points[i - 1] ?? { x: 2 * p0.x - p1.x, y: 2 * p0.y - p1.y }
    const after = points[i + 2] ?? { x: 2 * p1.x - p0.x, y: 2 * p1.y - p0.y }

    segments.push({
      p0,
      c1: add(p0, mul(sub(p1, before), 1 / 6)),
      c2: sub(p1, mul(sub(after, p0), 1 / 6)),
      p1,
    })
  }
  return segments
}

export function evalBezier(seg: Bezier, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * seg.p0.x + b * seg.c1.x + c * seg.c2.x + d * seg.p1.x,
    y: a * seg.p0.y + b * seg.c1.y + c * seg.c2.y + d * seg.p1.y,
  }
}

/** Unit tangent. Falls back to the chord where the derivative vanishes. */
export function tangentAt(seg: Bezier, t: number): Point {
  const u = 1 - t
  const raw = {
    x: 3 * u * u * (seg.c1.x - seg.p0.x) + 6 * u * t * (seg.c2.x - seg.c1.x) + 3 * t * t * (seg.p1.x - seg.c2.x),
    y: 3 * u * u * (seg.c1.y - seg.p0.y) + 6 * u * t * (seg.c2.y - seg.c1.y) + 3 * t * t * (seg.p1.y - seg.c2.y),
  }
  const lengte = Math.hypot(raw.x, raw.y)
  if (lengte > 1e-9) return { x: raw.x / lengte, y: raw.y / lengte }

  const chord = sub(seg.p1, seg.p0)
  const chordLengte = Math.hypot(chord.x, chord.y)
  return chordLengte > 1e-9 ? { x: chord.x / chordLengte, y: chord.y / chordLengte } : { x: 1, y: 0 }
}

/** SVG path data for the whole curve. */
export function toPathD(points: readonly Point[]): string {
  const segments = toBezier(points)
  if (segments.length === 0) return ''
  const first = segments[0]!
  const parts = [`M ${first.p0.x} ${first.p0.y}`]
  for (const s of segments) {
    parts.push(`C ${s.c1.x} ${s.c1.y} ${s.c2.x} ${s.c2.y} ${s.p1.x} ${s.p1.y}`)
  }
  return parts.join(' ')
}

/* ------------------------------------------------------------- arc length */

export interface LengthTable {
  segments: Bezier[]
  /** Cumulative distance at each sample, starting at 0. */
  cumulative: number[]
  /** Segment index and local t for each sample. */
  samples: { segment: number; t: number }[]
  total: number
}

export const SAMPLES_PER_SEGMENT = 100

/**
 * Walking a Bezier at a constant step in t is not walking it at a constant
 * speed: the curve bunches up in the bends. Everything that moves along a path
 * -- a player following a cut during playback -- has to be parameterised on arc
 * length instead, which is what this table is for.
 */
export function buildLengthTable(
  points: readonly Point[],
  samplesPerSegment: number = SAMPLES_PER_SEGMENT,
): LengthTable {
  const segments = toBezier(points)
  const cumulative: number[] = [0]
  const samples: { segment: number; t: number }[] = [{ segment: 0, t: 0 }]

  let total = 0
  let vorige = segments.length > 0 ? segments[0]!.p0 : { x: 0, y: 0 }

  segments.forEach((seg, index) => {
    for (let i = 1; i <= samplesPerSegment; i++) {
      const t = i / samplesPerSegment
      const punt = evalBezier(seg, t)
      total += distance(vorige, punt)
      vorige = punt
      cumulative.push(total)
      samples.push({ segment: index, t })
    }
  })

  return { segments, cumulative, samples, total }
}

/** The point a given distance along the curve, plus its direction there. */
export function pointAtDistance(table: LengthTable, afstand: number): {
  point: Point
  tangent: Point
} {
  if (table.segments.length === 0) {
    return { point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } }
  }

  const doel = Math.min(Math.max(afstand, 0), table.total)

  // Binary search for the first sample at or past the target distance.
  let laag = 0
  let hoog = table.cumulative.length - 1
  while (laag < hoog) {
    const midden = (laag + hoog) >> 1
    if (table.cumulative[midden]! < doel) laag = midden + 1
    else hoog = midden
  }

  const index = Math.max(laag, 1)
  const voor = table.cumulative[index - 1]!
  const na = table.cumulative[index]!
  const deel = na - voor < 1e-12 ? 0 : (doel - voor) / (na - voor)

  const a = table.samples[index - 1]!
  const b = table.samples[index]!
  // Interpolate within one segment; across a seam, snap to the later sample.
  const segment = b.segment
  const t = a.segment === b.segment ? a.t + (b.t - a.t) * deel : b.t * deel

  const seg = table.segments[segment]!
  return { point: evalBezier(seg, t), tangent: tangentAt(seg, t) }
}

export function pointAtFraction(table: LengthTable, fractie: number) {
  return pointAtDistance(table, table.total * fractie)
}

/** Midpoint of the curve measured along its length, not along t. */
export function midpoint(points: readonly Point[]): Point {
  return pointAtFraction(buildLengthTable(points), 0.5).point
}

/**
 * Shortens the curve at the start, so an arrow leaving a player does not come
 * out of the middle of the letter on his token.
 */
export function trimStart(points: readonly Point[], afstand: number): Point[] {
  if (points.length < 2 || afstand <= 0) return [...points]
  const table = buildLengthTable(points)
  if (afstand >= table.total) return [...points]

  const nieuw = pointAtDistance(table, afstand).point
  const rest = points.slice(1)
  return [nieuw, ...rest]
}

/**
 * A wavy version of the curve, for juke arrows: the same line with a sine
 * running perpendicular to it. Returns points, so the caller can draw them as a
 * polyline.
 */
export function wavyPoints(
  points: readonly Point[],
  amplitude: number,
  cycles: number,
  samples = 80,
): Point[] {
  const table = buildLengthTable(points)
  if (table.total === 0) return [...points]

  const out: Point[] = []
  for (let i = 0; i <= samples; i++) {
    const fractie = i / samples
    const { point, tangent } = pointAtDistance(table, table.total * fractie)
    // Fade the wave out at both ends so the line still starts and stops cleanly.
    const demping = Math.sin(Math.PI * fractie)
    const afwijking = Math.sin(2 * Math.PI * cycles * fractie) * amplitude * demping
    out.push({
      x: point.x - tangent.y * afwijking,
      y: point.y + tangent.x * afwijking,
    })
  }
  return out
}

export function toPolylineD(points: readonly Point[]): string {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

/**
 * The middle of every segment, on the curve.
 *
 * These are the spots where a small grey handle sits: an invitation to make a
 * new bend there. With n bend points there are n + 1 segments, so there are
 * always n + 1 of these.
 */
export function segmentMidpoints(points: readonly Point[]): Point[] {
  return toBezier(points).map((seg) => evalBezier(seg, 0.5))
}
