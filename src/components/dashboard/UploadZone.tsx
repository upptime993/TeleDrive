'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const CHUNK_SIZE = 4 * 1024 * 1024

interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  speed: string
  error?: string
}

interface UploadZoneProps {
  folderId: string | null
  workerUrls?: string[] | null
  workerUrl?: string | null
  onUploadComplete: () => void
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`
  if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`
  return `${bytesPerSec} B/s`
}

async function uploadFileChunked(
  file: File,
  folderId: string | null,
  workerUrl: string | null,
  onProgress: (pct: number, speed: string) => void,
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const chunks: { part: number; msgId: number; size: number }[] = []
  let uploadedBytes = 0
  const t0 = Date.now()
  const maxConcurrent = 3
  let currentChunk = 0
  const workerEndpoint = workerUrl ? `${workerUrl}/upload-chunk` : '/api/upload-chunk'

  const uploadNext = async (): Promise<void> => {
    if (currentChunk >= totalChunks) return
    const i = currentChunk++
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const blob = file.slice(start, end)
    const fd = new FormData()
    fd.append('chunk', blob, file.name)
    fd.append('part', String(i))
    fd.append('totalParts', String(totalChunks))
    fd.append('fileName', file.name)
    let res: Response
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await fetch(workerEndpoint, { method: 'POST', body: fd })
        if (res.ok) break
      } catch (e) {
        if (attempt === 2) throw new Error(`Chunk ${i} gagal setelah 3 percobaan`)
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
      }
    }
    if (!res!.ok) {
      const err = await res!.json().catch(() => ({ error: 'STB error' }))
      throw new Error(err.error || `Chunk ${i} gagal`)
    }
    const data = await res!.json()
    chunks.push({ part: i, msgId: data.msgId, size: blob.size })
    uploadedBytes += blob.size
    const elapsed = (Date.now() - t0) / 1000
    const speed = formatSpeed(uploadedBytes / elapsed)
    const pct = Math.round((uploadedBytes / file.size) * 95)
    onProgress(pct, speed)
    return uploadNext()
  }

  const workers = []
  for (let w = 0; w < maxConcurrent; w++) workers.push(uploadNext())
  await Promise.all(workers)

  const saveRes = await fetch('/api/upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type || 'application/octet-stream', folderId, chunks }),
  })
  if (!saveRes.ok) {
    const err = await saveRes.json().catch(() => ({ error: 'Gagal simpan metadata' }))
    throw new Error(err.error)
  }
  onProgress(100, '')
}

export default function UploadZone({ folderId, workerUrls, workerUrl, onUploadComplete }: UploadZoneProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const effectiveWorkerUrls: string[] = workerUrls ?? (workerUrl ? [workerUrl] : [])

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems(p => p.map(it => it.id === id ? { ...it, ...patch } : it))
  }, [])

  const startUpload = useCallback(async (files: File[]) => {
    const newItems: UploadItem[] = files.map(f => ({
      id: Math.random().toString(36).slice(2), file: f, status: 'pending', progress: 0, speed: '',
    }))
    setItems(p => [...p, ...newItems])
    for (const item of newItems) {
      update(item.id, { status: 'uploading' })
      try {
        await uploadFileChunked(
          item.file, folderId,
          effectiveWorkerUrls.length > 0 ? effectiveWorkerUrls[0] : null,
          (pct, speed) => update(item.id, { progress: pct, speed }),
        )
        update(item.id, { status: 'done', progress: 100, speed: '' })
        toast(`${item.file.name} berhasil diupload`, 'success')
        onUploadComplete()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload gagal'
        update(item.id, { status: 'error', error: msg })
        toast(`${item.file.name}: ${msg}`, 'error')
      }
    }
  }, [folderId, onUploadComplete, toast, update, effectiveWorkerUrls])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    startUpload(Array.from(files))
  }

  const activeItems = items.filter(i => i.status !== 'done')

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        style={{
          border: `2px dashed ${dragging ? 'rgba(62,207,142,0.40)' : '#393939'}`,
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(31,75,55,0.20)' : 'transparent',
          transition: 'all 200ms',
        }}
        role="button"
        aria-label="Klik atau drag file untuk upload"
      >
        <Upload size={22} color={dragging ? '#3ecf8e' : '#898989'} style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#898989', fontSize: '14px', margin: 0, letterSpacing: '-0.007px' }}>
          <span style={{ color: '#3ecf8e', fontWeight: 500 }}>Klik untuk pilih file</span>
          {' '}atau drag & drop di sini
        </p>
        <p style={{ color: '#898989', fontSize: '12px', marginTop: 6, letterSpacing: '-0.007px' }}>
          Semua format didukung — file besar otomatis dipecah per chunk
        </p>
      </div>
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

      {/* Upload progress list */}
      {activeItems.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activeItems.map(item => (
            <div
              key={item.id}
              style={{
                background: '#121212',
                border: `1px solid ${item.status === 'error' ? '#393939' : '#393939'}`,
                borderRadius: 6,
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.status === 'uploading' && (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #393939', borderTopColor: '#3ecf8e', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                )}
                {item.status === 'error' && <AlertCircle size={13} color="#898989" style={{ flexShrink: 0 }} />}
                <span style={{ flex: 1, fontSize: '13px', color: '#b4b4b4', letterSpacing: '-0.007px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.file.name}
                </span>
                <span style={{ fontSize: '12px', color: '#898989', flexShrink: 0 }}>
                  {item.status === 'uploading' && item.speed ? item.speed : item.status === 'error' ? 'Error' : ''}
                </span>
                <button
                  onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#898989', padding: 2, display: 'flex', borderRadius: 4, transition: 'color 150ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
                >
                  <X size={12} />
                </button>
              </div>
              {item.status === 'uploading' && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 2, background: '#393939', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${item.progress}%`, background: '#3ecf8e', borderRadius: 999, transition: 'width 300ms ease' }} />
                  </div>
                </div>
              )}
              {item.status === 'error' && (
                <p style={{ fontSize: '12px', color: '#898989', margin: '6px 0 0', letterSpacing: '-0.007px' }}>{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
