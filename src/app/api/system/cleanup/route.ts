import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { Folder } from '@/models/Folder'
import { File as FileModel } from '@/models/File'
import { ShareLink } from '@/models/ShareLink'
import { deleteTelegramMessages, collectMsgIds } from '@/lib/telegram'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // 1. Dapatkan semua ID folder yang valid milik user
    const allFolders = await Folder.find({ userId: session.user.id }).select('_id').lean()
    const validFolderIds = new Set(allFolders.map(f => f._id.toString()))

    let deletedFilesCount = 0
    let deletedFoldersCount = 0

    // 2. Cari semua subfolder yang parentId-nya tidak null dan tidak ada di validFolderIds
    const orphanedFolders = await Folder.find({
      userId: session.user.id,
      parentId: { $ne: null }
    }).lean()

    const foldersToDelete = orphanedFolders.filter(f => f.parentId && !validFolderIds.has(f.parentId.toString()))
    
    if (foldersToDelete.length > 0) {
      const folderIdsToDelete = foldersToDelete.map(f => f._id)
      await Folder.deleteMany({ _id: { $in: folderIdsToDelete } })
      deletedFoldersCount += folderIdsToDelete.length
    }

    // 3. Cari semua file yang folderId-nya tidak null dan tidak ada di validFolderIds (setelah folder yatim dihapus)
    // Update validFolderIds karena kita baru saja menghapus beberapa folder
    const remainingFolders = await Folder.find({ userId: session.user.id }).select('_id').lean()
    const updatedValidFolderIds = new Set(remainingFolders.map(f => f._id.toString()))

    const orphanedFiles = await FileModel.find({
      userId: session.user.id,
      folderId: { $ne: null }
    }).lean() as any[]

    const filesToDelete = orphanedFiles.filter(f => f.folderId && !updatedValidFolderIds.has(f.folderId.toString()))

    if (filesToDelete.length > 0) {
      const fileIdsToDelete = filesToDelete.map(f => f._id)
      await FileModel.deleteMany({ _id: { $in: fileIdsToDelete } })
      await ShareLink.deleteMany({ fileId: { $in: fileIdsToDelete } })

      const allMsgIds = filesToDelete.flatMap(collectMsgIds)
      if (allMsgIds.length > 0) {
        await deleteTelegramMessages(allMsgIds)
      }
      deletedFilesCount += filesToDelete.length
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup berhasil',
      deletedFolders: deletedFoldersCount,
      deletedFiles: deletedFilesCount
    })
  } catch (error) {
    console.error('[system cleanup]', error)
    return NextResponse.json({ error: 'Gagal melakukan cleanup' }, { status: 500 })
  }
}
