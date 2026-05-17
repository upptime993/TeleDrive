'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileItem {
  _id: string; name: string; size: number
  mimeType: string; folderId: string | null
  isChunked: boolean; createdAt: string
}

interface FileViewerProps {
  file: FileItem | null
  files: FileItem[]
  onClose: () => void
}

export function canPreview(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('xml')
  )
}

function getViewerType(mimeType: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unsupported' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('xml')) return 'text'
  return 'unsupported'
}

export function FileViewer({ file, files, onClose }: FileViewerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const [currentFile, setCurrentFile] = useState<FileItem | null>(file)

  useEffect(() => {
    setCurrentFile(file)
    setZoom(1); setRotation(0); setTextContent(null); setObjectUrl(null)
  }, [file])

  const previewableFiles = files.filter(f => canPreview(f.mimeType))
  const currentIdx = previewableFiles.findIndex(f => f._id === currentFile?._id)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < previewableFiles.length - 1

  const goNext = () => {
    if (hasNext) { setCurrentFile(previewableFiles[currentIdx + 1]); setZoom(1); setRotation(0); setTextContent(null) }
  }
  const goPrev = () => {
    if (hasPrev) { setCurrentFile(previewableFiles[currentIdx - 1]); setZoom(1); setRotation(0); setTextContent(null) }
  }

  useEffect(() => {
    if (!currentFile) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 4))
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.25))
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile, currentIdx])

  useEffect(() => {
    if (!currentFile) return
    const viewerType = getViewerType(currentFile.mimeType)
    let active = true
    if (viewerType === 'text') {
      setLoadingText(true)
      fetch(`/api/download?fileId=${currentFile._id}`)
        .then(r => r.text())
        .then(t => { if (active) { setTextContent(t); setLoadingText(false) } })
        .catch(() => { if (active) { setTextContent('Failed to load text content.'); setLoadingText(false) } })
    } else if (viewerType === 'image') {
      setLoadingText(true)
      fetch(`/api/download?fileId=${currentFile._id}`)
        .then(r => r.blob())
        .then(b => { if (active) { setObjectUrl(URL.createObjectURL(b)); setLoadingText(false) } })
        .catch(() => { if (active) setLoadingText(false) })
    }
    return () => { active = false }
  }, [currentFile])

  if (!currentFile) return null

  const viewerType = getViewerType(currentFile.mimeType)
  const downloadUrl = `/api/download?fileId=${currentFile._id}`
  const isImage = viewerType === 'image'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={overlayRef}
      onClick={(e: any) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' }}
      role="dialog"
      aria-modal="true"
    >
      {/* Toolbar */}
      <div
        className="h-14 shrink-0 flex items-center gap-3 px-4 md:px-6"
        style={{ background: '#2e2e2e', borderBottom: '1px solid #393939' }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="p-2 rounded-[6px] transition-colors"
            style={{ color: hasPrev ? '#898989' : '#393939', cursor: hasPrev ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (hasPrev) { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.background = '#242424' } }}
            onMouseLeave={e => { if (hasPrev) { (e.currentTarget as HTMLButtonElement).style.color = '#898989'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' } }}
            title="Previous (←)"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="p-2 rounded-[6px] transition-colors"
            style={{ color: hasNext ? '#898989' : '#393939', cursor: hasNext ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (hasNext) { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.background = '#242424' } }}
            onMouseLeave={e => { if (hasNext) { (e.currentTarget as HTMLButtonElement).style.color = '#898989'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' } }}
            title="Next (→)"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center px-3">
          <span
            className="truncate"
            style={{ color: '#fafafa', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.007px' }}
          >
            {currentFile.name}
          </span>
          {previewableFiles.length > 1 && (
            <span style={{ fontSize: '12px', color: '#3ecf8e', fontWeight: 400, letterSpacing: '-0.007px' }}>
              File {currentIdx + 1} of {previewableFiles.length}
            </span>
          )}
        </div>

        {isImage && (
          <div
            className="hidden md:flex items-center gap-1 mr-3 rounded-[6px] p-1"
            style={{ background: '#242424', border: '1px solid #393939' }}
          >
            <button
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))}
              className="p-1.5 rounded transition-colors"
              style={{ color: '#898989' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
              title="Zoom Out (-)"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono text-xs w-10 text-center select-none" style={{ color: '#b4b4b4' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
              className="p-1.5 rounded transition-colors"
              style={{ color: '#898989' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
              title="Zoom In (+)"
            >
              <ZoomIn size={14} />
            </button>
            <div className="w-px h-4 mx-1" style={{ background: '#393939' }} />
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded transition-colors"
              style={{ color: '#898989' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989' }}
              title="Rotate"
            >
              <RotateCw size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary hidden sm:flex items-center gap-2"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            <Download size={14} />
            <span>Download</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-[6px] transition-colors"
            style={{ color: '#898989' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.background = '#242424' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#898989'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFile._id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full h-full flex items-center justify-center"
          >
            {viewerType === 'image' && (
              loadingText ? (
                <div className="flex h-full items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#393939', borderTopColor: '#3ecf8e' }} />
                </div>
              ) : objectUrl ? (
                <img
                  src={objectUrl}
                  alt={currentFile.name}
                  className="max-w-full max-h-full object-contain rounded-[6px] transition-transform duration-200"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
                  onClick={() => setZoom(z => z > 1 ? 1 : 2)}
                  draggable={false}
                />
              ) : (
                <div style={{ color: '#898989' }}>Failed to load image</div>
              )
            )}

            {viewerType === 'video' && (
              <video
                src={downloadUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-[6px]"
                style={{ background: '#000000' }}
              />
            )}

            {viewerType === 'audio' && (
              <div
                className="w-full max-w-md p-8 rounded-[16px] flex flex-col items-center"
                style={{ background: '#2e2e2e', border: '1px solid #393939' }}
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-[spin_4s_linear_infinite]"
                  style={{ background: '#006239', border: '1px solid rgba(62,207,142,0.20)' }}
                >
                  <div className="w-8 h-8 rounded-full" style={{ background: '#121212' }} />
                </div>
                <h3 className="text-sm font-medium mb-8 text-center" style={{ color: '#fafafa', letterSpacing: '-0.007px' }}>{currentFile.name}</h3>
                <audio src={downloadUrl} controls autoPlay className="w-full" />
              </div>
            )}

            {viewerType === 'pdf' && (
              <iframe
                src={`${downloadUrl}#toolbar=1`}
                title={currentFile.name}
                className="w-full h-full max-w-5xl rounded-[6px]"
                style={{ background: '#121212' }}
              />
            )}

            {viewerType === 'text' && (
              <div
                className="w-full h-full max-w-4xl rounded-[16px] overflow-hidden flex flex-col"
                style={{ background: '#000000', border: '1px solid #393939' }}
              >
                <div
                  className="h-10 flex items-center px-4 shrink-0"
                  style={{ background: '#121212', borderBottom: '1px solid #393939' }}
                >
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="ml-4 text-xs font-mono" style={{ color: '#898989' }}>{currentFile.name}</span>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  {loadingText ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#393939', borderTopColor: '#3ecf8e' }} />
                    </div>
                  ) : (
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: '#b4b4b4' }}>
                      {textContent}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {viewerType === 'unsupported' && (
              <div
                className="flex flex-col items-center p-12 rounded-[16px] text-center max-w-md"
                style={{ background: '#2e2e2e', border: '1px solid #393939' }}
              >
                <div
                  className="w-20 h-20 rounded-[6px] flex items-center justify-center mb-6"
                  style={{ background: '#242424', border: '1px solid #393939' }}
                >
                  <FileQuestion size={32} style={{ color: '#898989' }} />
                </div>
                <h3 className="text-base font-medium mb-2" style={{ color: '#fafafa', letterSpacing: '-0.007px' }}>No Preview Available</h3>
                <p className="text-sm mb-8" style={{ color: '#898989', letterSpacing: '-0.007px' }}>{currentFile.mimeType}</p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Download to view
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
