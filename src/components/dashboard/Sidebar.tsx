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
      style={{ background: '#030304', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{ background: '#1c1d22', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Cloud size={18} color="#ffffff" />
          </div>
          <div>
            <div
              className="font-display"
              style={{ color: '#ffffff', fontSize: '16px', fontWeight: 500, letterSpacing: '0.01em' }}
            >
              TeleDrive
            </div>
            <div style={{ fontSize: '10px', fontWeight: 500, color: '#5e616e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cloud Storage
            </div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-[10px] transition-colors"
          style={{ color: '#5e616e' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.background = '#1c1d22' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5e616e'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <X size={18} />
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-all"
              style={{
                background: isActive ? '#1c1d22' : 'transparent',
                color: isActive ? '#ffffff' : '#777a88',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#121317'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#777a88' } }}
            >
              <item.icon size={16} style={{ color: isActive ? '#ffffff' : '#5e616e', flexShrink: 0 }} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Storage Indicator */}
        <div
          className="px-3 py-3 rounded-[10px]"
          style={{ background: '#121317', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2" style={{ fontSize: '12px', fontWeight: 500, color: '#acafb9' }}>
              <HardDrive size={13} />
              <span>Storage</span>
            </div>
            {/* PRO badge — golden gradient (one of 3 allowed uses) */}
            <span
              style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                borderRadius: 9999,
                background: 'linear-gradient(103deg, rgb(174,147,87), rgb(255,240,204) 40%, rgb(174,147,87) 70%)',
                color: '#08080a',
              }}
            >
              PRO
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#5e616e', display: 'flex', justifyContent: 'space-between' }}>
            <span><span style={{ color: '#ffffff', fontWeight: 500 }}>{totalUsedFormatted}</span> dipakai</span>
            <span>{fileCount} file · Unlimited</span>
          </div>
        </div>

        {/* Worker Status — monochrome, no green */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-[10px] text-xs transition-colors"
          style={
            isOnline
              ? { background: '#121317', border: '1px solid rgba(255,255,255,0.05)', color: '#acafb9' }
              : isChecking
              ? { background: '#121317', border: '1px solid rgba(255,255,255,0.05)', color: '#777a88' }
              : { background: '#1c1d22', border: '1px solid rgba(255,255,255,0.10)', color: '#777a88' }
          }
        >
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={13} /> : isChecking ? <Activity size={13} className="animate-pulse" /> : <WifiOff size={13} />}
            <span style={{ fontWeight: 500 }}>{isOnline ? 'Network Online' : isChecking ? 'Connecting...' : 'Network Offline'}</span>
          </div>
          <button
            onClick={onRefreshWorker}
            className="p-1 rounded-md transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            title="Refresh connection"
          >
            <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-[10px] transition-colors cursor-pointer"
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#121317' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0"
            style={{ background: '#1c1d22', color: '#ffffff', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate" style={{ color: '#ffffff', fontWeight: 500 }}>
              {session?.user?.name ?? 'Loading...'}
            </div>
            <div className="truncate" style={{ fontSize: '11px', color: '#5e616e' }}>
              {session?.user?.email ?? ''}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); signOut({ callbackUrl: '/login' }) }}
            className="p-1.5 rounded-[10px] transition-colors shrink-0"
            style={{ color: '#5e616e' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; (e.currentTarget as HTMLButtonElement).style.background = '#1c1d22' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5e616e'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title="Sign Out"
          >
            <LogOut size={15} />
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
              style={{ background: 'rgba(0,0,0,0.70)' }}
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
