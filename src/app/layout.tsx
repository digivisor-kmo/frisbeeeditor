import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { nl } from '@/lib/strings'
import './globals.css'

/**
 * Two faces, each doing one job.
 *
 * Inter carries everything you read while working: labels, buttons, and the one
 * or two capitals on a token at 26 px on a phone in the sun. Its x-height is the
 * reason it stays readable there.
 *
 * Plus Jakarta Sans carries the headings and the app's own name. It has the
 * geometry and the slight warmth that make a screen feel made rather than
 * assembled, which a pure UI face deliberately does not have.
 *
 * Both are variable and self-hosted by next/font, so this costs one request and
 * no layout shift.
 */
const ui = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
})

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: nl.app.naam,
  description: nl.app.ondertitel,
  applicationName: nl.app.naam,
  appleWebApp: { capable: true, title: nl.app.naam, statusBarStyle: 'default' },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icoon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icoon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#3452fe',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${ui.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  )
}
