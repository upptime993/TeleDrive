import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

// POST /api/auth/register — buat akun baru
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

    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password minimal 6 karakter, mengandung huruf dan angka' }, { status: 400 })
    }

    await connectDB()

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed })

    return NextResponse.json(
      { message: 'Akun berhasil dibuat', userId: user._id },
      { status: 201 }
    )
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json(
      { error: 'Gagal membuat akun karena kesalahan server.' },
      { status: 500 }
    )
  }
}
