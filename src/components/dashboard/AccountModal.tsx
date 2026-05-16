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
  const strengthColor = ['', '#cc348d', '#ffc700', '#58cc02']

  return (
    <div
      onClick={(e) => { if (e.currentTarget === e.target) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
        animation: 'fadeIn 0.15s ease-out',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-slide-up"
        style={{
          background: '#ffffff',
          borderTop: '2px solid #e5e5e5',
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '90dvh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.12)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, background: '#e5e5e5', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 12px', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#d7ffb8', border: '2px solid #58cc02',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, color: '#58cc02', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#3c3c3c', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#afafaf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#afafaf', padding: 6, display: 'flex', borderRadius: 10, flexShrink: 0,
              transition: 'color 150ms, background 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#cc348d'; (e.currentTarget as HTMLButtonElement).style.background = '#fff0f5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#afafaf'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', padding: '0 20px', gap: 4, borderBottom: '2px solid #e5e5e5' }}>
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
                borderBottom: `4px solid ${tab === t.id ? '#58cc02' : 'transparent'}`,
                color: tab === t.id ? '#58cc02' : '#afafaf',
                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                transition: 'all 150ms', marginBottom: -2,
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <div>
              <div style={{ background: '#f7f7f7', border: '2px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <InfoRow label="Nama" value={name} />
                <InfoRow label="Email" value={email} border />
                <InfoRow label="Penyimpanan" value="Tidak terbatas via Telegram" border />
                <InfoRow label="Akun dibuat" value={createdAt ?? 'Memuat...'} border />
              </div>

              <div style={{
                background: '#f7fff0', border: '2px solid #d7ffb8',
                borderRadius: 12, padding: '12px 14px', marginBottom: 16,
              }}>
                <p style={{ fontSize: '0.8rem', color: '#58cc02', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
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
              <p style={{ fontSize: '0.8rem', color: '#777777', marginBottom: 18, lineHeight: 1.6 }}>
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
                      background: 'none', border: 'none', cursor: 'pointer', color: '#afafaf', display: 'flex',
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
                      background: 'none', border: 'none', cursor: 'pointer', color: '#afafaf', display: 'flex',
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
                        flex: 1, height: 4, borderRadius: 999,
                        background: strength >= i ? strengthColor[strength] : '#e5e5e5',
                        transition: 'background 200ms',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strengthColor[strength], fontWeight: 700 }}>
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
                  <p style={{ fontSize: '0.72rem', color: '#cc348d', marginTop: 4, fontWeight: 600 }}>Password tidak cocok</p>
                )}
              </div>

              {/* Feedback */}
              {pwError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff0f5', border: '2px solid #cc348d',
                  borderRadius: 12, padding: '10px 12px', marginBottom: 14,
                }}>
                  <AlertCircle size={13} color="#cc348d" />
                  <span style={{ fontSize: '0.78rem', color: '#cc348d', fontWeight: 600 }}>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f7fff0', border: '2px solid #58cc02',
                  borderRadius: 12, padding: '10px 12px', marginBottom: 14,
                }}>
                  <CheckCircle2 size={13} color="#3f8f01" />
                  <span style={{ fontSize: '0.78rem', color: '#3f8f01', fontWeight: 600 }}>{pwSuccess}</span>
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
      borderTop: border ? '2px solid #e5e5e5' : 'none',
    }}>
      <span style={{ fontSize: '0.78rem', color: '#afafaf', fontWeight: 700, width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', color: '#3c3c3c', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}
