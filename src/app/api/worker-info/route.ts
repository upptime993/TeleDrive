import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAllWorkerUrls } from '@/lib/workerUrl'
import crypto from 'crypto'

/**
 * GET /api/worker-info
 *
 * Mengembalikan daftar worker URL + short-lived HMAC token ke client
 * sehingga browser bisa upload LANGSUNG ke worker tanpa melewati Vercel.
 *
 * 🛡️ SECURITY: Tidak lagi mengirim WORKER_SECRET mentah ke browser.
 * Sebagai gantinya, server generate HMAC token yang berlaku 2 jam.
 * STB memvalidasi token ini tanpa perlu tahu user identity.
 *
 * Token format: "{timestamp}.{hmac_hex}"
 *   - timestamp = Unix seconds saat token dibuat
 *   - hmac = HMAC-SHA256(WORKER_SECRET, timestamp)
 */
export const dynamic = 'force-dynamic'

const TOKEN_TTL_SEC = 2 * 60 * 60 // 2 jam

function generateWorkerToken(): string {
  const secret = process.env.WORKER_SECRET || ''
  if (!secret) return ''
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex')
  return `${timestamp}.${hmac}`
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workerUrls = getAllWorkerUrls()
    if (workerUrls.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada worker yang dikonfigurasi' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      workerUrls,
      workerToken: generateWorkerToken(),
      tokenTtlSec: TOKEN_TTL_SEC,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
