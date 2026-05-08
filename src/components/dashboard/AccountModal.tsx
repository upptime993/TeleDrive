'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { X, User, Lock, LogOut, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface AccountModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'profile' | 'security'

export function AccountModal({ open, onClose }: AccountModalProps) {
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  useEffect(() => {
    if (open && !createdAt) {
      fetch("/api/auth/profile").then(r => r.json()).then(d => {
        if (d.createdAt) setCreatedAt(new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }))
      }).catch(() => {})
    }
  }, [open])
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>('profile')

  // Security form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  if (!open) return null

  const initials = session?.user?.name?.[0]?.toUpperCase() ?? '?'
  const email = session?.user?.email ?? '—'
  const name = session?.user?.name ?? '—'

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (newPw.length < 6) { setPwError('Password baru minimal 6 karakter'); return }
    if (newPw !== confirmPw) { setPwError('Konfirmasi password tidak cocok'); return }
    setPwLoading(true)
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const d = await r.json()
      if (r.ok) {
        setPwSuccess('Password berhasil diubah!')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else {
        setPwError(d.error ?? 'Gagal mengubah password')
      }
    } catch {
      setPwError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setPwLoading(false)
    }
  }

  const strength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e']

  return (
    <div
      onClick={(e) => { if (e.currentTarget === e.target) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
        animation: 'fadeIn 0.15s ease-out',
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Sheet-style modal — slides up from bottom on mobile, centered on desktop */}
      <div
        className="animate-slide-up"
        style={{
          background: '#111', border: '1px solid #1e1e1e',
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '90dvh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, background: '#2a2a2a', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 12px', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#ededed', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#555', padding: 4, display: 'flex', borderRadius: 6, flexShrink: 0,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', padding: '0 20px', gap: 4, borderBottom: '1px solid #1a1a1a' }}>
          {([
            { id: 'profile', icon: User, label: 'Profil' },
            { id: 'security', icon: Lock, label: 'Keamanan' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPwError(''); setPwSuccess('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px', background: 'none', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`,
                color: tab === t.id ? '#818cf8' : '#555',
                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
                transition: 'all 150ms', marginBottom: -1,
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <div>
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <InfoRow label="Nama" value={name} />
                <InfoRow label="Email" value={email} border />
                <InfoRow label="Penyimpanan" value="Tidak terbatas via Telegram" border />
                <InfoRow label="Akun dibuat" value={createdAt ?? 'Memuat...'} border />
              </div>

              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              }}>
                <p style={{ fontSize: '0.8rem', color: '#818cf8', margin: 0, lineHeight: 1.6 }}>
                  ☁️ TeleDrive menyimpan file kamu di Telegram secara gratis. Tidak ada batasan storage selama akun Telegram kamu aktif.
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="btn btn-danger"
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              >
                <LogOut size={14} /> Keluar dari Akun
              </button>
            </div>
          )}

          {/* ── Security Tab ── */}
          {tab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: 18, lineHeight: 1.6 }}>
                Ganti password akun TeleDrive kamu. Pastikan password baru minimal 6 karakter.
              </p>

              {/* Current password */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Password Saat Ini</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className="input"
                    placeholder="Masukkan password lama"
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex',
                    }}
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div style={{ marginBottom: 6 }}>
                <label className="label">Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="input"
                    placeholder="Min. 6 karakter"
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex',
                    }}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Strength bar */}
              {newPw.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 999,
                        background: strength >= i ? strengthColor[strength] : '#1a1a1a',
                        transition: 'background 200ms',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strengthColor[strength] }}>
                    Kekuatan: {strengthLabel[strength]}
                  </span>
                </div>
              )}

              {/* Confirm password */}
              <div style={{ marginBottom: 18 }}>
                <label className="label">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className="input"
                  placeholder="Ulangi password baru"
                  required
                />
                {confirmPw && newPw !== confirmPw && (
                  <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Password tidak cocok</p>
                )}
              </div>

              {/* Feedback */}
              {pwError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                }}>
                  <AlertCircle size={13} color="#ef4444" />
                  <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                }}>
                  <CheckCircle2 size={13} color="#22c55e" />
                  <span style={{ fontSize: '0.78rem', color: '#22c55e' }}>{pwSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                disabled={pwLoading || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
              >
                {pwLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={14} />}
                {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      borderTop: border ? '1px solid #1a1a1a' : 'none',
    }}>
      <span style={{ fontSize: '0.78rem', color: '#555', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', color: '#ccc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}
