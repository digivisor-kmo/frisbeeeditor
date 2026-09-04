'use client'

import { useEffect } from 'react'

/**
 * Measures how much room is actually left for the field and publishes it.
 *
 * The mobile layout used to subtract a hard-coded number of pixels from the
 * viewport height. On a real phone that number was wrong in portrait, wrong
 * again in landscape, and wrong a third time once the toolbar wrapped onto a
 * second row — which is exactly how you end up with a stamp-sized pitch in the
 * middle of an empty white card.
 *
 * So nothing is guessed. `--dock-hoogte` is the height of the fixed furniture at
 * the bottom, and `--veld-ruimte` is what remains between the card's top edge
 * and that furniture.
 */
export function useDockHoogte(): void {
  useEffect(() => {
    const meet = () => {
      const wortel = document.documentElement

      const vast = [...document.querySelectorAll<HTMLElement>('.frame-strip, .editor-chrome')]
        .filter((el) => getComputedStyle(el).position === 'fixed')
        .map((el) => window.innerHeight - el.getBoundingClientRect().top)
      const dock = vast.length > 0 ? Math.max(...vast) : 0
      wortel.style.setProperty('--dock-hoogte', `${Math.round(dock)}px`)

      const kaart = document.querySelector<HTMLElement>('.veld-kaart')
      if (kaart) {
        const rand = 16
        const ruimte = window.innerHeight - kaart.getBoundingClientRect().top - dock - rand
        // A floor, so a landscape phone with a tall dock still shows a field
        // rather than a sliver, and the page scrolls instead.
        wortel.style.setProperty('--veld-ruimte', `${Math.max(Math.round(ruimte), 200)}px`)
      }
    }

    meet()
    const observer = new ResizeObserver(meet)
    for (const el of document.querySelectorAll('.frame-strip, .editor-chrome, .editor-kop, .veld-kaart')) {
      observer.observe(el)
    }
    window.addEventListener('resize', meet)
    window.addEventListener('orientationchange', meet)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', meet)
      window.removeEventListener('orientationchange', meet)
      document.documentElement.style.removeProperty('--dock-hoogte')
      document.documentElement.style.removeProperty('--veld-ruimte')
    }
  })
}
