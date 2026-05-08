import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { Folder } from '@/models/Folder'
import { File as FileModel } from '@/models/File'
import { ShareLink } from '@/models/ShareLink'
import { deleteTelegramMessages, collectMsgIds } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    await connectDB()

    const folders = await Folder
      .find({ userId: session.user.id, parentId: parentId || null })
      .sort({ name: 1 })
      .limit(200)
      .select('name parentId createdAt')
      .lean()

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('[folders GET]', error)
    return NextResponse.json({ error: 'Gagal mengambil folder' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.name) {
      return NextResponse.json({ error: 'Nama folder wajib diisi' }, { status: 400 })
    }

    const safeName = body.name.trim().replace(/\.\.\//g, '').replace(/\.\.\\/g, '').slice(0, 100)
    if (!safeName) {
      return NextResponse.json({ error: 'Nama folder tidak valid' }, { status: 400 })
    }

    await connectDB()

    if (body.parentId) {
      const parent = await Folder.findOne({ _id: body.parentId, userId: session.user.id }).lean()
      if (!parent) {
        return NextResponse.json({ error: 'Folder induk tidak ditemukan atau tidak valid' }, { status: 400 })
      }
    }

    const folder = await Folder.create({
      userId: session.user.id,
      name: safeName,
      parentId: body.parentId || null,
    })

    return NextResponse.json({ success: true, folder }, { status: 201 })
  } catch (error) {
    console.error('[folders POST]', error)
    return NextResponse.json({ error: 'Gagal membuat folder' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    if (!folderId) {
      return NextResponse.json({ error: 'folderId wajib diisi' }, { status: 400 })
    }

    await connectDB()

    const deleted = await Folder.findOneAndDelete({
      _id: folderId,
      userId: session.user.id,
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Folder tidak ditemukan' }, { status: 404 })
    }

    // Cascade delete files
    const files = await FileModel.find({ folderId, userId: session.user.id }).lean() as any[]
    if (files.length > 0) {
      const fileIds = files.map(f => f._id)
      await FileModel.deleteMany({ _id: { $in: fileIds } })
      await ShareLink.deleteMany({ fileId: { $in: fileIds } })
      const allMsgIds = files.flatMap(collectMsgIds)
      deleteTelegramMessages(allMsgIds)
    }

    return NextResponse.json({ success: true, message: 'Folder berhasil dihapus' })
  } catch (error) {
    console.error('[folders DELETE]', error)
    return NextResponse.json({ error: 'Gagal menghapus folder' }, { status: 500 })
  }
}
