import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { File as FileModel } from '@/models/File'
import { ShareLink } from '@/models/ShareLink'
import { getWorkerUrl, buildWorkerDownloadUrl } from '@/lib/workerUrl'

export const dynamic = 'force-dynamic'

// GET /api/share/download?token=xxx — public download, no auth required
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'token wajib diisi' }, { status: 400 })
    }

    await connectDB()

    const share = await ShareLink.findOne({ token }).lean() as any
    if (!share) {
      return NextResponse.json({ error: 'Link tidak ditemukan atau sudah kadaluarsa' }, { status: 404 })
    }

    // Check expiry (backup dari TTL index MongoDB)
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      await ShareLink.deleteOne({ token })
      return NextResponse.json({ error: 'Link sudah kadaluarsa' }, { status: 410 })
    }

    // Get file metadata
    const file = await FileModel.findById(share.fileId).lean() as any
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan di server' }, { status: 404 })
    }

    const workerUrl = getWorkerUrl()
    if (!workerUrl) {
      return NextResponse.json({ error: 'Worker tidak tersedia saat ini' }, { status: 503 })
    }

    // Increment download count (fire-and-forget, non-blocking — tidak kritis)
    ShareLink.updateOne({ token }, { $inc: { downloadCount: 1 } }).catch(() => {})

    // [FIX CODE-01] Gunakan helper buildWorkerDownloadUrl — tidak duplikasi logika lagi
    const fetchUrl = buildWorkerDownloadUrl(workerUrl, file)
    if (!fetchUrl) {
      return NextResponse.json({ error: 'Data file tidak valid' }, { status: 400 })
    }

    const secret = process.env.WORKER_SECRET || ''
    const headers: Record<string, string> = {}
    if (secret) headers['x-worker-secret'] = secret

    const workerRes = await fetch(fetchUrl, { headers })
    if (!workerRes.ok) {
      return NextResponse.json(
        { error: 'Worker gagal merespons download' },
        { status: workerRes.status }
      )
    }

    const resHeaders = new Headers(workerRes.headers)
    return new NextResponse(workerRes.body, {
      status: workerRes.status,
      headers: resHeaders,
    })
  } catch (err) {
    console.error('[share/download]', err)
    return NextResponse.json({ error: 'Download gagal' }, { status: 500 })
  }
}
