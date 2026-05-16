'use client'

import { useSession, signOut } from 'next-auth/react'
import {
  Cloud, Folder, Wifi, WifiOff, LogOut, RefreshCw, HardDrive, Star, Clock, Users, Activity, X,
  Image as ImageIcon, Film, FileText, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

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
    return {
      totalUsedFormatted: formatBytes(totalBytes),
      fileCount: files.length,
    }
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
    <div className="w-64 flex-shrink-0 flex flex-col h-full" style={{ background: '#ffffff', borderRight: '2px solid #e5e5e5' }}>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#58cc02' }}>
            <Cloud size={20} color="white" />
          </div>
          <div>
            <div className="font-heading" style={{ color: '#3c3c3c', fontSize: '1.1rem' }}>TeleDrive</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#afafaf', textTransform: 'uppercase', letterSpacing: '0.053em' }}>Cloud Storage</div>
          </div>
        </Link>
        <button onClick={onClose} className="md:hidden p-2 rounded-xl transition-colors" style={{ color: '#afafaf' }}>
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 overflow-y-auto space-y-1">
        {navItems.map(item => {
          const isActive = activeNav === item.label
          return (
            <button
              key={item.label}
              onClick={() => { onNavChange(item.label); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: isActive ? '#d7ffb8' : 'transparent',
                color: isActive ? '#58cc02' : '#777777',
                borderLeft: isActive ? '4px solid #58cc02' : '4px solid transparent',
                paddingLeft: isActive ? '10px' : '12px',
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#f7f7f7'; (e.currentTarget as HTMLButtonElement).style.color = '#3c3c3c' } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#777777' } }}
            >
              <item.icon size={18} style={{ color: isActive ? '#58cc02' : '#afafaf', flexShrink: 0 }} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-3" style={{ borderTop: '2px solid #e5e5e5' }}>
        {/* Storage Indicator */}
        <div className="px-3 py-3 rounded-xl" style={{ background: '#f7fff0', border: '2px solid #d7ffb8' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#58cc02' }}>
              <HardDrive size={14} />
              <span>Storage</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: '#ffc700', color: '#3c3c3c' }}>PRO</span>
          </div>
          <div style={{ fontSize: '11px', color: '#777777', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span><span style={{ color: '#3c3c3c', fontWeight: 700 }}>{totalUsedFormatted}</span> dipakai</span>
            <span style={{ color: '#afafaf' }}>{fileCount} file · Unlimited</span>
          </div>
        </div>

        {/* Worker Status */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors"
          style={
            isOnline
              ? { background: '#d7ffb8', border: '2px solid #58cc02', color: '#3f8f01' }
              : isChecking
              ? { background: '#fff9e6', border: '2px solid #ffc700', color: '#b87d00' }
              : { background: '#fff0f5', border: '2px solid #cc348d', color: '#cc348d' }
          }
        >
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={14} /> : isChecking ? <Activity size={14} className="animate-pulse" /> : <WifiOff size={14} />}
            <span>{isOnline ? 'Network Online' : isChecking ? 'Connecting...' : 'Network Offline'}</span>
          </div>
          <button
            onClick={onRefreshWorker}
            className="p-1 rounded-md transition-colors"
            style={{ background: 'rgba(0,0,0,0.08)' }}
            title="Refresh connection"
          >
            <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer" style={{ border: '2px solid transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f7f7f7'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e5e5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: '#d7ffb8', color: '#58cc02', border: '2px solid #58cc02' }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: '#3c3c3c' }}>
              {session?.user?.name ?? 'Loading...'}
            </div>
            <div className="truncate" style={{ fontSize: '11px', color: '#afafaf' }}>
              {session?.user?.email ?? ''}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); signOut({ callbackUrl: '/login' }); }}
            className="p-1.5 rounded-xl transition-colors shrink-0"
            style={{ color: '#afafaf' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#cc348d'; (e.currentTarget as HTMLButtonElement).style.background = '#fff0f5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#afafaf'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title="Sign Out"
          >
            <LogOut size={16} />
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
              style={{ background: 'rgba(0,0,0,0.4)' }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 md:hidden shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
