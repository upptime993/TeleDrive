import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { File as FileModel } from '@/models/File'

// FIX #1: Tambahkan maxDuration agar tidak timeout saat MongoDB write
export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface ChunkPayload {
  part: number
  msgId: number
  size: number
}

interface CompletePayload {
  fileName: string
  fileSize: number
  mimeType: string
  folderId?: string | null
  chunks: ChunkPayload[]
}

/**
 * POST /api/upload-complete
 *
 * Dipanggil setelah semua chunk berhasil diupload ke Telegram via STB.
 * Menyimpan metadata file ke MongoDB.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CompletePayload = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { fileName, fileSize, mimeType, folderId, chunks } = body

    if (!fileName || !fileSize || !chunks?.length) {
      return NextResponse.json(
        { error: 'fileName, fileSize, dan chunks wajib diisi' },
        { status: 400 }
      )
    }

    // Validasi nama file (hindari path traversal)
    const safeName = fileName
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .trim()
      .slice(0, 255)

    if (!safeName) {
      return NextResponse.json({ error: 'Nama file tidak valid' }, { status: 400 })
    }

    // FIX #7: Validasi semua chunk ada dan tidak ada yang missing
    const sortedChunks = [...chunks].sort((a, b) => a.part - b.part)
    const missingChunks: number[] = []
    for (let i = 0; i < sortedChunks.length; i++) {
      if (sortedChunks[i].part !== i) {
        missingChunks.push(i)
      }
    }
    if (missingChunks.length > 0) {
      return NextResponse.json(
        { error: `Upload tidak lengkap. Chunk ${missingChunks.join(', ')} hilang.` },
        { status: 400 }
      )
    }

    // Validasi msgId valid di setiap chunk
    for (const chunk of sortedChunks) {
      if (!chunk.msgId || typeof chunk.msgId !== 'number') {
        return NextResponse.json(
          { error: `Chunk ${chunk.part} memiliki msgId tidak valid` },
          { status: 400 }
        )
      }
    }

    await connectDB()

    const isChunked = sortedChunks.length > 1

    const savedFile = await FileModel.create({
      userId: session.user.id,
      name: safeName,
      originalName: fileName,
      size: fileSize,
      mimeType: mimeType || 'application/octet-stream',
      folderId: folderId || null,
      isChunked,
      // Jika 1 chunk saja, simpan msgId langsung di telegramMsgId
      telegramMsgId: !isChunked ? sortedChunks[0].msgId : null,
      chunks: isChunked ? sortedChunks : [],
    })

    return NextResponse.json(
      { success: true, file: savedFile },
      { status: 201 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[upload-complete]', msg)
    return NextResponse.json({ error: `Gagal menyimpan metadata: ${msg}` }, { status: 500 })
  }
}
