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

const colors = {
  success: { border: 'rgba(34,197,94,0.2)', text: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  error:   { border: 'rgba(239,68,68,0.2)',  text: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  info:    { border: 'rgba(99,102,241,0.2)', text: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
  warning: { border: 'rgba(245,158,11,0.2)', text: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
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
    setToasts(p => [...p.slice(-4), { id, message, type }]) // max 5 toasts
    timerRef.current[id] = setTimeout(() => dismiss(id), 1200)
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
          const c = colors[t.type]
          return (
            <div
              key={t.id}
              className="animate-slide-in-r"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: '#111',
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                maxWidth: 360,
                pointerEvents: 'all',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Icon size={16} color={c.text} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', color: '#ededed', lineHeight: 1.4 }}>
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  marginLeft: 4, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#555', flexShrink: 0,
                  display: 'flex', alignItems: 'center', padding: 2,
                  borderRadius: 4,
                }}
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
