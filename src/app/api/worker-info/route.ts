import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAllWorkerUrls } from '@/lib/workerUrl'

/**
 * GET /api/worker-info
 *
 * Mengembalikan daftar worker URL + worker secret ke client
 * sehingga browser bisa upload LANGSUNG ke worker tanpa melewati Vercel.
 *
 * Ini menghilangkan bottleneck utama: sebelumnya tiap chunk 4MB harus
 * lewat server Vercel (US) dulu, baru ke STB (ID). Sekarang langsung ke STB.
 *
 * KEAMANAN:
 *   - Endpoint ini dilindungi NextAuth session → hanya user login yang bisa akses
 *   - WORKER_SECRET dikirim ke client, tapi itu OK karena:
 *     a) Hanya user yang sudah login yang mendapatkannya
 *     b) Worker URL juga berubah setiap restart (Cloudflare Quick Tunnel)
 */
export const dynamic = 'force-dynamic'

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
      workerSecret: process.env.WORKER_SECRET || '',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
