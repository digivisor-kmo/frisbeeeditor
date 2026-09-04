/** Ids are stable across frames: that is how the animation knows what moves where. */
export function newId(): string {
  return crypto.randomUUID()
}
