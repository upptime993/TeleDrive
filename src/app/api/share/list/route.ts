import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { ShareLink } from '@/models/ShareLink'
import { File as FileModel } from '@/models/File'

// GET /api/share/list — get all files the user has shared
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const shares = await ShareLink
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean() as any[]

    if (!shares.length) {
      return NextResponse.json({ files: [], total: 0, page: 1, limit: 100 })
    }

    const fileIds = shares.map(s => s.fileId)
    const files = await FileModel
      .find({ _id: { $in: fileIds }, userId: session.user.id })
      .select('name size mimeType folderId isChunked createdAt isStarred')
      .lean() as any[]

    // Merge share info into file objects
    const shareMap = new Map(shares.map(s => [s.fileId.toString(), s]))
    const result = files.map(f => ({
      ...f,
      _shareToken: shareMap.get(f._id.toString())?.token,
      _downloadCount: shareMap.get(f._id.toString())?.downloadCount ?? 0,
    }))

    return NextResponse.json({ files: result, total: result.length, page: 1, limit: 100 })
  } catch (err) {
    console.error('[share/list]', err)
    return NextResponse.json({ error: 'Gagal mengambil daftar file yang dibagikan' }, { status: 500 })
  }
}
