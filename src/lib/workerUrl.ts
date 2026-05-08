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
