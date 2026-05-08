import { getWorkerUrl } from '@/lib/workerUrl'

// ─── Helper: delete message(s) from Telegram via worker ───────
export async function deleteTelegramMessages(msgIds: number[]): Promise<void> {
  if (!msgIds.length) return
  const workerUrl = getWorkerUrl()
  if (!workerUrl) {
    console.warn('[files] Worker URL tidak tersedia — file Telegram tidak dihapus')
    return
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.WORKER_SECRET) {
      headers['x-worker-secret'] = process.env.WORKER_SECRET
    }
    const res = await fetch(`${workerUrl}/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ msgIds }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error(`[files] Worker delete gagal: ${res.status} ${txt}`)
    }
  } catch (err) {
    console.error('[files] deleteTelegramMessages error:', err)
  }
}

// ─── Collect all Telegram msgIds from a file document ─────────
export function collectMsgIds(file: any): number[] {
  const ids: number[] = []
  if (file.telegramMsgId) ids.push(file.telegramMsgId)
  if (Array.isArray(file.chunks)) {
    for (const c of file.chunks) {
      if (c.msgId) ids.push(c.msgId)
    }
  }
  return ids
}
