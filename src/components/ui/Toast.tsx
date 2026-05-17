'use client'

import { useCallback, createContext, useContext, useRef, useState } from 'react'
import { X, CheckCircle2 as CheckIcon, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const icons = {
  success: CheckIcon,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id))
    clearTimeout(timerRef.current[id])
    delete timerRef.current[id]
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p.slice(-4), { id, message, type }])
    timerRef.current[id] = setTimeout(() => dismiss(id), 3000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 8,
          alignItems: 'flex-end', pointerEvents: 'none',
        }}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map(t => {
          const Icon = icons[t.type]
          return (
            <div
              key={t.id}
              className="animate-slide-in-r"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                background: '#121317',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                boxShadow: 'none',
                maxWidth: 360,
                pointerEvents: 'all',
              }}
            >
              <Icon size={16} color="#acafb9" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#e2e3e9', lineHeight: 1.43, letterSpacing: '-0.013px' }}>
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  marginLeft: 4, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#5e616e', flexShrink: 0,
                  display: 'flex', alignItems: 'center', padding: 2,
                  borderRadius: 4, transition: 'color 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5e616e' }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
