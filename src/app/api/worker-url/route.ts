import { NextResponse } from 'next/server'
import { getAllWorkerUrls, pingWorker } from '@/lib/workerUrl'

export const dynamic = 'force-dynamic'

/**
 * GET /api/worker-url
 *
 * Response:
 *   {
 *     url: string | null          // Worker 1 (backward-compat)
 *     urls: string[]              // Semua worker yang dikonfigurasi
 *     onlineUrls: string[]        // Hanya worker yang sedang online
 *   }
 */
export async function GET() {
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
