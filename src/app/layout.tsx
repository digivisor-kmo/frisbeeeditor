import type { Metadata, Viewport } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import { nl } from '@/lib/strings'
import './globals.css'

/**
 * A humanist sans with a large x-height: the position labels on a token are one
 * or two capitals at 26 px, read on a phone in the sun.
 */
const sans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: nl.app.naam,
  description: nl.app.ondertitel,
  applicationName: nl.app.naam,
  appleWebApp: { capable: true, title: nl.app.naam, statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icoon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icoon.svg' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4f5f6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={sans.variable}>
      <body>{children}</body>
    </html>
  )
}
