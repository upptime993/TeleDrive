import mongoose from 'mongoose'

// Cache koneksi agar tidak dibuat ulang di setiap request (hot-reload / serverless)
let cached = (global as any).mongoose as {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const rawUri = process.env.MONGODB_URI

    if (!rawUri) {
      throw new Error('MONGODB_URI tidak ditemukan di environment variables')
    }

    // Trim whitespace/newline tersembunyi (common issue saat paste di Vercel)
    const uri = rawUri.trim()

    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(
        `MONGODB_URI tidak valid. Nilai yang diterima dimulai dengan: "${uri.substring(0, 20)}..."`
      )
    }

    // Pastikan ada database name di URI (default ke 'teledrive' jika tidak ada)
    let finalUri = uri
    try {
      const url = new URL(uri)
      if (!url.pathname || url.pathname === '/' || url.pathname === '') {
        // Sisipkan database name sebelum query string
        finalUri = uri.replace(/(\?.*)$/, '/teledrive$1').replace(/\/$/, '/teledrive')
      }
    } catch {
      // Biarkan URI apa adanya jika parse gagal
    }

    console.log('[MongoDB] Connecting to Atlas...')

    cached.promise = mongoose.connect(finalUri, {
      bufferCommands: false,
      dbName: 'teledrive', // explicit database name sebagai fallback
    })
  }

  cached.conn = await cached.promise
  console.log('[MongoDB] Connected successfully')
  return cached.conn
}
