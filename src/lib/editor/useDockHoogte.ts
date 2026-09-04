'use client'

import { useEffect } from 'react'

/**
 * Publishes the height of the fixed furniture at the bottom of the editor as
 * `--dock-hoogte`, so anything that has to float above it can say so in CSS.
 *
 * Measured rather than guessed: the dock is a playback bar plus a frame strip
 * on a desktop and gains a toolbar on a phone, and it grows a row whenever
 * something inside it wraps. A hard-coded number is wrong the first time
 * somebody adds a button.
 */
export function useDockHoogte(): void {
  useEffect(() => {
    const meet = () => {
      const vast = [...document.querySelectorAll<HTMLElement>('.frame-strip, .editor-chrome')]
        .filter((el) => getComputedStyle(el).position === 'fixed')
        .map((el) => window.innerHeight - el.getBoundingClientRect().top)
      const hoogte = vast.length > 0 ? Math.max(...vast) : 0
      document.documentElement.style.setProperty('--dock-hoogte', `${Math.round(hoogte)}px`)
    }

    meet()
    const observer = new ResizeObserver(meet)
    for (const el of document.querySelectorAll('.frame-strip, .editor-chrome')) {
      observer.observe(el)
    }
    window.addEventListener('resize', meet)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', meet)
      document.documentElement.style.removeProperty('--dock-hoogte')
    }
  })
}
