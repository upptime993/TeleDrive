import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getWorkerUrl, getAllWorkerUrls } from '@/lib/workerUrl'

// FIX #1: maxDuration 60 (max Vercel Pro) — sebelumnya sudah ada tapi hanya 60, pastikan dynamic juga
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const workerIdxStr = formData.get('workerIdx') as string | null
    const workerIdx = workerIdxStr ? parseInt(workerIdxStr, 10) : 0
    
    const allWorkers = getAllWorkerUrls()
    const workerUrl = allWorkers.length > 0 ? allWorkers[workerIdx % allWorkers.length] : getWorkerUrl()

    if (!workerUrl) {
      return NextResponse.json(
        { error: 'Worker tidak tersedia. Set WORKER_URL di Vercel.' },
        { status: 503 }
      )
    }
    const chunk = formData.get('chunk') as File | null
    const part = formData.get('part') as string | null
    const totalParts = formData.get('totalParts') as string | null
    const fileName = formData.get('fileName') as string | null

    if (!chunk || part === null || !totalParts || !fileName) {
      return NextResponse.json(
        { error: 'Field wajib: chunk, part, totalParts, fileName' },
        { status: 400 }
      )
    }

    const partNum = parseInt(part, 10)
    if (isNaN(partNum) || partNum < 0) {
      return NextResponse.json({ error: 'part harus berupa angka >= 0' }, { status: 400 })
    }

    const stbForm = new FormData()
    stbForm.append('chunk', chunk)
    stbForm.append('part', part)
    stbForm.append('totalParts', totalParts)
    stbForm.append('fileName', fileName)

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
      console.error(`[upload-chunk] STB error part=${part}:`, errText)
      return NextResponse.json(
        { error: `STB gagal memproses chunk ${part}: ${errText}` },
        { status: 502 }
      )
    }

    const stbData = await stbRes.json()

    return NextResponse.json({
      success: true,
      part: partNum,
      msgId: stbData.msgId,
      size: chunk.size,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[upload-chunk]', msg)
    return NextResponse.json({ error: `Gagal upload chunk: ${msg}` }, { status: 500 })
  }
}
