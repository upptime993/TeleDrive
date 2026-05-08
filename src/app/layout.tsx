import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Sora } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'TeleDrive — Cloud Storage Gratis via Telegram',
  description: 'Upload, simpan, dan akses file kamu gratis selamanya menggunakan Telegram sebagai storage backend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
