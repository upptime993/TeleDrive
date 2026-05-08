import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { File as FileModel } from '@/models/File'
import { getWorkerUrl } from '@/lib/workerUrl'

// FIX #1: Tambahkan maxDuration agar redirect tidak timeout
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// GET /api/download?fileId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    if (!fileId) return NextResponse.json({ error: 'fileId wajib diisi' }, { status: 400 })

    await connectDB()
    const userId = (session.user as any).id
    const file = await FileModel.findOne({ _id: fileId, userId }).lean() as any
    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })

    const workerUrl = getWorkerUrl()
    if (!workerUrl) return NextResponse.json({ error: 'Worker tidak tersedia' }, { status: 503 })

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
    console.error('[download]', err)
    return NextResponse.json({ error: 'Download gagal' }, { status: 500 })
  }
}
