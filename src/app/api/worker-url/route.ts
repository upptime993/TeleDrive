import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAllWorkerUrls, pingWorker } from '@/lib/workerUrl'

export const dynamic = 'force-dynamic'

/**
 * GET /api/worker-url
 *
 * 🛡️ SECURITY: Requires authentication to prevent exposing internal
 * worker infrastructure URLs to unauthenticated users.
 *
 * Response:
 *   {
 *     url: string | null          // Worker 1 (backward-compat)
 *     urls: string[]              // Semua worker yang dikonfigurasi
 *     onlineUrls: string[]        // Hanya worker yang sedang online
 *   }
 */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const all = getAllWorkerUrls()

  // Ping semua worker paralel
  const pinged = await Promise.all(
    all.map(async url => ({ url, ok: await pingWorker(url) }))
  )
  const onlineUrls = pinged.filter(r => r.ok).map(r => r.url)

  return NextResponse.json({
    url: all[0] ?? null,     // backward-compat
    urls: all,               // semua yang dikonfigurasi
    onlineUrls,              // hanya yang online
  })
}
