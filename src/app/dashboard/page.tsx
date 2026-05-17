'use client'

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Grid3X3, List, FolderPlus, ChevronRight, Download, Upload,
  Pencil, Trash2, Folder as FolderIcon,
  FileText, FileImage, FileVideo, FileAudio, FileArchive, File as FileIconGeneric,
  Plus, CheckSquare, Square, User as UserIcon, Eye, Menu, Star, StarOff, MoveRight, X,
  Share2, Copy, Check, Link as LinkIcon, RefreshCw, ArrowUpDown, ChevronDown, ListChecks
} from 'lucide-react'
import Sidebar, { NavItem } from '@/components/dashboard/Sidebar'
import { UploadProvider, UploadDropZone, UploadCircleIndicator } from '@/components/dashboard/UploadManager'
import { FileViewer, canPreview } from '@/components/dashboard/FileViewer'
import { AccountModal } from '@/components/dashboard/AccountModal'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface FileItem {
  _id: string; name: string; size: number
  mimeType: string; folderId: string | null
  isChunked: boolean; createdAt: string; isStarred?: boolean
}
interface FolderItem {
  _id: string; name: string; parentId: string | null; createdAt: string
}

const fmt = (b: number) => {
  if (!b || b <= 0) return '0 B'
  const s = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${s[Math.min(i, s.length - 1)]}`
}
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

function FileIcon({ mimeType, size = 24 }: { mimeType: string; size?: number }) {
  const props = { size, strokeWidth: 1.5 }
  if (mimeType.startsWith('image/')) return <FileImage {...props} className="text-purple-400" />
  if (mimeType.startsWith('video/')) return <FileVideo {...props} className="text-pink-400" />
  if (mimeType.startsWith('audio/')) return <FileAudio {...props} className="text-emerald-400" />
  if (mimeType === 'application/pdf') return <FileText {...props} className="text-rose-400" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive {...props} className="text-amber-400" />
  return <FileIconGeneric {...props} className="text-[#b4b4b4]" />
}

function SkeletonRow() {
  return (
    <div className="flex items-center w-full p-4 border-b border-[#393939]">
      <div className="w-6 h-6 mr-4 rounded-[6px] bg-[#2e2e2e] animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[#2e2e2e] rounded-[6px] w-1/3 animate-pulse" />
      </div>
      <div className="hidden md:block w-24 h-4 bg-[#2e2e2e] rounded-[6px] mx-4 animate-pulse" />
      <div className="hidden md:block w-24 h-4 bg-[#2e2e2e] rounded-[6px] animate-pulse" />
    </div>
  )
}

// ─── Share Modal ──────────────────────────────────────────────
function ShareModal({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [downloadCount, setDownloadCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const { toast } = useToast()

  // Auto-generate on open
  useEffect(() => {
    setLoading(true)
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: file._id }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.url) {
          setShareUrl(d.url)
          if (typeof d.downloadCount === 'number') setDownloadCount(d.downloadCount)
        } else toast(d.error || 'Gagal membuat link', 'error')
      })
      .catch(() => toast('Gagal membuat share link', 'error'))
      .finally(() => setLoading(false))
  }, [file._id])

  const copyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast('Link disalin!', 'success')
    } catch {
      toast('Gagal menyalin link', 'error')
    }
  }

  const revokeLink = async () => {
    if (!shareUrl) return
    const token = shareUrl.split('/share/')[1]
    if (!token) return
    setRevoking(true)
    try {
      await fetch(`/api/share?token=${token}`, { method: 'DELETE' })
      setShareUrl(null)
      toast('Share link dicabut', 'success')
    } catch {
      toast('Gagal mencabut link', 'error')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 p-3 rounded-[6px] bg-[#2e2e2e] border border-[#393939]">
        <div className="w-10 h-10 rounded-[6px] bg-[#242424] flex items-center justify-center flex-shrink-0">
          <FileIcon mimeType={file.mimeType} size={20} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-[#fafafa] truncate text-sm">{file.name}</p>
          <p className="text-xs text-[#b4b4b4]">{fmt(file.size)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#393939] border-t-[#3ecf8e] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#b4b4b4]">Membuat share link...</p>
        </div>
      ) : shareUrl ? (
        <div className="space-y-3">
          <div>
            <label className="label">Link Publik</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-[#121212] border border-[#393939] rounded-[6px] px-3 py-2.5 flex items-center gap-2 min-w-0">
                <LinkIcon size={14} className="text-[#b4b4b4] flex-shrink-0" />
                <span className="text-xs text-[#b4b4b4] truncate font-mono">{shareUrl}</span>
              </div>
              <button
                onClick={copyLink}
                className={`p-2.5 rounded-[6px] border transition-all flex-shrink-0 ${copied ? 'bg-[#242424] border-[#393939] text-[#b4b4b4]' : 'bg-[#2e2e2e] border-[#393939] text-[#898989] hover:text-[#fafafa]'}`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-[6px] bg-[#1f4b37] border border-[#3ecf8e]/20">
            <p className="text-xs text-[#3ecf8e] leading-relaxed">
              ✓ Link ini bisa diakses siapa saja tanpa login.<br />
              ✓ File bisa langsung didownload dari halaman publik.
            </p>
            {downloadCount > 0 && (
              <p className="text-xs text-[#3ecf8e] mt-1">Sudah didownload {downloadCount}×</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="flex-1 btn btn-ghost border border-[#393939] hover:border-[#4d4d4d] hover:bg-[#242424] text-sm py-2"
            >
              Buka Link →
            </button>
            <button
              onClick={revokeLink}
              disabled={revoking}
              className="btn btn-danger text-sm py-2 px-4"
            >
              {revoking ? '...' : 'Cabut'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-[#b4b4b4] text-sm mb-4">Share link belum dibuat atau sudah dicabut</p>
          <button
            onClick={() => {
              setLoading(true)
              fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: file._id }),
              })
                .then(r => r.json())
                .then(d => { if (d.url) setShareUrl(d.url) })
                .finally(() => setLoading(false))
            }}
            className="btn btn-primary px-6"
          >
            Buat Link Baru
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Empty State yang kontekstual ────────────────────────────
function EmptyState({ nav, search, onUpload }: { nav: NavItem; search: string; onUpload: () => void }) {
  const messages: Record<string, { title: string; desc: string }> = {
    'My Drive': { title: 'Folder ini kosong', desc: 'Drag & drop file di sini, atau tekan Upload untuk memulai.' },
    'Recent': { title: 'Belum ada file baru', desc: 'File yang baru diupload akan muncul di sini.' },
    'Starred': { title: 'Belum ada file berbintang', desc: 'Bintangi file agar mudah ditemukan di sini.' },
    'Shared with me': { title: 'Tidak ada file yang dibagikan', desc: 'File yang dibagikan orang lain ke kamu akan muncul di sini.' },
    'Foto': { title: 'Belum ada foto', desc: 'File gambar yang kamu upload akan tampil di sini.' },
    'Video': { title: 'Belum ada video', desc: 'File video yang kamu upload akan tampil di sini.' },
    'Document': { title: 'Belum ada dokumen', desc: 'PDF, Word, dan file teks akan tampil di sini.' },
  }
  const { title, desc } = messages[nav] ?? messages['My Drive']

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center py-20"
    >
      <div className="w-24 h-24 mb-6 rounded-[16px] bg-[#2e2e2e] border border-[#393939] flex items-center justify-center">
        <FolderIcon size={40} className="text-[#393939]" />
      </div>
      <h3 className="text-[24px] font-medium text-[#fafafa] mb-2" style={{ letterSpacing: '-0.007px' }}>
        {search ? 'Pencarian tidak ditemukan' : title}
      </h3>
      <p className="text-[#898989] mb-8">
        {search ? `Tidak ada file yang cocok dengan "${search}"` : desc}
      </p>
      {!search && nav === 'My Drive' && (
        <button onClick={onUpload} className="btn btn-primary px-6 py-3 rounded-[6px] text-sm font-medium flex items-center gap-2">
          <Plus size={18} /> Upload file pertama kamu
        </button>
      )}
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeNav, setActiveNav] = useState<NavItem>('My Drive')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [allFolders, setAllFolders] = useState<FolderItem[]>([])
  const [allFiles, setAllFiles] = useState<FileItem[]>([]) // semua file untuk storage info
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'My Drive' }])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('grid')
  const [workerStatus, setWorkerStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [workerUrls, setWorkerUrls] = useState<string[]>([])

  const [showUpload, setShowUpload] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderItem | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null)
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderItem | null>(null)
  const [renameFolderVal, setRenameFolderVal] = useState('')

  const [viewerFile, setViewerFile] = useState<FileItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // -- New States for Optimization & UX --
  const [sortBy, setSortBy] = useState<'name'|'size'|'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem | null; folder: FolderItem | null } | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const dataCache = useRef<Record<string, { files: FileItem[], folders: FolderItem[] }>>({})

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  // Fetch semua file untuk storage info — hanya dipanggil sekali saat mount dan saat file baru diupload
  const fetchStorageInfo = useCallback(async () => {
    try {
      // Ambil hingga 1000 file untuk kalkulasi storage di Sidebar
      const r = await fetch('/api/files?folderId=all&limit=1000')
      const d = await r.json()
      setAllFiles(d.files ?? [])
    } catch {}
  }, [])

  useEffect(() => { if (status === 'authenticated') fetchStorageInfo() }, [status, fetchStorageInfo])

  const load = useCallback(async (background = false) => {
    const cacheKey = `${activeNav}-${currentFolder || 'root'}`
    
    if (!background) {
      if (dataCache.current[cacheKey]) {
        setFiles(dataCache.current[cacheKey].files)
        setFolders(dataCache.current[cacheKey].folders)
        // Lanjutkan fetch di background tanpa showing loading spinner
      } else {
        setLoading(true)
      }
    }

    try {
      let q = ''
      let pq = ''

      if (activeNav === 'Recent') {
        q = '?filter=recent'
      } else if (activeNav === 'Starred') {
        q = '?filter=starred'
      } else if (activeNav === 'Foto') {
        q = '?filter=foto'
      } else if (activeNav === 'Video') {
        q = '?filter=video'
      } else if (activeNav === 'Document') {
        q = '?filter=document'
      } else if (activeNav === 'Tempat Sampah') {
        q = '?filter=trash'
        pq = '?filter=trash'
      } else if (activeNav === 'Shared with me') {
        // Use dedicated share list endpoint
        const sr = await fetch('/api/share/list')
        const sd = await sr.json()
        setFiles(sd.files ?? [])
        setFolders([])
        dataCache.current[cacheKey] = { files: sd.files ?? [], folders: [] }
        setLoading(false)
        return
      } else {
        q = currentFolder ? `?folderId=${currentFolder}` : ''
        pq = currentFolder ? `?parentId=${currentFolder}` : ''
      }

      const [fr, dr] = await Promise.all([
        fetch(`/api/files${q}`),
        fetch(`/api/folders${pq}`)
      ])
      const [fd, dd] = await Promise.all([fr.json(), dr.json()])
      setFiles(fd.files ?? [])
      setFolders(dd.folders ?? [])
      dataCache.current[cacheKey] = { files: fd.files ?? [], folders: dd.folders ?? [] }

      if (activeNav === 'My Drive') {
        fetch('/api/folders?all=true').then(r => r.json()).then(d => setAllFolders(d.folders ?? []))
      }
    } catch {
      toast('Gagal memuat konten', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentFolder, activeNav, toast])

  useEffect(() => { if (status === 'authenticated') load() }, [status, load])

  const checkWorker = useCallback(async () => {
    setWorkerStatus('checking')
    try {
      const r = await fetch('/api/worker-url')
      const data = await r.json()
      // Pakai onlineUrls (sudah di-ping di server) — fallback ke urls jika field tidak ada
      const online: string[] = Array.isArray(data.onlineUrls) && data.onlineUrls.length > 0
        ? data.onlineUrls
        : Array.isArray(data.urls) && data.urls.length > 0
          ? data.urls
          : data.url ? [data.url] : []
      if (online.length === 0) { setWorkerStatus('offline'); setWorkerUrls([]); return }
      setWorkerStatus('online')
      setWorkerUrls(online)
      if (online.length > 1) console.log(`[dashboard] ${online.length} workers online`)
    } catch { setWorkerStatus('offline'); setWorkerUrls([]) }
  }, [])

  useEffect(() => { if (status === 'authenticated') checkWorker() }, [status, checkWorker])

  // -- Keyboard Shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        const allIds = new Set([...files.map(f => f._id), ...folders.map(f => f._id)])
        if (allIds.size > 0) {
          setSelectedIds(allIds)
          setSelectMode(true)
        }
      } else if (e.key === 'Delete' && selectedIds.size > 0) {
        setShowBulkDeleteModal(true)
      } else if (e.key === 'Escape') {
        setSelectMode(false)
        setSelectedIds(new Set())
        setContextMenu(null)
      } else if (e.key === 'F2' && selectedIds.size === 1) {
        const id = Array.from(selectedIds)[0]
        const file = files.find(f => f._id === id)
        const folder = folders.find(f => f._id === id)
        if (file) { setRenameTarget(file); setRenameVal(file.name) }
        else if (folder) { setRenameFolderTarget(folder); setRenameFolderVal(folder.name) }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [files, folders, selectedIds])

  const handleNavChange = (nav: NavItem) => {
    setActiveNav(nav)
    setCurrentFolder(null)
    setBreadcrumb([{ id: null, name: nav }])
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const openFolder = (f: FolderItem) => {
    if (activeNav !== 'My Drive') return
    setCurrentFolder(f._id)
    setBreadcrumb(p => [...p, { id: f._id, name: f.name }])
  }
  const navTo = (idx: number) => {
    if (activeNav !== 'My Drive') return
    const b = breadcrumb[idx]
    setCurrentFolder(b.id)
    setBreadcrumb(prev => prev.slice(0, idx + 1))
  }

  async function handleCreateFolder(e: FormEvent) {
    e.preventDefault()
    const name = newFolderName.trim()
    if (!name) return
    const r = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: currentFolder }),
    })
    if (r.ok) { toast(`Folder "${name}" dibuat`); setNewFolderName(''); setShowNewFolder(false); load() }
    else { const d = await r.json(); toast(d.error ?? 'Gagal membuat folder', 'error') }
  }

  function handleDeleteFolder(f: FolderItem) { setDeleteFolderTarget(f) }

  async function handleRenameFolderSubmit(e: FormEvent) {
    e.preventDefault()
    if (!renameFolderTarget) return
    const name = renameFolderVal.trim()
    if (!name) return
    const r = await fetch('/api/folders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: renameFolderTarget._id, name }),
    })
    if (r.ok) {
      toast(`Folder diganti nama menjadi "${name}"`, 'success')
      setRenameFolderTarget(null)
      load()
    } else {
      const d = await r.json()
      toast(d.error ?? 'Gagal mengganti nama folder', 'error')
    }
  }

  async function confirmDeleteFolder() {
    if (!deleteFolderTarget) return
    const isPermanent = activeNav === 'Tempat Sampah'
    const r = await fetch(`/api/folders?folderId=${deleteFolderTarget._id}${isPermanent ? '&permanent=true' : ''}`, { method: 'DELETE' })
    if (r.ok) { toast(`Folder "${deleteFolderTarget.name}" ${isPermanent ? 'dihapus permanen' : 'dipindahkan ke tempat sampah'}`, 'success'); setDeleteFolderTarget(null); load() }
    else { const d = await r.json(); toast(d.error || 'Gagal menghapus folder', 'error'); setDeleteFolderTarget(null) }
  }

  async function handleDeleteFile() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const isPermanent = activeNav === 'Tempat Sampah'
      const r = await fetch(`/api/files?fileId=${deleteTarget._id}${isPermanent ? '&permanent=true' : ''}`, { method: 'DELETE' })
      if (r.ok) { toast(`"${deleteTarget.name}" ${isPermanent ? 'dihapus permanen' : 'dipindahkan ke tempat sampah'}`, 'success'); setDeleteTarget(null); load() }
      else toast('Gagal menghapus file', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    if (!renameTarget) return
    const r = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: renameTarget._id, name: renameVal }),
    })
    if (r.ok) { toast('Nama file diubah', 'success'); setRenameTarget(null); load() }
    else toast('Gagal ganti nama', 'error')
  }

  async function toggleStar(f: FileItem) {
    const r = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: f._id, isStarred: !f.isStarred }),
    })
    if (r.ok) { toast(f.isStarred ? 'Dihapus dari berbintang' : 'Ditambahkan ke berbintang', 'success'); load() }
    else toast('Gagal update file', 'error')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredFiles.map(f => f._id)))
  }
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  function handleMoveSingleFile(f: FileItem) {
    setSelectedIds(new Set([f._id]))
    setShowMoveModal(true)
  }

  async function handleDownloadSelected() {
    if (selectedIds.size === 0) return
    setActionLoading(true)
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        const a = document.createElement('a')
        a.href = `/api/download?fileId=${id}`
        a.target = '_blank'
        a.click()
        await new Promise(r => setTimeout(r, 400))
      }
      toast(`${ids.length} file didownload`, 'success')
      exitSelectMode()
    } finally {
      setActionLoading(false)
    }
  }

  function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    setShowBulkDeleteModal(true)
  }

  async function performBulkDelete() {
    if (selectedIds.size === 0) return
    setShowBulkDeleteModal(false)
    setActionLoading(true)
    const isPermanent = activeNav === 'Tempat Sampah'
    try {
      const fileIds = Array.from(selectedIds).filter(id => files.some(f => f._id === id))
      const folderIds = Array.from(selectedIds).filter(id => folders.some(f => f._id === id))
      
      const promises = []
      if (fileIds.length > 0) {
        promises.push(fetch(`/api/files${isPermanent ? '?permanent=true' : ''}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileIds })
        }))
      }
      for (const fId of folderIds) {
        promises.push(fetch(`/api/folders?folderId=${fId}${isPermanent ? '&permanent=true' : ''}`, { method: 'DELETE' }))
      }
      
      await Promise.all(promises)
      toast(`${selectedIds.size} item ${isPermanent ? 'dihapus permanen' : 'dipindahkan ke tempat sampah'}`, 'success')
      load()
      exitSelectMode()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRestoreSelected() {
    if (selectedIds.size === 0) return
    setActionLoading(true)
    try {
      const fileIds = Array.from(selectedIds).filter(id => files.some(f => f._id === id))
      const folderIds = Array.from(selectedIds).filter(id => folders.some(f => f._id === id))
      
      const promises = []
      for (const id of fileIds) {
        promises.push(fetch('/api/files', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: id, isDeleted: false }) }))
      }
      for (const id of folderIds) {
        promises.push(fetch('/api/folders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId: id, isDeleted: false }) }))
      }
      
      await Promise.all(promises)
      toast(`${selectedIds.size} item dipulihkan`, 'success')
      load()
      exitSelectMode()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStarSelected() {
    if (selectedIds.size === 0) return
    setActionLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id =>
        fetch('/api/files', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: id, isStarred: true }),
        })
      ))
      toast(`${ids.length} file dibintangi`, 'success'); load(); exitSelectMode()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMoveSelected() {
    if (selectedIds.size === 0) return
    setActionLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id =>
        fetch('/api/files', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: id, folderId: moveTargetFolderId }),
        })
      ))
      toast(`${ids.length} file dipindahkan`, 'success'); setShowMoveModal(false); load(); exitSelectMode()
    } finally {
      setActionLoading(false)
    }
  }

  // --- Sorting Logic ---
  const sortedFiles = [...files].sort((a, b) => {
    let diff = 0
    if (sortBy === 'name') diff = a.name.localeCompare(b.name)
    else if (sortBy === 'size') diff = a.size - b.size
    else diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return sortOrder === 'asc' ? diff : -diff
  })
  
  const sortedFolders = [...folders].sort((a, b) => {
    let diff = 0
    if (sortBy === 'name') diff = a.name.localeCompare(b.name)
    else diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return sortOrder === 'asc' ? diff : -diff
  })

  const filteredFiles = sortedFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const filteredFolders = activeNav === 'My Drive' ? sortedFolders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : []
  const isEmpty = !loading && filteredFiles.length === 0 && filteredFolders.length === 0

  const containerAnimation = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const itemAnimation = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

  if (status === 'loading') return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-5">
      {/* Circle bar loading */}
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#393939" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="34" fill="none" stroke="#3ecf8e" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="60 154"
            style={{ animation: 'spin 1.2s linear infinite', transformOrigin: 'center' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-[6px] bg-[#006239] text-[#fafafa] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[#b4b4b4] text-sm font-medium">sabar yah lagi loading....</p>
        <p className="text-[#898989] text-xs mt-1">Memuat TeleDrive</p>
      </div>
      <style>{`@keyframes spin { to { stroke-dashoffset: -214; } }`}</style>
    </div>
  )

  return (
    <UploadProvider onUploadComplete={() => { load(); fetchStorageInfo() }}>
    <div className="flex h-screen bg-[#121212] overflow-hidden text-[#b4b4b4]">
      <Sidebar
        workerStatus={workerStatus}
        onRefreshWorker={checkWorker}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        files={allFiles}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[#2e2e2e] border-b border-[#393939] sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-[#898989] hover:text-[#fafafa]">
              <Menu size={20} />
            </button>
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-fade-right flex-1 min-w-0 pr-4">
              {breadcrumb.map((b, i) => (
                <div key={i} className="flex items-center shrink-0">
                  {i > 0 && <ChevronRight size={16} className="text-[#b4b4b4] mx-1" />}
                  <button
                    onClick={() => navTo(i)}
                    className={`px-2 py-1 rounded-[6px] text-sm transition-colors max-w-[150px] truncate ${
                      i === breadcrumb.length - 1
                        ? 'font-medium text-[#fafafa] bg-[#242424]'
                        : 'text-[#898989] hover:text-[#fafafa] hover:bg-[#242424]'
                    }`}
                    style={{ letterSpacing: '-0.007px' }}
                  >
                    {b.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden md:flex relative w-64 group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989] group-focus-within:text-[#fafafa] transition-colors" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari file..."
                className="w-full bg-[rgba(250,250,250,0.027)] border border-[#393939] rounded-[6px] py-2 pl-9 pr-4 text-sm text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-all"
              />
            </div>

            <div className="relative flex bg-[#242424] border border-[#393939] rounded-[6px] p-0.5 sm:mr-2">
              <button 
                onClick={() => setShowSortMenu(p => !p)}
                className="bg-transparent text-[#b4b4b4] px-2 py-1 focus:outline-none flex items-center gap-1 hover:text-[#fafafa] transition-colors"
                title="Urutkan File"
              >
                <ArrowUpDown size={16} />
                <span className="hidden sm:inline text-sm ml-1">Sort</span>
                <ChevronDown size={14} className="opacity-50" />
              </button>
              
              <AnimatePresence>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-36 bg-[#2e2e2e] border border-[#393939] rounded-[6px] z-50 overflow-hidden"
                    >
                      {['date', 'name', 'size'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt as any); setShowSortMenu(false) }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-[#242424] transition-colors ${sortBy === opt ? 'text-[#fafafa] bg-[#242424]' : 'text-[#b4b4b4]'}`}
                        >
                          {opt === 'date' ? 'Tanggal' : opt === 'name' ? 'Nama' : 'Ukuran'}
                        </button>
                      ))}
                      <div className="h-px bg-[#393939] my-1" />
                      <button
                        onClick={() => { setSortOrder('asc'); setShowSortMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#242424] transition-colors ${sortOrder === 'asc' ? 'text-[#fafafa] bg-[#242424]' : 'text-[#b4b4b4]'}`}
                      >
                        Menaik (↑)
                      </button>
                      <button
                        onClick={() => { setSortOrder('desc'); setShowSortMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#242424] transition-colors ${sortOrder === 'desc' ? 'text-[#fafafa] bg-[#242424]' : 'text-[#b4b4b4]'}`}
                      >
                        Menurun (↓)
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex bg-[#242424] border border-[#393939] rounded-[6px] p-0.5">
              {(['list', 'grid'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-1.5 rounded-[4px] transition-colors ${view === v ? 'bg-[#2e2e2e] text-[#fafafa]' : 'text-[#b4b4b4] hover:text-[#fafafa]'}`}
                  title={v === 'list' ? 'List View' : 'Grid View'}
                >
                  {v === 'list' ? <List size={16} /> : <Grid3X3 size={16} />}
                </button>
              ))}
            </div>

            {selectMode && filteredFiles.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-2 py-1.5 rounded-[6px] text-xs font-medium bg-[#242424] border border-[#393939] text-[#b4b4b4] hover:text-[#fafafa] transition-colors ml-1 flex items-center gap-1"
                title={selectedIds.size === filteredFiles.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              >
                <CheckSquare size={16} className="text-[#3ecf8e]" />
                <span className="hidden sm:inline">{selectedIds.size === filteredFiles.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
              </button>
            )}
            <button
              onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()) }}
              className={`p-2 rounded-full transition-colors ml-1 ${selectMode ? 'bg-[#1f4b37] text-[#3ecf8e] border border-[#3ecf8e]/30' : 'bg-[#242424] border border-[#393939] text-[#b4b4b4] hover:text-[#fafafa]'}`}
              title={selectMode ? 'Batal Pilih' : 'Pilih File'}
            >
              {selectMode ? <X size={16} /> : <ListChecks size={16} />}
            </button>

            {/* Upload indicator sudah ada di FAB pojok kanan bawah */}

            <button onClick={() => setShowAccount(true)} className="md:hidden p-2 rounded-[6px] bg-[#242424] border border-[#393939] text-[#b4b4b4] hover:text-[#fafafa]">
              <UserIcon size={16} />
            </button>
          </div>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden px-4 py-3 bg-[#2e2e2e] border-b border-[#393939] sticky top-16 z-30">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989] group-focus-within:text-[#fafafa]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari file..."
              className="w-full bg-[rgba(250,250,250,0.027)] border border-[#393939] rounded-[6px] py-2.5 pl-9 pr-4 text-sm text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e]"
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar pb-32">
          {/* Loading state circle bar */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="relative w-16 h-16">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" strokeWidth="4" stroke="#393939" />
                  <circle
                    cx="32" cy="32" r="26" fill="none" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="48 115"
                    stroke="#3ecf8e"
                    style={{ animation: 'dashSpin 1.2s linear infinite', transformOrigin: 'center' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-[6px] bg-[#006239] text-[#fafafa] flex items-center justify-center">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[#b4b4b4] text-sm font-medium">sabar yah lagi loading....</p>
                <p className="text-[#898989] text-xs mt-1">Memuat file kamu</p>
              </div>
              <style>{`@keyframes dashSpin { to { stroke-dashoffset: -163; } }`}</style>
            </div>
          )}

          {!loading && isEmpty && (
            <EmptyState nav={activeNav} search={search} onUpload={() => setShowUpload(true)} />
          )}

          {/* Folders */}
          {!loading && filteredFolders.length > 0 && (
            <section className="mb-10">
              <h4 className="text-xs font-medium text-[#898989] uppercase tracking-[-0.007px] mb-4 px-1">Folders</h4>
              <motion.div variants={containerAnimation} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredFolders.map(f => (
                  <motion.div key={f._id} variants={itemAnimation} className="group relative">
                    <button
                      onClick={() => openFolder(f)}
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file: null, folder: f }) }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(f._id) }}
                      onDragLeave={(e) => { e.preventDefault(); setDragOverFolderId(null) }}
                      onDrop={async (e) => {
                        e.preventDefault()
                        setDragOverFolderId(null)
                        const filesToMove = Array.from(selectedIds)
                        if (filesToMove.length > 0) {
                          setActionLoading(true)
                          try {
                            await Promise.all(filesToMove.map(id =>
                              fetch('/api/files', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ fileId: id, folderId: f._id }),
                              })
                            ))
                            toast(`${filesToMove.length} file dipindahkan`, 'success')
                            load(true)
                            exitSelectMode()
                          } finally { setActionLoading(false) }
                        }
                      }}
                      className={`w-full text-left border rounded-[16px] p-4 transition-all duration-200 ${dragOverFolderId === f._id ? 'border-[#3ecf8e]/30 bg-[#1f4b37]' : 'bg-[#2e2e2e] border-[#393939] hover:bg-[#242424] hover:border-[#4d4d4d]'}`}
                    >
                      <FolderIcon size={32} className="text-[#3ecf8e] mb-3" strokeWidth={1.5} />
                      <div className="font-medium text-[#fafafa] truncate mb-1">{f.name}</div>
                      <div className="text-[11px] text-[#b4b4b4]">{fmtDate(f.createdAt)}</div>
                    </button>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenameFolderTarget(f); setRenameFolderVal(f.name) }}
                        className="p-1.5 rounded bg-[#242424] border border-[#393939] text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e]"
                        title="Ganti nama folder"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f) }}
                        className="p-1.5 rounded bg-[#242424] border border-[#393939] text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e]"
                        title="Hapus folder"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Files */}
          {!loading && (filteredFiles.length > 0) && (
            <section>
              {filteredFiles.length > 0 && <h4 className="text-xs font-medium text-[#898989] uppercase tracking-[-0.007px] mb-4 px-1">Files</h4>}

              {/* Grid View */}
              {view === 'grid' && !loading && (
                <motion.div variants={containerAnimation} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredFiles.map(f => {
                    const isSelected = selectedIds.has(f._id)
                    const previewable = canPreview(f.mimeType)
                    return (
                      <motion.div
                        key={f._id} variants={itemAnimation}
                        draggable
                        onDragStart={(e) => {
                          if (!selectedIds.has(f._id)) setSelectedIds(new Set([f._id]))
                        }}
                        onClick={() => { if (selectMode) { toggleSelect(f._id) } else if (previewable) { setViewerFile(f) } }}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file: f, folder: null }) }}
                        className={`group relative border rounded-[16px] p-4 cursor-pointer transition-all duration-200 ${
                          isSelected ? 'bg-[#1f4b37] border-[#3ecf8e]/30' : 'bg-[#2e2e2e] border-[#393939] hover:bg-[#242424] hover:border-[#4d4d4d]'
                        }`}
                      >
                        {selectMode && (
                          <div className="absolute top-3 right-3" onClick={(e) => { e.stopPropagation(); toggleSelect(f._id) }}>
                            {isSelected ? <CheckSquare size={18} className="text-[#3ecf8e]" /> : <Square size={18} className="text-[#242424]" />}
                          </div>
                        )}
                        <div className="mb-4 mt-2 flex justify-center items-center h-16 relative">
                          <FileIcon mimeType={f.mimeType} size={40} />
                          {f.isStarred && <Star size={14} className="absolute bottom-0 right-1/4 text-amber-400 fill-amber-400" />}
                        </div>
                        <div className="font-medium text-sm text-[#fafafa] truncate mb-1" title={f.name}>{f.name}</div>
                        <div className="text-[11px] text-[#b4b4b4] truncate flex items-center justify-between">
                          <span>{fmt(f.size)}</span>
                          {f.isChunked && <span className="px-1.5 rounded bg-[#3ecf8e]/10 text-[#3ecf8e] text-[10px]">Chunked</span>}
                        </div>

                        {!selectMode && (
                          <div className="absolute top-2 right-2 grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#242424] p-1.5 rounded-[6px] border border-[#393939] z-10">
                            <button onClick={(e) => { e.stopPropagation(); toggleStar(f) }} className="p-1.5 rounded text-amber-400 hover:bg-[#2e2e2e] transition-colors flex items-center justify-center" title={f.isStarred ? 'Hapus bintang' : 'Bintangi'}>
                              {f.isStarred ? <StarOff size={14} /> : <Star size={14} />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setShareTarget(f) }} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e] transition-colors flex items-center justify-center" title="Bagikan">
                              <Share2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleMoveSingleFile(f) }} className="p-1.5 rounded text-indigo-400 hover:bg-[#2e2e2e] transition-colors flex items-center justify-center" title="Pindahkan">
                              <MoveRight size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); window.open(`/api/download?fileId=${f._id}`, '_blank') }} className="p-1.5 rounded text-emerald-400 hover:bg-[#2e2e2e] transition-colors flex items-center justify-center" title="Download">
                              <Download size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRenameTarget(f); setRenameVal(f.name) }} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e] transition-colors flex items-center justify-center" title="Ganti nama">
                              <Pencil size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(f) }} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#2e2e2e] transition-colors flex items-center justify-center" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              {/* List View */}
              {view === 'list' && (
                <div className="bg-[#2e2e2e] border border-[#393939] rounded-[16px] overflow-hidden">
                  <div className="flex items-center px-4 py-3 bg-[#242424] border-b border-[#393939] text-xs font-medium text-[#898989] uppercase tracking-[-0.007px]">
                    {selectMode && (
                      <div className="w-8 flex-shrink-0 cursor-pointer" onClick={toggleSelectAll}>
                        {selectedIds.size === filteredFiles.length && filteredFiles.length > 0 ? <CheckSquare size={16} className="text-[#3ecf8e]" /> : <Square size={16} />}
                      </div>
                    )}
                    <div className="flex-1">Nama</div>
                    <div className="w-24 hidden md:block text-right">Ukuran</div>
                    <div className="w-32 hidden md:block text-right pr-4">Tanggal</div>
                    <div className="w-36 text-right">Aksi</div>
                  </div>
                  <div className="divide-y divide-[#393939]">
                    {filteredFiles.map(f => {
                      const isSelected = selectedIds.has(f._id)
                      const previewable = canPreview(f.mimeType)
                      return (
                        <div
                          key={f._id}
                          className={`flex items-center px-4 py-3 hover:bg-[#242424] transition-colors cursor-pointer ${isSelected ? 'bg-[#1f4b37]' : ''}`}
                          onClick={() => { if (selectMode) { toggleSelect(f._id) } else if (previewable) { setViewerFile(f) } }}
                        >
                          {selectMode && (
                            <div className="w-8 flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleSelect(f._id) }}>
                              {isSelected ? <CheckSquare size={16} className="text-[#3ecf8e]" /> : <Square size={16} className="text-[#b4b4b4]" />}
                            </div>
                          )}
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <FileIcon mimeType={f.mimeType} size={20} />
                              {f.isStarred && <Star size={10} className="absolute -bottom-1 -right-1 text-amber-400 fill-amber-400" />}
                            </div>
                            <span className="truncate text-sm font-medium text-[#fafafa]">{f.name}</span>
                            {f.isChunked && <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#3ecf8e]/10 text-[#3ecf8e] text-[10px]">Chunked</span>}
                          </div>
                          <div className="w-24 hidden md:block text-right text-xs text-[#b4b4b4]">{fmt(f.size)}</div>
                          <div className="w-32 hidden md:block text-right pr-4 text-xs text-[#b4b4b4]">{fmtDate(f.createdAt)}</div>
                          <div className="w-36 text-right flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {!selectMode && (
                              <>
                                <button onClick={() => toggleStar(f)} className={`p-1.5 rounded transition-colors ${f.isStarred ? 'text-[#ffc800] hover:bg-[#242424]' : 'text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424]'}`} title={f.isStarred ? 'Hapus bintang' : 'Bintangi'}>
                                  {f.isStarred ? <StarOff size={16} /> : <Star size={16} />}
                                </button>
                                <button onClick={() => setShareTarget(f)} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] transition-colors" title="Bagikan">
                                  <Share2 size={16} />
                                </button>
                                <button onClick={() => handleMoveSingleFile(f)} className="p-1.5 rounded text-[#1cb0f6] hover:bg-[#242424] transition-colors" title="Pindahkan">
                                  <MoveRight size={16} />
                                </button>
                                {previewable && (
                                  <button onClick={() => setViewerFile(f)} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] transition-colors" title="Preview">
                                    <Eye size={16} />
                                  </button>
                                )}
                                <button onClick={() => window.open(`/api/download?fileId=${f._id}`, '_blank')} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] transition-colors" title="Download">
                                  <Download size={16} />
                                </button>
                                <button onClick={() => { setRenameTarget(f); setRenameVal(f.name) }} className="p-1.5 rounded text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] transition-colors" title="Ganti nama">
                                  <Pencil size={16} />
                                </button>
                                <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors" title="Hapus">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* FAB — pojok kanan bawah, tampil di semua ukuran layar */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAddMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="flex flex-col gap-2 z-50 items-end"
              >
                <button onClick={() => { setShowNewFolder(true); setShowAddMenu(false) }} className="flex items-center gap-3 bg-[#2e2e2e] border border-[#393939] rounded-[6px] pr-4 pl-3 py-2 text-sm text-[#fafafa] active:scale-95 transition-transform whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center shrink-0"><FolderPlus size={16} className="text-[#b4b4b4]" /></div>
                  Buat Folder Baru
                </button>
                <button onClick={() => { setShowUpload(true); setShowAddMenu(false) }} className="flex items-center gap-3 bg-[#2e2e2e] border border-[#393939] rounded-[6px] pr-4 pl-3 py-2 text-sm text-[#fafafa] active:scale-95 transition-transform whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center shrink-0"><Upload size={16} className="text-[#b4b4b4]" /></div>
                  Upload File
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Circle bar di atas tombol Plus saat ada upload aktif */}
        <UploadCircleIndicator
          onPlusClick={() => setShowAddMenu(m => !m)}
          plusActive={showAddMenu}
        />
      </div>

      {/* Modals */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload File" maxWidth={480}>
        <UploadDropZone folderId={currentFolder} onClose={() => setShowUpload(false)} workerUrls={workerUrls} />
      </Modal>

      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="Folder Baru">
        <form onSubmit={handleCreateFolder}>
          <label className="label">Nama Folder</label>
          <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="input mb-4" placeholder="Misal: Dokumen Penting" autoFocus />
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={() => setShowNewFolder(false)} className="btn btn-ghost px-5">Batal</button>
            <button type="submit" className="btn btn-primary px-5" disabled={!newFolderName.trim()}>Buat</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Ganti Nama File">
        <form onSubmit={handleRename}>
          <label className="label">Nama Baru</label>
          <input value={renameVal} onChange={e => setRenameVal(e.target.value)} className="input mb-4" autoFocus />
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={() => setRenameTarget(null)} className="btn btn-ghost px-5">Batal</button>
            <button type="submit" className="btn btn-primary px-5" disabled={!renameVal.trim()}>Simpan</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus File">
        <div className="flex items-start gap-4 mb-6 mt-2">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 shrink-0"><Trash2 size={24} /></div>
          <div>
            <p className="text-[#b4b4b4] font-medium mb-1">Hapus "{deleteTarget?.name}"?</p>
            <p className="text-sm text-[#898989]">Tindakan ini tidak bisa dibatalkan. File akan dihapus permanen dari server Telegram.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost px-5" disabled={deleteLoading}>Batal</button>
          <button onClick={handleDeleteFile} disabled={deleteLoading} className="btn bg-rose-500 hover:bg-rose-600 text-[#fafafa] px-5 border-none flex items-center gap-2">
            {deleteLoading ? <div className="w-4 h-4 border-2 border-[#fafafa]/30 border-t-[#fafafa] rounded-full animate-spin" /> : null}
            Hapus
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteFolderTarget} onClose={() => setDeleteFolderTarget(null)} title="Hapus Folder">
        <div className="flex items-start gap-4 mb-6 mt-2">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 shrink-0"><Trash2 size={24} /></div>
          <div>
            <p className="text-[#b4b4b4] font-medium mb-1">Hapus folder "{deleteFolderTarget?.name}"?</p>
            <p className="text-sm text-[#898989]">Folder beserta seluruh file di dalamnya akan dihapus permanen dari Telegram. Tindakan ini tidak dapat dibatalkan. Jika folder berisi subfolder, hapus subfolder terlebih dahulu.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteFolderTarget(null)} className="btn btn-ghost px-5">Batal</button>
          <button onClick={confirmDeleteFolder} className="btn bg-rose-500 hover:bg-rose-600 text-[#fafafa] px-5 border-none">Hapus Folder</button>
        </div>
      </Modal>

      <Modal open={!!renameFolderTarget} onClose={() => setRenameFolderTarget(null)} title="Ganti Nama Folder">
        <form onSubmit={handleRenameFolderSubmit}>
          <label className="label">Nama Baru Folder</label>
          <input
            value={renameFolderVal}
            onChange={e => setRenameFolderVal(e.target.value)}
            className="input mb-4"
            placeholder="Masukkan nama folder baru"
            autoFocus
          />
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={() => setRenameFolderTarget(null)} className="btn btn-ghost px-5">Batal</button>
            <button type="submit" className="btn btn-primary px-5" disabled={!renameFolderVal.trim()}>Simpan</button>
          </div>
        </form>
      </Modal>

      <Modal open={showMoveModal} onClose={() => { setShowMoveModal(false); setSelectedIds(new Set()) }} title="Pindahkan File">
        <div className="mb-4">
          <label className="label">Pilih Folder Tujuan</label>
          <select className="input w-full bg-[#242424] border-[#393939]" value={moveTargetFolderId || ''} onChange={(e) => setMoveTargetFolderId(e.target.value || null)}>
            <option value="">Root (My Drive)</option>
            {allFolders.map(f => (<option key={f._id} value={f._id}>{f.name}</option>))}
          </select>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setShowMoveModal(false)} className="btn btn-ghost px-5">Batal</button>
          <button onClick={handleMoveSelected} disabled={actionLoading} className="btn btn-primary px-5">Pindahkan</button>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal open={!!shareTarget} onClose={() => setShareTarget(null)} title="Bagikan File">
        {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
      </Modal>

      <AnimatePresence>
        {viewerFile && (
          <FileViewer file={viewerFile} files={filteredFiles} onClose={() => setViewerFile(null)} />
        )}
      </AnimatePresence>

      <AccountModal open={showAccount} onClose={() => setShowAccount(false)} />

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setContextMenu(null) }} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.1 }}
              style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
              className="fixed z-[70] w-48 py-1.5 bg-[#2e2e2e] border border-[#393939] rounded-[6px]"
            >
              {contextMenu.file && (
                <>
                  {activeNav !== 'Tempat Sampah' ? (
                    <>
                      <button onClick={() => { setViewerFile(contextMenu.file); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#b4b4b4] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Eye size={16}/> Buka</button>
                      <button onClick={() => { setShareTarget(contextMenu.file); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#b4b4b4] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Share2 size={16}/> Bagikan</button>
                      <button onClick={() => { const a = document.createElement('a'); a.href = `/api/download?fileId=${contextMenu.file?._id}`; a.target = '_blank'; a.click(); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#b4b4b4] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Download size={16}/> Download</button>
                      <button onClick={() => { setRenameTarget(contextMenu.file); setRenameVal(contextMenu.file?.name || ''); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#b4b4b4] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Pencil size={16}/> Ganti Nama</button>
                      <div className="h-px bg-[#393939] my-1" />
                    </>
                  ) : (
                    <button onClick={() => {
                      fetch('/api/files', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: contextMenu.file?._id, isDeleted: false }) }).then(() => { toast('File dipulihkan', 'success'); load(); setContextMenu(null) })
                    }} className="w-full px-4 py-2 text-left text-sm text-[#3ecf8e] hover:bg-[#1f4b37] hover:text-[#3ecf8e] flex items-center gap-2"><RefreshCw size={16}/> Pulihkan</button>
                  )}
                  <button onClick={() => { setDeleteTarget(contextMenu.file); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#898989] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Trash2 size={16}/> {activeNav === 'Tempat Sampah' ? 'Hapus Permanen' : 'Hapus'}</button>
                </>
              )}
              {contextMenu.folder && (
                <>
                  {activeNav !== 'Tempat Sampah' ? (
                    <>
                      <button onClick={() => { openFolder(contextMenu.folder!); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#b4b4b4] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><FolderIcon size={16}/> Buka Folder</button>
                      <button onClick={() => { setRenameFolderTarget(contextMenu.folder); setRenameFolderVal(contextMenu.folder?.name || ''); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#b4b4b4] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Pencil size={16}/> Ganti Nama</button>
                      <div className="h-px bg-[#393939] my-1" />
                    </>
                  ) : (
                    <button onClick={() => {
                      fetch('/api/folders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId: contextMenu.folder?._id, isDeleted: false }) }).then(() => { toast('Folder dipulihkan', 'success'); load(); setContextMenu(null) })
                    }} className="w-full px-4 py-2 text-left text-sm text-[#3ecf8e] hover:bg-[#1f4b37] hover:text-[#3ecf8e] flex items-center gap-2"><RefreshCw size={16}/> Pulihkan</button>
                  )}
                  <button onClick={() => { setDeleteFolderTarget(contextMenu.folder); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm text-[#898989] hover:bg-[#242424] hover:text-[#fafafa] flex items-center gap-2"><Trash2 size={16}/> {activeNav === 'Tempat Sampah' ? 'Hapus Permanen' : 'Hapus'}</button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Multi-select Action Bar */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 bg-[#2e2e2e] border border-[#393939] rounded-[9999px] p-2 flex items-center gap-1 overflow-x-auto w-[90%] md:w-auto flex-nowrap"
          >
            <div className="px-4 text-sm font-medium text-[#fafafa] flex items-center gap-2 border-r border-[#393939] shrink-0">
              <span className="w-5 h-5 rounded-[9999px] bg-[#006239] text-[#fafafa] border border-[#3ecf8e]/30 flex items-center justify-center text-xs font-medium">{selectedIds.size}</span>
            </div>
            {activeNav === 'Tempat Sampah' && (
              <button onClick={handleRestoreSelected} disabled={actionLoading} className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] rounded-[9999px] px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors shrink-0">
                <RefreshCw size={16} /> <span className="hidden sm:inline">Pulihkan</span>
              </button>
            )}
            <button onClick={handleDeleteSelected} disabled={actionLoading} className="text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] rounded-[9999px] px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors shrink-0">
              <Trash2 size={16} /> <span className="hidden sm:inline">{activeNav === 'Tempat Sampah' ? 'Hapus Permanen' : 'Hapus'}</span>
            </button>
            {activeNav !== 'Tempat Sampah' && (
              <>
                <button onClick={() => setShowMoveModal(true)} disabled={actionLoading} className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] rounded-[9999px] px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors shrink-0">
                  <MoveRight size={16} /> <span className="hidden sm:inline">Pindahkan</span>
                </button>
                <button onClick={handleStarSelected} disabled={actionLoading} className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] rounded-[9999px] px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors shrink-0">
                  <Star size={16} /> <span className="hidden sm:inline">Bintang</span>
                </button>
                <button onClick={handleDownloadSelected} disabled={actionLoading} className="text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424] rounded-[9999px] px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors shrink-0">
                  <Download size={16} /> <span className="hidden sm:inline">Download</span>
                </button>
              </>
            )}
            <div className="w-px h-6 bg-[#393939] mx-1 shrink-0" />
            <button onClick={exitSelectMode} className="p-2 rounded-[9999px] hover:bg-[#242424] text-[#898989] hover:text-[#fafafa] transition-colors shrink-0 mr-1">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Hapus Massal */}
      <Modal open={showBulkDeleteModal} onClose={() => setShowBulkDeleteModal(false)} title="Hapus File Terpilih">
        <p className="text-[#b4b4b4] mb-6">Apakah kamu yakin ingin menghapus {selectedIds.size} file yang dipilih? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowBulkDeleteModal(false)} className="px-4 py-2 text-[#b4b4b4] hover:text-[#fafafa] transition-colors" disabled={actionLoading}>Batal</button>
          <button onClick={performBulkDelete} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-[#fafafa] rounded-[6px] transition-colors font-medium" disabled={actionLoading}>
            {actionLoading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </Modal>
    </div>
    </UploadProvider>
  )
}

export default function DashboardWrapper() {
  return <DashboardPage />
}
