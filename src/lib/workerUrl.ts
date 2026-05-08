/**
 * workerUrl.ts — Multi-worker support (up to 4 workers)
 *
 * Env vars di Vercel:
 *   WORKER_URL   = https://stb:3000   (worker 1 — wajib)
 *   WORKER_URL_2 = https://stb:3001   (worker 2 — opsional)
 *   WORKER_URL_3 = https://stb:3002   (worker 3 — opsional)
 *   WORKER_URL_4 = https://stb:3003   (worker 4 — opsional)
 *
 * Jika hanya WORKER_URL yang di-set → semua chunk ke Worker 1 (backward-compatible).
 */

export function getWorkerUrl(): string | null {
  return process.env.WORKER_URL?.replace(/\/$/, '') || null
}

/**
 * Kembalikan semua worker URL yang tersedia (1–4).
 * Otomatis skip slot yang kosong di tengah.
 */
export function getAllWorkerUrls(): string[] {
  const keys = ['WORKER_URL', 'WORKER_URL_2', 'WORKER_URL_3', 'WORKER_URL_4']
  return keys
    .map(k => process.env[k]?.replace(/\/$/, '') || null)
    .filter((u): u is string => Boolean(u))
}

/**
 * Ping worker — kembalikan true jika /health merespons dalam 5 detik.
 */
export async function pingWorker(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Ping semua worker secara paralel, kembalikan hanya yang online.
 */
export async function getOnlineWorkerUrls(): Promise<string[]> {
  const all = getAllWorkerUrls()
  if (all.length === 0) return []
  const results = await Promise.all(
    all.map(async url => ({ url, ok: await pingWorker(url) }))
  )
  return results.filter(r => r.ok).map(r => r.url)
}

/**
 * Interface minimal untuk file doc yang dibutuhkan oleh buildWorkerDownloadUrl.
 * Dipakai di download/route.ts dan share/download/route.ts.
 */
export interface FileDownloadDoc {
  isChunked: boolean
  telegramMsgId?: number | null
  chunks?: Array<{ part: number; msgId: number }>
  name: string
  mimeType?: string | null
  size?: number
}

/**
 * Build URL untuk request download ke worker.
 * Menggabungkan logic chunked vs non-chunked agar tidak duplikasi di 2 route.
 * Kembalikan null jika data file tidak valid.
 */
export function buildWorkerDownloadUrl(
  workerUrl: string,
  file: FileDownloadDoc
): string | null {
  if (!file.isChunked && file.telegramMsgId) {
    const url = new URL(`${workerUrl}/download`)
    url.searchParams.set('msgId', file.telegramMsgId.toString())
    url.searchParams.set('fileName', file.name)
    url.searchParams.set('mimeType', file.mimeType || 'application/octet-stream')
    return url.toString()
  }
  if (file.isChunked && Array.isArray(file.chunks) && file.chunks.length > 0) {
    const sorted = [...file.chunks].sort((a, b) => a.part - b.part)
    const msgIds = sorted.map(c => c.msgId).join(',')
    const url = new URL(`${workerUrl}/download-chunked`)
    url.searchParams.set('msgIds', msgIds)
    url.searchParams.set('fileName', file.name)
    url.searchParams.set('mimeType', file.mimeType || 'application/octet-stream')
    if (file.size) url.searchParams.set('fileSize', file.size.toString())
    return url.toString()
  }
  return null
}
