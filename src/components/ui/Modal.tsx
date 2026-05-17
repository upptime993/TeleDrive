'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, maxWidth = 440 }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="animate-scale-in"
        style={{
          background: '#08080a',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10,
          padding: 24,
          width: '100%',
          maxWidth,
          boxShadow: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3
            id="modal-title"
            style={{
              fontSize: '16px', fontWeight: 600, color: '#ffffff',
              margin: 0, letterSpacing: '-0.025px',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#5e616e', padding: 6, borderRadius: 10,
              display: 'flex', alignItems: 'center',
              transition: 'color 150ms, background 150ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'
              ;(e.currentTarget as HTMLButtonElement).style.background = '#1c1d22'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#5e616e'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
            }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
