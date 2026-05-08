import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { File as FileModel } from '@/models/File'
import { ShareLink } from '@/models/ShareLink'
import { randomBytes } from 'crypto'

function generateToken(): string {
  return randomBytes(9).toString('base64url').slice(0, 12)
}

// POST /api/share — generate public share link
export async function POST(request: NextRequest) {
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

    // Verify file belongs to user
    const file = await FileModel.findOne({
      _id: body.fileId,
      userId: session.user.id,
    }).lean() as any

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    // Check if share link already exists for this file
    const existing = await ShareLink.findOne({ fileId: body.fileId, userId: session.user.id })
    if (existing) {
      const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
      return NextResponse.json({
        success: true,
        token: existing.token,
        url: `${baseUrl}/share/${existing.token}`,
        downloadCount: existing.downloadCount,
      })
    }

    // Generate unique token
    let token = generateToken()
    let attempts = 0
    while (attempts < 5) {
      const clash = await ShareLink.findOne({ token })
      if (!clash) break
      token = generateToken()
      attempts++
    }

    if (attempts === 5) {
      return NextResponse.json({ error: 'Gagal membuat token unik' }, { status: 500 })
    }

    // Parse expiry
    let expiresAt: Date | null = null
    if (body.expiresInDays && typeof body.expiresInDays === 'number' && body.expiresInDays > 0) {
      expiresAt = new Date(Date.now() + body.expiresInDays * 86400000)
    }

    const share = await ShareLink.create({
      token,
      fileId: file._id,
      userId: session.user.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimeType,
      expiresAt,
    })

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    return NextResponse.json({
      success: true,
      token: share.token,
      url: `${baseUrl}/share/${share.token}`,
      downloadCount: 0,
    }, { status: 201 })
  } catch (err) {
    console.error('[share POST]', err)
    return NextResponse.json({ error: 'Gagal membuat share link' }, { status: 500 })
  }
}

// GET /api/share?token=xxx — public: get file info by token
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

    return NextResponse.json({
      fileName: share.fileName,
      fileSize: share.fileSize,
      mimeType: share.mimeType,
      downloadCount: share.downloadCount,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
    })
  } catch (err) {
    console.error('[share GET]', err)
    return NextResponse.json({ error: 'Gagal mengambil info file' }, { status: 500 })
  }
}

// DELETE /api/share — revoke share link (requires auth)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'token wajib diisi' }, { status: 400 })
    }

    await connectDB()
    await ShareLink.deleteOne({ token, userId: session.user.id })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[share DELETE]', err)
    return NextResponse.json({ error: 'Gagal menghapus share link' }, { status: 500 })
  }
}
