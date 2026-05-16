import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'

// ─── Login Rate Limiter ───────────────────────────────────────
// Rate limit berbasis email (10 percobaan per 5 menit per email)
// Lebih efektif dari rate limit per-IP untuk environment Vercel serverless
const loginRateLimit = new Map<string, { count: number; reset: number }>()

function checkLoginRate(email: string): { allowed: boolean; remainingMs: number } {
  const now = Date.now()
  const WINDOW_MS = 5 * 60_000   // 5 menit
  const MAX_ATTEMPTS = 10

  const entry = loginRateLimit.get(email) || { count: 0, reset: now + WINDOW_MS }
  if (now > entry.reset) {
    entry.count = 0
    entry.reset = now + WINDOW_MS
  }
  entry.count++
  loginRateLimit.set(email, entry)

  return {
    allowed: entry.count <= MAX_ATTEMPTS,
    remainingMs: Math.max(0, entry.reset - now),
  }
}

// Bersihkan entry yang sudah expire setiap 10 menit
setInterval(() => {
  const now = Date.now()
  loginRateLimit.forEach((entry, email) => {
    if (now > entry.reset) loginRateLimit.delete(email)
  })
}, 10 * 60_000)

// ─── NextAuth Config ──────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi')
        }

        const emailKey = credentials.email.toLowerCase().trim()
        const rateCheck = checkLoginRate(emailKey)
        if (!rateCheck.allowed) {
          const minutes = Math.ceil(rateCheck.remainingMs / 60_000)
          throw new Error(
            `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`
          )
        }

        await connectDB()

        const user = await User.findOne({ email: emailKey })
        if (!user) {
          throw new Error('Email tidak ditemukan')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Password salah')
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
