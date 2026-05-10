import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { File as FileModel } from '@/models/File'
import { ShareLink } from '@/models/ShareLink'
import { deleteTelegramMessages, collectMsgIds } from '@/lib/telegram'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const filter = searchParams.get('filter')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100')))
    const skip = (page - 1) * limit

    await connectDB()

    // [FIX CODE-02] Endpoint agregasi storage — hitung total tanpa menarik semua dokumen
    if (searchParams.get('aggregate') === 'storage') {
      const result = await FileModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' },
            totalFiles: { $sum: 1 },
          },
        },
      ])
      const stats = result[0] || { totalSize: 0, totalFiles: 0 }
      return NextResponse.json({ totalSize: stats.totalSize, totalFiles: stats.totalFiles })
    }

    let query: any = { userId: session.user.id }

    if (filter === 'trash') {
      query.isDeleted = true
    } else {
      query.isDeleted = { $ne: true }
      if (filter === 'starred') {
        query.isStarred = true
      } else if (filter === 'recent') {
        // no extra filter — sort by createdAt desc
      } else if (filter === 'foto') {
        query.mimeType = { $regex: '^image/' }
      } else if (filter === 'video') {
        query.mimeType = { $regex: '^video/' }
      } else if (filter === 'document') {
        query.mimeType = {
          $regex:
            '^(application/pdf|text/|application/msword|application/vnd\\.openxmlformats-officedocument.*|application/json)',
        }
      } else if (folderId !== 'all') {
        query.folderId = folderId || null
      }
    }

    const [files, total] = await Promise.all([
      FileModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter === 'recent' ? 50 : limit)
        .select('name size mimeType folderId isChunked createdAt isStarred')
        .lean(),
      FileModel.countDocuments(query),
    ])

    return NextResponse.json({ files, total, page, limit })
  } catch (error) {
    console.error('[files GET]', error)
    return NextResponse.json({ error: 'Gagal mengambil daftar file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const permanent = searchParams.get('permanent') === 'true'

    if (fileId) {
      const file = await FileModel.findOne({ _id: fileId, userId: session.user.id }).lean() as any
      if (!file) {
        return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
      }
      
      if (permanent) {
        await FileModel.deleteOne({ _id: fileId, userId: session.user.id })
        await ShareLink.deleteMany({ fileId })
        const msgIds = collectMsgIds(file)
        await deleteTelegramMessages(msgIds)
        return NextResponse.json({ success: true, message: 'File dihapus permanen' })
      } else {
        await FileModel.updateOne({ _id: fileId, userId: session.user.id }, { $set: { isDeleted: true } })
        return NextResponse.json({ success: true, message: 'File dipindahkan ke tempat sampah' })
      }
    }

    const body = await request.json().catch(() => null)
    if (body?.fileIds && Array.isArray(body.fileIds) && body.fileIds.length > 0) {
      const files = await FileModel.find({
        _id: { $in: body.fileIds },
        userId: session.user.id,
      }).lean() as any[]

      if (!files.length) {
        return NextResponse.json({ error: 'Tidak ada file yang ditemukan' }, { status: 404 })
      }

      const foundIds = files.map((f: any) => f._id)
      
      if (permanent) {
        await FileModel.deleteMany({ _id: { $in: foundIds }, userId: session.user.id })
        await ShareLink.deleteMany({ fileId: { $in: foundIds } })
        const allMsgIds = files.flatMap(collectMsgIds)
        await deleteTelegramMessages(allMsgIds)
        return NextResponse.json({ success: true, message: `${files.length} file dihapus permanen` })
      } else {
        await FileModel.updateMany({ _id: { $in: foundIds }, userId: session.user.id }, { $set: { isDeleted: true } })
        return NextResponse.json({ success: true, message: `${files.length} file dipindahkan ke tempat sampah` })
      }
    }

    return NextResponse.json({ error: 'fileId atau fileIds wajib diisi' }, { status: 400 })
  } catch (error) {
    console.error('[files DELETE]', error)
    return NextResponse.json({ error: 'Gagal menghapus file' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.fileId) {
      return NextResponse.json({ error: 'fileId wajib diisi' }, { status: 400 })
    }

    await connectDB()

    const updateData: any = {}
    if (body.name !== undefined) {
      updateData.name = body.name.trim().replace(/\.\.\//g, '').replace(/\.\.\\/g, '').slice(0, 255)
      if (!updateData.name) {
        return NextResponse.json({ error: 'Nama file tidak valid' }, { status: 400 })
      }
    }
    if (typeof body.isStarred === 'boolean') {
      updateData.isStarred = body.isStarred
    }
    if (body.folderId !== undefined) {
      if (body.folderId !== null) {
        const { Folder } = await import('@/models/Folder')
        const folder = await Folder.findOne({ _id: body.folderId, userId: session.user.id }).lean()
        if (!folder) {
          return NextResponse.json({ error: 'Folder tujuan tidak ditemukan atau tidak valid' }, { status: 400 })
        }
      }
      updateData.folderId = body.folderId
    }
    if (typeof body.isDeleted === 'boolean') {
      updateData.isDeleted = body.isDeleted
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
    }

    const updated = await FileModel.findOneAndUpdate(
      { _id: body.fileId, userId: session.user.id },
      updateData,
      { new: true, select: 'name size mimeType folderId isStarred createdAt' }
    )

    if (!updated) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, file: updated })
  } catch (error) {
    console.error('[files PATCH]', error)
    return NextResponse.json({ error: 'Gagal update file' }, { status: 500 })
  }
}
