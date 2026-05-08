'use client'

import {
  useCallback, useRef, useState, useEffect,
  createContext, useContext, ReactNode,
} from 'react'
import { X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const CHUNK_SIZE = 4 * 1024 * 1024   // 4 MB per chunk
const MAX_RETRIES = 3
const CONCURRENT_UPLOADS = 4         // chunk paralel PER worker (4 x 2 worker = 8 paralel total)

export interface UploadItem {
  id: string
  file: File
  folderId: string | null
  status: 'pending' | 'uploading' | 'done' | 'error' | 'cancelled'
  progress: number
  speed: string
  error?: string
  abortController?: AbortController
  startTime?: number
  timeTaken?: string
}

interface UploadContextValue {
  items: UploadItem[]
  startUpload: (files: File[], folderId: string | null, workerUrls?: string[] | null) => void
  cancelItem: (id: string) => void
  removeItem: (id: string) => void
  clearDone: () => void
  activeCount: number
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used inside UploadProvider')
  return ctx
}

function formatSpeed(b: number): string {
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB/s`
  if (b > 1024) return `${(b / 1024).toFixed(0)} KB/s`
  return `${b} B/s`
}

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

// ─── Upload chunk dengan retry ────────────────────────────────
async function uploadChunkWithRetry(
  file: File, i: number, totalChunks: number, signal: AbortSignal,
  workerIdx: number,
): Promise<{ part: number; msgId: number; size: number }> {
  const start = i * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, file.size)
  const blob = file.slice(start, end)
  let res: Response | null = null
  let lastError = ''
  const fd = new FormData()
  fd.append('chunk', blob, file.name)
  fd.append('part', String(i))
  fd.append('totalParts', String(totalChunks))
  fd.append('fileName', file.name)
  fd.append('workerIdx', String(workerIdx))
  const endpoint = '/api/upload-chunk'

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal.aborted) throw new Error('CANCELLED')
    try {
      res = await fetch(endpoint, { method: 'POST', body: fd, signal })
      if (res.ok) break
      lastError = `HTTP ${res.status}`
      res = null
      if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    } catch (e: unknown) {
      if (signal.aborted) throw new Error('CANCELLED')
      lastError = e instanceof Error ? e.message : 'Network error'
      if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  if (!res || !res.ok) {
    let errMsg = lastError || 'Upload gagal'
    if (res) { try { const d = await res.json(); errMsg = d.error || errMsg } catch {} }
    throw new Error(`Chunk ${i + 1}/${totalChunks} gagal: ${errMsg}`)
  }

  const data = await res.json()
  return { part: i, msgId: data.msgId, size: blob.size }
}

/**
 * Resolve endpoint untuk chunk ke-i.
 *
 * Strategi: Round-robin merata ke semua worker yang online.
 *   workerUrls = [w1, w2, w3, w4]
 *   chunk 0 → w1, chunk 1 → w2, chunk 2 → w3, chunk 3 → w4
 *   chunk 4 → w1, chunk 5 → w2, dst...
 *
 * Jika 0 worker → fallback ke Vercel proxy /api/upload-chunk.
 */
function resolveWorkerIdxForChunk(
  chunkIdx: number,
  workerUrls: string[],
): number {
  if (workerUrls.length === 0) return 0
  return chunkIdx % workerUrls.length
}
// ─── Upload file dengan multi-worker pool ─────────────────────
async function uploadFileChunked(
  file: File,
  folderId: string | null,
  onProgress: (pct: number, speed: string) => void,
  signal: AbortSignal,
  workerUrls: string[],  // array of worker URLs (1–4)
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const results: { part: number; msgId: number; size: number }[] = new Array(totalChunks)
  let uploadedBytes = 0
  let nextChunk = 0

  // Log distribusi worker saat mulai
  if (workerUrls.length >= 2) {
    const dist = workerUrls.map((url, i) => {
      const chunks: number[] = []
      for (let c = i; c < totalChunks; c += workerUrls.length) chunks.push(c)
      return `  Worker ${i + 1} (${url}): chunk ${chunks.slice(0,5).join(',')}${chunks.length > 5 ? '...' : ''}`
    }).join('\n')
    console.log(`[multi-worker] File: ${file.name} | ${totalChunks} chunks | ${workerUrls.length} workers\n${dist}`)
  }

  const speedSamples: { bytes: number; time: number }[] = []
  function calcSpeed(newBytes: number): string {
    const now = Date.now()
    speedSamples.push({ bytes: newBytes, time: now })
    const cutoff = now - 5000
    while (speedSamples.length > 1 && speedSamples[0].time < cutoff) speedSamples.shift()
    const windowBytes = speedSamples.reduce((s, x) => s + x.bytes, 0)
    const windowSec = Math.max((now - speedSamples[0].time) / 1000, 0.1)
    return formatSpeed(windowBytes / windowSec)
  }

  const pool = new Set<Promise<void>>()

  function launchOne(chunkIdx: number) {
    const workerIdx = resolveWorkerIdxForChunk(chunkIdx, workerUrls)
    let p: Promise<void>
    p = uploadChunkWithRetry(file, chunkIdx, totalChunks, signal, workerIdx)
      .then(result => {
        results[result.part] = result
        uploadedBytes += result.size
        const speed = calcSpeed(result.size)
        onProgress(Math.min(95, Math.round((uploadedBytes / file.size) * 95)), speed)
        pool.delete(p!)
        if (nextChunk < totalChunks && !signal.aborted) {
          launchOne(nextChunk++)
        }
      })
    pool.add(p)
  }

  if (signal.aborted) throw new Error('CANCELLED')

  // Seed pool — CONCURRENT_UPLOADS per worker (capped to totalChunks)
  const seed = Math.min(CONCURRENT_UPLOADS * Math.max(workerUrls.length, 1), totalChunks)
  for (let i = 0; i < seed; i++) launchOne(nextChunk++)

  while (pool.size > 0) {
    if (signal.aborted) throw new Error('CANCELLED')
    await Promise.race(Array.from(pool))
  }

  if (signal.aborted) throw new Error('CANCELLED')

  const filteredResults = results.filter(Boolean)
  if (filteredResults.length !== totalChunks) {
    const missing: number[] = []
    for (let i = 0; i < totalChunks; i++) {
      if (!results[i]) missing.push(i)
    }
    throw new Error(`Upload tidak lengkap. Chunk ${missing.join(', ')} hilang. Coba upload ulang.`)
  }

  const saveRes = await fetch('/api/upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name, fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      folderId, chunks: filteredResults,
    }),
    signal,
  })

  if (!saveRes.ok) {
    const err = await saveRes.json().catch(() => ({ error: 'Gagal simpan metadata' }))
    throw new Error(err.error || 'Gagal simpan metadata')
  }

  onProgress(100, '')
}

// ─── Provider ─────────────────────────────────────────────────
export function UploadProvider({ children, onUploadComplete }: { children: ReactNode; onUploadComplete?: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<UploadItem[]>([])
  const onCompleteRef = useRef(onUploadComplete)
  useEffect(() => { onCompleteRef.current = onUploadComplete }, [onUploadComplete])

  // FIX #8: Track mounted state untuk mencegah setState setelah unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // FIX #6: Auto-fetch workerUrls dari API jika prop tidak disediakan
  const [autoWorkerUrls, setAutoWorkerUrls] = useState<string[]>([])
  useEffect(() => {
    fetch('/api/worker-url')
      .then(r => r.json())
      .then(d => {
        if (!mountedRef.current) return
        // Support format baru (urls array) maupun lama (url string)
        if (Array.isArray(d.urls) && d.urls.length > 0) {
          setAutoWorkerUrls(d.urls)
          if (d.urls.length >= 2) {
            console.log(`[UploadManager] Dual-worker aktif: ${d.urls.join(' | ')}`)
          }
        } else if (d.url) {
          setAutoWorkerUrls([d.url])
        }
      })
      .catch(() => {})
  }, [])

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems(p => p.map(it => it.id === id ? { ...it, ...patch } : it))
  }, [])

  const cancelItem = useCallback((id: string) => {
    setItems(p => p.map(it => {
      if (it.id === id) { it.abortController?.abort(); return { ...it, status: 'cancelled' as const } }
      return it
    }))
    // FIX #8: Cek mountedRef sebelum setState di setTimeout
    setTimeout(() => {
      if (mountedRef.current) {
        setItems(p => p.filter(i => i.id !== id))
      }
    }, 600)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(p => p.filter(i => i.id !== id))
  }, [])

  const clearDone = useCallback(() => {
    setItems(p => p.filter(i => i.status !== 'done' && i.status !== 'error' && i.status !== 'cancelled'))
  }, [])

  // FIX #3: Upload semua file secara PARALEL, bukan sequential
  const startUpload = useCallback(async (files: File[], folderId: string | null, workerUrls?: string[] | null) => {
    const newItems: UploadItem[] = files.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f, folderId, status: 'pending', progress: 0, speed: '',
      abortController: new AbortController(),
    }))

    setItems(p => [...p, ...newItems])

    // Gunakan workerUrls dari prop, atau fallback ke auto-detected URLs
    const effectiveWorkerUrls = (workerUrls && workerUrls.length > 0) ? workerUrls : autoWorkerUrls

    await Promise.all(newItems.map(async (item) => {
      const uploadStartTime = Date.now()
      update(item.id, { status: 'uploading', startTime: uploadStartTime })
      try {
        await uploadFileChunked(
          item.file, item.folderId,
          (pct, speed) => update(item.id, { progress: pct, speed }),
          item.abortController!.signal,
          effectiveWorkerUrls,
        )
        
        const durationSec = Math.max(1, Math.round((Date.now() - uploadStartTime) / 1000))
        const timeTaken = durationSec < 60 ? `${durationSec}s` : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
        
        update(item.id, { status: 'done', progress: 100, speed: '', timeTaken })
        onCompleteRef.current?.()
        toast(`"${item.file.name}" berhasil diupload!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload gagal'
        if (msg === 'CANCELLED') {
          update(item.id, { status: 'cancelled' })
        } else {
          update(item.id, { status: 'error', error: msg })
          toast(`Gagal upload "${item.file.name}"`, 'error')
        }
      }
    }))
  }, [update, toast, autoWorkerUrls])

  const activeCount = items.filter(i => i.status === 'uploading').length

  return (
    <UploadContext.Provider value={{ items, startUpload, cancelItem, removeItem, clearDone, activeCount }}>
      {children}
      <UploadManagerPanel />
    </UploadContext.Provider>
  )
}

// ─── Circle Progress Indicator ────────────────────────────────
// Mode 1: direction='down' → standalone circle untuk desktop header
// Mode 2: onPlusClick prop → FAB mobile, circle melingkari tombol Plus
export function UploadCircleIndicator({
  direction = 'up',
  onPlusClick,
  plusActive,
}: {
  direction?: 'up' | 'down'
  onPlusClick?: () => void
  plusActive?: boolean
}) {
  const { items, activeCount } = useUpload()
  const [expanded, setExpanded] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null)

  const isFabMode = typeof onPlusClick === 'function'

  const totalItems = items.length
  const errorCount = items.filter(i => i.status === 'error').length
  const overallPct = totalItems > 0
    ? Math.round(items.reduce((s, i) => s + i.progress, 0) / totalItems)
    : 0

  const handleToggle = useCallback(() => {
    if (isFabMode && !totalItems) {
      // Tidak ada upload — klik tombol plus biasa
      onPlusClick?.()
      return
    }
    if (!expanded && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top: direction === 'down' ? rect.bottom + 10 : rect.top - 10,
        right: window.innerWidth - rect.right,
      })
    }
    setExpanded(e => !e)
  }, [expanded, direction, isFabMode, totalItems, onPlusClick])

  // FAB mode tanpa upload aktif → render tombol Plus biasa
  if (isFabMode && !totalItems) {
    return (
      <button
        onClick={onPlusClick}
        className={`relative z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(6,182,212,0.4)] transition-all duration-300 ${plusActive ? 'bg-slate-800 text-white rotate-45 shadow-none' : 'bg-cyan-500 text-slate-900 hover:scale-105 active:scale-95'}`}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    )
  }

  // Desktop mode tanpa upload → tidak render apa-apa
  if (!isFabMode && !totalItems) return null

  const r = isFabMode ? 30 : 22
  const btnSize = isFabMode ? 72 : 56
  const cx = btnSize / 2
  const circ = 2 * Math.PI * r
  const dash = (overallPct / 100) * circ
  const strokeColor = errorCount > 0 && activeCount === 0 ? '#ef4444'
    : activeCount === 0 ? '#22c55e' : '#6366f1'

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title={activeCount > 0 ? `Upload ${overallPct}%` : 'Upload selesai'}
        style={{
          position: 'relative',
          width: btnSize, height: btnSize,
          borderRadius: '50%',
          background: isFabMode
            ? (plusActive ? '#1e293b' : '#06b6d4')
            : '#0d0d0d',
          border: isFabMode ? 'none' : '1px solid #222',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isFabMode
            ? '0 4px 20px rgba(6,182,212,0.4)'
            : '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'all 300ms',
          transform: isFabMode && plusActive ? 'rotate(45deg)' : 'none',
        }}
      >
        {/* SVG circle progress */}
        <svg
          width={btnSize} height={btnSize}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={isFabMode ? 'rgba(0,0,0,0.2)' : '#1a1a1a'} strokeWidth={isFabMode ? 4 : 3.5} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={isFabMode ? 'rgba(255,255,255,0.9)' : strokeColor} strokeWidth={isFabMode ? 4 : 3.5}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 400ms ease, stroke 300ms' }}
          />
        </svg>

        {/* Isi tombol */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFabMode ? (
            // FAB mode: tampilkan icon Plus atau % saat uploading
            activeCount > 0 ? (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{overallPct}%</span>
            ) : errorCount > 0 ? (
              <AlertCircle size={20} color="#fff" />
            ) : (
              <CheckCircle2 size={20} color="#fff" />
            )
          ) : (
            // Desktop mode: icon kecil
            activeCount > 0 ? (
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#6366f1' }}>{overallPct}%</span>
            ) : errorCount > 0 ? (
              <AlertCircle size={16} color="#ef4444" />
            ) : (
              <CheckCircle2 size={16} color="#22c55e" />
            )
          )}
        </div>
      </button>

      {expanded && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 498 }}
            onClick={() => setExpanded(false)}
          />
          <div style={{
            position: 'fixed',
            ...(direction === 'down' && panelPos
              ? { top: panelPos.top, right: panelPos.right }
              : panelPos
              ? { bottom: window.innerHeight - panelPos.top + 10, right: panelPos.right }
              : { bottom: 90, right: 24 }
            ),
            width: 290, maxWidth: 'calc(100vw - 32px)',
            background: '#111', border: '1px solid #222',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            animation: 'slideUp 0.2s ease-out',
            zIndex: 499,
          }}>
            <UploadPanelContent onClose={() => setExpanded(false)} />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Standalone fixed panel (fallback) ───────────────────────
function UploadManagerPanel() {
  return null
}

// ─── Panel Content ────────────────────────────────────────────
// FIX #5: Terima prop onClose untuk menutup popup dari dalam
function UploadPanelContent({ onClose }: { onClose?: () => void }) {
  const { items, cancelItem, removeItem, clearDone, activeCount } = useUpload()
  const [minimized, setMinimized] = useState(false)

  const totalItems = items.length
  const doneCount = items.filter(i => i.status === 'done').length
  const errorCount = items.filter(i => i.status === 'error').length
  const overallPct = totalItems > 0
    ? Math.round(items.reduce((s, i) => s + i.progress, 0) / totalItems)
    : 0

  // FIX #5: Tutup popup otomatis jika semua item sudah dibersihkan
  useEffect(() => {
    if (totalItems === 0 && onClose) onClose()
  }, [totalItems, onClose])

  if (!totalItems) return (
    <div style={{ padding: '16px', textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>
      Tidak ada upload aktif
    </div>
  )

  return (
    <>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: '#0d0d0d', borderBottom: minimized ? 'none' : '1px solid #1a1a1a',
          cursor: 'pointer',
        }}
        onClick={() => setMinimized(m => !m)}
      >
        {activeCount > 0 ? (
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        ) : errorCount > 0 ? (
          <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
        ) : (
          <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ededed' }}>
            {activeCount > 0 ? `Mengupload... ${overallPct}%` : `Selesai (${doneCount}/${totalItems})`}
          </div>
          {activeCount > 0 && (
            <div style={{ height: 2, background: '#1a1a1a', borderRadius: 999, marginTop: 3 }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: '#6366f1', borderRadius: 999, transition: 'width 300ms' }} />
            </div>
          )}
        </div>
        {/* FIX #4: stopPropagation agar klik tombol minimize tidak bubble ke parent div */}
        <button
          onClick={e => { e.stopPropagation(); setMinimized(m => !m) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2, display: 'flex' }}
        >
          {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {!minimized && (
        <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 8px' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: '#0d0d0d', border: `1px solid ${item.status === 'error' ? 'rgba(239,68,68,0.2)' : '#1a1a1a'}`,
              borderRadius: 8, padding: '7px 10px', marginBottom: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.status === 'uploading' && <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                {item.status === 'error' && <AlertCircle size={11} color="#ef4444" style={{ flexShrink: 0 }} />}
                {item.status === 'done' && <CheckCircle2 size={11} color="#22c55e" style={{ flexShrink: 0 }} />}
                {item.status === 'pending' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222', flexShrink: 0 }} />}
                {item.status === 'cancelled' && <Minus size={11} color="#555" style={{ flexShrink: 0 }} />}
                <span style={{ flex: 1, fontSize: '0.7rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.file.name}
                </span>
                <span style={{ fontSize: '0.63rem', color: '#555', flexShrink: 0 }}>
                  {item.status === 'uploading' && item.speed ? item.speed : item.status === 'pending' ? formatSize(item.file.size) : item.status === 'done' ? (item.timeTaken ? `✓ ${item.timeTaken}` : '✓') : ''}
                </span>
                {/* FIX #4: stopPropagation agar klik X tidak bubble ke header dan trigger toggle minimize */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (['uploading', 'pending'].includes(item.status)) {
                      cancelItem(item.id)
                    } else {
                      removeItem(item.id)
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 2, display: 'flex', flexShrink: 0 }}
                  title={['uploading', 'pending'].includes(item.status) ? 'Batalkan upload' : 'Hapus dari daftar'}
                >
                  <X size={10} />
                </button>
              </div>
              {item.status === 'uploading' && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ height: 2, background: '#1a1a1a', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${item.progress}%`, background: '#6366f1', borderRadius: 999, transition: 'width 250ms' }} />
                  </div>
                  <span style={{ fontSize: '0.58rem', color: '#555', display: 'block', marginTop: 2 }}>{item.progress}%</span>
                </div>
              )}
              {item.status === 'error' && item.error && (
                <p style={{ fontSize: '0.63rem', color: '#ef4444', margin: '4px 0 0', lineHeight: 1.4 }}>{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!minimized && (doneCount > 0 || errorCount > 0) && activeCount === 0 && (
        <div style={{ padding: '4px 8px 8px', borderTop: '1px solid #1a1a1a' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearDone()
            }}
            style={{ width: '100%', background: 'none', border: '1px solid #222', borderRadius: 8, padding: '6px', color: '#666', cursor: 'pointer', fontSize: '0.72rem' }}
          >
            Bersihkan semua
          </button>
        </div>
      )}
    </>
  )
}

// ─── Drop Zone UI ─────────────────────────────────────────────
interface UploadZoneProps {
  folderId: string | null
  onClose: () => void
  workerUrls?: string[] | null
}

export function UploadDropZone({ folderId, onClose, workerUrls }: UploadZoneProps) {
  const { startUpload, activeCount } = useUpload()
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    startUpload(Array.from(files), folderId, workerUrls)
    onClose()
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : '#2a2a2a'}`,
          borderRadius: 12, padding: '28px 16px', textAlign: 'center',
          cursor: 'pointer', background: dragging ? 'rgba(99,102,241,0.06)' : 'transparent',
          transition: 'all 200ms',
        }}
        role="button"
      >
        <Plus size={28} color={dragging ? '#6366f1' : '#444'} style={{ margin: '0 auto 10px' }} />
        <p style={{ color: '#888', fontSize: '0.8125rem', margin: 0 }}>
          <span style={{ color: '#818cf8', fontWeight: 500 }}>Klik untuk pilih file</span>{' '}atau drag & drop
        </p>
        <p style={{ color: '#444', fontSize: '0.7rem', marginTop: 6 }}>
          Upload di background · {CONCURRENT_UPLOADS} chunk paralel · {Math.round(CHUNK_SIZE / 1024 / 1024)}MB/chunk
        </p>
      </div>
      <input ref={inputRef} type="file" multiple accept="*/*" style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />
      {activeCount > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: 10, textAlign: 'center' }}>
          💡 Tutup dialog ini — upload tetap berjalan di background!
        </p>
      )}
    </div>
  )
}
