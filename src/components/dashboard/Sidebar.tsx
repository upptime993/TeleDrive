'use client'

import { useSession, signOut } from 'next-auth/react'
import {
  Cloud, Folder, Wifi, WifiOff, LogOut, RefreshCw, HardDrive, Star, Clock, Users, Activity, X,
  Image as ImageIcon, Film, FileText, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'

export type NavItem = 'My Drive' | 'Recent' | 'Starred' | 'Shared with me' | 'Foto' | 'Video' | 'Document' | 'Tempat Sampah';

interface SidebarProps {
  workerStatus: 'online' | 'offline' | 'checking'
  onRefreshWorker: () => void
  isOpen: boolean
  onClose: () => void
  activeNav: NavItem
  onNavChange: (nav: NavItem) => void
  files: { size: number }[]
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function Sidebar({ workerStatus, onRefreshWorker, isOpen, onClose, activeNav, onNavChange, files }: SidebarProps) {
  const { data: session } = useSession()

  const isOnline = workerStatus === 'online'
  const isChecking = workerStatus === 'checking'

  const { totalUsedFormatted, fileCount } = useMemo(() => {
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0)
    return { totalUsedFormatted: formatBytes(totalBytes), fileCount: files.length }
  }, [files])

  const navItems: { icon: any, label: NavItem }[] = [
    { icon: Folder, label: 'My Drive' },
    { icon: ImageIcon, label: 'Foto' },
    { icon: Film, label: 'Video' },
    { icon: FileText, label: 'Document' },
    { icon: Clock, label: 'Recent' },
    { icon: Star, label: 'Starred' },
    { icon: Users, label: 'Shared with me' },
    { icon: Trash2, label: 'Tempat Sampah' },
  ]

  const SidebarContent = (
    <div
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{ background: '#2e2e2e', borderRight: '1px solid #393939' }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
            style={{ background: '#006239', border: '1px solid rgba(62,207,142,0.3)' }}
          >
            <Cloud size={16} color="#fafafa" />
          </div>
          <div>
            <div style={{ color: '#fafafa', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.007px' }}>
              TeleDrive
            </div>
            <div style={{ fontSize: '10px', fontWeight: 500, color: '#898989', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cloud Storage
            </div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-[6px] transition-colors"
          style={{ color: '#898989' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.background = '#242424' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 overflow-y-auto space-y-0.5">
        {navItems.map(item => {
          const isActive = activeNav === item.label
          return (
            <button
              key={item.label}
              onClick={() => { onNavChange(item.label); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm transition-all"
              style={{
                background: isActive ? '#242424' : 'transparent',
                color: isActive ? '#fafafa' : '#b4b4b4',
                fontWeight: isActive ? 500 : 400,
                letterSpacing: '-0.007px',
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#242424'; (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#b4b4b4' } }}
            >
              <item.icon size={15} style={{ color: isActive ? '#3ecf8e' : '#898989', flexShrink: 0 }} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid #393939' }}>
        {/* Storage Indicator */}
        <div
          className="px-3 py-3 rounded-[6px]"
          style={{ background: '#242424', border: '1px solid #393939' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2" style={{ fontSize: '12px', fontWeight: 500, color: '#898989' }}>
              <HardDrive size={12} />
              <span className="label" style={{ margin: 0 }}>Storage</span>
            </div>
            <span
              style={{
                fontSize: '10px', fontWeight: 500, padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(62,207,142,0.10)',
                color: '#3ecf8e',
              }}
            >
              PRO
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#898989', display: 'flex', justifyContent: 'space-between' }}>
            <span><span style={{ color: '#fafafa', fontWeight: 500 }}>{totalUsedFormatted}</span> dipakai</span>
            <span style={{ fontSize: '11px' }}>{fileCount} file · Unlimited</span>
          </div>
        </div>

        {/* Worker Status */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-[6px] text-xs transition-colors"
          style={
            isOnline
              ? { background: '#1f4b37', border: '1px solid rgba(62,207,142,0.30)', color: '#3ecf8e' }
              : isChecking
              ? { background: '#242424', border: '1px solid #393939', color: '#898989' }
              : { background: '#242424', border: '1px solid #393939', color: '#898989' }
          }
        >
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={12} /> : isChecking ? <Activity size={12} className="animate-pulse" /> : <WifiOff size={12} />}
            <span style={{ fontWeight: 500, letterSpacing: '-0.007px' }}>
              {isOnline ? 'Network Online' : isChecking ? 'Connecting...' : 'Network Offline'}
            </span>
          </div>
          <button
            onClick={onRefreshWorker}
            className="p-1 rounded transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            title="Refresh connection"
          >
            <RefreshCw size={10} className={isChecking ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-[6px] transition-colors cursor-pointer"
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#242424' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
            style={{ background: '#242424', color: '#fafafa', border: '1px solid #393939', fontWeight: 500 }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ color: '#fafafa', fontWeight: 500, fontSize: '13px', letterSpacing: '-0.007px' }}>
              {session?.user?.name ?? 'Loading...'}
            </div>
            <div className="truncate" style={{ fontSize: '11px', color: '#898989' }}>
              {session?.user?.email ?? ''}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); signOut({ callbackUrl: '/login' }) }}
            className="p-1.5 rounded-[6px] transition-colors shrink-0"
            style={{ color: '#898989' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.background = '#242424' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.60)' }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 md:hidden"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
