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

// [FIX BUG-01] Tambahkan PATCH untuk rename folder
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.folderId || !body?.name) {
      return NextResponse.json({ error: 'folderId dan name wajib diisi' }, { status: 400 })
    }

    const safeName = body.name.trim().replace(/\.\.\//g, '').replace(/\.\.\\/g, '').slice(0, 100)
    if (!safeName) {
      return NextResponse.json({ error: 'Nama folder tidak valid' }, { status: 400 })
    }

    await connectDB()

    const updated = await Folder.findOneAndUpdate(
      { _id: body.folderId, userId: session.user.id },
      { name: safeName },
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

    if (!folderId) {
      return NextResponse.json({ error: 'folderId wajib diisi' }, { status: 400 })
    }

    await connectDB()

    // [FIX BUG-02] Cegah orphaned subfolder — tolak jika masih ada subfolder
    const hasSubfolder = await Folder.findOne({
      parentId: folderId,
      userId: session.user.id,
    }).lean()

    if (hasSubfolder) {
      return NextResponse.json(
        {
          error: 'Folder tidak bisa dihapus karena masih berisi subfolder. Hapus atau pindahkan subfolder terlebih dahulu.',
        },
        { status: 400 }
      )
    }

    const deleted = await Folder.findOneAndDelete({
      _id: folderId,
      userId: session.user.id,
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Folder tidak ditemukan' }, { status: 404 })
    }

    // Cascade delete: file di folder ini + share links + pesan Telegram
    const files = await FileModel.find({ folderId, userId: session.user.id }).lean() as any[]
    if (files.length > 0) {
      const fileIds = files.map(f => f._id)
      await FileModel.deleteMany({ _id: { $in: fileIds } })
      await ShareLink.deleteMany({ fileId: { $in: fileIds } })

      // [FIX SEC-01] Await agar penghapusan Telegram selesai sebelum function terminate
      const allMsgIds = files.flatMap(collectMsgIds)
      await deleteTelegramMessages(allMsgIds)
    }

    return NextResponse.json({ success: true, message: 'Folder berhasil dihapus' })
  } catch (error) {
    console.error('[folders DELETE]', error)
    return NextResponse.json({ error: 'Gagal menghapus folder' }, { status: 500 })
  }
}
