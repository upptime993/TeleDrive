import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Fredoka, Nunito_Sans } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  adjustFontFallback: false,
})

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: 'TeleDrive — Cloud Storage Gratis via Telegram',
  description: 'Upload, simpan, dan akses file kamu gratis selamanya menggunakan Telegram sebagai storage backend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${geistMono.variable} ${fredoka.variable} ${nunitoSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
