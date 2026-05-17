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
      fetch('/api/auth/profile').then(r => r.json()).then(d => {
        if (d.createdAt) setCreatedAt(new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
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
  const strengthColor = ['', '#4d4d4d', '#b4b4b4', '#3ecf8e']

  return (
    <div
      onClick={(e) => { if (e.currentTarget === e.target) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.60)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease-out',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-slide-up"
        style={{
          background: '#2e2e2e',
          borderTop: '1px solid #393939',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '90dvh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, background: '#393939', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 12px', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#242424', border: '1px solid #393939',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 500, color: '#3ecf8e', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: '#fafafa', fontSize: '14px', letterSpacing: '-0.007px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontSize: '12px', color: '#898989', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#898989', padding: 6, display: 'flex', borderRadius: 6, flexShrink: 0,
              transition: 'color 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', padding: '0 20px', gap: 4, borderBottom: '1px solid #393939' }}>
          {([
            { id: 'profile', icon: User, label: 'Profil' },
            { id: 'security', icon: Lock, label: 'Keamanan' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPwError(''); setPwSuccess('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 12px', background: 'none', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? '#3ecf8e' : 'transparent'}`,
                color: tab === t.id ? '#3ecf8e' : '#898989',
                cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.id ? 500 : 400,
                letterSpacing: '-0.007px',
                transition: 'all 150ms', marginBottom: -1,
              }}
              onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
              onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <div>
              <div style={{ background: '#242424', border: '1px solid #393939', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                <InfoRow label="Nama" value={name} />
                <InfoRow label="Email" value={email} border />
                <InfoRow label="Penyimpanan" value="Tidak terbatas via Telegram" border />
                <InfoRow label="Akun dibuat" value={createdAt ?? 'Memuat...'} border />
              </div>

              <div style={{
                background: '#1f4b37', border: '1px solid rgba(62,207,142,0.20)',
                borderRadius: 6, padding: '12px 14px', marginBottom: 16,
              }}>
                <p style={{ fontSize: '13px', color: '#3ecf8e', margin: 0, lineHeight: 1.5, letterSpacing: '-0.007px' }}>
                  ☁️ TeleDrive menyimpan file kamu di Telegram secara gratis. Tidak ada batasan storage selama akun Telegram kamu aktif.
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="btn-danger"
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              >
                <LogOut size={13} /> Keluar dari Akun
              </button>
            </div>
          )}

          {/* ── Security Tab ── */}
          {tab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <p style={{ fontSize: '13px', color: '#898989', marginBottom: 18, lineHeight: 1.5, letterSpacing: '-0.007px' }}>
                Ganti password akun TeleDrive kamu. Pastikan password baru minimal 6 karakter.
              </p>

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
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#898989', display: 'flex',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

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
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#898989', display: 'flex',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {newPw.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 999,
                        background: strength >= i ? strengthColor[strength] : '#393939',
                        transition: 'background 200ms',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: strengthColor[strength], fontWeight: 500 }}>
                    Kekuatan: {strengthLabel[strength]}
                  </span>
                </div>
              )}

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
                  <p style={{ fontSize: '12px', color: '#898989', marginTop: 6, letterSpacing: '-0.007px' }}>Password tidak cocok</p>
                )}
              </div>

              {pwError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#2e2e2e', border: '1px solid #393939',
                  borderRadius: 6, padding: '10px 12px', marginBottom: 14,
                }}>
                  <AlertCircle size={13} color="#898989" />
                  <span style={{ fontSize: '13px', color: '#898989', letterSpacing: '-0.007px' }}>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#1f4b37', border: '1px solid rgba(62,207,142,0.20)',
                  borderRadius: 6, padding: '10px 12px', marginBottom: 14,
                }}>
                  <CheckCircle2 size={13} color="#3ecf8e" />
                  <span style={{ fontSize: '13px', color: '#3ecf8e', letterSpacing: '-0.007px' }}>{pwSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                disabled={pwLoading || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
              >
                {pwLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={13} />}
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
      display: 'flex', alignItems: 'center', padding: '10px 14px',
      borderTop: border ? '1px solid #393939' : 'none',
    }}>
      <span className="label" style={{ margin: 0, width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#b4b4b4', fontWeight: 400, letterSpacing: '-0.007px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}
