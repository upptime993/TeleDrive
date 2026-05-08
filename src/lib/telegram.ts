/**
 * telegram.ts — Helper untuk operasi Telegram via Worker
 *
 * Semua komunikasi ke Telegram dilakukan melalui worker-index.js
 * menggunakan HTTP request ke endpoint /delete
 */

export interface IChunk {
  part: number
  msgId: number
  size: number
}

export interface IFileForTelegram {
  isChunked: boolean
  telegramMsgId?: number | null
  chunks?: IChunk[]
}

/**
 * Kumpulkan semua Telegram message IDs dari satu file
 * (support chunked dan non-chunked)
 */
export function collectMsgIds(file: IFileForTelegram): number[] {
  if (file.isChunked && Array.isArray(file.chunks) && file.chunks.length > 0) {
    return file.chunks
      .map((c: IChunk) => c.msgId)
      .filter((id): id is number => typeof id === 'number' && !isNaN(id))
  }
  if (file.telegramMsgId && typeof file.telegramMsgId === 'number') {
    return [file.telegramMsgId]
  }
  return []
}

/**
 * Hapus pesan dari Telegram via worker /delete endpoint.
 * Menggunakan await agar penghapusan benar-benar selesai sebelum
 * function serverless terminate.
 *
 * Catatan: Menggunakan WORKER_URL (primary), bukan load-balanced,
 * karena operasi delete tidak perlu distribusi.
 */
export async function deleteTelegramMessages(msgIds: number[]): Promise<void> {
  if (!msgIds || msgIds.length === 0) return

  const validIds = msgIds.filter((id) => typeof id === 'number' && !isNaN(id) && id > 0)
  if (validIds.length === 0) return

  const workerUrl = process.env.WORKER_URL?.replace(/\/$/, '')
  const secret = process.env.WORKER_SECRET

  if (!workerUrl) {
    console.error(
      '[telegram] WORKER_URL tidak diset — pesan Telegram tidak dihapus! msgIds:',
      validIds
    )
    return
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['x-worker-secret'] = secret

  try {
    const res = await fetch(`${workerUrl}/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ msgIds: validIds }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown error')
      console.error(
        `[telegram] Worker gagal hapus ${validIds.length} pesan. Status: ${res.status}. Error: ${errText}`
      )
    } else {
      console.log(`[telegram] ${validIds.length} pesan Telegram berhasil dihapus`)
    }
  } catch (err) {
    console.error('[telegram] Gagal memanggil worker /delete:', err)
  }
}
