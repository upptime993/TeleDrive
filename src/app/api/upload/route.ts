import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getWorkerUrl, pingWorker } from '@/lib/workerUrl'

// FIX #1: Tambahkan maxDuration agar tidak timeout di Vercel (default 10s)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * POST /api/upload
 *
 * Untuk file kecil (< CHUNK_THRESHOLD): upload langsung ke STB sebagai 1 chunk,
 * lalu panggil /api/upload-complete untuk simpan metadata.
 *
 * Untuk file besar: client melakukan chunking sendiri via /api/upload-chunk,
 * lalu panggil /api/upload-complete. Route ini tidak dipanggil untuk file besar.
 *
 * Semua upload lewat STB worker — tidak ada GramJS di Vercel.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workerUrl = getWorkerUrl()
    if (!workerUrl) {
      return NextResponse.json(
        { error: 'WORKER_URL belum dikonfigurasi di environment variables Vercel.' },
        { status: 503 }
      )
    }

    const isAlive = await pingWorker(workerUrl)
    if (!isAlive) {
      return NextResponse.json(
        { error: 'Worker STB sedang offline. Pastikan STB dan tunnel berjalan.' },
        { status: 503 }
      )
    }

    // Forward formData langsung ke STB (hanya untuk file kecil yang dikirim satu kali)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan di request' }, { status: 400 })
    }

    // Forward ke STB upload-chunk endpoint
    const stbForm = new FormData()
    stbForm.append('chunk', file)
    stbForm.append('part', '0')
    stbForm.append('totalParts', '1')
    stbForm.append('fileName', file.name)

    const headers: Record<string, string> = {}
    if (process.env.WORKER_SECRET) {
      headers['x-worker-secret'] = process.env.WORKER_SECRET
    }

    const stbRes = await fetch(`${workerUrl}/upload-chunk`, {
      method: 'POST',
      body: stbForm,
      headers,
      signal: AbortSignal.timeout(55_000),
    })

    if (!stbRes.ok) {
      const errText = await stbRes.text().catch(() => 'Unknown STB error')
      return NextResponse.json({ error: `STB error: ${errText}` }, { status: 502 })
    }

    const { msgId } = await stbRes.json()

    return NextResponse.json({
      success: true,
      chunk: { part: 0, msgId, size: file.size },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[upload]', msg)
    return NextResponse.json({ error: `Upload gagal: ${msg}` }, { status: 500 })
  }
}
