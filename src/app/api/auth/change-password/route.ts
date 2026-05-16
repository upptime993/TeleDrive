import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { authOptions } from '@/lib/authOptions'

// POST /api/auth/change-password
const rateLimitMap = new Map<string, { count: number, reset: number }>()

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const rateEntry = rateLimitMap.get(ip) || { count: 0, reset: now + 5 * 60_000 }
    
    if (now > rateEntry.reset) {
      rateEntry.count = 0
      rateEntry.reset = now + 5 * 60_000
    }
    
    rateEntry.count++
    rateLimitMap.set(ip, rateEntry)
    
    if (rateEntry.count > 10) {
      return NextResponse.json({ error: 'Terlalu banyak request. Coba lagi nanti.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter, mengandung huruf dan angka' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Password saat ini tidak benar' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await User.updateOne({ _id: user._id }, { $set: { password: hashed } })

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch (err) {
    console.error('[change-password]', err)
    return NextResponse.json({ error: 'Gagal mengubah password karena kesalahan server' }, { status: 500 })
  }
}
