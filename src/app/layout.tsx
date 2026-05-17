import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'TeleDrive — Cloud Storage Gratis via Telegram',
  description: 'Upload, simpan, dan akses file kamu gratis selamanya menggunakan Telegram sebagai storage backend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${geistMono.variable} ${inter.variable} ${playfairDisplay.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
