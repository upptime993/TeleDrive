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
  return <FileIconGeneric {...props} style={{ color: '#898989' }} />
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
    <div className="min-h-screen flex flex-col" style={{ background: '#121212' }}>
      {/* Header */}
      <header style={{ background: '#2e2e2e', borderBottom: '1px solid #393939' }}>
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center"
              style={{ background: '#006239', border: '1px solid rgba(62,207,142,0.30)' }}
            >
              <Cloud size={15} color="#fafafa" />
            </div>
            <div>
              <div style={{ color: '#fafafa', fontSize: '13px', fontWeight: 500, letterSpacing: '-0.007px' }}>TeleDrive</div>
            </div>
          </Link>
          <Link
            href="/login"
            className="text-sm transition-colors"
            style={{ color: '#3ecf8e', letterSpacing: '-0.007px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#00c573' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
          >
            Login →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {loading && (
            <div className="text-center">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4"
                style={{ borderColor: '#393939', borderTopColor: '#3ecf8e' }}
              />
              <p style={{ color: '#898989', fontSize: '13px', letterSpacing: '-0.007px' }}>Memuat informasi file...</p>
            </div>
          )}

          {!loading && error && (
            <div
              className="text-center p-10 rounded-[16px]"
              style={{ background: '#2e2e2e', border: '1px solid #393939' }}
            >
              <div
                className="w-16 h-16 rounded-[6px] flex items-center justify-center mx-auto mb-5"
                style={{ background: '#242424', border: '1px solid #393939' }}
              >
                <AlertCircle size={28} style={{ color: '#898989' }} />
              </div>
              <h2
                className="mb-2"
                style={{ fontSize: '22px', color: '#fafafa', fontWeight: 500, letterSpacing: '-0.007px' }}
              >
                Link Tidak Valid
              </h2>
              <p style={{ color: '#898989', fontSize: '13px', letterSpacing: '-0.007px', marginBottom: '1.5rem' }}>{error}</p>
              <Link href="/" className="btn-secondary inline-flex items-center gap-2">
                Kembali ke Beranda
              </Link>
            </div>
          )}

          {!loading && info && (
            <div
              className="rounded-[16px] overflow-hidden"
              style={{ background: '#2e2e2e', border: '1px solid #393939' }}
            >
              {/* File Header */}
              <div
                className="p-6 text-center"
                style={{ background: '#242424', borderBottom: '1px solid #393939' }}
              >
                <div
                  className="w-16 h-16 rounded-[6px] flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#121212', border: '1px solid #393939' }}
                >
                  <FileTypeIcon mimeType={info.mimeType} size={32} />
                </div>
                <h1
                  className="mb-3 break-all leading-tight px-2"
                  style={{ fontSize: '18px', color: '#fafafa', fontWeight: 500, letterSpacing: '-0.007px' }}
                >
                  {info.fileName}
                </h1>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: '#242424', border: '1px solid #393939', color: '#898989', letterSpacing: '-0.007px' }}
                  >
                    {formatBytes(info.fileSize)}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: '#1f4b37', border: '1px solid rgba(62,207,142,0.20)', color: '#3ecf8e', letterSpacing: '-0.007px' }}
                  >
                    {info.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                </div>
              </div>

              {/* File Info */}
              <div className="px-6 py-4 space-y-3" style={{ borderBottom: '1px solid #393939' }}>
                <div className="flex items-center justify-between">
                  <span className="label flex items-center gap-2" style={{ margin: 0 }}>
                    <Download size={11} /> Total Diunduh
                  </span>
                  <span style={{ color: '#b4b4b4', fontSize: '13px', letterSpacing: '-0.007px' }}>{info.downloadCount.toLocaleString('id-ID')}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="label flex items-center gap-2" style={{ margin: 0 }}>
                    <Clock size={11} /> Dibagikan pada
                  </span>
                  <span style={{ color: '#b4b4b4', fontSize: '13px', letterSpacing: '-0.007px' }}>{fmtDate(info.createdAt)}</span>
                </div>
                {info.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="label flex items-center gap-2" style={{ margin: 0 }}>
                      <Clock size={11} /> Kadaluarsa
                    </span>
                    <span style={{ color: '#898989', fontSize: '13px', letterSpacing: '-0.007px' }}>{fmtDate(info.expiresAt)}</span>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <div className="p-6">
                <button
                  onClick={handleDownload}
                  disabled={downloading || downloaded}
                  className="w-full py-2.5 rounded-[6px] font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-300"
                  style={
                    downloaded
                      ? { background: '#1f4b37', border: '1px solid rgba(62,207,142,0.20)', color: '#3ecf8e', cursor: 'default', letterSpacing: '-0.007px' }
                      : downloading
                      ? { background: '#242424', border: '1px solid #393939', color: '#898989', cursor: 'wait', letterSpacing: '-0.007px' }
                      : { background: '#006239', border: '1px solid rgba(62,207,142,0.30)', color: '#fafafa', letterSpacing: '-0.007px' }
                  }
                  onMouseEnter={e => { if (!downloading && !downloaded) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(62,207,142,0.50)' } }}
                  onMouseLeave={e => { if (!downloading && !downloaded) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(62,207,142,0.30)' } }}
                >
                  {downloaded ? (
                    <><CheckCircle2 size={16} /> Download Dimulai!</>
                  ) : downloading ? (
                    <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#393939', borderTopColor: '#898989' }} /> Menyiapkan Download...</>
                  ) : (
                    <><Download size={16} /> Download File ({formatBytes(info.fileSize)})</>
                  )}
                </button>

                <p className="text-center mt-3" style={{ fontSize: '11px', color: '#898989', letterSpacing: '-0.007px' }}>
                  File ini dibagikan via TeleDrive — Cloud storage berbasis Telegram
                </p>
              </div>
            </div>
          )}

          {/* Branding Footer */}
          <div className="text-center mt-6">
            <p style={{ fontSize: '12px', color: '#898989', letterSpacing: '-0.007px' }}>
              Ingin menyimpan file kamu sendiri?{' '}
              <Link
                href="/login?tab=register"
                className="transition-colors"
                style={{ color: '#3ecf8e' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#00c573' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3ecf8e' }}
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
