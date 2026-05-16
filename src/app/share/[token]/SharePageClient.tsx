'use client'

import { useEffect, useState } from 'react'
import { Cloud, Download, FileText, FileImage, FileVideo, FileAudio, FileArchive, File as FileIconGeneric, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface ShareInfo {
  fileName: string
  fileSize: number
  mimeType: string
  downloadCount: number
  createdAt: string
  expiresAt: string | null
}

function FileTypeIcon({ mimeType, size = 56 }: { mimeType: string; size?: number }) {
  const props = { size, strokeWidth: 1.2 }
  if (mimeType.startsWith('image/')) return <FileImage {...props} className="text-purple-400" />
  if (mimeType.startsWith('video/')) return <FileVideo {...props} className="text-pink-400" />
  if (mimeType.startsWith('audio/')) return <FileAudio {...props} className="text-emerald-400" />
  if (mimeType === 'application/pdf') return <FileText {...props} className="text-[#ff4b4b]" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive {...props} className="text-[#ffc800]" />
  if (mimeType.startsWith('text/')) return <FileText {...props} className="text-blue-400" />
  return <FileIconGeneric {...props} className="text-[#777777]" />
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const s = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${s[i]}`
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SharePageClient({ token }: { token: string }) {
  const [info, setInfo] = useState<ShareInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    fetch(`/api/share?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInfo(data)
      })
      .catch(() => setError('Gagal memuat informasi file'))
      .finally(() => setLoading(false))
  }, [token])

  const handleDownload = () => {
    setDownloading(true)
    const a = document.createElement('a')
    a.href = `/api/share/download?token=${token}`
    a.download = info?.fileName || 'file'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => {
      setDownloading(false)
      setDownloaded(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] bg-white border-b-2 border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-[0_4px_0_#3f8f01] group-hover:shadow-[0_4px_0_#3f8f01] transition-all">
              <Cloud size={20} className="text-[#3c3c3c]" />
            </div>
            <div>
              <div className="font-bold text-[#3c3c3c] tracking-tight">TeleDrive</div>
              <div className="text-[10px] text-[#afafaf] uppercase tracking-wider">Cloud Storage</div>
            </div>
          </Link>
          <Link href="/login" className="text-sm text-[#777777] hover:text-[#58cc02] transition-colors font-medium">
            Login →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">

          {loading && (
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-[#e5e5e5] border-t-[#58cc02] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#777777]">Memuat informasi file...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center bg-white border border-[#e5e5e5] rounded-3xl p-12">
              <div className="w-20 h-20 rounded-2xl bg-[#ffdfe0] flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-[#ff4b4b]" />
              </div>
              <h2 className="text-xl font-bold text-[#3c3c3c] mb-2">Link Tidak Valid</h2>
              <p className="text-[#777777] mb-8">{error}</p>
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f7f7f7] border border-[#e5e5e5] text-[#3c3c3c] font-semibold hover:bg-[#e5e5e5] transition-colors">
                Kembali ke Beranda
              </Link>
            </div>
          )}

          {!loading && info && (
            <div className="bg-white border border-[#e5e5e5] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 backdrop-blur">

              {/* File Header */}
              <div className="p-8 border-b border-[#e5e5e5] text-center relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0  pointer-events-none" />
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-[#f7fff0] border border-[#e5e5e5] flex items-center justify-center mx-auto mb-5 shadow-xl">
                    <FileTypeIcon mimeType={info.mimeType} size={48} />
                  </div>
                  <h1 className="text-xl font-bold text-[#3c3c3c] mb-2 break-all leading-tight px-4">
                    {info.fileName}
                  </h1>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <span className="text-sm text-[#777777] bg-[#f7f7f7] px-3 py-1 rounded-full border border-[#e5e5e5]">
                      {formatBytes(info.fileSize)}
                    </span>
                    <span className="text-sm text-[#777777] bg-[#f7f7f7] px-3 py-1 rounded-full border border-[#e5e5e5]">
                      {info.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="px-8 py-5 space-y-3 border-b border-[#e5e5e5]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#afafaf] flex items-center gap-2">
                    <Download size={14} /> Total Diunduh
                  </span>
                  <span className="text-[#3c3c3c] font-medium">{info.downloadCount.toLocaleString('id-ID')}x</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#afafaf] flex items-center gap-2">
                    <Clock size={14} /> Dibagikan pada
                  </span>
                  <span className="text-[#3c3c3c] font-medium">{fmtDate(info.createdAt)}</span>
                </div>
                {info.expiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#afafaf] flex items-center gap-2">
                      <Clock size={14} /> Kadaluarsa
                    </span>
                    <span className="text-[#ffc800] font-medium">{fmtDate(info.expiresAt)}</span>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <div className="p-8">
                <button
                  onClick={handleDownload}
                  disabled={downloading || downloaded}
                  className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                    downloaded
                      ? 'bg-[#d7ffb8] border-2 border-[#58cc02] text-[#58cc02]'
                      : downloading
                        ? 'bg-[#f7fff0] border-2 border-[#58cc02] text-[#58cc02] cursor-wait'
                        : 'bg-[#58cc02] hover:bg-[#4ab001] text-white shadow-[0_6px_0_#3f8f01] active:translate-y-[6px] active:shadow-none'
                  }`}
                >
                  {downloaded ? (
                    <>
                      <CheckCircle2 size={22} />
                      Download Dimulai!
                    </>
                  ) : downloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Menyiapkan Download...
                    </>
                  ) : (
                    <>
                      <Download size={22} />
                      Download File ({formatBytes(info.fileSize)})
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#afafaf] mt-4">
                  File ini dibagikan via TeleDrive — Cloud storage berbasis Telegram
                </p>
              </div>
            </div>
          )}

          {/* Branding Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-[#afafaf]">
              Ingin menyimpan file kamu sendiri?{' '}
              <Link href="/login?tab=register" className="text-[#58cc02] hover:text-[#4ab001] transition-colors font-medium">
                Daftar gratis →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
