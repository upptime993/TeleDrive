import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { File as FileModel } from '@/models/File'
import { ShareLink } from '@/models/ShareLink'
import { getWorkerUrl } from '@/lib/workerUrl'

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

    // Check expiry
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

    // Increment download count (fire-and-forget, non-blocking)
    ShareLink.updateOne({ token }, { $inc: { downloadCount: 1 } }).catch(() => {})

    let fetchUrl = ''

    if (!file.isChunked && file.telegramMsgId) {
      const url = new URL(`${workerUrl}/download`)
      url.searchParams.set('msgId', file.telegramMsgId.toString())
      url.searchParams.set('fileName', file.name)
      url.searchParams.set('mimeType', file.mimeType || 'application/octet-stream')
      fetchUrl = url.toString()
    } else if (file.isChunked && file.chunks && file.chunks.length > 0) {
      const sorted = [...file.chunks].sort((a: any, b: any) => a.part - b.part)
      const msgIds = sorted.map((c: any) => c.msgId).join(',')
      const url = new URL(`${workerUrl}/download-chunked`)
      url.searchParams.set('msgIds', msgIds)
      url.searchParams.set('fileName', file.name)
      url.searchParams.set('mimeType', file.mimeType || 'application/octet-stream')
      url.searchParams.set('fileSize', file.size.toString())
      fetchUrl = url.toString()
    } else {
      return NextResponse.json({ error: 'Data file tidak valid' }, { status: 400 })
    }

    const secret = process.env.WORKER_SECRET || ''
    const headers: Record<string, string> = {}
    if (secret) headers['x-worker-secret'] = secret

    const workerRes = await fetch(fetchUrl, { headers })
    if (!workerRes.ok) {
      return NextResponse.json({ error: 'Worker gagal merespons download' }, { status: workerRes.status })
    }

    const resHeaders = new Headers(workerRes.headers)
    return new NextResponse(workerRes.body, {
      status: workerRes.status,
      headers: resHeaders
    })
  } catch (err) {
    console.error('[share/download]', err)
    return NextResponse.json({ error: 'Download gagal' }, { status: 500 })
  }
}
