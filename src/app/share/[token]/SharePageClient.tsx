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
  if (mimeType === 'application/pdf') return <FileText {...props} className="text-rose-400" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive {...props} className="text-amber-400" />
  if (mimeType.startsWith('text/')) return <FileText {...props} className="text-blue-400" />
  return <FileIconGeneric {...props} style={{ color: '#777a88' }} />
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
    setTimeout(() => { setDownloading(false); setDownloaded(true) }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000000' }}>
      {/* Header */}
      <header style={{ background: '#030304', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Cloud size={18} color="#ffffff" />
            </div>
            <div>
              <div className="font-display" style={{ color: '#ffffff', fontSize: '16px', fontWeight: 500, letterSpacing: '0.01em' }}>TeleDrive</div>
              <div style={{ fontSize: '10px', color: '#5e616e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cloud Storage</div>
            </div>
          </Link>
          <Link
            href="/login"
            className="text-sm transition-colors"
            style={{ color: '#acafb9' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#acafb9' }}
          >
            Login →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">

          {loading && (
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
                style={{ borderColor: 'rgba(255,255,255,0.10)', borderTopColor: '#ffffff' }}
              />
              <p style={{ color: '#5e616e', fontSize: '14px' }}>Memuat informasi file...</p>
            </div>
          )}

          {!loading && error && (
            <div
              className="text-center p-12 rounded-2xl"
              style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div
                className="w-20 h-20 rounded-[10px] flex items-center justify-center mx-auto mb-6"
                style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <AlertCircle size={36} style={{ color: '#777a88' }} />
              </div>
              <h2
                className="font-display mb-2"
                style={{ fontSize: '24px', color: '#ffffff', fontWeight: 500, letterSpacing: '0.01em' }}
              >
                Link Tidak Valid
              </h2>
              <p style={{ color: '#5e616e', fontSize: '14px', marginBottom: '2rem' }}>{error}</p>
              <Link href="/" className="btn-ghost inline-flex items-center gap-2">
                Kembali ke Beranda
              </Link>
            </div>
          )}

          {!loading && info && (
            <div
              className="rounded-[10px] overflow-hidden"
              style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* File Header */}
              <div
                className="p-8 text-center"
                style={{ background: '#08080a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-20 h-20 rounded-[10px] flex items-center justify-center mx-auto mb-5"
                  style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <FileTypeIcon mimeType={info.mimeType} size={40} />
                </div>
                <h1
                  className="font-display mb-3 break-all leading-tight px-4"
                  style={{ fontSize: '20px', color: '#ffffff', fontWeight: 500, letterSpacing: '0.01em' }}
                >
                  {info.fileName}
                </h1>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <span
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)', color: '#acafb9' }}
                  >
                    {formatBytes(info.fileSize)}
                  </span>
                  <span
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)', color: '#acafb9' }}
                  >
                    {info.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                </div>
              </div>

              {/* File Info */}
              <div className="px-8 py-5 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: '#5e616e', fontWeight: 500 }}>
                    <Download size={13} /> Total Diunduh
                  </span>
                  <span style={{ color: '#e2e3e9', fontWeight: 500 }}>{info.downloadCount.toLocaleString('id-ID')}x</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: '#5e616e', fontWeight: 500 }}>
                    <Clock size={13} /> Dibagikan pada
                  </span>
                  <span style={{ color: '#e2e3e9', fontWeight: 500 }}>{fmtDate(info.createdAt)}</span>
                </div>
                {info.expiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2" style={{ color: '#5e616e', fontWeight: 500 }}>
                      <Clock size={13} /> Kadaluarsa
                    </span>
                    <span style={{ color: '#acafb9', fontWeight: 500 }}>{fmtDate(info.expiresAt)}</span>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <div className="p-8">
                <button
                  onClick={handleDownload}
                  disabled={downloading || downloaded}
                  className="w-full py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300"
                  style={
                    downloaded
                      ? { background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)', color: '#e2e3e9', cursor: 'default' }
                      : downloading
                      ? { background: '#1c1d22', border: '1px solid rgba(255,255,255,0.05)', color: '#acafb9', cursor: 'wait' }
                      : { background: '#ffffff', color: '#08080a', border: 'none' }
                  }
                  onMouseEnter={e => { if (!downloading && !downloaded) (e.currentTarget as HTMLButtonElement).style.background = '#e2e3e9' }}
                  onMouseLeave={e => { if (!downloading && !downloaded) (e.currentTarget as HTMLButtonElement).style.background = '#ffffff' }}
                >
                  {downloaded ? (
                    <><CheckCircle2 size={20} /> Download Dimulai!</>
                  ) : downloading ? (
                    <><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.20)', borderTopColor: '#acafb9' }} /> Menyiapkan Download...</>
                  ) : (
                    <><Download size={20} /> Download File ({formatBytes(info.fileSize)})</>
                  )}
                </button>

                <p className="text-center mt-4" style={{ fontSize: '12px', color: '#5e616e' }}>
                  File ini dibagikan via TeleDrive — Cloud storage berbasis Telegram
                </p>
              </div>
            </div>
          )}

          {/* Branding Footer */}
          <div className="text-center mt-8">
            <p style={{ fontSize: '13px', color: '#5e616e' }}>
              Ingin menyimpan file kamu sendiri?{' '}
              <Link
                href="/login?tab=register"
                className="underline transition-colors"
                style={{ color: '#acafb9' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#acafb9' }}
              >
                Daftar gratis →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
