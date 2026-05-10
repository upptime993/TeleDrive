'use client'

import { useSession, signOut } from 'next-auth/react'
import {
  Cloud, Folder, Wifi, WifiOff, LogOut, RefreshCw, HardDrive, Star, Clock, Users, Activity, X,
  Image as ImageIcon, Film, FileText, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

export type NavItem = 'My Drive' | 'Recent' | 'Starred' | 'Shared with me' | 'Foto' | 'Video' | 'Document' | 'Tempat Sampah';

interface SidebarProps {
  workerStatus: 'online' | 'offline' | 'checking'
  onRefreshWorker: () => void
  isOpen: boolean
  onClose: () => void
  activeNav: NavItem
  onNavChange: (nav: NavItem) => void
  files: { size: number }[] // Pass files to calculate real-time storage
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

  // Hanya kalkulasi ulang saat files berubah (bukan setiap render)
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
    <div className="w-64 flex-shrink-0 bg-[#060a16] border-r border-slate-800/60 flex flex-col h-full text-slate-300">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
            <Cloud size={20} className="text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-white tracking-tight">TeleDrive</div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cloud Storage</div>
          </div>
        </Link>
        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="px-4 flex-1 overflow-y-auto space-y-1">
        {navItems.map(item => {
          const isActive = activeNav === item.label
          return (
            <button
              key={item.label}
              onClick={() => { onNavChange(item.label); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all relative ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
              {item.label}
              {isActive && (
                <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-800/60 space-y-4">
        {/* Storage Indicator */}
        <div className="px-3 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <HardDrive size={14} className="text-cyan-500" />
              <span>Storage</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400">PRO</span>
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between items-center mt-1">
            <span><span className="text-slate-300 font-medium">{totalUsedFormatted}</span> dipakai</span>
            <span className="text-slate-500">{fileCount} file · Unlimited</span>
          </div>
        </div>

        {/* Worker Status */}
        <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
          isOnline 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : isChecking
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={14} /> : isChecking ? <Activity size={14} className="animate-pulse" /> : <WifiOff size={14} />}
            <span>{isOnline ? 'Network Online' : isChecking ? 'Connecting...' : 'Network Offline'}</span>
          </div>
          <button 
            onClick={onRefreshWorker}
            className="p-1 rounded-md hover:bg-black/20 transition-colors"
            title="Refresh connection"
          >
            <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-colors group cursor-pointer border border-transparent hover:border-slate-800/80">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-cyan-400 border border-slate-700 shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
              {session?.user?.name ?? 'Loading...'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {session?.user?.email ?? ''}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); signOut({ callbackUrl: '/login' }); }}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
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
