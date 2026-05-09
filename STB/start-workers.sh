#!/bin/sh
# start-workers.sh — Multi-Worker TeleDrive STB
#
# Menjalankan 2 worker (default) atau 3 worker (jika SESSION_C diset)
# dan otomatis update WORKER_URL, WORKER_URL_2, WORKER_URL_3 di Vercel.
#
# Jalankan: sh /root/teledrive-worker/start-workers.sh
#
# PENTING: Pastikan setiap worker menggunakan SESSION yang BERBEDA.
# Gunakan: node gen-session.mjs  untuk generate session baru.

# ─── EDIT BAGIAN INI ──────────────────────────────────────────
# Set env vars ini di shell sebelum menjalankan script ini, contoh:
#   export VERCEL_TOKEN="vcp_xxx..."
#   export VERCEL_PROJECT_ID="prj_xxx..."
#   sh start-workers.sh
#
# Atau hardcode langsung di sini (tidak di-commit ke git):
VERCEL_TOKEN="${VERCEL_TOKEN:-GANTI_DENGAN_VERCEL_TOKEN_KAMU}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-GANTI_DENGAN_VERCEL_PROJECT_ID_KAMU}"
WORKER_DIR="/root/teledrive-worker"
# ──────────────────────────────────────────────────────────────

log() { echo "[$(date '+%H:%M:%S')] $1"; }

# Deteksi jumlah worker berdasarkan SESSION_C
if [ -n "$SESSION_C" ]; then
  NUM_WORKERS=3
  PORTS="3000 3001 3002"
  log "Mode: 3 Worker (SESSION_A + SESSION_B + SESSION_C)"
else
  NUM_WORKERS=2
  PORTS="3000 3001"
  log "Mode: 2 Worker (SESSION_A + SESSION_B)"
fi

# ── 1. Stop worker dan tunnel lama ────────────────────────────
log "Stop worker dan tunnel lama..."
pm2 delete worker-1 worker-2 worker-3 2>/dev/null || true
pkill -f "cloudflared tunnel --url" 2>/dev/null || true
sleep 2

# ── 2. Start worker via PM2 ──────────────────────────────────
log "Start ${NUM_WORKERS} worker via PM2..."
cd "$WORKER_DIR"
pm2 start ecosystem.config.cjs
sleep 6
pm2 list

# ── 3. Start Cloudflare Quick Tunnels ────────────────────────
log "Start Cloudflare Quick Tunnels..."
mkdir -p /tmp/cf-tunnels

for PORT in $PORTS; do
  LOG_FILE="/tmp/cf-tunnels/tunnel-${PORT}.log"
  rm -f "$LOG_FILE"
  cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate > "$LOG_FILE" 2>&1 &
  log "  Tunnel port ${PORT} PID=$!"
done

log "Menunggu URL tunnel (30 detik)..."
sleep 20

# Tunggu ekstra jika URL belum muncul
for PORT in $PORTS; do
  URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cf-tunnels/tunnel-${PORT}.log | head -1)
  if [ -z "$URL" ]; then
    log "  Tunnel port ${PORT} belum siap, tunggu 12 detik lagi..."
    sleep 12
  fi
done

# ── 4. Ekstrak URL ────────────────────────────────────────────
URL1=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cf-tunnels/tunnel-3000.log | head -1)
URL2=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cf-tunnels/tunnel-3001.log | head -1)
if [ "$NUM_WORKERS" = "3" ]; then
  URL3=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cf-tunnels/tunnel-3002.log | head -1)
fi

log "URL yang didapat:"
log "  WORKER_URL   = ${URL1:-GAGAL}"
log "  WORKER_URL_2 = ${URL2:-GAGAL}"
if [ "$NUM_WORKERS" = "3" ]; then
  log "  WORKER_URL_3 = ${URL3:-GAGAL}"
fi

if [ -z "$URL1" ] || [ -z "$URL2" ]; then
  log "ERROR: URL tidak didapat! Cek koneksi internet."
  exit 1
fi

if [ "$NUM_WORKERS" = "3" ] && [ -z "$URL3" ]; then
  log "WARNING: WORKER_URL_3 tidak didapat! Worker ke-3 tidak akan digunakan."
fi

# ── 5. Update env var di Vercel ──────────────────────────────
log "Update env vars di Vercel..."

upsert_env() {
  KEY="$1"
  VAL="$2"

  # Ambil semua env vars dan cari ID untuk KEY ini
  ENV_DATA=$(curl -s \
    "https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}")

  # Parse ID — cari pasangan id+key yang cocok
  ENV_ID=$(echo "$ENV_DATA" | \
    grep -o "\"id\":\"[^\"]*\"[^}]*\"key\":\"${KEY}\"" | \
    grep -o '"id":"[^"]*"' | \
    head -1 | cut -d'"' -f4)

  if [ -n "$ENV_ID" ]; then
    # Env var ada → PATCH (update nilai)
    RESULT=$(curl -s -X PATCH \
      "https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${ENV_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"value\":\"${VAL}\"}")
    echo "$RESULT" | grep -q '"id"' \
      && log "  OK UPDATED $KEY" \
      || log "  GAGAL PATCH $KEY: $RESULT"
  else
    # Env var belum ada → POST (buat baru)
    RESULT=$(curl -s -X POST \
      "https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"key\":\"${KEY}\",\"value\":\"${VAL}\",\"type\":\"plain\",\"target\":[\"production\",\"preview\"]}")
    echo "$RESULT" | grep -q '"id"' \
      && log "  OK CREATED $KEY" \
      || log "  GAGAL POST $KEY: $RESULT"
  fi
}

upsert_env "WORKER_URL"   "$URL1"
upsert_env "WORKER_URL_2" "$URL2"
if [ "$NUM_WORKERS" = "3" ] && [ -n "$URL3" ]; then
  upsert_env "WORKER_URL_3" "$URL3"
fi

# ── 6. Simpan URL ke file ─────────────────────────────────────
{
  printf "=== Worker URLs %s ===\n" "$(date)"
  printf "WORKER_URL   = %s\n" "$URL1"
  printf "WORKER_URL_2 = %s\n" "$URL2"
  if [ "$NUM_WORKERS" = "3" ]; then
    printf "WORKER_URL_3 = %s\n" "${URL3:-TIDAK_TERSEDIA}"
  fi
} > /root/worker-urls.txt
cat /root/worker-urls.txt

# ── 7. Restart cloudflared & wa-bot ──────────────────────────
log "Restart cloudflared dan wa-bot..."
pm2 start cloudflared 2>/dev/null || true
pm2 start cloudflared-2 2>/dev/null || true
pm2 start wa-bot 2>/dev/null || true
pm2 save

log "========================================================"
log "SELESAI! ${NUM_WORKERS} worker aktif."
log "URL tersimpan di /root/worker-urls.txt"
log ""
log "LANGKAH SELANJUTNYA:"
log "  Buka Vercel dashboard → Deployments → Redeploy"
log "  (cukup 1x, berikutnya otomatis pakai URL baru)"
log ""
log "UNTUK 3 WORKER:"
log "  1. Generate session baru: node gen-session.mjs"
log "  2. Set SESSION_C di .env"
log "  3. Aktifkan worker-3 di ecosystem.config.cjs"
log "  4. Jalankan ulang script ini"
log "========================================================"
