import { Metadata } from 'next'
import SharePageClient from './SharePageClient'

interface Props {
  params: { token: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/share?token=${params.token}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return {
        title: `${data.fileName} — TeleDrive`,
        description: `Download ${data.fileName} via TeleDrive`,
      }
    }
  } catch {}
  return {
    title: 'File Shared — TeleDrive',
    description: 'Download shared file via TeleDrive',
  }
}

export default function SharePage({ params }: Props) {
  return <SharePageClient token={params.token} />
}
