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
    const filter = searchParams.get('filter')

    await connectDB()

    let query: any = { userId: session.user.id }
    if (filter === 'trash') {
      query.isDeleted = true
    } else {
      query.isDeleted = { $ne: true }
      query.parentId = parentId || null
    }

    const folders = await Folder
      .find(query)
      .sort({ name: 1 })
      .limit(200)
      .select('name parentId isDeleted createdAt')
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

// [FIX BUG-01] Tambahkan PATCH untuk rename folder
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.folderId) {
      return NextResponse.json({ error: 'folderId wajib diisi' }, { status: 400 })
    }

    const updateData: any = {}
    if (body.name !== undefined) {
      const safeName = body.name.trim().replace(/\.\.\//g, '').replace(/\.\.\\/g, '').slice(0, 100)
      if (!safeName) return NextResponse.json({ error: 'Nama folder tidak valid' }, { status: 400 })
      updateData.name = safeName
    }
    if (typeof body.isDeleted === 'boolean') {
      updateData.isDeleted = body.isDeleted
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
    }

    await connectDB()

    const updated = await Folder.findOneAndUpdate(
      { _id: body.folderId, userId: session.user.id },
      updateData,
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ error: 'Folder tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, folder: updated })
  } catch (error) {
    console.error('[folders PATCH]', error)
    return NextResponse.json({ error: 'Gagal mengubah nama folder' }, { status: 500 })
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
    const permanent = searchParams.get('permanent') === 'true'

    if (!folderId) {
      return NextResponse.json({ error: 'folderId wajib diisi' }, { status: 400 })
    }

    await connectDB()

    const hasSubfolder = await Folder.findOne({
      parentId: folderId,
      userId: session.user.id,
      isDeleted: false
    }).lean()

    if (hasSubfolder && !permanent) {
      return NextResponse.json(
        { error: 'Folder tidak bisa dipindahkan ke tempat sampah karena berisi subfolder aktif. Pindahkan/hapus subfolder terlebih dahulu.' },
        { status: 400 }
      )
    }

    if (permanent) {
      const deleted = await Folder.findOneAndDelete({ _id: folderId, userId: session.user.id })
      if (!deleted) return NextResponse.json({ error: 'Folder tidak ditemukan' }, { status: 404 })

      const files = await FileModel.find({ folderId: deleted._id, userId: session.user.id }).lean() as any[]
      if (files.length > 0) {
        const fileIds = files.map(f => f._id)
        await FileModel.deleteMany({ _id: { $in: fileIds } })
        await ShareLink.deleteMany({ fileId: { $in: fileIds } })

        const allMsgIds = files.flatMap(collectMsgIds)
        await deleteTelegramMessages(allMsgIds)
      }
      return NextResponse.json({ success: true, message: 'Folder dihapus permanen' })
    } else {
      const updated = await Folder.findOneAndUpdate({ _id: folderId, userId: session.user.id }, { isDeleted: true })
      if (!updated) return NextResponse.json({ error: 'Folder tidak ditemukan' }, { status: 404 })
      await FileModel.updateMany({ folderId, userId: session.user.id }, { isDeleted: true })
      return NextResponse.json({ success: true, message: 'Folder dipindahkan ke tempat sampah' })
    }
  } catch (error) {
    console.error('[folders DELETE]', error)
    return NextResponse.json({ error: 'Gagal menghapus folder' }, { status: 500 })
  }
}
