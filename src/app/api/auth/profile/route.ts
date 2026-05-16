import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const user = await User.findById(session.user.id).select('name email createdAt').lean() as any
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ name: user.name, email: user.email, createdAt: user.createdAt })
  } catch (err) {
    console.error('[auth/profile]', err)
    return NextResponse.json({ error: 'Gagal mengambil profil' }, { status: 500 })
  }
}
